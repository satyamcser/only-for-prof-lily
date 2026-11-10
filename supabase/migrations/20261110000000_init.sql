-- =====================================================================
-- ONLY FOR PROFESSOR LILY — schema, Row Level Security and secure RPCs
-- =====================================================================
-- Run this ONCE in Supabase → SQL Editor (or `supabase db push`).
-- It is safe for an empty project. Read supabase/SETUP.md first.
--
-- Security model (short version):
--   * Every app table has RLS enabled. `anon` gets no table or RPC access.
--   * `authenticated` users can read app data ONLY if their auth.uid() is in
--     public.game_players with enabled = true (two rows: 'satyam', 'lily').
--     Membership is inserted by the project owner in the SQL editor — never
--     by the browser.
--   * Points are NEVER written by the client. Games call SECURITY DEFINER RPCs
--     (record_completion / submit_exam) that check membership, the activity
--     whitelist, the score range, a per-player daily award limit (unique
--     index), and request-rate limits. Quiz answers are graded in the DB
--     against a key stored in a non-exposed schema.
--   * Notes/reactions: members can only create/edit/delete their own rows;
--     author/user columns default to auth.uid() and are not client-writable.
--
-- All "daily" limits reset at midnight Korea time (Asia/Seoul), because both
-- players live in Korea.
-- =====================================================================

create schema if not exists app_private;
revoke all on schema app_private from public;
revoke all on schema app_private from anon, authenticated;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.app_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Seoul')::date
$$;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- The allowlist. Exactly two possible roles. Admin-provisioned only.
create table public.game_players (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null unique check (role in ('satyam', 'lily')),
  display_name text not null check (char_length(display_name) between 1 and 40),
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Catalog of activities and their (server-side) point values.
create table public.game_activities (
  id                text primary key check (id ~ '^[a-z_]{3,40}$'),
  display_title     text not null,
  base_points       int  not null check (base_points between 0 and 20),
  perfect_bonus     int  not null default 0 check (perfect_bonus between 0 and 10),
  max_score         int  not null check (max_score between 1 and 1000),
  daily_limit       int  not null default 1 check (daily_limit in (0, 1)),
  client_reportable boolean not null default true,
  active            boolean not null default true,
  sort_order        int  not null default 0
);

insert into public.game_activities
  (id, display_title, base_points, perfect_bonus, max_score, daily_limit, client_reportable, sort_order)
values
  ('latte_rescue',      'Latte or Flower?',                     10, 0, 100, 1, true,  1),
  ('laundry_crisis',    'The Great Laundry Crisis',             10, 0, 100, 1, true,  2),
  ('totally_fair_exam', 'Professor Lily''s Totally Fair Exam',  10, 5, 100, 1, false, 3),
  ('observatory',       'Silvermoon Observatory',               10, 0,   5, 1, true,  4),
  ('veggie_detective',  'Vegetarian Ingredient Detective',      10, 0, 100, 1, true,  5),
  ('cafe_escape',       'Tofu & Simba: The Great Café Escape',  10, 0, 300, 1, true,  6),
  ('letterbox',         'Letterbox note',                        3, 0,   1, 1, false, 7);

-- Every finished round. Only SECURITY DEFINER functions insert here.
create table public.game_completions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.game_players (user_id) on delete cascade,
  activity_id text not null references public.game_activities (id),
  points      int  not null check (points between 0 and 30),
  score       int  not null check (score between 0 and 1000),
  played_on   date not null default public.app_today(),
  details     jsonb not null default '{}'::jsonb check (octet_length(details::text) <= 400),
  created_at  timestamptz not null default now()
);

-- One point award per player per activity per day. Replays insert points = 0.
create unique index game_completions_one_award_per_day
  on public.game_completions (user_id, activity_id, played_on)
  where points > 0;
create index game_completions_user_created on public.game_completions (user_id, created_at desc);

-- Exam answer key lives in a schema that the Data API does not expose.
create table app_private.exam_answer_key (
  question_id   text primary key,
  correct_index int  not null check (correct_index between 0 and 3),
  optional      boolean not null default false -- cranial-nerve bonus: may be skipped
);

insert into app_private.exam_answer_key (question_id, correct_index, optional) values
  ('q_sugohaesseoyo', 0, false),
  ('q_forbidden',     2, false),
  ('q_sock_thief',    1, false),
  ('q_hard_day',      1, false),
  ('q_neural',        3, false),
  ('q_budget',        0, false),
  ('q_regulation',    2, false),
  ('q_kaist',         1, false),
  ('q_two_seas',      0, false),
  ('q_thank_you',     2, false),
  ('q_delicious',     3, false),
  ('q_fansipan',      1, false),
  ('q_observatory',   0, false),
  ('q_defendant',     2, false),
  ('q_cameras',       3, false),
  ('q_fishy_soup',    1, false),
  ('c_olfactory',     2, true),
  ('c_optic',         0, true),
  ('c_vagus',         3, true),
  ('c_hypoglossal',   1, true),
  ('c_vestibulo',     2, true);

-- Shared letterbox. Faculty notices are seeded with author_id = null.
create table public.shared_notes (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid default auth.uid() references public.game_players (user_id) on delete cascade,
  kind       text not null default 'note' check (kind in ('note', 'encouragement', 'sticker', 'faculty')),
  body       text not null check (char_length(body) between 1 and 280 and btrim(body) <> ''),
  reply_to   uuid references public.shared_notes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faculty_notes_have_no_author check ((kind = 'faculty') = (author_id is null)),
  constraint stickers_are_replies check ((kind = 'sticker') = (reply_to is not null)),
  constraint sticker_bodies check (kind <> 'sticker' or body in ('🌸', '🐾', '☕', '⭐'))
);
create index shared_notes_created on public.shared_notes (created_at desc);
create index shared_notes_reply_to on public.shared_notes (reply_to);

create table public.note_reactions (
  note_id    uuid not null references public.shared_notes (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.game_players (user_id) on delete cascade,
  emoji      text not null check (emoji in ('🤍', '🌸', '😂', '⭐')),
  created_at timestamptz not null default now(),
  primary key (note_id, user_id, emoji)
);

-- Faculty Senate: one silly proposal per day, one vote per member per day.
create table public.faculty_proposals (
  id         text primary key,
  title      text not null,
  sort_order int  not null unique
);

insert into public.faculty_proposals (id, title, sort_order) values
  ('p_flower_friday', 'Allow DUBOT one (1) flower on Fridays — strictly outside the latte.', 1),
  ('p_tofu_dean',     'Appoint Tofu as Dean of Snacks (unpaid, but with treats).', 2),
  ('p_simba_amnesty', 'Grant Simba amnesty for all past sock relocations.', 3),
  ('p_budget',        'Raise the coffee budget from ₩0 to ₩0.5.', 4),
  ('p_lights_on',     'Mandatory lights-on period after any horror movie.', 5),
  ('p_letter_length', 'Cap letters at the length of one (1) doctoral dissertation.', 6),
  ('p_laundry',       'Declare laundry folding an official humanitarian research field.', 7),
  ('p_cv_closed',     'Keep the Computer Vision Department closed for selfies. Forever.', 8),
  ('p_no_spoilers',   'Ban spoilers about the ending of any space movie with a dramatic organ.', 9),
  ('p_nap_policy',    'A nap is a valid response to any assignment deadline.', 10);

create table public.faculty_votes (
  proposal_id text not null references public.faculty_proposals (id),
  voter_id    uuid not null references public.game_players (user_id) on delete cascade,
  choice      text not null check (choice in ('approve', 'reject')),
  voted_on    date not null default public.app_today(),
  created_at  timestamptz not null default now(),
  primary key (proposal_id, voter_id, voted_on)
);

-- Shared Silvermoon sky: stars are lit by either player.
create table public.constellations (
  id         text primary key,
  title      text not null,
  star_count int  not null check (star_count between 3 and 12),
  sort_order int  not null unique
);

insert into public.constellations (id, title, star_count, sort_order) values
  ('flower_water_nebula', 'The Flower Water Nebula', 5, 1),
  ('tofu_minor',          'Tofu Minor',              5, 2),
  ('simba_major',         'Simba Major',             5, 3),
  ('organ_chord_cluster', 'The Dramatic Organ Chord Cluster', 5, 4),
  ('twelve_nerves',       'The Twelve-Nerve Crown',  5, 5);

create table public.constellation_stars (
  constellation_id text not null references public.constellations (id),
  star_index       int  not null check (star_index between 0 and 11),
  lit_by           uuid not null references public.game_players (user_id) on delete cascade,
  lit_on           date not null default public.app_today(),
  created_at       timestamptz not null default now(),
  primary key (constellation_id, star_index)
);

-- Which story cards a player has opened (for the hidden badge).
create table public.card_reads (
  user_id uuid not null references public.game_players (user_id) on delete cascade,
  card_id text not null check (card_id ~ '^[a-z0-9_]{1,40}$'),
  read_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- ---------------------------------------------------------------------
-- Membership check used by every policy.
-- SECURITY DEFINER so policies on game_players do not recurse into themselves.
-- Owned by the migration role (postgres); fixed empty search_path; only
-- `authenticated` may execute it. It reveals nothing but a boolean about the
-- caller's own uid.
-- ---------------------------------------------------------------------
create or replace function public.is_game_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.game_players p
    where p.user_id = auth.uid() and p.enabled
  )
$$;

-- ---------------------------------------------------------------------
-- Privileges: start from nothing, then grant the minimum.
-- ---------------------------------------------------------------------
revoke all on table
  public.game_players, public.game_activities, public.game_completions,
  public.shared_notes, public.note_reactions, public.faculty_proposals,
  public.faculty_votes, public.constellations, public.constellation_stars,
  public.card_reads
from public, anon, authenticated;

grant select on table
  public.game_players, public.game_activities, public.game_completions,
  public.shared_notes, public.note_reactions, public.faculty_proposals,
  public.faculty_votes, public.constellations, public.constellation_stars,
  public.card_reads
to authenticated;

-- Column-level grants: the client can never set author_id / user_id / timestamps.
grant insert (body, kind, reply_to) on public.shared_notes to authenticated;
grant update (body) on public.shared_notes to authenticated;
grant delete on public.shared_notes to authenticated;
grant insert (note_id, emoji) on public.note_reactions to authenticated;
grant delete on public.note_reactions to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.game_players        enable row level security;
alter table public.game_activities     enable row level security;
alter table public.game_completions    enable row level security;
alter table public.shared_notes        enable row level security;
alter table public.note_reactions      enable row level security;
alter table public.faculty_proposals   enable row level security;
alter table public.faculty_votes       enable row level security;
alter table public.constellations      enable row level security;
alter table public.constellation_stars enable row level security;
alter table public.card_reads          enable row level security;
alter table app_private.exam_answer_key enable row level security; -- no policies: unreadable via API

create policy "members read players" on public.game_players
  for select to authenticated using ((select public.is_game_member()));

create policy "members read activities" on public.game_activities
  for select to authenticated using ((select public.is_game_member()));

create policy "members read completions" on public.game_completions
  for select to authenticated using ((select public.is_game_member()));

create policy "members read notes" on public.shared_notes
  for select to authenticated using ((select public.is_game_member()));
create policy "members post own notes" on public.shared_notes
  for insert to authenticated
  with check (
    (select public.is_game_member())
    and author_id = (select auth.uid())
    and kind in ('note', 'encouragement', 'sticker')
  );
create policy "authors edit own notes" on public.shared_notes
  for update to authenticated
  using ((select public.is_game_member()) and author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy "authors delete own notes" on public.shared_notes
  for delete to authenticated
  using ((select public.is_game_member()) and author_id = (select auth.uid()));

create policy "members read reactions" on public.note_reactions
  for select to authenticated using ((select public.is_game_member()));
create policy "members add own reactions" on public.note_reactions
  for insert to authenticated
  with check ((select public.is_game_member()) and user_id = (select auth.uid()));
create policy "members remove own reactions" on public.note_reactions
  for delete to authenticated
  using ((select public.is_game_member()) and user_id = (select auth.uid()));

create policy "members read proposals" on public.faculty_proposals
  for select to authenticated using ((select public.is_game_member()));

-- Votes: you can read only your own rows directly; the other member's vote is
-- revealed by get_world_state() only after you have voted on the same proposal.
create policy "members read own votes" on public.faculty_votes
  for select to authenticated
  using ((select public.is_game_member()) and voter_id = (select auth.uid()));

create policy "members read constellations" on public.constellations
  for select to authenticated using ((select public.is_game_member()));
create policy "members read stars" on public.constellation_stars
  for select to authenticated using ((select public.is_game_member()));

create policy "members read own card reads" on public.card_reads
  for select to authenticated
  using ((select public.is_game_member()) and user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Internal functions (schema app_private is not exposed and not executable
-- by anon/authenticated).
-- ---------------------------------------------------------------------

-- Atomically records a completion. Awards points at most once per
-- player/activity/day (enforced by the unique partial index), otherwise
-- records a 0-point replay. Also applies simple request limits.
create or replace function app_private.award(
  p_user uuid,
  p_activity text,
  p_score int,
  p_details jsonb,
  p_record_replay boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_act public.game_activities%rowtype;
  v_today date := public.app_today();
  v_points int := 0;
  v_awarded boolean := false;
begin
  select * into v_act from public.game_activities where id = p_activity and active;
  if not found then
    raise exception 'unknown_activity' using errcode = '22023';
  end if;
  if p_score is null or p_score < 0 or p_score > v_act.max_score then
    raise exception 'score_out_of_range' using errcode = '22023';
  end if;

  -- Request limits for game saves: max 12 per minute and 150 per day per player.
  -- (Letterbox awards skip this; notes have their own limit in guard_note.)
  if p_record_replay then
    if (select count(*) from public.game_completions c
        where c.user_id = p_user and c.created_at > now() - interval '1 minute') >= 12 then
      raise exception 'slow_down' using errcode = '54000';
    end if;
    if (select count(*) from public.game_completions c
        where c.user_id = p_user and c.played_on = v_today) >= 150 then
      raise exception 'daily_save_limit' using errcode = '54000';
    end if;
  end if;

  if v_act.daily_limit > 0 then
    v_points := v_act.base_points
      + case when coalesce((p_details ->> 'perfect')::boolean, false) then v_act.perfect_bonus else 0 end;
    insert into public.game_completions (user_id, activity_id, points, score, played_on, details)
    values (p_user, p_activity, v_points, p_score, v_today, coalesce(p_details, '{}'::jsonb))
    on conflict (user_id, activity_id, played_on) where points > 0 do nothing;
    v_awarded := found;
  end if;

  if not v_awarded then
    v_points := 0;
    if p_record_replay then
      insert into public.game_completions (user_id, activity_id, points, score, played_on, details)
      values (p_user, p_activity, 0, p_score, v_today, coalesce(p_details, '{}'::jsonb));
    end if;
  end if;

  return jsonb_build_object(
    'points_awarded', v_points,
    'already_awarded', (not v_awarded) and v_act.daily_limit > 0,
    'score', p_score
  );
end
$$;

-- Lights stars in the current shared constellation. Each player can light at
-- most 3 stars per day, so a constellation of 5 is finished by both players
-- together (3 + 2) — or by one player across two days. No pressure.
create or replace function app_private.light_stars(p_user uuid, p_requested int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := public.app_today();
  v_allow int;
  v_lit int := 0;
  v_c record;
  v_idx int;
begin
  perform pg_advisory_xact_lock(hashtext('only_for_prof_lily.constellation'));
  select 3 - count(*) into v_allow
  from public.constellation_stars s where s.lit_by = p_user and s.lit_on = v_today;
  v_allow := least(greatest(v_allow, 0), greatest(coalesce(p_requested, 0), 0));

  while v_lit < v_allow loop
    select c.id, c.star_count into v_c
    from public.constellations c
    where (select count(*) from public.constellation_stars s where s.constellation_id = c.id) < c.star_count
    order by c.sort_order
    limit 1;
    exit when not found;

    select min(i) into v_idx
    from generate_series(0, v_c.star_count - 1) as i
    where not exists (
      select 1 from public.constellation_stars s
      where s.constellation_id = v_c.id and s.star_index = i
    );

    insert into public.constellation_stars (constellation_id, star_index, lit_by, lit_on)
    values (v_c.id, v_idx, p_user, v_today);
    v_lit := v_lit + 1;
  end loop;

  return v_lit;
end
$$;

create or replace function app_private.todays_proposal()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.faculty_proposals p
  order by p.sort_order
  offset (
    select (abs(public.app_today() - date '2026-01-01') % greatest(count(*), 1))::int
    from public.faculty_proposals
  )
  limit 1
$$;

-- Note guards: trim, rate limit (40/day), sticker replies must target a real note.
create or replace function app_private.guard_note()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.body := btrim(new.body);
    if new.author_id is not null and (
      select count(*) from public.shared_notes n
      where n.author_id = new.author_id and n.created_at > now() - interval '1 day'
    ) >= 40 then
      raise exception 'note_rate_limited' using errcode = '54000';
    end if;
    if new.kind = 'sticker' and not exists (
      select 1 from public.shared_notes p where p.id = new.reply_to and p.kind <> 'sticker'
    ) then
      raise exception 'sticker_needs_a_note' using errcode = '22023';
    end if;
  else
    new.body := btrim(new.body);
    new.updated_at := now();
  end if;
  return new;
end
$$;

create trigger shared_notes_guard
  before insert or update on public.shared_notes
  for each row execute function app_private.guard_note();

-- +3 stars (once per day) for leaving a note or an encouragement.
create or replace function app_private.award_letterbox()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_id is not null and new.kind in ('note', 'encouragement') then
    perform app_private.award(new.author_id, 'letterbox', 1, '{}'::jsonb, false);
  end if;
  return null;
end
$$;

create trigger shared_notes_award
  after insert on public.shared_notes
  for each row execute function app_private.award_letterbox();

revoke all on all functions in schema app_private from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Public RPCs (callable by signed-in members only)
-- ---------------------------------------------------------------------

create or replace function public.record_completion(p_activity text, p_score int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_game_member() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.game_activities a
    where a.id = p_activity and a.client_reportable and a.active
  ) then
    raise exception 'activity_not_reportable' using errcode = '22023';
  end if;

  v_result := app_private.award(auth.uid(), p_activity, p_score, '{}'::jsonb, true);
  if p_activity = 'observatory' then
    v_result := v_result || jsonb_build_object('stars_lit', app_private.light_stars(auth.uid(), p_score));
  end if;
  return v_result;
end
$$;

-- Grades the exam in the database. p_answers = {"question_id": chosen_index | null}
-- null = skipped (allowed only for optional cranial-nerve bonus questions).
create or replace function public.submit_exam(p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_total int;
  v_answered int := 0;
  v_correct int := 0;
  v_chosen int;
  v_is_correct boolean;
  v_cranial text := 'none';
  v_results jsonb := '[]'::jsonb;
  v_score int;
  v_perfect boolean;
  v_award jsonb;
begin
  if not public.is_game_member() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'bad_answers' using errcode = '22023';
  end if;
  select count(*) into v_total from jsonb_object_keys(p_answers);
  if v_total < 3 or v_total > 8 then
    raise exception 'bad_answers' using errcode = '22023';
  end if;

  for v_row in
    select a.key, a.value, k.correct_index, k.optional
    from jsonb_each(p_answers) a
    left join app_private.exam_answer_key k on k.question_id = a.key
  loop
    if v_row.correct_index is null then
      raise exception 'unknown_question' using errcode = '22023';
    end if;

    if jsonb_typeof(v_row.value) = 'null' then
      if not v_row.optional then
        raise exception 'only_bonus_questions_can_be_skipped' using errcode = '22023';
      end if;
      v_chosen := null;
      v_is_correct := null;
      if v_cranial = 'none' then v_cranial := 'skipped'; end if;
    elsif jsonb_typeof(v_row.value) = 'number' then
      v_chosen := (v_row.value #>> '{}')::int;
      if v_chosen < 0 or v_chosen > 3 then
        raise exception 'bad_answers' using errcode = '22023';
      end if;
      v_answered := v_answered + 1;
      v_is_correct := v_chosen = v_row.correct_index;
      if v_is_correct then v_correct := v_correct + 1; end if;
      if v_row.optional then
        v_cranial := case when v_is_correct then 'correct' else 'wrong' end;
      end if;
    else
      raise exception 'bad_answers' using errcode = '22023';
    end if;

    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'question_id', v_row.key,
      'chosen', v_chosen,
      'correct_index', v_row.correct_index,
      'correct', v_is_correct
    ));
  end loop;

  if v_answered < 3 then
    raise exception 'answer_at_least_three' using errcode = '22023';
  end if;

  v_score := round(100.0 * v_correct / v_answered);
  v_perfect := v_correct = v_answered and v_answered >= 4;
  v_award := app_private.award(
    auth.uid(), 'totally_fair_exam', v_score,
    jsonb_build_object('answered', v_answered, 'correct', v_correct, 'cranial', v_cranial, 'perfect', v_perfect),
    true
  );
  return v_award || jsonb_build_object(
    'results', v_results, 'answered', v_answered, 'correct', v_correct, 'perfect', v_perfect
  );
end
$$;

create or replace function public.cast_vote(p_choice text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid text;
begin
  if not public.is_game_member() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if p_choice is null or p_choice not in ('approve', 'reject') then
    raise exception 'bad_choice' using errcode = '22023';
  end if;
  v_pid := app_private.todays_proposal();
  insert into public.faculty_votes (proposal_id, voter_id, choice, voted_on)
  values (v_pid, auth.uid(), p_choice, public.app_today())
  on conflict do nothing;
  if not found then
    raise exception 'already_voted_today' using errcode = '23505';
  end if;
  return jsonb_build_object('proposal_id', v_pid, 'choice', p_choice);
end
$$;

create or replace function public.mark_card_read(p_card text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_game_member() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if p_card is null or p_card not in (
    'flower_water_incident', 'cranial_nerves_strike_back', 'korean_homework_certificate',
    'silvermoon_zero_quests', 'tofu_snack_request', 'simba_innocence_hearing',
    'freezing_wind_report', 'emergency_coffee_funding', 'suspiciously_fishy_soup',
    'remote_faculty_meeting', 'ordinary_days'
  ) then
    raise exception 'unknown_card' using errcode = '22023';
  end if;
  insert into public.card_reads (user_id, card_id) values (auth.uid(), p_card)
  on conflict do nothing;
end
$$;

-- One round-trip snapshot of the shared world, computed from the tables.
create or replace function public.get_world_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := public.app_today();
  v_pid text;
  v_my text;
  v_other text;
begin
  if not public.is_game_member() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  v_pid := app_private.todays_proposal();
  select v.choice into v_my from public.faculty_votes v
  where v.proposal_id = v_pid and v.voter_id = v_uid and v.voted_on = v_today;
  if v_my is not null then
    select v.choice into v_other from public.faculty_votes v
    where v.proposal_id = v_pid and v.voter_id <> v_uid and v.voted_on = v_today;
  end if;

  return jsonb_build_object(
    'today', v_today,
    'me', v_uid,
    'players', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', p.user_id,
        'role', p.role,
        'display_name', p.display_name,
        'stars', coalesce((select sum(c.points) from public.game_completions c where c.user_id = p.user_id), 0),
        'notes_posted', (select count(*) from public.shared_notes n
                         where n.author_id = p.user_id and n.kind in ('note', 'encouragement')),
        'cards_read', (select count(*) from public.card_reads r where r.user_id = p.user_id)
      ) order by p.role), '[]'::jsonb)
      from public.game_players p where p.enabled
    ),
    'activities', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'title', a.display_title, 'base_points', a.base_points,
        'perfect_bonus', a.perfect_bonus, 'max_score', a.max_score, 'daily_limit', a.daily_limit
      ) order by a.sort_order), '[]'::jsonb)
      from public.game_activities a where a.active
    ),
    'stats', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', s.user_id, 'activity_id', s.activity_id, 'plays', s.plays,
        'best_score', s.best_score, 'points', s.points, 'first_at', s.first_at,
        'perfect_at', s.perfect_at, 'cranial_at', s.cranial_at, 'awarded_today', s.awarded_today
      )), '[]'::jsonb)
      from (
        select c.user_id, c.activity_id,
               count(*) as plays,
               max(c.score) as best_score,
               sum(c.points) as points,
               min(c.created_at) as first_at,
               min(c.created_at) filter (where c.details ->> 'perfect' = 'true') as perfect_at,
               min(c.created_at) filter (where c.details ->> 'cranial' = 'correct') as cranial_at,
               bool_or(c.points > 0 and c.played_on = v_today) as awarded_today
        from public.game_completions c
        group by c.user_id, c.activity_id
      ) s
    ),
    'my_card_reads', (
      select coalesce(jsonb_agg(r.card_id), '[]'::jsonb)
      from public.card_reads r where r.user_id = v_uid
    ),
    'constellations', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'title', c.title, 'star_count', c.star_count,
        'lit', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'star_index', s.star_index, 'lit_by', s.lit_by, 'lit_on', s.lit_on
          ) order by s.star_index), '[]'::jsonb)
          from public.constellation_stars s where s.constellation_id = c.id
        )
      ) order by c.sort_order), '[]'::jsonb)
      from public.constellations c
    ),
    'stars_lit_today', (
      select count(*) from public.constellation_stars s
      where s.lit_by = v_uid and s.lit_on = v_today
    ),
    'vote', jsonb_build_object(
      'proposal_id', v_pid,
      'title', (select p.title from public.faculty_proposals p where p.id = v_pid),
      'my_choice', v_my,
      'other_choice', v_other
    )
  );
end
$$;

-- Function privileges: nothing for anon; members call RPCs; each RPC re-checks membership.
revoke all on function public.app_today() from public, anon;
revoke all on function public.is_game_member() from public, anon;
revoke all on function public.record_completion(text, int) from public, anon;
revoke all on function public.submit_exam(jsonb) from public, anon;
revoke all on function public.cast_vote(text) from public, anon;
revoke all on function public.mark_card_read(text) from public, anon;
revoke all on function public.get_world_state() from public, anon;

grant execute on function public.app_today() to authenticated;
grant execute on function public.is_game_member() to authenticated;
grant execute on function public.record_completion(text, int) to authenticated;
grant execute on function public.submit_exam(jsonb) to authenticated;
grant execute on function public.cast_vote(text) to authenticated;
grant execute on function public.mark_card_read(text) to authenticated;
grant execute on function public.get_world_state() to authenticated;

-- ---------------------------------------------------------------------
-- Seeded faculty notices (not attributed to either player)
-- ---------------------------------------------------------------------
insert into public.shared_notes (author_id, kind, body) values
  (null, 'faculty', 'Professor Lily, DUBOT has been caught watering the coffee machine again. — Faculty notice'),
  (null, 'faculty', 'Reminder: 오늘도 수고했어요. Even when the assignment isn''t finished. 🤍'),
  (null, 'faculty', 'Emergency budget hearing: 2 iced vanilla lattes, 0 approved funds.'),
  (null, 'faculty', 'Tofu and Simba deny all allegations.');

-- ---------------------------------------------------------------------
-- Realtime (Supabase only): broadcast changes; RLS still applies to subscribers.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      public.shared_notes, public.note_reactions, public.game_completions, public.constellation_stars;
  end if;
end
$$;
