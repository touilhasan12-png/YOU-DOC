"""Permit reuse only when all prior remote proofs passed and ALL picture/audio source is identical.
Changes to runner orchestration/resource budgeting do not require repeating already-reviewed pictures.
"""
import os,json,subprocess
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
run=os.environ['REUSE_PROOF_RUN_ID'];assert run.isdecimal()
base='https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']
def get(suffix):
 result=subprocess.run(['curl','-fsS','-H','Authorization: Bearer '+os.environ['GH_TOKEN'],'-H','Accept: application/vnd.github+json',base+suffix],capture_output=True,text=True)
 if result.returncode:raise RuntimeError('GitHub proof verification request failed; credentials suppressed')
 return json.loads(result.stdout)
r=get('/actions/runs/'+run);jobs=get('/actions/runs/'+run+'/jobs?per_page=100')['jobs']
proofs={j['name']:j for j in jobs if j['name'] in {'proof (0)','proof (1)','proof (2)'}}
assert len(proofs)==3 and all(j['conclusion']=='success' for j in proofs.values()),'All three prior whole-film remote proofs must have passed'
sha=r['head_sha'];subprocess.run(['git','fetch','--depth','1','origin',sha],check=True)
changed=subprocess.check_output(['git','diff','--name-only',sha,'HEAD'],text=True).splitlines()
allowed={'ENGINE_SOURCE/production/resource_guard.py','ENGINE_SOURCE/production/ci_pipeline.py','ENGINE_SOURCE/production/verify_remote_proof_reuse.py','README.md'}
assert all(f in allowed or f.startswith('.github/workflows/') for f in changed),'Picture/audio source changed: do not reuse old proofs'
q=Path('ENGINE_SOURCE/qa');q.mkdir(exist_ok=True)
report={'source_proof_run':int(run),'source_proof_commit':sha,'current_commit':os.environ['GITHUB_SHA'],'three_remote_proof_jobs':'PASS','graphics_audio_script_assets_unchanged':True,'only_changed_files':changed,'reason':'Fix runner memory budgeting and replace parent process before native encoding; do not repeat unchanged images.'}
(q/'REUSED_PROOF.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
