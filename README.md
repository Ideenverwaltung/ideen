# 💡 Ideen-Cockpit

Dein zentrales Tool, um den Überblick über alle Startup-Ideen zu behalten:

- **Projekte & Ideen** mit Status (Idee → In Planung → In Arbeit → Abgeschlossen), Priorität, Fortschritt, Tags
- **To-dos** pro Projekt
- **„Wo ich gerade stehe"** + **Verlaufs-Journal** (halte deinen Fortschritt fest)
- **Login-Tresor** für GitHub, Supabase, Cloudflare, IONOS & Co. — **Ende-zu-Ende verschlüsselt** mit deinem Master-Passwort (Zero-Knowledge)
- **Kalender** für Termine & Deadlines

Tech: Next.js 16 · React 19 · Tailwind v4 · Supabase (Postgres + Auth).

---

## 🚀 Einrichtung (einmalig)

### 1. Neues Supabase-Projekt anlegen

1. Auf [supabase.com](https://supabase.com) mit deinem **neuen Account** einloggen.
2. **New Project** → Name z.B. `organisation-ideen`, Region **Frankfurt (eu-central-1)**, Datenbank-Passwort vergeben.
3. Warten, bis das Projekt bereit ist (1–2 Min).

### 2. Datenbank-Schema einspielen

1. Im Supabase-Dashboard links auf **SQL Editor** → **New query**.
2. Den kompletten Inhalt von [`supabase/schema.sql`](./supabase/schema.sql) einfügen und **Run** drücken.
   → Erstellt alle Tabellen + Sicherheits-Regeln (Row Level Security).

### 3. API-Schlüssel eintragen

1. Dashboard → **Project Settings → API**.
2. Kopiere **Project URL** und den **anon / public** Key.
3. Trage beides in die Datei `.env.local` ein:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_ANON_KEY
   ```

### 4. (Optional) E-Mail-Bestätigung ausschalten

Damit du dich direkt nach der Registrierung einloggen kannst:
Dashboard → **Authentication → Sign In / Providers → Email** → „Confirm email" **deaktivieren**.
(Bei nur einem Nutzer völlig ok.)

### 5. Starten

```bash
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen → **Konto erstellen** → **Master-Passwort** für den Tresor festlegen.

---

## ☁️ Online stellen (Cloudflare Workers)

Die App ist via **OpenNext-Adapter** für Cloudflare Workers vorbereitet
(`wrangler.jsonc`, `open-next.config.ts`). Code liegt auf GitHub:
**https://github.com/Julcons/ideen-cockpit** (privat).

> ⚠️ Die beiden `NEXT_PUBLIC_*`-Werte werden **beim Build** in die App eingebaut.
> Sie müssen also zum Build-Zeitpunkt vorhanden sein.

### Variante A – schnell per CLI (vom eigenen Rechner)

```bash
npx wrangler login          # einmalig: Cloudflare-Konto verbinden
npm run deploy              # baut + deployt (liest .env.local fürs Build)
```

Danach bekommst du eine URL wie `https://ideen-cockpit.<dein-name>.workers.dev`.

### Variante B – automatisch bei jedem Push (empfohlen)

1. Cloudflare-Dashboard → **Workers & Pages → Create → Workers → Connect to Git**.
2. Repo `Julcons/ideen-cockpit` auswählen.
3. **Build command:** `npx opennextjs-cloudflare build`
   **Deploy command:** `npx wrangler deploy`
4. Unter **Variables and Secrets** (für den Build) eintragen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Speichern → Cloudflare baut & deployt automatisch bei jedem `git push`.

### Lokal wie in Produktion testen (Workers-Runtime)

```bash
npm run preview            # baut + startet die App in der echten workerd-Runtime
```

---

## 🔒 Sicherheit

- Logins/Passwörter werden **im Browser** mit deinem Master-Passwort verschlüsselt (AES-GCM, PBKDF2).
  In der Datenbank liegt nur unlesbarer Chiffretext.
- Das Master-Passwort wird **nirgends gespeichert** und **nicht übertragen**.
  ⚠️ Vergisst du es, sind die gespeicherten Logins nicht mehr lesbar.
- Jeder Account sieht durch Row Level Security ausschließlich seine eigenen Daten.
