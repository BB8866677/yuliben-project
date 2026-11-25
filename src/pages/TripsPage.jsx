import { SITE_BASE } from '../data/siteBase.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from 'react-router-dom';
import {ArrowRight,BookHeart,CalendarDays,Check,ChevronRight,Ellipsis,Feather,MapPin,Plus,Trash2,X} from 'lucide-react';
import {BottomSheet} from '../components/UI.jsx';
import {readSavedTrips,removeSavedTrip} from '../data/demoItinerary.js';
import {tripCover,tripStatus,prettyTripSpan} from '../data/tripPresentation.js';

const tabs=[
  {key:'all',label:'全部行程'},
  {key:'upcoming',label:'待出发'},
  {key:'active',label:'旅行中'},
  {key:'done',label:'已结束'}
];
function CoverImage({trip}){
  const cover=useMemo(()=>tripCover(trip),[trip]);
  const [src,setSrc]=useState(cover.src);
  useEffect(()=>setSrc(cover.src),[cover.src]);
  return <img className="journey-card__image" src={src} loading="lazy" alt={cover.verified?`${trip.destination}旅行封面照片`:'旅行氛围配图（非特定目的地实拍）'} onError={()=>{if(src!==cover.fallback)setSrc(cover.fallback)}}/>;
}
function EmptyJourney({filtered,onCreate,onClear}){
 return <div className="journeys-empty">
   <div className="journeys-empty__art"><img src={SITE_BASE + 'images/feature-illustrations/keepsake.png'} alt=""/><span className="journeys-empty__tiny">A STORY TO BE WRITTEN</span></div>
   <h2>{filtered?'这一页还没有旅程':'你的旅行故事，\n还在等待第一页。'}</h2>
   <p>{filtered?'试试切换上方分类，或开启一段新的旅行。':'从一次轻松的 AI 规划开始，慢慢收集属于自己的旅程。'}</p>
   <button className="journeys-empty__new" type="button" onClick={onCreate}><Plus size={16}/> 开始规划 <ArrowRight size={15}/></button>
   {filtered&&<button className="journeys-empty__all" type="button" onClick={onClear}>查看全部行程</button>}
 </div>;
}
export default function TripsPage(){
 const navigate=useNavigate();
 const overlayRoot=typeof document!=='undefined'?document.querySelector('.app-screen'):null;
 const layer=node=>overlayRoot?createPortal(node,overlayRoot):node;
 const [trips,setTrips]=useState(()=>readSavedTrips());
 const [filter,setFilter]=useState('all');
 const [optionsId,setOptionsId]=useState(null);
 const [deleteId,setDeleteId]=useState(null);
 const [openingId,setOpeningId]=useState(null);
 const [removingId,setRemovingId]=useState(null);
 const [notice,setNotice]=useState('');
 const timers=useRef([]);
 const schedule=(fn,delay)=>{const id=window.setTimeout(fn,delay);timers.current.push(id);};
 useEffect(()=>()=>{timers.current.forEach(clearTimeout)},[]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),2700);return()=>clearTimeout(id)},[notice]);
 useEffect(()=>{const escape=e=>{if(e.key==='Escape'){setOptionsId(null);setDeleteId(null)}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape)},[]);
 const counts=useMemo(()=>({
    all:trips.length,upcoming:trips.filter(t=>tripStatus(t).key==='upcoming').length,
    active:trips.filter(t=>tripStatus(t).key==='active').length,
    done:trips.filter(t=>tripStatus(t).key==='done').length,
  }),[trips]);
 const visible=useMemo(()=>filter==='all'?trips:trips.filter(t=>tripStatus(t).key===filter),[filter,trips]);
 const openTrip=(id)=>{
  if(openingId||removingId)return;
  setOptionsId(null);setOpeningId(id);
  schedule(()=>navigate(`/trip/${encodeURIComponent(id)}`),235);
 };
 function requestDelete(id){setOptionsId(null);setDeleteId(id)}
 function confirmDelete(){
  if(!deleteId)return;
  const id=deleteId;setDeleteId(null);setRemovingId(id);
  schedule(()=>{
    try{removeSavedTrip(id);setTrips(readSavedTrips());setNotice('这段旅程已从收藏册中移除');}
    catch{setNotice('删除失败，请检查浏览器存储设置')}
    setRemovingId(null);
  },210);
 }
 const deletingTrip=trips.find(t=>t.id===deleteId);
 const optionsTrip=trips.find(t=>t.id===optionsId);
 return <div className="journeys-page" aria-label="我的行程与旅行收藏册">
   <div className="journeys-header">
     <div className="journeys-heading">
       <span className="journeys-eyebrow">THE JOURNEY ARCHIVE <i>·</i> VOL. 05</span>
       <h1>我的<em>行程</em></h1>
       <p>每段旅程，都值得好好收藏。</p>
     </div>
     <div className="journeys-header__drawing" aria-hidden="true">
       <svg viewBox="0 0 112 116" fill="none">
         <circle cx="83" cy="31" r="18" fill="#EED9B3" opacity=".78"/>
         <path d="M9 81C32 58 37 60 52 74C71 49 83 46 110 76" stroke="#91A98C" strokeWidth="3.2" strokeLinecap="round"/>
         <path d="M6 93C34 79 41 86 58 91C72 74 92 78 112 88" stroke="#C4CEB5" strokeWidth="3" strokeLinecap="round"/>
         <path d="M8 103C34 99 56 101 91 105" stroke="#DACAB6" strokeWidth="2.2" strokeLinecap="round"/>
         <path d="M29 39C23 34 17 36 13 40M65 10C71 6 75 8 80 13" stroke="#B4A58B" strokeWidth="1.8" strokeLinecap="round"/>
         <path d="M77 94C71 81 70 66 75 54M77 84C68 83 67 76 65 73M76 74C85 69 85 64 87 62" stroke="#91A98C" strokeWidth="2" strokeLinecap="round"/>
       </svg>
     </div>
   </div>

   <div className="journeys-ledger">
     <div><span className="journeys-ledger__n">{String(trips.length).padStart(2,'0')}</span><span className="journeys-ledger__unit">段旅程</span></div>
     <span className="journeys-ledger__rule"/>
     <p>{trips.length?'已收进你的私人旅行收藏册。':'一本空白的旅行收藏册，等你慢慢写满。'}</p>
     <Feather size={16} strokeWidth={1.4}/>
   </div>

   <div className="journeys-filter" aria-label="按照旅行状态筛选行程">
     {tabs.map(tab=><button key={tab.key} type="button" onClick={()=>setFilter(tab.key)} className={filter===tab.key?'is-active':''} aria-pressed={filter===tab.key}>
       {tab.label}<span>{counts[tab.key]}</span>
     </button>)}
   </div>

   {visible.length===0?<EmptyJourney filtered={trips.length>0} onCreate={()=>navigate('/plan/new')} onClear={()=>setFilter('all')}/>:
   <div className="journeys-list" aria-live="polite">
     {visible.map((trip,i)=>{
       const status=tripStatus(trip);
       return <article key={trip.id} className={`journey-card ${openingId===trip.id?'is-opening':''} ${removingId===trip.id?'is-removing':''}`}>
         <button type="button" className="journey-card__cover" onClick={()=>openTrip(trip.id)} aria-label={`打开${trip.destination}的行程`}>
           <CoverImage trip={trip}/>
           <span className="journey-card__filmgrain" aria-hidden="true"/>
           <span className="journey-card__vol">JOURNEY / {String(trips.indexOf(trip)+1).padStart(3,'0')}</span>
           <span className={`journey-card__stamp journey-card__stamp--${status.key}`} aria-hidden="true">{status.label}<small>{status.key==='done'?'MEMORIES':status.key==='upcoming'?'TO EXPLORE':status.key==='active'?'ON THE ROAD':'MY JOURNEY'}</small></span>
         </button>
         <div className="journey-card__body">
           <div className="journey-card__intro">
             <div className="journey-card__dest"><span>TRAVEL NOTES · {String(i+1).padStart(2,'0')}</span><h2>{trip.destination}<em> · {trip.days}日漫游</em></h2></div>
             <button type="button" className="journey-card__more" onClick={()=>setOptionsId(trip.id)} aria-label={`管理${trip.destination}行程`}><Ellipsis size={20}/></button>
           </div>
           <div className="journey-card__info"><span><CalendarDays size={12}/>{prettyTripSpan(trip)}</span><span><MapPin size={12}/>{trip.itinerary?.length||trip.days} 天安排 · {trip.requirements?.pace||'自由探索'}</span></div>
           <div className="journey-card__rule"/>
           <div className="journey-card__actions"><span>每一页，都记着出发的心情</span><button type="button" onClick={()=>openTrip(trip.id)}>翻开行程 <ArrowRight size={15}/></button></div>
         </div>
       </article>;
     })}
   </div>}

   <button type="button" className="journeys-create" onClick={()=>navigate('/plan/new')}><span><Plus size={17}/></span><span>开启一段新旅程<small>MAKE A NEW JOURNEY</small></span><ArrowRight size={17}/></button>
   <p className="journeys-footer">✳ &nbsp; 旅行状态根据设备当前日期判断，旅程内容保存在本机浏览器 &nbsp; ✳</p>

   {optionsTrip&&layer(<BottomSheet title="整理这段旅程" onClose={()=>setOptionsId(null)}>
     <div className="journey-options"><p>「{optionsTrip.destination}」的旅行安排</p>
       <button type="button" onClick={()=>openTrip(optionsTrip.id)}><BookHeart size={17}/> 查看并继续编辑 <ChevronRight size={16}/></button>
       <button type="button" className="journey-options__danger" onClick={()=>requestDelete(optionsTrip.id)}><Trash2 size={17}/> 删除行程 <ChevronRight size={16}/></button>
       <small>行程仅保存在当前浏览器。删除后无法在本机恢复。</small>
     </div>
   </BottomSheet>)}
   {deletingTrip&&layer(<div className="journey-delete-overlay" role="presentation" onClick={()=>setDeleteId(null)}><div className="journey-delete-dialog" role="dialog" aria-modal="true" aria-label="确认删除行程" onClick={e=>e.stopPropagation()}>
     <span className="journey-delete-dialog__icon"><Trash2 size={22}/></span>
     <h2>确定要移除这段旅程吗？</h2>
     <p>「{deletingTrip.destination}」将从你的旅行收藏册中删除，且无法恢复。</p>
     <div><button type="button" onClick={()=>setDeleteId(null)}>先留着</button><button type="button" onClick={confirmDelete}>确认删除</button></div>
   </div></div>)}
   {notice&&<div className="journeys-toast" role="status"><Check size={15}/>{notice}<button type="button" onClick={()=>setNotice('')} aria-label="关闭提醒"><X size={14}/></button></div>}
 </div>;
}
