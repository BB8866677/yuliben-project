import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PRINT_CONFIG,normalizePrintConfig,quotePrint,createPrintOrder,readPrintOrders,findPrintOrder,cancelPrintOrder,savePrintDraft,getPrintDraft,PRINT_SIZES} from '../src/data/printOrders.js';

class MemoryStorage {
 #values=new Map();
 getItem(key){return this.#values.get(key)??null}
 setItem(key,value){this.#values.set(key,String(value))}
 removeItem(key){this.#values.delete(key)}
 clear(){this.#values.clear()}
}
globalThis.localStorage=new MemoryStorage();
const document={id:'journal-sample',title:'杭州 · 旅行手账',tripId:'trip123',destination:'杭州',pages:[{id:'day1',day:1,editor:{template:'warm-sketch',items:[{id:'text1',kind:'text',text:'计划去西湖',x:20,y:10,w:100,h:20}]},photos:[]},{id:'day2',day:2,photos:[]} ]};
test('规范化配置保护尺寸、材料和数量',()=>{
 assert.equal(normalizePrintConfig({size:'wrong',material:'wrong',quantity:300}).size,'a5');
 assert.equal(normalizePrintConfig({size:'wrong',material:'wrong',quantity:300}).quantity,5);
 assert.equal(normalizePrintConfig({size:'square',material:'kraft',quantity:2}).material,'kraft');
});
test('不同规格与装帧实时计算演示价',()=>{
 assert.equal(quotePrint({size:'a5',material:'kraft',quantity:1},3).total,89);
 assert.equal(quotePrint({size:'a5',material:'linen',quantity:2},3).total,218);
 assert.equal(quotePrint({size:'square',material:'cream',quantity:1},11).total,130);
});
test('图书页数超过 8 页产生演示附加页费',()=>{
 assert.equal(quotePrint(DEFAULT_PRINT_CONFIG,10).extraPages,6);
 assert.equal(quotePrint(DEFAULT_PRINT_CONFIG,10).printedPages,10);
});
test('每本手账的定制草稿独立保存',()=>{
 savePrintDraft('A',{size:'square',material:'kraft',coverTitle:'海边日记',quantity:3});
 savePrintDraft('B',{size:'a5',material:'linen',coverTitle:'山间散步',quantity:1});
 assert.equal(getPrintDraft('A').coverTitle,'海边日记');
 assert.equal(getPrintDraft('B').size,'a5');
});
test('订单在创建时复制整份手账快照，不跟随后续原稿变化',()=>{
 const order=createPrintOrder(document,{size:'a5',material:'linen',quantity:1,coverTitle:'杭州慢游'});
 assert.equal(order.journalSnapshot.pages[0].editor.items[0].text,'计划去西湖');
 document.pages[0].editor.items[0].text='修改后的文案';
 assert.equal(findPrintOrder(order.id).journalSnapshot.pages[0].editor.items[0].text,'计划去西湖');
 assert.equal(findPrintOrder(order.id).configuration.coverTitle,'杭州慢游');
});
test('订单保留图层信息、行程 ID、价格以及创建状态',()=>{
 const list=readPrintOrders();
 assert.equal(list[0].journalId,'journal-sample');
 assert.equal(list[0].tripId,'trip123');
 assert.equal(list[0].status,'demo-created');
 assert.equal(list[0].quote.total,109);
 assert.equal(list[0].journalSnapshot.pages[0].editor.items[0].id,'text1');
});
test('模拟订单可以取消，且只变更状态而不删除快照',()=>{
 const order=readPrintOrders()[0];
 const next=cancelPrintOrder(order.id);
 assert.equal(next.status,'demo-cancelled');
 assert.equal(next.journalSnapshot.pages[0].editor.items[0].text,'计划去西湖');
 assert.equal(cancelPrintOrder('no-such-id'),null);
});
test('没有可打印内页不能创建模拟订单',()=>{
 assert.throws(()=>createPrintOrder({...document,pages:[]},DEFAULT_PRINT_CONFIG));
});
test('方形选项有独立尺寸元信息',()=>{
 assert.equal(PRINT_SIZES.square.detail,'18 × 18 cm');
});
test('V2 四套封面模板可选择并持久化',()=>{
 const chosen=normalizePrintConfig({coverTemplate:'seaside',size:'square',coverTitle:'海边慢慢走'});
 assert.equal(chosen.coverTemplate,'seaside');
 assert.equal(normalizePrintConfig({coverTemplate:'unsupported'}).coverTemplate,'botanical');
 savePrintDraft('cover-v2',chosen);
 assert.equal(getPrintDraft('cover-v2').coverTemplate,'seaside');
 const order=createPrintOrder(document,chosen);
 assert.equal(order.configuration.coverTemplate,'seaside');
 assert.equal(order.journalSnapshot.pages.length,2);
});

// 第十七轮：订单进度仅为手动课堂演示；保留历史快照与订单封面。
import {advanceDemoOrder,saveDemoOrderFeedback,DEMO_ORDER_STAGES,DEMO_ORDER_LABELS} from '../src/data/printOrders.js';
test('模拟制作进度严格按创建→制作→寄送→完成推进',()=>{
  const created=createPrintOrder(document,{size:'square',material:'kraft',coverTitle:'路线小记',coverTemplate:'city'});
  let changed=advanceDemoOrder(created.id);
  assert.equal(changed.status,'demo-making');
  changed=advanceDemoOrder(created.id);
  assert.equal(changed.status,'demo-shipping');
  changed=advanceDemoOrder(created.id);
  assert.equal(changed.status,'demo-completed');
  assert.equal(changed.stageHistory.length,4);
  assert.equal(advanceDemoOrder(created.id).status,'demo-completed');
  assert.equal(DEMO_ORDER_STAGES.length,4);
  assert.equal(DEMO_ORDER_LABELS['demo-shipping'],'寄送中');
  assert.equal(changed.configuration.coverTemplate,'city');
  assert.equal(changed.journalSnapshot.pages[0].editor.items[0].id,'text1');
});
test('已寄送和已完成的模拟订单不能取消；不存在的 ID 不会添加订单',()=>{
  const shipped=readPrintOrders().find(o=>o.status==='demo-completed');
  assert.equal(cancelPrintOrder(shipped.id).status,'demo-completed');
  assert.equal(advanceDemoOrder('not-an-order'),null);
  assert.equal(saveDemoOrderFeedback('not-an-order','留言'),null);
});
test('已取消的订单不能再推进状态',()=>{
  const created=createPrintOrder(document,{coverTitle:'可取消的旅行'});
  assert.equal(cancelPrintOrder(created.id).status,'demo-cancelled');
  assert.equal(advanceDemoOrder(created.id).status,'demo-cancelled');
});
test('制作中的演示订单可以取消但不能再推进',()=>{
  const created=createPrintOrder(document,{coverTitle:'正在准备'});
  assert.equal(advanceDemoOrder(created.id).status,'demo-making');
  assert.equal(cancelPrintOrder(created.id).status,'demo-cancelled');
  assert.equal(advanceDemoOrder(created.id).status,'demo-cancelled');
});
test('本地售后意见保留在历史订单上，不改变订单快照',()=>{
  const created=createPrintOrder(document,{coverTitle:'记录册'});
  const updated=saveDemoOrderFeedback(created.id,'希望封面更柔和一些');
  assert.equal(updated.feedback.length,1);
  assert.equal(updated.feedback[0].text,'希望封面更柔和一些');
  assert.equal(updated.configuration.coverTitle,'记录册');
  assert.equal(updated.journalSnapshot.pages[0].editor.items[0].text,document.pages[0].editor.items[0].text);
  assert.equal(saveDemoOrderFeedback(created.id,'  '),null);
  assert.equal(readPrintOrders().find(x=>x.id===created.id).feedback.length,1);
});
