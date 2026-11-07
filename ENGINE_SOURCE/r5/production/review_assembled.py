"""Actual final-file decoded evidence and per-unit pixel-preservation checks on Actions.
This creates evidence; it cannot create or imply subjective artistic approval.
"""
import os,json,hashlib,argparse
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
import av
from PIL import Image,ImageDraw,ImageFont
from full_film_contract import plan
p=argparse.ArgumentParser();p.add_argument('--units',type=Path,required=True);p.add_argument('--delivery',type=Path,required=True);x=p.parse_args()
rows=plan();movie=x.delivery/'Something_That_Plans_R5_FULL_FILM_REBUILD.mp4';references={};notes=[]
selected={'canyon_deck','floe_wave','whaler_view','surfer_incident','rudder_detaches','helm_response','five_rescued','hypothesis_imitation','swim_comparison','canyon_return','natural_outro'}
selected.add(rows[0]['key']);font=ImageFont.truetype('ENGINE_SOURCE/fonts/SourceSans3[wght].ttf',22);items=[]
def digest(image):return hashlib.sha256(image.tobytes()).hexdigest()
for row in rows:
 receipt=json.loads((x.units/(row['key']+'.json')).read_text());local=round((row['encoded_frames']-1)*.38)
 with av.open(str(x.units/receipt['video'])) as c:
  c.streams.video[0].codec_context.thread_count=1
  for i,frame in enumerate(c.decode(video=0)):
   if i==local:
    references[row['frame_start']+i]={'key':row['key'],'local_frame':i,'rgb_sha256':digest(frame.to_image())};break
  else:raise AssertionError('Missing native reference frame')
with av.open(str(movie)) as c:
 stream=c.streams.video[0];stream.codec_context.thread_count=1;count=0
 for i,frame in enumerate(c.decode(video=0)):
  assert abs(float(frame.pts*frame.time_base)-i/24)<1e-5
  if i in references:
   ref=references[i];image=frame.to_image();assert digest(image)==ref['rgb_sha256'],'Final-file decoded pixels differ from reviewed native unit: '+ref['key'];notes.append({**ref,'assembled_frame':i,'matches_reviewed_native_pixels':True})
   if ref['key'] in selected:items.append((image.resize((640,360),Image.Resampling.LANCZOS),ref['key'],i))
  if i in {0,15968}:
   image=frame.to_image();name='ASSEMBLED_FIRST.jpg' if i==0 else 'ASSEMBLED_LAST.jpg';image.save(x.delivery/name,quality=95)
   if i==15968:items.append((image.resize((640,360),Image.Resampling.LANCZOS),'actual final frame',i))
  count+=1
assert count==15969 and len(notes)==93
for start in range(0,len(items),12):
 batch=items[start:start+12];sheet=Image.new('RGB',(1920,388*((len(batch)+2)//3)),'#18394c');draw=ImageDraw.Draw(sheet)
 for j,(im,key,n) in enumerate(batch):
  xx=j%3*640;yy=j//3*388;sheet.paste(im,(xx,yy+28));draw.text((xx+8,yy+2),key+' · assembled '+str(n),font=font,fill='#f1eade')
 sheet.save(x.delivery/('ASSEMBLED_CONTACT_'+str(start//12).zfill(2)+'.jpg'),quality=95)
(x.delivery/'ASSEMBLED_PICTURE_EVIDENCE.json').write_text(json.dumps({'source_commit':os.environ['GITHUB_SHA'],'run_id':os.environ['GITHUB_RUN_ID'],'decoded_final_frames':count,'all_93_native_units_pixel_preserved_at_reference_frames':True,'unit_comparisons':notes,'continuous_subjective_playback_claimed':False,'scope':'Actual final-file decoding, timestamps, per-unit pixel-preservation and selected actual assembled samples. Separate visual inspection remains required.'},indent=2))
print('Actual assembled-file check:',count,'frames, all93 reference-frame pixels preserved.')
