import { SITE_BASE } from '../data/siteBase.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useLocation,useNavigate} from 'react-router-dom';
import {ArrowLeft,ArrowRight,BookOpen,Check,CheckCircle2,ChevronLeft,ChevronRight,FileWarning,Image as ImageIcon,Info,Minus,PackageCheck,Plus,RotateCcw,ShieldCheck,Stamp,SwatchBook,X} from 'lucide-react';
import {findJournalById,readJournalDrafts} from '../data/journalDraft.js';
import {getJournalMedia} from '../data/journalMedia.js';
import {createPrintOrder,DEFAULT_PRINT_CONFIG,getPrintDraft,normalizePrintConfig,PRINT_MATERIALS,PRINT_SIZES,quotePrint,savePrintDraft} from '../data/printOrders.js';
import {PrintCoverFlat,PrintPageSnapshot,coverArtwork} from '../components/PrintBook.jsx';
import {Print3DBook} from '../components/Print3DBook.jsx';
import {PRINT_COVERS} from '../data/printCoverArt.js';

function ArtworkChooser({journal,config,mediaUrls,onSelect}){
  const all=(journal?.pages||[]).flatMap(page=>(page.photos||[]).filter(x=>(x.type||'').startsWith('image/')));
  const unique=all.filter((it,index)=>all.findIndex(x=>x.id===it.id)===index);
  return <div className="pc-cover-chooser" role="group" aria-label="选择封面图片">
    <button type="button" className={!config.coverMediaId?'is-active':''} onClick={()=>onSelect(null)}><img src={coverArtwork(journal.destination)} alt="手绘旅行封面"/><span>手绘封面</span>{!config.coverMediaId&&<Check size={13}/>}</button>
    {unique.map(media=><button key={media.id} type="button" className={config.coverMediaId===media.id?'is-active':''} onClick={()=>onSelect(media.id)}>{mediaUrls[media.id]?<img src={mediaUrls[media.id]} alt={media.name||'旅行照片'}/>:<ImageIcon size={22}/>}<span>{media.name?.slice(0,8)||'我的照片'}</span>{config.coverMediaId===media.id&&<Check size={13}/>}</button>)}
    {!unique.length&&<p>暂未上传旅行照片，先使用手绘插画；可在第六页补充照片。</p>}
  </div>;
}
function PrintPreviewOverlay({journal,config,mediaUrls,onClose}){
  const [index,setIndex]=useState(0);
  const xStart=useRef(null);
  const count=journal.pages.length+1;
  const next=dir=>setIndex(i=>Math.max(0,Math.min(count-1,i+dir)));
  useEffect(()=>{const handle=e=>{if(e.key==='Escape')onClose();if(e.key==='ArrowLeft')next(-1);if(e.key==='ArrowRight')next(1)};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle)},[onClose]);
  return createPortal(<div className="pc-preview-mask" role="dialog" aria-modal="true" aria-label="实体纪念册翻阅预览">
    <header className="pc-preview-head"><button type="button" onClick={onClose} aria-label="关闭预览"><X size={21}/></button><div><strong>翻开我的旅行纪念册</strong><span>{index===0?'精装封面':`第 ${index} / ${journal.pages.length} 页 · 内页`} · 模拟预览</span></div><span className="pc-preview-head__index">{String(index+1).padStart(2,'0')}/{String(count).padStart(2,'0')}</span></header>
    <div className="pc-preview-stage" onTouchStart={e=>{xStart.current=e.touches[0].clientX}} onTouchEnd={e=>{const delta=e.changedTouches[0].clientX-(xStart.current||0);if(Math.abs(delta)>45)next(delta<0?1:-1);xStart.current=null}}>
      <div key={index} className={`pc-preview-book pc-preview-book--${config.size}`}>
        {index===0?<PrintCoverFlat journal={journal} config={config} mediaUrls={mediaUrls}/>:<div className="pc-preview-paper"><PrintPageSnapshot page={journal.pages[index-1]} destination={journal.destination} mediaUrls={mediaUrls}/></div>}
      </div>
    </div>
    <nav className="pc-preview-nav"><button type="button" disabled={index===0} onClick={()=>next(-1)}><ChevronLeft size={20}/>上一页</button><span>{index===0?'封面 · 文艺装帧':`DAY ${String(index).padStart(2,'0')} · 保留原始图层`}</span><button type="button" disabled={index===count-1} onClick={()=>next(1)}>下一页<ChevronRight size={20}/></button></nav>
    <p className="pc-preview-footnote">内容按比例完整缩放，不进行强制裁切；实体印刷需要另行检查出血、装订线和分辨率。</p>
  </div>,document.querySelector('.app-screen')||document.body);
}
const materialEntries=Object.entries(PRINT_MATERIALS);
const sizeEntries=Object.entries(PRINT_SIZES);
const currency=n=>`¥${n}`;
export default function PrintCustomizePage(){
  const location=useLocation(),navigate=useNavigate();
  const journal=useMemo(()=>{
    const id=location.state?.journalId||new URLSearchParams(location.search).get('journalId');
    return id?findJournalById(id):readJournalDrafts().filter(j=>j?.pages?.length).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0]||null;
  },[location.state?.journalId,location.search]);
  const [config,setConfig]=useState(()=>{
    const saved=journal?.id?getPrintDraft(journal.id):null;
    return normalizePrintConfig({...DEFAULT_PRINT_CONFIG,...saved,...location.state?.repeatConfig});
  });
  useEffect(()=>{if(journal?.id)setConfig(normalizePrintConfig({...DEFAULT_PRINT_CONFIG,...getPrintDraft(journal.id),...location.state?.repeatConfig}))},[journal?.id,location.state?.repeatConfig]);
  const [mediaUrls,setMediaUrls]=useState({});
  const [imageWarnings,setImageWarnings]=useState([]);
  const [previewOpen,setPreviewOpen]=useState(false);
  const [status,setStatus]=useState('');
  const [stamp,setStamp]=useState(false);
  const creating=useRef(false);
  const quote=quotePrint(config,journal?.pages?.length||1);
  useEffect(()=>{
    if(!journal)return;
    let alive=true;
    const urls=[];
    const assets=journal.pages.flatMap(p=>[...(p.photos||[])]).filter(x=>(x.type||'').startsWith('image/'));
    const unique=assets.filter((a,i)=>assets.findIndex(b=>b.id===a.id)===i);
    Promise.all(unique.map(async media=>{
      try{const blob=await getJournalMedia(media.id);if(blob){const src=URL.createObjectURL(blob);urls.push(src);return {id:media.id,src,blob}}}catch{}
      return null;
    })).then(async found=>{
      if(!alive)return;
      const good=found.filter(Boolean);
      setMediaUrls(Object.fromEntries(good.map(m=>[m.id,m.src])));
      const issues=[];
      await Promise.all(good.map(async m=>{
        try{const bitmap=await createImageBitmap(m.blob);if(Math.min(bitmap.width,bitmap.height)<800)issues.push(m.id);bitmap.close()}catch{}
      }));
      if(alive)setImageWarnings(issues);
    });
    return()=>{alive=false;urls.forEach(src=>URL.revokeObjectURL(src))};
  },[journal?.id]);
  useEffect(()=>{if(journal?.id){try{savePrintDraft(journal.id,config)}catch{}}},[journal?.id,config]);
  const update=patch=>setConfig(prev=>normalizePrintConfig({...prev,...patch}));
  function createDemoOrder(){
    if(creating.current||!journal)return;
    creating.current=true;
    setStatus('');
    try{
      const order=createPrintOrder(journal,config);
      setStamp(true);
      window.setTimeout(()=>navigate('/orders',{state:{orderId:order.id}}),850);
    }catch(e){creating.current=false;setStatus(e?.message||'模拟订单创建失败，请检查浏览器存储空间')}
  }
  if(!journal)return <div className="pc-empty"><img src={SITE_BASE + 'images/journal-memory-watercolor.jpg'} alt="手绘旅行本"/><span className="pc-kicker">PRINT STUDIO / 08</span><h1>先写好一本旅行手账</h1><p>实体定制会使用第七页保存的真实手账。当前没有可用的手账初稿，请先选择行程并生成。</p><button type="button" onClick={()=>navigate('/journal/create')}>去生成手账 <ArrowRight size={16}/></button></div>;
  return <div className="pc-page">
    <div className="pc-title"><span className="pc-kicker">YULIBEN · LITTLE BINDERY / 08</span><h1>把旅途，收藏成书 <span>✳</span></h1><p>你的手绘旅行日记，即将变成一本有温度的纪念册。</p></div>
    <section className="pc-book-hero" aria-label="纪念册实体预览"><div className="pc-hero-top"><span><span className="pc-live-dot"/> REAL 3D BOOK · DRAG TO ROTATE</span><span>{PRINT_SIZES[config.size].label}</span></div><Print3DBook journal={journal} config={config} mediaUrls={mediaUrls} onOpen={()=>setPreviewOpen(true)}/><div className="pc-hero-bottom"><span>拖动旋转 · 可查看书脊与封底</span><button type="button" onClick={()=>setPreviewOpen(true)}><BookOpen size={15}/>翻阅内页 <ArrowRight size={13}/></button></div></section>
    <div className="pc-source"><div className="pc-source__mark"><BookOpen size={20}/></div><div><strong>{journal.title||`${journal.destination} · 旅行手账`}</strong><span>已从第七页导入 {journal.pages.length} 张手绘手账 · 使用已保存图层</span></div><CheckCircle2 size={18}/></div>
    <section className="pc-section pc-design-collection"><div className="pc-section-head"><span className="pc-section-num">01</span><div><h2>挑一本喜欢的封面</h2><p>四套独立绘制的封面模板 · 文字随你的旅程更新</p></div></div>
      <div className="pc-cover-gallery" role="group" aria-label="旅行纪念册封面模板">
        {Object.entries(PRINT_COVERS).map(([id,theme])=><button key={id} type="button" aria-pressed={config.coverTemplate===id} className={config.coverTemplate===id?'is-active':''} onClick={()=>update({coverTemplate:id})}>
          <span className="pc-cover-gallery__art"><PrintCoverFlat journal={journal} config={{...config,coverTemplate:id}} mediaUrls={mediaUrls} small/>{config.coverTemplate===id&&<span className="pc-cover-gallery__check"><Check size={12}/></span>}</span>
          <strong>{theme.label}</strong>
        </button>)}
      </div>
      <p className="pc-helper"><Info size={14}/>选择模板后，立体书的封面贴图立即更新；封面标题与照片仍可修改。</p>
    </section>
    <section className="pc-section"><div className="pc-section-head"><span className="pc-section-num">02</span><div><h2>选择书本尺寸</h2><p>不同尺寸，呈现不同的收藏方式</p></div></div><div className="pc-sizes">{sizeEntries.map(([key,item])=><button key={key} type="button" className={config.size===key?'is-active':''} onClick={()=>update({size:key})}><span className={`pc-size-icon pc-size-icon--${key}`} aria-hidden="true"/><strong>{item.label}</strong><small>{item.detail}</small>{config.size===key&&<Check className="pc-choice-check" size={14}/>}</button>)}</div><p className="pc-helper"><Info size={14}/>内页按比例完整适配；方形版可能有较多留白，不会裁掉原手账。</p></section>
    <section className="pc-section"><div className="pc-section-head"><span className="pc-section-num">03</span><div><h2>挑选封面材质</h2><p>让这段旅程拥有属于它的触感</p></div></div><div className="pc-materials">{materialEntries.map(([key,item])=><button key={key} type="button" className={config.material===key?'is-active':''} onClick={()=>update({material:key})}><span className={`pc-material-swatch pc-material-swatch--${key}`}>{config.material===key&&<Check size={17}/>}</span><strong>{item.label}</strong><small>{key==='linen'?'+¥20':key==='cream'?'+¥12':'基础款'}</small></button>)}</div></section>
    <section className="pc-section"><div className="pc-section-head"><span className="pc-section-num">04</span><div><h2>写下封面上的话</h2><p>只调整外封，不改动内页旅行记录</p></div></div>
      <label className="pc-field"><span>纪念册名称</span><input type="text" maxLength={24} value={config.coverTitle} placeholder={`${journal.destination||'旅途'}旅行手记`} onChange={e=>update({coverTitle:e.target.value})}/></label>
      <label className="pc-field"><span>封面副标题</span><input type="text" maxLength={40} value={config.coverSubtitle} placeholder="把每一次出发，写成自己的故事" onChange={e=>update({coverSubtitle:e.target.value})}/></label>
      <div className="pc-photo-heading"><span>封面图画</span><span>可以选用自己上传的旅行照片</span></div><ArtworkChooser journal={journal} config={config} mediaUrls={mediaUrls} onSelect={id=>update({coverMediaId:id})}/>
    </section>
    <section className="pc-section pc-proof"><div className="pc-section-head"><span className="pc-section-num">05</span><div><h2>检查并翻阅内页</h2><p>确认图文完整，准备好收藏故事</p></div></div>
      <button type="button" className="pc-proof-row" onClick={()=>setPreviewOpen(true)}><div className="pc-proof-paper"><span>DAY 01</span><img src={SITE_BASE + 'images/journal-master/westlake-main.jpg'} alt="旅行手账插画示意"/></div><div><strong>预览全部 {journal.pages.length} 页</strong><span>查看真实保存的照片、旅行文字与手绘元素</span><em>翻开这本书 <ArrowRight size={13}/></em></div><ChevronRight size={18}/></button>
      <div className="pc-check-list"><p><ShieldCheck size={16}/>所有内页以完整比例缩放，不进行强制裁切</p><p><Info size={16}/>这是交互原型的排版模拟，尚非印刷级文件</p>{imageWarnings.length>0&&<p className="pc-warning"><FileWarning size={16}/>{imageWarnings.length} 张上传图片较小，印刷前建议更换高清原图</p>}{config.size==='square'&&<p className="pc-warning"><FileWarning size={16}/>方形版将保留长页画布并留白，实际印刷建议人工分页</p>}</div>
    </section>
    <section className="pc-section pc-quote"><div className="pc-section-head"><span className="pc-section-num">06</span><div><h2>定制清单</h2><p>以下价格仅用于课堂交互演示</p></div></div>
      <div className="pc-quote-rows"><div><span>{PRINT_SIZES[config.size].label} · 基础装帧</span><strong>{currency(quote.base)}</strong></div><div><span>{PRINT_MATERIALS[config.material].label}</span><strong>{quote.material?`+${currency(quote.material)}`:'已包含'}</strong></div><div><span>{journal.pages.length} 张手账内页{quote.extraPages?' · 附加页费':''}</span><strong>{quote.extraPages?`+${currency(quote.extraPages)}`:'已包含'}</strong></div></div>
      <div className="pc-qty"><span>定制数量</span><div><button type="button" aria-label="减少数量" disabled={config.quantity===1} onClick={()=>update({quantity:config.quantity-1})}><Minus size={15}/></button><strong>{config.quantity}</strong><button type="button" aria-label="增加数量" disabled={config.quantity===5} onClick={()=>update({quantity:config.quantity+1})}><Plus size={15}/></button></div></div>
    </section>
    <div className="pc-order-footer"><div className="pc-order-total"><span>模拟定制金额</span><strong>{currency(quote.total)}</strong><small>不涉及实际付款或配送</small></div><button type="button" disabled={stamp} onClick={createDemoOrder}><PackageCheck size={17}/>确认定制 <ArrowRight size={15}/></button></div>
    {status&&<p className="pc-error" role="alert">{status}</p>}
    {stamp&&<div className="pc-stamp-mask" role="status"><div className="pc-stamp-seal"><Stamp size={31}/><strong>旅程已收录</strong><span>ORDER CREATED</span></div><p>正在打开我的模拟订单…</p></div>}
    {previewOpen&&<PrintPreviewOverlay journal={journal} config={config} mediaUrls={mediaUrls} onClose={()=>setPreviewOpen(false)}/>}
    <p className="pc-disclaimer">✳ 此页面为课程设计演示：模拟定制、价格与订单，不提供真实印刷、支付及物流服务。</p>
  </div>;
}
