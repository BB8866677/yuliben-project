import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, Compass, FilePenLine, ImagePlus, MapPinned, Package, ShoppingBag, Sparkles, WandSparkles } from 'lucide-react';
import {SCREEN_INFO} from '../data/screens.js';
import {PrimaryButton} from '../components/UI.jsx';

const icons={
 '02':Compass,'03':Sparkles,'04':MapPinned,'05':CalendarDays,'06':ImagePlus,
 '07':FilePenLine,'08':Package,'09':ShoppingBag
};
const nextPath={
 '02':'/plan/generate','03':'/trip/demo-hangzhou','04':'/journal/create','05':'/trip/demo-hangzhou',
 '06':'/journal/edit/demo','07':'/print/customize','08':'/orders','09':'/'
};

export default function PlaceholderPage({number}){
 const navigate=useNavigate();const data=SCREEN_INFO.find(x=>x.number===number);
 const Icon=icons[number]||BookOpen;
 return <div className="placeholder-page"><div className="placeholder-eyebrow">SCREEN {number} / 09 <span>✳</span></div>
   <div className="placeholder-visual"><span className="placeholder-orbit placeholder-orbit--one"/><span className="placeholder-orbit placeholder-orbit--two"/><div className="placeholder-symbol"><Icon size={57} strokeWidth={1.25}/></div><span className="placeholder-visual__label">YULIBEN · APP PROTOTYPE</span></div>
   <span className="eyebrow">{data.subtitle}</span><h1>{data.title}</h1><p className="placeholder-description">{data.description}</p>
   <div className="placeholder-notice"><WandSparkles size={18}/><span><strong>页面框架已建立</strong><br/>此页为后续开发占位，完整功能将在后续逐页加入。</span></div>
   <section className="placeholder-tasks"><h2>后续将在本页实现</h2><div>{data.features.map(item=><div className="placeholder-task" key={item}><Check size={15}/><span>{item}</span></div>)}</div></section>
   <PrimaryButton onClick={()=>navigate(nextPath[number])}>预览下一环节</PrimaryButton>
   <button type="button" className="placeholder-back" onClick={()=>navigate('/')}><ArrowLeft size={16}/>返回首页</button>
   <p className="prototype-hint">所有跳转用于检查九页导航连通性，不代表相关功能已实现。</p>
 </div>
}
