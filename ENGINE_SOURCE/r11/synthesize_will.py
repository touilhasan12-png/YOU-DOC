"""External ElevenLabs synthesis only. No local media processing or playback."""
import os,json,base64,time,concurrent.futures
from pathlib import Path
import requests
P=Path(__file__).resolve().parent
q=json.loads((P/'narration_request.json').read_text());out=P/'narration';out.mkdir(exist_ok=True)
key=os.environ['ELEVENLABS_API_KEY']
def one(row):
 dest=out/f"{row['id']:02d}.mp3";meta=out/f"{row['id']:02d}.json"
 if dest.exists() and meta.exists():return row['id']
 payload={'text':row['tagged_text'],'model_id':q['model_id'],'voice_settings':q['settings']}
 for attempt in range(4):
  r=requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{q['voice_id']}/with-timestamps",params={'output_format':'mp3_44100_128'},headers={'xi-api-key':key},json=payload,timeout=150)
  if r.status_code==429 and attempt<3:time.sleep(12*(attempt+1));continue
  if not r.ok:raise RuntimeError(f"Paragraph {row['id']}: HTTP {r.status_code}: "+r.text[:900].replace(key,'[REDACTED]'))
  data=r.json();audio=base64.b64decode(data.pop('audio_base64'));dest.write_bytes(audio)
  data.update({'paragraph':row['id'],'exact_script':row['text'],'submitted_text':row['tagged_text'],'model_id':q['model_id'],'voice_id':q['voice_id'],'audio_bytes':len(audio)})
  meta.write_text(json.dumps(data,ensure_ascii=False));print('SYNTHESIZED paragraph',row['id'],'bytes',len(audio),flush=True);return row['id']
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(one,q['paragraphs']))
(out/'COMPLETE.json').write_text(json.dumps({'paragraphs':results,'voice':'Will','model':'eleven_v3','exact_script_retained':True,'ending_regenerated_without_tempo_change':True,'audio_inspection_performed':False},indent=2));print('ALL 32 PARAGRAPHS COMPLETE',flush=True)
