// R8 production pose fixtures. No video analysis, sampling or review.
// A single constrained pose is baked into real static geometry, not recomputed per frame.
import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function world(h,name){return h.bones[name].getWorldPosition(V())}
function palmFrame(h,side){
 h.root.updateWorldMatrix(true,true);const w=world(h,'Hand_'+side),m=world(h,'Middle1_'+side),i=world(h,'Index1_'+side),p=world(h,'Pinky1_'+side),f=m.clone().sub(w).normalize();
 let across=i.clone().sub(p);across.addScaledVector(f,-across.dot(f)).normalize();let n=across.clone().cross(f).normalize(),bend=V();
 // Authored finger flexion defines the palmar surface; no L/R sign guess.
 for(const finger of ['Index','Middle','Ring','Pinky']){let a=world(h,finger+'1_'+side),b=world(h,finger+'2_'+side),c=world(h,finger+'3_'+side);bend.add(c.sub(b).normalize().sub(b.sub(a).normalize()));}
 let sign=n.dot(bend);if(Math.abs(sign)<1e-5){const thumb=world(h,'Thumb3_'+side).sub(world(h,'Thumb1_'+side));sign=n.dot(thumb);}
 if(sign<0)n.negate();across=f.clone().cross(n).normalize();return {w,f,n,across};
}
function rotationBetweenFrames(src,forward,normal){const f=forward.clone().normalize(),n=normal.clone().addScaledVector(f,-normal.dot(f)).normalize(),a=f.clone().cross(n).normalize();const source=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(src.across,src.f,src.n)),dest=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(a,f,n));return dest.multiply(source.invert()).normalize();}
function alignPalm(S,h,side,forward,normal){
 const hand=h.bones['Hand_'+side],lower=h.bones['Forearm_'+side];let src=palmFrame(h,side),q=rotationBetweenFrames(src,forward,normal),axis=src.w.clone().sub(world(h,'Forearm_'+side)).normalize();
 // Put pronation into the forearm, rather than twisting the wrist through 180 degrees.
 const projection=V(q.x,q.y,q.z).dot(axis),twist=new T.Quaternion(axis.x*projection,axis.y*projection,axis.z*projection,q.w);
 if(twist.lengthSq()>1e-10){twist.normalize();if(twist.w<0)twist.set(-twist.x,-twist.y,-twist.z,-twist.w);S.rotateWorld(lower,twist);}
 src=palmFrame(h,side);S.rotateWorld(hand,rotationBetweenFrames(src,forward,normal));h.root.updateWorldMatrix(true,true);
}
function palmCenter(h,side){let mid=V();for(const f of ['Index','Middle','Ring','Pinky'])mid.add(world(h,f+'1_'+side));mid.multiplyScalar(.25);return world(h,'Hand_'+side).multiplyScalar(.55).addScaledVector(mid,.45);}
function poseHand(S,h,side,center,forward,normal,pole,curl=0){
 let wrist=center.clone().addScaledVector(forward,-.045);
 // A positional fixture places the real palm center on the grip/support plane.
 for(let k=0;k<3;k++){h.ik(side,wrist,pole);alignPalm(S,h,side,forward,normal);wrist.add(center.clone().sub(palmCenter(h,side)));}
 h.ik(side,wrist,pole);alignPalm(S,h,side,forward,normal);
 if(curl){for(const f of ['Index','Middle','Ring','Pinky'])for(let j=1;j<=3;j++){const b=h.bones[f+j+'_'+side],next=h.bones[f+(j+1)+'_'+side];let along=next?next.getWorldPosition(V()).sub(b.getWorldPosition(V())).normalize():forward.clone();let axis=along.cross(normal).normalize();if(axis.lengthSq()>.1)S.rotateWorld(b,new T.Quaternion().setFromAxisAngle(axis,curl*(j===1?.36:j===2?.85:.65)));}
  // Opposed thumbs rest on the inner edge instead of sticking backwards.
  const target=center.clone().addScaledVector(forward,.045).addScaledVector(normal,.015);
  for(let j=1;j<=2;j++){const b=h.bones['Thumb'+j+'_'+side],next=h.bones['Thumb'+(j+1)+'_'+side],o=b.getWorldPosition(V()),a=next.getWorldPosition(V()).sub(o).normalize(),d=target.clone().sub(o).normalize();if(a.lengthSq()>.1&&d.lengthSq()>.1)S.rotateWorld(b,new T.Quaternion().setFromUnitVectors(a,d));}
 }
}
// R9 volume-preserving dual-quaternion pose baking for the driver.
// Linear skinning at a pronated elbow collapses the skin (the supplied screenshot).
function dualPalette(skin){
 const result=[],m=new T.Matrix4(),p=V(),q=new T.Quaternion(),scale=V();
 for(let j=0;j<skin.skeleton.bones.length;j++){
  m.fromArray(skin.skeleton.boneMatrices,j*16).decompose(p,q,scale);
  if(Math.max(Math.abs(scale.x-1),Math.abs(scale.y-1),Math.abs(scale.z-1))>.002)throw Error('Driver skin must have rigid bind transforms');
  q.normalize();const d=new T.Quaternion(p.x,p.y,p.z,0).multiply(q);result.push({r:q.toArray(),d:d.toArray().map(x=>x*.5)});
 }return result;
}
function dualVertex(skin,i,v,palette){
 const si=skin.geometry.attributes.skinIndex,sw=skin.geometry.attributes.skinWeight;
 const real=[0,0,0,0],dual=[0,0,0,0];let ref;
 for(let k=0;k<4;k++){
  let w=sw.getComponent(i,k);if(!w)continue;const b=palette[si.getComponent(i,k)];if(!ref)ref=b.r;
  if(b.r.reduce((sum,x,j)=>sum+x*ref[j],0)<0)w=-w;
  for(let j=0;j<4;j++){real[j]+=w*b.r[j];dual[j]+=w*b.d[j];}
 }
 const length=Math.hypot(...real);if(length<1e-8)throw Error('Unbound driver vertex');
 for(let j=0;j<4;j++){real[j]/=length;dual[j]/=length;}
 const [rx,ry,rz,rw]=real,[dx,dy,dz,dw]=dual;
 v.applyMatrix4(skin.bindMatrix).applyQuaternion(new T.Quaternion(...real));
 v.add(V(2*(-dw*rx+dx*rw-dy*rz+dz*ry),2*(-dw*ry+dy*rw-dz*rx+dx*rz),2*(-dw*rz+dz*rw-dx*ry+dy*rx)));
 return v.applyMatrix4(skin.bindMatrixInverse);
}
function bakeCharacter(h,dual=false){
 h.root.updateWorldMatrix(true,false);h.root.updateMatrixWorld(true);const skins=[];h.root.traverse(o=>{if(o.isSkinnedMesh)skins.push(o)});
 for(const skin of skins){skin.updateMatrixWorld(true);if(skin.bindMode==='attached')skin.bindMatrixInverse.copy(skin.matrixWorld).invert();skin.skeleton.update();const palette=dual?dualPalette(skin):null;const g=skin.geometry.clone(),p=g.attributes.position,v=V();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);if(dual)dualVertex(skin,i,v,palette);else skin.applyBoneTransform(i,v);p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;g.deleteAttribute('skinIndex');g.deleteAttribute('skinWeight');g.computeVertexNormals();g.computeBoundingSphere();const fixed=new T.Mesh(g,skin.material);fixed.name='R8_FIXED_'+skin.name;fixed.position.copy(skin.position);fixed.quaternion.copy(skin.quaternion);fixed.scale.copy(skin.scale);fixed.castShadow=skin.castShadow;fixed.receiveShadow=skin.receiveShadow;fixed.frustumCulled=false;skin.parent.add(fixed);skin.parent.remove(skin);}
 h.root.traverse(o=>{if(o.isBone){o.updateMatrix();o.matrixAutoUpdate=false;}});
 // Future legacy calls cannot undo the fixed pose. Root-only travel is still allowed.
 h.reset=()=>{};h.ik=()=>0;h.grasp=()=>{};h.r8Baked=true;h.r8BakedMeshCount=skins.length;
}
// Anatomical frame is defined by the thumb side and real metacarpal direction.
// Unlike R8, no guessed palmar normal determines hand handedness.
function thumbFrame(h,side){
 h.root.updateWorldMatrix(true,true);const w=world(h,'Hand_'+side),f=world(h,'Middle1_'+side).sub(w).normalize();
 let thumb=world(h,'Thumb2_'+side).sub(world(h,'Pinky1_'+side));thumb.addScaledVector(f,-thumb.dot(f)).normalize();
 return {thumb,f,n:thumb.clone().cross(f).normalize()};
}
function thumbRotation(h,side,forward,up){
 const s=thumbFrame(h,side),f=forward.clone().normalize(),t=up.clone().addScaledVector(f,-up.dot(f)).normalize(),n=t.clone().cross(f).normalize();
 const src=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(s.thumb,s.f,s.n));
 return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(t,f,n)).multiply(src.invert()).normalize();
}
function neutralWheelHand(S,h,side,forward,up){
 const lower=h.bones['Forearm_'+side],hand=h.bones['Hand_'+side],q=thumbRotation(h,side,forward,up),axis=world(h,'Hand_'+side).sub(world(h,'Forearm_'+side)).normalize();
 let projection=V(q.x,q.y,q.z).dot(axis),w=q.w;
 if(w<0){projection=-projection;w=-w;}
 const angle=T.MathUtils.clamp(2*Math.atan2(projection,w),-Math.PI*5/12,Math.PI*5/12);
 S.rotateWorld(lower,new T.Quaternion().setFromAxisAngle(axis,angle));
 S.rotateWorld(hand,thumbRotation(h,side,forward,up));
}
export function lockCaptain(S,v,h){
 if(h.r8Baked)return;h.reset();v.wheelPivot.rotation.z=0;h.root.position.z=3.64;h.root.updateWorldMatrix(true,true);v.root.updateWorldMatrix(true,true);
 const c=v.wheelPivot.getWorldPosition(V()),right=v.wheelPivot.localToWorld(V(1,0,0)).sub(c).normalize(),up=v.wheelPivot.localToWorld(V(0,1,0)).sub(c).normalize();
 let toward=v.wheelPivot.localToWorld(V(0,0,1)).sub(c).normalize();if(h.root.getWorldPosition(V()).sub(c).dot(toward)<0)toward.negate();
 for(const side of ['L','R']){
  const shoulder=world(h,'UpperArm_'+side),sign=shoulder.clone().sub(c).dot(right)>=0?1:-1;
  const inward=right.clone().multiplyScalar(-sign),forward=toward.clone().negate();
  // Palm rests OUTSIDE the hoop. Fingers travel away from the driver and
  // curl inward around the tube; both thumbs point up along the hoop.
  const center=c.clone().addScaledVector(right,sign*(.37+.032)).addScaledVector(toward,.014);
  const pole=shoulder.clone().addScaledVector(right,sign*.18).addScaledVector(up,-.34).addScaledVector(toward,.12);
  let wrist=center.clone().addScaledVector(forward,-.045);
  for(let pass=0;pass<4;pass++){
   h.ik(side,wrist,pole);neutralWheelHand(S,h,side,forward,up);wrist.add(center.clone().sub(palmCenter(h,side)));
  }
  h.ik(side,wrist,pole);neutralWheelHand(S,h,side,forward,up);
  // One constant flexion axis per digit. Recomputing along.cross(palm)
  // at each phalanx reverses flexion after 90 degrees and opens the grip.
  const flex=forward.clone().cross(inward).normalize();
  for(const finger of ['Index','Middle','Ring','Pinky'])for(let j=1;j<=3;j++){
   const angle=[0,70,50,30][j]*Math.PI/180;
   S.rotateWorld(h.bones[finger+j+'_'+side],new T.Quaternion().setFromAxisAngle(flex,angle));
  }
  // Thumb opposition is on the driver's side, not backwards through spokes.
  const tip=c.clone().addScaledVector(right,sign*.365).addScaledVector(toward,.033).addScaledVector(up,.045);
  for(let j=1;j<=2;j++){
   const b=h.bones['Thumb'+j+'_'+side],next=h.bones['Thumb'+(j+1)+'_'+side],o=b.getWorldPosition(V());
   S.rotateWorld(b,new T.Quaternion().setFromUnitVectors(next.getWorldPosition(V()).sub(o).normalize(),tip.clone().sub(o).normalize()));
  }
 }
 bakeCharacter(h,true);
}
function feetStraight(S,h){for(const side of ['L','R']){const foot=h.bones['Foot_'+side],toe=h.bones['Toes_'+side],a=toe.getWorldPosition(V()).sub(foot.getWorldPosition(V())).normalize(),d=h.local(V(0,-1,0)).sub(h.local(V())).normalize();S.rotateWorld(foot,new T.Quaternion().setFromUnitVectors(a,d));}}
export function lockBoardRider(S,h){
 if(h.r8Baked)return;h.reset();feetStraight(S,h);
 // Place the pelvis at the board tail so the moving legs are in WATER,
 // not kicking through the wooden deck. Upper body remains supported.
 const hipZ=(world(h,'Thigh_L').z+world(h,'Thigh_R').z)/2,shift=-1.14-hipZ;
 h.root.position.z+=shift;h.root.updateWorldMatrix(true,true);
 S.rotateWorld(h.bones.Neck,new T.Quaternion().setFromAxisAngle(V(1,0,0),-.22));S.rotateWorld(h.bones.Head,new T.Quaternion().setFromAxisAngle(V(1,0,0),-.25));
 for(const side of ['L','R']){let shoulder=world(h,'UpperArm_'+side),sign=shoulder.x>=0?1:-1;poseHand(S,h,side,V(sign*.205,.130,.62+shift),V(0,0,1),V(0,-1,0),V(sign*.55,.34,.10+shift),0);}
 // Keep the authored skinned legs, while locking EVERY upper-body joint.
 // This retains the R8 supported palms but permits only slow flutter kicks.
 const moving=new Set(['Thigh_L','Thigh_R','Shin_L','Shin_R','Foot_L','Foot_R','Toes_L','Toes_R']);
 h.r9LegRest={};h.root.updateMatrixWorld(true);
 h.root.traverse(o=>{if(o.isBone){o.updateMatrix();o.matrixAutoUpdate=moving.has(o.name);if(moving.has(o.name))h.r9LegRest[o.name]=o.quaternion.clone();}});
 h.reset=()=>{};h.ik=()=>0;h.grasp=()=>{};h.r8Baked=true;
 // Author the neutral kick from actual joint lengths: ankle at the waterline,
 // so small slow strokes visibly enter/leave water instead of disappearing.
 h.r9LegAngles={};const axis=h.local(V(1,0,0)).sub(h.local(V())).normalize();
 for(const side of ['L','R']){
  let lo=.02,hi=.85;
  for(let j=0;j<18;j++){
   for(const [name,q] of Object.entries(h.r9LegRest))h.bones[name].quaternion.copy(q);
   h.root.updateWorldMatrix(true,true);const theta=(lo+hi)/2;
   S.rotateWorld(h.bones['Thigh_'+side],new T.Quaternion().setFromAxisAngle(axis,-theta));
   S.rotateWorld(h.bones['Shin_'+side],new T.Quaternion().setFromAxisAngle(axis,.10));
   if(world(h,'Foot_'+side).y>0)lo=theta;else hi=theta;
  }
  h.r9LegAngles[side]=(lo+hi)/2;
 }
 for(const [name,q] of Object.entries(h.r9LegRest))h.bones[name].quaternion.copy(q);
 h.root.updateWorldMatrix(true,true);
}
export function slowBoardLegs(S,h,t){
 if(!h.r9LegRest)return;
 for(const [name,q] of Object.entries(h.r9LegRest))h.bones[name].quaternion.copy(q);
 h.root.updateWorldMatrix(true,true);
 const axis=h.local(V(1,0,0)).sub(h.local(V())).normalize();
 for(const side of ['L','R']){
  const phase=2*Math.PI*.25*t+(side==='L'?0:Math.PI);
  S.rotateWorld(h.bones['Thigh_'+side],new T.Quaternion().setFromAxisAngle(axis,-h.r9LegAngles[side]+.065*Math.sin(phase)));
  S.rotateWorld(h.bones['Shin_'+side],new T.Quaternion().setFromAxisAngle(axis,.10+.025*Math.sin(phase-.5)));
  S.rotateWorld(h.bones['Foot_'+side],new T.Quaternion().setFromAxisAngle(axis,.035*Math.sin(phase-.8)));
 }
}
export function lockSwimmer(S,h){
 if(h.r8Baked)return;h.reset();feetStraight(S,h);h.root.updateWorldMatrix(true,true);const origin=h.local(V()),lateral=h.local(V(1,0,0)).sub(origin).normalize(),forward=h.local(V(0,1,0)).sub(origin).normalize(),normal=h.local(V(0,0,1)).sub(origin).normalize();
 for(const side of ['L','R']){let shoulder=world(h,'UpperArm_'+side),sign=shoulder.clone().sub(origin).dot(lateral)>=0?1:-1;poseHand(S,h,side,h.local(V(sign*.14,1.84,.10)),forward,normal,h.local(V(sign*.38,1.58,.15)),0);}
 bakeCharacter(h);
}
