"""Strict final assembler: no holes, no repeated-filler fallback, no premature 'final'.
Run only after all 93 current picture units and the source-specific internal quality report exist.
The final encode is a lossless stream copy of native picture units and the authorized audio derivative.
"""
from pathlib import Path
import argparse,json,hashlib,math,subprocess
import av,imageio_ffmpeg
import story_scenes as scenes
P=Path(__file__).resolve().parents[1]
FF=imageio_ffmpeg.get_ffmpeg_exe()

def digest(path,kind='sha256'):
 h=hashlib.new(kind)
 with Path(path).open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()

def fingerprint(s):
 from three_native import KEYS as THREE_KEYS,fingerprint as three_fingerprint
 if s['key'] in THREE_KEYS:return three_fingerprint(s)
 h=hashlib.sha256();h.update(b'new-native-CRF17-scene-family-dependency-v2')
 for n in scenes.dependencies(s['key']):h.update(n.encode());h.update((P/'production'/n).read_bytes())
 for f in sorted((P/'references/accepted').glob('*.svg')):h.update(f.read_bytes())
 h.update(json.dumps({k:s[k] for k in ['key','start','end']},sort_keys=True).encode());return h.hexdigest()

def verify_all(require_art_review=True):
 assert digest(P/'script_original.txt')=='af5f03682a9d6fe4c53393a806e2dbb35e51ae2818de102efc42ef242be70eb9','Canonical script changed'
 assert digest(P/'locked_audio/approved_master.m4a','md5')=='2ea20c57c19ad6298c0fc35171ca5a55','Immutable original master changed'
 audio_manifest=json.loads((P/'audio_revision_ending/ENDING_REVISION.json').read_text());assert audio_manifest['pipeline'].startswith('untouched original master -> two time-domain WSOLA stages');assert digest(P/'audio_revision_ending/full_mix_normal_ending.m4a')==audio_manifest['sha256'],'Unexpected audio derivative'
 plan=scenes.PLAN;N=15969;cursor=0;rows=[];errors=[]
 assert len(plan)==93,'Canonical 93-scene coverage plan changed'
 for s in plan:
  a=math.ceil(s['start']*24-1e-7);b=min(N,math.ceil(s['end']*24-1e-7));rpath=P/'qa/unit_receipts'/f"{s['id']}.json"
  if a!=cursor:errors.append(f"Timeline gap/overlap before {s['key']}: {cursor} vs {a}")
  cursor=b
  if s['key'] not in scenes.IMPLEMENTED:errors.append('Unauthored: '+s['key']);continue
  if not rpath.exists():errors.append('Native receipt missing: '+s['key']);continue
  r=json.loads(rpath.read_text());f=P/r['file']
  if r.get('render_dependency_sha256')!=fingerprint(s):errors.append('Stale pixels: '+s['key']);continue
  if not f.exists():errors.append('Restore verified archived native unit before assembly: '+str(f));continue
  if r['encoded_frames']!=b-a or r['frame_start']!=a or r.get('full_decode')!='PASS':errors.append('Timing/decode mismatch: '+s['key']);continue
  if digest(f)!=r['sha256']:errors.append('File SHA mismatch: '+s['key']);continue
  with av.open(str(f)) as c:
   v=c.streams.video[0]
   if (v.width,v.height,float(v.average_rate),v.frames)!=(1920,1080,24.0,b-a):errors.append('Native media mismatch: '+s['key']);continue
  rows.append(r)
 assert cursor==N,'Frame total changed'
 if errors:raise RuntimeError('NO FINAL FILM ASSEMBLED. Missing/invalid coverage:\n'+'\n'.join(errors))
 assert sum(r['encoded_frames'] for r in rows)==N and len(rows)==93
 film_source_hash=hashlib.sha256(''.join(r['render_dependency_sha256']+r['sha256'] for r in rows).encode()).hexdigest()
 if require_art_review:
  q=P/'qa/FINAL_INTERNAL_REVIEW.json'
  assert q.exists(),'Internal whole-film review has not been completed; decode receipts are not art approval'
  review=json.loads(q.read_text());assert review['reviewed_current_film_source_sha256']==film_source_hash,'Review is not for these pixels'
  checks=['anatomy_scale_and_contact','continuous_motion_and_exact_sync','ending_voice_and_fade','boats_people_quality','typography_legibility','explicit_nonspoken_spanish_safety_correction','footage_licenses_and_credits','verbatim_words_and_no_end_screen_ui']
  assert all(review.get(k)=='PASS' for k in checks),'Final internal quality gates are not all PASS'
 return rows,film_source_hash

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--check-only',action='store_true');parser.add_argument('--output',default=str(P/'Something_That_Plans_NEW_VISUAL_REBUILD.mp4'));a=parser.parse_args()
 rows,h=verify_all(require_art_review=True)
 if a.check_only:print('ALL 93 current scenes and source-specific quality gates verified');raise SystemExit(0)
 output=Path(a.output);output.parent.mkdir(exist_ok=True,parents=True);pending=output.with_name('pending_'+output.name);listing=P/'qa/final_concat.ffconcat'
 listing.write_text('ffconcat version 1.0\n'+''.join("file '"+str((P/r['file']).resolve()).replace("'","'\\''")+"'\nduration "+format(r['encoded_frames']/24,'.12f')+"\n" for r in rows))
 subprocess.run([FF,'-y','-v','warning','-threads','1','-safe','0','-f','concat','-i',str(listing),'-i',str(P/'audio_revision_ending/full_mix_normal_ending.m4a'),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart','-metadata','title=Something That Plans',str(pending)],check=True)
 with av.open(str(pending)) as c:
  v=c.streams.video[0];assert v.frames==15969 and (v.width,v.height)==(1920,1080);assert len(c.streams.audio)==1
  clock=v.time_base;pts=sorted(packet.pts for packet in c.demux(v) if packet.pts is not None and packet.size)
  assert len(pts)==15969 and all(abs(float(p*clock)-i/24)<1e-5 for i,p in enumerate(pts)), 'Final packet clock drift/gap/duplication'
 def audio_payload(path):
  ah=hashlib.sha256();count=0
  with av.open(str(path)) as ac:
   for packet in ac.demux(audio=0):
    if packet.size:ah.update(bytes(packet));count+=1
  return ah.hexdigest(),count
 source_audio=audio_payload(P/'audio_revision_ending/full_mix_normal_ending.m4a');final_audio=audio_payload(pending)
 assert source_audio==final_audio,'AAC payload changed during final assembly'
 decode=subprocess.run([FF,'-hide_banner','-threads','1','-i',str(pending),'-f','null','-'],capture_output=True,text=True);(P/'qa/FINAL_FULL_DECODE.log').write_text(decode.stderr);assert decode.returncode==0
 pending.replace(output);report={'file':str(output),'bytes':output.stat().st_size,'sha256':digest(output),'frames':15969,'fps':24,'source_film_sha256':h,'native_units':93,'full_decode':'PASS','quality_review_source_specific':'PASS','canonical_script_verbatim':True,'original_master_preserved':True,'authorized_ending_derivative':True,'no_graphical_next_video_ui':True,'final_film_complete':True,'packet_clock':'every native frame at exact 24fps; explicit concat durations prevent MP4 header rounding drift','aac_payload_sha256':source_audio[0],'aac_payload_identical_to_authorized_derivative':True};(P/'qa/FINAL_DELIVERY_RECEIPT.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
