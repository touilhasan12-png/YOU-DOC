"""Purpose-built historical, human-interaction, Iberian and ecosystem sequences.
Uses the accepted crew drawing system, calibrated boats, complete physical animal meshes,
real geographic geometry, original drawn objects and licensed observational footage.
"""
from pathlib import Path
from functools import lru_cache
import math,json,io
import numpy as np,cv2,cairosvg,av
from compositor import ocean,underwater,over,type_text,rope,W,H
import people_boats as people
import illustrated_rig as rig
import physical_scene as phys
from pinniped_rig import Mesh
from scene_text import type_text
from shark_details import shark
from opening_scenes import ease,canyon,plume
from investigation_scenes import regional_map,kelp,blue,world
P=Path(__file__).resolve().parents[1];INK=(31,57,68)

def paper():
 y=np.linspace(0,1,H)[:,None,None];return np.uint8(np.ones((H,W,3))*[231,237,235]-y*[9,7,5])
def title(im,text,sub=None):
 type_text(im,text,94,78,65,title=True)
 if sub:type_text(im,sub,98,170,31)
 return im

def svgimage(text):return cv2.imdecode(np.frombuffer(cairosvg.svg2png(bytestring=text.encode()),np.uint8),cv2.IMREAD_UNCHANGED)

@lru_cache(maxsize=4)
def yacht_sprite(tick,has_rudder=True):
 t=tick/8;g=people.path('M230 580 Q750 505 1550 550 L1450 625 340 676Z','#9caeae','#294756',3)
 g+=people.path('M610 523 L765 418 1100 420 1233 538Z','url(#cream)','#34525e',3)
 g+=people.path('M785 435 L806 490 910 494 898 435Z M930 435 L940 496 1080 500 1065 435Z','url(#window)','#35525f',3)
 g+=people.path('M970 450 L974 44','none','#bdc4b8',8)
 g+=people.path('M979 58 L1410 489 985 425Z','#e8e4d0','#7c8e89',2)
 g+=people.path('M970 80 L560 466 955 411Z','#d6d7c4','#778f8c',2)
 g+=people.path('M982 175 L1134 418 M982 282 L1274 471 M972 45 L1504 554 M972 45 L276 586','none','#9baea7',1.8)
 for x,yy in [(298,577),(477,555),(1214,534),(1480,550)]:g+=people.path(f'M{x} {yy} L{x} {yy-75}','none','#bbc8c1',4)
 g+=people.path('M298 502 Q760 433 1480 475','none','#bcc8bf',3)
 for i,(x,y) in enumerate([(495,583),(632,560)]):
  lh=[470,556] if i==0 else [605,545];rh=[514,556] if i==0 else [660,542]
  s,_=people.person(x,y,110,'passenger',3+i*2,t,left_hand=lh,right_hand=rh,lean=.8*math.sin(t+i),look=5*math.sin(t*.7+i));g+=s
 g+=people.path('M230 580 Q810 645 1550 550 Q1475 722 1260 751 L408 760 Q289 731 230 580Z','url(#cream)','#294958',3)
 g+=people.path('M244 598 Q840 657 1538 573','none','#345c72',10)
 g+=people.path('M405 744 Q851 774 1270 735','none','#7f9699',3)
 for x in [750,860,970,1080,1190]:g+=f'<ellipse cx="{x}" cy="678" rx="26" ry="13" fill="#3e6170" stroke="#9aafa9" stroke-width="3"/>'
 g+='<circle cx="490" cy="556" r="24" fill="none" stroke="#776c54" stroke-width="5"/>'
 for a in [0,2.1,4.2]:g+=people.path(f'M490 556 L{490+24*math.cos(a):.1f} {556+24*math.sin(a):.1f}','none','#776c54',3)
 if has_rudder:
  g+=people.path('M340 700 L340 1000','none','#879f9a',7)
  g+=people.path('M340 840 L260 855 270 990 340 1000Z','#789391','#2f4e5a',3)
  g+='<circle cx="340" cy="722" r="9" fill="#617f80"/>'
 return svgimage(people.svg_document(g,1800,1100))

@lru_cache(maxsize=4)
def vessel_sprite(kind,tick,has_rudder=True):
 if kind=='yacht':return yacht_sprite(tick,has_rudder)
 text,_=(people.whaleboat if kind=='period' else people.rescue)(tick/8);return svgimage(text)

def vessel(im,kind,t,centre=(1060,730),ppm=75,has_rudder=True):
 a=vessel_sprite(kind,round(t*8),has_rudder);srcppm=110 if kind=='yacht' else 162.5 if kind=='period' else 1390/8.2;origin=(875,760) if kind=='yacht' else (875,688) if kind=='period' else (885,678);scale=ppm/srcppm
 a=cv2.resize(a,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA if scale<1 else cv2.INTER_LINEAR);over(im,a,centre[0]-origin[0]*scale,centre[1]-origin[1]*scale+2*math.sin(t*.85));return im

def whale_water(im,objects,ppm=100,centre=(960,750),elev=12):return world(im,objects,ppm,centre,elev,wet=True)

@lru_cache(maxsize=4)
def swimmer_sprite(tick,board=False,gear=False):
 t=tick/12;g=''
 if board:g+=people.path('M-1.18 .09 Q-.98 -.02 .15 .015 Q.95 .015 1.22 .105 Q.95 .20 -.7 .19 Q-1.2 .17 -1.18 .09Z','#e5d3a7','#3d5960',.012)
 g+=people.path('M-.61 -.08 Q-.55 -.16 -.33 -.13 L.24 -.075 .36 .035 .16 .12 -.42 .065 -.62 .025Z','#243e49','#142f3e',.012)
 arm=.035*math.sin(t*6)
 g+=people.path(f'M-.50 -.10 Q-.69 {-.28+arm} -.88 -.04 L-.96 .01 -.93 .055 -.82 .025 Q-.63 -.09 -.46 .02Z','#304d59','#16333e',.012)
 g+=people.path(f'M-.45 -.075 Q-.52 {.16+arm} -.85 .20 L-.97 .22 -.98 .255 -.83 .25 Q-.47 .24 -.37 .045Z','#d1a882','#6d6152',.01)
 for j in range(3):g+=people.path(f'M{-.96+j*.018} .22 L{-.98+j*.018} .258','none','#826b54',.004)
 g+=people.path('M-.63 -.075 L-.69 -.09 -.71 -.015 -.61 .015Z','#cea27a','#6d6152',.009)
 g+=people.path('M-.82 -.13 Q-.72 -.19 -.66 -.12 L-.66 -.06 -.62 -.035 -.67 -.005 Q-.75 .015 -.81 -.045Z','#d5ac86','#66594b',.01)
 g+=people.path('M-.82 -.055 Q-.88 -.16 -.78 -.19 Q-.68 -.22 -.655 -.13 L-.71 -.13 -.76 -.16 -.81 -.10Z','#354345','#203744',.008)
 g+=people.path('M-.693 -.088 L-.674 -.085','none','#203541',.009)
 if gear:g+=people.path('M-.81 -.10 L-.66 -.10 -.65 -.04 -.80 -.035Z','#324e56','#91b7ba',.012)+people.path('M-.70 -.06 L-.62 -.03','none','#273e48',.015)
 for sign in [-1,1]:
  k=.045*math.sin(t*7+sign*math.pi/2);g+=people.path(f'M.23 -.065 Q.46 {-.08+k} .66 {-.03+k} L.95 {-.02+k} 1.07 {.025+k} 1.05 {.065+k} .90 {.04+k} .62 {.06+k} .22 .09Z','#2b4651','#18323e',.012)
 if gear:g+=people.path('M.94 -.01 L1.25 -.06 1.28 .03 1.0 .07Z','#456d76','#203f4c',.012)
 return svgimage(f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="-1.5 -1 4 2"><g>{g}</g></svg>')

def swimmer(im,x,y,ppm,t,board=False,gear=False,flip=False):
 a=swimmer_sprite(round(t*12),board,gear);scale=ppm/200
 if flip:a=cv2.flip(a,1);ox=500
 else:ox=300
 a=cv2.resize(a,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA);over(im,a,x-ox*scale,y-200*scale);return [x-.96*ppm,y+.23*ppm]

def right_whale(t,position=(0,0,-.4)):
 # Southern-right-like baleen-whale reconstruction: arched jaw, head callosities, NO dorsal fin.
 m=Mesh();xs=np.linspace(-6,5.3,115);kn=[-6,-5.5,-4.6,-3,-1,1.5,3.5,4.7,5.3];ys=[.02,.48,.8,1.,1.05,.9,.52,.19,.05];zs=[.03,.58,.85,1.03,1.04,.9,.52,.19,.05];cs=[.4,.4,.35,.20,.08,0,-.07,-.1,-.1];v=[];c=[];f=[]
 for x in xs:
  ry=np.interp(x,kn,ys);rz=np.interp(x,kn,zs);cz=np.interp(x,kn,cs)
  for a in np.linspace(0,2*np.pi,60,endpoint=False):v.append([x,ry*math.cos(a),cz+rz*math.sin(a)]);c.append([53,65,68] if math.sin(a)>-.6 else [94,111,112])
 for i in range(114):
  for j in range(60):a=i*60+j;b=i*60+(j+1)%60;cc=(i+1)*60+j;d=(i+1)*60+(j+1)%60;f.extend([[a,b,cc],[b,d,cc]])
 m.add(v,f,c)
 for sign in [-1,1]:
  m.paddle([-2.6,sign*.85,-.35],[-.2,sign,-.4],1.6,.38,[50,64,68]);m.sphere([-3.65,sign*.86,.15],[.026,.018,.026],[12,24,29])
  for j in range(5):m.sphere([-5.5+j*.26,sign*(.15+.04*j),1.05+.11*math.sin(j)],[.12,.09,.04],[156,166,155],8,12)
  pts=[[-5.85+j*.13,sign*(.28+j*.027),.0+.018*j] for j in range(19)];m.tube(pts,.018,[31,43,48],6)
 outline=rig.catmull([[5.05,0],[5.4,-1.0],[5.8,-1.9],[6.18,-1.6],[6.1,-.7],[5.8,0],[6.1,.7],[6.18,1.6],[5.8,1.9],[5.4,1.0]],4);tv=[[5.5,0,-.1]]+[[x,y,-.1] for x,y in outline];tf=[[0,j+1,(j+1)%len(outline)+1] for j in range(len(outline))];m.add(tv,tf,[44,58,64]);v,f,c=m.arrays();v[:,2]+=np.clip((v[:,0]-1)/5,0,1)**2*.14*math.sin(t*3);return phys.pose(v,position),f,c

def history(key,t):
 if key=='twofold_arrival':
  im=regional_map((146,-39,153,-33),(149.9,-37.06),'TWOFOLD BAY','Southeastern Australia',t);type_text(im,'1840-1930',94,470,100,title=True,colour=INK);type_text(im,'An unusual business partnership.',98,615,32,colour=INK);return im
 if key=='whaler_view':
  im=ocean(t,horizon=400);whale_water(im,[phys.whale('orca',t*3,position=(-2,3,-.45))],ppm=95,centre=(960,760));vessel(im,'period',t,(960,970),145);return title(im,'TWOFOLD BAY','Illustrated historical reconstruction')
 if key=='whaling_cooperation':
  im=ocean(t,horizon=350);objects=[right_whale(t,(1.7,1,-.35)),phys.whale('orca',t*4,position=(-5+1.2*ease(t/4),-1.5,-.5)),phys.whale('orca_female',t*4+.6,position=(4.7,3,-.5))];whale_water(im,objects,ppm=90,centre=(960,680));vessel(im,'period',t,(1350,940),73);return im
 if key=='law_tongue':
  im=paper();type_text(im,'THE LAW OF THE TONGUE',94,80,78,colour=INK,title=True);type_text(im,'Tongue and lips: the orcas\' cut.',98,204,41,colour=INK);type_text(im,'The rest: towed ashore.',98,287,35,colour=INK);vessel(im,'period',t,(1270,820),100);world(im,[phys.whale('orca',t*3,position=(-5,0,0),jaw=12)],ppm=100,centre=(960,750),wet=False);return im
 if key=='old_tom_intro':
  im=ocean(t,horizon=340);whale_water(im,[phys.whale('orca',t*3,position=(0,0,-.32),yaw=8)],ppm=210,centre=(1060,790));return title(im,'OLD TOM','Illustrated portrait')
 if key=='partnership_decline':
  im=ocean(t,horizon=450);vessel(im,'period',t,(1510,860),55);type_text(im,'1901',94,82,100,title=True);type_text(im,'A stranded whale killed on the beach.',98,210,35)
  if t>3:type_text(im,'1902',94,393,100,title=True);type_text(im,'Only 7 of about 30 returned.',98,520,43)
  return im
 if key=='tow_rope':
  im=ocean(t,horizon=325);ppm=82;vessel(im,'period',t,(1310,650),ppm);m=rig.model('orca');local=np.array([[(.075-.5)*7.5,-.9*float((m.ry(.075)*m.s['L'])),float((m.cz(.075)*m.s['L'])-.18*(m.rz(.075)*m.s['L']))]]);v=phys.pose(local,position=(-6.3,0,-.35),yaw=32,flip=True)[0];whale_water(im,[phys.whale('orca',t*3,jaw=12,position=(-6.3,0,-.35),yaw=32,flip=True)],ppm,(1310,770),12);rope(im,(1310+v[0]*ppm,770-v[2]*ppm),(1310+(1491-875)/162.5*ppm,650+(541-688)/162.5*ppm),1);return im
 if key=='worn_teeth':
  im=underwater(t);m=rig.model('orca');v=rig.articulate(m.v,'orca',t,m.part,17).copy();teeth=(m.part==9)&(m.v[:,0]<.10*m.s['L']);faces=m.f[~np.all(teeth[m.f],axis=1)];v[:,0]-=3.75;world(im,[(phys.pose(v,(5,0,0)),faces,m.col)],ppm=285,centre=(960,640),wet=False);return title(im,'WORN TEETH','Historical account: tow-rope wear')
 im=ocean(t,horizon=520);vessel(im,'period',t,(1450,920),48);type_text(im,'1930',94,120,120,title=True);type_text(im,'Old Tom died. The partnership ended.',100,288,43);type_text(im,'Starvation was a possible explanation, not a certainty.',100,377,28);return im

def surfer(t):
 if t>9:
  im=paper();type_text(im,'1972 | CALIFORNIA',94,80,65,colour=INK,title=True);type_text(im,'AROUND 100 STITCHES',95,355,105,colour=INK,title=True);type_text(im,'Nonfatal bite. Suspected mistaken identity.',100,530,38,colour=INK);return im
 im=ocean(t,horizon=400);x=4.0-2.2*ease((t-1)/4);whale_water(im,[phys.whale('orca',t*3,jaw=10*ease(t/3),position=(x,0,-.5),pitch=6*ease(t/4))],ppm=140,centre=(960,760));swimmer(im,540,760,140,t,board=True);title(im,'1972 | CALIFORNIA','Illustrated reconstruction - nonfatal encounter');return im

def diver(t):
 im=underwater(t);x=420-t*18;y=600+110*ease(t/5);objects=[phys.whale('orca',t*3,position=(0,0,-.4),flip=True)];world(im,objects,ppm=125,centre=(x,690),wet=False);hand=swimmer(im,1120-t*18,y,125,t,gear=True)
 end=(x+1.8*125,800);rope(im,hand,end,1-ease((t-5.5)/2),colour=(169,190,182),thickness=3);return title(im,'NEW ZEALAND','Reported entanglement | more than 40 seconds underwater')

class Footage:
 def __init__(self):self.c=None;self.last=-1;self.image=None
 def get(self,t):
  path=P/'media/REAL_003 - NOAA Southern Residents - FULL SOURCE.mp4'
  if self.c is None or t<self.last-.1 or t>self.last+2:
   if self.c:self.c.close()
   self.c=av.open(str(path));self.st=self.c.streams.video[0];self.st.thread_type='NONE';self.st.codec_context.thread_count=1;self.c.seek(int(max(0,t-1)/self.st.time_base),stream=self.st);self.gen=self.c.decode(self.st)
  for f in self.gen:
   now=float(f.time)
   if now>=t-1/60:self.image=f.to_ndarray(format='bgr24');self.last=now;break
  return cv2.resize(self.image,(W,H))
FOOT=Footage()
def real_family(t,source=35):
 im=FOOT.get(source+t)
 if t<5:type_text(im,'Wild southern resident orcas | Paul B. Hillman / NOAA Fisheries | Permit 16163',70,1010,24)
 return im

def captivity(t):
 im=np.full((H,W,3),(188,203,201),np.uint8);cv2.ellipse(im,(960,640),(850,335),0,0,360,(139,170,176),-1,cv2.LINE_AA);cv2.ellipse(im,(960,660),(770,250),0,0,360,(147,124,55),-1,cv2.LINE_AA)
 world(im,[phys.whale('orca',t*2,position=(math.sin(t*.25)*2,0,-.5),yaw=t*6)],ppm=92,centre=(960,710));type_text(im,'CAPTIVITY IS A DIFFERENT RECORD',94,78,65,title=True,colour=INK);type_text(im,'Trainer deaths have occurred; explanations remain debated.',98,170,31,colour=INK);return im

def rudder_mesh(t,broken=False):
 m=Mesh();m.tube([[-2.5,0,.1],[-2.5,0,-1.8]],.035,[136,151,145]);v=np.array([[-2.5,-.05,-.3],[-3.25,-.05,-.42],[-3.15,-.05,-1.8],[-2.5,-.05,-1.7],[-2.5,.05,-.3],[-3.25,.05,-.42],[-3.15,.05,-1.8],[-2.5,.05,-1.7]]);f=np.array([[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]]);m.add(v,f,[126,151,149]);v,f,c=m.arrays();u=ease((t-1.3)/1.4) if broken else 0;pivot=np.array([-2.5,0,.1]);v=phys.pose(v-pivot,position=pivot+[-.45*u,0,-.35*u],pitch=45*u);return v,f,c

def rudder_action(t,leave=True):
 im=underwater(t);u=ease((t-1.3)/1.4);target=phys.pose(np.array([[-.72,0,-1.]]),position=(-2.5-.45*u,0,.1-.35*u),pitch=45*u)[0];m=rig.model('orca');raw=np.array([[(.075-.5)*7.5,-.90*float((m.ry(.075)*m.s['L'])),float((m.cz(.075)*m.s['L'])-.18*(m.rz(.075)*m.s['L']))]]);lip=phys.pose(raw,flip=True)[0];pos=target-lip+[0,0,.12];yaw=180*ease((t-3.2)/2.2) if leave else 0
 if t>3.2:pos[0]-=(t-3.2)*.6
 objects=[rudder_mesh(t,True),phys.whale('orca',t*3.5,jaw=12,position=pos,yaw=yaw,flip=True)];world(im,objects,ppm=150,centre=(1050,420),elevation=10,wet=False)
 cv2.fillPoly(im,[np.int32([[705,0],[1900,0],[1850,385],[1050,422],[705,366]])],(171,187,183),cv2.LINE_AA);return title(im,'THE RUDDER','Illustrated mechanical reconstruction')

def boat_encounter(t):
 im=ocean(t,horizon=340);ppm=75;target=np.array([(340-875)/110-.32,0,-1.43]);m=rig.model('orca');lip=phys.pose(np.array([[(.075-.5)*7.5,-.9*float((m.ry(.075)*m.s['L'])),float((m.cz(.075)*m.s['L'])-.18*(m.rz(.075)*m.s['L']))]]),flip=True)[0];pos=target-lip;pos[0]-=.35*(1+math.sin(t*1.1))
 whale_water(im,[phys.whale('orca',t*4,position=pos,flip=True,jaw=8)],ppm,(1080,755));vessel(im,'yacht',t,(1080,735),ppm);return im

def crew_close(t,safety=False):
 im=ocean(t,horizon=500);back=people.path('M0 790 Q960 690 1920 765 L1920 1080 0 1080Z','url(#cream)','#3d5963',4)
 s,_=people.person(1190,745,360,'passenger',3,t,left_hand=[1108,684],right_hand=[1220,684],lean=1.3*math.sin(t*.8),look=-4+2*math.sin(t*.6));back=s+back+people.path('M1100 685 a60 60 0 1 0 120 0 a60 60 0 1 0 -120 0','none','#927b57',9);over(im,svgimage(people.svg_document(back,1920,1080)),0,0)
 if safety:title(im,'NO STEERING RESPONSE','The wheel turns. The broken rudder cannot.')
 return im

def population(t):
 im=underwater(t);world(im,[phys.whale('orca_female',t*3,position=(-5.5,1,0)),phys.whale('orca_juvenile',t*4,position=(0,-1.3,0)),phys.whale('orca',t*3,position=(5,1,0))],ppm=82,centre=(960,795),elevation=15,wet=False)
 type_text(im,'FEWER THAN 40',94,80,99,title=True);type_text(im,'Iberian population | Critically endangered since 2019',99,220,31)
 if t>3:type_text(im,'ABOUT 15 INVOLVED',98,330,61,title=True)
 return im

def play(t,imitation=False):
 im=underwater(t);mesh=rudder_mesh(0);nudge=ease((t-.5)/2)*(1-ease((t-4.1)/2));vv,ff,cc=mesh;pivot=np.array([-2.5,0,.1]);angle=12*math.sin(t*.65)*nudge;vv=phys.pose(vv-pivot,position=pivot,pitch=angle);obj=[(vv,ff,cc)];target=phys.pose(np.array([[-.72,0,-1.]]),position=pivot,pitch=angle)[0]
 for j,name in enumerate(['orca_female','orca_juvenile'] if imitation else ['orca_juvenile','orca_juvenile']):
  phase=t-j*(3.8 if imitation else 1.6);advance=ease((phase-.5)/2)*(1-ease((phase-4.1)/2));m=rig.model(name);L=m.s['L'];sign=-1 if j==0 else 1;yaw=30 if j==0 else -30
  lip=phys.pose(np.array([[(.5-.075)*L,sign*.9*float((m.ry(.075)*m.s['L'])),float((m.cz(.075)*m.s['L'])-.18*(m.rz(.075)*m.s['L']))]]),yaw=yaw)[0];working=target-lip;working[0]-=.8*(1-advance);obj.append(phys.whale(name,t*3+j,jaw=10*advance,position=working,flip=True,yaw=yaw))
 world(im,obj,ppm=105 if imitation else 170,centre=(1260,610) if imitation else (1330,650),elevation=28 if imitation else 12,wet=False);return title(im,'IMITATION?' if imitation else 'PLAY OR SOCIALIZING?','A proposed explanation - not a proven motive')

def swim_compare(t):
 im=underwater(t);sec=.8*ease((t-1)/1.2);ppm=90;x=520+50/3.6*sec*ppm;world(im,[phys.whale('orca',sec*5,position=(0,0,0),flip=True)],ppm=ppm,centre=(x,490),elevation=7,wet=False);swimmer(im,775+9/3.6*sec*ppm,830,ppm,sec,flip=True)
 type_text(im,'ORCA: BURSTS OVER 50 km/h',95,80,61,title=True);type_text(im,'SPRINT SWIMMER: UNDER 10 km/h',95,945,43,title=True);type_text(im,'0.8-second illustrative comparison - not a measured race',95,1010,24);return im

def safety(t):
 im=paper();sea=ocean(t,horizon=520);im[:,1080:]=sea[:,1080:];vessel(im,'yacht',t,(1480,850),60);type_text(im,'SPAIN: VESSEL SAFETY UPDATE',90,75,57,title=True,colour=INK);type_text(im,'Do not stop the vessel.',96,185,40,colour=INK);type_text(im,'Head toward shallower coastal waters if safe.',96,255,35,colour=INK);type_text(im,'Contact rescue on VHF 16.',96,322,35,colour=INK);type_text(im,'Official ministry guidance | May 2025',98,405,25,colour=INK);type_text(im,'Wildlife viewing: keep your distance.',96,900,28,colour=INK);type_text(im,'Follow local wildlife rules.',96,950,28,colour=INK);return im

def baitfish(t,position):
 m=Mesh();m.sphere([0,0,0],[.09,.018,.028],[170,190,186],8,16)
 for sign in [-1,1]:m.sphere([-.06,sign*.016,.008],[.0035]*3,[17,37,43],6,8)
 m.add([[.075,0,0],[.13,0,.036],[.115,0,0],[.13,0,-.036]],[[0,1,2],[0,2,3]],[132,161,159]);v,f,c=m.arrays();v[:,1]+=np.clip((v[:,0]-.03)/.1,0,1)*.015*math.sin(t*9);return phys.pose(v,position),f,c

def ecosystem(t,role='bronze'):
 im=kelp(underwater(t),t);obj=[]
 for j in range(3):obj.append(shark('bronze_whaler',t*3+j,position=(-3.8+j*3.8-.35*t,j%2*1.4,-.5-j*.12),yaw=12))
 if role=='web':
  for j in range(18):obj.append(baitfish(t+j,(3+1.3*math.sin(j*3.1)-.4*t,((j%5)-2)*.25,-.1+.16*(j//5))))
 if role=='wide':obj.append(phys.whale('orca',t*2,position=(4,6,-1.4),yaw=20))
 world(im,obj,ppm=140 if role!='wide' else 95,centre=(960,690),elevation=17,wet=False)
 if role=='bronze':title(im,'BRONZE WHALER SHARKS','Smaller sharks moved into the vacated role.')
 return im

def final_canyon(t):
 im=ocean(t,horizon=345);bz=-.8+.18*ease(t/2);obj=[blue(16,t,(1,0,bz))]
 for j,x in enumerate([-6,-1.5,3]):obj.append(phys.whale('orca_female' if j==1 else 'orca',t*3+j,position=(x-2*(1-ease(t/5)),[-6.5,6.5,11.][j],-.4)))
 world(im,obj,ppm=78,centre=(960,650),elevation=12,wet=True);bm=rig.model('blue_whale');point=phys.pose(np.array([[1+(.12-.5)*16,0,bz+float((bm.cz(.12)*bm.s['L'])+(bm.rz(.12)*bm.s['L']))]]))@rig.rotation(elevation=12).T;plume(im,960+point[0,0]*78,650-point[0,2]*78,t-2.7056);return im

def teamwork(t):
 im=underwater(t);obj=[phys.whale('orca_female',t*3,position=(-3,0,-.2)),phys.whale('orca_juvenile',t*4,position=(2,-3.3,-.4)),phys.whale('orca',t*2,position=(5,3.5,-.3))];world(im,obj,ppm=115,centre=(960,720),elevation=20,wet=False)
 for j,word in enumerate(['PATIENCE','ROTATION','TEACHING']):
  if t>j*2.4:type_text(im,word,95+j*590,80,61,title=True)
 return im

def plans(t):
 im=ocean(t,horizon=360);world(im,[phys.whale('orca',t*2,position=(0,0,-.48),yaw=90)],ppm=300,centre=(960,800),elevation=5,wet=True);type_text(im,'SOMETHING THAT PLANS',960,80,83,title=True,align='center');return im

HISTORY={'twofold_arrival','whaler_view','whaling_cooperation','law_tongue','old_tom_intro','partnership_decline','tow_rope','worn_teeth','old_tom_end'}
def frame(s,global_t):
 t=global_t-s['start'];k=s['key']
 import revision_scenes
 if k in revision_scenes.KEYS:return revision_scenes.frame(k,t)
 if k in HISTORY:return history(k,t)
 if k=='surfer_incident':return surfer(t)
 if k=='diver_entanglement':return diver(t)
 if k=='wild_record':return real_family(t,75)
 if k=='captivity_context':return captivity(t)
 if k=='iberian_region':return regional_map((-12,34,-3,44),(-5.6,36),'IBERIAN ORCAS','Spain and Portugal | since May 2020',t)
 if k=='yacht_stern':return boat_encounter(t)
 if k=='interaction_counts':
  im=paper();type_text(im,'AROUND 700',94,100,130,colour=INK,title=True);type_text(im,'REPORTED INTERACTIONS',100,273,54,colour=INK,title=True);type_text(im,'One estimate: about 1 in 5 disabled the boat.',100,440,40,colour=INK);type_text(im,'Counts in the narrated period - not a live total',100,555,28,colour=INK);return im
 if k=='iberian_population':return population(t)
 if k=='rudder_detaches':return rudder_action(t)
 if k=='helm_response':return crew_close(t,True)
 if k=='lisbon_context':
  im=ocean(t,horizon=520);vessel(im,'yacht',t,(1260,815),85,has_rudder=False);return title(im,'OFF LISBON | SEPTEMBER 2025','Reported sinking - illustrated reconstruction')
 if k=='five_rescued':return title(vessel(ocean(t),'rescue',t,(960,880),148),'ALL FIVE RESCUED','Unharmed | modern rescue reconstruction')
 if k=='hypothesis_play':return play(t)
 if k=='hypothesis_imitation':return play(t,True)
 if k=='human_not_target':return title(crew_close(t),'NO EVIDENCE PEOPLE ARE THE TARGET')
 if k=='open_water_pov':
  im=ocean(t,horizon=470);return world(im,[phys.whale('orca',t*3,position=(0,-2*ease(t/5),-.48),yaw=90)],ppm=150+40*ease(t/5),centre=(960,820),elevation=5)
 if k=='swim_comparison':return swim_compare(t)
 if k=='ice_option':return world(underwater(t),[phys.slab(position=(3,0,.1)),phys.whale('orca',t*3,position=(-3,0,-1.5),flip=True)],ppm=145,centre=(960,450),elevation=10,wet=False)
 if k=='boat_option':return world(underwater(t),[rudder_mesh(3,True),phys.whale('orca_juvenile',t*3,position=(4+t*.4,2,-.8),yaw=35)],ppm=145,centre=(1080,410),wet=False)
 if k=='power_option':return title(world(underwater(t),[phys.whale('orca',t*2,jaw=10+9*ease(t/2),position=(5,0,0))],ppm=275,centre=(960,650),elevation=7,wet=False),'40-56 CURVED TEETH','More than six tonnes in a large male')
 if k=='distance_rule':return safety(t)
 if k=='wildlife_distance':
  im=ocean(t,horizon=440);whale_water(im,[phys.whale('orca',t*2,position=(0,0,-.3))],ppm=25,centre=(550,560));return vessel(im,'yacht',t,(1370,930),85)
 if k=='boring_release':return whale_water(ocean(t,horizon=410),[phys.whale('orca',t*3,position=(-1-t*.3,0,-.45))],ppm=130,centre=(960,720))
 if k=='vulnerability':
  im=underwater(t);world(im,[phys.whale('orca_female',t*2.5,position=(-2,1,-.3),yaw=8*math.sin(t*.3)),phys.whale('orca_juvenile',t*3,position=(2,-1.2,-.5),yaw=8*math.sin(t*.3))],ppm=145,centre=(960,730),elevation=65,wet=False);return title(im,'A SMALL POPULATION','Fewer than forty Iberian orcas')
 if k=='ecology_place':return regional_map((15,-37,25,-30),(19.35,-34.58),'SOUTH AFRICA','The coastal ecosystem changes with its predators.',t)
 if k=='bronze_replacement':return ecosystem(t,'bronze')
 if k=='food_web_response':return ecosystem(t,'web')
 if k=='ocean_role':return ecosystem(t,'wide')
 if k=='canyon_return':return final_canyon(t)
 if k=='teamwork_final':return teamwork(t)
 if k=='plans_final':return plans(t)
 raise NotImplementedError(k)
IMPLEMENTED=HISTORY|{'surfer_incident','diver_entanglement','wild_record','captivity_context','iberian_region','yacht_stern','interaction_counts','iberian_population','rudder_detaches','helm_response','lisbon_context','five_rescued','hypothesis_play','hypothesis_imitation','human_not_target','open_water_pov','swim_comparison','ice_option','boat_option','power_option','distance_rule','wildlife_distance','boring_release','vulnerability','ecology_place','bronze_replacement','food_web_response','ocean_role','canyon_return','teamwork_final','plans_final'}
if __name__=='__main__':
 q=P/'qa/human_history';q.mkdir(exist_ok=True);plan=json.loads((P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text())
 for s in plan:
  if s['key'] in IMPLEMENTED:
   im=frame(s,s['start']+s['duration']*.4);cv2.imwrite(str(q/(s['key']+'.jpg')),im);print('Private composition',s['key'],flush=True)
