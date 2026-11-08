from pathlib import Path
import os,json,wave,re,math,hashlib
import numpy as np
from difflib import SequenceMatcher
from faster_whisper import WhisperModel
assert os.environ.get('GITHUB_ACTIONS')=='true'
R=Path(__file__).resolve().parents[1];out=R/'generated/audio-complete-plan';out.mkdir(parents=True,exist_ok=True);plan=json.loads((R/'FILM_PLAN.json').read_text());sections=json.loads((R/'SCRIPT_SECTIONS.json').read_text());change=json.loads((R/'SECTION04_AUTHORIZED_VARIANT_RECEIPT.json').read_text());text=(R/'narration_text/04_NON_GRAPHIC_USER_AUTHORIZED.txt').read_bytes().decode();audio=R/'audio/04_NON_GRAPHIC_USER_AUTHORIZED.wav'
assert hashlib.sha256(audio.read_bytes()).hexdigest()==change['audio_sha256'];assert text==sections[3]['narration'].replace(change['changed_original_span'],change['replacement_span'],1);assert hashlib.sha256((R/'SCRIPT_ORIGINAL.txt').read_bytes()).hexdigest()==plan['script_sha256']
with wave.open(str(audio),'rb')as w:rate=w.getframerate();duration=w.getnframes()/rate;pcm=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float32)/32768
pcm16=np.interp(np.arange(round(len(pcm)*16000/rate))*rate/16000,np.arange(len(pcm)),pcm).astype(np.float32);model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=2);segments,info=model.transcribe(pcm16,language='en',beam_size=5,word_timestamps=True,vad_filter=False);segments=list(segments);words=[{'word':w.word,'start':w.start,'end':w.end}for s in segments for w in(s.words or[])];(out/'WORDS_04_APPROVED.json').write_text(json.dumps(words,indent=2));norm=lambda s:list(re.finditer(r'[a-z0-9]+',s.lower()));source=norm(text);tokens=[]
for w in words:
 for m in norm(w['word']):tokens.append((m.group(),w['start']))
mapped={}
for b in SequenceMatcher(None,[m.group()for m in source],[v[0]for v in tokens],autojunk=False).get_matching_blocks():
 for i in range(b.size):mapped[b.a+i]=tokens[b.b+i][1]
anchors=sorted(mapped);frames=math.ceil(duration*24);cut_duration=frames/24
assert frames==1283

def time_at(char):
 i=next((i for i,m in enumerate(source)if m.end()>char),len(source)-1)
 if i in mapped:return mapped[i]
 before=[x for x in anchors if x<i];after=[x for x in anchors if x>i];a=before[-1]if before else 0;b=after[0]if after else len(source);ta=mapped.get(a,0);tb=mapped.get(b,duration);return ta+(tb-ta)*(i-a)/max(1,b-a)
ch=plan['chapters'][3];ch.update(frames=frames,duration=cut_duration,audio_missing=False,duration_estimated_because_audio_missing=False,narration_sha256=hashlib.sha256(text.encode()).hexdigest(),audio_file='audio/04_NON_GRAPHIC_USER_AUTHORIZED.wav',approved_text_replacement=True)
beats=[('', 'ambush'),('The seal catches','preyhold'),('The best place','colony'),('In one study','prydz'),('Researchers saw','techniques'),('Now look','silhouettes')];shots=[]
for cue,kind in beats:
 char=0 if not cue else text.index(cue);start=0 if not cue else round(time_at(char)*24)/24;shots.append({'kind':kind,'start':start,'cue':cue,'source_character':char})
for i,s in enumerate(shots):
 s.update(id=f'04_{i+1:02}',section=4,title=ch['title'],end=shots[i+1]['start']if i+1<len(shots)else cut_duration);s.update(start_frame=round(s['start']*24),end_frame=round(s['end']*24));s['frames']=s['end_frame']-s['start_frame'];s['duration']=s['frames']/24;assert s['frames']>0
ch['shots']=shots;caps=[];original_tokens=list(re.finditer(r'\S+',text));start=0
for i,m in enumerate(original_tokens):
 if i-start>=10 or(i-start>=5 and re.search(r'[.!?]$',m.group()))or i==len(original_tokens)-1:
  a=original_tokens[start];end=time_at(original_tokens[i+1].start())if i+1<len(original_tokens)else cut_duration;caps.append({'start':time_at(a.start()),'end':end,'text':text[a.start():m.end()]});start=i+1
assert re.sub(r'\s+',' ',' '.join(c['text']for c in caps))==re.sub(r'\s+',' ',text);ch['captions']=caps;offset=0
for c in plan['chapters']:
 c['global_start']=offset;c['audio_file']=c.get('audio_file',f"audio/{c['section']:02}.wav");c['audio_missing']=False;c['duration_estimated_because_audio_missing']=False;offset+=c['duration']
plan.update(status='ALL_TEN_NARRATION_SECTIONS_AVAILABLE_APPROVED_SECTION04_EDIT',missing_narration_sections=[],total_frames=sum(c['frames']for c in plan['chapters']),duration=offset,approved_change={'section':4,'old':change['changed_original_span'],'new':change['replacement_span']},original_master_script_preserved=True);assert plan['total_frames']==15624;assert abs(offset-651)<1e-8;assert sum(len(c['shots'])for c in plan['chapters'])==70
(out/'FILM_PLAN_APPROVED.json').write_text(json.dumps(plan,indent=2,ensure_ascii=False))
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
subs=[]
for c in plan['chapters']:
 for s in c['captions']:subs.append(f"{len(subs)+1}\n{stamp(c['global_start']+s['start'])} --> {stamp(c['global_start']+s['end'])}\n{s['text']}")
(out/'NARRATION_APPROVED.srt').write_text('\n\n'.join(subs)+'\n');(out/'APPROVED_ACTIVE_NARRATION.txt').write_text('\n\n'.join(text if row['section']==4 else row['narration']for row in sections));(out/'SECTION04_ALIGNMENT_REPORT.json').write_text(json.dumps({'duration':duration,'frames':frames,'asr_model':'small.en','asr_transcript':' '.join(s.text for s in segments),'approx_word_similarity':SequenceMatcher(None,[m.group()for m in source],[m.group()for m in norm(' '.join(s.text for s in segments))],autojunk=False).ratio(),'asr_is_not_perfect_word_or_human_listening_verification':True,'approved_change_only':True},indent=2));print('APPROVED_PLAN:10 voiced chapters /70 shots /15624frames /651seconds; nine existing chapter timings retained;04retimed to actual53.44-second narration.')
