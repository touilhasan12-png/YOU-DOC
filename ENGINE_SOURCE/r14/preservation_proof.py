"""Remote-only proof that stream-copying the R13 shot boundaries is pixel-exact."""
import os,json,requests,subprocess,zipfile,shutil,hashlib
from pathlib import Path
import imageio_ffmpeg
assert os.environ.get('GITHUB_ACTIONS')=='true'
q=json.loads(Path('ENGINE_SOURCE/r14/REQUEST.json').read_text());p=Path(os.environ['RUNNER_TEMP'])/'copy-proof';p.mkdir();ff=imageio_ffmpeg.get_ffmpeg_exe();out=Path('R14_PRESERVATION_PROOF');out.mkdir(exist_ok=True)
r=requests.get('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts/'+str(q['r13_artifact_id'])+'/zip',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']},timeout=180);r.raise_for_status();z=p/'r13.zip';z.write_bytes(r.content)
with zipfile.ZipFile(z)as f:
 with f.open(q['r13_member'])as a,(p/'baseline.mp4').open('wb')as b:shutil.copyfileobj(a,b)
z.unlink();base=p/'baseline.mp4';files=[]
def run(a,**kw):return subprocess.run([ff,'-y','-v','error',*map(str,a)],check=True,**kw)
for row in q['shots']:
 d=p/f"{row['id']:03d}.mp4";run(['-ss',f"{row['frame_start']/24:.12f}",'-i',base,'-map','0:v:0','-an','-frames:v',row['frames'],'-c:v','copy','-video_track_timescale','12288',d]);files.append(d)
l=p/'concat.txt';l.write_text(''.join("file '"+str(d)+"'\n"for d in files));rejoined=p/'rejoined.mp4';run(['-f','concat','-safe','0','-i',l,'-c','copy',rejoined])
def hashes(file,name):
 d=p/name;run(['-i',file,'-map','0:v:0','-an','-fps_mode','passthrough','-f','framemd5',d]);return[x.split(',')[-1].strip()for x in d.read_text().splitlines()if x and not x.startswith('#')]
a=hashes(base,'a.md5');b=hashes(rejoined,'b.md5');bad=[i for i in range(min(len(a),len(b)))if a[i]!=b[i]];result={'commit':os.environ['GITHUB_SHA'],'original_frames':len(a),'rejoined_frames':len(b),'all_93_R13_shot_boundaries_stream_copy_pixel_exact':len(a)==len(b)==q['frames']and not bad,'first_mismatches':bad[:30]};(out/'COPY_PRESERVATION.json').write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True)
if not result['all_93_R13_shot_boundaries_stream_copy_pixel_exact']:raise SystemExit(1)
