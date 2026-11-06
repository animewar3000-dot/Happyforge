"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Activity, ArrowUp, Bot, Boxes, Braces, ChevronDown, CircleHelp,
  Command, GitBranch, Github, HardDrive, KeyRound, Menu, MessageSquare,
  Plus, Settings2, ShieldCheck, Sparkles, Wrench, X, LoaderCircle,
  TerminalSquare, UserRound, LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Workspace", icon: Boxes },
  { label: "Agent sessions", icon: MessageSquare },
  { label: "MCP integrations", icon: Wrench },
  { label: "Skills library", icon: Sparkles },
  { label: "Models & keys", icon: KeyRound },
];

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [active, setActive] = useState("Workspace");
  const [prompt, setPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [runtimeStatus, setRuntimeStatus] = useState<"checking" | "online" | "unavailable" | "not-configured">("checking");

  useEffect(() => {
    let active = true;
    fetch("/api/agent/health", { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        if (active) setRuntimeStatus(data.connected ? "online" : data.configured ? "unavailable" : "not-configured");
      })
      .catch(() => { if (active) setRuntimeStatus("unavailable"); });
    return () => { active = false; };
  }, []);

  async function sendTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const task = prompt.trim();
    if (!task || busy) return;
    setPrompt("");
    setError("");
    setMessages(current => [...current, { role: "user", content: task }]);
    setBusy(true);
    try {
      const response = await fetch("/api/agent/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: task, sessionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The agent request failed.");
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages(current => [...current, { role: "assistant", content: data.response || "The agent completed the request but returned no text." }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected agent error.";
      setError(message);
      setMessages(current => [...current, { role: "assistant", content: "I couldn't complete that request. Check the runtime connection and server configuration." }]);
    } finally {
      setBusy(false);
    }
  }

  function newTask() {
    setMessages([]);
    setSessionId(null);
    setPrompt("");
    setError("");
    setActive("Workspace");
  }

  return (
    <main className="forge-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Command size={19} /></div>
          <div><div className="brand-name">happyforge<span>.</span></div><div className="brand-caption">AI DEVELOPMENT WORKSPACE</div></div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <button className="new-task" onClick={newTask}><Plus size={16}/> New task <span>⌘ K</span></button>
        <div className="nav-label">BUILD</div>
        <nav className="nav-list">
          {navItems.map(({label, icon: Icon}) => (
            <button key={label} onClick={() => { setActive(label); setSidebarOpen(false); }} className={`nav-item ${active === label ? "nav-active" : ""}`}>
              <Icon size={17}/><span>{label}</span>
              {label === "Workspace" && <span className="nav-dot"/>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="runtime-card">
            <div className="runtime-heading"><span className={`status-dot ${runtimeStatus === "online" ? "" : "muted"}`}/> AGENT RUNTIME</div>
            <div className="runtime-title">{runtimeStatus === "online" ? "OpenCode connected" : runtimeStatus === "checking" ? "Checking connection…" : runtimeStatus === "not-configured" ? "Runtime not configured" : "Runtime unavailable"}</div>
            <p>{runtimeStatus === "online" ? "The secured agent host is responding." : "Configure the OpenCode host URL and password to enable agent tasks."}</p>
          </div>
          <button className="nav-item"><Settings2 size={17}/> Settings</button>
          <button className="nav-item" onClick={async () => { await createClient().auth.signOut(); window.location.assign("/login"); }}><LogOut size={17}/> Sign out</button>
          <div className="profile-row"><div className="avatar">HF</div><div><strong>My workspace</strong><small>Personal environment</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"/>}

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19}/></button>
            <div className="breadcrumb">Projects <span>/</span> <strong>{sessionId ? "Agent session" : "New workspace"}</strong></div>
          </div>
          <div className="topbar-actions"><div className="connection-pill"><span className={`status-dot ${runtimeStatus === "online" ? "" : "muted"}`}/> {runtimeStatus === "online" ? "Runtime online" : runtimeStatus === "checking" ? "Checking runtime" : "Runtime offline"}</div><button className="icon-button" aria-label="Help"><CircleHelp size={18}/></button></div>
        </header>

        <div className="content-wrap">
          <div className="welcome-kicker"><Sparkles size={14}/> OPEN CODE. YOUR RULES.</div>
          <h1>Build something<br className="mobile-break"/> <span>remarkable.</span></h1>
          <p className="hero-copy">A mobile-first engineering workspace powered by the OpenCode agent engine. Give it a task, connect your model provider, and keep control of every change.</p>

          {messages.length > 0 && (
            <section className="conversation" aria-live="polite">
              <div className="conversation-heading"><TerminalSquare size={15}/> TASK SESSION <span>{sessionId ? sessionId.slice(0, 12) : "Starting..."}</span></div>
              {messages.map((message, index) => (
                <article className={`chat-message ${message.role}`} key={index}>
                  <div className="message-avatar">{message.role === "user" ? <UserRound size={15}/> : <Bot size={15}/>}</div>
                  <div className="message-body"><div className="message-role">{message.role === "user" ? "YOU" : "FORGE AGENT"}</div><p>{message.content}</p></div>
                </article>
              ))}
              {busy && <div className="working-indicator"><LoaderCircle size={15}/> OpenCode is working…</div>}
              {error && <div className="agent-error">{error}</div>}
            </section>
          )}

          <form className="composer" onSubmit={sendTask}>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask your agent to inspect code, explain a bug, or implement a feature..." rows={3} disabled={busy}/>
            <div className="composer-footer">
              <div className="composer-tools"><span className="provider-chip"><Bot size={14}/> OpenCode agent</span><span className="provider-chip"><Activity size={14}/> NVIDIA NIM</span></div>
              <button className="send-button" disabled={!prompt.trim() || busy} aria-label="Send task">{busy ? <LoaderCircle size={17} className="spin"/> : <ArrowUp size={18}/>}</button>
            </div>
          </form>
          <div className="notice"><ShieldCheck size={16}/><span>Agent execution runs on a separate secured OpenCode host. Never put API keys in frontend code or browser storage.</span></div>

          <div className="section-heading"><div><span className="eyebrow">ENGINEERING STACK</span><h2>Your workspace toolkit</h2></div><span className="muted-label">MILESTONE 1</span></div>
          <div className="tool-grid">
            <article className="tool-card"><div className="tool-icon purple"><Bot size={19}/></div><div className="tool-title">OpenCode engine</div><p>Official TypeScript SDK connects to a secured, persistent OpenCode server.</p><span className="card-status"><span className="status-dot muted"/> Integration scaffolded</span></article>
            <article className="tool-card"><div className="tool-icon green"><Activity size={19}/></div><div className="tool-title">NVIDIA NIM</div><p>OpenAI-compatible provider configuration using a server-side API key.</p><span className="card-status"><span className="status-dot muted"/> Credential required</span></article>
            <article className="tool-card"><div className="tool-icon orange"><Wrench size={19}/></div><div className="tool-title">MCP integrations</div><p>Next milestone: remote and workspace-local tools with scoped permissions.</p><span className="card-status"><span className="status-dot muted"/> Planned</span></article>
            <article className="tool-card"><div className="tool-icon blue"><Sparkles size={19}/></div><div className="tool-title">Skills library</div><p>Portable global and project-level skills discovered by the agent engine.</p><span className="card-status"><span className="status-dot muted"/> Planned</span></article>
          </div>

          <div className="bottom-grid">
            <article className="info-panel"><div className="panel-title"><GitBranch size={16}/> Workspace architecture</div><p>Git remains the source of truth. Supabase stores identity and metadata—not repository files or build output.</p><div className="architecture-tags"><span>GitHub</span><span>Linux sandbox</span><span>Supabase metadata</span></div></article>
            <article className="info-panel"><div className="panel-title"><HardDrive size={16}/> Runtime boundary</div><p>The web app calls a secured OpenCode host. Long-running agent execution stays outside Vercel functions.</p><div className="architecture-tags"><span>Node.js host</span><span>Local / cloud</span></div></article>
          </div>
          <footer>HAPPYFORGE <span>·</span> BUILT TO BE EXTENSIBLE</footer>
        </div>
      </section>
    </main>
  );
}
