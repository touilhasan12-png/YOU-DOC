"""Publish only the actual fully assembled and verified new film, never the rejected movie."""
from pathlib import Path
import json,urllib.request,urllib.error,hashlib,shutil
from urllib.parse import quote
R=Path(__file__).resolve().parents[1];s=json.loads((R/'FINAL_VISUAL_REBUILD_RUN_STATE.json').read_text());assert s['conclusion']=='success'
d=Path(s['downloaded_artifacts']['leopard-FINAL-VISUAL-REBUILD-MOVIE']);r=json.loads((d/'NEW_FILM_INTEGRATION_REPORT.json').read_text());assert r['frames']==15624 and r['duration_seconds']==651 and len(r['all_10_narration_recordings_verified'])==10 and r['real_video_source_count']==4 and r['real_photograph_source_count']==4 and r['real_video_frames_integrated']==924 and not r['rejected_visual_director_or_assembled_head_reused'];movie=d/'LEOPARD_SEAL_VISUAL_REBUILD.mp4';assert hashlib.sha256(movie.read_bytes()).hexdigest()==r['movie_sha256']
token=Path('/home/user/.private/gh_token').read_text().strip();base='https://api.github.com/repos/touilhasan12-png/YOU-DOC';tag='leopard-full-visual-rebuild-'+s['source_commit'][:7]
def call(url,data=None,method=None,ctype='application/json'):
 q=urllib.request.Request(url,data=data,method=method,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Content-Type':ctype,'X-GitHub-Api-Version':'2022-11-28'})
 with urllib.request.urlopen(q,timeout=180)as x:return json.load(x)
try:rel=call(base+'/releases/tags/'+tag)
except urllib.error.HTTPError as e:
 if e.code!=404:raise
 body={'tag_name':tag,'target_commitish':s['source_commit'],'name':'The Leopard Seal — complete NEW651s visual edit / real camera footage + central original2D + new3D','draft':False,'prerelease':False,'body':'A genuinely new full651-second /1920x1080 /24fps picture edit. All ten approved voice00 recordings remain at1.0x, with only the previously authorized section04 sentence variant. No newTTS. Original master and finalCTA unchanged.\n\nFour actual research-camera video sources are integrated as924 native camera frames (38.5seconds), in native-resolution archival insets. Exactly four real photographs. Original animated2D is the central visual element, with actual Rev2D/anidoodle/lemo runtime use and honest reelmimic composition guidance. A newly authored continuous-body/skull3D model replaces the rejected assembled animal. This film is not a relabeling of the prior Drive movie.\n\nAll15624 encoded video frames have been decoded. All10 audio chapters pass source-correlation tests. Actual start/middle/end encoded frames and native3D motion were inspected; this is not a claim of artistic acceptance or anatomical perfection. Full credits, source-video EDL, audio hashes and chapter provenance are attached. Prior deliveries/sharing are unchanged.\n\nالفيلم الكامل بإخراج بصري جديد، مع أربع مواد فيديو حقيقية وأربع صور فقط والرسوم الثنائية والثلاثية الجديدة. التسجيلات المعتمدة محفوظة.'}
 rel=call(base+'/releases',json.dumps(body).encode(),'POST')
existing={a['name']:a for a in call(base+'/releases/'+str(rel['id'])+'/assets?per_page=100')};receipt={'release_id':rel['id'],'release_url':rel['html_url'],'run_id':s['run_id'],'render_source_commit':s['source_commit'],'duration':651,'frames':15624,'real_video_sources':4,'real_video_seconds_integrated':38.5,'real_photographs':4,'prior_drive_movie_unchanged':True,'assets':[]};items=[(movie,'video/mp4'),(d/'CREDITS_AND_LICENSES.md','text/markdown'),(d/'NEW_FILM_INTEGRATION_REPORT.json','application/json'),(d/'NARRATION_APPROVED.srt','application/x-subrip'),(d/'APPROVED_ACTIVE_NARRATION.txt','text/plain')]
for p,mime in items:
 sha=hashlib.sha256(p.read_bytes()).hexdigest();a=existing.get(p.name)
 if a:assert a['size']==p.stat().st_size and a.get('digest')=='sha256:'+sha
 else:a=call(rel['upload_url'].split('{')[0]+'?name='+quote(p.name),p.read_bytes(),'POST',mime)
 assert a['state']=='uploaded'and a['size']==p.stat().st_size and a['digest']=='sha256:'+sha;receipt['assets'].append({'id':a['id'],'name':p.name,'bytes':p.stat().st_size,'sha256':sha,'download_url':a['browser_download_url'],'server_digest_verified':True});print('NEW_FULL_FILM_ASSET_PUBLISHED',p.name,p.stat().st_size,flush=True)
(R/'FINAL_VISUAL_REBUILD_PUBLICATION_RECEIPT.json').write_text(json.dumps(receipt,indent=2));dest=R/'delivery';dest.mkdir(exist_ok=True)
for p,_ in items:shutil.copyfile(p,dest/p.name)
print('NEW_FULL_FILM_PUBLISHED',receipt['release_url'],flush=True)
