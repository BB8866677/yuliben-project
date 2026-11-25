import React,{useEffect,useRef} from 'react';
import { ArrowRight, X } from 'lucide-react';

export function PrimaryButton({children, onClick, type='button', outline=false, className='', disabled=false}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`primary-button ${outline?'primary-button--outline':''} ${className}`}>{children}<ArrowRight size={18}/></button>;
}
export function SurfaceCard({children, className='', onClick}){
  const Tag=onClick?'button':'div';
  return <Tag onClick={onClick} className={`surface-card ${className}`}>{children}</Tag>;
}
export function SectionHeading({eyebrow, title, action, onAction}){
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action&&<button type="button" onClick={onAction} className="text-link">{action}<ArrowRight size={15}/></button>}</div>;
}
export function Chip({children, selected=false, onClick}) {
  return <button type="button" className={`chip ${selected?'chip--selected':''}`} onClick={onClick}>{children}</button>;
}
export function Toast({message,onClose}){
  if(!message)return null;
  return <div className="toast" role="status"><span>{message}</span><button type="button" aria-label="关闭提示" onClick={onClose}><X size={15}/></button></div>;
}
export function BottomSheet({title,children,onClose}) {
  const sheetRef=useRef(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement;
    sheetRef.current?.focus();
    const onKey=(event)=>{if(event.key==='Escape'){event.stopPropagation();closeRef.current?.();}};
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);previous?.focus?.();};
  },[]);
  return <div className="sheet-overlay" onClick={onClose} role="presentation"><div ref={sheetRef} tabIndex={-1} className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><div className="sheet-heading"><strong>{title}</strong><button type="button" onClick={onClose} aria-label="关闭"><X size={20}/></button></div>{children}</div></div>;
}
