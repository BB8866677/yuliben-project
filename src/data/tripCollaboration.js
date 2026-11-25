// 第二十轮：仅供课堂原型的本地多人规划模拟。没有账号、服务器、有效邀请链接或跨设备同步。
export const DEMO_FRIENDS=['小雨','阿哲','小鹿'];
export const MAX_COLLABORATORS=19;
const validStatus=new Set(['invited','joined']);
export function normalizeCollaboration(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  const members=(Array.isArray(source.members)?source.members:[])
    .filter(m=>m&&typeof m==='object'&&String(m.name||'').trim())
    .slice(0,MAX_COLLABORATORS)
    .map((m,i)=>({id:String(m.id||`demo-friend-${i}`),name:String(m.name).trim().slice(0,12),status:validStatus.has(m.status)?m.status:'invited'}));
  const activeActorId=source.activeActorId!=='owner'&&members.some(m=>m.id===source.activeActorId&&m.status==='joined')?source.activeActorId:'owner';
  return {members,activeActorId};
}
export function addCollaborator(raw,name,travelers=2){
  const collaboration=normalizeCollaboration(raw);
  const trimmed=String(name||'').trim().replace(/\s+/g,' ').slice(0,12);
  if(!trimmed)return {collaboration,error:'请填写好友昵称'};
  if(trimmed==='我')return {collaboration,error:'请填写好友的昵称'};
  if(collaboration.members.some(m=>m.name.toLocaleLowerCase()===trimmed.toLocaleLowerCase()))return {collaboration,error:'这位好友已经在邀请名单里了'};
  const capacity=Math.max(0,Math.min(MAX_COLLABORATORS,Math.floor(Number(travelers)||1)-1));
  if(collaboration.members.length>=capacity)return {collaboration,error:'邀请人数不能超过同行人数，请先调整同行人数'};
  const id=`friend-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  return {collaboration:{...collaboration,members:[...collaboration.members,{id,name:trimmed,status:'invited'}]},error:''};
}
export function joinCollaborator(raw,id){
  const collaboration=normalizeCollaboration(raw);
  return {...collaboration,members:collaboration.members.map(m=>m.id===id?{...m,status:'joined'}:m)};
}
export function removeCollaborator(raw,id){
  const collaboration=normalizeCollaboration(raw);
  return normalizeCollaboration({...collaboration,members:collaboration.members.filter(m=>m.id!==id)});
}
export function selectActor(raw,id){
  const collaboration=normalizeCollaboration(raw);
  return {...collaboration,activeActorId:(id==='owner'||collaboration.members.some(m=>m.id===id&&m.status==='joined'))?id:'owner'};
}
export function activeActorName(raw){
  const collaboration=normalizeCollaboration(raw);
  return collaboration.members.find(m=>m.id===collaboration.activeActorId)?.name||'我';
}
export function inviteCopyText(destination,members){
  const place=String(destination||'我们的下一段旅行').trim()||'我们的下一段旅行';
  const names=normalizeCollaboration({members}).members.map(m=>m.name).join('、')||'同行好友';
  return `【游历本·同游邀请｜本地原型演示】\n我正在规划「${place}」，邀请 ${names} 一起安排景点和日程。\n请在演示页面点击「模拟接受邀请」，体验加入团队与共同编辑。\n提示：这是课堂用的模拟邀请说明，不含真实加入链接，无法跨设备联机。`;
}
