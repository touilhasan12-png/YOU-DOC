from pathlib import Path
import json,hashlib,wave,re,os
import numpy as np
from difflib import SequenceMatcher
R=Path(__file__).resolve().parents[1]
assert os.environ.get('GITHUB_ACTIONS')=='true','Audio processing only on GitHub Actions'
original=(R/'SCRIPT_ORIGINAL.txt').read_bytes();state=json.loads((R/'PROJECT_STATE.json').read_text());assert hashlib.sha256(original).hexdigest()==state['original_sha256']
rows=json.loads((R/'SCRIPT_SECTIONS.json').read_text());out=R/'generated'/os.environ.get('LEOPARD_AUDIT_DIR','audio-audit');out.mkdir(parents=True,exist_ok=True);reports=[]
try:
 from faster_whisper import WhisperModel
 model=WhisperModel(os.environ.get('LEOPARD_ASR_MODEL','tiny.en'),device='cpu',compute_type='int8',cpu_threads=2)
 model_error=None
except Exception as e:model=None;model_error=type(e).__name__+': '+str(e)[:220]
for row in rows:
 p=R/'audio'/f"{row['section']:02}.wav";item={'section':row['section'],'text_sha256':hashlib.sha256(row['narration'].encode()).hexdigest(),'script_rewritten':False}
 if not p.exists():item.update(status='MISSING_TOOL_MODERATION_BLOCK',duration_seconds=None);reports.append(item);continue
 with wave.open(str(p),'rb')as w:
  item.update(duration_seconds=w.getnframes()/w.getframerate(),sample_rate=w.getframerate(),channels=w.getnchannels());assert w.getsampwidth()==2;raw=w.readframes(w.getnframes())
 audio=np.frombuffer(raw,dtype='<i2').astype(np.float32).reshape(-1,item['channels']).mean(axis=1)/32768.
 if item['sample_rate']!=16000:
  n=round(len(audio)*16000/item['sample_rate']);audio=np.interp(np.arange(n)*item['sample_rate']/16000,np.arange(len(audio)),audio).astype(np.float32)
 item['audio_sha256']=hashlib.sha256(p.read_bytes()).hexdigest();item['status']='GENERATED_PENDING_ARTISTIC_LISTENING'
 if model:
  segments,info=model.transcribe(audio,language='en',beam_size=5,word_timestamps=True,vad_filter=False);segments=list(segments);words=[{'word':w.word,'start':w.start,'end':w.end,'probability':w.probability}for seg in segments for w in(seg.words or [])];transcript=''.join(s.text for s in segments);clean=lambda t:re.findall(r"[a-z0-9]+",t.lower());item['asr_transcript']=transcript;item['approx_word_similarity']=SequenceMatcher(None,clean(row['narration']),clean(transcript),autojunk=False).ratio();(out/f"WORDS_{row['section']:02}.json").write_text(json.dumps(words,indent=2))
 reports.append(item);print('AUDIT',row['section'],item['status'],item.get('duration_seconds'),flush=True)
summary={'original_script_sha256':hashlib.sha256(original).hexdigest(),'script_original_unchanged':True,'sections':reports,'completed_speech_sections':sum(x['status']!='MISSING_TOOL_MODERATION_BLOCK'for x in reports),'missing_speech_sections':[x['section']for x in reports if x['status']=='MISSING_TOOL_MODERATION_BLOCK'],'full_film_ready':False,'reason':'Section4 speech was blocked by the synthesis tool. It is preserved exactly; no safeguard bypass, no text substitution or hidden silent replacement.','ASR_error':model_error,'ASR_model':os.environ.get('LEOPARD_ASR_MODEL','tiny.en'),'ASR_is_not_human_listening_or_proof_of_perfect_pronunciation':True}
(out/'AUDIO_AUDIT.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
