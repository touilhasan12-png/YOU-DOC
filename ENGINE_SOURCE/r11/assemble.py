"""GitHub-only film assembly. No media playback, contact sheets or artistic PASS claims."""
import os,json,subprocess,zipfile,shutil,hashlib,math
from pathlib import Path
import requests,imageio_ffmpeg
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('GitHub-only editing/encoding')
P=Path('ENGINE_SOURCE/r11');q=json.loads((P/'REQUEST.json').read_text());out=Path('R11_DELIVERY');out.mkdir(exist_ok=True);parts=Path('R11_PARTS');parts.mkdir(exist_ok=True);units=Path('R11_UNITS');ff=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):subprocess.run([ff,'-y','-v','error',*map(str,args)],check=True)
url='https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['base_artifact_id'])+'/zip'
r=requests.get(url,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status();zpath=parts/'base.zip'
with zpath.open('wb') as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
base=parts/'R9_APPROVED_REFERENCE.mp4'
with zipfile.ZipFile(zpath) as z:
 with z.open(q['base_member']) as src,base.open('wb') as dst:shutil.copyfileobj(src,dst)
 for name in ['CREDITS_AND_SOURCES.md','INSERT_ASSET_CREDITS.md']:
  if name in z.namelist():(parts/('R9_'+name)).write_bytes(z.read(name))
zpath.unlink()
# Native-speed audio only: padding for picture cuts, never tempo/pitch/speed processing.
audio_parts=[]
for para in q['paragraphs']:
 dest=parts/f"voice_{para['id']:02d}.wav"
 filt=f"aresample=48000,adelay={round(para['lead']*1000)}:all=1,apad,atrim=end_sample={para['frames']*2000},asetpts=PTS-STARTPTS"
 run(['-i',P/'narration'/f"{para['id']:02d}.mp3",'-af',filt,'-ar','48000','-ac','2','-c:a','pcm_s16le',dest]);audio_parts.append(dest)
listing=parts/'audio.ffconcat';listing.write_text(''.join("file '"+str(p.resolve())+"'\n" for p in audio_parts));voice=parts/'Will_native_speed.wav'
run(['-f','concat','-safe','0','-i',listing,'-c','copy',voice])
# A very low-level original ocean texture, not the previous narrator mixed beneath Will.
audio=parts/'Will_with_ocean.m4a'
run(['-i',voice,'-f','lavfi','-i',f"anoisesrc=color=pink:amplitude=0.025:sample_rate=48000:duration={q['duration']}",'-filter_complex',f"[0:a]volume=1.0[v];[1:a]highpass=f=90,lowpass=f=750,volume=0.38,afade=t=in:d=2,afade=t=out:st={q['duration']-2.0}:d=2[bed];[v][bed]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97:level=false[a]",'-map','[a]','-c:a','aac','-b:a','192k','-ar','48000',audio])
segments=[];retained=[]
for row in q['shots']:
 dest=units/(f"{row['id']:03d}.mp4")
 if row['mode']!='authored_vector':
  a=row['old_frame_start']/24;old_duration=(row['old_frame_end']-row['old_frame_start'])/24;ratio=row['duration']/old_duration
  args=['-ss',f'{a:.12f}','-t',f'{old_duration:.12f}','-i',base]
  vf=f"trim=duration={old_duration:.12f},setpts={ratio:.12f}*(PTS-STARTPTS),fps=24,tpad=stop_mode=clone:stop_duration=1"
  if row['mode']=='R9_3D':
   args+=['-loop','1','-i',units/('overlay_'+row['key']+'.png'),'-filter_complex',f'[0:v]{vf}[v];[v][1:v]overlay=0:0:format=auto[out]','-map','[out]']
  else:
   if row['key']=='natural_outro':vf+=f",fade=t=out:st={max(0,row['duration']-.8):.12f}:d=0.8"
   args+=['-vf',vf,'-map','0:v:0']
  run([*args,'-an','-frames:v',row['frames'],'-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-r','24',dest])
  retained.append({'key':row['key'],'mode':row['mode'],'source':'R9','source_frame_start':row['old_frame_start'],'source_frame_end':row['old_frame_end'],'new_frame_start':row['frame_start'],'new_frame_end':row['frame_end'],'picture_timing_ratio':ratio,'new_typography_overlay':row['mode']=='R9_3D'})
 if not dest.is_file() or dest.stat().st_size<1024:raise RuntimeError('Missing complete picture unit '+row['key'])
 segments.append(dest.resolve());print('PICTURE READY',row['id'],row['key'],row['mode'],flush=True)
assert len(segments)==93 and sum(r['frames'] for r in q['shots'])==q['frames']
listing=parts/'pictures.ffconcat';listing.write_text('ffconcat version 1.0\n'+''.join("file '"+str(p)+"'\nduration "+format(row['duration'],'.12f')+'\n' for p,row in zip(segments,q['shots'])))
movie=out/'Something_That_Plans_R11_SOUL_EDITORIAL_WILL_1080p.mp4'
run(['-f','concat','-safe','0','-i',listing,'-i',audio,'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart','-metadata','title=Something That Plans — R11',movie])
shutil.copyfile(P/'English.srt',out/'English.srt');shutil.copyfile(P/'CREDITS_AND_SOURCES.md',out/'CREDITS_AND_SOURCES.md')
(out/'PICTURE_PROVENANCE.json').write_text(json.dumps(retained,indent=2))
with zipfile.ZipFile(out/'R11_EDITABLE_SOURCE_AND_NARRATION.zip','w',zipfile.ZIP_DEFLATED) as z:
 for file in sorted(P.rglob('*')):
  if file.is_file() and '__pycache__' not in file.parts:z.write(file,'r11/'+str(file.relative_to(P)))
 for file in [P.parent/'script_original.txt',P.parent/'SOURCES.md',Path('.github/workflows/r11_soul_editorial.yml'),*parts.glob('R9_*CREDITS*.md')]:
  if file.exists():z.write(file,'reference/'+file.name)
receipt={'file':movie.name,'bytes':movie.stat().st_size,'sha256':hashlib.file_digest(movie.open('rb'),'sha256').hexdigest(),'github_run':os.environ['GITHUB_RUN_ID'],'frames':q['frames'],'fps':24,'duration':q['duration'],'width':1920,'height':1080,'scenes':93,'new_vector_scenes':70,'retained_R9_3D_scenes':17,'licensed_footage_scenes':6,'generated_secondary_animal_assets':2,'generated_principal_animal_images_used':False,'voice':'Will','model':'eleven_v3','performance_tags_submitted':True,'script_words_unchanged':True,'speech_speed_processing':False,'old_narrator_audio_used':False,'video_audio_inspection_performed':False,'artistic_acceptance_claimed':False,'previous_Drive_versions_modified':False}
(out/'DELIVERY.json').write_text(json.dumps(receipt,indent=2));print('COMPLETE FILM PRODUCED',movie.name,movie.stat().st_size,flush=True)
