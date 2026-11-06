"""Distinct Antarctic wave-washing and Patagonian intentional-stranding scenes.
Metres, gravity, solid ice freeboard, complete 3-D body rolls and articulated pinniped limbs.
These scenes are internal drafts until actually rendered and reviewed.
"""
from pathlib import Path
import math,json
import numpy as np,cv2
from compositor import ocean,underwater,over,type_text,W,H
from opening_scenes import ease
import illustrated_rig as rig
import pinniped_rig as pins
import physical_scene as phys
from pinniped_rig import Mesh
P=Path(__file__).resolve().parents[1]

def scene(base,meshes,ppm=130,centre=(960,680),elev=18,water=None,level=0):
 rgba,depth=phys.shade(meshes,ppm,centre,elev,water_level=level);over(base,rgba,0,0)
 if water is not None:
  wa,wd=phys.shade([water],ppm,centre,elev,wet=False);phys.water_over(base,wa,wd,depth,ppm,centre,elev,.40)
 return base

def pin(kind,phase=0,action='rest',position=(0,0,0),roll=0,pitch=0,yaw=0):
 v,f,c=pins.mesh(kind,phase,action);return phys.pose(v,position,roll,pitch,yaw),f,c

def ice_background(t):
 im=ocean(t,horizon=322);im[:,:,2]=np.uint8(im[:,:,2]*.90)
 cv2.fillPoly(im,[np.int32([[0,323],[105,247],[200,290],[420,185],[570,291],[740,259],[920,323]])],(233,226,212),cv2.LINE_AA)
 cv2.fillPoly(im,[np.int32([[420,185],[448,264],[570,291],[740,259],[920,323],[0,323],[105,247],[147,291],[200,290]])],(208,190,170),cv2.LINE_AA)
 return im

def seal_floe(t):
 base=ice_background(t);heave=.025*math.sin(t*.9);pitch=1.1*math.sin(t*.7);ice=phys.slab(position=(0,0,heave),pitch=pitch)
 seal=pin('weddell',phase=t*.7,position=(0,0,.525+heave),pitch=pitch)
 return scene(base,[ice,seal],ppm=190,centre=(960,740),elev=10,water=phys.wave_mesh(t,amplitude=.045,velocity=.4,arrival=0))

def formation(t):
 base=ice_background(t);objects=[]
 # Oblique rank: seven recognizable complete animals, not seven head-on egg silhouettes.
 for j in range(7):
  rank=j-3;name='orca' if j%2==0 else 'orca_female'
  objects.append(phys.whale(name,phase=t*5+j*.37,position=(rank*4.8*.866,rank*4.8*-.5,-.49),yaw=60,flip=True))
 return scene(base,objects,ppm=55,centre=(960,700),elev=30)

def floe_wave(t):
 import revision_geometry as g
 ice,seal,whales=g.wave_actors(t)
 return scene(ice_background(t),whales+[ice,seal],ppm=92,centre=(1160,640),elev=30,water=phys.wave_mesh(t,arrival=1.36))

def bubbles(t,origin=(-1.2,-.2,-.40)):
 m=Mesh();rng=np.random.default_rng(990)
 for j in range(38):
  birth=rng.random()*1.3;age=(t-birth)%1.3;x=origin[0]+rng.uniform(-.16,.16)+age*.04;y=origin[1]+rng.uniform(-.13,.13);z=origin[2]+age*.38
  if z<.015:m.sphere([x,y,z],[rng.uniform(.009,.021)]*3,[190,218,213],6,8)
 return m.arrays()

def denial(t):
 import revision_geometry as g
 ice,seal,blocker=g.denial_actors(t)
 return scene(ice_background(t),[ice,blocker,seal,bubbles(t,origin=(.5,-2.8,-.5))],ppm=126,centre=(1100,640),elev=30,water=phys.wave_mesh(t,.12,velocity=.7,arrival=2))

def capture(t):
 import revision_geometry as g
 ice,seal,predator=g.capture_actors(t)
 return scene(ice_background(t),[ice,seal,predator],ppm=122,centre=(805,550),elev=20)

def coast_background(t):
 im=ocean(t,horizon=305);cv2.fillPoly(im,[np.int32([[1070,304],[1170,266],[1390,245],[1510,268],[1650,218],[1770,245],[1920,220],[1920,370]])],(122,145,153),cv2.LINE_AA);return im

def pup(t):
 base=coast_background(t);puppy=pin('sea_lion_pup',phase=t*3.5,action='rest',position=(3.7,0,.59))
 # Close prey-level camera; no miniature shark/whale substitutes for a recognisable otariid pup.
 objects=[phys.sand_mesh(),puppy]
 if t>5.3:objects.append(phys.whale('orca',phase=t*3,position=(-5.4,1.1,-.48),flip=True))
 im=scene(base,objects,ppm=430 if t<5.3 else 155,centre=(-631,790) if t<5.3 else (880,730),elev=15,water=phys.wave_mesh(t,.18,velocity=.35,arrival=2,beach=True))
 type_text(im,'ARGENTINA',94,76,57,title=True);return im

def shore_action(global_t):
 g=global_t-234.28;roll=90*ease(g/2.2);x=-6+5.93*ease((g-1.5)/4.88);back=ease((g-8.4)/5.4);x=x*(1-back)+(-5.8)*back
 floor=.2*(x-1.5);onland=ease((x+4)/3.0);z=max(-.45,floor+.72);pitch=-math.degrees(math.atan(.2))*onland;gape=(5+22*ease((g-5.6)/.7))*(1-.48*ease((g-7)/1.2))
 whale=phys.whale('orca',phase=g*6,jaw=gape,position=(x,0,z),roll=roll,pitch=pitch,flip=True)
 grab=ease((g-6.1)/.55);pupRoll=-76*grab;neckLocal=np.array([[-.32,0,.35]])
 # Neck target follows the actual rotated predator muzzle. The prey remains a complete articulated body.
 raw=np.array([[(.5-.04)*7.5,0,0.]])
 target=phys.pose(raw,position=(x,0,z),roll=roll,pitch=pitch)[0];pinOrigin=target-phys.pose(neckLocal,roll=pupRoll)[0]
 start=np.array([3.7,0,.59]);position=start*(1-grab)+pinOrigin*grab;puppy=pin('sea_lion_pup',phase=g*6,action='struggle',position=position,roll=pupRoll)
 if g>9.2:wave=phys.wave_mesh(g,.64,velocity=2.,arrival=10.5,beach=True)
 else:wave=phys.wave_mesh(g,.65,velocity=2.,arrival=4.63,beach=True)
 return scene(coast_background(g),[phys.sand_mesh(),whale,puppy],ppm=130,centre=(960,720),elev=18,water=wave)

def learning(t):
 base=coast_background(t);mother=phys.whale('orca_female',phase=t*4,position=(-1.8,1.5,-.45),yaw=22,flip=True)
 young=phys.whale('orca_juvenile',phase=t*4+.4,position=(-5.4,-1,-.28),yaw=22,flip=True)
 im=scene(base,[phys.sand_mesh(),mother,young],ppm=150,centre=(1100,730),elev=15,water=phys.wave_mesh(t,.13,velocity=.4,arrival=0,beach=True));type_text(im,'WATCHING. THEN TRYING.',95,77,53,title=True);return im

def tide(t):
 level=-.25+.70*(.5-.5*math.cos(t/8.85*math.pi*2));base=coast_background(t);rock=Mesh();rock.sphere([4.5,1.7,.73],[.55,.50,.55],[114,122,118])
 objects=[phys.sand_mesh(),rock.arrays(),pin('sea_lion_pup',phase=t*3,position=(6.8,0,1.21)),phys.whale('orca',phase=t*3,position=(-3.3,-.7,level-.47),flip=True,roll=90)]
 im=scene(base,objects,ppm=135,centre=(620,750),elev=20,water=phys.wave_mesh(t,.12,velocity=.5,arrival=0,beach=True,level=level),level=level)
 type_text(im,'AROUND HIGH TIDE',94,78,60,title=True);type_text(im,'A couple of hours either side - time-compressed illustration',98,155,27);return im

def risk(t):
 base=coast_background(t);base=np.uint8(base*.82);x=-.5+.9*ease(t/2.7)-.6*ease((t-6.0)/3.0);z=.2*(x-1.5)+.72
 whale=phys.whale('orca',phase=t*7,position=(x,0,z),roll=88,pitch=-11.3,flip=True)
 im=scene(base,[phys.sand_mesh(),whale,pin('sea_lion_pup',t*3,position=(6.2,0,1.09))],ppm=132,centre=(880,740),elev=18,water=phys.wave_mesh(t,1.1,velocity=2,arrival=1.7,beach=True,storm=True))
 type_text(im,'THE HUNTER CAN BE STRANDED, TOO.',92,78,52,title=True);return im

FUNCTIONS={'seal_floe':lambda s,t:seal_floe(t-s['start']),'seven_formation':lambda s,t:formation(t-s['start']),'floe_wave':lambda s,t:floe_wave(t-s['start']),'floe_denial':lambda s,t:denial(t-s['start']),'seal_capture':lambda s,t:capture(t-s['start']),'patagonia_pup':lambda s,t:pup(t-s['start']),'patagonia_roll':lambda s,t:shore_action(t),'patagonia_strand':lambda s,t:shore_action(t),'patagonia_grab':lambda s,t:shore_action(t),'patagonia_learning':lambda s,t:learning(t-s['start']),'tide_window':lambda s,t:tide(t-s['start']),'stranding_risk':lambda s,t:risk(t-s['start'])}
IMPLEMENTED=set(FUNCTIONS)
def frame(s,t):
 if s['key'] not in FUNCTIONS:raise NotImplementedError(s['key'])
 return FUNCTIONS[s['key']](s,t)

if __name__=='__main__':
 plan=json.loads((P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text());q=P/'qa/ice_coast';q.mkdir(exist_ok=True)
 for s in plan:
  if s['key'] in IMPLEMENTED:
   for f in [.15,.70]:
    t=s['start']+s['duration']*f;im=frame(s,t);cv2.imwrite(str(q/(s['key']+f'_{f}.jpg')),im)
   print('Private anatomical/contact scene candidates',s['key'],flush=True)
