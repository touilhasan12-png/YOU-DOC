"""Serial heavy-work lock and checkpoint infrastructure; no long render starts implicitly."""
from pathlib import Path
import os,json,hashlib,fcntl,time
P=Path(__file__).resolve().parents[1]
def memory_state():
 limit=None;used=None
 for directory in [Path('/sys/fs/cgroup'),Path('/sys/fs/cgroup/memory')]:
  for ln,un in [('memory.max','memory.current'),('memory.limit_in_bytes','memory.usage_in_bytes')]:
   try:
    s=(directory/ln).read_text().strip()
    if s!='max':limit=int(s);used=int((directory/un).read_text());break
   except (OSError,ValueError):pass
  if limit is not None:break
 # Some sandboxes do not expose their cgroup. Then impose a conservative PROJECT-process budget; never mistake host RAM for the sandbox limit.
 rss=0
 for proc in Path('/proc').glob('[0-9]*'):
  try:
   cmd=(proc/'cmdline').read_bytes().replace(b'\0',b' ').decode(errors='replace');cwd=(proc/'cwd').resolve()
   if str(P) in cmd or str(cwd).startswith(str(P)) or proc.name==str(os.getpid()):
    line=next(x for x in (proc/'status').read_text().splitlines() if x.startswith('VmRSS:'));rss+=int(line.split()[1])*1024
  except (OSError,StopIteration,ValueError):pass
 return {'cgroup_limit_bytes':limit,'cgroup_used_bytes':used,'project_process_rss_bytes':rss,'measurement':'cgroup' if limit is not None else 'project RSS + conservative fixed budget; sandbox hard limit unavailable','soft_usable_limit_bytes':int(limit*.78) if limit is not None else 600*1024*1024,'used_for_guard_bytes':used if used is not None else rss}
class HeavyWork:
 def __enter__(self):
  self.file=(P/'production/HEAVY_WORK.lock').open('w');fcntl.flock(self.file,fcntl.LOCK_EX|fcntl.LOCK_NB);self.file.write(str(os.getpid()));self.file.flush();return self
 def __exit__(self,*exc):fcntl.flock(self.file,fcntl.LOCK_UN);self.file.close()
 def check(self,predicted_additional_bytes=0):
  m=memory_state()
  if m['used_for_guard_bytes']+predicted_additional_bytes>m['soft_usable_limit_bytes']:raise MemoryError('Checkpoint and release caches before starting another heavy unit: '+json.dumps(m))
  return m

def save_unit_receipt(file,shot_id,frames,frame_start):
 # Called only after encoder exit and frame-count/decode verification, never merely on process start.
 receipt={'shot_id':shot_id,'file':str(Path(file).relative_to(P)),'bytes':Path(file).stat().st_size,'sha256':hashlib.sha256(Path(file).read_bytes()).hexdigest(),'encoded_frames':frames,'frame_start':frame_start,'timestamp':time.time()}
 q=P/'qa/unit_receipts';q.mkdir(exist_ok=True);tmp=q/(str(shot_id)+'.tmp');tmp.write_text(json.dumps(receipt,indent=2));tmp.replace(q/(str(shot_id)+'.json'));return receipt
if __name__=='__main__':print(json.dumps(memory_state(),indent=2))
