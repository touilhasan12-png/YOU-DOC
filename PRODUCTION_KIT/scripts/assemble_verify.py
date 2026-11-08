"""GitHub-only test assembly, full decode, temporal QA and audio alignment checks."""
from pathlib import Path
import os,subprocess,json,hashlib,wave,re
assert os.environ.get('GITHUB_ACTIONS')=='true'
import imageio_ffmpeg
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageStat
R=Path(__file__).resolve().parents[1];F=imageio_ffmpeg.get_ffmpeg_exe();G=R/'generated';D=G/'delivery';D.mkdir(exist_ok=True);Q=G/'review';Q.mkdir(exist_ok=True)
def call(a,**kw):return subprocess.run([F,'-y','-v','error',*map(str,a)],check=True,**kw)
units=[G/'units'/f'{i:02}.mp4'for i in range(1,5)];listing=G/'concat.txt';listing.write_text(''.join("file '"+str(p)+"'\n"for p in units));movie=D/'OPENING_TEST_1080p.mp4'
call(['-f','concat','-safe','0','-i',listing,'-i',G/'TEST_NARRATION.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t','60','-video_track_timescale','12288','-movflags','+faststart',movie])
# Fully decode all video and audio; packet metadata alone is insufficient.
call(['-i',movie,'-f','null','-'])
hashes=G/'frames.md5';call(['-i',movie,'-map','0:v:0','-an','-fps_mode','passthrough','-f','framemd5',hashes]);frames=[x for x in hashes.read_text().splitlines()if x and not x.startswith('#')];assert len(frames)==1440
info=subprocess.check_output([F,'-hide_banner','-i',str(movie)],stderr=subprocess.STDOUT,text=True)if False else subprocess.run([F,'-hide_banner','-i',str(movie)],capture_output=True,text=True).stderr
assert '1920x1080'in info and '24 fps'in info and '48000 Hz'in info
pcm=subprocess.check_output([F,'-v','error','-i',str(movie),'-map','0:a:0','-t','60','-ac','2','-ar','48000','-f','s16le','pipe:1']);assert len(pcm)>=60*48000*4-4096
with wave.open(str(G/'TEST_NARRATION.wav'))as w:assert w.getnframes()==2880000 and w.getframerate()==48000
# Compare encoded audio waveform to planned source, allowing codec error but no desync.
import array,math
with wave.open(str(G/'TEST_NARRATION.wav'))as w:a=array.array('h',w.readframes(w.getnframes()))
b=array.array('h',pcm);step=24;n=min(len(a),len(b));av=a[:n:step];bv=b[:n:step];den=(sum(x*x for x in av)*sum(x*x for x in bv))**.5;corr=sum(x*y for x,y in zip(av,bv))/den if den else 0;assert corr>.95,('Audio misalignment',corr)
font=ImageFont.truetype(str(R/'fonts/DejaVuSans.ttf'),18);samples=[];sharp=[]
for i in range(1,5):
 items=[]
 for j,n in enumerate([0,45,90,135,180,225,270,315,359]):
  dest=Q/f'S{i}_{j:02}.png';call(['-ss',f'{(i-1)*15+n/24:.9f}','-i',movie,'-frames:v','1',dest]);im=Image.open(dest).convert('RGB');assert im.size==(1920,1080);edge=ImageStat.Stat(im.convert('L').filter(ImageFilter.FIND_EDGES)).mean[0];sharp.append({'scene':i,'frame':n,'edge_energy':edge});assert edge>.02,'Blank/flat frame';items.append((n,dest))
 sheet=Image.new('RGB',(1440,900),'#f3e9d5');d=ImageDraw.Draw(sheet)
 for k,(n,p)in enumerate(items):
  im=Image.open(p);im.thumbnail((480,270));x=k%3*480;y=k//3*300;sheet.paste(im,(x,y));d.text((x+8,y+274),f'Scene {i} | {n}/360',font=font,fill='#163847')
 sheet.save(Q/f'SEQUENCE_{i}.jpg',quality=95)
# All-frame repeat test within scenes; no frozen held tails substituted for motion.
scene_motion=[]
for i in range(4):
 h=[x.split(',')[-1].strip()for x in frames[i*360:(i+1)*360]];changed=sum(a!=b for a,b in zip(h,h[1:]));assert changed>300,('Insufficient animated frames',i+1,changed);scene_motion.append({'scene':i+1,'changed_adjacent_frames':changed,'total_adjacent_pairs':359})
reports=[json.loads((G/'units'/f'REPORT_{i}.json').read_text())for i in range(1,5)];assert all(not r['errors']and r['frames']==360 for r in reports)
receipt={'status':'technical_pass_visual_review_required','scene_count':4,'paragraph_count':4,'duration_seconds':60,'width':1920,'height':1080,'fps':24,'frames':1440,'audio_source':'Original approved R9 voice excerpts in included R15 master; no synthesized voice','audio_waveform_correlation':corr,'scene_motion':scene_motion,'sharpness_metrics_are_screening_not_artistic_or_zero_blur_proof':sharp,'intentional_blur_enabled':False,'github_run':os.environ['GITHUB_RUN_ID'],'source_commit':os.environ['GITHUB_SHA'],'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'bytes':movie.stat().st_size,'continuous_human_playback_claimed':False,'automatic_visual_acceptance':False}
(D/'TECHNICAL_VERIFICATION.json').write_text(json.dumps(receipt,indent=2));(Q/'TECHNICAL_VERIFICATION.json').write_text(json.dumps(receipt,indent=2))
import shutil
for name in ['TEST_NARRATION.wav','TEST_WORDS.json','English.srt','AUDIO_EDIT_RECEIPT.json']:shutil.copyfile(G/name,D/name)
shutil.copyfile(R/'SPEC.json',D/'SPEC.json');print('FULL TEST DECODE PASSED: 1440 pictures, 60 seconds, synced original-voice excerpts. Visual judgement still required.')
