"""The first eight NEW narrative scenes. No generic fallback: unfinished scenes must raise.
Approved craft/crew identity is reused only as an asset; all scene compositions, environments and action here are new.
"""
from pathlib import Path
from functools import lru_cache
import json,math,io,random,re
import numpy as np,cv2,cairosvg
from compositor import *
P=Path(__file__).resolve().parents[1]
PLAN=json.loads((P/'shots/NEW_SHOT_PLAN.json').read_text())

def ease(v):v=np.clip(v,0,1);return v*v*(3-2*v)

@lru_cache(maxsize=3)
def accepted_yacht(view):
 if view=='crew':
  svg=(P/'references/accepted/crew_side_detail.svg').read_bytes();w,h=1920,1080
 else:
  svg=(P/'references/accepted/approved_yacht.svg').read_bytes();w,h=1100,700
 return cv2.imdecode(np.frombuffer(cairosvg.svg2png(bytestring=svg,output_width=w,output_height=h),np.uint8),cv2.IMREAD_UNCHANGED)

def yacht(im,t,view='wide'):
 a=accepted_yacht('crew' if view=='crew' else 'wide');angle=.36*math.sin(t*.83);hh,ww=a.shape[:2]
 M=cv2.getRotationMatrix2D((ww*.5,hh*.75),angle,1);a=cv2.warpAffine(a,M,(ww,hh),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 if view=='crew':over(im,a,0,2*math.sin(t*.9))
 else:over(im,a,440,180+2*math.sin(t*.9))

@lru_cache(maxsize=5)
def canyon_plate(view):
 im=underwater(0);rng=np.random.default_rng(420+view)
 if view==0:
  left=np.array([[0,300],[190,360],[290,490],[470,600],[610,850],[690,1080],[0,1080]],np.int32);right=np.array([[1920,200],[1730,320],[1660,490],[1500,690],[1410,1080],[1920,1080]],np.int32)
 else:
  left=np.array([[0,110],[200,340],[390,560],[520,800],[740,1080],[0,1080]],np.int32);right=np.array([[1920,370],[1750,440],[1620,690],[1600,1080],[1920,1080]],np.int32)
 cv2.fillPoly(im,[left],(65,72,59),cv2.LINE_AA);cv2.fillPoly(im,[right],(55,65,54),cv2.LINE_AA)
 # Rock strata confined to the walls, not floating decorative geometry.
 mask=np.zeros((H,W),np.uint8);cv2.fillPoly(mask,[left,right],255)
 layer=im.copy()
 for j in range(85):
  x=int(rng.integers(0,W));y=int(rng.integers(320,H));r=int(rng.integers(8,38));poly=np.array([[x-r,y],[x-r*.4,y-r*.9],[x+r*.8,y-r*.7],[x+r,y+r*.3],[x-r*.3,y+r*.6]],np.int32);cv2.fillPoly(layer,[poly],tuple(int(x) for x in [61+j%13,69+j%9,54+j%7]),cv2.LINE_AA)
 im[mask>0]=layer[mask>0];return im

def canyon(t,view=0):
 im=canyon_plate(view).copy();shade=(.5+.5*math.sin(t*.3))*.015;im=np.uint8(np.clip(im*(1-shade),0,255));return im

def plume(im,x,y,t):
 if not 0<t<1.9:return
 rng=random.Random(78);layer=im.copy();alpha=np.zeros((H,W),np.float32)
 for j in range(95):
  birth=rng.uniform(0,.40);age=t-birth;vx=rng.uniform(-48,48);vy=rng.uniform(160,300)
  if not 0<age<1.5:continue
  xx=round(x+vx*age);yy=round(y-vy*age+age*age*24);r=round(2+age*10+rng.random()*7);cv2.circle(alpha,(xx,yy),max(1,r),max(0,.42-age*.22),-1,cv2.LINE_AA)
 alpha=cv2.GaussianBlur(alpha,(0,0),2.1);im[:]=np.uint8(np.clip(im*(1-alpha[:,:,None])+np.array([224,235,231])*alpha[:,:,None],0,255))

def depth_groups(t):
 im=canyon(t,0)
 for i in range(3):animal(im,'orca',440+i*180,430+i*67,58,t=t+i*.21,yaw=18,elevation=20,flip=True,opacity=.72+i*.08)
 for i in range(2):animal(im,'orca',1330+i*200,760-i*81,66,t=t+i*.29,yaw=-12,elevation=22,flip=False,opacity=.84)
 return im

def blue_surface(global_t,t):
 im=ocean(global_t,horizon=342);ppm=83.;cy=730-47*ease(t/3.0);cx=1030.;width,height=1800,840
 sprite=rig.render('blue_whale',phase=t*3.4,ppm=ppm,width=width,height=height,elevation=12,supersample=1.1)
 # A continuous waterline and transparent water distinguish submerged volume from exposed back.
 yy=np.arange(height,dtype=np.float32)[:,None]+cy-height*.54;xx=np.arange(width,dtype=np.float32)[None,:]+cx-width*.5;line=657+3*np.sin(xx*.01-global_t*1.2)
 opacity=np.clip((line-yy)/12+.40,.25,1.0);sprite=sprite.copy();sprite[:,:,3]=np.uint8(sprite[:,:,3].astype(np.float32)*opacity)
 over(im,sprite,cx-width*.5,cy-height*.54)
 m=rig.model('blue_whale');u=.12;blow=np.array([u*16-8,0,(float(m.cz(u)+m.rz(u)))*16])@rig.rotation(elevation=12).T;bx,by=cx+blow[0]*ppm,cy-blow[2]*ppm
 plume(im,bx,by,global_t-15.62)
 if global_t>=16.8:
  type_text(im,'BLUE WHALE',W-95,94,94,title=True,align='right')
  if global_t>=18.0:type_text(im,'The largest animal ever to live.',W-95,202,35,align='right')
 return im

def scale_scene(t):
 im=underwater(t);animal(im,'blue_whale',1010,485,83,t=t,elevation=10);animal(im,'orca',1010,850,83,t=t+.4,elevation=10)
 type_text(im,'THE SCALE OF THE ENCOUNTER',90,75,58,title=True);type_text(im,'≈16 m — reported whale estimate',100,634,30)
 type_text(im,'Relative-size illustration; orca shown at the same metres-to-pixels scale.',100,1020,24,colour=(181,204,202))
 return im

def relay(t):
 im=underwater(t);u=ease((t-4.2)/2.4);working=[np.array([-300.,-230.]),np.array([-220.,260.])];rest=[np.array(q,float) for q in [[600,-260],[650,240],[610,-150],[680,155],[440,350],[640,20]]];actors=[]
 for i in range(6):
  if i<2:
   q=working[i]*(1-u)+rest[i]*u;q[1]+=(-160 if i==0 else 110)*math.sin(math.pi*u);yaw=180*ease(u/.23)*(1-ease((u-.77)/.23));effort=1-.55*u
  elif i<4:
   q=rest[i]*(1-u)+working[i-2]*u;yaw=0;effort=.45+.55*u
  else:q=rest[i]+[t*7,0];yaw=0;effort=.40
  actors.append((940+q[0],590+q[1],round(yaw/3)*3,t*effort+i*.25))
 # Far-side animals pass BEHIND the whale, near-side animals in front; not a flat layer of silhouettes.
 for x,y,yaw,phase in actors:
  if y<590:animal(im,'orca',x,y,60,t=phase,yaw=yaw,elevation=38,opacity=.81)
 animal(im,'blue_whale',940,590,60,t=t,elevation=38,opacity=.93)
 for x,y,yaw,phase in actors:
  if y>=590:animal(im,'orca',x,y,60,t=phase,yaw=yaw,elevation=38,opacity=.96)
 if t>2:type_text(im,'TAKE TURNS.',90,78,72,title=True)
 return im

def canyon_exit(t):
 im=canyon(t,1);animal(im,'blue_whale',1230-t*45,600,76,t=t,elevation=18)
 animal(im,'orca',770-t*45,780,76,t=t+.5,elevation=18);animal(im,'orca',1540-t*45,370,76,t=t+.2,elevation=18)
 type_text(im,'TOWARD THE SHALLOWS',85,88,52,title=True);return im

def jaw_action(t):
 im=underwater(t);ppm=110.;m=rig.model('blue_whale');bluejaw=5+12*ease(t/1.2);bluepos=np.array([4.6,0,-.6*ease((t-3.7)/3.6)])
 # Tongue is an actual lower-jaw mesh, not a coloured overlay. Aim the predator at its articulated surface.
 u=.065;tz=float(m.cz(.13)-m.rz(.13)*.18)-.006+.007;target=np.array([[u*16,-.014*16,tz*16]])
 target=rig.articulate(target,'blue_whale',min(t,5)*3.2,np.array([6]),bluejaw);target[0,0]-=8;target=target[0]+bluepos
 bite=25-7*ease((t-1.5)/1.8);gap=(.238-.075)*7.5*math.sin(math.radians(bite));orca=np.array([target[0]-(.5-.075)*7.5-.85*(1-ease(t/1.6))-.22*ease((t-5.2)/1.8),-.12,target[2]+gap*.5+.022])
 objects=[{'name':'blue_whale','position':bluepos,'phase':min(t,5)*3.2,'jaw':bluejaw},{'name':'orca','position':orca,'flip':True,'phase':t*4,'jaw':bite}]
 sprite=rig.render_world(objects,ppm=ppm,centre=(960,550),elevation=8);over(im,sprite,0,0,.97-.12*ease((t-5)/2))
 type_text(im,'ILLUSTRATED RECONSTRUCTION',95,82,25,colour=(181,207,205))
 if t>5.8:type_text(im,'BEFORE 15:00',W-92,100,57,title=True,align='right')
 return im

def exclusion(t):
 im=underwater(t);animal(im,'blue_whale',1600,665,58,t=0,elevation=40,opacity=.45)
 # Guard moves towards intruders; the smaller species retreat beyond the left frame edge.
 animal(im,'orca',1150-100*ease(t/4),550,80,t=t,yaw=0,elevation=35)
 x=790-175*t;animal(im,'hammerhead',x,780,80,t=t,elevation=42,yaw=5);animal(im,'pilot_whale',x+120,330,80,t=t+.3,elevation=37,yaw=-10)
 if t>5.5:type_text(im,'NO WALK-INS.',W-95,106,82,title=True,align='right')
 return im

IMPLEMENTED={'canyon_deck','canyon_depth','blue_surface','blue_scale','hunt_rotation','canyon_exit','hunt_jaw','meal_exclusion'}
def frame(shot,t):
 key=shot['key'];local=t-shot['start']
 if key=='canyon_deck':
  if local<4.3:
   im=ocean(t,horizon=310);yacht(im,t,'crew');type_text(im,'MARCH 2021',W-90,76,43,colour=(29,55,68),title=True,align='right')
  elif local<7.9:
   im=ocean(t,horizon=350);yacht(im,t,'wide');type_text(im,'WESTERN AUSTRALIA',90,90,48,title=True)
  else:im=canyon(t);type_text(im,'ABOVE A DEEP UNDERWATER CANYON',90,92,43,title=True)
  return im
 if key=='canyon_depth':return depth_groups(local)
 if key=='blue_surface':return blue_surface(t,local)
 if key=='blue_scale':return scale_scene(local)
 if key=='hunt_rotation':return relay(local)
 if key=='canyon_exit':return canyon_exit(local)
 if key=='hunt_jaw':return jaw_action(local)
 if key=='meal_exclusion':return exclusion(local)
 raise NotImplementedError('This new scene has not been authored: '+key)

if __name__=='__main__':
 Q=P/'qa/opening_new';Q.mkdir(exist_ok=True)
 for s in PLAN[:8]:
  for fraction in [.2,.65]:
   im=frame(s,s['start']+s['duration']*fraction);cv2.imwrite(str(Q/(s['key']+f'_{fraction}.jpg')),im)
 print('New first-eight-scene stills generated for INTERNAL composition review, not final approval.')
