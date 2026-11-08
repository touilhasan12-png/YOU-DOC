"""GitHub-only R12 assembly. Native complete R9 audio, no speech synthesis or processing."""
import os,json,subprocess,zipfile,shutil,hashlib,re
from pathlib import Path
import requests,imageio_ffmpeg
from PIL import Image,ImageDraw,ImageFont
assert os.environ.get('GITHUB_ACTIONS')=='true'
q=json.loads(Path('ENGINE_SOURCE/r12/REQUEST.json').read_text());out=Path('R12_DELIVERY');out.mkdir(exist_ok=True);parts=Path('R12_PARTS');parts.mkdir(exist_ok=True);review=Path('R12_FINAL_REVIEW');review.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe();base=parts/'original_R9.mp4';temp=Path(os.environ['RUNNER_TEMP']);archive=temp/'r9.zip'
def run(args,**kw):return subprocess.run([ff,'-y','-hide_banner',*map(str,args)],check=True,**kw)
def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
def audio_digest(p):
 result=run(['-v','error','-i',p,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],stdout=subprocess.PIPE);return hashlib.sha256(result.stdout).hexdigest()
def count_frames(p):
 r=subprocess.check_output(['ffprobe','-v','error','-count_packets','-select_streams','v:0','-show_entries','stream=nb_read_packets,width,height,r_frame_rate','-of','json',str(p)],text=True);stream=json.loads(r)['streams'][0]
 if stream['width']!=1920 or stream['height']!=1080 or stream['r_frame_rate']!='24/1':raise RuntimeError('Unexpected video dimensions/rate '+str(p))
 return int(stream['nb_read_packets'])

r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['base_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status()
with archive.open('wb')as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
with zipfile.ZipFile(archive)as z:
 with z.open(q['base_member'])as src,base.open('wb')as dst:shutil.copyfileobj(src,dst)
 for n in ['CREDITS_AND_SOURCES.md','INSERT_ASSET_CREDITS.md','English.srt']:
  if n in z.namelist():(out/('R9_HISTORICAL_'+n if n!='English.srt' else n)).write_bytes(z.read(n))
archive.unlink();segments=[]
for row in q['shots']:
 dest=parts/f"{row['id']:03d}.mp4"
 if row['mode']=='R12_new_animation':shutil.copyfile(Path('R12_UNITS')/dest.name,dest)
 else:
  run(['-v','error','-ss',f"{row['frame_start']/24:.12f}",'-i',base,'-map','0:v:0','-an','-frames:v',row['frames'],'-vf','setpts=PTS-STARTPTS','-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-r','24',dest])
 frames=count_frames(dest)
 if frames!=row['frames']:raise RuntimeError(f"Wrong frame count {row['key']} {frames}/{row['frames']}")
 segments.append(dest.resolve());print('VERIFIED UNIT',row['key'],frames,flush=True)
listing=parts/'pictures.txt';listing.write_text(''.join("file '"+str(p)+"'\n"for p in segments));movie=out/'Something_That_Plans_R12_ORIGINAL_AUDIO_1080p.mp4'
run(['-v','error','-f','concat','-safe','0','-i',listing,'-i',base,'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart',movie]);frames=count_frames(movie)
if frames!=q['frames']:raise RuntimeError('Complete film frame count mismatch')
original_audio=audio_digest(base);final_audio=audio_digest(movie)
if original_audio!=final_audio:raise RuntimeError('Restored AAC payload differs from original R9')
comparisons=[]
for row in q['shots']:
 if row['mode']=='R12_new_animation':continue
 start=(row['frame_start']+row['frames']//2)/24
 result=run(['-ss',str(start),'-i',base,'-ss',str(start),'-i',movie,'-t','0.5','-an','-lavfi','[0:v][1:v]ssim','-f','null','-'],stderr=subprocess.PIPE,text=True)
 score=float(re.findall(r'All:([0-9.]+)',result.stderr)[-1]);comparisons.append({'key':row['key'],'midpoint_half_second_ssim':score,'full_1920x1080_frame_uncropped':True,'no_added_overlay':True})
 if score<.97:raise RuntimeError('Retained-frame fidelity failed '+row['key']+' '+str(score))
poster_files=[]
for row in q['shots']:
 t=(row['frame_start']+row['frames']//2)/24;dest=review/f"{row['id']:03d}_{row['key']}.jpg";run(['-v','error','-ss',str(t),'-i',movie,'-frames:v','1','-q:v','2',dest]);poster_files.append((row,dest))
font=ImageFont.truetype('ENGINE_SOURCE/fonts/DejaVuSans.ttf',18)
for page in range((len(poster_files)+11)//12):
 sheet=Image.new('RGB',(1920,936),'#eef0e6');d=ImageDraw.Draw(sheet)
 for j,(row,f)in enumerate(poster_files[page*12:page*12+12]):
  x=j%4*480;y=j//4*312;im=Image.open(f).convert('RGB');im.thumbnail((480,270));sheet.paste(im,(x,y));d.text((x+6,y+277),f"{row['id']:02d} / {row['key']}",font=font,fill='#17364b')
 sheet.save(review/f'FINAL_CONTACT_{page+1:02d}.jpg',quality=95)
geometry=[]
for report in Path('R12_UNITS').glob('layout_report_*.json'):geometry.extend(json.loads(report.read_text()))
geometry_issues=[{'key':r['key'],'time':r['time'],'collisions':r['collisions'],'clipped':r['clipped']}for r in geometry if r['collisions']or r['clipped']]
(review/'PRODUCTION_GEOMETRY.json').write_text(json.dumps({'samples':len(geometry),'issues':geometry_issues},indent=2))
qa={'new_animation_geometry_samples':len(geometry),'sampled_geometry_issues':geometry_issues,'frames':frames,'fps':24,'size':[1920,1080],'native_R9_AAC_adts_sha256':original_audio,'delivered_AAC_adts_sha256':final_audio,'audio_payload_identical':True,'retained_picture_midpoint_checks':comparisons,'caution':'SSIM, frame counts, geometry and sampled views are technical checks, not a claim of artistic acceptance or continuous human playback.'};(out/'TECHNICAL_VERIFICATION.json').write_text(json.dumps(qa,indent=2));(review/'TECHNICAL_VERIFICATION.json').write_text(json.dumps(qa,indent=2))
(out/'PROVENANCE.json').write_text(json.dumps({'edition':q['edition'],'github_commit':os.environ['GITHUB_SHA'],'github_run':os.environ['GITHUB_RUN_ID'],'upstream_code':json.loads(Path('ENGINE_SOURCE/r12/vendor/UPSTREAM_PROVENANCE.json').read_text()),'shots':q['shots'],'original_R9_audio_copied_without_filtering':True,'new_AI_principal_animal_images':0,'retained_AI_secondary_images':['seal_grey_cutout.png','sea_lion_brown_cutout.png'],'Rev2D_usage':'ModelSchema, Rig, body warp, fin bone, deterministic swim keyframes, posed path geometry','anidoodle_usage':'deterministic RNG, text fit, reading time and geometry-probe API','lemo_usage':'plane, pressure-line ink, arrow and clock helpers','reelmimic_usage':'composition and motion guidance only; no runtime imported'},indent=2))
shutil.copyfile('ENGINE_SOURCE/r12/CREDITS_AND_LICENSES.md',out/'CREDITS_AND_LICENSES.md')
source=out/'R12_EDITABLE_SOURCE.zip'
tracked=subprocess.check_output(['git','ls-files'],text=True).splitlines();omitted=[f for f in tracked if f.startswith(('ENGINE_SOURCE/media/','ENGINE_SOURCE/locked_audio/','ENGINE_SOURCE/reference_audio/'))];included=[f for f in tracked if f not in omitted];subprocess.run(['git','archive','--format=zip','-o',str(source.resolve()),'HEAD','--',*included],check=True)
with zipfile.ZipFile(source,'a',compression=zipfile.ZIP_DEFLATED)as z:z.writestr('OMITTED_ARCHIVED_MEDIA.json',json.dumps({'reason':'Avoid duplicating archived original media/audio and an explicitly rejected old reference track. All editable code, timing, rigs, fonts and the two approved cutouts remain included. R9 complete native-audio master is already preserved on Drive; original media files remain at this immutable repository commit.','source_commit':os.environ['GITHUB_SHA'],'R9_master_drive':'https://drive.google.com/file/d/1R6i6mlIqVlIo_x-N027dczxBtf6eHKzL/view','omitted':omitted},indent=2))
receipt={'edition':q['edition'],'file':movie.name,'bytes':movie.stat().st_size,'sha256':sha(movie),'frames':frames,'duration_seconds':q['duration'],'fps':24,'width':1920,'height':1080,'original_R9_audio_payload_identical':True,'new_animation_shots':70,'retained_R9_3D_shots':17,'retained_real_passages':6,'github_run':os.environ['GITHUB_RUN_ID'],'source_commit':os.environ['GITHUB_SHA'],'source_archive':source.name,'source_archive_sha256':sha(source),'subtitle_source':'Original R9 delivered English.srt, unchanged','visual_acceptance_not_guaranteed':True};(out/'DELIVERY.json').write_text(json.dumps(receipt,indent=2));print('R12 COMPLETE FILM AND VERIFICATION READY',movie.name,movie.stat().st_size,flush=True)
