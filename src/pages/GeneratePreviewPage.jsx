import React, {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Compass, MapPin, RefreshCcw, Sparkles, WandSparkles} from 'lucide-react';
import {PLAN_SUBMITTED_KEY} from './PlanNewPage.jsx';
import {createDemoItinerary,ITINERARY_KEY} from '../data/demoItinerary.js';

function readSubmitted(){try {const value=JSON.parse(localStorage.getItem(PLAN_SUBMITTED_KEY)||'null');return value&&typeof value==='object'?value:null;}catch{return null;}}
function shortDate(date){if(!date)return '未填写';const values=String(date).split('-');return values.length===3 ? `${Number(values[1])}月${Number(values[2])}日` : date;}
const phases=[
  {label:'整理旅行偏好',hint:'从你喜欢的旅行方式开始'},
  {label:'安排每日路线',hint:'为每一天留下合适的探索节奏'},
  {label:'整理预算建议',hint:'把整趟预算融入旅行安排'}
];

function RouteIllustration({runId,complete}){
  return <div className={`gen-artwork ${complete?'gen-artwork--done':''}`}>
    <span className="gen-artwork__label">✦ &nbsp; LITTLE JOURNEY MAP</span>
    <svg viewBox="0 0 320 206" role="img" aria-label="手绘山川间的一条旅行路线逐渐延伸至目的地">
      <defs>
        <linearGradient id="genSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f7f2e4"/><stop offset="1" stopColor="#ecf0e4"/></linearGradient>
      </defs>
      <rect width="320" height="206" fill="url(#genSky)"/>
      <g className="gen-artwork__cloud" fill="#fffaf0" opacity=".88"><path d="M32 39q9-13 19-3 13-11 20 4 14-4 19 8H26q-2-8 6-9Z"/><path d="M236 56q7-9 14-3 10-10 17 3 11-2 14 7h-48q-2-6 3-7Z"/></g>
      <circle cx="252" cy="36" r="18" fill="#ead0a5" opacity=".9"/>
      <path d="M0 139C27 118 44 113 68 119c18-27 36-46 63-35 21 9 31 32 52 30 21-27 41-49 66-32 24 17 44 43 71 42V206H0Z" fill="#c4d3b9"/>
      <path d="M0 158c35-15 65-8 92 2 39-33 74-30 111-11 41-27 76-18 117 3v54H0Z" fill="#a6bca0"/>
      <path d="M0 180c44-12 85-3 118 5 57-23 103-17 202-7v28H0Z" fill="#86a384"/>
      <g fill="none" stroke="#688b73" strokeWidth="2" strokeLinecap="round" opacity=".7"><path d="M18 161v-20m-9 9 9-10 9 10m-14-2 5-8 5 8"/><path d="M281 139v-26m-9 11 9-15 9 15m-14-5 5-10 5 10"/><path d="M299 162v-20m-9 9 9-13 9 13"/></g>
      <path d="M32 200C66 180 58 155 102 158c44 2 36-27 80-34 43-6 43-34 87-55" stroke="#fff9e9" strokeWidth="12" fill="none" strokeLinecap="round" opacity=".8"/>
      <path d="M32 200C66 180 58 155 102 158c44 2 36-27 80-34 43-6 43-34 87-55" stroke="#d8a67d" strokeWidth="2.7" fill="none" strokeLinecap="round" strokeDasharray="3 9" opacity=".8"/>
      <path key={runId} className="gen-artwork__draw" pathLength="100" d="M32 200C66 180 58 155 102 158c44 2 36-27 80-34 43-6 43-34 87-55" stroke="#6d9477" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="100"/>
      <g className="gen-artwork__pin"><path d="M267 51c-10 0-17 7-17 17 0 11 17 29 17 29s17-18 17-29c0-10-7-17-17-17Z" fill="#c77d63"/><circle cx="267" cy="68" r="6" fill="#fff8ed"/></g>
      <g className="gen-artwork__start"><circle cx="32" cy="199" r="5" fill="#c77d63" stroke="#fff9ef" strokeWidth="2"/></g>
    </svg>
    <span className="gen-artwork__footer">走过的路，终将成为故事的一部分</span>
  </div>;
}

export default function GeneratePreviewPage(){
  const navigate=useNavigate();
  const {state}=useLocation();
  const submitted=state?.submitted;
  const input=useMemo(()=>submitted||readSubmitted(),[submitted]);
  const [runId,setRunId]=useState(0);
  const [phase,setPhase]=useState(0);
    const plan=useMemo(()=>input?createDemoItinerary(input,runId):null,[input,runId]);
  useEffect(()=>{
    if(!input)return;
    setPhase(0);
    const timers=[setTimeout(()=>setPhase(current=>Math.max(current,1)),1250),setTimeout(()=>setPhase(current=>Math.max(current,2)),2500),setTimeout(()=>setPhase(3),4200)];
    return()=>timers.forEach(clearTimeout);
  },[runId,input]);
  function saveAndContinue(){
    if(!plan)return;
    try{localStorage.setItem(ITINERARY_KEY,JSON.stringify(plan));}catch{/*Demo remains navigable*/}
    navigate(`/trip/${encodeURIComponent(plan.id)}`,{state:{generatedPlan:plan}});
  }
  if(!input)return <div className="gen-page gen-page--empty">
    <span className="plan-eyebrow">AN ADVENTURE STARTS WITH A PLAN</span>
    <RouteIllustration runId={runId} complete={true}/>
    <h1>还没有收到你的旅行想法</h1>
    <p>先填写旅行目的地、日期与预算，再来为这段旅程画一条路线吧。</p>
    <button type="button" className="plan-submit-button" onClick={()=>navigate('/plan/new')}>去填写旅行需求 <ArrowRight size={16}/></button>
  </div>;
  const ready=phase>=3;
  return <div className="gen-page" aria-label="AI旅行模拟生成与预览">
    {!ready ? <>
      <div className="gen-heading">
        <span className="plan-eyebrow">TRAVEL PLANNER / 02</span>
        <h1>正在描绘<em>你的旅程…</em></h1>
        <p>从「{input.destination}」开始，一笔一笔整理沿途的风景。</p>
      </div>
      <RouteIllustration runId={runId} complete={false}/>
      <div className="gen-progress" aria-live="polite" aria-atomic="true">
        <div className="gen-progress__top"><strong>{phases[Math.min(phase,2)].label}</strong><span>{[28,64,88][Math.min(phase,2)]}%</span></div>
        <div className="gen-progress__bar"><i style={{width:`${[28,64,88][Math.min(phase,2)]}%`}}/></div>
        <div className="gen-progress__steps">
          {phases.map((step,index)=><div className={`gen-progress__step ${index<phase?'is-finished':index===phase?'is-current':''}`} key={step.label}>
            <span className="gen-progress__symbol">{index<phase?<Check size={13}/>:index===phase?<span className="gen-progress__active"/>:<Circle size={14}/>}</span>
            <div><strong>{step.label}</strong><small>{step.hint}</small></div>
          </div>)}
        </div>
      </div>
      <div className="gen-wait-foot"><span>✦</span> 让旅行计划慢慢成形，就像翻开一本新日记</div>
      <button type="button" className="gen-skip" onClick={()=>setPhase(3)}>跳过等待，直接查看示例预览 <ArrowRight size={14}/></button>
    </> : <div className="gen-complete" key={`complete-${runId}`}>
      <div className="gen-complete__top"><span className="plan-eyebrow">YOUR JOURNEY IS READY</span><span className="gen-seal">READY<br/>TO GO ✦</span></div>
      <div className="gen-complete__heading"><CheckCircle2 size={23}/><h1>旅行计划，<em>准备好啦！</em></h1></div>
      <p className="gen-complete__intro">你的旅程已经有了一个初步轮廓，接下来可以慢慢调整每一天。</p>
      <div className="gen-cover">
        <span className="gen-cover__eyebrow">A LITTLE TRAVEL PLAN · NO. {String(runId+1).padStart(2,'0')}</span>
        <h2>{input.destination}<span> · {plan.days}日游</span></h2>
        <div className="gen-cover__tags"><span>{shortDate(input.startDate)}—{shortDate(input.endDate)}</span><span>{input.travelers} 人同行</span><span>总预算 ¥{Number(input.totalBudget).toLocaleString('zh-CN')}</span><span>{input.pace}</span></div>
        <span className="gen-cover__line" aria-hidden="true"/>
        <p>偏好 / {input.interests?.length?input.interests.join(' · '):'自由探索'}</p>
      </div>
      <div className="gen-days-heading"><h2>旅程目录</h2><span>DAILY NOTES</span></div>
      <div className="gen-daylist">
        {plan.itinerary.slice(0,3).map(item=><article key={item.day} className="gen-day">
           <span className="gen-day__number"><small>DAY</small><strong>{String(item.day).padStart(2,'0')}</strong></span>
           <div className="gen-day__body"><strong>{item.title}</strong><span>{item.spots}</span><small>{item.note}</small></div>
         </article>)}
      </div>
      {plan.days>3&&<p className="gen-more-days">还有 {plan.days-3} 天的安排，前往行程详情继续查看。</p>}
      <div className="gen-disclaimer"><Sparkles size={14}/><span>这里展示的是根据输入条件匹配的演示行程，不是实时 AI 结果。营业时间、路线及费用请以官方信息为准。</span></div>
      <button type="button" className="plan-submit-button gen-primary" onClick={saveAndContinue}><span>查看完整行程</span><ArrowRight size={18}/></button>
      <div className="gen-actions"><button type="button" onClick={()=>setRunId(v=>v+1)}><RefreshCcw size={14}/> 重新生成</button><button type="button" onClick={()=>navigate('/plan/new')}><ArrowLeft size={14}/> 修改旅行需求</button></div>
    </div>}
  </div>;
}
