"""Scene-specific information graphics and spatial balancing, not a persistent text strip.
Different visual treatments for acoustics, anatomy, geography, history and counts.
Positions occupy previously unused negative space; licensed footage and accepted opening are untouched.
"""
from functools import lru_cache
from pathlib import Path
import json,math
import cv2,numpy as np
from scene_text import type_text
P=Path(__file__).resolve().parents[1]
CREAM=(217,231,224);MUTED=(128,164,157);INK=(36,62,70);GOLD=(124,187,210)

def text(im,s,x,y,size=27,light=True):return type_text(im,s,x,y,size,colour=CREAM if light else INK,title=False)
def line(im,a,b,color=CREAM,width=2):cv2.line(im,tuple(map(int,a)),tuple(map(int,b)),color,width,cv2.LINE_AA)
def arrow(im,a,b,color=CREAM):cv2.arrowedLine(im,tuple(map(int,a)),tuple(map(int,b)),color,2,cv2.LINE_AA,tipLength=.11)
def orca(im,x,y,length=100,colour=CREAM,flip=False):
 # Smooth scientific pictogram, only for explanatory diagrams, never a substitute for scene animals.
 s=length/100;shape=np.array([[-50,0],[-45,-8],[-28,-12],[-5,-12],[1,-30],[8,-12],[28,-7],[44,-2],[50,-12],[47,0],[50,12],[42,4],[15,10],[-23,13],[-46,7]])*s
 if flip:shape[:,0]*=-1
 shape+=np.array([x,y]);cv2.fillPoly(im,[shape.astype(np.int32)],colour,cv2.LINE_AA)
 eyex=x+(-32 if not flip else 32)*s;cv2.ellipse(im,(int(eyex),int(y-3*s)),(max(2,int(5*s)),max(1,int(2*s))),0,0,360,INK,-1,cv2.LINE_AA)

def sound(im,t,fish=False):
 cx,cy=1500,265
 for j in range(4):
  r=35+((t*55+j*40)%165);cv2.ellipse(im,(cx-180,cy),(int(r),int(r*.63)),0,-65,65,CREAM,2,cv2.LINE_AA)
 # An actual sound source/receiver relationship, not decorative waveform wallpaper.
 orca(im,cx-230,cy,100,flip=True)
 cv2.ellipse(im,(cx+170,cy),(58,19),0,0,360,MUTED,-1,cv2.LINE_AA)
 cv2.fillPoly(im,[np.int32([[cx+220,cy],[cx+250,cy-25],[cx+250,cy+25]])],MUTED,cv2.LINE_AA)
 text(im,'Different prey. Different hearing.' if fish else 'Sound can reveal the hunter.',1230,385,25)

def learning(im,t):
 orca(im,1320,270,155);orca(im,1640,285,90)
 arrow(im,(1405,280),(1575,290),GOLD)
 text(im,'EXPERIENCE',1250,170,28);text(im,'OBSERVATION',1570,170,28)
 # Alternate demonstration / matching turn, with an explicit relationship between individuals.
 angle=t*.7
 for x in [1320,1640]:cv2.ellipse(im,(x,325),(45,18),0,int(angle*35)%180,170+int(angle*35)%180,GOLD,2,cv2.LINE_AA)

def seasons(im,t,duration):
 x0,x1,y=620,1710,340;line(im,(x0,y),(x1,y),MUTED,4)
 labels=['Departure','Months away','Following season']
 for x,s in zip([x0,(x0+x1)//2,x1],labels):cv2.circle(im,(int(x),y),8,CREAM,-1,cv2.LINE_AA);text(im,s,x-95,y+38,27)
 p=min(1,t/max(.1,duration));cv2.circle(im,(int(x0+(x1-x0)*p),y),15,GOLD,-1,cv2.LINE_AA)
 orca(im,430,340,160)

def tide(im,t):
 xs=np.linspace(1270,1780,100);ys=300-65*np.cos(np.linspace(-math.pi,math.pi,100));cv2.polylines(im,[np.int32(np.c_[xs,ys])],False,CREAM,3,cv2.LINE_AA)
 a=(t%8.85)/8.85;j=min(99,round(a*99));cv2.circle(im,(int(xs[j]),int(ys[j])),8,GOLD,-1,cv2.LINE_AA)
 text(im,'Illustrative high-tide window',1250,150,29);text(im,'Low',1240,390,24);text(im,'High',1480,215,24);text(im,'Low',1740,390,24)

def tooth(im):
 shape=np.int32([[1500,180],[1455,230],[1460,320],[1485,390],[1510,420],[1530,365],[1555,305],[1540,235]])
 cv2.fillPoly(im,[shape],CREAM,cv2.LINE_AA);cv2.polylines(im,[shape],True,MUTED,3,cv2.LINE_AA)
 line(im,(1465,260),(1545,260),INK,3);line(im,(1495,285),(1500,390),MUTED,3)
 text(im,'TOOTH WEAR',1395,110,31);text(im,'Repeated rope contact',1320,450,27)

def pod_record(im,t):
 text(im,'RETURNING POD',1260,145,29)
 for j in range(30):orca(im,1260+j%6*90,235+j//6*55,65,CREAM if j<7 else (104,137,137))
 text(im,'7 returned from about 30',1210,550,29)

def liver(im):
 # Oil-rich organ / energy relationship; not an invented quantitative mass chart.
 for j,r in enumerate([29,41,29]):
  x=1390+j*112;y=280;pts=np.int32([[x,y-r*1.7],[x-r,y],[x-r*.5,y+r],[x+r*.5,y+r],[x+r,y]])
  cv2.fillPoly(im,[pts],(89,150,191),cv2.LINE_AA)
 text(im,'Oil-rich energy store',1350,380,30,False)

def clinical(im):
 # Abstract non-graphic suturing motif; no invented wound location or injury photograph.
 cv2.ellipse(im,(1480,615),(205,105),-12,0,360,(164,194,207),-1,cv2.LINE_AA)
 line(im,(1320,640),(1640,590),(106,129,144),3)
 for j in range(9):x=1340+j*34;y=637-j*5;line(im,(x-10,y-22),(x+10,y+22),INK,3)
 text(im,'Nonfatal encounter',1300,790,36,False)

@lru_cache(maxsize=1)
def land():return json.loads((P/'geometry/world_land.geojson').read_text())
def locator(im,lon,lat):
 ox,oy,w,h=120,745,560,240
 for feat in land()['features']:
  g=feat['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
  for poly in polys:
   ring=np.array(poly[0]);pts=np.c_[ox+(ring[:,0]+180)/360*w,oy+(90-ring[:,1])/180*h]
   cv2.fillPoly(im,[np.int32(pts)],(184,199,186),cv2.LINE_AA)
 pin=(int(ox+(lon+180)/360*w),int(oy+(90-lat)/180*h));cv2.circle(im,pin,7,(83,124,177),-1,cv2.LINE_AA)
 text(im,'Geographic context',ox,oy-43,28,False)

SOUND={'biggs_silence','tagged_alaska','listening_dark','fish_hearing','mammal_hearing'}
LEARNING={'matriarch','learning_observation','learned_strategy','patagonia_learning','teamwork_final'}
LOCATORS={'farallon_evidence':(-123,37.7),'twofold_arrival':(149.9,-37),'iberian_region':(-5.6,36)}

def augment(s,im,t):
 k=s['key'];local=t-s['start']
 if k in SOUND:sound(im,local,k=='fish_hearing')
 elif k in LEARNING:learning(im,local)
 elif k=='season_absence':seasons(im,local,s['duration'])
 elif k=='tide_window':tide(im,local)
 elif k=='worn_teeth':tooth(im)
 elif k=='partnership_decline':pod_record(im,local)
 elif k=='shark_liver':liver(im)
 elif k=='surfer_incident' and local>9:clinical(im)
 elif k in LOCATORS:locator(im,*LOCATORS[k])
 elif k=='wildlife_distance':
  arrow(im,(700,600),(1030,600));text(im,'Keep distance; follow local rules.',720,535,26)
 elif k=='speed_tracking':
  text(im,'At 50 km/h: about 14 metres each second',1050,235,30);line(im,(1180,330),(1710,330),CREAM,3)
  cv2.circle(im,(int(1180+530*((local*.45)%1)),330),9,GOLD,-1,cv2.LINE_AA)
 elif k=='taxonomy':
  text(im,'DELPHINIDAE',1280,230,38,False);line(im,(1440,305),(1440,405),INK,3)
  for x,name in [(1210,'Orcas'),(1650,'Other dolphins')]:line(im,(1440,405),(x,490),INK,3);text(im,name,x-60,525,29,False)
 elif k=='old_tom_end':
  # Archival timeline balances the historical end frame, rather than an empty sea panel.
  for x,year in [(1150,'1840'),(1440,'1901'),(1730,'1930')]:cv2.circle(im,(x,330),8,CREAM,-1,cv2.LINE_AA);text(im,year,x-37,370,28)
  line(im,(1150,330),(1730,330),MUTED,3);text(im,'The Twofold Bay partnership',1160,220,31)
 return im
