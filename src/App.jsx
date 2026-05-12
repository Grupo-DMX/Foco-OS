import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const CATS = ["Estratégia","Vendas","Operações","Financeiro","Equipe","Marketing","Pessoal"];
const CC = {"Estratégia":"#534AB7","Vendas":"#ff3b3b","Operações":"#888","Financeiro":"#185FA5","Equipe":"#39ff14","Marketing":"#f5c518","Pessoal":"#c8ff00"};
const PC = {"Alta":"#ff3b3b","Média":"#f5c518","Baixa":"#39ff14"};
const PO = {"Alta":0,"Média":1,"Baixa":2};
const PRESETS = [{l:"25/5",f:25,b:5},{l:"50/10",f:50,b:10},{l:"90/15",f:90,b:15}];
const SK = "focoos_v7";
const neon="#39ff14",yel="#f5c518",red="#ff3b3b",bg="#0a0a0a",bg2="#111",bg3="#171717",bg4="#1e1e1e",bdr="#2a2a2a",muted="#666",txt="#f0f0f0";

// Focus Blocks config
const FOCUS_BLOCKS = [
  { id:"estrategico-am", label:"Estratégico AM",  start:"06:00", end:"09:00", color:"#534AB7", icon:"🎯" },
  { id:"power-am",       label:"Power Hour AM",   start:"09:00", end:"12:00", color:"#f5c518", icon:"⚡" },
  { id:"operacional-pm", label:"Operacional PM",  start:"13:00", end:"16:00", color:"#888",    icon:"⚙️" },
  { id:"deep-work-pm",   label:"Deep Work PM",    start:"16:00", end:"19:00", color:"#39ff14", icon:"🧠" },
];

function todayKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}
function mL(m){if(!m)return"0m";return m>=60?Math.floor(m/60)+"h"+(m%60?" "+m%60+"m":""):m+"m";}
function loadData(){try{return JSON.parse(localStorage.getItem(SK)||"{}");}catch{return{};}}
function saveData(p){try{localStorage.setItem(SK,JSON.stringify(p));}catch{}}
function timeToMins(t){const [h,m]=t.split(":").map(Number);return h*60+m;}
function minsToTime(m){return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");}

// Sound & Notification helpers
function playDing(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);
    osc.type="sine";osc.frequency.setValueAtTime(880,ctx.currentTime);
    gain.gain.setValueAtTime(0.3,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.8);
    osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.8);
  }catch(e){console.warn("Audio not supported");}
}
function sendNotification(title,body){
  if(Notification.permission==="granted"){
    new Notification(title,{body,icon:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>"});
  }
}
function fireConfetti(){
  confetti({particleCount:80,spread:70,origin:{y:0.6},colors:["#39ff14","#f5c518","#ff3b3b","#534AB7","#ffffff"]});
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  // layout
  wrap:  { background:bg, minHeight:"100vh", color:txt, fontFamily:"'Segoe UI',system-ui,sans-serif", paddingBottom:80 },
  inner: { maxWidth:1100, margin:"0 auto", padding:"0 18px" },

  // header
  header: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 0 20px", borderBottom:`1px solid ${bdr}`, marginBottom:24 },
  logo:   { display:"flex", alignItems:"center", gap:10 },
  logoDot:{ width:9, height:9, borderRadius:"50%", background:neon, boxShadow:`0 0 10px ${neon}` },
  logoTxt:{ fontSize:18, fontWeight:800, letterSpacing:1 },

  // stat bar
  statsRow:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 },
  statBox:(ac)=>({ background:bg2, border:`1px solid ${bdr}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }),
  statAccent:(c)=>({ position:"absolute", top:0, left:0, right:0, height:2, background:c, borderRadius:"12px 12px 0 0" }),
  statNum:(c)=>({ fontSize:28, fontWeight:800, color:c, lineHeight:1, marginBottom:4 }),
  statLbl:{ fontSize:10, color:muted, textTransform:"uppercase", letterSpacing:1 },

  // tabs
  tabBar:{ display:"flex", gap:2, background:bg2, border:`1px solid ${bdr}`, borderRadius:12, padding:4, marginBottom:24 },
  tabBtn:(a)=>({ flex:1, padding:"9px 0", border:"none", borderRadius:9, background:a?bg4:"transparent",
    color:a?txt:muted, fontSize:13, fontWeight:a?600:400, cursor:"pointer",
    transition:"all .15s", boxShadow:a?`0 0 0 1px ${bdr}`:"none" }),
  tabIndicator:(a)=>({ display:"block", width:4, height:4, borderRadius:"50%", background:a?neon:"transparent",
    margin:"0 auto", marginTop:2, transition:"background .15s" }),

  // generic card
  card:{ background:bg2, border:`1px solid ${bdr}`, borderRadius:14, padding:20, marginBottom:14 },
  cardSm:{ background:bg2, border:`1px solid ${bdr}`, borderRadius:14, padding:16, marginBottom:14 },

  // section label
  secLbl:{ fontSize:10, color:muted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:12, display:"flex", alignItems:"center", gap:6 },
  secLine:{ flex:1, height:1, background:bdr },

  // form
  input:{ width:"100%", padding:"10px 13px", borderRadius:9, border:`1px solid ${bdr}`, background:bg4, color:txt, fontSize:14, outline:"none", boxSizing:"border-box" },
  inputFocus:`1px solid ${neon}`,
  sel:{ flex:1, minWidth:80, padding:"9px 11px", borderRadius:9, border:`1px solid ${bdr}`, background:bg4, color:txt, fontSize:13, outline:"none" },

  // buttons
  btnPrimary:{ padding:"9px 20px", borderRadius:9, background:neon, color:"#000", border:"none", fontSize:13, cursor:"pointer", fontWeight:700 },
  btnGhost:{ padding:"9px 14px", borderRadius:9, border:`1px solid ${bdr}`, background:"transparent", color:muted, fontSize:13, cursor:"pointer" },
  btnIcon:(a)=>({ padding:"6px 10px", borderRadius:8, border:`1px solid ${a?neon:bdr}`, background:"transparent",
    color:a?neon:muted, cursor:"pointer", fontSize:14, flexShrink:0, transition:"all .15s" }),

  // chips / filters
  chip:(a)=>({ padding:"5px 13px", borderRadius:20, border:`1px solid ${a?neon:bdr}`,
    background:a?neon+"18":"transparent", color:a?neon:muted, fontSize:12, cursor:"pointer", transition:"all .15s" }),

  // badge
  badge:(c)=>({ fontSize:10, padding:"3px 9px", borderRadius:20, background:c+"1a", color:c, fontWeight:600, border:`1px solid ${c}33` }),

  // task item check circle
  check:(d)=>({ width:22, height:22, borderRadius:"50%", border:`2px solid ${d?neon:bdr}`,
    background:d?neon:"transparent", cursor:"pointer", flexShrink:0,
    display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }),

  // progress bar
  progTrack:{ height:5, background:bg4, borderRadius:99, overflow:"hidden" },
  progFill:(c,w)=>({ width:w, height:"100%", background:c, borderRadius:99, transition:"width .6s" }),

  // timer
  timerWrap:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" },
  timerPanel:{ background:bg2, border:`1px solid ${bdr}`, borderRadius:16, padding:28, display:"flex", flexDirection:"column", alignItems:"center" },
  timerRing:{ position:"relative", width:180, height:180, marginBottom:24, marginTop:8 },
  timerTime:{ fontSize:40, fontWeight:800, letterSpacing:3, fontVariantNumeric:"tabular-nums" },
  timerPhase:(c)=>({ fontSize:11, fontWeight:700, letterSpacing:2.5, color:c, marginTop:4 }),
  btnRound:{ width:46, height:46, borderRadius:"50%", border:`1px solid ${bdr}`, background:bg4, cursor:"pointer", fontSize:16, color:muted, display:"flex", alignItems:"center", justifyContent:"center" },
  btnPlay:(r)=>({ width:66, height:66, borderRadius:"50%", border:"none", background:r?red:neon, cursor:"pointer", fontSize:22, color:"#000", fontWeight:700, boxShadow:`0 0 24px ${r?red:neon}55`, display:"flex", alignItems:"center", justifyContent:"center" }),
  presetPill:(a)=>({ padding:"6px 14px", borderRadius:20, border:`1px solid ${a?neon:bdr}`,
    background:a?neon+"18":"transparent", color:a?neon:muted, fontSize:12, cursor:"pointer", fontWeight:a?700:400, transition:"all .15s" }),
  sessionDot:(a)=>({ width:7, height:7, borderRadius:"50%", background:a?neon:bdr, boxShadow:a?`0 0 6px ${neon}`:"none", transition:"all .3s" }),

  // date pill
  datePill:{ fontSize:12, color:muted, background:bg2, border:`1px solid ${bdr}`, padding:"6px 14px", borderRadius:20 },

  // hist
  histDate:{ fontSize:13, fontWeight:700, color:yel, marginBottom:10 },
  histSub:{ fontSize:11, color:muted, fontWeight:400, marginLeft:8 },
  delBtn:{ padding:"3px 6px", border:"none", background:"transparent", color:bdr, cursor:"pointer", fontSize:18, flexShrink:0, lineHeight:1 },
};

export default function App(){
  const d = loadData();
  const [tasks,setTasks]=useState(d.tasks||[]);
  const [history,setHistory]=useState(d.history||{});
  const [sessions,setSessions]=useState(d.sessions||0);
  const [totalFocus,setTotalFocus]=useState(d.totalFocusMins||0);
  const [schedule,setSchedule]=useState(d.schedule||{}); // { blockId: [taskId, ...], customSlots: [{start,end,taskId}] }
  const [tab,setTab]=useState("tasks");
  const [filter,setFilter]=useState("Todas");
  const [adding,setAdding]=useState(false);
  const [form,setForm]=useState({title:"",cat:"Estratégia",prio:"Alta",mins:25});
  const [activeId,setActiveId]=useState(null);
  const [preset,setPreset]=useState(PRESETS[0]);
  const [phase,setPhase]=useState("focus");
  const [secs,setSecs]=useState(PRESETS[0].f*60);
  const [running,setRunning]=useState(false);
  const [editEntry,setEditEntry]=useState(null);
  const [histFilter,setHistFilter]=useState("all");
  const [titleFocus,setTitleFocus]=useState(false);
  const [dragTask,setDragTask]=useState(null);
  const [plannerView,setPlannerView]=useState("split"); // "split" | "list" | "agenda"
  const workerRef=useRef(null);
  const stateRef=useRef({});
  stateRef.current={phase,preset,activeId,tasks};

  // Request notification permission on mount
  useEffect(()=>{
    if("Notification" in window && Notification.permission==="default"){
      Notification.requestPermission();
    }
  },[]);

  useEffect(()=>{
    const blob=new Blob([`let iv=null;self.onmessage=e=>{if(e.data==='start'){iv=setInterval(()=>self.postMessage('tick'),1000);}else if(e.data==='stop'){clearInterval(iv);}}`],{type:"application/javascript"});
    const url=URL.createObjectURL(blob);
    workerRef.current=new Worker(url);
    workerRef.current.onmessage=()=>{
      setSecs(s=>{
        if(s<=1){
          workerRef.current.postMessage('stop');
          setRunning(false);
          const {phase:ph,preset:pr,activeId:aid,tasks:ts}=stateRef.current;
          if(ph==="focus"){
            setSessions(n=>n+1);
            setTotalFocus(n=>n+pr.f);
            const tk=ts.find(t=>t.id===aid);
            if(tk){
              const dk=todayKey();
              setHistory(h=>{const day={...(h[dk]||{})};day[tk.cat]=(day[tk.cat]||0)+pr.f;return{...h,[dk]:day};});
              setTasks(prev=>prev.map(t=>t.id===aid?{...t,spentMins:(t.spentMins||0)+pr.f}:t));
            }
            playDing();
            sendNotification("Sessão de foco concluída!","Hora de uma pausa. Bom trabalho!");
            setPhase("break");return pr.b*60;
          }else{
            playDing();
            sendNotification("Pausa finalizada!","Pronto para mais uma sessão de foco?");
            setPhase("focus");return pr.f*60;
          }
        }
        return s-1;
      });
    };
    return()=>{workerRef.current.terminate();URL.revokeObjectURL(url);};
  },[]);

  useEffect(()=>{ saveData({tasks,history,sessions,totalFocusMins:totalFocus,schedule}); },[tasks,history,sessions,totalFocus,schedule]);

  function startStop(){const next=!running;setRunning(next);workerRef.current.postMessage(next?'start':'stop');}
  function resetTimer(){workerRef.current.postMessage('stop');setRunning(false);setPhase("focus");setSecs(preset.f*60);}
  function skipPhase(){workerRef.current.postMessage('stop');setRunning(false);const n=phase==="focus"?"break":"focus";setPhase(n);setSecs((n==="focus"?preset.f:preset.b)*60);}
  function selPreset(p){if(running)return;setPreset(p);setPhase("focus");setSecs(p.f*60);}
  function focusTask(id){if(running)return;setActiveId(id);setPhase("focus");setSecs(preset.f*60);setTab("timer");}
  function addTask(){if(!form.title.trim())return;setTasks(ts=>[{id:Date.now(),title:form.title.trim(),cat:form.cat,prio:form.prio,mins:Number(form.mins),done:false,spentMins:0,created:Date.now()},...ts]);setForm(f=>({...f,title:""}));setAdding(false);}
  function toggleTask(id){
    const task=tasks.find(t=>t.id===id);
    if(task&&!task.done) fireConfetti(); // fire only when marking as done
    setTasks(ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));
  }
  function removeTask(id){if(activeId===id){setActiveId(null);workerRef.current.postMessage('stop');setRunning(false);}setTasks(ts=>ts.filter(t=>t.id!==id));setSchedule(sc=>{const next={...sc};FOCUS_BLOCKS.forEach(b=>{if(next[b.id])next[b.id]=next[b.id].filter(tid=>tid!==id);});return next;});}
  function saveEdit(){if(!editEntry)return;setHistory(h=>{const day={...(h[editEntry.date]||{})};day[editEntry.cat]=Math.max(0,Number(editEntry.mins));if(day[editEntry.cat]===0)delete day[editEntry.cat];return{...h,[editEntry.date]:day};});setEditEntry(null);}
  function deleteHistEntry(date,cat){setHistory(h=>{const day={...(h[date]||{})};delete day[cat];const next={...h};if(Object.keys(day).length===0)delete next[date];else next[date]=day;return next;});}

  // Schedule functions
  function assignTaskToBlock(taskId, blockId){
    setSchedule(sc=>{
      const next={...sc};
      // Remove from other blocks first
      FOCUS_BLOCKS.forEach(b=>{
        if(next[b.id]) next[b.id]=next[b.id].filter(tid=>tid!==taskId);
      });
      // Add to target block
      if(!next[blockId]) next[blockId]=[];
      if(!next[blockId].includes(taskId)) next[blockId]=[...next[blockId],taskId];
      return next;
    });
  }
  function removeTaskFromBlock(taskId, blockId){
    setSchedule(sc=>{
      const next={...sc};
      if(next[blockId]) next[blockId]=next[blockId].filter(tid=>tid!==taskId);
      return next;
    });
  }
  function getTaskBlock(taskId){
    for(const b of FOCUS_BLOCKS){
      if(schedule[b.id]?.includes(taskId)) return b.id;
    }
    return null;
  }

  const pending=tasks.filter(t=>!t.done);
  const done=tasks.filter(t=>t.done);
  const activeTask=tasks.find(t=>t.id===activeId);
  const visible=filter==="Todas"?tasks:tasks.filter(t=>t.cat===filter);
  const total=(phase==="focus"?preset.f:preset.b)*60;
  const pct=(total-secs)/total;
  const R=80,circ=2*Math.PI*R;
  const todayH=history[todayKey()]||{};
  const catMinsToday={};CATS.forEach(c=>{catMinsToday[c]=todayH[c]||0;});
  const estTotal=pending.reduce((a,b)=>a+b.mins,0);
  const focusVsEst=estTotal>0?Math.round((totalFocus/estTotal)*100):0;
  const compRate=tasks.length?Math.round((done.length/tasks.length)*100):0;
  const highPrio=pending.filter(t=>t.prio==="Alta");
  const topPending=[...pending].sort((a,b)=>PO[a.prio]-PO[b.prio]).slice(0,3);
  const topCat=CATS.reduce((b,c)=>(catMinsToday[c]||0)>(catMinsToday[b]||0)?c:b,CATS[0]);

  // Unscheduled tasks (not assigned to any block)
  const scheduledIds = FOCUS_BLOCKS.flatMap(b=>schedule[b.id]||[]);
  const unscheduledPending = pending.filter(t=>!scheduledIds.includes(t.id));

  const now=new Date();
  const yr=now.getFullYear(),mo=String(now.getMonth()+1).padStart(2,"0");
  const daysInMonth=new Date(yr,now.getMonth()+1,0).getDate();
  const days=Array.from({length:daysInMonth},(_,i)=>i+1);
  const monthData={};
  CATS.forEach(c=>{monthData[c]=days.map(d=>{const k=`${yr}-${mo}-${String(d).padStart(2,"0")}`;return(history[k]||{})[c]||0;});});
  const activeCats=CATS.filter(c=>monthData[c].some(v=>v>0));
  const maxY=Math.max(10,...activeCats.flatMap(c=>monthData[c]));
  const CW=560,CH=200,PL=42,PR=10,PT=10,PB=30;
  const cW=CW-PL-PR,cH=CH-PT-PB;
  const xP=d=>PL+((d-1)/(daysInMonth-1||1))*cW;
  const yP=v=>PT+cH-(v/maxY)*cH;
  const histDates=Object.keys(history).sort((a,b)=>b.localeCompare(a));
  const filteredDates=histFilter==="all"?histDates:histDates.filter(d=>d.startsWith(histFilter));
  const months=[...new Set(histDates.map(d=>d.slice(0,7)))].sort((a,b)=>b.localeCompare(a));
  const dateStr=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});

  // group tasks: pending first sorted by priority, then done
  const pendingVisible=visible.filter(t=>!t.done).sort((a,b)=>PO[a.prio]-PO[b.prio]);
  const doneVisible=visible.filter(t=>t.done);

  // Current time indicator
  const currentMins = now.getHours()*60+now.getMinutes();
  const currentBlock = FOCUS_BLOCKS.find(b=>currentMins>=timeToMins(b.start)&&currentMins<timeToMins(b.end));

  return(
    <div style={T.wrap}>
      <div style={T.inner}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={T.header}>
          <div style={T.logo}>
            <div style={T.logoDot}/>
            <div style={T.logoTxt}>FOCO<span style={{color:neon}}>OS</span></div>
            <div style={{marginLeft:6,fontSize:10,color:muted,border:`1px solid ${bdr}`,borderRadius:5,padding:"2px 6px",letterSpacing:.5}}>v7</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {running&&(
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:red+"15",border:`1px solid ${red}33`}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:red,boxShadow:`0 0 6px ${red}`,display:"inline-block",animation:"pulse 1s infinite"}}/>
                <span style={{fontSize:12,color:red,fontWeight:600}}>Sessão ativa</span>
              </div>
            )}
            <div style={T.datePill}>{dateStr}</div>
          </div>
        </div>

        {/* ── STATS BAR ──────────────────────────────────────────────────── */}
        <div style={T.statsRow}>
          {[
            {n:pending.length, l:"Pendentes",   c:neon},
            {n:done.length,    l:"Concluídas",  c:yel},
            {n:sessions,       l:"Sessões",     c:red},
            {n:mL(totalFocus), l:"Foco Total",  c:"#444", tc:txt},
          ].map(x=>(
            <div key={x.l} style={T.statBox(x.c)}>
              <div style={T.statAccent(x.c)}/>
              <div style={T.statNum(x.tc||x.c)}>{x.n}</div>
              <div style={T.statLbl}>{x.l}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <div style={T.tabBar}>
          {[["tasks","Tarefas"],["timer","Timer"],["dash","Dashboard"],["hist","Histórico"]].map(([id,lb])=>(
            <button key={id} style={T.tabBtn(tab===id)} onClick={()=>setTab(id)}>
              {lb}
              <span style={T.tabIndicator(tab===id)}/>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: TAREFAS (Daily Planner)
        ═══════════════════════════════════════════════════════════════════ */}
        {tab==="tasks"&&(
          <div>
            {/* View toggle + Add button */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",gap:4}}>
                {[["split","Planner"],["list","Lista"],["agenda","Agenda"]].map(([v,l])=>(
                  <button key={v} style={T.chip(plannerView===v)} onClick={()=>setPlannerView(v)}>{l}</button>
                ))}
              </div>
              <button style={T.btnPrimary} onClick={()=>setAdding(true)}>+ Nova Tarefa</button>
            </div>

            {/* Add form modal */}
            {adding&&(
              <div style={{...T.card, border:`1px solid ${neon}33`, background:bg3, marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:600,color:neon,marginBottom:12,letterSpacing:.5}}>NOVA TAREFA</div>
                <input
                  style={{...T.input, marginBottom:12, border:`1px solid ${titleFocus?neon:bdr}`}}
                  placeholder="O que você vai fazer?"
                  value={form.title}
                  autoFocus
                  onFocus={()=>setTitleFocus(true)}
                  onBlur={()=>setTitleFocus(false)}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&addTask()}
                />
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                  <select style={T.sel} value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <select style={T.sel} value={form.prio} onChange={e=>setForm(f=>({...f,prio:e.target.value}))}>
                    {["Alta","Média","Baixa"].map(p=><option key={p}>{p}</option>)}
                  </select>
                  <select style={T.sel} value={form.mins} onChange={e=>setForm(f=>({...f,mins:e.target.value}))}>
                    {[15,25,30,45,60,90,120].map(m=><option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={T.btnPrimary} onClick={addTask}>Adicionar</button>
                  <button style={T.btnGhost} onClick={()=>setAdding(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {/* ─── PLANNER VIEW (Split) ─────────────────────────────────────── */}
            {plannerView==="split"&&(
              <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:16,alignItems:"start"}}>
                
                {/* LEFT: Task backlog */}
                <div>
                  <div style={{...T.secLbl, marginBottom:10}}>
                    <span>Backlog</span>
                    <span style={{marginLeft:6,fontSize:10,color:neon,fontWeight:700}}>{unscheduledPending.length}</span>
                    <div style={T.secLine}/>
                  </div>
                  
                  {/* Category filter */}
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                    {["Todas",...CATS].map(c=>(
                      <button key={c} style={{...T.chip(filter===c),padding:"3px 10px",fontSize:11}} onClick={()=>setFilter(c)}>{c}</button>
                    ))}
                  </div>
                  
                  <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:14,padding:12,minHeight:300,maxHeight:"calc(100vh - 420px)",overflowY:"auto"}}>
                    {unscheduledPending.filter(t=>filter==="Todas"||t.cat===filter).length===0?(
                      <div style={{color:muted,fontSize:12,textAlign:"center",padding:"30px 0"}}>
                        {pending.length===0?"Nenhuma tarefa pendente":"Todas as tarefas estão agendadas"}
                      </div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {unscheduledPending.filter(t=>filter==="Todas"||t.cat===filter).sort((a,b)=>PO[a.prio]-PO[b.prio]).map(t=>(
                          <div
                            key={t.id}
                            draggable
                            onDragStart={()=>setDragTask(t.id)}
                            onDragEnd={()=>setDragTask(null)}
                            style={{
                              background:bg3,
                              border:`1px solid ${dragTask===t.id?neon:bdr}`,
                              borderRadius:10,
                              padding:"10px 12px",
                              cursor:"grab",
                              transition:"all .15s",
                              opacity:dragTask===t.id?.6:1,
                            }}
                          >
                            <div style={{fontSize:13,fontWeight:500,color:txt,marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
                            <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                              <span style={T.badge(CC[t.cat])}>{t.cat}</span>
                              <span style={T.badge(PC[t.prio])}>{t.prio}</span>
                              <span style={{fontSize:10,color:muted}}>{t.mins}m</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Done tasks collapsed */}
                  {done.length>0&&(
                    <div style={{marginTop:12}}>
                      <div style={{...T.secLbl,marginBottom:8}}>
                        <span>Concluídas</span>
                        <span style={{marginLeft:6,fontSize:10,color:yel,fontWeight:700}}>{done.length}</span>
                        <div style={T.secLine}/>
                      </div>
                      <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:14,padding:12,maxHeight:140,overflowY:"auto",opacity:.7}}>
                        {done.slice(0,5).map(t=>(
                          <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${bdr}`}}>
                            <div style={{...T.check(true),width:16,height:16}}>
                              <span style={{color:"#000",fontSize:9,fontWeight:900}}>✓</span>
                            </div>
                            <span style={{fontSize:12,color:muted,textDecoration:"line-through",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</span>
                          </div>
                        ))}
                        {done.length>5&&<div style={{fontSize:11,color:muted,textAlign:"center",marginTop:6}}>+{done.length-5} mais</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Day schedule */}
                <div>
                  <div style={{...T.secLbl, marginBottom:10}}>
                    <span>Agenda do Dia</span>
                    <div style={T.secLine}/>
                  </div>
                  
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {FOCUS_BLOCKS.map(block=>{
                      const blockTasks = (schedule[block.id]||[]).map(tid=>tasks.find(t=>t.id===tid)).filter(Boolean);
                      const totalMins = blockTasks.reduce((a,t)=>a+(t.mins||0),0);
                      const isCurrentBlock = currentBlock?.id===block.id;
                      const blockDuration = timeToMins(block.end)-timeToMins(block.start);
                      
                      return(
                        <div
                          key={block.id}
                          onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=neon;}}
                          onDragLeave={e=>{e.currentTarget.style.borderColor=isCurrentBlock?block.color:bdr;}}
                          onDrop={e=>{
                            e.preventDefault();
                            e.currentTarget.style.borderColor=isCurrentBlock?block.color:bdr;
                            if(dragTask) assignTaskToBlock(dragTask,block.id);
                          }}
                          style={{
                            background:bg2,
                            border:`2px solid ${isCurrentBlock?block.color:bdr}`,
                            borderRadius:14,
                            overflow:"hidden",
                            transition:"border-color .15s",
                          }}
                        >
                          {/* Block header */}
                          <div style={{
                            background:block.color+"15",
                            borderBottom:`1px solid ${block.color}33`,
                            padding:"12px 16px",
                            display:"flex",
                            alignItems:"center",
                            justifyContent:"space-between",
                          }}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{fontSize:18}}>{block.icon}</span>
                              <div>
                                <div style={{fontSize:14,fontWeight:700,color:block.color}}>{block.label}</div>
                                <div style={{fontSize:11,color:muted}}>{block.start} — {block.end}</div>
                              </div>
                              {isCurrentBlock&&(
                                <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:block.color+"30",color:block.color,fontWeight:600,marginLeft:8}}>AGORA</span>
                              )}
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:18,fontWeight:800,color:totalMins>blockDuration?red:txt}}>{totalMins}m</div>
                              <div style={{fontSize:10,color:muted}}>de {blockDuration}m</div>
                            </div>
                          </div>
                          
                          {/* Block tasks */}
                          <div style={{padding:12,minHeight:60}}>
                            {blockTasks.length===0?(
                              <div style={{
                                border:`2px dashed ${bdr}`,
                                borderRadius:10,
                                padding:"20px 16px",
                                textAlign:"center",
                                color:muted,
                                fontSize:12,
                              }}>
                                Arraste tarefas aqui
                              </div>
                            ):(
                              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                {blockTasks.map((t,i)=>(
                                  <div key={t.id} style={{
                                    display:"flex",
                                    alignItems:"center",
                                    gap:10,
                                    background:bg3,
                                    border:`1px solid ${t.id===activeId?neon:bdr}`,
                                    borderRadius:10,
                                    padding:"10px 12px",
                                  }}>
                                    <div style={T.check(t.done)} onClick={()=>toggleTask(t.id)}>
                                      {t.done&&<span style={{color:"#000",fontSize:10,fontWeight:900}}>✓</span>}
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{
                                        fontSize:13,fontWeight:500,
                                        color:t.done?muted:t.id===activeId?neon:txt,
                                        textDecoration:t.done?"line-through":"none",
                                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"
                                      }}>{t.title}</div>
                                      <div style={{display:"flex",gap:4,marginTop:4}}>
                                        <span style={T.badge(CC[t.cat])}>{t.cat}</span>
                                        <span style={{fontSize:10,color:muted}}>{t.mins}m</span>
                                        {(t.spentMins||0)>0&&<span style={{fontSize:10,color:neon,fontWeight:600}}>{t.spentMins}m gasto</span>}
                                      </div>
                                    </div>
                                    <div style={{display:"flex",gap:4}}>
                                      {!t.done&&<button style={T.btnIcon(t.id===activeId)} onClick={()=>focusTask(t.id)} title="Focar">▶</button>}
                                      <button style={{padding:"4px 7px",border:"none",background:"transparent",color:muted,cursor:"pointer",fontSize:14}} onClick={()=>removeTaskFromBlock(t.id,block.id)} title="Remover do bloco">×</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Progress bar */}
                          {blockTasks.length>0&&(
                            <div style={{padding:"0 12px 12px"}}>
                              <div style={{...T.progTrack,height:4}}>
                                <div style={T.progFill(block.color,Math.min(100,Math.round((totalMins/blockDuration)*100))+"%")}/>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── LIST VIEW ─────────────────────────────────────────────────── */}
            {plannerView==="list"&&(
              <div>
                {/* Category filter */}
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                  {["Todas",...CATS].map(c=><button key={c} style={T.chip(filter===c)} onClick={()=>setFilter(c)}>{c}</button>)}
                </div>

                {/* Task list */}
                {visible.length===0?(
                  <div style={{...T.card, textAlign:"center", color:muted, padding:"40px 0", fontSize:13}}>
                    Nenhuma tarefa encontrada.
                  </div>
                ):(
                  <div>
                    {/* Pending tasks */}
                    {pendingVisible.length>0&&(
                      <div style={{marginBottom:8}}>
                        <div style={{...T.secLbl, marginBottom:10}}>
                          <span>Pendentes</span>
                          <div style={T.secLine}/>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {pendingVisible.map(t=>(
                            <TaskCard key={t.id} t={t} activeId={activeId} onToggle={toggleTask} onFocus={focusTask} onRemove={removeTask} T={T} PC={PC} CC={CC} bdr={bdr} txt={txt} muted={muted} neon={neon} bg4={bg4} schedule={schedule} FOCUS_BLOCKS={FOCUS_BLOCKS}/>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Done tasks */}
                    {doneVisible.length>0&&(
                      <div style={{marginTop:16}}>
                        <div style={{...T.secLbl, marginBottom:10}}>
                          <span>Concluídas</span>
                          <div style={T.secLine}/>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {doneVisible.map(t=>(
                            <TaskCard key={t.id} t={t} activeId={activeId} onToggle={toggleTask} onFocus={focusTask} onRemove={removeTask} T={T} PC={PC} CC={CC} bdr={bdr} txt={txt} muted={muted} neon={neon} bg4={bg4} schedule={schedule} FOCUS_BLOCKS={FOCUS_BLOCKS}/>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── AGENDA VIEW (Timeline) ────────────────────────────────────── */}
            {plannerView==="agenda"&&(
              <div style={{display:"grid",gridTemplateColumns:"60px 1fr",gap:0}}>
                {/* Time labels */}
                <div style={{paddingTop:8}}>
                  {FOCUS_BLOCKS.map((block,i)=>(
                    <div key={block.id} style={{height:140,display:"flex",flexDirection:"column",justifyContent:"flex-start",paddingTop:4}}>
                      <div style={{fontSize:11,color:muted,fontFamily:"monospace"}}>{block.start}</div>
                      {i===FOCUS_BLOCKS.length-1&&<div style={{fontSize:11,color:muted,fontFamily:"monospace",marginTop:"auto",paddingBottom:4}}>{block.end}</div>}
                    </div>
                  ))}
                </div>
                
                {/* Timeline blocks */}
                <div style={{position:"relative"}}>
                  {/* Current time line */}
                  {currentBlock&&(
                    <div style={{
                      position:"absolute",
                      left:0,right:0,
                      top:FOCUS_BLOCKS.findIndex(b=>b.id===currentBlock.id)*140 + ((currentMins-timeToMins(currentBlock.start))/(timeToMins(currentBlock.end)-timeToMins(currentBlock.start)))*140,
                      height:2,
                      background:red,
                      zIndex:10,
                      boxShadow:`0 0 8px ${red}`,
                    }}>
                      <div style={{position:"absolute",left:-4,top:-4,width:10,height:10,borderRadius:"50%",background:red}}/>
                    </div>
                  )}
                  
                  {FOCUS_BLOCKS.map(block=>{
                    const blockTasks = (schedule[block.id]||[]).map(tid=>tasks.find(t=>t.id===tid)).filter(Boolean);
                    const isCurrentBlock = currentBlock?.id===block.id;
                    
                    return(
                      <div
                        key={block.id}
                        onDragOver={e=>{e.preventDefault();e.currentTarget.style.background=block.color+"15";}}
                        onDragLeave={e=>{e.currentTarget.style.background=isCurrentBlock?block.color+"08":"transparent";}}
                        onDrop={e=>{
                          e.preventDefault();
                          e.currentTarget.style.background=isCurrentBlock?block.color+"08":"transparent";
                          if(dragTask) assignTaskToBlock(dragTask,block.id);
                        }}
                        style={{
                          height:140,
                          borderLeft:`3px solid ${block.color}`,
                          borderBottom:`1px solid ${bdr}`,
                          padding:"8px 12px",
                          background:isCurrentBlock?block.color+"08":"transparent",
                          transition:"background .15s",
                        }}
                      >
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <span style={{fontSize:14}}>{block.icon}</span>
                          <span style={{fontSize:13,fontWeight:600,color:block.color}}>{block.label}</span>
                          {isCurrentBlock&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:block.color,color:"#000",fontWeight:700}}>AGORA</span>}
                        </div>
                        
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {blockTasks.length===0?(
                            <div style={{fontSize:11,color:muted,fontStyle:"italic"}}>Arraste tarefas para este bloco</div>
                          ):blockTasks.map(t=>(
                            <div
                              key={t.id}
                              onClick={()=>!t.done&&focusTask(t.id)}
                              style={{
                                background:t.done?bg4:t.id===activeId?neon+"20":bg3,
                                border:`1px solid ${t.done?bdr:t.id===activeId?neon:bdr}`,
                                borderRadius:8,
                                padding:"6px 10px",
                                fontSize:12,
                                color:t.done?muted:t.id===activeId?neon:txt,
                                cursor:t.done?"default":"pointer",
                                textDecoration:t.done?"line-through":"none",
                                display:"flex",alignItems:"center",gap:6,
                                maxWidth:200,
                              }}
                            >
                              <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</span>
                              <span style={{fontSize:10,color:muted,flexShrink:0}}>{t.mins}m</span>
                              <button style={{padding:0,border:"none",background:"transparent",color:muted,cursor:"pointer",fontSize:12,lineHeight:1}} onClick={e=>{e.stopPropagation();removeTaskFromBlock(t.id,block.id);}}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: TIMER
        ══════════════════════════════════════════════════════════════════ */}
        {tab==="timer"&&(
          <div style={T.timerWrap}>

            {/* Left — Timer */}
            <div>
              <div style={{...T.secLbl, marginBottom:14}}>
                <span>Timer de Foco</span>
                <div style={T.secLine}/>
              </div>
              <div style={T.timerPanel}>
                {/* Presets */}
                <div style={{display:"flex",gap:6,marginBottom:20}}>
                  {PRESETS.map(p=>(
                    <button key={p.l} style={T.presetPill(preset===p)} onClick={()=>selPreset(p)}>{p.l}</button>
                  ))}
                </div>

                {/* Active task badge */}
                {activeTask?(
                  <div style={{fontSize:12,color:neon,background:neon+"12",border:`1px solid ${neon}25`,
                    padding:"5px 16px",borderRadius:20,marginBottom:20,maxWidth:220,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>
                    ▶ {activeTask.title}
                  </div>
                ):(
                  <div style={{fontSize:12,color:muted,marginBottom:20,padding:"5px 16px",background:bg4,borderRadius:20,border:`1px solid ${bdr}`}}>
                    — selecione uma tarefa —
                  </div>
                )}

                {/* SVG Ring */}
                <div style={T.timerRing}>
                  <svg width={180} height={180} style={{transform:"rotate(-90deg)"}}>
                    {/* Track */}
                    <circle cx={90} cy={90} r={R} fill="none" stroke={bg4} strokeWidth={10}/>
                    {/* Glow ring */}
                    <circle cx={90} cy={90} r={R} fill="none" stroke={phase==="focus"?neon:yel}
                      strokeWidth={10} strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
                      style={{transition:"stroke-dashoffset .8s linear,stroke .4s",filter:`drop-shadow(0 0 6px ${phase==="focus"?neon:yel})`}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={T.timerTime}>{fmt(secs)}</div>
                    <div style={T.timerPhase(phase==="focus"?neon:yel)}>{phase==="focus"?"FOCO":"PAUSA"}</div>
                  </div>
                </div>

                {/* Controls */}
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
                  <button style={T.btnRound} onClick={resetTimer} title="Reiniciar">
                    <span style={{fontSize:16}}>↺</span>
                  </button>
                  <button style={T.btnPlay(running)} onClick={startStop}>
                    <span>{running?"⏸":"▶"}</span>
                  </button>
                  <button style={T.btnRound} onClick={skipPhase} title="Pular fase">
                    <span style={{fontSize:16}}>⏭</span>
                  </button>
                </div>

                {/* Session dots */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div style={{fontSize:10,color:muted,letterSpacing:1,textTransform:"uppercase"}}>Sessões</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:160}}>
                    {Array.from({length:Math.max(sessions,4)}).map((_,i)=>(
                      <div key={i} style={T.sessionDot(i<sessions)}/>
                    ))}
                  </div>
                  {sessions>0&&<div style={{fontSize:11,color:neon,fontWeight:600}}>{sessions} sessão{sessions!==1?"s":""} hoje</div>}
                </div>
              </div>
            </div>

            {/* Right — Today stats + task selector */}
            <div>
              <div style={{...T.secLbl, marginBottom:14}}>
                <span>Hoje por Categoria</span>
                <div style={T.secLine}/>
              </div>

              <div style={T.card}>
                {CATS.filter(c=>catMinsToday[c]>0).length===0?(
                  <div style={{color:muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma sessão hoje ainda.</div>
                ):CATS.filter(c=>catMinsToday[c]>0).map(c=>(
                  <div key={c} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:CC[c],boxShadow:`0 0 5px ${CC[c]}`}}/>
                        <span style={{color:CC[c],fontWeight:600}}>{c}</span>
                      </div>
                      <span style={{color:muted,fontFamily:"monospace"}}>{catMinsToday[c]}m</span>
                    </div>
                    <div style={T.progTrack}>
                      <div style={T.progFill(CC[c],Math.round((catMinsToday[c]/Math.max(...CATS.map(x=>catMinsToday[x]),1))*100)+"%")}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tasks to focus on */}
              {pending.length>0&&(
                <>
                  <div style={{...T.secLbl, marginBottom:10, marginTop:4}}>
                    <span>Focar Agora</span>
                    <div style={T.secLine}/>
                  </div>
                  <div style={T.card}>
                    {pending.slice(0,4).map((t,i)=>(
                      <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<Math.min(pending.length,4)-1?`1px solid ${bdr}`:"none"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:i===0?neon+"20":bg4,border:`1px solid ${i===0?neon:bdr}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:i===0?neon:muted,fontWeight:700}}>{i+1}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,color:t.id===activeId?neon:i===0?txt:muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
                          <div style={{display:"flex",gap:4,marginTop:3}}>
                            <span style={T.badge(PC[t.prio])}>{t.prio}</span>
                            <span style={{fontSize:10,color:muted}}>⏱ {t.mins}m</span>
                          </div>
                        </div>
                        <button style={T.btnIcon(t.id===activeId)} onClick={()=>focusTask(t.id)} title="Focar">▶</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: DASHBOARD
        ══════════════════════════════════════════════════════════════════ */}
        {tab==="dash"&&(
          <div>
            {/* KPI row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
              {[
                {l:"Conclusão",       v:compRate+"%",    c:compRate>=70?neon:compRate>=40?yel:red,    sub:`${done.length} de ${tasks.length} tarefas`},
                {l:"Foco vs Estimado",v:focusVsEst+"%",  c:focusVsEst>=80?neon:focusVsEst>=40?yel:red,sub:`${mL(totalFocus)} de ${mL(estTotal)}`},
                {l:"Urgentes Abertas",v:highPrio.length, c:highPrio.length===0?neon:highPrio.length<=2?yel:red, sub:highPrio.length===0?"tudo ok":"prioridade alta"},
              ].map(k=>(
                <div key={k.l} style={{...T.statBox(), borderTop:`2px solid ${k.c}`}}>
                  <div style={T.statAccent(k.c)}/>
                  <div style={{fontSize:10,color:muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{k.l}</div>
                  <div style={{fontSize:30,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
                  <div style={{fontSize:11,color:muted,marginTop:5}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Monthly chart */}
            <div style={{...T.secLbl, marginBottom:10}}>
              <span>Foco Mensal por Categoria — {new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</span>
              <div style={T.secLine}/>
            </div>
            <div style={{...T.card, overflowX:"auto", marginBottom:18}}>
              {activeCats.length===0?(
                <div style={{color:muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>Complete sessões para ver o gráfico.</div>
              ):(
                <div>
                  <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} style={{display:"block",minWidth:320}}>
                    {[0,.25,.5,.75,1].map(f=>{const y=PT+cH*(1-f);return(
                      <g key={f}>
                        <line x1={PL} y1={y} x2={CW-PR} y2={y} stroke={bdr} strokeWidth={.5}/>
                        <text x={PL-4} y={y+4} textAnchor="end" fill={muted} fontSize={9}>{Math.round(maxY*f)}m</text>
                      </g>
                    );})}
                    {days.filter(d=>d===1||d%5===0||d===daysInMonth).map(d=>(
                      <text key={d} x={xP(d)} y={CH-6} textAnchor="middle" fill={muted} fontSize={9}>{d}</text>
                    ))}
                    <line x1={xP(now.getDate())} y1={PT} x2={xP(now.getDate())} y2={PT+cH} stroke={neon} strokeWidth={1} strokeDasharray="3,3" opacity={.5}/>
                    {activeCats.map(cat=>(
                      <g key={cat}>
                        <polyline points={days.map(d=>xP(d)+","+yP(monthData[cat][d-1])).join(" ")} fill="none" stroke={CC[cat]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={.9}/>
                        {days.map(d=>monthData[cat][d-1]>0?<circle key={d} cx={xP(d)} cy={yP(monthData[cat][d-1])} r={3} fill={CC[cat]}/>:null)}
                      </g>
                    ))}
                  </svg>
                  <div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:10}}>
                    {activeCats.map(c=>(
                      <div key={c} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:muted}}>
                        <div style={{width:16,height:3,borderRadius:2,background:CC[c]}}/>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <div style={{...T.secLbl, marginBottom:10}}><span>Focar Agora</span><div style={T.secLine}/></div>
                <div style={T.card}>
                  {topPending.length===0?(
                    <div style={{color:muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma pendente</div>
                  ):topPending.map((t,i)=>(
                    <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i===topPending.length-1?"none":`1px solid ${bdr}`}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:i===0?neon+"20":bg4,border:`1px solid ${i===0?neon:bdr}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:i===0?neon:muted,fontWeight:700}}>{i+1}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,marginBottom:3,color:i===0?txt:muted}}>{t.title}</div>
                        <div style={{display:"flex",gap:4}}>
                          <span style={T.badge(CC[t.cat])}>{t.cat}</span>
                          <span style={T.badge(PC[t.prio])}>{t.prio}</span>
                          <span style={{fontSize:10,color:muted}}>⏱ {t.mins}m</span>
                        </div>
                      </div>
                      <button style={T.btnIcon(t.id===activeId)} onClick={()=>focusTask(t.id)}>▶</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{...T.secLbl, marginBottom:10}}><span>Distribuição Hoje</span><div style={T.secLine}/></div>
                <div style={T.card}>
                  {Object.keys(todayH).length===0?(
                    <div style={{color:muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma sessão hoje.</div>
                  ):CATS.filter(c=>catMinsToday[c]>0).map(c=>{
                    const p=Math.round((catMinsToday[c]/Math.max(totalFocus,1))*100);
                    return(
                      <div key={c} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:CC[c]}}/>
                            <span style={{color:CC[c],fontWeight:600}}>{c}</span>
                          </div>
                          <span style={{color:muted,fontFamily:"monospace"}}>{catMinsToday[c]}m · {p}%</span>
                        </div>
                        <div style={T.progTrack}>
                          <div style={T.progFill(CC[c],p+"%")}/>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(todayH).length>0&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${bdr}`,fontSize:12,color:muted}}>
                      Dominante: <span style={{color:CC[topCat],fontWeight:700}}>{topCat}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: HISTÓRICO
        ══════════════════════════════════════════════════════════════════ */}
        {tab==="hist"&&(
          <div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              <button style={T.chip(histFilter==="all")} onClick={()=>setHistFilter("all")}>Todos</button>
              {months.map(m=>(
                <button key={m} style={T.chip(histFilter===m)} onClick={()=>setHistFilter(m)}>
                  {new Date(m+"-01").toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}
                </button>
              ))}
            </div>
            {filteredDates.length===0?(
              <div style={{...T.card, textAlign:"center", color:muted, padding:"40px 0", fontSize:13}}>
                Nenhum registro ainda.
              </div>
            ):filteredDates.map(date=>(
              <div key={date} style={T.card}>
                <div style={{display:"flex",alignItems:"baseline",gap:0,marginBottom:14}}>
                  <span style={T.histDate}>
                    {new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}
                  </span>
                  <span style={T.histSub}>{mL(Object.values(history[date]).reduce((a,b)=>a+b,0))} total</span>
                </div>
                {Object.entries(history[date]).map(([cat,mins])=>(
                  <div key={cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:CC[cat]||muted,flexShrink:0,boxShadow:`0 0 4px ${CC[cat]||muted}`}}/>
                    <div style={{flex:1,fontSize:13,color:CC[cat]||txt,fontWeight:500}}>{cat}</div>
                    {editEntry&&editEntry.date===date&&editEntry.cat===cat?(
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input type="number" min="0" value={editEntry.mins}
                          onChange={e=>setEditEntry(x=>({...x,mins:e.target.value}))}
                          style={{width:60,padding:"4px 8px",borderRadius:7,border:`1px solid ${neon}`,background:bg4,color:txt,fontSize:12,outline:"none"}}/>
                        <span style={{fontSize:11,color:muted}}>min</span>
                        <button style={{...T.btnPrimary,padding:"4px 10px",fontSize:12}} onClick={saveEdit}>✓</button>
                        <button style={{...T.btnGhost,padding:"4px 8px",fontSize:12}} onClick={()=>setEditEntry(null)}>✕</button>
                      </div>
                    ):(
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13,color:muted,fontFamily:"monospace"}}>{mins}m</span>
                        <button style={{...T.btnGhost,padding:"3px 9px",fontSize:11}} onClick={()=>setEditEntry({date,cat,mins})}>editar</button>
                        <button style={T.delBtn} onClick={()=>deleteHistEntry(date,cat)}>×</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <div style={{textAlign:"center",fontSize:10,color:bdr,marginTop:40,letterSpacing:1,paddingBottom:20}}>
          FOCOOS · v7.0 · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

// ── TaskCard component ──────────────────────────────────────────────────────
function TaskCard({t, activeId, onToggle, onFocus, onRemove, T, PC, CC, bdr, txt, muted, neon, bg4, schedule, FOCUS_BLOCKS}){
  const isActive = t.id === activeId;
  const spent = t.spentMins||0;
  const pct = t.mins>0?Math.min(100,Math.round((spent/t.mins)*100)):0;
  
  // Find which block this task is in
  const taskBlock = FOCUS_BLOCKS?.find(b=>schedule?.[b.id]?.includes(t.id));

  return(
    <div style={{
      background: isActive ? neon+"08" : "#111",
      border: `1px solid ${isActive?neon+"40":bdr}`,
      borderRadius:12,
      padding:"13px 14px",
      display:"flex",
      alignItems:"flex-start",
      gap:12,
      opacity: t.done ? .5 : 1,
      transition:"all .2s",
    }}>
      {/* Check */}
      <div style={T.check(t.done)} onClick={()=>onToggle(t.id)}>
        {t.done&&<span style={{color:"#000",fontSize:11,fontWeight:900,lineHeight:1}}>✓</span>}
      </div>

      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{
          fontSize:14, fontWeight:t.done?400:500,
          marginBottom:5,
          textDecoration:t.done?"line-through":"none",
          color:t.done?muted:isActive?neon:txt,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"
        }}>{t.title}</div>

        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom: pct>0?8:0}}>
          <span style={T.badge(CC[t.cat]||muted)}>{t.cat}</span>
          <span style={T.badge(PC[t.prio]||muted)}>{t.prio}</span>
          <span style={{fontSize:11,color:muted}}>⏱ {t.mins}m</span>
          {spent>0&&<span style={{fontSize:11,color:neon,fontWeight:600}}>{spent}m gasto</span>}
          {taskBlock&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:taskBlock.color+"20",color:taskBlock.color,fontWeight:600}}>{taskBlock.icon} {taskBlock.label}</span>}
        </div>

        {/* Spent progress */}
        {pct>0&&!t.done&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{...T.progTrack, flex:1}}>
              <div style={T.progFill(pct>=100?"#ff3b3b":neon, pct+"%")}/>
            </div>
            <span style={{fontSize:10,color:muted,fontFamily:"monospace",flexShrink:0}}>{pct}%</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
        {!t.done&&(
          <button style={T.btnIcon(isActive)} onClick={()=>onFocus(t.id)} title="Focar nessa tarefa">▶</button>
        )}
        <button style={{padding:"5px 7px",border:"none",background:"transparent",color:bdr,cursor:"pointer",fontSize:16,lineHeight:1}} onClick={()=>onRemove(t.id)} title="Remover">×</button>
      </div>
    </div>
  );
}
