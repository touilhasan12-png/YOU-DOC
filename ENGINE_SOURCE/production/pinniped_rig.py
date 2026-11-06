"""Original metre-based pinnipeds, not recoloured whales or a single seal sprite.
Weddell: heavy spindle body, small head, short fore-flippers, TWO rear webbed feet, no ears.
Sea-lion pup: raised neck, external pinnae, load-bearing long fore-flippers and rotatable hind feet.
All eyes/whiskers/limbs stay in the same 3-D body/head transforms.
"""
import math
from functools import lru_cache
import numpy as np
from scipy.interpolate import PchipInterpolator
import illustrated_rig as rig

class Mesh:
 def __init__(self):self.v=[];self.f=[];self.c=[]
 def add(self,v,f,c):
  v=np.asarray(v,float);f=np.asarray(f,int);o=len(self.v);self.v.extend(v);self.f.extend(f+o);self.c.extend(np.tile(c,(len(v),1)) if np.asarray(c).ndim==1 else c)
 def sphere(self,centre,axes,colour,nu=14,nv=22):
  v=[];f=[]
  for a in np.linspace(.001,np.pi-.001,nu):
   for b in np.linspace(0,2*np.pi,nv,endpoint=False):v.append(np.asarray(centre)+np.asarray(axes)*[np.sin(a)*np.cos(b),np.sin(a)*np.sin(b),np.cos(a)])
  for i in range(nu-1):
   for j in range(nv):a=i*nv+j;b=i*nv+(j+1)%nv;c=(i+1)*nv+j;d=(i+1)*nv+(j+1)%nv;f.extend([[a,c,b],[b,c,d]])
  self.add(v,f,colour)
 def tube(self,pts,radius,colour,sides=10,flat=1):
  pts=np.asarray(pts,float);v=[];f=[]
  for j,p in enumerate(pts):
   d=pts[min(j+1,len(pts)-1)]-pts[max(0,j-1)];d/=max(np.linalg.norm(d),1e-9);n=np.cross(d,[0,0,1.]);
   if np.linalg.norm(n)<.01:n=np.cross(d,[0,1.,0])
   n/=np.linalg.norm(n);b=np.cross(d,n);r=radius[j] if np.ndim(radius) else radius
   for a in np.linspace(0,2*np.pi,sides,endpoint=False):v.append(p+r*(np.cos(a)*n+np.sin(a)*b*flat))
  for j in range(len(pts)-1):
   for k in range(sides):a=j*sides+k;b=j*sides+(k+1)%sides;c=(j+1)*sides+k;d=(j+1)*sides+(k+1)%sides;f.extend([[a,b,c],[b,d,c]])
  self.add(v,f,colour)
 def paddle(self,root,direction,length,width,colour,spread=1):
  root=np.asarray(root,float);d=np.asarray(direction,float);d/=np.linalg.norm(d);n=np.cross(d,[0,0,1]);
  if np.linalg.norm(n)<.1:n=np.array([0.,1,0])
  n/=np.linalg.norm(n);b=np.cross(d,n);outline=[]
  # Five rounded toe/knuckle lobes embedded in continuous webbing, not separate sticks.
  for a in np.linspace(-np.pi/2,np.pi/2,41):
   u=(a+np.pi/2)/np.pi;tip=length*(.90+.10*math.cos(u*np.pi*8));outline.append(root+d*tip*math.cos(a)+n*width*spread*math.sin(a))
  outline=[root-n*width*.2,*outline,root+n*width*.2];centre=root+d*length*.43;v=[];f=[];N=len(outline)
  for sign in [-1,1]:
   for r in np.linspace(.02,1,5):
    for p in outline:v.append(centre+(np.asarray(p)-centre)*r+b*sign*.017*(1-r*r))
  for side in range(2):
   off=side*5*N
   for j in range(4):
    for k in range(N):a=off+j*N+k;c=off+(j+1)*N+k;bb=off+j*N+(k+1)%N;d=off+(j+1)*N+(k+1)%N;f.extend([[a,bb,c],[bb,d,c]] if side else [[a,c,bb],[bb,c,d]])
  self.add(v,f,colour)
 def arrays(self):return np.asarray(self.v,np.float32),np.asarray(self.f,np.int32),np.asarray(self.c,np.float32)

def elbow(root,target,l1,l2,side):
 root=np.asarray(root,float);target=np.asarray(target,float);d=target-root;dist=np.linalg.norm(d);dist=np.clip(dist,abs(l1-l2)+.0001,l1+l2-.0001);d/=max(np.linalg.norm(d),1e-8);target=root+d*dist
 n=np.cross(d,[0,0,1.]);
 if np.linalg.norm(n)<.01:n=np.array([1.,0,0])
 n/=np.linalg.norm(n);a=(l1*l1-l2*l2+dist*dist)/(2*dist);h=math.sqrt(max(0,l1*l1-a*a));return root+d*a+n*h*side,target

@lru_cache(maxsize=2)
def body(kind):
 m=Mesh();seal=kind=='weddell';L=3. if seal else 1.15
 if seal:
  xs=np.array([-1.43,-1.34,-1.23,-1.05,-.82,-.58,-.24,.16,.55,.82,1.02,1.10]);ry=[.02,.09,.145,.18,.19,.255,.345,.38,.345,.26,.10,.035];rz=[.02,.09,.14,.15,.165,.22,.30,.34,.30,.20,.09,.035];cz=[-.11,-.09,-.07,-.07,-.18,-.125,-.045,-.005,-.045,-.145,-.255,-.31];base=[119,132,138]
 else:
  xs=np.array([-.63,-.59,-.53,-.44,-.34,-.23,-.07,.10,.26,.38,.44,.48]);ry=[.014,.045,.075,.096,.095,.12,.17,.18,.15,.10,.065,.03];rz=[.012,.045,.071,.095,.11,.14,.165,.16,.13,.09,.05,.025];cz=[.37,.37,.40,.40,.35,.22,.07,.02,.005,0,0,0];base=[117,99,78]
 Y=PchipInterpolator(xs,ry);Z=PchipInterpolator(xs,rz);C=PchipInterpolator(xs,cz);ts=np.linspace(xs[0],xs[-1],150);angles=np.linspace(0,2*np.pi,100,endpoint=False);v=[];col=[];f=[]
 rng=np.random.default_rng(170);spots=np.zeros((len(ts),len(angles)))
 if seal:
  for _ in range(180):
   px=rng.uniform(xs[0],xs[-1]);pa=rng.uniform(0,2*np.pi);sx=rng.uniform(.018,.055);sa=rng.uniform(.06,.18)
   spots+=np.exp(-((ts[:,None]-px)/sx)**2-(np.sin((angles[None,:]-pa)/2)/sa)**2)*rng.uniform(.35,1.)
 for xi,x in enumerate(ts):
  for ai,a in enumerate(angles):
   v.append([x,float(Y(x))*np.cos(a),float(C(x))+float(Z(x))*np.sin(a)]);light=(1-np.sin(a))*.5;c=np.array(base,float)+light*np.array([19,17,13]);mottle=np.sin(x*42+a*7)*np.cos(x*71-a*13)
   if seal:c+=np.clip(spots[xi,ai]*25,0,31)
   else:c+=mottle*2
   col.append(c)
 for i in range(len(ts)-1):
  for j in range(100):a=i*100+j;b=i*100+(j+1)%100;c=(i+1)*100+j;d=(i+1)*100+(j+1)%100;f.extend([[a,b,c],[b,d,c]])
 # Close both tiny nose/tail section ends, so a turn cannot reveal an open body stump.
 for ix,reverse in [(0,True),(len(ts)-1,False)]:
  cap=len(v);v.append([float(ts[ix]),0,float(C(ts[ix]))]);col.append(base)
  for j in range(100):
   a=ix*100+j;b=ix*100+(j+1)%100;f.append([cap,b,a] if reverse else [cap,a,b])
 m.add(v,f,col)
 ex,er,ez=(-1.23,.014,-.02) if seal else (-.52,.010,.445)
 for sign in [-1,1]:
  ey=sign*float(Y(ex))*math.sqrt(max(.001,1-((ez-float(C(ex)))/float(Z(ex)))**2))*.997;m.sphere([ex,ey,ez],[er,er*.52,er*.9],[16,28,31],12,18);m.sphere([ex-er*.2,ey+sign*er*.42,ez+er*.24],[er*.13]*3,[159,178,177],8,10)
  if not seal:m.sphere([-.43,sign*.081,.425],[.012,.008,.022],[88,74,61],12,14)
  nose=(-1.395,-.065,.065) if seal else (-.611,.385,.034)
  m.sphere([nose[0],sign*nose[2]*.34,nose[1]],[.021 if seal else .011,.026 if seal else .013,.016 if seal else .009],[38,48,49] if seal else [49,43,36],10,16)
  # Real small whiskers, attached to muzzle and depth-tested with the face.
  for j in range(5):
   root=np.array([-1.34,sign*.085,-.11]) if seal else np.array([-.59,sign*.045,.355]);tip=root+[-.10 if seal else -.045,sign*(.09 if seal else .045),(-2+j)*(.020 if seal else .009)];mid=(root+tip)/2+[0,0,.008];m.tube([root,mid,tip],[.0015,.001,.00025] if seal else [.0007,.0005,.00015],[117,131,131] if seal else [149,138,113],6)
 return m.arrays()

def mesh(kind='weddell',phase=0,action='rest'):
 seal=kind=='weddell';m=Mesh();v,f,c=body(kind);v=v.copy()
 # Head lift affects the actual head, eyes, ears and muzzle; no drifting face overlays.
 pivot=np.array([-.8,0,-.12]) if seal else np.array([-.32,0,.3]);w=np.clip((pivot[0]-v[:,0])/(.35 if seal else .23),0,1);angle=(.025*math.sin(phase*.5)+(.06 if action=='struggle' else 0))*w;dx=v[:,0]-pivot[0];dz=v[:,2]-pivot[2];v[:,0]=pivot[0]+np.cos(angle)*dx+np.sin(angle)*dz;v[:,2]=pivot[2]-np.sin(angle)*dx+np.cos(angle)*dz
 m.add(v,f,c)
 for sign in [-1,1]:
  if seal:
   root=np.array([-.64,sign*.18,-.08]);target=np.array([-.80,sign*.43,-.345]);l1,l2=.20,.22
   if action=='struggle':target+=[.13*math.sin(phase+sign),sign*.025*math.cos(phase),.10*max(0,math.sin(phase+sign))]
   if action=='reach':target=np.array([-1.02,sign*.35,-.034])
   ee,tip=elbow(root,target,l1,l2,sign);m.tube([root,ee,tip],[.055,.055,.035],[110,124,129],flat=.45);m.paddle(tip,[-.4,sign,0],.19,.10,[104,118,123])
   root=np.array([1.04,sign*.05,-.27]);d=[.90,sign*.50,.08*math.sin(phase*1.5+sign) if action!='rest' else -.10];m.paddle(root,d,.48,.15,[108,123,126],spread=1)
  else:
   root=np.array([-.26,sign*.085,.23]);step=0 if action=='rest' else phase;target=np.array([-.25+.045*math.sin(step+sign*math.pi/2),sign*.24,-.145+(.035*max(0,math.sin(step+sign*math.pi/2)) if action!='rest' else 0)]);ee,tip=elbow(root,target,.23,.22,sign)
   m.tube([root,ee,tip],[.055,.070,.050],[98,83,67],flat=.45);m.paddle(tip,[-.25,sign*.5,-.03],.24,.09,[82,72,60])
   m.paddle([.38,sign*.06,-.06],[.9,sign*.35,-.25],.23,.075,[87,76,63])
 return m.arrays()

def render(kind='weddell',phase=0,action='rest',ppm=180,width=1400,height=850,roll=0,yaw=0,elevation=18):
 v,f,c=mesh(kind,phase,action);v=v@rig.rotation(roll,yaw,elevation).T;tri=v[f];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);n=np.zeros_like(v)
 for j in range(3):np.add.at(n,f[:,j],fn)
 n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-8);im,_=rig.raster(v.astype(np.float32),f,n.astype(np.float32),c,width,height,ppm,width*.5,height*.56);return im
