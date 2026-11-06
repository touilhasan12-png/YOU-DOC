"""Case evidence and distinct shark/blue-whale scenes. NEW UNTESTED SOURCE.
No invented individual telemetry, no generic missing-scene fallback, no image generation.
"""
from pathlib import Path
import json,math
import numpy as np,cv2
from compositor import underwater,ocean,type_text,over,W,H
from opening_scenes import ease
import illustrated_rig as rig
import physical_scene as phys
from pinniped_rig import Mesh
from scene_text import type_text
from shark_details import shark
P=Path(__file__).resolve().parents[1]

def world(base,objects,ppm,centre,elevation=14,wet=True):
 rgba,_=phys.shade(objects,ppm,centre,elevation,wet=wet);over(base,rgba,0,0);return base

def kelp(base,t,empty=False):
 # Habitat framing, not a geographic silhouette or fictional telemetry trace.
 for j,x in enumerate([50,145,245,1740,1840,1900]):
  height=240+70*(j%3);pts=[]
  for z in np.linspace(0,1,30):pts.append([x+24*math.sin(z*4+t*.65+j)*z,1080-height*z])
  cv2.polylines(base,[np.int32(pts)],False,(57,89,69),9,cv2.LINE_AA)
  for k in range(3,25,4):
   px,py=pts[k];cv2.ellipse(base,(int(px+(-1 if k%2 else 1)*18),int(py)),(24,8),(-30 if k%2 else 30),0,360,(65,104,77),-1,cv2.LINE_AA)
 return base

def regional_map(box,point,title,subtitle,t):
 base=np.full((H,W,3),(217,229,227),np.uint8);geo=json.loads((P/'geometry/world_land.geojson').read_text());xmin,ymin,xmax,ymax=box
 left,top,right,bottom=770,90,1840,990
 def xy(lon,lat):return [left+(lon-xmin)/(xmax-xmin)*(right-left),bottom-(lat-ymin)/(ymax-ymin)*(bottom-top)]
 for feature in geo['features']:
  geom=feature.get('geometry')
  if not geom:continue
  polygons=[geom['coordinates']] if geom['type']=='Polygon' else geom['coordinates'] if geom['type']=='MultiPolygon' else []
  for polygon in polygons:
   ring=np.array(polygon[0]);
   if ring[:,0].max()<xmin or ring[:,0].min()>xmax or ring[:,1].max()<ymin or ring[:,1].min()>ymax:continue
   # Geographic polygons are clipped to this real map viewport, never painted over the editorial column.
   pts=np.int32([xy(x,y) for x,y in ring]);mask=np.zeros((H,W),np.uint8);cv2.fillPoly(mask,[pts],255);mask[:top]=0;mask[bottom:]=0;mask[:,:left]=0;mask[:,right:]=0;base[mask>0]=(177,190,169)
 mx,my=map(int,xy(*point));cv2.circle(base,(mx,my),12,(43,88,204),-1,cv2.LINE_AA);cv2.circle(base,(mx,my),21,(43,88,204),2,cv2.LINE_AA)
 type_text(base,title,90,130,68,title=True,colour=(23, 62, 73));type_text(base,subtitle,94,232,34,colour=(36, 73, 83));return base

def white_shark(t):
 base=kelp(underwater(t),t);yaw=10+11*math.sin(t*.5);animal=shark('great_white',phase=t*3.4,position=(.18*math.sin(t*.6),0,-.3),yaw=yaw)
 im=world(base,[animal],ppm=285,centre=(960,645),elevation=9,wet=False);type_text(im,'GREAT WHITE SHARK',92,85,64,title=True);return im

def farallon(t):
 im=regional_map((-126,35,-120,40),(-123.,37.7),'FARALLON','California coast | 2009',t);type_text(im,'ONE VISIT.',94,430,75,title=True,colour=(23, 62, 73));type_text(im,'A WHOLE AREA CLEARED.',94,527,43,title=True,colour=(23, 62, 73));return im

def departure(t):
 base=underwater(t);objects=[]
 for j in range(3):
  x=-5+t*3.2+j*4.4;objects.append(shark('great_white',phase=t*5+j,position=(x,j*2,-.6-j*.25),yaw=-8,flip=True))
 im=world(base,objects,ppm=160,centre=(700,725),elevation=12,wet=False)
 type_text(im,'17 TAGGED SHARKS',92,82,70,title=True);type_text(im,'ALL GONE WITHIN 8 HOURS',96,176,43,title=True);type_text(im,'Illustration of departure - not individual telemetry tracks',96,1005,25);return im

def absence(t):
 im=kelp(underwater(t),t,True);type_text(im,'GONE FOR THE SEASON',100,160,69,title=True);type_text(im,'Most did not return until the following season.',104,267,42);return im

def individual(which,t,position):
 m=rig.model('orca_male');v=rig.articulate(m.v,'orca_male',t*3,m.part,0).copy();L=m.s['L'];root=float((m.cz(m.s['dx'])*m.s['L'])+(m.rz(m.s['dx'])*m.s['L']))
 k=m.part==1;hh=m.s['dh']*L;u=np.clip((v[k,2]-root)/hh,0,1);v[k,1]+=(1 if which=='starboard' else -1)*hh*(1-np.cos(2.1*u))/2.1;v[k,2]=root+hh*np.sin(2.1*u)/2.1
 v[:,0]-=L*.5;v*=6.5/L;return phys.pose(v,position=position,yaw=25),m.f,m.col

def pair(t):
 base=ocean(t,horizon=330);objects=[individual('port',t,(-3.6,1,-.20)),individual('starboard',t,(3.9,-1,-.20))]
 im=world(base,objects,ppm=115,centre=(960,700),elevation=18);type_text(im,'SOUTH AFRICA',95,80,57,title=True);type_text(im,'PORT',270,315,51,title=True);type_text(im,'STARBOARD',1200,540,51,title=True);return im

def liver(t):
 base=np.full((H,W,3),(231,237,235),np.uint8);m=rig.model('great_white');v=rig.articulate(m.v,'great_white',0,m.part,0).copy();L=m.s['L'];u=m.v[:,0]/L
 near=(m.part==0)&(u>.19)&(u<.67)&(m.v[:,1]<-.045*L)
 faces=m.f[~np.all(near[m.f],axis=1)];v[:,0]-=L*.5;org=Mesh()
 for sign in [-1,1]:org.sphere([(.43-.5)*L,sign*.024*L,-.025*L],[.17*L,.026*L,.031*L],[179,128,59])
 org.sphere([(.22-.5)*L,0,-.035*L],[.028*L,.018*L,.018*L],[139,75,57])
 im=world(base,[(v,faces,m.col),org.arrays()],ppm=300,centre=(960,650),elevation=8,wet=False)
 type_text(im,'LIVER',95,80,78,title=True,colour=(35, 77, 87));type_text(im,'Anatomical cutaway | energy-rich organ',99,181,32,colour=(66, 97, 106));return im

def sightings(t):
 im=np.full((H,W,3),(231,237,235),np.uint8);type_text(im,'DAILY SHARK SIGHTINGS',94,83,70,title=True,colour=(23, 62, 73));type_text(im,'Reported at the local hotspot',99,181,32,colour=(66, 97, 106))
 base=875;cv2.line(im,(350,base),(1570,base),(137,159,157),2,cv2.LINE_AA);cv2.rectangle(im,(500,355),(750,base),(99,135,107),-1)
 # A greater-than cap avoids inventing an exact 6.x daily mean or six monthly measurements.
 cv2.polylines(im,[np.int32([[500,356],[625,315],[750,356]])],False,(99,135,107),12,cv2.LINE_AA)
 type_text(im,'>6',540,244,86,title=True,colour=(23, 62, 73));type_text(im,'BEFORE',522,922,40,title=True,colour=(23, 62, 73))
 h=85*ease((t-1)/2);cv2.rectangle(im,(1210,int(base-h)),(1460,base),(68,91,179),-1)
 if t>1:type_text(im,'ABOUT 1',1170,base-int(h)-115,67,title=True,colour=(23, 62, 73))
 type_text(im,'WITHIN SIX MONTHS',1075,922,40,title=True,colour=(23, 62, 73));return im

def cases(t):
 im=regional_map((112,-39,123,-29),(119.38,-34.39),'BREMER BAY','Western Australia',t);type_text(im,'THREE DOCUMENTED KILLS',94,366,40,title=True,colour=(23, 62, 73));type_text(im,'2019',94,490,100,title=True,colour=(23, 62, 73))
 if t>3:type_text(im,'2021',94,665,100,title=True,colour=(23, 62, 73))
 type_text(im,'Two events in 2019; one in 2021.',97,870,29,colour=(66, 97, 106));return im

def blue(length=24,t=0,position=(0,0,-.6),pitch=0,jaw=0):
 m=rig.model('blue_whale');v=rig.articulate(m.v,'blue_whale',t*2,m.part,jaw).copy();v[:,0]-=m.s['L']*.5;v*=length/m.s['L'];return phys.pose(v,position=position,pitch=pitch),m.f,m.col

def relays(t):
 base=underwater(t);bz=-.4-1.2*ease(t/8);pitch=-6;objects=[blue(24,t,(2.8,0,bz),pitch,jaw=8)]
 m=rig.model('blue_whale');L=m.s['L'];orca=rig.model('orca');OL=orca.s['L'];g=2*math.pi*t/11.06
 for j,sign in enumerate([-1,1]):
  yaw=sign*30;target=phys.pose(np.array([[.065*L-.5*L,sign*.91*float((m.ry(.065)*m.s['L'])),float((m.cz(.065)*m.s['L'])-.18*(m.rz(.065)*m.s['L']))]])*1.5,(2.8,0,bz),pitch=pitch)[0]
  local=phys.pose(np.array([[(.075-.5)*OL,sign*.90*float((orca.ry(.075)*orca.s['L'])),float((orca.cz(.075)*orca.s['L'])-.18*(orca.rz(.075)*orca.s['L']))]]),yaw=yaw)[0]
  working=target-local;rest=np.array([5.5,sign*4.,-1.3]);swap=ease((t-4.2)/2.3)
  objects.append(phys.whale('orca',t*4+j,jaw=18*(1-swap),position=working*(1-swap)+rest*swap+np.array([0,sign*3*math.sin(math.pi*swap),.25*math.sin(math.pi*swap)]),yaw=yaw+sign*30*swap))
  fm=rig.model('orca_female');FL=fm.s['L'];flocal=phys.pose(np.array([[(.075-.5)*FL,sign*.90*float((fm.ry(.075)*fm.s['L'])),float((fm.cz(.075)*fm.s['L'])-.18*(fm.rz(.075)*fm.s['L']))]]),yaw=yaw)[0];femaleWorking=target-flocal
  objects.append(phys.whale('orca_female',t*4+j+.8,jaw=18*swap,position=rest*(1-swap)+femaleWorking*swap+np.array([0,sign*.8*math.sin(math.pi*swap),-.1*math.sin(math.pi*swap)]),yaw=yaw))
 return world(base,objects,ppm=68,centre=(1050,590),elevation=30,wet=False)

def young(t):
 im=world(underwater(t),[blue(8,t,(-6.2,0,-.3)),blue(13,t,(5.1,0,-.3))],ppm=70,centre=(960,650),elevation=13,wet=False)
 type_text(im,'TWO WERE YOUNG',94,82,67,title=True);type_text(im,'CALF',420,370,45,title=True);type_text(im,'JUVENILE',1170,350,45,title=True);return im

def adult(t):
 im=world(underwater(t),[blue(24,t),phys.whale('orca',phase=t*3,position=(-4,-3,-.4))],ppm=70,centre=(960,620),elevation=17,wet=False);type_text(im,'ONE WAS A HEALTHY ADULT',95,85,61,title=True);return im

def strategy(t):
 base=kelp(underwater(t),t);objects=[];turn=ease((t-1)/4);mouth=.8+3*ease((t-5.3)/2)
 mother=(-4+4*turn,1.6,-.3);youngPos=(-1+3*ease((t-3)/3),-1.3,-.3)
 objects.append(phys.whale('orca_female',t*4,position=mother,yaw=45*turn,flip=True));objects.append(phys.whale('orca_juvenile',t*5,jaw=20*ease((t-6)/1),position=youngPos,yaw=-30*turn,flip=True))
 for j in range(7):
  x=5.7+.25*(j%3)-1.8*ease((t-2)/4);objects.append(phys.whale('salmon',t*7+j,position=(x,.35*(j//3),-.8+.18*(j%2)),yaw=-25*turn))
 im=world(base,objects,ppm=145,centre=(900,650),elevation=17,wet=False);type_text(im,'LEARNED. COORDINATED. ADAPTED.',92,82,53,title=True);return im

FUNCTIONS={'white_shark':white_shark,'farallon_evidence':farallon,'shark_departure':departure,'season_absence':absence,'port_starboard':pair,'shark_liver':liver,'sightings_change':sightings,'blue_cases':cases,'blue_relays':relays,'young_victims':young,'adult_victim':adult,'learned_strategy':strategy}
IMPLEMENTED=set(FUNCTIONS)
def frame(s,t):return FUNCTIONS[s['key']](t-s['start'])
if __name__=='__main__':
 q=P/'qa/investigation';q.mkdir(exist_ok=True);plan=json.loads((P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text())
 for s in plan:
  if s['key'] in IMPLEMENTED:
   im=frame(s,s['start']+s['duration']*.5);cv2.imwrite(str(q/(s['key']+'.jpg')),im);print('UNREVIEWED case scene',s['key'],flush=True)
