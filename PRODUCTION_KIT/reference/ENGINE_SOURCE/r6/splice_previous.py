"""Cut/assemble only, on GitHub Actions. No media inspection or analysis."""
import os,json,subprocess,zipfile,shutil
from pathlib import Path
import requests,imageio_ffmpeg
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('GitHub-only editing')
q=json.loads(Path('ENGINE_SOURCE/r6/REQUEST.json').read_text());root=Path('R6_INPUTS');root.mkdir(exist_ok=True);out=Path('R6_DELIVERY');out.mkdir(exist_ok=True)
http=requests.Session();headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']};api='https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']
def restore(aid,member,destination,sidecars=False):
 p=root/(str(aid)+'.zip');r=http.get(api+'/actions/artifacts/'+str(aid)+'/zip',headers=headers,stream=True,timeout=180);r.raise_for_status()
 with p.open('wb') as f:
  for b in r.iter_content(4*1024*1024):f.write(b)
 with zipfile.ZipFile(p) as z:
  with z.open(member) as src,destination.open('wb') as dst:shutil.copyfileobj(src,dst)
  if aid==q['insert_artifact_id']:
   (out/'INSERT_ASSET_CREDITS.md').write_bytes(z.read('CREDITS_AND_SOURCES.md'))
  if sidecars:
   for n in ['English.srt','CREDITS_AND_SOURCES.md']:
    if n in z.namelist():(out/n).write_bytes(z.read(n))
 p.unlink()
base=root/'previous_film.mp4';new=root/'new_film_for_selected_cuts.mp4'
restore(q['base_artifact_id'],q['base_member'],base,True);restore(q['insert_artifact_id'],q['insert_member'],new)
# Credits retained from previous film; add only licenses needed by inserted authored assets.
p=out/'CREDITS_AND_SOURCES.md';text=p.read_text() if p.exists() else ''
text+='\n\n## Targeted R6 edit\nAll nonselected pictures and the complete original audio come from the previous film. Only the ten specified picture intervals are replaced with the new inserts. Human inserts have only the requested lighter skin material. The complete original licensed-source attribution for the inserts is retained in INSERT_ASSET_CREDITS.md.\n'
p.write_text(text)
parts=Path('R6_PARTS');parts.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe();segments=[];cursor=0

def cut(src,start,frames,name):
 dest=parts/(f'{len(segments):02d}_'+name+'.mp4')
 subprocess.run([ff,'-y','-v','error','-ss',f'{start/24:.12f}','-i',str(src),'-map','0:v:0','-an','-frames:v',str(frames),'-vf','setpts=PTS-STARTPTS','-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-r','24',str(dest)],check=True)
 segments.append(dest.resolve());print('ASSEMBLED INTERVAL',name,flush=True)
for row in sorted(q['shots'],key=lambda r:r['frame_start']):
 start,end=row['frame_start'],row['frame_end']
 if cursor<start:cut(base,cursor,start-cursor,'previous_style')
 if row['key'] in q['skin_only_keys']:
  dest=parts/(f'{len(segments):02d}_'+row['key']+'.mp4');shutil.copyfile(Path('R6_PATCHES')/(row['key']+'.mp4'),dest);segments.append(dest.resolve())
 else:cut(new,start,end-start,row['key'])
 cursor=end
if cursor<q['total_frames']:cut(base,cursor,q['total_frames']-cursor,'previous_style_ending')
listing=parts/'concat.txt';listing.write_text(''.join("file '"+str(p)+"'\n" for p in segments))
movie=out/'Something_That_Plans_R6_PREVIOUS_STYLE_TARGETED_INSERTS_2026-11-07.mp4'
subprocess.run([ff,'-y','-v','error','-f','concat','-safe','0','-i',str(listing),'-i',str(base),'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart',str(movie)],check=True)
(out/'DELIVERY.json').write_text(json.dumps({'file':movie.name,'bytes':movie.stat().st_size,'selected_keys':q['selected_keys'],'base':'previous R4 film; all nonselected pictures and all audio','media_analysis_performed':False,'visual_or_audio_inspection_performed':False,'remote_production_run':os.environ['GITHUB_RUN_ID']},indent=2))
print('COMPLETE FILM CREATED',movie.name,movie.stat().st_size,flush=True)
