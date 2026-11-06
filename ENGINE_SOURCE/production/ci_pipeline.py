"""GitHub-only rendering/test entrypoint. No local render and no automatic art-approval forgery."""
import os,sys,json,math,hashlib,subprocess,argparse
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true','All picture/audio rendering must run on GitHub Actions, never locally'
P=Path(__file__).resolve().parents[1];os.chdir(P)
for d in ['qa/unit_receipts','qa/native_units_current','picture_units','audio_revision_ending','delivery']:(P/d).mkdir(parents=True,exist_ok=True)
import numpy as np,cv2,av,imageio_ffmpeg
import story_scenes as scenes
import revision_geometry as g
FF=imageio_ffmpeg.get_ffmpeg_exe()

def tests():
 import people_boats as people
 assert len(scenes.PLAN)==93 and {s['key'] for s in scenes.PLAN}==scenes.IMPLEMENTED
 assert hashlib.sha256((P/'script_original.txt').read_bytes()).hexdigest()=='af5f03682a9d6fe4c53393a806e2dbb35e51ae2818de102efc42ef242be70eb9'
 for t in np.linspace(0,5,61):
  ice,seal,whales=g.wave_actors(t)
  if t>3.7:assert not g.overlap(ice,seal),'Wave seal/ice collision'
  for j,a in enumerate(whales):
   assert not g.overlap(a,ice),'Wave orca/ice collision'
   for b in whales[j+1:]:assert not g.overlap(a,b),'Wave orca/orca collision'
  ice,seal,whale=g.denial_actors(t);assert not g.overlap(ice,seal) and not g.overlap(ice,whale),'Tail-strike ice collision'
  ice,seal,pred=g.capture_actors(t);assert not g.overlap(ice,seal) and not g.overlap(ice,pred),'Capture ice collision'
 for imitation in [False,True]:
  for t in np.linspace(0,11.8,120):
   meshes,_=g.play_actors(t,imitation);assert not g.overlap(meshes[-1],meshes[-2]),'Orca/orca penetration'
 from investigation_scenes import relay_actors
 for t in np.linspace(0,11.06,80):
  animals=relay_actors(t)[1:]
  for j,a in enumerate(animals):
   for b in animals[j+1:]:assert not g.overlap(a,b),'Relay orca/orca collision'
 for t in np.linspace(0,6.28,32):
  svg,meta=people.whaleboat(t)
  assert svg.count('data-limb="left-arm"')==3 and svg.count('data-limb="right-arm"')==3
  for person in meta['people']:
   assert all(name in person for name in ['left_elbow','right_elbow','left_hand','right_hand'])
   assert np.linalg.norm(np.array(person['left_hand'])-person['right_hand'])>8,'Merged grips'
 assert abs(g.ROOT[0]-(340-875)/110)<1e-10 and g.ROOT[2]>.4
 out={'source_commit':os.environ.get('GITHUB_SHA'),'coverage':93,'canonical_words':1730,'solid_ice_motion_samples':61,'play_collision_samples':240,'rower_pose_samples':32,'arm_presence':'two complete arm groups per rower','rudder_stock_matches_yacht_origin':True,'status':'PASS; geometry/static tests only, not a claim of visual or listening acceptance'}
 (P/'qa/GEOMETRY_TESTS.json').write_text(json.dumps(out,indent=2));print(json.dumps(out),flush=True)

def writevideo(s,path,seconds=5):
 a=math.ceil(s['start']*24);N=min(math.ceil(s['duration']*24),round(seconds*24));p=subprocess.Popen([FF,'-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s','1920x1080','-r','24','-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-threads','2','-pix_fmt','yuv420p',str(path)],stdin=subprocess.PIPE)
 try:
  for k in range(N):p.stdin.write(scenes.frame(s,(a+k)/24).tobytes())
  p.stdin.close();assert p.wait()==0
 except BaseException:p.kill();p.wait();raise

def proof(shard):
 tests();q=P/'qa/proof';q.mkdir(exist_ok=True)
 critical={'seven_formation','blue_relays','ice_option','power_option','worn_teeth','floe_wave','floe_denial','seal_capture','whaler_view','diver_entanglement','yacht_stern','rudder_detaches','hypothesis_play','hypothesis_imitation','helm_response','interaction_counts','open_water_pov','plans_final'}
 for s in scenes.PLAN[shard::3]:
  for frac in ([.12,.45,.78] if s['key'] in critical else [.5]):
   im=scenes.frame(s,s['start']+s['duration']*frac);cv2.imwrite(str(q/f"{s['id']:02d}_{s['key']}_{frac}.jpg"),im,[cv2.IMWRITE_JPEG_QUALITY,92])
  if s['key'] in critical:writevideo(s,q/(s['key']+'.mp4'),seconds=min(8,s['duration']))
  print('REMOTE PROOF',s['id'],s['key'],flush=True)


def shard(n):
 tests();keys=','.join(s['key'] for s in scenes.PLAN[n::12]);subprocess.run([sys.executable,str(P/'production/render_picture_units.py'),'--keys',keys],check=True)


def candidate():
 from assemble_finished_film import verify_all,digest
 rows,h=verify_all(require_art_review=False);listing=P/'qa/candidate_concat.ffconcat'
 listing.write_text('ffconcat version 1.0\n'+''.join("file '"+str((P/r['file']).resolve())+"'\nduration "+format(r['encoded_frames']/24,'.12f')+'\n' for r in rows))
 output=P/'delivery/Something_That_Plans_REVISION2_CANDIDATE.mp4'
 subprocess.run([FF,'-v','warning','-y','-safe','0','-f','concat','-i',str(listing),'-i',str(P/'audio_revision_ending/full_mix_normal_ending.m4a'),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(output)],check=True)
 with av.open(str(output)) as c:
  st=c.streams.video[0];pts=sorted(p.pts for p in c.demux(st) if p.pts is not None and p.size)
  assert len(pts)==15969 and all(abs(float(p*st.time_base)-i/24)<1e-5 for i,p in enumerate(pts))
 subprocess.run([FF,'-v','error','-threads','2','-i',str(output),'-f','null','-'],check=True)
 report={'source_commit':os.environ.get('GITHUB_SHA'),'film_source_sha256':h,'file':output.name,'bytes':output.stat().st_size,'sha256':digest(output),'frames':15969,'all_native_units':93,'full_decode':'PASS','status':'CANDIDATE: awaits actual visual and audio review; not automatically declared final','local_render':False}
 (P/'delivery/CANDIDATE_RECEIPT.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
 # Native review sheets come from the actual encoded units, never simulated stills alone.
 from PIL import Image,ImageDraw
 sheet_items=[]
 for r in rows:
  wanted={0,r['encoded_frames']//3,2*r['encoded_frames']//3,r['encoded_frames']-1}
  with av.open(str(P/r['file'])) as c:
   c.streams.video[0].codec_context.thread_count=1
   for n,fr in enumerate(c.decode(video=0)):
    if n in wanted:sheet_items.append((fr.reformat(width=384,height=216).to_image(),r['key'],n))
 for b in range(0,len(sheet_items),24):
  group=sheet_items[b:b+24];im=Image.new('RGB',(1536,238*((len(group)+3)//4)),'#193a47');d=ImageDraw.Draw(im)
  for j,(pic,k,n) in enumerate(group):x=j%4*384;y=j//4*238;im.paste(pic,(x,y+22));d.text((x+5,y+4),k+' '+str(n),fill='white')
  im.save(P/f'delivery/REVIEW_{b//24:02d}.jpg',quality=94)

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('mode',choices=['tests','audio','proof','shard','candidate']);ap.add_argument('--shard',type=int,default=0);args=ap.parse_args()
 if args.mode=='audio':
  from repair_ending_v2 import repair
  print(json.dumps(repair(),indent=2))
 elif args.mode=='tests':tests()
 elif args.mode=='proof':proof(args.shard)
 elif args.mode=='shard':shard(args.shard)
 else:candidate()
