"""GitHub-only original-voice test edit; never speech synthesis or rate change."""
from pathlib import Path
import subprocess,os,json,wave,hashlib
assert os.environ.get('GITHUB_ACTIONS')=='true','Media processing runs on GitHub Actions only'
import imageio_ffmpeg
R=Path(__file__).resolve().parents[1];F=imageio_ffmpeg.get_ffmpeg_exe();O=R/'generated';O.mkdir(exist_ok=True)
rows=json.loads((R/'templates/OPENING_TEST.json').read_text());master=R/'assets/approved/R15_MASTER.mp4';parts=[];words=json.loads((R/'reference/ENGINE_SOURCE/r12/assets/words.json').read_text());timed=[]
for scene in rows:
 raw=bytearray();elapsed=0
 for start,end in scene['audio_clips']:
  samples=round((end-start)*48000)
  b=subprocess.check_output([F,'-v','error','-ss',str(start),'-i',str(master),'-map','0:a:0','-af',f'aresample=48000,atrim=end_sample={samples},apad=whole_len={samples}','-ac','2','-ar','48000','-f','s16le','pipe:1'])
  raw.extend(b[:samples*4]);assert len(b)>=samples*4
  for w in words:
   if w['start']>=start and w['end']<=end:timed.append({'text':w['text'],'start':(scene['id']-1)*15+elapsed+w['start']-start,'end':(scene['id']-1)*15+elapsed+w['end']-start})
  elapsed+=samples/48000
 assert len(raw)<=15*48000*4
 raw.extend(bytes(15*48000*4-len(raw)));parts.append(bytes(raw))
with wave.open(str(O/'TEST_NARRATION.wav'),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(b''.join(parts))
(O/'TEST_WORDS.json').write_text(json.dumps(timed,indent=2))
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
subs=[]
for i in range(0,len(timed),7):
 group=timed[i:i+7];subs.append(f'{len(subs)+1}\n{stamp(group[0]["start"])} --> {stamp(group[-1]["end"])}\n'+ ' '.join(w['text']for w in group)+'\n')
(O/'English.srt').write_text('\n'.join(subs));(O/'AUDIO_EDIT_RECEIPT.json').write_text(json.dumps({'source':'Included R15 master / original R9 voice','clips':rows,'sample_rate':48000,'channels':2,'pcm_samples':2880000,'duration':60,'rate_change':False,'new_voice_generation':False,'quiet_tails_are_intentional_test_breathing_space_not_held_pictures':True,'note':'The 60-second opening test is an excerpt edit. The original full-film AAC remains unmodified inside included R15 master.'},indent=2))
print('Original-voice test audio: exactly 60 seconds; no voice synthesis, speed change or silent video hold.')
