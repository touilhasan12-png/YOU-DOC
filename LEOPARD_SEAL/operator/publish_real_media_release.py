"""Network publication of already-rendered Actions artifacts. No local media processing."""
from pathlib import Path
import urllib.request,urllib.error,json,hashlib,zipfile,shutil,sys
R=Path(__file__).resolve().parents[1];state=json.loads((R/'REAL_CAMERA_REEL_FIXED_STATE.json').read_text());assert state['conclusion']=='success'
source=Path(state['downloaded_artifacts']['leopard-REAL-FOOTAGE-CUTS-AND-FOUR-PHOTOS']);report=json.loads((source/'REAL_MEDIA_EDIT_RECEIPT.json').read_text());assert report['cloud_run_id']==str(state['run_id']);assert report['real_video_clip_count']==4 and report['real_still_photo_count']==4 and not report['full_film_visual_rebuild_complete'];assert report['playable_real_camera_edit_reel']['frames']==926
bundle=source/'LEOPARD_SEAL_FOUR_REAL_CLIPS_AND_FOUR_PHOTOS.zip';files=[source/c['file']for c in report['real_video_cuts']]+[source/p['delivery_file']for p in report['real_photos']]+[source/'CREDITS_REAL_MEDIA.md',source/'REAL_MEDIA_EDIT_RECEIPT.json'];assert len(files)==10
for c in report['real_video_cuts']:assert hashlib.sha256((source/c['file']).read_bytes()).hexdigest()==c['sha256']
for p in report['real_photos']:assert hashlib.sha256((source/p['delivery_file']).read_bytes()).hexdigest()==p['sha256']
with zipfile.ZipFile(bundle,'w',compression=zipfile.ZIP_STORED)as z:
 for p in files:z.write(p,p.name)
video=source/'FOUR_REAL_CAMERA_CLIPS_EDITED_REEL.mp4';assert hashlib.sha256(video.read_bytes()).hexdigest()==report['playable_real_camera_edit_reel']['sha256']
token=Path('/home/user/.private/gh_token').read_text().strip();base='https://api.github.com/repos/touilhasan12-png/YOU-DOC';tag='leopard-real-media-edits-'+state['source_commit'][:7]
def request(url,data=None,method=None,ctype='application/json'):
 q=urllib.request.Request(url,data=data,method=method,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Content-Type':ctype,'X-GitHub-Api-Version':'2022-11-28'})
 with urllib.request.urlopen(q,timeout=180)as src:return json.load(src)
try:release=request(base+'/releases/tags/'+tag)
except urllib.error.HTTPError as e:
 if e.code!=404:raise
 body={'tag_name':tag,'target_commitish':state['source_commit'],'name':'Leopard seal — FOUR REAL camera clips + FOUR real photographs (media edit package, NOT full film)','draft':False,'prerelease':True,'body':'Actual camera footage edited on GitHub Actions: four native-resolution, non-graphic, real-time video cuts; exactly four original real photographs. The playable reel is38.583333seconds / 926frames /24fps, with source credits and no invented field audio. The native camera pictures have NOT been upscaled.\n\nIMPORTANT: This is a real-source-media editing deliverable, not the completed10:51 documentary visual rebuild. The original approved narration and rejected earlier film are preserved. New2D and3D are under separate internal examination.\n\nVideos: Watanabe/Sato/Ponganis2012, CC BY2.5, DOI10.1371/journal.pone.0050357; Krause/Goebel/Marshall/Abernathy2015, CC BY4.0, DOI10.1186/s40317-015-0059-2. Photos: NOAA Photo Library; Gilad Rom; Carina Gsottbauer. Exact source links, license links, credit and modifications are in CREDITS_REAL_MEDIA.md and the ZIP. Rothera photograph is January2026 context, not the2003 incident. The footage is NOT footage of the Nicklen encounter.\n\nالمرفقات لقطات كاميرا حقيقية مقصوصة وأربع صور أصلية، وليست نسخة الفيلم الكاملة المعاد بناؤها.'}
 release=request(base+'/releases',json.dumps(body).encode(),'POST')
assets={a['name']:a for a in request(base+'/releases/'+str(release['id'])+'/assets?per_page=100')};upload=release['upload_url'].split('{')[0];receipt={'release_id':release['id'],'release_url':release['html_url'],'source_commit':state['source_commit'],'run_id':state['run_id'],'not_full_film':True,'approved_narration_preserved':True,'assets':[]}
from urllib.parse import quote
for p,mime in [(video,'video/mp4'),(bundle,'application/zip'),(source/'CREDITS_REAL_MEDIA.md','text/markdown'),(source/'REAL_MEDIA_EDIT_RECEIPT.json','application/json')]:
 sha=hashlib.sha256(p.read_bytes()).hexdigest();a=assets.get(p.name)
 if a:assert a['size']==p.stat().st_size and a.get('digest')=='sha256:'+sha,'Existing asset differs: refusing to replace'
 else:a=request(upload+'?name='+quote(p.name),p.read_bytes(),'POST',mime)
 assert a['state']=='uploaded'and a['size']==p.stat().st_size;receipt['assets'].append({'id':a['id'],'name':p.name,'bytes':p.stat().st_size,'sha256':sha,'download_url':a['browser_download_url'],'server_digest':a.get('digest')});print('PUBLISHED_REAL_MEDIA_ASSET',p.name,a['id'],p.stat().st_size,flush=True)
receipt['all_server_digests_verified']=all(a['server_digest']=='sha256:'+a['sha256']for a in receipt['assets']);assert receipt['all_server_digests_verified'];(R/'REAL_MEDIA_PUBLICATION_RECEIPT.json').write_text(json.dumps(receipt,indent=2))
delivery=R/'delivery';delivery.mkdir(exist_ok=True);shutil.copyfile(video,delivery/video.name);shutil.copyfile(source/'CREDITS_REAL_MEDIA.md',delivery/'CREDITS_REAL_MEDIA.md');shutil.copyfile(source/'REAL_MEDIA_EDIT_RECEIPT.json',delivery/'REAL_MEDIA_EDIT_RECEIPT.json');print('ACTUAL_REAL_MEDIA_PUBLISHED',release['html_url'],flush=True)
