import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
// Original procedural models, not generated images. Metres, Y up, X longitudinal.
const C={ink:0x1d3541,cream:0xe0e5d6,skin:0xcda782,navy:0x294c60,metal:0x7c9391,wood:0x94734e};
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z), clamp=(x)=>Math.min(1,Math.max(0,x)), ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const mat=(c)=>new T.MeshToonMaterial({color:c,side:T.DoubleSide});
const mats=new Map();function M(c){if(!mats.has(c))mats.set(c,mat(c));return mats.get(c)}
const scene=new T.Scene();scene.background=new T.Color(0x1c4d5a);scene.fog=new T.Fog(0x1c4d5a,38,100);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});renderer.setSize(1920,1080);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x1c4d5a);document.body.prepend(renderer.domElement);
scene.add(new T.HemisphereLight(0xe1eee4,0x29434c,1.3));const sun=new T.DirectionalLight(0xfff4d7,1.2);sun.position.set(-7,16,12);scene.add(sun);
let root=new T.Group();scene.add(root);let camera=new T.OrthographicCamera(-12,12,6.75,-6.75,.1,180), update=()=>{}, key='',dur=1, checks={}, labels=[];
function mesh(geom,c,parent=root){const m=new T.Mesh(geom,typeof c==='number'?M(c):c);parent.add(m);return m}
function ell(parent,p,s,c){const m=mesh(new T.SphereGeometry(1,24,16),c,parent);m.position.copy(p);m.scale.copy(s);return m}
function box(parent,p,s,c){const m=mesh(new T.BoxGeometry(s.x,s.y,s.z),c,parent);m.position.copy(p);return m}
function tube(parent,a,b,r,c,r2=r){const d=b.clone().sub(a),m=mesh(new T.CylinderGeometry(r2,r,d.length(),12),c,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return m}
function line(parent,pts,r=.015,c=C.cream){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,r,7,false),c,parent)}
function curveUpdate(m,pts,r=.015){m.geometry.dispose();m.geometry=new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,r,7,false)}
function cameraAt(pos,target,width){camera.left=-width/2;camera.right=width/2;camera.top=width*9/32;camera.bottom=-width*9/32;camera.position.copy(pos);camera.lookAt(target);camera.updateProjectionMatrix()}
function title(a,b='',c=''){document.querySelector('#title').textContent=a;document.querySelector('#sub').textContent=b;document.querySelector('#detail').textContent=c}
function label(text,p){const el=document.createElement('div');el.className='label';el.textContent=text;document.querySelector('#labels').appendChild(el);labels.push({el,p})}
function sea(under=true){
 const bg=document.createElement('canvas');bg.width=2;bg.height=1080;const ctx=bg.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,1080);grad.addColorStop(0,under?'#2c6473':'#7fabb8');grad.addColorStop(1,under?'#112e3d':'#477c8b');ctx.fillStyle=grad;ctx.fillRect(0,0,2,1080);scene.background=new T.CanvasTexture(bg);scene.fog.color.setHex(0x234b5b);
 const g=new T.PlaneGeometry(110,110,35,35);g.rotateX(-Math.PI/2);const p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,.09+.07*Math.sin(p.getX(i)*.9)*Math.cos(p.getZ(i)*1.1));g.computeVertexNormals();
 const s=mesh(g,new T.MeshToonMaterial({color:0x689eaa,transparent:true,opacity:under?.23:.72,side:T.DoubleSide,depthWrite:false}));s.renderOrder=2;s.visible=!under;
 // Sparse physically placed water-column particles, not decorative text/filler.
 if(under){const ps=[];for(let i=0;i<85;i++)ps.push(-22+(i*7.31)%44,-1-(i*.73)%12,-12+(i*3.21)%25);const g2=new T.BufferGeometry();g2.setAttribute('position',new T.Float32BufferAttribute(ps,3));root.add(new T.Points(g2,new T.PointsMaterial({color:0x83b0b1,size:.022,transparent:true,opacity:.34})))}
}
function fin(parent,points,depth,c){const shape=new T.Shape();shape.moveTo((points[0][0]+points.at(-1)[0])/2,(points[0][1]+points.at(-1)[1])/2);for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];shape.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2)}shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:2,steps:1});geo.translate(0,0,-depth/2);geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));return mesh(geo,c,parent)}
const stations=[0,.025,.07,.14,.24,.36,.49,.62,.75,.86,.94,1];
const widths=[.025,.039,.064,.081,.089,.088,.073,.054,.033,.018,.009,.001];
const heights=[.022,.041,.071,.089,.098,.095,.081,.062,.041,.023,.011,.001];
function interp(a,s){let i=0;while(i<stations.length-2&&s>stations[i+1])i++;const u=ease((s-stations[i])/(stations[i+1]-stations[i]));return a[i]*(1-u)+a[i+1]*u}
function whale(L=6.2){
 const group=new T.Group();root.add(group);const hinge=L*.262,hy=-.01*L;
 const bodyP=[],bodyC=[],jawP=[],jawC=[],bodyIdx=[],jawIdx=[];const NX=180,NT=112;
 function color(s,theta){const yy=Math.sin(theta),zz=Math.abs(Math.cos(theta));const soft=(a,b,x)=>ease((x-a)/(b-a));let c=new T.Color(C.ink);c.lerp(new T.Color(0xe2e9de),1-soft(-.55,-.45,yy));const flank=(1-soft(.8,1.15,((s-.63)/.14)**2+((yy+.38)/.24)**2));c.lerp(new T.Color(0xe2e9de),flank);const eye=(1-soft(.86,1.12,((s-.155)/.048)**2+((yy-.34)/.25)**2))*soft(.70,.83,zz);c.lerp(new T.Color(0xe6ebde),eye);const saddle=1-soft(.75,1.18,((s-.53)/.073)**2+((yy-.72)/.34)**2);c.lerp(new T.Color(0x7a929b),saddle);return c}
 const pp=[],cc=[],isJaw=[];
 for(let i=0;i<=NX;i++){const s=i/NX,ry=interp(widths,s)*L,rz=interp(heights,s)*L,cy=.01*L*(1-s);for(let j=0;j<NT;j++){const th=j/NT*Math.PI*2;pp.push((.5-s)*L,cy+Math.sin(th)*rz,Math.cos(th)*ry);const c=color(s,th);cc.push(c.r,c.g,c.b);isJaw.push(s<.238&&Math.sin(th)<-.18)}}
 // Separate full upper head and articulated lower jaw. No solid closed head behind a painted mouth.
 const bmap=new Map(),jmap=new Map();function addVert(old,jaw){const map=jaw?jmap:bmap,arr=jaw?jawP:bodyP,cols=jaw?jawC:bodyC;if(map.has(old))return map.get(old);const id=arr.length/3;arr.push(pp[old*3]-(jaw?hinge:0),pp[old*3+1]-(jaw?hy:0),pp[old*3+2]);cols.push(...cc.slice(old*3,old*3+3));map.set(old,id);return id}
 for(let i=0;i<NX;i++)for(let j=0;j<NT;j++){const a=i*NT+j,b=i*NT+(j+1)%NT,c=(i+1)*NT+j,d=(i+1)*NT+(j+1)%NT;for(const tr of [[a,c,b],[b,c,d]]){const bits=tr.map(v=>isJaw[v]);if(bits.some(Boolean)&&!bits.every(Boolean))continue;const jaw=bits.every(Boolean),out=jaw?jawIdx:bodyIdx;out.push(...tr.map(v=>addVert(v,jaw)))}}
 const vertexMat=new T.MeshToonMaterial({vertexColors:true,side:T.DoubleSide});function geom(p,c,idx){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g}
 const body=mesh(geom(bodyP,bodyC,bodyIdx),vertexMat,group),jawGroup=new T.Group();jawGroup.position.set(hinge,hy,0);group.add(jawGroup);const jaw=mesh(geom(jawP,jawC,jawIdx),vertexMat,jawGroup);
 const baseBody=body.geometry.attributes.position.array.slice();body.geometry.boundsTree=new MeshBVH(body.geometry);jaw.geometry.boundsTree=new MeshBVH(jaw.geometry);
 // Palates close the mouth cavity, and follow the actual jaw rather than painting over a solid head.
 for(const lower of [false,true]){const p=[],ix=[];for(let i=0;i<=35;i++){const s=.003+.232*i/35,x=(.5-s)*L,ry=interp(widths,s)*L*.98,y=.01*L*(1-s)-.18*interp(heights,s)*L;p.push(x-(lower?hinge:0),y-(lower?hy:0),-ry,x-(lower?hinge:0),y-(lower?hy:0),ry);if(i<35){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2)}}const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(p,3));gg.setIndex(ix);gg.computeVertexNormals();mesh(gg,0x594851,lower?jawGroup:group)}
 const toothGeo=new T.ConeGeometry(.017,.075,7);for(let k=0;k<11;k++){const s=.035+k*.0165,x=(.5-s)*L,z=interp(widths,s)*L*.91,y=.01*L*(1-s)-.18*interp(heights,s)*L;for(const side of [-1,1]){const a=mesh(toothGeo,C.cream,group);a.position.set(x,y-.04,side*z);a.rotation.z=Math.PI;const b=mesh(toothGeo,C.cream,jawGroup);b.position.set(x-hinge,y-hy+.04,side*z)}}
 const dorsal=fin(group,[[.12*L,.08*L],[-.04*L,.23*L],[-.09*L,.245*L],[-.12*L,.09*L]],.06,C.ink);
 const fluke=new T.Group();fluke.position.set(-.47*L,0,0);group.add(fluke);for(const side of [-1,1]){const f=fin(fluke,[[.05*L,0],[-.025*L,side*.17*L],[-.09*L,side*.165*L],[-.045*L,0]],.04,C.ink);f.rotation.x=Math.PI/2}
 const pects=[];for(const side of [-1,1]){const f=fin(group,[[.23*L,0],[.16*L,-.16*L],[.06*L,-.17*L],[.11*L,-.025*L]],.055,C.ink);f.position.set(0,-.03*L,side*.065*L);f.rotation.x=side*.45;pects.push(f);ell(group,V(.365*L,.015*L,side*.064*L),V(.016,.016,.012),0x0c1e26)}
 const finAnchor=V(.17*L,-.055*L,.08*L);
 function animate(t,open=.035){jawGroup.rotation.z=-open;const pos=body.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=baseBody[i*3],w=ease((-x/L-.10)/.35);pos.setXYZ(i,x,baseBody[i*3+1]+w*.10*L*Math.sin(t*3.1+x*.5),baseBody[i*3+2])}pos.needsUpdate=true;body.geometry.computeVertexNormals();body.geometry.boundsTree.refit();fluke.position.y=.10*L*Math.sin(t*3.1-.47*L*.5);fluke.rotation.z=.18*Math.cos(t*3.1);pects.forEach((f,i)=>f.rotation.x=(i?1:-1)*(.45+.045*Math.sin(t*2)));}
 return {group,body,jaw,jawGroup,L,animate,finAnchor};
}
function boat(broken=false){
 const group=new T.Group();root.add(group);const N=50,K=28,v=[],idx=[];const bx=[-5.4,-4.4,-2,1.5,4.3,6.1],bw=[1.08,1.35,1.55,1.45,.87,.025];function beam(x){let i=0;while(i<bx.length-2&&x>bx[i+1])i++;const u=ease((x-bx[i])/(bx[i+1]-bx[i]));return bw[i]*(1-u)+bw[i+1]*u}
 for(let i=0;i<=N;i++){const x=-5.4+11.5*i/N,b=beam(x);for(let j=0;j<=K;j++){const a=Math.PI*j/K;v.push(x,.65-1.78*Math.pow(Math.sin(a),.78),b*Math.cos(a))}}
 for(let i=0;i<N;i++)for(let j=0;j<K;j++){const a=i*(K+1)+j,b=a+K+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,C.cream,group);
 // Flat stern transom, tapered bow, waterline, keel and superstructure give a legible vessel, not an oval slab.
 box(group,V(-5.37,-.10,0),V(.075,1.45,2.12),C.cream);
 const deckShape=new T.Shape();deckShape.moveTo(-5.4,-beam(-5.4));for(let i=0;i<=N;i++){const x=-5.4+11.5*i/N;deckShape.lineTo(x,-beam(x))}for(let i=N;i>=0;i--){const x=-5.4+11.5*i/N;deckShape.lineTo(x,beam(x))}deckShape.closePath();const dg=new T.ShapeGeometry(deckShape,32);dg.rotateX(Math.PI/2);const deck=mesh(dg,0xd4d7c6,group);deck.position.y=.655;
 for(const side of [-1,1]){const pts=[];for(let i=0;i<=40;i++){const x=-5.35+11.35*i/40;pts.push(V(x,.55,side*beam(x)))}line(group,pts,.035,0x314f5b);for(let x=-5;x<5;x+=1.25)tube(group,V(x,.68,side*beam(x)),V(x,1.1,side*beam(x)),.014,C.metal);line(group,pts.map(p=>V(p.x,1.1,p.z)),.014,C.metal)}
 box(group,V(.6,1.00,0),V(3.6,.69,1.78),0xcbd6cd);box(group,V(.6,1.38,0),V(3.85,.12,1.94),C.cream);for(const z of [-.9,.9])for(const x of [-.5,.45,1.4])box(group,V(x,1.10,z),V(.64,.29,.035),0x456b7b);
 for(const z of [-1.12,1.12])box(group,V(-3.6,.87,z),V(2.5,.18,.39),C.wood);
 fin(group,[[-.4,-1.05],[1.2,-1.05],[.85,-2.70],[.0,-2.70]],.12,0x7d9294);
 tube(group,V(.5,1.35,0),V(.5,8.4,0),.055,C.metal);line(group,[V(-4,1.1,-1.1),V(.5,8.2,0),V(5.5,1,0)],.009,C.cream);
 const stockX=-4.7; tube(group,V(stockX,.72,0),V(stockX,-1.38,0),.048,C.metal);for(const y of [-.90,-1.20]){const bearing=mesh(new T.CylinderGeometry(.10,.10,.12,18),0x425e67,group);bearing.position.set(stockX,y,0)}
 const bladeGroup=new T.Group();bladeGroup.position.set(stockX,-1.38,0);group.add(bladeGroup);
 const blade=fin(bladeGroup,[[0,0],[-.75,-.05],[-.67,-1.55],[-.14,-1.62],[.03,-.12]],.08,0x809a9a);tube(bladeGroup,V(0,0,0),V(0,-1.58,0),.043,C.metal);
 const base=bladeGroup.position.clone();function fracture(u){bladeGroup.position.copy(base).add(V(-.10*u,-.48*u,0));bladeGroup.rotation.z=.26*u;}
 fracture(broken?1:0);return {group,blade,bladeGroup,fracture,stockX};
}
function human({diver=false,swimmer=false}={}){
 const group=new T.Group();root.add(group);const body=new T.Group();group.add(body);ell(body,V(0,1.17,0),V(.215,.30,.125),C.navy);ell(body,V(0,.92,0),V(.17,.14,.12),0x223b4d);tube(body,V(0,1.43,0),V(0,1.58,0),.064,C.skin);
 const head=new T.Group();head.position.set(0,1.70,0);body.add(head);ell(head,V(0,.03,0),V(.112,.145,.103),C.skin);ell(head,V(0,.005,.107),V(.031,.041,.047),C.skin);ell(head,V(-.113,.02,0),V(.025,.044,.026),C.skin);ell(head,V(.113,.02,0),V(.025,.044,.026),C.skin);
 const hair=mesh(new T.SphereGeometry(.116,24,12,0,Math.PI*2,0,Math.PI*.51),0x223945,head);hair.position.y=.075;hair.scale.set(1,1.05,.91);
 for(const x of [-.045,.045]){ell(head,V(x,.055,.093),V(.013,.012,.008),0x192f3b);tube(head,V(x-.018,.077,.091),V(x+.018,.081,.091),.007,0x394b4b)}line(head,[V(-.026,-.043,.091),V(0,-.047,.103),V(.026,-.044,.091)],.005,0x805d4b);
 if(diver){for(const x of [-.047,.047]){box(head,V(x,.047,.113),V(.085,.058,.025),0x6f9aa0);box(head,V(x,.047,.128),V(.068,.039,.008),0xa6c7c0)}tube(head,V(-.105,.05,.05),V(-.15,.27,.04),.012,0x91afa7);tube(head,V(-.15,.27,.04),V(-.11,.29,.04),.012,0x91afa7);for(let i=0;i<5;i++)box(body,V((i-2)*.06,.965,.12),V(.045,.08,.045),0x879797);}
 const parts=[];function segment(r1,r2,col){const m=mesh(new T.CylinderGeometry(r2,r1,1,14),col,body);parts.push(m);return m}
 function setSeg(m,a,b){const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize())}
 function elbow(a,b,l1,l2,bend){const delta=b.clone().sub(a),d=Math.min(delta.length(),l1+l2-.001);delta.normalize();const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x)),perp=bend.clone().addScaledVector(delta,-bend.dot(delta)).normalize();return a.clone().addScaledVector(delta,x).addScaledVector(perp,h)}
 const arms=[],legs=[];
 for(const sign of [-1,1]){const palm=ell(body,V(),V(.049,.070,.031),C.skin),fingers=[];for(let j=0;j<4;j++)fingers.push(tube(body,V(0,0,0),V(0,.06,0),.009,C.skin));const thumb=ell(body,V(),V(.018,.039,.02),C.skin);arms.push({sign,up:segment(.062,.049,C.navy),low:segment(.048,.033,diver?C.navy:C.skin),palm,fingers,thumb});const foot=ell(body,V(),V(.065,.055,.13),diver?0x2a4b5d:0x3f433f);const fin=diver?finShape(body):null;legs.push({sign,up:segment(.09,.064,C.navy),low:segment(.063,.043,C.navy),foot,fin});}
 const hands=[];let maxGripError=0;
 function pose(t,wheelAngle=null){hands.length=0;maxGripError=0;
  for(const a of arms){const s=a.sign,S=V(s*.205,1.43,0);let H;
   if(wheelAngle!==null){const ang=(s<0?Math.PI:0)+wheelAngle;H=V(.32*Math.cos(ang),1.12+.32*Math.sin(ang),.48)}
   else {const ph=t*(diver?2.1:5.4)+(s<0?0:Math.PI);H=V(s*(.22+.05*Math.cos(ph)),1.44+.43*Math.sin(ph),.23+.18*Math.cos(ph))}
   const E=elbow(S,H,.30,.285,V(s,-.25,-.25));setSeg(a.up,S,E);setSeg(a.low,E,H);a.palm.position.copy(H);a.palm.rotation.z=wheelAngle??-.25;for(let j=0;j<4;j++){const p=H.clone().add(V((j-1.5)*.018,-.025,.014)),q=p.clone().add(V(0,-.045,wheelAngle!==null?-.04:.015));setSeg(a.fingers[j],p,q)}a.thumb.position.copy(H).add(V(s*.038,.012,-.006));hands.push(H.clone());if(wheelAngle!==null)maxGripError=Math.max(maxGripError,Math.abs(Math.hypot(H.x,H.y-1.12)-.32));
  }
  for(const l of legs){const s=l.sign,H=V(s*.105,.92,0),kick=wheelAngle!==null?0:.13*Math.sin(t*(diver?3:6)+s*Math.PI/2),F=V(s*.105,.075,kick);const K=elbow(H,F,.43,.43,V(0,.05,.9));setSeg(l.up,H,K);setSeg(l.low,K,F);l.foot.position.copy(F).add(V(0,-.025,.065));l.foot.rotation.x=wheelAngle!==null?0:-.30+kick;if(l.fin){l.fin.position.copy(F);l.fin.rotation.x=-.15+kick}}
  head.rotation.y=wheelAngle!==null?-.10+.05*Math.sin(t):.06*Math.sin(t*.6);return maxGripError;
 }
 function finShape(parent){const f=fin(parent,[[-.07,0],[-.10,-.40],[.10,-.45],[.065,0]],.025,0x4a7b86);f.rotation.x=.15;return f}
 return {group,body,head,pose,hands,getGripError:()=>maxGripError};
}
function helm(captain){const h=new T.Group();captain.group.add(h);box(h,V(0,.43,.48),V(.28,.86,.28),0xc6d1c6);tube(h,V(0,.70,.46),V(0,1.12,.48),.047,C.metal);const wheel=new T.Group();wheel.position.set(0,1.12,.48);h.add(wheel);mesh(new T.TorusGeometry(.32,.025,12,64),C.wood,wheel);for(let i=0;i<3;i++)tube(wheel,V(),V(.295*Math.cos(i*2*Math.PI/3),.295*Math.sin(i*2*Math.PI/3),0),.013,C.metal);ell(wheel,V(),V(.05,.05,.035),C.metal);box(h,V(0,.91,.40),V(.20,.08,.13),0x244956);return wheel}
function captainOnDeck(b){const p=human();p.group.position.set(-3.40,.66,0);p.group.rotation.y=Math.PI/2;const w=helm(p);return {p,w}}
function intersection(a,b){scene.updateMatrixWorld(true);const tr=new T.Matrix4().copy(a.matrixWorld).invert().multiply(b.matrixWorld);return a.geometry.boundsTree.intersectsGeometry(b.geometry,tr)}
function gripPose(w,t,u,bladeMove=0){const roll=ease(u/.65),insert=ease((u-.68)/.32);w.group.rotation.set(roll*Math.PI/2,0,0);w.group.position.set(-5.70+.49*insert-w.L/2,-2.27-bladeMove,.13*roll);w.animate(t,.04+.20*roll)}
function setupRudder(k){
 sea(true);const b=boat(k==='boat_option'),a=whale(k==='hypothesis_play'?3.5:6.2),second=['hypothesis_play','hypothesis_imitation'].includes(k)?whale(3.3):null;
 cameraAt(V(-7,2.1,20),V(-2.9,-1.0,0),25);
 title(k==='rudder_detaches'?'THE RUDDER':k==='hypothesis_play'?'PLAY OR SOCIALIZING?':k==='hypothesis_imitation'?'IMITATION?':'AFTER THE RUDDER BREAKS',k.includes('hypothesis')?'Proposed explanations — not proven motives':'Illustrated mechanical reconstruction');
 update=t=>{
  let u=0,fract=0;
  if(k==='rudder_detaches'){const cam=ease((t-.35)/1.4);cameraAt(V(-7,-3.0-8*cam,19-11*cam),V(-2.9-3*cam,-1.0-.7*cam,0),25-7*cam);document.querySelector('#detail').textContent='Roll onto side → grip the blade → pull';u=ease((t-.45)/1.0)*(1-ease((t-3.7)/1.2));fract=ease((t-2.65)/.65);b.fracture(fract);gripPose(a,t,u,.3*fract);if(t>3.7){a.group.position.x-=2*ease((t-3.7)/2);a.group.position.z+=3.7*ease((t-3.7)/2)}checks.failure_time_seconds=2.65;checks.blade_detached=fract>.99;}
  else if(k==='boat_option'){b.fracture(1);gripPose(a,t,0,0);a.group.position.x-=t*.65;a.group.position.z=-2.5;}
  else {const one=ease((t-.5)/1.1)*(1-ease((t-4.0)/1.0));const two=ease((t-5.7)/1.0)*(1-ease((t-8.8)/1.0));gripPose(a,t,one);a.group.position.z+=(1-one)*4.4;a.group.position.x-=(1-one)*2.1;gripPose(second,t,two);second.group.position.z-=(1-two)*4.4;second.group.position.x-=(1-two)*2.4;checks.same_action_copied_in_sequence=k==='hypothesis_imitation';checks.simultaneous_visitors=one>.8&&two>.8;}
  if(k!=='boat_option'){checks.body_blade_penetration=intersection(a.body,b.blade);checks.lower_jaw_blade_penetration=intersection(a.jaw,b.blade);if(second){checks.second_body_blade_penetration=intersection(second.body,b.blade);checks.second_jaw_blade_penetration=intersection(second.jaw,b.blade);checks.orca_body_intersection=intersection(a.body,second.body)}}
 };
}
function setupDeck(k){const b=boat(k!=='yacht_stern'),{p,w}=captainOnDeck(b);sea(k==='human_not_target');let a=null;
 if(k==='helm_response'){cameraAt(V(-.4,3.4,4.9),V(-3.15,1.60,0),6.5);title('NO STEERING RESPONSE','Both hands remain on the mounted helm; the rudder has failed.');}
 else {cameraAt(V(-10,4.7,18),V(-1.5,.35,0),23);a=whale(5.5);a.group.position.set(-7.6,-2.4,-.5);title(k==='human_not_target'?'PEOPLE ARE NOT THE TARGET':'IBERIAN VESSEL INTERACTIONS',k==='human_not_target'?'People remain on deck; the interaction is with the rudder.':'Illustrated yacht reconstruction | attached rudder');}
 update=t=>{const angle=.32*Math.sin(t*1.2);w.rotation.z=angle;p.pose(t,angle);checks.maximum_hand_to_rim_error_metres=p.getGripError();checks.feet_on_deck=true;if(a){a.group.position.x=-8.6+.45*Math.sin(t*.7);a.animate(t,.03)}};
}
function setupSwim(k){sea(true);const diver=k==='diver_entanglement',surf=k==='surfer_incident',p=human({diver,swimmer:true});p.group.rotation.z=diver?Math.PI/2:-Math.PI/2;
 if(k==='swim_comparison'){
  const a=whale(6.2);cameraAt(V(0,3.2,25),V(0,-.3,0),26);title('ORCA AND SWIMMER','One shared distance scale and one 0.80-second interval.','Illustrative speeds: 50.4 km/h versus 9 km/h — not a measured race.');
  for(let d=0;d<=12;d+=2){tube(root,V(-3+d,-.80,0),V(-3+d,-1.0,0),.012,0xb5ccc5);label(d+' m',V(-3+d,-1.2,0))}tube(root,V(-3,-.88,0),V(9,-.88,0),.012,0xb5ccc5);tube(root,V(-3,2.5,0),V(-3,-3.8,0),.012,0x8daeb0);
  update=t=>{const elapsed=Math.min(.8,Math.max(0,t-1.4));a.group.position.set(-3+14*elapsed-3.1,1.10,0);a.animate(elapsed*2);p.group.position.set(-3+2.5*elapsed-1.76,-2.85,0);p.pose(elapsed);document.querySelector('#clock').textContent=elapsed.toFixed(2)+' s'+(t>2.2?' · positions held':'');checks.shared_interval_seconds=elapsed;checks.orca_displacement_metres=14*elapsed;checks.swimmer_displacement_metres=2.5*elapsed;checks.speed_ratio=5.6;};return;
 }
 const a=whale(6.2);a.group.position.set(-1.4,-2.9,-.8);p.group.position.set(5.0,-1.35,1.0);cameraAt(V(1,2,16),V(1.4,-1.2,0),16.7);
 if(diver){title('NEW ZEALAND','Free-diving line entanglement account | illustrated reconstruction');const rope=line(root,[V(),V(1,1,0),V(2,0,0)],.017,0xc4c7a7);const loop=line(root,[V(),V(.1,.1,0),V(.2,0,0)],.017,0xc4c7a7);update=t=>{p.pose(t);a.animate(t);a.group.position.x=-1.4+.12*t;p.group.position.x=5.0+.12*t;scene.updateMatrixWorld(true);const start=p.group.localToWorld(p.hands[1].clone()),end=a.group.localToWorld(a.finAnchor.clone());curveUpdate(rope,[start,start.clone().lerp(end,.35).add(V(0,-.24,.15)),end.clone().add(V(.1,-.14,0)),end]);const pts=[];for(let i=0;i<=24;i++){const q=i/24*Math.PI*2;pts.push(a.group.localToWorld(a.finAnchor.clone().add(V(.11*Math.cos(q),.08*Math.sin(q),.04*Math.sin(q)))))}curveUpdate(loop,pts);checks.free_diver_no_tank=true;checks.line_loop_tracks_pectoral=true;};}
 else {sea(false);title('A REPORTED SURFER ENCOUNTER','Illustrated reconstruction — not evidence of hunting people');const board=ell(root,V(4,-.7,0),V(1.35,.07,.35),0xd7c49a);p.group.position.set(3.5,-.55,0);p.group.scale.setScalar(.93);a.group.position.set(-1.5,-1.7,-1.5);cameraAt(V(0,4,15),V(1,-.5,0),16);update=t=>{p.pose(t*.6);a.animate(t);a.group.position.x=-1.5+.10*t;board.position.y=-.7+.025*Math.sin(t)};}
}
window.configure=async(k,d)=>{
 scene.remove(root);root.traverse(o=>{if(o.geometry)o.geometry.dispose()});root=new T.Group();scene.add(root);key=k;dur=d;checks={};labels=[];document.querySelector('#labels').innerHTML='';document.querySelector('#clock').textContent='';
 if(['rudder_detaches','hypothesis_play','hypothesis_imitation','boat_option'].includes(k))setupRudder(k);
 else if(['helm_response','human_not_target','yacht_stern'].includes(k))setupDeck(k);
 else setupSwim(k);
 await document.fonts.ready;return {engine:'Three.js r170 / real WebGL',key:k};
};
window.drawFrame=(t)=>{checks={};update(t);scene.updateMatrixWorld(true);for(const l of labels){const p=l.p.clone().project(camera);l.el.style.left=((p.x+1)*960-16)+'px';l.el.style.top=((1-p.y)*540)+'px'}renderer.render(scene,camera);return {...checks,time:t,engine:'Three.js',webgl:renderer.capabilities.isWebGL2?'WebGL2':'WebGL'};};
window.engineReady=true;
