"""Authorized Drive session transfer only. Session URI stays in a private local JSON."""
from pathlib import Path
import urllib.request,urllib.error,json,os,sys,time
state=Path(sys.argv[1]);state.chmod(0o600);s=json.loads(state.read_text());f=Path(s['file']);total=f.stat().st_size;assert total==s['total'];chunk=256*1024
def save():
 t=state.with_suffix('.new');t.write_text(json.dumps(s));t.chmod(0o600);os.replace(t,state)
def send(data,headers):
 req=urllib.request.Request(s['uri'],data=data,headers=headers,method='PUT')
 try:r=urllib.request.urlopen(req,timeout=90)
 except urllib.error.HTTPError as e:r=e
 return r.headers,r.read()
def query():
 h,b=send(b'',{'X-Goog-Upload-Command':'query','Content-Length':'0'});status=h.get('X-Goog-Upload-Status')
 if status=='final':return status,b
 assert status=='active'and h.get('X-Goog-Upload-Size-Received')is not None,'Cannot determine safe offset'
 s['offset']=int(h['X-Goog-Upload-Size-Received']);save();return status,b
if s.get('offset',0):status,body=query()
else:status='active'
with f.open('rb')as src:
 while s.get('offset',0)<total and status!='final':
  start=s.get('offset',0);src.seek(start);data=src.read(min(chunk,total-start));final=start+len(data)==total
  try:h,body=send(data,{'Content-Type':s.get('mime_type','application/octet-stream'),'Content-Length':str(len(data)),'Content-Range':f'bytes {start}-{start+len(data)-1}/{total}','X-Goog-Upload-Offset':str(start),'X-Goog-Upload-Total-Size':str(total),'X-Goog-Upload-Command':'upload, finalize'if final else'upload'});status=h.get('X-Goog-Upload-Status')
  except (urllib.error.URLError,TimeoutError):status,body=query();continue
  if status not in['active','final']:status,body=query();continue
  if status=='active':s['offset']=start+len(data);save()
  if final and status!='final':status,body=query()
assert status=='final','Upload incomplete'
receipt=json.loads(body);Path(s['receipt_path']).write_text(json.dumps(receipt,indent=2));state.unlink();print('Upload finalized:',receipt.get('id'))
