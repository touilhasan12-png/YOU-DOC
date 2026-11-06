"""Resumable native picture units; explicit scenes only. Drafts are NOT artistic approval.
The user-approved final tempo correction is read from derived timing; canonical script/master stay intact.
"""
import os
assert os.environ.get('GITHUB_ACTIONS')=='true','Rendering is permitted only on GitHub Actions'
from pathlib import Path
import argparse,json,math,hashlib,subprocess,time,gc,ctypes
import av,imageio_ffmpeg,cv2
import story_scenes as scenes
from compositor import CACHE,FPS,W,H
from resource_guard import HeavyWork,save_unit_receipt
P=Path(__file__).resolve().parents[1];FF=imageio_ffmpeg.get_ffmpeg_exe();OUT=P/'picture_units';OUT.mkdir(exist_ok=True);SAMPLE=P/'qa/native_units_current';SAMPLE.mkdir(exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--through',type=int,default=27);parser.add_argument('--with-ending',action='store_true');parser.add_argument('--ending-first',action='store_true');parser.add_argument('--keys',default='');args=parser.parse_args();plan=scenes.PLAN
MAXFRAMES=json.loads((P/'audio_revision_ending/ENDING_REVISION.json').read_text())['new_video_frames']

def fingerprint(s):
 h=hashlib.sha256();h.update(b'new-native-CRF17-scene-family-dependency-v2')
 for n in scenes.dependencies(s['key']):h.update(n.encode());h.update((P/'production'/n).read_bytes())
 for f in sorted((P/'references/accepted').glob('*.svg')):h.update(f.read_bytes())
 h.update(json.dumps({k:s[k] for k in ['key','start','end']},sort_keys=True).encode())
 return h.hexdigest()

def current(s):
 receipt=P/'qa/unit_receipts'/f"{s['id']}.json"
 if not receipt.exists() or s['key'] not in scenes.IMPLEMENTED:return None
 r=json.loads(receipt.read_text());f=P/r['file'];a=math.ceil(s['start']*24-1e-7);b=min(MAXFRAMES,math.ceil(s['end']*24-1e-7))
 if r.get('render_dependency_sha256')!=fingerprint(s) or r['encoded_frames']!=b-a or not f.exists():return None
 if hashlib.sha256(f.read_bytes()).hexdigest()!=r['sha256']:return None
 return r

def progress():
 rows=[];contig=0;end=0
 for s in plan:
  r=current(s)
  if r:rows.append(r)
  if len(rows)==contig+1 and r and s['id']==contig+1:contig+=1;end=s['end']
 (P/'qa/PICTURE_PROGRESS.json').write_text(json.dumps({'planned_shots':len(plan),'implemented_scene_keys':len(scenes.IMPLEMENTED),'current_source_verified_native_units':len(rows),'contiguous_prefix_units':contig,'covered_narration_to_seconds':end,'frames_stored_current_sources':sum(x['encoded_frames'] for x in rows),'new_full_video_frames_required':MAXFRAMES,'all_stored_units_full_decode_pass':all(x['full_decode']=='PASS' for x in rows),'final_film_complete':False,'original_audio_master_unchanged':True,'effective_audio':'audio_revision_ending/full_mix_normal_ending.m4a','spoken_script_verbatim':True,'no_next_video_frame':True,'remaining_unauthored_shots':len(plan)-len(scenes.IMPLEMENTED),'units':rows},indent=2))

assert 1<=args.through<=len(plan)
if args.keys:chosen=[s for s in plan if s['key'] in args.keys.split(',')]
else:chosen=plan[:args.through]
ending=[s for s in plan if s['key'] in {'opinion_release','natural_outro'}]
if args.with_ending:
 chosen=([s for s in ending if s not in chosen]+chosen) if args.ending_first else (chosen+[s for s in ending if s not in chosen])
beg=time.time()
with HeavyWork() as guard:
 for s in chosen:
  i=plan.index(s);assert s['key'] in scenes.IMPLEMENTED,'No authored scene yet: '+s['key']
  a=math.ceil(s['start']*24-1e-7);b=min(MAXFRAMES,math.ceil(s['end']*24-1e-7));N=b-a;dest=OUT/f"unit_{i:03d}_{s['key']}.mp4";receipt=P/'qa/unit_receipts'/f"{s['id']}.json"
  if current(s):print('Already verified',s['id'],s['key'],flush=True);continue
  CACHE.encoded.clear();CACHE.decoded.clear();CACHE.bytes=0
  # Return completed large-array arenas and decoder buffers to the OS, rather than lowering native quality.
  if 'im' in locals():im=None
  if s['key'] not in {'wild_human','decision_gaze','scarcity_habitat','opinion_release','natural_outro'}:
   stock=scenes.hardware.STOCK
   if stock.c is not None:stock.gen=None;stock.current=None;stock.c.close();stock.c=None;stock.last=-10
  if s['key'] not in {'wild_record','vulnerability'} and hasattr(scenes,'humans'):
   ft=scenes.humans.FOOT
   if ft.c is not None:ft.gen=None;ft.image=None;ft.c.close();ft.c=None;ft.last=-1
  if hasattr(scenes,'humans'):
   scenes.humans.vessel_sprite.cache_clear();scenes.humans.yacht_sprite.cache_clear();scenes.humans.swimmer_sprite.cache_clear()
  scenes.opening.rig.model.cache_clear();gc.collect()
  try:ctypes.CDLL('libc.so.6').malloc_trim(0)
  except OSError:pass
  state=guard.check(200*1024**2);code=fingerprint(s);tmp=dest.with_name('pending_'+dest.name)
  (P/'qa/LAST_NATIVE_RESOURCE_STATE.json').write_text(json.dumps({'next_shot':s['key'],'after_actual_cache_decoder_release_and_heap_trim':state,'predicted_encoder_addition_bytes':200*1024**2},indent=2))
  p=subprocess.Popen([FF,'-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s','1920x1080','-r','24','-i','-','-an','-c:v','libx264','-preset','fast','-crf','17','-rc-lookahead','8','-threads','1','-bf','2','-refs','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-frames:v',str(N),str(tmp)],stdin=subprocess.PIPE)
  try:
   for k in range(N):
    im=scenes.frame(s,(a+k)/24);p.stdin.write(im.tobytes())
    if k in [0,N//2,N-1]:cv2.imwrite(str(SAMPLE/f"{i:03d}_{s['key']}_{k:04d}.jpg"),cv2.resize(im,(960,540)),[cv2.IMWRITE_JPEG_QUALITY,88])
   p.stdin.close();assert p.wait()==0
  except BaseException:p.kill();p.wait();raise
  with av.open(str(tmp)) as c:assert c.streams.video[0].frames==N and c.streams.video[0].width==1920 and c.streams.video[0].height==1080
  r=subprocess.run([FF,'-hide_banner','-threads','1','-i',str(tmp),'-f','null','-'],capture_output=True,text=True);assert r.returncode==0
  log=P/'qa/unit_receipts';log.mkdir(exist_ok=True);(log/(str(s['id'])+'_decode.log')).write_text(r.stderr);tmp.replace(dest)
  row=save_unit_receipt(dest,s['id'],N,a);row.update({'key':s['key'],'render_dependency_sha256':code,'fingerprint_scheme':'scene-family source dependencies + individual key/start/end; changing a different scene family does not invalidate reviewed pixels','full_decode':'PASS','stage':'NEW VISUAL DRAFT — continuous motion / final art review still required','audio':'picture only; final mux must use user-authorized normal-paced ending derivative'});receipt.write_text(json.dumps(row,indent=2))
  progress();print('NATIVE UNIT STORED',s['id'],s['key'],N,'frames; elapsed',round(time.time()-beg,1),'s',flush=True)
print('Requested authored native units actually stored and decoded. No complete replacement film is implied.',flush=True)
