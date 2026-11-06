import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MeshBVH} from 'three-mesh-bvh';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
let original,hairOriginal;
export async function loadCharacters(){
 const l=new GLTFLoader();[original,hairOriginal]=await Promise.all(['male','hair'].map(n=>l.loadAsync('/assets/quaternius/'+n+'.gltf')));
}
// Genuine authored, continuous skinned topology. No segmented mannequin is used.
export function createHuman({root,diver=false,swimmer=false,surfer=false}){
 const group=new T.Group();root.add(group);const body=clone(original.scene);group.add(body);
 const bones={};body.traverse(o=>{if(o.isBone)bones[o.name]=o});group.updateMatrixWorld(true);
 const head=bones.Head,bind=new Map();Object.values(bones).forEach(b=>bind.set(b,b.quaternion.clone()));
 let skinMesh;
 body.traverse(o=>{
  if(!o.isMesh)return;o.geometry=o.geometry.clone();o.geometry.deleteAttribute('color');o.frustumCulled=false;
  const source=o.material;
  const m=new T.MeshStandardMaterial({map:source.map,normalMap:source.normalMap,normalScale:new T.Vector2(.35,.35),roughness:.84,metalness:0,side:T.DoubleSide});
  if(o.name==='SuperHero_Male'){
   skinMesh=o;const p=o.geometry.attributes.position,ci=[],mask=[];
   for(let i=0;i<p.count;i++){
    const x=Math.abs(p.getX(i)),y=p.getY(i);let cloth=null;
    if(diver){if(y<1.49&&!(x>.72&&y>1.20))cloth=0x1e3d52;if(y>.90&&y<1.41&&x<.18)cloth=0x365d6c;}
    else if(surfer){if(y>.98&&y<1.46&&x<.51)cloth=0x264d5d;if(y>.64&&y<1.0&&x<.25)cloth=0x244451;}
    else if(swimmer){if(y>.68&&y<1.0&&x<.25)cloth=0x23677b;}
    else {if(y<1.0)cloth=y<.095?0x26343d:0x354b5b;else if(y<1.47&&x<.50)cloth=0x456e7e;}
    const c=new T.Color(cloth??0xffffff);ci.push(c.r,c.g,c.b);mask.push(cloth===null?0:1);
   }
   o.geometry.setAttribute('wardrobe',new T.Float32BufferAttribute(ci,3));o.geometry.setAttribute('clothMask',new T.Float32BufferAttribute(mask,1));
   m.onBeforeCompile=s=>{
    s.vertexShader='attribute vec3 wardrobe; attribute float clothMask; varying vec3 vWardrobe; varying float vClothMask;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWardrobe=wardrobe;vClothMask=clothMask;');
    s.fragmentShader='varying vec3 vWardrobe; varying float vClothMask;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vWardrobe,smoothstep(0.25,0.75,vClothMask));');
   };m.customProgramCacheKey=()=> 'source-skinned-wardrobe-v1';
  }
  o.material=m;
 });
 // Hair was authored in the same unposed body coordinate system. Attach while preserving its bind placement.
 const hair=hairOriginal.scene.clone(true);group.add(hair);group.updateMatrixWorld(true);head.attach(hair);
 hair.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.geometry.deleteAttribute('color');o.material=new T.MeshStandardMaterial({map:o.material.map,color:0x695e50,roughness:.9,side:T.DoubleSide})}});
 function attachEquipment(o){group.add(o);group.updateMatrixWorld(true);head.attach(o);return o}
 if(diver){
  const mask=new T.Group();mask.position.set(0,1.70,.105);
  for(const sign of [-1,1]){
   const rim=new T.Mesh(new T.TorusGeometry(.043,.007,10,30),new T.MeshStandardMaterial({color:0x243d48,roughness:.6}));rim.position.x=sign*.045;rim.scale.y=.68;mask.add(rim);
   const lens=new T.Mesh(new T.CircleGeometry(.038,30),new T.MeshPhysicalMaterial({color:0x9ecbd1,transparent:true,opacity:.42,roughness:.12,metalness:.1,side:T.DoubleSide}));lens.position.set(sign*.045,0,.005);lens.scale.y=.68;mask.add(lens);
  }
  const bridge=new T.Mesh(new T.BoxGeometry(.018,.012,.016),new T.MeshStandardMaterial({color:0x243d48}));mask.add(bridge);attachEquipment(mask);
  const points=[V(-.097,1.70,.075),V(-.12,1.71,.01),V(-.122,1.91,.005),V(-.105,1.94,.005)];
  attachEquipment(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.009,8,false),new T.MeshStandardMaterial({color:0x657e83})));
  const strap=new T.Mesh(new T.TorusGeometry(.087,.008,8,48),new T.MeshStandardMaterial({color:0x243d48}));strap.rotation.x=Math.PI/2;strap.position.set(0,1.71,.005);strap.scale.y=1.1;attachEquipment(strap);
  // Weight belt uses the pelvis joint, never a scuba tank or regulator.
  const belt=new T.Group();for(let i=0;i<5;i++){const weight=new T.Mesh(new T.BoxGeometry(.042,.065,.032),new T.MeshStandardMaterial({color:0x79858a}));weight.position.set((i-2)*.047,.985,.112);belt.add(weight)}group.add(belt);group.updateMatrixWorld(true);bones.pelvis.attach(belt);
  for(const side of ['l','r']){
   const sign=side==='l'?1:-1,shape=new T.Shape();shape.moveTo(-.065,.015);shape.lineTo(-.095,.57);shape.quadraticCurveTo(0,.64,.095,.57);shape.lineTo(.065,.015);shape.closePath();
   const fin=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:2,steps:1}),new T.MeshStandardMaterial({color:0x3f7985,roughness:.65}));fin.rotation.x=Math.PI/2;fin.position.set(sign*.114,.032,.045);group.add(fin);group.updateMatrixWorld(true);bones['foot_'+side].attach(fin);
  }
 }
 const hands=[],segments=[];let maxGripError=0;
 const localPosition=b=>group.worldToLocal(b.getWorldPosition(V()));
 function aim(bone,child,target){
  group.updateMatrixWorld(true);const a=bone.getWorldPosition(V()),c=child.getWorldPosition(V()),goal=group.localToWorld(target.clone());
  const delta=new T.Quaternion().setFromUnitVectors(c.sub(a).normalize(),goal.sub(a).normalize());
  const world=delta.multiply(bone.getWorldQuaternion(new T.Quaternion()));const parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(world));group.updateMatrixWorld(true);
 }
 function solve(a,b,l1,l2,bend){
  let delta=b.clone().sub(a),d=Math.min(delta.length(),l1+l2-.002);delta.normalize();
  const end=a.clone().addScaledVector(delta,d),x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));
  const perp=bend.clone().addScaledVector(delta,-bend.dot(delta)).normalize();return {elbow:a.clone().addScaledVector(delta,x).addScaledVector(perp,h),end};
 }
 function orientHand(hand,forward,normal){
  const y=forward.clone().normalize(),x=y.clone().cross(normal).normalize(),z=x.clone().cross(y).normalize();
  const world=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(group.getWorldQuaternion(new T.Quaternion()).multiply(world)));group.updateMatrixWorld(true);
 }
 function pose(t,wheelAngle=null){
  bind.forEach((q,b)=>b.quaternion.copy(q));hands.length=0;segments.length=0;maxGripError=0;group.updateMatrixWorld(true);
  if(wheelAngle!==null){
   const b=bones.spine_01,gw=group.getWorldQuaternion(new T.Quaternion()),delta=gw.clone().multiply(new T.Quaternion().setFromAxisAngle(V(1,0,0),.20)).multiply(gw.clone().invert());
   b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(delta).multiply(b.getWorldQuaternion(new T.Quaternion())));group.updateMatrixWorld(true);
  }
  for(const side of ['r','l']){
   const sign=side==='l'?1:-1,up=bones['upperarm_'+side],low=bones['lowerarm_'+side],hand=bones['hand_'+side],S=localPosition(up);let H;
   if(wheelAngle!==null){const a=(sign<0?Math.PI:0)+wheelAngle;H=V(.32*Math.cos(a),1.12+.32*Math.sin(a),.48)}
   else if(surfer){const ph=t*5.4+(sign<0?0:Math.PI),theta=ph-Math.PI/2,s=Math.sin(theta);H=V(sign*(.46+.045*Math.max(0,-s)),1.44+.32*Math.cos(theta),s>0?.35*s:.15*s);}
   else {const ph=t*(diver?2.1:5.4)+(sign<0?0:Math.PI);H=V(sign*(.22+.05*Math.cos(ph)),1.44+.40*Math.sin(ph),.23+.18*Math.cos(ph))}
   const ray=H.clone().sub(S).normalize(),W=H.clone().addScaledVector(ray,-.095);
   const l1=localPosition(low).distanceTo(S),l2=localPosition(hand).distanceTo(localPosition(low));
   const solution=solve(S,W,l1,l2,V(sign,-.20,surfer?-.9:-.25));
   aim(up,low,solution.elbow);aim(low,hand,solution.end);
   const wrist=localPosition(hand),forward=H.clone().sub(wrist).normalize();orientHand(hand,forward,V(0,0,1));
   if(wheelAngle!==null){for(const f of ['index','middle','ring','pinky'])for(let j=1;j<=3;j++){const b=bones[f+'_0'+j+'_'+side];b.quaternion.multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),sign*.68));}}
   group.updateMatrixWorld(true);const actual=group.worldToLocal(hand.localToWorld(V(0,.095,0)));hands.push(actual);segments.push({shoulder:S,elbow:localPosition(low),wrist});
   if(wheelAngle!==null)maxGripError=Math.max(maxGripError,actual.distanceTo(H));
  }
  for(const side of ['r','l']){
   const sign=side==='l'?1:-1,up=bones['thigh_'+side],low=bones['calf_'+side],foot=bones['foot_'+side];
   if(wheelAngle===null){const H=localPosition(up),A=localPosition(foot),kick=.13*Math.sin(t*(diver?3:6)+sign*Math.PI/2);A.z+=kick;
    const l1=localPosition(low).distanceTo(H),l2=localPosition(foot).distanceTo(localPosition(low)),solution=solve(H,A,l1,l2,V(0,.05,.9));
    aim(up,low,solution.elbow);aim(low,foot,solution.end);const ankle=localPosition(foot);aim(foot,bones['ball_'+side],ankle.clone().add(V(0,-.18,.035)));
   }
  }
  head.quaternion.multiply(new T.Quaternion().setFromAxisAngle(V(0,1,0),wheelAngle!==null?-.10+.05*Math.sin(t):.06*Math.sin(t*.6)));
  group.updateMatrixWorld(true);return maxGripError;
 }
 // Collision proxies are derived from the actual skinned source mesh, not hand-center points.
 const pos=skinMesh.geometry.attributes.position,allGeometry=new T.BufferGeometry();allGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(pos.count*3),3));allGeometry.setIndex(skinMesh.geometry.index.clone());
 const armGeometry=new T.BufferGeometry();armGeometry.setAttribute('position',allGeometry.attributes.position);const armIndex=[];
 const joint=skinMesh.geometry.attributes.skinIndex,weight=skinMesh.geometry.attributes.skinWeight,indices=skinMesh.geometry.index;
 const armVertex=i=>{for(let j=0;j<4;j++){const name=skinMesh.skeleton.bones[joint.getComponent(i,j)].name;if(weight.getComponent(i,j)>.05&&/upperarm|lowerarm|hand_|index_|middle_|ring_|pinky_|thumb_/.test(name))return true}return false};
 for(let i=0;i<indices.count;i+=3){const tri=[indices.getX(i),indices.getX(i+1),indices.getX(i+2)];if(tri.some(armVertex))armIndex.push(...tri)}armGeometry.setIndex(armIndex);
 let collisionReady=false;
 function checkBoard(board){
  group.updateMatrixWorld(true);skinMesh.skeleton.update();const p=allGeometry.attributes.position,v=V();for(let i=0;i<pos.count;i++){skinMesh.getVertexPosition(i,v);p.setXYZ(i,v.x,v.y,v.z)}p.needsUpdate=true;
  if(!collisionReady){allGeometry.boundsTree=new MeshBVH(allGeometry);armGeometry.boundsTree=new MeshBVH(armGeometry);collisionReady=true}else{allGeometry.boundsTree.refit();armGeometry.boundsTree.refit()}
  const tr=new T.Matrix4().copy(skinMesh.matrixWorld).invert().multiply(board.matrixWorld);
  return {arm_board_penetration:armGeometry.boundsTree.intersectsGeometry(board.geometry,tr),body_board_penetration:allGeometry.boundsTree.intersectsGeometry(board.geometry,tr),arm_board_test:'Actual deformed arm/finger triangles against surfboard triangles',arm_board_triangles:armIndex.length/3};
 }
 return {group,body,head,pose,hands,segments,checkBoard,getGripError:()=>maxGripError,skinMesh};
}
