"""Remote-only final checks on the assembled movie; not a claim of human listening."""
import os,json,hashlib,subprocess
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true','Media analysis must run on GitHub Actions'
import av,imageio_ffmpeg
movie=Path('CANDIDATE/Something_That_Plans_REVISION2_CANDIDATE.mp4');source=Path('SOURCE_AUDIO/audio_revision_ending/full_mix_normal_ending.m4a')
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
def packets(p):
 h=hashlib.sha256();n=0
 with av.open(str(p)) as c:
  st=c.streams.audio[0];assert st.codec_context.sample_rate==48000 and st.codec_context.channels==2
  for pkt in c.demux(st):
   if pkt.size:h.update(bytes(pkt));n+=1
 return n,h.hexdigest()
expected=json.loads(Path('CANDIDATE/CANDIDATE_RECEIPT.json').read_text());assert sha(movie)==expected['sha256']
original=packets(source);final=packets(movie);assert original==final,'Muxed AAC packet loss/change'
with av.open(str(movie)) as c:
 v=c.streams.video[0];assert v.width==1920 and v.height==1080 and abs(float(v.average_rate)-24)<1e-9 and v.frames==15969
 audio_duration=float(c.streams.audio[0].duration*c.streams.audio[0].time_base);assert abs(audio_duration-15969/24)<.045
ff=imageio_ffmpeg.get_ffmpeg_exe();r=subprocess.run([ff,'-hide_banner','-i',str(movie),'-vn','-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True);assert r.returncode==0
out=Path('REMOTE_FINAL_AUDIT');out.mkdir(exist_ok=True)
report={'movie_sha256':sha(movie),'movie_bytes':movie.stat().st_size,'source_commit':expected['source_commit'],'native_source_sha256':expected['film_source_sha256'],'full_movie_decode':expected['full_decode'],'video':'1920x1080 / 24 fps / 15969 frames','video_duration':15969/24,'audio_duration':audio_duration,'audio_format':'stereo AAC / 48000 Hz','aac_packet_count':final[0],'aac_payload_sha256':final[1],'aac_payload_bit_identical_to_new_WSOLAx2_mix':True,'status':'TECHNICAL PASS; visual review is separate. No subjective listening claim.','loudness_summary':r.stderr[r.stderr.rfind('Summary:'):]}
(out/'FINAL_TECHNICAL_AUDIT.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
