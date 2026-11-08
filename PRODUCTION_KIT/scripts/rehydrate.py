"""Reassemble included chunks, never download production inputs."""
from pathlib import Path
import hashlib,json,os
R=Path(__file__).resolve().parents[1]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
for row in json.loads((R/'PAYLOAD_PARTS.json').read_text()):
 target=R/row['path'];assert target.is_relative_to(R)
 if target.exists()and sha(target)==row['sha256']:continue
 target.parent.mkdir(parents=True,exist_ok=True);temp=target.with_name(target.name+'.joining')
 with temp.open('wb')as o:
  for part in row['parts']:
   p=R/part['path'];assert p.is_relative_to(R)and sha(p)==part['sha256']
   with p.open('rb')as f:
    for b in iter(lambda:f.read(4*1024*1024),b''):o.write(b)
 assert sha(temp)==row['sha256'];os.replace(temp,target)
 if row['executable']:target.chmod(0o755)
for name in json.loads((R/'EXECUTABLES.json').read_text()):
 p=R/name
 if p.exists():p.chmod(0o755)
print('All included payloads reconstructed and verified; no old repository required.')
