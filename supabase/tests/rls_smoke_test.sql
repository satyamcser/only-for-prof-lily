-- Optional manual check, run in Supabase → SQL Editor AFTER setup.
-- Everything happens inside a transaction that is rolled back: nothing changes.
--
-- Replace STRANGER_UUID with the id of a throwaway third user
-- (Authentication → Users → copy the UUID). Delete that user afterwards.

begin;

-- 1) Anonymous visitor: expect "permission denied for table shared_notes".
set local role anon;
select count(*) from public.shared_notes;
rollback;

begin;
-- 2) Signed-in stranger (not in game_players): expect 0 rows, then an RLS error.
select set_config('request.jwt.claims', json_build_object('sub', 'STRANGER_UUID', 'role', 'authenticated')::text, true);
set local role authenticated;
select count(*) as notes_visible_to_stranger from public.shared_notes;   -- expect 0
select count(*) as players_visible_to_stranger from public.game_players; -- expect 0
insert into public.shared_notes (body) values ('should fail');           -- expect RLS error
rollback;
