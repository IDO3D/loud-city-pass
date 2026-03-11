import { useState, useEffect, useRef, useCallback, useReducer, createContext, useContext } from "react";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  LOUD CITY PASS  ·  v6.0  ·  COMPLETE FAN SYSTEM                           ║
// ║  + Live Profile & Customization Dashboard                                   ║
// ║  Player card identity · Avatar builder · Theme skins ·                      ║
// ║  Activity timeline · Achievements · Fan rank · NFC card editor              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ═══════════════ TOKENS ═══════════════
const C = {
  navy:"#002D62", navyDk:"#00193A", blue:"#007AC1", blueHi:"#1AABF0",
  orange:"#EF3B23", orangeHi:"#FF5A40", gold:"#FDB927", goldHi:"#FFD060",
  cream:"#F0EDE6", ink:"#040B17", inkMid:"#071120",
  line:"rgba(255,255,255,0.07)", lineHi:"rgba(255,255,255,0.14)",
  fog:"rgba(240,237,230,0.4)", fogDim:"rgba(240,237,230,0.2)",
  ok:"#22D46A", warn:"#F5A623", fail:"#E53E3E", scan:"#00FF88",
};

// Card themes — user can customize their NFC card skin
const CARD_THEMES = {
  thunder: { id:"thunder", name:"Thunder Blue", bg:"linear-gradient(135deg,#00193A 0%,#002D62 45%,#003d7a 100%)", accent:C.orange, stripe:"linear-gradient(180deg,#EF3B23,#FDB927)", locked:false },
  obsidian: { id:"obsidian", name:"Obsidian", bg:"linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#0a0a0a 100%)", accent:C.gold, stripe:"linear-gradient(180deg,#FDB927,#FFD060)", locked:false },
  playoff: { id:"playoff", name:"Playoff Gold", bg:"linear-gradient(135deg,#3d2000 0%,#7a4000 45%,#3d2000 100%)", accent:C.goldHi, stripe:"linear-gradient(180deg,#FFD060,#EF3B23)", locked:false },
  city: { id:"city", name:"City Edition", bg:"linear-gradient(135deg,#001830 0%,#003060 45%,#001830 100%)", accent:C.blueHi, stripe:"linear-gradient(180deg,#1AABF0,#00FF88)", locked:true, req:"3 stamps" },
  inferno: { id:"inferno", name:"Inferno", bg:"linear-gradient(135deg,#2a0000 0%,#5a0a00 45%,#2a0000 100%)", accent:C.orangeHi, stripe:"linear-gradient(180deg,#FF5A40,#FFD060)", locked:true, req:"Complete all" },
};

// Avatar options
const AVATARS = ["⚡","🏀","🏆","🎯","🔥","🦅","⭐","🎤","👑","💎","🌩️","🎽"];
const FAN_TITLES = ["Loud City Rookie","Thunder Fan","Loyal Boomer","OKC Faithful","Storm Chaser","Playoff Legend","Loud City Elite","Thunder Icon"];
const JERSEY_NUMBERS = ["0","2","5","7","13","22","33","35","44","00"];

// Stations
const STATIONS = {
  s1:{id:"s1",name:"Draft Board",     full:"Thunder Draft Board",   icon:"⚡",loc:"Lobby A",      color:C.blue},
  s2:{id:"s2",name:"Trophy Wall",     full:"Championship Wall",     icon:"🏆",loc:"Main Hall",    color:C.gold},
  s3:{id:"s3",name:"Player Tunnel",   full:"Player Tunnel",         icon:"🎽",loc:"Corridor B",   color:C.orange},
  s4:{id:"s4",name:"Loud City Stage", full:"Loud City Stage",       icon:"🎤",loc:"Stage Area",   color:C.blueHi},
  s5:{id:"s5",name:"Digital Wall",    full:"Digital Wall",          icon:"🎮",loc:"East Wing",    color:C.goldHi},
  s6:{id:"s6",name:"Stats Kiosk",     full:"Stats Kiosk",           icon:"📊",loc:"Info Center",  color:C.ok},
};
const TOTAL = 6;

// Achievements system
const ACHIEVEMENTS = [
  { id:"first_stamp",   icon:"⚡", name:"First Tap",       desc:"Earned your first stamp",                  req: p => Object.keys(p.stamps||{}).length >= 1 },
  { id:"half_way",      icon:"🔥", name:"On Fire",         desc:"Collected 3 of 6 stamps",                  req: p => Object.keys(p.stamps||{}).length >= 3 },
  { id:"full_card",     icon:"🏆", name:"Full Card",       desc:"Stamped all 6 stations",                   req: p => Object.keys(p.stamps||{}).length >= 6 },
  { id:"redeemed",      icon:"👑", name:"Prize Claimer",   desc:"Redeemed your complete pass",              req: p => p.redeemed },
  { id:"early_fan",     icon:"🌅", name:"Early Bird",      desc:"Registered before the event",              req: () => true },
  { id:"customized",    icon:"🎨", name:"Style Icon",      desc:"Customized your fan profile",              req: p => p.prefs?.customized },
  { id:"squad",         icon:"👥", name:"Squad Goals",     desc:"Registered with kids",                     req: (p,db) => db&&Object.values(db.profiles||{}).filter(x=>x.aid===p.aid&&x.type==="kid").length>0 },
  { id:"completionist", icon:"💎", name:"Completionist",   desc:"Earned all other achievements",            req: (p,db,ach) => ach?.filter(a=>a.id!=="completionist"&&a.earned).length >= 6 },
];

// ═══════════════ PERSISTENCE ═══════════════
const DB_KEY="lc_v6", SESS_KEY="lc_s6", SYNC_CHANNEL="lc_sync";
const Store = {
  load:()=>{try{const r=localStorage.getItem(DB_KEY);return r?JSON.parse(r):null}catch{return null}},
  save:(d)=>{try{localStorage.setItem(DB_KEY,JSON.stringify(d))}catch{}},
  loadSess:()=>{try{const r=localStorage.getItem(SESS_KEY);return r?JSON.parse(r):null}catch{return null}},
  saveSess:(s)=>{try{localStorage.setItem(SESS_KEY,JSON.stringify(s))}catch{}},
  sync:(event)=>{try{localStorage.setItem(SYNC_CHANNEL,JSON.stringify({...event,ts:now()}))}catch{}},
};

const uid=(p="")=>{const b=new Uint8Array(8);crypto.getRandomValues(b);return p+Array.from(b,x=>x.toString(16).padStart(2,"0")).join("").toUpperCase()};
const mkTok=()=>{const b=new Uint8Array(8);crypto.getRandomValues(b);const h=Array.from(b,x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();return`${h.slice(0,4)}-${h.slice(4,8)}-${h.slice(8,12)}-${h.slice(12,16)}`};
const mkOTP=()=>String(100000+Math.floor(Math.random()*900000));
const now=()=>Date.now();

function getFanRank(stamps){
  if(stamps>=6)return{rank:7,title:"Thunder Icon",color:C.gold,next:null,nextAt:null};
  if(stamps>=5)return{rank:6,title:"Loud City Elite",color:C.gold,next:"Thunder Icon",nextAt:6};
  if(stamps>=4)return{rank:5,title:"Playoff Legend",color:C.orange,next:"Loud City Elite",nextAt:5};
  if(stamps>=3)return{rank:4,title:"Storm Chaser",color:C.blueHi,next:"Playoff Legend",nextAt:4};
  if(stamps>=2)return{rank:3,title:"OKC Faithful",color:C.blue,next:"Storm Chaser",nextAt:3};
  if(stamps>=1)return{rank:2,title:"Loyal Boomer",color:C.blue,next:"OKC Faithful",nextAt:2};
  return{rank:1,title:"Loud City Rookie",color:C.fog,next:"Loyal Boomer",nextAt:1};
}

function seedDB(){
  const db={
    v:6, accounts:{}, profiles:{}, issuances:{}, cards:{},
    stampEvents:[], liveEvents:[],
    metrics:{regs:0,cards:0,stamps:0,redeems:0,byStation:{s1:0,s2:0,s3:0,s4:0,s5:0,s6:0}},
  };
  const demos=[
    {name:"Jordan M.",  email:"jordan@okc.test", stamps:["s1","s2","s3"],          redeemed:false, avatar:"🏀", theme:"thunder",  jersey:"23", bio:"Section 101 season ticket holder. Let's go Thunder!"},
    {name:"Shai Fan",   email:"shai@okc.test",   stamps:["s1","s2","s3","s4","s5","s6"], redeemed:true,  avatar:"⚡", theme:"playoff", jersey:"2",  bio:"Shai stan since day one. PLAYOFFS BABY!"},
    {name:"KD Returns", email:"kd@okc.test",     stamps:[],                        redeemed:false, avatar:"👑", theme:"obsidian", jersey:"35", bio:""},
    {name:"Chet O.",    email:"chet@okc.test",   stamps:["s1","s2"],               redeemed:false, avatar:"🦅", theme:"city",    jersey:"7",  bio:"Go Chet!"},
  ];
  demos.forEach((d,i)=>{
    const aid=uid("A"),pid=uid("P"),iid=uid("I"),token=mkTok();
    const stampsObj={};
    d.stamps.forEach(sid=>{stampsObj[sid]=now()-(6-i)*100000-Math.random()*50000});
    db.accounts[d.email]={aid,el:d.email,verified:true,ts:now()-900000,otp:"000000",otpExp:0,cnt:1};
    db.profiles[pid]={
      id:pid,aid,type:"adult",name:d.name,stamps:stampsObj,redeemed:d.redeemed,ts:now()-900000,
      prefs:{avatar:d.avatar,theme:d.theme,jersey:d.jersey,bio:d.bio,customized:true,notifStamps:true,notifEvents:true,showRank:true},
      fanSince:new Date(now()-90*86400000).toISOString().slice(0,10),
    };
    db.issuances[iid]={aid,pids:[pid],ts:now()-900000,exp:now()+7200000,used:false};
    db.cards[token]={token,pid,aid,iid,active:!d.redeemed,ts:now()-900000,returned:d.redeemed?now()-50000:null};
    db.metrics.regs++;db.metrics.cards++;db.metrics.stamps+=d.stamps.length;
    if(d.redeemed)db.metrics.redeems++;
    d.stamps.forEach(sid=>{db.metrics.byStation[sid]++});
    d.stamps.forEach((sid,j)=>{
      const evt={id:uid("E"),pid,name:d.name,token,ts:now()-900000+(j*80000),r:"ok",count:j+1,done:j+1>=TOTAL,sid,stationName:STATIONS[sid].full,type:"stamp",source:"nfc"};
      db.stampEvents.push(evt);db.liveEvents.push(evt);
    });
    if(d.redeemed)db.liveEvents.push({id:uid("E"),pid,name:d.name,token,ts:now()-50000,r:"ok",count:d.stamps.length,done:true,type:"redeem"});
  });
  db.liveEvents.sort((a,b)=>b.ts-a.ts);
  Store.save(db);return db;
}

function initDB(){const d=Store.load();if(d&&d.v===6)return d;return seedDB()}

// ═══════════════ GLOBAL STATE ═══════════════
const Ctx=createContext(null);
const useCtx=()=>useContext(Ctx);

function reducer(s,a){
  switch(a.t){
    case"PUSH":return{...s,screen:a.s,stack:[...s.stack,s.screen]};
    case"POP":{const st=[...s.stack];const p=st.pop()||"home";return{...s,screen:p,stack:st}};
    case"GO":return{...s,screen:a.s,stack:[]};
    case"DB":Store.save(a.db);return{...s,db:{...a.db}};
    case"SESS":Store.saveSess(a.v);return{...s,sess:a.v};
    case"NET":return{...s,online:a.v};
    case"TOAST":return{...s,toast:a.v};
    default:return s;
  }
}

// ═══════════════ CSS ═══════════════
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{height:100%;font-size:16px}
body,#root{min-height:100dvh;font-family:'Barlow',system-ui,sans-serif;background:#040B17;color:#F0EDE6;overflow-x:hidden;-webkit-font-smoothing:antialiased}
input,button,select,textarea{font-family:inherit}
::-webkit-scrollbar{width:2px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}

.shell{min-height:100dvh;position:relative;background:#040B17}
.bg{position:fixed;inset:0;pointer-events:none;z-index:0;background:url('/thunder-bg.svg') center/cover no-repeat;}
.bg::before{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.011) 60px),repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.006) 60px)}
.bg::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(0,122,193,0.17) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 95% 90%,rgba(239,59,35,0.08) 0%,transparent 60%)}

.page{position:relative;z-index:1;min-height:100dvh;display:flex;flex-direction:column;align-items:center;padding:0 18px 94px;max-width:430px;margin:0 auto}

/* ── TYPOGRAPHY ── */
.ant{font-family:'Anton',sans-serif;text-transform:uppercase;line-height:0.92;letter-spacing:0.5px}
.bc{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:0.5px}
.lbl{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(240,237,230,0.38)}
.mono{font-family:'SF Mono','Fira Code','Courier New',monospace}

/* ── SURFACES ── */
.s1{background:rgba(7,17,32,0.82);border:1px solid rgba(255,255,255,0.07);border-radius:20px;backdrop-filter:blur(32px)}
.s2{background:rgba(12,24,44,0.92);border:1px solid rgba(255,255,255,0.13);border-radius:20px}
.s3{background:rgba(4,11,23,0.7);border:1px solid rgba(255,255,255,0.05);border-radius:13px}
.sg{background:rgba(5,13,26,0.95);border:1px solid rgba(0,122,193,0.2);border-radius:14px}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:12px;
  font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;
  cursor:pointer;user-select:none;transition:transform 0.1s,filter 0.15s,box-shadow 0.15s;
  position:relative;overflow:hidden;white-space:nowrap;height:52px;padding:0 22px}
.btn::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.1) 0%,transparent 60%);pointer-events:none}
.btn:active:not(:disabled){transform:scale(0.95)}
.btn:disabled{opacity:0.3;cursor:not-allowed}
.btn-full{width:100%}
.btn-sm{height:38px;padding:0 14px;font-size:12px;border-radius:9px}
.btn-bl{background:linear-gradient(150deg,#1AABF0,#007AC1,#005f99);color:#fff;box-shadow:0 6px 24px rgba(0,122,193,0.4)}
.btn-bl:hover:not(:disabled){box-shadow:0 10px 32px rgba(0,122,193,0.65);filter:brightness(1.06)}
.btn-or{background:linear-gradient(150deg,#FF5A40,#EF3B23,#c4200a);color:#fff;box-shadow:0 6px 24px rgba(239,59,35,0.4)}
.btn-or:hover:not(:disabled){box-shadow:0 10px 32px rgba(239,59,35,0.65);filter:brightness(1.06)}
.btn-gd{background:linear-gradient(150deg,#FFD060,#FDB927,#d49400);color:#1a0c00;box-shadow:0 6px 24px rgba(253,185,39,0.4)}
.btn-gd:hover:not(:disabled){box-shadow:0 10px 32px rgba(253,185,39,0.6);filter:brightness(1.05)}
.btn-gh{background:rgba(240,237,230,0.05);border:1.5px solid rgba(255,255,255,0.13);color:rgba(240,237,230,0.42)}
.btn-gh:hover:not(:disabled){background:rgba(240,237,230,0.09);color:#F0EDE6}
.btn-ic{width:44px;height:44px;padding:0;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#F0EDE6;font-size:18px;box-shadow:none}

/* ── INPUTS ── */
.inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);border-radius:13px;padding:14px 16px;color:#F0EDE6;font-size:16px;font-weight:500;outline:none;transition:all 0.2s}
.inp:focus{border-color:rgba(0,122,193,0.75);background:rgba(0,122,193,0.08);box-shadow:0 0 0 3px rgba(0,122,193,0.14)}
.inp::placeholder{color:rgba(240,237,230,0.2)}
textarea.inp{resize:none;line-height:1.55}
.otp-row{display:flex;gap:8px;justify-content:center}
.otp-b{width:48px;height:60px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);border-radius:12px;font-family:'Anton',sans-serif;font-size:28px;color:#F0EDE6;text-align:center;outline:none;caret-color:#007AC1;transition:all 0.15s}
.otp-b:focus{border-color:#007AC1;background:rgba(0,122,193,0.1);box-shadow:0 0 0 3px rgba(0,122,193,0.18)}
.otp-b.v{border-color:rgba(0,122,193,0.5)}

/* ── BADGES ── */
.bdg{display:inline-flex;align-items:center;gap:4px;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;padding:4px 9px;border-radius:20px}
.b-bl{color:#1AABF0;background:rgba(0,122,193,0.14);border:1px solid rgba(0,122,193,0.3)}
.b-gd{color:#FDB927;background:rgba(253,185,39,0.12);border:1px solid rgba(253,185,39,0.3)}
.b-or{color:#FF5A40;background:rgba(239,59,35,0.12);border:1px solid rgba(239,59,35,0.3)}
.b-gn{color:#22D46A;background:rgba(34,212,106,0.1);border:1px solid rgba(34,212,106,0.25)}
.b-mu{color:rgba(240,237,230,0.38);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)}
.b-lv{color:#22D46A;background:rgba(34,212,106,0.1);border:1px solid rgba(34,212,106,0.25);animation:blink 2s ease-in-out infinite}

/* ── PROGRESS ── */
.prog{width:100%;height:4px;background:rgba(255,255,255,0.07);border-radius:20px;position:relative}
.prog-f{height:100%;border-radius:20px;background:linear-gradient(90deg,#007AC1,#FDB927);transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1);position:relative}
.prog-f::after{content:'';position:absolute;right:-5px;top:50%;transform:translateY(-50%);width:10px;height:10px;border-radius:50%;background:#FDB927;box-shadow:0 0 12px #FDB927,0 0 24px rgba(253,185,39,0.5)}

/* ── TABS ── */
.tabs{display:flex;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:3px;width:100%}
.tab{flex:1;padding:9px 4px;border-radius:10px;border:none;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;background:transparent;color:rgba(240,237,230,0.32)}
.tab.on{background:rgba(0,122,193,0.22);color:#F0EDE6;border:1px solid rgba(0,122,193,0.35);box-shadow:0 2px 12px rgba(0,122,193,0.2)}

/* ── BOTTOM NAV ── */
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(4,11,23,0.97);border-top:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(32px);display:flex;z-index:200;padding:6px 4px calc(8px + env(safe-area-inset-bottom))}
.bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0;border:none;background:transparent;cursor:pointer;border-radius:10px;margin:0 2px;transition:all 0.2s}
.bnav-ico{font-size:20px;line-height:1;transition:transform 0.2s;color:rgba(240,237,230,0.22)}
.bnav-lbl{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(240,237,230,0.22);transition:color 0.2s}
.bnav-btn.on .bnav-ico{transform:scale(1.12);color:#1AABF0}
.bnav-btn.on .bnav-lbl{color:#1AABF0}
.bnav-notif{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#EF3B23;border:1.5px solid #040B17}

/* ── TOPNAV ── */
.tnav{width:100%;display:flex;align-items:center;justify-content:space-between;padding:18px 0 14px;flex-shrink:0}
.wm{font-family:'Anton',sans-serif;font-size:20px;letter-spacing:2px;text-transform:uppercase;background:linear-gradient(90deg,#F0EDE6,rgba(240,237,230,0.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* ── STAMP GRID ── */
.sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%}
.stile{aspect-ratio:1;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border:1.5px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden}
.stile::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 55%);pointer-events:none}
.stile.on{background:linear-gradient(145deg,rgba(0,122,193,0.22),rgba(253,185,39,0.12));border-color:rgba(253,185,39,0.5);box-shadow:0 6px 28px rgba(253,185,39,0.16)}
.stile .ico{font-size:24px;filter:grayscale(1) opacity(0.22);transition:all 0.4s}
.stile.on .ico{filter:none;opacity:1}
.stile .nm{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:rgba(240,237,230,0.25);text-align:center;padding:0 4px;line-height:1.2;transition:color 0.4s}
.stile.on .nm{color:#FDB927}
.stile .chk{position:absolute;top:7px;right:7px;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#FDB927,#FFD060);display:flex;align-items:center;justify-content:center;font-size:8px;color:#1a0a00;font-weight:900;box-shadow:0 2px 10px rgba(253,185,39,0.6)}

/* ── ALERTS ── */
.alr{width:100%;padding:12px 15px;border-radius:12px;display:flex;align-items:flex-start;gap:9px;font-size:13px;line-height:1.45;font-weight:500}
.alr-e{background:rgba(229,62,62,0.1);border:1px solid rgba(229,62,62,0.22);color:#fca5a5}
.alr-i{background:rgba(0,122,193,0.1);border:1px solid rgba(0,122,193,0.28);color:#93c5fd}
.alr-o{background:rgba(34,212,106,0.1);border:1px solid rgba(34,212,106,0.22);color:#86efac}

/* ── TOAST ── */
.toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);min-width:220px;max-width:88vw;background:rgba(4,11,23,0.97);border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(32px);padding:11px 20px;border-radius:14px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.5px;text-align:center;z-index:9999;pointer-events:none;box-shadow:0 12px 40px rgba(0,0,0,0.6);animation:toastUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both}

/* ── PLAYER CARD ── */
.player-card{
  width:100%;border-radius:24px;position:relative;overflow:hidden;
  box-shadow:0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04);
}
.player-card-inner{position:relative;z-index:2;padding:0}
.pc-header{padding:24px 22px 18px;position:relative}
.pc-number{
  position:absolute;top:-12px;right:16px;
  font-family:'Anton',sans-serif;font-size:120px;line-height:1;
  color:rgba(255,255,255,0.05);letter-spacing:-4px;
  user-select:none;pointer-events:none;
}
.pc-avatar-ring{
  width:72px;height:72px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:36px;flex-shrink:0;
  box-shadow:0 8px 28px rgba(0,0,0,0.5);
}
.pc-stats-row{
  display:grid;grid-template-columns:repeat(3,1fr);
  border-top:1px solid rgba(255,255,255,0.08);
}
.pc-stat{padding:14px 10px;text-align:center;position:relative}
.pc-stat+.pc-stat{border-left:1px solid rgba(255,255,255,0.08)}
.pc-stat-n{font-family:'Anton',sans-serif;font-size:26px;line-height:1}
.pc-stat-l{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,237,230,0.38);margin-top:2px}

/* ── NFC CARD PREVIEW ── */
.nfc-card{width:100%;max-width:330px;height:192px;border-radius:22px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.06);box-shadow:0 24px 72px rgba(0,0,0,0.65);margin:0 auto}
.nfc-inner{position:absolute;inset:0;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;z-index:2}
.nfc-sheen{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.05) 50%,transparent 65%);pointer-events:none}

/* ── THEME SWATCH ── */
.theme-swatch{
  border-radius:16px;padding:14px 12px;border:2px solid rgba(255,255,255,0.08);
  cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;gap:8px;
}
.theme-swatch.sel{border-color:rgba(0,122,193,0.7);box-shadow:0 0 20px rgba(0,122,193,0.3)}
.theme-swatch.locked{opacity:0.55;cursor:not-allowed}

/* ── AVATAR GRID ── */
.av-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%}
.av-btn{
  aspect-ratio:1;border-radius:14px;border:2px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.03);
  display:flex;align-items:center;justify-content:center;font-size:28px;
  cursor:pointer;transition:all 0.2s;
}
.av-btn.sel{border-color:rgba(0,122,193,0.7);background:rgba(0,122,193,0.15);box-shadow:0 0 18px rgba(0,122,193,0.3);transform:scale(1.05)}
.av-btn:hover:not(.sel){border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.06)}

/* ── JERSEY GRID ── */
.jnum{
  padding:12px 6px;border-radius:12px;border:2px solid rgba(255,255,255,0.08);
  background:rgba(255,255,255,0.03);text-align:center;
  font-family:'Anton',sans-serif;font-size:22px;cursor:pointer;transition:all 0.2s;
  color:rgba(240,237,230,0.7);
}
.jnum.sel{border-color:rgba(253,185,39,0.7);background:rgba(253,185,39,0.1);color:#FDB927;box-shadow:0 0 16px rgba(253,185,39,0.25)}

/* ── ACHIEVEMENT CARD ── */
.ach{padding:13px 14px;border-radius:14px;display:flex;align-items:center;gap:12px;transition:all 0.3s}
.ach.earned{background:linear-gradient(135deg,rgba(0,122,193,0.15),rgba(253,185,39,0.08));border:1.5px solid rgba(253,185,39,0.35)}
.ach.locked{background:rgba(255,255,255,0.02);border:1.5px solid rgba(255,255,255,0.06);opacity:0.55}
.ach-ico{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.ach.earned .ach-ico{background:linear-gradient(135deg,rgba(253,185,39,0.2),rgba(0,122,193,0.2));box-shadow:0 4px 16px rgba(253,185,39,0.2)}
.ach.locked .ach-ico{background:rgba(255,255,255,0.04);filter:grayscale(1)}

/* ── RANK BADGE ── */
.rank-badge{
  display:inline-flex;align-items:center;gap:8px;
  padding:8px 16px;border-radius:40px;
  font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;
}

/* ── TIMELINE ── */
.tl-item{display:flex;gap:12px;position:relative}
.tl-item+.tl-item::before{content:'';position:absolute;left:15px;top:-12px;width:1px;height:12px;background:rgba(255,255,255,0.1)}
.tl-dot{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;margin-top:2px}

/* ── TOGGLE ── */
.tgl{position:relative;width:44px;height:24px;flex-shrink:0}
.tgl input{opacity:0;width:0;height:0;position:absolute}
.tgl-track{position:absolute;inset:0;border-radius:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.12);cursor:pointer;transition:all 0.25s}
.tgl-track::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:rgba(240,237,230,0.6);transition:all 0.25s;box-shadow:0 2px 6px rgba(0,0,0,0.4)}
.tgl input:checked+.tgl-track{background:rgba(0,122,193,0.7);border-color:rgba(0,122,193,0.9)}
.tgl input:checked+.tgl-track::after{left:23px;background:#fff;box-shadow:0 2px 8px rgba(0,122,193,0.5)}

/* ── QR ── */
.qr-wrap{background:white;border-radius:18px;padding:14px;display:inline-flex;align-items:center;justify-content:center}

/* ── LEADERBOARD ── */
.lb-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);transition:all 0.2s}
.lb-item.top1{background:linear-gradient(135deg,rgba(253,185,39,0.15),rgba(253,185,39,0.05));border-color:rgba(253,185,39,0.4)}
.lb-item.top2{background:linear-gradient(135deg,rgba(192,192,192,0.1),rgba(192,192,192,0.03));border-color:rgba(192,192,192,0.3)}
.lb-item.top3{background:linear-gradient(135deg,rgba(205,127,50,0.1),rgba(205,127,50,0.03));border-color:rgba(205,127,50,0.3)}
.lb-rank{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:900;font-size:14px;flex-shrink:0}
.lb-item.top1 .lb-rank{background:#FDB927;color:#1a0a00}
.lb-item.top2 .lb-rank{background:#c0c0c0;color:#1a1a1a}
.lb-item.top3 .lb-rank{background:#cd7f32;color:#1a1a1a}
.lb-info{flex:1}
.lb-name{font-size:13px;font-weight:700;color:#F0EDE6}
.lb-stat{font-size:10px;color:"rgba(240,237,230,0.5)"}
.lb-badge{font-size:20px;font-weight:900}

/* ── MISC ── */
.fld{display:flex;flex-direction:column;width:100%;gap:7px}
.row{display:flex;align-items:center}
.col{display:flex;flex-direction:column}
.g4{gap:4px}.g6{gap:6px}.g8{gap:8px}.g10{gap:10px}.g12{gap:12px}.g14{gap:14px}.g16{gap:16px}.g18{gap:18px}.g20{gap:20px}.g24{gap:24px}
.w100{width:100%}.grow{flex:1}.wrap{flex-wrap:wrap}
.tc{text-align:center}.bold{font-weight:700}
.hr{width:100%;height:1px;background:rgba(255,255,255,0.07)}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-ok{background:#22D46A;box-shadow:0 0 8px #22D46A}

/* ── KEYFRAMES ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes toastUp{from{opacity:0;transform:translateX(-50%) translateY(16px) scale(0.94)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes stampBurst{0%{transform:scale(0.3) rotate(-18deg);opacity:0}55%{transform:scale(1.18) rotate(4deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes glowGold{0%,100%{box-shadow:0 0 22px rgba(253,185,39,0.22)}50%{box-shadow:0 0 52px rgba(253,185,39,0.6),0 0 80px rgba(253,185,39,0.2)}}
@keyframes rankShine{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.45}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(130px) rotate(540deg);opacity:0}}
@keyframes cardFlip{from{transform:rotateY(80deg) scale(0.9);opacity:0}to{transform:rotateY(0) scale(1);opacity:1}}
@keyframes achPop{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}

.au{animation:fadeUp 0.44s cubic-bezier(0.34,1.56,0.64,1) both}
.ai{animation:fadeIn 0.32s ease both}
.ap{animation:stampBurst 0.5s cubic-bezier(0.34,1.56,0.64,1) both}
.ac{animation:cardFlip 0.48s cubic-bezier(0.34,1.56,0.64,1) both}
.agd{animation:glowGold 3s ease-in-out infinite}
.ach-pop{animation:achPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both}

.d1{animation-delay:0.06s}.d2{animation-delay:0.12s}.d3{animation-delay:0.18s}
.d4{animation-delay:0.24s}.d5{animation-delay:0.30s}.d6{animation-delay:0.36s}
.d7{animation-delay:0.42s}.d8{animation-delay:0.48s}

@media(min-width:480px){.page{padding:0 24px 94px}}
`;

// ═══════════════ SHARED COMPONENTS ═══════════════

function Spinner({sz=18,color="#007AC1"}){return<div style={{width:sz,height:sz,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:color,animation:"spin 0.7s linear infinite",flexShrink:0}}/>}
function Alrt({type="i",children}){const m={e:"⚠",i:"ℹ",o:"✓"};const c={e:"alr-e",i:"alr-i",o:"alr-o"};return<div className={`alr ${c[type]}`}><span style={{fontSize:15,flexShrink:0}}>{m[type]}</span><span>{children}</span></div>}
function Confetti(){const p=Array.from({length:30},(_,i)=>({id:i,color:[C.orange,C.gold,C.blue,C.cream,C.ok][i%5],left:`${2+Math.random()*96}%`,top:`${3+Math.random()*18}%`,delay:`${Math.random()*0.7}s`,w:`${5+Math.random()*7}px`,h:`${3+Math.random()*4}px`,rot:Math.random()*360}));return<>{p.map(x=><div key={x.id} style={{position:"fixed",background:x.color,left:x.left,top:x.top,animationDelay:x.delay,width:x.w,height:x.h,transform:`rotate(${x.rot}deg)`,borderRadius:2,pointerEvents:"none",zIndex:9998,animation:"confetti 1.4s ease-in forwards"}}/>)}</>}
function StampGrid({stamps={}}){return<div className="sgrid">{Object.values(STATIONS).map((st,i)=>{const on=!!stamps[st.id];return(<div key={st.id} className={`stile${on?" on":""} au d${Math.min(i+1,8)}`}><span className="ico">{st.icon}</span><span className="nm">{st.name}</span>{on&&<div className="chk">✓</div>}</div>)})}</div>}

function QRCode({value="",size=120}){
  const N=21;const seed=value.split("").reduce((h,c,i)=>((h<<5)-h+c.charCodeAt(0)+i*7)|0,5381);
  const finder=(r,c)=>{for(const[or,oc]of[[0,0],[0,14],[14,0]]){if(r>=or&&r<=or+6&&c>=oc&&c<=oc+6){const lr=r-or,lc=c-oc;if(lr===0||lr===6||lc===0||lc===6)return 1;if(lr>=2&&lr<=4&&lc>=2&&lc<=4)return 1;return 0}}if((r===6&&c>=8&&c<=12)||(c===6&&r>=8&&r<=12))return r%2===0||c%2===0?1:0;return null};
  const cells=Array.from({length:N*N},(_,i)=>{const r=Math.floor(i/N),c=i%N;const f=finder(r,c);if(f!==null)return f;const s=(seed^(r*31+c*17)^(i*7))&0xFFFF;return((s*1664525+1013904223)&0xFFFF)>32767?1:0});
  const cs=size/N;
  return<div className="qr-wrap" style={{boxShadow:"0 16px 48px rgba(0,0,0,0.6)"}}><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{cells.map((v,i)=>v?<rect key={i} x={(i%N)*cs} y={Math.floor(i/N)*cs} width={cs-0.5} height={cs-0.5} rx="1.2" fill="#002D62"/>:null)}</svg></div>
}

// ═══════════════ QR MODAL (SNAPCHAT STYLE) ═══════════════
function QRModal({value="",onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)",animation:"fadeIn 0.2s ease"}}>
      <div style={{position:"absolute",top:20,right:20}}>
        <button onClick={onClose} style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"white",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:14,color:"rgba(240,237,230,0.6)",marginBottom:8}}>Point camera at code</div>
          <div className="qr-wrap" style={{boxShadow:"0 0 60px rgba(0,122,193,0.8)"}}><QRCode value={value} size={280}/></div>
        </div>
        <div style={{fontSize:12,color:"rgba(240,237,230,0.4)",textAlign:"center"}}>Scan with staff terminal or another device</div>
      </div>
    </div>
  );
}

// ═══════════════ CUSTOM NFC CARD ═══════════════
function ThemedCard({name="FAN",type="adult",token="",themeId="thunder",jersey="",avatar="⚡",anim=false,compact=false}){
  const theme=CARD_THEMES[themeId]||CARD_THEMES.thunder;
  const h=compact?160:192;
  
  // Premium card styling inspired by Amex, CashApp, Apple
  return(
    <div className={`nfc-card${anim?" ac":""}`} style={{
      height:h,
      background:theme.bg,
      maxWidth:compact?280:330,
      position:"relative",
      overflow:"hidden",
      // Premium depth
      boxShadow:"0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
      // Smooth edges
      borderRadius:24,
      // Subtle rim light
      border:"1px solid rgba(255,255,255,0.12)",
    }}>
      {/* Gradient overlay for depth */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%,rgba(0,0,0,0.1) 100%)",pointerEvents:"none",zIndex:1}}/>
      
      {/* Subtle stripe accent */}
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:4,background:theme.stripe,opacity:0.8,zIndex:2}}/>
      
      {/* Premium content */}
      <div className="nfc-inner" style={{position:"relative",zIndex:3}}>
        {/* Top section: Branding + Avatar */}
        <div className="row" style={{justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            {/* OKC THUNDER engraved text */}
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:7,
              fontWeight:900,
              letterSpacing:4,
              color:"rgba(240,237,230,0.35)",
              marginBottom:6,
              textTransform:"uppercase",
              textShadow:"0 1px 2px rgba(0,0,0,0.3)",
            }}>OKC THUNDER</div>
            {/* Fan name engraved */}
            <div style={{
              fontFamily:"'Anton',sans-serif",
              fontSize:compact?16:20,
              color:"#F0EDE6",
              textTransform:"uppercase",
              letterSpacing:0.5,
              lineHeight:1.1,
              textShadow:"0 2px 4px rgba(0,0,0,0.4)",
              wordBreak:"break-word",
              fontWeight:900,
            }}>{(name||"FAN").slice(0,22)}</div>
          </div>
          {/* Avatar with premium glow */}
          <div style={{
            fontSize:compact?20:24,
            filter:`drop-shadow(0 4px 12px ${theme.accent}44)`,
            textShadow:"0 2px 4px rgba(0,0,0,0.3)",
            flexShrink:0,
            marginLeft:8,
          }}>{avatar}</div>
        </div>

        {/* Bottom section: Jersey, Token, NFC indicator */}
        <div className="row" style={{justifyContent:"space-between",alignItems:"flex-end",marginTop:"auto"}}>
          {/* Left: Jersey number engraved */}
          <div style={{textAlign:"left"}}>
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:7,
              fontWeight:900,
              letterSpacing:2,
              color:"rgba(240,237,230,0.3)",
              textTransform:"uppercase",
              marginBottom:2,
              textShadow:"0 1px 2px rgba(0,0,0,0.3)",
            }}>Jersey</div>
            <div style={{
              fontFamily:"'Anton',sans-serif",
              fontSize:compact?18:24,
              color:theme.accent,
              fontWeight:900,
              textShadow:`0 2px 6px ${theme.accent}44`,
              lineHeight:1,
            }}>#{jersey||"0"}</div>
          </div>

          {/* Center: NFC Token engraved small */}
          <div style={{textAlign:"center",flex:1}}>
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:6.5,
              fontWeight:900,
              letterSpacing:2,
              color:"rgba(240,237,230,0.25)",
              textTransform:"uppercase",
              marginBottom:2,
              textShadow:"0 1px 2px rgba(0,0,0,0.3)",
            }}>NFC ID</div>
            <div style={{
              fontFamily:"monospace",
              fontSize:compact?7:8,
              color:"rgba(240,237,230,0.4)",
              letterSpacing:0.5,
              textShadow:"0 1px 2px rgba(0,0,0,0.3)",
              wordBreak:"break-all",
            }}>{(token||"••••-••••").slice(0,16)}</div>
          </div>

          {/* Right: NFC tap indicator with glow */}
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{
              width:compact?28:36,
              height:compact?28:36,
              borderRadius:"50%",
              background:`linear-gradient(135deg,${theme.accent}44,${theme.accent}22)`,
              border:`2px solid ${theme.accent}66`,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              fontSize:compact?14:18,
              boxShadow:`0 0 12px ${theme.accent}33`,
              textShadow:"0 1px 2px rgba(0,0,0,0.3)",
              fontWeight:900,
            }}>📡</div>
          </div>
        </div>
      </div>

      {/* Embossed watermark jersey number (very subtle) */}
      <div style={{
        position:"absolute",
        top:compact?-8:-12,
        left:12,
        fontFamily:"'Anton',sans-serif",
        fontSize:compact?60:80,
        color:"rgba(255,255,255,0.04)",
        letterSpacing:-2,
        lineHeight:1,
        userSelect:"none",
        pointerEvents:"none",
        fontWeight:900,
        textShadow:"0 4px 12px rgba(0,0,0,0.4)",
      }}>#{jersey||"0"}</div>
    </div>
  );
}

// ═══════════════ TOGGLE COMPONENT ═══════════════
function Toggle({checked,onChange}){
  return(
    <label className="tgl">
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>
      <span className="tgl-track"/>
    </label>
  );
}

// ═══════════════ ACTION HOOK ═══════════════
function useA(){
  const{state,dispatch}=useCtx();
  const toast=(msg,color=C.cream,dur=2800)=>{dispatch({t:"TOAST",v:{msg,color}});setTimeout(()=>dispatch({t:"TOAST",v:null}),dur)};
  const nav=useCallback(s=>dispatch({t:"PUSH",s}),[dispatch]);
  const back=useCallback(()=>dispatch({t:"POP"}),[dispatch]);
  const go=useCallback(s=>dispatch({t:"GO",s}),[dispatch]);

  const updatePrefs=useCallback((pid,prefs)=>{
    const db={...state.db,profiles:{...state.db.profiles}};
    db.profiles[pid]={...db.profiles[pid],prefs:{...db.profiles[pid].prefs,...prefs,customized:true}};
    dispatch({t:"DB",db});
  },[state.db,dispatch]);

  const registerStart=useCallback(async({name,email,kids})=>{
    const el=email.toLowerCase().trim();
    const db={...state.db,accounts:{...state.db.accounts}};
    const ex=db.accounts[el];
    if(ex){const cnt=Object.values(state.db.profiles).filter(p=>p.aid===ex.aid).length;if(cnt>=4)throw new Error("Email already has 4 passes.")}
    const aid=ex?.aid||uid("A");const code=mkOTP();
    db.accounts[el]={aid,el,verified:false,ts:now(),otp:code,otpExp:now()+600000,cnt:0};
    dispatch({t:"DB",db});return{aid,otp:code};
  },[state.db,dispatch]);

  const verifyOTP=useCallback(async({email,code})=>{
    const db={...state.db,accounts:{...state.db.accounts}};
    const el=email.toLowerCase().trim();const acc=db.accounts[el];
    if(!acc)throw new Error("Account not found.");
    if(acc.otpExp<now())throw new Error("Code expired.");
    if(acc.otp!==code)throw new Error("Incorrect code.");
    db.accounts[el]={...acc,verified:true};dispatch({t:"DB",db});
  },[state.db,dispatch]);

  const createProfiles=useCallback(async({aid,email,name,kids,kidNames})=>{
    const db={...state.db,accounts:{...state.db.accounts},profiles:{...state.db.profiles},issuances:{...state.db.issuances}};
    const el=email.toLowerCase().trim();
    const ex=Object.values(db.profiles).filter(p=>p.aid===aid);
    if(ex.length+1+kids>4)throw new Error("Exceeds 4-pass limit.");
    const profs=[{id:uid("P"),aid,type:"adult",name:name.trim(),stamps:{},redeemed:false,ts:now(),prefs:{avatar:"⚡",theme:"thunder",jersey:"0",bio:"",customized:false,notifStamps:true,notifEvents:true,showRank:true},fanSince:new Date(now()).toISOString().slice(0,10)}];
    for(let i=0;i<kids;i++)profs.push({id:uid("P"),aid,type:"kid",name:kidNames[i].trim(),stamps:{},redeemed:false,ts:now(),prefs:{avatar:"⭐",theme:"thunder",jersey:"",bio:""},fanSince:new Date(now()).toISOString().slice(0,10)});
    profs.forEach(p=>{db.profiles[p.id]=p});
    const iid=uid("I");
    db.issuances[iid]={aid,pids:profs.map(p=>p.id),ts:now(),exp:now()+1800000,used:false};
    db.accounts[el]={...db.accounts[el],cnt:profs.length};
    db.metrics={...db.metrics,regs:(db.metrics.regs||0)+1};
    dispatch({t:"DB",db});dispatch({t:"SESS",v:{aid,email:el,name,role:"fan"}});
    sessionStorage.setItem("lc_iss",JSON.stringify({iid,profs}));
    return{iid,profs};
  },[state.db,dispatch]);

  return{toast,nav,back,go,updatePrefs,registerStart,verifyOTP,createProfiles};
}

// ═══════════════ HOME ═══════════════
function Home(){
  const{state}=useCtx();const{go}=useA();
  return(
    <div className="page">
      <div className="tnav">
        <div className="col g4"><div className="wm">Loud City</div><div style={{fontSize:9,color:"rgba(240,237,230,0.38)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.5,textTransform:"uppercase"}}>Playoffs 2025</div></div>
        <span className="bdg b-lv">● Live</span>
      </div>
      <div className="col g14 w100">
        <div className="au" style={{width:"100%",borderRadius:22,overflow:"hidden",position:"relative",background:"linear-gradient(150deg,#00193A 0%,#002D62 40%,#003d7a 100%)",border:"1px solid rgba(0,90,180,0.35)",boxShadow:"0 28px 80px rgba(0,0,0,0.6)"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#EF3B23,#FDB927,#EF3B23)"}}/>
          <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,122,193,0.28),transparent 70%)"}}/>
          <div style={{position:"relative",zIndex:1,padding:"26px 22px 22px"}}>
            <div className="ant" style={{fontSize:52,color:"#F0EDE6",lineHeight:0.9,marginBottom:12}}>LOUD<br/><span style={{WebkitTextStroke:"2px #FDB927",WebkitTextFillColor:"transparent",fontSize:58}}>CITY</span><br/>PASS</div>
            <div style={{fontSize:13,color:"rgba(240,237,230,0.5)",lineHeight:1.55,maxWidth:270}}>Tap 6 stations. Fill your stamp card. Claim your playoff prize.</div>
            <div className="row g16" style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              {[["6","Stations"],["Free","Prize"],["NFC","Card"],["<90s","Setup"]].map(([v,l])=><div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"Anton,sans-serif",fontSize:17,color:"#FDB927"}}>{v}</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(240,237,230,0.38)",marginTop:1}}>{l}</div></div>)}
            </div>
          </div>
        </div>
        <div className="col g10 w100 au d2">
          {state.sess?.role==="fan"
            ?<><button className="btn btn-gd btn-full" onClick={()=>go("profile")}>⚡ My Profile & Pass</button><button className="btn btn-gh btn-full" style={{fontSize:12}} onClick={()=>go("register")}>Register Another Group</button></>
            :<button className="btn btn-or btn-full" style={{height:58,fontSize:18}} onClick={()=>go("register")}>Create My Free Pass →</button>
          }
        </div>
        <div className="s1 w100 au d3" style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 18px 8px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}><div className="lbl">How It Works</div></div>
          {[["📲","Register","Under 60 sec"],["🎴","Get Card","Employee NFC desk"],["📡","Tap 6 Stations","Collect stamps"],["🏆","Claim Prize","Return card"]].map(([ico,t,d],i,a)=><div key={t} className="row g12" style={{padding:"12px 18px",borderBottom:i<a.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}><div style={{fontFamily:"Anton,sans-serif",fontSize:10,color:"rgba(253,185,39,0.55)",letterSpacing:2,minWidth:20}}>{String(i+1).padStart(2,"0")}</div><span style={{fontSize:18}}>{ico}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{t}</div><div style={{fontSize:11,color:"rgba(240,237,230,0.38)",marginTop:1}}>{d}</div></div></div>)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════ REGISTER ═══════════════
function Register(){
  const{back,go,registerStart,verifyOTP,createProfiles}=useA();
  const[step,setStep]=useState(0);
  const[form,setForm]=useState({name:"",email:"",kids:0,kidNames:["","",""]});
  const[otpVal,setOtpVal]=useState(["","","","","",""]);
  const[hint,setHint]=useState("");
  const[aid,setAid]=useState(null);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const refs=useRef([]);
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const doEmail=async()=>{if(!form.name.trim()){setErr("Enter your name.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){setErr("Enter valid email.");return}setErr("");setLoading(true);try{const{aid:a,otp:c}=await registerStart(form);setAid(a);setHint(c);setStep(1);setTimeout(()=>refs.current[0]?.focus(),200)}catch(e){setErr(e.message)}setLoading(false)};
  const doOTP=async()=>{const code=otpVal.join("");if(code.length<6){setErr("Enter all 6 digits.");return}setErr("");setLoading(true);try{await verifyOTP({email:form.email,code});setStep(2)}catch(e){setErr(e.message)}setLoading(false)};
  const doCreate=async()=>{for(let i=0;i<form.kids;i++)if(!form.kidNames[i].trim()){setErr(`Nickname needed for Kid ${i+1}.`);return}setErr("");setLoading(true);try{await createProfiles({aid,email:form.email,name:form.name,kids:form.kids,kidNames:form.kidNames});go("issuance")}catch(e){setErr(e.message)}setLoading(false)};
  const oCh=(i,v)=>{if(!/^\d?$/.test(v))return;const n=[...otpVal];n[i]=v;setOtpVal(n);if(v&&i<5)setTimeout(()=>refs.current[i+1]?.focus(),10)};
  const oKy=(i,e)=>{if(e.key==="Backspace"&&!otpVal[i]&&i>0)refs.current[i-1]?.focus()};
  return(
    <div className="page">
      <div className="tnav"><div className="row g10"><button className="btn btn-ic" onClick={back}>←</button><div><div className="wm">Register</div><div style={{fontSize:9,color:"rgba(240,237,230,0.38)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.5,textTransform:"uppercase"}}>{["Enter Details","Verify Email","Your Group"][step]}</div></div></div><span className="bdg b-bl">Step {step+1}/3</span></div>
      {step===0&&<div className="col g16 w100 au">
        <div><div className="ant" style={{fontSize:42,color:"#F0EDE6"}}>CREATE<br/><span style={{color:C.blue}}>YOUR</span><br/>PASS</div><div style={{fontSize:13,color:"rgba(240,237,230,0.45)",marginTop:8,lineHeight:1.6}}>Free for all fans. One email = up to 4 passes.</div></div>
        <div className="col g10">
          <div className="fld"><div className="lbl">Full Name</div><input className="inp" placeholder="First & Last Name" value={form.name} onChange={e=>upd("name",e.target.value)} autoComplete="name"/></div>
          <div className="fld"><div className="lbl">Email</div><input className="inp" type="email" inputMode="email" placeholder="you@example.com" value={form.email} onChange={e=>upd("email",e.target.value)} autoComplete="email"/></div>
          <div className="fld"><div className="lbl">Kids? (0–3)</div><div className="row g8">{[0,1,2,3].map(n=><button key={n} onClick={()=>upd("kids",n)} style={{flex:1,height:50,borderRadius:11,border:"1.5px solid",borderColor:form.kids===n?C.blue:"rgba(255,255,255,0.08)",background:form.kids===n?"rgba(0,122,193,0.15)":"transparent",color:form.kids===n?"#F0EDE6":"rgba(240,237,230,0.38)",fontFamily:"Anton,sans-serif",fontSize:22,cursor:"pointer",transition:"all 0.2s"}}>{n}</button>)}</div></div>
        </div>
        {err&&<Alrt type="e">{err}</Alrt>}
        <button className="btn btn-bl btn-full" disabled={loading} onClick={doEmail}>{loading?<><Spinner sz={16} color="white"/>Sending…</>:"Send Verification Code →"}</button>
      </div>}
      {step===1&&<div className="col g20 w100 au">
        <div><div className="ant" style={{fontSize:42,color:"#F0EDE6"}}>CHECK<br/><span style={{color:C.gold}}>INBOX</span></div><div style={{fontSize:13,color:"rgba(240,237,230,0.45)",marginTop:8}}>Sent to <strong style={{color:"#F0EDE6"}}>{form.email}</strong></div></div>
        {hint&&<Alrt type="i"><strong>Demo code:</strong> <strong className="mono" style={{fontSize:17,color:C.blueHi,letterSpacing:2}}>{hint}</strong></Alrt>}
        <div className="col g10"><div className="lbl tc">6-Digit Code</div><div className="otp-row">{otpVal.map((d,i)=><input key={i} ref={el=>refs.current[i]=el} className={`otp-b${d?" v":""}`} maxLength={1} value={d} inputMode="numeric" onChange={e=>oCh(i,e.target.value)} onKeyDown={e=>oKy(i,e)}/>)}</div></div>
        {err&&<Alrt type="e">{err}</Alrt>}
        <button className="btn btn-bl btn-full" disabled={loading} onClick={doOTP}>{loading?<><Spinner sz={16} color="white"/>Verifying…</>:"Verify →"}</button>
      </div>}
      {step===2&&<div className="col g16 w100 au">
        <div><div className="ant" style={{fontSize:42,color:"#F0EDE6"}}>NAME<br/><span style={{color:C.orange}}>GROUP</span></div></div>
        <div className="row g12 s3" style={{padding:"12px 14px"}}><div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${C.blue},${C.navyDk})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⚡</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{form.name}</div><span className="bdg b-bl" style={{marginTop:4}}>Adult</span></div></div>
        {form.kids>0&&Array.from({length:form.kids},(_,i)=><div key={i} className="row g10"><div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${C.orange},#8B1000)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⭐</div><input className="inp" style={{flex:1}} placeholder={`Kid ${i+1} Nickname`} value={form.kidNames[i]} onChange={e=>{const k=[...form.kidNames];k[i]=e.target.value;upd("kidNames",k)}}/></div>)}
        {err&&<Alrt type="e">{err}</Alrt>}
        <button className="btn btn-or btn-full" style={{height:56,fontSize:17}} disabled={loading} onClick={doCreate}>{loading?<><Spinner sz={16} color="white"/>Creating…</>:`Get My ${1+form.kids} Pass${form.kids>0?"es":""} →`}</button>
      </div>}
    </div>
  );
}

// ═══════════════ ISSUANCE ═══════════════
function Issuance(){
  const{back,go}=useA();const[ctx,setCtx]=useState(null);const[secs,setSecs]=useState(1800);
  useEffect(()=>{try{const r=sessionStorage.getItem("lc_iss");if(r)setCtx(JSON.parse(r))}catch{}},[]);
  useEffect(()=>{const t=setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t)},[]);
  const mm=String(Math.floor(secs/60)).padStart(2,"0"),ss=String(secs%60).padStart(2,"0");
  const profs=ctx?.profs||[];
  return(
    <div className="page">
      <div className="tnav"><div className="row g10"><button className="btn btn-ic" onClick={back}>←</button><div><div className="wm">Your Pass</div><div style={{fontSize:9,color:"rgba(240,237,230,0.38)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.5,textTransform:"uppercase"}}>Card Pickup</div></div></div></div>
      <div className="col g16 w100">
        <div className="au"><div className="ant" style={{fontSize:48,color:"#F0EDE6"}}>YOU'RE<br/><span style={{color:C.gold}}>ALL SET!</span></div><div style={{fontSize:13,color:"rgba(240,237,230,0.45)",marginTop:8,lineHeight:1.55}}>Show this QR to an employee at the <strong style={{color:"#F0EDE6"}}>blue NFC desk</strong>.</div></div>
        <div className="s1 col g14 au d2 agd" style={{padding:22,alignItems:"center",borderRadius:22}}><QRCode value={ctx?.iid||"DEMO"} size={148}/><div style={{textAlign:"center"}}><div className="mono" style={{fontSize:11,color:"rgba(240,237,230,0.38)",letterSpacing:1,marginBottom:5}}>{ctx?.iid||"DEMO"}</div><div className="row g6" style={{justifyContent:"center"}}><span style={{fontSize:12,color:"rgba(240,237,230,0.38)"}}>Expires in</span><span style={{fontFamily:"Anton,sans-serif",fontSize:20,color:C.gold}}>{mm}:{ss}</span></div></div></div>
        <div className="col g8 w100 au d3"><div className="lbl">{profs.length} Pass{profs.length!==1?"es":""} to Collect</div>{profs.map((p,i)=><div key={p.id} className={`row g12 s3 au d${i+3}`} style={{padding:"12px 14px"}}><div style={{width:40,height:40,borderRadius:12,background:p.type==="adult"?`linear-gradient(135deg,${C.blue},${C.navyDk})`:`linear-gradient(135deg,${C.orange},#8B1000)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{p.type==="adult"?"⚡":"⭐"}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{p.name}</div><span className={`bdg ${p.type==="adult"?"b-bl":"b-or"}`} style={{marginTop:4}}>{p.type}</span></div></div>)}</div>
        <button className="btn btn-gh btn-full au d5" style={{fontSize:12}} onClick={()=>go("profile")}>📱 I Have My Card — Go to My Profile</button>
      </div>
    </div>
  );
}

// ═══════════════ ★ PROFILE DASHBOARD ★ ═══════════════
function ProfileDashboard(){
  const{state,dispatch}=useCtx();const{back,go,updatePrefs,toast}=useA();
  const[tab,setTab]=useState("card");
  const[celebrate,setCelebrate]=useState(false);
  const[saving,setSaving]=useState(false);
  const[toastMsg,setToastMsg]=useState(null);
  const[showQRModal,setShowQRModal]=useState(false);

  // Get current user's profile
  const profile=state.sess?.aid
    ?Object.values(state.db.profiles).find(p=>p.aid===state.sess.aid&&p.type==="adult")
    :Object.values(state.db.profiles)[0]; // fallback to first demo profile

  const prefs=profile?.prefs||{avatar:"⚡",theme:"thunder",jersey:"0",bio:"",notifStamps:true,notifEvents:true,showRank:true};
  const stamps=profile?.stamps||{};
  const stampCount=Object.keys(stamps).length;
  const token=Object.values(state.db.cards).find(c=>c.pid===profile?.id&&c.active)?.token;
  const rank=getFanRank(stampCount);
  const pct=(stampCount/TOTAL)*100;

  // Compute achievements
  const achievements=ACHIEVEMENTS.map((a,idx,arr)=>({
    ...a, earned:a.req(profile,state.db,arr.map((x,j)=>({...x,earned:j<idx?x.req(profile,state.db,arr):false})))
  }));
  const earnedCount=achievements.filter(a=>a.earned).length;

  // Local editable prefs
  const[editPrefs,setEditPrefs]=useState({...prefs});
  const[editName,setEditName]=useState(profile?.name||"");
  const[editBio,setEditBio]=useState(prefs.bio||"");
  const[changed,setChanged]=useState(false);
  const upd=(k,v)=>{setEditPrefs(p=>({...p,[k]:v}));setChanged(true)};
  const updBio=(v)=>{setEditBio(v);setChanged(true)};
  const updName=(v)=>{setEditName(v);setChanged(true)};

  const savePrefs=async()=>{
    if(!profile)return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,500));
    updatePrefs(profile.id,{...editPrefs,bio:editBio});
    // Also update name if changed
    if(editName!==profile.name){
      const db={...state.db,profiles:{...state.db.profiles}};
      db.profiles[profile.id]={...db.profiles[profile.id],name:editName.trim()||profile.name};
      if(state.sess)dispatch({t:"SESS",v:{...state.sess,name:editName.trim()}});
      dispatch({t:"DB",db});
    }
    setChanged(false);setSaving(false);
    setToastMsg({msg:"✓ Profile saved!",color:C.ok});
    setTimeout(()=>setToastMsg(null),2500);
  };

  const showT=(msg,color=C.cream)=>{setToastMsg({msg,color});setTimeout(()=>setToastMsg(null),2800)};

  // Real-time sync listener for staff-awarded stamps
  useEffect(()=>{
    const handleSync = (e) => {
      try{
        const data = JSON.parse(localStorage.getItem(SYNC_CHANNEL));
        if(data?.event === "stamp_awarded" && data?.pid === profile?.id){
          showT(`📲 Staff awarded stamp: ${data.stationName}!`,C.ok);
          // Refetch profile to update UI
          setTimeout(()=>dispatch({t:"DB",db:state.db}),300);
        } else if(data?.event === "redeemed" && data?.pid === profile?.id){
          showT("🏆 Your prize has been redeemed!",C.gold);
        }
      }catch{}
    };
    window.addEventListener("storage",handleSync);
    return ()=>window.removeEventListener("storage",handleSync);
  },[profile?.id,dispatch]);

  if(!profile)return<div className="page"><div className="col g16" style={{paddingTop:80,alignItems:"center",textAlign:"center"}}><div style={{fontSize:48}}>👤</div><div className="ant" style={{fontSize:32}}>No Profile</div><div style={{fontSize:13,color:"rgba(240,237,230,0.45)"}}>Register to create your fan profile.</div><button className="btn btn-bl" onClick={()=>go("register")}>Register Now →</button></div></div>;

  const theme=CARD_THEMES[editPrefs.theme]||CARD_THEMES.thunder;

  return(
    <div className="page" style={{paddingBottom:108}}>
      {celebrate&&<Confetti/>}

      {/* Top nav */}
      <div className="tnav">
        <div className="row g10">
          <button className="btn btn-ic" onClick={back}>←</button>
          <div><div className="wm">My Profile</div><div style={{fontSize:9,color:"rgba(240,237,230,0.38)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.5,textTransform:"uppercase"}}>Loud City HQ</div></div>
        </div>
        <div className="row g8">
          {changed&&<button className="btn btn-gd btn-sm" disabled={saving} onClick={savePrefs}>{saving?<Spinner sz={14} color="#1a0c00"/>:"Save"}</button>}
        </div>
      </div>

      {/* ── PLAYER CARD HERO ── */}
      <div className="player-card au w100" style={{background:theme.bg,marginBottom:16}}>
        {/* Top stripe */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:theme.stripe,borderRadius:"24px 24px 0 0",zIndex:3}}/>
        {/* Big number watermark */}
        <div className="pc-number" style={{color:"rgba(255,255,255,0.06)"}}>#{editPrefs.jersey||"0"}</div>
        <div className="player-card-inner">
          <div className="pc-header">
            <div className="row g14" style={{alignItems:"flex-start"}}>
              {/* Avatar ring */}
              <div className="pc-avatar-ring" style={{background:`linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))`,border:`2px solid ${theme.accent}55`}}>
                <span style={{fontSize:36,filter:`drop-shadow(0 4px 16px ${theme.accent}88)`}}>{editPrefs.avatar}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(240,237,230,0.4)",marginBottom:4}}>Loud City Fan</div>
                <div style={{fontFamily:"Anton,sans-serif",fontSize:28,color:"white",textTransform:"uppercase",lineHeight:1,letterSpacing:0.5}}>{editName}</div>
                {/* Rank badge */}
                <div className="rank-badge" style={{background:`${rank.color}18`,border:`1px solid ${rank.color}44`,color:rank.color,marginTop:8}}>
                  <span>★</span><span>{rank.title}</span>
                </div>
              </div>
              {/* Stamp count big */}
              <div style={{textAlign:"center",flexShrink:0}}>
                <div style={{fontFamily:"Anton,sans-serif",fontSize:48,lineHeight:1,color:stampCount>=TOTAL?C.gold:C.cream}}>{stampCount}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:9,color:"rgba(240,237,230,0.38)",letterSpacing:1.5,textTransform:"uppercase"}}>/{TOTAL} stamps</div>
              </div>
            </div>
            {editBio&&<div style={{fontSize:12,color:"rgba(240,237,230,0.5)",marginTop:12,lineHeight:1.55,fontStyle:"italic"}}>"{editBio}"</div>}
            {/* Progress */}
            <div style={{marginTop:14}}>
              <div className="prog"><div className="prog-f" style={{width:`${pct}%`}}/></div>
              {rank.next&&<div style={{fontSize:10,color:"rgba(240,237,230,0.35)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5,marginTop:6}}>{rank.nextAt-stampCount} stamp{rank.nextAt-stampCount!==1?"s":""} to <span style={{color:rank.color}}>{rank.next}</span></div>}
            </div>
          </div>

          {/* Stats row */}
          <div className="pc-stats-row">
            {[
              [stampCount,"Stamps",C.gold],
              [earnedCount,"Badges",C.blue],
              [profile?.redeemed?"Yes":"No","Redeemed",profile?.redeemed?C.ok:C.fog],
            ].map(([v,l,c])=>(
              <div key={l} className="pc-stat">
                <div className="pc-stat-n" style={{color:c}}>{v}</div>
                <div className="pc-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="tabs w100 au d2" style={{marginBottom:14}}>
        <button className={`tab${tab==="card"?" on":""}`} onClick={()=>setTab("card")}>Card</button>
        <button className={`tab${tab==="customize"?" on":""}`} onClick={()=>setTab("customize")}>Edit</button>
        <button className={`tab${tab==="stamps"?" on":""}`} onClick={()=>setTab("stamps")}>Stamps</button>
        <button className={`tab${tab==="leaderboard"?" on":""}`} onClick={()=>setTab("leaderboard")}>🏆</button>
        <button className={`tab${tab==="achievements"?" on":""}`} onClick={()=>setTab("achievements")}>Badges</button>
      </div>

      {/* ── TAB: CARD ── */}
      {tab==="card"&&(
        <div className="col g14 w100 au">
          <div className="lbl">Your NFC Card</div>
          <ThemedCard name={editName} type={profile.type} token={token||"DEMO"} themeId={editPrefs.theme} jersey={editPrefs.jersey} avatar={editPrefs.avatar} anim/>
          
          {/* Clickable QR Code (Snapchat style) */}
          <div className="row g10 s3" style={{padding:"14px 16px",cursor:"pointer",borderRadius:14,border:"1.5px solid rgba(0,122,193,0.3)",background:"rgba(0,122,193,0.08)",transition:"all 0.2s",hover:{background:"rgba(0,122,193,0.12)"}}} onClick={()=>setShowQRModal(true)}>
            <div style={{position:"relative"}}>
              <QRCode value={token||"DEMO"} size={72}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:"rgba(0,0,0,0)",pointerEvents:"none"}}>👆</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>Tap for Full QR</div>
              <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginTop:2,lineHeight:1.5}}>Large size for staff scanning. Zero errors, instant results.</div>
              <div className="mono" style={{fontSize:9,color:"rgba(240,237,230,0.3)",marginTop:5}}>{token||"No card issued yet"}</div>
            </div>
          </div>
          
          {stampCount>=TOTAL&&!profile.redeemed&&(
            <div className="agd" style={{padding:"16px 18px",borderRadius:18,background:"rgba(253,185,39,0.07)",border:"1.5px solid rgba(253,185,39,0.48)"}}>
              <div className="row g12"><span style={{fontSize:34}}>🏆</span><div><div className="bc" style={{fontSize:17,color:C.gold}}>CARD COMPLETE!</div><div style={{fontSize:12,color:"rgba(240,237,230,0.45)",marginTop:3}}>Return NFC card to claim your playoff prize.</div></div></div>
            </div>
          )}
          {!token&&<div className="row g10 s3" style={{padding:"13px 15px"}}><span style={{fontSize:20}}>📡</span><div style={{fontSize:13,color:"rgba(240,237,230,0.45)",lineHeight:1.5}}>Pick up your physical NFC card at the employee station to start collecting stamps.</div></div>}
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && <QRModal value={token||"DEMO"} onClose={()=>setShowQRModal(false)}/>}

      {/* ── TAB: CUSTOMIZE ── */}
      {tab==="customize"&&(
        <div className="col g20 w100 au">

          {/* Display name */}
          <div className="fld">
            <div className="lbl">Fan Name (on card)</div>
            <input className="inp" value={editName} onChange={e=>updName(e.target.value)} placeholder="Your name" maxLength={24}/>
          </div>

          {/* Bio */}
          <div className="fld">
            <div className="lbl">Fan Bio</div>
            <textarea className="inp" rows={2} value={editBio} onChange={e=>updBio(e.target.value)} placeholder="Tell us your Thunder story…" maxLength={120}/>
            <div style={{fontSize:10,color:"rgba(240,237,230,0.28)",textAlign:"right"}}>{editBio.length}/120</div>
          </div>

          {/* Avatar */}
          <div className="fld">
            <div className="lbl">Fan Avatar</div>
            <div className="av-grid">
              {AVATARS.map(av=><button key={av} className={`av-btn${editPrefs.avatar===av?" sel":""}`} onClick={()=>upd("avatar",av)}>{av}</button>)}
            </div>
          </div>

          {/* Jersey Number */}
          <div className="fld">
            <div className="lbl">Jersey Number</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {JERSEY_NUMBERS.map(n=><button key={n} className={`jnum${editPrefs.jersey===n?" sel":""}`} onClick={()=>upd("jersey",n)}>#{n}</button>)}
            </div>
          </div>

          {/* Card Theme */}
          <div className="fld">
            <div className="lbl">Card Skin</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {Object.values(CARD_THEMES).map(t=>{
                const sel=editPrefs.theme===t.id;
                const isLocked=t.locked;
                return(
                  <div key={t.id} className={`theme-swatch${sel?" sel":""}${isLocked?" locked":""}`}
                    onClick={()=>!isLocked&&upd("theme",t.id)}>
                    {/* Mini card preview */}
                    <div style={{width:"100%",height:56,borderRadius:10,background:t.bg,position:"relative",overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:4,background:t.stripe}}/>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,opacity:0.7}}>{editPrefs.avatar}</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:sel?"#F0EDE6":"rgba(240,237,230,0.5)"}}>{t.name}</div>
                      {isLocked&&<div style={{fontSize:9,color:C.gold,marginTop:2,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5}}>🔒 {t.req}</div>}
                    </div>
                    {sel&&<div style={{position:"absolute",top:6,right:6,width:18,height:18,borderRadius:"50%",background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:900}}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live preview */}
          <div className="fld">
            <div className="lbl">Live Card Preview</div>
            <ThemedCard name={editName||"YOUR NAME"} type="adult" token={token} themeId={editPrefs.theme} jersey={editPrefs.jersey} avatar={editPrefs.avatar} anim/>
          </div>

          {/* Notifications */}
          <div className="fld">
            <div className="lbl">Notifications</div>
            <div className="s3" style={{padding:0,overflow:"hidden"}}>
              {[["notifStamps","Stamp alerts","Get notified when you earn a stamp"],["notifEvents","Event updates","Loud City HQ announcements"],["showRank","Show rank","Display your fan rank on profile"]].map(([key,label,desc],i,a)=>(
                <div key={key} className="row g12" style={{padding:"14px 16px",borderBottom:i<a.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{label}</div><div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginTop:2}}>{desc}</div></div>
                  <Toggle checked={!!editPrefs[key]} onChange={v=>upd(key,v)}/>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-gd btn-full" disabled={saving||!changed} onClick={savePrefs}>
            {saving?<><Spinner sz={16} color="#1a0c00"/>Saving…</>:"Save Changes →"}
          </button>
        </div>
      )}

      {/* ── TAB: STAMPS ── */}
      {tab==="stamps"&&(
        <div className="col g14 w100 au">
          <div className="row" style={{justifyContent:"space-between"}}>
            <div className="lbl">Stamp Progress</div>
            <div style={{fontFamily:"Anton,sans-serif",fontSize:16}}><span style={{color:C.gold}}>{stampCount}</span><span style={{color:"rgba(240,237,230,0.35)"}}> / {TOTAL}</span></div>
          </div>
          <StampGrid stamps={stamps}/>
          {/* Station details */}
          <div className="s1 col w100" style={{borderRadius:18,overflow:"hidden"}}>
            {Object.values(STATIONS).map((s,i)=>{
              const ts=stamps[s.id];
              return(
                <div key={s.id} className="row g12" style={{padding:"13px 16px",borderTop:i>0?"1px solid rgba(255,255,255,0.06)":"none"}}>
                  <div style={{width:38,height:38,borderRadius:11,background:ts?`linear-gradient(135deg,${s.color}33,${s.color}11)`:undefined,border:`1px solid ${ts?s.color+"55":"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:ts?"#F0EDE6":"rgba(240,237,230,0.5)"}}>{s.full}</div>
                    <div style={{fontSize:10,color:"rgba(240,237,230,0.35)",marginTop:1}}>{s.loc}{ts?` · ${new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:" · Not stamped"}</div>
                  </div>
                  <div style={{flexShrink:0}}>{ts?<span className="bdg b-gd" style={{fontSize:8}}>✓ Earned</span>:<span className="bdg b-mu" style={{fontSize:8}}>Pending</span>}</div>
                </div>
              );
            })}
          </div>
          {/* Staff-awarded stamps info */}
          <div className="row g8" style={{background:"linear-gradient(135deg,rgba(0,122,193,0.1),rgba(34,212,106,0.08))",border:"1px solid rgba(34,212,106,0.3)",borderRadius:14,padding:12,alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>📍</span>
            <div style={{fontSize:12,color:"rgba(240,237,230,0.7)",lineHeight:1.5}}>Tap QR codes at event stations or have staff scan your QR to earn stamps. {stampCount>=TOTAL&&<span style={{fontWeight:700,color:C.gold}}>Your card is complete! Return to claim prize.</span>}</div>
          </div>
        </div>
      )}

      {/* ── TAB: LEADERBOARD ── */}
      {tab==="leaderboard"&&(
        <div className="col g14 w100 au">
          <div className="lbl">🏆 Competitive Leaderboard</div>
          <div className="col g8 w100">
            {Object.values(state.db.profiles).sort((a,b)=>(Object.keys(b.stamps||{}).length)-(Object.keys(a.stamps||{}).length)).slice(0,10).map((p,i)=>{
              const pStamps = Object.keys(p.stamps||{}).length;
              const pRank = getFanRank(pStamps);
              const isCurrentUser = p.id === profile?.id;
              return(
                <div key={p.id} className={`lb-item${isCurrentUser?" ai":""} ${i===0?"top1":i===1?"top2":i===2?"top3":""}`} style={{opacity:isCurrentUser?1:0.75}}>
                  <div className="lb-rank">{i+1}</div>
                  <div className="lb-info">
                    <div className="lb-name">{p.name}{isCurrentUser&&" ⭐"}</div>
                    <div className="lb-stat">{pRank.title}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:900,color:pStamps===TOTAL?C.gold:pRank.color}}>{pStamps}</div>
                    <div style={{fontSize:9,color:"rgba(240,237,230,0.4)"}}>stamps</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{background:"rgba(0,122,193,0.1)",border:"1px solid rgba(0,122,193,0.3)",borderRadius:12,padding:12,marginTop:8}}>
            <div style={{fontSize:12,color:"rgba(240,237,230,0.7)",lineHeight:1.5}}>
              📊 <strong>Your Rank:</strong> You're {Object.values(state.db.profiles).filter(p=>Object.keys(p.stamps||{}).length > stampCount).length + 1} out of {Object.values(state.db.profiles).filter(p=>p.type==="adult").length} fans. Keep collecting stamps to climb the leaderboard!
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ACHIEVEMENTS / BADGES ── */}
      {tab==="achievements"&&(
        <div className="col g10 w100 au">
          <div className="row g8" style={{justifyContent:"space-between"}}>
            <div className="lbl">Achievements</div>
            <span className="bdg b-gd">{earnedCount}/{achievements.length} Earned</span>
          </div>
          {/* Rank progression */}
          <div className="s1" style={{padding:"16px 18px",borderRadius:18}}>
            <div className="lbl" style={{marginBottom:10}}>Fan Rank</div>
            <div className="row g10" style={{marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:13,background:`${rank.color}22`,border:`1.5px solid ${rank.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>★</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:rank.color,textTransform:"uppercase",letterSpacing:0.5}}>{rank.title}</div>
                {rank.next&&<div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginTop:2}}>{rank.nextAt-stampCount} more stamp{rank.nextAt-stampCount!==1?"s":""} to reach <span style={{color:rank.color}}>{rank.next}</span></div>}
              </div>
              <div style={{fontFamily:"Anton,sans-serif",fontSize:28,color:rank.color}}>Lv{rank.rank}</div>
            </div>
            <div className="prog"><div className="prog-f" style={{width:`${pct}%`}}/></div>
          </div>

          {/* Achievement list */}
          {achievements.map((a,i)=>(
            <div key={a.id} className={`ach${a.earned?" earned":" locked"} ach-pop`} style={{animationDelay:`${i*0.05}s`}}>
              <div className={`ach-ico`}><span>{a.icon}</span></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:a.earned?"#F0EDE6":"rgba(240,237,230,0.45)"}}>{a.name}</div>
                <div style={{fontSize:11,color:"rgba(240,237,230,0.38)",marginTop:2}}>{a.desc}</div>
              </div>
              {a.earned&&<span className="bdg b-gd" style={{fontSize:8,flexShrink:0}}>Earned</span>}
              {!a.earned&&<span style={{fontSize:18,opacity:0.3,flexShrink:0}}>🔒</span>}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: ACTIVITY TIMELINE ── */}
      {tab==="activity"&&(
        <div className="col g14 w100 au">
          <div className="lbl">Activity History</div>
          {/* Fan since */}
          <div className="row g12 s3" style={{padding:"12px 14px"}}>
            <span style={{fontSize:20}}>📅</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>Fan Since</div>
              <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginTop:1}}>{profile.fanSince||"Today"} · Loud City Rookie</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="col g14 w100">
            {/* Sort events by ts */}
            {[
              {ts:now()-5000, ico:"⚡",label:"Live",text:"Currently active — Loud City HQ",c:C.ok},
              ...(profile.redeemed?[{ts:now()-50000,ico:"🏆",label:"Redeemed",text:"Complete pass redeemed · Prize claimed!",c:C.gold}]:[]),
              ...Object.entries(stamps).sort((a,b)=>b[1]-a[1]).map(([sid,ts])=>({ts,ico:STATIONS[sid].icon,label:STATIONS[sid].name,text:`Stamp earned at ${STATIONS[sid].full}`,c:STATIONS[sid].color})),
              {ts:profile.ts||now()-900000, ico:"🎴",label:"Registered",text:`Joined as ${profile.name} · Card issued`,c:C.blue},
            ].map((evt,i)=>(
              <div key={i} className="tl-item">
                <div className="tl-dot" style={{background:`${evt.c}22`,border:`1.5px solid ${evt.c}44`,width:32,height:32,flexShrink:0}}>
                  <span style={{fontSize:14}}>{evt.ico}</span>
                </div>
                <div style={{flex:1,paddingTop:4}}>
                  <div className="row g8">
                    <div style={{fontSize:13,fontWeight:600}}>{evt.label}</div>
                    <span className="bdg" style={{color:evt.c,background:`${evt.c}18`,border:`1px solid ${evt.c}30`,fontSize:8,padding:"2px 7px"}}>{new Date(evt.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                  <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginTop:3}}>{evt.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Shareable fan card */}
          <div className="s1" style={{padding:"16px 18px",borderRadius:18}}>
            <div className="lbl" style={{marginBottom:10}}>Your Fan ID</div>
            <div className="row g10">
              <div style={{width:44,height:44,borderRadius:13,background:`linear-gradient(135deg,${C.blue},${C.navyDk})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{editPrefs.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Anton,sans-serif",fontSize:18,textTransform:"uppercase"}}>{editName}</div>
                <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginTop:2}}>{rank.title} · {stampCount}/{TOTAL} stamps · {earnedCount} badges</div>
              </div>
              <QRCode value={profile.id} size={52}/>
            </div>
          </div>
        </div>
      )}

      {toastMsg&&<div className="toast" style={{color:toastMsg.color}}>{toastMsg.msg}</div>}
    </div>
  );
}

// ═══════════════ MODE SELECT ═══════════════
function StaffTerminal(){
  const {state,dispatch} = useCtx();
  const [token,setToken] = useState("");
  const [info,setInfo] = useState(null);
  const [redeemMode,setRedeemMode] = useState(false);
  const [lastScannedTime,setLastScannedTime] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [qrDetected,setQrDetected] = useState(false);

  const back = useCallback(()=>dispatch({t:"GO",s:"mode_select"}),[dispatch]);

  const lookup = () => {
    if(!token.trim()){setInfo({error:"Please enter an ID or token"});return;}
    try{
      const trimmed = token.trim();
      const prof = Object.values(state.db.profiles).find(p=>p.id===trimmed||p.token===trimmed);
      if(!prof){setInfo({error:"Profile not found"});return;}
      
      // Calculate rank for display
      const stampCount = Object.keys(prof.stamps||{}).length;
      const rank = FAN_TITLES.reduce((r,t,i)=>{
        const levels = [0,1,2,3,4,5,6];
        const thresholds = [0,1,3,6,9,12,15];
        return stampCount >= thresholds[i] ? {idx:i,title:t,level:levels[i]} : r;
      },{idx:0,title:"Loud City Rookie",level:0});
      
      setInfo({...prof,staffRank:rank});
      setRedeemMode(false);
    }catch(e){
      setInfo({error:"Lookup failed"});
    }
  };

  const stamp = () => {
    if(!info||info.error) return;
    try{
      const avail = Object.keys(STATIONS).filter(id=>!info.stamps[id]);
      if(!avail.length){dispatch({t:"TOAST",v:{msg:"All stamps collected! 🏆",color:C.gold}});return;}
      const sid = avail[0];
      const db = {...state.db,profiles:{...state.db.profiles}};
      const newStamps = {...info.stamps,[sid]:now()};
      db.profiles[info.id] = {...db.profiles[info.id],stamps:newStamps};
      db.metrics = {...db.metrics,stamps:(db.metrics.stamps||0)+1,byStation:{...db.metrics.byStation,[sid]:(db.metrics.byStation[sid]||0)+1}};
      db.stampEvents = (db.stampEvents||[]).concat({pid:info.id,sid,ts:now(),staffAward:true});
      dispatch({t:"DB",db});
      setInfo({...info,stamps:newStamps});
      // Sync across tabs/windows for real-time updates
      Store.sync({event:"stamp_awarded",pid:info.id,sid,stationName:STATIONS[sid].full});
      dispatch({t:"TOAST",v:{msg:`✓ ${STATIONS[sid].name} — ${info.name} stamped!`,color:C.ok}});
    }catch(e){
      dispatch({t:"TOAST",v:{msg:"Stamp error",color:C.fail}});
    }
  };

  const redeem = () => {
    if(!info||info.error) return;
    try{
      if(info.redeemed){dispatch({t:"TOAST",v:{msg:"Already redeemed",color:C.fail}});return;}
      const db = {...state.db,profiles:{...state.db.profiles}};
      db.profiles[info.id] = {...db.profiles[info.id],redeemed:true};
      db.metrics = {...db.metrics,redeems:(db.metrics.redeems||0)+1};
      dispatch({t:"DB",db});
      setInfo({...info,redeemed:true});
      setRedeemMode(false);
      Store.sync({event:"redeemed",pid:info.id,fanName:info.name});
      dispatch({t:"TOAST",v:{msg:"🏆 Prize redeemed!",color:C.ok}});
    }catch(e){
      dispatch({t:"TOAST",v:{msg:"Redeem error",color:C.fail}});
    }
  };

  useEffect(()=>{
    let stream;
    let idx;
    if(scanning){
      const start = async () => {
        try{
          stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}});
          if(videoRef.current){
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(e=>console.warn(e));
          }
          idx = setInterval(()=>{
            if(videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA){
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current,0,0,canvas.width,canvas.height);
              const img = ctx.getImageData(0,0,canvas.width,canvas.height);
              if(window.jsQR){
                const qr = window.jsQR(img.data,img.width,img.height);
                if(qr && qr.data && now() - lastScannedTime > 2000){
                  const decodedId = qr.data.trim();
                  setQrDetected(true);
                  setToken(decodedId);
                  setLastScannedTime(now());
                  setTimeout(()=>setQrDetected(false),600);
                  setTimeout(()=>{
                    const prof = Object.values(state.db.profiles).find(p=>p.id===decodedId||p.token===decodedId);
                    if(prof){
                      const stampCount = Object.keys(prof.stamps||{}).length;
                      const rank = FAN_TITLES.reduce((r,t,i)=>{
                        const levels = [0,1,2,3,4,5,6];
                        const thresholds = [0,1,3,6,9,12,15];
                        return stampCount >= thresholds[i] ? {idx:i,title:t,level:levels[i]} : r;
                      },{idx:0,title:"Loud City Rookie",level:0});
                      setInfo({...prof,staffRank:rank});
                      dispatch({t:"TOAST",v:{msg:"✓ Fan scanned",color:C.ok}});
                    } else {
                      setInfo({error:"Profile not found"});
                    }
                  },300);
                  setTimeout(()=>setScanning(false),800);
                }
              }
            }
          },200);
        }catch(e){
          dispatch({t:"TOAST",v:{msg:"Camera access denied",color:C.warn}});
          setScanning(false);
        }      
      };
      start();
    }
    return ()=>{
      if(idx) clearInterval(idx);
      if(stream) stream.getTracks().forEach(t=>t.stop());
    };
  },[scanning,lastScannedTime]);

  const scanNFC = async () => {
    if(!("NDEFReader" in window)){
      dispatch({t:"TOAST",v:{msg:"NFC not supported",color:C.warn}});
      return;
    }
    try{
      const ndef = new NDEFReader();
      await ndef.scan();
      ndef.onreading = evt=>{
        try{
          const decoder = new TextDecoder();
          const text = decoder.decode(evt.message.records[0].data);
          setToken(text);
          lookup();
          dispatch({t:"TOAST",v:{msg:"✓ NFC read",color:C.ok}});
        }catch(e){
          dispatch({t:"TOAST",v:{msg:"NFC error",color:C.fail}});
        }        
      };
    }catch(err){
      dispatch({t:"TOAST",v:{msg:"NFC denied",color:C.warn}});
    }
  };

  const stampCount = info ? Object.keys(info.stamps||{}).length : 0;

  return(
    <div className="page" style={{paddingBottom:120}}>
      <div className="tnav">
        <div className="row g10">
          <button className="btn btn-ic" onClick={back} style={{opacity:0.6}}>←</button>
          <div><div className="wm">Staff Terminal</div><div style={{fontSize:9,color:"rgba(240,237,230,0.38)",fontFamily:"Barlow Condensed,sans-serif",letterSpacing:1.5,textTransform:"uppercase"}}>Fan Scanner</div></div>
        </div>
        <button className="btn btn-sm" style={{background:redeemMode?"rgba(239,59,35,0.3)":"transparent",color:redeemMode?C.orange:"rgba(240,237,230,0.5)",border:"1px solid "+(redeemMode?"rgba(239,59,35,0.6)":"rgba(255,255,255,0.1)")}} onClick={()=>setRedeemMode(!redeemMode)}>
          {redeemMode?"🏆":"Redeem"}
        </button>
      </div>

      <div className="col g10 w100 au" style={{marginTop:24,borderRadius:20,overflow:"hidden",background:"rgba(0,29,58,0.8)",border:"1px solid rgba(0,122,193,0.3)",padding:16}}>
        <div className="lbl" style={{padding:"0 4px"}}>QR Scanner</div>
        {scanning ? (
          <div style={{position:"relative",width:"100%",aspectRatio:"16/9",borderRadius:14,overflow:"hidden",background:"#000",border:"2px solid "+C.blue}}>
            <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} autoPlay playsInline />
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center, transparent 30%, rgba(0,122,193,0.4) 100%)",pointerEvents:"none"}} />
            <div style={{position:"absolute",top:"50%",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+C.scan+",transparent)",animation:"scanLine 2s infinite"}} />
            {qrDetected && <div style={{position:"absolute",inset:0,background:"rgba(34,212,106,0.2)",animation:"pulse 0.6s ease-out"}} />}
          </div>
        ) : (
          <div style={{width:"100%",aspectRatio:"16/9",borderRadius:14,background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(0,122,193,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
            <span style={{fontSize:32}}>📱</span>
            <div style={{fontSize:12,color:"rgba(240,237,230,0.4)"}}>Ready to scan</div>
          </div>
        )}
        <canvas ref={canvasRef} style={{display:"none"}} />
        <div className="row g8">
          <button className={"btn btn-full "+(!scanning?"btn-bl":"btn-or")} onClick={()=>setScanning(v=>!v)} style={{fontWeight:700}}>
            {scanning?"Stop":"📷 Scan"}
          </button>
          <button className="btn btn-full" style={{background:"rgba(0,122,193,0.15)",border:"1.5px solid rgba(0,122,193,0.4)",color:C.blueHi,fontWeight:700}} onClick={scanNFC}>
            📡 NFC
          </button>
        </div>
      </div>

      <div className="col g10 w100" style={{marginTop:16}}>
        <div className="lbl">Manual Input</div>
        <div className="row g8">
          <input className="inp" value={token} onChange={e=>setToken(e.target.value.trim())} onKeyDown={e=>e.key==="Enter"&&lookup()} placeholder="Fan ID" style={{flex:1}} />
          <button className="btn btn-bl btn-sm" onClick={lookup}>Go</button>
        </div>
      </div>

      {info && !info.error && (
        <div className="col g12 w100 au" style={{marginTop:20,borderRadius:18,background:"linear-gradient(135deg,rgba(0,122,193,0.15),rgba(253,185,39,0.08))",border:"1.5px solid rgba(253,185,39,0.35)",padding:16}}>
          {/* Header with avatar and name */}
          <div className="row g12" style={{alignItems:"center"}}>
            <div style={{width:52,height:52,borderRadius:13,background:"linear-gradient(135deg,"+C.navy+","+C.blue+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
              {info.prefs?.avatar||"🏀"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.cream}}>{info.name}</div>
              <div style={{fontSize:11,color:"rgba(240,237,230,0.5)"}}>ID: {info.id.slice(0,12)}…</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:24,fontWeight:900,color:stampCount===TOTAL?C.gold:C.cream}}>{stampCount}</div>
              <div style={{fontSize:9,color:"rgba(240,237,230,0.4)"}}>{TOTAL}</div>
            </div>
          </div>
          
          {/* Rank and Stats Grid */}
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:10,marginTop:10}}>
            <div className="row g12" style={{fontSize:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:"rgba(240,237,230,0.4)",textTransform:"uppercase"}}>Rank</div>
                <div style={{fontSize:13,fontWeight:700,color:C.blue,marginTop:2}}>{info.staffRank?.title||"Rookie"}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:"rgba(240,237,230,0.4)",textTransform:"uppercase"}}>Type</div>
                <div style={{fontSize:13,fontWeight:700,color:C.gold,marginTop:2}}>{info.type==="adult"?"Adult":"Kid"}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:"rgba(240,237,230,0.4)",textTransform:"uppercase"}}>Badges</div>
                <div style={{fontSize:13,fontWeight:700,color:C.ok,marginTop:2}}>{state.db.profiles[info.id]?Object.keys(ACHIEVEMENTS).filter(a=>ACHIEVEMENTS.find(ac=>ac.id===a)?.earned).length:0}</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{width:"100%",height:4,background:"rgba(255,255,255,0.1)",borderRadius:20,overflow:"hidden",marginTop:12}}>
            <div style={{height:"100%",background:"linear-gradient(90deg,"+C.blue+","+C.gold+")",width:(stampCount/TOTAL)*100+"%",transition:"width 0.6s ease-out"}} />
          </div>

          {/* Station Status */}
          <div style={{marginTop:12,fontSize:11}}>
            <div style={{color:"rgba(240,237,230,0.4)",fontWeight:700,marginBottom:6}}>STAMP STATUS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {Object.entries(STATIONS).slice(0,6).map(([sid,s])=>(
                <div key={sid} style={{background:info.stamps?.[sid]?"rgba(34,212,106,0.1)":"rgba(255,255,255,0.04)",border:"1px solid "+(info.stamps?.[sid]?"rgba(34,212,106,0.3)":"rgba(255,255,255,0.1)"),borderRadius:8,padding:8,textAlign:"center"}}>
                  <div style={{fontSize:16}}>{s.icon}</div>
                  <div style={{fontSize:8,color:"rgba(240,237,230,0.5)",marginTop:4}}>{s.name}</div>
                  {info.stamps?.[sid] && <div style={{fontSize:7,color:C.ok,marginTop:2}}>✓</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Redeem Status */}
          <div style={{marginTop:12,padding:10,borderRadius:10,background:info.redeemed?"rgba(34,212,106,0.1)":"rgba(255,255,255,0.04)",border:"1px solid "+(info.redeemed?"rgba(34,212,106,0.3)":"rgba(255,255,255,0.1)")}}>
            <div className="row g8" style={{fontSize:12}}>
              <span style={{fontSize:16}}>{info.redeemed?"✓":"⏳"}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700}}>{info.redeemed?"Prize Redeemed":"Ready to Redeem"}</div>
                <div style={{fontSize:10,color:"rgba(240,237,230,0.5)",marginTop:1}}>{info.redeemed?new Date().toLocaleDateString():"All stamps completed"}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row g10" style={{marginTop:10}}>
            {!redeemMode ? (
              <>
                <button className="btn btn-gd btn-full" onClick={stamp} disabled={stampCount>=TOTAL}>⚡ Stamp</button>
                <button className="btn btn-full" style={{background:"rgba(34,212,106,0.2)",border:"1px solid rgba(34,212,106,0.4)",color:C.ok}} onClick={()=>setRedeemMode(true)} disabled={info.redeemed}>🏆</button>
              </>
            ) : (
              <>
                <button className="btn btn-or btn-full" onClick={redeem} disabled={info.redeemed}>REDEEM</button>
                <button className="btn btn-full" style={{background:"rgba(255,255,255,0.08)",color:"rgba(240,237,230,0.6)"}} onClick={()=>setRedeemMode(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {info?.error && (
        <div style={{marginTop:20,padding:14,borderRadius:16,background:"rgba(229,62,62,0.12)",border:"1px solid rgba(229,62,62,0.4)"}}>
          <div style={{fontSize:12,color:C.cream}}>⚠️ {info.error}</div>
        </div>
      )}

      {!info && (
        <div style={{marginTop:30}}>
          <div className="row g10" style={{marginBottom:16}}>
            <div style={{flex:1,borderRadius:14,background:"rgba(0,122,193,0.1)",border:"1px solid rgba(0,122,193,0.3)",padding:12,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.4)"}}>Active</div>
              <div style={{fontSize:20,fontWeight:900,color:C.blue,marginTop:4}}>{state.db.metrics.regs||0}</div>
            </div>
            <div style={{flex:1,borderRadius:14,background:"rgba(253,185,39,0.1)",border:"1px solid rgba(253,185,39,0.3)",padding:12,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.4)"}}>Stamps</div>
              <div style={{fontSize:20,fontWeight:900,color:C.gold,marginTop:4}}>{state.db.metrics.stamps||0}</div>
            </div>
            <div style={{flex:1,borderRadius:14,background:"rgba(34,212,106,0.1)",border:"1px solid rgba(34,212,106,0.3)",padding:12,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.4)"}}>Redeems</div>
              <div style={{fontSize:20,fontWeight:900,color:C.ok,marginTop:4}}>{state.db.metrics.redeems||0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════ MODE SELECT ═══════════════
function ModeSelect(){
  const{dispatch}=useCtx();
  return(
    <div style={{position:"relative",zIndex:1,minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",maxWidth:430,margin:"0 auto"}}>
      <div className="col g14 w100 au" style={{alignItems:"center",textAlign:"center"}}>
        <div style={{width:76,height:76,borderRadius:24,background:`linear-gradient(135deg,${C.navyDk},${C.navy})`,border:"1px solid rgba(0,90,180,0.4)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",marginBottom:4}}>
          <img src="/thunder-logo.svg" alt="Thunder" style={{width:48,height:48}}/>
        </div>
        <div className="ant" style={{fontSize:52,lineHeight:0.9}}>LOUD<br/><span style={{WebkitTextStroke:`2px ${C.gold}`,WebkitTextFillColor:"transparent"}}>CITY</span><br/>PASS</div>
        <div style={{fontSize:13,color:"rgba(240,237,230,0.45)",lineHeight:1.6,maxWidth:280}}>OKC Thunder · Playoffs 2025<br/>Fan profiles · NFC stamps · Live rewards</div>
      </div>
      <div className="col g12 w100 au d3" style={{marginTop:32}}>
        <button className="btn btn-or btn-full" style={{height:64,fontSize:18,gap:12}} onClick={()=>dispatch({t:"GO",s:"home"})}>
          <span style={{fontSize:28}}>🏀</span>
          <div className="col g2" style={{alignItems:"flex-start"}}><span>Fan Experience</span><span style={{fontSize:11,fontWeight:400,opacity:0.7,textTransform:"none",letterSpacing:0}}>Profile · Stamps · Achievements</span></div>
        </button>
        <button className="btn btn-gh btn-full" style={{height:52,fontSize:15,gap:12}} onClick={()=>dispatch({t:"GO",s:"staff"})}>
          <span style={{fontSize:22}}>🔒</span> Staff Terminal
        </button>
        <div style={{fontSize:10,color:"rgba(240,237,230,0.26)",textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,textTransform:"uppercase",marginTop:4}}>Live profile customization · Fan rank system · Achievement badges</div>
      </div>
    </div>
  );
}

// ═══════════════ ROOT ═══════════════
const FAN_SCREENS={home:Home,register:Register,issuance:Issuance,profile:ProfileDashboard};
const NAV=[["home","🏠","Home"],["profile","👤","Profile"],["register","📝","Register"]];

export default function App(){
  const[state,dispatch]=useReducer(reducer,{
    db:initDB(),sess:Store.loadSess(),online:navigator.onLine,
    screen:"mode_select",stack:[],toast:null,
  });

  useEffect(()=>{
    if(!document.getElementById("lc-v6")){const el=document.createElement("style");el.id="lc-v6";el.textContent=CSS;document.head.appendChild(el)}
  },[]);

  useEffect(()=>{
    const on=()=>dispatch({t:"NET",v:true}),off=()=>dispatch({t:"NET",v:false});
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off)};
  },[]);

  const FanScreen=FAN_SCREENS[state.screen];
  const isFan=!!FanScreen;
  const isStaff = state.screen==="staff";
  const isMode=state.screen==="mode_select";

  return(
    <Ctx.Provider value={{state,dispatch}}>
      <div className="shell">
        <div className="bg"/>
        {isMode&&<ModeSelect/>}
        {isStaff&&<StaffTerminal/>}
        {isFan&&(
          <>
            <FanScreen/>
            <nav className="bnav">
              {NAV.map(([s,ico,lbl])=>(
                <button key={s} className={`bnav-btn${state.screen===s?" on":""}`} onClick={()=>dispatch({t:"GO",s})}>
                  <span className="bnav-ico">{ico}</span>
                  <span className="bnav-lbl">{lbl}</span>
                </button>
              ))}
              <button className="bnav-btn" onClick={()=>dispatch({t:"GO",s:"mode_select"})}>
                <span className="bnav-ico">⚙</span>
                <span className="bnav-lbl">Switch</span>
              </button>
            </nav>
          </>
        )}
        {state.toast&&<div className="toast" style={{color:state.toast.color||C.cream}}>{state.toast.msg}</div>}
      </div>
    </Ctx.Provider>
  );
}
