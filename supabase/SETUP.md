# Supabase setup — the private two-player database

This is the part that makes the game *shared*: both of you sign in, every
score / note / vote is saved, and **only your two accounts can read any of it**.

Free tier is plenty. Takes about 10 minutes.

---

## 1. Create the project

1. Go to <https://supabase.com> → sign in → **New project**.
2. Name it `only-for-prof-lily`, pick a strong database password (store it in a
   password manager — the website never needs it), region **Northeast Asia (Seoul)**.
3. Wait for it to finish provisioning.

## 2. Create the tables and security rules

1. Left sidebar → **SQL Editor** → **New query**.
2. Open `supabase/migrations/20261110000000_init.sql` from this project, copy
   **everything**, paste it in, press **Run**. You should see "Success. No rows returned".

That creates every table with Row Level Security turned on, the point-awarding
functions, the exam answer key (in a hidden schema), and four seeded "faculty
notices".

## 3. Get the two browser-safe values

**Project Settings → API Keys** (or the **Connect** button):

| Value | Where it goes |
| --- | --- |
| Project URL — `https://xxxx.supabase.co` | `VITE_SUPABASE_URL` |
| **Publishable** key (`sb_publishable_…`, or the legacy `anon` key) | `VITE_SUPABASE_PUBLISHABLE_KEY` |

⚠️ Never use the `service_role` / secret key anywhere in this project.

## 4. Auth settings

**Authentication → URL Configuration**

- **Site URL**: `https://YOUR_GITHUB_USERNAME.github.io/only-for-prof-lily/`
- **Redirect URLs** → add both:
  - `https://YOUR_GITHUB_USERNAME.github.io/only-for-prof-lily/`
  - `http://localhost:5173/only-for-prof-lily/`

**Authentication → Sign In / Providers**

- **Email** provider: enabled.
- Turn **off** “Allow new users to sign up”. (Invites and accounts you create
  yourself still work. Random people can’t create accounts — and even if they
  could, they’d see nothing, because they’re not on the player list.)

## 5. Create the two accounts — pick ONE way

### Option A — passwords (simplest, no email setup)

**Authentication → Users → Add user → Create new user**

1. Your email + a password, tick **Auto Confirm User**.
2. Lily’s email + a temporary password, tick **Auto Confirm User**.

Give Lily her temporary password privately. After signing in she can change it
in **Settings → Password** so only she knows it. On the login screen she taps
**“I have a password instead”**.

### Option B — magic links (no passwords)

Supabase’s built-in email sender only delivers to members of your own Supabase
team and is heavily rate-limited, so for Lily to receive emails you need your
own sender first:

1. **Project Settings → Authentication → SMTP Settings → Enable custom SMTP**.
   Easiest for a personal project: Gmail with an **App Password**
   (host `smtp.gmail.com`, port `465`, user = your Gmail address,
   password = the 16-character app password from your Google account’s
   security settings). Any SMTP provider works.
2. **Authentication → Users → Add user → Send invitation** — once for your
   email, once for Lily’s.
3. (Optional, recommended) **Authentication → Emails → Magic Link** template:
   add `Your code: {{ .Token }}` so the email also contains a 6-digit code.
   The login screen accepts either the link or the code — handy when an email
   app opens links in its own browser.

You can mix: magic links for you, password for Lily, etc.

## 6. Put both accounts on the player list (the allowlist)

Accounts exist now but can’t see anything yet. In **SQL Editor**, run this —
with the two real email addresses typed in (they stay in your database; they are
not saved in the code):

```sql
insert into public.game_players (user_id, role, display_name)
select id, 'satyam', 'Researcher Satyam' from auth.users where email = 'YOUR_EMAIL_HERE';

insert into public.game_players (user_id, role, display_name)
select id, 'lily', 'Professor Lily' from auth.users where email = 'LILYS_EMAIL_HERE';

-- Check: should return exactly two rows.
select p.role, p.display_name, u.email
from public.game_players p join auth.users u on u.id = p.user_id;
```

Want a different title on screen (e.g. “Professor Satyam”)? Change
`display_name` — it’s used everywhere in the game:

```sql
update public.game_players set display_name = 'Professor Satyam' where role = 'satyam';
```

## 7. Verify the privacy rules (2 minutes)

- Sign in as yourself on your phone, Lily’s account on another browser: both
  see the same stars, notes and constellation.
- Optional: create a third test user (Option A), sign in with it → you should see
  **“This tiny university is invitation-only.”** Then delete that user.
- Optional SQL check: `supabase/tests/rls_smoke_test.sql` (instructions inside).

The same rules are also tested automatically on every deploy (`npm test` runs
the real migration in an in-memory Postgres and tries to break in as a
stranger, as an anonymous visitor, and as the *other* player).

## What’s stored

| Table | What | Who can read |
| --- | --- | --- |
| `game_players` | the two accounts + roles | the two players |
| `game_completions` | every finished round: game, score, stars, date | the two players |
| `shared_notes`, `note_reactions` | Letterbox notes, stickers, reactions | the two players; only the author can edit/delete |
| `faculty_votes` | daily silly-proposal votes | your own; the other vote is revealed after you vote |
| `constellation_stars` | the shared sky | the two players |
| `card_reads` | which story cards you opened | yourself |

No photos, locations, contacts or face data are collected — ever.

## Resetting the game

To start completely fresh (keeps accounts and player list):

```sql
truncate public.game_completions, public.constellation_stars, public.faculty_votes, public.card_reads, public.note_reactions;
delete from public.shared_notes where kind <> 'faculty';
```
