"""Combine real disjoint native shards; duplicate per-shot media/receipts are errors."""
import os,json,shutil,argparse
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('destination',type=Path);x=p.parse_args();x.destination.mkdir(parents=True,exist_ok=False)
for shard in sorted(x.source.iterdir()):
 if not shard.is_dir():continue
 for f in shard.rglob('*'):
  if not f.is_file():continue
  target=x.destination/f.name
  if f.name in {'NATIVE_RENDER_REPORT.json','ENCODED_REVIEW_EVIDENCE.json'} or f.name.startswith('ENCODED_CONTACT_'):target=x.destination/(shard.name+'_'+f.name)
  assert not target.exists(),f'Duplicate native evidence: {target.name}'
  shutil.copy2(f,target)
receipts=[]
for f in x.destination.glob('*.json'):
 r=json.loads(f.read_text())
 if r.get('schema')=='R5-new-picture-v1':receipts.append(r)
assert len(receipts)==93 and len({r['key'] for r in receipts})==93,'All 93 fresh unit receipts required'
request=json.loads(Path('ENGINE_SOURCE/r5/production/RECOVERY_RENDER_REQUEST.json').read_text())
assert {r['source_runtime_fingerprint'] for r in receipts}=={request['base_runtime_fingerprint'],request['runtime_fingerprint']}
assert sum(r['source_runtime_fingerprint']==request['runtime_fingerprint'] for r in receipts)==len(request['selected_keys'])
print('Merged actual 93-unit native evidence. No artistic approval inferred.')
