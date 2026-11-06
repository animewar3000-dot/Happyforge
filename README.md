# Happyforge — Project Forge

A mobile-first, extensible AI software engineering workspace. The product direction is to combine the OpenCode agent engine with a custom mobile interface, provider routing, MCP integrations, portable skills, and isolated local/cloud workspaces.

> **Status:** OpenCode integration scaffold. The mobile task composer calls a secured OpenCode server through a server-side SDK client. A configured runtime and NVIDIA credential are still required for end-to-end execution.

## Product principles

- **OpenCode is the agent engine**, not a replacement UI.
- **Supabase stores identity and metadata**, not source repositories or build artifacts.
- **Git is the source of truth** for project code; object storage is optional for large artifacts and snapshots.
- **Execution is isolated** in a workspace runtime, never in Vercel request handlers.
- **Providers are pluggable**. NVIDIA is an initial provider, not a hard dependency.
- **MCP and skills are first-class extension points** with explicit permissions.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth + Postgres for identity and metadata
- OpenCode SDK/server for agent sessions and tools
- NVIDIA NIM and other permitted model providers
- GitHub for repository integration
- Isolated Linux workspaces for terminal and filesystem operations

## Local development

1. Install Node.js 20.9+.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in values as integrations are implemented.
4. Start the app: `npm run dev`
5. Open http://localhost:3000

## Security baseline

Never expose provider API keys, Supabase service-role keys, OpenCode server credentials, or workspace credentials to the browser. Do not expose an unauthenticated OpenCode server to the public internet. Execute agent commands only in isolated workspaces with resource limits and permission checks.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
