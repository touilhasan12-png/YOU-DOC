from pathlib import Path
import json,hashlib,re,sys
R=Path(__file__).resolve().parents[1];s=json.loads((R/'SPEC.json').read_text());rows=json.loads((R/'templates/OPENING_TEST.json').read_text())
assert len(rows)==s['scene_count']==s['paragraph_count']==4
assert s['duration_seconds']==60 and s['fps']==24 and s['width']==1920 and s['height']==1080
assert s['total_frames']==s['duration_seconds']*s['fps']==1440
assert s['frames_per_scene']==s['scene_duration_seconds']*s['fps']==360
assert all(x['duration']==15 and x['frames']==360 for x in rows)
assert sum(x['frames']for x in rows)==1440
line='TEST_SPEC: scenes=4; paragraphs=4; duration=60s; scene=15s; size=1920x1080; fps=24; frames=1440; scene_frames=360.'
files=sorted(R.glob('0[0-7]_*.txt'));assert len(files)==8
for p in files:assert p.read_text().count(line)==1,p.name
patterns=[re.compile(rb'gh[pousr]_[A-Za-z0-9_]{20,}'),re.compile(rb'github_pat_[A-Za-z0-9_]{20,}'),re.compile(rb'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----')]
for p in R.rglob('*'):
 if not p.is_file()or any(x in p.parts for x in ['node_modules','.git','_cacache','payloads','browsers']):continue
 if p.suffix.lower()in['.py','.js','.mjs','.json','.txt','.md','.yml','.sh','.html']:
  b=p.read_bytes()
  assert not any(q.search(b)for q in patterns),'Secret-like literal in '+str(p.relative_to(R))
if (R/'MANIFEST.json').exists():
 for row in json.loads((R/'MANIFEST.json').read_text())['files']:
  p=R/row['path'];assert p.exists()and p.stat().st_size==row['bytes'],row['path']
  h=hashlib.sha256()
  with p.open('rb')as f:
   for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
  assert h.hexdigest()==row['sha256'],row['path']
print('PASS: eight documents agree; 4 scenes / 60 seconds / 1440 frames; manifest and secret scan valid.')
