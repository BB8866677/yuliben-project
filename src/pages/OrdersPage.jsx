import { SITE_BASE } from '../data/siteBase.js';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useLocation,useNavigate} from 'react-router-dom';
import {
  ArrowRight,BookHeart,BookOpen,CalendarDays,Check,CheckCheck,ChevronRight,Clock3,
  Heart,Info,MailOpen,MapPin,Package,PackageCheck,PenLine,Plus,RotateCcw,
  Send,Stamp,Ticket,X
} from 'lucide-react';
import {
  advanceDemoOrder,cancelPrintOrder,DEMO_ORDER_LABELS,DEMO_ORDER_STAGES,
  getDemoOrderStageIndex,PRINT_MATERIALS,PRINT_SIZES,readPrintOrders,saveDemoOrderFeedback
} from '../data/printOrders.js';
import {getJournalMedia} from '../data/journalMedia.js';
import {findJournalById} from '../data/journalDraft.js';
import {PrintCoverFlat} from '../components/PrintBook.jsx';

const FILTERS=[
  {key:'all',label:'全部'},
  {key:'making',label:'制作中'},
  {key:'shipping',label:'寄送中'},
  {key:'completed',label:'已完成'},
  {key:'cancelled',label:'已取消'}
];
const money=value=>`¥${Number(value||0).toFixed(0)}`;
const when=value=>{
  if(!value)return '—';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '—';
  return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date);
};
const stageName=status=>DEMO_ORDER_LABELS[status]||'模拟订单';
const isActive=status=>!['demo-completed','demo-cancelled'].includes(status);
const matchesFilter=(order,filter)=>{
  if(filter==='all')return true;
  if(filter==='making')return ['demo-created','demo-making'].includes(order.status);
  if(filter==='shipping')return order.status==='demo-shipping';
  if(filter==='completed')return order.status==='demo-completed';
  if(filter==='cancelled')return order.status==='demo-cancelled';
  return true;
};

function PostalIllustration(){
  return <svg viewBox="0 0 300 118" className="op-postal-art" aria-hidden="true">
    <defs>
      <linearGradient id="op-envelope" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffaf0"/><stop offset="1" stopColor="#e8dac4"/></linearGradient>
    </defs>
    <path d="M10 74 C55 39 99 104 149 66 S246 28 291 70" fill="none" stroke="#91a483" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round"/>
    <g transform="translate(72 20) rotate(-9 60 38)">
      <rect x="4" y="4" width="132" height="83" rx="6" fill="#ccb99d" opacity=".3"/>
      <rect width="132" height="83" rx="6" fill="url(#op-envelope)" stroke="#bea98e" strokeWidth="1.7"/>
      <path d="M1 1 L66 48 L131 1" fill="none" stroke="#bea98e" strokeWidth="1.6"/>
      <path d="M1 82 L53 37 M131 82 L80 37" stroke="#d5c1a7" fill="none"/>
      <rect x="99" y="12" width="23" height="30" rx="1" fill="#f5e8cf" stroke="#ad947a" strokeDasharray="2 2"/>
      <path d="M103 36 L110 22 L117 36" fill="none" stroke="#8b9c87" strokeWidth="2"/>
    </g>
    <g transform="translate(203 11) rotate(16)">
      <rect x="0" y="0" width="61" height="75" rx="3" fill="#f4f0e2" stroke="#b0a58e"/>
      <rect x="7" y="8" width="47" height="45" rx="2" fill="#adc4b4"/>
      <path d="M8 48 Q24 18 34 33 T54 21" fill="none" stroke="#fff9eb" strokeWidth="2"/>
      <circle cx="42" cy="20" r="6" fill="#e9d4a4"/>
      <path d="M12 64 H48" stroke="#c2b8a5" strokeWidth="2" strokeLinecap="round"/>
    </g>
    <g transform="translate(30 16) rotate(-15)">
      <circle cx="22" cy="21" r="19" fill="none" stroke="#b98573" strokeWidth="2" opacity=".85"/>
      <path d="M11 21 H33 M22 11 V31" stroke="#b98573" strokeWidth="1"/>
      <path d="M45 8 h20 M46 14 h20 M47 20 h20" stroke="#b98573" strokeWidth="1.7" opacity=".75"/>
    </g>
    <path d="M241 100 c5 -12 12 -15 18 -8 7 -10 15 -7 17 0" stroke="#8a9d7a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M17 105 q13 -13 23 -2 q8 -13 17 -7" stroke="#b99079" fill="none" strokeWidth="2"/>
  </svg>;
}
function StampMark({status,small=false}){
  const cancelled=status==='demo-cancelled';
  const completed=status==='demo-completed';
  return <span className={`op-stamp ${small?'op-stamp--small':''} ${cancelled?'op-stamp--muted':completed?'op-stamp--done':''}`} aria-label={`状态：${stageName(status)}，仅模拟`}>
    <span>YULIBEN</span><strong>{stageName(status)}</strong><span>DEMO · POST</span>
  </span>;
}
function ProcessRoute({status,compact=false}){
  const index=getDemoOrderStageIndex(status);
  const cancelled=status==='demo-cancelled';
  return <div className={`op-route ${compact?'op-route--compact':''}`} aria-label={`演示制作进度：${stageName(status)}`}>
    {DEMO_ORDER_STAGES.map((step,i)=><div key={step} className={`op-route-step ${!cancelled&&i<=index?'is-done':''} ${!cancelled&&i===index?'is-current':''}`}>
      <span className="op-route-marker">{!cancelled&&i<=index?<Check size={compact?10:12} strokeWidth={2.7}/>:i+1}</span>
      <span className="op-route-name">{['已创建','制作中','寄送中','已完成'][i]}</span>
    </div>)}
  </div>;
}
function BookCover({order,mediaUrls,large=false}){
  const cfg=order.configuration||{};
  return <div className={`op-book ${large?'op-book--large':''}`}>
    <span className="op-book-spine" aria-hidden="true"/>
    <div className="op-book-front"><PrintCoverFlat journal={order.journalSnapshot||order} config={cfg} mediaUrls={mediaUrls} small={!large}/></div>
    <span className="op-book-pages" aria-hidden="true"/>
  </div>;
}
function OrderCard({order,mediaUrls,onOpen,highlight}){
  const cfg=order.configuration||{};
  const caption=`${PRINT_SIZES[cfg.size]?.label||'A5 竖版'} · ${PRINT_MATERIALS[cfg.material]?.label||'精装封面'}`;
  return <article className={`op-order-card ${highlight?'is-new':''}`}>
    <div className="op-card-top"><span>POSTCARD NO. {order.id?.split('-').pop()||'001'}</span><StampMark status={order.status} small/></div>
    <div className="op-card-main">
      <BookCover order={order} mediaUrls={mediaUrls}/>
      <div className="op-card-copy"><span className="op-card-small">YOUR MEMORY BOOK</span><h2>{cfg.coverTitle||order.title||'我的旅行纪念册'}</h2><p>{caption}</p><p>{order.journalSnapshot?.pages?.length||0} 页内页 · 共 {order.quote?.quantity||1} 本</p><strong>{money(order.quote?.total)} <small>演示金额</small></strong></div>
    </div>
    <ProcessRoute status={order.status} compact/>
    <div className="op-card-bottom"><span>{when(order.createdAt).split(' ')[0]}</span><button type="button" onClick={()=>onOpen(order.id)} aria-label={`查看${cfg.coverTitle||order.title||'旅行纪念册'}的订单详情`}>拆开这封旅行来信 <ChevronRight size={15}/></button></div>
  </article>;
}
function OrderDetailSheet({order,mediaUrls,onClose,onRefresh,onRepeat}){
  const sheetRef=useRef(null);
  const [confirmCancel,setConfirmCancel]=useState(false);
  const [feedbackOpen,setFeedbackOpen]=useState(false);
  const [feedback,setFeedback]=useState('');
  const [status,setStatus]=useState('');
  const [touchStart,setTouchStart]=useState(null);
  useEffect(()=>{
    const previous=document.activeElement;
    sheetRef.current?.focus();
    const onKey=e=>{if(e.key==='Escape')onClose()};
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);previous?.focus?.()};
  },[onClose]);
  const c=order.configuration||{};
  const current=getDemoOrderStageIndex(order.status);
  const cancelled=order.status==='demo-cancelled';
  const canAdvance=current>=0&&current<DEMO_ORDER_STAGES.length-1;
  const canCancel=['demo-created','demo-making'].includes(order.status);
  const nextLabel=DEMO_ORDER_LABELS[DEMO_ORDER_STAGES[current+1]]||'下一阶段';
  function advance(){advanceDemoOrder(order.id);setStatus('演示进度已更新，仅保存在本机');onRefresh();}
  function cancel(){cancelPrintOrder(order.id);setConfirmCancel(false);setStatus('模拟订单已取消，没有真实扣款');onRefresh();}
  function submitFeedback(){if(!feedback.trim())return;saveDemoOrderFeedback(order.id,feedback);setFeedback('');setFeedbackOpen(false);setStatus('意见已保存到本机，尚未发送给客服');onRefresh();}
  return createPortal(<div className="op-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section ref={sheetRef} tabIndex={-1} className="op-letter-sheet" role="dialog" aria-modal="true" aria-labelledby="op-sheet-title">
      <div className="op-sheet-grip" onTouchStart={e=>setTouchStart(e.touches[0].clientY)} onTouchEnd={e=>{if(touchStart!==null&&e.changedTouches[0].clientY-touchStart>90)onClose();setTouchStart(null)}}><span/></div>
      <div className="op-sheet-heading"><div><span className="op-eyebrow">LETTER FROM THE JOURNEY</span><h2 id="op-sheet-title">这本旅行纪念册的来信</h2></div><button type="button" aria-label="关闭订单详情" onClick={onClose}><X size={19}/></button></div>
      <div className="op-sheet-product"><BookCover order={order} mediaUrls={mediaUrls} large/><div><span className="op-card-small">MY LITTLE BOOK</span><h3>{c.coverTitle||order.title||'旅行纪念册'}</h3><p>{c.coverSubtitle||order.destination||'关于旅途的小小记录'}</p><span className="op-sheet-status">{stageName(order.status)} · 模拟</span></div></div>
      <div className="op-letter-divider"><span>✦ &nbsp; HANDMADE WITH MEMORIES &nbsp; ✦</span></div>
      <h3 className="op-sheet-subhead"><Package size={16}/> 纪念册的旅程</h3>
      <ProcessRoute status={order.status}/>
      <p className="op-explain">{cancelled?'这笔订单已标记为取消，所有内容仍作为本地记录保存。':order.status==='demo-completed'?'模拟流程已走到完成状态。此状态不代表真实印刷或签收。':'这里展示的是可手动推进的模拟进度，不连接真实工厂或物流。'}</p>
      <dl className="op-order-fields"><div><dt>模拟订单编号</dt><dd>{order.id}</dd></div><div><dt>创建时间</dt><dd>{when(order.createdAt)}</dd></div><div><dt>书本规格</dt><dd>{PRINT_SIZES[c.size]?.label||'A5 竖版'}</dd></div><div><dt>封面装帧</dt><dd>{PRINT_MATERIALS[c.material]?.label||'精装'}</dd></div><div><dt>封面设计</dt><dd>{({botanical:'花间漫游',postcard:'旧时光邮局',seaside:'海风来信',city:'城市漫游图鉴'})[c.coverTemplate]||'旅行封面'}</dd></div><div><dt>内页与数量</dt><dd>{order.journalSnapshot?.pages?.length||0} 页 × {order.quote?.quantity||1} 本</dd></div><div className="op-total"><dt>演示定制金额</dt><dd>{money(order.quote?.total)}</dd></div></dl>
      <div className="op-snapshot-note"><BookOpen size={16}/><span>已保存创建订单时的手账快照。之后编辑原稿，不会修改本订单。</span></div>
      {status&&<p className="op-inline-notice" role="status"><Check size={14}/>{status}</p>}
      {confirmCancel?<div className="op-cancel-box"><strong>确定取消这笔模拟订单？</strong><p>取消后仍可查看记录，但不能继续推进制作状态。</p><div><button type="button" onClick={()=>setConfirmCancel(false)}>返回</button><button type="button" className="op-danger" onClick={cancel}>确认取消</button></div></div>:null}
      {feedbackOpen&&<div className="op-feedback-box"><label htmlFor="op-feedback">写下你的意见或售后问题（仅保存在本地）</label><textarea id="op-feedback" rows={3} maxLength={500} placeholder="例如：希望修改纪念册封面、咨询印刷材质……" value={feedback} onChange={e=>setFeedback(e.target.value)}/><div><button type="button" onClick={()=>setFeedbackOpen(false)}>返回</button><button type="button" disabled={!feedback.trim()} onClick={submitFeedback}>保存意见</button></div></div>}
      <div className="op-sheet-actions">
        {canAdvance&&<button className="op-primary-action" type="button" onClick={advance}><Stamp size={16}/> 演示：推进至{nextLabel}</button>}
        <button className="op-secondary-action" type="button" onClick={()=>onRepeat(order)}><RotateCcw size={16}/> 按原规格再次定制</button>
        <div className="op-action-bottom"><button type="button" onClick={()=>setFeedbackOpen(v=>!v)}><PenLine size={14}/>问题反馈</button>{canCancel&&!confirmCancel&&<button className="op-cancel-link" type="button" onClick={()=>setConfirmCancel(true)}>取消订单</button>}</div>
      </div>
      {order.feedback?.length>0&&<p className="op-feedback-count">本地留存意见 {order.feedback.length} 条</p>}
      <p className="op-sheet-legal"><Info size={14}/> 本页仅供课程原型演示，不产生真实订单、支付、生产、运输或客服请求。</p>
    </section>
  </div>,document.querySelector('.app-screen')||document.body);
}
export default function OrdersPage(){
  const nav=useNavigate(),location=useLocation();
  const [orders,setOrders]=useState(()=>readPrintOrders());
  const [filter,setFilter]=useState('all');
  const [selectedId,setSelectedId]=useState(null);
  const [mediaUrls,setMediaUrls]=useState({});
  const [notice,setNotice]=useState('');
  const highlighted=location.state?.orderId||null;
  const closeSheet=useCallback(()=>setSelectedId(null),[]);
  const refresh=useCallback(()=>setOrders(readPrintOrders()),[]);
  useEffect(()=>{refresh()},[refresh,location.key]);
  useEffect(()=>{
    if(!highlighted)return;
    setNotice('旅途已收录！点击订单，查看你的纪念册来信。');
    const timer=setTimeout(()=>setNotice(''),4500);
    return()=>clearTimeout(timer);
  },[highlighted]);
  const coverIds=useMemo(()=>Array.from(new Set(orders.map(order=>order.configuration?.coverMediaId).filter(Boolean))),[orders]);
  useEffect(()=>{
    let active=true;
    const urls=[];
    Promise.all(coverIds.map(async id=>{
      try{const blob=await getJournalMedia(id);if(blob){const url=URL.createObjectURL(blob);urls.push(url);return [id,url]}}catch{}
      return null;
    })).then(results=>{if(active)setMediaUrls(Object.fromEntries(results.filter(Boolean)))});
    return()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url))};
  },[coverIds.join('|')]);
  const shown=useMemo(()=>orders.filter(order=>matchesFilter(order,filter)),[orders,filter]);
  const selected=orders.find(order=>order.id===selectedId)||null;
  const repeat=order=>{
    const journal=findJournalById(order.journalId);
    if(!journal){setSelectedId(null);setNotice('原手账已不存在，无法按原稿再次定制；可先制作一本新手账。');return}
    setSelectedId(null);
    nav('/print/customize',{state:{journalId:order.journalId,repeatConfig:order.configuration}});
  };
  return <div className="op-page">
    <header className="op-heading"><span className="op-eyebrow">THE MEMORY POST OFFICE · 09</span><h1>旅途来信 <span>✳</span></h1><p>每一本纪念册，都是寄给未来的自己。</p></header>
    <div className="op-post-office"><div><span>YULIBEN MEMORY POST</span><strong>有些风景，<br/>值得装订收藏。</strong><p>把旅行的小小故事，寄往未来的某一天。</p></div><PostalIllustration/></div>
    <div className="op-headline"><div><span>MY LITTLE PARCELS</span><h2>我的纪念册 <em>{orders.length} 本记录</em></h2></div><span className="op-headline-mark"><MailOpen size={19}/></span></div>
    <div className="op-filters" role="group" aria-label="筛选模拟订单状态">{FILTERS.map(item=><button key={item.key} type="button" className={filter===item.key?'is-active':''} aria-pressed={filter===item.key} onClick={()=>setFilter(item.key)}>{item.label}</button>)}</div>
    {notice&&<div className="op-notice" role="status"><Check size={15}/>{notice}</div>}
    {shown.length?<div className="op-card-list">{shown.map(order=><OrderCard key={order.id} order={order} highlight={highlighted===order.id} mediaUrls={mediaUrls} onOpen={setSelectedId}/>)}</div>:
      <div className="op-empty"><img src={SITE_BASE + 'images/journal-creation-watercolor.jpg'} alt="水彩风旅行手账"/><div className="op-empty-doodles">✧ &nbsp; NO LETTERS YET &nbsp; ✧</div><h2>{orders.length?'这一栏还没有订单':'还没有寄出的旅行故事'}</h2><p>{orders.length?'可以切换其他状态，看看已经收藏的纪念册。':'先完成一本手绘旅行手账，再把它装订成真正的纪念册。'}</p>{orders.length?<button type="button" onClick={()=>setFilter('all')}>查看全部订单 <ArrowRight size={15}/></button>:<button type="button" onClick={()=>nav('/journal/create')}>去制作旅行手账 <ArrowRight size={15}/></button>}</div>}
    <button type="button" className="op-new" onClick={()=>nav('/print/customize')}><Plus size={16}/> 再定制一本旅行纪念册 <ArrowRight size={15}/></button>
    <footer className="op-disclaimer"><Info size={13}/> 所有订单和制作进度均为本地模拟，不会产生真实付款或物流。</footer>
    {selected&&<OrderDetailSheet order={selected} mediaUrls={mediaUrls} onClose={closeSheet} onRefresh={refresh} onRepeat={repeat}/>}
  </div>;
}
