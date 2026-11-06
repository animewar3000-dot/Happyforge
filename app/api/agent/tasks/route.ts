import { NextRequest, NextResponse } from "next/server";
import { getOpenCodeClient } from "@/lib/opencode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT_LENGTH = 12_000;

type OpenCodeSessionResult = {
  data?: { id?: string };
  id?: string;
};

type OpenCodePromptResult = {
  data?: { parts?: Array<{ type?: string; text?: string }> };
  parts?: Array<{ type?: string; text?: string }>;
};

function extractText(result: OpenCodePromptResult): string {
  const parts = result.data?.parts ?? result.parts ?? [];
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
  }

  const { prompt, sessionId } = body as { prompt?: unknown; sessionId?: unknown };
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Enter a task for the agent." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: `Prompt exceeds the ${MAX_PROMPT_LENGTH} character limit.` }, { status: 413 });
  }
  if (sessionId !== undefined && (typeof sessionId !== "string" || sessionId.length > 200)) {
    return NextResponse.json({ error: "Invalid session identifier." }, { status: 400 });
  }

  try {
    const client = getOpenCodeClient();
    let activeSessionId = sessionId as string | undefined;

    if (!activeSessionId) {
      const created = await client.session.create({
        body: { title: prompt.trim().slice(0, 72) },
      });
      const session = created as unknown as OpenCodeSessionResult;
      activeSessionId = session.data?.id ?? session.id;
    }

    if (!activeSessionId) {
      throw new Error("OpenCode did not return a session identifier.");
    }

    const result = await client.session.prompt({
      path: { id: activeSessionId },
      body: { parts: [{ type: "text", text: prompt.trim() }] },
    });
    const promptResult = result as unknown as OpenCodePromptResult;
    const response = extractText(promptResult);

    return NextResponse.json({
      sessionId: activeSessionId,
      response: response || "The agent finished without returning a text part.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenCode error.";
    console.error("[agent/tasks]", message);
    return NextResponse.json({
      error: "Could not reach or run the OpenCode agent. Check the server URL, password, model configuration and runtime logs.",
    }, { status: 502 });
  }
}
