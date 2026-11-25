import { SITE_BASE } from '../data/siteBase.js';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {createPortal} from 'react-dom';
import CollaborationSheet from '../components/CollaborationSheet.jsx';
import {normalizeCollaboration} from '../data/tripCollaboration.js';
import {ArrowRight, CalendarDays, Check, Heart, MapPin, Minus, Plus, Wallet, Users, UserRoundPlus, ChevronRight, WandSparkles} from 'lucide-react';

export const PLAN_DRAFT_KEY = 'yuliben.plan.draft.v1';
export const PLAN_SUBMITTED_KEY = 'yuliben.plan.submitted.v1';

const interests = ['自然风光', '城市漫游', '美食探索', '历史人文', '拍照打卡', '休闲放松'];
const travelPaces = [
  {title:'悠闲慢游', subtitle:'慢慢走，慢慢看'},
  {title:'适中安排', subtitle:'松弛与探索兼顾'},
  {title:'充实探索', subtitle:'想看的尽量都去'}
];
const emptyForm = {destination:'', startDate:'', endDate:'', travelers:2, totalBudget:'', interests:[], pace:'悠闲慢游', collaboration:normalizeCollaboration(null)};

function getSavedDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAN_DRAFT_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return {...emptyForm};
    return {
      ...emptyForm,
      ...saved,
      travelers: Number.isFinite(+saved.travelers) ? Math.max(1,Math.min(20,Math.floor(+saved.travelers))) : 2,
      interests: Array.isArray(saved.interests) ? saved.interests.filter(x=>interests.includes(x)) : [],
      pace: travelPaces.some(x=>x.title===saved.pace) ? saved.pace : '悠闲慢游',
      collaboration:normalizeCollaboration(saved.collaboration)
    };
  } catch { return {...emptyForm}; }
}

function toDayCount(start,end){
  if(!start || !end) return null;
  const a=Date.parse(`${start}T00:00:00Z`), b=Date.parse(`${end}T00:00:00Z`);
  if(!Number.isFinite(a)||!Number.isFinite(b)||b<a) return null;
  return Math.round((b-a)/86400000)+1;
}

export default function PlanNewPage(){
  const navigate=useNavigate();
  const [form,setForm]=useState(getSavedDraft);
  const [errors,setErrors]=useState({});
  const [collabOpen,setCollabOpen]=useState(false);
  const overlayRoot=typeof document!=='undefined'?document.querySelector('.app-screen'):null;
  const collab=form.collaboration||normalizeCollaboration(null);
  const destinationRef=useRef(null);
  const dayCount=useMemo(()=>toDayCount(form.startDate,form.endDate),[form.startDate,form.endDate]);

  useEffect(()=>{
    try {localStorage.setItem(PLAN_DRAFT_KEY,JSON.stringify(form));} catch {/* Private mode or storage disabled: the live form still works. */}
  },[form]);

  function update(field,value){
    setForm(current=>({...current,[field]:value}));
    setErrors(current=>({...current,[field]:undefined, dates:undefined}));
  }
  function changeTravelers(delta){
    setForm(current=>({...current,travelers:Math.min(20,Math.max(1,Math.max(current.collaboration?.members?.length+1||1,current.travelers+delta)))}));
  }
  function toggleInterest(name){
    setForm(current=>({...current,interests:current.interests.includes(name)?current.interests.filter(x=>x!==name):[...current.interests,name]}));
  }
  function submit(event){
    event.preventDefault();
    const nextErrors={};
    if(!form.destination.trim()) nextErrors.destination='请填写想去的目的地';
    if(!form.startDate || !form.endDate) nextErrors.dates='请选择出发日期和结束日期';
    else if(!dayCount) nextErrors.dates='结束日期不能早于出发日期';
    const budget=Number(form.totalBudget);
    if(!String(form.totalBudget).trim() || !Number.isFinite(budget) || budget<=0 || budget>10000000) nextErrors.totalBudget='请输入合理的整趟旅行预算';
    if(Object.keys(nextErrors).length){
      setErrors(nextErrors);
      if(nextErrors.destination) destinationRef.current?.focus();
      return;
    }
    const submitted={
      ...form,
      destination:form.destination.trim(),
      totalBudget:budget,
      travelers:form.travelers,
      tripDays:dayCount,
      submittedAt:new Date().toISOString()
    };
    try {localStorage.setItem(PLAN_SUBMITTED_KEY,JSON.stringify(submitted));} catch {/* Other pages can still use navigation, but refresh persistence is unavailable. */}
    navigate('/plan/generate',{state:{submitted}});
  }

  return <div className="plan-page">
    <div className="plan-intro">
      <span className="plan-eyebrow">A LITTLE PLAN FOR YOUR NEXT JOURNEY <span>· 01 / 02</span></span>
      <h1>下一站，<em>想去哪里？</em></h1>
      <p>告诉游历本你的旅行期待，慢慢拼出下一段旅程。</p>
      <div className="plan-artboard" aria-hidden="true">
        <span className="plan-artboard__note">YOUR TRAVEL STORY BEGINS HERE</span>
        <img src={SITE_BASE + 'images/feature-illustrations/planning-banner.png'} alt="" />
        <span className="plan-artboard__corner">✳</span>
      </div>
    </div>

    <form className="plan-form" onSubmit={submit} noValidate>
      <div className="plan-form-section">
        <div className="plan-section-heading"><span className="plan-section-number">01</span><label htmlFor="plan-destination">你想去哪里？</label><MapPin size={15}/></div>
        <div className={`plan-input-wrap ${errors.destination?'has-error':''}`}>
          <MapPin size={18} aria-hidden="true"/>
          <input ref={destinationRef} id="plan-destination" name="destination" autoComplete="off" placeholder="例如：杭州、成都、厦门" value={form.destination} onChange={e=>update('destination',e.target.value)} maxLength={40} aria-invalid={Boolean(errors.destination)}/>
        </div>
        {errors.destination&&<span className="plan-error" role="alert">{errors.destination}</span>}
        <p className="plan-field-note">可以填写城市或具体的旅行目的地</p>
      </div>

      <div className="plan-form-section">
        <div className="plan-section-heading"><span className="plan-section-number">02</span><span>旅行日期</span><CalendarDays size={15}/></div>
        <div className="plan-date-grid">
          <label className={`plan-date-field ${errors.dates?'has-error':''}`}>
            <span>出发日期</span>
            <input type="date" name="startDate" aria-label="出发日期" value={form.startDate} onChange={e=>update('startDate',e.target.value)}/>
          </label>
          <label className={`plan-date-field ${errors.dates?'has-error':''}`}>
            <span>结束日期</span>
            <input type="date" name="endDate" aria-label="结束日期" min={form.startDate||undefined} value={form.endDate} onChange={e=>update('endDate',e.target.value)}/>
          </label>
        </div>
        {errors.dates&&<span className="plan-error" role="alert">{errors.dates}</span>}
        {dayCount&&<p className="plan-field-note plan-field-note--success"><Check size={12}/>共 {dayCount} 天的旅行时光</p>}
      </div>

      <div className="plan-form-section">
        <div className="plan-section-heading"><span className="plan-section-number">03</span><span>人数与总预算</span><Wallet size={15}/></div>
        <div className="plan-stats-grid">
          <div className="plan-stat-card">
            <div className="plan-stat-label"><Users size={14}/>同行人数</div>
            <div className="plan-stepper">
              <button type="button" onClick={()=>changeTravelers(-1)} disabled={form.travelers<=Math.max(1,collab.members.length+1)} aria-label="减少同行人数"><Minus size={15}/></button>
              <strong>{form.travelers}<small> 人</small></strong>
              <button type="button" onClick={()=>changeTravelers(1)} disabled={form.travelers>=20} aria-label="增加同行人数"><Plus size={15}/></button>
            </div>
          </div>
          <label className={`plan-stat-card plan-stat-card--budget ${errors.totalBudget?'has-error':''}`}>
            <span className="plan-stat-label"><Wallet size={14}/>整趟旅行总预算</span>
            <span className="plan-budget-input"><strong>¥</strong><input type="number" name="totalBudget" min="1" max="10000000" step="100" inputMode="numeric" placeholder="2000" value={form.totalBudget} onChange={e=>update('totalBudget',e.target.value)} aria-invalid={Boolean(errors.totalBudget)}/></span>
          </label>
        </div>
        {errors.totalBudget&&<span className="plan-error" role="alert">{errors.totalBudget}</span>}
        <p className="plan-field-note">预算为本次旅行全部同行者的总预算，非人均预算</p>
        <button type="button" className="plan-collab-entry" onClick={()=>setCollabOpen(true)}>
          <span className="plan-collab-entry__icon"><UserRoundPlus size={19}/></span>
          <span className="plan-collab-entry__copy"><strong>邀请好友共同规划</strong><small>{collab.members.length?`已邀请 ${collab.members.length} 位旅伴 · ${collab.members.filter(m=>m.status==='joined').length} 位已模拟加入`:'一起讨论路线、景点和行程安排'}</small></span>
          <ChevronRight size={17}/>
        </button>
      </div>

      <div className="plan-form-section">
        <div className="plan-section-heading"><span className="plan-section-number">04</span><span>你喜欢怎样的风景？</span><Heart size={15}/></div>
        <p className="plan-section-desc">可以多选，让行程更贴近你的兴趣。</p>
        <div className="plan-interest-grid" role="group" aria-label="旅行兴趣偏好（可多选）">
          {interests.map(x=><button type="button" key={x} className={`plan-interest-chip ${form.interests.includes(x)?'is-chosen':''}`} aria-pressed={form.interests.includes(x)} onClick={()=>toggleInterest(x)}>{form.interests.includes(x)&&<Check size={12}/>}<span>{x}</span></button>)}
        </div>
      </div>

      <div className="plan-form-section plan-form-section--last">
        <div className="plan-section-heading"><span className="plan-section-number">05</span><span>旅途中想走多快？</span><WandSparkles size={15}/></div>
        <div className="plan-pace-grid" role="radiogroup" aria-label="旅行节奏">
          {travelPaces.map(p=><button type="button" role="radio" aria-checked={form.pace===p.title} key={p.title} className={`plan-pace-card ${form.pace===p.title?'is-chosen':''}`} onClick={()=>update('pace',p.title)}><span>{p.title}</span><small>{p.subtitle}</small></button>)}
        </div>
      </div>

      <div className="plan-submit-area">
        <span className="plan-submit-note">✦ &nbsp; 你的想法，将成为下一段旅程的起点</span>
        <button type="submit" className="plan-submit-button"><span>生成我的旅行计划</span><ArrowRight size={18}/></button>
      </div>
    </form>
    {collabOpen&&(overlayRoot?createPortal(<CollaborationSheet collaboration={collab} travelers={form.travelers} destination={form.destination} onChange={next=>setForm(old=>({...old,collaboration:next}))} onClose={()=>setCollabOpen(false)}/>,overlayRoot):<CollaborationSheet collaboration={collab} travelers={form.travelers} destination={form.destination} onChange={next=>setForm(old=>({...old,collaboration:next}))} onClose={()=>setCollabOpen(false)}/>)}
  </div>;
}
