"""New film drawing primitives: purpose-specific environments, physical asset scale,
compressed bounded pose caches, semantic type. No old scene renderer, footer or progress strip.
"""
from pathlib import Path
from collections import OrderedDict
import math,io
import numpy as np
import cv2
from PIL import Image,ImageFont,ImageDraw
import illustrated_rig as rig
import people_boats as vessels
import cairosvg
P=Path(__file__).resolve().parents[1];W,H,FPS=1920,1080,24
cv2.setNumThreads(1)

class PoseCache:
 def __init__(self,maxbytes=44*1024**2):self.encoded=OrderedDict();self.decoded=OrderedDict();self.maxbytes=maxbytes;self.bytes=0
 def get(self,key,fn):
  if key in self.decoded:self.decoded.move_to_end(key);return self.decoded[key]
  if key not in self.encoded:
   im=fn();ok,b=cv2.imencode('.png',im,[cv2.IMWRITE_PNG_COMPRESSION,2]);assert ok;data=b.tobytes();self.encoded[key]=data;self.bytes+=len(data)
   while self.bytes>self.maxbytes and len(self.encoded)>1:
    k,v=self.encoded.popitem(last=False);self.bytes-=len(v);self.decoded.pop(k,None)
  else:self.encoded.move_to_end(key);im=cv2.imdecode(np.frombuffer(self.encoded[key],np.uint8),cv2.IMREAD_UNCHANGED)
  self.decoded[key]=im
  while len(self.decoded)>5 or (len(self.decoded)>1 and sum(a.nbytes for a in self.decoded.values())>24*1024**2):self.decoded.popitem(last=False)
  return im
CACHE=PoseCache()

def over(im,sprite,x,y,opacity=1.):
 x,y=round(x),round(y);hh,ww=sprite.shape[:2];x0,x1=max(0,x),min(im.shape[1],x+ww);y0,y1=max(0,y),min(im.shape[0],y+hh)
 if x1<=x0 or y1<=y0:return
 a=sprite[y0-y:y1-y,x0-x:x1-x];alpha=a[:,:,3:4].astype(np.float32)*(opacity/255)
 im[y0:y1,x0:x1]=np.clip(im[y0:y1,x0:x1]*(1-alpha)+a[:,:,:3]*alpha,0,255).astype(np.uint8)

def animal(im,name,cx,cy,ppm,t=0,roll=0,yaw=0,elevation=8,jaw=0,flip=False,opacity=1):
 L=rig.SPECS[name]['L'];m=rig.model(name);R=rig.rotation(roll,yaw,elevation);bounds=m.v.copy();bounds[:,0]-=L*.5;bounds=bounds@R.T
 # Canvas bounds may change with camera angle, but the physical ppm NEVER changes. This prevents cropped heads/tails in high-angle views.
 width=max(240,math.ceil((2*np.max(np.abs(bounds[:,0]))+.06*L)*ppm+24));height=max(220,math.ceil((2*np.max(np.abs(bounds[:,2]))+.10*L)*ppm/.90+24));phase=int(round(t*.75*32))%32
 key=('animal',name,round(ppm,3),width,height,phase,round(roll,2),round(yaw,2),round(elevation,2),round(jaw,2),flip)
 sprite=CACHE.get(key,lambda:rig.render(name,phase/32*2*math.pi,roll,yaw,elevation,ppm,width,height,flip,1.25,jaw))
 over(im,sprite,cx-width*.5,cy-height*.54,opacity)
 # Mouth anchor uses the same geometry, deformation and view transform as the animal, never guessed pixel offsets.
 m=rig.model(name);u=.075;point=np.array([[u*m.s['L'],-float(m.ry(u))*.91*m.s['L'],(float(m.cz(u)-m.rz(u)*.18)-.007)*m.s['L']]])
 point=rig.articulate(point,name,phase/32*2*math.pi);point[:,0]-=L*.5;point=point@rig.rotation(roll,yaw,elevation).T
 if flip:point[:,0]*=-1
 grip=(cx+point[0,0]*ppm,cy-point[0,2]*ppm)
 return {'mouth_grip':grip,'length_m':L,'ppm':ppm,'dorsal_vertex_count':int(np.count_nonzero(m.part==1)),'body_roll_degrees':roll,'model_vertices':len(m.v)}

def vessel(im,kind,cx,cy,ppm,t=0,opacity=1):
 phase=int(round(t*.50*32))%32;fn=vessels.whaleboat if kind=='period' else vessels.rescue
 # SVG pose is generated alongside its coordinate record; same inputs always yield exact hand/oar anchors.
 svg,meta=fn(phase/32*math.pi*2);scale=ppm/meta['source_ppm'];key=('vessel',kind,phase,round(ppm,4))
 sprite=CACHE.get(key,lambda:cv2.imdecode(np.frombuffer(cairosvg.svg2png(bytestring=svg.encode(),output_width=round(1800*scale),output_height=round(1000*scale)),np.uint8),cv2.IMREAD_UNCHANGED))
 origin=np.asarray(meta['world_origin_px'])*scale;xy=np.array([cx,cy])-origin;over(im,sprite,xy[0],xy[1],opacity)
 attach=np.array(meta['tow_bollard_px'])*scale+xy
 return {**meta,'tow_bollard_screen':attach.tolist(),'hull_screen_width':(meta['hull_x_bounds'][1]-meta['hull_x_bounds'][0])*scale,'source_origin_at': [cx,cy]}

# Environment grids are half-resolution by design; optical detail is added selectively at full resolution.
XX,YY=np.meshgrid(np.arange(W//2,dtype=np.float32)*2,np.arange(H//2,dtype=np.float32)*2)
def ocean(t=0,horizon=330,weather='temperate'):
 h=H//2;w=W//2;sky=np.clip(YY/max(horizon,1),0,1);image=np.zeros((h,w,3),np.float32)
 skyTop=np.array([150,119,74]);skyHorizon=np.array([213,212,183]);image[:]=skyTop[None,None,:]*(1-sky[:,:,None])+skyHorizon[None,None,:]*sky[:,:,None]
 # Broad atmospheric cloud/haze fields instead of repeated ornamental cloud blobs.
 haze=(np.sin(XX*.003+YY*.017)+.48*np.cos(XX*.007-YY*.009))*.5+.5;skyregion=YY<horizon;image[skyregion]+=haze[skyregion,None]*6
 ys=np.maximum(4,YY-horizon);depth=np.minimum(240,2400/ys);worldx=(XX-W*.5)*depth/1450;d=depth
 wave=.060*np.sin(worldx*1.3+d*.82-t*2.0)+.026*np.sin(worldx*3.3-d*1.5-t*2.7)+.012*np.cos(worldx*7.1+d*2.7-t*3.4)
 slope=.078*np.cos(worldx*1.3+d*.82-t*2.0)+.0858*np.cos(worldx*3.3-d*1.5-t*2.7)
 near=np.clip((YY-horizon)/(H-horizon),0,1);far=np.array([153,151,105]);close=np.array([119,105,49]);sea=far[None,None,:]*(1-near[:,:,None])+close[None,None,:]*near[:,:,None]
 fade=np.clip(near/.13,0,1);fade=fade*fade*(3-2*fade);sea+=(wave[:,:,None]*85+slope[:,:,None]*25)*fade[:,:,None]
 spec=(np.maximum(0,np.cos(worldx*1.7+d*1.3-t*2.2))**20)*(.3+.7*near);sea+=spec[:,:,None]*[20,22,20]*fade[:,:,None]
 image[~skyregion]=sea[~skyregion];image=np.clip(image,0,255).astype(np.uint8)
 return cv2.resize(image,(W,H),interpolation=cv2.INTER_LINEAR)

def underwater(t=0,habitat='canyon'):
 y=YY/H;top=np.array([130,112,54]) if habitat=='ice' else np.array([124,104,42]);bottom=np.array([41,34,17]) if habitat=='canyon' else np.array([67,56,25]);im=top[None,None,:]*(1-y[:,:,None])+bottom[None,None,:]*y[:,:,None]
 # Local surface caustic interference, not full-screen diagonal sunbeam stripes.
 c=np.sin(XX*.012+YY*.019-t*.9)*np.cos(XX*.008-YY*.014+t*.65);caustic=np.maximum(0,c-.42)**3*np.exp(-y*4.7);im+=caustic[:,:,None]*42
 return cv2.resize(np.clip(im,0,255).astype(np.uint8),(W,H),interpolation=cv2.INTER_LINEAR)

def type_text(im,text,x,y,size=42,colour=(232,238,231),title=False,align='left'):
 font=P/'fonts'/('BarlowCondensed-SemiBold.ttf' if title else 'SourceSans3[wght].ttf');f=ImageFont.truetype(str(font),size)
 if not title:
  try:f.set_variation_by_axes([580])
  except Exception:pass
 box=f.getbbox(text);a=Image.new('RGBA',(box[2]-box[0]+14,box[3]-box[1]+14));ImageDraw.Draw(a).text((7-box[0],7-box[1]),text,font=f,fill=(*colour,255));ar=cv2.cvtColor(np.asarray(a),cv2.COLOR_RGBA2BGRA)
 if align=='right':x-=ar.shape[1]
 elif align=='center':x-=ar.shape[1]/2
 over(im,ar,x,y)
 return [round(x),round(y),ar.shape[1],ar.shape[0]]

def rope(im,a,b,tension=1,colour=(166,186,206),thickness=4):
 a=np.asarray(a);b=np.asarray(b);p=[]
 for u in np.linspace(0,1,55):
  q=a*(1-u)+b*u;q[1]+=math.sin(math.pi*u)*22*(1-tension);p.append(q)
 p=np.rint(p).astype(np.int32);cv2.polylines(im,[p],False,colour,thickness,cv2.LINE_AA);return {'a':p[0].tolist(),'b':p[-1].tolist()}
