import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const server=await createServer({configFile:'prototype.vite.config.ts',server:{host:'127.0.0.1',port:4174}});await server.listen();
let browser;
try{
 browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4174/prototype.html?render=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.sceneReady===true,{timeout:30000});
 mkdirSync('cloud_preview/frames',{recursive:true});
 const canvas=page.locator('canvas');
 for(let i=0;i<90;i++) {await page.evaluate(t=>window.renderFrame(t),i/30);await canvas.screenshot({path:`cloud_preview/frames/${String(i).padStart(4,'0')}.png`});if(i%30===0)console.log('Frame',i);}
 execFileSync('ffmpeg',['-y','-framerate','30','-i','cloud_preview/frames/%04d.png','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','cloud_preview/redesign-test-720p30.mp4'],{stdio:'inherit'});
 execFileSync('rm',['-rf','cloud_preview/frames']);
}finally{if(browser)await browser.close();await server.close();}
