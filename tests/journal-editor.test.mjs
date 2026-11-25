import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {BOARD_W,BOARD_H,EDITOR_VISUAL_VERSION,EDITOR_TEMPLATES,ensureEditorForPage,reflowForTemplate,createInitialElements,makeBlankPage,plannedJournalText} from '../src/data/journalEditor.js';
import {JOURNAL_STICKERS,STICKER_CATEGORIES,getJournalSticker,stickersForCategory} from '../src/data/journalStickers.js';

const source={id:'day-1',day:1,title:'湖畔初遇',date:'2026-12-01',note:'旅行心情',photos:[{id:'local-photo-1',type:'image/jpeg'}],visited:['西湖'],extraVisited:'',tickets:[]};

test('第六页数据生成清晰分区的图文与少量手账装饰',()=>{
  const p=ensureEditorForPage(source);
  assert.equal(p.editor.visualVersion,EDITOR_VISUAL_VERSION);
  assert.equal(p.editor.items.length,25);
  assert.equal(p.editor.items.filter(x=>x.kind==='photo').length,4);
  assert.equal(p.editor.items.filter(x=>x.kind==='sticker').length,5);
  assert.equal(p.editor.items.filter(x=>x.kind==='art').length,4);
  assert.ok(p.editor.items.some(x=>x.kind==='photo'&&x.mediaId==='local-photo-1'));
  assert.ok(p.editor.items.some(x=>x.kind==='text'&&x.text==='旅行心情'));
  assert.ok(p.editor.items.some(x=>x.kind==='text'&&x.text.includes('西湖')));
});

test('四个模板构图不同，但切换时内容、照片 ID 和自定义图层不丢失',()=>{
  const items=ensureEditorForPage(source).editor.items;
  const signatures=new Set();
  for(const template of EDITOR_TEMPLATES){
    const laid=reflowForTemplate(items,template.id);
    assert.equal(laid.length,items.length);
    assert.deepEqual(laid.map(x=>x.id),items.map(x=>x.id));
    assert.deepEqual(laid.map(x=>x.text),items.map(x=>x.text));
    assert.deepEqual(laid.map(x=>x.mediaId),items.map(x=>x.mediaId));
    assert.ok(laid.every(x=>x.x>=0&&x.y>=0&&x.x+x.w<=BOARD_W&&x.y+x.h<=BOARD_H));
    signatures.add(laid.filter(x=>x.kind==='photo').map(x=>[x.x,x.y,x.w,x.h].join(',')).join('|'));
  }
  assert.equal(signatures.size,4);
  const custom={id:'user-layer',role:'custom',kind:'text',x:98,y:187,w:145,h:54,fontSize:17,text:'我自己写的'};
  const changed=reflowForTemplate([...items,custom],'color-collage');
  assert.deepEqual(changed.at(-1),custom);
});

test('旧版手账升级后保留用户原文字、图片、自定义元素',()=>{
  const prior={...source,editor:{template:'warm-sketch',items:[
    {id:'old-photo',role:'photo-0',kind:'photo',x:5,y:10,w:150,h:100,mediaId:'old-attachment'},
    {id:'old-title',role:'title',kind:'text',x:10,y:20,w:140,h:40,text:'修改过的旅行标题',fontSize:22},
    {id:'user-memo',role:'custom',kind:'text',x:43,y:40,w:135,h:80,text:'不被覆盖的笔记',fontSize:18},
  ]}};
  const upgraded=ensureEditorForPage(prior);
  assert.equal(upgraded.editor.visualVersion,EDITOR_VISUAL_VERSION);
  assert.equal(upgraded.editor.items.find(x=>x.role==='photo-0').mediaId,'old-attachment');
  assert.equal(upgraded.editor.items.find(x=>x.role==='title').text,'修改过的旅行标题');
  assert.equal(upgraded.editor.items.find(x=>x.id==='user-memo').text,'不被覆盖的笔记');
  assert.equal(ensureEditorForPage(upgraded),upgraded);
});

test('空白页不伪造真实到访，照片占位不假冒用户照片',()=>{
  const newPage=ensureEditorForPage(makeBlankPage(5));
  assert.equal(newPage.visited.length,0);
  assert.equal(newPage.plannedStops.length,0);
  assert.equal(newPage.editor.items.filter(x=>x.kind==='photo'&&x.mediaId===null&&!x.hiddenInTemplate).length,4);
});

test('71 枚贴纸每个都有对应本地素材，分类筛选正确',()=>{
  assert.equal(JOURNAL_STICKERS.length,71);
  assert.equal(stickersForCategory('all').length,71);
  assert.equal(stickersForCategory('tape').length,6);
  assert.equal(getJournalSticker('flower').id,'doodle-flower');
  for(const x of JOURNAL_STICKERS){
    assert.ok(fs.existsSync(path.join(import.meta.dirname,'../public',x.src)),'缺失贴纸 '+x.src);
  }
  assert.equal(STICKER_CATEGORIES.length,8);
});


test('四种版式的图片和文字拥有独立内容空间，无默认互相遮挡',()=>{
  for(const template of EDITOR_TEMPLATES){
    const content=createInitialElements(source,template.id).filter(x=>!x.hiddenInTemplate&&(x.kind==='photo'||x.kind==='text'));
    for(let i=0;i<content.length;i++)for(let j=i+1;j<content.length;j++){
      const a=content[i],b=content[j];
      const dx=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
      const dy=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
      assert.equal(dx*dy,0,`${template.name}: ${a.role} 与 ${b.role} 不应重叠`);
    }
  }
});

test('旧版本 2 的手账也能够迁移且保留用户照片和自定义元素',()=>{
 const prior=ensureEditorForPage(source);
 const restored={...source,editor:{...prior.editor,visualVersion:2,items:[...prior.editor.items,{id:'custom-blossom',role:'custom',kind:'sticker',sticker:'doodle-flower',x:90,y:100,w:40,h:40}]}};
 const upgraded=ensureEditorForPage(restored);
 assert.equal(upgraded.editor.visualVersion,EDITOR_VISUAL_VERSION);
 assert.equal(upgraded.editor.items.find(x=>x.role==='photo-0').mediaId,'local-photo-1');
 assert.equal(upgraded.editor.items.find(x=>x.id==='custom-blossom').sticker,'doodle-flower');
});

test('各纸张素材、模板预览图片均在本地且可离线使用',()=>{
 for (const key of ['warm-sketch','sage-minimal','color-collage','soft-watercolor']){
  assert.ok(fs.existsSync(path.join(import.meta.dirname,`../public/images/template-previews/${key}.jpg`)));
 }
 for (const key of ['day-ivory.jpg','sea-wash.jpg','city-grid.jpg','memo-kraft.jpg']){
  assert.ok(fs.existsSync(path.join(import.meta.dirname,`../public/images/journal-paper-handdrawn/${key}`)));
 }
});


test('第十一轮四张手绘场景占位图可离线加载，贴纸数量保持不变',()=>{
 for(const key of ['sketch-1.svg','sketch-2.svg','sketch-3.svg','sketch-4.svg']){
  assert.ok(fs.existsSync(path.join(import.meta.dirname,`../public/images/journal-demo-sketch/${key}`)));
 }
 assert.equal(JOURNAL_STICKERS.length,71);
});

test('四套版式切换保持独立照片引用和用户编辑数据，不重建删除的图层',()=>{
 const page=ensureEditorForPage(source);
 const original=page.editor.items;
 const note=original.find(x=>x.role==='note');
 const custom={id:'my-memo',role:'custom',kind:'text',text:'我亲手记的旅行故事',x:100,y:400,w:100,h:40};
 const edited=original.filter(x=>x.role!=='accent-1').map(x=>x.role==='note'?{...x,text:'我自己的心情记录',systemText:false}:x);
 for(const t of EDITOR_TEMPLATES){
  const next=reflowForTemplate([...edited,custom],t.id,page);
  assert.ok(!next.some(x=>x.role==='accent-1'));
  assert.equal(next.find(x=>x.role==='note').text,'我自己的心情记录');
  assert.equal(next.find(x=>x.role==='photo-0').mediaId,'local-photo-1');
  assert.deepEqual(next.find(x=>x.id==='my-memo'),custom);
 }
});


test('第十二轮首屏根据计划景点自动生成路线和前瞻性随笔，不编造到访',()=>{
 const upcoming={id:'route-day',day:1,date:'2026-12-06',title:'湖畔初遇',plannedTheme:'慢慢认识西湖',plannedStops:[{id:'p1',name:'西湖湖畔',time:'09:00'},{id:'p2',name:'断桥周边',time:'11:30'},{id:'p3',name:'湖边慢步',time:'14:30'}],note:'',visited:[],extraVisited:'',photos:[],tickets:[]};
 const page=ensureEditorForPage(upcoming);
 const roles=Object.fromEntries(page.editor.items.map(i=>[i.role,i]));
 assert.match(roles['day-mark'].text,/DAY 01/);
 assert.equal(roles.title.text,'湖畔初遇');
 assert.equal(roles.subtitle.text,'慢慢认识西湖');
 assert.match(roles['route-stop-0'].text,/09:00.*西湖/);
 assert.match(roles['route-stop-1'].text,/断桥/);
 assert.match(roles['route-stop-2'].text,/湖边/);
 assert.match(roles.note.text,/想先去/);
 assert.doesNotMatch(roles.note.text,/已经去过|今天我去了/);
 assert.match(roles.micro.text,/PLANNED/);
 assert.equal(page.visited.length,0);
 assert.equal(roles['route-doodle'].kind,'art');
 assert.match(roles['art-lake'].src,/lake-sketch.svg$/);
});

test('计划文字有旅行目的与路线，真实心情优先且不被模板重排覆盖',()=>{
 const page={...source,plannedStops:[{name:'苏堤'},{name:'西湖'},{name:'茶馆'}],note:'我今天真的去湖边散步了'};
 const initial=ensureEditorForPage(page);
 assert.equal(initial.editor.items.find(x=>x.role==='note').text,'我今天真的去湖边散步了');
 assert.equal(plannedJournalText({...page,note:''}).includes('想先去'),true);
 const touched=initial.editor.items.map(x=>x.role==='note'?{...x,text:'我自己修改的手账文字',systemText:false}:x);
 for(const t of EDITOR_TEMPLATES)assert.equal(reflowForTemplate(touched,t.id,page).find(x=>x.role==='note').text,'我自己修改的手账文字');
});

test('批准的手账母版素材作为独立可编辑插画层，不是整张合成背景',()=>{
 const page=ensureEditorForPage(source);
 const arts=page.editor.items.filter(i=>i.kind==='art');
 assert.equal(arts.length,4);
 for(const item of arts)assert.ok(fs.existsSync(path.join(import.meta.dirname,'../public',item.src)));
 for(const image of ['westlake-main.jpg','westlake-details.jpg','westlake-water.jpg'])assert.ok(fs.existsSync(path.join(import.meta.dirname,'../public/images/journal-master',image)));
});

test('返回第六页补充新照片后自动填充空相框，不覆盖已编辑照片',()=>{
 const day={...source,photos:[]};
 const base=ensureEditorForPage(day);
 const earlier=base.editor.items.map(it=>it.role==='photo-0'?{...it,mediaId:'hand-picked-photo'}:it);
 const later={...day,photos:[{id:'new-photo-1',type:'image/jpeg'},{id:'new-photo-2',type:'image/png'}],editor:{...base.editor,items:earlier}};
 const refreshed=ensureEditorForPage(later);
 assert.equal(refreshed.editor.items.find(x=>x.role==='photo-0').mediaId,'hand-picked-photo');
 assert.equal(refreshed.editor.items.find(x=>x.role==='photo-1').mediaId,'new-photo-1');
 assert.equal(refreshed.editor.items.find(x=>x.role==='photo-2').mediaId,'new-photo-2');
 assert.equal(ensureEditorForPage(refreshed),refreshed);
});

test('第十三轮采用接近已确认手绘母版的 9:16 长页，四套成品纸张各不相同',()=>{
 assert.equal(BOARD_W,360);
 assert.equal(BOARD_H,640);
 assert.ok(EDITOR_VISUAL_VERSION>=6);
 for(const name of ['ink-day','sea-watercolor','city-sketch','kraft-recap']){
  const filename=path.join(import.meta.dirname,`../public/images/journal-handmade-v13/${name}.jpg`);
  assert.ok(fs.existsSync(filename),`缺失新的 ${name} 背景`);
  assert.ok(fs.statSync(filename).size>40000);
 }
});

test('四套手账有各自独立可编辑的路线与插画，并与用户文字/照片同存',()=>{
 const names=new Set();
 for(const t of EDITOR_TEMPLATES){
  const page=ensureEditorForPage({...source,editor:null});
  const items=createInitialElements(page,t.id);
  const arts=items.filter(it=>it.kind==='art'&&!it.hiddenInTemplate);
  assert.ok(arts.length>=3,t.name+' 缺少手绘层');
  const route=items.find(it=>it.role==='route-doodle');
  assert.ok(route&&!route.hiddenInTemplate&&fs.existsSync(path.join(import.meta.dirname,'../public',route.src)));
  assert.ok(items.find(it=>it.role==='note')?.kind==='text');
  assert.ok(items.filter(it=>it.kind==='photo'&&!it.hiddenInTemplate).length>=3);
  names.add(route.src);
 }
 assert.equal(names.size,4);
});

test('第十三轮不同模板预览图存在，并与大画布比例匹配',()=>{
 for(const t of EDITOR_TEMPLATES){
  const filename=path.join(import.meta.dirname,`../public/images/template-previews/${t.id}.jpg`);
  assert.ok(fs.existsSync(filename),'缺少模板预览图: '+t.id);
  assert.ok(fs.statSync(filename).size>20000,'模板缩略图太小/未更新: '+t.id);
 }
});

test('第七页与其余八页一样保持手机框架，较长手账只在画布内缩放',()=>{
 const shell=fs.readFileSync(path.join(import.meta.dirname,'../src/components/AppShell.jsx'),'utf8');
 assert.match(shell,/isEditor=\/\^\\\/journal/);
 assert.match(shell,/app-stage--editor/);
 assert.match(shell,/phone-frame--editor/);
 const css=fs.readFileSync(path.join(import.meta.dirname,'../src/styles/global.css'),'utf8');
 assert.match(css,/\.app-stage--editor/);
 assert.match(css,/\.app-stage--editor \.phone-frame--editor\{\s*width:min\(398px,92vw\)/);
 assert.match(css,/@media\(max-width:520px\)\{/);
 assert.match(css,/\.je-board-surround\{padding:5px 4px 8px\}/);
});
