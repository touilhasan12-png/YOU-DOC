"""Restore EXACT verified native units after temporary staging is recycled.
First load Google Drive and download archive 1Zz3q9nKhPIDRUSwptCq9fgKhvY7-CKsL.
Then: python production/restore_archived_native_units.py --archive '/home/user/google_drive/<downloaded archive>.zip'
This is streaming stdlib I/O, not a render, and never changes the canonical master or old Drive editions.
"""
from pathlib import Path
import argparse,json,hashlib,zipfile,shutil
P=Path(__file__).resolve().parents[1];CACHE=P.parent/'.cache/native_units'

def digest(f,kind='sha256'):
 h=hashlib.new(kind)
 with Path(f).open('rb') as s:
  for b in iter(lambda:s.read(1024*1024),b''):h.update(b)
 return h.hexdigest()

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--archive',required=True);a=ap.parse_args();archive=Path(a.archive);index=json.loads((P/'qa/ARCHIVED_NATIVE_RESTORE_INDEX.json').read_text())
 assert archive.stat().st_size==index['archive_bytes'] and digest(archive,'md5')==index['archive_md5'],'Wrong/incomplete archive'
 CACHE.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(archive) as z:
  for r in index['units']:
   link=P/r['relative_path'];target=CACHE/link.name
   if not target.exists() or digest(target)!=r['sha256']:
    temp=target.with_name('restoring_'+target.name)
    with z.open(r['archive_member']) as src,temp.open('wb') as dst:shutil.copyfileobj(src,dst,1024*1024)
    assert temp.stat().st_size==r['bytes'] and digest(temp)==r['sha256'];temp.replace(target)
   if link.is_symlink():link.unlink()
   elif link.exists():assert digest(link)==r['sha256'];continue
   link.symlink_to(target.resolve());print('Restored exact verified pixels:',r['relative_path'])
 print('29 archived units restored. Additional newer native units, if any, were left untouched.')
