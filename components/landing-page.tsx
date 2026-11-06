"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";

const features = [
  ["AI coding agent","Give a task in plain language. An OpenCode agent plans it and works against your project.","01110 10101 11111 01110 10101","#B9F078"],
  ["Agent sessions","Keep prompts, output and task status together so you can return to work without losing context.","11111 00000 11111 00000 11111","#A99AEF"],
  ["MCP integrations","Extend agent workflows through external tools, with connection status visible in your workspace.","10101 11111 01110 00100 00100","#78D9D0"],
  ["Skills library","Organize reusable instructions and capabilities globally or at project level.","00100 01110 11111 01110 10101","#B9F078"],
  ["Model configuration","Configure supported model providers while keeping credentials on the server.","10101 01110 11011 01110 10101","#A99AEF"],
  ["Project workspace","Bring projects, repositories, settings and agent sessions into one focused environment.","11100 11111 10001 10001 11111","#78D9D0"],
];

export function LandingPage() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [step,setStep]=useState(0);
  useEffect(()=>{
    const canvas=document.getElementById("hf-landing-bg") as HTMLCanvasElement|null;
    const ctx=canvas?.getContext("2d"); if(!canvas||!ctx)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w=0,h=0,frame=0,mx=-999,my=-999,sy=0,progress=0;
    const colors=[[130,150,185],[120,217,208],[169,154,239],[185,240,120],[100,112,135]];
    const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
    const draw=(t:number)=>{
      const cell=innerWidth<620?44:60,off=sy*.25,row0=Math.floor(off/cell),shift=off-row0*cell;
      const p=progress*(colors.length-1),i=Math.min(Math.floor(p),colors.length-2),f=p-i;
      const tint=colors[i].map((v,j)=>v+(colors[i+1][j]-v)*f);
      ctx.clearRect(0,0,w,h);
      for(let r=0;r*cell-shift<h;r++)for(let c=0;c*cell<w;c++){
        const x=c*cell,y=r*cell-shift,s=hash(c,r+row0),pulse=reduced?.5:.5+.5*Math.sin(t*.0008+s*40);
        const wave=Math.max(0,Math.sin((r+row0)*.35-sy*.006+c*.2));
        const dx=x+cell/2-mx,dy=y+cell/2-my,near=Math.max(0,1-Math.sqrt(dx*dx+dy*dy)/170);
        const v=Math.min(.8,s*s*.5*pulse+wave*s*.5+near*.85),base=[20+s*8,26+s*8,36+s*10];
        ctx.fillStyle=`rgb(${base.map((b,j)=>Math.round(b+(tint[j]-b)*v)).join(",")})`;
        ctx.fillRect(x+2,y+2,cell-4,cell-4);
      }
    };
    const resize=()=>{const d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw(performance.now())};
    const scroll=()=>{sy=scrollY;const max=document.documentElement.scrollHeight-innerHeight;progress=max>0?Math.min(1,sy/max):0;draw(performance.now())};
    const pointer=(e:PointerEvent)=>{mx=e.clientX;my=e.clientY};
    const animate=(t:number)=>{draw(t);frame=requestAnimationFrame(animate)};
    resize();scroll();addEventListener("resize",resize);addEventListener("scroll",scroll,{passive:true});addEventListener("pointermove",pointer,{passive:true});
    if(!reduced)frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);removeEventListener("resize",resize);removeEventListener("scroll",scroll);removeEventListener("pointermove",pointer)};
  },[]);
  useEffect(()=>{
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setStep(Number((e.target as HTMLElement).dataset.step||0))}),{rootMargin:"-40% 0px -40% 0px"});
    document.querySelectorAll<HTMLElement>(".landing-step").forEach(e=>io.observe(e));
    return()=>io.disconnect();
  },[]);
  return <div className="landing-page">
    <canvas id="hf-landing-bg" aria-hidden="true"/><div className="veil" aria-hidden="true"/>
    <header><div className="wrap">
      <a className="logo" href="#top" aria-label="Happyforge home"><svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><rect x="2" y="2" width="9" height="9" rx="2" fill="#B9F078"/><rect x="15" y="2" width="9" height="9" rx="2" fill="#A99AEF"/><rect x="2" y="15" width="9" height="9" rx="2" fill="#78D9D0"/><rect x="15" y="15" width="9" height="9" rx="2" fill="#171E29" stroke="#929EAD"/></svg>Happyforge</a>
      <nav className="pill" aria-label="Primary"><a href="#product">Product</a><a href="#features">Features</a><a href="#architecture">Architecture</a></nav>
      <div className="landing-nav-actions"><Link className="btn" href="/login">Sign in</Link><Link className="btn pri" href="/login">Get started <ArrowRight size={16}/></Link><button className="burger" onClick={()=>setMenuOpen(v=>!v)} aria-label={menuOpen?"Close menu":"Open menu"} aria-expanded={menuOpen}>{menuOpen?<X size={19}/>:<Menu size={19}/>}</button></div>
    </div></header>
    <div className={`drawer ${menuOpen?"open":""}`}><a href="#product" onClick={()=>setMenuOpen(false)}>Product</a><a href="#features" onClick={()=>setMenuOpen(false)}>Features</a><a href="#architecture" onClick={()=>setMenuOpen(false)}>Architecture</a><Link href="/login" onClick={()=>setMenuOpen(false)}>Sign in</Link><Link className="btn pri" href="/login" onClick={()=>setMenuOpen(false)}>Get started</Link></div>
    <main id="top">
      <section className="hero" id="product"><div className="wrap">
        <p className="tag">YOUR IDE. YOUR AGENT. YOUR RULES.</p>
        <h1 className="px">Build beyond<br/>the ordinary.</h1>
        <p className="lead">Describe what you want built. Work with an AI coding agent in your cloud workspace, and stay involved as the work takes shape.</p>
        <div className="composer" role="group" aria-label="Happyforge task composer preview">
          <div className="bar"><span className="dot"/>Your next build<em>workspace preview</em></div>
          <div className="landing-prompt-preview">What would you like to build?</div>
          <div className="row"><span className="chip">Web app</span><span className="chip">API</span><span className="chip">Refactor</span><span className="chip"><b/>OpenCode agent</span><span className="chip n"><b/>Model configurable</span><Link className="btn pri go" href="/login" aria-label="Start building"><ArrowUpRight size={18}/></Link></div>
          <p className="note">Sign in to start a real agent session. This preview does not run tasks.</p>
        </div>
        <p className="hint">A focused workspace for ideas, code and agent workflows.</p>
        <div className="cta"><Link className="btn pri" href="/login">Start building <ArrowRight size={16}/></Link><a className="btn" href="#features">Explore the workspace</a></div>
      </div></section>
      <section id="features"><div className="wrap"><div className="head"><h2 className="px">Built to ship</h2><p className="sub">A connected environment for the parts of AI-assisted development that usually live in separate tools.</p></div><div className="grid">{features.map(([title,copy,pattern,color])=><article className="card" key={title}><svg viewBox="0 0 25 25" fill={color} aria-hidden="true">{pattern.split(" ").flatMap((row,y)=>row.split("").flatMap((bit,x)=>bit==="1"?[<rect key={`${y}-${x}`} x={x*5} y={y*5} width="4" height="4"/>]:[]))}</svg><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
      <section id="how"><div className="wrap"><div className="head"><h2 className="px">Prompt to review</h2><p className="sub">A simple flow that keeps you close to the decisions that matter.</p></div><div className="how"><div id="steps">
        <div className={`st landing-step ${step===0?"on":""}`} data-step="0" role="button" tabIndex={0} onClick={()=>setStep(0)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setStep(0)}}><h3><span>01</span>Describe your task</h3><p>Explain what you want created, fixed or refactored in plain language.</p></div>
        <div className={`st landing-step ${step===1?"on":""}`} data-step="1" role="button" tabIndex={0} onClick={()=>setStep(1)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setStep(1)}}><h3><span>02</span>Let your agent work</h3><p>Follow the task progress and see what is running, finished or needs attention.</p></div>
        <div className={`st landing-step ${step===2?"on":""}`} data-step="2" role="button" tabIndex={0} onClick={()=>setStep(2)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setStep(2)}}><h3><span>03</span>Review the result</h3><p>Inspect the output and decide what to keep, retry or change next.</p></div>
      </div><div className="sticky">
        <div className={`pn ${step===0?"on":""}`}><small>WORKFLOW / 01</small><span className="q">&gt;</span> Build a secure account flow with sign-in and password recovery.</div>
        <div className={`pn ${step===1?"on":""}`}><small>WORKFLOW / 02</small><span className="ok">done</span> Inspect project structure<br/><span className="ok">done</span> Plan a safe implementation<br/><span className="run">running</span> Apply code changes<br/><span className="q">queued</span> Run checks</div>
        <div className={`pn ${step===2?"on":""}`}><small>WORKFLOW / 03</small>Review changes before they become part of your project<div className="acts"><span>Review</span><span>Retry</span><span>Continue</span></div></div>
      </div></div></div></section>
      <section id="architecture"><div className="wrap"><div className="head"><h2 className="px">Parts you can inspect</h2><p className="sub">A modular foundation with clear boundaries for identity, code and agent execution.</p></div><div className="arch">
        <div><strong>GitHub</strong><span>Your repository remains the source of truth for project code.</span></div>
        <div><strong>Supabase</strong><span>Handles sign-in and workspace metadata with row-level security.</span></div>
        <div><strong>OpenCode runtime</strong><span>Runs agent tasks on a separately hosted runtime, not in the landing page.</span></div>
        <div><strong>Server-side AI config</strong><span>Provider credentials stay on the server and never reach the browser.</span></div>
      </div></div></section>
      <section className="final"><div className="wrap"><h2 className="px">Your next build<br/>starts here.</h2><p className="sub" style={{marginBottom:28}}>Create an account and bring your first development task into Happyforge.</p><Link className="btn pri" href="/login">Get started <ArrowRight size={16}/></Link></div></section>
    </main>
    <footer><div className="mark px" aria-hidden="true">Happyforge</div><div className="wrap"><span>Your IDE. Your agent. Your rules. © 2026 Happyforge</span><nav aria-label="Footer"><a href="#features">Product</a><a href="#architecture">Architecture</a><a href="https://github.com/animewar3000-dot/Happyforge" target="_blank" rel="noreferrer">GitHub</a><a href="#top">Back to top</a></nav></div></footer>
  </div>;
}
