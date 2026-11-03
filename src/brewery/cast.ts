// Brewery workers drawn with the upstream toon.ts Pen/bodyFront/bodySide and lit by upstream cardshade.ts.
import * as THREE from 'three';
import {Pen, bodyFront, bodySide, Outfit, Expr, INK, fxContact} from '../engine/toon';
import {cardShade, blobMaterial, CARD_K} from '../engine/cardshade';
import {NOINK} from '../engine/ink';
import {FPS, smooth} from './edit';

const SU = 0.00216;
const BODY = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
BODY.translate(0, (975 - 500) * SU, 0);
const blank = (() => { const c = document.createElement('canvas'); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();

type Entry = {cv: HTMLCanvasElement; tex: THREE.CanvasTexture};
class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  draw(key: string, paint: (p: Pen) => void) {
    let e = this.live.get(key);
    if (!e) {
      e = this.free.pop();
      if (!e) {
        const cv = document.createElement('canvas'); cv.width = 600; cv.height = 1000;
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
        e = {cv, tex};
      }
      const g = e.cv.getContext('2d')!;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 600, 1000);
      paint(new Pen(g)); e.tex.needsUpdate = true; this.live.set(key, e);
    }
    return e.tex;
  }
  keep(keys: Set<string>) {
    for (const [k, e] of this.live) if (!keys.has(k)) { this.live.delete(k); this.free.push(e); }
    while (this.free.length > 12) this.free.pop()!.tex.dispose();
  }
}

const WORKER: Outfit = {jacket: '#d9c9a8', pants: '#3d4440', boots: INK, hat: null, hair: '#4a3020', build: 'stout', belt: '#6b4a32'};
const FOREMAN: Outfit = {...WORKER, jacket: '#6b4a32', build: 'adult', moustache: '#4a3020'};

class Worker {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial;
  constructor(parent: THREE.Object3D, public x: number, public z: number, public side: boolean, public o: Outfit, public seed: number, public scale = 1) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({map: blank, alphaTest: 0.5, side: THREE.DoubleSide}));
    this.dmat = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide});
    this.mesh = new THREE.Mesh(BODY, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.rotation.order = 'YXZ'; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    this.mesh.position.set(x, 0.22, z); this.mesh.scale.setScalar(scale);
    this.mesh.onBeforeRender = (r) => {const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920;};
    parent.add(this.mesh);
  }
  update(pool: Pool, f: number, cam: THREE.Camera, keys: Set<string>) {
    const t = f / FPS, alarm = smooth((t - 1.05) / 0.5);
    const expr: Expr = alarm > 0.55 ? 'shock' : alarm > 0.1 ? 'nervous' : 'neutral';
    const blink = Math.floor(t * 10 + this.seed) % 37 === 0 ? 1 : 0;
    const key = `w${this.seed}|${this.side ? 's' : 'f'}|${expr}|${blink}|${Math.round(alarm * 4)}`;
    keys.add(key);
    const tex = pool.draw(key, (p) => {
      if (this.side) bodySide(p, this.o, {mode: 'stand', expr, blink, seed: this.seed, light: -0.9});
      else bodyFront(p, this.o, {mode: 'stand', expr, blink, seed: this.seed, light: -0.9, look: alarm > 0.4 ? -1 : 0, headTilt: -6 * alarm, prop: this.seed === 1 ? ['hammer', 0.2] : null});
    });
    this.mat.map = tex; this.dmat.map = tex;
    this.mesh.rotation.y = Math.atan2(cam.position.x - this.x, cam.position.z - this.z);
    this.mesh.position.y = 0.22 + 0.012 * Math.sin(t * 2 + this.seed);
  }
}

export class BreweryCast {
  root = new THREE.Group();
  private pool = new Pool();
  private workers: Worker[];
  private blobs: THREE.Mesh[] = [];
  constructor() {
    this.workers = [
      new Worker(this.root, -2.7, 4.1, false, FOREMAN, 1, 1.0),
      new Worker(this.root, 3.0, 3.4, true, WORKER, 2, 0.96),
      new Worker(this.root, -4.6, -0.8, false, WORKER, 3, 0.9),
    ];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    fxContact(new Pen(c.getContext('2d')!), '#8a7a72');
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    for (const w of this.workers) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), blobMaterial(tex));
      m.rotation.x = -Math.PI / 2; m.position.set(w.x, 0.235, w.z); m.renderOrder = 0; m.layers.set(NOINK);
      this.root.add(m); this.blobs.push(m);
    }
  }
  update(f: number, cam: THREE.Camera) {
    const keys = new Set<string>();
    for (const w of this.workers) w.update(this.pool, f, cam, keys);
    this.pool.keep(keys);
  }
}
