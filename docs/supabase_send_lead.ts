// Supabase Edge Function: send-lead
// Emails website submissions to sales@redappledistro.com through Resend. Secret: RESEND_API_KEY. Verify JWT: OFF.
// Protection: only redappledistribution.com origin, fixed recipient and subject, required fields, field caps,
// database rate limit per visitor and overall (table public.lead_hits), spam-trap field.
// Guest quote requests are also saved to public.guest_quotes (run docs/supabase_guest_quotes.sql once).
const TO = 'sales@redappledistro.com';
const FROM = 'Red Apple Website <quotes@mail.redappledistribution.com>';
const ORIGINS = ['https://redappledistribution.com', 'https://www.redappledistribution.com'];
const SUBJECTS: Record<string, string> = {
  quote: 'New QUOTE request - Red Apple Distribution',
  contact: 'New contact message - Red Apple Distribution',
  subscribe: 'New newsletter sign-up - Red Apple Distribution',
  review: 'New customer REVIEW (to approve) - Red Apple Distribution',
  account: 'New retailer account - Red Apple Distribution',
};
const PER_VISITOR = 5;   // sends per visitor per 10 minutes
const OVERALL = 40;      // sends overall per hour (protects the inbox and the Resend plan)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const s = typeof v === 'object' ? JSON.stringify(v, null, 1) : String(v);
  return s.slice(0, 4000);
}

async function db(path: string, init: RequestInit = {}) {
  const base = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const okOrigin = ORIGINS.includes(origin);
  const allow = okOrigin ? origin : ORIGINS[0];
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(allow) });
  if (req.method !== 'POST' || !okOrigin) return json({ success: false, error: 'not allowed' }, 403, allow);

  // rate limit, stored in the database so it holds across function instances
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 64);
  try {
    const tenMin = new Date(Date.now() - 600000).toISOString();
    const hour = new Date(Date.now() - 3600000).toISOString();
    const [a, b] = await Promise.all([
      db('lead_hits?select=id&ip=eq.' + encodeURIComponent(ip) + '&at=gte.' + tenMin + '&limit=50').then((r) => r.json()),
      db('lead_hits?select=id&at=gte.' + hour + '&limit=200').then((r) => r.json()),
    ]);
    if (!Array.isArray(a) || !Array.isArray(b)) return json({ success: false, error: 'unavailable' }, 503, allow);
    if (a.length >= PER_VISITOR || b.length >= OVERALL) return json({ success: false, error: 'too many requests' }, 429, allow);
    await db('lead_hits', { method: 'POST', body: JSON.stringify({ ip }), headers: { Prefer: 'return=minimal' } });
    if (Math.random() < 0.05) await db('lead_hits?at=lt.' + new Date(Date.now() - 86400000).toISOString(), { method: 'DELETE' });
  } catch {
    return json({ success: false, error: 'unavailable' }, 503, allow);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 60000) return json({ success: false, error: 'too large' }, 413, allow);
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length > 60) throw new Error('shape');
  } catch {
    return json({ success: false, error: 'bad request' }, 400, allow);
  }
  if (body._honey) return json({ success: true }, 200, allow); // bots: pretend it worked
  const type = String(body.type || '');
  if (!SUBJECTS[type]) return json({ success: false, error: 'bad type' }, 400, allow);

  const email = String(body.email || '').trim();
  if ((type === 'quote' || type === 'contact' || type === 'account') && !EMAIL_RE.test(email)) return json({ success: false, error: 'email required' }, 400, allow);
  if (type === 'subscribe' && !String(body.contact || '').trim()) return json({ success: false, error: 'contact required' }, 400, allow);
  if (type === 'quote' && (!String(body.business || '').trim() || !String(body.name || '').trim())) {
    return json({ success: false, error: 'business and name required' }, 400, allow);
  }

  // keep a copy of guest quote requests (visitors who are not signed in) so staff can see them in Admin > Quotes
  if (type === 'quote' && !body.account) {
    try {
      const copy: Record<string, unknown> = {};
      for (const k of Object.keys(body)) if (!k.startsWith('_')) copy[k] = body[k];
      const boxes = Number(body.total_boxes);
      await db('guest_quotes', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ ref: String(body.ref || '').slice(0, 40), total_boxes: Number.isFinite(boxes) ? boxes : 0, payload: copy }),
      });
    } catch { /* never block the email */ }
  }

  const key = (Deno.env.get('RESEND_API_KEY') || Deno.env.get('ESEND_API_KEY'));
  if (!key) return json({ success: false, error: 'not configured' }, 500, allow);

  let subject = SUBJECTS[type];
  if (type === 'account') {
    const shop = String(body.shop || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 80);
    if (shop) subject = 'New retailer account: ' + shop;
  }
  const skip = new Set(['_subject', '_template', '_captcha', '_honey', 'items']);
  const keys = Object.keys(body).filter((k) => !skip.has(k));
  const rows = keys
    .map((k) => '<tr><td style="padding:6px 12px;border:1px solid #e5d9c8;background:#faf3e8;font-weight:600;vertical-align:top;white-space:nowrap">' + esc(k.slice(0, 60).replace(/_/g, ' ')) + '</td><td style="padding:6px 12px;border:1px solid #e5d9c8;white-space:pre-wrap">' + esc(val(body[k])) + '</td></tr>')
    .join('');
  const html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#2b0a0d"><h2 style="margin:0 0 12px">' + esc(subject) + '</h2><table style="border-collapse:collapse">' + rows + '</table></div>';
  const text = keys.map((k) => k.slice(0, 60) + ': ' + val(body[k])).join('\n');

  const payload: Record<string, unknown> = { from: FROM, to: [TO], subject, html, text };
  if (EMAIL_RE.test(email)) payload.reply_to = email;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) return json({ success: false, error: 'send failed' }, 502, allow);
  return json({ success: true }, 200, allow);
});
