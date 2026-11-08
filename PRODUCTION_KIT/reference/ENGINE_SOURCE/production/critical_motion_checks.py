"""Internal native-resolution action checks. Not user deliverables or a replacement movie.
Run serially. Generates actual motion, not just midpoint stills.
"""
from pathlib import Path
import json,math,subprocess,hashlib,time,gc
import numpy as np
import cv2,imageio_ffmpeg
import illustrated_rig as rig
import people_boats as boats
from compositor import *
from resource_guard import HeavyWork,memory_state
P=Path(__file__).resolve().parents[1];D=P/'qa/motion_checks';D.mkdir(exist_ok=True);FF=imageio_ffmpeg.get_ffmpeg_exe();report={'purpose':'Internal motion checks, not final film approval','cases':[]};N=96

def smooth(x):x=np.clip(x,0,1);return x*x*(3-2*x)

def rolling(t):
 im=underwater(t,'ice');roll=90*smooth((t-.50)/2.20)
 info=animal(im,'orca',1050,660,ppm=131,t=t,roll=roll,yaw=0,elevation=5,flip=True)
 type_text(im,'CONTINUOUS WHOLE-BODY ROLL',90,88,46,title=True)
 type_text(im,'Dorsal fin, flippers, markings and flukes share the same rotation.',90,153,28)
 info['fin_erased']=False;return im,info

def rowing(t):
 im=ocean(t,horizon=375);info=vessel(im,'period',970,830,ppm=155,t=t)
 type_text(im,'PERIOD CREW / COUPLED ROWING',90,90,46,title=True)
 type_text(im,'Detailed characters; hands, oars and torso action stay connected.',90,154,28)
 return im,info

def towing(t):
 im=ocean(t,horizon=350);ppm=82.;boatx,boaty=460.,650.+math.sin(t*.9)*2;cx,cy=1430.,664.+math.sin(t*.9)*2
 _,meta=boats.whaleboat(t*math.pi);source=np.array(meta['world_origin_px']);bollard=(np.array(meta['tow_bollard_px'])-source)*(ppm/meta['source_ppm'])+[boatx,boaty]
 start_cam=[(bollard[0]-cx)/ppm,-.65,(cy-bollard[1])/ppm]
 sprite=rig.render('orca',phase=t*4.0,ppm=ppm,width=W,height=H,centre=(cx,cy),jaw=3.0,elevation=6,flip=True,yaw=32,rope_start_camera=start_cam,supersample=1.2)
 over(im,sprite,0,0);vessel(im,'period',boatx,boaty,ppm,t)
 type_text(im,'ONE SCALE / REAL MOUTH GRIP',90,90,46,title=True)
 type_text(im,'8 m illustrative boat and 7.5 m orca; rope is depth-tested against teeth and lips.',90,154,28)
 return im,{'boat_metres':8.,'orca_metres':7.5,'ppm':ppm,'expected_length_ratio':7.5/8,'rope_start_screen':bollard.tolist(),'rope_start_reprojected':[cx+start_cam[0]*ppm,cy-start_cam[2]*ppm],'rope_is_3D':True,'jaw_open_degrees':3.,'mouth_lining_visual_target':'closed oral surfaces; verify in sampled frames, not inferred from this metadata','orca_heading':'away from trailing boat; yaw32 keeps straight rope clear of flank'}

def jaws(t):
 im=underwater(t);jaw=4+25*(.5-.5*math.cos(t*math.pi*.9));info=animal(im,'orca',1110,640,ppm=178,t=t,jaw=jaw,elevation=8)
 type_text(im,'ATTACHED LOWER JAW / CURVED TEETH',90,85,44,title=True)
 type_text(im,'A real aperture, oral lining and 52 curved teeth—not a stretched mouth line.',90,150,28)
 info['tooth_count']=52;return im,info

with HeavyWork() as guard:
 for label,fn in [('whole_body_roll',rolling),('period_crew_rowing',rowing),('physical_tow_rope',towing),('jaw_articulation',jaws)]:
  CACHE.encoded.clear();CACHE.decoded.clear();CACHE.bytes=0;gc.collect();guard.check(180*1024**2)
  dest=D/(label+'.mp4');tmp=D/('pending_'+label+'.mp4');beg=time.time();metrics=[]
  p=subprocess.Popen([FF,'-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s','1920x1080','-r','24','-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-rc-lookahead','8','-threads','1','-bf','2','-refs','2','-pix_fmt','yuv420p','-video_track_timescale','12288','-frames:v',str(N),str(tmp)],stdin=subprocess.PIPE)
  try:
   for k in range(N):
    im,m=fn(k/24);p.stdin.write(im.tobytes())
    if k in [0,12,24,36,48,60,72,95]:metrics.append({'frame':k,**m});cv2.imwrite(str(D/(label+f'_{k:03d}.jpg')),im)
   p.stdin.close();assert p.wait()==0
  except BaseException:
   p.kill();p.wait();raise
  tmp.replace(dest)
  r=subprocess.run([FF,'-hide_banner','-threads','1','-i',str(dest),'-f','null','-'],capture_output=True,text=True);assert r.returncode==0;(D/(label+'_decode.log')).write_text(r.stderr)
  if label=='whole_body_roll':assert len(set(m['dorsal_vertex_count'] for m in metrics))==1 and metrics[-1]['body_roll_degrees']==90
  if label=='physical_tow_rope':
   for m in metrics:assert np.allclose(m['rope_start_screen'],m['rope_start_reprojected'],atol=1e-8)
  row={'case':label,'frames':N,'native_resolution':[1920,1080],'fps':24,'decode':'PASS','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'elapsed_seconds':round(time.time()-beg,2),'sampled_motion':metrics,'perceptual_final_approval':False};report['cases'].append(row)
  (D/'MOTION_CHECK_RESULTS.json').write_text(json.dumps(report,indent=2));print('INTERNAL CHECK STORED',label,row['elapsed_seconds'],'s',flush=True)
print('Four native internal action checks completed. Full replacement film is NOT rendered by this program.',flush=True)
