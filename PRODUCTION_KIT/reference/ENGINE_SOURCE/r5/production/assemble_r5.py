"""GitHub-only final mux. All pictures are NEW R5 units; old edition is AUDIO ONLY.
This module never creates a review approval and refuses assembly without one.
"""
import os,json,hashlib,subprocess,argparse,shutil
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true','All media analysis/muxing belongs on GitHub Actions'
import av,imageio_ffmpeg
from full_film_contract import plan,validate_units,AUDIO_PAYLOAD_SHA,sha
FF=imageio_ffmpeg.get_ffmpeg_exe()
def packets(file):
 h=hashlib.sha256();n=0
 with av.open(str(file)) as c:
  stream=c.streams.audio[0];assert stream.codec_context.sample_rate==48000 and stream.codec_context.channels==2
  for packet in c.demux(stream):
   if packet.size:h.update(bytes(packet));n+=1
 return n,h.hexdigest()
def run(cmd):subprocess.run(cmd,check=True)
def main():
 a=argparse.ArgumentParser();a.add_argument('--units',required=True,type=Path);a.add_argument('--review',required=True,type=Path);a.add_argument('--approved-audio-source',required=True,type=Path);a.add_argument('--output',type=Path,default=Path('R5_DELIVERY'));x=a.parse_args()
 # This check rejects mixed R2/R3/R4 picture receipts, omitted shots, stale runtime,
 # repeated units, stale timing, and forged automatic art-PASS assumptions.
 verified=validate_units(x.units,x.review);rows=plan();x.output.mkdir(exist_ok=True,parents=True)
 # Approved narration is retained byte-for-byte, with no new speaker or timing.
 before=packets(x.approved_audio_source);assert before==(31191,AUDIO_PAYLOAD_SHA),'Wrong or changed approved AAC source'
 audio=x.output/'approved_narration_unchanged.m4a';run([FF,'-y','-v','error','-i',str(x.approved_audio_source),'-map','0:a:0','-vn','-c:a','copy',str(audio)]);assert packets(audio)==before
 receipts={}
 for p in x.units.glob('*.json'):
  r=json.loads(p.read_text())
  if r.get('schema')=='R5-new-picture-v1':receipts[r['key']]=r
 listing=x.output/'new_picture_only.ffconcat';lines=['ffconcat version 1.0']
 for s in rows:
  file=(x.units/receipts[s['key']]['video']).resolve()
  assert "'" not in str(file)
  with av.open(str(file)) as c:
   st=c.streams.video[0];assert (st.width,st.height,st.frames,float(st.average_rate))==(1920,1080,s['encoded_frames'],24.)
  lines.extend(["file '"+str(file)+"'",'duration '+format(s['encoded_frames']/24,'.12f')])
 listing.write_text('\n'.join(lines)+'\n')
 movie=x.output/'Something_That_Plans_R5_FULL_FILM_REBUILD.mp4'
 run([FF,'-y','-v','warning','-safe','0','-f','concat','-i',str(listing),'-i',str(audio),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(movie)])
 assert packets(movie)==before,'Final AAC packet loss/change'
 with av.open(str(movie)) as c:
  v=c.streams.video[0];assert v.frames==15969 and (v.width,v.height,float(v.average_rate))==(1920,1080,24.)
  pts=sorted(p.pts for p in c.demux(v) if p.size and p.pts is not None)
  assert len(pts)==15969 and all(abs(float(t*v.time_base)-i/24)<1e-5 for i,t in enumerate(pts)), 'Non-CFR/duplicated/missing video timestamp'
 with av.open(str(movie)) as c:
  a=c.streams.audio[0];duration=float(a.duration*a.time_base);assert abs(duration-665.375)<.045
 run([FF,'-v','error','-threads','2','-i',str(movie),'-f','null','-'])
 loud=subprocess.run([FF,'-hide_banner','-i',str(movie),'-vn','-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
 report={**verified,'file':movie.name,'bytes':movie.stat().st_size,'sha256':sha(movie),'md5':hashlib.md5(movie.read_bytes()).hexdigest(),'github_run_id':os.environ['GITHUB_RUN_ID'],'source_commit':os.environ['GITHUB_SHA'],'full_decode':'PASS','all_video_packet_timestamps_checked':True,'aac_packet_count':before[0],'aac_payload_sha256':before[1],'narration_reencoded':False,'old_edition_picture_frames_used':0,'audio_duration':duration,'loudness_summary':loud.stderr[loud.stderr.rfind('Summary:'):],'continuous_subjective_playback_claimed':False,'review_record':json.loads(x.review.read_text()),'status':'TECHNICALLY_VERIFIED_NEW_R5; final assembled-picture review/delivery verification remain separate'}
 (x.output/'FINAL_TECHNICAL_AUDIT.json').write_text(json.dumps(report,indent=2))
 # Intermediate mux inputs must not be confused with additional deliverables.
 audio.unlink();listing.unlink()
 subtitles=Path('ENGINE_SOURCE/timing/English_ending_revised.srt')
 assert sha(subtitles)=='d0f92c14a20adc8533425a60cdae9d9046e78be6a72a97e054855f7db7b699ad'
 shutil.copy2(subtitles,x.output/'English.srt')
 shutil.copy2(Path('ENGINE_SOURCE/r5/rights/CREDITS_AND_SOURCES.md'),x.output/'CREDITS_AND_SOURCES.md')
 print(json.dumps({k:v for k,v in report.items() if k!='review_record'},indent=2))
if __name__=='__main__':main()
