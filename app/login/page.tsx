"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Bot, LoaderCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (authError) throw authError;
        if (data.session) {
          window.location.assign("/");
        } else {
          setMessage("Check your inbox for the confirmation link, then return here to sign in.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        const next = searchParams.get("next");
        const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
        window.location.assign(destination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span className="auth-mark"><Bot size={21}/></span><span>happyforge<span className="brand-period">.</span></span></div>
        <div className="auth-kicker"><ShieldCheck size={14}/> YOUR WORKSPACE, YOUR CONTROL</div>
        <h1>{mode === "signin" ? "Welcome back." : "Build your account."}</h1>
        <p className="auth-copy">Sign in to access your projects, agent sessions and coding workspace.</p>

        <div className="auth-tabs">
          <button type="button" className={mode === "signin" ? "selected" : ""} onClick={() => {setMode("signin");setError("");setMessage("");}}>Sign in</button>
          <button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => {setMode("signup");setError("");setMessage("");}}>Create account</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={17} className="spin"/> : <>{mode === "signin" ? "Sign in to Happyforge" : "Create account"} <ArrowRight size={17}/></>}
          </button>
        </form>
        <p className="auth-footnote">Your account is secured by Supabase Auth. Passwords are never stored in Happyforge.</p>
      </section>
    </main>
  );
}
