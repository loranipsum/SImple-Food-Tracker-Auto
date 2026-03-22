"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

const DB = {
  idli:{cal:39,p:1.9,c:8,f:0.2},dosa:{cal:133,p:3.5,c:25,f:2.5},upma:{cal:112,p:3,c:20,f:2.5},
  poha:{cal:165,p:3,c:34,f:2},rice:{cal:130,p:2.7,c:28,f:0.3},roti:{cal:71,p:2.5,c:15,f:0.4},
  chapati:{cal:71,p:2.5,c:15,f:0.4},paratha:{cal:166,p:3.5,c:25,f:6},
  dal:{cal:116,p:7,c:20,f:0.5},sambar:{cal:57,p:3,c:9,f:1},rasam:{cal:30,p:1.5,c:5,f:0.5},
  egg:{cal:78,p:6,c:0.6,f:5},omelette:{cal:154,p:10,c:2,f:12},
  banana:{cal:89,p:1.1,c:23,f:0.3},apple:{cal:52,p:0.3,c:14,f:0.2},
  orange:{cal:47,p:0.9,c:12,f:0.1},mango:{cal:60,p:0.8,c:15,f:0.4},
  milk:{cal:61,p:3.2,c:4.8,f:3.3},chai:{cal:45,p:1.5,c:7,f:1.2},
  tea:{cal:45,p:1.5,c:7,f:1.2},coffee:{cal:37,p:0.3,c:5,f:2},
  bread:{cal:79,p:2.7,c:15,f:1},butter:{cal:717,p:0.9,c:0.1,f:81},
  chicken:{cal:165,p:31,c:0,f:3.6},fish:{cal:136,p:20,c:0,f:6},
  paneer:{cal:265,p:18,c:3.4,f:20},samosa:{cal:262,p:4,c:30,f:14},
  vada:{cal:215,p:4,c:20,f:13},puri:{cal:133,p:2.5,c:18,f:6},
  pizza:{cal:266,p:11,c:33,f:10},burger:{cal:295,p:14,c:30,f:14},
  sandwich:{cal:210,p:8,c:30,f:7},yogurt:{cal:59,p:3.5,c:5,f:3.3},
  curd:{cal:59,p:3.5,c:5,f:3.3},lassi:{cal:87,p:3,c:12,f:3},
  chocolate:{cal:546,p:5,c:60,f:31},halwa:{cal:350,p:4,c:55,f:12},
  biryani:{cal:290,p:12,c:40,f:10},khichdi:{cal:140,p:5,c:25,f:3},
  oats:{cal:389,p:17,c:66,f:7},cornflakes:{cal:357,p:7,c:84,f:1},
  almonds:{cal:579,p:21,c:22,f:50},peanuts:{cal:567,p:26,c:16,f:49},
  potato:{cal:77,p:2,c:17,f:0.1},spinach:{cal:23,p:2.9,c:3.6,f:0.4},
  water:{cal:0,p:0,c:0,f:0},juice:{cal:55,p:0.5,c:13,f:0.2},cola:{cal:41,p:0,c:10.6,f:0},
  pav:{cal:120,p:3.5,c:23,f:1.5},bhaji:{cal:90,p:2,c:12,f:4},
  ladoo:{cal:175,p:3,c:26,f:7},kheer:{cal:150,p:4,c:22,f:5},
};

const CAL_GOAL=2000, P_GOAL=50, C_GOAL=275, F_GOAL=78;
const STORAGE_KEY="foodtracker_entries_v2";

function lookup(name) {
  if (!name) return null;
  const k = name.toLowerCase().trim();
  for (const [key, v] of Object.entries(DB)) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return null;
}

function getScaled(base, nos, weight) {
  if (!base) return null;
  const w = parseFloat(weight), n = parseFloat(nos);
  if (weight && !isNaN(w)) return { cal: Math.round(base.cal/100*w), p: +(base.p/100*w).toFixed(1), c: +(base.c/100*w).toFixed(1), f: +(base.f/100*w).toFixed(1) };
  if (nos && !isNaN(n)) return { cal: Math.round(base.cal*n), p: +(base.p*n).toFixed(1), c: +(base.c*n).toFixed(1), f: +(base.f*n).toFixed(1) };
  return { cal: base.cal, p: +base.p.toFixed(1), c: +base.c.toFixed(1), f: +base.f.toFixed(1) };
}

export default function Home() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState("add");
  const [entries, setEntries] = useState([]);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);

  const [name, setName] = useState("");
  const [nos, setNos] = useState("");
  const [weight, setWeight] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [mProtein, setMProtein] = useState("");
  const [mCarbs, setMCarbs] = useState("");
  const [mFat, setMFat] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch(e) {}
  }, []);

  const save = useCallback((newEntries) => {
    setEntries(newEntries);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries)); } catch(e) {}
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const base = lookup(name);
  const scaled = getScaled(base, nos, weight);
  const hasManual = manualCal !== "" && parseFloat(manualCal) >= 0;
  const autoCalories = scaled ? scaled.cal : null;
  const displayCal = hasManual ? Math.round(parseFloat(manualCal)) : autoCalories;

  const totalCal = entries.reduce((s, e) => s + e.calories, 0);
  const totalP = +entries.reduce((s, e) => s + e.protein, 0).toFixed(1);
  const totalC = +entries.reduce((s, e) => s + e.carbs, 0).toFixed(1);
  const totalF = +entries.reduce((s, e) => s + e.fat, 0).toFixed(1);
  const calPct = Math.min(100, Math.round(totalCal / CAL_GOAL * 100));

  async function syncToSheet(entry) {
    if (!session?.accessToken) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      if (data.status === "ok") {
        showToast("Synced to Google Sheets ✓");
      } else if (data.status === "duplicate") {
        showToast("Already in Sheet — skipped");
      } else {
        showToast("Sync failed: " + (data.error || "unknown error"));
      }
    } catch(e) {
      showToast("Sync failed — check connection");
    }
    setSyncing(false);
  }

  async function addEntry() {
    if (!name.trim()) { showToast("Please enter a food item"); return; }
    let calories, source;
    if (hasManual) { calories = Math.round(parseFloat(manualCal)); source = "manual"; }
    else if (scaled) { calories = scaled.cal; source = "auto"; }
    else { calories = 0; source = "manual"; }
    const protein = mProtein !== "" ? +parseFloat(mProtein).toFixed(1) : (scaled ? scaled.p : 0);
    const carbs   = mCarbs !== ""   ? +parseFloat(mCarbs).toFixed(1)   : (scaled ? scaled.c : 0);
    const fat     = mFat !== ""     ? +parseFloat(mFat).toFixed(1)     : (scaled ? scaled.f : 0);
    const now = new Date();
    const entry = {
      id: now.getTime().toString(),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
      name: name.trim(), nos, weight, calories, source, protein, carbs, fat,
    };
    const newEntries = [...entries, entry];
    save(newEntries);
    setName(""); setNos(""); setWeight(""); setManualCal("");
    setMProtein(""); setMCarbs(""); setMFat("");
    showToast("Added: " + entry.name + " · " + calories + " kcal");
    await syncToSheet(entry);
  }

  function deleteEntry(i) {
    const newEntries = entries.filter((_, idx) => idx !== i);
    save(newEntries);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dateShort = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  if (status === "loading") {
    return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--green)",color:"#fff",fontFamily:"DM Sans, sans-serif",fontSize:"16px"}}>Loading…</div>;
  }

  if (!session) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--green)",padding:"2rem",textAlign:"center"}}>
        <div style={{fontSize:"48px",marginBottom:"20px"}}>🥗</div>
        <h1 style={{color:"#fff",fontSize:"24px",fontWeight:"500",marginBottom:"8px",fontFamily:"DM Sans, sans-serif"}}>Food Tracker</h1>
        <p style={{color:"rgba(255,255,255,0.7)",fontSize:"14px",marginBottom:"32px",fontFamily:"DM Sans, sans-serif"}}>Sign in to start tracking — entries sync to Google Sheets automatically</p>
        <button onClick={() => signIn("google")} style={{padding:"14px 28px",background:"#fff",color:"var(--green)",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:"500",cursor:"pointer",fontFamily:"DM Sans, sans-serif",display:"flex",alignItems:"center",gap:"10px"}}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div id="app" style={{display:"flex",flexDirection:"column",height:"100%",maxWidth:"430px",margin:"0 auto",background:"var(--surface)",position:"relative"}}>

      {/* HEADER */}
      <div style={{background:"var(--green)",padding:"calc(var(--safe-top) + 14px) 20px 0",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
          <div>
            <h1 style={{fontSize:"22px",fontWeight:"500",color:"#fff",letterSpacing:"-0.3px"}}>Food Tracker</h1>
            <p style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",marginTop:"1px"}}>{dateStr}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)"}}>{dateShort}</div>
            <button onClick={() => signOut()} style={{fontSize:"10px",color:"rgba(255,255,255,0.5)",background:"none",border:"none",cursor:"pointer",marginTop:"4px",fontFamily:"DM Sans, sans-serif"}}>Sign out</button>
          </div>
        </div>
        <div style={{padding:"0 0 14px"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:"5px",marginBottom:"4px"}}>
            <span style={{fontSize:"28px",fontWeight:"500",color:"#fff",fontFamily:"DM Mono, monospace"}}>{totalCal}</span>
            <span style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>kcal</span>
            {syncing && <span style={{fontSize:"11px",color:"var(--green-accent)",marginLeft:"6px"}}>syncing…</span>}
          </div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)",marginBottom:"6px"}}>
            {totalCal <= CAL_GOAL ? (CAL_GOAL - totalCal) + " kcal remaining" : (totalCal - CAL_GOAL) + " kcal over goal"}
          </div>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:"4px",height:"5px"}}>
            <div style={{background:"var(--green-accent)",height:"5px",borderRadius:"4px",width:calPct+"%",transition:"width 0.5s"}}></div>
          </div>
        </div>
      </div>

      {/* MACROS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",padding:"10px 16px",background:"var(--surface)",borderBottom:"0.5px solid var(--border)",flexShrink:0}}>
        {[["Protein",totalP,"g","#378ADD",P_GOAL],["Carbs",totalC,"g","#EF9F27",C_GOAL],["Fat",totalF,"g","#D4537E",F_GOAL]].map(([label,val,unit,color,goal]) => (
          <div key={label} style={{background:"var(--surface-2)",borderRadius:"var(--radius)",padding:"8px 10px"}}>
            <div style={{fontSize:"10px",color:"var(--text-3)",marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</div>
            <div><span style={{fontSize:"16px",fontWeight:"500",fontFamily:"DM Mono, monospace"}}>{val}</span><span style={{fontSize:"10px",color:"var(--text-3)"}}> {unit}</span></div>
            <div style={{height:"3px",borderRadius:"2px",background:"var(--border)",marginTop:"5px"}}>
              <div style={{height:"3px",borderRadius:"2px",background:color,width:Math.min(100,Math.round(val/goal*100))+"%",transition:"width 0.5s"}}></div>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{display:"flex",background:"var(--surface)",borderBottom:"0.5px solid var(--border)",flexShrink:0}}>
        {[["add","Add food"],["log",`Log (${entries.length})`]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{flex:1,padding:"10px 4px",fontSize:"12px",fontWeight:tab===id?"500":"400",border:"none",background:"none",cursor:"pointer",color:tab===id?"var(--green)":"var(--text-3)",borderBottom:tab===id?"2px solid var(--green)":"2px solid transparent",transition:"all 0.2s",fontFamily:"DM Sans, sans-serif"}}>
            {label}
          </button>
        ))}
      </div>

      {/* PANELS */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>

        {/* ADD FOOD */}
        {tab === "add" && (
          <div style={{padding:"16px 16px calc(var(--safe-bottom) + 80px)"}}>
            <div style={{marginBottom:"13px"}}>
              <div style={{fontSize:"10px",fontWeight:"500",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"5px",display:"flex",alignItems:"center",gap:"5px"}}>
                <span style={{width:"5px",height:"5px",background:"var(--red)",borderRadius:"50%",display:"inline-block"}}></span> Food / Beverage item
              </div>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Idli, Chai, Banana…" autoComplete="off" style={{width:"100%",padding:"10px 12px",border:"0.5px solid var(--border-2)",borderRadius:"var(--radius)",fontSize:"15px",background:"var(--surface)",color:"var(--text)",fontFamily:"DM Sans, sans-serif",WebkitAppearance:"none"}} />
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"13px"}}>
              <div>
                <div style={{fontSize:"10px",fontWeight:"500",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"5px"}}>Nos <span style={{fontWeight:"400",textTransform:"none",letterSpacing:"0"}}>(optional)</span></div>
                <input value={nos} onChange={e=>setNos(e.target.value)} type="number" min="0" step="0.5" placeholder="e.g. 2" inputMode="decimal" style={{width:"100%",padding:"10px 12px",border:"0.5px solid var(--border-2)",borderRadius:"var(--radius)",fontSize:"15px",background:"var(--surface)",color:"var(--text)",fontFamily:"DM Sans, sans-serif",WebkitAppearance:"none"}} />
              </div>
              <div>
                <div style={{fontSize:"10px",fontWeight:"500",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"5px"}}>Weight <span style={{fontWeight:"400",textTransform:"none",letterSpacing:"0"}}>(g/ml)</span></div>
                <input value={weight} onChange={e=>setWeight(e.target.value)} type="number" min="0" placeholder="e.g. 150" inputMode="decimal" style={{width:"100%",padding:"10px 12px",border:"0.5px solid var(--border-2)",borderRadius:"var(--radius)",fontSize:"15px",background:"var(--surface)",color:"var(--text)",fontFamily:"DM Sans, sans-serif",WebkitAppearance:"none"}} />
              </div>
            </div>

            <div style={{marginBottom:"13px"}}>
              <div style={{fontSize:"10px",fontWeight:"500",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"5px"}}>Calories</div>
              <div style={{padding:"10px 12px",borderRadius:"var(--radius)",fontSize:"14px",minHeight:"40px",display:"flex",alignItems:"center",justifyContent:"space-between",border:hasManual?"0.5px solid var(--amber-border)":displayCal!==null?"0.5px solid var(--green-border)":"0.5px solid var(--border-2)",background:hasManual?"var(--amber)":displayCal!==null?"var(--green-light)":"var(--surface-2)",color:hasManual?"var(--amber-dark)":displayCal!==null?"var(--green-mid)":"var(--text-3)"}}>
                <span>{displayCal !== null ? displayCal + " kcal" : name ? "Not in database" : "—"}</span>
                {hasManual && <span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"5px",background:"var(--amber-mid)",color:"#fff",fontWeight:"500"}}>manual override</span>}
              </div>
              <div style={{fontSize:"10px",color:"var(--text-3)",marginTop:"3px"}}>
                {hasManual ? "Manual entry active — overrides auto" : displayCal !== null ? "Auto-estimated from database" : name ? "Enter calories manually below" : "Enter food name to auto-estimate"}
              </div>
            </div>

            <div style={{textAlign:"center",fontSize:"10px",color:"var(--text-3)",margin:"4px 0 10px",position:"relative"}}>
              <span style={{background:"var(--surface)",padding:"0 8px",position:"relative",zIndex:1}}>manual override</span>
              <div style={{position:"absolute",top:"50%",left:0,right:0,height:"0.5px",background:"var(--border-2)",zIndex:0}}></div>
            </div>

            <div style={{marginBottom:"13px"}}>
              <div style={{fontSize:"10px",fontWeight:"500",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"5px"}}>Calories — manual <span style={{fontWeight:"400",textTransform:"none",letterSpacing:"0"}}>(takes priority)</span></div>
              <div style={{position:"relative"}}>
                <input value={manualCal} onChange={e=>setManualCal(e.target.value)} type="number" min="0" placeholder="kcal" inputMode="decimal" style={{width:"100%",padding:"10px 12px",paddingRight:manualCal?"50px":"12px",border:"0.5px solid var(--border-2)",borderRadius:"var(--radius)",fontSize:"15px",background:"var(--surface)",color:"var(--text)",fontFamily:"DM Sans, sans-serif",WebkitAppearance:"none"}} />
                {manualCal && <button onClick={()=>setManualCal("")} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",fontSize:"11px",color:"var(--red)",background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans, sans-serif"}}>clear</button>}
              </div>
            </div>

            <div style={{marginBottom:"13px"}}>
              <div style={{fontSize:"10px",fontWeight:"500",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"5px"}}>Macros <span style={{fontWeight:"400",textTransform:"none",letterSpacing:"0"}}>(optional)</span></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                {[["Protein","#0C447C",mProtein,setMProtein],["Carbs","#633806",mCarbs,setMCarbs],["Fat","#72243E",mFat,setMFat]].map(([label,color,val,setter]) => (
                  <div key={label}>
                    <div style={{fontSize:"10px",color,marginBottom:"3px",fontWeight:"500"}}>{label} (g)</div>
                    <input value={val} onChange={e=>setter(e.target.value)} type="number" min="0" step="0.1" placeholder="0" inputMode="decimal" style={{width:"100%",padding:"8px 10px",border:"0.5px solid var(--border-2)",borderRadius:"var(--radius)",fontSize:"13px",background:"var(--surface)",color:"var(--text)",fontFamily:"DM Sans, sans-serif",WebkitAppearance:"none"}} />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={addEntry} style={{width:"100%",padding:"13px",background:"var(--green)",color:"#fff",border:"none",borderRadius:"var(--radius)",fontSize:"15px",fontWeight:"500",cursor:"pointer",fontFamily:"DM Sans, sans-serif",letterSpacing:"0.01em"}}>
              + Add to log
            </button>
          </div>
        )}

        {/* LOG */}
        {tab === "log" && (
          <div style={{padding:"16px 16px calc(var(--safe-bottom) + 80px)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"16px",fontWeight:"500"}}>Today&apos;s log</span>
              <span style={{fontSize:"11px",background:"var(--green-light)",color:"var(--green-mid)",padding:"2px 10px",borderRadius:"20px",fontWeight:"500"}}>{entries.length} {entries.length===1?"item":"items"}</span>
            </div>
            {entries.length === 0 ? (
              <div style={{textAlign:"center",padding:"3rem 0",color:"var(--text-3)",fontSize:"13px"}}>No entries yet — add your first meal!</div>
            ) : (
              [...entries].reverse().map((e, ri) => {
                const i = entries.length - 1 - ri;
                return (
                  <div key={e.id} style={{background:"var(--surface-2)",borderRadius:"var(--radius)",padding:"10px 12px",marginBottom:"8px",border:"0.5px solid var(--border)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <span style={{fontSize:"14px",fontWeight:"500",flex:1,paddingRight:"8px"}}>{e.name}</span>
                      <span style={{fontSize:"16px",fontWeight:"500",color:"var(--green-mid)",fontFamily:"DM Mono, monospace",whiteSpace:"nowrap"}}>{e.calories} kcal</span>
                    </div>
                    <div style={{display:"flex",gap:"10px",marginTop:"5px",alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:"11px",color:"var(--text-3)"}}>{e.time}</span>
                      {e.nos && <span style={{fontSize:"11px",color:"var(--text-3)"}}>{e.nos} nos</span>}
                      {e.weight && <span style={{fontSize:"11px",color:"var(--text-3)"}}>{e.weight}g</span>}
                      <span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"4px",background:e.source==="auto"?"var(--green-light)":"var(--amber)",color:e.source==="auto"?"var(--green-mid)":"var(--amber-dark)"}}>{e.source}</span>
                    </div>
                    <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
                      <span style={{fontSize:"11px",color:"#185FA5"}}>P: {e.protein}g</span>
                      <span style={{fontSize:"11px",color:"#854F0B"}}>C: {e.carbs}g</span>
                      <span style={{fontSize:"11px",color:"#993556"}}>F: {e.fat}g</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"flex-end",marginTop:"6px"}}>
                      <button onClick={()=>deleteEntry(i)} style={{border:"none",background:"none",color:"var(--red)",fontSize:"12px",cursor:"pointer",padding:"3px 5px",opacity:0.7,fontFamily:"DM Sans, sans-serif"}}>Delete</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",bottom:"calc(var(--safe-bottom) + 20px)",left:"50%",transform:"translateX(-50%)",background:"#222",color:"#fff",padding:"9px 18px",borderRadius:"24px",fontSize:"13px",whiteSpace:"nowrap",zIndex:100,maxWidth:"90%",fontFamily:"DM Sans, sans-serif"}}>
          {toast}
        </div>
      )}
    </div>
  );
}
