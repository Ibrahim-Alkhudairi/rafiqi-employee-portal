# Rafiqi employee portal

A small web portal, for phone and desktop, in Arabic (`/ar`, right to left) and English (`/en`).

- **Employees** fill in their name and email and pick their company from a dropdown, which starts on the first company in the list. A short note under the fields says how the details are used; there is no consent tick-box.
  - There is no sign-up button: the details save on their own once every field is valid.
  - After that first save, the App Store and Google Play links appear.
  - Later edits save automatically too. If someone corrects their email, their existing row moves to the new email instead of a second row being added. A signed token from the first save proves it's the same browser.
- **Rafiqi admins** follow who has gone on to register in the app in the **backoffice**, on the "متابعة تسجيل الموظفين" page. The portal itself has no admin pages.

## How it works
- **Where data is stored:** sign-ups go into `dbo.EmployeeTrackings` in the Rafiqi SQL Server database. The table is created by the backend migration `AddEmployeeTrackings`. Each email is one row; a repeat sign-up updates it.
- **How matching works:** the backend sets `IsRegisteredInApp` (and it stays on) once `AspNetUsers.NormalizedEmail` has the same email. It checks every 15 minutes (Hangfire job `employee-tracking-sync`) and every time the backoffice page opens.
- **Database access:** the portal connects with a limited SQL login. `db/002_portal_login.sql` grants it read/write on `EmployeeTrackings` only.

## Companies and invite links
- **Adding a company:** the dropdown is the list in `src/lib/companies.ts`, currently only Zain (زين). Add a line there to add a company.
- **Invite links:** each company has one, built from its `slug`:
  - `/join/zain` (Arabic) or `/en/join/zain` opens the form with the company already chosen, and the heading names it.
  - Switching language keeps the invite.
  - An unknown company in the link is a 404.
- **Language:** the English name is what's stored, so sign-ups from the Arabic and English pages count as one company.

## Settings
Set these as environment variables on the host, or in `.env.local` for local runs. Never commit real values.

| Setting | What it is |
|---|---|
| `SESSION_SECRET` | Signs the edit token that lets a browser correct its own sign-up. At least 32 random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `RAFIQI_DB_URL` | The Rafiqi SQL Server: the same server and database as the backend's connection string, but with `User Id=rafiqi_portal` and the password that `db/002_portal_login.sql` shows when it runs. Empty means demo mode. |
| `SITE_URL` | The portal's public address, used in page metadata. Locally `http://localhost:3200`. |
| `SAVE_RATE_LIMIT` | Auto-saves allowed per IP address per 10 minutes. Default 120, because colleagues in one office usually share an IP. |

## Run locally
```bash
npm install
npm run dev     # http://localhost:3200, after creating .env.local with at least SESSION_SECRET
```
**Demo mode:** with `RAFIQI_DB_URL` empty, sign-ups are kept in memory and lost when the server restarts.

**Against the Rafiqi database:** set `RAFIQI_DB_URL` (the `rafiqi_portal` login).

## Checks
```bash
npm run typecheck
npm run build
```

## Deploying
The portal runs on Azure App Service (Linux, Node 22 LTS). Nothing runs in the background, so it doesn't need Always On.

- **GitHub Actions:** `.github/workflows/build.yml` only checks that the portal builds, on every push to `main` and every pull request. It does not deploy.
- **Web app settings:**
  - Startup command: `node server.js`
  - App settings: the ones under Settings, plus `HOSTNAME=0.0.0.0` (listen on every address) and `SCM_DO_BUILD_DURING_DEPLOYMENT=false` (the zip is already built).
  - The server listens on the `PORT` App Service sets.
- **Domain:** `join.rafiqi.sa`, a `CNAME` to the web app plus an `asuid.join` `TXT` record in the Bluehost DNS, with an App Service Managed Certificate.
- **Database firewall:** must allow the web app.
- **Order of steps:**
  1. Deploy the backend with the migration.
  2. Run `db/002_portal_login.sql`.
  3. Deploy the portal.

To try the production build locally: `npm run build`, copy `public` to `.next/standalone/public` and `.next/static` to `.next/standalone/.next/static`, then `node .next/standalone/server.js`.
