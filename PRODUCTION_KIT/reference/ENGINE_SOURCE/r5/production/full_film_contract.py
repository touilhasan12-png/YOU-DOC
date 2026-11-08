"""Fail-closed full-film gate: 93 newly generated R5 pictures, never a ten-shot patch.
Static receipts/hash validation is not an artistic assessment or a substitute for it.
"""
from pathlib import Path
import hashlib,json,argparse,math
R=Path(__file__).resolve().parents[1];P=R.parent
SCRIPT_SHA='af5f03682a9d6fe4c53393a806e2dbb35e51ae2818de102efc42ef242be70eb9'
AUDIO_PAYLOAD_SHA='743d56c7a1d3f438ee3dfa53597d0b469c1395880da44a9d6bf1c49ac707d898'
CRITICAL={'rudder_detaches','hypothesis_play','hypothesis_imitation','helm_response','surfer_incident','diver_entanglement','swim_comparison','floe_wave','patagonia_strand','whaler_view','seal_capture'}
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def plan():
 assert sha(P/'script_original.txt')==SCRIPT_SHA,'Original script changed'
 rows=json.loads((R/'design/DIRECTOR_PLAN_93.json').read_text());assert len(rows)==93
 assert rows[0]['frame_start']==0 and rows[-1]['frame_end']==15969
 for i,r in enumerate(rows):
  assert r['previous_encoded_unit_allowed'] is False
  assert r['new_authored_composition_required'] is True
  assert r['frame_start']==math.ceil(r['start']*24-1e-7)
  assert r['frame_end']==min(15969,math.ceil(r['end']*24-1e-7))
  assert r['encoded_frames']==r['frame_end']-r['frame_start']
  if i:assert r['frame_start']==rows[i-1]['frame_end']
 assert sum(r['encoded_frames'] for r in rows)==15969
 return rows
def runtime_fingerprint(film_source_sha=None):
 # Deliberately excludes review prose, upload scripts and Git metadata: editing notes
 # must not force a wasteful picture rerender if actual runtime/assets did not change.
 files=[p for p in (R/'web').glob('*.js') if p.name not in {'bundle.js','film-bundle.js'}]+list((R/'web').glob('*.html'))
 files += [R/'design/DIRECTOR_PLAN_93.json',R/'rights/SNOW_SOURCE_RECEIPT.json',R/'rights/PRODUCTION_ASSETS.json']
 files += [p for p in (R/'assets').rglob('*') if p.is_file()]
 return hashlib.sha256(json.dumps([(str(p.relative_to(R)),film_source_sha if film_source_sha and p==R/'web/film.js' else sha(p)) for p in sorted(files)],separators=(',',':')).encode()).hexdigest()
def validate_units(directory,review):
 rows=plan();fingerprint=runtime_fingerprint();review=json.loads(review.read_text())
 from correction_contract import validate
 compatibility=validate();recovery=json.loads((R/'production/RECOVERY_RENDER_REQUEST.json').read_text());expected_sources=review['expected_unit_sources']
 assert set(expected_sources)=={r['key'] for r in rows}
 assert review['exact_source_compatibility']==compatibility and compatibility['corrected_runtime_fingerprint']==fingerprint
 assert review['edition']=='R5' and review['runtime_fingerprint']==fingerprint
 assert review['all_93_shots_visually_reviewed'] is True
 assert review['scope']=='complete_new_picture' and review['status']=='approved_for_assembly'
 assert set(review['reviewed_keys'])=={r['key'] for r in rows}
 assert review['continuous_subjective_playback_claimed'] is False
 evidence=review['critical_motion_evidence'];assert CRITICAL<=set(evidence)
 for key in CRITICAL:
  e=evidence[key];row=next(r for r in rows if r['key']==key)
  assert e['scope']=='dense_actual_encoded_samples_plus_every_frame_geometry'
  assert e['geometry_frames_checked']==row['encoded_frames'] and e['geometry_failure_count']==0
  assert len(set(e['reviewed_encoded_sample_frames']))>=6
  assert 0 in e['reviewed_encoded_sample_frames'] and row['encoded_frames']-1 in e['reviewed_encoded_sample_frames']
  assert len(e['reviewer_visual_notes'])>30
  g=json.loads((directory/(key+'_GEOMETRY.json')).read_text());assert len(g['checks'])==row['encoded_frames']
  assert all(not c['flags'] and c['actual_film_key']==key for c in g['checks'])
 assert review['technical_checks_are_not_artistic_approval'] is True
 receipts=list(directory.glob('*.json'));by={}
 for p in receipts:
  d=json.loads(p.read_text())
  if d.get('schema')=='R5-new-picture-v1':
   assert d['key'] not in by,'Duplicate picture receipt';by[d['key']]=d
 assert set(by)=={r['key'] for r in rows},'Missing or extraneous new R5 units; no 83-old-unit fallback'
 hashes=set()
 for row in rows:
  d=by[row['key']]
  assert d['edition']=='R5'
  is_recovered=row['key'] in recovery['selected_keys']
  expected_fp=fingerprint if is_recovered else compatibility['base_runtime_fingerprint']
  assert d['source_runtime_fingerprint']==expected_fp
  assert {k:d[k] for k in ['github_run_id','source_commit','source_runtime_fingerprint','video_sha256']}==expected_sources[row['key']]
  assert str(d['github_run_id'])==str(review['recovery_native_run_id'] if is_recovered else recovery['base_native_run_id'])
  assert d['source_commit']==(review['recovery_source_commit'] if is_recovered else recovery['base_source_commit'])
  assert d['new_native_picture'] is True and d['prior_edition_unit_reused'] is False
  assert d['executed_on']=='GitHub Actions' and d['github_run_id'] and d['source_commit']
  assert d['rendered_key']==row['key'] and d['width']==1920 and d['height']==1080 and d['fps']==24
  for k in ['frame_start','frame_end','encoded_frames']:assert d[k]==row[k]
  assert d['rendered_frame_count']==row['encoded_frames']
  video=(directory/d['video']).resolve();assert video.is_relative_to(directory.resolve())
  assert video.exists() and video.stat().st_size==d['video_bytes']
  digest=sha(video);assert digest==d['video_sha256'] and digest not in hashes
  hashes.add(digest)
 return {'edition':'R5','unit_count':93,'new_picture_frames':15969,'duration_seconds':665.375,'old_encoded_units_used':0,'runtime_fingerprint':fingerprint,'source_runtime_fingerprints_used':sorted({d['source_runtime_fingerprint'] for d in by.values()}),'per_key_native_provenance':expected_sources,'exact_source_compatibility':compatibility,'script_sha256':SCRIPT_SHA,'required_audio_payload_sha256':AUDIO_PAYLOAD_SHA,'scope':'Validated receipts and the explicitly separate internal review record; actual subjective quality remains the responsibility of that review.'}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--units',type=Path);ap.add_argument('--review',type=Path);args=ap.parse_args()
 if args.units:
  assert args.review,'A real complete internal review record is required';print(json.dumps(validate_units(args.units,args.review),indent=2))
 else:print(json.dumps({'static_plan_units':len(plan()),'runtime_fingerprint':runtime_fingerprint(),'full_film_approved':False,'note':'Plan/fingerprint only. No picture generation or artistic approval is asserted.'},indent=2))
