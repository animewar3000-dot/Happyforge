"use client";

import { useState } from "react";
import {
  Activity, ArrowUp, Bot, Boxes, Braces, ChevronDown, CircleHelp,
  Command, GitBranch, Github, HardDrive, KeyRound, Menu, MessageSquare,
  Plus, Settings2, ShieldCheck, Sparkles, Terminal, Wrench, X
} from "lucide-react";

const navItems = [
  { label: "Workspace", icon: Boxes },
  { label: "Agent sessions", icon: MessageSquare },
  { label: "MCP integrations", icon: Wrench },
  { label: "Skills library", icon: Sparkles },
  { label: "Models & keys", icon: KeyRound },
];

export default function Home() {
  const [active, setActive] = useState("Workspace");
  const [prompt, setPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="forge-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Command size={19} /></div>
          <div><div className="brand-name">happyforge<span>.</span></div><div className="brand-caption">AI DEVELOPMENT WORKSPACE</div></div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <button className="new-task"><Plus size={16}/> New task <span>⌘ K</span></button>
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
            <div className="runtime-heading"><span className="status-dot"/> SYSTEM STATUS</div>
            <div className="runtime-title">Foundation mode</div>
            <p>Agent runtime is not connected yet. Your workspace shell is ready.</p>
          </div>
          <button className="nav-item"><Settings2 size={17}/> Settings</button>
          <div className="profile-row"><div className="avatar">HF</div><div><strong>My workspace</strong><small>Personal environment</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"/>}

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19}/></button>
            <div className="breadcrumb">Projects <span>/</span> <strong>New workspace</strong></div>
          </div>
          <div className="topbar-actions"><div className="connection-pill"><span className="status-dot muted"/> Runtime offline</div><button className="icon-button" aria-label="Help"><CircleHelp size={18}/></button></div>
        </header>

        <div className="content-wrap">
          <div className="welcome-kicker"><Sparkles size={14}/> YOUR DEVELOPMENT, REIMAGINED</div>
          <h1>What are we<br className="mobile-break"/> building <span>today?</span></h1>
          <p className="hero-copy">One workspace for thoughtful AI-assisted engineering. Bring your repository, choose your models, and give your agents the tools to build.</p>

          <div className="composer">
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe a task, explore an idea, or ask your agent to work on a repository..." rows={3}/>
            <div className="composer-footer">
              <div className="composer-tools"><button><Github size={15}/> Connect repository</button><button><Braces size={15}/> Agent <ChevronDown size={13}/></button></div>
              <button className="send-button" disabled={!prompt.trim()} aria-label="Send task"><ArrowUp size={18}/></button>
            </div>
          </div>
          <div className="notice"><ShieldCheck size={16}/><span>Safe by design. Workspace execution and repository write access will require explicit setup and permissions.</span></div>

          <div className="section-heading"><div><span className="eyebrow">GETTING STARTED</span><h2>Your workspace toolkit</h2></div><span className="muted-label">FOUNDATION 0.1</span></div>
          <div className="tool-grid">
            <article className="tool-card"><div className="tool-icon purple"><Bot size={19}/></div><div className="tool-title">OpenCode engine</div><p>Agent sessions, planning, file tools and execution orchestration.</p><span className="card-status"><span className="status-dot muted"/> Not connected</span></article>
            <article className="tool-card"><div className="tool-icon green"><Activity size={19}/></div><div className="tool-title">Model providers</div><p>NVIDIA NIM first, with room for other compatible providers.</p><span className="card-status"><span className="status-dot muted"/> Setup pending</span></article>
            <article className="tool-card"><div className="tool-icon orange"><Wrench size={19}/></div><div className="tool-title">MCP integrations</div><p>Connect remote and workspace-local tools with scoped permissions.</p><span className="card-status"><span className="status-dot muted"/> No servers added</span></article>
            <article className="tool-card"><div className="tool-icon blue"><Sparkles size={19}/></div><div className="tool-title">Skills library</div><p>Reusable project instructions and workflows in portable skill packages.</p><span className="card-status"><span className="status-dot muted"/> Library empty</span></article>
          </div>

          <div className="bottom-grid">
            <article className="info-panel"><div className="panel-title"><GitBranch size={16}/> Workspace architecture</div><p>Code lives in a Git-backed workspace. Supabase stores identity and metadata—not your repository or build output.</p><div className="architecture-tags"><span>GitHub</span><span>Linux sandbox</span><span>Supabase metadata</span></div></article>
            <article className="info-panel"><div className="panel-title"><HardDrive size={16}/> Execution strategy</div><p>Cloud execution first, with an optional local bridge for Android/Termux and desktop environments.</p><div className="architecture-tags"><span>Cloud</span><span>Local (planned)</span></div></article>
          </div>
          <footer>HAPPYFORGE <span>·</span> BUILT TO BE EXTENSIBLE</footer>
        </div>
      </section>
    </main>
  );
}