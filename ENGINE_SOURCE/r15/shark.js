import * as T from 'three';
import {stage as S} from './scene.js';
const {V,mesh,curve}=S,PI=Math.PI;
// R14: genuinely volumetric lofts. No extruded polygon fins, sideways dorsal,
// disconnected tail hinge, whale flukes or eyes on floating rods.
export function loft(parent,sections,A,B,mat,n=52,k=24){
 const c=new T.CatmullRomCurve3(sections.map(s=>V(...s.slice(0,3)))),p=[],ix=[],centers=[];
 for(let j=0;j<=n;j++){let t=j/n,q=c.getPoint(t),u=t*(sections.length-1),m=Math.min(sections.length-2,Math.floor(u)),f=u-m;f=f*f*(3-2*f);let a=T.MathUtils.lerp(sections[m][3],sections[m+1][3],f),b=T.MathUtils.lerp(sections[m][4],sections[m+1][4],f);centers.push(q);
  for(let i=0;i<=k;i++){let th=i/k*2*PI,v=q.clone().addScaledVector(A,a*Math.sin(th)).addScaledVector(B,b*Math.cos(th));p.push(v.x,v.y,v.z);}}
 function tri(a,b,c,j){let va=V(...p.slice(a*3,a*3+3)),vb=V(...p.slice(b*3,b*3+3)),vc=V(...p.slice(c*3,c*3+3)),normal=vb.clone().sub(va).cross(vc.clone().sub(va)),rad=va.clone().sub(centers[j]);if(normal.dot(rad)>=0)ix.push(a,b,c);else ix.push(a,c,b);}
 for(let j=0;j<n;j++)for(let i=0;i<k;i++){let a=j*(k+1)+i,b=a+k+1;tri(a,b,a+1,j);tri(a+1,b,b+1,j)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();let o=mesh(parent,g,mat.clone());o.userData.rest=g.attributes.position.array.slice();return o;
}
export function shark(parent,L=4.4,kind='great_white'){
 const root=new T.Group(),body=new T.Group();parent.add(root);root.add(body);body.scale.setScalar(L/4.2);
 const bronze=kind==='bronze',hammer=kind==='hammerhead',coat=new T.Color(bronze?0x807e69:hammer?0x687f81:0x586a72),ivory=new T.Color(0xe2e4d6),mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.56,metalness:.015,vertexColors:true});
 const stations=[[-1.70,.065,.085,-.025],[-1.42,.095,.13,-.025],[-1.10,.16,.20,-.025],[-.62,.29,.33,-.015],[0,.40,.405,0],[.55,.415,.395,.012],[.98,.36,.32,.01],[1.32,.285,.235,-.006],[1.58,.18,.135,-.035],[1.77,.075,.054,-.046],[1.85,.008,.009,-.04]];
 if(bronze||hammer)stations.forEach(s=>{s[1]*=.80;s[2]*=.85});if(hammer){stations.splice(-3,3,[1.43,.14,.105,-.015],[1.54,.035,.045,-.015]);}
 const skin=loft(body,stations.map(s=>[0,s[3],s[0],s[1],s[2]]),V(1,0,0),V(0,1,0),mat,104,48),parts=[skin];
 function pigment(o,isFin=false){const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,a=[];for(let i=0;i<p.count;i++){let y=n.getY(i),v=1-T.MathUtils.smoothstep(y,-.52,-.03),c=coat.clone().lerp(ivory,v),grain=1+.027*Math.sin(p.getX(i)*103+p.getY(i)*71)*Math.sin(p.getZ(i)*93);c.multiplyScalar(grain);a.push(c.r,c.g,c.b)}o.geometry.setAttribute('color',new T.Float32BufferAttribute(a,3));}
 pigment(skin);
 function fin(sections,A,B){let f=loft(body,sections,A,B,mat,36,20);pigment(f,true);parts.push(f);return f;}
 // First dorsal sits in the sagittal plane, swept toward the caudal peduncle.
 const dh=bronze?.79:hammer?.99:.96;
 fin([[0,.29,.04,.055,.40],[0,.48,-.03,.047,.31],[0,.73,-.18,.025,.17],[0,dh,-.34,.002,.008]],V(1,0,0),V(0,0,1));
 fin([[0,.155,-1.02,.021,.15],[0,.30,-1.12,.018,.09],[0,.34,-1.20,.001,.004]],V(1,0,0),V(0,0,1));
 for(const side of[-1,1]){
  fin([[side*.25,-.19,.58,.045,.31],[side*.46,-.28,.42,.046,.28],[side*.78,-.43,.04,.028,.16],[side*(hammer?1.00:1.06),-.49,-.29,.002,.009]],V(0,1,0),V(0,0,1));
  fin([[side*.15,-.20,-.77,.026,.20],[side*.32,-.29,-.89,.018,.14],[side*.47,-.31,-1.13,.001,.005]],V(0,1,0),V(0,0,1));
 }
 fin([[0,-.16,-1.10,.018,.14],[0,-.30,-1.23,.014,.08],[0,-.32,-1.29,.001,.004]],V(1,0,0),V(0,0,1));
 // Vertical heterocercal caudal fin, near-lunate for the white; longer upper
 // lobe and a smaller lower lobe on carcharhinids/hammerheads.
 fin([[0,-.025,-1.66,.061,.13],[0,.17,-1.85,.052,.20],[0,.48,-2.05,.025,.14],[0,bronze||hammer?.90:.75,-2.35,.001,.006]],V(1,0,0),V(0,0,1));
 fin([[0,-.025,-1.66,.061,.13],[0,-.20,-1.86,.043,.18],[0,-.46,-2.06,.022,.12],[0,bronze||hammer?-.52:-.64,-2.29,.001,.006]],V(1,0,0),V(0,0,1));
 // Peduncular keels are tiny streamlined volumes, never separate paddles.
 if(!bronze&&!hammer)for(const side of[-1,1])fin([[side*.055,-.02,-1.25,.015,.12],[side*.14,-.02,-1.55,.008,.10],[side*.06,-.02,-1.75,.001,.01]],V(0,1,0),V(0,0,1));
 function radii(z){let j=0;while(j<stations.length-2&&stations[j+1][0]<z)j++;let a=stations[j],b=stations[j+1],u=T.MathUtils.clamp((z-a[0])/(b[0]-a[0]),0,1);return[a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u,a[3]+(b[3]-a[3])*u];}
 for(const side of[-1,1]){
  for(let i=0;i<5;i++){let z=.96-i*.075,r=radii(z);curve(body,Array.from({length:12},(_,j)=>{let y=.15-j*.033;return V(side*(r[0]*Math.sqrt(Math.max(.05,1-((y-r[2])/r[1])**2))+.008),y,z+.035*Math.sin(j/11*PI));}),.0055,0x34474c);}
  if(!hammer){let r=radii(1.36),e=mesh(body,new T.SphereGeometry(.026,20,12),0x071b23);e.position.set(side*(r[0]*.96+.012),.027,1.36);}
 }
 if(hammer){const sec=[];for(let i=0;i<=16;i++){let x=-.86+1.72*i/16,q=Math.abs(x)/.86,cap=Math.sqrt(Math.max(.002,1-q*q));sec.push([x,-.015,1.50+.06*q*q,.115*cap+.004,.165*cap+.005]);}const ceph=loft(body,sec,V(0,1,0),V(0,0,1),mat,72,28);pigment(ceph);parts.push(ceph);for(let side of[-1,1]){let e=mesh(body,new T.SphereGeometry(.024,20,12),0x071b23);e.position.set(side*.858,-.008,1.56);}
 curve(body,[V(-.38,-.108,1.55),V(0,-.128,1.59),V(.38,-.108,1.55)],.005,0x3b4e53);
 }else for(let side of[-1,1])curve(body,[V(side*.025,-.098,1.797),V(side*.11,-.139,1.69),V(side*.21,-.167,1.49),V(side*.253,-.145,1.36)],.005,0x3b4e53);
 return{root,body,skin,kind,length:L,anatomy:'R14 smooth volumetric body and fins; sagittal dorsal; vertical species-specific caudal; five surface-following gills; whole-body caudal deformation',swim(t){for(const o of parts){let p=o.geometry.attributes.position,r=o.userData.rest;for(let i=0;i<p.count;i++){let z=r[3*i+2],w=Math.max(0,(.48-z)/2.85);p.setX(i,r[3*i]+.16*w*w*Math.sin(t*2.2+z*1.25));}p.needsUpdate=true;o.geometry.computeVertexNormals();}}};
}
