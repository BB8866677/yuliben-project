import { SITE_BASE } from '../data/siteBase.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate,useParams} from 'react-router-dom';
import {
  ArrowLeft,ArrowRight,BookOpen,Check,ChevronLeft,ChevronRight,
  ImagePlus,Layers,Minus,MoreHorizontal,Move,Plus,Redo2,Save,
  SlidersHorizontal,Sparkles,Trash2,Type,Undo2,UploadCloud,X,ZoomIn
} from 'lucide-react';
import {findJournalById,saveJournalDraft} from '../data/journalDraft.js';
import {getJournalMedia,storeJournalMedia,newMediaId} from '../data/journalMedia.js';
import {BOARD_H,BOARD_W,EDITOR_TEMPLATES,createItemId,ensureEditorForPage,makeBlankPage,normalizeItem,reflowForTemplate} from '../data/journalEditor.js';
import {JOURNAL_STICKERS,STICKER_CATEGORIES,getJournalSticker,stickersForCategory} from '../data/journalStickers.js';

const templateName=id=>EDITOR_TEMPLATES.find(t=>t.id===id)?.name||'DAY 单日手账';
const int=(value,min,max)=>Math.min(max,Math.max(min,value));
const layerLabel=item=>item.kind==='photo'?'旅行照片':item.kind==='sticker'?'手账贴纸':item.kind==='art'?'手绘插画':'手写文字';
function StickerArt({type='doodle-flower'}){
  const sticker=getJournalSticker(type);
  return <img className="je-sticker-art" src={sticker.src} draggable="false" alt={sticker.name}/>;
}
const defaultSketches={
  'photo-0':(SITE_BASE + 'images/journal-demo-sketch/sketch-1.svg'),
  'photo-1':(SITE_BASE + 'images/journal-demo-sketch/sketch-2.svg'),
  'photo-2':(SITE_BASE + 'images/journal-demo-sketch/sketch-3.svg'),
  'photo-3':(SITE_BASE + 'images/journal-demo-sketch/sketch-4.svg')
};
const seaWatercolorSketches={
  'photo-0':(SITE_BASE + 'images/journal-demo-sketch/sketch-1.svg'),
  'photo-1':(SITE_BASE + 'images/journal-demo-sketch/sketch-3.svg'),
  'photo-2':(SITE_BASE + 'images/journal-master/westlake-water.jpg'),
  'photo-3':(SITE_BASE + 'images/journal-demo-sketch/sketch-4.svg')
};
const approvedHangzhouSketches={
  'photo-0':(SITE_BASE + 'images/journal-master/westlake-main.jpg'),
  'photo-1':(SITE_BASE + 'images/journal-master/westlake-details.jpg'),
  'photo-2':(SITE_BASE + 'images/journal-master/westlake-water.jpg'),
  'photo-3':(SITE_BASE + 'images/journal-demo-sketch/sketch-4.svg')
};
function PageIllustration({mediaId,mediaUrls,role,destination,template}){
  const url=mediaId&&mediaUrls[mediaId];
  if(url)return <img src={url} draggable="false" alt="用户上传的旅行照片"/>;
  const scenes=template==='sage-minimal'?seaWatercolorSketches:String(destination||'').includes('杭州')?approvedHangzhouSketches:defaultSketches;
  return <div className="je-placeholder-image"><img src={scenes[role]||(SITE_BASE + 'images/journal-creation-watercolor.jpg')} draggable="false" alt="可替换的手绘旅行示意插画"/><span>手绘示意 · 点选后替换</span></div>;
}
function TemplateThumb({template}){
  return <span className={`je-template-thumb je-template-thumb--${template.id}`} aria-hidden="true">
    <img className="je-template-visual" src={`${SITE_BASE}images/template-previews/${template.id}.jpg`} alt="" draggable="false"/>
  </span>;
}

function BoardItem({item,selected,preview,mediaUrls,destination,template,onPointerStart,onKeyLayer}){
  if(item.hiddenInTemplate)return null;
  const [x,y,w,h]=[item.x,item.y,item.w,item.h];
  const css={left:`${x/BOARD_W*100}%`,top:`${y/BOARD_H*100}%`,width:`${w/BOARD_W*100}%`,height:`${h/BOARD_H*100}%`,transform:`rotate(${item.rotation||0}deg)`,zIndex:selected?30:undefined};
  const content=item.kind==='photo'?<PageIllustration mediaId={item.mediaId} mediaUrls={mediaUrls} role={item.role} destination={destination} template={template}/>:item.kind==='sticker'?<StickerArt type={item.sticker}/>:item.kind==='art'?<img className="je-handmade-art" src={item.src} alt="独立手绘装饰" draggable="false"/>:<div className={`je-layer-text je-layer-text--${item.variant||'body'}`} style={{fontSize:`${(item.fontSize||15)/BOARD_W*100}cqw`,opacity:item.placeholder ? 0.68 : 1}}>{item.text}</div>;
  return <div className={`je-board-item je-board-item--${item.kind} je-board-item--${item.role} ${selected&&!preview?'is-selected':''} ${item.placeholder?'is-placeholder':''}`} style={css} role={preview?undefined:'button'} tabIndex={preview?-1:0} aria-label={`${layerLabel(item)}：${item.kind==='text'?item.text:'点击选中并拖动'}`} onPointerDown={preview?undefined:e=>onPointerStart(e,item,'move')} onKeyDown={preview?undefined:e=>onKeyLayer(e,item)}>
    {content}
    {selected&&!preview&&<><span className="je-selection-tag">{layerLabel(item)}</span><button type="button" className="je-resize-handle" aria-label="拖动调整大小" onPointerDown={e=>onPointerStart(e,item,'resize')}><ZoomIn size={13}/></button></>}
  </div>;
}

function EmptyJournal({navigate}){return <div className="journal-preview-empty"><BookOpen size={42}/><h1>还没有找到这本手账</h1><p>请先从一份保存过的旅行计划生成手账初稿。</p><button type="button" onClick={()=>navigate('/journal/create')}>去生成旅行手账 <ArrowRight size={16}/></button></div>}

export default function JournalEditorPage(){
  const {id}=useParams(),navigate=useNavigate();
  const [doc,setDoc]=useState(()=>{
    const initial=findJournalById(id);
    return initial?{...initial,pages:(initial.pages?.length?initial.pages:[makeBlankPage(0)]).map(ensureEditorForPage)}:null;
  });
  const docRef=useRef(doc);
  const undoStack=useRef([]),redoStack=useRef([]);
  const [activePage,setActivePage]=useState(0);
  const [selected,setSelected]=useState(null);
  const [panel,setPanel]=useState('');
  const [dockHost,setDockHost]=useState(null);
  const [zoom,setZoom]=useState(100);
  const [stickerCategory,setStickerCategory]=useState('all');
  const [preview,setPreview]=useState(false);
  const [notice,setNotice]=useState('');
  const [mediaUrls,setMediaUrls]=useState({});
  const [mediaRevision,setMediaRevision]=useState(0);
  const fileInput=useRef(null);
  const pendingUpload=useRef({kind:'add',itemId:null,pageIndex:0});
  const drag=useRef(null);
  const canvasRef=useRef(null);
  const page=doc?.pages?.[activePage],editor=page?.editor;
  const selectedItem=editor?.items.find(item=>item.id===selected)||null;
  const mediaIds=useMemo(()=>doc?.pages?.flatMap(p=>[...(p.photos||[]),...(p.tickets||[]),...(p.editor?.items||[]).filter(x=>x.mediaId).map(x=>({id:x.mediaId}))]).map(x=>x.id).filter(Boolean).sort().join('|')||'',[doc]);

  const directDoc=next=>{docRef.current=next;setDoc(next)};
  const afterEdit=()=>{redoStack.current=[]};
  const commit=mutator=>{
    const old=docRef.current;
    if(!old)return;
    const next=mutator(old);
    if(!next||next===old)return;
    undoStack.current.push(old);if(undoStack.current.length>40)undoStack.current.shift();
    afterEdit();directDoc(next);
  };
  const updatePage=(fn,pageIndex=activePage)=>commit(current=>({...current,pages:current.pages.map((p,i)=>i===pageIndex?fn(p):p)}));
  const updateSelected=(fn)=>{
    if(!selected)return;
    updatePage(p=>{
      const items=p.editor.items.map(it=>it.id===selected?fn(it):it);
      const edited=items.find(it=>it.id===selected);
      const linked=edited?.kind==='text'&&edited.role==='note'?{note:edited.text}:edited?.kind==='text'&&edited.role==='title'?{title:edited.text}:{};
      return {...p,...linked,editor:{...p.editor,items}};
    });
  };
  const notify=message=>setNotice(message);
  const undo=()=>{if(!undoStack.current.length)return;const previous=undoStack.current.pop();redoStack.current.push(docRef.current);directDoc(previous);setSelected(null);notify('已撤销上一步')};
  const redo=()=>{if(!redoStack.current.length)return;const next=redoStack.current.pop();undoStack.current.push(docRef.current);directDoc(next);setSelected(null);notify('已恢复上一步')};

  // 工具浮层挂载在手机屏幕内部，而非相对浏览器视口定位。
  useEffect(()=>{setDockHost(document.querySelector('.app-screen--editor'))},[]);
  useEffect(()=>{
    const fresh=findJournalById(id);
    directDoc(fresh?{...fresh,pages:(fresh.pages?.length?fresh.pages:[makeBlankPage(0)]).map(ensureEditorForPage)}:null);
    setActivePage(0);setSelected(null);setPanel('');undoStack.current=[];redoStack.current=[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[id]);
  useEffect(()=>{
    if(doc&&activePage>=doc.pages.length){setActivePage(Math.max(0,doc.pages.length-1));setSelected(null)}
  },[doc,activePage]);
  useEffect(()=>{if(!doc)return;const t=setTimeout(()=>{try{saveJournalDraft(doc)}catch{setNotice('本地存储空间不足，无法自动保存')}},400);return()=>clearTimeout(t)},[doc]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),2500);return()=>clearTimeout(t)},[notice]);
  useEffect(()=>{
    if(!mediaIds)return;
    let alive=true;const created=[];
    Promise.all([...new Set(mediaIds.split('|'))].map(async key=>{
      try{const blob=await getJournalMedia(key);if(blob?.type?.startsWith('image/')){const url=URL.createObjectURL(blob);created.push(url);return [key,url]}}catch{}
      return null;
    })).then(rows=>{if(alive)setMediaUrls(Object.fromEntries(rows.filter(Boolean)))});
    return()=>{alive=false;created.forEach(url=>URL.revokeObjectURL(url))};
  },[mediaIds,mediaRevision]);
  useEffect(()=>{
    const onKey=e=>{
      const target=e.target;
      if(target?.closest?.('input,textarea,[contenteditable]'))return;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  });

  function onPointerStart(e,item,mode){
    if(e.button!==undefined&&e.button!==0)return;
    e.stopPropagation();e.preventDefault();setSelected(item.id);
    const rect=canvasRef.current?.getBoundingClientRect();
    if(!rect)return;
    drag.current={itemId:item.id,mode,startX:e.clientX,startY:e.clientY,rect,original:{...item},startDoc:docRef.current,pageIndex:activePage,moved:false};
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onBoardPointerMove(e){
    const op=drag.current;
    if(!op)return;
    const dx=(e.clientX-op.startX)/op.rect.width*BOARD_W;
    const dy=(e.clientY-op.startY)/op.rect.height*BOARD_H;
    if(Math.abs(dx)+Math.abs(dy)<1)return;
    op.moved=true;
    const next=normalizeItem(op.mode==='move'?{...op.original,x:op.original.x+dx,y:op.original.y+dy}:{...op.original,w:Math.max(30,op.original.w+dx),h:Math.max(24,op.original.h+dy)});
    const base=docRef.current;
    directDoc({...base,pages:base.pages.map((p,i)=>i!==op.pageIndex?p:{...p,editor:{...p.editor,items:p.editor.items.map(it=>it.id===op.itemId?next:it)}})});
  }
  function onBoardPointerEnd(){
    const op=drag.current;
    if(!op)return;
    drag.current=null;
    if(op.moved){undoStack.current.push(op.startDoc);if(undoStack.current.length>40)undoStack.current.shift();afterEdit()}
  }
  function onKeyLayer(e,item){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(item.id);return}
    if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteElement(item.id);return}
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
    if(keys[e.key]){
      e.preventDefault();setSelected(item.id);
      const [x,y]=keys[e.key],delta=e.shiftKey?10:3;
      updatePage(p=>({...p,editor:{...p.editor,items:p.editor.items.map(it=>
        it.id===item.id?normalizeItem({...it,x:it.x+x*delta,y:it.y+y*delta}):it
      )}}));
    }
  }
  function addElement(item){updatePage(p=>({...p,editor:{...p.editor,items:[...p.editor.items,normalizeItem({...item,id:createItemId(),rotation:0})]}}));setSelected(null)}
  function deleteElement(layerId=selected){if(!layerId)return;updatePage(p=>({...p,editor:{...p.editor,items:p.editor.items.filter(x=>x.id!==layerId)}}));setSelected(null);notify('已从画布移除（原始照片仍保留）')}
  function layerOrder(direction){
    if(!selected)return;
    updatePage(p=>{const items=[...p.editor.items],from=items.findIndex(x=>x.id===selected);if(from<0)return p;const to=int(from+direction,0,items.length-1);if(from===to)return p;const [element]=items.splice(from,1);items.splice(to,0,element);return {...p,editor:{...p.editor,items}}});
  }
  function addText(){const item={kind:'text',role:'custom',x:45,y:560,w:260,h:62,text:'在这里写下一段旅行回忆',fontSize:18,variant:'body'};addElement(item);setPanel('');notify('文字已放到画布上，点击后可修改')}
  function addSticker(id){
    const sticker=getJournalSticker(id);
    const w=sticker.category==='tape'?138:sticker.category==='paper'?sticker.ratio>2?132:125:sticker.category==='frame'?145:66;
    const h=sticker.category==='tape'?39:sticker.category==='paper'?sticker.ratio>2?44:95:sticker.category==='frame'?110:66;
    addElement({kind:'sticker',role:'custom',sticker:id,x:Math.round((BOARD_W-w)/2),y:Math.round((BOARD_H-h)/2),w,h});
    setPanel('');notify('贴纸已放入画布，可以拖动、缩放和调整层级');
  }
  function useSticker(id){
    if(selectedItem?.kind==='sticker'){updateSelected(it=>({...it,sticker:id}));setPanel('');notify('贴纸已更换')}else addSticker(id);
  }
  function chooseTemplate(id){updatePage(p=>({...p,editor:{...p.editor,template:id,items:reflowForTemplate(p.editor.items,id,p)}}));setSelected(null);setPanel('');notify(`已应用「${templateName(id)}」模板，原有素材已保留`)}
  function chooseExistingMedia(id,replace=false){
    if(replace&&selectedItem?.kind==='photo'){
      updateSelected(item=>({...item,mediaId:id}));
      notify('已更换这张照片');
    }else{
      // 优先填充模板的空白相片位置，避免新图片直接压在标题和其他照片上。
      const vacant=page?.editor?.items.find(item=>item.kind==='photo'&&item.role!=='custom'&&!item.hiddenInTemplate&&!item.mediaId);
      if(vacant){
        updatePage(p=>({...p,editor:{...p.editor,items:p.editor.items.map(item=>item.id===vacant.id?{...item,mediaId:id}:item)}}));
        notify('照片已填入手绘相框');
      }else{
        addElement({kind:'photo',role:'custom',mediaId:id,x:60,y:170,w:180,h:155});
        notify('照片已加入画布，可拖动调整');
      }
    }
    setPanel('');
  }
  function askUpload(replace=false){pendingUpload.current={kind:replace?'replace':'add',itemId:replace?selected:null,pageIndex:activePage};fileInput.current?.click()}
  async function handleFileUpload(e){
    const files=[...(e.target.files||[])];e.target.value='';if(!files.length||!docRef.current)return;
    const task={...pendingUpload.current};
    const allowed=['image/jpeg','image/png','image/webp','image/gif'];
    const targetPage=docRef.current.pages[task.pageIndex];
    const maxCount=task.kind==='replace'?1:Math.max(0,12-(targetPage?.photos?.length||0));
    const accepted=files.filter(f=>allowed.includes(f.type)&&f.size<=12*1024*1024).slice(0,Math.min(8,maxCount));
    if(accepted.length!==files.length)notify('仅支持 JPG/PNG/WebP/GIF，单张不超过12MB；每页素材最多12张');
    if(!accepted.length)return;
    const saved=[];
    for(const file of accepted){const id=newMediaId();try{await storeJournalMedia(id,file);saved.push({id,name:file.name,type:file.type,size:file.size})}catch{notify('图片存储失败，请检查浏览器空间')}}
    if(!saved.length)return;
    const target=task.pageIndex;
    commit(current=>({...current,pages:current.pages.map((p,i)=>{
      if(i!==target)return p;
      const existing=p.photos||[];
      const additional=saved;
      if(!additional.length)return p;
      const items=[...p.editor.items];
      const replaceAt=task.kind==='replace'?items.findIndex(item=>item.id===task.itemId&&item.kind==='photo'):-1;
      const oldMedia=replaceAt>=0?items[replaceAt].mediaId:null;
      if(replaceAt>=0)items[replaceAt]={...items[replaceAt],mediaId:additional[0].id};
      else {
        for(const [ix,asset] of additional.entries()){
          const vacant=items.findIndex(item=>item.kind==='photo'&&item.role!=='custom'&&!item.hiddenInTemplate&&!item.mediaId);
          if(vacant>=0)items[vacant]={...items[vacant],mediaId:asset.id};
          else items.push(normalizeItem({id:createItemId(),kind:'photo',role:'custom',x:40+(ix%3)*17,y:155+(ix%3)*19,w:175,h:135,rotation:ix%2?1:-1,mediaId:asset.id}));
        }
      }
      let photos=existing;
      if(replaceAt>=0&&existing.length>=12){
        // 达到上限时替换本页的旧照片引用；旧Blob暂不清除，供撤销恢复。
        const ix=existing.findIndex(x=>x.id===oldMedia);
        photos=ix>=0?existing.map((m,i)=>i===ix?additional[0]:m):existing;
      }else photos=[...existing,...additional].slice(0,12);
      return {...p,photos,editor:{...p.editor,items}};
    })}));
    setMediaRevision(n=>n+1);setPanel('');notify('图片已收进旅行手账');
  }
  function addPage(){
    const newIndex=docRef.current.pages.length;
    const page=ensureEditorForPage(makeBlankPage(newIndex));
    commit(current=>({...current,pages:[...current.pages,page]}));setActivePage(newIndex);setSelected(null);setPanel('');notify('已添加一张空白手账页');
  }
  function removePage(){
    if(docRef.current.pages.length<=1){notify('至少要保留一张手账页');setPanel('');return}
    commit(current=>({...current,pages:current.pages.filter((_,i)=>i!==activePage)}));
    setActivePage(Math.max(0,activePage-1));setSelected(null);setPanel('');notify('已删除当前手账页（原始行程未受影响）');
  }
  function switchPage(direction){setActivePage(x=>int(x+direction,0,(docRef.current?.pages.length||1)-1));setSelected(null);setPanel('');setPreview(false)}
  function manualSave(){try{const saved=saveJournalDraft(docRef.current);directDoc(saved);notify('✳ 已收录到游历本');return true}catch{notify('保存失败：请检查本地存储空间');return false}}
  const closePanel=()=>setPanel('');
  if(!doc)return <EmptyJournal navigate={navigate}/>;
  if(!page||!editor)return <EmptyJournal navigate={navigate}/>;

  const editorDock=<div className="je-mobile-dock" aria-label="手账底部编辑区域">
    {!preview&&<>
      <div className="je-main-tools" role="toolbar" aria-label="手账编辑工具">
        {[
          {id:'templates',Icon:Layers,label:'版式'},
          {id:'photos',Icon:ImagePlus,label:'图片'},
          {id:'text',Icon:Type,label:'文字'},
          {id:'stickers',Icon:Sparkles,label:'贴纸'},
          {id:'more',Icon:MoreHorizontal,label:'更多'}
        ].map(t=><button key={t.id} type="button" className={panel===t.id?'is-active':''} aria-pressed={panel===t.id} aria-controls="je-tool-sheet" onClick={()=>{setPanel(x=>x===t.id?'':t.id)}}><t.Icon size={19}/><span>{t.label}</span></button>)}
      </div>
      {selectedItem&&!panel&&<section className="je-selected-panel" aria-label="当前素材属性"><div className="je-selected-panel__heading"><strong><SlidersHorizontal size={14}/>正在编辑：{layerLabel(selectedItem)}</strong><button type="button" onClick={()=>setSelected(null)}><X size={15}/></button></div>
        {selectedItem.kind==='text'&&<><label htmlFor="je-text-input">文字内容</label><textarea id="je-text-input" rows={3} value={selectedItem.text||''} onChange={e=>updateSelected(it=>({...it,text:e.target.value,placeholder:false,systemText:false}))}/><div className="je-property-row"><button type="button" onClick={()=>updateSelected(it=>({...it,fontSize:int((it.fontSize||15)-2,9,40)}))}><Minus size={14}/>字号</button><span>{selectedItem.fontSize||15}</span><button type="button" onClick={()=>updateSelected(it=>({...it,fontSize:int((it.fontSize||15)+2,9,40)}))}><Plus size={14}/>字号</button></div></>}
        {selectedItem.kind==='photo'&&<div className="je-property-row"><button type="button" onClick={()=>setPanel('photos')}>从素材中替换</button><button type="button" onClick={()=>askUpload(true)}><UploadCloud size={14}/>上传替换</button></div>}
        {selectedItem.kind==='art'&&<p className="je-panel-hint">手绘路线或插画是独立图层，可以拖动、缩放、调整层级或移除。</p>}
        {selectedItem.kind==='sticker'&&<div className="je-sticker-selected"><StickerArt type={selectedItem.sticker}/><div><strong>{getJournalSticker(selectedItem.sticker).name}</strong><p>贴纸可以拖动、缩放，也可以从素材库更换。</p><button type="button" onClick={()=>{setStickerCategory('all');setPanel('stickers')}}>从 {JOURNAL_STICKERS.length} 枚素材中更换</button><button type="button" onClick={()=>{setSelected(null);setPanel('stickers')}}>另外添加贴纸</button></div></div>}
        <div className="je-property-row"><button type="button" onClick={()=>layerOrder(1)}><Layers size={13}/>上移一层</button><button type="button" onClick={()=>layerOrder(-1)}>下移一层</button><button type="button" className="je-danger" onClick={()=>deleteElement()}><Trash2 size={13}/>移除</button></div>
      </section>}
      {panel&&<section id="je-tool-sheet" className="je-tool-panel" aria-label="手账工具选项"><div className="je-tool-panel__heading"><strong>{({templates:'选择真实手账版式',photos:'添加或替换照片',text:'添加旅行文字',stickers:'手账贴纸素材库',more:'更多编辑工具',pages:'管理手账页面','confirm-delete':'删除页面确认'})[panel]}</strong><button type="button" onClick={closePanel} aria-label="关闭工具面板"><X size={17}/></button></div>
        {panel==='templates'&&<><p className="je-panel-hint je-panel-lead">四套模板已分别重绘：蓝笔 DAY 日记、海风水彩、城市速写和牛皮纸回顾。每套都会自动填入行程、照片位和随笔。切换版式不会清空用户照片、文字或贴纸。未上传照片时显示独立的示意插画，并非真实到访照片。</p><div className="je-template-grid">{EDITOR_TEMPLATES.map(t=><button type="button" key={t.id} className={editor.template===t.id?'is-active':''} onClick={()=>chooseTemplate(t.id)}><TemplateThumb template={t}/><strong>{t.name}</strong><small>{t.caption}</small>{editor.template===t.id&&<Check size={13}/>}</button>)}</div></>}
        {panel==='photos'&&<><button type="button" className="je-upload-button" onClick={()=>askUpload(Boolean(selectedItem?.kind==='photo'))}><UploadCloud size={17}/>从手机相册选择照片</button><p className="je-panel-hint">已收集的照片可以重复使用；原始旅行素材不会因移除画布图层而删除。</p><div className="je-media-picker">{(page.photos||[]).filter(x=>(x.type||'').startsWith('image/')).map(item=><button key={item.id} type="button" title={item.name} onClick={()=>chooseExistingMedia(item.id,selectedItem?.kind==='photo')}>
        {mediaUrls[item.id]?<img src={mediaUrls[item.id]} alt={item.name}/>:<ImagePlus size={22}/>}</button>)}{!page.photos?.length&&<p>这一天暂时没有照片，可以点击上方上传。</p>}</div></>}
        {panel==='text'&&<div className="je-tool-cta"><p>添加后可选中文字，改写内容、调整字号、拖动到画布任意位置。</p><button type="button" onClick={addText}><Plus size={16}/>添加文字</button></div>}
        {panel==='stickers'&&<>
          <div className="je-sticker-library-head"><span>贴纸素材库</span><em>{JOURNAL_STICKERS.length} PIECES · 手绘 & 纸张素材</em></div>
          <div className="je-sticker-categories" role="group" aria-label="贴纸分类">{STICKER_CATEGORIES.map(c=><button key={c.id} type="button" className={stickerCategory===c.id?'is-active':''} onClick={()=>setStickerCategory(c.id)}>{c.name}</button>)}</div>
          <p className="je-panel-hint">{selectedItem?.kind==='sticker'?'点击贴纸可替换当前选中的装饰；点击上方「另外添加贴纸」即可新增。':'点击喜欢的素材，它就会出现在画布中央。所有素材都能自由拖动、缩放、删除。'}</p>
          <div className="je-sticker-picker">{stickersForCategory(stickerCategory).map(s=><button key={s.id} type="button" title={s.name} onClick={()=>useSticker(s.id)}><StickerArt type={s.id}/><span>{s.name}</span></button>)}</div>
          </>}
        {panel==='more'&&<div className="je-more-grid">
          <button type="button" onClick={()=>setPanel('pages')}><BookOpen size={19}/><span><strong>页面管理</strong><small>添加或删除手账页</small></span><ChevronRight size={15}/></button>
          <button type="button" onClick={()=>{undo();closePanel()}} disabled={!undoStack.current.length}><Undo2 size={19}/><span><strong>撤销</strong><small>返回上一步编辑</small></span></button>
          <button type="button" onClick={()=>{redo();closePanel()}} disabled={!redoStack.current.length}><Redo2 size={19}/><span><strong>重做</strong><small>恢复撤销的操作</small></span></button>
          <button type="button" onClick={()=>{setZoom(100);closePanel();notify('画布已适配手机宽度')}}><ZoomIn size={19}/><span><strong>适合屏幕</strong><small>画布恢复 100% 显示</small></span></button>
        </div>}
        {panel==='pages'&&<div className="je-page-manager"><button type="button" onClick={addPage}><Plus size={16}/>新增空白页面</button><button type="button" className="je-danger" onClick={()=>setPanel('confirm-delete')}><Trash2 size={15}/>删除当前页</button><p>删除只影响这本手账，不影响之前规划的行程。</p></div>}
        {panel==='confirm-delete'&&<div className="je-page-manager"><p>确定删除当前的第 {activePage+1} 页？这一步可以使用“撤销”恢复。</p><div><button type="button" onClick={()=>setPanel('pages')}>取消</button><button type="button" className="je-danger" onClick={removePage}>确认删除</button></div></div>}
      </section>}
    </>}
  </div>;

  return <div className="je-page">
    <div className="je-heading"><div><span className="journal-overline">THE ART OF KEEPING MEMORIES / 07</span><h1>把旅途，贴成一本书</h1><p>{doc.destination} · {doc.pages.length} 页可自由创作的旅行手账</p></div><button type="button" className="je-save" onClick={manualSave}><Save size={15}/>保存</button></div>
    <div className="je-workspace"><section className="je-workspace-main">
    <div className="je-subheader"><div><span>TRAVEL DIARY</span><strong>第 {activePage+1} 页 · {templateName(editor.template)}</strong></div><div className="je-history"><button type="button" aria-label="撤销" disabled={!undoStack.current.length} onClick={undo}><Undo2 size={17}/></button><button type="button" aria-label="重做" disabled={!redoStack.current.length} onClick={redo}><Redo2 size={17}/></button></div></div>
    <div className="je-top-tip"><Move size={14}/><span>已导入行程 · 点选素材编辑 · 放大后在画布内查看</span></div>
    <div className={`je-board-surround ${preview?'is-preview':''}`} style={{'--je-zoom':zoom/100}}>
      <div key={`${activePage}-${editor.template}`} className={`je-board je-board--${editor.template}`} style={{width:`${zoom}%`}} ref={canvasRef} onPointerMove={onBoardPointerMove} onPointerUp={onBoardPointerEnd} onPointerCancel={onBoardPointerEnd} onPointerDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
        <div className="je-board__paper-lines" aria-hidden="true"/>
        <div className="je-board__binding" aria-hidden="true"/>
        <div className="je-board__top-legend" aria-hidden="true">YULIBEN JOURNAL</div>
        {editor.items.map((item,index)=><BoardItem key={item.id} item={item} selected={selected===item.id} preview={preview} mediaUrls={mediaUrls} destination={doc.destination} template={editor.template} onPointerStart={onPointerStart} onKeyLayer={onKeyLayer}/>)}
        <div className="je-board__folio" aria-hidden="true">— {activePage+1} —</div>
      </div>
      {preview&&<div className="je-preview-caption">预览模式 · 隐藏编辑控制点</div>}
    </div>
    <div className="je-zoom-control"><span>页内缩放</span><button type="button" onClick={()=>setZoom(v=>Math.max(75,v-25))} aria-label="缩小画布"><Minus size={14}/></button><strong>{zoom}%</strong><button type="button" onClick={()=>setZoom(v=>Math.min(150,v+25))} aria-label="放大画布"><Plus size={14}/></button><button type="button" onClick={()=>setZoom(100)}>适合屏幕</button></div>
    <div className="je-pages-control"><button type="button" aria-label="上一页" disabled={activePage===0} onClick={()=>switchPage(-1)}><ChevronLeft size={19}/></button><span>第 {activePage+1} / {doc.pages.length} 页</span><button type="button" aria-label="下一页" disabled={activePage===doc.pages.length-1} onClick={()=>switchPage(1)}><ChevronRight size={19}/></button><button type="button" className="je-pages-add" onClick={addPage}><Plus size={15}/>新页</button><button type="button" className={preview?'is-active':''} onClick={()=>{setPreview(x=>!x);setSelected(null);closePanel()}}>{preview?'退出预览':'预览'}</button></div>
    </section><aside className="je-workspace-side" aria-label="手账创作工具">

    <div className="je-actions"><button type="button" className="je-back" onClick={()=>navigate('/journal/create',{state:{tripId:doc.tripId}})}><ArrowLeft size={16}/>返回补充素材</button><button type="button" className="je-next" onClick={()=>{if(manualSave())navigate('/print/customize',{state:{journalId:doc.id}})}}>制作实体手账 <ArrowRight size={16}/></button></div>
    <p className="je-demo-label">根据已保存的旅行路线生成前瞻性文字；没有上传照片时使用手绘示意图。标题、相框、路线、文字和涂鸦均可单独编辑。当前为规则生成的离线演示，无真实 AI 与云同步。</p>
    </aside></div>
    <input ref={fileInput} className="je-hidden-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFileUpload}/>
    {notice&&<div className="je-toast" role="status"><Check size={14}/>{notice}</div>}
    {dockHost&&createPortal(editorDock,dockHost)}
  </div>;
}
