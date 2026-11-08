import * as T from 'three';
import {stage as S} from './scene.js';
import {loft} from './shark.js';
const {V,mesh,curve}=S,PI=Math.PI;
// R15: a balaenopterid, not a pointed fish/tube. Broad depressed U-shaped
// rostrum, fuller jaw/throat, long tapering peduncle and horizontal flukes.
// Every visible appendage shares the body's deterministic vertical bend.
export function blueWhale(parent,L=16,age='adult'){
 const root=new T.Group(),body=new T.Group();parent.add(root);root.add(body);
 // z, half-width, half-height, center elevation; front is +z.
 const stations=[[-8.03,.09,.12,.01],[-7.5,.19,.20,0],[-6.2,.36,.37,-.02],[-4.5,.64,.62,-.025],[-2.5,.93,.85,-.02],[0,1.16,1.01,0],[2.3,1.23,1.03,.015],[4,1.16,.86,.025],[5.4,1.01,.61,.04],[6.5,.81,.39,.035],[7.10,.55,.27,.02],[7.40,.18,.13,0],[7.45,.006,.006,0]];
 // Shape-preserving cubic Hermite interpolation, queried by actual z. Surface
 // markings and dorsal bases therefore follow precisely the same surface.
 function profile(z){let j=0;while(j<stations.length-2&&stations[j+1][0]<z)j++;let a=stations[j],b=stations[j+1],h=b[0]-a[0],u=T.MathUtils.clamp((z-a[0])/h,0,1),ans=[];
  for(let k=1;k<=3;k++){const slope=i=>{if(i===0)return(stations[1][k]-stations[0][k])/(stations[1][0]-stations[0][0]);if(i===stations.length-1)return(stations[i][k]-stations[i-1][k])/(stations[i][0]-stations[i-1][0]);let p=(stations[i][k]-stations[i-1][k])/(stations[i][0]-stations[i-1][0]),q=(stations[i+1][k]-stations[i][k])/(stations[i+1][0]-stations[i][0]);return p*q<=0?0:2*p*q/(p+q);};ans.push((2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*h*slope(j)+(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*h*slope(j+1));}return ans;}
 function skinPoint(z,a,offset=.006){let[rx,ry,cy]=profile(z);return V((rx+offset)*Math.sin(a),cy+(ry+offset)*Math.cos(a),z);}
 const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.60,metalness:.005,vertexColors:true});
 function shade(o){const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,c=[],top=new T.Color(0x607c85),bottom=new T.Color(0xa4b5b7);for(let i=0;i<p.count;i++){let u=1-T.MathUtils.smoothstep(n.getY(i),-.85,-.05),q=top.clone().lerp(bottom,u);c.push(q.r,q.g,q.b);}o.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));o.material=mat.clone();
  o.material.onBeforeCompile=s=>{s.vertexShader='varying vec3 p15;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\np15=position;');s.fragmentShader=`varying vec3 p15;
float hash15(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise15(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash15(i),hash15(i+vec3(1,0,0)),f.x),mix(hash15(i+vec3(0,1,0)),hash15(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash15(i+vec3(0,0,1)),hash15(i+vec3(1,0,1)),f.x),mix(hash15(i+vec3(0,1,1)),hash15(i+vec3(1,1,1)),f.x),f.y),f.z);}
`+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat mottles=noise15(p15*2.6)+.32*noise15(p15*7.);diffuseColor.rgb*=.86+.22*mottles;');};o.material.customProgramCacheKey=()=>'r15-whale-mottles';}
 const pts=[],ix=[],nz=240,nr=64;for(let j=0;j<=nz;j++){let z=-8.03+(7.45+8.03)*j/nz;for(let k=0;k<=nr;k++){let p=skinPoint(z,k/nr*2*PI,0);pts.push(p.x,p.y,p.z);if(j<nz&&k<nr){let a=j*(nr+1)+k,b=a+nr+1;ix.push(a,b,a+1,a+1,b,b+1);}}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setIndex(ix);geo.computeVertexNormals();const skin=mesh(body,geo,mat);shade(skin);
 function fin(sections,A,B){let o=loft(body,sections,A,B,mat,44,24);shade(o);return o;}
 for(const side of[-1,1]){
  fin([[side*1.00,-.43,3.12,.115,.38],[side*1.45,-.64,2.79,.10,.39],[side*2.10,-.90,2.12,.055,.27],[side*2.67,-1.04,1.48,.003,.012]],V(0,1,0),V(0,0,1));
  // A broad, genuinely horizontal lobe, with a thick integrated central root.
  fin([[0,.015,-7.67,.115,.40],[side*.78,-.015,-7.91,.105,.57],[side*1.62,-.025,-8.02,.050,.42],[side*2.13,.005,-8.30,.002,.010]],V(0,1,0),V(0,0,1));
 }
 const dz=-4.30,base=Math.min(profile(dz-.62)[1]+profile(dz-.62)[2],profile(dz+.62)[1]+profile(dz+.62)[2])-.10;
 const dorsal=fin([[0,base,dz,.07,.62],[0,base+.20,dz-.09,.057,.38],[0,base+.43,dz-.30,.028,.18],[0,base+.51,dz-.45,.002,.005]],V(1,0,0),V(0,0,1));
 // Close, fine ventral pleats; no intersecting raised mesh grid or long tusk.
 for(let i=-13;i<=13;i++)curve(body,Array.from({length:42},(_,j)=>{let u=j/41,z=-.8+7.98*u,a=PI+i*.056*(.78+.22*Math.sin(u*PI));return skinPoint(z,a,.009);}),.0045,0x7c949b);
 for(const side of[-1,1]){
  curve(body,Array.from({length:38},(_,j)=>{let u=j/37,z=3.62+3.79*u,a=side*(PI/2+.17+.19*(1-u));return skinPoint(z,a,.008);}),.011,0x334d58);
  const eyeP=skinPoint(4.57,side*(PI/2+.05),.009),e=mesh(body,new T.SphereGeometry(.037,20,12),new T.MeshStandardMaterial({color:0x102b35,roughness:.32}));e.position.copy(eyeP);e.scale.x=.50;
  curve(body,Array.from({length:14},(_,j)=>skinPoint(5.05+.24*j/13,side*(.075+.025*Math.sin(j/13*PI)),.012)),.012,0x263f49);
 }
 const all=[];body.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.geometry.userData.rest=o.geometry.attributes.position.array.slice();all.push(o);}});
 // Normalize actual geometry length to the spoken estimate, rather than
 // treating length as a label that ignores protruding or detached parts.
 body.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body),normalization=L/(bounds.max.z-bounds.min.z);body.scale.setScalar(normalization);body.position.z=-(bounds.min.z+bounds.max.z)*.5*normalization;
 function bend(z,t){let u=Math.max(0,Math.min(1,(-z-1.5)/6.8));return .23*u*u*Math.sin(t*1.35+z*.23);}
 const bh=skinPoint(5.16,0,.018);
 return{root,body,kind:'blue_whale',length:L,age,anatomy:'R15 broad U-rostrum, fuller jaw/throat, integrated sagittal dorsal, rooted volumetric flippers, horizontal flukes, unified whole-body vertical bend',dorsal_base_embedded_m:.10,blowholeWorld(){return body.localToWorld(bh.clone());},swim(t){for(const o of all){const p=o.geometry.attributes.position,r=o.geometry.userData.rest;for(let i=0;i<p.count;i++){let x=r[3*i],y=r[3*i+1],z=r[3*i+2];p.setXYZ(i,x,y+bend(z,t),z);}p.needsUpdate=true;o.geometry.computeVertexNormals();}root.updateMatrixWorld(true);}};
}
