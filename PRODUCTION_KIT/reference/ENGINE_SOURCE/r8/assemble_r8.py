"""GitHub-only targeted picture editing. Entire R7 audio copied. No media analysis."""
import os,json,subprocess,zipfile,shutil
from pathlib import Path
import requests,imageio_ffmpeg
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('GitHub-only editing')
q=json.loads(Path('ENGINE_SOURCE/r8/REQUEST.json').read_text());out=Path('R8_DELIVERY');out.mkdir(exist_ok=True);parts=Path('R8_PARTS');parts.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):subprocess.run([ff,'-y','-v','error',*map(str,args)],check=True)
r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['base_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status();archive=parts/'base.zip'
with archive.open('wb') as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
base=parts/'R7_previous_film.mp4'
with zipfile.ZipFile(archive) as z:
 with z.open(q['base_member']) as src,base.open('wb') as dst:shutil.copyfileobj(src,dst)
 for n in ['CREDITS_AND_SOURCES.md','INSERT_ASSET_CREDITS.md','English.srt']:
  if n in z.namelist():(out/n).write_bytes(z.read(n))
archive.unlink();segments=[];cursor=0
def picture(src,start,count,name):
 dest=parts/(f'{len(segments):02d}_'+name+'.mp4');run(['-ss',f'{start/24:.12f}','-i',src,'-map','0:v:0','-an','-frames:v',count,'-vf','setpts=PTS-STARTPTS','-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-r','24',dest]);segments.append(dest.resolve());print('PRODUCED interval',name,flush=True)
for row in sorted(q['shots'],key=lambda r:r['frame_start']):
 if cursor<row['frame_start']:picture(base,cursor,row['frame_start']-cursor,'unchanged_R7')
 dest=parts/(f'{len(segments):02d}_'+row['key']+'.mp4');shutil.copyfile(Path('R8_PATCHES')/(row['key']+'.mp4'),dest);segments.append(dest.resolve());cursor=row['frame_end']
if cursor<q['base_frames']:picture(base,cursor,q['base_frames']-cursor,'unchanged_R7_ending')
listing=parts/'pictures.txt';listing.write_text(''.join("file '"+str(p)+"'\n" for p in segments));movie=out/'Something_That_Plans_R8_FIXED_GRIPS_AND_CHARACTER_2026-11-07.mp4'
run(['-f','concat','-safe','0','-i',listing,'-i',base,'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart',movie])
p=out/'CREDITS_AND_SOURCES.md';s=p.read_text().replace('The user-authorized ending derivative retains all spoken words and CTA, with pitch/formant-preserving tempo correction.','The R7 ending uses a freshly generated original-narrator take, without time stretching; R8 retains that complete R7 audio unchanged.');s+='\n\n## R8 — fixed character and grips only\nThe driver, board rider and comparison swimmer use a single constrained anatomical pose baked into static meshes. Bone and IK updates are disabled after baking. The wheel is fixed and the hands stay on their fixtures; palms are supported on the board. Water, vessel motion and animals remain animated; the speed comparison retains whole-body translation but no limb strokes. All other pictures, captions and the entire R7 audio are retained.\n';p.write_text(s)
(out/'DELIVERY.json').write_text(json.dumps({'file':movie.name,'bytes':movie.stat().st_size,'github_run':os.environ['GITHUB_RUN_ID'],'frames':15969,'selected_keys':q['selected_keys'],'character_pose_baked_static':True,'per_frame_character_ik':False,'wheel_rotation':False,'full_R7_audio_copied':True,'audio_regenerated':False,'media_analysis_performed':False,'visual_or_audio_inspection_performed':False},indent=2));print('COMPLETE FILM PRODUCED',movie.name,movie.stat().st_size,flush=True)
