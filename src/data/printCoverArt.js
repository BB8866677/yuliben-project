import { SITE_BASE } from './siteBase.js';
/**
 * 第八页文艺封面：以完整绘制的模板图为底图，用户旅行数据为可更新图层。
 * 同一张 Canvas 既用于平面订单预览，也用于 Three.js 的封面贴图。
 */
export const PRINT_COVERS={
 botanical:{label:'花间漫游',english:'BOTANICAL JOURNAL',src:(SITE_BASE + 'images/print-covers/botanical.jpg'),ink:'#3a554b',paper:'#f9f5e9',accent:'#839b87'},
 postcard:{label:'旧时光邮局',english:'POSTCARD COLLECTION',src:(SITE_BASE + 'images/print-covers/postcard.jpg'),ink:'#6f493c',paper:'#f7ead6',accent:'#b88d65'},
 seaside:{label:'海风来信',english:'LETTERS FROM THE SEA',src:(SITE_BASE + 'images/print-covers/seaside.jpg'),ink:'#34647b',paper:'#eff8f8',accent:'#77b0c2'},
 city:{label:'城市漫游图鉴',english:'CITY WALK ARCHIVE',src:(SITE_BASE + 'images/print-covers/city.jpg'),ink:'#434d4c',paper:'#f4f0e6',accent:'#8b968d'}
};
export const DEFAULT_PRINT_COVER='botanical';
export const getCoverTheme=id=>PRINT_COVERS[id]||PRINT_COVERS[DEFAULT_PRINT_COVER];
const safe=s=>String(s||'').replace(/[\n\r\t]+/g,' ').trim();
export function coverText(journal,config){
 const destination=safe(journal?.destination)||'旅途';
 return {
  title:safe(config?.coverTitle)||safe(journal?.title)||`${destination}旅行手记`,
  subtitle:safe(config?.coverSubtitle)||'把每一次出发，写成自己的故事',
  location:destination,
  date:safe(journal?.tripMeta?.startDate)||safe(journal?.startDate)||safe(journal?.pages?.[0]?.date)||'MY LITTLE JOURNEY'
 };
}
export function loadCoverImage(url){
 return new Promise(resolve=>{
  if(!url){resolve(null);return;}
  const img=new Image();img.crossOrigin='anonymous';
  img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url;
 });
}
const rounded=(ctx,x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r)};
function drawCoverFit(ctx,img,x,y,w,h){
 const r=Math.max(w/img.width,h/img.height), iw=img.width*r,ih=img.height*r;
 ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
}
function centerWrappedText(ctx,title,maxWidth,maxLines=2){
 const chars=[...title];const lines=[];let current='';
 for(const ch of chars){const trial=current+ch;if(ctx.measureText(trial).width>maxWidth&&current){lines.push(current);current=ch;}else current=trial;}
 if(current)lines.push(current);
 return lines.slice(0,maxLines).map((l,i,a)=>i===a.length-1&&lines.length>maxLines?`${[...l].slice(0,-1).join('')}…`:l);
}
/** Promise<canvas>; same painter is used for 3D geometry and order cards. */
export async function renderPrintCover(config,journal,mediaUrl,{width=768,height=1024}={}){
 const theme=getCoverTheme(config?.coverTemplate);
 const [art,photo]=await Promise.all([loadCoverImage(theme.src),loadCoverImage(mediaUrl)]);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d'); if(!ctx)return canvas;
 const W=width,H=height,unit=W/768;
 ctx.fillStyle=theme.paper;ctx.fillRect(0,0,W,H);
 if(art)drawCoverFit(ctx,art,0,0,W,H);
 // Subtle handmade paper overlay; don't obliterate the illustrated backgrounds.
 ctx.fillStyle='rgba(255,254,247,.10)';ctx.fillRect(0,0,W,H);
 // Bookbinding crease and delicate framing lines, built into the printable cover.
 const gradient=ctx.createLinearGradient(0,0,W*.08,0);gradient.addColorStop(0,'rgba(30,34,28,.24)');gradient.addColorStop(1,'transparent');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,W*.08,H);
 ctx.strokeStyle='rgba(100,92,72,.27)';ctx.lineWidth=2*unit;ctx.strokeRect(W*.065,H*.05,W*.87,H*.90);
 const {title,subtitle,location,date}=coverText(journal,config);
 // Photographic inset: it is optional. If not supplied, use the complete painted cover art.
 if(photo){
  const photoY=H*.53,photoH=H*.257;
  ctx.save();ctx.translate(W*.50,photoY+photoH*.5);ctx.rotate(-.025);
  ctx.fillStyle='rgba(65,55,42,.24)';ctx.fillRect(-W*.318+8*unit,-photoH*.5+9*unit,W*.636,photoH+25*unit);
  ctx.fillStyle='#fff9eb';ctx.fillRect(-W*.326,-photoH*.5-10*unit,W*.652,photoH+32*unit);
  ctx.save();ctx.beginPath();ctx.rect(-W*.306,-photoH*.5+2*unit,W*.612,photoH);ctx.clip();drawCoverFit(ctx,photo,-W*.306,-photoH*.5+2*unit,W*.612,photoH);ctx.restore();ctx.restore();
 }
 // Layer for hand lettering: illustration is visible around every edge.
 const panelY=H*.23, panelH=H*.265;
 ctx.save();ctx.shadowColor='rgba(65,54,42,.06)';ctx.shadowBlur=10*unit;
 ctx.fillStyle=config?.coverTemplate==='postcard'?'rgba(247,234,214,.81)':'rgba(255,253,245,.75)';
 rounded(ctx,W*.13,panelY,W*.74,panelH,9*unit);ctx.fill();ctx.restore();
 ctx.textAlign='center';ctx.fillStyle=theme.ink;
 ctx.font=`500 ${19*unit}px Georgia,serif`;ctx.fillText(theme.english,W*.50,panelY+39*unit,W*.65);
 ctx.strokeStyle=theme.accent;ctx.lineWidth=1.6*unit;ctx.beginPath();ctx.moveTo(W*.355,panelY+56*unit);ctx.lineTo(W*.645,panelY+56*unit);ctx.stroke();
 let size=title.length>13?47:title.length>9?54:67;
 ctx.font=`700 ${size*unit}px 'KaiTi','STKaiti','Noto Serif CJK SC',serif`;
 let lines=centerWrappedText(ctx,title,W*.65,2);
 if(lines.length>1)size=Math.min(size,52);
 ctx.font=`700 ${size*unit}px 'KaiTi','STKaiti','Noto Serif CJK SC',serif`;
 const lineHeight=size*1.2*unit, middle=panelY+150*unit;
 lines.forEach((t,i)=>ctx.fillText(t,W*.50,middle+(i-(lines.length-1)/2)*lineHeight,W*.67));
 ctx.font=`400 ${22*unit}px 'KaiTi','STKaiti','Noto Serif CJK SC',serif`;
 ctx.fillStyle=theme.ink;ctx.fillText(subtitle.length>28?subtitle.slice(0,27)+'…':subtitle,W*.5,H*.832,W*.76);
 ctx.font=`600 ${17*unit}px Georgia,serif`;ctx.fillText(`${location.toUpperCase()}  ·  ${date}`,W*.5,H*.877,W*.78);
 ctx.font=`600 ${17*unit}px Georgia,serif`;ctx.letterSpacing=`2px`;ctx.fillText('✳  YOULIBEN  /  TRAVEL MEMORIES',W*.5,H*.932,W*.82);
 return canvas;
}
