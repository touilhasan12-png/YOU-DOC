"""Detailed new period/modern crew and craft. Physical source ppm and attachment coordinates
are explicit; do not scale the whole sprite bounding box as the hull length (oars extend beyond it).
Articulated arms use two-bone inverse kinematics and detailed hand/finger silhouettes.
"""
from pathlib import Path
import math,json
import numpy as np
import cairosvg
P=Path(__file__).resolve().parents[1];OUT=P/'assets/vessels';OUT.mkdir(exist_ok=True,parents=True)

def path(d,fill='none',stroke='#294351',sw=1.2,extra=''):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round" {extra}/>'
def pt(p):return f'{p[0]:.3f} {p[1]:.3f}'
DEFS='''<defs>
<linearGradient id="timber" x2=".2" y2="1"><stop stop-color="#d4b580"/><stop offset=".48" stop-color="#aa8357"/><stop offset="1" stop-color="#6c5142"/></linearGradient>
<linearGradient id="innerwood" x2="0" y2="1"><stop stop-color="#75634f"/><stop offset="1" stop-color="#403e37"/></linearGradient>
<linearGradient id="rib" x2=".1" y2="1"><stop stop-color="#d4d7cd"/><stop offset=".5" stop-color="#8d9c99"/><stop offset="1" stop-color="#4b676e"/></linearGradient>
<linearGradient id="hull" x2="0" y2="1"><stop stop-color="#ecb074"/><stop offset="1" stop-color="#b26743"/></linearGradient>
<linearGradient id="metal" x2=".2" y2="1"><stop stop-color="#d9e2d8"/><stop offset=".47" stop-color="#6b858b"/><stop offset=".65" stop-color="#dae0d5"/><stop offset="1" stop-color="#46646e"/></linearGradient>
<linearGradient id="window" x2="1" y2="1"><stop stop-color="#9dbebf" stop-opacity=".62"/><stop offset="1" stop-color="#264958" stop-opacity=".8"/></linearGradient>
<linearGradient id="navy" x2=".6" y2="1"><stop stop-color="#48697c"/><stop offset="1" stop-color="#193846"/></linearGradient>
<linearGradient id="cream" x2=".2" y2="1"><stop stop-color="#f2eddb"/><stop offset=".7" stop-color="#d5d8c9"/><stop offset="1" stop-color="#849da0"/></linearGradient>
</defs>'''

def ik(shoulder,wrist,upper=36,lower=32,bend=1):
 a=np.asarray(shoulder,float);b=np.asarray(wrist,float);d=b-a;r=np.linalg.norm(d);assert r<upper+lower-.01,(shoulder,wrist,r)
 e=d/max(1e-9,r);q=(upper**2-lower**2+r*r)/(2*max(1e-9,r));h=math.sqrt(max(0,upper**2-q*q));return a+e*q+np.array([-e[1],e[0]])*h*bend

def limb(a,b,w0,w1,fill,stroke='#30434b'):
 a=np.asarray(a);b=np.asarray(b);v=b-a;v=v/max(1e-8,np.linalg.norm(v));n=np.array([-v[1],v[0]]);p=a+n*w0;q=b+n*w1;r=b-n*w1;s=a-n*w0
 return path(f'M{pt(p)} Q{pt((p+q)*.5+n*1.2)} {pt(q)} Q{pt(b+v*w1*.5)} {pt(r)} Q{pt((r+s)*.5-n*.8)} {pt(s)} Q{pt(a-v*w0*.3)} {pt(p)} Z',fill,stroke,.9)

def hand(wrist,angle,skin):
 # Fingered grip with a distinct opposing thumb. The wrist is the actual arm endpoint.
 d='M-4 -4 C-2 -7 1 -8 4 -7 L11 -5 Q15 -4 14 -1 L12 1 Q15 2 13 5 L9 8 Q5 10 1 8 L-4 4 Z'
 s='<g transform="translate('+pt(wrist)+') rotate('+str(angle)+')">'+path(d,skin,'#775d4c',.65)
 s+=path('M4 -5 L10 -2 M3 -1 L10 2 M2 3 L8 5 M-2 -3 Q4 -5 5 -1','none','#9a7659',.55)+'</g>';return s

def person(x,y,ppm=160,kind='period',identity=0,phase=0,left_hand=None,right_hand=None,lean=0,look=0,facing=1):
 # Local top=-122, feet~98: 220 units = 1.75m. Rendering in a boat intentionally hides the legs behind the hull.
 scale=ppm*1.75/220;ang=math.radians(lean);c,s=math.cos(ang),math.sin(ang)
 def world(q):q=np.asarray(q);return np.array([x,y])+np.array([q[0]*c-q[1]*s,q[0]*s+q[1]*c])*scale
 def local(q):q=(np.asarray(q)-[x,y])/scale;return np.array([q[0]*c+q[1]*s,-q[0]*s+q[1]*c])
 default_L=world([-30,-14]);default_R=world([31,-11]);LH=local(left_hand if left_hand is not None else default_L);RH=local(right_hand if right_hand is not None else default_R)
 palettes=[('#d6ae87','#3a4b50','#697568'),('#b98563','#3d3531','#8c7457'),('#e0bf95','#65574a','#8c9991'),('#cfa17a','#293b43','#677f8b'),('#94694f','#252e32','#8b8c73'),('#d6b18f','#55483a','#557184'),('#b98a67','#242f37','#7e8e87'),('#e2bd98','#51433b','#6a7c91')]
 skin,hair,coat=palettes[identity%len(palettes)];pid=f'p{identity}_{round(x)}_{round(y)}';modern=kind!='period';vest='#c7794c' if kind=='passenger' else '#667e8b' if kind=='rescue' else '#86745c'
 defs=f'<defs><linearGradient id="{pid}skin" x2="1" y2=".6"><stop stop-color="{skin}"/><stop offset="1" stop-color="#9c7458"/></linearGradient></defs>'
 g=defs+f'<g transform="translate({x:.3f} {y:.3f}) rotate({lean:.3f}) scale({scale:.6f})">'
 # Far arm behind body.
 arms=[];attachments={}
 for side,wrist in [(-1,LH),(1,RH)]:
  shoulder=np.array([side*21.,-64.]);elbow=ik(shoulder,wrist,bend=-side)
  arm=limb(shoulder,elbow,9,7,coat)+limb(elbow,wrist,7,4.7,coat)
  cuff=elbow*.10+wrist*.90;arm+=limb(cuff,wrist,5.5,4.5,'#c6bda5')+hand(wrist,math.degrees(math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])),skin)
  arm+=path(f'M{pt(shoulder+[side*2,8])} Q{pt(elbow)} {pt(elbow+(wrist-elbow)*.20)}','none','#b4b8a3',.7,extra='opacity=".5"');arms.append('<g data-limb="'+('left-arm' if side==-1 else 'right-arm')+'">'+arm+'</g>')
  attachments['left_elbow' if side==-1 else 'right_elbow']=world(elbow).tolist()
  attachments['left_hand' if side==-1 else 'right_hand']=world(wrist).tolist()
 # Far arm is composited with the near arm after torso, avoiding accidental whole-arm occlusion.
 # Legs are properly clothed volume, not lines; mostly occluded by gunwale in vessel views.
 g+=path('M-16 -4 Q-22 19 -15 38 L14 46 34 85 47 82 31 30 7 11 17 -3 Z','#45535a','#293e47',1.1)
 g+=path('M7 8 Q31 22 38 39 L28 76 42 83 61 36 Q52 16 24 -3 Z','#52616a','#2b4048',1)
 g+=path('M32 80 L48 77 60 88 Q60 93 43 94 L30 90 Z M27 76 L41 78 43 86 Q33 91 20 87 L15 83 Z','#313c40','#263840',1)
 g+=path('M-20 -63 Q-13 -74 -4 -73 L12 -72 Q25 -68 28 -51 L25 -7 Q8 1 -18 -4 L-25 -35 Z',coat,'#30434c',1.2)
 g+=path('M-8 -71 L-7 -82 6 -82 10 -70 2 -60 Z',f'url(#{pid}skin)','#7a5e4b',.8)
 g+=path('M-10 -72 L1 -64 -8 -53 -18 -65 M8 -72 L2 -64 14 -55 22 -65', '#a8ad9a','#50615d',.8)
 # Period waistcoat has seams and buttons, not modern flotation straps.
 if not modern:
  g+=path('M-12 -64 L-4 -58 -3 -8 -17 -12 -20 -39 Z M8 -62 L18 -59 23 -13 6 -7 0 -51 Z',vest,'#4f5147',.8)
  g+=path('M-13 -34 L-5 -32 M8 -32 L18 -34','none','#d3b993',.9)
  for yy in [-47,-35,-23,-12]:g+=f'<circle cx="1.5" cy="{yy}" r="1.2" fill="#bda98b"/>'
 else:
  g+=path('M-13 -65 L-5 -58 -6 -8 -18 -12 -20 -43 Z M9 -64 L20 -60 25 -13 7 -7 1 -53 Z',vest,'#4b5150',.9)
  g+=path('M-14 -51 L-13 -27 M11 -50 L17 -28','none','#e4bc79' if kind=='passenger' else '#bfd1cc',2.2)
  g+=path('M-18 -22 L23 -21','none','#2a414d',3);g+='<rect x="-2" y="-24" width="7" height="5" rx="1" fill="#c1c9bb" stroke="#344b55" stroke-width=".8"/>'
 g+=path('M-16 -19 Q-8 -14 -5 -16 M12 -15 L19 -17 M-17 -49 L-14 -39','none','#c4c8b2',.7,extra='opacity=".55"')
 # Readable profile: shaped skull, nose, chin, ear, brow, eye and hairline.
 g+=f'<g transform="translate(0 -83) rotate({look:.2f}) scale({facing} 1)">'
 g+=path('M-15 -27 Q-16 -40 -3 -43 Q10 -44 14 -32 L14 -22 19 -15 Q20 -12 14 -12 Q15 -3 9 0 L-3 -2 Q-10 -5 -12 -15 Z',f'url(#{pid}skin)','#6b594b',.9)
 g+=path('M-15 -22 Q-21 -36 -10 -42 Q3 -49 13 -37 L13 -30 Q5 -28 1 -36 L-9 -30 -8 -16 Z',hair,'#354247',.9)
 g+=path('M-9 -19 Q-16 -24 -17 -16 Q-16 -8 -10 -9 M-12 -17 L-10 -14',skin,'#9e7558',.7)
 g+=path('M4 -28 L10 -28 M5 -23 L9 -23','none','#35434a',.85)
 g+=path('M14 -10 L8 -10 M5 -4 L10 -5','none','#956a51',.65)
 if identity%3==1:g+=path('M-5 -7 Q1 0 10 -4 L10 -1 Q2 6 -6 0 L-9 -10 Z',hair,extra='opacity=".85"')
 if identity%3!=0:
  g+=path('M-18 -31 Q-18 -47 -3 -49 Q12 -50 17 -36 L4 -32 Z','#52636a' if modern else '#736b58','#34474d',.9)
  g+=path('M4 -36 Q19 -40 29 -33 Q19 -29 6 -31 Z','#617881' if modern else '#8b8066','#34474d',.7)
  g+=path('M-11 -40 Q-1 -46 9 -41','none','#a1afa6',.65)
 g+='</g>'+arms[0]+arms[1]+'</g>'
 return g,{'identity':identity,'source_ppm':ppm,'scale':scale,**attachments,'head_top':world([0,-126]).tolist()}

def svg_document(content,width=1800,height=1000):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{DEFS}{content}</svg>'

def whaleboat(phase=0):
 # Hull: source endpoints 225..1525 => 1300px / 8m = 162.5 source ppm.
 ppm=162.5;parts=[];crew=[];attachments=[]
 back=path('M225 535 C430 468 1230 455 1525 510 C1488 570 1372 601 1093 621 L451 615 Q291 598 225 535 Z','url(#innerwood)','#354750',3)
 back+=path('M235 531 C498 488 1210 478 1517 511','none','#dbc291',7)
 for x in [520,840,1160]:back+=path(f'M{x-75} 525 L{x+105} 520 {x+96} 544 {x-65} 549 Z','#b2956c','#645a48',2)
 oars='';outside_oars=''
 for i,x in enumerate([490,810,1120]):
  angle=math.radians(39+11*math.sin(phase));pivot=np.array([x+103.,584.]);direction=np.array([math.cos(angle),math.sin(angle)]);grip=pivot-direction*125;blade=pivot+direction*430
  # The shaft is behind fingers, not drawn through them at the end.
  oars+=path(f'M{pt(grip-direction*10)} L{pt(pivot)}','none','#bba37b',7);outside_oars+=path(f'M{pt(pivot)} L{pt(blade)}','none','#bba37b',7)
  normal=np.array([-direction[1],direction[0]]);p=blade-direction*69;q=blade+direction*37
  outside_oars+=path(f'M{pt(p-normal*12)} Q{pt(blade-normal*22)} {pt(q-normal*17)} Q{pt(q+direction*7)} {pt(q+normal*17)} Q{pt(blade+normal*22)} {pt(p+normal*12)} Z','#a98a60','#665948',1.5)
  g,meta=person(x,534,ppm,'period',i,phase,left_hand=grip,right_hand=grip+direction*15,lean=4*math.sin(phase),look=3*math.sin(phase*.6));crew.append(g);attachments.append(meta)
  back+=f'<ellipse cx="{pivot[0]:.2f}" cy="{pivot[1]:.2f}" rx="9" ry="13" fill="#5b6256" stroke="#c0b68e" stroke-width="3"/>'
 front=path('M225 535 C520 614 1229 609 1525 510 C1492 612 1397 680 1255 707 C958 754 536 747 346 683 C289 655 251 602 225 535 Z','url(#timber)','#3c4b4b',3)
 front+=path('M236 546 C583 625 1218 618 1515 523','none','#e7d3a4',6)
 for j in range(1,6):
  y=553+j*24;front+=path(f'M{253+j*11} {y} C{600-j*6} {y+80-j*5} {1210+j*8} {y+62-j*8} {1502-j*25} {531+j*29}','none','#715b46',1.6)
 for x in [376,604,840,1070,1290,1420]:front+=path(f'M{x} {626-abs(x-850)*.045:.1f} L{x+4} {710-abs(x-850)*.07:.1f}','none','#7b664e',1.1)
 front+=path('M347 685 Q804 789 1254 709','none','#c0a477',2)
 return svg_document(back+oars+''.join(crew)+front+outside_oars),{'hull_length_metres':8.,'source_ppm':ppm,'world_origin_px':[875,688],'hull_x_bounds':[225,1525],'tow_bollard_px':[1491,541],'people':attachments,'oar_hands_exact':True,'kind':'period whaleboat, not a modern rescue boat'}

def rescue(phase=0):
 ppm=1390/8.2;back=path('M190 547 Q586 458 1347 484 L1580 432 Q1584 502 1517 565 Q936 688 267 644 Z','url(#rib)','#3d5863',3)
 back+=path('M212 556 Q654 489 1340 515 L1547 464','none','#e0e2d6',11)
 crew=[];people=[]
 # Five evacuees + three identifiable crew. No arbitrary historic rowing silhouettes.
 for i,x in enumerate([410,555,700,845,990]):
  y=556-(x-410)*.033;handL=np.array([x-31,y-16]);handR=np.array([x+31,y-17])
  if i==1:handL=np.array([x-8,y-94])
  if i==3:handR=np.array([x+39,y-38])
  g,meta=person(x,y,ppm,'passenger',i+2,phase,left_hand=handL,right_hand=handR,lean=[-3,2,-1,3,-2][i]+.7*math.sin(phase+i),look=[4,-5,1,-3,5][i],facing=-1 if i in [0,2,4] else 1);crew.append(g);meta['role']='evacuee';people.append(meta)
 console=path('M1163 548 L1164 389 1308 378 1353 530 Z','url(#cream)','#365463',2.5)
 console+=path('M1164 390 L1148 291 1282 273 1309 378 Z','url(#window)','#7f999c',3)
 console+=path('M1151 293 L1283 276 M1168 303 L1183 373','none','#d8e2d8',2)
 console+=path('M1173 421 L1251 412 1256 461 1174 470 Z','#294858','#172f3e',1.5)
 console+=path('M1182 429 L1229 422','none','#83b0b7',2)
 console+='<ellipse cx="1206" cy="498" rx="19" ry="24" fill="none" stroke="#a7b6ae" stroke-width="5"/>'
 for i,(x,y) in enumerate([(1162,530),(1357,481),(1458,459)]):
  LH=[1188,496] if i==0 else [x-25,y-21];RH=[1224,496] if i==0 else [x+28,y-24]
  g,meta=person(x,y,ppm,'rescue',i+5,phase,left_hand=LH,right_hand=RH,lean=0,look=-4);crew.append(g);meta['role']='crew';people.append(meta)
 front=path('M193 570 Q680 629 1327 552 L1576 443 Q1563 538 1486 605 Q848 747 284 678 Z','url(#hull)','#3e5660',3)
 front+=path('M212 561 Q713 613 1327 539 L1558 448 Q1551 498 1519 530 L1342 598 Q656 714 255 645 Z','url(#rib)','#48626a',2.4)
 front+=path('M239 585 Q727 641 1343 568 L1537 492','none','#d0d7cd',3)
 front+=path('M239 629 Q791 698 1439 585','none','#536e76',2)
 for x,y in [(325,635),(612,654),(902,637),(1196,604),(1437,541)]:front+=path(f'M{x-17} {y-11} q17 -16 34 -4 l-1 8 q-17 -10 -33 4 Z','#4b6269','#354f59',1.2)
 # Outboards and fixed rail: both attached to transom, never floating in water.
 front+=path('M164 562 L230 566 225 664 203 725 169 720 184 648 Z','#405560','#263e4b',2.2)
 front+=path('M159 532 Q193 520 224 539 L231 578 164 575 Z','url(#navy)','#29424f',2)
 front+=path('M201 715 L248 724 243 735 194 727 Z','#283f4c','#243d49',1)
 front+=path('M1337 540 L1341 393 1517 349 1519 478 M1342 429 L1518 385','none','#afc1bd',4)
 front+=path('M1473 499 Q1499 480 1515 489 Q1510 504 1490 516 Z','#577078','#294653',2)
 return svg_document(back+''.join(crew)+console+front),{'hull_length_metres':8.2,'source_ppm':ppm,'world_origin_px':[885,678],'hull_x_bounds':[190,1580],'tow_bollard_px':[1497,498],'people':people,'evacuees':5,'rescue_crew':3,'kind':'modern rigid inflatable rescue boat'}

def export(name,fn,phase=0):
 svg,meta=fn(phase);(OUT/(name+'.svg')).write_text(svg);cairosvg.svg2png(bytestring=svg.encode(),write_to=str(OUT/(name+'.png')));(OUT/(name+'.json')).write_text(json.dumps(meta,indent=2));return meta
if __name__=='__main__':
 export('period_whaleboat',whaleboat);export('modern_rescue_rib',rescue);print('New detailed crew/craft candidates built; physical source scales and grip coordinates recorded.')
