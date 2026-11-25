import { SITE_BASE } from '../data/siteBase.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {
  ArrowRight,ArrowLeft,BookOpen,Camera,Check,CheckCircle2,ChevronDown,
  FileImage,FileText,ImagePlus,MapPin,PenLine,Plus,Receipt,RefreshCw,
  Sparkles,Trash2,UploadCloud,X
} from 'lucide-react';
import {readSavedTrips} from '../data/demoItinerary.js';
import {tripCover,prettyTripSpan} from '../data/tripPresentation.js';
import {makeJournalForTrip,saveJournalDraft,JOURNAL_ACTIVE_TRIP_KEY,journalMediaCount} from '../data/journalDraft.js';
import {getJournalMedia,newMediaId,storeJournalMedia,isPreviewable} from '../data/journalMedia.js';

const stages=[{label:'选择旅程',sub:'SELECT'},{label:'添加回忆',sub:'COLLECT'},{label:'生成初稿',sub:'CREATE'}];
const creatingText=[
  {title:'把日子排进一本书',caption:'正在整理旅途的日期与地点'},
  {title:'让沿途回忆慢慢落下',caption:'正在把图片与心情放进对应页面'},
  {title:'为旅程写下第一篇序言',caption:'你的旅行手账马上就有了雏形'}
];
const compactDate = value=>{if(!value)return '日期待定';const a=value.split('-');return a.length===3?`${Number(a[1])}月${Number(a[2])}日`:value};

function JourneyCover({trip}){
  const cover=tripCover(trip);
  return <img src={cover.src} alt={`${trip.destination}旅行封面`} onError={e=>{if(e.currentTarget.src!==new URL(cover.fallback,window.location.href).href)e.currentTarget.src=cover.fallback}}/>;
}

function StorySteps({step}){
  const pos=step==='choose'?0:step==='collect'?1:2;
  return <div className="journal-steps" aria-label="手账制作步骤">
    {stages.map((s,i)=><React.Fragment key={s.sub}><div className={`journal-step ${i===pos?'is-active':''} ${i<pos?'is-past':''}`}><span className="journal-step__number">{i<pos?<Check size={13}/>:String(i+1).padStart(2,'0')}</span><span>{s.label}</span></div>{i<2&&<span className="journal-step__line"/>}</React.Fragment>)}
  </div>;
}

function IllustratedJournal({phase=0,open=false}){
  return <div className={`journal-book-art ${open?'journal-book-art--opened':''}`} aria-hidden="true">
    <span className="journal-book-art__spark journal-book-art__spark--one">✳</span>
    <span className="journal-book-art__spark journal-book-art__spark--two">✧</span>
    <div className="journal-book-art__shadow"/>
    <div className="journal-book-art__back"><div className="journal-book-art__inner">
      <span>DAY 01</span><i/><b>一段旅程，<br/>一页回忆</b><small>✿</small>
    </div></div>
    <div className="journal-book-art__cover">
      <div className="journal-book-art__cover-inner"><span>TRAVEL DIARY</span><div className="journal-book-art__mountains"><i/><b/><em/></div><strong>游历本</strong><small>YOUR JOURNEY, YOUR STORY</small></div>
    </div>
    <div className="journal-book-art__ribbon"/>
    <span className="journal-book-art__dot journal-book-art__dot--one"/>
    <span className="journal-book-art__dot journal-book-art__dot--two"/>
  </div>;
}

export default function JournalCreatePage(){
  const navigate=useNavigate();
  const location=useLocation();
  const trips=useMemo(()=>readSavedTrips(),[]);
  const [journal,setJournal]=useState(null);
  const [step,setStep]=useState('choose');
  const [activeDay,setActiveDay]=useState(0);
  const [createPhase,setCreatePhase]=useState(0);
  const [notice,setNotice]=useState('');
  const [mediaUrls,setMediaUrls]=useState({});
  const [mediaRevision,setMediaRevision]=useState(0);
  const photoInput=useRef(null),ticketInput=useRef(null);
  const chosenTrip=trips.find(t=>t.id===journal?.tripId);
  const page=journal?.pages?.[activeDay];

  function chooseTrip(trip){
    const next=makeJournalForTrip(trip);
    setJournal(next);setActiveDay(0);setStep(next.generatedAt?'ready':'collect');
    setMediaRevision(x=>x+1);
    try{sessionStorage.setItem(JOURNAL_ACTIVE_TRIP_KEY,trip.id)}catch{}
  }
  useEffect(()=>{
    const incoming=location.state?.tripId;
    let selected=incoming;
    if(!selected){try{selected=sessionStorage.getItem(JOURNAL_ACTIVE_TRIP_KEY)}catch{}}
    const fromTrips=trips.find(t=>t.id===selected);
    if(fromTrips)chooseTrip(fromTrips);
    // Select on initial mount only; changing days or editing the journal must not reset the flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    if(!journal)return;
    try{saveJournalDraft(journal)}catch{setNotice('草稿暂时无法保存在浏览器中，请检查存储空间')}
  },[journal]);
  useEffect(()=>{
    if(!notice)return;
    const id=setTimeout(()=>setNotice(''),3200);
    return()=>clearTimeout(id);
  },[notice]);
  useEffect(()=>{
    if(!journal)return;
    let alive=true;
    const urls=[];
    const items=journal.pages.flatMap(p=>[...(p.photos||[]),...(p.tickets||[])]).filter(isPreviewable);
    Promise.all(items.map(async item=>{
      try{const blob=await getJournalMedia(item.id);if(blob){const url=URL.createObjectURL(blob);urls.push(url);return [item.id,url]}}catch{}
      return null;
    })).then(pairs=>{if(alive)setMediaUrls(Object.fromEntries(pairs.filter(Boolean)))});
    return()=>{alive=false;urls.forEach(u=>URL.revokeObjectURL(u))};
  },[journal?.id,mediaRevision]);

  // The book opening is an intentionally short, skippable front-end demo, not a real AI call.
  useEffect(()=>{
    if(step!=='generating')return;
    setCreatePhase(0);
    const t1=setTimeout(()=>setCreatePhase(1),850);
    const t2=setTimeout(()=>setCreatePhase(2),1700);
    const t3=setTimeout(()=>finishCreation(),3000);
    return()=>[t1,t2,t3].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[step]);

  function revisePage(mutator){
    setJournal(previous=>({...previous,pages:previous.pages.map((p,i)=>{
      if(i!==activeDay)return p;
      const next=mutator(p);
      if(!next.editor?.items)return next;
      const editedNote=next.note!==p.note;
      const editedPlaces=next.visited?.join('|')!==p.visited?.join('|')||next.extraVisited!==p.extraVisited;
      if(!editedNote&&!editedPlaces)return next;
      const visited=[...(next.visited||[]),next.extraVisited||''].filter(Boolean).join(' · ');
      return {...next,editor:{...next.editor,items:next.editor.items.map(item=>{
        if(item.role==='note'&&editedNote)return {...item,text:next.note||item.text,placeholder:false,systemText:!next.note};
        // “实际到访”只更新独立页脚；规划路线仍然来自行程，不冒充已到访。
        if(item.role==='micro'&&editedPlaces&&item.systemText!==false)return {...item,text:visited?`✓  实际到访：${visited}`:'PLANNED JOURNEY  /  等待真正的旅行故事'};
        return item;
      })}};
    })}));
  }
  function toggleVisited(name){
    revisePage(p=>({...p,visited:p.visited.includes(name)?p.visited.filter(x=>x!==name):[...p.visited,name]}));
  }
  async function handleUpload(event,kind){
    const chosen=Array.from(event.target.files||[]);
    event.target.value='';
    if(!chosen.length||!page)return;
    const allowed=kind==='photos' ? ['image/jpeg','image/png','image/webp','image/gif'] : ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
    const limit=kind==='photos'?12:8;
    const used=page[kind]?.length||0;
    const space=Math.max(0,limit-used);
    if(space===0){setNotice(`这一天最多添加 ${limit} 份${kind==='photos'?'照片':'票据'}`);return}
    const selected=chosen.slice(0,space).filter(file=>allowed.includes(file.type)&&file.size<=12*1024*1024);
    if(selected.length!==chosen.length)setNotice(`单文件不超过 12MB，照片支持 JPG/PNG/WebP/GIF，票据另支持 PDF；当前页最多 ${limit} 份`);
    const saved=[];
    for(const file of selected){
      const id=newMediaId();
      try{await storeJournalMedia(id,file);saved.push({id,name:file.name,type:file.type,size:file.size})}
      catch{setNotice('媒体文件保存失败，请检查浏览器是否允许本地存储')}
    }
    if(saved.length){
      const dayId=page.id;
      setJournal(doc=>({...doc,pages:doc.pages.map(p=>p.id===dayId?{...p,[kind]:[...(p[kind]||[]),...saved]}:p)}));
      setMediaRevision(x=>x+1);
      if(!notice)setNotice(`已将 ${saved.length} 份素材加入 DAY ${String(activeDay+1).padStart(2,'0')}`);
    }
  }
  function removeMedia(id,kind){
    revisePage(p=>({...p,[kind]:p[kind].filter(x=>x.id!==id)}));
    // This removes the attachment from the current journal, not the browser's binary media store.
    // Earlier print-order snapshots can still reference the same photo ID.
    setMediaRevision(x=>x+1);
  }
  function finishCreation(){
    if(!journal)return;
    const finished={...journal,generatedAt:new Date().toISOString()};
    try{saveJournalDraft(finished)}catch{setNotice('初稿已生成，但本地保存可能失败，请检查存储空间')}
    setJournal(finished);
    setStep('ready');
    setNotice('初稿已生成，接下来可以进入编辑页继续创作');
  }
  function beginCreation(){
    if(!journal)return;
    setCreatePhase(0);setStep('generating');
  }
  const totalPhotos=journal?.pages.reduce((n,p)=>n+p.photos.length,0)||0;
  const totalNotes=journal?.pages.filter(p=>p.note.trim()).length||0;
  const dayFilled=p=>p.photos.length+p.tickets.length+(p.note.trim()?1:0)+p.visited.length+(p.extraVisited.trim()?1:0);

  return <div className="journal-create-page">
    <div className="journal-create-heading">
      <span className="journal-overline">TRAVEL STORIES / 06</span>
      <h1>{step==='choose'?'把旅途，写成一本书。':step==='collect'?'收集沿途的小美好':step==='generating'?'一本回忆，正在成形':'你的旅行小书准备好了'}</h1>
      <p>{step==='choose'?'从一段已经规划好的旅程开始。':step==='collect'?'不用重新填写日期和地点，只记录真正发生的故事。':step==='generating'?'日期、图片与心情，正在成为手账的第一页。':'初稿已就位，下一页可以自由调整排版与内容。'}</p>
    </div>
    <StorySteps step={step}/>

    {step==='choose'&&<div className="journal-pick">
      <div className="journal-pick__illustration"><img src={SITE_BASE + 'images/journal-creation-watercolor.jpg'} alt="水彩手绘的打开旅行笔记本"/><span className="journal-pick__seal">MEMORIES<br/>IN MAKING</span></div>
      <div className="journal-block-heading"><h2>选择一段旅行</h2><small>{trips.length} 份已保存行程</small></div>
      {trips.length===0?<div className="journal-no-trips"><BookOpen size={34} strokeWidth={1.25}/><strong>故事的第一页，还等你写下。</strong><span>先创建并保存一份旅行计划，游历本会自动把日期和地点带到手账里。</span><button type="button" onClick={()=>navigate('/plan/new')}>去规划一次旅行 <ArrowRight size={15}/></button></div>:
        <div className="journal-trip-choices">{trips.map((trip,i)=><button type="button" key={trip.id} className="journal-trip-choice" onClick={()=>chooseTrip(trip)}>
          <span className="journal-trip-choice__photo"><JourneyCover trip={trip}/><i>{String(i+1).padStart(2,'0')}</i></span>
          <span className="journal-trip-choice__text"><small>JOURNEY / {String(i+1).padStart(2,'0')}</small><strong>{trip.destination} · {trip.days}天旅程</strong><em>{prettyTripSpan(trip)}</em><span>{trip.itinerary.length} 个旅行日 · {trip.itinerary.reduce((n,d)=>n+d.stops.length,0)} 个计划地点</span></span><ArrowRight size={16}/>
        </button>)}</div>}
      <p className="journal-helper-text"><Sparkles size={13}/> 这里只展示已保存的行程，尚未出发也可以先生成空白手账框架。</p>
    </div>}

    {step==='collect'&&journal&&<div className="journal-collect">
      <section className="journal-selected-trip"><div className="journal-selected-trip__copy"><span>YOUR JOURNEY · 已导入行程</span><h2>{journal.destination} · {journal.pages.length}日记录</h2><p>{compactDate(journal.tripMeta.startDate)} — {compactDate(journal.tripMeta.endDate)}</p></div><button type="button" onClick={()=>setStep('choose')}>换一段旅程 <ChevronDown size={13}/></button><span className="journal-selected-trip__route" aria-hidden="true">⌁</span></section>
      <div className="journal-block-heading"><h2>把回忆分给每一天</h2><small>DAY BY DAY</small></div>
      <div className="journal-day-tabs" role="tablist" aria-label="选择手账日期">{journal.pages.map((p,i)=><button type="button" key={p.id} role="tab" aria-selected={i===activeDay} className={activeDay===i?'is-active':''} onClick={()=>setActiveDay(i)}><span>DAY {String(i+1).padStart(2,'0')}</span><strong>{compactDate(p.date)}</strong>{dayFilled(p)>0&&<i aria-label="已添加内容"/>}</button>)}</div>
      <section className="journal-day-sheet" key={page.id} role="tabpanel">
        <div className="journal-day-sheet__top"><span>THE LITTLE THINGS / DAY {String(activeDay+1).padStart(2,'0')}</span><h2>{page.title}</h2><p>从原来的旅行计划里带来了 {page.plannedStops.length} 个地点。</p></div>
        <div className="journal-planned"><strong><MapPin size={14}/> 原计划的地点</strong><div>{page.plannedStops.map(stop=><span key={stop.id}>{stop.name}</span>)}</div><small>这是计划，不代表已经到访。</small></div>
        <div className="journal-memories-group">
          <div className="journal-field-heading"><div><span className="journal-number">01</span><h3>这一天的照片</h3></div><small>{page.photos.length}/12</small></div>
          <input ref={photoInput} className="journal-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={e=>handleUpload(e,'photos')} aria-label="上传这一天的照片"/>
          <button type="button" className="journal-upload-well" onClick={()=>photoInput.current?.click()}><ImagePlus size={24} strokeWidth={1.45}/><strong>把沿途风景添进来</strong><span>点击选择照片 · 可以一次添加多张</span></button>
          {page.photos.length>0&&<div className="journal-image-grid">{page.photos.map((item,i)=><div key={item.id} className="journal-image-item" style={{'--tilt':`${i%2?2:-2}deg`}}>{mediaUrls[item.id]?<img src={mediaUrls[item.id]} alt={item.name}/>:<div className="journal-image-item__loading"><FileImage size={24}/></div>}<button type="button" onClick={()=>removeMedia(item.id,'photos')} aria-label={`删除照片 ${item.name}`}><X size={13}/></button></div>)}</div>}
        </div>
        <div className="journal-memories-group journal-memories-group--tickets">
          <div className="journal-field-heading"><div><span className="journal-number">02</span><h3>票据与小纪念</h3></div><small>{page.tickets.length}/8</small></div>
          <input ref={ticketInput} className="journal-file-input" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={e=>handleUpload(e,'tickets')} aria-label="上传票据和纪念素材"/>
          <button type="button" className="journal-ticket-add" onClick={()=>ticketInput.current?.click()}><Receipt size={18}/>添加门票、车票或 PDF 票据 <Plus size={15}/></button>
          {page.tickets.length>0&&<div className="journal-ticket-list">{page.tickets.map(item=><div key={item.id} className="journal-ticket"><span className="journal-ticket__preview">{mediaUrls[item.id]?<img src={mediaUrls[item.id]} alt=""/>:item.type==='application/pdf'?<FileText size={22}/>:<Receipt size={20}/>}</span><span title={item.name}>{item.name}</span><button type="button" onClick={()=>removeMedia(item.id,'tickets')} aria-label={`删除票据 ${item.name}`}><Trash2 size={14}/></button></div>)}</div>}
        </div>
        <div className="journal-memories-group">
          <div className="journal-field-heading"><div><span className="journal-number">03</span><h3>真正走过的地方</h3></div></div>
          <p className="journal-visit-hint">原计划不等于实际到访。点选去过的地点，也可以补写临时发现的新去处。</p>
          <div className="journal-visit-chips">{page.plannedStops.map(stop=><button type="button" key={stop.id} aria-pressed={page.visited.includes(stop.name)} className={page.visited.includes(stop.name)?'is-visited':''} onClick={()=>toggleVisited(stop.name)}>{page.visited.includes(stop.name)?<Check size={12}/>:<Plus size={12}/>} {stop.name}</button>)}</div>
          <label className="journal-note-label">另外到访的地点<input value={page.extraVisited} maxLength={180} onChange={e=>revisePage(p=>({...p,extraVisited:e.target.value}))} placeholder="例如：临时去了九溪烟树（可留空）"/></label>
        </div>
        <div className="journal-memories-group journal-memories-group--last">
          <div className="journal-field-heading"><div><span className="journal-number">04</span><h3>写下那天的心情</h3></div><small>可以留空</small></div>
          <label className="journal-writing"><span>DEAR TRAVEL DIARY...</span><textarea rows="4" maxLength={650} value={page.note} onChange={e=>revisePage(p=>({...p,note:e.target.value}))} placeholder="今天遇见了什么风景？也可以只放照片，让故事自己慢慢展开。"/><i>{page.note.length}/650</i></label>
        </div>
      </section>
      <div className="journal-collect__footer"><div><span>{totalPhotos} 张照片 · {totalNotes} 天有文字记录</span><small>不上传照片，也会根据计划景点自动写出路线和旅行期待。</small></div><button type="button" className="journal-create-cta" onClick={beginCreation}><BookOpen size={18}/> 把回忆装进游历本 <ArrowRight size={16}/></button></div>
    </div>}

    {step==='generating'&&<div className="journal-generating" aria-live="polite">
      <div className="journal-generating__stage"><span className="journal-generating__overline">✦ &nbsp; CREATING YOUR LITTLE BOOK</span><IllustratedJournal phase={createPhase} open={createPhase>0}/></div>
      <h2>{creatingText[createPhase].title}</h2><p>{creatingText[createPhase].caption}</p>
      <div className="journal-progress" aria-label="正在生成手账初稿"><span style={{width:`${(createPhase+1)*33.333}%`}}/></div>
      <div className="journal-creation-status">{creatingText.map((s,i)=><div key={s.title} className={i<=createPhase?'is-current':''}>{i<createPhase?<CheckCircle2 size={14}/>:<span className="journal-creation-status__dot"/>}{s.title}</div>)}</div>
      <button type="button" className="journal-text-action" onClick={finishCreation}>跳过动画，直接查看初稿</button>
      <p className="journal-demo-label">此过程为前端模拟排版，不会调用真实 AI 服务。</p>
    </div>}

    {step==='ready'&&journal&&<div className="journal-ready">
      <span className="journal-ready__eyebrow">YOUR FIRST DRAFT IS READY ✳</span>
      <div className="journal-ready__cover"><img src={SITE_BASE + 'images/journal-creation-watercolor.jpg'} alt="水彩手绘旅行手账封面场景"/><div><small>TRAVEL JOURNAL · VOL. 01</small><h2>{journal.destination}<br/>旅行手账</h2><span>{journal.pages.length} 个旅行日 · {journalMediaCount(journal)} 份旅行素材</span></div></div>
      <h3>路线与旅行小计划已自动填入，故事由你继续。</h3>
      <div className="journal-ready__days">{journal.pages.slice(0,5).map((p,i)=><div key={p.id}><span>DAY {String(i+1).padStart(2,'0')}</span><strong>{p.title}</strong><small>{p.plannedStops?.length||0} 个计划地点 · {p.note.trim()?'已加入旅行心情':'已生成旅行期待'}</small></div>)}{journal.pages.length>5&&<p>还有 {journal.pages.length-5} 天的页面已经准备好</p>}</div>
      <p className="journal-ready__note">初稿已根据已保存行程填入手写标题、每日路线和旅行小计划，未上传照片的位置使用手绘示意插画。计划地点不会被标记为真实到访；文字、照片、插画都可以在下一页编辑。（前端规则生成示例，非真实 AI 接口）</p>
      <button type="button" className="journal-create-cta" onClick={()=>navigate(`/journal/edit/${encodeURIComponent(journal.id)}`)}><PenLine size={17}/>进入手账编辑 <ArrowRight size={17}/></button>
      <button type="button" className="journal-text-action" onClick={()=>setStep('collect')}><ArrowLeft size={15}/> 返回补充旅行记录</button>
    </div>}
    {notice&&<div className="journal-local-toast" role="status"><CheckCircle2 size={15}/>{notice}</div>}
  </div>;
}
