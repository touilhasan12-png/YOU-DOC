"""Derive review contact sheets from actual GitHub-rendered frames; no local media work."""
import os,json
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
from PIL import Image,ImageDraw,ImageFont
q=Path('R5_FILM_PROOF')
if not (q/'FILM_PROOF_REPORT.json').exists():
 print('No rendered frames exist; source-build failure is not a film proof.');raise SystemExit(0)
r=json.loads((q/'FILM_PROOF_REPORT.json').read_text());rows=r['coverage'];frames=r['frames'];font=ImageFont.truetype('ENGINE_SOURCE/fonts/SourceSans3[wght].ttf',24)
for b in range(0,len(rows),4):
 keys=rows[b:b+4];sheet=Image.new('RGB',(1920,388*len(keys)),'#18394c');d=ImageDraw.Draw(sheet)
 for y,k in enumerate(keys):
  fs=[f for f in frames if f['key']==k];selected=[fs[0],fs[len(fs)//2],fs[-1]]
  for x,f in enumerate(selected):
   with Image.open(q/f['file']) as im:sheet.paste(im.resize((640,360)),(x*640,y*388+28))
   d.text((x*640+8,y*388+1),k+' · '+format(f['time'],'.2f')+' s'+(' · FLAG' if f['flagged'] else ''),font=font,fill='#f1ebdb')
 sheet.save(q/f'CONTACT_{b//4:02d}.jpg',quality=95)
print('Remote source-derived review sheets:',(len(rows)+3)//4)
