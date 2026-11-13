/* Red Apple Distribution - site settings.
   endpoint: where quote requests, contact messages, newsletter sign-ups and reviews are sent (JSON POST).
   Leave empty while testing; submissions are then kept in the visitor's browser only (not delivered to anyone).
   showPrices: false hides prices everywhere and shows "Get a quote" instead. Set to true to show prices again. */
window.RA_CONFIG = {
  endpoint: 'https://formsubmit.co/ajax/sales@redappledistro.com',
  showPrices: false
};

/* Web push (alerts for new drops, restocks, trending picks). Only used after a visitor allows notifications in Cookie settings
   AND taps "Enable alerts". Nothing is sent until a provider or backend is connected (see README_PUSH.txt).
   provider: 'none' | 'onesignal' | 'webpush' (label only)
   vapidPublicKey: public VAPID key (base64url). Empty = visitors are only recorded as "consented" on their device.
   subscribeEndpoint: URL that receives the push subscription JSON by POST. Empty = not sent anywhere. */
window.RA_PUSH = {
  provider: 'none',
  vapidPublicKey: '',
  subscribeEndpoint: ''
};
