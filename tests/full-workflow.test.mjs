import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {createDemoItinerary,readSavedTrips,saveTrip,findTrip,readLatestPlan,removeSavedTrip} from '../src/data/demoItinerary.js';
import {makeJournalForTrip,saveJournalDraft,findJournalForTrip,findJournalById} from '../src/data/journalDraft.js';
import {ensureEditorForPage,reflowForTemplate,EDITOR_TEMPLATES} from '../src/data/journalEditor.js';
import {createPrintOrder,readPrintOrders,advanceDemoOrder,findPrintOrder,normalizePrintConfig} from '../src/data/printOrders.js';
import {tripStatus} from '../src/data/tripPresentation.js';

class MemoryStorage {
  #values=new Map();
  getItem(key){return this.#values.get(key)??null;}
  setItem(key,value){this.#values.set(key,String(value));}
  removeItem(key){this.#values.delete(key);}
  clear(){this.#values.clear();}
}
globalThis.localStorage=new MemoryStorage();
beforeEach(()=>localStorage.clear());

const requirements={destination:'杭州',startDate:'2026-12-10',endDate:'2026-12-12',tripDays:3,travelers:2,totalBudget:2200,pace:'悠闲慢游',interests:['自然风光']};
function savedTrip(){return saveTrip(createDemoItinerary(requirements));}
function savedJournal(){const trip=savedTrip();return saveJournalDraft({...makeJournalForTrip(trip),pages:makeJournalForTrip(trip).pages.map(ensureEditorForPage),generatedAt:'2026-11-25T08:00:00Z'});}

test('03→04→05: 生成的多日行程保留独立景点并可持久化',()=>{
 const trip=savedTrip();
 assert.equal(readSavedTrips().length,1);
 assert.equal(findTrip(trip.id).destination,'杭州');
 assert.equal(readLatestPlan().id,trip.id);
 assert.equal(trip.itinerary.length,3);
 assert.ok(trip.itinerary.every(d=>d.stops.length>=2&&d.stops.every(s=>s.id&&s.time)));
});
test('04→05: 修改其中一天的景点不会影响其余日程',()=>{
 const trip=savedTrip();
 const original=trip.itinerary[1].stops[0].name;
 const modified={...trip,itinerary:trip.itinerary.map((d,i)=>i===0?{...d,stops:[{...d.stops[0],name:'新写入的景点'},...d.stops.slice(1)]}:d)};
 saveTrip(modified);
 assert.equal(findTrip(trip.id).itinerary[0].stops[0].name,'新写入的景点');
 assert.equal(findTrip(trip.id).itinerary[1].stops[0].name,original);
});
test('05→06: 手账自动导入已保存行程的日期、地点、顺序，不冒充已到访',()=>{
 const trip=savedTrip();const journal=makeJournalForTrip(trip);
 assert.equal(journal.tripId,trip.id);
 assert.deepEqual(journal.pages[0].plannedStops.map(s=>s.name),trip.itinerary[0].stops.map(s=>s.name));
 assert.equal(journal.pages[0].date,trip.itinerary[0].date);
 assert.deepEqual(journal.pages[0].visited,[]);
 assert.equal(journal.pages[0].note,'');
});
test('06→07: 页面从旅行路线生成手账元素，保留用户感想和附图引用',()=>{
 const journal=savedJournal();
 journal.pages[0].note='真的去了湖畔，这是我的亲身记录';
 journal.pages[0].photos=[{id:'user-img-1',type:'image/jpeg',name:'我的照片.jpg'}];
 const edited=ensureEditorForPage({...journal.pages[0],editor:undefined});
 assert.ok(edited.editor.items.some(x=>x.kind==='photo'&&x.mediaId==='user-img-1'));
 assert.ok(edited.editor.items.some(x=>x.kind==='text'&&x.text.includes('亲身记录')));
 assert.ok(edited.editor.items.some(x=>x.kind==='text'&&x.text.includes(journal.pages[0].plannedStops[0].name)));
});
test('07: 四套模板切换不丢失已写文字、用户图片和自由图层',()=>{
 const base=savedJournal();const page=base.pages[0];
 const items=[...page.editor.items,{id:'custom-note',kind:'text',role:'custom',x:5,y:5,w:80,h:40,text:'专属旅行便笺',fontSize:15}];
 for(const template of EDITOR_TEMPLATES){
   const newItems=reflowForTemplate(items,template.id);
   assert.equal(newItems.length,items.length);
   assert.equal(newItems.find(x=>x.id==='custom-note').text,'专属旅行便笺');
   assert.deepEqual(newItems.map(x=>x.id),items.map(x=>x.id));
 }
});
test('07→08→09: 订单保存用户选择的装帧、价格和独立快照',()=>{
 const journal=savedJournal();
 const config=normalizePrintConfig({coverTitle:'杭州慢旅纪念册',coverTemplate:'city',material:'cream',size:'square',quantity:2});
 const order=createPrintOrder(journal,config);
 assert.equal(order.configuration.coverTitle,'杭州慢旅纪念册');
 assert.equal(order.configuration.coverTemplate,'city');
 assert.equal(order.configuration.size,'square');
 assert.equal(order.quote.quantity,2);
 assert.equal(order.journalSnapshot.pages.length,3);
 const changed={...journal,pages:[{...journal.pages[0],note:'以后新写的感想'},...journal.pages.slice(1)]};
 saveJournalDraft(changed);
 assert.notEqual(findPrintOrder(order.id).journalSnapshot.pages[0].note,'以后新写的感想');
 assert.equal(readPrintOrders().length,1);
});
test('09: 模拟订单状态手动推进，刷新数据不会回退',()=>{
 const journal=savedJournal(),order=createPrintOrder(journal,{});
 assert.equal(advanceDemoOrder(order.id).status,'demo-making');
 assert.equal(findPrintOrder(order.id).status,'demo-making');
});
test('删除已保存行程后，不会通过最新草稿复活，已创建的历史订单仍在',()=>{
 const journal=savedJournal(),order=createPrintOrder(journal,{}),tripId=journal.tripId;
 removeSavedTrip(tripId);
 assert.equal(findTrip(tripId),null);
 assert.equal(readLatestPlan(),null);
 assert.equal(findPrintOrder(order.id).id,order.id);
 assert.equal(findJournalById(journal.id).tripId,tripId);
});
test('已保存的手账具有稳定 ID，多次打开不会重复创建',()=>{
 const trip=savedTrip();const first=makeJournalForTrip(trip);saveJournalDraft(first);
 assert.equal(makeJournalForTrip(trip).id,first.id);
 assert.equal(findJournalForTrip(trip.id).id,first.id);
});
test('行程状态筛选在日期边界准确',()=>{
 const trip=createDemoItinerary(requirements);
 assert.equal(tripStatus(trip,new Date(2026,11,9)).key,'upcoming');
 assert.equal(tripStatus(trip,new Date(2026,11,10)).key,'active');
 assert.equal(tripStatus(trip,new Date(2026,11,12)).key,'active');
 assert.equal(tripStatus(trip,new Date(2026,11,13)).key,'done');
});
