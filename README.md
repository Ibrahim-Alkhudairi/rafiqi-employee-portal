# Rafiqi employee portal

A small web portal, for phone and desktop, in Arabic (`/ar/`, right to left) and English (`/en/`), at `https://join.rafiqi.sa`.

- **Employees** fill in their name and email and pick their company from a dropdown, which starts on the first company in the list. There is no consent tick-box and no privacy link.
  - A three-step roadmap above the form (Register, Verify, Download) follows their progress.
  - Each field shows its green check inside the field once it is filled in correctly. What counts as a company email is in the (i) tooltip beside the email label.
  - There is no sign-up button: the details save on their own once every field is valid.
  - After that first save, a popup opens with the App Store and Google Play links (a sheet from the bottom on phones). If they are still typing, it waits for a pause. Once closed, the "Download Rafiqi" button brings it back.
  - Later edits save automatically too. If someone corrects their email, their existing row moves to the new email instead of a second row being added. A signed token from the first save proves it's the same browser.
- **Rafiqi admins** follow who has gone on to register in the app in the **backoffice**, on the "متابعة تسجيل الموظفين" page. The portal itself has no admin pages.

## How it works
- **Static files:** the portal is built as plain HTML/JS (`output: "export"`) and served by Bluehost. It has no server and no database access.
- **Saving:** the form sends each save to the Rafiqi backend, `POST https://api.rafiqiapplication.com/api/portal/employee-signup` (`EmployeeSignupPortalController`). The backend checks everything again (company email only, a listed company, the hidden anti-bot field, 120 saves per IP per 10 minutes, the edit token) and stores the row in `dbo.EmployeeTrackings`. Each email is one row; a repeat sign-up updates it.
- **Matching:** the backend sets `IsRegisteredInApp` (and it stays on) once `AspNetUsers.NormalizedEmail` has the same email. It checks every 15 minutes (Hangfire job `employee-tracking-sync`) and every time the backoffice page opens.

## Companies and invite links
- **Adding a company:** add it to `src/lib/companies.ts` here **and** to `Companies` in the backend's `EmployeeSignupService`, which refuses companies it doesn't know. Currently only Zain (زين).
- **Invite links:** each company has one, built from its `slug`:
  - `/join/zain` (Arabic) or `/en/join/zain/` opens the form with the company already chosen, and the heading names it.
  - Switching language keeps the invite.
  - An unknown company in the link is a 404.
- **Language:** the English name is what's stored, so sign-ups from the Arabic and English pages count as one company.

## Settings
Both are read at build time and end up in the pages; neither is a secret. The workflow sets them for production; locally they go in `.env.local`.

| Setting | What it is |
|---|---|
| `NEXT_PUBLIC_API_URL` | The Rafiqi backend, `https://api.rafiqiapplication.com`. Empty means demo mode: the form pretends to save. |
| `SITE_URL` | The portal's public address, used in page metadata: `https://join.rafiqi.sa`, locally `http://localhost:3200`. |

## Run locally
```bash
npm install
npm run dev     # http://localhost:3200
```
With `NEXT_PUBLIC_API_URL` empty, nothing is sent anywhere. To save for real, set it to the backend.

## Checks
```bash
npm run typecheck
npm run build   # writes the site to out/
```

## Deploying
- **GitHub Actions:** `.github/workflows/deploy.yml` builds on every push to `main` and every pull request. On `main` it uploads `out/` to Bluehost over FTPS ([FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action), which only sends what changed).
- **GitHub secrets:** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, for an FTP account limited to the subdomain's folder. Until they are set, the upload is skipped with a warning.
- **Bluehost:** `join.rafiqi.sa` is a subdomain in cPanel with its own folder and the free SSL certificate. `public/.htaccess` (copied into `out/`) forces HTTPS, sends `/` to `/ar/` and `/join/<company>` to `/ar/join/<company>/`, sets the security headers and serves `404.html`.
- **Order of steps:** deploy the backend with the signup endpoint first, then the portal.
