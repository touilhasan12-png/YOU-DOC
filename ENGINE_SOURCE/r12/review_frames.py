"""GitHub-only frame extraction for the user-authorized visual analysis."""
import os,json,subprocess,zipfile,shutil
from pathlib import Path
import requests,imageio_ffmpeg
from PIL import Image,ImageDraw,ImageFont
assert os.environ.get('GITHUB_ACTIONS')=='true'
q=json.loads(Path('ENGINE_SOURCE/r12/REQUEST.json').read_text());out=Path('R12_REVIEW');out.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe();temp=Path(os.environ['RUNNER_TEMP']);zpath=temp/'r9.zip'
r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['base_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},stream=True,timeout=180);r.raise_for_status()
with zpath.open('wb')as f:
 for b in r.iter_content(4*1024*1024):f.write(b)
base=temp/'R9.mp4'
with zipfile.ZipFile(zpath)as z:
 with z.open(q['base_member'])as src,base.open('wb')as dst:shutil.copyfileobj(src,dst)
for row in q['shots']:
 if row['mode']=='R12_new_animation':continue
 for i,fraction in enumerate([.12,.5,.88]):
  t=row['frame_start']/24+row['frames']/24*fraction;dest=out/f"{row['id']:03d}_{row['key']}_{i}.jpg"
  subprocess.run([ff,'-y','-v','error','-ss',str(t),'-i',str(base),'-frames:v','1','-q:v','2',str(dest)],check=True)
posters=[]
for row in q['shots']:
 f=out/f"{row['id']:03d}_{row['key']}_1.jpg"
 if f.exists():posters.append((row,f))
font=ImageFont.truetype('ENGINE_SOURCE/fonts/DejaVuSans.ttf',18)
for page in range((len(posters)+11)//12):
 sheet=Image.new('RGB',(1920,936),'#eef0e6');d=ImageDraw.Draw(sheet)
 for j,(row,f)in enumerate(posters[page*12:page*12+12]):
  x=j%4*480;y=j//4*312;im=Image.open(f).convert('RGB');im.thumbnail((480,270));sheet.paste(im,(x,y));d.text((x+6,y+277),f"{row['id']:02d} / {row['key']}",font=font,fill='#17364b')
 sheet.save(out/f'CONTACT_{page+1:02d}.jpg',quality=95)
reports=json.loads((out/'layout_report_proof.json').read_text());issues=[r for r in reports if r['collisions']or r['clipped']]
(out/'LAYOUT_SUMMARY.json').write_text(json.dumps({'sampled_new_animation_frames':len(reports),'sampled_R9_retained_frames':69,'frames_with_conservative_bbox_issues':issues,'visual_review_is_not_automatic_acceptance':True},indent=2))
print('ANALYSIS FRAMES READY',len(reports),len(issues),flush=True)
