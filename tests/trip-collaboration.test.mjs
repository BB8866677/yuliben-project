import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoItinerary,normalizePlan,saveTrip,findTrip} from '../src/data/demoItinerary.js';
import {addCollaborator,joinCollaborator,removeCollaborator,selectActor,normalizeCollaboration,activeActorName,inviteCopyText} from '../src/data/tripCollaboration.js';
class FakeStorage{#m=new Map();getItem(k){return this.#m.get(k)??null}setItem(k,v){this.#m.set(k,String(v))}removeItem(k){this.#m.delete(k)}};
globalThis.localStorage=new FakeStorage();
const newGroup=()=>normalizeCollaboration(null);
test('邀请人数受同行人数限制，防止重名和空昵称',()=>{
 const first=addCollaborator(newGroup(),'小雨',2);assert.equal(first.error,'');assert.equal(first.collaboration.members[0].status,'invited');
 assert.match(addCollaborator(first.collaboration,'小鹿',2).error,/同行人数/);
 assert.match(addCollaborator(first.collaboration,'小雨',3).error,/已经/);
 assert.match(addCollaborator(first.collaboration,' ',3).error,/昵称/);
});
test('模拟加入后可切换身份，未加入的好友不能冒充操作',()=>{
 const first=addCollaborator(newGroup(),'小雨',3).collaboration;
 const id=first.members[0].id;
 assert.equal(selectActor(first,id).activeActorId,'owner');
 const joined=joinCollaborator(first,id);
 assert.equal(joined.members[0].status,'joined');
 assert.equal(activeActorName(selectActor(joined,id)),'小雨');
 assert.equal(removeCollaborator(selectActor(joined,id),id).activeActorId,'owner');
});
test('协作状态随生成的行程保存并跨页面重新打开',()=>{
 const first=addCollaborator(newGroup(),'小雨',3).collaboration;
 const joined=joinCollaborator(first,first.members[0].id);
 const collaboration=selectActor(joined,first.members[0].id);
 const requirements={destination:'杭州',startDate:'2026-12-10',endDate:'2026-12-11',tripDays:2,travelers:3,totalBudget:1800,pace:'悠闲慢游',interests:[],collaboration};
 const generated=createDemoItinerary(requirements);
 const saved=saveTrip({...generated,collaborationActivity:{actor:'小雨',day:1,action:'更新当天行程',at:'2026-11-25T00:00:00Z'}});
 assert.equal(findTrip(saved.id).requirements.collaboration.members[0].name,'小雨');
 assert.equal(activeActorName(normalizePlan(findTrip(saved.id)).requirements.collaboration),'小雨');
 assert.equal(saved.collaborationActivity.day,1);
});
test('复制的仅是明确标注为本地模拟的邀请说明',()=>{
 const txt=inviteCopyText('厦门',[{id:'x',name:'阿哲',status:'invited'}]);
 assert.match(txt,/厦门/);assert.match(txt,/阿哲/);assert.match(txt,/本地原型演示/);assert.match(txt,/无法跨设备联机/);
 assert.doesNotMatch(txt,/https?:\/\//);
});
