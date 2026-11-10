"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUp, Bot, Boxes, ChevronDown,
  GitBranch, HardDrive, KeyRound, Menu, MessageSquare, Plus, Settings2,
  ShieldCheck, Sparkles, Wrench, X, LoaderCircle,
  UserRound, LogOut, Search, Clock3, CheckCircle2, CircleAlert,
  FolderGit2, Zap, MoreHorizontal, ExternalLink, LockKeyhole, RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildPasswordRecoveryRedirect } from "@/lib/auth-recovery.mjs";
import { AmbientScene } from "@/components/ambient-scene";
import { HappyforgeMark } from "@/components/happyforge-mark";
import { motion } from "motion/react";

type RuntimeStatus = "checking" | "online" | "unavailable" | "not-configured";
type Project = { id: string; name: string; repository_url: string | null; default_branch: string; created_at: string };
type Session = { id: string; project_id: string | null; title: string | null; status: string; created_at: string; updated_at: string };
type ChatMessage = { role: "user" | "assistant"; content: string };
type Panel = "Workspace" | "Agent sessions" | "MCP integrations" | "Skills library" | "Models & keys" | "Projects" | "Account";

const navItems: { label: Panel; icon: typeof Boxes; group: string }[] = [
  { label: "Workspace", icon: Boxes, group: "BUILD" },
  { label: "Agent sessions", icon: MessageSquare, group: "BUILD" },
  { label: "Projects", icon: FolderGit2, group: "BUILD" },
  { label: "MCP integrations", icon: Wrench, group: "EXTEND" },
  { label: "Skills library", icon: Sparkles, group: "EXTEND" },
  { label: "Models & keys", icon: KeyRound, group: "CONFIGURE" },
  { label: "Account", icon: UserRound, group: "CONFIGURE" },
];

const statusLabel: Record<string, string> = {
  created: "Created", running: "Running", waiting_approval: "Needs approval",
  completed: "Completed", failed: "Failed", archived: "Archived",
};

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function statusTone(status: string) {
  if (status === "completed" || status === "online") return "good";
  if (status === "running") return "running";
  if (status === "failed" || status === "unavailable") return "danger";
  if (status === "waiting_approval" || status === "not-configured") return "warning";
  return "muted";
}

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`hf-badge ${tone}`}><i />{children}</span>;
}

export default function WorkspacePage() {
  const [active, setActive] = useState<Panel>("Workspace");
  const [prompt, setPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("checking");
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectRepository, setProjectRepository] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const supabase = createClient();
      const [{ data: { user }, error: authError }, projectResult, sessionResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("projects").select("id,name,repository_url,default_branch,created_at").order("updated_at", { ascending: false }),
        supabase.from("agent_sessions").select("id,project_id,title,status,created_at,updated_at").order("updated_at", { ascending: false }).limit(30),
      ]);
      if (authError || !user) throw new Error("Your session could not be verified. Please sign in again.");
      setUserEmail(user.email ?? "");
      if (projectResult.error) throw new Error("Could not load your projects. Check the projects table permissions.");
      if (sessionResult.error) throw new Error("Could not load agent sessions. Check the session table permissions.");
      setProjects((projectResult.data ?? []) as Project[]);
      setSessions((sessionResult.data ?? []) as Session[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the workspace.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  const checkRuntime = useCallback(async () => {
    try {
      const response = await fetch("/api/agent/health", { cache: "no-store" });
      const data = await response.json();
      setRuntimeStatus(data.connected ? "online" : data.configured ? "unavailable" : "not-configured");
    } catch {
      setRuntimeStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
    void checkRuntime();
  }, [loadWorkspace, checkRuntime]);

  const visibleSessions = useMemo(() => sessions.filter(session => {
    const inProject = selectedProject === "all" || session.project_id === selectedProject;
    const matches = (session.title ?? "Untitled session").toLowerCase().includes(search.toLowerCase());
    return inProject && matches;
  }), [sessions, selectedProject, search]);

  async function sendTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const task = prompt.trim();
    if (!task || busy) return;
    if (runtimeStatus !== "online") {
      setError(runtimeStatus === "not-configured" ? "The OpenCode runtime is not configured yet." : "The OpenCode runtime is currently unavailable.");
      return;
    }
    setPrompt("");
    setError("");
    setNotice("");
    setMessages(current => [...current, { role: "user", content: task }]);
    setBusy(true);
    try {
      const response = await fetch("/api/agent/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: task, sessionId, projectId: selectedProject === "all" ? null : selectedProject }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The agent request failed.");
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages(current => [...current, { role: "assistant", content: data.response || "The agent completed the request but returned no text." }]);
      setNotice("Task completed. Session metadata was saved.");
      await loadWorkspace();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected agent error.";
      setError(message);
      setMessages(current => [...current, { role: "assistant", content: "The task could not be completed. No success has been reported." }]);
    } finally {
      setBusy(false);
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectName.trim();
    if (!name || creatingProject) return;
    setCreatingProject(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in again before creating a project.");
      const { data, error: insertError } = await supabase.from("projects").insert({
        owner_id: user.id,
        name,
        repository_url: projectRepository.trim() || null,
        default_branch: "main",
      }).select("id,name,repository_url,default_branch,created_at").single();
      if (insertError || !data) throw new Error(insertError?.message || "Project could not be created.");
      setProjects(current => [data as Project, ...current]);
      setSelectedProject(data.id);
      setProjectName("");
      setProjectRepository("");
      setShowProjectForm(false);
      setNotice("Project created and saved to your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project creation failed.");
    } finally {
      setCreatingProject(false);
    }
  }

  async function deleteProject(project: Project) {
    const confirmed = window.confirm(`Delete project “${project.name}”? Its agent sessions will remain in your history.`);
    if (!confirmed) return;
    const { error: deleteError } = await createClient().from("projects").delete().eq("id", project.id);
    if (deleteError) { setError(deleteError.message); return; }
    setProjects(current => current.filter(item => item.id !== project.id));
    if (selectedProject === project.id) setSelectedProject("all");
    setNotice("Project deleted.");
  }

  function newTask() {
    setMessages([]);
    setSessionId(null);
    setSelectedSession(null);
    setPrompt("");
    setError("");
    setNotice("");
    setActive("Workspace");
    setSidebarOpen(false);
    setMobileMore(false);
  }

  async function requestPasswordReset() {
    if (!userEmail || resettingPassword) return;
    setResettingPassword(true);
    setError("");
    setNotice("");
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(userEmail, {
        redirectTo: buildPasswordRecoveryRedirect(window.location.origin),
      });
      if (resetError) throw resetError;
      setNotice(`Password reset instructions were sent to ${userEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the password reset email.");
    } finally {
      setResettingPassword(false);
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    const { error: signOutError } = await createClient().auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setSigningOut(false);
      return;
    }
    window.location.assign("/login");
  }

  function openSession(session: Session) {
    setSelectedSession(session);
    setSelectedProject(session.project_id ?? "all");
    setSessionId(session.id);
    setMessages([]);
    setActive("Agent sessions");
    setSidebarOpen(false);
  }

  const runtimeText = runtimeStatus === "online" ? "Runtime online" :
    runtimeStatus === "checking" ? "Checking runtime" :
    runtimeStatus === "not-configured" ? "Runtime not configured" : "Runtime unavailable";

  return (
    <main className="forge-shell hf-workspace">
      <AmbientScene />
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><HappyforgeMark size={29} /></div>
          <div><div className="brand-name">happyforge<span>.</span></div><div className="brand-caption">AI DEVELOPMENT WORKSPACE</div></div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <button className="new-task" onClick={newTask}><Plus size={16}/> New task <span>⌘ K</span></button>
        {["BUILD", "EXTEND", "CONFIGURE"].map(group => (
          <div key={group}>
            <div className="nav-label">{group}</div>
            <nav className="nav-list">
              {navItems.filter(item => item.group === group).map(({label, icon: Icon}) => (
                <button key={label} onClick={() => { setActive(label); setSidebarOpen(false); setMobileMore(false); }} className={`nav-item ${active === label ? "nav-active" : ""}`}>
                  <Icon size={17}/><span>{label}</span>
                  {label === "Workspace" && <span className="nav-dot"/>}
                  {label === "Agent sessions" && sessions.length > 0 && <small className="nav-count">{sessions.length}</small>}
                </button>
              ))}
            </nav>
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="runtime-card">
            <div className="runtime-heading"><span className={`status-dot ${runtimeStatus === "online" ? "" : "muted"}`}/> AGENT RUNTIME</div>
            <div className="runtime-title">{runtimeStatus === "online" ? "OpenCode connected" : runtimeStatus === "checking" ? "Checking connection…" : runtimeStatus === "not-configured" ? "Runtime not configured" : "Runtime unavailable"}</div>
            <p>{runtimeStatus === "online" ? "The secured agent host is responding." : runtimeStatus === "not-configured" ? "Execution is disabled until a secure OpenCode host is configured." : "The host did not respond. Retry the health check before running tasks."}</p>
            <button className="runtime-refresh" onClick={checkRuntime}><RefreshCw size={12}/> Recheck connection</button>
          </div>
          <button className="nav-item" onClick={() => setActive("Account")}><Settings2 size={17}/> Account settings</button>
          <button className="nav-item" onClick={signOut} disabled={signingOut}><LogOut size={17}/> {signingOut ? "Signing out…" : "Sign out"}</button>
          <div className="profile-row"><div className="avatar">{(userEmail.slice(0, 1) || "H").toUpperCase()}</div><div><strong>{userEmail || "Your workspace"}</strong><small>Signed-in account</small></div></div>
        </div>
      </aside>

      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"/>}

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19}/></button>
            <div className="breadcrumb">Happyforge <span>/</span> <strong>{active}</strong></div>
          </div>
          <div className="topbar-actions"><div className="connection-pill"><span className={`status-dot ${runtimeStatus === "online" ? "" : "muted"}`}/> {runtimeText}</div><button className="icon-button" aria-label="Refresh workspace" onClick={loadWorkspace}><RefreshCw size={16}/></button></div>
        </header>

        <div className="content-wrap hf-content">
          {error && <div className="hf-alert error"><CircleAlert size={16}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={15}/></button></div>}
          {notice && <div className="hf-alert success"><CheckCircle2 size={16}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={15}/></button></div>}

          {active === "Workspace" && (
            <>
              <div className="hf-workspace-toolbar">
                <label className="hf-project-select"><FolderGit2 size={15}/><select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} aria-label="Select project"><option value="all">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><ChevronDown size={14}/></label>
                <span className="hf-toolbar-spacer"/>
                <Badge tone={statusTone(runtimeStatus)}>{runtimeText}</Badge>
                <button className="hf-quiet-button" onClick={loadWorkspace}><RefreshCw size={14}/> Refresh</button>
              </div>
              <motion.div className="welcome-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}><Sparkles size={14}/> YOUR IDE. YOUR AGENT. YOUR RULES.</motion.div>
              <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>What would you like<br className="mobile-break"/> <span>to build today?</span></motion.h1>
              <motion.p className="hero-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}>Give your agent a clear outcome. Happyforge keeps the conversation and project context close while execution happens on your secured runtime.</motion.p>

              <form className="composer" onSubmit={sendTask}>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe a bug, feature, refactor, or question for your agent…" rows={4} disabled={busy} maxLength={12000}/>
                <div className="hf-prompt-hints"><button type="button" onClick={() => setPrompt("Inspect the project structure and explain the main application flow.")}>Explore codebase</button><button type="button" onClick={() => setPrompt("Find the most likely cause of the failing behavior and explain the fix before editing.")}>Investigate a bug</button><button type="button" onClick={() => setPrompt("Add focused tests for the core application flows.")}>Write tests</button></div>
                <div className="composer-footer">
                  <div className="composer-tools"><span className="provider-chip"><Bot size={14}/> OpenCode agent</span><span className="provider-chip"><Activity size={14}/> NVIDIA NIM</span></div>
                  <button className="send-button" disabled={!prompt.trim() || busy || runtimeStatus !== "online"} aria-label="Send task">{busy ? <LoaderCircle size={17} className="spin"/> : <ArrowUp size={18}/>}</button>
                </div>
                {runtimeStatus !== "online" && <p className="hf-runtime-note">{runtimeStatus === "checking" ? "Checking the secured runtime…" : runtimeStatus === "not-configured" ? "Task execution is disabled because the OpenCode host is not configured." : "Task execution is paused because the OpenCode host is unreachable."}</p>}
              </form>
              {messages.length > 0 && <section className="hf-conversation" aria-live="polite"><div className="section-heading"><div><span className="eyebrow">CURRENT TASK</span><h2>Agent conversation</h2></div><button className="hf-text-link" onClick={() => setMessages([])}>Clear</button></div>{messages.map((message, index) => <article className={`hf-message ${message.role}`} key={`${index}-${message.role}`}><strong>{message.role === "user" ? "You" : "Happyforge agent"}</strong><p>{message.content}</p></article>)}</section>}
              <div className="notice"><ShieldCheck size={16}/><span>Your prompts are sent to the secured OpenCode host. Provider credentials remain server-side and are never stored in browser state.</span></div>

              <div className="section-heading"><div><span className="eyebrow">YOUR PROJECTS</span><h2>Pick up where you left off</h2></div><button className="hf-text-link" onClick={() => setActive("Projects")}>View projects <ArrowUp size={13}/></button></div>
              {loadingData ? <div className="hf-loading"><LoaderCircle className="spin" size={18}/> Loading your workspace…</div> :
                projects.length ? <div className="hf-project-grid">{projects.slice(0, 3).map(project => (
                  <button className={`hf-project-card ${selectedProject === project.id ? "selected" : ""}`} key={project.id} onClick={() => setSelectedProject(project.id)}>
                    <div className="hf-project-card-top"><span className="hf-project-symbol"><FolderGit2 size={17}/></span><span className="hf-branch"><GitBranch size={12}/>{project.default_branch || "main"}</span></div>
                    <strong>{project.name}</strong>
                    <small>{project.repository_url || "No repository connected"}</small>
                  </button>
                ))}</div> : <div className="hf-empty"><FolderGit2 size={21}/><strong>Your first project starts here</strong><span>No project records exist yet. Create a project record to organize agent sessions.</span><button onClick={() => setActive("Projects")}>Open projects</button></div>}

              <div className="section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Agent sessions</h2></div><button className="hf-text-link" onClick={() => { setActive("Agent sessions"); setSelectedSession(null); }}>All sessions <ArrowUp size={13}/></button></div>
              {loadingData ? <div className="hf-loading"><LoaderCircle className="spin" size={18}/> Loading sessions…</div> :
                sessions.filter(s => selectedProject === "all" || s.project_id === selectedProject).length ?
                <div className="hf-session-list">{sessions.filter(s => selectedProject === "all" || s.project_id === selectedProject).slice(0, 5).map(session => (
                  <button className="hf-session-row" key={session.id} onClick={() => openSession(session)}>
                    <span className="hf-session-icon"><MessageSquare size={16}/></span><span className="hf-session-copy"><strong>{session.title || "Untitled session"}</strong><small>Updated {dateLabel(session.updated_at)}</small></span><Badge tone={statusTone(session.status)}>{statusLabel[session.status] || session.status}</Badge>
                  </button>
                ))}</div> : <div className="hf-empty compact"><MessageSquare size={19}/><strong>No sessions yet</strong><span>Run your first task above. A real session will appear here.</span></div>}

              <div className="section-heading"><div><span className="eyebrow">CONNECTED FOUNDATION</span><h2>Workspace toolkit</h2></div></div>
              <div className="tool-grid">
                <motion.article className="tool-card"><div className="tool-icon purple"><Bot size={19}/></div><div className="tool-title">OpenCode engine</div><p>Secure agent execution through the configured OpenCode host.</p><span className="card-status"><span className={`status-dot ${runtimeStatus === "online" ? "" : "muted"}`}/> {runtimeStatus === "online" ? "Connected" : runtimeStatus === "not-configured" ? "Not configured" : "Unavailable"}</span></motion.article>
                <motion.article className="tool-card"><div className="tool-icon green"><Activity size={19}/></div><div className="tool-title">NVIDIA NIM</div><p>Model provider is handled by the secured OpenCode server configuration.</p><span className="card-status"><span className="status-dot muted"/> Managed on runtime host</span></motion.article>
                <motion.article className="tool-card"><div className="tool-icon orange"><Wrench size={19}/></div><div className="tool-title">MCP integrations</div><p>Remote and local tools with scoped permissions.</p><span className="card-status"><span className="status-dot muted"/> Integration UI coming next</span></motion.article>
                <motion.article className="tool-card"><div className="tool-icon blue"><Sparkles size={19}/></div><div className="tool-title">Skills library</div><p>Reusable global and project instructions for agent workflows.</p><span className="card-status"><span className="status-dot muted"/> Skills UI coming next</span></motion.article>
              </div>
            </>
          )}

          {active === "Agent sessions" && (
            <section className="hf-panel-page">
              <div className="hf-page-heading"><div><span className="eyebrow">EXECUTION HISTORY</span><h1>Agent <span>sessions.</span></h1><p className="hero-copy">A real history of tasks saved to your Happyforge account.</p></div><button className="new-task hf-page-action" onClick={newTask}><Plus size={15}/> New task</button></div>
              <div className="hf-list-tools"><label><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your sessions…"/></label><select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}><option value="all">All projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              {loadingData ? <div className="hf-loading"><LoaderCircle className="spin" size={18}/> Loading sessions…</div> : visibleSessions.length ? <div className="hf-session-list">{visibleSessions.map(session => (
                <button key={session.id} className={`hf-session-row ${selectedSession?.id === session.id ? "selected" : ""}`} onClick={() => openSession(session)}>
                  <span className="hf-session-icon"><MessageSquare size={16}/></span><span className="hf-session-copy"><strong>{session.title || "Untitled session"}</strong><small>Created {dateLabel(session.created_at)} · Updated {dateLabel(session.updated_at)}</small></span><Badge tone={statusTone(session.status)}>{statusLabel[session.status] || session.status}</Badge>
                </button>
              ))}</div> : <div className="hf-empty"><MessageSquare size={22}/><strong>No matching sessions</strong><span>Try another search or start a new agent task.</span><button onClick={newTask}>Start a task</button></div>}
              {selectedSession && <div className="hf-session-detail"><div className="hf-detail-head"><div><span className="eyebrow">SESSION DETAILS</span><h2>{selectedSession.title || "Untitled session"}</h2></div><Badge tone={statusTone(selectedSession.status)}>{statusLabel[selectedSession.status] || selectedSession.status}</Badge></div><p><Clock3 size={14}/> Created {dateLabel(selectedSession.created_at)} · Last updated {dateLabel(selectedSession.updated_at)}</p><p className="hf-detail-hint">Saved session metadata is available. Full message transcript and live step streaming are not yet exposed by the current backend.</p></div>}
            </section>
          )}

          {active === "Projects" && (
            <section className="hf-panel-page"><div className="hf-page-heading"><div><span className="eyebrow">PROJECT ORGANIZATION</span><h1>Your <span>projects.</span></h1><p className="hero-copy">Projects group your agent sessions and repository context.</p></div><button className="new-task hf-page-action" onClick={() => setShowProjectForm(value => !value)}><Plus size={15}/> New project</button></div>
              {showProjectForm && <form className="hf-project-form" onSubmit={createProject}><label>Project name<input value={projectName} onChange={event => setProjectName(event.target.value)} required maxLength={80} placeholder="e.g. CampusIQ"/></label><label>Git repository URL <span>(optional)</span><input value={projectRepository} onChange={event => setProjectRepository(event.target.value)} type="url" placeholder="https://github.com/you/repository"/></label><div><button type="button" className="hf-quiet-button" onClick={() => setShowProjectForm(false)}>Cancel</button><button type="submit" className="new-task" disabled={!projectName.trim() || creatingProject}>{creatingProject ? "Creating…" : "Create project"}</button></div></form>}
              {loadingData ? <div className="hf-loading"><LoaderCircle className="spin" size={18}/> Loading projects…</div> : projects.length ? <div className="hf-project-grid full">{projects.map(project => <article className={`hf-project-card ${selectedProject === project.id ? "selected" : ""}`} key={project.id}><div className="hf-project-card-top"><span className="hf-project-symbol"><FolderGit2 size={17}/></span><span className="hf-branch"><GitBranch size={12}/>{project.default_branch || "main"}</span></div><strong>{project.name}</strong><small>{project.repository_url || "No repository connected"}</small><div className="hf-project-actions"><button onClick={() => {setSelectedProject(project.id);setActive("Workspace");}}>Use project</button><button className="danger" onClick={() => void deleteProject(project)}>Delete</button></div></article>)}</div> : <div className="hf-empty"><FolderGit2 size={23}/><strong>No project records yet</strong><span>The current database stores project metadata. GitHub repository import and synchronization are separate integration steps.</span></div>}
              <div className="hf-info-strip"><ShieldCheck size={16}/><span>Projects and sessions are scoped to your authenticated Supabase user through Row Level Security.</span></div>
            </section>
          )}

          {active === "MCP integrations" && (
            <section className="hf-panel-page"><div className="hf-page-heading"><div><span className="eyebrow">EXTENSIBILITY</span><h1>Tool <span>connections.</span></h1><p className="hero-copy">Connect the systems your agent is allowed to use.</p></div></div><div className="hf-feature-grid"><article className="hf-feature-card"><div className="tool-icon purple"><GitBranch size={19}/></div><strong>GitHub</strong><p>Repository access, branches, commits and pull requests.</p><Badge tone="warning">Connection UI upcoming</Badge></article><article className="hf-feature-card"><div className="tool-icon green"><Boxes size={19}/></div><strong>Supabase</strong><p>Database inspection and controlled schema workflows.</p><Badge tone="good">Platform connected</Badge></article><article className="hf-feature-card"><div className="tool-icon blue"><HardDrive size={19}/></div><strong>Workspace filesystem</strong><p>Agent access to project files through the runtime host.</p><Badge tone="warning">Runtime-dependent</Badge></article><article className="hf-feature-card"><div className="tool-icon orange"><ExternalLink size={19}/></div><strong>Web research</strong><p>Controlled external documentation and web lookup tools.</p><Badge tone="warning">Connection UI upcoming</Badge></article></div></section>
          )}

          {active === "Skills library" && (
            <section className="hf-panel-page"><div className="hf-page-heading"><div><span className="eyebrow">REUSABLE KNOWLEDGE</span><h1>Skills <span>library.</span></h1><p className="hero-copy">Reusable instructions that shape how your coding agent works.</p></div></div><div className="hf-empty"><Sparkles size={24}/><strong>Skill management is the next module</strong><span>The supplied prototype sample skills were not connected to persistent storage. This page shows the implementation boundary rather than fabricated installed skills.</span></div></section>
          )}

          {active === "Models & keys" && (
            <section className="hf-panel-page"><div className="hf-page-heading"><div><span className="eyebrow">PROVIDER CONFIGURATION</span><h1>Models <span>& keys.</span></h1><p className="hero-copy">Model credentials are managed by the secured runtime—not by the browser.</p></div></div><div className="hf-feature-grid"><article className="hf-feature-card wide"><div className="tool-icon green"><Zap size={19}/></div><strong>NVIDIA NIM</strong><p>The workspace sends tasks to OpenCode. Provider/model selection and API keys are configured on that secured host. No key is stored in local state, local storage, or frontend-visible Supabase rows.</p><Badge tone="warning">Runtime host configuration</Badge></article><article className="hf-feature-card"><div className="tool-icon purple"><LockKeyhole size={19}/></div><strong>Credential safety</strong><p>Secrets must remain server-side and should never be displayed again after saving.</p><Badge tone="good">Browser-safe</Badge></article></div></section>
          )}

          {active === "Account" && (
            <section className="hf-panel-page"><div className="hf-page-heading"><div><span className="eyebrow">IDENTITY & SECURITY</span><h1>Your <span>account.</span></h1><p className="hero-copy">Signed-in identity and account security.</p></div></div><div className="hf-account-card"><div className="avatar large">{(userEmail.slice(0,1)||"H").toUpperCase()}</div><div><strong>{userEmail || "Authenticated account"}</strong><small>Authenticated by Supabase Auth</small></div><Badge tone="good">Verified session</Badge></div><div className="hf-feature-grid"><article className="hf-feature-card"><div className="tool-icon blue"><ShieldCheck size={19}/></div><strong>Session security</strong><p>Workspace access is protected by Supabase Auth cookies and server-side identity checks.</p></article><article className="hf-feature-card"><div className="tool-icon orange"><KeyRound size={19}/></div><strong>Password recovery</strong><p>Use the existing login recovery flow to reset your password securely.</p><button onClick={() => void requestPasswordReset()} disabled={resettingPassword || !userEmail}>{resettingPassword ? "Sending reset email…" : "Send password reset email"}</button></article></div><button className="hf-signout" onClick={signOut} disabled={signingOut}><LogOut size={16}/>{signingOut ? "Signing out…" : "Sign out"}</button></section>
          )}
          <footer>HAPPYFORGE <span>·</span> BUILT TO BE EXTENSIBLE</footer>
        </div>
      </section>

      <nav className="hf-mobile-nav" aria-label="Workspace navigation">
        <button className={active === "Workspace" ? "active" : ""} onClick={() => setActive("Workspace")}><Boxes size={18}/><span>Home</span></button>
        <button className={active === "Agent sessions" ? "active" : ""} onClick={() => setActive("Agent sessions")}><MessageSquare size={18}/><span>Sessions</span></button>
        <button className={active === "Projects" ? "active" : ""} onClick={() => setActive("Projects")}><FolderGit2 size={18}/><span>Projects</span></button>
        <button className={mobileMore ? "active" : ""} onClick={() => setMobileMore(value => !value)}><MoreHorizontal size={18}/><span>More</span></button>
      </nav>
      {mobileMore && <div className="hf-mobile-more">{navItems.filter(item => !["Workspace", "Agent sessions", "Projects"].includes(item.label)).map(({label, icon: Icon}) => <button key={label} onClick={() => {setActive(label);setMobileMore(false);}}><Icon size={17}/>{label}</button>)}</div>}
    </main>
  );
}
