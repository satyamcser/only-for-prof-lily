/**
 * Runs the real Supabase migration inside PGlite (Postgres compiled to WASM)
 * with stand-ins for Supabase's auth schema and roles, then checks RLS and the
 * point-awarding RPCs exactly as the browser would hit them.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'

const LILY = '11111111-1111-4111-8111-111111111111'
const SATYAM = '22222222-2222-4222-8222-222222222222'
const STRANGER = '33333333-3333-4333-8333-333333333333'

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  -- Supabase's permissive defaults, so we prove the migration revokes them.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`

let db: PGlite

async function as<T = Record<string, unknown>>(
  uid: string | null,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const role = uid ? 'authenticated' : 'anon'
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${role};`)
  try {
    const res = await db.query<T>(sql, params)
    return res.rows
  } finally {
    await db.exec('reset role;')
  }
}

async function rejects(uid: string | null, sql: string, pattern: RegExp, params: unknown[] = []) {
  await expect(as(uid, sql, params)).rejects.toThrow(pattern)
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUBS)
  const dir = join(process.cwd(), 'supabase', 'migrations')
  for (const file of readdirSync(dir).sort()) {
    await db.exec(readFileSync(join(dir, file), 'utf8'))
  }
  await db.exec(`
    insert into auth.users (id, email) values
      ('${LILY}', 'lily@example.test'), ('${SATYAM}', 'satyam@example.test'), ('${STRANGER}', 'x@example.test');
    insert into public.game_players (user_id, role, display_name) values
      ('${LILY}', 'lily', 'Professor Lily'), ('${SATYAM}', 'satyam', 'Researcher Satyam');
  `)
})

describe('anonymous visitors', () => {
  it('cannot read any app table', async () => {
    for (const t of ['shared_notes', 'game_players', 'game_completions', 'note_reactions', 'faculty_votes']) {
      await rejects(null, `select * from public.${t}`, /permission denied/)
    }
  })
  it('cannot call RPCs', async () => {
    await rejects(null, `select public.get_world_state()`, /permission denied/)
    await rejects(null, `select public.record_completion('latte_rescue', 100)`, /permission denied/)
  })
})

describe('signed-in stranger (not on the allowlist)', () => {
  it('sees no rows and cannot write', async () => {
    expect(await as(STRANGER, `select * from public.shared_notes`)).toHaveLength(0)
    expect(await as(STRANGER, `select * from public.game_players`)).toHaveLength(0)
    await rejects(STRANGER, `insert into public.shared_notes (body) values ('hi')`, /row-level security/)
    await rejects(STRANGER, `select public.get_world_state()`, /not_a_member/)
    await rejects(STRANGER, `select public.record_completion('latte_rescue', 50)`, /not_a_member/)
  })
  it('cannot make themselves a player', async () => {
    await rejects(
      STRANGER,
      `insert into public.game_players (user_id, role, display_name) values ('${STRANGER}', 'lily', 'Fake')`,
      /permission denied/,
    )
  })
  it('cannot reach the exam answer key', async () => {
    await rejects(STRANGER, `select * from app_private.exam_answer_key`, /permission denied/)
    await rejects(LILY, `select * from app_private.exam_answer_key`, /permission denied/)
  })
})

describe('notes and reactions', () => {
  it('members read seeded faculty notices', async () => {
    const rows = await as(LILY, `select * from public.shared_notes where kind = 'faculty'`)
    expect(rows).toHaveLength(4)
  })

  it('posting stamps the real author and cannot impersonate', async () => {
    const [row] = await as<{ author_id: string }>(
      LILY,
      `insert into public.shared_notes (body) values ($1) returning author_id`,
      ['<img src=x onerror=alert(1)> hello'],
    )
    expect(row.author_id).toBe(LILY)
    await rejects(
      LILY,
      `insert into public.shared_notes (author_id, body) values ('${SATYAM}', 'I am Satyam')`,
      /permission denied/,
    )
    await rejects(LILY, `insert into public.shared_notes (kind, body) values ('faculty', 'fake notice')`, /row-level security/)
  })

  it('enforces the 280 character limit', async () => {
    await rejects(SATYAM, `insert into public.shared_notes (body) values ($1)`, /check constraint/, ['x'.repeat(281)])
    await rejects(SATYAM, `insert into public.shared_notes (body) values ('   ')`, /check constraint/)
  })

  it('only the author can edit or delete', async () => {
    const [note] = await as<{ id: string }>(SATYAM, `insert into public.shared_notes (body) values ('DUBOT ate my homework') returning id`)
    expect(await as(LILY, `update public.shared_notes set body = 'hacked' where id = $1 returning id`, [note.id])).toHaveLength(0)
    expect(await as(LILY, `delete from public.shared_notes where id = $1 returning id`, [note.id])).toHaveLength(0)
    const edited = await as<{ body: string }>(SATYAM, `update public.shared_notes set body = ' edited ' where id = $1 returning body`, [note.id])
    expect(edited[0].body).toBe('edited')
    await rejects(SATYAM, `update public.shared_notes set author_id = '${LILY}' where id = $1`, /permission denied/, [note.id])
  })

  it('reactions are per user, toggleable and not forgeable', async () => {
    const [note] = await as<{ id: string }>(LILY, `select id from public.shared_notes where kind = 'faculty' limit 1`)
    await as(LILY, `insert into public.note_reactions (note_id, emoji) values ($1, '🌸')`, [note.id])
    await rejects(LILY, `insert into public.note_reactions (note_id, emoji) values ($1, '🌸')`, /duplicate key/, [note.id])
    await rejects(LILY, `insert into public.note_reactions (note_id, user_id, emoji) values ($1, '${SATYAM}', '⭐')`, /permission denied/, [note.id])
    await rejects(LILY, `insert into public.note_reactions (note_id, emoji) values ($1, '💀')`, /check constraint/, [note.id])
    await as(SATYAM, `insert into public.note_reactions (note_id, emoji) values ($1, '🌸')`, [note.id])
    expect(await as(LILY, `delete from public.note_reactions where note_id = $1 and user_id = '${SATYAM}' returning 1`, [note.id])).toHaveLength(0)
    expect(await as(LILY, `delete from public.note_reactions where note_id = $1 and user_id = '${LILY}' returning 1`, [note.id])).toHaveLength(1)
  })

  it('stickers must reply to a real note and use the sticker set', async () => {
    const [note] = await as<{ id: string }>(LILY, `select id from public.shared_notes where kind = 'faculty' limit 1`)
    await as(SATYAM, `insert into public.shared_notes (kind, body, reply_to) values ('sticker', '🐾', $1)`, [note.id])
    await rejects(SATYAM, `insert into public.shared_notes (kind, body, reply_to) values ('sticker', 'free text', $1)`, /check constraint/, [note.id])
  })
})

describe('points and games', () => {
  it('clients cannot write completions directly', async () => {
    await rejects(
      LILY,
      `insert into public.game_completions (user_id, activity_id, points, score) values ('${LILY}', 'latte_rescue', 30, 100)`,
      /permission denied/,
    )
    await rejects(LILY, `update public.game_activities set base_points = 20`, /permission denied/)
  })

  it('awards points once per day, then records replays for free', async () => {
    const [first] = await as<{ r: { points_awarded: number } }>(LILY, `select public.record_completion('latte_rescue', 85) as r`)
    expect(first.r.points_awarded).toBe(10)
    const [second] = await as<{ r: { points_awarded: number; already_awarded: boolean } }>(
      LILY,
      `select public.record_completion('latte_rescue', 100) as r`,
    )
    expect(second.r).toMatchObject({ points_awarded: 0, already_awarded: true })
    const [sum] = await as<{ s: number }>(LILY, `select sum(points)::int as s from public.game_completions where user_id = '${LILY}' and activity_id = 'latte_rescue'`)
    expect(sum.s).toBe(10)
  })

  it('validates activity and score range', async () => {
    await rejects(LILY, `select public.record_completion('free_money', 1)`, /activity_not_reportable/)
    await rejects(LILY, `select public.record_completion('letterbox', 1)`, /activity_not_reportable/)
    await rejects(LILY, `select public.record_completion('totally_fair_exam', 100)`, /activity_not_reportable/)
    await rejects(LILY, `select public.record_completion('latte_rescue', 101)`, /score_out_of_range/)
    await rejects(LILY, `select public.record_completion('latte_rescue', -1)`, /score_out_of_range/)
  })

  it('grades the exam server-side', async () => {
    const perfect = { q_sugohaesseoyo: 0, q_forbidden: 2, q_sock_thief: 1, q_hard_day: 1, c_optic: 0 }
    const [r] = await as<{ r: { score: number; points_awarded: number; perfect: boolean; results: unknown[] } }>(
      SATYAM,
      `select public.submit_exam($1::jsonb) as r`,
      [JSON.stringify(perfect)],
    )
    expect(r.r).toMatchObject({ score: 100, points_awarded: 15, perfect: true })
    expect(r.r.results).toHaveLength(5)

    const sloppy = { q_neural: 0, q_budget: 0, q_kaist: 0, c_vagus: null }
    const [r2] = await as<{ r: { score: number; points_awarded: number } }>(LILY, `select public.submit_exam($1::jsonb) as r`, [JSON.stringify(sloppy)])
    expect(r2.r).toMatchObject({ score: 33, points_awarded: 10 })

    await rejects(LILY, `select public.submit_exam($1::jsonb)`, /only_bonus_questions_can_be_skipped/, [
      JSON.stringify({ q_neural: null, q_budget: 0, q_kaist: 1, q_delicious: 3 }),
    ])
    await rejects(LILY, `select public.submit_exam($1::jsonb)`, /unknown_question/, [
      JSON.stringify({ q_made_up: 0, q_budget: 0, q_kaist: 1 }),
    ])
  })

  it('letterbox notes give +3 once per day', async () => {
    const [row] = await as<{ s: number }>(
      LILY,
      `select coalesce(sum(points), 0)::int as s from public.game_completions where user_id = '${LILY}' and activity_id = 'letterbox'`,
    )
    expect(row.s).toBe(3)
  })

  it('shares the constellation: 3 stars per player per day', async () => {
    const [s1] = await as<{ r: { stars_lit: number } }>(SATYAM, `select public.record_completion('observatory', 5) as r`)
    expect(s1.r.stars_lit).toBe(3)
    const [l1] = await as<{ r: { stars_lit: number } }>(LILY, `select public.record_completion('observatory', 5) as r`)
    // Lily finishes the first constellation (2) and starts the next one (1).
    expect(l1.r.stars_lit).toBe(3)
    const [s2] = await as<{ r: { stars_lit: number } }>(SATYAM, `select public.record_completion('observatory', 5) as r`)
    expect(s2.r.stars_lit).toBe(0)
    const [w] = await as<{ w: { constellations: { id: string; lit: { lit_by: string }[] }[] } }>(LILY, `select public.get_world_state() as w`)
    expect(w.w.constellations[0].lit).toHaveLength(5)
    expect(w.w.constellations[0].lit.filter((s) => s.lit_by === SATYAM)).toHaveLength(3)
    expect(w.w.constellations[1].lit).toHaveLength(1)
  })

  it('rate-limits repeated save calls', async () => {
    let error: unknown = null
    try {
      for (let i = 0; i < 15; i++) await as(SATYAM, `select public.record_completion('cafe_escape', 10)`)
    } catch (e) {
      error = e
    }
    expect(String(error)).toMatch(/slow_down/)
  })
})

describe('faculty votes', () => {
  it('hides the other vote until you vote', async () => {
    await as(LILY, `select public.cast_vote('approve')`)
    await rejects(LILY, `select public.cast_vote('reject')`, /already_voted_today/)
    const [before] = await as<{ w: { vote: { my_choice: string | null; other_choice: string | null } } }>(
      SATYAM,
      `select public.get_world_state() as w`,
    )
    expect(before.w.vote).toMatchObject({ my_choice: null, other_choice: null })
    expect(await as(SATYAM, `select * from public.faculty_votes`)).toHaveLength(0)
    await as(SATYAM, `select public.cast_vote('reject')`)
    const [after] = await as<{ w: { vote: { my_choice: string; other_choice: string } } }>(SATYAM, `select public.get_world_state() as w`)
    expect(after.w.vote).toMatchObject({ my_choice: 'reject', other_choice: 'approve' })
  })
})

describe('world state', () => {
  it('reports both players and their stars', async () => {
    const [w] = await as<{ w: { players: { role: string; stars: number }[] } }>(LILY, `select public.get_world_state() as w`)
    const lily = w.w.players.find((p) => p.role === 'lily')
    const satyam = w.w.players.find((p) => p.role === 'satyam')
    // Lily: latte 10 + exam 10 + letterbox 3 + observatory 10
    expect(lily?.stars).toBe(33)
    // Satyam: exam 15 + letterbox 3 + observatory 10 + cafe_escape 10
    expect(satyam?.stars).toBe(38)
  })

  it('validates story card ids', async () => {
    await as(LILY, `select public.mark_card_read('flower_water_incident')`)
    await as(LILY, `select public.mark_card_read('flower_water_incident')`)
    await rejects(LILY, `select public.mark_card_read('not_a_card')`, /unknown_card/)
    expect(await as(SATYAM, `select * from public.card_reads`)).toHaveLength(0)
  })
})
