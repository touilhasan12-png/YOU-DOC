import {Rig} from './vendor/rev2d/src/core/rig';
import {ModelSchema} from './vendor/rev2d/src/core/schema';
import type {Model,Pose} from './vendor/rev2d/src/core/types';
const OX=600,OY=400;
const shift=(d:string)=>d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,(_,x,y)=>`${+x+OX} ${+y+OY}`);
export type Animal={rig:Rig,model:Model,kind:string,commands:Map<string,any[]>};
export const animals:Record<string,Animal>={};
function parse(d:string){let a=d.match(/[MLCQZ]|-?\d*\.?\d+/g)!,i=0,out:any[]=[];while(i<a.length){let cmd=a[i++],n=({M:2,L:2,C:6,Q:4,Z:0}as any)[cmd];if(n===undefined)throw Error('Unsupported authored path '+cmd);out.push([cmd,...a.slice(i,i+n).map(Number)]);i+=n;}return out;}
export function buildAnimal(kind:string):Animal{
 if(animals[kind])return animals[kind];const blue=kind==='blue',shark=['shark','bronze','hammer'].includes(kind),dolphin=kind==='dolphin',pilot=kind==='pilot';
 const body=blue?'M470 -20 C450 -68 300 -95 60 -92 C-130 -88 -300 -42 -425 -8 L-455 10 C-285 32 -190 83 -10 97 C220 112 390 72 465 25 Q480 7 470 -20Z':shark?'M465 -6 L382 -53 C260 -113 40 -124 -150 -75 C-290 -40 -360 -8 -438 0 L-442 13 C-300 32 -220 77 -50 100 C180 122 340 72 465 21Z':'M460 -2 C465 -35 420 -86 344 -100 C270 -140 70 -165 -110 -130 C-225 -100 -300 -50 -410 -12 L-432 6 L-409 22 C-300 30 -235 70 -120 100 C60 140 280 120 405 65 C447 45 463 25 460 -2Z';
 const base=blue?'#347b9a':shark?(kind==='bronze'?'#8c7557':'#41647c'):dolphin?'#4d8f9b':pilot?'#263b51':'#153046';
 const parts:any[]=[];
 function part(id:string,d:string,fill:string,parent='bodyWarp',stroke:string|undefined='#102d43',width=3){parts.push({id,parent,shape:{type:'path',d:shift(d),tolerance:.6},fill,...(stroke?{stroke:{color:stroke,width}}:{}),z:parts.length});}
 const fin=blue?'M135 55 Q175 125 310 216 Q261 232 167 158 L107 70Z':shark?'M160 47 Q107 172 -4 199 Q64 106 88 36Z':'M220 50 Q216 122 122 195 Q88 203 103 171 Q126 90 164 43Z';
 part('far_flipper','M230 37 Q290 112 240 151 Q186 110 161 41Z',blue?'#285d7f':'#102b41');
 if(shark)part('tail','M-426 -3 Q-455 -98 -522 -160 Q-510 -45 -458 7 Q-498 52 -510 100 Q-467 65 -427 17Z',base);
 else part('tail','M-420 -4 Q-480 -61 -553 -74 Q-542 -23 -477 9 Q-534 37 -546 71 Q-476 59 -418 17Z',base);
 part('body',body,base);
 if(blue){part('belly','M463 10 C260 47 28 62 -133 42 C-247 29 -335 9 -427 7 C-292 48 -176 96 25 106 C227 113 406 67 463 26Z','#8dc2cd','bodyWarp','',1);for(let j=0;j<8;j++)part('throat_'+j,`M${430-j*8} ${28+j*2} Q${220-j*12} ${66+j*3} ${52-j*14} ${63+j*4}`,'transparent','bodyWarp','#4e8fa7',1.2);}
 else if(shark){part('belly','M459 12 Q252 60 -14 61 Q-219 46 -435 8 C-245 66 -148 103 41 111 Q297 102 459 25Z','#e0e6d5','bodyWarp','',1);for(let j=0;j<5;j++)part('gill_'+j,`M${268-j*18} -43 Q${249-j*18} -4 ${257-j*18} 32`,'transparent','bodyWarp','#203e56',3);}
 else if(!pilot&&!dolphin){part('belly','M458 18 C371 11 334 64 264 60 C190 49 181 97 89 90 Q-66 81 -135 74 Q-299 36 -416 9 C-276 67 -168 115 3 124 C223 131 397 75 455 36Z','#fff3d8','bodyWarp','',1);part('eye_patch','M290 -62 C310 -84 355 -72 368 -49 Q361 -24 316 -29 Q288 -34 290 -62Z','#fff7df','bodyWarp','',1);part('saddle','M-97 -111 Q-23 -159 51 -128 L23 -85 Q-58 -74 -97 -111Z','#738e9c','bodyWarp','',1);}
 const dorsal=blue?'M-238 -58 Q-266 -120 -294 -122 L-282 -50Z':shark?'M-88 -92 Q-33 -199 -10 -220 Q-9 -144 75 -95Z':dolphin?'M-80 -130 Q-25 -210 4 -200 L45 -125Z':kind==='male'?'M-80 -130 Q-20 -280 15 -336 Q52 -288 58 -120Z':kind==='bent'?'M-80 -130 Q-25 -266 54 -224 Q91 -201 85 -169 Q24 -204 34 -118Z':'M-80 -130 Q-32 -228 7 -256 Q34 -228 63 -123Z';
 part('dorsal',dorsal,base);
 part('near_flipper',fin,blue?'#285d7f':shark?'#35586e':'#112b41','fin');
 part('mouth',blue?'M461 13 Q330 29 234 26':'M455 19 Q385 43 330 38','transparent','bodyWarp','#092539',2.2);
 if(kind==='hammer')part('hammer_head','M428 -14 L445 -80 Q501 -88 520 -65 L493 -24 L462 12 L505 37 Q502 67 462 60 L428 28Z','#577f8d');
 parts.push({id:'eye',parent:'bodyWarp',shape:{type:'ellipse',cx:OX+(blue?406:399),cy:OY+(blue?-17:-37),rx:blue?4.2:5.5,ry:blue?4.2:5.5},fill:'#071b2a',z:parts.length});
 parts.push({id:'eye_glint',parent:'bodyWarp',shape:{type:'ellipse',cx:OX+(blue?407:400),cy:OY+(blue?-18:-38),rx:1.3,ry:1.3},fill:'#ffffff',z:parts.length});
 const offsets=(sign:number)=>{const out:Record<string,number[]>={};for(let j=0;j<3;j++)for(let c=0;c<5;c++){let amp=[26,13,2,0,0][c];out[String(j*5+c)]=[0,sign*amp];}return out;};
 const raw={format:'rev2d',version:1,meta:{name:'R12_'+kind,width:1200,height:800,background:'transparent',fps:24},parameters:[{id:'Swim',min:-1,max:1,default:0},{id:'Fin',min:-1,max:1,default:0}],bones:[{id:'root',x:OX,y:OY},{id:'fin',parent:'root',x:180,y:55}],warps:[{id:'bodyWarp',parent:'root',rect:[30,30,1140,700],cols:4,rows:2}],parts,bindings:[{target:'warp:bodyWarp.offsets',params:['Swim'],keys:[{at:[-1],value:offsets(-1)},{at:[0],value:{}},{at:[1],value:offsets(1)}]},{target:'bone:fin.rotation',params:['Fin'],keys:[{at:[-1],value:-7},{at:[0],value:0},{at:[1],value:7}]}],animations:[{id:'swim',duration:blue?3.2:2.2,loop:true,tracks:[{target:'param:Swim',keys:[{t:0,v:0,ease:'inOutSine'},{t:blue?.8:.55,v:1,ease:'inOutSine'},{t:blue?2.4:1.65,v:-1,ease:'inOutSine'},{t:blue?3.2:2.2,v:0}]},{target:'param:Fin',keys:[{t:0,v:-1,ease:'inOutSine'},{t:blue?1.6:1.1,v:1,ease:'inOutSine'},{t:blue?3.2:2.2,v:-1}]}]}]};
 const model=ModelSchema.parse(raw);const a={rig:new Rig(model),model,kind,commands:new Map(parts.filter(p=>p.shape.type==='path').map(p=>[p.id,parse(p.shape.d)]))};animals[kind]=a;return a;
}
export function paintAnimal(g:CanvasRenderingContext2D,a:Animal,t:number){const pose=a.rig.pose({time:Math.max(0,t),animations:['swim'],physics:false});
 g.save();g.translate(-OX,-OY);g.lineJoin='round';g.lineCap='round';
 for(const p of a.model.parts){g.beginPath();const point=(x:number,y:number)=>a.rig.mapPoint(pose,p.parent??null,x,y);if(p.shape.type==='path'){
  for(const [cmd,...n]of a.commands.get(p.id)!){if(cmd==='Z'){g.closePath();continue}const pts=[];for(let i=0;i<n.length;i+=2)pts.push(...point(n[i],n[i+1]));if(cmd==='M')g.moveTo(pts[0],pts[1]);else if(cmd==='L')g.lineTo(pts[0],pts[1]);else if(cmd==='Q')g.quadraticCurveTo(...pts as[number,number,number,number]);else g.bezierCurveTo(...pts as[number,number,number,number,number,number]);}
 }else if(p.shape.type==='ellipse'){const e=p.shape,pt=point(e.cx,e.cy);g.ellipse(pt[0],pt[1],e.rx,e.ry,0,0,Math.PI*2);}
 if(typeof p.fill==='string'&&p.fill!=='transparent'){g.fillStyle=p.fill;g.fill();}if(p.stroke){g.strokeStyle=p.stroke.color;g.lineWidth=p.stroke.width;g.stroke();}}
 g.restore();return pose;
}
export function actorExtent(a:Animal,pose:Pose){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of Object.values(pose.parts)){if(!p.visible)continue;const [x,y,w,h]=p.bounds;minX=Math.min(minX,x-OX);minY=Math.min(minY,y-OY);maxX=Math.max(maxX,x+w-OX);maxY=Math.max(maxY,y+h-OY);}return [minX,minY,maxX,maxY];}
