import { useState, useEffect } from "react";

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://htugyftsspwcbljjbkqq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dWd5ZnRzc3B3Y2Jsampia3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDEzMjIsImV4cCI6MjA5NTkxNzMyMn0.xb38TY1pFAg6BIhKHMMEI402iKN7KVDvaIIbW5Gj33g";

const sb = async (path, options = {}) => {
  const res = await fetch(${SUPABASE_URL}/rest/v1/${path}, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: Bearer ${SUPABASE_KEY},
      "Content-Type": "application/json",
      Prefer: options.method === "POST" ? "return=representation" : undefined,
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return options.method === "DELETE" ? null : res.json();
};

const db = {
  get:    (table, query="")    => sb(${table}?${query}&apikey=${SUPABASE_KEY}),
  post:   (table, body)        => sb(table, { method:"POST", body: JSON.stringify(body) }),
  patch:  (table, id, body)    => sb(${table}?id=eq.${id}, { method:"PATCH", headers:{ Prefer:"return=representation" }, body: JSON.stringify(body) }),
  delete: (table, id)          => sb(${table}?id=eq.${id}, { method:"DELETE" }),
};

// ── CHECKLIST ─────────────────────────────────────────────────────────────────
const CHECKLIST = {
  higiene: {
    label: "Higiene y Limpieza", icon: "🧼", color: "#38bdf8",
    items: [
      "Superficies de preparación limpias y desinfectadas",
      "Personal usa guantes y cofia correctamente",
      "Ingredientes almacenados a temperatura correcta (<4°C)",
      "Área de lavado de manos habilitada con jabón y toallas",
      "Piso y paredes sin residuos visibles",
      "Campana extractora limpia y funcional",
    ],
  },
  seguridad: {
    label: "Seguridad", icon: "🔒", color: "#f472b6",
    items: [
      "Extintores vigentes y accesibles",
      "Salidas de emergencia despejadas y señalizadas",
      "Botiquín completo y visible",
      "Cables eléctricos sin daños aparentes",
      "Horno apagado correctamente fuera de turno",
    ],
  },
  marca: {
    label: "Estándares de Marca", icon: "🦁", color: "#fb923c",
    items: [
      "Uniformes con logo Zoo Pizza en buen estado",
      "Menú actualizado y en buen estado",
      "Señalización de marca visible en fachada",
      "Música ambiental según protocolo",
      "Presentación de platillos conforme al manual",
    ],
  },
  atencion: {
    label: "Atención al Cliente", icon: "⭐", color: "#a78bfa",
    items: [
      "Saludo al cliente en los primeros 30 segundos",
      "Personal conoce el menú y puede orientar",
      "Tiempo de entrega dentro del estándar (<20 min)",
      "Mesa limpia antes de sentar al cliente",
      "Despedida cordial y confirmación de satisfacción",
    ],
  },
};

const scoreColor = (s) => s >= 85 ? "#4ade80" : s >= 65 ? "#fbbf24" : "#f87171";
const sevColor   = { alta:"#f87171", media:"#fbbf24", baja:"#4ade80" };
const estColor   = { Abierta:"#f87171", "En proceso":"#fbbf24", Resuelta:"#4ade80" };
const catColor   = { higiene:"#38bdf8", seguridad:"#f472b6", marca:"#fb923c", atencion:"#a78bfa" };

const chip = (color, text) => (
  <span style={{ background:color+"22", color, padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:"0.5px" }}>{text}</span>
);

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  app:    { fontFamily:"'DM Mono', monospace", background:"#0a0a0f", minHeight:"100vh", color:"#e8e4dc" },
  header: { background:"#0f0f16", borderBottom:"1px solid #1e1e2e", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, zIndex:100 },
  page:   { maxWidth:900, margin:"0 auto", padding:"20px 16px" },
  card:   { background:"#0f0f16", border:"1px solid #1e1e2e", borderRadius:14 },
  kpi:    { background:"#0f0f16", border:"1px solid #1e1e2e", borderRadius:14, padding:"16px 18px" },
  title:  { fontFamily:"'Abril Fatface',cursive", fontSize:15, color:"#fb923c", marginBottom:14, letterSpacing:"0.5px" },
  chip:   (color) => ({ background:color+"22", color, padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:"0.5px" }),
  btn:    (color="#fb923c") => ({ background:color, border:"none", borderRadius:9, padding:"9px 18px", color:color==="#fb923c"?"#0a0a0f":"#e8e4dc", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'DM Mono',monospace", letterSpacing:"0.5px" }),
  input:  { background:"#1a1a24", border:"1px solid #2a2a38", borderRadius:8, padding:"8px 12px", color:"#e8e4dc", fontSize:12, fontFamily:"'DM Mono',monospace", width:"100%", boxSizing:"border-box" },
  navBtn: (active) => ({ background:active?"#fb923c":"transparent", color:active?"#0a0a0f":"#555", border:"none", borderRadius:8, padding:"6px 13px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Mono',monospace", letterSpacing:"0.5px", textTransform:"uppercase" }),
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("dashboard");
  const [sucursales, setSucursales] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Auditoría
  const [sucActiva, setSucActiva] = useState(null);
  const [auditCat, setAuditCat]   = useState("higiene");
  const [checks, setChecks]       = useState({});
  const [supervisor, setSupervisor] = useState("");
  const [obsText, setObsText]     = useState("");
  const [enviada, setEnviada]     = useState(false);
  const [saving, setSaving]       = useState(false);

  // Incidencias
  const [showForm, setShowForm]   = useState(false);
  const [nuevaInc, setNuevaInc]   = useState({ sucursal_id:"", categoria:"higiene", descripcion:"", severidad:"media", reportado_por:"", estado:"Abierta", foto_url:"" });

  // Nueva sucursal
  const [showSucForm, setShowSucForm] = useState(false);
  const [nuevaSuc, setNuevaSuc]   = useState({ nombre:"", ciudad:"", region:"", direccion:"", activa:true });

  const resetChecks = () => {
    const init = {};
    Object.entries(CHECKLIST).forEach(([cat,{items}]) => { init[cat] = items.map(()=>null); });
    setChecks(init);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, a, i] = await Promise.all([
        db.get("sucursales", "select=*&order=nombre.asc"),
        db.get("auditorias", "select=*&order=created_at.desc&limit=100"),
        db.get("incidencias", "select=*&order=created_at.desc&limit=100"),
      ]);
      setSucursales(s || []);
      setAuditorias(a || []);
      setIncidencias(i || []);
    } catch(e) {
      setError("No se pudo conectar con la base de datos. Verifica que las tablas estén creadas en Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Score de una sucursal basado en auditorías reales ──
  const getScore = (sucId) => {
    const auds = auditorias.filter(a => a.sucursal_id === sucId);
    if (!auds.length) return null;
    const last = auds[0];
    const scores = [last.score_higiene, last.score_seguridad, last.score_marca, last.score_atencion].filter(Boolean);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
  };

  const getIncCount = (sucId) => incidencias.filter(i => i.sucursal_id === sucId && i.estado !== "Resuelta").length;

  const calcScore = (cat) => {
    const arr = checks[cat] || [];
    const answered = arr.filter(v=>v!==null);
    if (!answered.length) return 0;
    return Math.round((answered.filter(v=>v===true).length / answered.length)*100);
  };

  // ── Enviar auditoría ──
  const enviarAuditoria = async () => {
    if (!sucActiva || !supervisor) return alert("Ingresa tu nombre como supervisor.");
    setSaving(true);
    try {
      await db.post("auditorias", {
        sucursal_id: sucActiva.id,
        supervisor,
        fecha: new Date().toISOString().split("T")[0],
        score_higiene:   calcScore("higiene"),
        score_seguridad: calcScore("seguridad"),
        score_marca:     calcScore("marca"),
        score_atencion:  calcScore("atencion"),
        observaciones:   obsText,
        estado:          "Enviada",
      });
      await loadAll();
      setEnviada(true);
    } catch(e) {
      alert("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Agregar incidencia ──
  const agregarInc = async () => {
    if (!nuevaInc.sucursal_id || !nuevaInc.descripcion) return alert("Completa los campos requeridos.");
    try {
      await db.post("incidencias", { ...nuevaInc, sucursal_id: parseInt(nuevaInc.sucursal_id) });
      await loadAll();
      setShowForm(false);
      setNuevaInc({ sucursal_id:"", categoria:"higiene", descripcion:"", severidad:"media", reportado_por:"", estado:"Abierta", foto_url:"" });
    } catch(e) { alert("Error: " + e.message); }
  };

  const resolverInc = async (id) => {
    try {
      await db.patch("incidencias", id, { estado:"Resuelta", fecha_cierre: new Date().toISOString().split("T")[0] });
      await loadAll();
    } catch(e) { alert("Error: " + e.message); }
  };

  // ── Agregar sucursal ──
  const agregarSuc = async () => {
    if (!nuevaSuc.nombre) return alert("El nombre es requerido.");
    try {
      await db.post("sucursales", nuevaSuc);
      await loadAll();
      setShowSucForm(false);
      setNuevaSuc({ nombre:"", ciudad:"", region:"", direccion:"", activa:true });
    } catch(e) { alert("Error: " + e.message); }
  };

  const promedio = sucursales.length
    ? Math.round(sucursales.reduce((acc,s)=>{ const sc=getScore(s.id); return sc ? acc+sc : acc; },0) / (sucursales.filter(s=>getScore(s.id)!==null).length||1))
    : 0;

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
      <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{fontFamily:"'Abril Fatface',cursive", fontSize:28, color:"#fb923c"}}>🦁 Zoo Pizza</div>
      <div style={{color:"#555", fontSize:12}}>Conectando con la base de datos...</div>
    </div>
  );

  if (error) return (
    <div style={{...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, padding:24}}>
      <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{fontSize:40}}>⚠️</div>
      <div style={{fontFamily:"'Abril Fatface',cursive", fontSize:20, color:"#f87171"}}>Error de conexión</div>
      <div style={{color:"#666", fontSize:12, textAlign:"center", maxWidth:400}}>{error}</div>
      <button onClick={loadAll} style={S.btn()}>REINTENTAR</button>
    </div>
  );

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <div style={S.header}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:34,height:34,background:"linear-gradient(135deg,#fb923c,#f97316)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🦁</div>
          <span style={{fontFamily:"'Abril Fatface',cursive",fontSize:20,color:"#fb923c"}}>Zoo Pizza</span>
          <span style={{...S.chip("#fb923c"),fontSize:9,marginLeft:4}}>SUPERVISOR</span>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {[["dashboard","📊 Dashboard"],["auditoria","📋 Auditoría"],["incidencias","🚨 Incidencias"],["sucursales","🏪 Sucursales"],["comparativo","📈 Comparativo"]].map(([v,l])=>(
            <button key={v} style={S.navBtn(tab===v)} onClick={()=>{setTab(v);setSucActiva(null);setEnviada(false);}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={S.page}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:22}}>
            {[
              {l:"Promedio General",       v: sucursales.filter(s=>getScore(s.id)!==null).length ? ${promedio}% : "—", c:"#fb923c", icon:"🎯"},
              {l:"Sucursales",             v: sucursales.length,                                                           c:"#38bdf8", icon:"🏪"},
              {l:"Auditorías Realizadas",  v: auditorias.length,                                                           c:"#4ade80", icon:"✅"},
              {l:"Incidencias Abiertas",   v: incidencias.filter(i=>i.estado==="Abierta").length,                          c:"#f87171", icon:"🚨"},
            ].map(k=>(
              <div key={k.l} style={S.kpi}>
                <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
                <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:28,color:k.c}}>{k.v}</div>
                <div style={{fontSize:10,color:"#444",marginTop:3,textTransform:"uppercase",letterSpacing:"0.5px"}}>{k.l}</div>
              </div>
            ))}
          </div>

          {sucursales.length === 0 ? (
            <div style={{...S.card,padding:40,textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>🏪</div>
              <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:18,color:"#fb923c",marginBottom:8}}>Aún no hay sucursales</div>
              <div style={{color:"#555",fontSize:12,marginBottom:16}}>Ve a la pestaña "Sucursales" para agregar tu primera sucursal.</div>
              <button onClick={()=>setTab("sucursales")} style={S.btn()}>AGREGAR SUCURSAL</button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {sucursales.map(s=>{
                const score = getScore(s.id);
                const incCount = getIncCount(s.id);
                const lastAud = auditorias.find(a=>a.sucursal_id===s.id);
                return (
                  <div key={s.id}
                    onClick={()=>{setSucActiva(s);setTab("auditoria");setEnviada(false);resetChecks();setSupervisor("");setObsText("");}}
                    style={{...S.card,padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"border-color .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#fb923c"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e2e"}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:38,height:38,background:"#1a1a24",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🦁</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{s.nombre}</div>
                        <div style={{fontSize:10,color:"#444",marginTop:2}}>
                          {s.ciudad}{s.region ? ` · ${s.region}` : ""} 
                          {lastAud ? ` · Última auditoría: ${lastAud.fecha}` : " · Sin auditorías aún"}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      {incCount>0 && <span style={S.chip("#f87171")}>{incCount} inc.</span>}
                      {score !== null ? (
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:22,color:scoreColor(score)}}>{score}%</div>
                          <div style={{width:70,height:3,background:"#1e1e2e",borderRadius:2,marginTop:4}}>
                            <div style={{width:${score}%,height:"100%",background:scoreColor(score),borderRadius:2}}/>
                          </div>
                        </div>
                      ) : <span style={S.chip("#555")}>Sin score</span>}
                      <span style={{color:"#333",fontSize:16}}>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>}

        {/* ── AUDITORÍA ── */}
        {tab==="auditoria" && <>
          {sucActiva
            ? <div style={{fontSize:10,color:"#fb923c",cursor:"pointer",marginBottom:14}} onClick={()=>{setSucActiva(null);setTab("dashboard");}}>← VOLVER AL DASHBOARD</div>
            : <div style={{...S.card,padding:24,textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:13,color:"#555",marginBottom:12}}>Selecciona una sucursal desde el Dashboard para iniciar una auditoría.</div>
                <button onClick={()=>setTab("dashboard")} style={S.btn()}>IR AL DASHBOARD</button>
              </div>
          }

          {sucActiva && !enviada && <>
            <div style={{...S.card,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:18,color:"#fb923c"}}>{sucActiva.nombre}</div>
                <div style={{fontSize:11,color:"#444",marginTop:2}}>{sucActiva.ciudad}</div>
              </div>
              <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:32,color:scoreColor(
                Math.round(Object.keys(checks).reduce((acc,cat)=>acc+calcScore(cat),0)/4)
              )}}>
                {Math.round(Object.keys(checks).reduce((acc,cat)=>acc+calcScore(cat),0)/4)}%
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <input placeholder="Tu nombre (supervisor)" value={supervisor} onChange={e=>setSupervisor(e.target.value)} style={{...S.input}}/>
            </div>

            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {Object.entries(CHECKLIST).map(([cat,{label,icon,color}])=>(
                <button key={cat} onClick={()=>setAuditCat(cat)} style={{background:auditCat===cat?color+"33":"#0f0f16",color:auditCat===cat?color:"#444",border:1px solid ${auditCat===cat?color:"#1e1e2e"},borderRadius:8,padding:"6px 13px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>
                  {icon} {label} <span style={{color:scoreColor(calcScore(cat)),marginLeft:4}}>{calcScore(cat)}%</span>
                </button>
              ))}
            </div>

            <div style={{...S.card,overflow:"hidden",marginBottom:14}}>
              {CHECKLIST[auditCat].items.map((item,i)=>(
                <div key={i} style={{padding:"13px 18px",borderBottom:"1px solid #1a1a24",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1,fontSize:12,color:checks[auditCat]?.[i]===null?"#888":checks[auditCat]?.[i]?"#e8e4dc":"#f87171"}}>{item}</div>
                  <div style={{display:"flex",gap:6}}>
                    {[true,false].map(val=>(
                      <button key={String(val)} onClick={()=>setChecks(p=>({...p,[auditCat]:p[auditCat].map((v,idx)=>idx===i?val:v)}))}
                        style={{width:40,height:26,borderRadius:6,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'DM Mono',monospace",
                          background:checks[auditCat]?.[i]===val?(val?"#4ade80":"#f87171"):"#1a1a24",
                          color:checks[auditCat]?.[i]===val?"#0a0a0f":"#444"}}>
                        {val?"SÍ":"NO"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <textarea placeholder="Observaciones generales (opcional)..." value={obsText} onChange={e=>setObsText(e.target.value)}
              style={{...S.input,height:72,resize:"vertical",marginBottom:12}}/>

            <button onClick={enviarAuditoria} disabled={saving} style={{...S.btn(),width:"100%",padding:"13px",fontSize:13,opacity:saving?.6:1}}>
              {saving ? "GUARDANDO..." : "ENVIAR AUDITORÍA ✓"}
            </button>
          </>}

          {enviada && (
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:56,marginBottom:14}}>✅</div>
              <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:26,color:"#4ade80",marginBottom:8}}>¡Auditoría guardada!</div>
              <div style={{color:"#555",fontSize:12,marginBottom:24}}>Los datos se guardaron en Supabase correctamente.</div>
              <button onClick={()=>{setTab("dashboard");setSucActiva(null);setEnviada(false);}} style={S.btn()}>VOLVER AL DASHBOARD</button>
            </div>
          )}
        </>}

        {/* ── INCIDENCIAS ── */}
        {tab==="incidencias" && <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={S.title}>INCIDENCIAS</div>
            <button onClick={()=>setShowForm(!showForm)} style={S.btn()}>+ NUEVA</button>
          </div>

          {showForm && (
            <div style={{...S.card,padding:18,marginBottom:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <select value={nuevaInc.sucursal_id} onChange={e=>setNuevaInc(p=>({...p,sucursal_id:e.target.value}))} style={S.input}>
                  <option value="">Selecciona sucursal…</option>
                  {sucursales.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <select value={nuevaInc.categoria} onChange={e=>setNuevaInc(p=>({...p,categoria:e.target.value}))} style={S.input}>
                  {Object.entries(CHECKLIST).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
                <select value={nuevaInc.severidad} onChange={e=>setNuevaInc(p=>({...p,severidad:e.target.value}))} style={S.input}>
                  <option value="alta">🔴 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="baja">🟢 Baja</option>
                </select>
                <input placeholder="Reportado por…" value={nuevaInc.reportado_por} onChange={e=>setNuevaInc(p=>({...p,reportado_por:e.target.value}))} style={S.input}/>
              </div>
              <input placeholder="Descripción de la incidencia…" value={nuevaInc.descripcion} onChange={e=>setNuevaInc(p=>({...p,descripcion:e.target.value}))} style={{...S.input,marginBottom:10}}/>
              <input placeholder="URL de foto de evidencia (opcional)" value={nuevaInc.foto_url} onChange={e=>setNuevaInc(p=>({...p,foto_url:e.target.value}))} style={{...S.input,marginBottom:10}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={agregarInc} style={S.btn()}>REGISTRAR</button>
                <button onClick={()=>setShowForm(false)} style={{...S.btn("#1a1a24"),color:"#888"}}>CANCELAR</button>
              </div>
            </div>
          )}

          {incidencias.length === 0 ? (
            <div style={{...S.card,padding:40,textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>🎉</div>
              <div style={{color:"#555",fontSize:13}}>No hay incidencias registradas.</div>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {incidencias.map(inc=>{
                const suc = sucursales.find(s=>s.id===inc.sucursal_id);
                return (
                  <div key={inc.id} style={{...S.card,padding:"14px 18px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                    <div style={{display:"flex",gap:12,flex:1}}>
                      <div style={{width:36,height:36,background:(catColor[inc.categoria]||"#555")+"22",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                        {CHECKLIST[inc.categoria]?.icon || "📌"}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{suc?.nombre || Sucursal #${inc.sucursal_id}}</div>
                        <div style={{fontSize:11,color:"#888",marginBottom:6}}>{inc.descripcion}</div>
                        {inc.foto_url && <a href={inc.foto_url} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#38bdf8"}}>📷 Ver evidencia</a>}
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
                          <span style={S.chip(catColor[inc.categoria]||"#555")}>{CHECKLIST[inc.categoria]?.label}</span>
                          <span style={S.chip(sevColor[inc.severidad]||"#555")}>Severidad {inc.severidad}</span>
                          <span style={{fontSize:10,color:"#333"}}>{inc.fecha_apertura || inc.created_at?.split("T")[0]}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                      <span style={S.chip(estColor[inc.estado]||"#555")}>{inc.estado}</span>
                      {inc.estado !== "Resuelta" && (
                        <button onClick={()=>resolverInc(inc.id)} style={{...S.btn("#1a1a24"),color:"#4ade80",fontSize:10,padding:"5px 10px"}}>RESOLVER</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>}

        {/* ── SUCURSALES ── */}
        {tab==="sucursales" && <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={S.title}>SUCURSALES ({sucursales.length})</div>
            <button onClick={()=>setShowSucForm(!showSucForm)} style={S.btn()}>+ AGREGAR</button>
          </div>

          {showSucForm && (
            <div style={{...S.card,padding:18,marginBottom:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <input placeholder="Nombre *" value={nuevaSuc.nombre} onChange={e=>setNuevaSuc(p=>({...p,nombre:e.target.value}))} style={S.input}/>
                <input placeholder="Ciudad" value={nuevaSuc.ciudad} onChange={e=>setNuevaSuc(p=>({...p,ciudad:e.target.value}))} style={S.input}/>
                <input placeholder="Región" value={nuevaSuc.region} onChange={e=>setNuevaSuc(p=>({...p,region:e.target.value}))} style={S.input}/>
                <input placeholder="Dirección" value={nuevaSuc.direccion} onChange={e=>setNuevaSuc(p=>({...p,direccion:e.target.value}))} style={S.input}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={agregarSuc} style={S.btn()}>GUARDAR</button>
                <button onClick={()=>setShowSucForm(false)} style={{...S.btn("#1a1a24"),color:"#888"}}>CANCELAR</button>
              </div>
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {sucursales.length === 0 ? (
              <div style={{...S.card,padding:40,textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:12}}>🏪</div>
                <div style={{color:"#555",fontSize:13}}>Agrega tu primera sucursal con el botón de arriba.</div>
              </div>
            ) : sucursales.map(s=>(
              <div key={s.id} style={{...S.card,padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,background:"#1a1a24",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}>🦁</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{s.nombre}</div>
                    <div style={{fontSize:10,color:"#444",marginTop:2}}>{[s.ciudad,s.region,s.direccion].filter(Boolean).join(" · ")}</div>
                  </div>
                </div>
                <span style={S.chip(s.activa?"#4ade80":"#f87171")}>{s.activa?"Activa":"Inactiva"}</span>
              </div>
            ))}
          </div>
        </>}

        {/* ── COMPARATIVO ── */}
        {tab==="comparativo" && <>
          <div style={S.title}>COMPARATIVO DE SUCURSALES</div>

          {sucursales.length === 0 ? (
            <div style={{...S.card,padding:40,textAlign:"center"}}>
              <div style={{color:"#555",fontSize:13}}>Agrega sucursales y realiza auditorías para ver el comparativo.</div>
            </div>
          ) : <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {label:"🏆 TOP — Mejores", list:[...sucursales].filter(s=>getScore(s.id)!==null).sort((a,b)=>(getScore(b.id)||0)-(getScore(a.id)||0)).slice(0,3), color:"#4ade80"},
                {label:"⚠️ Requieren atención", list:[...sucursales].filter(s=>getScore(s.id)!==null).sort((a,b)=>(getScore(a.id)||0)-(getScore(b.id)||0)).slice(0,3), color:"#f87171"},
              ].map(({label,list,color})=>(
                <div key={label} style={{...S.card,padding:"16px 18px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#555",marginBottom:12,letterSpacing:"0.5px",textTransform:"uppercase"}}>{label}</div>
                  {list.length === 0 ? <div style={{fontSize:11,color:"#444"}}>Sin datos aún</div> : list.map((s,idx)=>{
                    const score = getScore(s.id);
                    return (
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:idx<list.length-1?10:0}}>
                        <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:16,color:"#333",width:18}}>{idx+1}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600,marginBottom:3}}>{s.nombre}</div>
                          <div style={{width:"100%",height:3,background:"#1e1e2e",borderRadius:2}}>
                            <div style={{width:${score}%,height:"100%",background:color,borderRadius:2}}/>
                          </div>
                        </div>
                        <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:18,color}}>{score}%</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div style={{...S.card,overflow:"hidden"}}>
              <div style={{padding:"12px 18px",borderBottom:"1px solid #1e1e2e",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8}}>
                {["Sucursal","Score","Auditorías","Incidencias"].map(h=>(
                  <div key={h} style={{fontSize:9,color:"#444",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>{h}</div>
                ))}
              </div>
              {[...sucursales].sort((a,b)=>(getScore(b.id)||0)-(getScore(a.id)||0)).map((s,idx)=>{
                const score = getScore(s.id);
                const audCount = auditorias.filter(a=>a.sucursal_id===s.id).length;
                const incCount = getIncCount(s.id);
                return (
                  <div key={s.id} style={{padding:"11px 18px",borderBottom:idx<sucursales.length-1?"1px solid #1a1a24":"none",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:600}}>{s.nombre}<div style={{fontSize:10,color:"#444"}}>{s.ciudad}</div></div>
                    <div style={{fontFamily:"'Abril Fatface',cursive",fontSize:18,color:score?scoreColor(score):"#444"}}>{score ? ${score}% : "—"}</div>
                    <div style={{fontSize:12,color:"#888"}}>{audCount}</div>
                    <div style={{fontSize:12,color:incCount>0?"#f87171":"#4ade80",fontWeight:700}}>{incCount>0?${incCount} ⚠️:"—"}</div>
                  </div>
                );
              })}
            </div>
          </>}
        </>}

      </div>
    </div>
  );
}
