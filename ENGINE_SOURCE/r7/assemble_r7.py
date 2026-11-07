"""Production editing only; no video/audio/content analysis or inspection."""
import os,json,subprocess,zipfile,shutil,math,wave,re,textwrap
from pathlib import Path
import requests,imageio_ffmpeg
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('GitHub-only editing')
P=Path('ENGINE_SOURCE/r7');q=json.loads((P/'REQUEST.json').read_text());out=Path('R7_DELIVERY');out.mkdir(exist_ok=True);parts=Path('R7_PARTS');parts.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):subprocess.run([ff,'-y','-v','error',*map(str,args)],check=True)
http=requests.Session();r=http.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['base_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status();archive=parts/'base.zip'
with archive.open('wb') as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
base=parts/'R6_previous_film.mp4'
with zipfile.ZipFile(archive) as z:
 with z.open(q['base_member']) as src,base.open('wb') as dst:shutil.copyfileobj(src,dst)
 for n in ['CREDITS_AND_SOURCES.md','INSERT_ASSET_CREDITS.md','English.srt']:
  if n in z.namelist():(out/n).write_bytes(z.read(n))
archive.unlink()
# Native PCM conversion changes sample format/rate only, never speaking speed or pitch.
native=parts/'native_ending_48k.wav';run(['-i',P/q['native_regenerated_ending'],'-ar','48000','-ac','2','-c:a','pcm_s16le',native])
# Read the production PCM header solely to allocate the closing timeline; no signal inspection.
with wave.open(str(native),'rb') as f:native_seconds=f.getnframes()/f.getframerate()
cut=q['audio_cut_seconds'];target_frames=max(q['base_frames'],math.ceil((cut+native_seconds+1.0)*24));total=target_frames/24;slot=total-cut
print('NATIVE ENDING allocated seconds',native_seconds,'FINAL VIDEO frames',target_frames,flush=True)
segments=[];cursor=0
def picture(src,start,count,name):
 dest=parts/(f'{len(segments):02d}_'+name+'.mp4');run(['-ss',f'{start/24:.12f}','-i',src,'-map','0:v:0','-an','-frames:v',count,'-vf','setpts=PTS-STARTPTS','-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-r','24',dest]);segments.append(dest.resolve());print('PRODUCED interval',name,flush=True)
for row in sorted(q['shots'],key=lambda r:r['frame_start']):
 if cursor<row['frame_start']:picture(base,cursor,row['frame_start']-cursor,'unchanged_R6')
 dest=parts/(f'{len(segments):02d}_'+row['key']+'.mp4');shutil.copyfile(Path('R7_PATCHES')/(row['key']+'.mp4'),dest);segments.append(dest.resolve());cursor=row['frame_end']
if target_frames==q['base_frames']:
 picture(base,cursor,q['base_frames']-cursor,'unchanged_R6_ending')
else:
 # If the naturally generated take is longer, extend picture only, never the voice.
 # Preserve the existing final two-second fade after holding a clean original ocean frame.
 fade_start=q['base_frames']-48;picture(base,cursor,fade_start-cursor,'unchanged_R6_before_fade')
 extra=target_frames-q['base_frames'];dest=parts/(f'{len(segments):02d}_natural_ocean_hold.mp4')
 run(['-ss',f'{(fade_start-1)/24:.12f}','-i',base,'-an','-vf',f'trim=end_frame=1,loop=loop={extra-1}:size=1:start=0,setpts=N/24/TB','-frames:v',extra,'-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288',dest]);segments.append(dest.resolve());picture(base,fade_start,48,'original_natural_fade')
listing=parts/'pictures.txt';listing.write_text(''.join("file '"+str(p)+"'\n" for p in segments))
# The original AAC prefix is copied, not regenerated or time-processed.
prefix=parts/'original_prefix.m4a';run(['-i',base,'-map','0:a:0','-vn','-t',f'{cut:.6f}','-c:a','copy',prefix])
ending=parts/'new_native_ending.m4a'
# Use the documented quiet ocean tail after the old last spoken word as the existing ambience.
# No old ending narration is mixed under the new take.
graph=f'[0:a]volume=-0.6203623260290041dB,asetpts=PTS-STARTPTS[v];[1:a]atrim=start=663.95:end=664.55,asetpts=PTS-STARTPTS,aresample=48000,aloop=loop=-1:size=28800,atrim=duration={slot:.9f},afade=t=in:d=0.03,afade=t=out:st={slot-.8:.9f}:d=0.8[b];[v][b]amix=inputs=2:duration=longest:normalize=0,apad=whole_dur={slot:.9f},atrim=duration={slot:.9f}[e]'
run(['-i',native,'-i',base,'-filter_complex',graph,'-map','[e]','-ar','48000','-ac','2','-c:a','aac','-b:a','320k',ending])
audiolist=parts/'audio.txt';audiolist.write_text("file '"+str(prefix.resolve())+"'\nfile '"+str(ending.resolve())+"'\n")
fullaudio=parts/'new_full_audio.m4a';run(['-f','concat','-safe','0','-i',audiolist,'-c:a','copy',fullaudio])
movie=out/'Something_That_Plans_R7_HANDS_AND_NEW_ENDING_2026-11-07.mp4';run(['-f','concat','-safe','0','-i',listing,'-i',fullaudio,'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart',movie])
# Keep preceding captions; one verbatim closing cue follows the complete new native take.
srt=out/'English.srt'
def secs(t):
 h,m,s=map(float,t.replace(',','.').split(':'));return h*3600+m*60+s
def stamp(t):
 x=round(t*1000);h,x=divmod(x,3600000);m,x=divmod(x,60000);s,x=divmod(x,1000);return f'{h:02d}:{m:02d}:{s:02d},{x:03d}'
kept=[]
for b in re.split(r'\n\s*\n',srt.read_text().strip()):
 lines=b.splitlines()
 if len(lines)>2 and ' --> ' in lines[1] and secs(lines[1].split(' --> ')[0])<cut:kept.append(lines[1:])
ending_lines=[]
for para in q['ending_text'].split('\n\n'):ending_lines.extend(textwrap.wrap(para,60))
kept.append([stamp(cut)+' --> '+stamp(cut+native_seconds),*ending_lines]);srt.write_text('\n\n'.join(str(i+1)+'\n'+'\n'.join(b) for i,b in enumerate(kept))+'\n')
credits=out/'CREDITS_AND_SOURCES.md';credits.write_text(credits.read_text()+'\n\n## R7 — hands and regenerated ending only\nSix existing inserts have hand/palm orientation corrections only. All other pictures are retained from R6. The ending after 649.216 seconds uses a freshly generated take of the exact original words with the previously selected narrator voice-00. No time stretching, tempo or pitch processing is applied to that recording; the preceding AAC audio is copied. This supersedes earlier notes describing a slowed ending.\n')
(out/'DELIVERY.json').write_text(json.dumps({'file':movie.name,'bytes':movie.stat().st_size,'github_run':os.environ['GITHUB_RUN_ID'],'native_ending_seconds':native_seconds,'audio_cut_seconds':cut,'frames':target_frames,'hand_only_keys':q['selected_keys'],'voice_id':'voice-00','ending_freshly_regenerated':True,'speech_time_stretching':False,'speech_tempo_or_pitch_changes':False,'media_content_analysis_performed':False,'visual_or_audio_inspection_performed':False},indent=2))
print('COMPLETE FILM PRODUCED',movie.name,movie.stat().st_size,flush=True)
