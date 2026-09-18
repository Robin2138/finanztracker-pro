# Cloudflare Upload

Wichtig: `_worker.js` muss direkt im Stammverzeichnis des Uploads liegen.
Nicht in einem Unterordner.

1. Cloudflare Dashboard öffnen.
2. Workers & Pages → deinen FinanzTracker-Worker öffnen.
3. Neue Version / Deploy bzw. Upload verwenden.
4. Dieses ZIP hochladen.
5. Danach unter Settings → Variables and Secrets die Secrets hinzufügen.

Benötigte Secrets:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- SUPABASE_SECRET_KEY

Variablen:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- STRIPE_PRICE_PRO

Die beiden öffentlichen Supabase-Werte und die Stripe Price ID sind bereits in `config.js` bzw. als Fallback im Worker hinterlegt.
