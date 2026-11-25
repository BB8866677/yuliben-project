import { SITE_BASE } from './siteBase.js';
// 本文件全部是供课程原型使用的示例数据：不包含真实 AI、价格、路线距离或开放时间。
// Day.stops is the editable source of truth; day.spots is a compatibility preview string.
export const ITINERARY_KEY = 'yuliben.plan.generated-demo.v1';
export const SAVED_TRIPS_KEY = 'yuliben.saved-trips.v1';

const cityThemes = {
  '杭州': [
    [{title:'初识西湖',names:['西湖湖畔','断桥周边','湖边慢步'],note:'把第一天留给湖边的风景'},
      {title:'山林与人文',names:['灵隐周边','山间漫游','茶香小憩'],note:'让脚步慢下来，看看山林'},
      {title:'老街与城市记忆',names:['河坊街一带','城市漫步','特色美食'],note:'在离开前收藏一段烟火气'}],
    [{title:'湖畔慢游',names:['苏堤周边','西湖湖景','湖畔小憩'],note:'慢一点，风景会留下来'},
      {title:'探索城市角落',names:['茶文化体验','特色街巷','悠闲散步'],note:'试着发现不一样的杭州'},
      {title:'把故事写下来',names:['老街探访','地方小吃','自由活动'],note:'给旅程留一点自由时间'}]
  ],
  '成都': [[
    {title:'城市初印象',names:['宽窄巷子周边','老城散步','本地美食'],note:'用悠闲的节奏认识成都'},
    {title:'文化与烟火',names:['杜甫草堂周边','公园休憩','街巷探访'],note:'慢慢感受城市的生活气息'},
    {title:'悠闲收尾',names:['特色街区','下午茶','自由活动'],note:'留一点时间给意外发现'}
  ]],
  '厦门': [[
    {title:'海风初遇',names:['环岛路沿线','海边散步','日落'],note:'沿着海风慢慢走'},
    {title:'街巷与故事',names:['城市街区','本地小吃','人文漫游'],note:'发现小店和有趣的街角'},
    {title:'海边慢生活',names:['海景步道','拍照记录','自由活动'],note:'带走一段轻盈的回忆'}
  ]]
};
const genericThemes = [
  {title:'第一次遇见这座城',names:['城市经典景观','街区漫步','当地小店'],note:'用自己的步调开始旅行'},
  {title:'遇见自然与人文',names:['城市文化空间','自然景观','休息补给'],note:'为喜欢的风景留出时间'},
  {title:'留给旅行的自由时间',names:['特色街区','旅行记录','自由活动'],note:'把意外收获写进手账'},
  {title:'继续探索',names:['在地体验','喜爱的地点','午后散步'],note:'这一页还可以自由调整'}
];
const suggestedTimes = ['09:00','11:30','14:30','16:30'];
const photos = ['scene-1.jpg','scene-2.jpg','scene-3.jpg','scene-4.jpg'];
export const PHOTO_DIR = (SITE_BASE + 'images/itinerary/');
export const DEFAULT_PHOTO = PHOTO_DIR + 'scene-1.jpg';
function safeDate(date, offset){
  const d=new Date(`${date||'2026-01-01'}T00:00:00Z`);
  if(Number.isNaN(d.getTime()))return '';
  d.setUTCDate(d.getUTCDate()+offset);
  return d.toISOString().slice(0,10);
}
export function makeStop(dayIndex,index,name){
  return {id:`spot-${dayIndex}-${index}-${Math.random().toString(36).slice(2,7)}`,
    name, time:suggestedTimes[index%suggestedTimes.length], duration:index===2?60:90,
    note:index===0?'从这里开启今天的漫游':index===1?'预留轻松的探索时间':'适当休息，留下旅行记录',
    photo:PHOTO_DIR+photos[(dayIndex+index)%photos.length]};
}
export function refreshDay(day){
  return {...day,spots:(day.stops||[]).map(s=>s.name).join(' · ')};
}
export function normalizePlan(raw){
  if(!raw||!Array.isArray(raw.itinerary))return null;
  const itinerary=raw.itinerary.map((day,dayIndex)=>refreshDay({...day,
    stops:Array.isArray(day.stops)?day.stops.map((stop,i)=>({
      id:stop.id||`legacy-${dayIndex}-${i}`,name:String(stop.name||'未命名地点'),
      time:stop.time||suggestedTimes[i%suggestedTimes.length],duration:Number(stop.duration)||60,
      note:stop.note||'可在这里添加旅行备注',photo:stop.photo||PHOTO_DIR+photos[(dayIndex+i)%photos.length]
    })):String(day.spots||'自由探索').split(' · ').filter(Boolean).map((name,i)=>makeStop(dayIndex,i,name))}));
  return {...raw,itinerary,days:itinerary.length,budgetPerDay:Number(raw.budgetPerDay)||Math.round(Number(raw.requirements?.totalBudget||0)/Math.max(1,itinerary.length))};
}
export function createDemoItinerary(requirements, edition=0){
  const destination=String(requirements.destination||'目的地').trim();
  const days=Math.max(1,Math.min(60,Number(requirements.tripDays)||3));
  const city=Object.keys(cityThemes).find(x=>destination.includes(x));
  const variants=city ? cityThemes[city] : null;
  const examples=variants ? variants[edition%variants.length] : genericThemes;
  const offset=edition%examples.length;
  const totalBudget=Number(requirements.totalBudget)||0;
  const itinerary=Array.from({length:days},(_,i)=>{
    const sample=examples[(i+(variants?0:offset))%examples.length];
    return refreshDay({day:i+1,date:safeDate(requirements.startDate,i),title:sample.title,
      note:sample.note,stops:sample.names.map((name,j)=>makeStop(i,j,name))});
  });
  const identifier=`demo-${encodeURIComponent(destination)}-${requirements.startDate||'day'}-${edition}`;
  return {id:identifier,destination,requirements,edition,days,createdAt:new Date().toISOString(),
    itinerary,budgetPerDay:Math.round(totalBudget/days),isDemonstration:true};
}
export function readLatestPlan(){
  try{return normalizePlan(JSON.parse(localStorage.getItem(ITINERARY_KEY)||'null'));}catch{return null;}
}
export function readSavedTrips(){
  try{
    const list=JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY)||'[]');
    return Array.isArray(list)?list.map(normalizePlan).filter(Boolean):[];
  }catch{return [];}
}
export function saveTrip(plan){
  const updated=normalizePlan({...plan,updatedAt:new Date().toISOString()});
  if(!updated)return null;
  const next=[updated,...readSavedTrips().filter(p=>p.id!==updated.id)];
  localStorage.setItem(ITINERARY_KEY,JSON.stringify(updated));
  localStorage.setItem(SAVED_TRIPS_KEY,JSON.stringify(next));
  return updated;
}
export function removeSavedTrip(id){
  localStorage.setItem(SAVED_TRIPS_KEY,JSON.stringify(readSavedTrips().filter(t=>t.id!==id)));
  // A deleted saved journey must not remain accessible via the latest-plan fallback.
  if(readLatestPlan()?.id===id) localStorage.removeItem(ITINERARY_KEY);
}
export function findTrip(id){
  return readSavedTrips().find(p=>p.id===id)||((readLatestPlan()?.id===id||id==='demo-journey')?readLatestPlan():null);
}
