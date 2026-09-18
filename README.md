# FinanzTracker – komplette Web-Version

## Enthalten
- moderne Landingpage + echte Browser-App
- kostenloser Finanztracker mit localStorage
- Sparplan, Sparziel, Schulden, Budget, Kontostände, Diagramm
- Konto-/Login-Oberfläche mit Demo-Modus
- Supabase-Integration vorbereitet
- PRO-Seite vorbereitet
- Stripe Checkout serverseitig vorbereitet
- PWA/Offline-Grundgerüst
- Ratgeber und Rechner
- AdSense-Platzhalter (`ads.txt`)
- Cloudflare Pages Functions

## Kostenlos lokal testen
`index.html` einfach öffnen oder über einen lokalen HTTP-Server starten.

## Cloud-Login aktivieren
1. Supabase-Projekt erstellen.
2. `supabase_schema.sql` ausführen.
3. In `config.js` die öffentliche `SUPABASE_URL` und den Publishable/Anon-Key eintragen.
4. E-Mail-Auth in Supabase aktivieren.

Supabase Auth unterstützt E-Mail/Passwort-Login und Sessions. Der Service-Role-Key darf niemals im Browser liegen.

## PRO / Stripe aktivieren
1. Stripe-Konto erstellen.
2. Ein Produkt „FinanzTracker PRO“ und einen wiederkehrenden Preis anlegen.
3. Cloudflare Pages → Settings → Variables and Secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_PRO`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SECRET_KEY`
4. Webhook auf `/api/stripe-webhook` anlegen.
5. Die Webhook-Signaturprüfung in `functions/api/stripe-webhook.js` vor Live-Betrieb vervollständigen.

## Werbung
Erst nach Freigabe durch Google AdSense die echte Publisher-Zeile in `ads.txt` eintragen und den AdSense-Code einfügen.

## Rechtliches
Vor Veröffentlichung für echte Nutzer anpassen:
- Impressum
- Datenschutzerklärung
- Cookie-/Einwilligungsmechanismus für nicht notwendiges Tracking bzw. personalisierte Werbung
- AGB/Widerruf/Billing-Informationen, sofern erforderlich
- keine Anlage-/Finanzberatung versprechen

## Deployment auf Cloudflare
Für das einfache Dashboard-Upload-Paket ist `_worker.js` enthalten. Cloudflare kann bei Direct Uploads einen `_worker.js`-Advanced-Mode-Einstieg verarbeiten; der Worker liefert die statischen Dateien und die `/api/*`-Endpunkte.

1. Cloudflare → Workers & Pages → neues Projekt → Direct Upload.
2. Lade den Inhalt dieses Ordners bzw. die ZIP hoch.
3. Nach dem ersten Deploy unter Settings → Variables and Secrets die geheimen Werte setzen.
4. Für echte PRO-Zahlungen zusätzlich den Stripe-Webhook auf `/api/stripe-webhook` konfigurieren.

Alternativ kann das Projekt per GitHub/GitLab + Wrangler automatisiert deployt werden.

