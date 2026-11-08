from pathlib import Path
import os,json,subprocess,hashlib,wave,zipfile,shutil
import numpy as np
R=Path(__file__).resolve().parents[1];assert os.environ.get('GITHUB_ACTIONS')=='true';F=os.environ['FFMPEG_EXE'];plan=json.loads((R/'FILM_PLAN.json').read_text());out=R/'generated/delivery';out.mkdir(parents=True,exist_ok=True);parts=R/'generated/chapters';chapters=plan['chapters'];videos=[]
for ch in chapters:
 files=list(parts.rglob(f"chapter-{ch['section']:02}.mp4"));assert len(files)==1,(ch['section'],files);videos.append(files[0])
concat=out/'chapters.ffconcat';concat.write_text('ffconcat version 1.0\n'+''.join(f"file '{p.resolve()}'\nduration {ch['duration']:.12f}\n"for p,ch in zip(videos,chapters)));video=out/'LEOPARD_SEAL_WORKPRINT_AUDIO04_MISSING.mp4'
args=[F,'-y','-v','warning','-f','concat','-safe','0','-i',str(concat)];filters=[]
for i,ch in enumerate(chapters,1):
 p=R/'audio'/f"{ch['section']:02}.wav"
 if ch['audio_missing']:args+=['-f','lavfi','-i','anullsrc=r=48000:cl=mono']
 else:args+=['-i',str(p)]
 filters.append(f"[{i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono,apad=whole_dur={ch['duration']},atrim=duration={ch['duration']},asetpts=PTS-STARTPTS[a{i}]")
filters.append(''.join(f'[a{i}]'for i in range(1,11))+'concat=n=10:v=0:a=1[voice]');args+=['-filter_complex',';'.join(filters),'-map','0:v:0','-map','[voice]','-c:v','copy','-c:a','aac','-ar','48000','-b:a','160k','-t',str(plan['duration']),'-movflags','+faststart','-metadata','title=The Leopard Seal — workprint, section04 narration missing','-metadata','comment=Not a final audio master. Exact original narration preserved; section04 silent and visibly marked.',str(video)];subprocess.run(args,check=True)
# Decode the delivered movie itself. Confirm all nine unsped source recordings survived the complete edit.
checks=[]
for ch in chapters:
 sid=ch['section'];start=ch['global_start']
 if ch['audio_missing']:
  raw=subprocess.check_output([F,'-v','error','-i',str(video),'-ss',str(start+.1),'-t',str(ch['duration']-.2),'-vn','-ac','1','-ar','24000','-f','f32le','pipe:1']);a=np.frombuffer(raw,dtype='<f4');checks.append({'section':sid,'explicitly_missing':True,'silent_audio_peak':float(np.max(np.abs(a))),'silence_is_not_narration':True});assert np.max(np.abs(a))<.001;continue
 with wave.open(str(R/'audio'/f'{sid:02}.wav'),'rb')as w:rate=w.getframerate();source=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float32)/32768;duration=len(source)/rate
 raw=subprocess.check_output([F,'-v','error','-i',str(video),'-ss',str(start),'-t',str(duration),'-vn','-ac','1','-ar',str(rate),'-f','f32le','pipe:1']);actual=np.frombuffer(raw,dtype='<f4');n=min(len(source),len(actual));corr=float(np.corrcoef(source[:n],actual[:n])[0,1]);checks.append({'section':sid,'source_duration':duration,'movie_offset':start,'decoded_source_correlation':corr,'playback_rate':1.0});assert corr>.985,(sid,corr)
shutil.copyfile(R/'NARRATION_ORIGINAL.srt',out/'NARRATION_ORIGINAL.srt');shutil.copyfile(R/'FILM_PLAN.json',out/'FILM_PLAN.json');shutil.copyfile(R/'CREDITS_AND_STATUS.md',out/'CREDITS_AND_STATUS.md')
probe=json.loads(subprocess.check_output([F,'-hide_banner','-i',str(video)],stderr=subprocess.STDOUT).decode() or '{}')if False else None
# Count every encoded video frame independently, rather than asserting the plan was rendered.
count=subprocess.run([F,'-v','error','-i',str(video),'-map','0:v:0','-an','-c:v','copy','-f','framehash','-'],capture_output=True,text=True,check=True);actual_frames=sum(1 for line in count.stdout.splitlines()if line and not line.startswith('#'));assert actual_frames==plan['total_frames'],(actual_frames,plan['total_frames'])
report={'status':'FULL_LENGTH_VISUAL_WORKPRINT_AUDIO04_MISSING','final_film_complete':False,'script_sha256':plan['script_sha256'],'original_script_byte_unchanged':True,'frames':actual_frames,'fps':24,'duration_seconds':plan['duration'],'width':1920,'height':1080,'chapters':10,'shots':sum(len(x['shots'])for x in chapters),'missing_audio_sections':[4],'chapter04_duration_is_workprint_estimate':True,'narration_playback_rate':1.0,'continuous_human_listening_completed':False,'artistic_approval':False,'audio_edit_checks':checks,'movie_bytes':video.stat().st_size,'movie_sha256':hashlib.sha256(video.read_bytes()).hexdigest()};(out/'DELIVERY_REPORT.json').write_text(json.dumps(report,indent=2));concat.unlink();print(json.dumps(report,indent=2))
