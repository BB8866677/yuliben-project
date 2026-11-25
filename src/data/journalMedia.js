// IndexedDB 用于保存用户选择的照片与票据。比直接写入 localStorage 更适合图片 Blob。
// 数据只存储在浏览器本地，未上传到服务器。
const DB_NAME='yuliben-journal-media-v1';
const STORE='media';
let pendingDB;
function getDB(){
  if(!('indexedDB' in window)) return Promise.reject(new Error('该浏览器不支持 IndexedDB'));
  if(pendingDB)return pendingDB;
  pendingDB=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{
      if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('本地图片库无法打开'));
  }).catch(error=>{pendingDB=null;throw error});
  return pendingDB;
}
async function dbAction(mode,action){
  const db=await getDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
    const req=action(store);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('本地媒体文件操作失败'));
    tx.onerror=()=>reject(tx.error||new Error('本地媒体文件事务失败'));
  });
}
export const storeJournalMedia=(key,blob)=>dbAction('readwrite',store=>store.put(blob,key));
export const getJournalMedia=key=>dbAction('readonly',store=>store.get(key));
export const removeJournalMedia=key=>dbAction('readwrite',store=>store.delete(key));
export const newMediaId=()=>`asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
export function isPreviewable(item){return (item?.type||'').startsWith('image/')}
