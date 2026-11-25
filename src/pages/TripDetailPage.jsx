import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useLocation,useNavigate,useParams} from 'react-router-dom';
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,BookmarkCheck,CalendarDays,Camera,Check,CheckCircle2,ChevronRight,Clock3,Image as ImageIcon,MapPin,Minus,MoreHorizontal,Plus,RefreshCcw,Route,Save,Search,Share2,UserRoundPlus,UsersRound,ShieldAlert,Sparkles,Trash2,WandSparkles,X} from 'lucide-react';
import {BottomSheet} from '../components/UI.jsx';
import CollaborationSheet from '../components/CollaborationSheet.jsx';
import {activeActorName,normalizeCollaboration} from '../data/tripCollaboration.js';
import {createDemoItinerary,findTrip,makeStop,normalizePlan,readLatestPlan,refreshDay,saveTrip,PHOTO_DIR} from '../data/demoItinerary.js';

const durationOptions=[30,45,60,90,120,150,180,240];
const promptExamples=['今天太满了，帮我减少一个景点','我想让这天轻松一点','帮我调整游览顺序'];
function dateLabel(date){if(!date)return '';const p=date.split('-');return `${Number(p[1])}月${Number(p[2])}日`;}
function shortTime(value){return /^\d\d:\d\d$/.test(value||'')?value:'09:00';}
function clone(value){return JSON.parse(JSON.stringify(value));}
function itemLabel(item){return `${item.name} · ${item.time}`;}
function proposeEdit(stops,prompt){
  const result=clone(stops);
  if(result.length===0)return {stops:result,description:'还没有景点。请先添加景点，再体验调整。'};
  const removing=/少|删|太满|精简|减|轻松/.test(prompt);
  const switching=/顺序|先后|调换|排序|对调/.test(prompt);
  if(removing&&result.length>1){
    const removed=result.pop();
    return {stops:result,description:`建议暂时移除「${removed.name}」，让这一天少赶一个地点。`};
  }
  if(switching&&result.length>1){
    [result[0],result[1]]=[result[1],result[0]];
    const originalTimes=stops.map(item=>item.time);
    result.forEach((s,i)=>{s.time=originalTimes[i]});
    return {stops:result,description:'建议交换前两个游览地点的先后次序，并保留原时间段。'};
  }
  result.forEach((s,i)=>{if(i>0){const next=11+i*2;s.time=`${String(Math.min(20,next)).padStart(2,'0')}:00`;}});
  return {stops:result,description:'建议延长地点之间的空档，给路上和休息留出更多时间。'};
}
function updateDay(plan,index,updater){
  return {...plan,itinerary:plan.itinerary.map((day,i)=>i===index?refreshDay(updater(day)):day)};
}
function Photo({src,alt,className='',onClick}){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[src]);
  return <button type="button" className={`trip-photo ${className}`} onClick={onClick} aria-label={`放大查看：${alt}`}>
    {!failed?<img src={src} alt={alt} loading="lazy" onError={()=>setFailed(true)}/>:<span className="trip-photo__fallback"><ImageIcon size={21}/><small>旅行影像</small></span>}
    <span className="trip-photo__corner"><Search size={12}/></span>
  </button>;
}

function DayRoute({stops}){
  const count=Math.min(6,stops.length);
  const coords=Array.from({length:count},(_,i)=>[22+i*(271/Math.max(1,count-1)),i%2===0?31:54]);
  let d='';coords.forEach(([x,y],i)=>{d+=(i?' L':'M')+` ${x} ${y}`});
  return <div className="trip-map" aria-label="当日景点顺序示意，非真实地图">
    <div className="trip-map__header"><span><Route size={15}/> 今日路线手绘图</span><small>{stops.length} 处安排</small></div>
    {stops.length?<svg viewBox="0 0 320 94" role="img" aria-label="按照当前景点排列顺序绘制的路线示意">
      <path d="M0 67Q42 40 88 66T172 62T320 70V94H0Z" fill="#dbe5d5"/>
      <path d="M0 80Q80 62 140 80T320 77V94H0Z" fill="#bbcbb2"/>
      <path d={d} stroke="#f7f2e5" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} stroke="#93a88a" strokeWidth="2.4" fill="none" strokeDasharray="5 6" strokeLinecap="round" strokeLinejoin="round"/>
      {coords.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="10" fill="#789275"/><circle cx={x} cy={y} r="7.5" fill="#fffaf0"/><text x={x} y={y+3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#698368">{i+1}</text></g>)}
    </svg>:<p className="trip-map__empty">还没有安排地点，可以从下方开始添加。</p>}
    <div className="trip-map__caption">仅表示游览顺序，不代表实际位置、距离或交通路线</div>
  </div>;
}
function EditSheet({spot,onClose,onSave,onDelete}){
  const [form,setForm]=useState({name:spot?.name||'',time:shortTime(spot?.time),duration:spot?.duration||90,note:spot?.note||'',photo:spot?.photo||`${PHOTO_DIR}scene-1.jpg`});
  const [error,setError]=useState('');
  function submit(e){e.preventDefault();if(!form.name.trim()){setError('请填写地点名称');return;}onSave({...spot,...form,name:form.name.trim(),duration:Number(form.duration)});}
  return <BottomSheet title={spot?'修改景点安排':'添加旅行地点'} onClose={onClose}>
    <form className="trip-form" onSubmit={submit}>
      <label>地点名称<input autoFocus value={form.name} maxLength={40} placeholder="例如：西湖湖畔" onChange={e=>{setForm(v=>({...v,name:e.target.value}));setError('')}}/></label>
      <div className="trip-form__twocol"><label>计划时间<input type="time" value={form.time} onChange={e=>setForm(v=>({...v,time:e.target.value}))}/></label><label>停留时长<select value={form.duration} onChange={e=>setForm(v=>({...v,duration:Number(e.target.value)}))}>{durationOptions.map(n=><option value={n} key={n}>{n} 分钟</option>)}</select></label></div>
      <label>旅行备注<textarea value={form.note} placeholder="留一句想记下来的旅行心情" rows="2" maxLength={100} onChange={e=>setForm(v=>({...v,note:e.target.value}))}/></label>
      <div className="trip-form__photos"><span>卡片配图（演示素材）</span><div>{[1,2,3,4].map(i=><button key={i} type="button" aria-label={`选用风景示意图${i}`} aria-pressed={form.photo===`${PHOTO_DIR}scene-${i}.jpg`} className={form.photo===`${PHOTO_DIR}scene-${i}.jpg`?'is-selected':''} onClick={()=>setForm(v=>({...v,photo:`${PHOTO_DIR}scene-${i}.jpg`}))}><img src={`${PHOTO_DIR}scene-${i}.jpg`} alt="旅行风景示意"/></button>)}</div></div>
      {error&&<p className="trip-form__error" role="alert">{error}</p>}
      <button type="submit" className="trip-main-button"><Check size={17}/>{spot?'保存修改':'加入今日行程'}</button>
      {spot&&<button type="button" className="trip-danger-link" onClick={()=>onDelete(spot.id)}><Trash2 size={15}/> 删除这个地点</button>}
    </form>
  </BottomSheet>;
}

export default function TripDetailPage(){
  const navigate=useNavigate();const {id}=useParams();const location=useLocation();
  const initial=()=>normalizePlan(location.state?.generatedPlan)||(id==='demo-hangzhou'?createDemoItinerary({destination:'杭州',startDate:'2027-05-01',endDate:'2027-05-03',tripDays:3,travelers:2,totalBudget:2000,pace:'悠闲慢游',interests:['自然风光']},0):findTrip(id));
  const [plan,setPlan]=useState(initial);
  const [activeDay,setActiveDay]=useState(0);
  const [editingSpot,setEditingSpot]=useState(undefined);
  const [photo,setPhoto]=useState(null);
  const [aiOpen,setAiOpen]=useState(false);
  const [request,setRequest]=useState('第二天太满了，帮我减少一个景点');
  const [suggestion,setSuggestion]=useState(null);
  const [dirty,setDirty]=useState(false);
  const [notice,setNotice]=useState('');
  const [collabOpen,setCollabOpen]=useState(false);
  const dragIndex=useRef(null);
  const overlayRoot=typeof document!=='undefined'?document.querySelector('.app-screen'):null;
  const layer=content=>overlayRoot?createPortal(content,overlayRoot):content;
  const collaboration=normalizeCollaboration(plan?.requirements?.collaboration);
  const currentActor=activeActorName(collaboration);
  const participants=collaboration.members;
  const day=plan?.itinerary[activeDay];
  const stops=day?.stops||[];
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),2700);return()=>clearTimeout(t);},[notice]);
  useEffect(()=>{const onKey=e=>{if(e.key==='Escape'){setPhoto(null);setEditingSpot(undefined);setAiOpen(false);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
  function reviseDay(transform){setPlan(p=>({...updateDay(p,activeDay,transform),collaborationActivity:{actor:activeActorName(p.requirements?.collaboration),day:activeDay+1,action:'更新当天行程',at:new Date().toISOString()}}));setDirty(true);setSuggestion(null);}
  function reorder(from,to){if(from===to||to<0||to>=stops.length)return;reviseDay(day=>{const list=[...day.stops];const [moved]=list.splice(from,1);list.splice(to,0,moved);return {...day,stops:list};});setNotice('已经调整景点顺序');}
  function updateSpot(next){reviseDay(day=>({...day,stops:editingSpot===null?[...day.stops,{...next,id:makeStop(activeDay,day.stops.length,next.name).id}]:day.stops.map(s=>s.id===next.id?next:s)}));setEditingSpot(undefined);setNotice('修改已加入当前行程，记得保存');}
  function removeSpot(spotId){reviseDay(day=>({...day,stops:day.stops.filter(s=>s.id!==spotId)}));setEditingSpot(undefined);setNotice('已从今天的安排中移除');}
  function beginSuggestion(){const proposal=proposeEdit(stops,request);setSuggestion({...proposal,before:stops.map(itemLabel),after:proposal.stops.map(itemLabel)});}
  function applySuggestion(){if(!suggestion)return;reviseDay(day=>({...day,stops:suggestion.stops}));setAiOpen(false);setSuggestion(null);setNotice('已采用模拟调整建议，记得保存行程');}
  function updateCollaboration(next){setPlan(p=>({...p,requirements:{...p.requirements,collaboration:next}}));setDirty(true);}
  function persist(){try{const updated=saveTrip(plan);setPlan(updated);setDirty(false);setNotice(participants.length?`本地协作行程已保存 · 当前演示身份：${currentActor}`:'行程已保存，可在「我的行程」中重新打开');return true;}catch{setNotice('本地保存失败，请检查浏览器是否允许本地存储');return false;}}
  function goToJournal(){if(!persist())return;navigate('/journal/create',{state:{tripId:plan.id}});}
  function goToTrips(){if(dirty&&!window.confirm('当前行程还有未保存的修改。要离开并放弃这些修改吗？'))return;navigate('/trips');}
  if(!plan)return <div className="trip-empty"><span className="plan-eyebrow">TRAVEL NOTE / 04</span><h1>旅行本还是空白的</h1><p>先填写旅行需求，生成一份模拟计划，才能在这里自由编辑每一天。</p><button className="trip-main-button" onClick={()=>navigate('/plan/new')}>开始旅行规划 <ArrowRight size={17}/></button></div>;
  return <div className="trip-detail" aria-label="旅行行程详情与可编辑时间轴">
    <div className="trip-detail__heading"><div><span className="plan-eyebrow">THE JOURNEY / VOL. 01</span><h1>{plan.destination}<em> · {plan.days}日漫游</em></h1><p>每一天的安排，都可以慢慢修改。</p></div><span className="trip-seal" aria-hidden="true">MY<br/>TRAVEL<br/>NOTES</span></div>
    <div className="trip-overview"><div><small>TRAVEL DAYS</small><strong>{plan.days}<span> 天</span></strong></div><div><small>整趟总预算</small><strong>¥{Number(plan.requirements?.totalBudget||0).toLocaleString()}</strong></div><div><small>旅行节奏</small><strong className="trip-overview__pace">{plan.requirements?.pace||'自由探索'}</strong></div></div>
    <section className="trip-collab" aria-label="多人共同旅行规划（本地演示）">
      <div className="trip-collab__top"><span className="trip-collab__eyebrow"><UsersRound size={14}/> TOGETHER / 同游规划</span><small>本地演示</small></div>
      <div className="trip-collab__main"><div className="trip-collab__avatars" aria-label="同行成员"><span className="collab-avatar collab-avatar--owner">我</span>{participants.slice(0,4).map((m,i)=><span key={m.id} title={`${m.name} · ${m.status==='joined'?'已加入':'待加入'}`} className={`collab-avatar collab-avatar--${i%3} ${m.status==='invited'?'is-pending':''}`}>{m.name.slice(0,1)}</span>)}</div><div className="trip-collab__copy"><strong>{participants.length?`${participants.length} 位好友已邀请，共同规划中`:'邀请好友共同规划行程'}</strong><span>当前操作人：{currentActor}{participants.some(m=>m.status==='invited')?' · 有好友待加入':''}</span></div></div>
      {plan.collaborationActivity&&<p className="trip-collab__activity"><CheckCircle2 size={13}/> {plan.collaborationActivity.actor} 最近更新了第 {plan.collaborationActivity.day} 天的安排（模拟记录）</p>}
      <button className="trip-collab__button" type="button" onClick={()=>setCollabOpen(true)}><UserRoundPlus size={15}/> {participants.length?'查看成员与切换协作身份':'邀请好友并开始协作'} <ChevronRight size={14}/></button>
    </section>
    <div className="trip-tabs-heading"><h2>翻开今天的旅程</h2><span>DAY BY DAY</span></div>
    <div className="trip-tabs" role="tablist" aria-label="切换行程日期">{plan.itinerary.map((d,i)=><button type="button" key={`${d.day}-${d.date}`} role="tab" aria-selected={activeDay===i} className={activeDay===i?'is-active':''} onClick={()=>{setActiveDay(i);setSuggestion(null)}}><small>DAY</small><strong>{String(i+1).padStart(2,'0')}</strong><span>{dateLabel(d.date)}</span></button>)}</div>
    <section className="trip-day" key={`day-${activeDay}`} role="tabpanel">
      <div className="trip-day__headline"><div><span className="trip-day__eyebrow">DAY {String(activeDay+1).padStart(2,'0')} · {dateLabel(day.date)}</span><h2>{day.title}</h2><p>{day.note}</p></div><div className="trip-day__sun" aria-hidden="true">✳</div></div>
      <DayRoute stops={stops}/>
      <div className="trip-list-heading"><div><h3>今日行程</h3><span>{stops.length} 个地点 · 可编辑</span></div><button type="button" onClick={()=>setEditingSpot(null)}><Plus size={15}/> 添加地点</button></div>
      <div className="trip-timeline">
        {stops.length===0&&<div className="trip-timeline__blank">今天还没有安排，点「添加地点」写下第一站吧。</div>}
        {stops.map((spot,i)=><article key={spot.id} className="trip-stop" draggable onDragStart={e=>{dragIndex.current=i;e.dataTransfer.effectAllowed='move';}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragIndex.current!==null)reorder(dragIndex.current,i);dragIndex.current=null;}} onDragEnd={()=>{dragIndex.current=null;}}>
          <div className="trip-stop__axis"><span>{spot.time}</span><i className="trip-stop__point"/><b aria-hidden="true"/></div>
          <div className="trip-stop__card"><div className="trip-stop__top"><span className="trip-stop__index">STOP {String(i+1).padStart(2,'0')}</span><div className="trip-stop__order"><button type="button" title="将景点上移" aria-label={`将${spot.name}上移`} disabled={i===0} onClick={()=>reorder(i,i-1)}><ArrowUp size={15}/></button><button type="button" title="将景点下移" aria-label={`将${spot.name}下移`} disabled={i===stops.length-1} onClick={()=>reorder(i,i+1)}><ArrowDown size={15}/></button><button type="button" title="编辑地点" aria-label={`编辑${spot.name}`} onClick={()=>setEditingSpot(spot)}><MoreHorizontal size={16}/></button></div></div>
            <div className="trip-stop__main"><div className="trip-stop__copy"><h4>{spot.name}</h4><span><Clock3 size={12}/> 预计停留 {spot.duration} 分钟</span><p>{spot.note}</p></div><Photo src={spot.photo} alt={`${spot.name}的旅行场景示意图`} onClick={()=>setPhoto({src:spot.photo,name:spot.name})}/></div>
          </div>
        </article>)}
      </div>
      <button type="button" className="trip-add-note" onClick={()=>setEditingSpot(null)}><Plus size={15}/> 在今天的旅行笔记里再添一站</button>
      <section className="trip-ai"><div className="trip-ai__doodle" aria-hidden="true">✦</div><span className="trip-ai__eyebrow">A LITTLE HELP FROM AI</span><h3>想让今天的路线更合心意？</h3><p>告诉我想修改什么，先看看新建议，再决定是否采用。</p><button type="button" onClick={()=>{setAiOpen(true);setSuggestion(null)}}>帮我调整这一天 <WandSparkles size={15}/></button></section>
      <div className="trip-budget"><span><Sparkles size={14}/> 每日预算参考</span><strong>约 ¥{Number(plan.budgetPerDay).toLocaleString()}</strong><small>按总预算平均分配，仅为预算参考，不是实际花费。</small></div>
      <p className="trip-warning"><ShieldAlert size={14}/> 旅行图像、地点时间和路线均为演示信息；开放时间、票价和交通请自行核实。</p>
    </section>
    <div className="trip-actions"><div className="trip-actions__status"><span>{dirty?'有未保存的改动':'可继续补充你的旅行记录'}</span><button type="button" onClick={goToTrips}>我的行程 <ChevronRight size={13}/></button></div><button type="button" className="trip-main-button" onClick={persist}><Save size={17}/>{dirty?'保存修改的行程':'保存这份行程'}</button><button type="button" className="trip-journal-link" onClick={goToJournal}>将行程转成旅行手账 <ArrowRight size={15}/></button></div>
    {notice&&<div className="trip-toast" role="status"><CheckCircle2 size={16}/>{notice}</div>}
    {collabOpen&&layer(<CollaborationSheet collaboration={collaboration} travelers={Number(plan.requirements?.travelers)||2} destination={plan.destination} onChange={updateCollaboration} onClose={()=>setCollabOpen(false)}/>)}
    {editingSpot!==undefined&&layer(<EditSheet key={editingSpot?.id||'create'} spot={editingSpot} onClose={()=>setEditingSpot(undefined)} onSave={updateSpot} onDelete={removeSpot}/>)}
    {aiOpen&&layer(<BottomSheet title="AI 旅程调整（模拟）" onClose={()=>setAiOpen(false)}><div className="trip-ai-sheet"><p>试着用一句自然的话，告诉游历本你想怎样安排今天。</p><div className="trip-prompt-chips">{promptExamples.map(p=><button type="button" key={p} onClick={()=>{setRequest(p);setSuggestion(null)}}>{p}</button>)}</div><label>我的调整想法<textarea rows="3" maxLength={150} value={request} onChange={e=>{setRequest(e.target.value);setSuggestion(null)}}/></label><button type="button" className="trip-main-button" disabled={!request.trim()} onClick={beginSuggestion}><WandSparkles size={16}/>查看调整建议</button>{suggestion&&<div className="trip-ai-diff"><span className="trip-ai-diff__eyebrow">SUGGESTED CHANGE</span><h3>{suggestion.description}</h3><div className="trip-ai-diff__columns"><div><strong>原来的安排</strong>{suggestion.before.length?suggestion.before.map((s,i)=><span key={i}>{i+1}. {s}</span>):<span>暂无</span>}</div><div><strong>建议调整后</strong>{suggestion.after.length?suggestion.after.map((s,i)=><span key={i}>{i+1}. {s}</span>):<span>暂无</span>}</div></div><p>以上是前端规则生成的演示建议，并非真实 AI 决策。</p><button type="button" className="trip-main-button" onClick={applySuggestion}><Check size={17}/>采用新方案</button><button type="button" className="trip-ai-diff__cancel" onClick={()=>setSuggestion(null)}>保留原方案，重新修改</button></div>}</div></BottomSheet>)}
    {photo&&layer(<div className="trip-lightbox" role="presentation" onClick={()=>setPhoto(null)}><div className="trip-lightbox__inner" role="dialog" aria-modal="true" aria-label={`${photo.name}图片预览`} onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setPhoto(null)} aria-label="关闭图片预览"><X size={22}/></button><img src={photo.src} alt={`${photo.name}的旅行场景示意图`}/><div><strong>{photo.name}</strong><span>旅行视觉示意 · 非实地核验照片</span></div></div></div>)}
  </div>;
}
