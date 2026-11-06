# OpenCode + NVIDIA runtime setup

Happyforge's Next.js app is a client of a separately hosted OpenCode server. Do not launch a persistent agent process inside a Vercel Function.

## 1. Start the included local agent runtime (Docker)

The repository includes a containerized OpenCode host for local development. It binds to localhost only and mounts a dedicated `agent-workspace/` directory, not the entire application repository.

```bash
cp .env.example .env
# Edit .env and set NVIDIA_API_KEY and OPENCODE_SERVER_PASSWORD
mkdir -p agent-workspace
docker compose up --build -d
```

The compose file mounts `opencode.json` read-only into the agent workspace. Put or clone a test repository inside `agent-workspace/` for the agent to inspect. The local server is available at `http://127.0.0.1:4096`.

If Docker is unavailable, install OpenCode on a persistent Linux host using the official installer:

```bash
curl -fsSL https://opencode.ai/install | bash
opencode --version
```

Run the server from a dedicated workspace directory and ensure the OpenCode config is present there.

## 2. Configure NVIDIA NIM

Set the API key in the OpenCode host's environment. Do not commit it:

```bash
export NVIDIA_API_KEY="your-nvidia-api-key"
```

The checked-in `opencode.json` configures NVIDIA's OpenAI-compatible endpoint at `https://integrate.api.nvidia.com/v1`. The selected model ID is a starting default; verify it is currently available to your NVIDIA account and supports the tool-calling features required by your agent workflow.

NVIDIA's hosted API uses the `/v1/chat/completions` endpoint. Model availability and trial limits can change; check NVIDIA's current API catalog.

## 3. Start the authenticated OpenCode server

Run this from the configured workspace directory:

```bash
export OPENCODE_SERVER_PASSWORD="use-a-long-random-secret"
export OPENCODE_SERVER_USERNAME="opencode"
opencode serve --hostname 0.0.0.0 --port 4096
```

Place the host behind a private network, VPN, or authenticated reverse proxy. Do not expose port 4096 publicly without TLS and strict access controls. Use a separate workspace and runtime identity per user before enabling multi-user access.

## 4. Configure the Happyforge web app

The Docker Compose `.env` file is read by Docker Compose. Next.js reads `.env.local` separately. Create `.env.local` with only the web app's OpenCode connection settings:

```dotenv
OPENCODE_SERVER_URL=http://127.0.0.1:4096
OPENCODE_SERVER_USERNAME=opencode
OPENCODE_SERVER_PASSWORD=the-same-long-random-secret
```

For a deployed frontend, set these as encrypted server-side environment variables and point `OPENCODE_SERVER_URL` at a private, TLS-protected runtime endpoint. Do not put these values in `NEXT_PUBLIC_*` variables.

The NVIDIA key belongs on the OpenCode host, not in browser-exposed Next.js variables. The Next.js API route uses HTTP Basic authentication to connect to OpenCode.

## 5. Run the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, submit a short task and verify that the configured OpenCode workspace responds.

## Current proof-of-concept limits

- The first endpoint uses request/response prompting; token-by-token UI streaming is a follow-up.\n- Session IDs returned to the browser are Happyforge metadata UUIDs, not raw OpenCode session IDs.
- The server's default working directory is the workspace context. Repository selection and per-project workspace routing are not implemented yet.
- The Next.js task API requires a Supabase-authenticated user and maps browser-visible session UUIDs to OpenCode session IDs through owner-scoped `agent_sessions` rows. Cross-user session reuse is rejected. This is an initial ownership boundary, not a complete multi-tenant execution sandbox: each user must receive an isolated workspace/runtime before enabling untrusted code execution.
- Tool execution inherits the permissions and filesystem access of the OpenCode host. Use a disposable, isolated workspace for testing.
- No provider-key rotation or quota bypass is implemented.
