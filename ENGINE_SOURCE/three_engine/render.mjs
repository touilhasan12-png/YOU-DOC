import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {spawn} from 'node:child_process';import {once} from 'node:events';import {fileURLToPath} from 'node:url';import {chromium} from 'playwright';
if(process.env.GITHUB_ACTIONS!=='true')throw Error('Rendering is exclusively on GitHub Actions');
const HERE=path.dirname(fileURLToPath(import.meta.url)),P=path.dirname(HERE),mode=process.argv[2],tasks=JSON.parse(fs.readFileSync(process.argv[3]));
const out=path.join(P,'qa/three');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(P,'picture_units'),{recursive:true});
const server=http.createServer((req,res)=>{let u=decodeURIComponent(req.url.split('?')[0]);const base=u.startsWith('/fonts/')?P:path.join(HERE,'web');const file=path.join(base,u==='/'?'index.html':u);if(!file.startsWith(base)||!fs.existsSync(file)){res.writeHead(404);res.end();return}const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.ttf':'font/ttf'})[ext]||'application/octet-stream');fs.createReadStream(file).pipe(res)});server.listen(0,'0.0.0.0');await once(server,'listening');
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.on('pageerror',e=>console.error('THREE PAGE ERROR',e.message));
await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.engineReady===true);
const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const e=gl.getExtension('WEBGL_debug_renderer_info');return {version:gl.getParameter(gl.VERSION),renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'not exposed'}});console.log('ACTUAL WEBGL CONTEXT',JSON.stringify(gpu));
try{
 for(const s of tasks){
  await page.evaluate(({key,duration})=>window.configure(key,duration),s);
  if(mode==='lookdev'){
   const frames=[];
   for(const [i,f] of [0,.18,.38,.59,.79,.995].entries()){
    const t=s.duration*f,c=await page.evaluate(t=>window.drawFrame(t),t);frames.push(c);
    fs.writeFileSync(path.join(out,s.key+`_sample_${i}.png`),await page.screenshot({type:'png',animations:'disabled'}));
   }
   fs.writeFileSync(path.join(out,s.key+'_LOOKDEV.json'),JSON.stringify({key:s.key,stage:'Art-development samples ONLY; not continuous contact verification',webgl:gpu,checks:frames},null,2));continue;
  }
  const fps=mode==='native'?24:12,N=mode==='native'?s.encoded_frames:Math.ceil(s.duration*fps),checks=[];
  const dest=mode==='native'?path.join(P,'picture_units',`unit_${String(s.id-1).padStart(3,'0')}_${s.key}.mp4`):path.join(out,s.key+'_MOTION.mp4');
  const ff=spawn(process.env.FFMPEG_EXE,['-y','-v','error','-f','image2pipe','-framerate',String(fps),'-c:v','png','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-threads','1','-pix_fmt','yuv420p','-video_track_timescale','12288','-frames:v',String(N),dest],{stdio:['pipe','inherit','inherit']});
  let pipeError=null;ff.stdin.on('error',e=>pipeError=e);
  const wanted=new Set([0,Math.round(N*.18),Math.round(N*.38),Math.round(N*.59),Math.round(N*.79),N-1]);let sample=0;
  for(let n=0;n<N;n++){
   const t=mode==='native'?(s.frame_start+n)/24-s.start:n/fps;
   const check=await page.evaluate(t=>window.drawFrame(t),t);checks.push(check);
   const failures=Object.entries(check).filter(([k,v])=>(k.includes('penetration')||k==='orca_body_intersection'||k==='simultaneous_visitors')&&v===true);
   const buf=await page.screenshot({type:'png',animations:'disabled'});
   if(wanted.has(n))fs.writeFileSync(path.join(out,s.key+`_sample_${sample++}.png`),buf);
   if(failures.length||check.maximum_hand_to_rim_error_metres>1e-6){fs.writeFileSync(path.join(out,s.key+'_FAILED.png'),buf);fs.writeFileSync(path.join(out,s.key+'_GEOMETRY.json'),JSON.stringify({key:s.key,time:t,failures,checks},null,2));ff.stdin.end();throw Error('REAL GEOMETRY FAILURE '+s.key+' at '+t+': '+JSON.stringify(failures))}
   if(pipeError)throw pipeError;if(!ff.stdin.write(buf))await once(ff.stdin,'drain');
   if(n%fps===0)console.log('WEBGL FRAME',s.key,n,'/',N,'relative',t.toFixed(3));
  }
  ff.stdin.end();const [code]=await once(ff,'exit');if(code!==0)throw Error('Native encoder failed '+code);
  fs.writeFileSync(path.join(out,s.key+'_GEOMETRY.json'),JSON.stringify({key:s.key,engine:'Three.js r170',webgl:gpu,frames:N,fps,status:'All sampled native frames passed explicit body/jaw-to-blade mesh intersection and hand-to-rim checks where applicable. This is not a subjective artistic pass.',checks},null,2));console.log('ACTUAL THREE CLIP COMPLETE',s.key,N);
 }
}finally{await browser.close();server.close()}
