# Happyforge Roadmap

## Milestone 0 — Foundation (current)
- [x] Initialize Next.js + TypeScript + Tailwind application.
- [x] Add responsive mobile-first workspace shell.
- [x] Document architecture, storage boundaries and security principles.
- [ ] Verify install/build in CI.

## Milestone 1 — Agent proof of concept
- [ ] Pin OpenCode version and integrate its SDK in a server-side service.
- [ ] Run OpenCode locally in development.
- [ ] Connect one NVIDIA NIM model through server-side credentials.
- [ ] Create an agent session and stream events to the UI.
- [ ] Demonstrate repository inspection and a safe read-only task.

**Acceptance:** From the mobile UI, ask an agent to inspect a test repository and receive streamed progress/results without exposing secrets.

## Milestone 2 — Workspace execution
- [ ] Define workspace adapter interface.
- [ ] Implement local Docker workspace for development.
- [ ] Add GitHub clone/branch workflow.
- [ ] Add shell, file read/write and test tools.
- [ ] Enforce resource and network policies.
- [ ] Add diff review and approval before push.

**Acceptance:** Agent changes files in an isolated workspace, runs tests and presents a reviewable diff.

## Milestone 3 — Identity and metadata
- [ ] Supabase Auth.
- [ ] User/project/session schema and row-level security.
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
