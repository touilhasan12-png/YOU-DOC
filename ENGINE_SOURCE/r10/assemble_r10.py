"""GitHub-only editing. Preserve ten repaired R9 intervals and all R9 audio.
No inspection, film analysis, contact sheets or audit passes are performed.
"""
import os,json,subprocess,zipfile,shutil
from pathlib import Path
import requests,imageio_ffmpeg,cairosvg
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('All media processing is GitHub-only')
q=json.loads(Path('ENGINE_SOURCE/r10/REQUEST.json').read_text());out=Path('R10_DELIVERY');out.mkdir(exist_ok=True);parts=Path('R10_PARTS');parts.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe()
def run(args):subprocess.run([ff,'-y','-v','error',*map(str,args)],check=True)
r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['base_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status();archive=parts/'R9.zip'
with archive.open('wb') as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
base=parts/'R9_full_film.mp4'
with zipfile.ZipFile(archive) as z:
 with z.open(q['base_member']) as src,base.open('wb') as dst:shutil.copyfileobj(src,dst)
 for n in ['CREDITS_AND_SOURCES.md','INSERT_ASSET_CREDITS.md','English.srt']:
  if n in z.namelist():(out/n).write_bytes(z.read(n))
archive.unlink();segments=[]
# Static programmatic vector matte: original footage remains uncropped inside it.
svg='''<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><g fill="none" stroke="#90b1a8" stroke-width="2"><path d="M76 72V34H114 M1806 34H1844V72 M76 1008V1046H114 M1806 1046H1844V1008"/><rect x="94" y="52" width="1732" height="976" stroke-opacity=".48"/></g><text x="101" y="15" font-size="21" fill="#c9d3c2" font-family="sans-serif" letter-spacing="3">WILD ORCAS · LICENSED FIELD FOOTAGE</text></svg>'''
matte=parts/'vector_footage_matte.png';cairosvg.svg2png(bytestring=svg.encode(),write_to=str(matte))
for row in q['shots']:
 dest=parts/(f"{row['id']:03d}_"+row['key']+'.mp4');mode=row['mode']
 if mode=='new_vector_puppet_2_5D':shutil.copyfile(Path('R10_UNITS')/dest.name,dest)
 else:
  start=row['frame_start']/24;count=row['encoded_frames'];args=['-ss',f'{start:.12f}','-i',base]
  footage=mode=='licensed_footage_vector_frame' and row['key'] not in {'opinion_release','natural_outro'}
  if footage:
   args+=['-i',matte,'-filter_complex','[0:v]scale=1728:972:flags=lanczos,pad=1920:1080:96:54:color=0x071f2b,setpts=PTS-STARTPTS[plate];[plate][1:v]overlay=0:0:format=auto,format=yuv420p[v]','-map','[v]']
  else:args+=['-map','0:v:0','-vf','setpts=PTS-STARTPTS']
  run(args+['-an','-frames:v',count,'-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-r','24',dest])
 segments.append(dest.resolve());print('STAGED',row['id'],row['key'],mode,flush=True)
listing=parts/'units.txt';listing.write_text(''.join("file '"+str(p)+"'\n" for p in segments));movie=out/'Something_That_Plans_R10_VECTOR_PUPPET_2_5D_1920x1080_2026-11-07.mp4'
run(['-f','concat','-safe','0','-i',listing,'-i',base,'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart',movie])
p=out/'CREDITS_AND_SOURCES.md';s=p.read_text();s+='\n\n## R10 — original vector cutout / puppet and 2.5D editorial design\n77 newly authored vector scenes, not the previous 3D non-protected picture units. Analytic Bezier cutouts, independently articulated flukes/fins/jaws and 2D human rigs; depth-plane camera projection; frequency-dependent travelling surface waves; depth-attenuated light shafts, particles and kelp; scene-specific data HUDs and Natural Earth geographic outlines. All new movie frames are native 1920×1080 at 24fps. Resolution-independent SVG source artwork is included separately.\n\nThe user selected preservation of all ten repaired intervals. Those ten are cut from the R9 full movie, including its latest fixed-driver and slow-board-leg changes, and are not newly rendered. The six existing licensed-footage passages are retained from the same base: the four earlier passages receive a vector research-frame matte without cropping their imagery; the quiet two-part ending stays full-frame without end-screen graphics. Attribution and earlier footage provenance remain above. All complete R9 audio is copied without regeneration, retiming or processing. All rendering, vector asset production, editing and encoding run only on GitHub Actions. No film/audio analysis, contact sheets, inspection or automatic artistic acceptance are performed.\n';p.write_text(s)
(out/'DELIVERY.json').write_text(json.dumps({'file':movie.name,'bytes':movie.stat().st_size,'github_run':os.environ['GITHUB_RUN_ID'],'frames':15969,'width':1920,'height':1080,'fps':24,'new_vector_scenes':77,'protected_R9_intervals':q['locked_keys'],'licensed_footage_passages':6,'full_R9_audio_copied':True,'audio_regenerated':False,'media_analysis_or_inspection_performed':False},indent=2));print('COMPLETE FILM PRODUCED',movie.name,movie.stat().st_size,flush=True)
