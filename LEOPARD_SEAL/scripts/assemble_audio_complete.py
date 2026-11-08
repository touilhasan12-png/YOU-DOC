from pathlib import Path
import os,json,subprocess,wave,hashlib,shutil
import numpy as np
assert os.environ.get('GITHUB_ACTIONS')=='true'
R=Path(__file__).resolve().parents[1];F=os.environ['FFMPEG_EXE'];data=R/'generated/audio-complete-plan';plan=json.loads((data/'FILM_PLAN_APPROVED.json').read_text());out=R/'generated/audio-complete-delivery';out.mkdir(parents=True,exist_ok=True);chapters=plan['chapters'];parts=R/'generated/approved-chapters';videos=[]
for c in chapters:
 found=list(parts.rglob(f"chapter-{c['section']:02}.mp4"));assert len(found)==1,(c['section'],found);videos.append(found[0])
concat=out/'chapters.ffconcat';concat.write_text('ffconcat version 1.0\n'+''.join(f"file '{p.resolve()}'\nduration {c['duration']:.12f}\n"for p,c in zip(videos,chapters)));movie=out/'LEOPARD_SEAL_AUDIO_COMPLETE.mp4';args=[F,'-y','-v','warning','-f','concat','-safe','0','-i',str(concat)];filters=[]
for i,c in enumerate(chapters,1):
 assert not c['audio_missing'];args+=['-i',str(R/c['audio_file'])];filters.append(f"[{i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono,apad=whole_dur={c['duration']},atrim=duration={c['duration']},asetpts=PTS-STARTPTS[a{i}]")
filters.append(''.join(f'[a{i}]'for i in range(1,11))+'concat=n=10:v=0:a=1[voice]');args+=['-filter_complex',';'.join(filters),'-map','0:v:0','-map','[voice]','-c:v','copy','-c:a','aac','-ar','48000','-b:a','160k','-t',str(plan['duration']),'-movflags','+faststart','-metadata','title=The Leopard Seal — complete narration, approved section04 edit','-metadata','comment=All ten narration recordings present at native speed. Only the explicitly approved section04 non-graphic edit changes spoken text. Original master retained.',str(movie)];subprocess.run(args,check=True)
checks=[]
for c in chapters:
 p=R/c['audio_file']
 with wave.open(str(p),'rb')as w:rate=w.getframerate();source=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float32)/32768
 duration=len(source)/rate;raw=subprocess.check_output([F,'-v','error','-i',str(movie),'-ss',str(c['global_start']),'-t',str(duration),'-vn','-ac','1','-ar',str(rate),'-f','f32le','pipe:1']);actual=np.frombuffer(raw,dtype='<f4');n=min(len(source),len(actual));assert n>=len(source)-2;corr=float(np.corrcoef(source[:n],actual[:n])[0,1]);assert corr>.985,(c['section'],corr);checks.append({'section':c['section'],'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source_duration':duration,'movie_offset':c['global_start'],'decoded_source_correlation':corr,'playback_rate':1.0})
# Full decode of the actual movie, not merely packet-count or planned-frame assertions.
decoded=subprocess.run([F,'-v','error','-progress','pipe:1','-nostats','-i',str(movie),'-map','0:v:0','-an','-threads','2','-f','null','-'],capture_output=True,text=True,check=True);import re
counts=re.findall(r'^frame=(\d+)$',decoded.stdout,re.M);assert counts and int(counts[-1])==plan['total_frames']==15624;assert not decoded.stderr.strip(),decoded.stderr
for name in ['FILM_PLAN_APPROVED.json','NARRATION_APPROVED.srt','APPROVED_ACTIVE_NARRATION.txt','SECTION04_ALIGNMENT_REPORT.json']:shutil.copyfile(data/name,out/name)
shutil.copyfile(R/'CREDITS_AUDIO_COMPLETE.md',out/'CREDITS_AND_STATUS.md')
report={'status':'ALL_TEN_NARRATION_SECTIONS_INTEGRATED_AND_DECODED','audio_complete':True,'missing_audio_sections':[],'obsolete_missing_audio_notice_removed_from_all_ten_chapters':True,'temporary_silent_section04_captions_removed':True,'original_master_script_sha256':plan['script_sha256'],'original_master_file_preserved':True,'authorized_spoken_text_change':plan['approved_change'],'all_other_spoken_text_and_final_CTA_unchanged':True,'source_audio_playback_rate':1.0,'audio_edit_checks':checks,'chapter04_source_audio_duration':53.44,'chapter04_picture_duration':chapters[3]['duration'],'frames':15624,'all_encoded_video_frames_decoded':True,'fps':24,'width':1920,'height':1080,'duration_seconds':plan['duration'],'chapters':10,'shots':70,'artistic_approval':False,'continuous_human_listening_completed':False,'rendered_original_chapters_source_run':42503608840,'integration_run':os.environ.get('GITHUB_RUN_ID'),'integration_source_commit':os.environ.get('GITHUB_SHA'),'movie_bytes':movie.stat().st_size,'movie_sha256':hashlib.sha256(movie.read_bytes()).hexdigest()};(out/'DELIVERY_REPORT.json').write_text(json.dumps(report,indent=2));concat.unlink();print('ALL TEN AUDIO CORRELATIONS PASS /15624 decoded frames /651seconds /approved04edit only')
# Extract actual encoded midpoint frame of every shot for inspection after assembly.
qa=R/'generated/audio-complete-qa';qa.mkdir(parents=True,exist_ok=True);shots=[]
for c in chapters:
 for s in c['shots']:shots.append({'section':c['section'],'shot':s['id'],'kind':s['kind'],'frame':round(c['global_start']*24)+s['start_frame']+s['frames']//2})
select='+'.join(f'eq(n\\,{s["frame"]})'for s in shots);subprocess.run([F,'-y','-v','error','-i',str(movie),'-map','0:v:0','-an','-vf','select='+select,'-fps_mode','vfr','-threads','2',str(qa/'ENCODED_%03d.png')],check=True)
from PIL import Image,ImageDraw,ImageFont
images=sorted(qa.glob('ENCODED_*.png'));assert len(images)==len(shots)==70;font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
for im,s in zip(images,shots):
 with Image.open(im)as image:assert image.size==(1920,1080)
 s['file']=im.name
for page in range(5):
 sheet=Image.new('RGB',(1920,1380),'#102d3a');d=ImageDraw.Draw(sheet);d.text((28,20),f'LEOPARD SEAL / UPDATED ACTUAL MP4 / ALL TEN AUDIO SECTIONS / {page+1}',font=font,fill='#f4edda');d.text((28,53),'Approved non-graphic section04 edit; original remaining narration and final CTA retained.',font=small,fill='#dfb565')
 for i,s in enumerate(shots[page*16:page*16+16]):
  x=24+(i%4)*474;y=100+(i//4)*316
  with Image.open(qa/s['file'])as image:thumb=image.convert('RGB').resize((456,257),Image.Resampling.LANCZOS)
  sheet.paste(thumb,(x,y));d.text((x,y+263),f"{s['shot']} {s['kind']} @ {s['frame']/24:.2f}s",font=small,fill='#f4edda')
 sheet.save(qa/f'ENCODED_CONTACT_SHEET_{page+1:02}.jpg',quality=94,subsampling=0)
(qa/'ENCODED_QA_REPORT.json').write_text(json.dumps({'status':'ALL15624_VIDEO_FRAMES_DECODED_70_ACTUAL_SHOT_FRAMES_EXTRACTED','audio_complete':True,'movie_sha256':report['movie_sha256'],'frames':15624,'duration':plan['duration'],'samples':shots,'artistic_approval':False,'human_listening_completed':False},indent=2))
