# RoadCRM 🚗

Mini CRM de terrain pour commerciaux. Synchronise tes rendez-vous Google Calendar, lance la navigation en un clic, dicte tes notes vocales, programme tes rappels.

## Setup rapide

### 1. Clone et installe

```bash
git clone https://github.com/Samuelbcl/roadcrm.git
cd roadcrm
npm install
```

### 2. Configure tes clés

Copie le fichier d'exemple et ajoute tes clés Google :

```bash
cp .env.local.example .env.local
```

Puis ouvre `.env.local` et remplace :

```
GOOGLE_CLIENT_ID=ton-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ton-client-secret
NEXTAUTH_SECRET=tape-nimporte-quoi-de-long-ici-genre-30-caracteres
NEXTAUTH_URL=http://localhost:3000
```

> Pour générer un secret random : `openssl rand -base64 32`

### 3. Lance en local

```bash
npm run dev
```

Ouvre http://localhost:3000 — connecte-toi avec ton Google.

### 4. Déploie sur Vercel

```bash
git add .
git commit -m "RoadCRM v1"
git push
```

Sur Vercel :
1. Importe le repo
2. Ajoute les **Environment Variables** :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → `https://ton-domaine.vercel.app`
3. Deploy !

⚠️ N'oublie pas d'ajouter l'URL de redirect Vercel dans Google Cloud Console :
`https://ton-domaine.vercel.app/api/auth/callback/google`

### 5. Installe sur iPhone (PWA)

1. Ouvre ton URL Vercel dans Safari
2. Appuie sur le bouton partage ↑
3. "Sur l'écran d'accueil"
4. C'est une app ! 🎉

## Fonctionnalités

- ✅ Sync Google Calendar automatique
- ✅ Navigation en 1 clic (Apple Maps / Google Maps)
- ✅ Notes vocales (dictée en français)
- ✅ Rappels programmables avec notifications
- ✅ Ajout de RDV manuels
- ✅ PWA installable sur iPhone
- ✅ Interface sobre et pro

## Stack

- Next.js 14 (App Router)
- NextAuth.js (Google OAuth)
- Tailwind CSS
- Google Calendar API
- Web Speech API
- Web Notifications API
