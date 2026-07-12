import { useState, useEffect, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

const T = {
  bg:"#F8F9FF", card:"#FFFFFF", border:"#E5E8F5", borderHi:"#22C55E",
  green:"#16A34A", greenLt:"#22C55E", greenDim:"#F0FDF4", greenBorder:"#BBF7D0",
  blue:"#2563EB", blueDim:"#EFF6FF",
  navy:"#0F172A", text:"#0F172A", textSub:"#374151", muted:"#6B7280", dimText:"#9CA3AF",
  amber:"#D97706", amberDim:"#FFFBEB",
  purple:"#7C3AED", purpleDim:"#F5F3FF",
  cyan:"#0891B2", cyanDim:"#ECFEFF",
  red:"#DC2626", redDim:"#FEF2F2",
  shadow:"0 1px 3px rgba(0,0,0,0.08)",
  shadowMd:"0 4px 16px rgba(34,197,94,0.10)",
  shadowLg:"0 8px 32px rgba(34,197,94,0.14)",
};

// ── DATA ────────────────────────────────────────────────────────
const VENUES = [
  { id:1, name:"MetLife Stadium", city:"New York", country:"USA", capacity:82500, crowd:78200, risk:62, zones:[
    {zone:"Gate A–C",density:88,alert:true},{zone:"Main Concourse",density:74,alert:false},{zone:"North Stand",density:61,alert:false},{zone:"Food Court",density:92,alert:true},{zone:"Exit West",density:45,alert:false}
  ]},
  { id:2, name:"SoFi Stadium", city:"Los Angeles", country:"USA", capacity:70240, crowd:64800, risk:38, zones:[
    {zone:"Gate 1–3",density:65,alert:false},{zone:"Club Level",density:71,alert:false},{zone:"South End",density:55,alert:false},{zone:"Merch Area",density:83,alert:true},{zone:"Exit East",density:40,alert:false}
  ]},
  { id:3, name:"Estadio Azteca", city:"Mexico City", country:"MEX", capacity:87523, crowd:84100, risk:78, zones:[
    {zone:"Gate A",density:96,alert:true},{zone:"Sector Norte",density:89,alert:true},{zone:"Sector Sur",density:82,alert:false},{zone:"Concessions",density:91,alert:true},{zone:"Exit Tunnel",density:68,alert:false}
  ]},
  { id:4, name:"BC Place", city:"Vancouver", country:"CAN", capacity:54500, crowd:48200, risk:24, zones:[
    {zone:"Main Gate",density:52,alert:false},{zone:"Level 2",density:44,alert:false},{zone:"East Wing",density:38,alert:false},{zone:"Food Hall",density:67,alert:false},{zone:"Exit South",density:31,alert:false}
  ]},
];

const CROWD_DATA = [
  {t:"14:00",density:35},{t:"15:00",density:52},{t:"16:00",density:71},{t:"17:00",density:84},
  {t:"18:00",density:91},{t:"19:00",density:78},{t:"20:00",density:62},{t:"21:00",density:44},
];

const LANG_DATA = [{lang:"Spanish",queries:4821},{lang:"Portuguese",queries:3240},{lang:"Arabic",queries:2180},{lang:"French",queries:1940},{lang:"German",queries:1320}];
const SUSTAIN_DATA = [{label:"Energy",used:68,saved:32},{label:"Water",used:71,saved:29},{label:"Waste Sorted",used:84,saved:16},{label:"EV Transport",used:58,saved:42}];

// ── HELPERS ─────────────────────────────────────────────────────
function Card({ children, style={}, onClick, highlight }) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:T.card,borderRadius:16,border:`1px solid ${highlight?T.greenLt+"60":hov&&onClick?T.borderHi+"60":T.border}`,
        boxShadow:hov&&onClick?T.shadowLg:highlight?T.shadowMd:T.shadow,transition:"all 0.2s",cursor:onClick?"pointer":"default",...style }}>
      {children}
    </div>
  );
}
function Badge({ label, color, bg }) {
  return <span style={{ fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:20,background:bg||`${color}15`,color,border:`1px solid ${color}30`,display:"inline-block",margin:"2px" }}>{label}</span>;
}
function Counter({ to, suffix="" }) {
  const [v,setV]=useState(0);
  useEffect(()=>{
    let s=null;
    const run=ts=>{ if(!s)s=ts; const p=Math.min((ts-s)/1200,1); setV(Math.floor(p*to)); if(p<1) requestAnimationFrame(run); };
    requestAnimationFrame(run);
  },[to]);
  return <>{v.toLocaleString()}{suffix}</>;
}
function RiskBadge({ risk }) {
  const color = risk>=75?T.red:risk>=50?T.amber:T.green;
  const label = risk>=75?"HIGH":risk>=50?"MEDIUM":"LOW";
  const bg = risk>=75?T.redDim:risk>=50?T.amberDim:T.greenDim;
  return <span style={{ fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20,background:bg,color,border:`1px solid ${color}30` }}>{label} RISK</span>;
}
function DensityBar({ value }) {
  const color = value>=85?T.red:value>=70?T.amber:T.green;
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ flex:1,height:6,background:T.border,borderRadius:3,overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${value}%`,background:color,borderRadius:3,transition:"width 1s" }}/>
      </div>
      <span style={{ fontSize:11,fontWeight:700,color,minWidth:32 }}>{value}%</span>
    </div>
  );
}
function PulsingDot({ color=T.green }) {
  return (
    <span style={{ display:"inline-block",width:8,height:8,borderRadius:"50%",background:color,boxShadow:`0 0 0 2px ${color}40`,animation:"pulse 2s infinite" }}/>
  );
}

// ── TICKER ──────────────────────────────────────────────────────
function Ticker() {
  const items=["⚽ MetLife Stadium: 78,200 fans — HIGH alert Zone A","🟡 SoFi: Merch area density 83% — monitoring","🔴 Azteca: Gate A CRITICAL — rerouting initiated","♿ AccessFirst: 140 accessibility assists today","🌍 FanAssist: 24,180 queries in 52 languages","🌱 GreenOps: 847kg waste sorted correctly today","⚡ CommandBridge: All 4 venues nominal | 2 alerts active"];
  return (
    <div style={{ background:T.green,overflow:"hidden",height:28,display:"flex",alignItems:"center",flexShrink:0 }}>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{ display:"flex",animation:"ticker 26s linear infinite",whiteSpace:"nowrap" }}>
        {[...items,...items].map((item,i)=>(
          <span key={i} style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.9)",padding:"0 24px",borderRight:"1px solid rgba(255,255,255,0.3)",fontFamily:"monospace" }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

// ── SIDEBAR ─────────────────────────────────────────────────────
const NAV=[
  {id:"command",emoji:"⚡",label:"Command Bridge"},
  {id:"crowd",emoji:"👥",label:"CrowdFlow"},
  {id:"fan",emoji:"🗣️",label:"FanAssist AI"},
  {id:"access",emoji:"♿",label:"AccessFirst"},
  {id:"staff",emoji:"🎽",label:"StaffCopilot"},
  {id:"green",emoji:"🌱",label:"GreenOps"},
];
function Sidebar({ active, onNav }) {
  const [exp,setExp]=useState(false);
  return (
    <div style={{ width:exp?200:64,background:T.card,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width 0.25s",overflow:"hidden",flexShrink:0,boxShadow:T.shadow }}>
      <div style={{ padding:"14px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,cursor:"pointer" }} onClick={()=>setExp(!exp)}>
        <div style={{ width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${T.green},${T.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>⚽</div>
        {exp&&<div><div style={{ fontSize:13,fontWeight:800,color:T.text }}>NEXUS 2026</div><div style={{ fontSize:9,color:T.muted }}>FIFA AI Platform</div></div>}
      </div>
      <div style={{ flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2 }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>onNav(n.id)} title={n.label} style={{ width:"100%",padding:"9px 10px",borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",background:active===n.id?T.greenDim:"transparent",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s" }}>
            <span style={{ fontSize:17,lineHeight:1,flexShrink:0 }}>{n.emoji}</span>
            {exp&&<span style={{ fontSize:12,fontWeight:600,color:active===n.id?T.green:T.muted,whiteSpace:"nowrap" }}>{n.label}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding:"12px 10px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${T.green},${T.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0 }}>MT</div>
        {exp&&<div><div style={{ fontSize:12,fontWeight:700,color:T.text }}>Mayank Tiwari</div><div style={{ fontSize:10,color:T.muted }}>Operations Lead</div></div>}
      </div>
    </div>
  );
}

// ── COMMAND BRIDGE ───────────────────────────────────────────────
function CommandBridge() {
  const [sel,setSel]=useState(VENUES[0]);
  return (
    <div style={{ padding:24,background:T.bg,minHeight:"100%" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.green,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>⚡ Command Bridge · Real-time Operations</div>
        <h2 style={{ fontSize:22,fontWeight:900,color:T.text,margin:0 }}>Global Venue Intelligence</h2>
      </div>

      {/* Hero banner */}
      <div style={{ borderRadius:20,background:`linear-gradient(135deg,#0F172A,#1E3A5F)`,padding:"24px 28px",marginBottom:20,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-20,right:-20,width:160,height:160,borderRadius:"50%",background:"rgba(34,197,94,0.06)" }}/>
        <div style={{ position:"relative",zIndex:1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
            <PulsingDot color={T.greenLt}/>
            <span style={{ fontSize:11,fontWeight:700,color:T.greenLt,fontFamily:"monospace" }}>NEXUS 2026 · LIVE · ALL SYSTEMS NOMINAL</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16 }}>
            {[["Active Venues","16","of 16 online",T.greenLt],["Fans Inside","278,450","across all stadiums","#67E8F9"],["AI Queries","24,180","handled today","#FCD34D"],["Active Alerts","3","require attention","#F87171"]].map(([k,v,s,c])=>(
              <div key={k}>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>{k}</div>
                <div style={{ fontSize:28,fontWeight:900,color:c,lineHeight:1 }}><Counter to={parseInt(v.replace(",",""))}/></div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Venue cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20 }}>
        {VENUES.map(v=>(
          <Card key={v.id} onClick={()=>setSel(v)} highlight={sel.id===v.id} style={{ padding:16 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14,fontWeight:800,color:T.text }}>{v.name}</div>
                <div style={{ fontSize:11,color:T.muted }}>{v.city} · {v.country}</div>
              </div>
              <RiskBadge risk={v.risk}/>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <div><div style={{ fontSize:10,color:T.muted }}>Fans Inside</div><div style={{ fontSize:16,fontWeight:800,color:T.text }}>{v.crowd.toLocaleString()}</div></div>
              <div><div style={{ fontSize:10,color:T.muted }}>Capacity</div><div style={{ fontSize:16,fontWeight:800,color:T.text }}>{v.capacity.toLocaleString()}</div></div>
              <div><div style={{ fontSize:10,color:T.muted }}>Risk Score</div><div style={{ fontSize:16,fontWeight:800,color:v.risk>=75?T.red:v.risk>=50?T.amber:T.green }}>{v.risk}/100</div></div>
            </div>
            <DensityBar value={Math.round((v.crowd/v.capacity)*100)}/>
          </Card>
        ))}
      </div>

      {/* Selected venue zones */}
      <Card style={{ padding:20,marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <div>
            <div style={{ fontSize:13,fontWeight:800,color:T.text }}>{sel.name} — Zone Density Map</div>
            <div style={{ fontSize:11,color:T.muted }}>Real-time crowd density across all monitored zones</div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Badge label="⚠ Alert" color={T.amber} bg={T.amberDim}/>
            <Badge label="2 zones" color={T.red} bg={T.redDim}/>
          </div>
        </div>
        {sel.zones.map(z=>(
          <div key={z.zone} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
            <div style={{ width:120,fontSize:12,fontWeight:600,color:T.text,flexShrink:0 }}>{z.zone}</div>
            <div style={{ flex:1 }}><DensityBar value={z.density}/></div>
            {z.alert && <span style={{ fontSize:10,fontWeight:700,color:T.red,background:T.redDim,padding:"2px 8px",borderRadius:20,flexShrink:0 }}>⚠ ALERT</span>}
            {!z.alert && <span style={{ fontSize:10,fontWeight:600,color:T.green,background:T.greenDim,padding:"2px 8px",borderRadius:20,flexShrink:0 }}>✓ OK</span>}
          </div>
        ))}
      </Card>

      {/* Crowd chart */}
      <Card style={{ padding:20 }}>
        <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:4 }}>Crowd Density Trend — Today</div>
        <div style={{ fontSize:11,color:T.muted,marginBottom:14 }}>Predicted peak: 19:00–20:00 · Match kickoff: 20:00</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={CROWD_DATA}>
            <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity={0.2}/><stop offset="100%" stopColor={T.green} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="t" tick={{ fontSize:11,fill:T.muted }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:11,fill:T.muted }} axisLine={false} tickLine={false} domain={[0,100]} unit="%"/>
            <Tooltip contentStyle={{ background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,fontSize:12 }} formatter={(v)=>[`${v}%`,"Density"]}/>
            <Area type="monotone" dataKey="density" stroke={T.green} strokeWidth={2.5} fill="url(#cg)" dot={{ fill:T.green,r:4,strokeWidth:0 }}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ── FANASSIST AI ─────────────────────────────────────────────────
function FanAssist() {
  const [msgs,setMsgs]=useState([{role:"ai",text:"Hi! I'm NEXUS FanAssist — your FIFA World Cup 2026 AI companion. I speak 50+ languages and can help you with navigation, food, transport, accessibility, match info, and more. How can I help you today?",lang:"🌍"}]);
  const [inp,setInp]=useState("");
  const [lang,setLang]=useState("English");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  const LANGS=["English","Spanish","Portuguese","Arabic","French","German","Japanese","Hindi","Mandarin","Italian"];
  const QUICK=["Where is Gate 14B?","Nearest accessible toilet?","How do I get to the stadium from downtown?","What food options are halal?","Emergency help!","When does the match start?"];
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);
  const send=async(text)=>{
    const q=text||inp.trim(); if(!q) return;
    setInp(""); setMsgs(m=>[...m,{role:"user",text:q}]); setLoading(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`You are NEXUS FanAssist — the official AI guide for FIFA World Cup 2026. You help fans with navigation, transport, food, accessibility, safety, and match info across 16 venues in USA, Canada and Mexico. The user's preferred language is ${lang}. Be warm, helpful, and concise (2-4 sentences). If asked about navigation, give specific directions. If asked about accessibility, be extra detailed. Reply in ${lang}. Fan question: ${q}`}]})
      });
      const d=await res.json();
      setMsgs(m=>[...m,{role:"ai",text:d.content?.[0]?.text||"Let me help you with that!"}]);
    } catch { setMsgs(m=>[...m,{role:"ai",text:"I'm here to help! For urgent assistance please find the nearest yellow-vest volunteer or call +1-800-FIFA-NOW."}]); }
    setLoading(false);
  };
  return (
    <div style={{ padding:24,background:T.bg,minHeight:"100%",display:"flex",flexDirection:"column" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.green,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>🗣️ FanAssist AI · Multilingual Guide</div>
        <h2 style={{ fontSize:22,fontWeight:900,color:T.text,margin:"0 0 4px" }}>Fan AI Companion</h2>
        <p style={{ fontSize:12,color:T.muted,margin:0 }}>50+ languages · Navigation · Food · Transport · Safety · Accessibility</p>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
        {[["Queries Today","24,180",T.green],["Languages Active","52",T.blue],["Avg Response","1.2s",T.amber],["Satisfaction","97%",T.purple]].map(([k,v,c])=>(
          <Card key={k} style={{ padding:"12px 14px",textAlign:"center" }}>
            <div style={{ fontSize:20,fontWeight:900,color:c }}>{v}</div>
            <div style={{ fontSize:10,color:T.muted,marginTop:2 }}>{k}</div>
          </Card>
        ))}
      </div>

      {/* Language selector */}
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap" }}>
        <span style={{ fontSize:11,color:T.muted,fontWeight:600 }}>Language:</span>
        <select value={lang} onChange={e=>setLang(e.target.value)} style={{ padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"#fff",color:T.text,fontSize:12,outline:"none",cursor:"pointer" }}>
          {LANGS.map(l=><option key={l}>{l}</option>)}
        </select>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {QUICK.map(q=><button key={q} onClick={()=>send(q)} style={{ fontSize:10,padding:"5px 12px",borderRadius:20,border:`1px solid ${T.border}`,background:"#fff",color:T.muted,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap" }}>{q}</button>)}
        </div>
      </div>

      {/* Chat */}
      <Card style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12,minHeight:280 }}>
          {msgs.map((m,i)=>(
            <div key={i} style={{ display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8 }}>
              {m.role==="ai"&&<div style={{ width:30,height:30,borderRadius:10,background:`linear-gradient(135deg,${T.green},${T.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⚽</div>}
              <div style={{ maxWidth:"72%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?`linear-gradient(135deg,${T.green},${T.blue})`:"#fff",color:m.role==="user"?"#fff":T.text,fontSize:13,lineHeight:1.7,boxShadow:T.shadow,border:`1px solid ${m.role==="user"?"transparent":T.border}` }}>{m.text}</div>
            </div>
          ))}
          {loading&&<div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ width:30,height:30,borderRadius:10,background:`linear-gradient(135deg,${T.green},${T.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>⚽</div>
            <div style={{ padding:"10px 14px",background:"#fff",borderRadius:"16px 16px 16px 4px",border:`1px solid ${T.border}`,display:"flex",gap:4,alignItems:"center" }}>
              {[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:T.green,animation:`bounce 1.1s ${i*0.18}s infinite` }}/>)}
            </div>
          </div>}
          <div ref={endRef}/>
        </div>
        <div style={{ padding:"10px 14px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8 }}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything in any language..." style={{ flex:1,padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:12,outline:"none",fontFamily:"inherit" }}/>
          <button onClick={()=>send()} disabled={loading||!inp.trim()} style={{ padding:"10px 18px",borderRadius:10,border:"none",background:loading||!inp.trim()?T.border:`linear-gradient(135deg,${T.green},${T.blue})`,color:loading||!inp.trim()?T.muted:"#fff",fontWeight:800,cursor:loading||!inp.trim()?"not-allowed":"pointer",fontSize:12 }}>Send</button>
        </div>
      </Card>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ── CROWDFLOW ────────────────────────────────────────────────────
function CrowdFlow() {
  const [selVenue,setSelVenue]=useState(0);
  const v=VENUES[selVenue];
  return (
    <div style={{ padding:24,background:T.bg,minHeight:"100%" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.green,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>👥 CrowdFlow · Predictive Management</div>
        <h2 style={{ fontSize:22,fontWeight:900,color:T.text,margin:0 }}>Crowd Intelligence</h2>
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        {VENUES.map((vn,i)=>(
          <button key={i} onClick={()=>setSelVenue(i)} style={{ padding:"8px 16px",borderRadius:10,border:`1px solid ${selVenue===i?T.green:T.border}`,background:selVenue===i?T.greenDim:"#fff",color:selVenue===i?T.green:T.muted,fontWeight:600,fontSize:12,cursor:"pointer" }}>{vn.name}</button>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
        {[["Fans Inside",v.crowd.toLocaleString(),T.blue],["Capacity",v.capacity.toLocaleString(),T.text],["Occupancy",`${Math.round((v.crowd/v.capacity)*100)}%`,v.risk>=75?T.red:v.risk>=50?T.amber:T.green]].map(([k,val,c])=>(
          <Card key={k} style={{ padding:"14px 16px",textAlign:"center" }}>
            <div style={{ fontSize:22,fontWeight:900,color:c }}>{val}</div>
            <div style={{ fontSize:11,color:T.muted,marginTop:2 }}>{k}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:4 }}>Zone Density Map</div>
          <div style={{ fontSize:11,color:T.muted,marginBottom:14 }}>Real-time monitoring — all zones</div>
          {v.zones.map(z=>(
            <div key={z.zone} style={{ marginBottom:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:12,fontWeight:600,color:T.text }}>{z.zone}</span>
                {z.alert&&<span style={{ fontSize:9,fontWeight:800,color:T.red,background:T.redDim,padding:"1px 8px",borderRadius:20 }}>⚠ BOTTLENECK</span>}
              </div>
              <DensityBar value={z.density}/>
            </div>
          ))}
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:4 }}>Crowd Flow Today</div>
          <div style={{ fontSize:11,color:T.muted,marginBottom:14 }}>AI-predicted density curve</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CROWD_DATA}>
              <defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.blue} stopOpacity={0.15}/><stop offset="100%" stopColor={T.blue} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="t" tick={{ fontSize:10,fill:T.muted }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:T.muted }} axisLine={false} tickLine={false} unit="%"/>
              <Tooltip contentStyle={{ background:"#fff",border:`1px solid ${T.border}`,borderRadius:8,fontSize:11 }} formatter={(v)=>[`${v}%`,"Density"]}/>
              <Area type="monotone" dataKey="density" stroke={T.blue} strokeWidth={2.5} fill="url(#cg2)" dot={{ fill:T.blue,r:3,strokeWidth:0 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card style={{ padding:20,background:v.risk>=75?T.redDim:v.risk>=50?T.amberDim:T.greenDim,border:`1px solid ${v.risk>=75?T.red+"30":v.risk>=50?T.amber+"30":T.green+"30"}` }}>
        <div style={{ fontSize:12,fontWeight:800,color:v.risk>=75?T.red:v.risk>=50?T.amber:T.green,marginBottom:8 }}>🤖 AI Crowd Analysis — {v.name}</div>
        <p style={{ fontSize:12,color:T.textSub,margin:0,lineHeight:1.7 }}>
          {v.risk>=75?"⚠ Critical crowd pressure detected. Gate A showing 96% density. Immediate action required: redirect incoming fans to Gates B and C. Deploy 3 additional stewards to Sector Norte. Concessions zone approaching critical threshold — close 2 entry points. ETA to bottleneck resolution: 8 minutes with current routing changes.":v.risk>=50?"🟡 Moderate crowd pressure in Merch Area (83%). AI recommends: open secondary merchandise counter in Block 7. Digital signage updated to redirect fans. Predicted peak density: 19:00 — prepare additional staff.":"✅ All zones within safe operating parameters. Crowd dispersal is efficient. No bottlenecks predicted for the next 2 hours based on ticket scan velocity."}
        </p>
      </Card>
    </div>
  );
}

// ── ACCESSFIRST ──────────────────────────────────────────────────
function AccessFirst() {
  const [chat,setChat]=useState([{role:"ai",text:"Hello! I'm AccessFirst — your dedicated accessibility companion for FIFA World Cup 2026. I can guide you to wheelchair-accessible routes, accessible seating, priority queuing, sign language support, and emergency evacuation assistance. How can I help?"}]);
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  const QUICK=["Wheelchair route to my seat","Accessible toilets near Gate 5","Priority entry assistance","Audio description for match?","Emergency evacuation route","Companion seating availability"];
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[chat]);
  const send=async(text)=>{
    const q=text||inp.trim(); if(!q) return;
    setInp(""); setChat(c=>[...c,{role:"user",text:q}]); setLoading(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`You are AccessFirst, FIFA World Cup 2026's dedicated AI accessibility assistant. You help disabled and differently-abled fans navigate the stadium safely and comfortably. Be warm, patient, detailed, and empowering. Provide specific, actionable guidance. Include distances, landmarks, and who to contact. Question: ${q}`}]})
      });
      const d=await res.json();
      setChat(c=>[...c,{role:"ai",text:d.content?.[0]?.text||"I'm here to help!"}]);
    } catch { setChat(c=>[...c,{role:"ai",text:"For immediate accessibility assistance, please find our orange-vest Accessibility Team or call our dedicated line: +1-800-ACCESS-26"}]); }
    setLoading(false);
  };
  return (
    <div style={{ padding:24,background:T.bg,minHeight:"100%",display:"flex",flexDirection:"column" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.amber,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>♿ AccessFirst · Accessibility AI</div>
        <h2 style={{ fontSize:22,fontWeight:900,color:T.text,margin:"0 0 4px" }}>Accessibility Companion</h2>
        <p style={{ fontSize:12,color:T.muted,margin:0 }}>Wheelchair routes · Sign language · Audio description · Priority queuing</p>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
        {[["Accessibility Assists","140 today",T.amber],["Accessible Routes","100% mapped",T.green],["Languages (ASL/BSL)","12 sign langs",T.blue],["Priority Queue","Active",T.purple]].map(([k,v,c])=>(
          <Card key={k} style={{ padding:"12px 14px",textAlign:"center" }}>
            <div style={{ fontSize:14,fontWeight:900,color:c }}>{v}</div>
            <div style={{ fontSize:10,color:T.muted,marginTop:2 }}>{k}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
        {[["♿ Wheelchair Routes","Lift-only, ramp-only, and flat-surface paths mapped for all 16 venues. Real-time route updates if a lift is out of service.",T.amberDim,T.amber],["🦻 Sign Language AI","ASL, BSL, ISL, Auslan and 8 more. Video AI responses for deaf fans. Staff communication cards auto-generated.",T.blueDim,T.blue],["🦯 Audio Description","Live match commentary and stadium audio for blind fans via earpiece or smartphone app. Seat-specific audio zones.",T.purpleDim,T.purple],["🚨 Priority Evacuation","Accessible evacuation routes with buddy system. Vibration alerts on AccessFirst wristband. Priority exits highlighted.",T.redDim,T.red]].map(([title,desc,bg,c])=>(
          <Card key={title} style={{ padding:16,background:bg,border:`1px solid ${c}30` }}>
            <div style={{ fontSize:12,fontWeight:800,color:T.text,marginBottom:6 }}>{title}</div>
            <p style={{ fontSize:11,color:T.textSub,margin:0,lineHeight:1.6 }}>{desc}</p>
          </Card>
        ))}
      </div>
      <Card style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ padding:"12px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:6,flexWrap:"wrap" }}>
          {QUICK.map(q=><button key={q} onClick={()=>send(q)} style={{ fontSize:10,padding:"4px 10px",borderRadius:20,border:`1px solid ${T.border}`,background:"#fff",color:T.muted,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap" }}>{q}</button>)}
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10,minHeight:220 }}>
          {chat.map((m,i)=>(
            <div key={i} style={{ display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8 }}>
              {m.role==="ai"&&<div style={{ width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${T.amber},${T.orange})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0 }}>♿</div>}
              <div style={{ maxWidth:"72%",padding:"9px 13px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?`linear-gradient(135deg,${T.amber},${T.orange})`:"#fff",color:m.role==="user"?"#fff":T.text,fontSize:12,lineHeight:1.7,boxShadow:T.shadow,border:`1px solid ${m.role==="user"?"transparent":T.border}` }}>{m.text}</div>
            </div>
          ))}
          {loading&&<div style={{ display:"flex",gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${T.amber},${T.orange})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>♿</div>
            <div style={{ padding:"9px 13px",background:"#fff",borderRadius:"14px 14px 14px 4px",border:`1px solid ${T.border}`,display:"flex",gap:4 }}>
              {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:T.amber,animation:`bounce 1.1s ${i*0.18}s infinite` }}/>)}
            </div>
          </div>}
          <div ref={endRef}/>
        </div>
        <div style={{ padding:"10px 14px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8 }}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about accessible routes, facilities, or assistance..." style={{ flex:1,padding:"9px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:12,outline:"none",fontFamily:"inherit" }}/>
          <button onClick={()=>send()} disabled={loading||!inp.trim()} style={{ padding:"9px 16px",borderRadius:10,border:"none",background:loading||!inp.trim()?T.border:`linear-gradient(135deg,${T.amber},${T.orange})`,color:loading||!inp.trim()?T.muted:"#fff",fontWeight:800,cursor:loading||!inp.trim()?"not-allowed":"pointer",fontSize:12 }}>Send</button>
        </div>
      </Card>
    </div>
  );
}

// ── STAFFCOPILOT ─────────────────────────────────────────────────
function StaffCopilot() {
  const [brief,setBrief]=useState(null);
  const [loadingBrief,setLoadingBrief]=useState(false);
  const [incident,setIncident]=useState("");
  const [incidentResp,setIncidentResp]=useState("");
  const [loadingInc,setLoadingInc]=useState(false);
  const [sector,setSector]=useState("Gate A");

  const genBrief=async()=>{
    setLoadingBrief(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`Generate a FIFA World Cup 2026 match-day AI briefing for a volunteer working at ${sector}. Include: current crowd status, 3 priority tasks, key crowd alerts, top 3 FAQs expected today with answers, and one safety reminder. Be specific, practical and concise. Format with clear sections.`}]})
      });
      const d=await res.json();
      setBrief(d.content?.[0]?.text||"Briefing generated.");
    } catch { setBrief("Briefing unavailable — please see your supervisor for today's briefing sheet."); }
    setLoadingBrief(false);
  };
  const reportInc=async()=>{
    if(!incident.trim()) return;
    setLoadingInc(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`You are NEXUS StaffCopilot. A FIFA World Cup 2026 volunteer just reported this incident at ${sector}: "${incident}". Generate: 1) Immediate action steps (numbered), 2) Who to notify (role + channel), 3) Estimated resolution time. Be decisive and specific. Maximum 150 words.`}]})
      });
      const d=await res.json();
      setIncidentResp(d.content?.[0]?.text||"Processing incident...");
    } catch { setIncidentResp("Immediate: Contact your sector supervisor. Use radio channel 3 for emergencies. Do not leave your post unless directed."); }
    setLoadingInc(false);
  };
  return (
    <div style={{ padding:24,background:T.bg,minHeight:"100%" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.purple,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>🎽 StaffCopilot · Volunteer Intelligence</div>
        <h2 style={{ fontSize:22,fontWeight:900,color:T.text,margin:0 }}>Staff AI Copilot</h2>
        <p style={{ fontSize:12,color:T.muted,margin:"4px 0 0" }}>AI briefings · Incident response · Real-time protocols for 20,000+ volunteers</p>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
        {/* AI Briefing */}
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:4 }}>🤖 AI Match-Day Briefing</div>
          <div style={{ fontSize:11,color:T.muted,marginBottom:14 }}>Personalised briefing for your sector</div>
          <div style={{ display:"flex",gap:8,marginBottom:12 }}>
            <select value={sector} onChange={e=>setSector(e.target.value)} style={{ flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"#fff",color:T.text,fontSize:12,outline:"none" }}>
              {["Gate A","Gate B","Main Concourse","North Stand","Food Court","Medical Zone","Exit West"].map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={genBrief} disabled={loadingBrief} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:loadingBrief?T.border:`linear-gradient(135deg,${T.purple},${T.blue})`,color:loadingBrief?T.muted:"#fff",fontWeight:700,cursor:loadingBrief?"not-allowed":"pointer",fontSize:12,flexShrink:0 }}>
              {loadingBrief?"Generating...":"Get Briefing"}
            </button>
          </div>
          {brief&&<div style={{ background:T.purpleDim,borderRadius:10,padding:14,border:`1px solid ${T.purple}20`,fontSize:11,color:T.textSub,lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:220,overflowY:"auto" }}>{brief}</div>}
          {!brief&&<div style={{ background:T.bg,borderRadius:10,padding:14,border:`1px dashed ${T.border}`,textAlign:"center",color:T.dimText,fontSize:11 }}>Select your sector and generate your AI briefing</div>}
        </Card>
        {/* Incident Report */}
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:4 }}>🚨 Incident Response AI</div>
          <div style={{ fontSize:11,color:T.muted,marginBottom:14 }}>Report any situation — AI generates immediate action steps</div>
          <textarea value={incident} onChange={e=>setIncident(e.target.value)} placeholder="Describe the incident in any language... e.g. 'Fan collapsed near Gate A entrance', 'Large crowd pushing at turnstile 4'" style={{ width:"100%",minHeight:80,background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:12,resize:"none",outline:"none",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box",marginBottom:10 }}/>
          <button onClick={reportInc} disabled={loadingInc||!incident.trim()} style={{ width:"100%",padding:"10px",borderRadius:8,border:"none",background:loadingInc||!incident.trim()?T.border:`linear-gradient(135deg,${T.red},${T.amber})`,color:loadingInc||!incident.trim()?T.muted:"#fff",fontWeight:700,cursor:loadingInc||!incident.trim()?"not-allowed":"pointer",fontSize:12,marginBottom:10 }}>
            {loadingInc?"Generating Response...":"🚨 Get AI Response Protocol"}
          </button>
          {incidentResp&&<div style={{ background:T.redDim,borderRadius:10,padding:14,border:`1px solid ${T.red}20`,fontSize:11,color:T.textSub,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{incidentResp}</div>}
        </Card>
      </div>
      <Card style={{ padding:20 }}>
        <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:14 }}>📡 Live Staff Alerts</div>
        {[{time:"19:42",zone:"Gate A",msg:"Crowd density CRITICAL — reroute incoming fans to Gates B/C immediately",level:"red"},{time:"19:38",zone:"Food Court",msg:"Queue wait time exceeds 25 minutes — open additional service counter 7",level:"amber"},{time:"19:30",zone:"Medical",msg:"Ambulance access clear — ETA 4 minutes to Bay 3",level:"green"}].map((a,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",marginBottom:8,borderRadius:10,background:a.level==="red"?T.redDim:a.level==="amber"?T.amberDim:T.greenDim,border:`1px solid ${a.level==="red"?T.red:a.level==="amber"?T.amber:T.green}20` }}>
            <span style={{ fontSize:10,fontFamily:"monospace",color:T.muted,flexShrink:0 }}>{a.time}</span>
            <span style={{ fontSize:10,fontWeight:700,color:a.level==="red"?T.red:a.level==="amber"?T.amber:T.green,flexShrink:0,minWidth:80 }}>{a.zone}</span>
            <span style={{ fontSize:11,color:T.textSub }}>{a.msg}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── GREENOPS ─────────────────────────────────────────────────────
function GreenOps() {
  return (
    <div style={{ padding:24,background:T.bg,minHeight:"100%" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10,fontWeight:700,color:T.green,letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>🌱 GreenOps · Sustainability Intelligence</div>
        <h2 style={{ fontSize:22,fontWeight:900,color:T.text,margin:0 }}>Sustainability Dashboard</h2>
      </div>
      <div style={{ borderRadius:16,background:`linear-gradient(135deg,#052e16,#166534)`,padding:"22px 24px",marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#86efac",marginBottom:10 }}>TODAY'S ENVIRONMENTAL IMPACT</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16 }}>
          {[["CO₂ Saved","4.2t","vs fossil baseline","#86efac"],["Waste Sorted","847kg","correctly diverted","#67e8f9"],["Renewable %","68%","of energy usage","#fde68a"],["EV Shuttles","142","fan transport trips","#c4b5fd"]].map(([k,v,s,c])=>(
            <div key={k}>
              <div style={{ fontSize:26,fontWeight:900,color:c }}>{v}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:2 }}>{k}</div>
              <div style={{ fontSize:9,color:"rgba(255,255,255,0.4)" }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:14 }}>Resource Usage vs Target</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SUSTAIN_DATA} layout="vertical">
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:10,fill:T.muted }} axisLine={false} tickLine={false} unit="%"/>
              <YAxis dataKey="label" type="category" tick={{ fontSize:10,fill:T.muted }} width={75} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:"#fff",border:`1px solid ${T.border}`,borderRadius:8,fontSize:11 }} formatter={(v,n)=>[`${v}%`,n]}/>
              <Bar dataKey="used" name="Used" fill={T.blue} radius={[0,4,4,0]} stackId="a"/>
              <Bar dataKey="saved" name="Saved/Green" fill={T.green} radius={[0,4,4,0]} stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:14 }}>AI Sustainability Insights</div>
          {[{ico:"🗑️",tip:"Food court waste up 12% — AI recommends closing 2 overflow containers and updating bin signage",c:T.amber},{ico:"⚡",tip:"Floodlight energy peaking — switch 3 non-match-critical banks to 70% during half-time",c:T.blue},{ico:"🚌",tip:"Add 4 EV shuttle routes from City Hall — current transport CO₂ above target by 8%",c:T.green},{ico:"💧",tip:"Concourse drinking fountains reducing single-use plastic by 2,400 bottles/hour",c:T.cyan}].map((tip,i)=>(
            <div key={i} style={{ display:"flex",gap:10,padding:"8px 0",borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
              <span style={{ fontSize:16,flexShrink:0 }}>{tip.ico}</span>
              <p style={{ fontSize:11,color:T.textSub,margin:0,lineHeight:1.6 }}>{tip.tip}</p>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{ padding:20 }}>
        <div style={{ fontSize:13,fontWeight:800,color:T.text,marginBottom:4 }}>Carbon Footprint by Fan Transport Mode</div>
        <div style={{ fontSize:11,color:T.muted,marginBottom:14 }}>AI calculates per-fan CO₂ and recommends greener options</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
          {[["🚇 Metro","0.04 kg","Recommended",T.green,T.greenDim],["🚌 Bus","0.09 kg","Good choice",T.blue,T.blueDim],["🚗 Car","1.24 kg","High impact",T.amber,T.amberDim],["✈️ Flew in","180 kg","Per person",T.red,T.redDim]].map(([mode,co2,label,c,bg])=>(
            <div key={mode} style={{ background:bg,borderRadius:10,padding:14,textAlign:"center",border:`1px solid ${c}20` }}>
              <div style={{ fontSize:20,marginBottom:4 }}>{mode.split(" ")[0]}</div>
              <div style={{ fontSize:13,fontWeight:900,color:c }}>{co2}</div>
              <div style={{ fontSize:9,color:T.muted,marginTop:2 }}>{mode.slice(2)}</div>
              <div style={{ fontSize:9,fontWeight:700,color:c,marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── ROOT APP ─────────────────────────────────────────────────────
export default function App() {
  const [view,setView]=useState("command");
  const topbars={
    command:["Command Bridge","Real-time global venue intelligence"],
    crowd:["CrowdFlow","Predictive crowd management"],
    fan:["FanAssist AI","Multilingual fan companion"],
    access:["AccessFirst","Accessibility AI companion"],
    staff:["StaffCopilot","Volunteer intelligence"],
    green:["GreenOps","Sustainability intelligence"],
  };
  const views={command:<CommandBridge/>,crowd:<CrowdFlow/>,fan:<FanAssist/>,access:<AccessFirst/>,staff:<StaffCopilot/>,green:<GreenOps/>};
  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <Ticker/>
      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
        <Sidebar active={view} onNav={setView}/>
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ padding:"11px 24px",borderBottom:`1px solid ${T.border}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
            <div>
              <div style={{ fontSize:16,fontWeight:800,color:T.text }}>{topbars[view][0]}</div>
              <div style={{ fontSize:11,color:T.muted }}>{topbars[view][1]}</div>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ display:"flex",alignItems:"center",gap:6,background:T.greenDim,borderRadius:20,padding:"4px 12px" }}>
                <PulsingDot/>
                <span style={{ fontSize:11,fontWeight:700,color:T.green }}>All Systems Live</span>
              </div>
              <div style={{ fontSize:11,color:T.muted,fontFamily:"monospace" }}>FIFA WC 2026</div>
            </div>
          </div>
          <div style={{ flex:1,overflowY:"auto" }}>{views[view]}</div>
        </div>
      </div>
    </div>
  );
}
