"""Actions-only inspection of downloaded, licensed REAL video sources. Not a film delivery."""
from pathlib import Path
import json, os, hashlib, subprocess, urllib.request, shutil, re, math
assert os.environ.get('GITHUB_ACTIONS') == 'true', 'Media decoding/extraction only on GitHub Actions'
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont
R=Path(__file__).resolve().parents[1]
M=json.loads((R/'visual_rebuild/REAL_MEDIA_MANIFEST.json').read_text())
F=imageio_ffmpeg.get_ffmpeg_exe();out=R/'generated/real-source-inspection';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
results=[]
for source in M['real_video_candidates']:
 sid=source['id'];folder=out/sid;folder.mkdir(exist_ok=True);raw=folder/source['file']
 shutil.copyfile(R/source['repository_file'],raw)
 sha=hashlib.sha256(raw.read_bytes()).hexdigest();assert sha==source['sha256'],(sid,sha)
 reader=imageio_ffmpeg.read_frames(str(raw));metadata=next(reader);reader.close();w,h=metadata['size'];duration=metadata['duration']
 assert [w,h]==source['native_size'],metadata
 # Legacy Ogg/Theora has duplicate end DTS: normalize ONLY null-output timestamps;
 # decode every frame without dropping/repeating it. Original file remains hash-verified.
 decode=subprocess.run([F,'-v','error','-progress','pipe:1','-nostats','-i',str(raw),'-map','0:v:0','-an','-vf',f'setpts=N/({metadata["fps"]}*TB)','-fps_mode','passthrough','-threads','2','-f','null','-'],capture_output=True,text=True,check=True)
 assert not decode.stderr.strip(),decode.stderr
 counts=re.findall(r'^frame=(\d+)$',decode.stdout,re.M);assert counts and int(counts[-1])>0
 interval=2 if duration>20 else 1;times=list(range(0,math.floor(duration),interval));frames=[]
 for i,t in enumerate(times):
  p=folder/f'{sid}_{i:03d}_{t:03d}s.png'
  subprocess.run([F,'-y','-v','error','-ss',str(t),'-i',str(raw),'-map','0:v:0','-frames:v','1','-an','-threads','2',str(p)],check=True)
  with Image.open(p)as im:assert im.size==(w,h)
  frames.append({'source_time_seconds':t,'file':p.name})
 for page in range(math.ceil(len(frames)/20)):
  sheet=Image.new('RGB',(1920,1140),'#102d3a');d=ImageDraw.Draw(sheet)
  d.text((25,20),f'REAL CAMERA VIDEO / {sid} / ORIGINAL {w}x{h} / {source["author"]}',font=font,fill='#f4edda')
  d.text((25,53),'SOURCE INSPECTION ONLY / not an edited-film result / choose truthful, non-graphic cuts after review',font=small,fill='#dfb565')
  for j,frame in enumerate(frames[page*20:page*20+20]):
   x=22+(j%4)*475;y=100+(j//4)*205
   with Image.open(folder/frame['file'])as im:
    thumb=im.convert('RGB');thumb.thumbnail((450,174));sheet.paste(thumb,(x+(450-thumb.width)//2,y))
   d.text((x,y+177),f'{sid} SOURCE {frame["source_time_seconds"]:.1f}s',font=small,fill='#f4edda')
  sheet.save(out/f'{sid}_SOURCE_SHEET_{page+1:02d}.jpg',quality=94,subsampling=0)
 result=dict(source,downloaded=True,sha256_verified=True,actual_bytes=raw.stat().st_size,native_width=w,native_height=h,decoded_video_frames=int(counts[-1]),actual_duration=duration,actual_samples=frames,chosen_in_out=None,integrated_in_new_movie=False)
 results.append(result);raw.unlink();print('REAL_SOURCE_DECODED',sid,int(counts[-1]),'native',w,h,flush=True)
photos=M['acquired_still_candidates'];assert len(photos)==4
sheet=Image.new('RGB',(1920,1240),'#102d3a');d=ImageDraw.Draw(sheet);d.text((28,22),'EXACTLY FOUR DISTINCT REAL PHOTOGRAPHS / NO GENERATED WILDLIFE STILLS',font=font,fill='#f4edda')
for i,photo in enumerate(photos):
 p=R/photo['repository_file'];assert p.exists(),p
 with Image.open(p)as im:
  native=im.size;thumb=im.convert('RGB');thumb.thumbnail((900,510));x=30+(i%2)*950;y=90+(i//2)*570;sheet.paste(thumb,(x+(900-thumb.width)//2,y+(510-thumb.height)//2))
 d.text((x,y+515),f'{photo["id"]} / {photo["author"]} / ORIGINAL {native[0]}x{native[1]}',font=small,fill='#f4edda')
sheet.save(out/'FOUR_REAL_PHOTOS_SOURCE_SHEET.jpg',quality=94,subsampling=0)
report={'status':'TWO_REAL_VIDEO_SOURCES_FULLY_DECODED_AND_FOUR_REAL_STILLS_INSPECTABLE','not_a_corrected_film':True,'new_film_created':False,'real_video_sources':results,'real_still_count':4,'real_stills':photos,'source_commit':os.environ.get('GITHUB_SHA'),'run_id':os.environ.get('GITHUB_RUN_ID'),'next':'Human-agent actual frame inspection, choose and record exact source in/out, then integrate into redesigned film; do not treat downloading as integration.'}
(out/'REAL_SOURCE_INSPECTION_REPORT.json').write_text(json.dumps(report,indent=2))
