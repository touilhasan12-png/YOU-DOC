"""Actions-only recovery of complete immutable new-R5 units, never the unfinished movie."""
import os,json,hashlib
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
import requests
from remotezip import RemoteZip
from full_film_contract import plan
R=Path(__file__).resolve().parents[1];request=json.loads((R/'production/RECOVERY_RENDER_REQUEST.json').read_text());headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']};base='https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY'];session=requests.Session();session.mount('https://',requests.adapters.HTTPAdapter(max_retries=__import__('urllib3').util.Retry(total=5,backoff_factor=1,status_forcelist=[429,500,502,503,504])))
r=session.get(base+'/actions/artifacts/'+str(request['base_partial_artifact_id'])+'/zip',headers=headers,allow_redirects=False);assert r.status_code==302
out=Path('R5_NATIVE');out.mkdir(exist_ok=False);expected={r['key']:r for i,r in enumerate(plan()) if i%6==0 and r['key'] not in request['missing_keys']};copied=[]
with RemoteZip(r.headers['Location'],support_suffix_range=False,session=session) as z:
 receipts=[]
 for f in z.infolist():
  if f.filename.endswith('.json'):
   data=z.read(f);d=json.loads(data)
   if d.get('schema')=='R5-new-picture-v1':receipts.append((f.filename,data,d))
 assert {d['key'] for _,_,d in receipts}==set(expected)
 for name,data,d in receipts:
  key=d['key'];row=expected[key];assert d['new_native_picture'] and not d['prior_edition_unit_reused']
  assert str(d['github_run_id'])==str(request['base_native_run_id']) and d['source_commit']==request['base_source_commit']
  assert d['source_runtime_fingerprint']==request['base_runtime_fingerprint']
  assert d['rendered_frame_count']==d['encoded_frames']==row['encoded_frames']
  video=z.read(d['video']);assert len(video)==d['video_bytes'] and hashlib.sha256(video).hexdigest()==d['video_sha256']
  gname=key+'_GEOMETRY.json';gdata=z.read(gname);g=json.loads(gdata);assert len(g['checks'])==row['encoded_frames'] and all(not c['flags'] and c['actual_film_key']==key for c in g['checks'])
  for filename,content in [(name,data),(d['video'],video),(gname,gdata)]:
   assert Path(filename).name==filename;(out/filename).write_bytes(content)
  copied.append({'key':key,'video_sha256':d['video_sha256'],'frames':d['encoded_frames']})
(out/'SALVAGE_PROVENANCE.json').write_text(json.dumps({'source_artifact_id':request['base_partial_artifact_id'],'source_run':request['base_native_run_id'],'unchanged_completed_new_units':copied,'unreceipted_partial_video_ignored':True,'media_reencoded':False,'artistic_approval':False},indent=2));print('Preserved intact newly generated units without rerendering:',copied)
