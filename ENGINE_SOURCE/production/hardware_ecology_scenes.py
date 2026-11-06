"""New subject-authored scenes 9–27 and the user-requested natural ending.
No generic fallback, no generated imagery, no reserved next-video frame.
"""
from pathlib import Path
from functools import lru_cache
import json,math,io,re
import av,cv2,cairosvg,numpy as np
from compositor import *
from opening_scenes import ease
P=Path(__file__).resolve().parents[1]
WORDS=json.loads((P/'timing/word_timeline_ending_revised.json').read_text())
PLAN=json.loads((P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text())
SOURCE=P/'media/REAL_001 - NZ Wild Orcas - Fair Projects - CC BY 3.0 - FULL SOURCE.webm'

def word(needle,lo,hi,default):
 return next((w['start'] for w in WORDS if lo<=w['start']<=hi and w['text'].lower().strip('.,:;!?\"')==needle),default)

class WildFootage:
 def __init__(self):self.c=None;self.last=-10;self.current=None
 def image(self,t):
  if self.c is None:
   if not SOURCE.exists():raise FileNotFoundError('Restore verified full CC BY source from Drive 1_2FJYW8re7QK_hnzAWXkvHeus2C9Wasa before re-rendering footage.')
   self.c=av.open(str(SOURCE));self.stream=self.c.streams.video[0];self.stream.thread_count=1
  if t<self.last or t-self.last>1 or self.current is None:
   self.c.seek(int(t/float(self.stream.time_base)),stream=self.stream);self.gen=self.c.decode(self.stream);self.current=next(self.gen)
  while float(self.current.time)<t:
   try:self.current=next(self.gen)
   except StopIteration:break
  self.last=t;return self.current.to_ndarray(format='bgr24')
STOCK=WildFootage()

def real(t,credit=True):
 im=STOCK.image(t)
 if credit:type_text(im,'Wild orcas - New Zealand | Fair Projects / Steve Hathaway | CC BY 3.0',74,1010,23)
 return im

def natural_ending(global_t):
 start=math.ceil(next(s['start'] for s in PLAN if s['key']=='opinion_release')*24)/24;end=PLAN[-1]['end'];elapsed=global_t-start
 # One continuous observational source passage across both semantic units, with no pictorial cut/reset.
 im=real(26.5+elapsed,credit=elapsed<5)
 fade=1-ease((global_t-(end-.90))/.90)
 return np.uint8(im*fade)

def paper():
 y=np.linspace(0,1,H,dtype=np.float32)[:,None,None];im=np.ones((H,W,3),np.float32)*[229,235,235];im-=y*[8,6,5];return np.uint8(im)
INK=(31,57,68)

def taxonomy(t,global_t):
 im=paper();dolphin_at=word('dolphin',75,86,83.6)
 if global_t<dolphin_at:type_text(im,'KILLER OF WHALES',90,80,76,colour=INK,title=True)
 else:type_text(im,'THE DOLPHIN FAMILY',90,80,76,colour=INK,title=True)
 animal(im,'orca',1100,470,115,t=t,roll=8*math.sin(t*.25),elevation=12)
 if global_t>=dolphin_at:
  animal(im,'bottlenose_dolphin',1050,855,115,t=t,elevation=12);type_text(im,'DELPHINIDAE',95,790,35,colour=INK,title=True)
 return im

def dimensions(t):
 im=underwater(t);animal(im,'orca_male',970,665,145,t=t,elevation=6)
 type_text(im,'9.5 m',95,86,112,title=True);type_text(im,'A LARGE MALE',100,220,33)
 # An actual length annotation, used here only; physical model length is fixed, not stretched.
 a,b=970-9.5*145/2,970+9.5*145/2;y=975
 cv2.line(im,(round(a),y),(round(b),y),(185,204,198),2,cv2.LINE_AA)
 for x in [a,b]:cv2.line(im,(round(x),y-16),(round(x),y+16),(185,204,198),2,cv2.LINE_AA)
 return im

@lru_cache(maxsize=4)
def car(colour):
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="500" height="220" viewBox="0 0 500 220"><defs><linearGradient id="p" x2="0" y2="1"><stop stop-color="{colour}"/><stop offset="1" stop-color="#69818a"/></linearGradient></defs><ellipse cx="250" cy="204" rx="211" ry="8" fill="#788e91" opacity=".16"/><path d="M27 111 Q53 95 111 92 L155 34 Q163 24 187 24 L314 24 Q329 25 342 41 L389 94 Q446 97 471 117 L477 167 L22 167Z" fill="url(#p)" stroke="#29444f" stroke-width="4"/><path d="M161 42 L145 87 L232 87 L232 40Z M247 40 L312 40 Q325 42 332 53 L357 88 L247 88Z" fill="#3b5f70" stroke="#29444f" stroke-width="3"/><path d="M160 48 L222 48 M254 48 L308 48" stroke="#b6c8ca" stroke-width="4" opacity=".6"/><path d="M38 111 L462 120 M240 97 L240 162 M356 98 L377 159" fill="none" stroke="#425f68" stroke-width="2"/><path d="M209 108 L224 108 M334 108 L347 108" stroke="#d4ddda" stroke-width="4"/><path d="M29 129 L60 129 L58 145 L27 146Z" fill="#e4c584"/><path d="M445 127 L473 127 L474 145 L450 145Z" fill="#b76c54"/><path d="M21 166 L478 166" stroke="#b2c0bd" stroke-width="8"/>'''
 for x in [116,384]:
  svg+=f'<circle cx="{x}" cy="171" r="37" fill="#243740"/><circle cx="{x}" cy="171" r="23" fill="#bcc6c1"/><circle cx="{x}" cy="171" r="7" fill="#4e6670"/>'
  for a in np.linspace(0,2*np.pi,6,endpoint=False):svg+=f'<path d="M{x+9*math.cos(a):.2f} {171+9*math.sin(a):.2f} L{x+20*math.cos(a):.2f} {171+20*math.sin(a):.2f}" stroke="#526f78" stroke-width="3"/>'
 svg+='</svg>';return cv2.imdecode(np.frombuffer(cairosvg.svg2png(bytestring=svg.encode(),output_width=450,output_height=198),np.uint8),cv2.IMREAD_UNCHANGED)

def mass(t):
 im=paper();type_text(im,'MORE THAN SIX TONNES',90,72,72,colour=INK,title=True);animal(im,'orca_male',970,445,90,t=t,elevation=4)
 for j,c in enumerate(['#90b5bb','#d3c8ab','#9fada2','#b18b79']):over(im,car(c),60+j*450,710)
 type_text(im,'Roughly four family cars',960,966,37,colour=INK,align='center');return im

def dentition(t):
 im=underwater(t);jaw=5+19*ease(t/1.8);animal(im,'orca',1750,620,340,t=t,jaw=jaw,elevation=8)
 type_text(im,'40-56',95,85,112,title=True);type_text(im,'CURVED TEETH',100,220,36);type_text(im,'ABOUT 10 cm EACH',100,325,30)
 # Caption is placed left of the head, not over the teeth.
 return im

def speed(t):
 im=underwater(t);rng=np.random.default_rng(901)
 for x,y,z in rng.uniform([0,250,0],[W,H,1],(72,3)):
  x=(x+t*2300)%W;v=(.2+.6*z);cv2.line(im,(round(x),round(y)),(round(x+23*v),round(y)),(round(80+25*z),round(79+24*z),round(45+16*z)),max(1,round(z*2)),cv2.LINE_AA)
 animal(im,'orca',650,655,190,t=t*1.55,elevation=4)
 type_text(im,'BURSTS OVER 50 km/h',95,86,60,title=True);return im

def software(t):
 im=np.full((H,W,3),(52,40,21),np.uint8)
 if t<1.6:
  type_text(im,"THE HARDWARE ISN'T THE PROBLEM.",W/2,430,67,title=True,align='center')
 else:
  type_text(im,'THE SOFTWARE',W/2,405,136,title=True,align='center');type_text(im,'IS.',W/2,580,46,align='center')
 return im

@lru_cache(maxsize=1)
def pacific_plate():
 im=np.full((H,W,3),(80,59,28),np.uint8)
 def xy(lon,lat):return ((lon-110)/140*(W-180)+90,(73-lat)/61*(H-290)+195)
 for lon in [150,180,210,240]:
  a,b=xy(lon,12),xy(lon,73);cv2.line(im,tuple(map(round,a)),tuple(map(round,b)),(93,74,44),1,cv2.LINE_AA)
 for lat in [30,60]:
  a,b=xy(110,lat),xy(250,lat);cv2.line(im,tuple(map(round,a)),tuple(map(round,b)),(93,74,44),1,cv2.LINE_AA)
 data=json.loads((P/'geometry/world_land.geojson').read_text())
 for feature in data['features']:
  g=feature['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
  for poly in polys:
   for shift in [-360,0,360]:
    ring=np.asarray(poly[0]);lon=ring[:,0]+shift;lat=ring[:,1]
    if lon.max()<110 or lon.min()>250 or lat.max()<12 or lat.min()>73:continue
    pts=np.stack([(lon-110)/140*(W-180)+90,(73-lat)/61*(H-290)+195],axis=1).astype(np.int32)
    cv2.fillPoly(im,[pts],(178,195,198),cv2.LINE_AA);cv2.polylines(im,[pts],True,(128,159,169),1,cv2.LINE_AA)
 type_text(im,'NORTH PACIFIC',90,65,73,title=True)
 for txt,lon,lat in [('JAPAN',139,36),('ALASKA',216,65),('NORTH AMERICA',234,42)]:
  x,y=xy(lon,lat);type_text(im,txt,x,y,25,colour=(232,235,220),title=True,align='center')
 type_text(im,'Coastline: Natural Earth | regional context, not measured population boundaries',90,1032,21)
 return im

def pacific(t):
 im=pacific_plate().copy()
 if t>5:type_text(im,'SIMILAR ANIMALS. DIFFERENT LIVES.',950,675,47,title=True,align='center')
 return im

def kelp(t):
 im=underwater(t,'kelp')
 # Complete fronds rooted at the seabed, not disconnected decorative strokes.
 for j,base in enumerate([40,150,270,1790,1870]):
  height=[710,840,590,690,870][j];colour=(53+j*2,92+j*3,55+j*2);nodes=[]
  for v in np.linspace(0,1,60):nodes.append([base+29*v*math.sin(t*.5+v*3+j),H+30-v*height])
  cv2.polylines(im,[np.int32(nodes)],False,colour,5,cv2.LINE_AA)
  for v in np.linspace(.18,.95,11):
   x=base+29*v*math.sin(t*.5+v*3+j);y=H+30-v*height;side=1 if int(v*20)%2 else -1;xx=x+side*(45+18*math.sin(v*12+t*.5));yy=y-24
   poly=np.int32([[x,y],[x+side*19,y-30],[xx,yy-62],[xx+side*9,yy-5],[x+side*19,y+5]]);cv2.fillPoly(im,[poly],colour,cv2.LINE_AA)
 return im

def residents(t):
 im=kelp(t);animal(im,'orca_female',1320-t*8,520,95,t=t,elevation=19,yaw=6)
 for i in range(5):animal(im,'salmon',390+i*153-t*35,655+(i%2)*83,140,t=t+i*.2,elevation=17,yaw=-7)
 type_text(im,'RESIDENTS',92,83,60,title=True);type_text(im,'Salmon specialists',96,162,29);return im

def biggs(t):
 im=underwater(t);im=np.uint8(im*.57)
 animal(im,'orca',1400,650,98,t=t*.55,yaw=118,elevation=14,opacity=.92);animal(im,'orca_female',995,490,82,t=t*.55+.3,yaw=112,elevation=14,opacity=.64)
 type_text(im,"BIGG'S",92,85,64,title=True)
 if t>4.5:type_text(im,'QUIET.',98,172,40,title=True)
 return im

def research_tag(t):
 im=underwater(t);ppm=182;cx,cy=1100,670;animal(im,'orca',cx,cy,ppm,t=t,elevation=6)
 m=rig.model('orca');u=.30;point=np.array([[u*7.5,-.006*7.5,float(m.cz(u)+m.rz(u))*7.5+.025]])
 point=rig.articulate(point,'orca',t*4);point[:,0]-=3.75;point=point@rig.rotation(elevation=6).T;x=round(cx+point[0,0]*ppm);y=round(cy-point[0,2]*ppm)
 for dx in [-11,11]:cv2.ellipse(im,(x+dx,y+5),(7,3),0,0,360,(158,171,169),-1,cv2.LINE_AA)
 cv2.rectangle(im,(x-20,y-8),(x+20,y+2),(87,109,117),-1,cv2.LINE_AA);cv2.line(im,(x+12,y-6),(x+14,y-25),(131,157,154),2,cv2.LINE_AA)
 type_text(im,'ALASKA',95,85,60,title=True);type_text(im,'Research tag - illustrated reconstruction',99,167,29);return im

def listening(t):
 im=underwater(t);im=np.uint8(im*.38)
 animal(im,'orca',1480-t*9,530,69,t=t*.45,yaw=82,elevation=10,opacity=.27);animal(im,'harbor_porpoise',490,800,250,t=t*.7,flip=True,elevation=10,opacity=.87)
 return im

def fish_hearing(t):
 im=kelp(t);animal(im,'orca_female',1410,470,67,t=t,elevation=10,opacity=.42)
 animal(im,'salmon',710-t*11,695,720,t=t,elevation=8,flip=True)
 type_text(im,'A DIFFERENT LISTENER',93,84,49,title=True);return im

def mammal_hearing(t):
 im=underwater(t);im=np.uint8(im*.65);animal(im,'orca',1430,470,58,t=t*.6,elevation=9,opacity=.35)
 animal(im,'harbor_porpoise',590,750,290,t=t*.8,elevation=10,flip=True)
 type_text(im,'A DIFFERENT PLAYBOOK',94,85,49,title=True);return im

def matriarch(t):
 im=kelp(t);d=t*24
 # Leader is a correctly smaller-dorsalled adult female, not a stretched male.
 animal(im,'orca_male',1470-d,405,82,t=t,elevation=15,opacity=.73);animal(im,'orca_juvenile',1140-d,790,82,t=t+.5,elevation=15)
 animal(im,'orca_female',670-d,570,82,t=t,elevation=15)
 type_text(im,'EXPERIENCE LEADS.',92,78,61,title=True);return im

def learning(t):
 im=kelp(t);a=round(38*ease((t-.4)/2)/3)*3;b=round(38*ease((t-1.3)/2)/3)*3
 animal(im,'orca_female',740-t*21,540,106,t=t,yaw=a,elevation=27)
 animal(im,'orca_juvenile',1260-t*21,770,106,t=t+.4,yaw=b,elevation=27)
 for i in range(3):animal(im,'salmon',270+i*125-t*15,390+i*50,124,t=t+i*.3,elevation=20)
 return im

def antarctic_establish(t):
 im=ocean(t,horizon=422);poly=np.int32([[0,435],[120,260],[240,367],[460,160],[660,356],[870,305],[1010,435]])
 cv2.fillPoly(im,[poly],(203,215,210),cv2.LINE_AA);cv2.fillPoly(im,[np.int32([[120,260],[178,342],[240,367],[460,160],[490,268],[660,356],[870,305],[1010,435],[0,435]])],(177,198,199),cv2.LINE_AA)
 from investigation_scenes import world
 import physical_scene as ph
 world(im,[ph.whale('orca_female',t*3,position=(1-t*.12,0,-.4),yaw=18),ph.whale('orca_juvenile',t*3+.5,position=(-3-t*.12,5,-.45),yaw=18)],ppm=155,centre=(1110,790),elevation=17,wet=True)
 type_text(im,'ANTARCTICA',W-92,78,58,title=True,align='right');return im

FUNCTIONS={'taxonomy':lambda t,g:taxonomy(t,g),'male_dimensions':lambda t,g:dimensions(t),'mass_comparison':lambda t,g:mass(t),'dentition':lambda t,g:dentition(t),'speed_tracking':lambda t,g:speed(t),'hardware_software':lambda t,g:software(t),'pacific_ecotypes':lambda t,g:pacific(t),'resident_salmon':lambda t,g:residents(t),'biggs_silence':lambda t,g:biggs(t),'tagged_alaska':lambda t,g:research_tag(t),'listening_dark':lambda t,g:listening(t),'fish_hearing':lambda t,g:fish_hearing(t),'mammal_hearing':lambda t,g:mammal_hearing(t),'matriarch':lambda t,g:matriarch(t),'learning_observation':lambda t,g:learning(t),'knowledge_bridge':lambda t,g:antarctic_establish(t)}
IMPLEMENTED=set(FUNCTIONS)|{'wild_human','decision_gaze','scarcity_habitat','opinion_release','natural_outro'}
def frame(s,t):
 key=s['key'];local=t-s['start']
 if key=='wild_human':return real(6.5+local)
 if key=='decision_gaze':return real(16.71+local)
 if key=='scarcity_habitat':return real(61+local)
 if key in {'opinion_release','natural_outro'}:return natural_ending(t)
 if key not in FUNCTIONS:raise NotImplementedError('Not authored: '+key)
 return FUNCTIONS[key](local,t)

if __name__=='__main__':
 q=P/'qa/hardware_ecology';q.mkdir(exist_ok=True)
 for s in PLAN:
  if s['key'] not in IMPLEMENTED:continue
  t=s['start']+s['duration']*.5;cv2.imwrite(str(q/(s['key']+'.jpg')),frame(s,t));print('Private composition',s['key'],flush=True)
