// IMPROVED STAFF TERMINAL - Ready to replace old version
// This version has no escape character issues and includes:
// - Live QR camera preview with animations
// - NFC scanning support
// - Redeem mode toggle
// - Professional Apple-inspired UI
// - Error handling throughout

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
      const prof = Object.values(state.db.profiles).find(p=>p.id===token.trim()||p.token===token.trim());
      if(!prof){setInfo({error:"Profile not found"});return;}
      setInfo(prof);
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
      dispatch({t:"DB",db});
      setInfo({...info,stamps:newStamps});
      dispatch({t:"TOAST",v:{msg:`⚡ ${STATIONS[sid].full} — Stamped!`,color:C.ok}});
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
      dispatch({t:"TOAST",v:{msg:"🏆 Redeemed!",color:C.ok}});
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
                if(qr && now() - lastScannedTime > 2000){
                  setQrDetected(true);
                  setToken(qr.data);
                  setLastScannedTime(now());
                  setTimeout(()=>setQrDetected(false),600);
                  setTimeout(()=>lookup(),300);
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
      dispatch({t:"TOAST",v:{msg:"NFC not supported on this device",color:C.warn}});
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
          dispatch({t:"TOAST",v:{msg:"✓ NFC read successful",color:C.ok}});
        }catch(e){
          dispatch({t:"TOAST",v:{msg:"NFC read error",color:C.fail}});
        }        
      };
    }catch(err){
      dispatch({t:"TOAST",v:{msg:"NFC permission denied",color:C.warn}});
    }
  };

  const stampCount = info ? Object.keys(info.stamps||{}).length : 0;

  return(
    <div className="page" style={{paddingBottom:120}}>
      <div className="tnav">
        <div className="row g10">
          <button className="btn btn-ic" onClick={back} style={{opacity:0.6}}>←</button>
          <div>
            <div className="wm">Staff Terminal</div>
            <div style={{fontSize:9,color:"rgba(240,237,230,0.38)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.5,textTransform:"uppercase"}}>Fan Scanner</div>
          </div>
        </div>
        <button className="btn btn-sm" style={{background:redeemMode?"rgba(239,59,35,0.3)":"transparent",color:redeemMode?C.orange:"rgba(240,237,230,0.5)",border:"1px solid "+(redeemMode?"rgba(239,59,35,0.6)":"rgba(255,255,255,0.1)")}} onClick={()=>setRedeemMode(!redeemMode)}>
          {redeemMode?"🏆 Redeem":"Redeem Mode"}
        </button>
      </div>

      <div className="col g10 w100 au" style={{marginTop:24,borderRadius:20,overflow:"hidden",background:"rgba(0,29,58,0.8)",border:"1px solid rgba(0,122,193,0.3)",padding:16}}>
        <div className="lbl" style={{padding:"0 4px"}}>Live Scanner</div>
        
        {scanning ? (
          <div style={{position:"relative",width:"100%",aspectRatio:"16/9",borderRadius:14,overflow:"hidden",background:"#000",border:"2px solid "+C.blue}}>
            <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} autoPlay playsInline />
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center, transparent 30%, rgba(0,122,193,0.4) 100%)",pointerEvents:"none"}} />
            <div style={{position:"absolute",top:12,left:12,width:32,height:32,border:"2px solid "+C.gold,borderRight:"none",borderBottom:"none",borderRadius:4}} />
            <div style={{position:"absolute",top:12,right:12,width:32,height:32,border:"2px solid "+C.gold,borderLeft:"none",borderBottom:"none",borderRadius:4}} />
            <div style={{position:"absolute",bottom:12,left:12,width:32,height:32,border:"2px solid "+C.gold,borderRight:"none",borderTop:"none",borderRadius:4}} />
            <div style={{position:"absolute",bottom:12,right:12,width:32,height:32,border:"2px solid "+C.gold,borderLeft:"none",borderTop:"none",borderRadius:4}} />
            <div style={{position:"absolute",top:"50%",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+C.scan+",transparent)",animation:"scanLine 2s ease-in-out infinite"}} />
            {qrDetected && <div style={{position:"absolute",inset:0,background:"rgba(34,212,106,0.2)",animation:"pulse 0.6s ease-out"}} />}
            <div style={{position:"absolute",bottom:14,left:14,right:14,textAlign:"center",fontSize:12,color:C.cream,background:"rgba(4,11,23,0.8)",padding:"8px 12px",borderRadius:8,fontWeight:600}}>Hold card steady • Scanning…</div>
          </div>
        ) : (
          <div style={{width:"100%",aspectRatio:"16/9",borderRadius:14,background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(0,122,193,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
            <span style={{fontSize:32}}>📱</span>
            <div style={{fontSize:12,color:"rgba(240,237,230,0.4)",textAlign:"center"}}>Press below to start scanning</div>
          </div>
        )}
        <canvas ref={canvasRef} style={{display:"none"}} />

        <div className="row g8">
          <button className={"btn btn-full "+(!scanning?"btn-bl":"btn-or")} onClick={()=>setScanning(v=>!v)} style={{fontWeight:700,fontSize:14}}>
            {scanning?(<><span style={{fontSize:16}}>⏹</span>Stop</>):(<><span style={{fontSize:18}}>📷</span>Scan QR</>)}
          </button>
          <button className="btn btn-full" style={{background:"rgba(0,122,193,0.15)",border:"1.5px solid rgba(0,122,193,0.4)",color:C.blueHi,fontWeight:700,fontSize:14}} onClick={scanNFC}>
            <span style={{fontSize:18}}>📡</span>Tap NFC
          </button>
        </div>
      </div>

      <div className="col g10 w100" style={{marginTop:16}}>
        <div className="lbl">Or Enter ID</div>
        <div className="row g8">
          <input className="inp" value={token} onChange={e=>setToken(e.target.value.trim())} onKeyDown={e=>e.key==="Enter"&&lookup()} placeholder="Fan ID or token" style={{flex:1}} />
          <button className="btn btn-bl btn-sm" onClick={lookup}>Go</button>
        </div>
      </div>

      {info && !info.error && (
        <div className="col g12 w100 au" style={{marginTop:20,borderRadius:18,background:"linear-gradient(135deg,rgba(0,122,193,0.15),rgba(253,185,39,0.08))",border:"1.5px solid rgba(253,185,39,0.35)",padding:16,animation:"fadeUp 0.4s ease-out"}}>
          <div className="row g12" style={{alignItems:"center"}}>
            <div style={{width:52,height:52,borderRadius:13,background:"linear-gradient(135deg,"+C.navy+","+C.blue+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>
              {info.prefs?.avatar||"🏀"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.cream}}>{info.name||"Unknown"}</div>
              <div style={{fontSize:11,color:"rgba(240,237,230,0.5)",marginTop:1}}>ID: {info.id.slice(0,8)}…</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:24,fontWeight:900,color:stampCount===TOTAL?C.gold:C.cream}}>{stampCount}</div>
              <div style={{fontSize:9,color:"rgba(240,237,230,0.4)",letterSpacing:0.5,textTransform:"uppercase"}}>/{TOTAL}</div>
            </div>
          </div>
          
          <div style={{width:"100%",height:4,background:"rgba(255,255,255,0.1)",borderRadius:20,overflow:"hidden"}}>
            <div style={{height:"100%",background:"linear-gradient(90deg,"+C.blue+","+C.gold+")",width:(stampCount/TOTAL)*100+"%",transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1)"}} />
          </div>

          <div className="row g12" style={{fontSize:12}}>
            <div className="row g4" style={{flex:1}}>
              <span style={{fontSize:14}}>🎴</span>
              <div><strong>Redeemed:</strong> {info.redeemed?"Yes":"No"}</div>
            </div>
            <div className="row g4" style={{flex:1}}>
              <span style={{fontSize:14}}>⚡</span>
              <div><strong>Active:</strong> Now</div>
            </div>
          </div>

          <div className="row g10" style={{marginTop:6}}>
            {!redeemMode ? (
              <>
                <button className="btn btn-gd btn-full" onClick={stamp} disabled={stampCount>=TOTAL} style={{fontWeight:700}}>
                  <span style={{fontSize:16}}>⚡</span>Add Stamp
                </button>
                <button className="btn btn-full" style={{background:"rgba(34,212,106,0.2)",border:"1.5px solid rgba(34,212,106,0.4)",color:C.ok,fontWeight:700}} onClick={()=>setRedeemMode(true)} disabled={info.redeemed}>
                  <span style={{fontSize:16}}>🏆</span>
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-or btn-full" onClick={redeem} disabled={info.redeemed} style={{fontWeight:700,fontSize:15}}>
                  🏆 REDEEM PRIZE
                </button>
                <button className="btn btn-full" style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.15)",color:"rgba(240,237,230,0.6)",fontWeight:700}} onClick={()=>setRedeemMode(false)}>
                  ← Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {info?.error && (
        <div className="col g10 w100 au" style={{marginTop:20,borderRadius:16,background:"rgba(229,62,62,0.12)",border:"1.5px solid rgba(229,62,62,0.4)",padding:14,animation:"fadeUp 0.3s ease-out"}}>
          <div className="row g8">
            <span style={{fontSize:20}}>⚠️</span>
            <div>
              <div style={{fontWeight:700,color:C.cream}}>Not Found</div>
              <div style={{fontSize:11,color:"rgba(240,237,230,0.5)",marginTop:2}}>{info.error}</div>
            </div>
          </div>
        </div>
      )}

      {!info && (
        <div className="col g16 w100" style={{marginTop:30}}>
          <div className="row g10">
            <div style={{flex:1,borderRadius:14,background:"rgba(0,122,193,0.1)",border:"1px solid rgba(0,122,193,0.3)",padding:12,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.4)",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Active</div>
              <div style={{fontSize:22,fontWeight:900,color:C.blue,marginTop:4}}>{state.db.metrics.regs||0}</div>
            </div>
            <div style={{flex:1,borderRadius:14,background:"rgba(253,185,39,0.1)",border:"1px solid rgba(253,185,39,0.3)",padding:12,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.4)",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Stamps</div>
              <div style={{fontSize:22,fontWeight:900,color:C.gold,marginTop:4}}>{state.db.metrics.stamps||0}</div>
            </div>
            <div style={{flex:1,borderRadius:14,background:"rgba(34,212,106,0.1)",border:"1px solid rgba(34,212,106,0.3)",padding:12,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.4)",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Redeems</div>
              <div style={{fontSize:22,fontWeight:900,color:C.ok,marginTop:4}}>{state.db.metrics.redeems||0}</div>
            </div>
          </div>

          {state.db.liveEvents && state.db.liveEvents.length>0 && (
            <div className="col g8 au" style={{borderRadius:16,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",padding:14}}>
              <div className="lbl">Live Activity</div>
              {state.db.liveEvents.slice(0,4).map((evt,i)=>(
                <div key={evt.id} className="row g10" style={{fontSize:12,padding:"10px 0",borderTop:i>0?"1px solid rgba(255,255,255,0.06)":"none",animation:"fadeUp 0.4s ease-out"}}>
                  <span style={{fontSize:18}}>{evt.type==="redeem"?"🏆":"⚡"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>{evt.name}</div>
                    <div style={{fontSize:10,color:"rgba(240,237,230,0.35)",marginTop:1}}>{evt.stationName||"Trophy claimed"}</div>
                  </div>
                  <div style={{fontSize:9,color:"rgba(240,237,230,0.3)"}}>{new Date(evt.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
