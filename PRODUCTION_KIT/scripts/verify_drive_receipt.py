"""Verify a saved authorized Drive listing against local final payloads."""
from pathlib import Path
import sys,json,hashlib
local=Path(sys.argv[1]);listing=json.loads(Path(sys.argv[2]).read_text());files=listing['files'];assert len(files)==2,'Final kit folder must have exactly two files'
expected=['00_MASTER_PROMPT.txt','FULL_PRODUCTION_KIT.zip'];assert sorted(f['name']for f in files)==expected
for f in files:
 p=local/f['name'];assert int(f['size'])==p.stat().st_size
 md5=f.get('md5_checksum',f.get('md5Checksum'));h=hashlib.md5()
 with p.open('rb')as src:
  for block in iter(lambda:src.read(4*1024*1024),b''):h.update(block)
 assert h.hexdigest()==md5,f['name']
print('Drive delivery verified: exactly two files; both byte sizes and MD5 match.')
