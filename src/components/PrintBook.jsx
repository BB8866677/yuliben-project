import { SITE_BASE } from '../data/siteBase.js';
import React,{useEffect,useRef} from 'react';
import {renderPrintCover} from '../data/printCoverArt.js';
import {BOARD_H,BOARD_W,ensureEditorForPage} from '../data/journalEditor.js';
import {getJournalSticker} from '../data/journalStickers.js';

export const SKETCH_COVER=(SITE_BASE + 'images/journal-master/lake-sketch.svg');
export function coverArtwork(destination=''){
  const value=String(destination||'');
  if(value.includes('杭州'))return SKETCH_COVER;
  return (SITE_BASE + 'images/feature-illustrations/planning-banner.png');
}
const fallbackScenes={
  'photo-0':(SITE_BASE + 'images/journal-master/westlake-main.jpg'),
  'photo-1':(SITE_BASE + 'images/journal-master/westlake-details.jpg'),
  'photo-2':(SITE_BASE + 'images/journal-master/westlake-water.jpg'),
  'photo-3':(SITE_BASE + 'images/journal-demo-sketch/sketch-4.svg')
};
export function PrintCoverFlat({journal,config,mediaUrls={},small=false}){
  const canvasRef=useRef(null);
  const mediaUrl=config?.coverMediaId&&mediaUrls[config.coverMediaId]||null;
  useEffect(()=>{
    let alive=true;
    renderPrintCover(config,journal,mediaUrl,{width:small?384:768,height:config?.size==='square'?(small?384:768):(small?512:1024)}).then(rendered=>{
      if(!alive||!canvasRef.current)return;
      const c=canvasRef.current;c.width=rendered.width;c.height=rendered.height;
      c.getContext('2d').drawImage(rendered,0,0);
    });
    return()=>{alive=false};
  },[journal?.id,journal?.title,config?.coverTemplate,config?.coverTitle,config?.coverSubtitle,config?.coverMediaId,config?.material,config?.size,mediaUrl]);
  return <div className={`pc-cover pc-cover--${config?.material||'linen'} pc-cover--art ${small?'pc-cover--small':''}`}>
    <canvas ref={canvasRef} aria-label={`${config?.coverTitle||journal?.title||'旅行纪念册'} · 精美封面设计`}/>
  </div>;
}

function PrintLayer({item,mediaUrls,destination,template}){
  if(item.hiddenInTemplate)return null;
  const css={left:`${item.x/BOARD_W*100}%`,top:`${item.y/BOARD_H*100}%`,width:`${item.w/BOARD_W*100}%`,height:`${item.h/BOARD_H*100}%`,transform:`rotate(${item.rotation||0}deg)`};
  if(item.kind==='photo'){
    const mediaSrc=item.mediaId&&mediaUrls[item.mediaId];
    const sketchSrc=template==='sage-minimal'&&item.role==='photo-2'?(SITE_BASE + 'images/journal-master/westlake-water.jpg'):
      String(destination).includes('杭州')?fallbackScenes[item.role]:`${SITE_BASE}images/journal-demo-sketch/sketch-${(Number(item.role?.slice(-1))||0)+1}.svg`;
    return <span className={`je-board-item je-board-item--photo je-board-item--${item.role} pc-layer`} style={css}><img src={mediaSrc||sketchSrc||fallbackScenes['photo-0']} alt={mediaSrc?'旅行照片':'手绘旅行示意'} draggable={false}/></span>;
  }
  if(item.kind==='art')return <span className={`je-board-item je-board-item--art je-board-item--${item.role} pc-layer`} style={css}><img className="je-handmade-art" src={item.src} alt="手绘素材" draggable={false}/></span>;
  if(item.kind==='sticker')return <span className={`je-board-item je-board-item--sticker je-board-item--${item.role} pc-layer`} style={css}><img className="je-sticker-art" src={getJournalSticker(item.sticker).src} alt="手账贴纸" draggable={false}/></span>;
  return <span className={`je-board-item je-board-item--text je-board-item--${item.role} pc-layer`} style={css}><span className={`je-layer-text je-layer-text--${item.variant||'body'}`} style={{fontSize:`${(item.fontSize||12)/BOARD_W*100}cqw`}}>{item.text||''}</span></span>;
}
/** 直接以第七页同一份图层坐标和纸张素材渲染，不裁切内容。 */
export function PrintPageSnapshot({page,destination,mediaUrls={}}){
  const editor=ensureEditorForPage(page).editor;
  return <div className={`je-board je-board--${editor.template||'warm-sketch'} pc-page-snapshot`} aria-label={`${page.title||'旅行手账'}的内页预览`}>
    <div className="je-board__paper-lines"/><div className="je-board__binding"/><div className="je-board__top-legend">YULIBEN JOURNAL</div>
    {editor.items.map(item=><PrintLayer key={item.id} item={item} mediaUrls={mediaUrls} destination={destination} template={editor.template}/>)}
    <div className="je-board__folio">— {page.day||1} —</div>
  </div>;
}
