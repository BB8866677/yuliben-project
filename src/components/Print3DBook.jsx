import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {RotateCcw,RotateCw,BookOpen} from 'lucide-react';
import {renderPrintCover} from '../data/printCoverArt.js';
import {PrintCoverFlat} from './PrintBook.jsx';

function pageEdgeCanvas(){
 const c=document.createElement('canvas');c.width=128;c.height=512;
 const x=c.getContext('2d');x.fillStyle='#f4eddf';x.fillRect(0,0,c.width,c.height);
 for(let i=0;i<512;i+=3){x.strokeStyle=i%9===0?'rgba(126,113,92,.25)':'rgba(188,170,146,.25)';x.beginPath();x.moveTo(0,i);x.lineTo(128,i);x.stroke();}
 return c;
}
function finishFor(material){
 if(material==='kraft')return {base:'#a6805d',spine:'#8b6545',roughness:.97};
 if(material==='cream')return {base:'#e9dac1',spine:'#c5ae8c',roughness:.85};
 return {base:'#829780',spine:'#657b64',roughness:1};
}
/** A real WebGL book built with Three.js meshes, not a CSS tilted rectangle.
 *  Cover and back textures are rebuilt from the user's selected design and text.
 *  All movement stays inside the existing phone preview.
 */
export function Print3DBook({journal,config,mediaUrls={},onOpen}){
 const host=useRef(null),world=useRef(null),yaw=useRef(.38),pitch=useRef(-.13);
 const [fallback,setFallback]=useState(false);
 const mediaUrl=config.coverMediaId&&mediaUrls[config.coverMediaId]||null;
 useEffect(()=>{
  const root=host.current;if(!root)return;
  let renderer,observer,raf=0,alive=true;
  const resources=[];
  try{
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.toneMapping=THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure=1.14;
   root.appendChild(renderer.domElement);
   const scene=new THREE.Scene();
   const camera=new THREE.PerspectiveCamera(30,1,.1,30);
   camera.position.set(0,.12,6.2);camera.lookAt(0,0,0);
   scene.add(new THREE.AmbientLight(0xffffff,2.2));
   const keyLight=new THREE.DirectionalLight(0xfff6e5,3.2);keyLight.position.set(-3,4,7);scene.add(keyLight);
   const fillLight=new THREE.DirectionalLight(0xd9e7e1,1.15);fillLight.position.set(4,-1,3);scene.add(fillLight);
   const book=new THREE.Group();scene.add(book);
   const fin=finishFor(config.material),square=config.size==='square';
   const w=square?2.20:1.83,h=square?2.20:2.66,depth=.22;
   const solid=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
   const coverSide=solid(fin.base,fin.roughness),spineMaterial=solid(fin.spine,.94);
   const edgeTex=new THREE.CanvasTexture(pageEdgeCanvas());edgeTex.colorSpace=THREE.SRGBColorSpace;edgeTex.anisotropy=renderer.capabilities.getMaxAnisotropy();resources.push(edgeTex);
   const pageMaterial=new THREE.MeshStandardMaterial({map:edgeTex,roughness:1,color:'#eee9dc'});
   const pageBlock=new THREE.Mesh(new THREE.BoxGeometry(w-.08,h-.08,depth),[pageMaterial,pageMaterial,solid('#f2eedf'),solid('#e7ddc8'),solid('#f6f1e7'),solid('#e7dfd0')]);
   pageBlock.position.set(.035,0,-.03);book.add(pageBlock);
   const backCanvas=document.createElement('canvas');backCanvas.width=512;backCanvas.height=720;
   const b=backCanvas.getContext('2d');b.fillStyle=fin.base;b.fillRect(0,0,512,720);
   b.strokeStyle='rgba(250,240,220,.52)';b.lineWidth=3;b.strokeRect(43,43,426,634);
   b.fillStyle=config.material==='kraft'?'#f8eddf':'#f6f1e5';b.textAlign='center';
   b.font='italic 26px Georgia,serif';b.fillText('YOUR JOURNEY, YOUR STORY',256,345);
   b.font='bold 26px Georgia,serif';b.fillText('✳  YOULIBEN',256,395);
   const backTexture=new THREE.CanvasTexture(backCanvas);backTexture.colorSpace=THREE.SRGBColorSpace;resources.push(backTexture);
   const backMaterials=[coverSide,coverSide,coverSide,coverSide,coverSide,new THREE.MeshStandardMaterial({map:backTexture,roughness:fin.roughness})];
   const back=new THREE.Mesh(new THREE.BoxGeometry(w,h,.048),backMaterials);back.position.z=-.165;book.add(back);
   const spine=new THREE.Mesh(new THREE.BoxGeometry(.115,h,.325),spineMaterial);spine.position.set(-w/2+.045,0,-.018);book.add(spine);
   const spineSeam=new THREE.Mesh(new THREE.BoxGeometry(.021,h,.08),solid(fin.spine,.95));spineSeam.position.set(-w/2+.137,0,.115);book.add(spineSeam);
   const frontGeo=new THREE.BoxGeometry(w,h,.054);
   const frontMaterial=[coverSide,coverSide,coverSide,coverSide,solid(fin.base),coverSide];
   const front=new THREE.Mesh(frontGeo,frontMaterial);front.position.z=.112;book.add(front);
   const gilt=new THREE.Mesh(new THREE.BoxGeometry(.012,h*.94,.066),solid('#dbcba6',.46));gilt.position.set(-w/2+.098,0,.143);book.add(gilt);
   // A faint soft contact shadow in its own transparent plane.
   const shadow=document.createElement('canvas');shadow.width=128;shadow.height=128;
   const s=shadow.getContext('2d'),grad=s.createRadialGradient(64,64,1,64,64,63);
   grad.addColorStop(0,'rgba(54,43,31,.27)');grad.addColorStop(.48,'rgba(60,49,36,.11)');grad.addColorStop(1,'rgba(54,43,31,0)');s.fillStyle=grad;s.fillRect(0,0,128,128);
   const shadowT=new THREE.CanvasTexture(shadow);resources.push(shadowT);
   const shadowPlane=new THREE.Mesh(new THREE.PlaneGeometry(3.0,1.3),new THREE.MeshBasicMaterial({map:shadowT,transparent:true,depthWrite:false,opacity:.62}));
   shadowPlane.position.set(.24,-h/2-.34,-.8);shadowPlane.rotation.x=-.93;scene.add(shadowPlane);
   function resize(){if(!alive)return;const rect=root.getBoundingClientRect();const ww=Math.max(rect.width,150),hh=Math.max(rect.height,180);renderer.setSize(ww,hh,false);camera.aspect=ww/hh;camera.position.z=hh/ww>1.2?6.35:6.15;camera.updateProjectionMatrix();}
   observer=new ResizeObserver(resize);observer.observe(root);resize();
   world.current={book,front,frontMaterial,renderer,scene,camera,resources};
   const animate=()=>{if(!alive)return;book.rotation.set(pitch.current,yaw.current,-.045);renderer.render(scene,camera);raf=requestAnimationFrame(animate);};animate();
   return()=>{alive=false;observer?.disconnect();cancelAnimationFrame(raf);if(world.current?.book===book)world.current=null;
    scene.traverse(o=>{if(o.isMesh){o.geometry?.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m?.dispose());}});
    resources.forEach(r=>r.dispose());renderer?.dispose();renderer?.domElement?.remove();};
  }catch(e){console.warn('Three.js book preview unavailable',e);setFallback(true);if(renderer){renderer.dispose();renderer.domElement?.remove();}}
 },[config.size,config.material]);
 // Update the *texture* when users type or switch cover art. Do NOT destroy and
 // recreate a WebGL context on every keystroke; this matters on mobile devices.
 useEffect(()=>{
  let active=true;
  renderPrintCover(config,journal,mediaUrl,{width:768,height:config.size==='square'?768:1024}).then(canvas=>{
    if(!active||!world.current)return;
    const {front,renderer,resources}=world.current;
    const tex=new THREE.CanvasTexture(canvas);
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const oldMaterial=front.material[4];
    const roughness=finishFor(config.material).roughness;
    front.material[4]=new THREE.MeshStandardMaterial({map:tex,roughness,metalness:0});
    oldMaterial?.dispose();
    if(world.current.currentCoverMap)world.current.currentCoverMap.dispose();
    world.current.currentCoverMap=tex;
    resources.push(tex);
  }).catch(()=>{});
  return()=>{active=false};
 },[journal?.id,journal?.title,config.size,config.material,config.coverTitle,config.coverSubtitle,config.coverTemplate,mediaUrl]);
 const drag=useRef(null);
 function pointerDown(e){if(fallback)return;drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture?.(e.pointerId);}
 function pointerMove(e){if(!drag.current||fallback)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;drag.current={x:e.clientX,y:e.clientY};yaw.current+=dx*.012;pitch.current=Math.max(-.54,Math.min(.42,pitch.current+dy*.006));}
 function pointerUp(){drag.current=null;}
 function turn(delta){yaw.current+=delta;}
 function reset(){yaw.current=.38;pitch.current=-.13;}
 return <div className="pc-model-block">
  <div className="pc-three-stage" ref={host} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} role="img" aria-label="真实三维实体书模型，可用手指左右拖动旋转查看书脊、封面和封底">
   {fallback&&<div className="pc-three-fallback"><PrintCoverFlat journal={journal} config={config} mediaUrls={mediaUrls}/><span>当前设备不支持 WebGL，已显示封面预览</span></div>}
  </div>
  <div className="pc-three-controls">
    <button type="button" onClick={()=>turn(-Math.PI/2)} aria-label="向左旋转实体书"><RotateCcw size={16}/>左转</button>
    <button type="button" onClick={reset}>回正</button>
    <button type="button" onClick={()=>turn(Math.PI/2)} aria-label="向右旋转实体书">右转<RotateCw size={16}/></button>
    <button type="button" className="pc-three-open" onClick={onOpen}><BookOpen size={16}/>翻阅内页</button>
  </div>
 </div>;
}
