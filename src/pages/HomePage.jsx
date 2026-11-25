import { SITE_BASE } from '../data/siteBase.js';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { SectionHeading } from '../components/UI.jsx';
import {readSavedTrips} from '../data/demoItinerary.js';
import {tripCover,prettyTripSpan} from '../data/tripPresentation.js';

const quickActions = [
  {
    id: 'planning', title: 'AI 旅行规划', desc: '把想去的地方，连成一段旅程',
    path: '/plan/new', art: (SITE_BASE + 'images/feature-illustrations/planning.png'),
    number: '01', tag: 'PLAN A JOURNEY'
  },
  {
    id: 'itineraries', title: '我的行程', desc: '收藏每一次出发',
    path: '/trips', art: (SITE_BASE + 'images/feature-illustrations/itineraries.png'),
    number: '02', tag: 'MY JOURNEYS'
  },
  {
    id: 'journal', title: '旅行手账', desc: '把沿途的故事慢慢写下来',
    path: '/journal/create', art: (SITE_BASE + 'images/feature-illustrations/journal.png'),
    number: '03', tag: 'TRAVEL NOTES'
  },
  {
    id: 'keepsake', title: '实体纪念', desc: '让旅途的回忆触手可及',
    path: '/print/customize', art: (SITE_BASE + 'images/feature-illustrations/keepsake.png'),
    number: '04', tag: 'KEEP THE MEMORY'
  }
];

function SmallSun() {
  return <svg className="welcome-illustration" viewBox="0 0 100 96" aria-hidden="true">
    <path d="M14 73c15-6 20-5 29-2 6 2 14 2 22-2 9-4 13-4 22-1" fill="none" stroke="#AAB79A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M23 83c9-3 14-3 22-1m14 0c9-3 15-3 23-2" fill="none" stroke="#D7BC9E" strokeWidth="1.7" strokeLinecap="round"/>
    <circle cx="50" cy="41" r="16" fill="#F1D6A7" opacity=".72"/>
    <path d="M50 9v10m0 44v9m32-31H72M28 41H18m9-23 7 7m33 33 7 7m0-47-7 7M34 58l-7 7" fill="none" stroke="#D8AE85" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 55c-5-5-8-5-12-4m63-4c5-3 10-3 14-2" fill="none" stroke="#A6B39C" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}

export default function HomePage(){
  const navigate = useNavigate();
  const latestTrip = readSavedTrips()[0] || null;
  const recentCover = latestTrip ? tripCover(latestTrip) : null;
  return <div className="home-page home-page--illustrated">
    <div className="home-intro">
      <div>
        <span className="eyebrow">A LITTLE NOTE FOR TODAY</span>
        <h1>下一站，<br/><em>去哪里看看？</em></h1>
        <p>把沿途的风景，慢慢写进游历本。</p>
      </div>
      <SmallSun />
    </div>

    <section className="hero-scene" aria-label="开启新旅行">
      <img src={SITE_BASE + 'images/hero-journey.jpg'} alt="有温暖阳光和山野风景的旅行照片"/>
      <div className="hero-scene__grain" aria-hidden="true" />
      <div className="hero-scene__top">
        <span className="hero-tag">A LITTLE JOURNEY</span>
        <span className="hero-number">VOL. 01 · TRAVEL</span>
      </div>
      <div className="hero-scene__body">
        <span>为每一次出发，做足准备</span>
        <h2>想去的地方，<br/>慢慢连成路线。</h2>
        <button type="button" onClick={()=>navigate('/plan/new')}>开始 AI 规划 <ArrowRight size={16}/></button>
      </div>
    </section>

    <div className="home-caption" aria-hidden="true"><span>✦</span><span>把旅程写成一页页值得收藏的故事</span><span>✦</span></div>

    <section className="home-section home-features" aria-label="功能入口">
      <SectionHeading eyebrow="PAGES OF THE JOURNEY" title="今天，想做点什么？" />
      <div className="quick-grid">
        {quickActions.map((item) => <button
          key={item.id}
          type="button"
          onClick={()=>navigate(item.path)}
          className={`quick-card quick-card--${item.id}`}
          aria-label={`${item.title}：${item.desc}`}
        >
          <span className="quick-card__meta" aria-hidden="true"><span>{item.number}</span><i/></span>
          <span className="quick-card__art"><img src={item.art} alt="" loading="lazy" /></span>
          <span className="quick-card__copy"><strong>{item.title}</strong><small>{item.desc}</small></span>
          <span className="quick-card__go" aria-hidden="true"><ArrowRight size={15}/></span>
        </button>)}
      </div>
      <p className="feature-footnote">✎ &nbsp; 从出发前的计划，到旅途后的珍藏</p>
    </section>

    <section className="home-section home-section--trips">
      <SectionHeading eyebrow="YOUR JOURNEY FILES" title="最近的旅程" action="查看全部" onAction={()=>navigate('/trips')}/>
      {latestTrip ? <button type="button" className="recent-trip" onClick={()=>navigate(`/trip/${encodeURIComponent(latestTrip.id)}`)}>
        <div className="recent-trip__image"><img src={recentCover.src} alt={recentCover.verified?`${latestTrip.destination}旅行封面摄影`:'旅行封面示意图片'} loading="lazy" onError={(event)=>{if(!event.currentTarget.dataset.fallback){event.currentTarget.dataset.fallback='1';event.currentTarget.src=recentCover.fallback;}}}/><span>已收藏</span></div>
        <div className="recent-trip__details">
          <span className="recent-trip__eyebrow">LATEST JOURNEY</span>
          <strong>{latestTrip.destination} · {latestTrip.days}日漫游</strong>
          <span><MapPin size={12}/> {latestTrip.requirements?.pace||'慢慢探索'}</span>
          <span><CalendarDays size={12}/> {prettyTripSpan(latestTrip)}</span>
        </div>
        <ChevronRight size={17} className="recent-trip__chevron" />
      </button> : <button type="button" className="recent-trip recent-trip--empty" onClick={()=>navigate('/plan/new')}>
        <div className="recent-trip__image"><img src={SITE_BASE + 'images/itinerary/scene-1.jpg'} alt="旅行插画风景示意"/><span>新的旅程</span></div>
        <div className="recent-trip__details"><span className="recent-trip__eyebrow">A BLANK PAGE</span><strong>你的第一段旅程，还在等你开启</strong><span>写下期待，收藏自己的旅行计划</span><span>点击开始规划 <ArrowRight size={12}/></span></div>
      </button>}
    </section>

    <section className="diary-feature">
      <div className="diary-feature__graphic"><img src={SITE_BASE + 'images/journal-memory-watercolor.jpg'} width="1200" height="810" alt="打开的水彩旅行手账、山水记录与手绘植物"/><span>TRAVEL<br/>NOTES</span></div>
      <div className="diary-feature__copy"><span className="eyebrow">KEEP THE MEMORIES</span><h2>旅途的故事，<br/>不止在地图上。</h2><p>确认行程后，轻松整理成属于自己的旅行手账。</p><button type="button" onClick={()=>navigate('/journal/create')}>开始记录 <ArrowRight size={15}/></button></div>
    </section>
    <div className="home-footer">✦ &nbsp; EVERY JOURNEY TELLS A STORY &nbsp; ✦</div>
  </div>;
}
