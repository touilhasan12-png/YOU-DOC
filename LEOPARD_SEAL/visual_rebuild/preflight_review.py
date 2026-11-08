from pathlib import Path
import os,json,subprocess,re
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg
assert os.environ.get('GITHUB_ACTIONS')=='true'
R=Path(__file__).resolve().parents[1];p=R/'generated/rebuilt-preflight';report=json.loads((p/'REPORT.json').read_text());assert len(report['samples'])==210 and not report['errors'];F=imageio_ffmpeg.get_ffmpeg_exe()
for movie in p.glob('NATIVE_3D_MOTION_*.mp4'):
 check=subprocess.run([F,'-v','error','-progress','pipe:1','-nostats','-i',str(movie),'-an','-threads','2','-f','null','-'],capture_output=True,text=True,check=True);assert re.findall(r'^frame=(\d+)$',check.stdout,re.M)[-1]=='72' and not check.stderr.strip()
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
for chapter in range(1,11):
 rows=[s for s in report['samples']if s['chapter']==chapter];ids=list(dict.fromkeys(s['shot']for s in rows))
 for page in range((len(ids)+4)//5):
  selected=ids[page*5:page*5+5];sheet=Image.new('RGB',(1920,80+395*len(selected)),'#102d3a');d=ImageDraw.Draw(sheet);d.text((25,18),f'ACTUAL NEW DIRECTOR / CHAPTER{chapter:02} / START-MIDDLE-END / PAGE{page+1}',font=font,fill='#f4edda')
  for row,id in enumerate(selected):
   for col,s in enumerate(s for s in rows if s['shot']==id):
    x=22+col*635;y=66+row*395
    with Image.open(p/s['file'])as im:im.thumbnail((618,348));sheet.paste(im,(x,y))
    d.text((x,y+354),f'{id} / {s["kind"]} / {s["t"]:.3f}s',font=font,fill='#f4edda')
  sheet.save(p/f'CHAPTER_{chapter:02}_PREFLIGHT_{page+1:02}.jpg',quality=93,subsampling=0)
print('210 native new-composition temporal frames; both72frame actual3D motion clips decoded; all director branches rendered.')
