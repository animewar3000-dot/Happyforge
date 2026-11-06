import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.OPENCODE_SERVER_URL?.replace(/\/$/, "");
  const password = process.env.OPENCODE_SERVER_PASSWORD;
  if (!baseUrl || !password) {
    return NextResponse.json({ configured: false, connected: false });
  }

  const username = process.env.OPENCODE_SERVER_USERNAME || "opencode";
  const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  try {
    const response = await fetch(`${baseUrl}/global/health`, {
      headers: { Authorization: authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({
      configured: true,
      connected: response.ok,
      status: response.ok ? "online" : "unavailable",
    });
  } catch {
    return NextResponse.json({
      configured: true,
      connected: false,
      status: "unreachable",
    });
  }
}
