"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { ArrowLeft, ArrowRight, Bot, Check, Eye, EyeOff, Fingerprint, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, TerminalSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildPasswordRecoveryRedirect, getRequestedAuthMode } from "@/lib/auth-recovery.mjs";

export default function ModernLoginSignup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "recovery">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const strength = useMemo(
    () => [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length,
    [password],
  );

  useEffect(() => {
    if (getRequestedAuthMode(window.location.search) === "recovery") setMode("recovery");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let geometry: THREE.PlaneGeometry | undefined;
    let material: THREE.ShaderMaterial | undefined;
    let frame = 0;
    let active = true;
    let resizeObserver: ResizeObserver | undefined;

    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_opacities: { value: [0.18, 0.22, 0.28, 0.35, 0.42, 0.5, 0.62, 0.72, 0.86, 1] },
        u_colors: { value: [
          new THREE.Vector3(0.72, 0.95, 0.42),
          new THREE.Vector3(0.72, 0.95, 0.42),
          new THREE.Vector3(0.72, 0.95, 0.42),
          new THREE.Vector3(0.42, 0.72, 0.55),
          new THREE.Vector3(0.55, 0.82, 0.68),
          new THREE.Vector3(0.82, 0.92, 0.72),
        ] },
        u_total_size: { value: 24 },
        u_dot_size: { value: 2.5 },
      };
      material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms,
        vertexShader: `
          precision mediump float;
          out vec2 fragCoord;
          void main() {
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + 1.0) * 0.5;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;
          uniform float u_time;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          out vec4 fragColor;
          const float PHI = 1.6180339887498948;
          float random(vec2 p) {
            return fract(sin(dot(p * PHI, vec2(127.1, 311.7))) * 43758.5453);
          }
          void main() {
            vec2 pixel = fragCoord * u_resolution;
            vec2 st = pixel - abs(floor(mod(u_resolution, u_total_size) - u_dot_size) * 0.5);
            float opacity = step(0.0, st.x) * step(0.0, st.y);
            vec2 cell = floor(st / u_total_size);
            float seed = random(cell);
            float flicker = random(cell * floor(u_time * 0.32 + seed + 5.0));
            int opacityIndex = int(clamp(flicker * 10.0, 0.0, 9.0));
            int colorIndex = int(clamp(seed * 6.0, 0.0, 5.0));
            opacity *= u_opacities[opacityIndex];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
            float centerDistance = distance(u_resolution / 2.0 / u_total_size, cell);
            float reveal = centerDistance * 0.012 + seed * 0.15;
            opacity *= smoothstep(reveal, reveal + 0.18, u_time * 0.45);
            vec3 color = u_colors[colorIndex];
            fragColor = vec4(color, opacity * 0.62);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, material));

      const resize = () => {
        if (!renderer || !canvas.isConnected) return;
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;
        renderer.setSize(width, height, false);
        uniforms.u_resolution.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);

      const start = performance.now();
      const animate = (now: number) => {
        if (!active || !renderer) return;
        uniforms.u_time.value = (now - start) / 1000;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    } catch {
      canvas.dataset.webgl = "unavailable";
    }

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
    };
  }, []);

  function changeMode(next: "signin" | "signup" | "recovery") {
    setMode(next);
    setError("");
    setMessage("");
    setPassword("");
    setShowPassword(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "recovery") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: buildPasswordRecoveryRedirect(window.location.origin),
        });
        if (authError) throw authError;
        setMessage("If an account exists for this address, a password reset link has been sent. Check your inbox.");
        return;
      }
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (authError) throw authError;
        if (data.session) window.location.assign("/workspace");
        else setMessage("Your account is almost ready. Check your inbox for the confirmation link, then come back to sign in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        const next = new URLSearchParams(window.location.search).get("next");
        const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/workspace";
        window.location.assign(destination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell auth-modern-shell">
      <canvas ref={canvasRef} className="auth-dot-canvas" aria-hidden="true" />
      <div className="auth-vignette" aria-hidden="true" />
      <div className="auth-atmosphere" aria-hidden="true"><span className="auth-orbit orbit-a" /><span className="auth-orbit orbit-b" /><span className="auth-orbit orbit-c" /><span className="auth-glow" /></div>
      <Link href="/" className="auth-back"><ArrowLeft size={15} /><span>Back to Happyforge</span></Link>
      <div className="auth-layout">
        <aside className="auth-story">
          <Link href="/" className="auth-brand"><span className="auth-mark"><Bot size={22} /></span><span>happyforge<span className="brand-period">.</span></span></Link>
          <div className="auth-story-copy">
            <div className="auth-kicker"><span className="auth-live-dot" /> YOUR WORKSPACE, YOUR CONTROL</div>
            <h1>{mode === "signin" ? <>Good to have<br />you <span>back.</span></> : mode === "recovery" ? <>Reset your<br /><span>password.</span></> : <>Make room<br />for <span>what&apos;s next.</span></>}</h1>
            <p>{mode === "signin" ? "Pick up where your ideas left off. Your projects and agent sessions are right where you need them." : mode === "recovery" ? "Enter your account email and we’ll send a secure password reset link." : "One workspace for your projects, your tools and the ideas you’re ready to build."}</p>
          </div>
          <div className="auth-terminal" aria-label="Happyforge workspace preview">
            <div className="auth-terminal-top"><span><i /><i /><i /></span><small><TerminalSquare size={12} /> HAPPYFORGE / WORKSPACE</small><span className="terminal-lock"><LockKeyhole size={12} /> PRIVATE</span></div>
            <div className="auth-terminal-body"><div className="terminal-line"><span>01</span><b>agent</b><em>ready to build</em></div><div className="terminal-line"><span>02</span><b>project</b><em>your code, your rules</em></div><div className="terminal-line"><span>03</span><b>session</b><em className="terminal-active">awaiting you_</em></div></div>
            <div className="auth-terminal-foot"><span className="terminal-pulse" /> Secure workspace connection <span>ENCRYPTED</span></div>
          </div>
          <div className="auth-trust"><span><ShieldCheck size={15} /> Supabase-secured identity</span><span><Fingerprint size={15} /> Your credentials stay private</span></div>
        </aside>
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-head"><div className="auth-mobile-brand"><span className="auth-mark"><Bot size={20} /></span><b>happyforge<span className="brand-period">.</span></b></div><span className="auth-step"><Sparkles size={13} /> YOUR NEXT CHAPTER</span></div>
          <div className="auth-form-heading"><div className="auth-kicker"><ShieldCheck size={14} /> {mode === "signin" ? "SECURE SIGN IN" : mode === "recovery" ? "ACCOUNT RECOVERY" : "GET STARTED"}</div><h2 id="auth-title">{mode === "signin" ? "Welcome back." : mode === "recovery" ? "Reset your password." : "Create your account."}</h2><p>{mode === "signin" ? "Sign in to open your workspace." : mode === "recovery" ? "We’ll email you a one-time link to securely choose a new password." : "Set up your account and start building with Happyforge."}</p></div>
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            {mode === "recovery" ? <button type="button" className="auth-recovery-back" onClick={() => changeMode("signin")}><ArrowLeft size={14} /> Back to sign in</button> : <>
              <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "selected" : ""} onClick={() => changeMode("signin")}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "selected" : ""} onClick={() => changeMode("signup")}>Create account</button>
            </>}
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="modern-auth-email">Email address</label>
            <div className="auth-input-wrap"><Mail size={17} /><input id="modern-auth-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></div>
            <div className="auth-password-label" hidden={mode === "recovery"}><label htmlFor="modern-auth-password">Password</label>{mode === "signup" ? <span>8+ characters</span> : mode === "signin" ? <button type="button" className="auth-forgot" onClick={() => changeMode("recovery")}>Forgot password?</button> : null}</div>
            <div className="auth-input-wrap" hidden={mode === "recovery"}><LockKeyhole size={17} /><input id="modern-auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required={mode !== "recovery"} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" /><button className="auth-eye" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            {mode === "signup" && <div className="auth-strength" aria-label={`Password strength: ${strength} of 4`}><div className="auth-strength-bars">{[0, 1, 2, 3].map(index => <i key={index} className={strength > index ? "filled" : ""} />)}</div><span>{password.length === 0 ? "Use a strong password" : strength <= 1 ? "Needs more strength" : strength <= 3 ? "Looking good" : "Strong password"}</span></div>}
            {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={17} className="spin" /> {mode === "signin" ? "Signing you in…" : mode === "recovery" ? "Sending reset link…" : "Creating your account…"}</> : <>{mode === "signin" ? "Sign in to Happyforge" : mode === "recovery" ? "Send password reset link" : "Create my account"} <ArrowRight size={18} /></>}</button>
          </form>
          <div className="auth-divider"><span /><small>BUILT FOR YOUR WORKFLOW</small><span /></div>
          <div className="auth-benefits"><span><Check size={14} /> Projects in one place</span><span><Check size={14} /> Agent sessions, ready when you are</span></div>
          <p className="auth-footnote"><ShieldCheck size={13} /> Your account is secured by Supabase Auth. Passwords are never stored in Happyforge.</p>
        </section>
      </div>
      <footer className="auth-page-footer"><span>HAPPYFORGE © 2026</span><span>YOUR IDE. YOUR AGENT. YOUR RULES.</span></footer>
    </main>
  );
}
