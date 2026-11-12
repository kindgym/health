/* 센터 기구 도감 — 회원용(member) / 관리자용(admin) 공통 스크립트
   #app 요소의 data-mode 로 모드가 정해진다. */
(function(){
"use strict";
var root=document.getElementById("app");
var MODE=(root&&root.dataset.mode==="admin")?"admin":"member";
var LSKEY="gearguide.v1", THKEY="gearguide.theme", GATEKEY="gearguide.unlocked";

/* ── 저장소 ──────────────────────────── */
var store={custom:[],video:{},hidden:[]};
try{var raw=localStorage.getItem(LSKEY);if(raw){var pr=JSON.parse(raw);
  store.custom=Array.isArray(pr.custom)?pr.custom:[];
  store.video=(pr.video&&typeof pr.video==="object")?pr.video:{};
  store.hidden=Array.isArray(pr.hidden)?pr.hidden:[];}}catch(e){}
function save(){try{localStorage.setItem(LSKEY,JSON.stringify(store));}catch(e){toast("이 브라우저에 저장할 수 없습니다");}}

var state={cat:"all",q:""}, lastFocus=null, resetArmed=false;
function $(s,r){return (r||document).querySelector(s);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function catOf(id){for(var i=0;i<CATS.length;i++){if(CATS[i].id===id)return CATS[i];}return{id:id,name:"기타",note:"",icon:""};}
function cvar(id){return "var(--c-"+id+")";}
function list(){return GEAR.concat(store.custom).filter(function(g){return store.hidden.indexOf(g.id)<0;});}
function videoOf(g){return store.video[g.id]||g.v||"";}
function ytSearch(g){return "https://www.youtube.com/results?search_query="+encodeURIComponent(g.n+" 운동 방법 정자세");}
function hostOf(u){try{return new URL(u).hostname.replace(/^www\./,"");}catch(e){return u;}}

/* ── 아이콘 ──────────────────────────── */
function ico(p,sz,sw){return '<svg class="ico" width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(sw||1.7)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+"</svg>";}
var I={
  arrow:'<path d="M4 12h14M12.5 6.2 18.5 12l-6 5.8"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  theme:'<circle cx="12" cy="12" r="4.4"/><path d="M12 2.2v2.1M12 19.7v2.1M4.3 4.3l1.5 1.5M18.2 18.2l1.5 1.5M2.2 12h2.1M19.7 12h2.1M4.3 19.7l1.5-1.5M18.2 5.8l1.5-1.5"/>',
  film:'<rect x="2.6" y="5" width="18.8" height="14" rx="3.2"/><path d="M10 9.4v5.2l4.6-2.6z" fill="currentColor" stroke="none"/>',
  plus:'<path d="M12 5.5v13M5.5 12h13"/>',
  grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'
};
function play(sz){return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"/></svg>';}

function toast(msg){
  var old=$(".toast");if(old)old.remove();
  var t=document.createElement("div");t.className="toast";t.textContent=msg;t.setAttribute("role","status");
  document.body.appendChild(t);setTimeout(function(){t.remove();},2600);
}

/* ── 화면 뼈대 ───────────────────────── */
function shell(){
  var n=list().length, h="";
  if(MODE==="admin"){
    h+='<div class="adminbar"><div class="wrap">'+
       '<span class="tag"><span class="dotlive"></span>관리자 페이지 · 편집 가능</span>'+
       '<span class="acts">'+
         '<a class="btn btn-sm" href="index.html">회원용 페이지 열기</a>'+
         '<button class="btn btn-sm" type="button" id="exportBtn">내보내기</button>'+
         '<button class="btn btn-sm" type="button" id="resetBtn">변경사항 초기화</button>'+
       "</span></div></div>";
  }
  h+='<header class="hero"><div class="wrap hero-in">'+
     '<span class="eyebrow">'+(MODE==="admin"
        ? '<b>ADMIN</b> · 기구 · 영상 관리'
        : '<b>'+n+'</b>종 보유 · 정자세 가이드')+"</span>"+
     "<h1>센터 기구 도감</h1>"+
     '<p class="lede">'+(MODE==="admin"
        ? "기구를 추가하고 영상 링크를 등록합니다. 변경 내용은 <strong>이 브라우저에만</strong> 저장되니, 회원 모두에게 반영하려면 <strong>내보내기</strong>를 눌러 전달해 주세요."
        : "잘못된 자세로 하지 않도록, 센터에 있는 기구의 <strong>세팅·동작 순서·주의사항</strong>을 정리했습니다. 궁금한 기구를 눌러보세요.")+"</p>"+
     '<div class="hero-bar">'+
       '<div class="search">'+ico(I.search,16)+'<input type="search" id="q" placeholder="기구 이름·부위로 검색 (예: 랫, 둔근)" aria-label="기구 검색" autocomplete="off"></div>'+
       '<button class="btn" type="button" id="themeBtn" title="밝게 / 어둡게">'+ico(I.theme,15)+"테마</button>"+
       '<span class="stat" id="stat"></span>'+
     "</div></div></header>"+
     '<nav class="rail" aria-label="기구 분류"><div class="wrap rail-in" id="chips" role="group"></div></nav>'+
     '<main class="wrap" id="main"></main>'+
     '<footer><div class="wrap"><div class="legend" id="legend"></div>'+
     "<div>분류 색은 경기용 원판 색(25kg 빨강 · 20kg 파랑 · 15kg 노랑 · 10kg 초록)을 따랐습니다.</div></div></footer>"+
     '<div class="sheet" id="sheet" hidden role="dialog" aria-modal="true" aria-labelledby="sheetTitle">'+
       '<button class="scrim" id="scrim" type="button" aria-label="닫기"></button>'+
       '<div class="panel"><div class="panel-head">'+
         '<span class="sec-ico" id="sheetIco"></span>'+
         '<div style="min-width:0;flex:1"><div class="cat-tag" id="sheetCat"></div>'+
         '<h2 id="sheetTitle"></h2><p class="en" id="sheetEn"></p></div>'+
         '<button class="close" id="closeBtn" type="button" aria-label="닫기">'+ico(I.close,17,2)+"</button>"+
       '</div><div class="panel-body" id="sheetBody"></div></div></div>';
  root.innerHTML=h;
}

/* ── 레일 · 범례 ─────────────────────── */
function renderChips(){
  var items=list(), h="";
  h+='<button class="chip" type="button" data-cat="all" aria-pressed="'+(state.cat==="all")+'">'+ico(I.grid,15)+'전체 <span class="n">'+items.length+"</span></button>";
  CATS.forEach(function(c){
    var k=items.filter(function(g){return g.c===c.id;}).length;
    h+='<button class="chip" type="button" data-cat="'+c.id+'" style="--c:'+cvar(c.id)+'" aria-pressed="'+(state.cat===c.id)+'">'+
       ico(c.icon,15)+esc(c.name)+' <span class="n">'+k+"</span></button>";
  });
  $("#chips").innerHTML=h;
  $("#legend").innerHTML=CATS.map(function(c){
    return '<span style="--c:'+cvar(c.id)+'"><i></i>'+esc(c.name)+"</span>";
  }).join("");
}

/* ── 카드 · 섹션 ─────────────────────── */
function matches(g){
  if(state.cat!=="all"&&g.c!==state.cat)return false;
  var q=state.q.trim().toLowerCase();
  if(!q)return true;
  return (g.n+" "+g.en+" "+g.t+" "+catOf(g.c).name).toLowerCase().indexOf(q)>-1;
}
function cardHTML(g){
  var c=catOf(g.c), hasVid=!!videoOf(g);
  return '<li><article class="card'+(g.custom?" is-custom":"")+'" data-open="'+esc(g.id)+'" style="--c:'+cvar(g.c)+'">'+
    '<span class="wm">'+ico(c.icon,86,1.4)+"</span>"+
    '<span class="card-top"><span class="cat-tag">'+ico(c.icon,13)+esc(c.name)+"</span>"+
    (hasVid?'<span class="pill on">'+play(9)+"영상</span>":"")+"</span>"+
    "<h3>"+esc(g.n)+'</h3><p class="en">'+esc(g.en)+"</p>"+
    "<dl><dt>타깃</dt><dd>"+esc(g.t)+'</dd><dt>권장</dt><dd class="rx">'+esc(g.rx)+"</dd></dl>"+
    '<button class="go" type="button" tabindex="0"><span>자세히 보기</span>'+ico(I.arrow,16)+"</button>"+
    "</article>"+
    (MODE==="admin"?'<button class="card-hide" type="button" data-hide="'+esc(g.id)+'" aria-label="'+esc(g.n)+' 목록에서 숨기기" title="목록에서 숨기기">'+ico(I.close,14,2)+"</button>":"")+
    "</li>";
}
function sectionHTML(c,items){
  return '<section class="sec" style="--c:'+cvar(c.id)+'"><div class="sec-head">'+
    '<span class="sec-ico">'+ico(c.icon,21)+"</span>"+
    "<div><h2>"+esc(c.name)+'</h2><div class="sub">'+esc(c.note)+"</div></div>"+
    '<span class="rule"></span><span class="n">'+items.length+"종</span></div>"+
    '<ul class="grid">'+items.map(cardHTML).join("")+
    (MODE==="admin"?'<li><button class="add-card" type="button" data-add="'+c.id+'">'+ico(I.plus,22)+esc(c.name)+"에 추가</button></li>":"")+
    "</ul></section>";
}
function render(){
  var items=list().filter(matches), m=$("#main"), h="";
  if(!items.length&&!(MODE==="admin"&&!state.q.trim())){
    h='<div class="empty"><strong>해당하는 기구가 없습니다</strong>검색어를 지우거나 다른 분류를 선택해 보세요.</div>';
  }else{
    CATS.forEach(function(c){
      if(state.cat!=="all"&&state.cat!==c.id)return;
      var sub=items.filter(function(g){return g.c===c.id;});
      if(!sub.length&&!(MODE==="admin"&&!state.q.trim()))return;
      h+=sectionHTML(c,sub);
    });
  }
  if(MODE==="admin"&&store.hidden.length){
    h+='<div class="form-act" style="justify-content:flex-start"><button class="btn" type="button" id="restoreBtn">숨긴 기구 '+store.hidden.length+"개 되돌리기</button></div>";
  }
  m.innerHTML=h;
  var total=list().length;
  $("#stat").textContent=(items.length===total)?(total+"종"):(items.length+" / "+total+"종");
  renderChips();
}

/* ── 상세 ────────────────────────────── */
function blk(title,items,cls){
  if(!items||!items.length)return "";
  return '<section class="blk'+(cls?" "+cls:"")+'"><h3>'+esc(title)+'</h3><ul class="bul'+(cls==="cautions"?" warn":"")+'">'+
    items.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ul></section>";
}
function videoHTML(g){
  var u=videoOf(g), inner;
  if(u){
    inner='<a class="vid-card" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+
      '<span class="play">'+play(20)+"</span>"+
      '<span><span class="t">영상 보기</span><span class="u">'+esc(hostOf(u))+" · 새 탭에서 열립니다</span></span></a>";
  }else{
    inner='<div class="vid-slot"><span class="ph">'+ico(I.film,24)+"</span>"+
      "<p>아직 등록된 영상이 없습니다.<br>트레이너 촬영본이 올라오면 여기에 연결됩니다.</p>"+
      '<a class="btn" href="'+esc(ytSearch(g))+'" target="_blank" rel="noopener noreferrer">'+play(13)+"유튜브에서 찾아보기</a></div>";
  }
  var edit="";
  if(MODE==="admin"){
    edit='<div class="vid-edit"><input type="url" id="vidInput" placeholder="https://youtu.be/..." value="'+esc(u)+'" aria-label="영상 링크">'+
      '<button class="btn btn-primary" type="button" data-savevid="'+esc(g.id)+'">저장</button>'+
      (u?'<button class="btn btn-danger" type="button" data-clearvid="'+esc(g.id)+'">삭제</button>':"")+"</div>";
  }
  return '<section class="blk"><h3>영상</h3>'+inner+edit+"</section>";
}
function openDetail(id){
  var all=list(), g=null;
  for(var i=0;i<all.length;i++){if(all[i].id===id){g=all[i];break;}}
  if(!g)return false;
  var c=catOf(g.c), panel=$(".panel");
  panel.style.setProperty("--c",cvar(g.c));
  $("#sheetIco").style.setProperty("--c",cvar(g.c));
  $("#sheetIco").innerHTML=ico(c.icon,22);
  $("#sheetCat").style.color=cvar(g.c);
  $("#sheetCat").innerHTML=esc(c.name);
  $("#sheetTitle").textContent=g.n;
  $("#sheetEn").textContent=g.en;
  $("#sheetBody").innerHTML=
    '<div class="facts"><div class="fact"><div class="k">타깃 근육</div><div class="v">'+esc(g.t)+"</div></div>"+
    '<div class="fact"><div class="k">권장 세트</div><div class="v num">'+esc(g.rx)+"</div></div></div>"+
    blk("세팅 체크",g.s)+
    (g.p&&g.p.length?'<section class="blk"><h3>동작 순서</h3><ol class="steps">'+g.p.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ol></section>":"")+
    blk("코칭 큐",g.q)+
    blk("주의사항",g.w,"cautions")+
    videoHTML(g)+
    (MODE==="admin"&&g.custom?'<div class="form-act"><button class="btn btn-danger" type="button" data-del="'+esc(g.id)+'">이 기구 삭제</button></div>':"");
  showSheet();
  return true;
}
function showSheet(){
  var s=$("#sheet");
  if(s.hidden){lastFocus=document.activeElement;s.hidden=false;document.body.style.overflow="hidden";}
  $("#closeBtn").focus();
}
function hideSheet(){
  var s=$("#sheet");
  if(s.hidden)return;
  s.hidden=true;document.body.style.overflow="";
  if(lastFocus&&document.contains(lastFocus))lastFocus.focus();
}
function closeSheet(){
  if((location.hash||"").slice(1)!=="list"){location.hash="list";}else{hideSheet();}
}
function panelPlain(title){
  $("#sheetIco").innerHTML="";$("#sheetIco").style.background="transparent";$("#sheetIco").style.border="0";
  $("#sheetCat").innerHTML="";$("#sheetEn").textContent="";$("#sheetTitle").textContent=title;
}

/* ── 관리자 기능 ─────────────────────── */
function openAdd(catId){
  panelPlain("기구 추가");
  $("#sheetBody").innerHTML=
    '<p class="note">센터에만 있는 기구를 추가합니다. 여러 항목은 줄바꿈으로 구분하세요. 입력 내용은 <strong>이 브라우저에만</strong> 저장되며, 회원 모두에게 보이게 하려면 저장 후 <strong>내보내기</strong>로 전달해 주세요.</p>'+
    '<form class="form" id="addForm">'+
    '<div class="form-row">'+
    '<div class="field"><label for="f-n">기구 이름 *</label><input id="f-n" required maxlength="40" placeholder="예: 벨트 스쿼트"></div>'+
    '<div class="field"><label for="f-c">분류 *</label><select id="f-c">'+CATS.map(function(c){return '<option value="'+c.id+'"'+(c.id===catId?" selected":"")+">"+esc(c.name)+"</option>";}).join("")+"</select></div></div>"+
    '<div class="form-row">'+
    '<div class="field"><label for="f-en">영문 이름 <span class="hint">선택</span></label><input id="f-en" maxlength="50" placeholder="Belt Squat"></div>'+
    '<div class="field"><label for="f-t">타깃 근육 *</label><input id="f-t" required maxlength="50" placeholder="대퇴사두 · 둔근"></div></div>'+
    '<div class="field"><label for="f-rx">권장 세트 <span class="hint">선택</span></label><input id="f-rx" maxlength="40" placeholder="10~12회 × 3세트"></div>'+
    '<div class="field"><label for="f-s">세팅 체크 <span class="hint">한 줄에 하나</span></label><textarea id="f-s"></textarea></div>'+
    '<div class="field"><label for="f-p">동작 순서 <span class="hint">한 줄에 하나</span></label><textarea id="f-p"></textarea></div>'+
    '<div class="field"><label for="f-q">코칭 큐 <span class="hint">한 줄에 하나</span></label><textarea id="f-q"></textarea></div>'+
    '<div class="field"><label for="f-w">주의사항 <span class="hint">한 줄에 하나</span></label><textarea id="f-w"></textarea></div>'+
    '<div class="field"><label for="f-v">영상 링크 <span class="hint">선택</span></label><input id="f-v" type="url" placeholder="https://youtu.be/..."></div>'+
    '<div class="form-act"><button class="btn" type="button" id="cancelAdd">취소</button><button class="btn btn-primary" type="submit">추가하기</button></div></form>';
  showSheet();
  $("#cancelAdd").addEventListener("click",closeSheet);
  $("#addForm").addEventListener("submit",function(ev){
    ev.preventDefault();
    var lines=function(sel){return $(sel).value.split("\n").map(function(s){return s.trim();}).filter(Boolean);};
    var name=$("#f-n").value.trim();if(!name)return;
    store.custom.push({id:"c"+Date.now().toString(36),c:$("#f-c").value,n:name,
      en:$("#f-en").value.trim()||name,t:$("#f-t").value.trim()||"—",rx:$("#f-rx").value.trim()||"—",
      s:lines("#f-s"),p:lines("#f-p"),q:lines("#f-q"),w:lines("#f-w"),v:$("#f-v").value.trim(),custom:true});
    save();render();closeSheet();toast(name+" 추가됨");
  });
  $("#f-n").focus();
}
function exportData(){
  var payload=JSON.stringify({custom:store.custom,video:store.video,hidden:store.hidden},null,2);
  panelPlain("내보내기");
  $("#sheetBody").innerHTML='<p class="note">아래 내용을 복사해 전달하면 회원용 페이지에 영구 반영할 수 있습니다.</p>'+
    '<div class="field"><textarea id="exp" readonly style="min-height:240px;font-family:var(--ff-num);font-size:12px"></textarea></div>'+
    '<div class="form-act"><button class="btn" type="button" id="copyExp">복사하기</button><button class="btn btn-primary" type="button" id="doneExp">닫기</button></div>';
  $("#exp").value=payload;
  showSheet();
  $("#doneExp").addEventListener("click",closeSheet);
  $("#copyExp").addEventListener("click",function(){
    var ta=$("#exp");
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(payload).then(function(){toast("복사했습니다");},function(){ta.select();toast("직접 복사해 주세요");});
    }else{ta.select();toast("직접 복사해 주세요");}
  });
}

/* ── 이벤트 ──────────────────────────── */
function wire(){
  document.addEventListener("click",function(e){
    var t=e.target.closest?e.target.closest("[data-open],[data-hide],[data-add],[data-savevid],[data-clearvid],[data-del],[data-cat],#restoreBtn,#exportBtn,#resetBtn,#themeBtn,#scrim,#closeBtn"):null;
    if(!t)return;
    if(t.id==="scrim"||t.id==="closeBtn"){closeSheet();return;}
    if(t.hasAttribute("data-cat")){state.cat=t.getAttribute("data-cat");render();window.scrollTo({top:0,behavior:"smooth"});return;}
    if(t.hasAttribute("data-open")){
      var id=t.getAttribute("data-open");lastFocus=t.querySelector(".go")||t;
      if((location.hash||"").slice(1)===id){openDetail(id);}else{location.hash=id;}return;
    }
    if(t.hasAttribute("data-add")){openAdd(t.getAttribute("data-add"));return;}
    if(t.hasAttribute("data-hide")){
      var hid=t.getAttribute("data-hide");
      if(store.hidden.indexOf(hid)<0)store.hidden.push(hid);
      save();render();toast("목록에서 숨겼습니다");return;
    }
    if(t.id==="restoreBtn"){store.hidden=[];save();render();toast("숨긴 기구를 모두 되돌렸습니다");return;}
    if(t.hasAttribute("data-savevid")){
      var vid=t.getAttribute("data-savevid"), val=$("#vidInput").value.trim();
      if(val&&!/^https?:\/\//i.test(val)){toast("http 로 시작하는 주소를 넣어 주세요");return;}
      if(val){store.video[vid]=val;}else{delete store.video[vid];}
      save();openDetail(vid);render();toast(val?"영상 링크를 저장했습니다":"영상 링크를 지웠습니다");return;
    }
    if(t.hasAttribute("data-clearvid")){
      var cid=t.getAttribute("data-clearvid");delete store.video[cid];
      var cg=store.custom.filter(function(x){return x.id===cid;})[0];if(cg)cg.v="";
      save();openDetail(cid);render();toast("영상 링크를 지웠습니다");return;
    }
    if(t.hasAttribute("data-del")){
      var did=t.getAttribute("data-del");
      store.custom=store.custom.filter(function(x){return x.id!==did;});
      delete store.video[did];save();render();closeSheet();toast("삭제했습니다");return;
    }
    if(t.id==="exportBtn"){exportData();return;}
    if(t.id==="resetBtn"){
      if(!resetArmed){resetArmed=true;t.textContent="한 번 더 누르면 초기화";
        setTimeout(function(){resetArmed=false;var b=$("#resetBtn");if(b)b.textContent="변경사항 초기화";},4000);return;}
      store={custom:[],video:{},hidden:[]};save();resetArmed=false;t.textContent="변경사항 초기화";
      render();closeSheet();toast("초기화했습니다");return;
    }
    if(t.id==="themeBtn"){
      var cur=document.documentElement.getAttribute("data-theme");
      if(!cur)cur=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
      var next=cur==="dark"?"light":"dark";
      document.documentElement.setAttribute("data-theme",next);
      try{localStorage.setItem(THKEY,next);}catch(e){}
      return;
    }
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("#sheet").hidden)closeSheet();});
  $("#q").addEventListener("input",function(e){state.q=e.target.value;render();});
  window.addEventListener("hashchange",syncHash);
}
function syncHash(){
  var id=(location.hash||"").slice(1);
  if(!id||id==="list"){hideSheet();return;}
  if(!openDetail(id))hideSheet();
}

/* ── 잠금(관리자) ────────────────────── */
function gate(onPass){
  var code=String(window.ADMIN_CODE||"");
  if(!code){onPass();return;}
  var ok=false;try{ok=sessionStorage.getItem(GATEKEY)==="1";}catch(e){}
  if(ok){onPass();return;}
  root.innerHTML='<div class="gate"><div class="gate-box">'+
    "<h2>관리자 페이지</h2><p>트레이너용 화면입니다.<br>암호를 입력해 주세요.</p>"+
    '<form id="gateForm"><div class="field"><label class="sr" for="code">암호</label>'+
    '<input id="code" type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="••••"></div>'+
    '<div class="form-act" style="justify-content:stretch"><button class="btn btn-primary" type="submit" style="flex:1">들어가기</button></div></form>'+
    '<p><a href="index.html">회원용 페이지로 가기</a></p></div></div>';
  $("#code").focus();
  $("#gateForm").addEventListener("submit",function(e){
    e.preventDefault();
    if($("#code").value===code){try{sessionStorage.setItem(GATEKEY,"1");}catch(err){}onPass();}
    else{$("#code").value="";$("#code").focus();toast("암호가 맞지 않습니다");}
  });
}

/* ── 시작 ────────────────────────────── */
try{var th=localStorage.getItem(THKEY);if(th==="dark"||th==="light")document.documentElement.setAttribute("data-theme",th);}catch(e){}
function start(){shell();wire();render();syncHash();}
if(MODE==="admin"){gate(start);}else{start();}
})();
