"""Explicit real-Three.js native-unit contract. No media work outside GitHub."""
from pathlib import Path
import hashlib,json,math,os,argparse,subprocess
P=Path(__file__).resolve().parents[1]
KEYS={'rudder_detaches','hypothesis_play','hypothesis_imitation','boat_option','helm_response','human_not_target','yacht_stern','diver_entanglement','surfer_incident','swim_comparison'}
SOURCES=['three_engine/scene.js','three_engine/render.mjs','three_engine/web/index.html','three_engine/package.json','production/three_native.py','fonts/BarlowCondensed-SemiBold.ttf','fonts/SourceSans3[wght].ttf']
def fingerprint(s):
 h=hashlib.sha256(b'three-webgl-native-v1-continuous-articulated-metres')
 for n in SOURCES:h.update(n.encode());h.update((P/n).read_bytes())
 h.update(json.dumps({k:s[k] for k in ['key','start','end']},sort_keys=True).encode());return h.hexdigest()
if __name__=='__main__':
 assert os.environ.get('GITHUB_ACTIONS')=='true','Every frame must render on GitHub Actions'
 ap=argparse.ArgumentParser();ap.add_argument('mode',choices=['proof','native']);ap.add_argument('--shard',type=int,default=0);ap.add_argument('--shards',type=int,default=5);args=ap.parse_args()
 plan=json.loads((P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text());selected=[s for s in plan if s['key'] in KEYS][args.shard::args.shards]
 task=[]
 for s in selected:
  a=math.ceil(s['start']*24-1e-7);b=min(15969,math.ceil(s['end']*24-1e-7));task.append({**s,'frame_start':a,'encoded_frames':b-a,'fingerprint':fingerprint(s)})
 q=P/'qa/three';q.mkdir(parents=True,exist_ok=True);t=q/f'tasks_{args.shard}.json';t.write_text(json.dumps(task))
 import imageio_ffmpeg
 env=dict(os.environ,FFMPEG_EXE=imageio_ffmpeg.get_ffmpeg_exe())
 subprocess.run(['node',str(P/'three_engine/render.mjs'),args.mode,str(t)],env=env,check=True)
 if args.mode=='native':
  import av
  from resource_guard import save_unit_receipt
  for s in selected:
   a=math.ceil(s['start']*24-1e-7);b=min(15969,math.ceil(s['end']*24-1e-7));file=P/f"picture_units/unit_{s['id']-1:03d}_{s['key']}.mp4"
   with av.open(str(file)) as c:
    v=c.streams.video[0];assert (v.width,v.height,float(v.average_rate),v.frames)==(1920,1080,24.,b-a)
   subprocess.run([env['FFMPEG_EXE'],'-v','error','-threads','1','-i',str(file),'-f','null','-'],check=True)
   r=save_unit_receipt(file,s['id'],b-a,a);r.update({'key':s['key'],'render_dependency_sha256':fingerprint(s),'full_decode':'PASS','engine':'Three.js r170 / Chromium WebGL2','fingerprint_scheme':'actual Three.js scene, renderer, dependencies, fonts and exact per-scene timing','stage':'native continuous motion; not an automated artistic approval'})
   (P/'qa/unit_receipts'/f"{s['id']}.json").write_text(json.dumps(r,indent=2))
 # Contact sheets are derived from the actual remote WebGL captures, never generated locally.
 from PIL import Image,ImageDraw
 for s in selected:
  paths=sorted(q.glob(s['key']+'_sample_*.png'));sheet=Image.new('RGB',(1920,766),'#1c424f');d=ImageDraw.Draw(sheet)
  for j,p in enumerate(paths):
   with Image.open(p) as im:im=im.resize((640,360));sheet.paste(im,(j%3*640,j//3*383+23));d.text((j%3*640+8,j//3*383+5),p.stem,fill='white')
  sheet.save(q/(s['key']+'_CONTACT.jpg'),quality=95)
