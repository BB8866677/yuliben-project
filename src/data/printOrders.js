/**
 * 实体手账：离线、教学用途的定制草稿与模拟订单。没有支付/印刷/物流接口。
 * 订单创建时复制手账图层与排版，避免编辑原手账后旧订单静默变化。
 */
import {PRINT_COVERS,DEFAULT_PRINT_COVER} from './printCoverArt.js';
export const PRINT_DRAFT_KEY='yuliben.print.drafts.v1';
export const PRINT_ORDER_KEY='yuliben.print.orders.v1';
export const PRINT_SIZES={
  a5:{label:'A5 竖版',detail:'14.8 × 21 cm',shape:'portrait',base:89},
  square:{label:'方形纪念册',detail:'18 × 18 cm',shape:'square',base:109}
};
export const PRINT_MATERIALS={
  linen:{label:'鼠尾草布纹精装',detail:'细密布纹 · 温柔灰绿',add:20},
  kraft:{label:'复古牛皮纸封面',detail:'自然纸纹 · 暖棕色调',add:0},
  cream:{label:'奶油色艺术纸封',detail:'细腻纸感 · 米白色调',add:12}
};
export const DEFAULT_PRINT_CONFIG={size:'a5',material:'linen',quantity:1,coverTitle:'',coverSubtitle:'',coverMediaId:null,coverTemplate:DEFAULT_PRINT_COVER};
const copy=o=>JSON.parse(JSON.stringify(o));
function arrayAt(key){
  try{const arr=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(arr)?arr:[];}catch{return []}
}
export const readPrintOrders=()=>arrayAt(PRINT_ORDER_KEY).filter(x=>x&&x.id);
export const findPrintOrder=id=>readPrintOrders().find(x=>x.id===id)||null;
export function getPrintDraft(journalId){
  try{const all=JSON.parse(localStorage.getItem(PRINT_DRAFT_KEY)||'{}');return all?.[journalId]||null}catch{return null}
}
export function savePrintDraft(journalId,config){
  if(!journalId)return;
  let all={};try{all=JSON.parse(localStorage.getItem(PRINT_DRAFT_KEY)||'{}')||{}}catch{}
  localStorage.setItem(PRINT_DRAFT_KEY,JSON.stringify({...all,[journalId]:normalizePrintConfig(config)}));
}
export function normalizePrintConfig(config={}){
  return {
    size:PRINT_SIZES[config.size]?config.size:'a5',
    material:PRINT_MATERIALS[config.material]?config.material:'linen',
    quantity:Math.max(1,Math.min(5,Math.round(Number(config.quantity)||1))),
    coverTitle:String(config.coverTitle||'').slice(0,24),
    coverSubtitle:String(config.coverSubtitle||'').slice(0,40),
    coverMediaId:typeof config.coverMediaId==='string'?config.coverMediaId:null,
    coverTemplate:PRINT_COVERS[config.coverTemplate]?config.coverTemplate:DEFAULT_PRINT_COVER
  };
}
export function quotePrint(config={},pageCount=0){
  const c=normalizePrintConfig(config);
  const pages=Math.max(1,Math.round(Number(pageCount)||1));
  const base=PRINT_SIZES[c.size].base;
  const material=PRINT_MATERIALS[c.material].add;
  const extraPages=Math.max(0,pages-8)*3;
  const perBook=base+material+extraPages;
  return {base,material,extraPages,perBook,quantity:c.quantity,total:perBook*c.quantity,printedPages:pages};
}
/**
 * 仅用于课堂原型：各阶段都需要用户手动推进，没有真实生产或物流事件。
 * 旧版订单（只有 demo-created / demo-cancelled）继续兼容。
 */
export const DEMO_ORDER_STAGES=['demo-created','demo-making','demo-shipping','demo-completed'];
export const DEMO_ORDER_LABELS={
  'demo-created':'待制作',
  'demo-making':'制作中',
  'demo-shipping':'寄送中',
  'demo-completed':'已完成',
  'demo-cancelled':'已取消'
};
export function getDemoOrderStageIndex(status){
  return DEMO_ORDER_STAGES.indexOf(status);
}
export function advanceDemoOrder(orderId){
  const list=readPrintOrders();
  const index=list.findIndex(item=>item.id===orderId);
  if(index<0)return null;
  const order=list[index];
  const current=getDemoOrderStageIndex(order.status);
  if(current<0||current>=DEMO_ORDER_STAGES.length-1)return order;
  const nextStatus=DEMO_ORDER_STAGES[current+1];
  list[index]={...order,status:nextStatus,stageHistory:[...(order.stageHistory||[{status:'demo-created',at:order.createdAt}]),{status:nextStatus,at:new Date().toISOString()}]};
  localStorage.setItem(PRINT_ORDER_KEY,JSON.stringify(list));
  return list[index];
}
export function saveDemoOrderFeedback(orderId,message){
  const list=readPrintOrders();
  const index=list.findIndex(item=>item.id===orderId);
  if(index<0)return null;
  const note=String(message||'').trim().slice(0,500);
  if(!note)return null;
  list[index]={...list[index],feedback:[...(list[index].feedback||[]),{text:note,at:new Date().toISOString()}]};
  localStorage.setItem(PRINT_ORDER_KEY,JSON.stringify(list));
  return list[index];
}
const makeOrderId=()=>`YLB-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
export function createPrintOrder(journal,config){
  if(!journal?.id||!Array.isArray(journal.pages)||!journal.pages.length)throw new Error('请先保存至少一页旅行手账');
  const c=normalizePrintConfig(config);
  const quote=quotePrint(c,journal.pages.length);
  const order={
    id:makeOrderId(),type:'demo-print-order',journalId:journal.id,tripId:journal.tripId||null,
    title:journal.title||'旅行纪念册',destination:journal.destination||'',
    createdAt:new Date().toISOString(),status:'demo-created',stageHistory:[{status:'demo-created',at:new Date().toISOString()}],
    configuration:copy(c),quote:copy(quote),
    journalSnapshot:{title:journal.title||'',destination:journal.destination||'',pages:copy(journal.pages)}
  };
  localStorage.setItem(PRINT_ORDER_KEY,JSON.stringify([order,...readPrintOrders()]));
  return order;
}
export function cancelPrintOrder(orderId){
  const list=readPrintOrders();const index=list.findIndex(x=>x.id===orderId);
  if(index<0)return null;
  if(!['demo-created','demo-making'].includes(list[index].status))return list[index];
  list[index]={...list[index],status:'demo-cancelled'};
  localStorage.setItem(PRINT_ORDER_KEY,JSON.stringify(list));
  return list[index];
}
