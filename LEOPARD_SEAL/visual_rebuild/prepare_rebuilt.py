from pathlib import Path
import os,json,hashlib,subprocess,shutil,sys,wave
assert os.environ.get('GITHUB_ACTIONS')=='true'
import imageio_ffmpeg
R=Path(__file__).resolve().parents[1];D=R/'visual_rebuild';O=R/'generated/rebuilt-input';O.mkdir(parents=True,exist_ok=True);section=int(sys.argv[1]);F=imageio_ffmpeg.get_ffmpeg_exe();plan=json.loads((D/'FILM_PLAN_APPROVED.json').read_text());assert plan['total_frames']==15624 and abs(plan['duration']-651)<1e-7 and hashlib.sha256((R/'SCRIPT_ORIGINAL.txt').read_bytes()).hexdigest()==plan['script_sha256']
archive=R/'generated/real-camera-source';m=json.loads((archive/'REAL_MEDIA_EDIT_RECEIPT.json').read_text());assert m['cloud_run_id']=='42514710258';index={}
for cut in m['real_video_cuts']:
 p=archive/cut['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==cut['sha256'];id=cut['id'];wanted=section==0 or section==3 and id!='CUT01_ICE_EDGE' or section==4 and id=='CUT01_ICE_EDGE'
 if wanted:
  out=O/'frames'/id;out.mkdir(parents=True,exist_ok=True);subprocess.run([F,'-y','-v','error','-i',str(p),'-map','0:v:0','-an','-fps_mode','passthrough','-threads','2','-start_number','0',str(out/'%05d.png')],check=True);assert len(list(out.glob('*.png')))==cut['frames']
 index[id]={'frames':cut['frames'],'height':cut['crop'][1],'short':'PLOS 2012'if cut['source']=='V02'else 'CRITTERCAM 2013–2014','credit':'Watanabe, Sato and Ponganis / CC BY 2.5'if cut['source']=='V02'else 'Krause et al. 2015 / CC BY 4.0','context':'Emperor-penguin research / not Adélie-specific'if cut['source']=='V02'else 'Actual animal-borne camera / not the Nicklen encounter'}
(O/'media-index.json').write_text(json.dumps(index));audio=[]
for c in plan['chapters']:
 f=R/c['audio_file']
 with wave.open(str(f),'rb')as w:duration=w.getnframes()/w.getframerate()
 assert duration<=c['duration']+.0001;audio.append({'chapter':c['section'],'file':c['audio_file'],'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'native_duration':duration,'timeline_duration':c['duration']})
(O/'AUDIO_IMMUTABILITY_LOCK.json').write_text(json.dumps(audio,indent=2));print('APPROVED651s /15624frames / unchanged10voice sources / actual source movie assets prepared',section)
