import { useState, useEffect, useRef, useCallback, useReducer, createContext, useContext } from "react";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  LOUD CITY PASS  ·  v7.0  ·  AWWWARDS EDITION                              ║
// ║  Premium NBA × Supreme × Linear.app aesthetics                              ║
// ║  Editorial typography · Spring physics animations · Court floor grid        ║
// ║  Floating pill nav · Hexagonal stamps · Holographic cards                   ║
// ║  Broadcast-grade staff terminal · Micro-interactions mastery                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ═══════════════ DESIGN SYSTEM TOKENS ═══════════════
const C = {
  // Sacred Thunder palette
  navy:"#002D62", blue:"#007AC1", orange:"#EF3B23", gold:"#FDB927",
  // New depth layers
  void:"#02060F", deep:"#060E1C", surface:"#0A1628", raised:"#0F1E36", elevated:"#162540",
  // Semantics
  success:"#00E676", warning:"#FFB300", error:"#FF1744", scan:"#00E5FF",
  // Borders
  border:"rgba(255,255,255,0.06)", borderHi:"rgba(255,255,255,0.12)",
  // Glass
  glass:"rgba(255,255,255,0.08)", glassDim:"rgba(255,255,255,0.02)",
  cream:"#F0EDE6", ink:"#040B17",
};

// Spring curves for physics-based animations
const spring = {
  snappy: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.25, 1.0,  0.5,  1)",
  heavy: "cubic-bezier(0.22, 1.0,  0.36, 1)",
};

// ═══════════════ GLOBAL STYLES ═══════════════
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Inter+Tight:wght@400;500;600;700;800&family=Playfair+Display:ital@0;1&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { height: 100%; width: 100%; }
body {
  font-family: 'Inter Tight', system-ui, sans-serif;
  background: linear-gradient(180deg, ${C.void} 0%, ${C.deep} 100%);
  color: ${C.cream};
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -webkit-touch-callout: none;
}

/* Typography scale */
.bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; font-weight: 400; }
.dm-mono { font-family: 'DM Mono', monospace; letter-spacing: -0.02em; }
.playfair-italic { font-family: 'Playfair Display', serif; font-style: italic; }

/* Court floor background grid */
.court-bg {
  position: fixed;
  inset: 0;
  background: 
    repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.008) 44px, rgba(255,255,255,0.008) 45px),
    repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.008) 44px, rgba(255,255,255,0.008) 45px),
    linear-gradient(180deg, ${C.void} 0%, ${C.deep} 100%);
  pointer-events: none;
  z-index: 0;
}

/* Glass surface treatment */
.glass-surface {
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 20px;
  backdrop-filter: blur(40px) saturate(160%);
  box-shadow: 
    0 1px 0 ${C.glass} inset,
    0 32px 64px rgba(0,0,0,0.5),
    0 0 0 1px rgba(0,0,0,0.2);
}

/* Spring animations */
@keyframes slideUp {
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slideDown {
  from { transform: translateY(-24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
@keyframes hexFlip {
  0% { transform: rotateY(0); }
  50% { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}
@keyframes liquidPour {
  0% { width: 0%; }
  100% { width: 100%; }
}
@keyframes scan-beam {
  0% { top: 0%; }
  100% { top: 100%; }
}
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 40px rgba(0,122,193,0.3); }
  50% { box-shadow: 0 0 80px rgba(0,122,193,0.6); }
}

.au { animation: slideUp 0.6s ${spring.smooth} both; }
.ai { animation: fadeIn 0.3s ease both; }

.page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  overflow: auto;
  background: transparent;
  z-index: 1;
  -webkit-overflow-scrolling: touch;
}

.col { display: flex; flex-direction: column; }
.row { display: flex; align-items: center; }
.gap-4 { gap: 4px; } .gap-8 { gap: 8px; } .gap-12 { gap: 12px; } .gap-16 { gap: 16px; } .gap-20 { gap: 20px; }

/* Button base */
.btn {
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter Tight', sans-serif;
  letter-spacing: -0.01em;
  user-select: none;
  -webkit-user-select: none;
}
.btn:active { transform: scale(0.94); }
.btn-primary {
  background: linear-gradient(135deg, ${C.orange} 0%, ${C.gold} 100%);
  color: #000;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 0 40px rgba(239,59,35,0.25);
}
.btn-secondary {
  background: transparent;
  color: ${C.cream};
  border: 1.5px solid ${C.borderHi};
  padding: 14px 20px;
}

/* Input field */
.inp {
  background: ${C.raised};
  border: none;
  border-bottom: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.cream};
  font-family: 'Inter Tight', sans-serif;
  padding: 12px 16px;
  font-size: 16px;
  transition: all 0.2s ease;
}
.inp:focus {
  outline: none;
  border-bottom-color: ${C.blue};
  background: ${C.elevated};
  box-shadow: 0 0 40px rgba(0,122,193,0.2);
}

/* Toast base */
.toast-container {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}
.toast {
  background: ${C.surface};
  border: 1px solid ${C.borderHi};
  border-radius: 22px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(32px);
  animation: slideDown 0.3s ${spring.snappy} both;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.toast-success { border-color: ${C.success}; }
.toast-error { border-color: ${C.error}; }

@media (max-width: 430px) {
  .page { padding-bottom: 140px; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
`;

const CARD_THEMES = {
  thunder: { id:"thunder", name:"Thunder Blue", bg:"linear-gradient(135deg,#00193A 0%,#002D62 45%,#003d7a 100%)", accent:C.orange, stripe:"linear-gradient(180deg,#EF3B23,#FDB927)", locked:false },
  obsidian: { id:"obsidian", name:"Obsidian", bg:"linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#0a0a0a 100%)", accent:C.gold, stripe:"linear-gradient(180deg,#FDB927,#FFD060)", locked:false },
  playoff: { id:"playoff", name:"Playoff Gold", bg:"linear-gradient(135deg,#3d2000 0%,#7a4000 45%,#3d2000 100%)", accent:C.gold, stripe:"linear-gradient(180deg,#FFD060,#EF3B23)", locked:false },
  city: { id:"city", name:"City Edition", bg:"linear-gradient(135deg,#001830 0%,#003060 45%,#001830 100%)", accent:C.blue, stripe:"linear-gradient(180deg,#1AABF0,#00FF88)", locked:true, req:"3 stamps" },
  inferno: { id:"inferno", name:"Inferno", bg:"linear-gradient(135deg,#2a0000 0%,#5a0a00 45%,#2a0000 100%)", accent:C.orange, stripe:"linear-gradient(180deg,#FF5A40,#FFD060)", locked:true, req:"Complete all" },
};

const AVATARS = ["⚡","🏀","🏆","🎯","🔥","🦅","⭐","🎤","👑","💎","🌩️","🎽"];
const FAN_TITLES = ["Loud City Rookie","Thunder Fan","Loyal Boomer","OKC Faithful","Storm Chaser","Playoff Legend","Loud City Elite","Thunder Icon"];
const JERSEY_NUMBERS = ["0","2","5","7","13","22","33","35","44","00"];

const STATIONS = {
  s1:{id:"s1",name:"Draft Board", full:"Thunder Draft Board", icon:"⚡",loc:"Lobby A", color:C.blue},
  s2:{id:"s2",name:"Trophy Wall", full:"Championship Wall", icon:"🏆",loc:"Main Hall", color:C.gold},
  s3:{id:"s3",name:"Player Tunnel", full:"Player Tunnel", icon:"🎽",loc:"Corridor B", color:C.orange},
  s4:{id:"s4",name:"Loud City Stage", full:"Loud City Stage", icon:"🎤",loc:"Stage Area", color:C.blue},
  s5:{id:"s5",name:"Digital Wall", full:"Digital Wall", icon:"🎮",loc:"East Wing", color:C.gold},
  s6:{id:"s6",name:"Stats Kiosk", full:"Stats Kiosk", icon:"📊",loc:"Info Center", color:C.success},
};
const TOTAL = 6;

const ACHIEVEMENTS = [
  { id:"first_stamp", icon:"⚡", name:"First Tap", desc:"Earned your first stamp", req: p => Object.keys(p.stamps||{}).length >= 1 },
  { id:"half_way", icon:"🔥", name:"On Fire", desc:"Collected 3 of 6 stamps", req: p => Object.keys(p.stamps||{}).length >= 3 },
  { id:"full_card", icon:"🏆", name:"Full Card", desc:"Stamped all 6 stations", req: p => Object.keys(p.stamps||{}).length >= 6 },
  { id:"redeemed", icon:"👑", name:"Prize Claimer", desc:"Redeemed your complete pass", req: p => p.redeemed },
  { id:"early_fan", icon:"🌅", name:"Early Bird", desc:"Registered before the event", req: () => true },
  { id:"customized", icon:"🎨", name:"Style Icon", desc:"Customized your fan profile", req: p => p.prefs?.customized },
  { id:"squad", icon:"👥", name:"Squad Goals", desc:"Registered with kids", req: (p,db) => db&&Object.values(db.profiles||{}).filter(x=>x.aid===p.aid&&x.type==="kid").length>0 },
  { id:"completionist", icon:"💎", name:"Completionist", desc:"Earned all other achievements", req: (p,db,ach) => ach?.filter(a=>a.id!=="completionist"&&a.earned).length >= 6 },
];

const DB_KEY="lc_v7", SESS_KEY="lc_sess_v7", SYNC_CHANNEL="lc_sync_v7";
const Store = {
  load:()=>{try{const r=localStorage.getItem(DB_KEY);return r?JSON.parse(r):null}catch{return null}},
  save:(d)=>{try{localStorage.setItem(DB_KEY,JSON.stringify(d))}catch{}},
  loadSess:()=>{try{const r=localStorage.getItem(SESS_KEY);return r?JSON.parse(r):null}catch{return null}},
  saveSess:(s)=>{try{localStorage.setItem(SESS_KEY,JSON.stringify(s))}catch{}},
  sync:(event)=>{try{localStorage.setItem(SYNC_CHANNEL,JSON.stringify({...event,ts:Date.now()}))}catch{}},
};

const uid=(p="")=>{const b=new Uint8Array(8);crypto.getRandomValues(b);return p+Array.from(b,x=>x.toString(16).padStart(2,"0")).join("").toUpperCase()};
const mkTok=()=>{const b=new Uint8Array(8);crypto.getRandomValues(b);const h=Array.from(b,x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();return`${h.slice(0,4)}-${h.slice(4,8)}-${h.slice(8,12)}-${h.slice(12,16)}`};
const mkOTP=()=>String(100000+Math.floor(Math.random()*900000));
const now=()=>Date.now();

function getFanRank(stamps){
  if(stamps>=6)return{rank:7,title:"Thunder Icon",color:C.gold,next:null,nextAt:null};
  if(stamps>=5)return{rank:6,title:"Loud City Elite",color:C.gold,next:"Thunder Icon",nextAt:6};
  if(stamps>=4)return{rank:5,title:"Playoff Legend",color:C.orange,next:"Loud City Elite",nextAt:5};
  if(stamps>=3)return{rank:4,title:"Storm Chaser",color:C.blue,next:"Playoff Legend",nextAt:4};
  if(stamps>=2)return{rank:3,title:"OKC Faithful",color:C.blue,next:"Storm Chaser",nextAt:3};
  if(stamps>=1)return{rank:2,title:"Loyal Boomer",color:C.blue,next:"OKC Faithful",nextAt:2};
  return{rank:1,title:"Loud City Rookie",color:C.glass,next:"Loyal Boomer",nextAt:1};
}

function seedDB(){
  const db={v:7,accounts:{},profiles:{},issuances:{},cards:{},stampEvents:[],liveEvents:[],metrics:{regs:0,cards:0,stamps:0,redeems:0,byStation:{s1:0,s2:0,s3:0,s4:0,s5:0,s6:0}}};
  const demos=[
    {name:"Jordan M.",email:"jordan@okc.test",stamps:["s1","s2","s3"],redeemed:false,avatar:"🏀",theme:"thunder",jersey:"23",bio:"Section 101 season ticket holder. Let's go Thunder!"},
    {name:"Shai Fan",email:"shai@okc.test",stamps:["s1","s2","s3","s4","s5","s6"],redeemed:true,avatar:"⚡",theme:"playoff",jersey:"2",bio:"Shai stan since day one. PLAYOFFS BABY!"},
    {name:"KD Returns",email:"kd@okc.test",stamps:[],redeemed:false,avatar:"👑",theme:"obsidian",jersey:"35",bio:""},
    {name:"Chet O.",email:"chet@okc.test",stamps:["s1","s2"],redeemed:false,avatar:"🦅",theme:"city",jersey:"7",bio:"Go Chet!"},
  ];
  demos.forEach((d,i)=>{
    const aid=uid("A"),pid=uid("P"),iid=uid("I"),token=mkTok();
    const stampsObj={};
    d.stamps.forEach(sid=>{stampsObj[sid]=now()-(6-i)*100000-Math.random()*50000});
    db.accounts[d.email]={aid,el:d.email,verified:true,ts:now()-900000,otp:"000000",otpExp:0,cnt:1};
    db.profiles[pid]={id:pid,aid,type:"adult",name:d.name,stamps:stampsObj,redeemed:d.redeemed,ts:now()-900000,prefs:{avatar:d.avatar,theme:d.theme,jersey:d.jersey,bio:d.bio,customized:true,notifStamps:true,notifEvents:true,showRank:true},fanSince:new Date(now()).toISOString().slice(0,10)};
    db.cards[uid("C")]={pid,aid,token,active:true,ts:now()};
  });
  db.liveEvents=[
    {id:uid("E"),type:"scan",fan:"Shai Fan",station:"s1",icon:"📱",ts:now()-15000},
    {id:uid("E"),type:"complete",fan:"Jordan M.",station:"s6",icon:"🏆",ts:now()-45000},
  ];
  return db;
}

function dbReducer(db, action){
  switch(action.t){
    case "DB": return action.db;
    default: return db;
  }
}

function appReducer(state,action){
  switch(action.t){
    case "DB": return {...state,db:action.db};
    case "SESS": return {...state,sess:action.v};
    case "PUSH": return {...state,nav:[...state.nav,action.s]};
    case "POP": return {...state,nav:state.nav.slice(0,-1)};
    case "GO": return {...state,nav:[action.s]};
    case "TOAST": return {...state,toast:action.v};
    default: return state;
  }
}

const AppCtx = createContext();
function AppProvider({children}){
  const [state,dispatch] = useReducer(appReducer,{nav:["home"],db:Store.load()||seedDB(),sess:Store.loadSess(),toast:null});
  useEffect(()=>Store.save(state.db),[state.db]);
  useEffect(()=>Store.saveSess(state.sess),[state.sess]);
  return<AppCtx.Provider value={{state,dispatch}}>{children}</AppCtx.Provider>;
}
function useCtx(){return useContext(AppCtx);}

// ═══════════════ REAL QR CODE ═══════════════
function QRCode({value="",size=120}){
  const qrRef = useRef(null);
  const [loaded,setLoaded] = useState(false);
  useEffect(()=>{const checkLib = setInterval(()=>{if(window.QRCode){setLoaded(true);clearInterval(checkLib);}},50);return ()=>clearInterval(checkLib);},[ ]);
  useEffect(()=>{if(qrRef.current && loaded && window.QRCode && value){try{qrRef.current.innerHTML = "";new window.QRCode(qrRef.current,{text:value,width:size,height:size,colorDark:"#002D62",colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.H});}catch(e){console.warn("QR error:",e);}};},[value,size,loaded]);
  return <div ref={qrRef} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:8,background:"white",borderRadius:12,boxShadow:"0 16px 48px rgba(0,0,0,0.6)",minWidth:size+16,minHeight:size+16}}/>
}

// ═══════════════ QR MODAL ═══════════════
function QRModal({value="",onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)",animation:`slideDown 0.2s ${spring.smooth}`}}>
      <div style={{position:"absolute",top:20,right:20}}>
        <button onClick={onClose} style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"white",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:14,color:"rgba(240,237,230,0.6)",marginBottom:8}}>Point camera at code</div>
          <div style={{boxShadow:"0 0 60px rgba(0,122,193,0.8)"}}><QRCode value={value} size={280}/></div>
        </div>
        <div style={{fontSize:12,color:"rgba(240,237,230,0.4)",textAlign:"center"}}>Scan with staff terminal or another device</div>
      </div>
    </div>
  );
}

// ═══════════════ SHARED COMPONENTS ═══════════════
function Spinner({sz=18,color="#007AC1"}){return<div style={{width:sz,height:sz,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:color,animation:"spin 0.7s linear infinite",flexShrink:0}}/>}

function Toast(){
  const {state} = useCtx();
  if(!state.toast) return null;
  return(
    <div className="toast-container">
      <div className={`toast toast-${state.toast.type||"default"}`}>
        <span>{state.toast.icon||"ℹ"}</span>
        <span>{state.toast.msg}</span>
      </div>
    </div>
  );
}

function ThemedCard({name="FAN",type="adult",token="",themeId="thunder",jersey="",avatar="⚡",anim=false,compact=false}){
  const theme=CARD_THEMES[themeId]||CARD_THEMES.thunder;
  const h=compact?160:192;
  return(
    <div style={{height:h,background:theme.bg,maxWidth:compact?280:330,position:"relative",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",borderRadius:24,border:"1px solid rgba(255,255,255,0.12)",animation:anim?`slideUp 0.48s ${spring.smooth}`:"none"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%,rgba(0,0,0,0.1) 100%)",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:4,background:theme.stripe,opacity:0.8,zIndex:2}}/>
      <div style={{position:"relative",zIndex:3,padding:"20px 22px",display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Inter Tight',sans-serif",fontSize:7,fontWeight:900,letterSpacing:4,color:"rgba(240,237,230,0.35)",marginBottom:6,textTransform:"uppercase"}}>OKC THUNDER</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:compact?16:20,color:"#F0EDE6",textTransform:"uppercase",letterSpacing:0.5,textShadow:"0 2px 4px rgba(0,0,0,0.4)",fontWeight:900}}>{(name||"FAN").slice(0,22)}</div>
          </div>
          <div style={{fontSize:compact?20:24,filter:`drop-shadow(0 4px 12px ${theme.accent}44)`,textShadow:"0 2px 4px rgba(0,0,0,0.3)",flexShrink:0,marginLeft:8}}>{avatar}</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:"auto"}}>
          <div>
            <div style={{fontFamily:"'Inter Tight',sans-serif",fontSize:7,fontWeight:900,letterSpacing:2,color:"rgba(240,237,230,0.3)",textTransform:"uppercase",marginBottom:2}}>Jersey</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:compact?18:24,color:theme.accent,fontWeight:900,textShadow:`0 2px 6px ${theme.accent}44`,lineHeight:1}}>#{jersey||"0"}</div>
          </div>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontFamily:"'Inter Tight',sans-serif",fontSize:6.5,fontWeight:900,letterSpacing:2,color:"rgba(240,237,230,0.25)",textTransform:"uppercase",marginBottom:2}}>NFC ID</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:compact?7:8,color:"rgba(240,237,230,0.4)",letterSpacing:0.5,textShadow:"0 1px 2px rgba(0,0,0,0.3)",wordBreak:"break-all"}}>{(token||"••••-••••").slice(0,16)}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{width:compact?28:36,height:compact?28:36,borderRadius:"50%",background:`linear-gradient(135deg,${theme.accent}44,${theme.accent}22)`,border:`2px solid ${theme.accent}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact?14:18,boxShadow:`0 0 12px ${theme.accent}33`,textShadow:"0 1px 2px rgba(0,0,0,0.3)",fontWeight:900}}>📡</div>
          </div>
        </div>
      </div>
      <div style={{position:"absolute",top:compact?-8:-12,left:12,fontFamily:"'Bebas Neue',sans-serif",fontSize:compact?60:80,color:"rgba(255,255,255,0.04)",letterSpacing:-2,lineHeight:1,userSelect:"none",pointerEvents:"none",fontWeight:900,textShadow:"0 4px 12px rgba(0,0,0,0.4)"}}>#{jersey||"0"}</div>
    </div>
  );
}

function Toggle({checked,onChange}){
  return(
    <label style={{position:"relative",width:44,height:24,flexShrink:0}}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0,position:"absolute"}}/>
      <span style={{position:"absolute",inset:0,borderRadius:12,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.12)",cursor:"pointer",transition:"all 0.25s ease"}}/>
      <span style={{position:"absolute",top:3,left:checked?23:3,width:16,height:16,borderRadius:"50%",background:"rgba(240,237,230,0.6)",transition:"all 0.25s ease",boxShadow:"0 2px 6px rgba(0,0,0,0.4)"}}/>
    </label>
  );
}

// ═══════════════ HOME ═══════════════
function Home(){
  const{state,dispatch}=useCtx();
  const{go}=useA();
  useEffect(()=>{if(state.sess?.aid){const p=Object.values(state.db.profiles).find(p=>p.aid===state.sess.aid);if(p){setTimeout(()=>go("profile"),800);}}}, []);
  return(
    <div className="page" style={{background:"transparent"}}>
      <div className="court-bg"/>
      <div className="col gap-20" style={{position:"relative",zIndex:2,padding:"60px 24px 24px",flex:1}}>
        <div style={{position:"relative"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:96,lineHeight:1,color:"#F0EDE6",letterSpacing:"0.05em",animation:`slideUp 0.6s ${spring.smooth}`}}>LOUD<br/><span style={{WebkitTextStroke:"2px "+C.gold,WebkitTextFillColor:"transparent",fontSize:110}}>CITY</span><br/>PASS</div>
          <div style={{position:"absolute",top:40,right:0,width:200,height:200,background:"linear-gradient(135deg,"+C.orange+"22,"+C.gold+"11)",borderRadius:"50%",filter:"blur(80px)",opacity:0.6,zIndex:-1}}/>
        </div>
        <div style={{fontSize:16,color:"rgba(240,237,230,0.6)",lineHeight:1.6,maxWidth:320,fontFamily:"'Inter Tight',sans-serif"}}>Tap 6 stations. Collect stamps. Claim your playoff prize. One experience, zero friction.</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[["6","Stations"],["Free","Prize"],["NFC","Card"],["<90s","Setup"]].map(([v,l])=><div key={l} style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:24,color:C.gold,fontWeight:900}}>{v}</div><div style={{fontFamily:"'Inter Tight',sans-serif",fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(240,237,230,0.38)",marginTop:2}}>{l}</div></div>)}
        </div>
        <div className="col gap-10">
          {state.sess?.role==="fan"?<><button className="btn btn-primary" style={{width:"100%",height:56,fontSize:18}} onClick={()=>go("profile")}>⚡ My Profile</button></>:<button className="btn btn-primary" style={{width:"100%",height:56,fontSize:18}} onClick={()=>go("register")}>Create Pass →</button>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════ REGISTER ═══════════════
function Register(){
  const{dispatch}=useCtx();
  const{back,registerStart,verifyOTP,createProfiles,toast}=useA();
  const[step,setStep]=useState(0);
  const[form,setForm]=useState({name:"",email:"",kids:0,kidNames:["","",""]});
  const[otpVal,setOtpVal]=useState(["","","","","",""]);
  const[aid,setAid]=useState(null);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const doEmail=async()=>{if(!form.name.trim()){setErr("Enter your name.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){setErr("Valid email plz.");return}setErr("");setLoading(true);try{const{aid:a,otp:c}=await registerStart(form);setAid(a);setStep(1);}catch(e){setErr(e.message)}setLoading(false)};
  const doOTP=async()=>{const code=otpVal.join("");if(code.length<6){setErr("All 6 digits pls.");return}setErr("");setLoading(true);try{await verifyOTP({email:form.email,code});setStep(2);}catch(e){setErr(e.message)}setLoading(false)};
  const doCreate=async()=>{for(let i=0;i<form.kids;i++)if(!form.kidNames[i].trim()){setErr(`Name for Kid ${i+1}.`);return}setErr("");setLoading(true);try{await createProfiles({aid,email:form.email,name:form.name,kids:form.kids,kidNames:form.kidNames});dispatch({t:"GO",s:"issuance"});}catch(e){setErr(e.message)}setLoading(false)};
  return(
    <div className="page" style={{background:"transparent"}}>
      <div className="court-bg"/>
      <div className="col gap-16 w100 au" style={{position:"relative",zIndex:2,padding:"40px 24px"}}>
        <div><button onClick={back} style={{background:"transparent",border:"none",fontSize:20,color:C.cream,cursor:"pointer"}}>←</button></div>
        {step===0&&<div className="col gap-16"><div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#F0EDE6"}}>CREATE<br/><span style={{color:C.blue}}>YOUR</span><br/>PASS</div></div><div className="col gap-10"><div><div style={{fontSize:12,fontWeight:600}}>Full Name</div><input className="inp" placeholder="First & Last" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{marginTop:6,width:"100%"}}/></div><div><div style={{fontSize:12,fontWeight:600}}>Email</div><input className="inp" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{marginTop:6,width:"100%"}}/></div><div><div style={{fontSize:12,fontWeight:600}}>Kids? (0–3)</div><div style={{display:"flex",gap:8,marginTop:6}}>{[0,1,2,3].map(n=><button key={n} onClick={()=>setForm({...form,kids:n})} style={{flex:1,height:50,borderRadius:11,border:"1.5px solid"+(form.kids===n?C.blue:"rgba(255,255,255,0.08)"),background:form.kids===n?"rgba(0,122,193,0.15)":"transparent",color:form.kids===n?"#F0EDE6":"rgba(240,237,230,0.38)",fontFamily:"'Bebas Neue',sans-serif",fontSize:22,cursor:"pointer",transition:"all 0.2s"}}>{n}</button>)}</div></div></div>{err&&<div style={{fontSize:13,color:C.error,background:"rgba(255,23,68,0.1)",border:"1px solid "+C.error,borderRadius:12,padding:12}}>{err}</div>}<button className="btn btn-primary" style={{width:"100%",height:56}} disabled={loading} onClick={doEmail}>{loading?"Sending...":"Send Code →"}</button></div>}
        {step===1&&<div className="col gap-16"><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#F0EDE6"}}>CHECK<br/><span style={{color:C.gold}}>INBOX</span></div><div className="col gap-10"><div style={{fontSize:12,fontWeight:600,textAlign:"center"}}>6-Digit Code</div><div style={{display:"flex",gap:8,justifyContent:"center"}}>{otpVal.map((d,i)=><input key={i} className="inp" maxLength={1} value={d} inputMode="numeric" onChange={e=>{const n=[...otpVal];n[i]=e.target.value;setOtpVal(n);}} style={{width:48,height:56,textAlign:"center",fontSize:24,padding:0,fontFamily:"'DM Mono',monospace"}}/>) }</div></div>{err&&<div style={{fontSize:13,color:C.error}}>{err}</div>}<button className="btn btn-primary" style={{width:"100%",height:56}} disabled={loading} onClick={doOTP}>{loading?"Verifying...":"Verify →"}</button></div>}
        {step===2&&<div className="col gap-16"><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#F0EDE6"}}>TEAM<br/><span style={{color:C.orange}}>SETUP</span></div><div className="col gap-8"><div style={{padding:12,background:C.raised,borderRadius:12}}><div style={{fontSize:14,fontWeight:600}}>{form.name}</div><div style={{fontSize:11,color:"rgba(240,237,230,0.5)",marginTop:2}}>Adult</div></div>{form.kids>0&&Array.from({length:form.kids},(_,i)=><input key={i} className="inp" placeholder={`Kid ${i+1} Name`} value={form.kidNames[i]} onChange={e=>{const k=[...form.kidNames];k[i]=e.target.value;setForm({...form,kidNames:k});}} style={{width:"100%"}}/>)}</div>{err&&<div style={{fontSize:13,color:C.error}}>{err}</div>}<button className="btn btn-primary" style={{width:"100%",height:56}} disabled={loading} onClick={doCreate}>{loading?"Creating...":"Get Passes →"}</button></div>}
      </div>
    </div>
  );
}

// ═══════════════ PROFILE DASHBOARD ═══════════════
function ProfileDashboard(){
  const {state,dispatch} = useCtx();
  const {back,go,updatePrefs,toast} = useA();
  const [tab,setTab] = useState("card");
  const [showQRModal,setShowQRModal] = useState(false);
  const profile = state.sess?.aid ? Object.values(state.db.profiles).find(p=>p.aid===state.sess.aid&&p.type==="adult") : Object.values(state.db.profiles)[0];
  if(!profile) return <div className="page" style={{alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{fontSize:48}}>👤</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32}}>No Profile</div><button className="btn btn-primary" onClick={()=>go("register")}>Register Now</button></div></div>;
  const stamps = profile?.stamps||{};
  const stampCount = Object.keys(stamps).length;
  const rank = getFanRank(stampCount);
  const pct = (stampCount/TOTAL)*100;
  return(
    <div className="page" style={{background:"transparent",paddingBottom:140}}>
      <div className="court-bg"/>
      <div style={{position:"relative",zIndex:2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:20}}><button onClick={back} style={{background:"transparent",border:"none",fontSize:20,color:C.cream,cursor:"pointer"}}>←</button><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.05em"}}>My Profile</div></div>
        
        {tab==="card"&&<div className="col gap-14" style={{padding:"0 20px 20px",animation:`slideUp 0.6s ${spring.smooth}`}}>
          <div style={{fontSize:14,fontWeight:600}}>Your NFC Card</div>
          <ThemedCard name={profile.name} type={profile.type} token={profile.id} themeId={profile.prefs?.theme||"thunder"} jersey={profile.prefs?.jersey||"0"} avatar={profile.prefs?.avatar||"⚡"} anim/>
          <div style={{padding:14,background:C.raised,borderRadius:14,border:"1.5px solid "+C.borderHi,cursor:"pointer",transition:"all 0.2s"}} onClick={()=>setShowQRModal(true)}>
            <div style={{display:"flex",gap:10}}>
              <div style={{position:"relative"}}><QRCode value={profile.id} size={72}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👆</div></div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>Tap for Full QR</div><div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginTop:2,lineHeight:1.5}}>Zero errors. Staff scans instantly from any distance.</div></div>
            </div>
          </div>
        </div>}
        
        {tab==="stamps"&&<div className="col gap-14" style={{padding:"0 20px 20px",animation:`slideUp 0.6s ${spring.smooth}`}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div style={{fontSize:14,fontWeight:600}}>Stamps</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:900}}><span style={{color:C.gold}}>{stampCount}</span> / {TOTAL}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {Object.values(STATIONS).map(s=>{const earned = !!stamps[s.id];return <div key={s.id} style={{aspectRatio:"1",borderRadius:16,border:"1.5px solid "+(earned?C.gold+"55":"rgba(255,255,255,0.08)"),background:earned?"linear-gradient(135deg,"+C.gold+"22,"+C.gold+"11)":"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",animation:`slideUp 0.6s ${spring.smooth}`,transition:"all 0.2s"}} onMouseOver={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}><span style={{fontSize:24}}>{s.icon}</span><span style={{fontSize:9,fontWeight:600,color:earned?C.gold:"rgba(240,237,230,0.5)"}}>{s.name}</span>{earned&&<span style={{position:"absolute",top:8,right:8,width:16,height:16,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#000",fontWeight:900}}>✓</span>}</div>;})}
          </div>
        </div>}
        
        {showQRModal && <QRModal value={profile.id} onClose={()=>setShowQRModal(false)}/>}
      </div>
    </div>
  );
}

// ═══════════════ STAFF TERMINAL ═══════════════
function StaffTerminal(){
  const {state,dispatch} = useCtx();
  const [token,setToken] = useState("");
  const [info,setInfo] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [sessionStamps, setSessionStamps] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const back = useCallback(()=>dispatch({t:"GO",s:"mode_select"}),[dispatch]);
  const lookup = () => {
    if(!token.trim()){setInfo({error:"Enter ID"});return;}
    const prof = Object.values(state.db.profiles).find(p=>p.id===token.trim()||p.token===token.trim());
    if(!prof){setInfo({error:"Not found"});return;}
    setInfo(prof);
  };
  const stamp = () => {
    if(!info||info.error) return;
    const avail = Object.keys(STATIONS).filter(id=>!info.stamps[id]);
    if(!avail.length){dispatch({t:"TOAST",v:{msg:"All stamps!",icon:"🏆",type:"default"}});return;}
    const sid = avail[0];
    const db = {...state.db,profiles:{...state.db.profiles}};
    const newStamps = {...info.stamps,[sid]:now()};
    db.profiles[info.id] = {...db.profiles[info.id],stamps:newStamps};
    db.metrics = {...db.metrics,stamps:(db.metrics.stamps||0)+1,byStation:{...db.metrics.byStation,[sid]:(db.metrics.byStation[sid]||0)+1}};
    dispatch({t:"DB",db});
    setInfo({...info,stamps:newStamps});
    setSessionStamps(s=>s+1);
    Store.sync({event:"stamp_awarded",pid:info.id,sid,stationName:STATIONS[sid].full});
    dispatch({t:"TOAST",v:{msg:`✓ ${STATIONS[sid].name} stamped!`,icon:"⚡",type:"default"}});
    navigator.vibrate?.([50,30,80]);
  };
  const redeem = () => {
    if(!info||info.error) return;
    if(info.redeemed){dispatch({t:"TOAST",v:{msg:"Already redeemed",icon:"⏳",type:"default"}});return;}
    const db = {...state.db,profiles:{...state.db.profiles}};
    db.profiles[info.id] = {...db.profiles[info.id],redeemed:true};
    db.metrics = {...db.metrics,redeems:(db.metrics.redeems||0)+1};
    dispatch({t:"DB",db});
    setInfo({...info,redeemed:true});
    Store.sync({event:"redeemed",pid:info.id});
    dispatch({t:"TOAST",v:{msg:"🏆 Redeemed!",icon:"✓",type:"default"}});
  };
  useEffect(()=>{
    let stream, idx;
    if(scanning){
      const start = async () => {
        try{
          stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}});
          if(videoRef.current){videoRef.current.srcObject = stream;videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(e=>console.warn(e));}
          idx = setInterval(()=>{
            if(videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA){
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current,0,0);
              const img = ctx.getImageData(0,0,canvas.width,canvas.height);
              if(window.jsQR){
                const qr = window.jsQR(img.data,img.width,img.height);
                if(qr && qr.data){
                  const id = qr.data.trim();
                  setToken(id);
                  const prof = Object.values(state.db.profiles).find(p=>p.id===id);
                  if(prof) setInfo(prof);
                  setScanning(false);
                }
              }
            }
          },200);
        }catch(e){dispatch({t:"TOAST",v:{msg:"Camera denied",icon:"📹",type:"default"}});setScanning(false);}
      };
      start();
    }
    return ()=>{if(idx) clearInterval(idx);if(stream) stream.getTracks().forEach(t=>t.stop());};
  },[scanning]);
  const stampCount = info ? Object.keys(info.stamps||{}).length : 0;
  return(
    <div className="page" style={{background:"#0D0D0D",paddingBottom:120}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:20}}><button onClick={back} style={{background:"transparent",border:"none",fontSize:20,color:C.cream,cursor:"pointer"}}>←</button><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20}}>STAFF</div></div>
      <div className="col gap-10" style={{padding:"0 20px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:12,background:C.surface,borderRadius:12,border:"1px solid "+C.border}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:12}}>STAMPS</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:900,color:C.gold}}>{sessionStamps}</div></div>
        {scanning?<div style={{position:"relative",width:"100%",aspectRatio:"16/9",borderRadius:14,overflow:"hidden",background:"#000",border:"2px solid "+C.scan}}><video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} autoPlay playsInline /><div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center, transparent 30%, rgba(0,229,255,0.2) 100%)",pointerEvents:"none"}}/><div style={{position:"absolute",top:0,bottom:0,left:"50%",width:"2px",background:C.scan,animation:`scan-beam 2s linear infinite`}}/></div>:<div style={{width:"100%",aspectRatio:"16/9",borderRadius:14,background:C.raised,border:"1px dashed "+C.border,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><span style={{fontSize:32}}>📱</span><div style={{fontSize:12,color:"rgba(240,237,230,0.4)"}}>Ready</div></div>}
        <canvas ref={canvasRef} style={{display:"none"}}/>
        <div style={{display:"flex",gap:8}}><button className="btn btn-primary" style={{flex:1}} onClick={()=>setScanning(v=>!v)}>{scanning?"Stop":"Scan"}</button><button className="btn btn-secondary" style={{flex:1}} onClick={()=>lookup()}>Go</button></div>
        <input className="inp" value={token} onChange={e=>setToken(e.target.value)} onKeyDown={e=>e.key==="Enter"&&lookup()} placeholder="Fan ID" style={{width:"100%"}}/>
      </div>
      {info&&!info.error&&<div style={{margin:"0 20px",padding:16,background:C.surface,borderRadius:14,border:"1px solid "+C.borderHi}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:52,height:52,borderRadius:12,background:"linear-gradient(135deg,"+C.navy+","+C.blue+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{info.prefs?.avatar||"🏀"}</div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>{info.name}</div><div style={{fontSize:11,color:"rgba(240,237,230,0.5)"}}>ID: {info.id.slice(0,12)}…</div></div><div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:900,color:stampCount===TOTAL?C.gold:C.cream}}>{stampCount}/{TOTAL}</div></div></div>
        <div style={{width:"100%",height:4,background:"rgba(255,255,255,0.1)",borderRadius:20,overflow:"hidden",marginTop:12}}><div style={{height:"100%",background:"linear-gradient(90deg,"+C.blue+","+C.gold+")",width:pct+"%",transition:"width 0.6s "+spring.smooth}}/></div>
        <div style={{display:"flex",gap:8,marginTop:12}}><button className="btn btn-primary" style={{flex:1}} onClick={stamp} disabled={stampCount>=TOTAL}>Stamp</button><button className="btn btn-primary" style={{flex:1,background:C.gold,color:"#000"}} onClick={redeem} disabled={info.redeemed}>🏆</button></div>
      </div>}
    </div>
  );
}

// ═══════════════ UTILITIES ═══════════════
function useA(){
  const{state,dispatch}=useCtx();
  const toast=(msg,color=C.cream,dur=2800)=>{dispatch({t:"TOAST",v:{msg,icon:"ℹ",type:"default"}});setTimeout(()=>dispatch({t:"TOAST",v:null}),dur)};
  const nav=useCallback(s=>dispatch({t:"PUSH",s}),[dispatch]);
  const back=useCallback(()=>dispatch({t:"POP"}),[dispatch]);
  const go=useCallback(s=>dispatch({t:"GO",s}),[dispatch]);
  const updatePrefs=useCallback((pid,prefs)=>{const db={...state.db,profiles:{...state.db.profiles}};db.profiles[pid]={...db.profiles[pid],prefs:{...db.profiles[pid].prefs,...prefs,customized:true}};dispatch({t:"DB",db});},[state.db,dispatch]);
  const registerStart=useCallback(async({name,email,kids})=>{const el=email.toLowerCase().trim();const db={...state.db,accounts:{...state.db.accounts}};const ex=db.accounts[el];if(ex){const cnt=Object.values(state.db.profiles).filter(p=>p.aid===ex.aid).length;if(cnt>=4)throw new Error("Max 4 passes.");}const aid=ex?.aid||uid("A");const code=mkOTP();db.accounts[el]={aid,el,verified:false,ts:now(),otp:code,otpExp:now()+600000,cnt:0};dispatch({t:"DB",db});return{aid,otp:code};},[state.db,dispatch]);
  const verifyOTP=useCallback(async({email,code})=>{const db={...state.db,accounts:{...state.db.accounts}};const el=email.toLowerCase().trim();const acc=db.accounts[el];if(!acc)throw new Error("Account not found.");if(acc.otpExp<now())throw new Error("Code expired.");if(acc.otp!==code)throw new Error("Wrong code.");db.accounts[el]={...acc,verified:true};dispatch({t:"DB",db});},[state.db,dispatch]);
  const createProfiles=useCallback(async({aid,email,name,kids,kidNames})=>{const db={...state.db,accounts:{...state.db.accounts},profiles:{...state.db.profiles},issuances:{...state.db.issuances}};const el=email.toLowerCase().trim();const ex=Object.values(db.profiles).filter(p=>p.aid===aid);if(ex.length+1+kids>4)throw new Error("Exceeds limit.");const profs=[{id:uid("P"),aid,type:"adult",name:name.trim(),stamps:{},redeemed:false,ts:now(),prefs:{avatar:"⚡",theme:"thunder",jersey:"0",bio:"",customized:false,notifStamps:true,notifEvents:true,showRank:true},fanSince:new Date(now()).toISOString().slice(0,10)}];for(let i=0;i<kids;i++)profs.push({id:uid("P"),aid,type:"kid",name:kidNames[i].trim(),stamps:{},redeemed:false,ts:now(),prefs:{avatar:"⭐",theme:"thunder",jersey:"",bio:""},fanSince:new Date(now()).toISOString().slice(0,10)});profs.forEach(p=>{db.profiles[p.id]=p});const iid=uid("I");db.issuances[iid]={aid,pids:profs.map(p=>p.id),ts:now(),exp:now()+1800000,used:false};db.accounts[el]={...db.accounts[el],cnt:profs.length};db.metrics={...db.metrics,regs:(db.metrics.regs||0)+1};dispatch({t:"DB",db});dispatch({t:"SESS",v:{aid,email:el,name,role:"fan"}});sessionStorage.setItem("lc_iss",JSON.stringify({iid,profs}));return{iid,profs};},[state.db,dispatch]);
  return{toast,nav,back,go,updatePrefs,registerStart,verifyOTP,createProfiles};
}

// ═══════════════ MAIN APP ═══════════════
export default function App(){
  const[css]=useState(globalStyles);
  return(
    <AppProvider>
      <style>{css}</style>
      <MainApp/>
    </AppProvider>
  );
}

function MainApp(){
  const{state}=useCtx();
  const screen=state.nav[state.nav.length-1]||"home";
  return(
    <>
      <Toast/>
      {screen==="home"&&<Home/>}
      {screen==="register"&&<Register/>}
      {screen==="profile"&&<ProfileDashboard/>}
      {screen==="staff"&&<StaffTerminal/>}
    </>
  );
}
