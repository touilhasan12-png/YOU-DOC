"""GitHub REST monitor and artifact transfer, no GitHub connector needed."""
from pathlib import Path
import urllib.request,urllib.error,urllib.parse,json,time,os,zipfile,shutil
R=Path(__file__).resolve().parents[1];state=json.loads((R/'RUN_STATE.json').read_text());token=Path(os.environ.get('GH_TOKEN_FILE','/tmp/gh_token')).read_text().strip();base='https://api.github.com/repos/'+state['owner']+'/'+state['repo']
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  redirected=super().redirect_request(req,fp,code,msg,headers,newurl)
  if redirected is not None and urllib.parse.urlsplit(req.full_url).netloc!=urllib.parse.urlsplit(newurl).netloc:
   redirected.remove_header('Authorization')
  return redirected
opener=urllib.request.build_opener(SafeRedirect())
def get(u):
 req=urllib.request.Request(u,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'})
 return opener.open(req,timeout=180)
for attempt in range(60):
 with get(base+'/actions/runs?per_page=100')as r:all_runs=json.load(r)['workflow_runs']
 runs=[r for r in all_runs if r['head_sha']==state['source_commit']and r['name']=='Production kit — four-scene opening test']
 if runs:run=runs[0];break
 time.sleep(10)
else:raise RuntimeError('Workflow did not start. Check Actions enablement/workflow write permissions and branch; do not ask user to upload sources.')
state['run_id']=run['id'];(R/'RUN_STATE.json').write_text(json.dumps(state,indent=2));last=''
while True:
 with get(base+'/actions/runs/'+str(run['id']))as r:run=json.load(r)
 with get(base+'/actions/runs/'+str(run['id'])+'/jobs?per_page=100')as r:jobs=json.load(r)
 text='; '.join(j['name']+': '+str(j['conclusion']or j['status'])for j in jobs['jobs'])
 if text!=last:print(text,flush=True);last=text
 (R/'RUN_REPORT.json').write_text(json.dumps({'run':run,'jobs':jobs},indent=2))
 if run['status']=='completed':
  if run['conclusion']!='success':raise RuntimeError('GitHub run failed. Inspect failed job logs and fix source; do not call a failed render complete.')
  break
 time.sleep(25)
with get(base+'/actions/runs/'+str(run['id'])+'/artifacts?per_page=100')as r:artifacts=json.load(r)['artifacts']
(R/'RUN_ARTIFACTS.json').write_text(json.dumps(artifacts,indent=2));out=R/'downloaded';out.mkdir(exist_ok=True)
for a in artifacts:
 if a['name']not in['kit-opening-delivery','kit-opening-review']and not a['name'].startswith('kit-proof-'):continue
 folder=out/a['name'];folder.mkdir(exist_ok=True);archive=folder/'transfer.zip'
 with get(a['archive_download_url'])as src,archive.open('wb')as dst:shutil.copyfileobj(src,dst)
 with zipfile.ZipFile(archive)as z:
  for member in z.infolist():
   if member.is_dir():continue
   dest=(folder/member.filename).resolve();assert dest.is_relative_to(folder.resolve()),'Unsafe archive path'
   dest.parent.mkdir(parents=True,exist_ok=True)
   with z.open(member)as src,dest.open('wb')as dst:shutil.copyfileobj(src,dst)
 archive.unlink();print('Downloaded:',a['name'],flush=True)
print('Artifacts downloaded. Inspect actual images and audio before Drive delivery.',flush=True)
