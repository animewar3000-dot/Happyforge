import { NextRequest, NextResponse } from "next/server";
import { getOpenCodeClient } from "@/lib/opencode";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT_LENGTH = 12_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to use the agent." }, { status: 401 });
  }

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
  if (sessionId !== undefined && sessionId !== null &&
      (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId))) {
    return NextResponse.json({ error: "Invalid session identifier." }, { status: 400 });
  }

  let metadataSessionId: string | null = typeof sessionId === "string" ? sessionId : null;
  let openCodeSessionId: string | null = null;

  try {
    if (metadataSessionId) {
      const { data: ownedSession, error } = await supabase
        .from("agent_sessions")
        .select("id, opencode_session_id")
        .eq("id", metadataSessionId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) throw new Error("Could not verify session ownership.");
      if (!ownedSession?.opencode_session_id) {
        return NextResponse.json({ error: "Session not found. Start a new task." }, { status: 404 });
      }
      openCodeSessionId = ownedSession.opencode_session_id;
    }

    const client = getOpenCodeClient();

    if (!openCodeSessionId) {
      const created = await client.session.create({
        body: { title: prompt.trim().slice(0, 72) },
      });
      const session = created as unknown as OpenCodeSessionResult;
      openCodeSessionId = session.data?.id ?? session.id ?? null;

      if (!openCodeSessionId) {
        throw new Error("OpenCode did not return a session identifier.");
      }

      const { data: savedSession, error } = await supabase
        .from("agent_sessions")
        .insert({
          owner_id: user.id,
          opencode_session_id: openCodeSessionId,
          title: prompt.trim().slice(0, 72),
          status: "running",
        })
        .select("id")
        .single();

      if (error || !savedSession) {
        throw new Error("Could not save the agent session.");
      }
      metadataSessionId = savedSession.id;
    } else {
      const { error } = await supabase
        .from("agent_sessions")
        .update({ status: "running" })
        .eq("id", metadataSessionId)
        .eq("owner_id", user.id);
      if (error) throw new Error("Could not update the agent session.");
    }

    const result = await client.session.prompt({
      path: { id: openCodeSessionId },
      body: { parts: [{ type: "text", text: prompt.trim() }] },
    });
    const promptResult = result as unknown as OpenCodePromptResult;
    const response = extractText(promptResult);

    await supabase
      .from("agent_sessions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", metadataSessionId)
      .eq("owner_id", user.id);

    return NextResponse.json({
      sessionId: metadataSessionId,
      response: response || "The agent finished without returning a text part.",
    });
  } catch (error) {
    if (metadataSessionId) {
      await supabase
        .from("agent_sessions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", metadataSessionId)
        .eq("owner_id", user.id);
    }

    const message = error instanceof Error ? error.message : "Unknown OpenCode error.";
    console.error("[agent/tasks]", message);
    return NextResponse.json({
      error: "Could not reach or run the OpenCode agent. Check the server URL, password, model configuration and runtime logs.",
    }, { status: 502 });
  }
}
