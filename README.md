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

## ☁️ Online stellen (Vercel)

1. Projekt zu einem Git-Repo machen und zu GitHub pushen.
2. Auf [vercel.com](https://vercel.com) → **Add New Project** → Repo auswählen.
3. Bei **Environment Variables** dieselben zwei Werte aus `.env.local` eintragen.
4. **Deploy** — fertig, von überall erreichbar.

---

## 🔒 Sicherheit

- Logins/Passwörter werden **im Browser** mit deinem Master-Passwort verschlüsselt (AES-GCM, PBKDF2).
  In der Datenbank liegt nur unlesbarer Chiffretext.
- Das Master-Passwort wird **nirgends gespeichert** und **nicht übertragen**.
  ⚠️ Vergisst du es, sind die gespeicherten Logins nicht mehr lesbar.
- Jeder Account sieht durch Row Level Security ausschließlich seine eigenen Daten.
