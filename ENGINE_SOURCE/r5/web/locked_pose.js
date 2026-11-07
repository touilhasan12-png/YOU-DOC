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
function bakeCharacter(h){
 h.root.updateWorldMatrix(true,false);h.root.updateMatrixWorld(true);const skins=[];h.root.traverse(o=>{if(o.isSkinnedMesh)skins.push(o)});
 for(const skin of skins){skin.updateMatrixWorld(true);if(skin.bindMode==='attached')skin.bindMatrixInverse.copy(skin.matrixWorld).invert();skin.skeleton.update();const g=skin.geometry.clone(),p=g.attributes.position,v=V();for(let i=0;i<p.count;i++){skin.applyBoneTransform(i,v.fromBufferAttribute(p,i));p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;g.deleteAttribute('skinIndex');g.deleteAttribute('skinWeight');g.computeVertexNormals();g.computeBoundingSphere();const fixed=new T.Mesh(g,skin.material);fixed.name='R8_FIXED_'+skin.name;fixed.position.copy(skin.position);fixed.quaternion.copy(skin.quaternion);fixed.scale.copy(skin.scale);fixed.castShadow=skin.castShadow;fixed.receiveShadow=skin.receiveShadow;fixed.frustumCulled=false;skin.parent.add(fixed);skin.parent.remove(skin);}
 h.root.traverse(o=>{if(o.isBone){o.updateMatrix();o.matrixAutoUpdate=false;}});
 // Future legacy calls cannot undo the fixed pose. Root-only travel is still allowed.
 h.reset=()=>{};h.ik=()=>0;h.grasp=()=>{};h.r8Baked=true;h.r8BakedMeshCount=skins.length;
}
export function lockCaptain(S,v,h){
 if(h.r8Baked)return;h.reset();v.wheelPivot.rotation.z=0;h.root.position.z=3.56;h.root.updateWorldMatrix(true,true);v.root.updateWorldMatrix(true,true);
 const c=v.wheelPivot.getWorldPosition(V()),right=v.wheelPivot.localToWorld(V(1,0,0)).sub(c).normalize(),up=v.wheelPivot.localToWorld(V(0,1,0)).sub(c).normalize(),toward=v.wheelPivot.localToWorld(V(0,0,1)).sub(c).normalize();if(h.root.getWorldPosition(V()).sub(c).dot(toward)<0)toward.negate();
 for(const side of ['L','R']){let shoulder=world(h,'UpperArm_'+side),sign=shoulder.clone().sub(c).dot(right)>=0?1:-1,center=c.clone().addScaledVector(right,sign*.37).addScaledVector(toward,.033),forward=right.clone().multiplyScalar(-sign),normal=toward.clone().negate(),pole=shoulder.clone().addScaledVector(right,sign*.22).addScaledVector(up,-.28).addScaledVector(toward,.08);poseHand(S,h,side,center,forward,normal,pole,1);}
 bakeCharacter(h);
}
function feetStraight(S,h){for(const side of ['L','R']){const foot=h.bones['Foot_'+side],toe=h.bones['Toes_'+side],a=toe.getWorldPosition(V()).sub(foot.getWorldPosition(V())).normalize(),d=h.local(V(0,-1,0)).sub(h.local(V())).normalize();S.rotateWorld(foot,new T.Quaternion().setFromUnitVectors(a,d));}}
export function lockBoardRider(S,h){
 if(h.r8Baked)return;h.reset();feetStraight(S,h);S.rotateWorld(h.bones.Neck,new T.Quaternion().setFromAxisAngle(V(1,0,0),-.22));S.rotateWorld(h.bones.Head,new T.Quaternion().setFromAxisAngle(V(1,0,0),-.25));h.root.updateWorldMatrix(true,true);
 for(const side of ['L','R']){let shoulder=world(h,'UpperArm_'+side),sign=shoulder.x>=0?1:-1;poseHand(S,h,side,V(sign*.205,.130,.62),V(0,0,1),V(0,-1,0),V(sign*.55,.34,.10),0);}
 bakeCharacter(h);
}
export function lockSwimmer(S,h){
 if(h.r8Baked)return;h.reset();feetStraight(S,h);h.root.updateWorldMatrix(true,true);const origin=h.local(V()),lateral=h.local(V(1,0,0)).sub(origin).normalize(),forward=h.local(V(0,1,0)).sub(origin).normalize(),normal=h.local(V(0,0,1)).sub(origin).normalize();
 for(const side of ['L','R']){let shoulder=world(h,'UpperArm_'+side),sign=shoulder.clone().sub(origin).dot(lateral)>=0?1:-1;poseHand(S,h,side,h.local(V(sign*.14,1.84,.10)),forward,normal,h.local(V(sign*.38,1.58,.15)),0);}
 bakeCharacter(h);
}
