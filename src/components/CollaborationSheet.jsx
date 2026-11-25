import React,{useState} from 'react';
import {Check,CheckCircle2,Copy,Plus,Trash2,UserRound,UserRoundPlus,UsersRound} from 'lucide-react';
import {BottomSheet} from './UI.jsx';
import {addCollaborator,activeActorName,DEMO_FRIENDS,inviteCopyText,joinCollaborator,normalizeCollaboration,removeCollaborator,selectActor} from '../data/tripCollaboration.js';

async function copyText(value){
  if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(value);return true;}catch{/* Try older browsers below. */}}
  try{
    const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const ok=document.execCommand('copy');input.remove();return ok;
  }catch{return false;}
}

// 供第02页和第04页共用的同一个本地协作弹层，不影响其他原型页面。
export default function CollaborationSheet({collaboration,travelers,destination,onChange,onClose}){
  const current=normalizeCollaboration(collaboration);
  const [name,setName]=useState('');
  const [error,setError]=useState('');
  const [feedback,setFeedback]=useState('');
  const [showCopy,setShowCopy]=useState(false);
  const capacity=Math.max(0,Math.floor(Number(travelers)||1)-1);
  const available=capacity-current.members.length;
  const activeName=activeActorName(current);
  function add(value){
    const result=addCollaborator(current,value,travelers);
    if(result.error){setError(result.error);setFeedback('');return;}
    onChange(result.collaboration);setName('');setError('');setFeedback(`已向 ${String(value).trim()} 发出模拟邀请，可点击「模拟加入」`);
  }
  function join(id){const member=current.members.find(m=>m.id===id);onChange(joinCollaborator(current,id));setError('');setFeedback(`${member?.name||'好友'} 已模拟加入旅行规划`);}
  function remove(id){const member=current.members.find(m=>m.id===id);onChange(removeCollaborator(current,id));setError('');setFeedback(`已将 ${member?.name||'好友'} 移出邀请名单`);}
  function switchActor(id){const next=selectActor(current,id);onChange(next);setError('');setFeedback(`正在以「${activeActorName(next)}」的身份演示共同编辑`);}
  async function copy(){
    const ok=await copyText(inviteCopyText(destination,current.members));
    setShowCopy(true);
    setError(ok?'':'未获得剪贴板权限，你可以手动复制下方的邀请文字');
    setFeedback(ok?'模拟邀请说明已复制（不是真实邀请链接）':'');
  }
  return <BottomSheet title="邀请好友 · 共同规划" onClose={onClose}>
    <div className="collab-sheet-body">
      <div className="collab-sheet-intro"><span className="collab-sheet-eyebrow">TRAVEL TOGETHER / LOCAL DEMO</span><p>邀请旅伴一起决定景点和顺序，让每个人都能参与这份旅行计划。</p><small>仅模拟本浏览器中的邀请与协作，暂不支持真实账号、跨设备共享。</small></div>
      <div className="collab-sheet-count"><UsersRound size={16}/><strong>同行 {travelers} 人</strong><span>已邀请 {current.members.length}/{capacity} 位旅伴</span></div>
      <div className="collab-sheet-add">
        <label htmlFor="collab-friend-name">填写好友昵称</label>
        <form onSubmit={e=>{e.preventDefault();add(name)}}><input id="collab-friend-name" maxLength={12} placeholder="例如：小雨" value={name} onChange={e=>{setName(e.target.value);setError('')}}/><button type="submit" disabled={available<=0}><Plus size={15}/> 邀请</button></form>
        <div className="collab-sheet-suggestions"><span>快捷选择</span>{DEMO_FRIENDS.map(friend=><button type="button" key={friend} disabled={available<=0||current.members.some(m=>m.name===friend)} onClick={()=>add(friend)}>{friend} <Plus size={11}/></button>)}</div>
        {capacity===0&&<p className="collab-sheet-hint">目前是单人旅行。返回需求填写页，将同行人数改为 2 人或以上即可邀请。</p>}
        {available===0&&capacity>0&&<p className="collab-sheet-hint">邀请名额已满，如需更多旅伴，请先增加同行人数。</p>}
      </div>
      <div className="collab-sheet-members"><div className="collab-sheet-subtitle"><strong>同行伙伴</strong><small>点「模拟加入」完成邀请过程</small></div>
        <div className="collab-sheet-member"><span className="collab-avatar collab-avatar--owner"><UserRound size={15}/></span><div><strong>我 <small>· 发起人</small></strong><span>默认拥有编辑权限</span></div><button type="button" className={current.activeActorId==='owner'?'is-current':''} onClick={()=>switchActor('owner')}>{current.activeActorId==='owner'?<><Check size={12}/> 当前操作人</>:'切换为我'}</button></div>
        {current.members.map((member,i)=><div className="collab-sheet-member" key={member.id}><span className={`collab-avatar collab-avatar--${i%3}`}>{member.name.slice(0,1)}</span><div><strong>{member.name}</strong><span>{member.status==='joined'?'已加入 · 可模拟编辑':'等待加入（模拟）'}</span></div><div className="collab-sheet-member-actions">{member.status==='invited'?<button type="button" onClick={()=>join(member.id)}>模拟加入</button>:<button type="button" className={current.activeActorId===member.id?'is-current':''} onClick={()=>switchActor(member.id)}>{current.activeActorId===member.id?<><Check size={12}/> 操作中</>:'切换身份'}</button>}<button type="button" className="collab-member-remove" aria-label={`移除${member.name}`} onClick={()=>remove(member.id)}><Trash2 size={15}/></button></div></div>)}
        {current.members.length===0&&<div className="collab-sheet-empty"><UserRoundPlus size={19}/> 从上面邀请第一位旅行伙伴吧</div>}
      </div>
      <button type="button" className="collab-copy-button" onClick={copy}><Copy size={15}/> 复制模拟邀请说明</button>
      {showCopy&&<textarea className="collab-copy-text" aria-label="可手动复制的模拟邀请说明" readOnly rows={4} value={inviteCopyText(destination,current.members)} onFocus={e=>e.currentTarget.select()}/>}
      {(feedback||error)&&<p className={`collab-sheet-feedback ${error?'is-error':''}`} role="status">{error||<><CheckCircle2 size={14}/> {feedback}</>}</p>}
      <div className="collab-sheet-footer"><span>当前操作身份：{activeName}</span><button type="button" onClick={onClose}>完成 <Check size={14}/></button></div>
    </div>
  </BottomSheet>;
}
