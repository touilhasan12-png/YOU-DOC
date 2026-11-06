"""Pixel-identical cached typography for long native exports, with a strict 12MiB bitmap cap."""
from pathlib import Path
from collections import OrderedDict
from PIL import Image,ImageDraw,ImageFont
import numpy as np,cv2
from compositor import over
P=Path(__file__).resolve().parents[1];cache=OrderedDict();used=0

def type_text(im,text,x,y,size=42,colour=(232,238,231),title=False,align='left'):
 global used
 key=(text,size,tuple(colour),title)
 if key in cache:ar=cache.pop(key);cache[key]=ar
 else:
  font=P/'fonts'/('BarlowCondensed-SemiBold.ttf' if title else 'SourceSans3[wght].ttf');f=ImageFont.truetype(str(font),size)
  if not title:
   try:f.set_variation_by_axes([580])
   except Exception:pass
  box=f.getbbox(text);a=Image.new('RGBA',(box[2]-box[0]+14,box[3]-box[1]+14));ImageDraw.Draw(a).text((7-box[0],7-box[1]),text,font=f,fill=(*colour,255));ar=cv2.cvtColor(np.asarray(a),cv2.COLOR_RGBA2BGRA)
  while cache and used+ar.nbytes>12*1024**2:_,old=cache.popitem(last=False);used-=old.nbytes
  if ar.nbytes<=12*1024**2:cache[key]=ar;used+=ar.nbytes
 if align=='right':x-=ar.shape[1]
 elif align=='center':x-=ar.shape[1]/2
 over(im,ar,x,y);return [round(x),round(y),ar.shape[1],ar.shape[0]]
