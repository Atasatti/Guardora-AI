---
title: Guardora API
emoji: 🛡️
colorFrom: blue
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# Guardora backend

Express and Socket.IO API for the Guardora web administration dashboard.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Configure MongoDB, JWT, CORS, mail, AI moderation, and deferred payment values
through `.env`. Never commit that file.

`AUTH_BYPASS=true` supplies a local administrator identity while login is
temporarily disabled. It must remain `false` outside local development.

## Administrators and Google sign-in

`SUPER_ADMIN_EMAIL` names the owner. That account is always an active
administrator, cannot be changed or removed from inside the app, and is the
only one that can add or remove other administrators (Settings → Admins).
Those administrators are users with role `ADMIN` in MongoDB.

Administrators sign in with Google; residents and moderators keep using a
password. To enable it, create an OAuth client ID of type *Web application* in
Google Cloud Console (APIs & Services → Credentials) and add every frontend
origin, such as `http://localhost:3000` and the Vercel domain, under
*Authorized JavaScript origins*. Set that ID as `GOOGLE_CLIENT_ID` here and as
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the frontend. No client secret is needed.

The server mounts only the web/admin route set. Resident/mobile-only modules
are stored in `../mobile_deferred`.
