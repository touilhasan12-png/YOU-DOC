import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
// Analytic water, not an AI image or stock backdrop. All shader execution is remote on Actions.
export function buildOcean({root,scene,under=true,level=0,cutaway=under,vessel=false}){
 const bg=document.createElement('canvas');bg.width=2;bg.height=1080;const c=bg.getContext('2d'),g=c.createLinearGradient(0,0,0,1080);
 if(under){g.addColorStop(0,'#619ba7');g.addColorStop(.40,'#23677c');g.addColorStop(1,'#102f49')}else{g.addColorStop(0,'#5e8eaa');g.addColorStop(.6,'#bad0d1');g.addColorStop(1,'#467f94')}
 c.fillStyle=g;c.fillRect(0,0,2,1080);scene.background=new T.CanvasTexture(bg);scene.fog=new T.Fog(under?0x225f73:0x9bbec9,under?29:70,under?95:260);
 const uniform={time:{value:0},waterLevel:{value:level},cutaway:{value:cutaway?1:0},vessel:{value:vessel?1:0},submerged:{value:under?1:0}};
 const surface=new T.Mesh(new T.PlaneGeometry(350,350,128,128).rotateX(-Math.PI/2),new T.ShaderMaterial({
  uniforms:uniform,transparent:true,depthWrite:false,side:T.DoubleSide,
  vertexShader:`uniform float time; uniform float waterLevel; varying vec3 wp; varying vec3 wn;
   void main(){vec3 p=position;float a=p.x*.65+p.z*.35+time*.65;float b=p.x*1.9-p.z*.90-time*.44;
    p.y=waterLevel+.030*sin(a)+.012*sin(b);wp=p;wn=normalize(vec3(-.0195*cos(a)-.0228*cos(b),1.,-.0105*cos(a)+.0108*cos(b)));
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float time; uniform float cutaway;uniform float vessel;uniform float submerged;varying vec3 wp;varying vec3 wn;
   float beam(float x){if(x< -5.4||x>6.1)return 0.;if(x< -4.4)return mix(1.08,1.35,smoothstep(-5.4,-4.4,x));if(x< -2.)return mix(1.35,1.55,smoothstep(-4.4,-2.,x));if(x<1.5)return mix(1.55,1.45,smoothstep(-2.,1.5,x));if(x<4.3)return mix(1.45,.87,smoothstep(1.5,4.3,x));return mix(.87,.025,smoothstep(4.3,6.1,x));}
   void main(){
    // The near half is intentionally cut away in mechanical/underwater reconstructions.
    if(cutaway>.5&&wp.z> -1.72)discard;
    float b=beam(wp.x)*.962;if(vessel>.5&&abs(wp.z)<b)discard;
    vec3 viewDir=normalize(cameraPosition-wp);float fres=pow(1.-abs(dot(wn,viewDir)),3.);
    float wave=sin(wp.x*4.2+wp.z*6.9+time*.8)+.5*sin(wp.x*11.-wp.z*9.-time*.6);
    float streak=pow(max(0.,sin(wp.x*.54+wp.z*1.9+time*.19)),20.)*.14;
    vec3 col=mix(vec3(.055,.29,.37),vec3(.38,.65,.71),.33+.30*fres+.028*wave+streak);
    float glint=pow(max(0.,dot(reflect(-normalize(vec3(-.45,1.,.65)),wn),viewDir)),72.);
    col+=vec3(.75,.83,.77)*glint*.44;
    float foam=vessel>.5?(1.-smoothstep(.025,.095,abs(abs(wp.z)-b)))*step(.001,b):0.;
    col=mix(col,vec3(.75,.84,.80),foam*.75);
    gl_FragColor=vec4(col,cutaway>.5?.88:(submerged>.5?.70:.87));
   }`
 }));surface.renderOrder=3;root.add(surface);
 if(under){
  const particles=[];for(let i=0;i<150;i++)particles.push(-26+(i*7.31)%52,level-.4-(i*.73)%15,-16+(i*3.21)%28);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(particles,3));root.add(new T.Points(geo,new T.PointsMaterial({color:0x9cc9cc,size:.015,transparent:true,opacity:.28,depthWrite:false})));
  // Restrained light columns descend from the visible surface, behind the subjects.
  for(let i=0;i<6;i++){
   const shape=new T.Shape();const x=-19+i*7;shape.moveTo(x,level);shape.lineTo(x+.48,level);shape.lineTo(x+5.0,level-17);shape.lineTo(x+2.9,level-17);shape.closePath();
   const ray=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:0xb6d7c9,transparent:true,opacity:.026,depthWrite:false,side:T.DoubleSide}));ray.position.z=-11-i*.16;root.add(ray);
  }
  if(cutaway){
   // A thin, curved waterline at the cut plane makes the cutaway legible without covering the action.
   const pts=[];for(let i=0;i<=120;i++){const x=-45+i*.75;pts.push(V(x,level+.03*Math.sin(x*.65),-1.72))}
   const edge=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),120,.014,5,false),new T.MeshBasicMaterial({color:0x9ec9cc,transparent:true,opacity:.42,depthWrite:false}));root.add(edge);
  }
 }
 return {surface,update:t=>{uniform.time.value=t}};
}
