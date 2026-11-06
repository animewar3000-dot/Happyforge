# Happyforge Roadmap

## Milestone 0 — Foundation
- [x] Initialize Next.js + TypeScript + Tailwind application.
- [x] Add responsive mobile-first workspace shell.
- [x] Document architecture, storage boundaries and security principles.
- [x] Add CI workflow.

## Milestone 1 — OpenCode + NVIDIA proof of concept (in progress)
- [x] Add official OpenCode TypeScript SDK dependency.
- [x] Add authenticated server-side OpenCode client.
- [x] Add task API endpoint and session reuse.
- [x] Add NVIDIA NIM custom-provider configuration.
- [x] Add runtime setup documentation.
- [x] Connect the mobile task composer to the agent API.
- [ ] Install dependencies and verify typecheck/build in a real runtime.
- [ ] Start an OpenCode host with a valid NVIDIA credential.
- [ ] Verify one end-to-end prompt against a real workspace.
- [ ] Add streamed events and visible tool activity.

**Acceptance:** From the mobile UI, submit a task to a secured OpenCode host and receive the agent's response without exposing secrets.

## Milestone 2 — Workspace execution
- [ ] Define workspace adapter interface.
- [ ] Implement isolated Linux workspace provisioning.
- [ ] Add GitHub clone/branch workflow.
- [ ] Add shell, file read/write and test tools.
- [ ] Enforce resource and network policies.
- [ ] Add diff review and approval before push.

## Milestone 3 — Identity and metadata
- [x] Supabase Auth client, email/password sign-in, sign-up and PKCE callback scaffold.
- [x] User/project/session metadata schema and row-level security.
- [x] Explicit authenticated-only Data API grants and owner-scoped policies.
- [ ] Configure deployed app URL, publishable key and Auth redirect URLs.
- [ ] Verify live sign-up, email confirmation, sign-in and sign-out.
- [ ] Secure provider credential storage.
- [ ] Workspace ownership and authorization.
- [ ] Usage and quota accounting.

## Milestone 4 — MCP and skills
- [ ] MCP registry and connection lifecycle.
- [ ] Remote MCP support.
- [ ] Workspace-local MCP support.
- [ ] Per-project MCP allowlists and tool approvals.
- [ ] Skill package format and discovery.
- [ ] Global and project-level skills.

## Milestone 5 — Product workflows
- [ ] GitHub App/OAuth integration.
- [ ] Branch, commit and pull-request workflows.
- [ ] Session history and resumability.
- [ ] Multi-provider model router.
- [ ] Multiple concurrent agent sessions.
- [ ] Artifact storage adapter (R2/S3).

## Milestone 6 — Deployment and multi-user hardening
- [ ] Deploy frontend and control plane separately.
- [ ] Isolated per-user/per-workspace execution.
- [ ] Rate limits, audit events and abuse controls.
- [ ] Automated tests and dependency scanning.
- [ ] Backups, observability and incident procedures.

## Non-goals for the first MVP
- Unlimited free cloud execution.
- Key rotation to bypass model quotas.
- Arbitrary untrusted MCP servers without isolation.
- Running the full cloud agent server inside Android or Vercel Functions.
