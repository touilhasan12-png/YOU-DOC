// Movie production is permitted only on GitHub Actions. No preview or analysis outputs.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {spawn} from 'node:child_process';import {once} from 'node:events';
import {chromium} from '../three_engine/node_modules/playwright/index.mjs';
if(process.env.GITHUB_ACTIONS!=='true')throw Error('GitHub-only rendering');
const worker=Number(process.argv[2]),root=path.resolve('ENGINE_SOURCE/r11'),q=JSON.parse(fs.readFileSync(path.join(root,'REQUEST.json'))),out=path.resolve('R11_UNITS');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let url=decodeURIComponent(req.url.split('?')[0]),f=path.resolve(root,'.'+(url==='/'?'/index.html':url));if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res)});server.listen(0,'0.0.0.0');await once(server,'listening');
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.on('pageerror',e=>{console.error('PAGE ERROR',e.message)});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.R11ready===true,null,{timeout:120000});await page.evaluate(()=>document.fonts.ready);
 const coverage=await page.evaluate(()=>window.coverage());for(const s of q.shots.filter(r=>r.mode==='authored_vector'))if(!coverage.includes(s.key))throw Error('Unauthored scene: '+s.key);
 for(const row of q.shots.filter(r=>r.mode==='authored_vector'&&r.worker===worker)){
  await page.evaluate(r=>window.configure(r),row);const file=path.join(out,String(row.id).padStart(3,'0')+'.mp4');
  const ff=spawn(process.env.FFMPEG_EXE,['-y','-v','error','-f','image2pipe','-framerate','24','-c:v','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-frames:v',String(row.frames),file],{stdio:['pipe','inherit','inherit']});let failed;ff.stdin.on('error',e=>failed=e);const exit=once(ff,'exit');
  for(let n=0;n<row.frames;n++){await page.evaluate(({t,g})=>window.draw(t,g),{t:n/24,g:row.start+n/24});const jpg=await page.screenshot({type:'jpeg',quality:95,animations:'disabled'});if(failed)throw failed;if(!ff.stdin.write(jpg))await once(ff.stdin,'drain');}
  ff.stdin.end();const[code]=await exit;if(code!==0)throw Error('Native encoder failed '+row.key);console.log('PRODUCED',row.id,row.key,row.frames,'frames',flush());
 }
 if(worker===0){for(const row of q.shots.filter(r=>r.mode==='R9_3D')){await page.evaluate(r=>window.configure(r),row);await page.evaluate(()=>window.drawOverlay());await page.screenshot({path:path.join(out,'overlay_'+row.key+'.png'),type:'png',omitBackground:true});console.log('TYPE OVERLAY',row.key);}}
}finally{await browser.close();server.close();}
function flush(){return ''}
