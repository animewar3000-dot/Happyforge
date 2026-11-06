"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Check, Eye, EyeOff, Fingerprint, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, TerminalSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode,setMode]=useState<"signin"|"signup">("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const strength=useMemo(()=>[password.length>=8,/[A-Z]/.test(password),/[0-9]/.test(password),/[^A-Za-z0-9]/.test(password)].filter(Boolean).length,[password]);

  function changeMode(next:"signin"|"signup") {
    setMode(next);setError("");setMessage("");setPassword("");setShowPassword(false);
  }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try {
      const supabase=createClient();
      if(mode==="signup") {
        const {data,error:authError}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}});
        if(authError)throw authError;
        if(data.session)window.location.assign("/workspace");
        else setMessage("Your account is almost ready. Check your inbox for the confirmation link, then come back to sign in.");
      } else {
        const {error:authError}=await supabase.auth.signInWithPassword({email,password});
        if(authError)throw authError;
        const next=new URLSearchParams(window.location.search).get("next");
        const destination=next?.startsWith("/")&&!next.startsWith("//")?next:"/workspace";
        window.location.assign(destination);
      }
    } catch(err) {setError(err instanceof Error?err.message:"Authentication failed. Please try again.");}
    finally {setBusy(false);}
  }

  return <main className="auth-shell">
    <div className="auth-atmosphere" aria-hidden="true"><span className="auth-orbit orbit-a"/><span className="auth-orbit orbit-b"/><span className="auth-orbit orbit-c"/><span className="auth-glow"/></div>
    <Link href="/" className="auth-back"><ArrowLeft size={15}/> <span>Back to Happyforge</span></Link>
    <div className="auth-layout">
      <aside className="auth-story">
        <Link href="/" className="auth-brand"><span className="auth-mark"><Bot size={22}/></span><span>happyforge<span className="brand-period">.</span></span></Link>
        <div className="auth-story-copy">
          <div className="auth-kicker"><span className="auth-live-dot"/> YOUR WORKSPACE, YOUR CONTROL</div>
          <h1>{mode==="signin"?<>Good to have<br/>you <span>back.</span></>:<>Make room<br/>for <span>what's next.</span></>}</h1>
          <p>{mode==="signin"?"Pick up where your ideas left off. Your projects and agent sessions are right where you need them.":"One workspace for your projects, your tools and the ideas you’re ready to build."}</p>
        </div>
        <div className="auth-terminal" aria-label="Happyforge workspace preview">
          <div className="auth-terminal-top"><span><i/><i/><i/></span><small><TerminalSquare size={12}/> HAPPYFORGE / WORKSPACE</small><span className="terminal-lock"><LockKeyhole size={12}/> PRIVATE</span></div>
          <div className="auth-terminal-body"><div className="terminal-line"><span>01</span><b>agent</b><em>ready to build</em></div><div className="terminal-line"><span>02</span><b>project</b><em>your code, your rules</em></div><div className="terminal-line"><span>03</span><b>session</b><em className="terminal-active">awaiting you_</em></div></div>
          <div className="auth-terminal-foot"><span className="terminal-pulse"/> Secure workspace connection <span>ENCRYPTED</span></div>
        </div>
        <div className="auth-trust"><span><ShieldCheck size={15}/> Supabase-secured identity</span><span><Fingerprint size={15}/> Your credentials stay private</span></div>
      </aside>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-head"><div className="auth-mobile-brand"><span className="auth-mark"><Bot size={20}/></span><b>happyforge<span className="brand-period">.</span></b></div><span className="auth-step"><Sparkles size={13}/> YOUR NEXT CHAPTER</span></div>
        <div className="auth-form-heading"><div className="auth-kicker"><ShieldCheck size={14}/> {mode==="signin"?"SECURE SIGN IN":"GET STARTED"}</div>
          <h2 id="auth-title">{mode==="signin"?"Welcome back.":"Create your account."}</h2>
          <p>{mode==="signin"?"Sign in to open your workspace.":"Set up your account and start building with Happyforge."}</p>
        </div>
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button type="button" role="tab" aria-selected={mode==="signin"} className={mode==="signin"?"selected":""} onClick={()=>changeMode("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode==="signup"} className={mode==="signup"?"selected":""} onClick={()=>changeMode("signup")}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="email">Email address</label>
          <div className="auth-input-wrap"><Mail size={17}/><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
          <div className="auth-password-label"><label htmlFor="password">Password</label>{mode==="signup"&&<span>8+ characters</span>}</div>
          <div className="auth-input-wrap"><LockKeyhole size={17}/><input id="password" type={showPassword?"text":"password"} autoComplete={mode==="signin"?"current-password":"new-password"} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button className="auth-eye" type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
          {mode==="signup"&&<div className="auth-strength" aria-label={`Password strength: ${strength} of 4`}><div className="auth-strength-bars">{[0,1,2,3].map(n=><i key={n} className={strength>n?"filled":""}/>)}</div><span>{password.length===0?"Use a strong password":strength<=1?"Needs more strength":strength<=3?"Looking good":"Strong password"}</span></div>}
          {error&&<p className="auth-error" role="alert">{error}</p>}{message&&<p className="auth-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy?<><LoaderCircle size={17} className="spin"/> {mode==="signin"?"Signing you in…":"Creating your account…"}</>:<>{mode==="signin"?"Sign in to Happyforge":"Create my account"} <ArrowRight size={18}/></>}</button>
        </form>
        <div className="auth-divider"><span/> <small>BUILT FOR YOUR WORKFLOW</small> <span/></div>
        <div className="auth-benefits"><span><Check size={14}/> Projects in one place</span><span><Check size={14}/> Agent sessions, ready when you are</span></div>
        <p className="auth-footnote"><ShieldCheck size={13}/> Your account is secured by Supabase Auth. Passwords are never stored in Happyforge.</p>
      </section>
    </div>
    <footer className="auth-page-footer"><span>HAPPYFORGE © 2026</span><span>YOUR IDE. YOUR AGENT. YOUR RULES.</span></footer>
  </main>;
}
