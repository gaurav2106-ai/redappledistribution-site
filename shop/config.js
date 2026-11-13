/* Red Apple Distribution - site settings.
   endpoint: where quote requests, contact messages, newsletter sign-ups and reviews are sent (JSON POST).
   Leave empty while testing; submissions are then kept in the visitor's browser only (not delivered to anyone).
   showPrices: false hides prices everywhere and shows "Get a quote" instead. Set to true to show prices again. */
window.RA_CONFIG = {
  endpoint: 'https://formsubmit.co/ajax/sales@redappledistro.com',
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
