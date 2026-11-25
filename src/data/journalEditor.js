import { SITE_BASE } from './siteBase.js';
/**
 * 游历本手账编辑器 · 视觉母版 6.0
 * 设计坐标 360×640，严格接近用户认可的 941×1672 竖版比例。
 * 四套模板是真正不同的图文构图；每个文字、图片、路线、涂鸦均为独立图层。
 * 使用原模板 ID 保持对旧文档的兼容，迁移时保留用户文字、照片及自建素材。
 */
export const BOARD_W=360;
export const BOARD_H=640;
export const EDITOR_VISUAL_VERSION=6;
export const EDITOR_TEMPLATES=[
 {id:'warm-sketch',name:'蓝笔 DAY 旅行日记',en:'DAY BY DAY',caption:'蓝色手写体 · 西湖手绘 · 四张相片 · 路线和期待',type:'day'},
 {id:'sage-minimal',name:'海风水彩手记',en:'SEA & SKY',caption:'海盐色水彩 · 横幅主图 · 海边旅行小记',type:'sea'},
 {id:'color-collage',name:'城市随行涂鸦',en:'CITY WALK',caption:'暖白速写纸 · 城市线描 · 不规则图文记录',type:'city'},
 {id:'soft-watercolor',name:'旧纸旅行回顾',en:'THE TRIP RECAP',caption:'复古牛皮纸 · 邮戳票据 · 四格旅行回顾',type:'recap'}
];
export const createItemId=()=>`layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const clip=(v,min,max)=>Math.max(min,Math.min(max,v));
const rect=(x,y,w,h,rotation=0)=>({x,y,w,h,rotation});
const own=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
const templateName=id=>EDITOR_TEMPLATES.some(t=>t.id===id)?id:'warm-sketch';
/** 每张图都留有独立文字/图片区：装饰可以覆盖相纸边角，但不得覆盖大段文字。 */
const L={
 'warm-sketch':{
  'day-mark':rect(27,26,210,58),'date':rect(258,44,75,19),
  'title':rect(29,91,302,39),'subtitle':rect(29,140,301,22),
  'photo-0':rect(28,174,195,155,-1.3),'photo-1':rect(242,187,90,96,2),
  'photo-2':rect(242,304,91,83,-2),'photo-3':rect(29,357,195,95,1.4),
  'caption-0':rect(30,333,194,18),'caption-1':rect(240,399,94,18),
  'places':rect(29,469,290,20),'route-doodle':rect(30,494,300,30),
  'route-stop-0':rect(24,527,99,27),'route-stop-1':rect(130,527,101,27),'route-stop-2':rect(238,527,98,27),
  'paper-note':rect(24,567,313,58,-.4),'note':rect(38,577,287,42),'micro':rect(28,627,306,12),
  'tape-0':rect(81,162,63,19,-6),'tape-1':rect(260,177,54,18,4),
  'accent-0':rect(12,345,26,29,-6),'accent-1':rect(312,444,27,28,9),
  'art-lake':rect(243,424,84,39),'art-willow':rect(310,124,42,54,-8),
  'art-sparkles':rect(229,111,22,24),
 },
 'sage-minimal':{
  'day-mark':rect(28,26,214,53),'date':rect(250,41,82,17),
  'title':rect(29,92,303,40),'subtitle':rect(30,142,296,20),
  'photo-0':rect(29,174,301,163,-.9),'photo-1':rect(29,365,132,94,1.7),
  'photo-2':rect(182,365,148,94,-1.4),'caption-0':rect(30,341,296,19),
  'caption-1':rect(183,463,147,16),'places':rect(30,489,302,18),
  'route-doodle':rect(29,511,301,24),
  'route-stop-0':rect(24,537,101,24),'route-stop-1':rect(129,537,102,24),'route-stop-2':rect(235,537,101,24),
  'paper-note':rect(26,566,308,57,-1),'note':rect(39,578,283,37),'micro':rect(30,627,301,12),
  'tape-0':rect(132,164,69,18,-7),'tape-1':rect(248,354,63,18,6),
  'accent-0':rect(11,306,32,39,-5),'accent-1':rect(301,320,35,35,5),
  'art-lake':rect(285,111,49,47),'art-willow':rect(14,112,43,46),
  'art-sparkles':rect(221,100,35,25)
 },
 'color-collage':{
  'day-mark':rect(28,24,217,55),'date':rect(251,43,82,17),
  'title':rect(29,91,302,41),'subtitle':rect(30,141,298,19),
  'photo-0':rect(29,175,196,143,-1.7),'photo-1':rect(245,176,86,87,2.1),
  'photo-2':rect(244,276,88,89,-1.9),'photo-3':rect(29,376,129,104,1.1),
  'caption-0':rect(29,324,195,20),'caption-1':rect(243,370,90,17),
  'paper-note':rect(174,395,158,73,-.9),'note':rect(184,402,139,58),
  'places':rect(30,489,297,18),'route-doodle':rect(28,514,302,25),
  'route-stop-0':rect(23,539,101,24),'route-stop-1':rect(129,539,103,24),'route-stop-2':rect(235,539,99,24),
  'micro':rect(29,625,300,13),
  'tape-0':rect(80,166,63,18,-5),'tape-1':rect(263,166,52,18,7),
  'accent-0':rect(11,359,26,30,-6),'accent-1':rect(307,477,25,26,8),
  'art-lake':rect(29,578,100,43),'art-willow':rect(270,575,64,49,-8),
  'art-sparkles':rect(224,101,31,24)
 },
 'soft-watercolor':{
  'day-mark':rect(28,25,218,55),'date':rect(250,40,84,17),
  'title':rect(30,91,298,41),'subtitle':rect(29,143,301,19),
  'photo-0':rect(31,177,138,128,-1.2),'photo-1':rect(191,178,140,126,1.7),
  'photo-2':rect(31,340,138,104,1.5),'photo-3':rect(192,339,137,105,-1),
  'caption-0':rect(31,312,135,18),'caption-1':rect(192,453,138,17),
  'places':rect(30,480,298,18),'route-doodle':rect(30,505,300,28),
  'route-stop-0':rect(25,536,101,27),'route-stop-1':rect(131,536,100,27),'route-stop-2':rect(235,536,101,27),
  'paper-note':rect(27,565,305,60,.5),'note':rect(41,577,278,39),
  'micro':rect(29,628,300,11),
  'tape-0':rect(62,166,72,18,-6),'tape-1':rect(224,167,66,18,6),
  'accent-0':rect(318,110,26,30,4),'accent-1':rect(13,454,26,29,-9),
  'art-lake':rect(14,116,45,44),'art-willow':rect(291,118,44,46,-7),
  'art-sparkles':rect(155,111,39,26)
 }
};
const res=(SITE_BASE + 'images/journal-handmade-v13/');
const G={
 'warm-sketch':{'paper-note':'paper-ivory','tape-0':'tape-blue','tape-1':'tape-cream','accent-0':'watercolor-18','accent-1':'doodle-arrow','route-doodle':res+'ink-route.svg','art-lake':(SITE_BASE + 'images/journal-master/lake-sketch.svg'),'art-willow':(SITE_BASE + 'images/journal-master/willow-ink.svg'),'art-sparkles':(SITE_BASE + 'images/journal-master/sparkles-ink.svg')},
 'sage-minimal':{'paper-note':'paper-blue','tape-0':'tape-blue','tape-1':'tape-sage','accent-0':'doodle-shell','accent-1':'doodle-wave','route-doodle':res+'sea-route.svg','art-lake':res+'sea-boat.svg','art-willow':res+'sea-shell.svg','art-sparkles':res+'sea-sun.svg'},
 'color-collage':{'paper-note':'paper-grid','tape-0':'tape-check','tape-1':'tape-cream','accent-0':'doodle-camera','accent-1':'doodle-heart','route-doodle':res+'city-route.svg','art-lake':res+'city-houses.svg','art-willow':res+'city-lamp.svg','art-sparkles':res+'city-stars.svg'},
 'soft-watercolor':{'paper-note':'paper-ivory','tape-0':'tape-kraft','tape-1':'tape-cream','accent-0':'stamp-postmark','accent-1':'watercolor-03','route-doodle':res+'kraft-route.svg','art-lake':res+'kraft-ticket.svg','art-willow':res+'kraft-leaves.svg','art-sparkles':res+'kraft-star.svg'}
};
const mediaFor=(page,i)=>((page.photos||[]).filter(m=>(m.type||'').startsWith('image/'))[i]||{}).id||null;
export function normalizeItem(item){
 const w=clip(Number(item.w)||90,20,BOARD_W),h=clip(Number(item.h)||44,16,BOARD_H);
 return {...item,w,h,x:clip(Number(item.x)||0,0,BOARD_W-w),y:clip(Number(item.y)||0,0,BOARD_H-h)};
}
const cname=s=>String(s||'').trim();
const shortPlace=s=>cname(s).slice(0,12);
export function plannedJournalText(page){
 const names=(page.plannedStops||[]).map(s=>cname(s.name)).filter(Boolean);
 if(!names.length)return '把想去的地方记在这一页。沿途的风景与故事，还在等我们慢慢发现。';
 if(names.length===1)return `想去${names[0]}走一走，带着相机，给这一天留一段慢慢发现的时间。`;
 return `想先去${names[0]}走走，再到${names[1]}看看。${names[2]?`之后去${names[2]}慢慢逛。`:'剩下的时间留给沿途风景。'}`;
}
const styles={
 'warm-sketch':{sub:'画一张路线，把想去的地方收藏起来',micro:'PLANNED JOURNEY · 等待亲自出发'},
 'sage-minimal':{sub:'海风吹过时，把每个小期待都记下来',micro:'WAVES & LITTLE MEMORIES'},
 'color-collage':{sub:'走街串巷，把城市里的好奇心留下来',micro:'WALK · LOOK · COLLECT'},
 'soft-watercolor':{sub:'把这一程想看的风景收进旅行记录',micro:'THE LITTLE THINGS MATTER'}
};
function pageText(page,template){
 const d=styles[template]||styles['warm-sketch'];
 const stops=Array.isArray(page.plannedStops)?page.plannedStops:[];
 const visited=[...(page.visited||[]),page.extraVisited||''].filter(Boolean);
 const numbered=String(page.day||1).padStart(2,'0');
 const headline=template==='warm-sketch'?`DAY ${numbered}`:template==='sage-minimal'?`SEA DAY ${numbered}`:template==='color-collage'?`CITY WALK ${numbered}`:`TRIP NOTE ${numbered}`;
 const rawTitle=cname(page.title)||'沿途的慢慢时光';
 const date=page.date?String(page.date).replaceAll('-',' / '):'DATE TO BE WRITTEN';
 const content=cname(page.note)||plannedJournalText(page);
 const photoNotes=stops.slice(0,2).map((s,i)=>`${String(i+1).padStart(2,'0')} · ${shortPlace(s.name)}`);
 const routeStops=Array.from({length:3},(_,i)=>stops[i]?`${stops[i].time?stops[i].time+'  ':''}${shortPlace(stops[i].name).slice(0,7)}`:'＋ 待补充');
 return {
  'day-mark':{text:headline,variant:'day',fontSize:template==='warm-sketch'?46:template==='sage-minimal'?34:template==='color-collage'?32:28},
  'date':{text:date,variant:'date',fontSize:10},
  'title':{text:rawTitle,variant:'title',fontSize:rawTitle.length>10?23:rawTitle.length>6?27:31},
  'subtitle':{text:cname(page.plannedTheme)||d.sub,variant:'subtitle',fontSize:12},
  'caption-0':{text:photoNotes[0]||'01 · 想去的风景',variant:'caption',fontSize:11},
  'caption-1':{text:photoNotes[1]||'02 · 路上的发现',variant:'caption',fontSize:10},
  'places':{text:stops.length?'今日旅行路线  /  MY LITTLE ROUTE':'记录想去的地方  /  LITTLE ROUTE',variant:'route-title',fontSize:13},
  'route-stop-0':{text:routeStops[0],variant:'route-stop',fontSize:10.4},
  'route-stop-1':{text:routeStops[1],variant:'route-stop',fontSize:10.4},
  'route-stop-2':{text:routeStops[2],variant:'route-stop',fontSize:10.4},
  'note':{text:content,variant:'body',fontSize:12,systemText:!Boolean(cname(page.note))},
  'micro':{text:visited.length?`✓  实际到访：${visited.join(' · ')}`:d.micro,variant:'micro',fontSize:9.5}
 };
}
const photoRoles=['photo-0','photo-1','photo-2','photo-3'];
const decorRoles=['paper-note','tape-0','tape-1','accent-0','accent-1','route-doodle','art-lake','art-willow','art-sparkles'];
const textRoles=['day-mark','date','title','subtitle','caption-0','caption-1','places','route-stop-0','route-stop-1','route-stop-2','note','micro'];
const fixedRoles=[...photoRoles,...decorRoles,...textRoles];
function isFixedText(role){return !['title','date'].includes(role)}
export function createInitialElements(page,template='warm-sketch'){
 const t=templateName(template),layout=L[t],design=G[t],copy=pageText(page,t);
 const orders=['paper-note',...photoRoles,'tape-0','tape-1','accent-0','accent-1','route-doodle','art-lake','art-willow','art-sparkles',...textRoles];
 return orders.map(role=>{
  const hiddenInTemplate=!layout[role],common={id:createItemId(),role,hiddenInTemplate,...(layout[role]||rect(8,8,60,44))};
  if(photoRoles.includes(role))return normalizeItem({...common,kind:'photo',mediaId:mediaFor(page,photoRoles.indexOf(role))});
  if(own(design,role)){
   const ref=design[role];return normalizeItem(ref.startsWith('/')?{...common,kind:'art',src:ref,fixedDesign:true}:{...common,kind:'sticker',sticker:ref,fixedDesign:true});
  }
  return normalizeItem({...common,kind:'text',...copy[role],systemText:isFixedText(role)||(role==='note'&&!page.note)});
 });
}
const OLD_BASE_ROLES=new Set([...fixedRoles,'paper-header','paper-footer','paper-ticket','tape-2','accent-2','accent-3']);
function upgradeFromOld(page,saved){
 const template=templateName(saved.template);
 const items=createInitialElements(page,template);
 const roleMap=new Map((saved.items||[]).filter(x=>x.role!=='custom').map(x=>[x.role,x]));
 const migrated=items.map(item=>{
  const previous=roleMap.get(item.role);
  if(!previous||previous.kind!==item.kind)return item;
  const patch={id:previous.id};
  if(item.kind==='photo')patch.mediaId=previous.mediaId;
  if(item.kind==='text'){
   // 系统生成的旧默认文案更新；用户手动改写的内容/字号保留。
   const legacy=new Set(['a photo of the day','沿途收集的光影','SOMEWHERE, SOME DAY  /  旅行手记','WANDER · WONDER · REMEMBER']);
   if(previous.systemText===false && !previous.placeholder&&!legacy.has(previous.text)){
    patch.text=previous.text;patch.fontSize=previous.fontSize||item.fontSize;patch.systemText=false;
   }else if(!item.systemText&&previous.text&&!previous.placeholder&&!legacy.has(previous.text)){
    patch.text=previous.text;patch.fontSize=previous.fontSize||item.fontSize;
   }
  }
  return {...item,...patch};
 });
 const custom=(saved.items||[]).filter(x=>x.role==='custom'||!OLD_BASE_ROLES.has(x.role));
 return {...page,editor:{template,visualVersion:EDITOR_VISUAL_VERSION,items:[...migrated,...custom]}};
}
function syncWithSource(page){
 const e=page.editor;if(!e?.items)return page;
 const used=new Set(e.items.filter(x=>x.kind==='photo'&&x.mediaId).map(x=>x.mediaId));
 const unassigned=(page.photos||[]).filter(m=>(m.type||'').startsWith('image/')&&!used.has(m.id));
 const text=pageText(page,e.template);let changed=false;
 const items=e.items.map(it=>{
  if(it.kind==='photo'&&!it.mediaId&&unassigned.length){changed=true;return {...it,mediaId:unassigned.shift().id}}
  if(it.kind==='text'&&it.systemText&&text[it.role]?.text!==it.text){changed=true;return {...it,text:text[it.role].text}}
  return it;
 });
 return changed?{...page,editor:{...e,items}}:page;
}
export function ensureEditorForPage(page){
 const current=page.editor;
 if(current?.items?.length)return syncWithSource(current.visualVersion===EDITOR_VISUAL_VERSION?page:upgradeFromOld(page,current));
 return {...page,editor:{template:'warm-sketch',visualVersion:EDITOR_VISUAL_VERSION,items:createInitialElements(page)}};
}
export function reflowForTemplate(items,template,page=null){
 const t=templateName(template),layout=L[t],design=G[t],copy=page?pageText(page,t):{};
 return items.map(it=>{
  if(it.role==='custom')return it;
  if(!layout[it.role])return {...it,hiddenInTemplate:true};
  const graphic=own(design,it.role) ? (design[it.role].startsWith('/')?{kind:'art',src:design[it.role]}:{kind:'sticker',sticker:design[it.role]}) : {};
  const textStyle=it.kind==='text'&&copy[it.role]?{variant:copy[it.role].variant,fontSize:copy[it.role].fontSize}:{};
  const autoText=it.kind==='text'&&it.systemText&&copy[it.role]?{text:copy[it.role].text}:{};
  return normalizeItem({...it,...layout[it.role],hiddenInTemplate:false,...graphic,...textStyle,...autoText});
 });
}
export function makeBlankPage(index){return {id:`page-extra-${createItemId()}`,day:index+1,date:'',title:'新的一页 · 旅行手记',plannedStops:[],visited:[],extraVisited:'',note:'',photos:[],tickets:[],editor:null}}
