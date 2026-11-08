// New original explanatory artwork. Actual upstream runtime use, not copied rejected R12 animals.
import {Rig} from '../../PRODUCTION_KIT/reference/ENGINE_SOURCE/r12/vendor/rev2d/src/core/rig';
import {ModelSchema} from '../../PRODUCTION_KIT/reference/ENGINE_SOURCE/r12/vendor/rev2d/src/core/schema';
import {rng,probeRect} from '../../PRODUCTION_KIT/reference/ENGINE_SOURCE/r12/vendor/anidoodle/core';
import {fitText,readS} from '../../PRODUCTION_KIT/reference/ENGINE_SOURCE/r12/vendor/anidoodle/readable';
import {plane,ink,arrow,REG,setClock} from '../../PRODUCTION_KIT/reference/ENGINE_SOURCE/r12/vendor/lemo-opuscar/toon';
export const P={paper:'#f4edda',ink:'#163847',sea:'#176277',deep:'#102d3a',aqua:'#72b8bc',gold:'#dfb565',coral:'#cf7960',pale:'#d2ded7'};
REG.on=false;
const sat=(x:number)=>Math.max(0,Math.min(1,x));const ease=(x:number)=>{x=sat(x);return x*x*(3-2*x)};
const shift=(d:string)=>d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,(_,x,y)=>`${+x+600} ${+y+400}`);
const parts:any[]=[];const commands=new Map<string,any[]>();
function parse(d:string){let a=d.match(/[MLCQZ]|-?\d*\.?\d+/g)!,i=0,o:any[]=[];while(i<a.length){let cmd=a[i++],n=({M:2,L:2,C:6,Q:4,Z:0}as any)[cmd];if(n===undefined)throw Error('Invalid authored vector');o.push([cmd,...a.slice(i,i+n).map(Number)]);i+=n;}return o;}
function part(id:string,d:string,fill:string,parent='bodyWarp',stroke=P.ink,width=2.4){d=shift(d);parts.push({id,parent,shape:{type:'path',d,tolerance:.6},fill,stroke:{color:stroke,width},z:parts.length});commands.set(id,parse(d));}
part('far_hind','M-380 -17 Q-458 -32 -514 -16 Q-501 -1 -445 14 L-377 22Z','#416e77');
part('far_fore','M105 24 Q137 89 227 135 Q217 151 194 143 Q111 105 64 39Z','#416e77');
part('body','M-421 -9 C-348 -44 -307 -91 -182 -108 C-38 -131 92 -102 205 -62 Q273 -43 326 -42 C362 -73 409 -72 443 -46 Q475 -34 502 -13 Q522 -8 517 6 Q486 17 448 14 C400 29 365 37 319 37 C225 59 142 102 12 107 C-163 113 -295 68 -368 33 Q-407 20 -421 -9Z',P.pale);
part('back','M-417 -8 C-348 -43 -298 -91 -182 -108 C-38 -131 92 -102 205 -62 Q273 -43 326 -42 C362 -73 409 -72 443 -46 Q470 -33 492 -16 C427 -26 367 -15 312 2 C168 12 116 -21 -13 -26 Q-225 -32 -417 -8Z','#527985','bodyWarp','#527985',.4);
part('near_hind','M-392 4 Q-452 3 -509 33 L-524 50 Q-477 56 -416 25 L-373 19Z','#9fb9b3');
part('jaw','M332 7 Q410 15 515 5 Q500 24 442 30 Q370 42 332 25Z','#b9ccc4','jaw');
part('lip','M365 5 Q441 15 509 5','transparent','bodyWarp',P.ink,2);
part('near_fore','M101 47 Q92 85 175 171 Q163 186 143 176 Q53 132 45 63Z','#a7c2b9','flipper');
const random=rng(970431);
for(let i=0;i<63;i++){const x=-290+random()*530;const y=-62+random()*133;const taper=Math.max(.28,1-Math.abs(x+25)/460);if(Math.abs(y)>91*taper)continue;parts.push({id:'spot'+i,parent:'bodyWarp',shape:{type:'ellipse',cx:x+600,cy:y+400,rx:2+random()*5,ry:2+random()*3},fill:'#426374',z:parts.length});}
parts.push({id:'eye',parent:'bodyWarp',shape:{type:'ellipse',cx:1034,cy:369,rx:4.2,ry:3.7},fill:'#102d3a',z:parts.length});
part('nostril','M486 -11 Q496 -17 500 -7','transparent','bodyWarp',P.ink,3);
for(let i=0;i<4;i++)part('whisker'+i,`M490 ${7+i*2} Q${514+i*4} ${15+i*4} ${531+i*3} ${12+i*6}`,'transparent','bodyWarp','#496e76',.8);
const offsets=(s:number)=>Object.fromEntries(Array.from({length:15},(_,i)=>[String(i),[0,s*[18,8,1,0,0][i%5]]]));
const model=ModelSchema.parse({format:'rev2d',version:1,meta:{name:'LeopardSeal_NewScientificVector',width:1200,height:800,background:'transparent',fps:24},parameters:[{id:'Swim',min:-1,max:1,default:0},{id:'Fin',min:-1,max:1,default:0},{id:'Mouth',min:0,max:1,default:0}],bones:[{id:'root',x:600,y:400},{id:'flipper',parent:'root',x:80,y:50},{id:'jaw',parent:'root',x:332,y:7}],warps:[{id:'bodyWarp',parent:'root',rect:[25,200,1140,420],cols:4,rows:2}],parts,bindings:[{target:'warp:bodyWarp.offsets',params:['Swim'],keys:[{at:[-1],value:offsets(-1)},{at:[0],value:{}},{at:[1],value:offsets(1)}]},{target:'bone:flipper.rotation',params:['Fin'],keys:[{at:[-1],value:-5},{at:[0],value:0},{at:[1],value:5}]},{target:'bone:jaw.rotation',params:['Mouth'],keys:[{at:[0],value:0},{at:[1],value:20}]}]});
const rig=new Rig(model);const env:any={W:1920,H:1080,scale:1,root:true,cache:new Map()};
export const runtimeAudit={Rev2D:'ModelSchema validation, full original vector model, lattice swim and flipper/jaw bone poses actually evaluated',anidoodle:'Seeded original coat, fitted typography, minimum reading-time and transformed geometry probe',lemo:'Actual authored colour planes, pressure-line strokes, directional arrows and deterministic clock; registration jitter disabled',reelmimic:'Composition guidance applied: start/mid/end subject envelope and clean-zone layout. This repository is guidance, not a fabricated runtime import.'};
export function paintSeal(c:CanvasRenderingContext2D,t:number,x:number,y:number,length:number,flip=false,mouth=0){
 const pose=rig.pose({time:t,params:{Swim:Math.sin(t*1.7),Fin:Math.sin(t*1.7+.4),Mouth:mouth},physics:false});const boxes=Object.values(pose.parts).map(p=>p.bounds).filter(Boolean) as number[][];const left=Math.min(...boxes.map(b=>b[0])),right=Math.max(...boxes.map(b=>b[0]+b[2]));const k=length/(right-left);c.save();c.translate(x,y);c.scale((flip?-1:1)*k,k);c.translate(-(left+right)/2,-400);c.lineJoin='round';c.lineCap='round';
 for(const p of model.parts){c.beginPath();const pt=(x:number,y:number)=>rig.mapPoint(pose,p.parent??null,x,y);if(p.shape.type==='path'){for(const [cmd,...v]of commands.get(p.id)!){if(cmd==='Z'){c.closePath();continue;}let a:number[]=[];for(let i=0;i<v.length;i+=2)a.push(...pt(v[i],v[i+1]));if(cmd==='M')c.moveTo(a[0],a[1]);else if(cmd==='L')c.lineTo(a[0],a[1]);else if(cmd==='Q')c.quadraticCurveTo(...a as[number,number,number,number]);else c.bezierCurveTo(...a as[number,number,number,number,number,number]);}}else if(p.shape.type==='ellipse'){let e=p.shape,q=pt(e.cx,e.cy);c.ellipse(q[0],q[1],e.rx,e.ry,0,0,7);}if(p.fill&&p.fill!=='transparent'){c.fillStyle=p.fill as string;c.fill();}if(p.stroke){c.strokeStyle=p.stroke.color;c.lineWidth=p.stroke.width;c.stroke();}}
 c.restore();return pose;
}
function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=35,color=P.ink,maxW=1600){c.fillStyle=color;const f=fitText(c,s,maxW,{maxPx:size,minPx:size*.76,font:px=>`600 ${px}px Display`});if(!f.fits)throw Error('Unreadable/overflowing text: '+s);c.fillText(s,x,y);probeRect(c,env,x,y-f.px,c.measureText(s).width,f.px*1.3,s,'text');return readS(s);}
function line(c:CanvasRenderingContext2D,pts:number[][],color=P.ink,width=3){ink(c,pts,width,{color,wob:0,breaks:0,taper:false});}
function human(c:CanvasRenderingContext2D,x:number,y:number,h:number){c.save();c.translate(x,y);c.scale(h/206.5,h/206.5);c.translate(0,-7.5);c.fillStyle=P.ink;c.beginPath();c.ellipse(0,-184,12,15,0,0,7);c.fill();c.lineCap='round';line(c,[[-11,-160],[-14,-111],[-8,-84],[-11,0]],P.ink,15);line(c,[[11,-160],[14,-112],[8,-84],[14,0]],P.ink,15);line(c,[[0,-158],[0,-92]],P.ink,24);line(c,[[-12,-151],[-27,-114],[-27,-80]],P.ink,9);line(c,[[12,-151],[26,-114],[28,-81]],P.ink,9);c.restore();}
function penguin(c:CanvasRenderingContext2D,x:number,y:number,s=1){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=P.ink;c.beginPath();c.ellipse(0,-33,22,35,-.05,0,7);c.fill();c.beginPath();c.arc(0,-70,15,0,7);c.fill();c.fillStyle=P.paper;c.beginPath();c.ellipse(3,-29,13,26,0,0,7);c.fill();plane(c,[[12,-76],[30,-70],[13,-65]],P.gold,{grain:0});line(c,[[-17,-43],[-30,-12]],P.ink,6);line(c,[[17,-43],[26,-13]],P.ink,6);c.restore();}
export function drawEvidence2D(c:CanvasRenderingContext2D,t:number,kind:string){
 setClock(t);c.clearRect(0,0,1920,1080);c.fillStyle=P.paper;c.fillRect(0,0,1920,1080);text(c,'THE LEOPARD SEAL',82,81,23);text(c,'ILLUSTRATED EXPLANATION',1440,81,18,P.ink,405);line(c,[[82,112],[1838,112]],'#b5b8a7',1.4);
 if(kind==='scale'){
  text(c,'Built for the Southern Ocean',85,203,66);text(c,'One shared scale. No perspective trick.',88,258,26);
  paintSeal(c,t,785,540,1150);human(c,1620,737,1150*1.75/3.7);line(c,[[210,737],[1360,737]],P.ink,2);line(c,[[210,722],[210,754]],P.ink,2);line(c,[[1360,722],[1360,754]],P.ink,2);text(c,'3.7 m',635,813,75);text(c,'Around 450 kg',633,864,28);text(c,'Adult reference / 1.75 m',1470,813,24,P.ink,350);text(c,'Original vector anatomy / articulated flippers / shared measurement baseline',86,1010,23);
 }else if(kind==='ambush'){
  text(c,'The edge is the bottleneck',85,202,65);plane(c,[[0,445],[1920,445],[1920,1080],[0,1080]],P.sea,{grain:0});plane(c,[[95,337],[1240,337],[1350,393],[1272,479],[95,479]],'#dde5d8',{grain:0});line(c,[[95,479],[1272,479],[1350,393]],'#90bab8',4);
  for(let i=0;i<8;i++)penguin(c,400+i*94,340,.77);paintSeal(c,t,850+90*ease(t/6),667-48*ease(t/6),900,false,.05);
  arrow(c,[1395,350],[1425,566],{u:ease(t/2),bend:-.2,w:4,head:22,color:P.paper,fill:P.gold});text(c,'ICE',103,396,24);text(c,'An illustrative ambush position',106,911,40,P.paper);text(c,'Not footage of a particular hunt',106,961,24,P.paper);
 }else if(kind==='research'){
  text(c,'What happens below the surface?',85,202,61);paintSeal(c,t,669,514,1050);plane(c,[[628,410],[690,410],[696,442],[622,442]],P.gold,{grain:0});line(c,[[659,442],[660,472]],P.ink,4);
  arrow(c,[753,354],[1130,312],{u:ease(t/2),bend:-.18,w:3,head:20,color:P.ink,fill:P.gold});text(c,'Animal-borne camera',1175,318,36,P.ink,635);text(c,'7 females',111,823,70);text(c,'50+ hours',720,823,70);text(c,'2013–2014',1321,823,61);text(c,'Individual hunting techniques—not a single repeated scene.',110,920,32);
 }else if(kind==='signals'){
  text(c,'One display. Different readings.',85,203,63);c.fillStyle=P.sea;c.fillRect(82,290,1110,650);const angle=-.7+1.4*ease(t/14);paintSeal(c,t,637+190*Math.sin(angle),605+165*Math.cos(angle),580,false);human(c,632,685,165);for(let j=0;j<3;j++){const y=441+j*156;text(c,['Curious','Threatened','Deciding'][j],1285,y,43);line(c,[[1250,y-12],[1263,y-12]],P.coral,5);}text(c,'An explanatory path, not a measured animal track',100,1010,24);
 }else if(kind==='songs'){
  text(c,'Five shared sounds. Individual order.',85,203,60);for(let k=0;k<5;k++){const x=160+k*346;for(let j=0;j<37;j++){const a=j/36;const y=461-Math.sin(a*Math.PI*2*(k+1))*(50+12*k)*Math.sin(a*Math.PI);line(c,[[x+j*6.5,y],[x+(j+1)*6.5,461-Math.sin((j+1)/36*Math.PI*2*(k+1))*(50+12*k)*Math.sin((j+1)/36*Math.PI)]],k%2?P.ink:P.sea,3);}text(c,String(k+1),x+102,608,35);}
  for(let i=0;i<26;i++){let x=110+(i%13)*134,y=770+Math.floor(i/13)*76;c.fillStyle=[P.ink,P.aqua,P.gold,P.coral,P.sea][Math.floor((i+t*.5)%5)];c.beginPath();c.arc(x,y,12,0,7);c.fill();}text(c,'26 males',90,957,38);text(c,'Pattern illustration—not a field recording or measured spectrogram.',435,957,26,P.ink,1360);
 }else{
  text(c,'A versatile Antarctic predator',85,203,63);paintSeal(c,t,1015,550,1280);text(c,'Swim. Investigate. Adapt.',104,877,50);text(c,'Original animated scientific illustration—not real camera footage.',106,1010,24);
 }
 return {kind,time:t,modelParts:model.parts.length,actualRuntimeUse:runtimeAudit};
}
export function verifyRigGeometry(){for(let t of [0,.25,1,2,4]){const p=rig.pose({time:t,params:{Swim:Math.sin(t),Fin:Math.sin(t)},physics:false});for(const b of Object.values(p.parts)){if(!b.bounds.every(Number.isFinite))throw Error('Nonfinite posed vector part');}}return {valid:true,parts:model.parts.length,upstream:runtimeAudit};}
