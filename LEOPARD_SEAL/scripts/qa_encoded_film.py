from pathlib import Path
import os,json,subprocess,hashlib,re
from PIL import Image,ImageDraw,ImageFont
assert os.environ.get('GITHUB_ACTIONS')=='true','Encoded-video decoding and extraction run only on GitHub Actions.'
R=Path(__file__).resolve().parents[1];F=os.environ['FFMPEG_EXE'];folder=R/'generated/encoded-film-qa';folder.mkdir(parents=True,exist_ok=True);delivery=R/'generated/encoded-input';movie=delivery/'LEOPARD_SEAL_WORKPRINT_AUDIO04_MISSING.mp4';receipt=json.loads((delivery/'DELIVERY_REPORT.json').read_text());plan=json.loads((delivery/'FILM_PLAN.json').read_text());assert hashlib.sha256(movie.read_bytes()).hexdigest()==receipt['movie_sha256'];assert receipt['frames']==plan['total_frames']==15805
# Decode the complete delivered video, not just the pre-encoding screenshots or packet count.
decoded=subprocess.run([F,'-hide_banner','-v','error','-progress','pipe:1','-nostats','-i',str(movie),'-map','0:v:0','-an','-threads','2','-f','null','-'],capture_output=True,text=True,check=True);counts=re.findall(r'^frame=(\d+)$',decoded.stdout,re.M);assert counts;assert int(counts[-1])==plan['total_frames'];assert not decoded.stderr.strip(),decoded.stderr[-1500:]
shots=[]
for ch in plan['chapters']:
 for s in ch['shots']:
  frame=round(ch['global_start']*24)+s['start_frame']+s['frames']//2;shots.append({'section':ch['section'],'shot':s['id'],'kind':s['kind'],'frame':frame,'time':frame/24})
select='+'.join(f'eq(n\\,{x["frame"]})'for x in shots)
subprocess.run([F,'-y','-v','error','-i',str(movie),'-map','0:v:0','-an','-vf','select='+select,'-fps_mode','vfr','-threads','2',str(folder/'ENCODED_%03d.png')],check=True)
images=sorted(folder.glob('ENCODED_*.png'));assert len(images)==len(shots)==71
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
for image,shot in zip(images,shots):
 with Image.open(image)as im:assert im.size==(1920,1080)
 shot['actual_encoded_frame_file']=image.name
for page in range(5):
 im=Image.new('RGB',(1920,1380),'#102d3a');d=ImageDraw.Draw(im);d.text((28,20),f'LEOPARD SEAL / FRAMES DECODED FROM THE DELIVERED MP4 / {page+1}',font=font,fill='#f4edda');d.text((28,53),'Full-length workprint, not a final film. Section04 narration remains missing.',font=small,fill='#dfb565')
 for i,shot in enumerate(shots[page*16:page*16+16]):
  x=24+(i%4)*474;y=100+(i//4)*316
  with Image.open(folder/shot['actual_encoded_frame_file'])as src:thumb=src.convert('RGB').resize((456,257),Image.Resampling.LANCZOS)
  im.paste(thumb,(x,y));d.text((x,y+263),f"{shot['shot']} {shot['kind']} @ {shot['time']:.2f}s",font=small,fill='#f4edda')
 im.save(folder/f'ENCODED_CONTACT_SHEET_{page+1:02}.jpg',quality=94,subsampling=0)
report={'status':'COMPLETE_WORKPRINT_VIDEO_DECODED_AND_ALL_71_SHOTS_SAMPLED','render_run_id':int(os.environ['TARGET_RUN_ID']),'qa_source_commit':os.environ.get('GITHUB_SHA'),'final_film_complete':False,'workprint_mp4_sha256':receipt['movie_sha256'],'all_video_frames_successfully_decoded':15805,'actual_decoded_image_dimensions':[1920,1080],'script_original_sha256':plan['script_sha256'],'narration04_missing':True,'artistic_approval':False,'continuous_human_listening':False,'actual_movie_sample_frames':shots};(folder/'ENCODED_QA_REPORT.json').write_text(json.dumps(report,indent=2));print('DELIVERED MP4 DECODE PASS /15805 frames /71 actual encoded shot samples /no final-film or listening claim')
