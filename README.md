# Branlympics 🏆

Bachelor-party games website. Sign up with Google / Microsoft / email,
browse games, one-click join, team up with other players, get notified by email.

**Aug 7 – 10, 2026 · [The Airbnb](https://www.airbnb.com/rooms/1414232382068578587?unique_share_id=0ad67628-183c-4abc-9e9c-1a8881d18cef&viralityEntryPoint=1&s=76)**

## Stack

- **Next.js 16** (App Router, Server Actions) + Tailwind v4
- **Auth.js v5** — Google, Microsoft Entra ID, email + password
- **Azure Cosmos DB** (NoSQL) — free tier is plenty
- **Resend** — transactional email
- **Vitest** — unit tests for repo + server actions
- **Azure Static Web Apps** + GitHub Actions for deploy

## Local development

```powershell
cp .env.local.example .env.local        # then fill in the secrets
npm install
npm run dev
```

Open <http://localhost:3000>. The first user to sign up automatically becomes admin.

### Run tests

```powershell
npm test          # watch mode
npm run test:run  # one-shot (used in CI)
```

## Filling in `.env.local`

| Var | How to get it |
| --- | --- |
| `AUTH_SECRET` | `npx auth secret` (or `openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` / `_SECRET` | [Google Cloud Console → Credentials → OAuth 2.0 Client ID](https://console.cloud.google.com/apis/credentials). Authorized redirect URI: `<APP URL>/api/auth/callback/google` |
| `AUTH_MICROSOFT_ENTRA_ID_*` | [Entra portal → App registrations → New](https://entra.microsoft.com). Redirect URI: `<APP URL>/api/auth/callback/microsoft-entra-id`. Use issuer `https://login.microsoftonline.com/common/v2.0` for personal + work accounts. |
| `COSMOS_ENDPOINT` / `COSMOS_KEY` | Azure portal → your Cosmos DB account → **Keys** |
| `RESEND_API_KEY` | <https://resend.com/api-keys> |

The database and four containers (`users`, `games`, `signups`, `teamRequests`)
are created automatically the first time the app talks to Cosmos.

## Deploying to Azure

This repo is wired for **Azure Static Web Apps** with Next.js hybrid rendering.

### 1. Create the Azure resources

In the Azure portal:

1. **Cosmos DB** — create an account (API: NoSQL). Enable the **free tier** for
   the first 1000 RU/s. No need to pre-create the database or containers.
2. **Static Web App** — create one, plan: **Free**.
   - Source: GitHub, choose this repo and the `main` branch.
   - Build preset: **Custom** — leave app location `/`, output `.next`.
   - Skip the API location.
   - When Azure creates the resource it will commit a workflow file. **Delete
     that file** — this repo already ships
     [`.github/workflows/azure-static-web-apps.yml`](.github/workflows/azure-static-web-apps.yml)
     and you only want one.
3. Copy the deployment token from **Static Web App → Manage deployment token**.

### 2. Configure GitHub repo secrets / variables

In **GitHub repo → Settings → Secrets and variables → Actions**:

**Secrets**

- `AZURE_STATIC_WEB_APPS_API_TOKEN` — the deployment token from step 1.3
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ISSUER`
- `COSMOS_ENDPOINT`, `COSMOS_KEY`
- `RESEND_API_KEY`

**Variables**

- `NEXT_PUBLIC_APP_URL` — e.g. `https://branlympics.com`
- `COSMOS_DATABASE` — e.g. `branlympics`
- `EMAIL_FROM` — e.g. `Branlympics <noreply@branlympics.com>`

### 3. Configure runtime env on the Static Web App

The build only bakes in `NEXT_PUBLIC_*` env vars. Server-side code reads the
rest at runtime, so you also need to set them in the Azure portal:

**Static Web App → Settings → Configuration → Application settings** —
add every variable from the secrets/variables lists above (except the SWA
deployment token).

### 4. Custom domain (`branlympics.com`)

You can buy the domain through Azure:

1. Azure portal → **App Service Domains** → **+ Create**.
2. Search `branlympics.com`, fill out contacts, finish purchase
   (≈ $12/yr for `.com`).
3. Go to your **Static Web App → Custom domains → + Add → Custom domain on
   other DNS**. Add `branlympics.com` and `www.branlympics.com`.
4. SWA will give you a `TXT` validation record and the `CNAME` / `ALIAS` to
   set. App Service Domains uses an Azure DNS zone created during purchase, so
   you can add those records in **DNS zones → branlympics.com**.
5. Once validated, SWA auto-provisions a free TLS cert.
6. Update the `NEXT_PUBLIC_APP_URL` variable and the `AUTH_URL` app setting to
   `https://branlympics.com`, and add the new redirect URI in both the Google
   and Microsoft OAuth app registrations.

### 5. Make yourself admin

The first user to sign up becomes admin automatically. After deploy, sign up
once with your own Google / MS / email account and you'll see the **Admin**
link in the nav. From there you can add games and promote others.

## Project layout

```
src/
  app/
    page.tsx                 # home
    signin/, signup/         # auth pages
    games/                   # list + [id] detail
    admin/games/, admin/users/
    account/                 # my signups + team requests
    actions/                 # server actions (auth.ts, games.ts)
    api/auth/[...nextauth]/  # Auth.js route handler
  components/                # client UI bits (buttons, forms, header)
  lib/
    db.ts        # Cosmos client + container init
    repo.ts      # all reads + writes
    email.ts     # Resend wrapper + templates
    env.ts       # env access
    models.ts    # types
  auth.ts        # Auth.js v5 config
tests/
  repo.test.ts
  actions.test.ts
  fake-cosmos.ts # in-memory @azure/cosmos for tests
  setup.ts
```

## Notes

- All sensitive operations (creating games, deleting games, responding to team
  requests, promoting users) re-check the session inside the server action
  itself — never trust the client.
- Email sends are best-effort: a failure is logged but never blocks the
  user-facing action.
- Cosmos partition keys: `users` & `games` are partitioned by `id`, `signups`
  by `gameId` (so listing a game's roster is a single partition read), and
  `teamRequests` by `toUserId` (so listing your inbox is a single partition
  read).
