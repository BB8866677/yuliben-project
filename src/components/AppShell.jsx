import React, {useEffect, useRef, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BatteryFull, BookOpen, Compass, House, Map, MoreHorizontal, Signal, Wifi } from 'lucide-react';
import {BrandName} from './Brand.jsx';
import {BottomSheet,Toast} from './UI.jsx';

const navigation = [
  {path:'/',label:'首页',Icon:House},
  {path:'/plan/new',label:'AI规划',Icon:Compass},
  {path:'/trips',label:'我的行程',Icon:Map},
  {path:'/journal/create',label:'旅行手账',Icon:BookOpen},
];

const pageTitles=[
  [/^\/plan\/new$/, '创建旅行'],[/^\/plan\/generate$/, 'AI 旅行规划'],
  [/^\/trip\//,'行程详情'],[/^\/trips$/, '我的行程'],
  [/^\/journal\/create$/,'生成手账'],[/^\/journal\/edit\//,'编辑手账'],
  [/^\/print\/customize$/,'实体定制'],[/^\/orders$/,'我的订单']
];

export default function AppShell({children}){
  const {pathname}=useLocation();const navigate=useNavigate();
  const [toast,setToast]=useState('');const [menuOpen,setMenuOpen]=useState(false);
  const scrollRef=useRef(null);
  const isHome=pathname==='/';
  const isEditor=/^\/journal\/edit\//.test(pathname);
  const hideNav=/^\/plan\/new$|^\/plan\/generate$|^\/trip\/|^\/journal\/edit\/|^\/print\/customize$|^\/orders$/.test(pathname);
  const title=pageTitles.find(([pattern])=>pattern.test(pathname))?.[1]||'游历本';
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTo(0,0);setMenuOpen(false)},[pathname]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(t)},[toast]);
  const goBack=()=>{if(window.history.state?.idx>0)navigate(-1);else navigate('/')};
  return <div className={`app-stage ${isEditor?'app-stage--editor':''}`}>
    <div className="stage-left" aria-hidden="true">
      <span className="stage-kicker">YOUR JOURNEY, YOUR STORY.</span>
      <span className="stage-line"/>
      <h1>把每一次出发，<br/><em>写成自己的故事。</em></h1>
      <p>AI 旅行规划 · 旅行记录 · 手账创作</p>
      <div className="stage-decor"><span>✦</span><span className="stage-stamp">TRAVEL<br/>JOURNAL<br/>2026</span></div>
      <small>游历本 · 高保真手机交互原型 / 九页完整课堂演示版</small>
    </div>
    <div className={`phone-frame ${isEditor?'phone-frame--editor':''}`}>
      <div className="phone-camera" aria-hidden="true"/>
      <div className={`app-screen ${isEditor?'app-screen--editor':''}`}>
        <div className="status-bar"><span>9:41</span><div className="status-icons"><Signal size={13} fill="currentColor"/><Wifi size={14}/><BatteryFull size={19}/></div></div>
        <header className={`top-bar ${isHome?'top-bar--home':''}`}>
          {isHome?<><BrandName compact/><button type="button" className="top-action" onClick={()=>setMenuOpen(true)} aria-label="更多信息"><MoreHorizontal size={21}/></button></>:
          <><button type="button" className="icon-button" onClick={goBack} aria-label="返回上一页"><ArrowLeft size={21}/></button><strong>{title}</strong><button type="button" className="top-action" onClick={()=>setMenuOpen(true)} aria-label="更多信息"><MoreHorizontal size={21}/></button></>}
        </header>
        <main className={`page-scroll ${hideNav?'page-scroll--full':''} ${isEditor?'page-scroll--editor':''}`} ref={scrollRef}>{children}</main>
        {!hideNav&&<nav className="bottom-nav" aria-label="底部导航">
          {navigation.map(({path,label,Icon})=>{const active=pathname===path;return <button key={path} className={`bottom-nav__item ${active?'is-active':''}`} type="button" onClick={()=>navigate(path)} aria-current={active?'page':undefined}><Icon size={20} strokeWidth={active?2.25:1.75}/><span>{label}</span><i/></button>})}
        </nav>}
        <Toast message={toast} onClose={()=>setToast('')}/>
        {menuOpen&&<BottomSheet title="关于游历本" onClose={()=>setMenuOpen(false)}>
          <div className="sheet-body demo-guide"><p>一款以 AI 旅行规划为核心、手绘旅行手账为特色的九页手机交互原型。</p>
            <strong className="demo-guide__heading">课堂展示路线</strong>
            <ol className="demo-guide__steps"><li>填写目的地、日期、预算与旅行偏好</li><li>查看模拟规划，逐日编辑并保存行程</li><li>从已保存行程生成手账初稿</li><li>自由编辑照片、文字、涂鸦并保存</li><li>选择 3D 实体书封面和材质，创建模拟订单</li><li>在订单页打开展开式信纸，演示制作进度</li></ol>
            <p className="sheet-note">演示说明：AI 文案、路线、价格、订单和物流进度均为本地模拟；照片保存在当前浏览器。请不要清除站点数据。</p>
            <div className="demo-guide__shortcuts">
              {[['开启规划','/plan/new'],['我的行程','/trips'],['旅行手账','/journal/create'],['模拟订单','/orders']].map(([label,path])=><button type="button" key={path} onClick={()=>{setMenuOpen(false);navigate(path)}}>{label}</button>)}
            </div>
            <button type="button" className="sheet-close-btn" onClick={()=>setMenuOpen(false)}>返回 App</button>
          </div>
        </BottomSheet>}
      </div>
    </div>
    <div className="stage-right" aria-hidden="true"><div className="stage-vertical">DESIGNED FOR THE LITTLE MOMENTS</div><div className="stage-orbit">✳</div></div>
  </div>
}
