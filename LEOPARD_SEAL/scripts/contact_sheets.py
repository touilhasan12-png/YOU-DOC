from pathlib import Path
import json,os
from PIL import Image,ImageDraw,ImageFont
assert os.environ.get('GITHUB_ACTIONS')=='true';R=Path(__file__).resolve().parents[1];folder=R/'generated/fullfilm-probe';report=json.loads((folder/'REPORT.json').read_text());font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
for page in range((len(report['shots'])+15)//16):
 im=Image.new('RGB',(1920,1380),'#102d3a');d=ImageDraw.Draw(im);d.text((30,20),f'LEOPARD SEAL / ACTUAL FULL-TIMELINE PROBES / PAGE {page+1}',font=font,fill='#f4edda');d.text((30,52),'Not the final film. Internal image review; section04 narration is missing.',font=small,fill='#dfb565')
 for i,row in enumerate(report['shots'][page*16:page*16+16]):
  check=row['checks'][1];image=Image.open(folder/check['file']).convert('RGB');image.thumbnail((456,257),Image.Resampling.LANCZOS);x=24+(i%4)*474;y=100+(i//4)*316;im.paste(image,(x,y));d.text((x,y+263),f"{row['shot']}  {row['kind']}  {row['duration']:.2f}s",font=small,fill='#f4edda')
 im.save(folder/f'CONTACT_SHEET_{page+1:02}.jpg',quality=94,subsampling=0)
print('Contact sheets created from the actual first full-timeline cloud-rendered frames.')
