-- Keep the project foreign-key joins efficient as metadata grows.
create index if not exists agent_sessions_project_id_idx
  on public.agent_sessions (project_id);

create index if not exists workspace_refs_project_id_idx
  on public.workspace_refs (project_id);
