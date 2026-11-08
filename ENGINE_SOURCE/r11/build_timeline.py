"""Build edit decisions from provider character timestamps, not audio analysis."""
import json,math,re,hashlib
from pathlib import Path
P=Path(__file__).resolve().parent;FPS=24
old=json.loads((P.parent/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text())
locked=set('surfer_incident diver_entanglement yacht_stern rudder_detaches helm_response hypothesis_play hypothesis_imitation human_not_target swim_comparison boat_option whaler_view whaling_cooperation law_tongue old_tom_intro tow_rope worn_teeth five_rescued'.split())
real=set('wild_human decision_gaze scarcity_habitat wild_record opinion_release natural_outro'.split())
paras=[];words=[];cursor=0;starts={}
for n in range(1,33):
 d=json.loads((P/'narration'/f'{n:02d}.json').read_text());a=d['alignment'];text=''.join(a['characters']);lead=.25 if n==1 else 0
 duration=max(a['character_end_times_seconds'])+.28+lead+(2.3 if n==32 else 0)
 frames=math.ceil(duration*FPS);start=cursor/FPS
 paras.append({'id':n,'start':start,'frames':frames,'duration':frames/FPS,'lead':lead,'text':d['exact_script'],'last_spoken_end':start+lead+max(a['character_end_times_seconds'])})
 clean=list(text)
 for tag in re.finditer(r'\[[^\]]*\]',text):
  for i in range(tag.start(),tag.end()):clean[i]=' '
 clean=''.join(clean)
 for m in re.finditer(r'\S+',clean):
  words.append({'text':m.group(),'start':start+lead+a['character_start_times_seconds'][m.start()],'end':start+lead+a['character_end_times_seconds'][m.end()-1],'paragraph':n})
 for s in [r for r in old if r['paragraph']==n]:
  anchor=s.get('anchor')
  if anchor:
   index=text.lower().find(anchor.lower())
   if index<0:raise ValueError(f"Missing exact anchor {s['key']}: {anchor}")
   frame=round((start+lead+a['character_start_times_seconds'][index])*FPS)
  else:frame=cursor
  starts[s['id']]=frame
 cursor+=frames
rows=[]
for i,s in enumerate(old):
 r=dict(s);r['old_start']=s['start'];r['old_end']=s['end'];r['old_frame_start']=math.ceil(s['start']*FPS-1e-7);r['old_frame_end']=min(15969,math.ceil(s['end']*FPS-1e-7))
 r['frame_start']=starts[s['id']];r['frame_end']=starts[old[i+1]['id']] if i+1<len(old) else cursor
 r['frames']=r['frame_end']-r['frame_start'];r['start']=r['frame_start']/FPS;r['end']=r['frame_end']/FPS;r['duration']=r['frames']/FPS
 if r['frames']<=0:raise ValueError('Nonpositive scene '+r['key'])
 r['mode']='R9_3D' if r['key'] in locked else 'licensed_real' if r['key'] in real else 'authored_vector'
 rows.append(r)
for r in rows:
 d=json.loads((P/'narration'/f"{r['paragraph']:02d}.json").read_text());a=d['alignment'];joined=''.join(a['characters'])
 r['cues']={}
 for cue in ['exhales','A blue whale','The largest animal','jaw','tongue']:
  pos=joined.lower().find(cue.lower())
  if pos>=0:r['cues'][cue]=paras[r['paragraph']-1]['start']+paras[r['paragraph']-1]['lead']+a['character_start_times_seconds'][pos]-r['start']
loads=[0]*6
for s in sorted([r for r in rows if r['mode']=='authored_vector'],key=lambda r:-r['frames']):
 k=min(range(6),key=lambda i:loads[i]);s['worker']=k;loads[k]+=s['frames']
q={'edition':'R11_SOUL_EDITORIAL_WILL','base':'R9 user-approved reference; no R10 film pixels','base_artifact_id':13577875516,'base_member':'Something_That_Plans_R9_NATURAL_GRIP_AND_SLOW_LEGS_2026-11-07.mp4','fps':24,'width':1920,'height':1080,'frames':cursor,'duration':cursor/FPS,'paragraphs':paras,'shots':rows,'generated_secondary_assets_only':['seal_grey','sea_lion_brown'],'principal_animals':'procedural articulated vector geometry or retained R9 3D; NO generated principal-animal images','script_sha256':hashlib.sha256((P.parent/'script_original.txt').read_bytes()).hexdigest(),'voice':'Will / eleven_v3 / native speed / exact original words','worker_frames':loads,'artistic_acceptance_claimed':False}
(P/'REQUEST.json').write_text(json.dumps(q,indent=2));(P/'word_timeline.json').write_text(json.dumps(words,indent=2))
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
chunks=[];current=[]
for w in words:
 if current and (len(current)>=10 or w['paragraph']!=current[0]['paragraph'] or w['start']-current[0]['start']>4.2):chunks.append(current);current=[]
 current.append(w)
 if re.search(r'[.!?]$',w['text']) and len(current)>=3:chunks.append(current);current=[]
if current:chunks.append(current)
(P/'English.srt').write_text('\n\n'.join(f"{i}\n{stamp(x[0]['start'])} --> {stamp(x[-1]['end'])}\n"+' '.join(w['text'] for w in x) for i,x in enumerate(chunks,1))+'\n')
assert len(rows)==93 and sum(s['frames'] for s in rows)==cursor
assert all(a['frame_end']==b['frame_start'] for a,b in zip(rows,rows[1:]))
print('Edit manifest',cursor,'frames',cursor/FPS,'seconds; modes',{k:sum(s['mode']==k for s in rows) for k in ['authored_vector','R9_3D','licensed_real']},'worker frames',loads)
