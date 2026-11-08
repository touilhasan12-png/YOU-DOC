"""Validate current kit, then emit only fullZIP and matching masterTXT outside its tree."""
from pathlib import Path
import json,sys,hashlib,zipfile,subprocess,shutil
R=Path(__file__).resolve().parents[1];out=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else R.parent/'release';out.mkdir(parents=True,exist_ok=True)
assert not out.is_relative_to(R),'Release directory must be outside kit'
# Refresh inventory explicitly from portable source, never from runtime-generated files.
logical={x['path']for x in json.loads((R/'PAYLOAD_PARTS.json').read_text())}
excluded={'node_modules','__pycache__','.git','generated','downloaded','early-proof'};files=[]
for p in sorted(R.rglob('*')):
 if not p.is_file()or any(x in excluded for x in p.relative_to(R).parts):continue
 rel=str(p.relative_to(R))
 if rel in logical or p.name in['MANIFEST.json','RUN_STATE.json','RUN_REPORT.json','RUN_ARTIFACTS.json']or p.suffix in['.pyc','.log']:continue
 if rel.startswith('runtime/engine/'):continue
 assert p.name not in['gh_token','gh_headers','.env']and '.private'not in p.parts,'Credential file cannot be packaged'
 h=hashlib.sha256()
 with p.open('rb')as src:
  for block in iter(lambda:src.read(4*1024*1024),b''):h.update(block)
 files.append({'path':rel,'bytes':p.stat().st_size,'sha256':h.hexdigest()})
m=json.loads((R/'MANIFEST.json').read_text());m['files']=files;(R/'MANIFEST.json').write_text(json.dumps(m,indent=2));subprocess.run([sys.executable,str(R/'scripts/validate_kit.py')],check=True)
archive=out/'FULL_PRODUCTION_KIT.zip';temp=out/'FULL_PRODUCTION_KIT.building'
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True)as z:
 for row in files:z.write(R/row['path'],row['path'])
 z.write(R/'MANIFEST.json','MANIFEST.json')
with zipfile.ZipFile(temp)as z:
 assert z.testzip()is None
 assert z.read('00_MASTER_PROMPT.txt')==(R/'00_MASTER_PROMPT.txt').read_bytes()
 assert len([n for n in z.namelist()if len(Path(n).parts)==1 and n.startswith(tuple(f'{i:02}_'for i in range(8)))and n.endswith('.txt')])==8
 for row in files:
  h=hashlib.sha256()
  with z.open(row['path'])as src:
   for block in iter(lambda:src.read(4*1024*1024),b''):h.update(block)
  assert h.hexdigest()==row['sha256'],row['path']
temp.replace(archive);shutil.copyfile(R/'00_MASTER_PROMPT.txt',out/'00_MASTER_PROMPT.txt');print('Verified archive built:',archive,archive.stat().st_size)
