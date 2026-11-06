# OpenCode + NVIDIA runtime setup

Happyforge's Next.js app is a client of a separately hosted OpenCode server. Do not launch a persistent agent process inside a Vercel Function.

## 1. Install OpenCode on a persistent Linux host

Install OpenCode using the official installer:

```bash
curl -fsSL https://opencode.ai/install | bash
opencode --version
```

Use a dedicated workspace directory and copy the repository's `opencode.json` into that directory (or configure the same provider in the host's OpenCode config).

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

Set these server-side variables in local `.env.local` or your hosting provider's encrypted environment settings:

```dotenv
OPENCODE_SERVER_URL=https://your-private-opencode-host.example
OPENCODE_SERVER_USERNAME=opencode
OPENCODE_SERVER_PASSWORD=your-long-random-secret
```

The NVIDIA key belongs on the OpenCode host, not in browser-exposed Next.js variables. The Next.js API route uses HTTP Basic authentication to connect to OpenCode.

## 5. Run the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, submit a short task and verify that the configured OpenCode workspace responds.

## Current proof-of-concept limits

- The first endpoint uses request/response prompting; token-by-token UI streaming is a follow-up.
- The server's default working directory is the workspace context. Repository selection and per-project workspace routing are not implemented yet.
- There is no user authentication or tenant isolation in this proof of concept. Do not deploy it as a public multi-user service yet.
- Tool execution inherits the permissions and filesystem access of the OpenCode host. Use a disposable, isolated workspace for testing.
- No provider-key rotation or quota bypass is implemented.
