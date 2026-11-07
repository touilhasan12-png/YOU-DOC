"""Remote review evidence from the actual ENCODED native clips, not staged substitutes."""
import os,json,argparse
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
import av
from PIL import Image,ImageDraw,ImageFont
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);x=p.parse_args();q=x.directory
font=ImageFont.truetype('ENGINE_SOURCE/fonts/SourceSans3[wght].ttf',22);items=[];record=[]
for receipt in sorted(q.glob('*.json')):
 r=json.loads(receipt.read_text())
 if r.get('schema')!='R5-new-picture-v1':continue
 video=q/r['video'];wanted=sorted({0,*[round((r['encoded_frames']-1)*v) for v in [.18,.38,.59,.79]],r['encoded_frames']-1});count=0;samples=[]
 with av.open(str(video)) as c:
  stream=c.streams.video[0];stream.codec_context.thread_count=1
  assert (stream.width,stream.height,float(stream.average_rate))==(1920,1080,24.)
  for i,frame in enumerate(c.decode(video=0)):
   assert abs(float(frame.pts*frame.time_base)-i/24)<1e-5
   if i in wanted:
    image=frame.reformat(width=640,height=360).to_image();name=r['key']+'_ENCODED_'+str(i)+'.jpg';image.save(q/name,quality=95);samples.append({'frame':i,'file':name});items.append((image.copy(),r['key'],i))
   count+=1
 assert count==r['encoded_frames'],'Decoded frame count mismatch'
 record.append({'key':r['key'],'decoded_frames':count,'review_sample_frames':wanted,'samples':samples,'scope':'Actual encoded frames; independent subjective inspection required. Full decode is not an artistic PASS.'})
for start in range(0,len(items),12):
 group=items[start:start+12];sheet=Image.new('RGB',(1920,388*((len(group)+2)//3)),'#18394c');d=ImageDraw.Draw(sheet)
 for j,(im,key,frame) in enumerate(group):xx=j%3*640;yy=j//3*388;sheet.paste(im,(xx,yy+28));d.text((xx+8,yy+2),key+' · native frame '+str(frame),font=font,fill='#f1eade')
 sheet.save(q/('ENCODED_CONTACT_'+str(start//12).zfill(2)+'.jpg'),quality=95)
(q/'ENCODED_REVIEW_EVIDENCE.json').write_text(json.dumps({'source_commit':os.environ['GITHUB_SHA'],'run_id':os.environ['GITHUB_RUN_ID'],'units':record,'artistic_approval':False,'continuous_subjective_playback_claimed':False},indent=2));print('Actual encoded review evidence:',len(record),'new units')
