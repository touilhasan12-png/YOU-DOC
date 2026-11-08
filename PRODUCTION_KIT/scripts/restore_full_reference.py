"""Restore exact approved film, not pretend to re-render it. No media editing."""
from pathlib import Path
import hashlib,shutil,sys
R=Path(__file__).resolve().parents[1];p=R/'assets/approved/R15_MASTER.mp4';h=hashlib.sha256()
with p.open('rb')as f:
 for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
assert h.hexdigest()=='254fad48c9a71f49a3dbc2a779a32fcc76f32285bd5b1b5f10dd38ff576041ea'
out=Path(sys.argv[1])if len(sys.argv)>1 else R/'generated/R15_APPROVED_REFERENCE.mp4';out.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,out);print('Exact original approved full film restored, not regenerated.')
