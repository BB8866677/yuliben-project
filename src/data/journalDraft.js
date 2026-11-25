// 旅行手账草稿：仅在当前浏览器中使用，不涉及云端 AI 或真实订单。
import {readSavedTrips} from './demoItinerary.js';

export const JOURNAL_DRAFTS_KEY = 'yuliben.journal.drafts.v1';
export const JOURNAL_ACTIVE_TRIP_KEY = 'yuliben.journal.active-trip.v1';

function readCollection(){
  try{
    const value=JSON.parse(localStorage.getItem(JOURNAL_DRAFTS_KEY)||'[]');
    return Array.isArray(value)?value.filter(x=>x&&typeof x==='object'):[];
  }catch{return []}
}
export function readJournalDrafts(){return readCollection()}
export function findJournalForTrip(tripId){return readCollection().find(j=>j.tripId===tripId)||null}
export function findJournalById(id){return readCollection().find(j=>j.id===id)||null}
export function makeJournalForTrip(trip){
  const existing=findJournalForTrip(trip.id);
  if(existing)return existing;
  const id=`journal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  return {id,tripId:trip.id,destination:trip.destination,
    title:`${trip.destination} · 旅行手账`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
    generatedAt:null,template:'warm-sketch',
    tripMeta:{startDate:trip.requirements?.startDate||'',endDate:trip.requirements?.endDate||'',pace:trip.requirements?.pace||''},
    pages:(trip.itinerary||[]).map((day,i)=>({
      id:`page-${i+1}`,day:i+1,date:day.date,title:day.title,
      plannedStops:(day.stops||[]).map(s=>({id:s.id,name:s.name,time:s.time})),
      plannedTheme:day.note||'',
      visited:[],extraVisited:'',note:'',photos:[],tickets:[]
    }))};
}
export function saveJournalDraft(doc){
  if(!doc)return null;
  const next={...doc,updatedAt:new Date().toISOString()};
  const list=[next,...readCollection().filter(j=>j.id!==next.id)];
  localStorage.setItem(JOURNAL_DRAFTS_KEY,JSON.stringify(list));
  return next;
}
export function tripForJournal(journal){
  if(!journal)return null;
  return readSavedTrips().find(t=>t.id===journal.tripId)||null;
}
export function journalMediaCount(journal){
  return (journal?.pages||[]).reduce((a,p)=>a+(p.photos?.length||0)+(p.tickets?.length||0),0);
}
