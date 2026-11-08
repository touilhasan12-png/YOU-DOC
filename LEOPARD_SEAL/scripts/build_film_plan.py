from pathlib import Path
import json,re,math,hashlib
from difflib import SequenceMatcher
R=Path(__file__).resolve().parents[1];rows=json.loads((R/'SCRIPT_SECTIONS.json').read_text());audit=json.loads((R/'downloaded/leopard-narration-audit/AUDIO_AUDIT.json').read_text());aud={x['section']:x for x in audit['sections']}
BEATS={
1:[('', 'underice'),('watched a leopard seal kill','surfacehunt'),('Your guide says','boat'),('The seal is about','scale'),('She rushes','contact'),('Then she relaxes','offer'),('When live penguins fail','gifts'),('On the last day','chase'),('Over four days','diver'),("Here's the part",'fatalcard'),('Because the more','eye')],
2:[('', 'scale'),('Its jaws','jaw'),('and back teeth','teeth'),('In short bursts','sprint'),('and its only natural predator','orca'),('Leopard seals live','range'),("But the hardware",'eye')],
3:[('', 'foodweb'),('Seven penguin species','penguins'),('One leopard seal caught','sydney'),("If you're a young",'scars'),("And if you're",'colony'),('Each seal hunts','researchmap'),('Scat studies','camerafield'),('Some stalked fish','fishrocks'),('Others chased','fishchase'),('And the smallest','theft')],
4:[('', 'ambush'),('The seal grabs','thrash'),('Then it bites','preyhold'),('The best place','colony'),('In one study','prydz'),('Researchers saw','techniques'),('Now look','silhouettes')],
5:[('', 'icewalk'),('British Antarctic Survey','survey'),('The majority','icebreach'),('In 1985','crampon'),('His companions','rescue'),("If you're thinking",'boatunder'),('The same study','boatcontact')],
6:[('', 'archive')],
7:[('', 'circle'),('It circles','circleabove'),('It lifts its head','headshake'),('Many observers','offer'),('But the authors','signalpanels'),('And that open mouth','jaw'),('In other seals','signalpanels'),("Boyd's own",'eye')],
8:[('', 'povabove'),('Swim away?','options'),('Which leaves','retreat'),('After 2003','watch'),('If one turns','beach'),('The best defense','shore')],
9:[('', 'stats'),('The authors worked','rates'),('And no curious','diver'),("There's a gentler",'singer'),('A 2025 study','songs'),('So the animal','profile'),('And the seals have','icechange'),('Krill declines','krill'),('The last circumpolar','population')],
10:[('', 'eye'),('She could have','offer'),("That's the unsettling",'circle'),('Most of the time','eye'),("If there's another",'outro')]
}
def normalized(s):return [(m.group().lower(),m.start(),m.end())for m in re.finditer(r'[A-Za-z0-9]+',s)]
plan=[];subtitles=[];global_t=0
for row in rows:
 sid=row['section'];text=row['narration'];duration=aud[sid].get('duration_seconds');missing=duration is None
 if missing:duration=61.0
 frames=math.ceil(duration*24);duration=frames/24;src=normalized(text);mapped={}
 if not missing:
  words=json.loads((R/f'downloaded/leopard-narration-audit/WORDS_{sid:02}.json').read_text());tokens=[]
  for w in words:
   for n in normalized(w['word']):tokens.append((n[0],w['start'],w['end']))
  for block in SequenceMatcher(None,[x[0]for x in src],[x[0]for x in tokens],autojunk=False).get_matching_blocks():
   for i in range(block.size):mapped[block.a+i]=tokens[block.b+i][1]
 # Keep exact original words; unmatched ASR timings are interpolated, never used as replacement text.
 anchors=sorted(mapped)
 def token_time(i):
  if missing or not anchors:return i/max(1,len(src))*duration
  if i in mapped:return mapped[i]
  before=[x for x in anchors if x<i];after=[x for x in anchors if x>i];a=before[-1]if before else 0;b=after[0]if after else len(src)
  ta=mapped.get(a,0);tb=mapped.get(b,duration);return ta+(tb-ta)*(i-a)/max(1,b-a)
 def char_time(c):
  i=next((i for i,x in enumerate(src)if x[2]>c),len(src)-1);return max(0,min(duration,token_time(i)))
 beats=[]
 for cue,kind in BEATS[sid]:
  c=0 if not cue else text.lower().find(cue.lower());assert c>=0,(sid,cue)
  start=0 if not cue else round(char_time(c)*24)/24
  if kind=='fatalcard':start=max(0,start-.45)
  beats.append({'kind':kind,'start':start,'cue':cue,'source_character':c})
 assert all(b['start']>a['start']for a,b in zip(beats,beats[1:])),(sid,beats)
 for i,b in enumerate(beats):
  b.update(id=f'{sid:02}_{i+1:02}',section=sid,title=row['title'],end=beats[i+1]['start']if i+1<len(beats)else duration)
  b['start_frame']=round(b['start']*24);b['end_frame']=round(b['end']*24);b['frames']=b['end_frame']-b['start_frame'];b['duration']=b['frames']/24;assert b['frames']>0
 # Subtitle slices preserve every original non-whitespace token and its punctuation.
 original_tokens=list(re.finditer(r'\S+',text));chunks=[];start=0
 for i,m in enumerate(original_tokens):
  if i-start>=10 or (i-start>=5 and re.search(r'[.!?]$',m.group()))or i==len(original_tokens)-1:
   first=original_tokens[start];last=m;body=text[first.start():last.end()];t0=char_time(first.start());t1=char_time(original_tokens[i+1].start())if i+1<len(original_tokens)else duration;chunks.append({'start':t0,'end':max(t0+.15,t1),'text':body});start=i+1
 assert re.sub(r'\s+',' ', ' '.join(x['text']for x in chunks)).strip()==re.sub(r'\s+',' ',text).strip()
 plan.append({'section':sid,'title':row['title'],'frames':frames,'duration':duration,'global_start':global_t,'audio_missing':missing,'duration_estimated_because_audio_missing':missing,'shots':beats,'captions':chunks,'narration_sha256':hashlib.sha256(text.encode()).hexdigest(),'visual_directions':row['visual_directions']})
 for c in chunks:subtitles.append({**c,'start':c['start']+global_t,'end':c['end']+global_t})
 global_t+=duration
original=(R/'SCRIPT_ORIGINAL.txt').read_bytes();assert hashlib.sha256(original).hexdigest()=='12e7342195250a4484ad32e7f4ad30a4b7a35025cb46d06f12d44e51b85568fe'
(R/'FILM_PLAN.json').write_text(json.dumps({'status':'WORKPRINT_INCOMPLETE_AUDIO04','fps':24,'width':1920,'height':1080,'script_sha256':hashlib.sha256(original).hexdigest(),'total_frames':sum(x['frames']for x in plan),'duration':global_t,'missing_narration_sections':[4],'chapters':plan},ensure_ascii=False,indent=2))
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(R/'NARRATION_ORIGINAL.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(x['start'])} --> {stamp(x['end'])}\n{x['text']}"for i,x in enumerate(subtitles))+'\n')
print('Original text locked;',sum(len(x['shots'])for x in plan),'shots,',sum(x['frames']for x in plan),'frames;',round(global_t,3),'seconds; section4 audio explicitly missing.')
