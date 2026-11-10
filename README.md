# ONLY FOR PROFESSOR LILY 💌🤖

*An extremely serious university with a deeply unserious robot.*

A private, two-player 2D mini-game world for Professor Lily and Researcher Satyam:
a walkable campus, six mini-games, shared stars, a head-to-head scoreboard, a
private letterbox, a shared constellation, a scrapbook of story cards — and one
sealed letter. Built with React + TypeScript + Vite, hosted free on GitHub
Pages, with a private Supabase database that **only your two accounts can read**.

---

## What’s inside

| Place on campus | What you can do |
| --- | --- |
| **DUBOT Café** | *Latte or Flower?* — rescue the iced vanilla latte before DUBOT serves flower water. *The Great Café Escape* — 25 s of Tofu & Simba chaos. |
| **Professor Lily’s Office** | *The Totally Fair Exam* (graded by the database, skippable cranial-nerve bonus) + the **Faculty Office**: head-to-head scoreboard, both players’ stars, report card with 👑 record holders, rulebook, daily Faculty Senate vote. |
| **Robotics Lab** | *The Great Laundry Crisis* — drag-and-drop folding while DUBOT tries to escape and Simba relocates socks. |
| **Tofu & Simba Park** | Tap Tofu (×3 = snack emergency), tap Simba (pawprints + innocence meter). |
| **Vegetarian Detective Kitchen** | *Vegetarian Ingredient Detective* — find the hidden anchovy broth. |
| **Memory Corner** | Letterbox notes, reactions, stickers, “Send a little encouragement”, the scrapbook, and **the sealed letter**. |
| **Silvermoon Observatory** | Collect 5 stars (or just watch them). Your stars light a constellation you finish together. |

Easter eggs: tap DUBOT’s antenna 5×, tap the moon, open three story cards…

### The sealed letter ✉️
Lily sees a glowing **“A sealed letter is waiting for you”** on her campus.
You (Satyam) see a **preview** button instead. The text is a draft in
**`src/data/letter.ts`** — please rewrite it in your own words before sending
the link. Note: that file ships in the public website code, so it isn’t secret
from someone who reads the page source. For something fully private, post it
in the Letterbox (stored in the protected database).

### Scores & “who’s winning”
- Each game gives **+10 ⭐ once per day** per player (perfect exam +5, first note
  of the day +3). Replays are always free and still count for best scores.
- **Faculty Office → Head-to-head** shows who leads overall and who holds the
  best score in each game (👑).
- Points are awarded **by the database**, never trusted from the browser, and
  daily limits are enforced there too.

---

## Step 1 — Run it on your computer (optional but recommended)

Install **Node.js 20.19+** (LTS) from <https://nodejs.org>, then in this folder:

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:5173/only-for-prof-lily/>.
Without Supabase values the app runs a **local preview**: two quick-entry
buttons, fake data, nothing saved (refresh wipes it). Real builds never include
this preview.

Other commands:

```bash
npm test
```

```bash
npm run build
```

## Step 2 — Put the code on GitHub

1. Create a new repository on GitHub named **`only-for-prof-lily`**
   (Private or Public both work; GitHub Pages on a *private* repo needs a paid
   plan, so Public is the free option — the database stays private either way).
   Don’t add a README/license there.
2. In this folder:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "ONLY FOR PROFESSOR LILY: first release"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/only-for-prof-lily.git
```

```bash
git push -u origin main
```

## Step 3 — Create the private database (Supabase)

Follow **[`supabase/SETUP.md`](supabase/SETUP.md)** — about 10 minutes:
create project → paste one SQL file → set the site URL → create the two accounts
→ add both to the player list.

## Step 4 — Tell GitHub about the database

GitHub repo → **Settings → Secrets and variables → Actions → Variables tab →
New repository variable**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your **publishable** (anon) key |

These two are safe to expose — the database is protected by Row Level Security,
not by hiding the key. **Never** add the `service_role`/secret key or database
password anywhere.

For local development with the real database, copy `.env.example` to
`.env.local` and fill in the same two values (`.env.local` is git-ignored).

## Step 5 — Turn on GitHub Pages

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Repo → **Actions → “Deploy to GitHub Pages” → Run workflow** (or just push again).
3. When it’s green, your site is live at:

   **`https://YOUR_GITHUB_USERNAME.github.io/only-for-prof-lily/`**

Every push to `main` redeploys automatically (tests run first).

> Using a different repo name? It just works — the workflow passes the repo name
> to Vite. Custom domain or `USERNAME.github.io` repo? Add a variable
> `VITE_BASE_PATH` = `/`.

## Step 6 — Before sending Lily the link

- [ ] Rewrite `src/data/letter.ts` in your own words, commit, push.
- [ ] Sign in yourself on the live URL and play one game.
- [ ] Check the Faculty Office shows both players.
- [ ] Send Lily the URL, plus either her temporary password (then she can set
      her own in Settings) or tell her to use “Send me a magic link”.

---

## How it’s built

```
src/
  art/        original SVG characters: DUBOT, Tofu, Simba, Lily, Satyam, campus
  games/      the six mini-games (+ games/logic: pure, unit-tested rules)
  scenes/     login, greeting, campus, notes, scrapbook, faculty, settings, letter
  lib/        Supabase adapter, dev-only preview adapter, rules, routing, sound
  data/       jokes, story cards, exam questions (no answers!), dishes, letter
supabase/
  migrations/ schema + Row Level Security + secure RPC functions
  SETUP.md    exact setup steps
tests/        game logic, derived rules, XSS, and the real SQL run in PGlite
```

**Security model:** RLS on every table; anonymous visitors get nothing; signed-in
accounts that aren’t on `game_players` get nothing; points only via
`SECURITY DEFINER` functions that check membership, the activity, the score
range, one award per game per day (unique index) and request rate; the exam is
graded in the database from a key in a non-exposed schema; you can only
edit/delete your own notes and reactions.

**Privacy:** GitHub Pages serves the website code publicly (anyone with the URL
can load the page and its JavaScript); the *private* part is the database. No
photos, location, face data or tracking. Preferences (sound, theme, motion) are
stored only on the device.

**Accessibility:** works from 320 px phones to large desktops, touch targets
≥ 44 px, keyboard controls in every game, honours “reduce motion”, sound
effects are muted by default.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Site shows “isn’t connected to its database yet” | Add the two repo variables (Step 4) and re-run the workflow. |
| “This tiny university is invitation-only.” | That account isn’t in `game_players` — run SETUP step 6 with the right email. |
| Magic link email never arrives | Set up custom SMTP (SETUP step 5B), or use passwords (5A). |
| Link opens but says expired/invalid | Request a new one, or type the 6-digit code (SETUP 5B.3). |
| Link redirects to localhost | Fix **Site URL** / **Redirect URLs** in Supabase (SETUP step 4). |
| Blank page on GitHub Pages | Pages source must be **GitHub Actions**; check the workflow log. |
