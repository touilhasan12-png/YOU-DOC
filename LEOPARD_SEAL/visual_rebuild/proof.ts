import * as T from 'three';
import {drawEvidence2D,verifyRigGeometry,runtimeAudit} from './evidence2d';
import {buildSeal3D} from './seal3d';
const gl=document.querySelector('#gl')as HTMLCanvasElement,overlay=document.querySelector('#overlay')as HTMLCanvasElement,c=overlay.getContext('2d')!;
const renderer=new T.WebGLRenderer({canvas:gl,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(1920,1080);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
const scene=new T.Scene();scene.background=new T.Color('#e8e9dc');scene.add(new T.HemisphereLight(0xe9f5f2,0x475b62,2.1));let key=new T.DirectionalLight(0xfff5df,3.2);key.position.set(-1,4,5);scene.add(key);let rim=new T.DirectionalLight(0x9ed8e3,1.6);rim.position.set(-2,1,-4);scene.add(rim);let fill=new T.DirectionalLight(0xffffff,.8);fill.position.set(4,1,1);scene.add(fill);
const animal=buildSeal3D(scene,3.7),camera=new T.PerspectiveCamera(33,1920/1080,.05,100);const result=document.createElement('canvas');result.width=1920;result.height=1080;const out=result.getContext('2d')!;
const check=verifyRigGeometry();(window as any).drawNewProof=(kind:string,t:number)=>{c.clearRect(0,0,1920,1080);let info:any;
 if(kind.startsWith('3d')){gl.style.display='block';const view=kind==='3d_head'?[3.3,.75,2.8]:kind==='3d_profile'?[0,1.05,6.2]:[2.9,1.9,5.3];camera.position.set(...view as[number,number,number]);camera.lookAt(kind==='3d_head'?new T.Vector3(1.05,.04,0):new T.Vector3(0,.0,0));animal.update(t,kind==='3d_head'?.38:0);renderer.render(scene,camera);c.fillStyle='#163847';c.font='600 23px Display';c.fillText('THE LEOPARD SEAL',82,80);c.fillText('ORIGINAL 3D ANATOMY / REBUILT CONTINUOUS BODY AND SKULL',82,1005);info=animal.diagnostics;out.drawImage(gl,0,0);}
 else{gl.style.display='none';info=drawEvidence2D(c,t,kind);out.clearRect(0,0,1920,1080);}
 out.drawImage(overlay,0,0);return {png:result.toDataURL('image/png').split(',')[1],info};};
(window as any).rebuildReady=true;(window as any).newRuntimeAudit={rigGeometryCheck:check,runtimeAudit,new3D:animal.diagnostics,notFinalMovie:true};
