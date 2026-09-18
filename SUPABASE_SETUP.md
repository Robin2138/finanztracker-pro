# Supabase-Einrichtung für FinanzTracker

## 1. Projekt erstellen
Supabase Dashboard öffnen und ein neues Projekt anlegen.

## 2. Datenbank komplett einrichten
Im Projekt: **SQL Editor** öffnen → **New query** → den kompletten Inhalt von `supabase_setup.sql` einfügen → **Run**.

Das erstellt:
- `user_data` für die persönlichen Finanzdaten
- `entitlements` für Free/PRO
- Row Level Security (RLS)
- Policies, damit Nutzer nur ihre eigenen Finanzdaten sehen und ändern können

## 3. E-Mail-Login aktivieren
Unter **Authentication → Sign In / Providers** den E-Mail-Provider verwenden.
E-Mail/Passwort-Authentifizierung ist bei gehosteten Supabase-Projekten standardmäßig verfügbar. Für ein echtes Produkt ist die E-Mail-Bestätigung sinnvoll.

## 4. URL nach dem ersten Cloudflare-Deploy setzen
Unter **Authentication → URL Configuration**:
- Site URL = deine echte Website-Adresse, z. B. `https://deinname.pages.dev`
- Redirect URL = ebenfalls deine echte Website-Adresse

Damit funktionieren Bestätigungs-E-Mails und Redirects korrekt.

## 5. API-Schlüssel
Unter **Settings → API Keys** bzw. über den Connect-Dialog:
- Browser: **Publishable key** → in `config.js` als `SUPABASE_PUBLISHABLE_KEY`
- Server/Cloudflare Worker: **Secret key** → nur als Cloudflare Secret `SUPABASE_SECRET_KEY`

Die Publishable-Key darf im Browser stehen, wenn RLS korrekt aktiviert ist. Der Secret-Key darf niemals in `index.html`, `config.js` oder andere öffentliche Dateien gelangen.

## 6. `config.js`
Beispiel:
```js
window.FT_CONFIG = {
  SUPABASE_URL: "https://DEIN-PROJEKT.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_...",
  APP_NAME: "FinanzTracker",
  PRO_PRICE_LABEL: "3,99 € / Monat"
};
```

## 7. Danach Cloudflare
Die Website veröffentlichen. Erst danach die endgültige `Site URL` in Supabase eintragen.
