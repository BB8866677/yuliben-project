import { SITE_BASE } from './siteBase.js';
// Travel archive presentation helpers. Images are illustrative; they are not verified photos of specific attractions.
export const LAKE_PHOTO = 'https://upload.wikimedia.org/wikipedia/commons/1/17/West_Lake%2C_Hangzhou_2025.jpg';
export const LAKE_FALLBACK = (SITE_BASE + 'images/hangzhou-offline-placeholder.jpg');
const sceneAssets = [
  (SITE_BASE + 'images/itinerary/scene-1.jpg'),
  (SITE_BASE + 'images/itinerary/scene-2.jpg'),
  (SITE_BASE + 'images/itinerary/scene-3.jpg'),
  (SITE_BASE + 'images/itinerary/scene-4.jpg'),
];

export function tripCover(trip){
  const dest = String(trip?.destination||'');
  if(dest.includes('杭州')) return {src:LAKE_PHOTO, fallback:LAKE_FALLBACK, verified:true};
  const hash = [...dest].reduce((n,c)=>(n+c.charCodeAt(0))%1007,0);
  return {src:sceneAssets[hash%sceneAssets.length],fallback:sceneAssets[0],verified:false};
}

export function tripStatus(trip, today=new Date()){
  const from=trip?.requirements?.startDate||'';
  const to=trip?.requirements?.endDate||'';
  const localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)) return {key:'unknown',label:'日期待定'};
  if(to<localToday) return {key:'done',label:'已结束'};
  if(from>localToday) return {key:'upcoming',label:'待出发'};
  return {key:'active',label:'旅行中'};
}

export function prettyTripDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '日期待定';
  const [year,month,day]=value.split('-');
  return `${year}.${month}.${day}`;
}

export function prettyTripSpan(trip){
  const a=prettyTripDate(trip?.requirements?.startDate);
  const b=prettyTripDate(trip?.requirements?.endDate);
  if(a==='日期待定'||b==='日期待定')return '出行日期待定';
  return `${a} — ${b}`;
}
