/* Red Apple Distribution - site settings.
   endpoint: where quote requests, contact messages, newsletter sign-ups and reviews are sent (JSON POST).
   Leave empty while testing; submissions are then kept in the visitor's browser only (not delivered to anyone).
   showPrices: false hides prices everywhere and shows "Get a quote" instead. Set to true to show prices again. */
window.RA_CONFIG = {
  endpoint: 'https://formsubmit.co/ajax/sales@redappledistro.com',
  showPrices: false
};
