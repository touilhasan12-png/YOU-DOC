// New subject, same visual engine: upstream paint/build/toon/shade/cardshade/ink/lens/grade/lights.
// A brewery courtyard in London, 1814. The benchmark shows an iron hoop slipping while workers look up.
import * as THREE from 'three';
import {Batch, V, boxGeo, lam, house, quad} from '../engine/build';
import {rep, brick, planksHD, cobbleHD, stoneHD, cloudHD, ctex, roofHD} from '../engine/paint';
import {Pen} from '../engine/toon';
import {LIGHTS, LOOK} from '../engine/lights';
import {TONE, CHAR, untone} from '../engine/shade';
import {NOINK} from '../engine/ink';
import {BreweryCast} from './cast';
import {FPS, smooth} from './edit';

const GROUND = 0.22;
const skyMaterial = () => new THREE.ShaderMaterial({
  uniforms: {c0: {value: new THREE.Color()}, c1: {value: new THREE.Color()}, c2: {value: new THREE.Color()}, c3: {value: new THREE.Color()}, c4: {value: new THREE.Color()}, e: {value: new THREE.Vector4()}},
  vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform vec3 c0,c1,c2,c3,c4; uniform vec4 e; varying vec3 vP;
    void main(){ float el=asin(clamp(normalize(vP).y,-1.0,1.0));
      vec3 c=mix(c0,c1,smoothstep(0.0,e.x,el)); c=mix(c,c2,smoothstep(e.x,e.y,el));
      c=mix(c,c3,smoothstep(e.y,e.z,el)); c=mix(c,c4,smoothstep(e.z,e.w,el)); gl_FragColor=vec4(c,1.0); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const smokeTex = () => ctex('brewery-smoke', 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x,y,r,c] of [[90,150,60,'#8f8d96'],[150,120,70,'#a3a1aa'],[170,165,55,'#8f8d96'],[120,100,50,'#b4b2ba']] as const) p.ell(x,y,r,r*0.85,c,0);
});

export class BreweryWorld {
  root = new THREE.Group();
  private cast = new BreweryCast();
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat = skyMaterial();
  private fog = new THREE.Fog('#efb489', 50, 380);
  private clouds: THREE.Mesh[] = []; private cloudMaps: THREE.Texture[];
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private vat = new THREE.Group(); private staves: THREE.Mesh[] = []; private looseHoop!: THREE.Mesh;
  private smoke: THREE.Mesh[] = [];
  private sunDir = new THREE.Vector3();

  constructor() {
    const R = this.root, b = new Batch();
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight('#d8b0b8', '#8a6a60', 0.5);
    this.sun = new THREE.DirectionalLight('#ffab5e', 5.5); this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.DirectionalLight('#9fb8ff', 0); R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = [0,1,2,3].map(k => cloudHD(k, LOOK.golden.cloud));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4, d = 600 + (i % 3) * 55;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1,1), new THREE.MeshBasicMaterial({map: this.cloudMaps[i % 4], color: new THREE.Color(1.1,1.1,1.1), transparent: true, depthWrite: false, fog: false}));
      const w = 120 + (i % 4) * 28;
      m.position.set(Math.cos(a)*d, 115 + (i%4)*34, Math.sin(a)*d); m.scale.set(w,w/2,1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({color: new THREE.Color(6.0,4.4,2.4), fog: false, depthWrite: false}));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({color: new THREE.Color('#ffcf9e'), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.35}));
    for (const s of [this.sunDisc, this.sunHalo]) { s.frustumCulled = false; s.layers.set(NOINK); R.add(s); }

    // Courtyard and Georgian brewery frontage, built from the original painted-texture houses.
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(160,160), lam('brewery-cobble', () => ({map: rep(cobbleHD(), 40, 40)})));
    ground.rotation.x = -Math.PI/2; ground.position.y = GROUND; ground.receiveShadow = true; R.add(ground);
    house(b, 0, -15, 0, 27, 9, 9.5, 6, GROUND);
    house(b, -17, -5, Math.PI/2, 10, 8, 8.4, 1, GROUND);
    house(b, 17, -5, -Math.PI/2, 10, 8, 8.4, 3, GROUND);
    house(b, -28, -20, 0, 9, 8, 9.8, 2, GROUND);
    house(b, 28, -20, 0, 9, 8, 9.8, 4, GROUND);
    const brickM = lam('brewery-brick', () => ({map: rep(brick(), 3, 6)}));
    b.add(boxGeo(V(-13.5,GROUND,-10.6), V(13.5,GROUND+8.8,-9.4), 3), brickM);
    b.add(boxGeo(V(-14,GROUND+8.8,-10.9), V(14,GROUND+9.2,-9.1), 2), lam('brewery-cop', () => ({map: stoneHD('brewery-cop')})));
    // Arched loading door and a painted brewery sign board (physical sign, not a caption).
    b.add(boxGeo(V(-2.2,GROUND,-9.35), V(2.2,GROUND+4.6,-9.2), 2), lam('brewery-door', () => ({map: rep(planksHD(), 1, 2), color: '#5a3b2a'})));
    const signTex = ctex('brewery-sign', 1024, 256, (g) => {
      g.fillStyle = '#2f3a33'; g.fillRect(0,0,1024,256); g.strokeStyle = '#d1aa5c'; g.lineWidth = 14; g.strokeRect(12,12,1000,232);
      g.fillStyle = '#efe3c8'; g.font = 'bold 74px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HORSE SHOE BREWERY', 512, 128);
    });
    b.add(quad(V(-5.5,GROUND+6.2,-9.15), V(5.5,GROUND+6.2,-9.15), V(5.5,GROUND+7.6,-9.15), V(-5.5,GROUND+7.6,-9.15)), lam('brewery-sign', () => ({map: signTex})));
    // Chimney + smoke.
    b.add(new THREE.CylinderGeometry(1.1,1.5,16,16), brickM, new THREE.Matrix4().makeTranslation(-10,GROUND+8,-13));
    const sm = smokeTex();
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1,1), new THREE.MeshLambertMaterial({map: sm, transparent: true, depthWrite: false, opacity: 0.5}));
      m.layers.set(NOINK); this.smoke.push(m); R.add(m);
    }
    // Barrels and crates frame the yard without blocking the vat.
    const barrelWood = lam('barrel-wood', () => ({map: rep(planksHD(), 1, 1), color: '#a8724a'}));
    const iron = lam('brewery-iron', () => ({color: '#5a606c'}));
    for (const [x,z,s] of [[-7,3,1],[-7.9,2.2,0.85],[7.2,2.6,1],[8.1,1.8,0.8],[-6,-4,0.9],[6.4,-4.2,0.9]] as const) {
      b.add(new THREE.CylinderGeometry(0.62*s,0.62*s,1.15*s,18), barrelWood, new THREE.Matrix4().makeTranslation(x,GROUND+0.575*s,z));
      for (const y of [0.18,0.95]) b.add(new THREE.TorusGeometry(0.63*s,0.045*s,8,24), iron, new THREE.Matrix4().makeRotationX(Math.PI/2).setPosition(x,GROUND+y*s,z));
    }
    for (const [x,z] of [[-8.5,5],[8.6,4.6],[-5.8,-5.5]] as const) b.add(boxGeo(V(x-0.6,GROUND,z-0.6), V(x+0.6,GROUND+1.2,z+0.6), 1), lam('crate', () => ({map: rep(planksHD(),1,1), color: '#c49a6c'})));
    b.build(R);

    // The giant wooden fermentation vat: real staves, iron hoops, dark porter surface.
    this.vat.position.set(0,GROUND,0); R.add(this.vat);
    const woods = ['#b07a4a','#a06a3e','#c08a56'].map((c,i) => lam('vat-stave-'+i, () => ({map: rep(planksHD(),0.35,2), color: c})));
    const N = 48, RAD = 3.4, H = 7.2;
    for (let i = 0; i < N; i++) {
      const a = (i/N)*Math.PI*2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.43,H,0.18), woods[i%3]);
      m.position.set(Math.sin(a)*RAD,H/2,Math.cos(a)*RAD); m.rotation.y = a;
      m.castShadow = m.receiveShadow = true; this.vat.add(m); this.staves.push(m);
    }
    const hoopM = lam('vat-hoop', () => ({color: '#4b515e'}));
    for (let i = 0; i < 7; i++) {
      const y = 0.55 + i*1.02;
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(RAD+0.11,0.085,10,64), hoopM);
      hoop.rotation.x = Math.PI/2; hoop.position.y = y; hoop.castShadow = true; this.vat.add(hoop);
      if (i === 3) this.looseHoop = hoop;
    }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RAD+0.05,0.13,10,64), woods[1]); rim.rotation.x = Math.PI/2; rim.position.y = H; rim.castShadow = true; this.vat.add(rim);
    const porter = new THREE.Mesh(new THREE.CircleGeometry(RAD-0.05,48), lam('porter', () => ({color: '#2a160c'}))); porter.rotation.x = -Math.PI/2; porter.position.y = H-0.08; this.vat.add(porter);
    R.add(this.cast.root);
  }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, u = f / 59;
    const pos = V(10.5 - 0.8*u, 6.8 - 0.3*u, 18.5 - 1.3*u), look = V(0,3.9,0);
    cam.position.copy(pos); cam.up.set(0,1,0); cam.lookAt(look); cam.rotateZ(0.004*Math.sin(t*2.2));
    cam.fov = 40; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const L = LIGHTS.golden, K = LOOK.golden;
    // Camera-relative sun, same convention as upstream; raised slightly for courtyard readability.
    const fw = look.clone().sub(pos); const n = Math.hypot(fw.x,fw.z)||1; const fx = fw.x/n, fz = fw.z/n;
    const az = THREE.MathUtils.degToRad(35), el = THREE.MathUtils.degToRad(18);
    const hx = fx*Math.cos(az)-fz*Math.sin(az), hz = fz*Math.cos(az)+fx*Math.sin(az);
    this.sunDir.set(hx*Math.cos(el),Math.sin(el),hz*Math.cos(el)).normalize();
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    this.sun.position.copy(look).addScaledVector(this.sunDir,220); this.sun.target.position.copy(look);
    const sc = this.sun.shadow.camera; sc.left=-35; sc.right=35; sc.top=35; sc.bottom=-35; sc.near=20; sc.far=480; sc.updateProjectionMatrix();
    this.sun.shadow.bias=L.bias; this.sun.shadow.normalBias=L.normalBias*2;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value=L.lambert; TONE.uSideK.value=L.sideK; TONE.uTerm.value=L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value=K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value=L.charShade; CHAR.uGrad.value=L.charGrad; CHAR.uBodyGrad.value=L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su=this.skyMat.uniforms; K.sky.c.forEach((h,i)=>untone(h,su['c'+i].value)); const e=K.sky.e.map(d=>THREE.MathUtils.degToRad(d)); su.e.value.set(e[1],e[2],e[3],e[4]);
    this.sky.position.copy(cam.position); untone(L.fog,this.fog.color); this.fog.near=L.fogNear; this.fog.far=L.fogFar; scene.fog=this.fog; scene.background=null;
    this.sunDisc.position.copy(cam.position).addScaledVector(this.sunDir,900); this.sunDisc.scale.setScalar(2*900*Math.tan(THREE.MathUtils.degToRad(1.7)));
    this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2*900*Math.tan(THREE.MathUtils.degToRad(24)));
    for (const m of this.clouds) m.lookAt(cam.position.x,m.position.y,cam.position.z);
    for (let i=0;i<this.smoke.length;i++) { const m=this.smoke[i], q=(t*0.11+i*0.2)%1, sz=3+q*9; m.position.set(-10-q*18,GROUND+16+q*13+q*q*4,-13+q*3); m.scale.setScalar(sz); m.lookAt(cam.position); (m.material as THREE.MeshLambertMaterial).opacity=0.5*(1-q); }
    // Hoop slips at ~1.2 s; staves answer with a small elastic bulge. No burst yet: this is the hook benchmark.
    const slip = smooth((t-1.15)/0.55), shake = slip*Math.sin(f*1.3)*0.004;
    this.looseHoop.position.y = 3.61 - 0.85*slip; this.looseHoop.rotation.z = 0.13*slip; this.looseHoop.rotation.x = Math.PI/2 + 0.07*slip;
    this.vat.rotation.z = shake;
    for (let i=0;i<this.staves.length;i++) { const a=(i/this.staves.length)*Math.PI*2, bulge=slip*0.055*(1+0.35*Math.sin(a*3)); const r=3.4+bulge; this.staves[i].position.set(Math.sin(a)*r,3.6,Math.cos(a)*r); }
    this.cast.update(f,cam);
    return look;
  }
}
