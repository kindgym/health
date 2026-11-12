/* 센터 기구 도감 — 회원용(member) / 관리자용(admin) 공통 스크립트
   #app 요소의 data-mode 로 모드가 정해진다. */
(function(){
"use strict";
var root=document.getElementById("app");
var MODE=(root&&root.dataset.mode==="admin")?"admin":"member";
var LSKEY="gearguide.v1", THKEY="gearguide.theme", GATEKEY="gearguide.unlocked";
var BAKKEY="gearguide.v1.bak", BAKMAX=10, SHARED_URL="assets/overrides.json";

/* ── 저장소 ──────────────────────────── */
/* shared = 저장소에 커밋된 공용 데이터(assets/overrides.json). 모든 회원이 본다.
   store  = 이 브라우저에만 있는 작업분. 내보내기로 공용에 반영한다. */
var shared={custom:[],video:{},hidden:[],edits:{}};
var store={custom:[],video:{},hidden:[],shown:[],edits:{}};
function norm(p,o){
  o.custom=Array.isArray(p.custom)?p.custom:[];
  o.video=(p.video&&typeof p.video==="object")?p.video:{};
  o.hidden=Array.isArray(p.hidden)?p.hidden:[];
  o.shown=Array.isArray(p.shown)?p.shown:[];
  o.edits=(p.edits&&typeof p.edits==="object")?p.edits:{};
  return o;
}
try{var raw=localStorage.getItem(LSKEY);if(raw)norm(JSON.parse(raw),store);}catch(e){}

/* 공용 데이터 읽기 — 없거나 실패해도 그냥 넘어간다 */
function loadShared(done){
  try{
    var x=new XMLHttpRequest();
    x.open("GET",SHARED_URL+"?t="+Date.now(),true);
    x.onreadystatechange=function(){
      if(x.readyState!==4)return;
      if(x.status>=200&&x.status<300){try{norm(JSON.parse(x.responseText),shared);}catch(e){}}
      done();
    };
    x.onerror=function(){done();};
    x.send();
  }catch(e){done();}
}

/* 되돌릴 수 있도록 저장 직전 상태를 최대 10개까지 보관한다 */
function backups(){try{var a=JSON.parse(localStorage.getItem(BAKKEY));return Array.isArray(a)?a:[];}catch(e){return [];}}
function snapshot(why,force){
  try{
    var cur=localStorage.getItem(LSKEY);if(!cur)return false;
    var a=backups();
    if(a.length&&a[0].d===cur){
      if(!force)return false;                         /* 자동 백업은 같은 내용이면 건너뛴다 */
      if(a[0].w===why){a[0].t=Date.now();localStorage.setItem(BAKKEY,JSON.stringify(a));return true;}
    }
    a.unshift({t:Date.now(),w:why||"자동",d:cur});
    while(a.length>BAKMAX)a.pop();
    localStorage.setItem(BAKKEY,JSON.stringify(a));
    return true;
  }catch(e){return false;}
}
function save(why){try{snapshot(why);localStorage.setItem(LSKEY,JSON.stringify(store));}catch(e){toast("이 브라우저에 저장할 수 없습니다");}}
function mix(){var o={},i,k;for(i=0;i<arguments.length;i++){var x=arguments[i]||{};for(k in x)o[k]=x[k];}return o;}
function hiddenIds(){
  var h=shared.hidden.concat(store.hidden), s=store.shown||[];
  return h.filter(function(id){return s.indexOf(id)<0;});
}
/* 공용 + 로컬을 합친 최종본 — 내보내기에 그대로 쓴다 */
function merged(){
  var cs=[],seen={},i,a=store.custom.concat(shared.custom);
  for(i=0;i<a.length;i++){if(a[i]&&a[i].id&&!seen[a[i].id]){seen[a[i].id]=1;cs.push(a[i]);}}
  return {custom:cs,video:mix(shared.video,store.video),hidden:hiddenIds(),edits:mix(shared.edits,store.edits)};
}

var state={cat:"all",q:""}, lastFocus=null, resetArmed=false, bakArmed=false;
function $(s,r){return (r||document).querySelector(s);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function catOf(id){for(var i=0;i<CATS.length;i++){if(CATS[i].id===id)return CATS[i];}return{id:id,name:"기타",note:"",icon:""};}
function cvar(id){return "var(--c-"+id+")";}
function list(){
  var m=merged(), hid=m.hidden;
  var base=GEAR.map(function(g){
    var e=m.edits[g.id];
    if(!e)return g;
    var o=mix(g,e);o._e=true;return o;
  });
  return base.concat(m.custom).filter(function(g){return hid.indexOf(g.id)<0;});
}
function videoOf(g){return store.video[g.id]||shared.video[g.id]||g.v||"";}
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
         '<button class="btn btn-sm" type="button" id="importBtn">가져오기</button>'+
         '<button class="btn btn-sm" type="button" id="bakBtn">백업</button>'+
         '<button class="btn btn-sm" type="button" id="recoverBtn">복구</button>'+
         '<button class="btn btn-sm" type="button" id="resetBtn">변경사항 초기화</button>'+
       "</span></div></div>";
  }
  h+='<header class="hero"><div class="wrap hero-in">'+
     '<span class="eyebrow">'+(MODE==="admin"
        ? '<b>ADMIN</b> · 기구 · 영상 관리'
        : '<b>'+n+'</b>종 보유 · 정자세 가이드')+"</span>"+
     "<h1>센터 기구 도감</h1>"+
     '<p class="lede">'+(MODE==="admin"
        ? "기구를 추가하고 영상 링크를 등록합니다. 고친 내용은 먼저 <strong>이 브라우저</strong>에 저장되고, <strong>내보내기 → overrides.json 커밋</strong>을 하면 모든 회원에게 영구 반영됩니다. 저장할 때마다 직전 상태가 자동 백업되고, <strong>백업</strong> 버튼으로 직접 남길 수도 있습니다. 되돌릴 때는 <strong>복구</strong>를 쓰세요."
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
  return '<li><article class="card'+(g.custom?" is-custom":"")+(MODE==="admin"&&g._e?" is-edited":"")+'" data-open="'+esc(g.id)+'" style="--c:'+cvar(g.c)+'">'+
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
    (MODE==="admin"?'<div class="form-act" style="justify-content:flex-start;padding-top:0">'+
      '<button class="btn btn-primary" type="button" data-edit="'+esc(g.id)+'">내용 수정</button>'+
      (g._e?'<button class="btn" type="button" data-revert="'+esc(g.id)+'">원래대로</button>':"")+
      (g.custom?'<button class="btn btn-danger" type="button" data-del="'+esc(g.id)+'">삭제</button>':"")+
      "</div>":"")+
    blk("세팅 체크",g.s)+
    (g.p&&g.p.length?'<section class="blk"><h3>동작 순서</h3><ol class="steps">'+g.p.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ol></section>":"")+
    blk("코칭 큐",g.q)+
    blk("주의사항",g.w,"cautions")+
    videoHTML(g);
  $("#sheetBody").scrollTop=0;
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
function openForm(opts){
  var g=opts.gear||null, isEdit=!!g;
  var lines=function(a){return esc((a||[]).join("\n"));};
  panelPlain(isEdit?"기구 수정":"기구 추가");
  $("#sheetBody").innerHTML=
    '<p class="note">'+(isEdit
      ? "고친 내용은 회원용 페이지에도 똑같이 보입니다. 다만 <strong>이 브라우저에만</strong> 저장되니, 모든 회원에게 반영하려면 <strong>내보내기</strong>로 전달해 주세요."
      : "센터에만 있는 기구를 추가합니다. 여러 항목은 줄바꿈으로 구분하세요. 입력 내용은 <strong>이 브라우저에만</strong> 저장됩니다.")+"</p>"+
    '<form class="form" id="gearForm">'+
    '<div class="form-row">'+
    '<div class="field"><label for="f-n">기구 이름 *</label><input id="f-n" required maxlength="40" placeholder="예: 벨트 스쿼트" value="'+esc(g?g.n:"")+'"></div>'+
    '<div class="field"><label for="f-c">분류 *</label><select id="f-c">'+CATS.map(function(c){
        return '<option value="'+c.id+'"'+((g?g.c:opts.cat)===c.id?" selected":"")+">"+esc(c.name)+"</option>";}).join("")+"</select></div></div>"+
    '<div class="form-row">'+
    '<div class="field"><label for="f-en">영문 이름 <span class="hint">선택</span></label><input id="f-en" maxlength="50" placeholder="Belt Squat" value="'+esc(g?g.en:"")+'"></div>'+
    '<div class="field"><label for="f-t">타깃 근육 *</label><input id="f-t" required maxlength="50" placeholder="대퇴사두 · 둔근" value="'+esc(g?g.t:"")+'"></div></div>'+
    '<div class="field"><label for="f-rx">권장 세트 <span class="hint">선택</span></label><input id="f-rx" maxlength="40" placeholder="10~12회 × 3세트" value="'+esc(g?g.rx:"")+'"></div>'+
    '<div class="field"><label for="f-s">세팅 체크 <span class="hint">한 줄에 하나</span></label><textarea id="f-s">'+(g?lines(g.s):"")+"</textarea></div>"+
    '<div class="field"><label for="f-p">동작 순서 <span class="hint">한 줄에 하나</span></label><textarea id="f-p">'+(g?lines(g.p):"")+"</textarea></div>"+
    '<div class="field"><label for="f-q">코칭 큐 <span class="hint">한 줄에 하나</span></label><textarea id="f-q">'+(g?lines(g.q):"")+"</textarea></div>"+
    '<div class="field"><label for="f-w">주의사항 <span class="hint">한 줄에 하나</span></label><textarea id="f-w">'+(g?lines(g.w):"")+"</textarea></div>"+
    (isEdit?"":'<div class="field"><label for="f-v">영상 링크 <span class="hint">선택</span></label><input id="f-v" type="url" placeholder="https://youtu.be/..."></div>')+
    '<div class="form-act">'+
      (isEdit&&g._e?'<button class="btn" type="button" data-revert="'+esc(g.id)+'">원래대로</button>':"")+
      (isEdit&&g.custom?'<button class="btn btn-danger" type="button" data-del="'+esc(g.id)+'">삭제</button>':"")+
      '<button class="btn" type="button" id="cancelForm">취소</button>'+
      '<button class="btn btn-primary" type="submit">'+(isEdit?"저장":"추가하기")+"</button>"+
    "</div></form>";
  $("#sheetBody").scrollTop=0;
  showSheet();
  $("#cancelForm").addEventListener("click",function(){
    if(isEdit){openDetail(g.id);}else{closeSheet();}
  });
  $("#gearForm").addEventListener("submit",function(ev){
    ev.preventDefault();
    var rows=function(sel){return $(sel).value.split("\n").map(function(x){return x.trim();}).filter(Boolean);};
    var name=$("#f-n").value.trim();if(!name)return;
    var data={c:$("#f-c").value,n:name,en:$("#f-en").value.trim()||name,
      t:$("#f-t").value.trim()||"—",rx:$("#f-rx").value.trim()||"—",
      s:rows("#f-s"),p:rows("#f-p"),q:rows("#f-q"),w:rows("#f-w")};
    if(!isEdit){
      data.id="c"+Date.now().toString(36);data.v=$("#f-v").value.trim();data.custom=true;
      store.custom.push(data);save();render();closeSheet();toast(name+" 추가됨");return;
    }
    if(g.custom){
      for(var i=0;i<store.custom.length;i++){
        if(store.custom[i].id===g.id){for(var k in data)store.custom[i][k]=data[k];break;}
      }
    }else{
      store.edits[g.id]=data;
    }
    save();render();openDetail(g.id);toast("저장했습니다");
  });
  $("#f-n").focus();
}
function download(name,text){
  try{
    var b=new Blob([text],{type:"application/json;charset=utf-8"});
    var u=URL.createObjectURL(b), a=document.createElement("a");
    a.href=u;a.download=name;document.body.appendChild(a);a.click();
    document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u);},1000);
    toast("overrides.json 을 저장했습니다");
  }catch(e){toast("저장할 수 없습니다 — 복사해서 쓰세요");}
}
function importData(){
  panelPlain("가져오기");
  $("#sheetBody").innerHTML='<p class="note">백업해 둔 <strong>overrides.json</strong> 파일을 고르거나 내용을 붙여넣으면 이 브라우저의 작업분으로 되살립니다. 지금 내용은 자동 백업되니 잘못 눌러도 <strong>복구</strong>에서 되돌릴 수 있습니다.</p>'+
    '<div class="field"><label for="impFile">파일 고르기</label><input id="impFile" type="file" accept="application/json,.json"></div>'+
    '<div class="field"><label for="imp">또는 붙여넣기</label><textarea id="imp" placeholder=\'{"custom":[], ...}\' style="min-height:180px;font-family:var(--ff-num);font-size:12px"></textarea></div>'+
    '<div class="form-act"><button class="btn" type="button" id="impCancel">취소</button><button class="btn btn-primary" type="button" id="impOk">되살리기</button></div>';
  showSheet();
  $("#impCancel").addEventListener("click",closeSheet);
  $("#impFile").addEventListener("change",function(){
    var f=this.files&&this.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(){$("#imp").value=String(r.result||"");};r.readAsText(f,"utf-8");
  });
  $("#impOk").addEventListener("click",function(){
    var txt=$("#imp").value.trim();
    if(!txt){toast("내용이 비어 있습니다");return;}
    var p;try{p=JSON.parse(txt);}catch(e){toast("JSON 형식이 아닙니다");return;}
    if(!p||typeof p!=="object"){toast("JSON 형식이 아닙니다");return;}
    snapshot("가져오기 전");
    norm(p,store);save("가져오기");render();closeSheet();toast("되살렸습니다");
  });
}
function restorePanel(){
  var a=backups();
  panelPlain("복구");
  var rows=a.length
    ? a.map(function(b,i){
        var d=new Date(b.t), c=0;
        try{var o=JSON.parse(b.d);c=(o.custom||[]).length+Object.keys(o.edits||{}).length+Object.keys(o.video||{}).length;}catch(e){}
        return '<li class="bak"><span><b>'+d.toLocaleString("ko-KR")+'</b><br><span class="hint">'+esc(b.w)+' · 항목 '+c+'개</span></span>'+
               '<button class="btn btn-sm" type="button" data-bak="'+i+'">복구</button></li>';
      }).join("")
    : '<li class="bak"><span class="hint">아직 백업이 없습니다. 관리자 바의 <b>백업</b>을 누르거나, 무언가를 저장하면 그때부터 쌓입니다.</span></li>';
  $("#sheetBody").innerHTML='<p class="note">보관 중인 백업 <strong>'+a.length+'/'+BAKMAX+'개</strong>입니다. 저장할 때마다 직전 상태가 자동으로 쌓이고, <strong>백업</strong> 버튼으로 지금 상태를 직접 남길 수도 있습니다. 복구를 눌러도 지금 상태가 먼저 백업되니 안전합니다.</p>'+
    '<ul class="baklist">'+rows+"</ul>"+
    '<div class="form-act"><button class="btn btn-primary" type="button" id="bakDone">닫기</button></div>';
  showSheet();
  $("#bakDone").addEventListener("click",closeSheet);
  $("#sheetBody").addEventListener("click",function(e){
    var t=e.target.closest?e.target.closest("[data-bak]"):null;if(!t)return;
    var b=backups()[parseInt(t.getAttribute("data-bak"),10)];if(!b)return;
    snapshot("복구 전");
    try{norm(JSON.parse(b.d),store);}catch(err){toast("백업을 읽을 수 없습니다");return;}
    save("복구");render();closeSheet();toast("그 시점으로 복구했습니다");
  });
}
function exportData(){
  var payload=JSON.stringify(merged(),null,2);
  panelPlain("내보내기");
  $("#sheetBody").innerHTML='<p class="note">아래는 <strong>공용 데이터 + 이 브라우저의 작업분</strong>을 합친 최종본입니다. 파일로 저장해 저장소의 <strong>training/assets/overrides.json</strong> 에 덮어쓰고 커밋하면, 모든 회원에게 영구 반영되고 앞으로 페이지를 고쳐도 사라지지 않습니다.</p>'+
    '<div class="field"><textarea id="exp" readonly style="min-height:240px;font-family:var(--ff-num);font-size:12px"></textarea></div>'+
    '<div class="form-act"><button class="btn" type="button" id="copyExp">복사하기</button><button class="btn" type="button" id="saveExp">파일로 저장</button><button class="btn btn-primary" type="button" id="doneExp">닫기</button></div>';
  $("#exp").value=payload;
  showSheet();
  $("#doneExp").addEventListener("click",closeSheet);
  $("#saveExp").addEventListener("click",function(){download("overrides.json",payload);});
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
    var t=e.target.closest?e.target.closest("[data-open],[data-hide],[data-add],[data-edit],[data-revert],[data-savevid],[data-clearvid],[data-del],[data-cat],#restoreBtn,#exportBtn,#importBtn,#bakBtn,#recoverBtn,#resetBtn,#themeBtn,#scrim,#closeBtn"):null;
    if(!t)return;
    if(t.id==="scrim"||t.id==="closeBtn"){closeSheet();return;}
    if(t.hasAttribute("data-cat")){state.cat=t.getAttribute("data-cat");render();window.scrollTo({top:0,behavior:"smooth"});return;}
    if(t.hasAttribute("data-open")){
      var id=t.getAttribute("data-open");lastFocus=t.querySelector(".go")||t;
      if((location.hash||"").slice(1)===id){openDetail(id);}else{location.hash=id;}return;
    }
    if(t.hasAttribute("data-add")){openForm({cat:t.getAttribute("data-add")});return;}
    if(t.hasAttribute("data-edit")){
      var eid=t.getAttribute("data-edit"), all=list(), eg=null;
      for(var i=0;i<all.length;i++){if(all[i].id===eid){eg=all[i];break;}}
      if(eg)openForm({gear:eg});return;
    }
    if(t.hasAttribute("data-revert")){
      var rid=t.getAttribute("data-revert");delete store.edits[rid];
      save();render();openDetail(rid);toast("원래 내용으로 되돌렸습니다");return;
    }
    if(t.hasAttribute("data-hide")){
      var hid=t.getAttribute("data-hide");
      if(store.hidden.indexOf(hid)<0)store.hidden.push(hid);
      store.shown=(store.shown||[]).filter(function(x){return x!==hid;});
      save("숨기기");render();toast("목록에서 숨겼습니다");return;
    }
    if(t.id==="restoreBtn"){store.hidden=[];store.shown=shared.hidden.slice();save("숨김 해제");render();toast("숨긴 기구를 모두 되돌렸습니다");return;}
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
    if(t.id==="importBtn"){importData();return;}
    if(t.id==="bakBtn"){
      if(!bakArmed){bakArmed=true;t.textContent="한 번 더 누르면 백업";
        setTimeout(function(){bakArmed=false;var b=$("#bakBtn");if(b)b.textContent="백업";},4000);return;}
      bakArmed=false;t.textContent="백업";
      try{localStorage.setItem(LSKEY,JSON.stringify(store));}catch(e){}
      var done=snapshot("수동 백업",true);
      toast(done?("지금 상태를 백업했습니다 · 보관 "+backups().length+"/"+BAKMAX+"개"):"백업할 수 없습니다");
      return;
    }
    if(t.id==="recoverBtn"){restorePanel();return;}
    if(t.id==="resetBtn"){
      if(!resetArmed){resetArmed=true;t.textContent="한 번 더 누르면 초기화";
        setTimeout(function(){resetArmed=false;var b=$("#resetBtn");if(b)b.textContent="변경사항 초기화";},4000);return;}
      snapshot("초기화 전");
      store={custom:[],video:{},hidden:[],shown:[],edits:{}};save("초기화");resetArmed=false;t.textContent="변경사항 초기화";
      render();closeSheet();toast("초기화했습니다 — 복구에서 되돌릴 수 있습니다");return;
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
function start(){loadShared(function(){shell();wire();render();syncHash();});}
if(MODE==="admin"){gate(start);}else{start();}
})();
