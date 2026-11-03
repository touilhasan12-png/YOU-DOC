// Original upstream post chain at full quality: InkPass -> lens pre+main -> bloom -> Neutral tone -> grade, MSAA 4.
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode} from 'postprocessing';
import {BreweryWorld} from './world';
import {InkPass, noInkFallback} from '../engine/ink';
import {LensBlur} from '../engine/lensblur';
import {GradeEffect, GRADES, GRADE_STRENGTH} from '../engine/grade';

const makeBloom = () => {
  const b = new BloomEffect({blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6});
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920*w)/Math.max(h,1)),1920);
  return b;
};
const fwd = new THREE.Vector3();
const Inner = () => {
  const f = useCurrentFrame();
  const {camera, scene} = useThree();
  const world = useMemo(() => new BreweryWorld(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({maxCoC: 24, nearScale: 1.2}),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({mode: ToneMappingMode.NEUTRAL}),
    grade: new GradeEffect(GRADES.golden, GRADE_STRENGTH.golden),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(f, cam, scene);
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, target.clone().sub(cam.position).dot(fwd));
  fx.lens.cInf = 12;
  return <>
    <primitive object={world.root} dispose={null} />
    <EffectComposer multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  </>;
};
export const BreweryShort = () => (
  <AbsoluteFill style={{background: '#efb489'}}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false, stencil: false, powerPreference: 'high-performance', toneMappingExposure: 1.0}} camera={{fov: 40, near: 0.2, far: 1500}}>
      <Inner />
    </ThreeCanvas>
  </AbsoluteFill>
);
