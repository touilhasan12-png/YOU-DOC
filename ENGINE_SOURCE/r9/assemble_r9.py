"""GitHub-only targeted picture editing. Entire R8 audio copied. No media analysis."""
import os,json,subprocess,zipfile,shutil
from pathlib import Path
import requests,imageio_ffmpeg
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('GitHub-only editing')
q=json.loads(Path('ENGINE_SOURCE/r9/REQUEST.json').read_text());out=Path('R9_DELIVERY');out.mkdir(exist_ok=True);parts=Path('R9_PARTS');parts.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):subprocess.run([ff,'-y','-v','error',*map(str,args)],check=True)
r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['base_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status();archive=parts/'base.zip'
with archive.open('wb') as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
base=parts/'R8_previous_film.mp4'
with zipfile.ZipFile(archive) as z:
 with z.open(q['base_member']) as src,base.open('wb') as dst:shutil.copyfileobj(src,dst)
 for n in ['CREDITS_AND_SOURCES.md','INSERT_ASSET_CREDITS.md','English.srt']:
  if n in z.namelist():(out/n).write_bytes(z.read(n))
archive.unlink();segments=[];cursor=0
def picture(src,start,count,name):
 dest=parts/(f'{len(segments):02d}_'+name+'.mp4');run(['-ss',f'{start/24:.12f}','-i',src,'-map','0:v:0','-an','-frames:v',count,'-vf','setpts=PTS-STARTPTS','-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-r','24',dest]);segments.append(dest.resolve());print('PRODUCED interval',name,flush=True)
for row in sorted(q['shots'],key=lambda r:r['frame_start']):
 if cursor<row['frame_start']:picture(base,cursor,row['frame_start']-cursor,'unchanged_R8')
 dest=parts/(f'{len(segments):02d}_'+row['key']+'.mp4');shutil.copyfile(Path('R9_PATCHES')/(row['key']+'.mp4'),dest);segments.append(dest.resolve());cursor=row['frame_end']
if cursor<q['base_frames']:picture(base,cursor,q['base_frames']-cursor,'unchanged_R8_ending')
listing=parts/'pictures.txt';listing.write_text(''.join("file '"+str(p)+"'\n" for p in segments));movie=out/'Something_That_Plans_R9_NATURAL_GRIP_AND_SLOW_LEGS_2026-11-07.mp4'
run(['-f','concat','-safe','0','-i',listing,'-i',base,'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart',movie])
p=out/'CREDITS_AND_SOURCES.md';s=p.read_text();s+='\n\n## R9 — wheel grip and slow leg motion\nThe supplied helm screenshot informed the revised thumb-up grip. Driver palms sit outside the wheel tube; digits curl around it on a constant flexion axis. Volume-preserving dual-quaternion skinning is baked into a static driver mesh to avoid elbow collapse. The board rider retains locked upper-body joints and supported palms, with slow small-amplitude leg-only kicks in the water beyond the board tail. Only the four existing helm appearances and the board interval are replaced. All other pictures and the full R8 audio remain unchanged.\n';p.write_text(s)
(out/'DELIVERY.json').write_text(json.dumps({'file':movie.name,'bytes':movie.stat().st_size,'github_run':os.environ['GITHUB_RUN_ID'],'frames':15969,'selected_keys':q['selected_keys'],'driver_pose_baked_static':True,'driver_skinning':'dual_quaternion_volume_preserving','grip_frame':'thumbs_up_palms_outside_hoop','board_upper_body_locked':True,'board_leg_frequency_hz':.25,'full_R8_audio_copied':True,'audio_regenerated':False,'video_audio_inspection_performed':False},indent=2));print('COMPLETE FILM PRODUCED',movie.name,movie.stat().st_size,flush=True)
