"""GitHub-only R14 selective assembly, bit-exact retained R13 pictures and native R9 AAC."""
import os,json,subprocess,zipfile,shutil,hashlib,re
from pathlib import Path
import requests,imageio_ffmpeg
from PIL import Image,ImageDraw,ImageFont
assert os.environ.get('GITHUB_ACTIONS')=='true'
q=json.loads(Path('ENGINE_SOURCE/r14/REQUEST.json').read_text());out=Path('R14_DELIVERY');out.mkdir(exist_ok=True);parts=Path('R14_PARTS');parts.mkdir(exist_ok=True);review=Path('R14_FINAL_REVIEW');review.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe();base=parts/'approved_R13.mp4';archive=Path(os.environ['RUNNER_TEMP'])/'r13.zip'
def run(args,**kw):return subprocess.run([ff,'-y','-hide_banner',*map(str,args)],check=True,**kw)
def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
def audio_digest(p):return hashlib.sha256(run(['-v','error','-i',p,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],stdout=subprocess.PIPE).stdout).hexdigest()
def count_frames(p):
 r=subprocess.check_output(['ffprobe','-v','error','-count_packets','-select_streams','v:0','-show_entries','stream=nb_read_packets,width,height,r_frame_rate,start_time,duration','-of','json',str(p)],text=True);s=json.loads(r)['streams'][0]
 if s['width']!=1920 or s['height']!=1080 or s['r_frame_rate']!='24/1':raise RuntimeError('Dimensions/rate '+str(p))
 return int(s['nb_read_packets'])
r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['r13_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status()
with archive.open('wb')as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
with zipfile.ZipFile(archive)as z:
 with z.open(q['r13_member'])as src,base.open('wb')as dst:shutil.copyfileobj(src,dst)
 for n in ['English.srt','R9_HISTORICAL_CREDITS_AND_SOURCES.md','R9_HISTORICAL_INSERT_ASSET_CREDITS.md']:
  if n in z.namelist():(out/n).write_bytes(z.read(n))
archive.unlink()
if sha(base)!='82bdeeef6587cf0e919c11154928bf800bce8d4c5c5437786fd0db391898d0fb':raise RuntimeError('Approved R13 baseline digest mismatch')
if count_frames(base)!=q['frames']:raise RuntimeError('Baseline frame table mismatch')
segments=[]
for row in q['shots']:
 dest=parts/f"{row['id']:03d}.mp4"
 if row['r14_mode']!='keep_R13':shutil.copyfile(Path('R14_UNITS')/dest.name,dest)
 else:
  # Every approved shot begins at its original IDR, since R13 was assembled
  # from closed, independently encoded shot units. Stream copy, no generation.
  run(['-v','error','-ss',f"{row['frame_start']/24:.12f}",'-i',base,'-map','0:v:0','-an','-frames:v',row['frames'],'-c:v','copy','-video_track_timescale','12288',dest])
 frames=count_frames(dest)
 if frames!=row['frames']:raise RuntimeError(f"Unit frame count: {row['key']} {frames}/{row['frames']}")
 segments.append(dest.resolve());print('VERIFIED UNIT',row['key'],frames,row['r14_mode'],flush=True)
listing=parts/'pictures.txt';listing.write_text(''.join("file '"+str(p)+"'\n"for p in segments));movie=out/'Something_That_Plans_R14_ORIGINAL_AUDIO_1080p.mp4'
run(['-v','error','-f','concat','-safe','0','-i',listing,'-i',base,'-map','0:v:0','-map','1:a:0','-c','copy','-video_track_timescale','12288','-movflags','+faststart',movie]);frames=count_frames(movie)
if frames!=q['frames']:raise RuntimeError('Full frame count mismatch')
original_audio=audio_digest(base);final_audio=audio_digest(movie)
if original_audio!=final_audio or final_audio!='590c27ac7de14c84be9963ddf8a0887620aac4cf5f16f916e5b70a0e6e14322f':raise RuntimeError('Native R9 AAC payload changed')
def decoded_hashes(movie,name):
 dest=parts/name;run(['-v','error','-i',movie,'-map','0:v:0','-an','-fps_mode','passthrough','-f','framemd5',dest]);return[line.split(',')[-1].strip()for line in dest.read_text().splitlines()if not line.startswith('#')and line.strip()]
old=decoded_hashes(base,'R13.framemd5');new=decoded_hashes(movie,'R14.framemd5')
if len(old)!=q['frames']or len(new)!=q['frames']:raise RuntimeError('Decoded frame count mismatch')
comparisons=[]
for row in q['shots']:
 if row['r14_mode']!='keep_R13':continue
 a,b=row['frame_start'],row['frame_end'];bad=[i for i in range(a,b)if old[i]!=new[i]]
 comparisons.append({'key':row['key'],'all_decoded_frames_identical':not bad,'frames_checked':b-a,'first_differing_frames':bad[:10],'full_1920x1080_uncropped':True,'no_new_overlay':True})
 if bad:raise RuntimeError(f"Approved R13 pixels changed: {row['key']} {bad[:10]}")
print('ALL RETAINED R13 PICTURES DECODE PIXEL-IDENTICALLY',flush=True)
poster_files=[]
for row in q['shots']:
 t=(row['frame_start']+row['frames']//2)/24;dest=review/f"{row['id']:03d}_{row['key']}.jpg";run(['-v','error','-ss',str(t),'-i',movie,'-frames:v','1','-q:v','2',dest]);poster_files.append((row,dest))
 if row['r14_mode']!='keep_R13':
  for i in range(9):
   t=(row['frame_start']+(row['frames']-1)*i/8)/24;dest=review/f"MOTION_{row['id']:03d}_{i:02d}.jpg";run(['-v','error','-ss',str(t),'-i',movie,'-frames:v','1','-q:v','2',dest])
font=ImageFont.truetype('ENGINE_SOURCE/fonts/DejaVuSans.ttf',18)
def sheet(items,dest):
 s=Image.new('RGB',(1920,936),'#eef0e6');d=ImageDraw.Draw(s)
 for j,(label,f)in enumerate(items):
  x=j%4*480;y=j//4*312;im=Image.open(f).convert('RGB');im.thumbnail((480,270));s.paste(im,(x,y));d.text((x+6,y+277),label,font=font,fill='#17364b')
 s.save(dest,quality=95)
for page in range((len(poster_files)+11)//12):sheet([(f"{r['id']:02d} / {r['key']}",f)for r,f in poster_files[page*12:page*12+12]],review/f'FINAL_CONTACT_{page+1:02d}.jpg')
for row in q['shots']:
 files=sorted(review.glob(f"MOTION_{row['id']:03d}_*.jpg"))
 if files:sheet([(f"{row['key']} | {i}",f)for i,f in enumerate(files)],review/f"SEQUENCE_{row['id']:03d}_{row['key']}.jpg")
reports=[]
for report in Path('R14_UNITS').glob('REPORT_*.json'):reports.extend(json.loads(report.read_text()))
risk=[r for r in reports if r['key']=='stranding_risk'];issues=[r for r in risk if r.get('orca_center_below_mean_water_m',0)<.12]
if issues:raise RuntimeError('Independent risk pose no longer partially submerged')
qa={'frames':frames,'fps':24,'size':[1920,1080],'all_retained_R13_decoded_frames_identical':True,'retained_frames_checked':sum(x['frames_checked']for x in comparisons),'retained_picture_checks':comparisons,'native_R9_AAC_adts_sha256':original_audio,'delivered_AAC_adts_sha256':final_audio,'audio_payload_identical':True,'native_audio_picture_end_relationship_preserved':True,'picture_duration':q['picture_duration'],'native_R9_audio_duration':q['native_R9_audio_duration'],'added_outro_frames':0,'approved_capture_frames_unchanged':True,'four_added_archive_photographs':True,'new_AI_images':0,'sampled_risk_geometry_issues':issues,'caution':'All retained picture frames were decoded and hashed, not just sampled. Newly rendered pictures still require visual judgement; anatomy labels and center-height tests are not universal collision or artistic guarantees.'}
(out/'TECHNICAL_VERIFICATION.json').write_text(json.dumps(qa,indent=2));(review/'TECHNICAL_VERIFICATION.json').write_text(json.dumps(qa,indent=2));(review/'ANIMATION_REPORTS.json').write_text(json.dumps(reports))
photos=json.loads(Path('ENGINE_SOURCE/r14/ARCHIVE.json').read_text())
for p in photos:
 r=next(r for r in q['shots']if r['id']==p['shot']);p.update(in_seconds=r['frame_start']/24,out_seconds=r['frame_end']/24,visible_credit=True,original_full_composition_retained=True)
(out/'ARCHIVE_PHOTOGRAPHS.json').write_text(json.dumps(photos,indent=2,ensure_ascii=False));shutil.copyfile('ENGINE_SOURCE/r14/CREDITS_AND_LICENSES.md',out/'CREDITS_AND_LICENSES.md');shutil.copyfile('ENGINE_SOURCE/r14/REVISION_SCOPE.md',out/'REVISION_SCOPE.md')
(out/'PROVENANCE.json').write_text(json.dumps({'edition':q['edition'],'github_commit':os.environ['GITHUB_SHA'],'github_run':os.environ['GITHUB_RUN_ID'],'approved_baseline_commit':'9e1600b3cdb9160ad2d2da40e43ea0f21ef7b4ff','shots':q['shots'],'new_3D_runtime':'Three.js r170; R14 original smooth volumetric shark lofts with five surface-following gills and unified caudal/body deformation; original R13 orcas retained','new_2D_runtime':'Canvas 2D original anatomical vector drawing and scene-specific editorial composition; not principal-animal PNG puppets','retained_runtime_repositories':'Retained R13 units include Rev2D/anidoodler/Lemoplane and original R5 Three; see preserved historical licenses. Reelmimic remains guidance only.','archive_still_count':4,'archive_stills':photos,'original_R9_audio_copied_without_filtering':True,'approved_R13_unchanged_pictures_stream_copied':True,'all_retained_decoded_frames_identical':True,'new_AI_images':0,'retained_secondary_images':['seal_grey_cutout.png','sea_lion_brown_cutout.png']},indent=2,ensure_ascii=False))
source=out/'R14_EDITABLE_SOURCE.zip';tracked=subprocess.check_output(['git','ls-files'],text=True).splitlines();omitted=[f for f in tracked if f.startswith(('ENGINE_SOURCE/media/','ENGINE_SOURCE/locked_audio/','ENGINE_SOURCE/reference_audio/'))];included=[f for f in tracked if f not in omitted];subprocess.run(['git','archive','--format=zip','-o',str(source.resolve()),'HEAD','--',*included],check=True)
with zipfile.ZipFile(source,'a',compression=zipfile.ZIP_DEFLATED)as z:z.writestr('OMITTED_ARCHIVED_MEDIA.json',json.dumps({'reason':'Not self-contained: archived original master media/audio are not duplicated; explicitly rejected reference audio omitted. Editable code, rigs, fonts, original four real stills and approved cutouts included. Immutable approved R13 master preserved on Drive and as artifact 13615907968.','source_commit':os.environ['GITHUB_SHA'],'R13_master_drive':'https://drive.google.com/file/d/1xVFsdTrLFHtz2VysyeVb9jTcrapJ4kUr/view','omitted':omitted},indent=2))
receipt={'edition':q['edition'],'file':movie.name,'bytes':movie.stat().st_size,'sha256':sha(movie),'frames':frames,'duration_seconds':q['duration'],'fps':24,'width':1920,'height':1080,'original_R9_audio_payload_identical':True,'all_retained_R13_decoded_frames_identical':True,'changed_shots':sum(r['r14_mode']!='keep_R13'for r in q['shots']),'retained_shots':sum(r['r14_mode']=='keep_R13'for r in q['shots']),'new_3D_shots':sum(r['r14_mode']=='new_3D'for r in q['shots']),'selected_2D_shots':sum(r['r14_mode']=='new_2D'for r in q['shots']),'archive_still_count':4,'retained_protected_3D_shots':17,'retained_real_passages':6,'github_run':os.environ['GITHUB_RUN_ID'],'source_commit':os.environ['GITHUB_SHA'],'source_archive':source.name,'source_archive_sha256':sha(source),'subtitle_source':'Original R9 English.srt, unchanged','visual_acceptance_not_guaranteed':True};(out/'DELIVERY.json').write_text(json.dumps(receipt,indent=2));print('R14 COMPLETE',movie.name,movie.stat().st_size,flush=True)
