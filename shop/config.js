/* Red Apple Distribution - site settings.
   endpoint: where quote requests, contact messages, newsletter sign-ups and reviews are sent (JSON POST).
   Leave empty while testing; submissions are then kept in the visitor's browser only (not delivered to anyone).
   showPrices: false hides prices everywhere and shows "Get a quote" instead. Set to true to show prices again. */
window.RA_CONFIG = {
  endpoint: 'https://qdqioorsppkinjjyvata.supabase.co/functions/v1/send-lead', /* Supabase function that emails sales@ through Resend */
  backupEndpoint: '', /* Formspree form URL, https://formspree.io/f/<id>. Used automatically if the main endpoint fails. */
  showPrices: false
};

/* Web push (alerts for new drops, restocks, trending picks) through OneSignal. Used only after a visitor allows notifications in
   Cookie settings AND taps "Enable alerts". While oneSignalAppId is empty no OneSignal code is loaded and no request is made.
   To go live: paste the OneSignal App ID below (see ONESIGNAL_SETUP.md), then rebuild and publish.
   provider: 'onesignal' | 'none' | 'webpush'
   oneSignalAppId: App ID from the OneSignal dashboard (a public identifier, safe to keep here). Empty = off.
   safariWebId: optional, only for the Safari web ID of a OneSignal Safari setup. Empty is fine.
   vapidPublicKey, subscribeEndpoint: legacy own-server option, unused with OneSignal. */
window.RA_PUSH = {
  provider: 'onesignal',
  oneSignalAppId: '61ae92b7-e3c5-4419-bcef-ac2f67f2253a',
  safariWebId: '',
  vapidPublicKey: '',
  subscribeEndpoint: ''
};

/* RA_AUTH:BEGIN - written by build_shop.sh from supabase_config.json. Public Project URL and anon key only (safe in the browser).
   Empty values = accounts show "Accounts are opening soon". Never put a service role or secret key here. */
window.RA_AUTH = {"url": "https://qdqioorsppkinjjyvata.supabase.co", "anonKey": "sb_publishable_svIENxJyhqBIK7BTUKHb7A_La3sxoAj"};
/* RA_AUTH:END */
