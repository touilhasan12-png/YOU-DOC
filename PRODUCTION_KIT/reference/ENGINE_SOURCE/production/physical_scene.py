"""Shared metre-space drawing for solid ice, articulated mammals and moving water.
Kept separate from the existing scene family so development cannot invalidate unrelated native units.
"""
import math
import numpy as np
import illustrated_rig as rig
from fast_raster import raster
from pinniped_rig import Mesh
W,H=1920,1080

def pose(v,position=(0,0,0),roll=0,pitch=0,yaw=0,flip=False):
 v=np.asarray(v).copy()
 if flip:v[:,0]*=-1
 a=math.radians(pitch);ry=np.array([[math.cos(a),0,math.sin(a)],[0,1,0],[-math.sin(a),0,math.cos(a)]])
 return v@((ry@rig.rotation(roll,yaw,0)).T)+position

def whale(name='orca',phase=0,jaw=0,position=(0,0,0),roll=0,pitch=0,yaw=0,flip=False):
 m=rig.model(name);v=rig.articulate(m.v,name,phase,m.part,jaw);v[:,0]-=m.s['L']*.5
 return pose(v,position,roll,pitch,yaw,flip),m.f[:,::-1] if flip else m.f,m.col

def shade(meshes,ppm=130,centre=(960,650),elevation=18,water_level=0,wet=True):
 camera=rig.rotation(elevation=elevation);vv=[];ff=[];cc=[];off=0
 for v,f,c in meshes:vv.append(v);ff.append(f+off);cc.append(c);off+=len(v)
 points=np.concatenate(vv)@camera.T;f=np.concatenate(ff);c=np.concatenate(cc);tri=points[f];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);n=np.zeros_like(points)
 for j in range(3):np.add.at(n,f[:,j],fn)
 n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-8)
 rgba,depth=raster(points.astype(np.float32),f.astype(np.int32),n.astype(np.float32),c.astype(np.float32),W,H,ppm,centre[0],centre[1])
 if wet:
  e=math.radians(elevation);zcam=(centre[1]-(np.arange(H,dtype=np.float32)[:,None]+.5))/ppm;world_z=math.cos(e)*zcam-math.sin(e)*depth;sub=np.clip((water_level-world_z)/.04,0,1)
  # Geometry below the real water plane remains visible through tinted water, not erased by a fin mask.
  rgba[:,:,:3]=np.uint8(rgba[:,:,:3]*(1-sub[:,:,None]*.30)+np.array([115,123,65])*sub[:,:,None]*.30);a=1-sub*.35;rgba[:,:,3]=np.uint8(rgba[:,:,3]*a)
 return rgba,depth

def slab(scale=1,position=(0,0,0),pitch=0):
 poly=np.array([[-3.5,-1.3],[-3.1,1.2],[-.8,1.7],[2.9,1.3],[3.8,.3],[2.5,-1.4],[-.6,-1.6]])*scale;top=.18;bottom=-1.12;v=[];f=[];c=[]
 # 1.3m thick with 0.18m freeboard: most of the floe correctly lies below water.
 v.append([0,0,top]);c.append([214,233,229])
 for x,y in poly:v.append([x,y,top]);c.append([209,229,226])
 for j in range(len(poly)):f.append([0,1+j,1+(j+1)%len(poly)])
 off=len(v)
 for x,y in poly:v.extend([[x,y,top],[x*.98,y*.98,bottom]]);c.extend([[193,220,224],[100,168,187]])
 for j in range(len(poly)):a=off+2*j;b=off+2*((j+1)%len(poly));f.extend([[a,a+1,b],[b,a+1,b+1]])
 return pose(np.asarray(v),position,pitch=pitch),np.asarray(f,np.int32)[:,::-1],np.asarray(c,np.float32)

def wave_mesh(t,amplitude=.65,velocity=4,arrival=1.36,beach=False,level=0,storm=False):
 xs=np.linspace(-13,13,120);ys=np.linspace(-12,5.5,37);x,y=np.meshgrid(xs,ys);centre=velocity*(t-arrival);h=level+amplitude*np.exp(-((x-centre)/1.35)**2)
 if storm:h+=.11*np.sin(x*2.3-t*4+y*.3)
 h+=.018*np.sin(x*3.1+y*1.8-t*3);sand=.2*(x-1.5);valid=h>=sand if beach else np.ones_like(x,bool);v=np.stack([x.ravel(),y.ravel(),h.ravel()],axis=1);f=[]
 for j in range(len(ys)-1):
  for k in range(len(xs)-1):
   a=j*len(xs)+k;b=a+1;c=a+len(xs);d=c+1
   if valid[j,k] or valid[j,k+1] or valid[j+1,k]:f.append([a,b,c])
   if valid[j,k+1] or valid[j+1,k+1] or valid[j+1,k]:f.append([b,d,c])
 foam=np.exp(-((x-centre)/.20)**2)*.5
 if beach:foam=np.maximum(foam,np.exp(-np.maximum(0,h-sand)*20)*valid*.8)
 col=np.tile([39.,104.,122.],(len(v),1));col=col*(1-foam.ravel()[:,None])+np.array([194,224,216])*foam.ravel()[:,None]
 return v,np.asarray(f,np.int32),col

def water_over(im,water,depth,object_depth,ppm,centre,elevation,opacity=.40):
 e=math.radians(elevation);zcam=(centre[1]-(np.arange(H,dtype=np.float32)[:,None]+.5))/ppm;wy=math.cos(e)*depth+math.sin(e)*zcam;fade=np.clip((5.5-wy)/1.2,0,1)
 a=(water[:,:,3:4]/255.)*opacity*fade[:,:,None]*(depth[:,:,None]<object_depth[:,:,None]);im[:]=np.uint8(np.clip(im*(1-a)+water[:,:,:3]*a,0,255))
 return im

def sand_mesh():
 xs=np.linspace(-13,14,45);ys=np.linspace(-12,6,22);v=[];c=[];f=[]
 for y in ys:
  for x in xs:v.append([x,y,.2*(x-1.5)]);light=4*math.sin(x*.8+y*.3);c.append([171+light,151+light,113+light])
 for j in range(len(ys)-1):
  for k in range(len(xs)-1):a=j*len(xs)+k;b=a+1;d=a+len(xs);e=d+1;f.extend([[a,b,d],[b,e,d]])
 return np.asarray(v),np.asarray(f,np.int32),np.asarray(c)

def spray(t,arrival=1.36):
 m=Mesh();rng=np.random.default_rng(720)
 for j in range(25):
  birth=arrival-.25+rng.uniform(0,.45);age=t-birth
  if not 0<age<.55:continue
  x=-2+age*rng.uniform(.3,1.3);y=-1.8+rng.uniform(-.15,.15);z=.28+age*rng.uniform(1.2,2.6)-4.905*age*age;m.sphere([x,y,z],[.014]*3,[213,235,229],6,8)
 return m.arrays() if m.v else None
