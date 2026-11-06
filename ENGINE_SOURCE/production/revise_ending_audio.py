"""User-authorized ENDING tempo correction (2026-11-06); canonical speech remains verbatim.
Keep original approved master; export only a new derivative. No narrator regeneration or pitch change.
"""
from pathlib import Path
import json,subprocess,hashlib,math,re
import imageio_ffmpeg,av
from resource_guard import HeavyWork
P=Path(__file__).resolve().parents[1];D=P/'audio_revision_ending';D.mkdir(exist_ok=True);FF=imageio_ffmpeg.get_ffmpeg_exe();CUT=649.2;TEMPO=.64
source=P/'locked_audio/approved_master.m4a';expected='2ea20c57c19ad6298c0fc35171ca5a55';assert hashlib.md5(source.read_bytes()).hexdigest()==expected

def remap(t):return t if t<=CUT else CUT+(t-CUT)/TEMPO

def call(args):
 r=subprocess.run([FF,'-hide_banner','-v','error','-threads','1',*args],capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr)
 return r

with HeavyWork() as guard:
 guard.check(100*1024**2)
 with av.open(str(source)) as c:duration=float(c.duration/1e6)
 taildur=(duration-CUT)/TEMPO
 tail=D/'ending_only_normalpace.flac';new=D/'full_mix_normal_ending.m4a'
 # Rubber Band preserves fundamental pitch, formants, stereo phase and speech transients.
 stretch='rubberband=tempo=0.64:pitch=1:transients=crisp:detector=soft:phase=laminar:window=long:smoothing=on:formant=preserved:pitchq=quality:channels=together'
 call(['-y','-i',str(source),'-af',f'atrim=start={CUT},asetpts=PTS-STARTPTS,{stretch},afade=t=out:st={taildur-.75:.8f}:d=0.75','-ar','48000','-sample_fmt','s32','-bits_per_raw_sample','24',str(tail)])
 # No crossfade across spoken words. Boundary is inside the existing pause after paragraph 30.
 call(['-y','-i',str(source),'-i',str(tail),'-filter_complex',f'[0:a]atrim=end={CUT},asetpts=PTS-STARTPTS[prefix];[1:a]asetpts=PTS-STARTPTS[tail];[prefix][tail]concat=n=2:v=0:a=1[a]','-map','[a]','-c:a','aac','-b:a','320k','-ar','48000','-ac','2','-movflags','+faststart',str(new)])
 call(['-i',str(new),'-f','null','-'])
 with av.open(str(new)) as c:newduration=float(c.duration/1e6)
 words=json.loads((P/'timing/word_timeline.json').read_text());paras=json.loads((P/'timing/paragraph_timeline.json').read_text());plan=json.loads((P/'shots/NEW_SHOT_PLAN.json').read_text())
 # Save derived tracks, leaving every locked original timeline unchanged.
 for fn,rows in [('word_timeline_ending_revised.json',words),('paragraph_timeline_ending_revised.json',paras)]:
  for x in rows:
   for k in ['start','end']:
    if k in x:x[k]=round(remap(x[k]),8)
  (P/'timing'/fn).write_text(json.dumps(rows,indent=2))
 rates=[];original_paras=json.loads((P/'timing/paragraph_timeline.json').read_text())
 for a,b in zip(original_paras,paras):
  assert a['text']==b['text']
  if a['id']>=31:rates.append({'paragraph':a['id'],'words':len(a['text'].split()),'original_wpm':len(a['text'].split())*60/(a['end']-a['start']),'revised_wpm':len(b['text'].split())*60/(b['end']-b['start'])})
 for s in plan:
  s['start']=round(remap(s['start']),8);s['end']=round(remap(s['end']),8);s['duration']=round(s['end']-s['start'],8)
  if s['key']=='end_screen':s.update(key='natural_outro',camera='quiet continuous ocean/pod shot, NOT an end-screen layout',action='Keep every spoken word at natural corrected tempo. Animals continue naturally; fade picture and ambience. No next-video frame, thumbnail, placeholder, pointing graphic, reserved UI area or fake interface.')
 plan[-1]['end']=math.ceil(newduration*24)/24;plan[-1]['duration']=plan[-1]['end']-plan[-1]['start']
 (P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').write_text(json.dumps(plan,indent=2))
 srt=(P/'timing/English.srt').read_text()
 def stamp(t):
  ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
 def repl(m):
  h,mi,s,ms=map(int,m.groups());return stamp(remap(h*3600+mi*60+s+ms/1000))
 (P/'timing/English_ending_revised.srt').write_text(re.sub(r'(\d{2}):(\d{2}):(\d{2}),(\d{3})',repl,srt))
 assert hashlib.md5(source.read_bytes()).hexdigest()==expected
 report={'authorized_by_user':'2026-11-06: ending too fast, normal delivery, no next-video frame; user explicitly chose to KEEP ALL ORIGINAL SPOKEN WORDS','canonical_master_unchanged_md5':expected,'new_derivative':str(new.relative_to(P)),'lossless_ending_component':str(tail.relative_to(P)),'cut_in_existing_pause_seconds':CUT,'tempo_after_cut':TEMPO,'pitch_factor':1.0,'formants':'preserved','source_duration':duration,'new_audio_duration':newduration,'new_video_frames':math.ceil(newduration*24),'rate_measurements':rates,'full_decode':'PASS','speech_or_text_deleted':False,'new_voice_generated':False,'important':'Timing is linearly remapped after cut; exact phrase boundaries still require listening review. AAC derivative is re-encoded; original master remains unchanged, not falsely claimed packet-identical. No complete replacement film yet.','sha256':hashlib.sha256(new.read_bytes()).hexdigest()}
 (D/'ENDING_REVISION.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
