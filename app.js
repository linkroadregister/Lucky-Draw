/* eslint-env browser */
/* eslint-disable no-alert */
/* global requestAnimationFrame, cancelAnimationFrame, performance */
(function(){
  'use strict';

  // rAF polyfill
  window.requestAnimationFrame = window.requestAnimationFrame || function(cb){ return setTimeout(()=>cb(performance.now()),16) };
  window.cancelAnimationFrame = window.cancelAnimationFrame || function(h){ clearTimeout(h) };

  const SKEY='ldraw-new.v1';
  const state={participants:[], winners:[], shuffleMs:1200, prizes:[{name:'รางวัลทั่วไป',qty:1,active:true}]};
  try{Object.assign(state,JSON.parse(localStorage.getItem(SKEY)||'{}'))}catch{}
  const $=id=>document.getElementById(id);
  const onlyDigits=s=>{let out='';const str=String(s||'');for(let i=0;i<str.length;i++){const c=str[i];if(c>='0'&&c<='9') out+=c;}return out};
  const pad6=n=>onlyDigits(n).padStart(6,'0').slice(-6);
  const save=()=>localStorage.setItem(SKEY,JSON.stringify(state));

  // Tabs
  const show=p=>{
    $('panelDraw').classList.toggle('hidden',p!=='draw');
    $('panelRegister').classList.toggle('hidden',p!=='register');
    $('tabDraw').classList.toggle('btn-primary',p==='draw');
    $('tabRegister').classList.toggle('btn-primary',p==='register');
    $('tabDraw').classList.toggle('btn-ghost',p!=='draw');
    $('tabRegister').classList.toggle('btn-ghost',p!=='register');
  };
  $('tabDraw').onclick=()=>show('draw');
  $('tabRegister').onclick=()=>show('register');

  // Names sub-tabs
  function showNamesTab(k){
    const add=$('namesAdd'), list=$('namesList');
    if(k==='add'){ add.classList.remove('hidden'); list.classList.add('hidden');
      $('tabNamesAdd').classList.add('btn-primary'); $('tabNamesAdd').classList.remove('btn-ghost');
      $('tabNamesList').classList.add('btn-ghost'); $('tabNamesList').classList.remove('btn-primary'); $('regNumber').focus();
    }else{ list.classList.remove('hidden'); add.classList.add('hidden');
      $('tabNamesList').classList.add('btn-primary'); $('tabNamesList').classList.remove('btn-ghost');
      $('tabNamesAdd').classList.add('btn-ghost'); $('tabNamesAdd').classList.remove('btn-primary');
    }
  }
  $('tabNamesList').onclick=()=>showNamesTab('list');
  $('tabNamesAdd').onclick=()=>showNamesTab('add');

  // Render register list
  let searchQuery='';
  function renderReg(){
    const tb=$('regTable'); tb.innerHTML='';
    const data=state.participants.filter(p=>!searchQuery||(p.name||'').toLowerCase().includes(searchQuery)||p.num.includes(searchQuery));
    $('countAll').textContent=state.participants.length;
    data.forEach(p=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${p.num}</td><td>${p.name||'-'}</td><td class="centerCell"><button data-num="${p.num}" class="btn btn-ghost" style="padding:.25rem .5rem">ลบ</button></td>`;
      tb.appendChild(tr);
    });
    tb.querySelectorAll('button[data-num]').forEach(b=>b.onclick=e=>{
      const num=e.target.dataset.num;
      const idx=state.participants.findIndex(x=>x.num===num);
      if(idx>-1){ state.participants.splice(idx,1); save(); renderReg(); }
    });
  }
  $('searchBox').addEventListener('input',e=>{searchQuery=(e.target.value||'').trim().toLowerCase(); renderReg();});

  // Add participant
  $('regNumber').addEventListener('input',e=>e.target.value=pad6(e.target.value));
  $('btnAdd').onclick=addParticipant;
  $('regName').addEventListener('keydown',e=>{ if(e.key==='Enter'){ addParticipant(); } });
  function addParticipant(){
    const num=pad6($('regNumber').value), name=$('regName').value.trim();
    if(!num){$('regNumber').focus();return}
    if(state.participants.some(p=>p.num===num)){alert('หมายเลขนี้ถูกใช้แล้ว');return}
    state.participants.push({num,name});
    $('regNumber').value=''; $('regName').value='';
    save(); renderReg(); showNamesTab('list');
  }

  // Import/Export/Clear participants
  $('btnImport').onclick=()=>$('fileImport').click();
  $('fileImport').addEventListener('change',async e=>{
    const f=e.target.files[0]; if(!f) return;
    const txt=await f.text(); importParticipants(txt); e.target.value='';
  });
  function importParticipants(text){
    const used=new Set(state.participants.map(p=>p.num)); let added=0;
    (text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(line=>{
      const parts=line.split(',');
      const num=pad6(parts[0]||''); if(!num||used.has(num)) return;
      used.add(num); state.participants.push({num,name:(parts[1]||'').trim()}); added++;
    });
    save(); renderReg(); alert(`นำเข้าเรียบร้อย: ${added} ราย`);
  }
  $('btnExport').onclick=()=>{
    const rows=[["number","name"],...state.participants.map(p=>[p.num,p.name])];
    const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    const a=document.createElement('a'); a.href=url; a.download='participants.csv'; a.click(); URL.revokeObjectURL(url);
  };
  $('btnClearAll').onclick=()=>{ if(confirm('ล้างรายชื่อทั้งหมด?')){ state.participants=[]; save(); renderReg(); }};

  // Export winners
  $('btnExportWinners').onclick=()=>{
    const rows=[["number","name","prize","timestamp"],...state.winners.map(w=>[w.num,w.name,w.prize,w.ts])];
    const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    const a=document.createElement('a'); a.href=url; a.download='winners.csv'; a.click(); URL.revokeObjectURL(url);
  };

  // Seed dummy if empty
  const dummyNames=['David Wilson','Jane Smith','John Doe','Michael Johnson','Sarah Brown','Emily Davis','Chris Miller','Olivia Taylor','Daniel Anderson','Sophia Thomas','บินเดช มั่นคง','ปณิชา เก่งนัก','วิไล สวยใส','สมชาย ใจดี','สมหญิง ใจงาม','กิตติศักดิ์ พลังดี','พิมพ์ชนก ศรีสุข','อธิชา อนันต์ชัย','ชาญชัย ใจกล้า','วรรณิภา พรหมสุข'];
  function ensureDummy(){ if(state.participants.length===0){ const used=new Set(); dummyNames.forEach(n=>{ let num; do{ num=String(Math.floor(Math.random()*1e6)).padStart(6,'0'); }while(used.has(num)); used.add(num); state.participants.push({num,name:n}); }); save(); } }

  // Prizes
  const activePrize=()=>state.prizes.find(p=>p.active)||state.prizes[0];
  const winsOfPrize=name=>state.winners.filter(w=>w.prize===name).length;
  const remain=p=>Math.max(0,(parseInt(p.qty||0)-winsOfPrize(p.name)));
  function updatePrizeViews(){ const p=activePrize(); const rem=p?`${remain(p)}/${p.qty}`:'-'; $('quickRemain').textContent=rem; $('fsPrizeName').textContent=p?p.name:'—'; $('fsPrizeRemain').textContent=p?`(คงเหลือ ${rem})`:''; }
  function buildQuickPrize(){ const sel=$('quickPrize'); sel.innerHTML='';
    state.prizes.forEach((p,i)=>{ const opt=document.createElement('option'); opt.value=i; opt.textContent=`${p.name} (คงเหลือ ${remain(p)}/${p.qty})`; if(p.active) opt.selected=true; sel.appendChild(opt); });
    sel.onchange=()=>{ const i=parseInt(sel.value); state.prizes.forEach((p,idx)=>p.active=(idx===i)); save(); updatePrizeViews(); buildQuickPrize(); };
  }

  // Digits
  function setDigits(s){ for(let i=0;i<6;i++){ $('d'+i).textContent=s[i]||'0'; } $('drawNumber').textContent=s; }
  function readDigits(){ let s=''; for(let i=0;i<6;i++){ s+=($('d'+i).textContent||'0') } return s; }
  function pool(){ const taken=new Set(state.winners.map(w=>w.num)); return state.participants.filter(p=>!taken.has(p.num)); }
  function clearLocks(){ for(let i=0;i<6;i++){ $('d'+i).classList.remove('locked'); } }
  function revealTo(target,done){
    let i=0; const lockNext=()=>{
      if(i>=6){ done&&done(); return; }
      const box=$('d'+i); const final=target[i];
      let t0=performance.now(); const dur=300;
      const tick=(now)=>{
        if(now-t0>=dur){ box.textContent=final; box.classList.add('locked'); $('drawNumber').textContent=readDigits(); i++; setTimeout(lockNext,100); return; }
        box.textContent=String(Math.floor(Math.random()*10)); $('drawNumber').textContent=readDigits(); requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    lockNext();
  }

  // Draw
  let raf=0,final=null,person=null;
  $('btnStart').onclick=()=>{
    const p=pool(); if(!p.length){ $('resNumber').textContent='——'; $('resFound').classList.add('hidden'); $('btnConfirmWin').classList.add('hidden'); $('resEmpty').classList.remove('hidden'); $('resultModal').classList.add('show'); return; }
    const ap=activePrize(); if(!ap){ alert('ยังไม่มีรางวัล'); return; }
    if(remain(ap)<=0){ alert('รางวัลนี้หมดแล้ว กรุณาเปลี่ยนรางวัล'); return; }
    const pick=p[Math.floor(Math.random()*p.length)]; final=pick.num; person=pick; clearLocks();
    const start=performance.now();
    const spinStep=(now)=>{
      if(now-start>=state.shuffleMs){
        cancelAnimationFrame(raf);
        revealTo(final, ()=>{
          const isFS=document.body.classList.contains('fs-mode');
          if(isFS){
            const ts=new Date().toLocaleString('th-TH',{hour12:false});
            state.winners.unshift({num:person.num,name:person.name,prize:ap.name,ts}); save(); paintWinners(); updatePrizeViews(); buildQuickPrize();
          }else{
            $('resNumber').textContent=final; $('resEmpty').classList.add('hidden'); $('resFound').classList.remove('hidden');
            $('resName').textContent=(person.name||'-')+' ('+person.num+')'; $('resPrize').textContent=ap.name;
            $('btnConfirmWin').classList.remove('hidden'); $('resultModal').classList.add('show');
          }
        });
        return;
      }
      if(((now-start)%80)<16){ setDigits(String(Math.floor(Math.random()*1e6)).padStart(6,'0')); }
      raf=requestAnimationFrame(spinStep);
    };
    raf=requestAnimationFrame(spinStep);
  };

  // Winners
  $('btnConfirmWin').onclick=()=>{
    const ap=activePrize(); const ts=new Date().toLocaleString('th-TH',{hour12:false});
    state.winners.unshift({num:person.num,name:person.name,prize:ap.name,ts}); save(); paintWinners(); updatePrizeViews(); buildQuickPrize(); $('btnClose').click();
  };
  function paintWinners(){
    const box=$('winnerList'); box.innerHTML='';
    state.winners.forEach(w=>{
      const li=document.createElement('li');
      li.className='panel'; li.style.padding='.5rem';
      li.innerHTML=`<div class="gold bold">${w.num}</div><div class="muted" style="font-size:.85rem">${w.name||'-'} • ${w.prize||''} • ${w.ts}</div>`;
      box.appendChild(li);
    });
  }
  $('btnResetWinners').onclick=()=>{ if(confirm('ล้างผู้ชนะทั้งหมด?')){ state.winners=[]; save(); paintWinners(); updatePrizeViews(); buildQuickPrize(); }};

  // Prize modal
  const prizeModal=$('prizeModal');
  function openPrize(){ buildPrizeRows(); prizeModal.classList.add('show'); }
  function closePrize(){ prizeModal.classList.remove('show'); }
  $('btnManagePrize').onclick=openPrize; $('closePrize').onclick=closePrize;
  prizeModal.addEventListener('click',e=>{ if(e.target.id==='prizeModal') closePrize(); });
  function buildPrizeRows(){
    const wrap=$('prizeRows'); wrap.innerHTML='';
    state.prizes.forEach((p,i)=>{
      const row=document.createElement('div');
      row.className='panel'; row.style.padding='.6rem'; row.style.display='grid'; row.style.gridTemplateColumns='1fr auto auto auto auto'; row.style.gap='.5rem'; row.style.alignItems='center';
      row.innerHTML=`<input data-i="${i}" class="pName" value="${p.name}">
        <span class="muted" style="font-size:.9rem">คงเหลือ: <b class="gold">${remain(p)}</b> / ${p.qty}</span>
        <input data-i="${i}" type="number" min="1" class="pQty numSmall" value="${p.qty}">
        <label class="muted" style="display:flex;gap:.35rem;align-items:center"><input data-i="${i}" type="radio" name="activePrize" ${p.active?'checked':''}> ใช้งาน</label>
        <button data-i="${i}" class="del btn btn-ghost">ลบ</button>`;
      wrap.appendChild(row);
    });
    wrap.querySelectorAll('.pName').forEach(inp=>inp.oninput=e=>{const i=+e.target.dataset.i; state.prizes[i].name=e.target.value; save(); updatePrizeViews(); buildQuickPrize();});
    wrap.querySelectorAll('.pQty').forEach(inp=>inp.oninput=e=>{const i=+e.target.dataset.i; state.prizes[i].qty=Math.max(1,parseInt(e.target.value||1)); save(); updatePrizeViews(); buildQuickPrize(); buildPrizeRows();});
    wrap.querySelectorAll('input[name=activePrize]').forEach((r,idx)=> r.onchange=()=>{ state.prizes.forEach((p,j)=>p.active=(j===idx)); save(); updatePrizeViews(); buildQuickPrize();});
    wrap.querySelectorAll('.del').forEach(btn=> btn.onclick=e=>{ const i=+e.target.dataset.i; if(state.prizes.length<=1){alert('ต้องมีอย่างน้อย 1 รางวัล'); return} state.prizes.splice(i,1); save(); updatePrizeViews(); buildQuickPrize(); buildPrizeRows(); });
  }
  $('addPrize').onclick=()=>{
    const name=$('newPrizeName').value.trim(); const qty=Math.max(1,parseInt($('newPrizeQty').value||1));
    if(!name){$('newPrizeName').focus(); return}
    state.prizes.push({name,qty,active:false}); $('newPrizeName').value=''; $('newPrizeQty').value=1; save(); buildPrizeRows(); buildQuickPrize(); updatePrizeViews();
  };
  $('savePrize').onclick=()=>{ save(); closePrize(); };

  // Result modal
  $('btnClose').onclick=()=>{$('resultModal').classList.remove('show')};
  $('resultModal').addEventListener('click',e=>{ if(e.target.id==='resultModal') $('btnClose').click(); });

  // Fullscreen
  function isFS(){ return document.fullscreenElement||document.webkitFullscreenElement }
  function reqFS(el){ (el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el) }
  function exitFS(){ (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document) }
  function toggleFS(){ const el=$('drawStage'); isFS()?exitFS():reqFS(el) }
  $('btnFullscreen').onclick=toggleFS;
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{
    document.body.classList.toggle('fs-mode',!!isFS()); updatePrizeViews();
  }));
  $('drawStage').addEventListener('dblclick',toggleFS);
  document.addEventListener('keydown',e=>{
    if(e.key==='f'||e.key==='F'){ e.preventDefault(); toggleFS(); }
    if((e.key===' '||e.code==='Space')&&document.body.classList.contains('fs-mode')){ e.preventDefault(); $('btnStart').click(); }
    if(e.key==='ArrowLeft'){ show('register'); }
    if(e.key==='ArrowRight'){ show('draw'); }
  });

  // Init
  function safeInit(){
    ensureDummy(); renderReg(); paintWinners();
    setDigits('000000'); show('draw'); buildQuickPrize(); updatePrizeViews(); showNamesTab('list');
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', safeInit); } else { safeInit(); }
})();