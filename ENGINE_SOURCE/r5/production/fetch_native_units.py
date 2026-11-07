"""Actions-only selected archive download: preserve every native byte, skip redundant image copies."""
import os,json,sys
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
import requests
from remotezip import RemoteZip
run=sys.argv[1];repo=os.environ['GITHUB_REPOSITORY'];base='https://api.github.com/repos/'+repo;headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'}
r=requests.get(base+'/actions/runs/'+run+'/artifacts',headers=headers);r.raise_for_status();artifacts={a['name']:a for a in r.json()['artifacts']};expected={'r5-new-native-'+str(i) for i in range(6)};assert expected<=artifacts.keys()
for i in range(6):
 a=artifacts['r5-new-native-'+str(i)];dest=Path('NATIVE_SHARDS')/('shard-'+str(i));dest.mkdir(parents=True,exist_ok=False);response=requests.get(a['archive_download_url'],headers=headers,allow_redirects=False);assert response.status_code==302
 with RemoteZip(response.headers['Location']) as z:
  members=[f for f in z.infolist() if not f.is_dir() and f.filename.endswith(('.mp4','.json'))]
  for f in members:
   assert Path(f.filename).name==f.filename
   (dest/f.filename).write_bytes(z.read(f))
 print('Restored genuine native media/receipt members:',a['name'],a['id'],len(members),flush=True)
