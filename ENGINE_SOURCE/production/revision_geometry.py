"""Revision 2: shared metre-space attachments and conservative solid-ice clearance.
No rendering takes place in this module. Geometry tests and production use the same poses.
"""
import math
import numpy as np
import physical_scene as ph
import illustrated_rig as rig
import pinniped_rig as pins
from pinniped_rig import Mesh

def ease(x):x=np.clip(x,0,1);return x*x*(3-2*x)
RUDDER_X=(340-875)/110
ROOT=np.array([RUDDER_X,0,.55])
BREAK=np.array([RUDDER_X,0,-.55])
CONTACT=np.array([RUDDER_X-.32,-.055,-1.43])

def bounds(mesh):return mesh[0].min(axis=0),mesh[0].max(axis=0)
def overlap(a,b,margin=0):
 lo,hi=bounds(a);bl,bh=bounds(b);return bool(np.all(hi>bl+margin) and np.all(bh>lo+margin))
def clear_x(mesh,solid,gap=.12):
 v,f,c=mesh;lo,hi=bounds(solid)
 if overlap(mesh,solid):v=v.copy();v[:,0]+=hi[0]+gap-v[:,0].min()
 return v,f,c

def wave_actors(t):
 crest=4*(t-1.36);h=lambda x:.65*math.exp(-((x-crest)/1.35)**2)
 tilt=7*(h(-2)-h(2))/.65;heave=.60*h(0);ice=ph.slab(position=(0,0,heave),pitch=tilt)
 v,f,c=pins.mesh('weddell',t*7,'struggle');slide=6.0*ease((t-1.1)/2.5);fall=.95*ease((t-3.7)/1.0)
 # Lift/slide along the actual top plane first. Descent begins only after body clearance.
 local=ph.pose(v,position=(slide,0,.20-float(v[:,2].min())),pitch=26*ease((t-3.7)/1.0))
 seal=(ph.pose(local,(0,0,heave-fall),pitch=tilt),f,c)
 if fall<=1e-8:
  # Support plane of tilted slab, not its screen-space rectangle.
  inv=ph.pose(seal[0]-[0,0,heave],pitch=-tilt);lift=max(0,.195-inv[:,2].min());seal=(ph.pose(inv+[0,0,lift],(0,0,heave),pitch=tilt),f,c)
 else:seal=clear_x(seal,ice)
 whales=[ph.whale('orca' if j!=1 else 'orca_female',t*5+j*.3,position=(-8.3+.8*ease(t/.8),y,-.52),flip=True) for j,y in enumerate([-2.1,0,2.1])]
 return ice,seal,whales

def seal_outside(t,action='reach',lower=0):
 ice=ph.slab(.5,position=(-2.8,0,0));v,f,c=pins.mesh('weddell',t*7,action)
 seal=(ph.pose(v,position=(.9,-2.8,-.32-lower),pitch=26),f,c)
 seal=clear_x(seal,ice);return ice,seal

def denial_actors(t):
 ice,seal=seal_outside(t)
 # Raised flukes strike outside the front/right edge; the complete whale stays outside ice.
 whale=ph.whale('orca',t*5,position=(-4.7,-3.2,-.55),pitch=-9-5*math.sin(t*2))
 lo,hi=bounds(whale);il,ih=bounds(ice)
 if hi[1]>=il[1]-.18:
  v,f,c=whale;v=v.copy();v[:,1]-=hi[1]-il[1]+.18;whale=(v,f,c)
 return ice,seal,whale

def lip(name='orca',flip=False,yaw=0):
 m=rig.model(name);L=m.s['L'];q=np.array([[(.075-.5)*L,-.90*m.ry(.075)*L,(m.cz(.075)-.18*m.rz(.075))*L]])
 return ph.pose(q,flip=flip,yaw=yaw)[0]

def capture_actors(t):
 ice,seal=seal_outside(t,'struggle',.65*ease(t/1.8))
 # Hind-flipper target is selected on the actual articulated seal, not a guessed pixel.
 v=seal[0];hind=v[v[:,0]>np.quantile(v[:,0],.985)].mean(axis=0)
 target=hind+[.02,0,0];pred=ph.whale('orca',t*4,jaw=10,position=target-lip())
 assert not overlap(seal,ice) and not overlap(pred,ice),'Solid ice penetration'
 return ice,seal,pred

def hull_mesh():
 m=Mesh();v=[];f=[];cols=[];xs=np.linspace(-5.9,6,55);angles=np.linspace(math.pi,2*math.pi,30)
 for x in xs:
  s=math.sqrt(max(.01,1-(x/6.1)**2))
  for a in angles:
   v.append([x,1.5*s*math.cos(a),.72+1.15*s*math.sin(a)])
   cols.append([210,218,202] if math.sin(a)>-.8 else [161,186,181])
 for i in range(len(xs)-1):
  for j in range(len(angles)-1):a=i*len(angles)+j;b=a+len(angles);f.extend([[a,b,a+1],[b,b+1,a+1]])
 m.add(v,f,cols)
 # The stock enters the hull and passes through real bearings.
 m.tube([ROOT,BREAK],.036,[148,166,158]);m.sphere([RUDDER_X,0,-.05],[.09,.09,.07],[113,134,130],8,12)
 return m.arrays()

def rudder(t=0,broken=False):
 m=Mesh();m.tube([BREAK,[RUDDER_X,0,-2.18]],.036,[148,166,158])
 x=RUDDER_X;v=np.array([[x,-.055,-.82],[x-.72,-.055,-.91],[x-.64,-.055,-2.12],[x,-.055,-2.18],[x,.055,-.82],[x-.72,.055,-.91],[x-.64,.055,-2.12],[x,.055,-2.18]])
 f=np.array([[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]])
 m.add(v,f,[126,151,149]);v,f,c=m.arrays();u=ease((t-2.05)/.60) if broken else 0
 return ph.pose(v-BREAK,position=BREAK+[-.3*u,0,-.35*u],pitch=35*u),f,c

def rudder_target(t,broken=False):
 u=ease((t-2.05)/.60) if broken else 0
 return ph.pose(np.array([CONTACT-BREAK]),position=BREAK+[-.3*u,0,-.35*u],pitch=35*u)[0]

def attack_actors(t):
 target=rudder_target(t,True);pos=target-lip(flip=True);yaw=0
 if t>3.4:pos=pos+[-.65*(t-3.4),-1.1*ease((t-3.4)/2),0];yaw=65*ease((t-3.4)/2)
 return [hull_mesh(),rudder(t,True),ph.whale('orca',t*3.5,jaw=12,position=pos,flip=True,yaw=yaw)]

def play_actors(t,imitation=False):
 names=['orca_female','orca_juvenile'] if imitation else ['orca_juvenile','orca_juvenile'];obj=[hull_mesh(),rudder()];centres=[]
 for j,name in enumerate(names):
  start=.5 if j==0 else 4.65;stop=2.8 if j==0 else 7.4;advance=ease((t-start)/1.15)*(1-ease((t-stop)/.9))
  work=CONTACT-lip(name,flip=True);park=work+[-2.6,-4.6 if j==0 else 4.6,-.1];pos=park*(1-advance)+work*advance;centres.append(pos)
  obj.append(ph.whale(name,t*3+j,jaw=10*advance,position=pos,flip=True))
 # Independent, non-crossing approach lanes, and only one animal at the blade at a time.
 return obj,centres
