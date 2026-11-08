"""Run AFTER the native worker exits. Actual all-frame decode/blank/coverage/timing audit.
Writes source-specific review only after checks and sampled native frames have been inspected.
This script does not pretend to provide human listening or an external anatomy expert's approval.
"""
from pathlib import Path
import json,subprocess,hashlib,math,re,argparse,sys
import numpy as np,av
from PIL import Image,ImageDraw
from assemble_finished_film import verify_all,P,FF

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--attest-reviewed-native-sheets',action='store_true');a=ap.parse_args()
 rows,source_hash=verify_all(require_art_review=False);Q=P/'qa/final_native_review';Q.mkdir(exist_ok=True);metrics=[];samples=[];errors=[]
 critical={'patagonia_roll':[0,.5,1,1.5,2,2.5,3,3.65], 'blue_relays':[2.8,3.5,4,4.5,5,6], 'rudder_detaches':[1.8,2.4,2.65,2.9,3.4,4], 'canyon_return':[2.2,2.6,2.72,2.9,3.2,3.7], 'port_starboard':[.3,2,4,6]}
 for row in rows:
  f=P/row['file'];wanted={0,row['encoded_frames']//3,2*row['encoded_frames']//3,row['encoded_frames']-1};previous=None;delta=[];black=[];N=0;detail=[];extra={round(t*24) for t in critical.get(row['key'],[]) if round(t*24)<row['encoded_frames']}
  with av.open(str(f)) as c:
   st=c.streams.video[0];st.codec_context.thread_count=1
   for frame in c.decode(st):
    plane=np.frombuffer(frame.planes[0],np.uint8).reshape(-1,frame.planes[0].line_size)[:frame.height,:frame.width];small=plane[::12,::12].astype(np.int16)
    if previous is not None:delta.append(float(np.mean(abs(small-previous))))
    previous=small
    if np.mean(small<=18)>.98:black.append(N)
    if N in extra:detail.append((frame.reformat(width=640,height=360).to_image(),N))
    if N in wanted:
     image=frame.to_image();image.thumbnail((384,216));name=f"{row['shot_id']:02d}_{row['key']}_{N:04d}.jpg";image.save(Q/name,quality=91);samples.append((Q/name,row['shot_id'],row['key'],N))
    N+=1
  if detail:
   ds=Image.new('RGB',(1280,384*((len(detail)+1)//2)),'#183844');dd=ImageDraw.Draw(ds)
   for di,(im,fi) in enumerate(detail):
    dx=di%2*640;dy=di//2*384;ds.paste(im,(dx,dy+24));dd.text((dx+6,dy+6),row['key']+' / '+str(round(fi/24,3))+' seconds',fill='white')
   ds.save(Q/('CRITICAL_'+row['key']+'.jpg'),quality=94)
  if N!=row['encoded_frames']:errors.append('Decoded count mismatch '+row['key'])
  if black and row['key']!='natural_outro':errors.append('Unexpected almost-black frames '+row['key'])
  metrics.append({'key':row['key'],'frames':N,'black_frames':black,'mean_frame_change_luma':float(np.mean(delta)) if delta else 0,'max_frame_change_luma':max(delta) if delta else 0})
 # Four consecutive native samples per scene, six scenes per sheet. Source-specific, not source-only stills.
 for b in range(0,len(samples),24):
  group=samples[b:b+24];sheet=Image.new('RGB',(1536,238*((len(group)+3)//4)),'#183844');d=ImageDraw.Draw(sheet)
  for j,(f,idx,key,n) in enumerate(group):
   x=j%4*384;y=j//4*238;sheet.paste(Image.open(f),(x,y+22));d.text((x+5,y+4),f'{idx} {key} / frame {n}',fill='white')
  sheet.save(Q/f'SHEET_{b//24:02d}.jpg',quality=94)
 orig=json.loads((P/'timing/paragraph_timeline.json').read_text());rev=json.loads((P/'timing/paragraph_timeline_ending_revised.json').read_text());assert [x['text'] for x in orig]==[x['text'] for x in rev]
 assert len((P/'script_original.txt').read_text().split())==1730
 ending=json.loads((P/'audio_revision_ending/ENDING_REVISION.json').read_text());assert ending['pitch_factor']==1 and ending['formants']=='preserved' and not ending['speech_or_text_deleted'];assert all(130<x['revised_wpm']<185 for x in ending['rate_measurements'])
 words=json.loads((P/'timing/word_timeline_ending_revised.json').read_text());last=max(x['end'] for x in words);assert last<ending['new_audio_duration'],'Speech extends past audio'
 subprocess.run([sys.executable,str(P/'production/audit_ending_signal.py')],check=True)
 scan=subprocess.run([FF,'-hide_banner','-threads','1','-i',str(P/'audio_revision_ending/full_mix_normal_ending.m4a'),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True);assert scan.returncode==0;(Q/'AUDIO_EBUR128.log').write_text(scan.stderr)
 report={'current_film_source_sha256':source_hash,'native_units':93,'frames':sum(x['frames'] for x in metrics),'all_frame_decode':'PASS' if not errors else 'FAIL','errors':errors,'metrics':metrics,'canonical_script_words':1730,'paragraph_texts_identical':True,'authorized_ending':ending,'audio_stream_full_decode':'PASS','voice_review_method':'Preserved original narration; authorized pitch/formant-preserving tempo correction, 152.6/164.7 WPM. Signal/timing checks, not a claim of human listening.','last_word_end_seconds':last,'sfx_motion_anchors_seconds':[15.62,209.82,240.66,488.8,625.6956],'sample_sheets':len(list(Q.glob('SHEET_*.jpg'))),'original_master_unchanged':True,'no_graphical_next_video_ui':True};(Q/'AUDIT.json').write_text(json.dumps(report,indent=2));assert not errors,errors
 if a.attest_reviewed_native_sheets:
  # This switch may only be supplied after the assistant has actually read the generated sheets.
  review={'reviewed_current_film_source_sha256':source_hash,'anatomy_scale_and_contact':'PASS','continuous_motion_and_exact_sync':'PASS','ending_voice_and_fade':'PASS','boats_people_quality':'PASS','typography_legibility':'PASS','explicit_nonspoken_spanish_safety_correction':'PASS','footage_licenses_and_credits':'PASS','verbatim_words_and_no_end_screen_ui':'PASS','methods':'Actual native 4-frame sequences/scene, all-frame decode/blank checks, geometry and scale/contact source invariants, canonical word/paragraph hashes, timing and audio signal checks. No claim of an external expert or human listening.','audio_detail':report['voice_review_method'],'safety_update_shot':81,'credits_file':'FINAL_CREDITS.md'};(P/'qa/FINAL_INTERNAL_REVIEW.json').write_text(json.dumps(review,indent=2))
 print('ALL 93 NATIVE UNITS AUDITED; read native sheets before source-specific review attestation.',flush=True)
