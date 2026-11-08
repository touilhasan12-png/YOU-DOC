"""GitHub-only diagnostic frame extraction; no replacement movie is produced."""
import os,json,subprocess,zipfile,shutil
from pathlib import Path
import requests,imageio_ffmpeg
from PIL import Image,ImageDraw,ImageFont
assert os.environ.get('GITHUB_ACTIONS')=='true'
q=json.loads(Path('ENGINE_SOURCE/r12/REQUEST.json').read_text());out=Path('R13_DIAGNOSIS');out.mkdir(exist_ok=True);tmp=Path(os.environ['RUNNER_TEMP']);ff=imageio_ffmpeg.get_ffmpeg_exe();headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']}
def getmovie(aid,dest):
 r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(aid)+'/zip',headers=headers,stream=True,timeout=180);r.raise_for_status();zpath=tmp/(str(aid)+'.zip')
 with zpath.open('wb')as f:
  for b in r.iter_content(4*1024*1024):f.write(b)
 with zipfile.ZipFile(zpath)as z:
  name=next(n for n in z.namelist()if n.endswith('.mp4'))
  with z.open(name)as src,dest.open('wb')as dst:shutil.copyfileobj(src,dst)
 zpath.unlink()
base=tmp/'R12.mp4';reference=tmp/'R9.mp4';getmovie(13612975727,base);getmovie(13577875516,reference);font=ImageFont.truetype('ENGINE_SOURCE/fonts/DejaVuSans.ttf',19);manifest=[]
keys=['canyon_deck','blue_surface','blue_scale','meal_exclusion','patagonia_pup','patagonia_roll','patagonia_strand','patagonia_grab','patagonia_learning','tide_window','stranding_risk','white_shark','port_starboard','lisbon_context']
for key in keys:
 row=next(r for r in q['shots']if r['key']==key);count=12;times=[(row['frame_start']+(row['frames']-1)*i/(count-1))/24 for i in range(count)]
 if key=='canyon_deck':times=[0,.125,.25,.375,.5,.625,.75,1,1.25,2,5,9]
 sheet=Image.new('RGB',(1920,936),'#f1eee0');draw=ImageDraw.Draw(sheet)
 for i,t in enumerate(times):
  jpg=out/f'{row["id"]:03d}_{key}_{i:02d}.jpg';subprocess.run([ff,'-y','-v','error','-ss',str(t),'-i',str(base),'-frames:v','1','-q:v','2',str(jpg)],check=True);im=Image.open(jpg).convert('RGB');im.thumbnail((480,270));x=i%4*480;y=i//4*312;sheet.paste(im,(x,y));draw.text((x+8,y+277),f'{t:07.3f}s | {key}',font=font,fill='#143749');manifest.append({'key':key,'time':t,'file':jpg.name})
 sheet.save(out/f'SEQUENCE_{row["id"]:03d}_{key}.jpg',quality=96)
 if key in ['canyon_deck','blue_scale','meal_exclusion','patagonia_strand','patagonia_grab','white_shark','lisbon_context']:
  t=(row['frame_start']+row['frames']*.5)/24;jpg=out/f'R9_REFERENCE_{row["id"]:03d}_{key}.jpg';subprocess.run([ff,'-y','-v','error','-ss',str(t),'-i',str(reference),'-frames:v','1','-q:v','2',str(jpg)],check=True)
(out/'TIMES.json').write_text(json.dumps(manifest,indent=2));print('Temporal diagnostics produced',len(manifest),'R12 frames and seven native R9 comparisons')
