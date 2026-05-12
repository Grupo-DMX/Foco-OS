import { useState, useEffect, useRef } from "react";

const CATS = ["Estratégia","Vendas","Operações","Financeiro","Equipe","Marketing","Pessoal"];
const CC = {"Estratégia":"#534AB7","Vendas":"#ff3b3b","Operações":"#888","Financeiro":"#185FA5","Equipe":"#39ff14","Marketing":"#f5c518","Pessoal":"#c8ff00"};
const PC = {"Alta":"#ff3b3b","Média":"#f5c518","Baixa":"#39ff14"};
const PO = {"Alta":0,"Média":1,"Baixa":2};
const PRESETS = [{l:"25/5",f:25,b:5},{l:"50/10",f:50,b:10},{l:"90/15",f:90,b:15}];
const SK = "focoos_v6";
const neon="#39ff14",yel="#f5c518",red="#ff3b3b",bg="#0a0a0a",bg2="#111",bg3="#1a1a1a",bg4="#222",bdr="#2a2a2a",muted="#888",txt="#f0f0f0";

function todayKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}
function mL(m){if(!m)return"0m";return m>=60?Math.floor(m/60)+"h"+(m%60?" "+m%60+"m":""):m+"m";}
function loadData(){try{return JSON.parse(localStorage.getItem(SK)||"{}");}catch{return{};}}
function saveData(p){try{localStorage.setItem(SK,JSON.stringify(p));}catch{}}

const S={
  wrap:{background:bg,minHeight:"100vh",color:txt,fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:60},
  sh:{maxWidth:940,margin:"0 auto",padding:"20px 16px"},
  row:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24},
  pill:(c)=>({fontSize:11,color:c||muted,background:(c||muted)+"18",border:`.5px solid ${c||muted}44`,padding:"5px 12px",borderRadius:20,display:"flex",alignItems:"center",gap:6}),
  dot:(c)=>({width:6,height:6,borderRadius:"50%",background:c,boxShadow:`0 0 5px ${c}`}),
  grid4:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20},
  stat:(ac)=>({background:bg2,border:`.5px solid ${bdr}`,borderRadius:10,padding:"14px 16px",borderTop:`2px solid ${ac}`}),
  sN:(c)=>({fontSize:26,fontWeight:700,color:c,lineHeight:1}),
  sL:{fontSize:11,color:muted,marginTop:4,textTransform:"uppercase",letterSpacing:.5},
  tabs:{display:"flex",background:bg2,borderRadius:10,border:`.5px solid ${bdr}`,overflow:"hidden",marginBottom:20},
  tab:(a)=>({flex:1,padding:"10px 0",border:"none",background:a?bg3:"transparent",color:a?txt:muted,fontSize:13,fontWeight:a?600:400,cursor:"pointer",borderBottom:a?`.5px solid ${neon}`:"none"}),
  card:{background:bg2,border:`.5px solid ${bdr}`,borderRadius:16,padding:20,marginBottom:14},
  sec:{fontSize:11,color:muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10},
  two:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14},
  sel:{flex:1,minWidth:80,padding:8,borderRadius:8,border:`.5px solid ${bdr}`,background:bg4,color:txt,fontSize:13,outline:"none"},
  chip:(a)=>({padding:"4px 11px",borderRadius:20,border:`.5px solid ${a?neon:bdr}`,background:a?"#39ff1410":"transparent",color:a?neon:muted,fontSize:12,cursor:"pointer"}),
  badge:(c)=>({fontSize:10,padding:"2px 8px",borderRadius:20,background:c+"22",color:c,fontWeight:600}),
  check:(d)=>({width:20,height:20,borderRadius:"50%",border:`1.5px solid ${d?neon:bdr}`,background:d?neon:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center"}),
  btnP:{padding:"8px 18px",borderRadius:8,background:neon,color:"#000",border:"none",fontSize:13,cursor:"pointer",fontWeight:700},
  btnG:{padding:"8px 14px",borderRadius:8,border:`.5px solid ${bdr}`,background:"transparent",color:muted,fontSize:13,cursor:"pointer"},
  playBtn:(a)=>({padding:"3px 8px",borderRadius:6,border:`.5px solid ${a?neon:bdr}`,background:"transparent",color:a?neon:muted,cursor:"pointer",fontSize:13,flexShrink:0}),
  delBtn:{padding:"3px 6px",border:"none",background:"transparent",color:bdr,cursor:"pointer",fontSize:17,flexShrink:0},
  timerCard:{background:bg2,border:`.5px solid ${bdr}`,borderRadius:16,padding:24,display:"flex",flexDirection:"column",alignItems:"center"},
  btnRound:{width:42,height:42,borderRadius:"50%",border:`.5px solid ${bdr}`,background:"transparent",cursor:"pointer",fontSize:16,color:muted},
  btnPlay:(r)=>({width:60,height:60,borderRadius:"50%",border:"none",background:r?red:neon,cursor:"pointer",fontSize:22,color:"#000",fontWeight:700,boxShadow:`0 0 18px ${r?red:neon}66`}),
  presetBtn:(a)=>({padding:"5px 12px",borderRadius:20,border:`.5px solid ${a?neon:bdr}`,background:a?neon:"transparent",color:a?"#000":muted,fontSize:12,cursor:"pointer",fontWeight:a?700:400}),
};

export default function App(){
  const d = loadData();
  const [tasks,setTasks]=useState(d.tasks||[]);
  const [history,setHistory]=useState(d.history||{});
  const [sessions,setSessions]=useState(d.sessions||0);
  const [totalFocus,setTotalFocus]=useState(d.totalFocusMins||0);
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
  const workerRef=useRef(null);
  const stateRef=useRef({});

  // keep ref in sync for worker callback
  stateRef.current={phase,preset,activeId,tasks};

  useEffect(()=>{
    // Web Worker for background-safe timer
    const blob=new Blob([`
      let iv=null;
      self.onmessage=e=>{
        if(e.data==='start'){iv=setInterval(()=>self.postMessage('tick'),1000);}
        else if(e.data==='stop'){clearInterval(iv);}
      }
    `],{type:"application/javascript"});
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
            setPhase("break");
            return pr.b*60;
          }else{setPhase("focus");return pr.f*60;}
        }
        return s-1;
      });
    };
    return()=>{workerRef.current.terminate();URL.revokeObjectURL(url);};
  },[]);

  useEffect(()=>{
    saveData({tasks,history,sessions,totalFocusMins:totalFocus});
  },[tasks,history,sessions,totalFocus]);

  function startStop(){
    const next=!running;
    setRunning(next);
    workerRef.current.postMessage(next?'start':'stop');
  }
  function resetTimer(){workerRef.current.postMessage('stop');setRunning(false);setPhase("focus");setSecs(preset.f*60);}
  function skipPhase(){
    workerRef.current.postMessage('stop');setRunning(false);
    const n=phase==="focus"?"break":"focus";setPhase(n);setSecs((n==="focus"?preset.f:preset.b)*60);
  }
  function selPreset(p){if(running)return;setPreset(p);setPhase("focus");setSecs(p.f*60);}
  function focusTask(id){if(running)return;setActiveId(id);setPhase("focus");setSecs(preset.f*60);setTab("timer");}
  function addTask(){
    if(!form.title.trim())return;
    setTasks(ts=>[{id:Date.now(),title:form.title.trim(),cat:form.cat,prio:form.prio,mins:Number(form.mins),done:false,spentMins:0,created:Date.now()},...ts]);
    setForm(f=>({...f,title:""}));setAdding(false);
  }
  function toggleTask(id){setTasks(ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));}
  function removeTask(id){if(activeId===id){setActiveId(null);workerRef.current.postMessage('stop');setRunning(false);}setTasks(ts=>ts.filter(t=>t.id!==id));}
  function saveEdit(){
    if(!editEntry)return;
    setHistory(h=>{const day={...(h[editEntry.date]||{})};day[editEntry.cat]=Math.max(0,Number(editEntry.mins));if(day[editEntry.cat]===0)delete day[editEntry.cat];return{...h,[editEntry.date]:day};});
    setEditEntry(null);
  }
  function deleteHistEntry(date,cat){
    setHistory(h=>{const day={...(h[date]||{})};delete day[cat];const next={...h};if(Object.keys(day).length===0)delete next[date];else next[date]=day;return next;});
  }

  const pending=tasks.filter(t=>!t.done);
  const done=tasks.filter(t=>t.done);
  const activeTask=tasks.find(t=>t.id===activeId);
  const visible=filter==="Todas"?tasks:tasks.filter(t=>t.cat===filter);
  const total=(phase==="focus"?preset.f:preset.b)*60;
  const pct=(total-secs)/total;
  const R=62,circ=2*Math.PI*R;
  const todayH=history[todayKey()]||{};
  const catMinsToday={};CATS.forEach(c=>{catMinsToday[c]=todayH[c]||0;});
  const estTotal=pending.reduce((a,b)=>a+b.mins,0);
  const focusVsEst=estTotal>0?Math.round((totalFocus/estTotal)*100):0;
  const compRate=tasks.length?Math.round((done.length/tasks.length)*100):0;
  const highPrio=pending.filter(t=>t.prio==="Alta");
  const topPending=[...pending].sort((a,b)=>PO[a.prio]-PO[b.prio]).slice(0,3);
  const topCat=CATS.reduce((b,c)=>(catMinsToday[c]||0)>(catMinsToday[b]||0)?c:b,CATS[0]);

  // monthly chart
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

  return(
    <div style={S.wrap}>
      <div style={S.sh}>
        {/* HEADER */}
        <div style={S.row}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:neon,boxShadow:`0 0 8px ${neon}`}}/>
            <div style={{fontSize:20,fontWeight:700,letterSpacing:.5}}>FOCO<span style={{color:neon}}>OS</span></div>
          </div>
          <div style={S.pill()}>{dateStr}</div>
        </div>

        {/* STATS */}
        <div style={S.grid4}>
          {[{n:pending.length,l:"Pendentes",c:neon},{n:done.length,l:"Concluídas",c:yel},{n:sessions,l:"Sessões",c:red},{n:mL(totalFocus),l:"Foco Total",c:bdr,tc:txt}].map(x=>(
            <div key={x.l} style={S.stat(x.c)}><div style={S.sN(x.tc||x.c)}>{x.n}</div><div style={S.sL}>{x.l}</div></div>
          ))}
        </div>

        {/* TABS */}
        <div style={S.tabs}>
          {[["tasks","Tarefas"],["timer","Timer"],["dash","Dashboard"],["hist","Histórico"]].map(([id,lb])=>(
            <button key={id} style={S.tab(tab===id)} onClick={()=>setTab(id)}>{lb}</button>
          ))}
        </div>

        {/* TAREFAS */}
        {tab==="tasks"&&(
          <div style={S.card}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:13,color:muted}}>{visible.length} tarefa{visible.length!==1?"s":""}</div>
              <button style={S.btnP} onClick={()=>setAdding(a=>!a)}>+ Nova</button>
            </div>
            {adding&&(
              <div style={{background:bg3,border:`.5px solid ${bdr}`,borderRadius:10,padding:14,marginBottom:12}}>
                <input style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`.5px solid ${neon}`,background:bg4,color:txt,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10}}
                  placeholder="Título..." value={form.title} autoFocus
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&addTask()}/>
                <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                  <select style={S.sel} value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
                  <select style={S.sel} value={form.prio} onChange={e=>setForm(f=>({...f,prio:e.target.value}))}>{["Alta","Média","Baixa"].map(p=><option key={p}>{p}</option>)}</select>
                  <select style={S.sel} value={form.mins} onChange={e=>setForm(f=>({...f,mins:e.target.value}))}>{[15,25,30,45,60,90,120].map(m=><option key={m} value={m}>{m} min</option>)}</select>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={S.btnP} onClick={addTask}>Adicionar</button>
                  <button style={S.btnG} onClick={()=>setAdding(false)}>Cancelar</button>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {["Todas",...CATS].map(c=><button key={c} style={S.chip(filter===c)} onClick={()=>setFilter(c)}>{c}</button>)}
            </div>
            {visible.length===0?<div style={{textAlign:"center",color:muted,padding:"28px 0",fontSize:13}}>Nenhuma tarefa.</div>
              :visible.map((t,i)=>(
              <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 0",borderBottom:i===visible.length-1?"none":`.5px solid ${bdr}`,opacity:t.done?.5:1}}>
                <div style={S.check(t.done)} onClick={()=>toggleTask(t.id)}>{t.done&&<span style={{color:"#000",fontSize:11,fontWeight:800}}>✓</span>}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:3,textDecoration:t.done?"line-through":"none",color:t.done?muted:txt}}>{t.title}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={S.badge(CC[t.cat]||muted)}>{t.cat}</span>
                    <span style={S.badge(PC[t.prio]||muted)}>{t.prio}</span>
                    <span style={{fontSize:11,color:muted}}>⏱ {t.mins}m</span>
                    {t.spentMins>0&&<span style={{fontSize:11,color:neon}}>· {t.spentMins}m gasto</span>}
                  </div>
                </div>
                {!t.done&&<button style={S.playBtn(t.id===activeId)} onClick={()=>focusTask(t.id)}>▶</button>}
                <button style={S.delBtn} onClick={()=>removeTask(t.id)}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* TIMER */}
        {tab==="timer"&&(
          <div style={S.two}>
            <div>
              <div style={S.sec}>Timer de Foco</div>
              <div style={S.timerCard}>
                <div style={{display:"flex",gap:6,marginBottom:16}}>{PRESETS.map(p=><button key={p.l} style={S.presetBtn(preset===p)} onClick={()=>selPreset(p)}>{p.l}</button>)}</div>
                {activeTask?<div style={{fontSize:12,color:neon,background:"#39ff1415",border:".5px solid #39ff1430",padding:"4px 14px",borderRadius:20,marginBottom:14,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>▶ {activeTask.title}</div>
                  :<div style={{fontSize:12,color:muted,marginBottom:14}}>— selecione uma tarefa —</div>}
                <div style={{position:"relative",width:150,height:150,marginBottom:16}}>
                  <svg width={150} height={150} style={{transform:"rotate(-90deg)"}}>
                    <circle cx={75} cy={75} r={R} fill="none" stroke={bg4} strokeWidth={9}/>
                    <circle cx={75} cy={75} r={R} fill="none" stroke={phase==="focus"?neon:yel} strokeWidth={9}
                      strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
                      style={{transition:"stroke-dashoffset .8s linear,stroke .4s"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:30,fontWeight:700,letterSpacing:2}}>{fmt(secs)}</div>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:1.5,marginTop:2,color:phase==="focus"?neon:yel}}>{phase==="focus"?"FOCO":"PAUSA"}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <button style={S.btnRound} onClick={resetTimer}>↺</button>
                  <button style={S.btnPlay(running)} onClick={startStop}>{running?"⏸":"▶"}</button>
                  <button style={S.btnRound} onClick={skipPhase}>⏭</button>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {Array.from({length:Math.max(sessions,4)}).map((_,i)=>(
                    <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<sessions?neon:bdr,boxShadow:i<sessions?`0 0 5px ${neon}`:"none"}}/>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={S.sec}>Hoje por Categoria</div>
              <div style={S.card}>
                {CATS.filter(c=>catMinsToday[c]>0).length===0
                  ?<div style={{color:muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma sessão hoje ainda.</div>
                  :CATS.filter(c=>catMinsToday[c]>0).map(c=>(
                    <div key={c} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                        <span style={{color:CC[c]}}>{c}</span><span style={{color:muted}}>{catMinsToday[c]}m</span>
                      </div>
                      <div style={{height:6,background:bg4,borderRadius:3,overflow:"hidden"}}>
                        <div style={{width:Math.round((catMinsToday[c]/Math.max(...CATS.map(x=>catMinsToday[x]),1))*100)+"%",height:"100%",background:CC[c],borderRadius:3,transition:"width .6s"}}/>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {tab==="dash"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[
                {l:"Conclusão",v:compRate+"%",c:compRate>=70?neon:compRate>=40?yel:red,sub:`${done.length} de ${tasks.length}`},
                {l:"Foco vs Estimado",v:focusVsEst+"%",c:focusVsEst>=80?neon:focusVsEst>=40?yel:red,sub:`${mL(totalFocus)} de ${mL(estTotal)}`},
                {l:"Urgentes Abertas",v:highPrio.length,c:highPrio.length===0?neon:highPrio.length<=2?yel:red,sub:highPrio.length===0?"tudo ok":"prioridade alta"},
              ].map(k=>(
                <div key={k.l} style={{background:bg2,border:`.5px solid ${bdr}`,borderRadius:12,padding:16,borderTop:`2px solid ${k.c}`}}>
                  <div style={{fontSize:11,color:muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{k.l}</div>
                  <div style={{fontSize:28,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</div>
                  <div style={{fontSize:11,color:muted,marginTop:4}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* GRÁFICO MENSAL */}
            <div style={S.sec}>Foco Mensal por Categoria — {new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</div>
            <div style={{...S.card,overflowX:"auto"}}>
              {activeCats.length===0
                ?<div style={{color:muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>Complete sessões para ver o gráfico.</div>
                :<div>
                  <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} style={{display:"block",minWidth:320}}>
                    {[0,.25,.5,.75,1].map(f=>{
                      const y=PT+cH*(1-f);
                      return <g key={f}>
                        <line x1={PL} y1={y} x2={CW-PR} y2={y} stroke={bdr} strokeWidth={.5}/>
                        <text x={PL-4} y={y+4} textAnchor="end" fill={muted} fontSize={9}>{Math.round(maxY*f)}m</text>
                      </g>;
                    })}
                    {days.filter(d=>d===1||d%5===0||d===daysInMonth).map(d=>(
                      <text key={d} x={xP(d)} y={CH-6} textAnchor="middle" fill={muted} fontSize={9}>{d}</text>
                    ))}
                    <line x1={xP(now.getDate())} y1={PT} x2={xP(now.getDate())} y2={PT+cH} stroke={neon} strokeWidth={1} strokeDasharray="3,3" opacity={.4}/>
                    {activeCats.map(cat=>(
                      <g key={cat}>
                        <polyline points={days.map(d=>xP(d)+","+yP(monthData[cat][d-1])).join(" ")} fill="none" stroke={CC[cat]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={.9}/>
                        {days.map(d=>monthData[cat][d-1]>0?<circle key={d} cx={xP(d)} cy={yP(monthData[cat][d-1])} r={3} fill={CC[cat]}/>:null)}
                      </g>
                    ))}
                  </svg>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:10}}>
                    {activeCats.map(c=><div key={c} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:muted}}><div style={{width:16,height:3,borderRadius:2,background:CC[c]}}/>{c}</div>)}
                  </div>
                </div>
              }
            </div>

            <div style={S.two}>
              <div>
                <div style={S.sec}>Focar Agora</div>
                <div style={S.card}>
                  {topPending.length===0?<div style={{color:muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma pendente 🎯</div>
                    :topPending.map((t,i)=>(
                    <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i===topPending.length-1?"none":`.5px solid ${bdr}`}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:i===0?neon+"22":bg4,border:`.5px solid ${i===0?neon:bdr}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:i===0?neon:muted,fontWeight:700}}>{i+1}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:500,marginBottom:3,color:i===0?txt:muted}}>{t.title}</div>
                        <div style={{display:"flex",gap:4}}><span style={S.badge(CC[t.cat])}>{t.cat}</span><span style={S.badge(PC[t.prio])}>{t.prio}</span><span style={{fontSize:11,color:muted}}>⏱ {t.mins}m</span></div>
                      </div>
                      <button style={S.playBtn(t.id===activeId)} onClick={()=>focusTask(t.id)}>▶</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={S.sec}>Distribuição Hoje</div>
                <div style={S.card}>
                  {Object.keys(todayH).length===0?<div style={{color:muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma sessão hoje.</div>
                    :CATS.filter(c=>catMinsToday[c]>0).map(c=>{
                      const p=Math.round((catMinsToday[c]/Math.max(totalFocus,1))*100);
                      return(<div key={c} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                          <span style={{color:CC[c]}}>{c}</span><span style={{color:muted}}>{catMinsToday[c]}m · {p}%</span>
                        </div>
                        <div style={{height:6,background:bg4,borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:p+"%",height:"100%",background:CC[c],borderRadius:3,transition:"width .6s"}}/>
                        </div>
                      </div>);
                    })}
                  {Object.keys(todayH).length>0&&<div style={{marginTop:8,paddingTop:8,borderTop:`.5px solid ${bdr}`,fontSize:12,color:muted}}>Dominante: <span style={{color:CC[topCat],fontWeight:600}}>{topCat}</span></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTÓRICO */}
        {tab==="hist"&&(
          <div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              <button style={S.chip(histFilter==="all")} onClick={()=>setHistFilter("all")}>Todos</button>
              {months.map(m=><button key={m} style={S.chip(histFilter===m)} onClick={()=>setHistFilter(m)}>{new Date(m+"-01").toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}</button>)}
            </div>
            {filteredDates.length===0?<div style={{...S.card,textAlign:"center",color:muted,padding:"40px 0",fontSize:13}}>Nenhum registro ainda.</div>
              :filteredDates.map(date=>(
              <div key={date} style={S.card}>
                <div style={{fontSize:13,fontWeight:600,color:yel,marginBottom:12}}>
                  {new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}
                  <span style={{color:muted,fontWeight:400,fontSize:11,marginLeft:8}}>{mL(Object.values(history[date]).reduce((a,b)=>a+b,0))} total</span>
                </div>
                {Object.entries(history[date]).map(([cat,mins])=>(
                  <div key={cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:CC[cat]||muted,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:13,color:CC[cat]||muted}}>{cat}</div>
                    {editEntry&&editEntry.date===date&&editEntry.cat===cat
                      ?<div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input type="number" min="0" value={editEntry.mins} onChange={e=>setEditEntry(x=>({...x,mins:e.target.value}))}
                          style={{width:60,padding:"4px 8px",borderRadius:6,border:`.5px solid ${neon}`,background:bg4,color:txt,fontSize:12,outline:"none"}}/>
                        <span style={{fontSize:11,color:muted}}>min</span>
                        <button style={{...S.btnP,padding:"4px 10px",fontSize:12}} onClick={saveEdit}>✓</button>
                        <button style={{...S.btnG,padding:"4px 8px",fontSize:12}} onClick={()=>setEditEntry(null)}>✕</button>
                      </div>
                      :<div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13,color:muted}}>{mins}m</span>
                        <button style={{...S.btnG,padding:"3px 8px",fontSize:11}} onClick={()=>setEditEntry({date,cat,mins})}>editar</button>
                        <button style={{...S.delBtn,color:muted,fontSize:14}} onClick={()=>deleteHistEntry(date,cat)}>×</button>
                      </div>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div style={{textAlign:"center",fontSize:11,color:bdr,marginTop:32,letterSpacing:.5}}>FOCOOS · v6.0 · 2025</div>
      </div>
    </div>
  );
}
