import * as THREE from 'three';
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(1280,720);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-8,8,4.5,-4.5,.1,100);camera.position.z=10;
new THREE.TextureLoader().load('/prototype/hangar.png',t=>{t.colorSpace=THREE.SRGBColorSpace;scene.background=t;(window as any).sceneReady=true;});
const c=document.createElement('canvas'); c.width=600;c.height=900;const g=c.getContext('2d')!; const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
const figure=new THREE.Mesh(new THREE.PlaneGeometry(4.2,6.3),new THREE.MeshBasicMaterial({map:tex,transparent:true}));figure.position.set(-4.3,-.55,0);scene.add(figure);
function draw(t:number){g.clearRect(0,0,600,900);g.lineJoin='round';g.lineCap='round';g.strokeStyle='#211c22';g.lineWidth=15;
const line=(x:number,y:number,a:number,b:number)=>{g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.stroke()};
// Thin stick limbs
line(250,690,215+Math.sin(t*2)*9,850);line(345,690,365-Math.sin(t*2)*9,850);line(215,850,189,858);line(365,850,392,858);
line(193,465,150,555);line(150,555,188,610);line(398,470,448,525+Math.sin(t*2)*12);line(448,525+Math.sin(t*2)*12,493,495+Math.sin(t*2)*20);
// jacket silhouette
g.fillStyle='#1aaf9c';g.beginPath();g.moveTo(206,430);g.quadraticCurveTo(173,455,181,665);g.quadraticCurveTo(292,738,407,665);g.quadraticCurveTo(415,470,379,430);g.closePath();g.fill();g.stroke();
g.fillStyle='#252329';g.fillRect(224,456,20,232);g.fillRect(344,456,20,232);g.fillStyle='#e9e4d2';for(const y of [525,580,635]){g.beginPath();g.arc(294,y,8,0,7);g.fill();g.stroke();}
g.fillStyle='#c54a3f';g.beginPath();g.moveTo(270,447);g.lineTo(322,447);g.lineTo(296,495);g.closePath();g.fill();g.stroke();
// white round face
g.fillStyle='#fffdfa';g.beginPath();g.ellipse(294,293,151,141,0,0,Math.PI*2);g.fill();g.stroke();
// hair and cap
g.fillStyle='#604638';g.beginPath();g.moveTo(155,283);g.quadraticCurveTo(133,210,188,185);g.lineTo(206,204);g.lineTo(184,291);g.closePath();g.fill();g.stroke();
g.fillStyle='#344e68';g.beginPath();g.ellipse(294,171,157,55,0,Math.PI,Math.PI*2);g.lineTo(451,179);g.quadraticCurveTo(292,206,138,179);g.closePath();g.fill();g.stroke();
g.strokeStyle='#dbe9e7';g.lineWidth=6;for(let x=190;x<415;x+=32){g.beginPath();g.moveTo(x,177);g.lineTo(270+(x-270)*.35,123);g.stroke();}g.strokeStyle='#211c22';g.lineWidth=12;g.beginPath();g.ellipse(294,180,157,20,0,0,Math.PI);g.stroke();
// eyebrows and expression
line(219,265,259,260);line(327,260,368,265);g.fillStyle='#211c22';g.beginPath();g.ellipse(240,291,11,16,0,0,7);g.ellipse(347,291,11,16,0,0,7);g.fill();g.beginPath();g.ellipse(294,340,25,5+Math.abs(Math.sin(t*3))*8,0,0,7);g.fill();tex.needsUpdate=true;}
function frame(t:number){draw(t);figure.rotation.z=Math.sin(t*1.2)*.012;renderer.render(scene,camera)}
(window as any).renderFrame=(t:number)=>frame(t);
if(!new URLSearchParams(location.search).has('render')){function loop(ms:number){frame(ms/1000);requestAnimationFrame(loop)}requestAnimationFrame(loop);}
