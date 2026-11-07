"""Actions-only exact active-unit selection across original and bounded recovery runs.
Original archives and all earlier editions are never modified. Unfinished/unreceipted
media is never used; a corrected new-R5 picture replaces only its rejected new-R5 unit.
"""
import os,json,sys,hashlib
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
import requests
from remotezip import RemoteZip
from full_film_contract import plan
from correction_contract import validate
proof=validate();R=Path(__file__).resolve().parents[1];request=json.loads((R/'production/ASSEMBLY_REQUEST.json').read_text());recovery=json.loads((R/'production/RECOVERY_RENDER_REQUEST.json').read_text());assert str(request['native_run_id'])==sys.argv[1]
base='https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY'];h={'Authorization':'Bearer '+os.environ['GH_TOKEN']};net=requests.Session();net.mount('https://',requests.adapters.HTTPAdapter(max_retries=__import__('urllib3').util.Retry(total=5,backoff_factor=1,status_forcelist=[429,500,502,503,504])))
def get(url):
 r=net.get(url,headers=h);r.raise_for_status();return r.json()
def artifacts(run):return {a['name']:a for a in get(base+'/actions/runs/'+str(run)+'/artifacts')['artifacts']}
newrun=get(base+'/actions/runs/'+str(request['native_run_id']));assert newrun['conclusion']=='success' and newrun['head_sha']==request['native_source_commit']
oldjobs=get(base+'/actions/runs/'+str(recovery['base_native_run_id'])+'/jobs')['jobs'];assert any(j['name']=='continuous-motion-preflight' and j['conclusion']=='success' for j in oldjobs)
for i in range(1,6):assert any(j['name']=='new-native-pictures ('+str(i)+')' and j['conclusion']=='success' for j in oldjobs)
a=artifacts(recovery['base_native_run_id']);b=artifacts(request['native_run_id']);jobs=[(a['r5-new-native-'+str(i)],False) for i in range(1,6)]+[(b['r5-salvaged-native-0'],False)]+[(b['r5-recovery-native-'+str(i)],True) for i in range(4)]
out=Path('NATIVE_SHARDS/reviewed-active-93');out.mkdir(parents=True,exist_ok=False);rows={r['key']:r for r in plan()};newkeys=set(recovery['selected_keys']);sources={};evidence={};origins=[]
for artifact,is_new in jobs:
 response=net.get(artifact['archive_download_url'],headers=h,allow_redirects=False);assert response.status_code==302
 with RemoteZip(response.headers['Location'],support_suffix_range=False,session=net) as z:
  jsons={f.filename:z.read(f) for f in z.infolist() if not f.is_dir() and f.filename.endswith('.json')};receipts=[]
  for name,data in jsons.items():
   d=json.loads(data)
   if d.get('schema')=='R5-new-picture-v1':receipts.append((name,data,d))
  selected=[]
  for name,data,d in receipts:
   key=d['key']
   if not is_new and key in newkeys:continue
   assert key in rows and key not in sources and ((key in newkeys)==is_new)
   assert d['source_runtime_fingerprint']==(proof['corrected_runtime_fingerprint'] if is_new else proof['base_runtime_fingerprint'])
   assert str(d['github_run_id'])==str(request['native_run_id'] if is_new else recovery['base_native_run_id'])
   assert d['source_commit']==(request['native_source_commit'] if is_new else recovery['base_source_commit'])
   assert d['new_native_picture'] and not d['prior_edition_unit_reused'] and d['edition']=='R5'
   assert d['encoded_frames']==d['rendered_frame_count']==rows[key]['encoded_frames']
   video=z.read(d['video']);assert len(video)==d['video_bytes'] and hashlib.sha256(video).hexdigest()==d['video_sha256']
   gname=key+'_GEOMETRY.json';geometry=jsons[gname];g=json.loads(geometry);assert len(g['checks'])==rows[key]['encoded_frames'] and all(not c['flags'] and c['actual_film_key']==key for c in g['checks'])
   for filename,content in [(name,data),(d['video'],video),(gname,geometry)]:
    assert Path(filename).name==filename and not (out/filename).exists();(out/filename).write_bytes(content)
   sources[key]={k:d[k] for k in ['github_run_id','source_commit','source_runtime_fingerprint','video_sha256']};selected.append(key)
  decoded=json.loads(jsons['ENCODED_REVIEW_EVIDENCE.json'])
  for e in decoded['units']:
   if e['key'] in selected:
    assert e['key'] not in evidence;evidence[e['key']]=e
  origins.append({'artifact_id':artifact['id'],'artifact_name':artifact['name'],'selected_keys':selected,'picture_bytes_changed':False})
assert set(sources)==set(evidence)==set(rows) and len(sources)==93
(out/'ENCODED_REVIEW_EVIDENCE.json').write_text(json.dumps({'units':list(evidence.values()),'derived_metadata_selection_only':True,'original_actual_decoded_evidence_archives':origins,'artistic_approval':False},indent=2))
(out/'ACTIVE_PICTURE_PROVENANCE.json').write_text(json.dumps({'all93_new_R5':True,'prior_edition_picture_units':0,'exact_source_compatibility':proof,'unit_sources':sources,'archives':origins,'artistic_approval':False},indent=2));print('Selected93 complete NEW R5 native units; preserved86 and generated7. No prior-edition picture and no subjective approval inferred.')
