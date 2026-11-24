// Supabase Edge Function: send-lead
// Receives quote / contact / subscribe / review submissions from redappledistribution.com and emails them
// to sales@redappledistro.com through Resend. Secret needed: RESEND_API_KEY (Edge Functions > Secrets).
// Deploy with "Verify JWT" OFF (the website calls it without a user session).
const TO = 'sales@redappledistro.com';
const FROM = 'Red Apple Website <quotes@mail.redappledistribution.com>';
const ORIGINS = ['https://redappledistribution.com', 'https://www.redappledistribution.com'];
const TYPES = ['quote', 'contact', 'subscribe', 'review'];
const hits = new Map<string, number[]>();

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const cors = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});
const json = (o: unknown, status: number, origin: string) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

function val(v: unknown): string {
  if (v == null || v === '') return '-';
  if (typeof v === 'object') return JSON.stringify(v, null, 1);
  return String(v);
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const okOrigin = ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  const allow = okOrigin ? origin : ORIGINS[0];
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(allow) });
  if (req.method !== 'POST' || !okOrigin) return json({ success: false, error: 'not allowed' }, 403, allow);

  // light per-IP limit (per function instance): 8 sends per 10 minutes
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600000);
  if (recent.length >= 8) return json({ success: false, error: 'too many requests' }, 429, allow);
  recent.push(now);
  hits.set(ip, recent);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 60000) return json({ success: false, error: 'too large' }, 413, allow);
    body = JSON.parse(raw);
  } catch {
    return json({ success: false, error: 'bad json' }, 400, allow);
  }
  if (body._honey) return json({ success: true }, 200, allow); // bots: pretend it worked
  const type = String(body.type || '');
  if (!TYPES.includes(type)) return json({ success: false, error: 'bad type' }, 400, allow);

  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json({ success: false, error: 'not configured' }, 500, allow);

  const subject = String(body._subject || 'New website lead - Red Apple Distribution').slice(0, 150);
  const skip = new Set(['_subject', '_template', '_captcha', '_honey', 'items']);
  const rows = Object.keys(body)
    .filter((k) => !skip.has(k))
    .map((k) => '<tr><td style="padding:6px 12px;border:1px solid #e5d9c8;background:#faf3e8;font-weight:600;vertical-align:top;white-space:nowrap">' + esc(k.replace(/_/g, ' ')) + '</td><td style="padding:6px 12px;border:1px solid #e5d9c8;white-space:pre-wrap">' + esc(val(body[k])) + '</td></tr>')
    .join('');
  const html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#2b0a0d"><h2 style="margin:0 0 12px">' + esc(subject) + '</h2><table style="border-collapse:collapse">' + rows + '</table></div>';
  const text = Object.keys(body).filter((k) => !skip.has(k)).map((k) => k + ': ' + val(body[k])).join('\n');

  const email = String(body.email || '').trim();
  const payload: Record<string, unknown> = { from: FROM, to: [TO], subject, html, text };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) payload.reply_to = email;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) return json({ success: false, error: 'send failed' }, 502, allow);
  return json({ success: true }, 200, allow);
});
