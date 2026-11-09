const KEY="meta50k_v1";
const DEFAULT_GOAL=50000, ROUTE_VALUE=130, MAX_ROUTES=2;
let state={goal:DEFAULT_GOAL,entries:[]};
const $=id=>document.getElementById(id);
const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const today=()=>new Date().toISOString().slice(0,10);
const parseDate=s=>new Date(s+"T12:00:00");
const fmtDate=s=>parseDate(s).toLocaleDateString("pt-BR");
function load(){try{const raw=localStorage.getItem(KEY);if(raw){const d=JSON.parse(raw);if(d&&Array.isArray(d.entries)){state={goal:Number(d.goal)||DEFAULT_GOAL,entries:d.entries};}}}catch(e){console.warn("Não foi possível ler os dados",e)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function sums(list){return list.reduce((a,e)=>{if(e.type==="expense")a.expenses+=e.amount;else a.income+=e.amount;if(e.type==="route")a.routes++;return a},{income:0,expenses:0,routes:0})}
function net(){const s=sums(state.entries);return s.income-s.expenses}
function dateEntries(d){return state.entries.filter(e=>e.date===d)}
function addEntry(e){state.entries.push(e);save();showView("home")}
function render(){
 const all=sums(state.entries), saved=net(), percent=Math.max(0,Math.min(100,saved/state.goal*100));
 $("progressBar").style.width=percent+"%";$("savedHero").textContent=money(saved);$("savedSmall").textContent=money(saved);
 $("remaining").textContent=money(Math.max(0,state.goal-saved));$("percent").textContent=percent.toFixed(1).replace(".",",")+"%";
 const t=sums(dateEntries(today()));$("todayGross").textContent=money(dateEntries(today()).filter(e=>e.type!=="expense").reduce((a,e)=>a+e.amount,0));
 $("todayRoutes").textContent=t.routes+" / "+MAX_ROUTES;$("todayExpenses").textContent=money(t.expenses);
 $("todayDate").textContent=parseDate(today()).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
 const startWeek=new Date();startWeek.setDate(startWeek.getDate()-startWeek.getDay());startWeek.setHours(0,0,0,0);
 const weekEntries=state.entries.filter(e=>parseDate(e.date)>=startWeek), ws=sums(weekEntries);
 if($("weekGross"))$("weekGross").textContent=money(ws.income);
 if($("weekSaved"))$("weekSaved").textContent=money(ws.income-ws.expenses);
 if($("weekExpenses"))$("weekExpenses").textContent=money(ws.expenses);
 if($("miniMonth"))$("miniMonth").textContent=parseDate(today()).toLocaleDateString("pt-BR",{month:"long"});
 if($("miniWeek")){const names=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];let out="";for(let i=0;i<7;i++){const d=new Date(startWeek);d.setDate(d.getDate()+i);const key=d.toISOString().slice(0,10), ds=sums(dateEntries(key));out+=`<button class="mini-day ${key===today()?"today":""}" data-mini="${key}">${names[i]}<strong>${d.getDate()}</strong><small>${ds.routes?ds.routes+" rota(s)": "·"}</small></button>`}$("miniWeek").innerHTML=out;document.querySelectorAll("[data-mini]").forEach(b=>b.onclick=()=>{selected=b.dataset.mini;calDate=parseDate(selected);showView("calendar");renderCalendar()})}
 $("totalGross").textContent=money(all.income);$("totalExpenses").textContent=money(all.expenses);$("totalNet").textContent=money(saved);$("totalRoutes").textContent=all.routes;
 const m=today().slice(0,7), month=state.entries.filter(e=>e.date.startsWith(m)), ms=sums(month);
 $("monthReport").textContent=parseDate(today()).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
 $("monthIncome").textContent=money(ms.income);$("monthExpense").textContent=money(ms.expenses);$("monthNet").textContent=money(ms.income-ms.expenses);
 $("goalInput").value=state.goal;
 const recent=[...state.entries].sort((a,b)=>(b.date+b.id).localeCompare(a.date+a.id)).slice(0,5);
 $("recentList").innerHTML=recent.length?recent.map(entryHTML).join(""):'<div class="empty">Nenhum lançamento ainda.</div>';
 renderCalendar();
}
function entryHTML(e){const sign=e.type==="expense"?"−":"+";const cls=e.type==="expense"?"red":"green";const name=e.type==="route"?"Rota concluída":e.type==="expense"?(e.category||"Gasto"):"Outra entrada";return `<div class="rowitem"><div><strong>${escapeHTML(name)}</strong><small>${fmtDate(e.date)}${e.note?" · "+escapeHTML(e.note):""}</small></div><strong class="${cls}">${sign} ${money(e.amount)}</strong></div>`}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));if(id==="calendar")renderCalendar();window.scrollTo(0,0)}
document.querySelectorAll("nav button").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
function prepareEntry(type){$("entryType").value=type;$("entryDate").value=today();$("entryAmount").value=type==="route"?ROUTE_VALUE:"";$("entryNote").value="";$("categoryWrap").style.display=type==="expense"?"block":"none";$("routeHint").style.display=type==="route"?"block":"none";showView("entry")}
$("quickRoute").onclick=()=>prepareEntry("route");$("quickExpense").onclick=()=>prepareEntry("expense");
$("entryType").onchange=()=>{const t=$("entryType").value;$("categoryWrap").style.display=t==="expense"?"block":"none";$("routeHint").style.display=t==="route"?"block":"none";if(t==="route")$("entryAmount").value=ROUTE_VALUE};
$("saveEntry").onclick=()=>{const type=$("entryType").value,amount=Number($("entryAmount").value),date=$("entryDate").value;if(!date||!Number.isFinite(amount)||amount<=0){alert("Informe uma data e um valor válido.");return}
 if(type==="route"&&dateEntries(date).filter(e=>e.type==="route").length>=MAX_ROUTES){alert("Você já registrou 2 rotas nesta data. O limite configurado é de 2 por dia.");return}
 addEntry({id:String(Date.now()),type,amount,date,category:type==="expense"?$("entryCategory").value:"",note:$("entryNote").value.trim()});alert("Lançamento salvo!");};
let calDate=new Date();let selected=today();
$("prevMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};$("nextMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
function renderCalendar(){const y=calDate.getFullYear(),m=calDate.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0);$("monthLabel").textContent=first.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});let html=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d=>`<div class="dayname">${d}</div>`).join("");for(let i=0;i<first.getDay();i++)html+='<div></div>';for(let d=1;d<=last.getDate();d++){const key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,list=dateEntries(key),total=sums(list);html+=`<button class="day ${list.length?"has":""} ${key===today()?"today":""}" data-date="${key}">${d}${list.length?`<span class="dot">${total.routes?total.routes+" rota(s)": "gasto"}</span>`:""}</button>`} $("calendarGrid").innerHTML=html;document.querySelectorAll(".day[data-date]").forEach(b=>b.onclick=()=>{selected=b.dataset.date;renderDay()});renderDay()}
function renderDay(){const list=dateEntries(selected),s=sums(list);$("selectedDateLabel").textContent=fmtDate(selected);$("selectedTotal").textContent=money(s.income-s.expenses);$("dayDetails").innerHTML=list.length?list.map(entryHTML).join(""):'<div class="empty">Nenhum lançamento neste dia.</div>'}
$("saveGoal").onclick=()=>{const v=Number($("goalInput").value);if(!v||v<=0){alert("Informe uma meta válida.");return}state.goal=v;save();alert("Meta atualizada!")};
function exportBackup(){const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="backup-meta-50k.json";a.click();URL.revokeObjectURL(a.href)}
$("exportBtn").onclick=exportBackup;$("backupTop").onclick=exportBackup;
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.entries))throw Error();if(!confirm("Importar este backup substituirá os dados atuais. Continuar?"))return;state={goal:Number(d.goal)||DEFAULT_GOAL,entries:d.entries};save();alert("Backup importado!")}catch(err){alert("Arquivo de backup inválido.")}e.target.value=""};
$("clearBtn").onclick=()=>{if(confirm("Tem certeza? Todos os lançamentos deste aparelho serão apagados.")){state={goal:DEFAULT_GOAL,entries:[]};save();alert("Dados apagados.")}};
$("entryDate").value=today();
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.add("show")});
$("installBtn").onclick=async()=>{if(!deferredPrompt){alert("No Chrome, abra o menu ⋮ e escolha 'Adicionar à tela inicial'.");return}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").classList.remove("show")};
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(console.error);
load();render();

const settingsTop=document.getElementById("settingsTop");if(settingsTop)settingsTop.addEventListener("click",()=>showView("settings"));
