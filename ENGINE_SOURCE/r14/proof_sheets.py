from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path('R14_PROOF');q=json.loads(Path('ENGINE_SOURCE/r14/REQUEST.json').read_text());font=ImageFont.truetype('ENGINE_SOURCE/fonts/DejaVuSans.ttf',18)
files=[]
for row in q['shots']:
 fs=sorted(root.glob(f"{row['id']:03d}_{row['key']}_*.jpg"))
 if not fs:continue
 files.append((row,fs[len(fs)//2]))
 if row['r14_mode']=='new_3D':
  sheet=Image.new('RGB',(1920,936),'#eef0e6');d=ImageDraw.Draw(sheet)
  for i,f in enumerate(fs):
   x=i%4*480;y=i//4*312;im=Image.open(f);im.thumbnail((480,270));sheet.paste(im,(x,y));d.text((x+6,y+277),f"{row['key']} | {i}",font=font,fill='#17364b')
  sheet.save(root/f"SEQUENCE_{row['id']:03d}.jpg",quality=95)
for page in range((len(files)+11)//12):
 sheet=Image.new('RGB',(1920,936),'#eef0e6');d=ImageDraw.Draw(sheet)
 for i,(row,f)in enumerate(files[page*12:page*12+12]):
  x=i%4*480;y=i//4*312;im=Image.open(f);im.thumbnail((480,270));sheet.paste(im,(x,y));d.text((x+6,y+277),f"{row['id']:02d} / {row['key']}",font=font,fill='#17364b')
 sheet.save(root/f'SELECTIVE_CONTACT_{page+1:02d}.jpg',quality=95)
