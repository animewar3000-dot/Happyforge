-- Tighten metadata access to authenticated users and explicitly expose the
-- tables to the Data API. RLS remains responsible for per-user row isolation.
drop policy if exists "Users manage their own projects" on public.projects;
drop policy if exists "Users manage their own agent sessions" on public.agent_sessions;
drop policy if exists "Users manage their own provider configs" on public.provider_configs;
drop policy if exists "Users manage their own workspace refs" on public.workspace_refs;

create policy "Users manage their own projects"
  on public.projects for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users manage their own agent sessions"
  on public.agent_sessions for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users manage their own provider configs"
  on public.provider_configs for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users manage their own workspace refs"
  on public.workspace_refs for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.agent_sessions to authenticated;
grant select, insert, update, delete on public.provider_configs to authenticated;
grant select, insert, update, delete on public.workspace_refs to authenticated;
revoke all on public.projects from anon;
revoke all on public.agent_sessions from anon;
revoke all on public.provider_configs from anon;
revoke all on public.workspace_refs from anon;
