"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    void createClient().auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      setAuthorized(!authError && Boolean(data.user));
      setChecking(false);
    }).catch(() => {
      if (!active) return;
      setAuthorized(false);
      setChecking(false);
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setComplete(true);
      setPassword("");
      setConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your password could not be updated. Request a new reset link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell auth-modern-shell">
      <section className="auth-card" aria-labelledby="password-title">
        <Link href="/" className="auth-brand"><span className="auth-mark"><Bot size={22} /></span><span>happyforge<span className="brand-period">.</span></span></Link>
        <div className="auth-kicker"><ShieldCheck size={14} /> ACCOUNT SECURITY</div>
        <h1 id="password-title">Set a new password.</h1>
        <p className="auth-copy">Choose a strong password to secure your Happyforge account.</p>
        {checking && <p className="auth-success" role="status">Verifying your secure reset session…</p>}
        {!checking && !authorized && <div className="auth-error" role="alert">This password reset link is invalid or expired. Request a fresh link to continue. <Link href="/login?mode=recovery">Request another reset link</Link></div>}
        {authorized && !complete && (
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="new-password">New password</label>
            <div className="auth-input-wrap"><LockKeyhole size={17} /><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></div>
            <label htmlFor="confirm-password">Confirm new password</label>
            <div className="auth-input-wrap"><LockKeyhole size={17} /><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Enter the password again" /></div>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Updating password…" : "Update password"} <ArrowRight size={18} /></button>
          </form>
        )}
        {complete && <><p className="auth-success" role="status">Your password has been updated successfully.</p><Link href="/workspace" className="auth-submit">Open your workspace <ArrowRight size={18} /></Link></>}
        <p className="auth-footnote"><ShieldCheck size={13} /> Passwords are handled by Supabase Auth and are never stored by Happyforge.</p>
      </section>
    </main>
  );
}
