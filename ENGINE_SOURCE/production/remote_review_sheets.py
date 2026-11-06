"""Remote-only presentation sheets from existing GitHub-generated frames and motion clips."""
import os
assert os.environ.get('GITHUB_ACTIONS')=='true','Review image creation is GitHub-only'
from pathlib import Path
from PIL import Image,ImageDraw
import av,numpy as np
root=Path('REMOTE_PROOFS');out=Path('REMOTE_REVIEW');out.mkdir(exist_ok=True)
files=sorted(root.glob('*.jpg'));mid=[];critical=[]
for p in files:
 if p.stem.endswith(('_0.5','_0.45')):mid.append(p)
 if not p.stem.endswith('_0.5'):critical.append(p)
def sheets(items,prefix,cols=3,rows=3):
 for b in range(0,len(items),cols*rows):
  batch=items[b:b+cols*rows];im=Image.new('RGB',(640*cols,382*((len(batch)+cols-1)//cols)),'#173743');d=ImageDraw.Draw(im)
  for j,p in enumerate(batch):
   x=j%cols*640;y=j//cols*382;pic=Image.open(p).convert('RGB');pic.thumbnail((640,360));im.paste(pic,(x,y+22));d.text((x+5,y+4),p.stem,fill='white')
  im.save(out/f'{prefix}_{b//(cols*rows):02d}.jpg',quality=94)
sheets(mid,'ALL_SCENES');sheets(critical,'CRITICAL_FULLRES')
for p in sorted(root.glob('*.mp4')):
 # Decoding and contact-sheet generation occurs on GitHub, never on the agent machine.
 with av.open(str(p)) as c:
  st=c.streams.video[0];st.codec_context.thread_count=1;N=st.frames;wanted=set(np.linspace(0,max(0,N-1),12,dtype=int));selected=[]
  for n,f in enumerate(c.decode(video=0)):
   if n in wanted:selected.append((n,f.reformat(width=480,height=270).to_image()))
 im=Image.new('RGB',(1920,294*3),'#173743');d=ImageDraw.Draw(im)
 for j,(n,f) in enumerate(selected):x=j%4*480;y=j//4*294;im.paste(f,(x,y+24));d.text((x+4,y+4),f'{p.stem}: {n/24:.2f}s',fill='white')
 im.save(out/f'MOTION_{p.stem}.jpg',quality=95)
print('Remote review sheets:',len(list(out.glob('*.jpg'))),'source images:',len(files),'clips:',len(list(root.glob('*.mp4'))))
