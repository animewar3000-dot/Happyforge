import { createOpencodeClient } from "@opencode-ai/sdk";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

export function getOpenCodeClient() {
  const baseUrl = requiredEnv("OPENCODE_SERVER_URL").replace(/\/$/, "");
  const username = process.env.OPENCODE_SERVER_USERNAME || "opencode";
  const password = requiredEnv("OPENCODE_SERVER_PASSWORD");
  const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  const authenticatedFetch: typeof fetch = (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", authorization);
    return fetch(input, { ...init, headers });
  };

  return createOpencodeClient({
    baseUrl,
    fetch: authenticatedFetch,
    throwOnError: true,
  });
}
