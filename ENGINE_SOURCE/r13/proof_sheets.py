from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
out=Path('R13_PROOF');font=ImageFont.truetype('ENGINE_SOURCE/fonts/DejaVuSans.ttf',18)
q=json.loads(Path('ENGINE_SOURCE/r13/REQUEST.json').read_text())
for r in q['shots']:
 files=sorted(out.glob(f"{r['id']:03d}_{r['key']}_*.jpg"))
 if not files:continue
 sheet=Image.new('RGB',(1920,312*((len(files)+3)//4)),'#f6f0dd');d=ImageDraw.Draw(sheet)
 for i,f in enumerate(files):
  im=Image.open(f).convert('RGB');im.thumbnail((480,270));x=i%4*480;y=i//4*312;sheet.paste(im,(x,y));d.text((x+8,y+278),f'{r["key"]} | {i}',font=font,fill='#143749')
 sheet.save(out/f'SHEET_{r["id"]:03d}_{r["key"]}.jpg',quality=95)
