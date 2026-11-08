"""User screenshot corrections. Detailed cockpit/free-diver and shared mechanical geometry.
Only invoked by the GitHub renderer. Does not modify narration or the accepted opening.
"""
import math
import numpy as np,cv2
from compositor import ocean,underwater,over,rope
from scene_text import type_text
import human_history_scenes as h
import people_boats as people
import physical_scene as ph
import illustrated_rig as rig
import revision_geometry as g
INK=(31,57,68)
KEYS={'diver_entanglement','rudder_detaches','hypothesis_play','hypothesis_imitation','boat_option','helm_response','human_not_target','interaction_counts','open_water_pov','plans_final','ice_option','power_option','worn_teeth'}

def cockpit(t,disabled=True):
 im=ocean(t,horizon=390);svg=people.path('M0 780 Q580 650 1920 735 L1920 1080 0 1080Z','url(#cream)','#385765',4)
 svg+=people.path('M150 910 L470 810 955 850 955 1040 150 1040Z','url(#innerwood)','#385765',4)
 svg+=people.path('M130 900 L470 780 970 820 970 865 470 832 130 945Z','url(#timber)','#53696d',3)
 svg+=people.path('M1080 1015 L1110 748 1260 736 1320 1015Z','url(#cream)','#3b5963',4)
 svg+=people.path('M1158 740 L1164 681 1208 681 1235 751Z','url(#metal)','#3b5963',3)
 # Mounted compass/engine controls and a visible fixed base give a readable helm station.
 svg+='<ellipse cx="1180" cy="770" rx="34" ry="13" fill="#233c49" stroke="#90aaa7" stroke-width="4"/>'
 svg+=people.path('M1175 768 L1187 768 M1181 762 L1181 774','none','#e0d1a4',2)
 a=.19*math.sin(t*1.6);c,s=math.cos(a),math.sin(a);lh=[1200-65*c,685-65*s];rh=[1200+65*c,685+65*s]
 person,_=people.person(1230,845,315,'passenger',3,t,left_hand=lh,right_hand=rh,lean=.8*math.sin(t),look=-6)
 # Person behind pedestal; hands above the rim. Two arms are drawn in the shared character rig.
 svg=people.path('M0 620 L1920 600 1920 665 0 700Z','url(#cream)','#58717b',3)+person+svg
 svg+='<circle cx="1200" cy="685" r="65" fill="none" stroke="#8c795a" stroke-width="10"/>'
 for aa in [a,a+2.094,a+4.189]:svg+=people.path(f'M1200 685 L{1200+61*math.cos(aa):.2f} {685+61*math.sin(aa):.2f}','none','#9e8c69',6)
 svg+='<circle cx="1200" cy="685" r="11" fill="#b3b9a7" stroke="#566d73" stroke-width="3"/>'
 over(im,h.svgimage(people.svg_document(svg,1920,1080)),0,0)
 return h.title(im,'NO STEERING RESPONSE' if disabled else 'PEOPLE ARE NOT THE TARGET','Mounted wheel and pedestal | broken rudder below' if disabled else 'Vessel interactions are not evidence of hunting people')

def freediver(t):
 im=underwater(t);ppm=145;centre=(700,790);whale=ph.whale('orca',t*3,position=(0,0,-.55),flip=True)
 h.world(im,[whale],ppm=ppm,centre=centre,elevation=18,wet=False)
 m=rig.model('orca');near=whale[0][m.part==2].mean(axis=0);p=near@rig.rotation(elevation=18).T;anchor=np.array([centre[0]+p[0]*ppm,centre[1]-p[2]*ppm])
 # Free diver, NOT scuba: no tank/regulator. Separate long fins, mask/snorkel and weight belt.
 kick=12*math.sin(t*5);a=people.path('M-82 -20 Q-98 -49 -61 -54 Q-37 -53 -31 -32 L-29 -15 -16 -8 -31 0 Q-61 13 -79 -8Z','#cfaa87','#374d55',2)
 a+=people.path('M-86 -25 Q-97 -54 -63 -58 Q-42 -57 -35 -41 L-49 -37 -74 -40Z','#223d48','#182f3d',2)
 a+=people.path('M-84 -33 L-36 -35 -29 -13 -77 -10Z','#5b8e98','#b6d1c8',2.5)
 a+=people.path('M-61 -31 L-58 -15 M-48 -31 L-44 -17','none','#b0d5d0',1.2)
 a+=people.path('M-72 -42 L-81 -83 -65 -93','none','#98a899',5)
 a+=people.path('M-36 -22 Q4 -35 61 -14 L68 28 Q12 42 -29 9Z','url(#navy)','#18333f',2.5)
 # Bent upper/lower arms and visibly separate hands/fingers.
 for d in ['M-23 -13 Q-67 -8 -98 31 L-68 47 Q-32 22 -1 12Z','M4 -20 Q17 -55 62 -51 L73 -35 Q41 -27 37 -5Z']:a+=people.path(d,'#365866','#18333f',2)
 a+=people.path('M-98 31 L-111 44 -104 56 -88 55 -68 47Z','#d0a781','#795f4e',1.5)
 a+=people.path('M62 -51 L88 -48 94 -38 74 -32 73 -35Z','#d0a781','#795f4e',1.5)
 for yy in [39,44,49]:a+=people.path(f'M-103 {yy} L-90 {yy+2}','none','#8b6c54',1)
 a+=people.path('M39 -25 L50 30','none','#bc9c70',7)
 for yy in [-13,2,16]:a+=people.path(f'M38 {yy} L54 {yy-2}','none','#344750',6)
 for j,off in enumerate([-1,1]):
  yy=off*15+kick*off;a+=people.path(f'M57 {off*15} Q111 {yy} 142 {yy+off*7} L173 {yy+off*13} 169 {yy+off*26} 133 {yy+off*25} Q95 {yy+off*20} 56 {off*15+off*14}Z','#2b4b59','#193641',2)
  a+=people.path(f'M166 {yy+off*10} L232 {yy+off*10} 245 {yy+off*33} 170 {yy+off*27}Z','#487a86','#1c3d4b',2)
 x,y=1350,470+95*g.ease(t/6);scale=.87
 sprite=h.svgimage(f'<svg xmlns="http://www.w3.org/2000/svg" width="430" height="250" viewBox="-140 -120 450 260">{people.DEFS}<g transform="rotate(-12)">{a}</g></svg>')
 sprite=cv2.resize(sprite,None,fx=scale,fy=scale);over(im,sprite,x-140*scale,y-120*scale)
 waist=(x+44*scale,y-9*scale);rope(im,waist,anchor,1-g.ease((t-6)/1.3),colour=(171,193,184),thickness=4)
 # Line visibly loops around the pectoral base, rather than ending on an arbitrary pixel.
 if t<7:cv2.ellipse(im,tuple(anchor.astype(int)),(14,7),-30,0,360,(171,193,184),3,cv2.LINE_AA)
 h.title(im,'NEW ZEALAND','Free-diving entanglement account | illustrated reconstruction')
 return im

def interaction_counts(t):
 im=h.paper();type_text(im,'AROUND 700',95,95,130,colour=INK,title=True);type_text(im,'REPORTED INTERACTIONS',100,260,52,colour=INK,title=True)
 # Countable visual key, not invented incident tracks: 70 symbols, ~10 reports each.
 for row in range(7):
  for col in range(10):
   x=925+col*85;y=170+row*72;colr=(138,166,152) if row*10+col<int(70*g.ease(t/1.6)) else (207,215,206)
   cv2.fillPoly(im,[np.int32([[x,y],[x+56,y],[x+43,y+17],[x+13,y+17]])],colr,cv2.LINE_AA);cv2.line(im,(x+27,y),(x+27,y-29),colr,2);cv2.fillPoly(im,[np.int32([[x+29,y-29],[x+49,y-3],[x+29,y-3]])],colr,cv2.LINE_AA)
 type_text(im,'Each symbol represents about 10 reports.',925,720,28,colour=INK)
 type_text(im,'ONE ESTIMATE: ABOUT 1 IN 5 DISABLED',100,530,49,colour=INK,title=True)
 for j in range(5):
  x=115+j*142;y=735;colour=(91,110,177) if j==0 else (137,166,151)
  cv2.fillPoly(im,[np.int32([[x,y],[x+112,y],[x+90,y+32],[x+22,y+32]])],colour,cv2.LINE_AA);cv2.line(im,(x+55,y),(x+55,y-65),colour,3);cv2.fillPoly(im,[np.int32([[x+57,y-60],[x+100,y-5],[x+57,y-5]])],colour,cv2.LINE_AA)
  if j==0:cv2.line(im,(x+8,y+55),(x+102,y+55),colour,4)
 type_text(im,'Counts in the narrated period - not a live total',100,965,29,colour=INK);return im

def frame(key,t):
 if key=='diver_entanglement':return freediver(t)
 if key in {'helm_response','human_not_target'}:return cockpit(t,key=='helm_response')
 if key=='interaction_counts':return interaction_counts(t)
 if key=='ice_option':
  ice=ph.slab(.85,position=(2.6,0,0));whale=ph.whale('orca',t*3,position=(-4.4,-2.4,-.6),flip=True)
  assert not g.overlap(ice,whale)
  return h.title(h.world(underwater(t),[ice,whale],ppm=135,centre=(1120,600),elevation=25,wet=False),'AN ICE FLOE?','The seal sequence showed why this is not an escape plan.')
 if key=='power_option':
  return h.title(h.world(underwater(t),[ph.whale('orca',t*2,jaw=10+9*g.ease(t/2),position=(0,0,-.2),flip=True)],ppm=190,centre=(970,660),elevation=10,wet=False),'40-56 CURVED TEETH','More than six tonnes in a large male')
 if key=='worn_teeth':
  m=rig.model('orca');v=rig.articulate(m.v,'orca',t,m.part,17).copy();teeth=(m.part==9)&(m.v[:,0]<.10*m.s['L']);faces=m.f[~np.all(teeth[m.f],axis=1)];v[:,0]-=3.75
  return h.title(h.world(underwater(t),[(ph.pose(v,(0,0,-.2),flip=True),faces,m.col)],ppm=190,centre=(920,680),wet=False),'WORN TEETH','Historical account: tow-rope wear')

 if key=='rudder_detaches':
  return h.title(h.world(underwater(t),g.attack_actors(t),ppm=118,centre=(1550,470),elevation=14,wet=False),'THE RUDDER','Attached stock, bearings and blade | mechanical reconstruction')
 if key in {'hypothesis_play','hypothesis_imitation'}:
  imitation=key=='hypothesis_imitation';obj,_=g.play_actors(t,imitation)
  return h.title(h.world(underwater(t),obj,ppm=118,centre=(1470,490),elevation=30 if imitation else 16,wet=False),'IMITATION?' if imitation else 'PLAY OR SOCIALIZING?','Proposed explanations - not proven motives')
 if key=='boat_option':
  obj=[g.hull_mesh(),g.rudder(4,True),ph.whale('orca_juvenile',t*3,position=(-7.8-t*.45,2,-1.1),flip=True)]
  return h.title(h.world(underwater(t),obj,ppm=117,centre=(1420,490),elevation=20,wet=False),'AFTER THE RUDDER BREAKS','The boat loses steering; the animals may leave')
 if key in {'open_water_pov','plans_final','ice_option','power_option','worn_teeth'}:
  obj=[ph.whale('orca',t*3,position=(0,0,-.5),yaw=60),ph.whale('orca_female',t*2.5,position=(-2,7,-.6),yaw=45)]
  im=h.world(ocean(t,horizon=300),obj,ppm=185 if key=='open_water_pov' else 205,centre=(1080,690),elevation=13,wet=True)
  if key=='plans_final':type_text(im,'SOMETHING THAT PLANS',960,90,83,title=True,align='center')
  return im
 raise KeyError(key)
