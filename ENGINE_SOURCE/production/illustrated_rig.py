"""New smooth, dimensioned illustration rig. Continuous body/fin geometry, Gouraud lighting,
soft pigmentation, depth-buffered eyes and curved/thickened fins. Not the rejected flat-face prototype.
Images are original programmatic drawing, not generative imagery or stock-photo cutouts.
"""
from pathlib import Path
from functools import lru_cache
import math
import numpy as np
import cv2
from scipy.interpolate import PchipInterpolator
from numba import njit

SPECS={
 'orca':dict(L=7.5,ry=[.001,.031,.061,.080,.089,.088,.073,.055,.035,.020,.010,.002],rz=[.002,.044,.073,.091,.099,.095,.081,.062,.041,.023,.012,.002],cz=[0,.008,.014,.017,.017,.012,.005,0,-.003,-.003,0,0],dx=.46,dh=.132,px=.26,span=.155,fluke=.165),
 'orca_male':dict(L=9.5,ry=[.001,.033,.064,.085,.096,.093,.077,.059,.038,.021,.011,.002],rz=[.002,.046,.076,.096,.105,.103,.087,.065,.043,.024,.012,.002],cz=[0,.008,.014,.017,.017,.012,.005,0,-.003,-.003,0,0],dx=.46,dh=.175,px=.26,span=.17,fluke=.17),
 'blue_whale':dict(L=16.,ry=[.001,.037,.064,.079,.079,.074,.063,.049,.034,.023,.014,.002],rz=[.001,.013,.027,.044,.059,.064,.060,.050,.036,.024,.014,.002],cz=[.012,.016,.018,.016,.010,0,-.006,-.007,-.005,-.002,0,0],dx=.765,dh=.022,px=.285,span=.125,fluke=.15),
 'great_white':dict(L=4.8,ry=[.001,.012,.031,.055,.078,.084,.068,.045,.027,.014,.006,.002],rz=[.001,.014,.037,.062,.083,.092,.077,.052,.032,.016,.007,.002],cz=[0,0,.001,.005,.007,.008,.007,.004,.002,0,0,0],dx=.38,dh=.135,px=.285,span=.14,fluke=.155),
 'hammerhead':dict(L=4.,ry=[.001,.020,.030,.035,.047,.052,.044,.031,.019,.010,.005,.001],rz=[.001,.009,.015,.026,.041,.048,.044,.032,.020,.012,.006,.001],cz=[0,0,0,.001,.003,.005,.004,.002,0,0,0,0],dx=.36,dh=.165,px=.26,span=.14,fluke=.18),
 'bronze_whaler':dict(L=3.,ry=[.001,.008,.021,.034,.049,.054,.045,.032,.020,.011,.005,.001],rz=[.001,.010,.022,.035,.050,.055,.047,.034,.022,.012,.006,.001],cz=[0,0,.001,.003,.006,.006,.004,.002,0,0,0,0],dx=.39,dh=.115,px=.28,span=.14,fluke=.16),
 'pilot_whale':dict(L=5.5,ry=[.001,.035,.062,.075,.076,.071,.057,.043,.029,.017,.009,.001],rz=[.002,.050,.074,.082,.081,.077,.062,.046,.033,.021,.011,.001],cz=[.020,.027,.025,.020,.011,.004,0,-.003,-.003,-.002,0,0],dx=.34,dh=.08,px=.25,span=.17,fluke=.16)
}
SPECS['orca_female']={**SPECS['orca'],'L':6.2,'dh':.108,'span':.125}
SPECS['orca_juvenile']={**SPECS['orca'],'L':3.3,'dh':.105,'span':.135}
SPECS['bottlenose_dolphin']=dict(L=3.2,ry=[.0008,.012,.018,.052,.075,.080,.071,.053,.035,.024,.013,.002],rz=[.0008,.010,.012,.047,.070,.074,.068,.053,.036,.024,.013,.002],cz=[.003,.004,.006,.018,.018,.010,0,-.005,-.006,-.002,0,0],dx=.56,dh=.10,px=.24,span=.125,fluke=.15)
SPECS['harbor_porpoise']=dict(L=1.6,ry=[.001,.037,.062,.084,.102,.109,.090,.064,.039,.023,.012,.002],rz=[.001,.041,.063,.081,.098,.103,.086,.063,.041,.025,.013,.002],cz=[.008,.016,.020,.018,.010,.004,0,-.005,-.006,-.002,0,0],dx=.51,dh=.10,px=.26,span=.095,fluke=.15)
SPECS['salmon']=dict(L=.75,ry=[.001,.015,.031,.050,.062,.066,.062,.050,.032,.017,.008,.002],rz=[.001,.027,.058,.088,.120,.131,.120,.095,.062,.032,.016,.003],cz=[0,0,.001,.004,.006,.005,.003,0,-.003,-.003,0,0],dx=.43,dh=.115,px=.25,span=.105,fluke=.17)
ST=np.array([0,.025,.07,.14,.24,.36,.49,.62,.75,.86,.94,1.])
FISH={'great_white','hammerhead','bronze_whaler','salmon'}

def rotation(roll=0,yaw=0,elevation=0):
 a,b,c=np.radians([roll,yaw,elevation]);ca,sa=np.cos(a),np.sin(a);cb,sb=np.cos(b),np.sin(b);cc,sc=np.cos(c),np.sin(c)
 return np.array([[1,0,0],[0,cc,-sc],[0,sc,cc]])@np.array([[cb,-sb,0],[sb,cb,0],[0,0,1]])@np.array([[1,0,0],[0,ca,-sa],[0,sa,ca]])

def catmull(points,n=10):
 p=np.asarray(points,float);out=[]
 for i in range(len(p)):
  a,b,c,d=p[(i-1)%len(p)],p[i],p[(i+1)%len(p)],p[(i+2)%len(p)]
  for t in np.linspace(0,1,n,endpoint=False):out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
 return np.asarray(out)

def blend(a,b,w):return a*(1-w[:,None])+np.asarray(b)[None,:]*w[:,None]
def softstep(v,a,b):
 t=np.clip((v-a)/(b-a),0,1);return t*t*(3-2*t)

def pigmentation(name,t,theta):
 z=np.sin(theta);side=np.abs(np.cos(theta));n=len(t)
 if name.startswith('orca'):
  c=np.tile([28.,48.,61.],(n,1));belly=1-softstep(z,-.61,-.49+.045*np.cos(t*12))
  # Distinct lateral extension, not a uniform white stripe.
  flank=(1-softstep(((t-.65)/.145)**2+((z+.39)/.25)**2,.88,1.10))*softstep(t,.48,.53)
  c=blend(c,[225,235,227],np.maximum(belly,flank))
  e=((t-.158)/.051)**2+((z-.39)/.235)**2;eye=(1-softstep(e,.94,1.06))*softstep(side,.73,.85)
  c=blend(c,[230,237,228],eye)
  saddle=(1-softstep(((t-.535)/.066)**2+((z-.78)/.34)**2,.84,1.08))*softstep(t,.484,.504)*softstep(z,.43,.55);c=blend(c,[113,139,148],saddle)
 elif name in {'bottlenose_dolphin','harbor_porpoise'}:
  c=np.tile([95.,123.,135.],(n,1));c=blend(c,[197,211,209],1-softstep(z,-.45,-.16));c=blend(c,[79,106,122],softstep(z,.15,.7))
 elif name=='salmon':
  c=np.tile([133.,167.,171.],(n,1));c=blend(c,[211,224,213],1-softstep(z,-.30,-.1));c=blend(c,[64,107,117],softstep(z,.1,.65));spots=(np.sin(t*350+theta*12)*np.cos(t*220-theta*40)>.85)*(z>.2)*softstep(t,.18,.28);c-=spots[:,None]*26
 elif name=='blue_whale':
  c=np.tile([116.,154.,175.],(n,1));c+=np.maximum(0,-z[:,None])*[43,36,25]
  mott=np.sin(t*89+theta*7)*np.cos(t*47-theta*13)+.36*np.cos(t*143+theta*29)
  c+=mott[:,None]*5.5
  # Actual ventral pleating follows body-space circumference and cannot float off during roll.
  pleat=(.5+.5*np.cos(theta*64+t*.8))**11;region=softstep(t,.055,.10)*(1-softstep(t,.48,.56))*(1-softstep(z,-.16,-.02));c-=pleat[:,None]*region[:,None]*12
 elif name in FISH:
  rgb={'great_white':[116.,137.,145.],'hammerhead':[132.,144.,139.],'bronze_whaler':[155.,140.,113.]}[name];c=np.tile(rgb,(n,1));c=blend(c,[228,233,221],1-softstep(z,-.29,-.14+.035*np.sin(t*31)))
 else:
  c=np.tile([54.,69.,78.],(n,1));c=blend(c,[138,153,154],(1-softstep(z,-.80,-.65))*(1-softstep(t,.45,.55)))
 return np.clip(c,0,255)

class Model:
 def __init__(self,name):
  self.name=name;self.s=SPECS[name];self.v=[];self.f=[];self.col=[];self.detail=[];self.part=[];self._build()
 def add(self,v,f,col,part=0):
  off=len(self.v);self.v.extend(v);self.f.extend(np.asarray(f)+off);self.col.extend(col);self.part.extend([part]*len(v))
 def blade(self,outline,colour,normal,thickness=.003,part=1):
  q=catmull(outline,12)*self.s['L'];n=np.asarray(normal,float);n/=np.linalg.norm(n);centre=q.mean(axis=0);v=[];f=[];N=len(q);rings=6
  # Thickened curved surface on BOTH sides, rounded edge and smooth normals.
  for sign in [1,-1]:
   off=len(v)
   for r in range(rings):
    k=(r+.04)/(rings-1+.04);height=math.sqrt(max(0,1-k*k))*thickness*self.s['L']
    v.extend(centre[None,:]+(q-centre)*k+n*height*sign)
   for r in range(rings-1):
    for j in range(N):
     a=off+r*N+j;b=off+r*N+(j+1)%N;c=off+(r+1)*N+j;d=off+(r+1)*N+(j+1)%N
     f.extend([[a,b,c],[b,d,c]] if sign==1 else [[a,c,b],[b,c,d]])
  self.add(v,f,np.tile(colour,(len(v),1)),part)
 def ellipsoid(self,centre,axes,colour):
  v=[];f=[];nx,ny=13,20
  for a in np.linspace(.005,np.pi-.005,nx):
   for b in np.linspace(0,2*np.pi,ny,endpoint=False):v.append(np.asarray(centre)+np.asarray(axes)*[np.sin(a)*np.cos(b),np.sin(a)*np.sin(b),np.cos(a)])
  for i in range(nx-1):
   for j in range(ny):a=i*ny+j;b=i*ny+(j+1)%ny;c=(i+1)*ny+j;d=(i+1)*ny+(j+1)%ny;f.extend([[a,c,b],[b,c,d]])
  self.add(v,f,np.tile(colour,(len(v),1)),8)
 def _build(self):
  s=self.s;L=s['L'];ts=np.concatenate([np.linspace(0,.31,260,endpoint=False),np.linspace(.31,1,150)]);nx,nt=len(ts),176;t,theta=np.meshgrid(ts,np.linspace(0,2*np.pi,nt,endpoint=False),indexing='ij');t=t.ravel();theta=theta.ravel()
  self.ry=PchipInterpolator(ST,s['ry']);self.rz=PchipInterpolator(ST,s['rz']);self.cz=PchipInterpolator(ST,s['cz'])
  v=np.stack([t,np.cos(theta)*self.ry(t),self.cz(t)+np.sin(theta)*self.rz(t)],axis=1)*L;f=[]
  for i in range(nx-1):
   for j in range(nt):a=i*nt+j;b=i*nt+(j+1)%nt;c=(i+1)*nt+j;d=(i+1)*nt+(j+1)%nt;f.extend([[a,b,c],[b,d,c]])
  hinge=.31 if self.name=='blue_whale' else .238
  has_jaw=self.name.startswith('orca') or self.name=='blue_whale'
  jaw_mask=(t<hinge)&(np.sin(theta)<-.18) if has_jaw else np.zeros(len(t),bool)
  ff=np.asarray(f);cross=jaw_mask[ff].any(axis=1)&(~jaw_mask[ff]).any(axis=1)&(t[ff].mean(axis=1)<hinge-.004)
  self.add(v,ff[~cross],pigmentation(self.name,t,theta))
  for i in np.where(jaw_mask)[0]:self.part[i]=6
  if has_jaw:
   # Separate upper/lower oral surfaces: opening the lower jaw makes a real aperture, not a stretched mouth line.
   tv=np.linspace(.006,hinge,66);ry=self.ry(tv)*.978;zz=self.cz(tv)-self.rz(tv)*.18
   for lower in [False,True]:
    vv=np.stack([np.repeat(tv,2),np.column_stack([-ry,ry]).ravel(),np.repeat(zz+(.0004 if lower else -.0004),2)],axis=1)*L;ff=[]
    for j in range(len(tv)-1):a=2*j;ff.extend([[a,a+1,a+2],[a+1,a+3,a+2]])
    self.add(vv,ff,np.tile([77,64,66] if lower else [61,52,59],(len(vv),1)),6 if lower else 7)
   # Far oral lining closes the mouth volume; the ocean must not show through an open jaw.
   tv=np.linspace(.010,hinge-.002,65);ry=self.ry(tv)*.94;zz=self.cz(tv)-self.rz(tv)*.18;vv=[]
   for j in range(len(tv)):vv.extend([[tv[j]*L,ry[j]*L,zz[j]*L],[tv[j]*L,ry[j]*L,(zz[j]-.0002)*L]])
   ff=[]
   for j in range(len(tv)-1):a=j*2;ff.extend([[a,a+1,a+2],[a+1,a+3,a+2]])
   off=len(self.v);self.add(vv,ff,np.tile([71,54,60],(len(vv),1)),7)
   for j in range(len(tv)):self.part[off+j*2+1]=6
   # Anatomical lip rims bridge the sampling gap when closed; they articulate apart, never hide teeth/fin layers.
   tvs=np.linspace(.007,hinge-.003,100)
   lip_colour=[28,48,61] if self.name.startswith('orca') else [116,154,175]
   for side in [-1,1]:
    for lower in [False,True]:
     vv=[];ff=[]
     for tv in tvs:
      ry=float(self.ry(tv))*.987;rz=float(self.rz(tv));zz=float(self.cz(tv))-.18*rz
      lo,hi=(-.026,-.001) if lower else (.001,.026)
      vv.extend([[tv*L,side*ry*L,(zz+lo*rz)*L],[tv*L,side*ry*L,(zz+hi*rz)*L]])
     for j in range(len(tvs)-1):a=j*2;ff.extend([[a,a+1,a+2],[a+1,a+3,a+2]])
     self.add(vv,ff,np.tile(lip_colour,(len(vv),1)),6 if lower else 7)
   if self.name.startswith('orca'):
    # Thirteen curved teeth per side per jaw: 52 in all, within the canonical 40–56 range.
    for lower in [False,True]:
     for side in [-1,1]:
      for tv in np.linspace(.038,.215,13):
       root=np.array([tv,side*float(self.ry(tv))*.86,float(self.cz(tv)-self.rz(tv)*.18)])*L
       vv=[];ff=[];sgn=1 if lower else -1
       for j,h in enumerate(np.linspace(0,1,8)):
        radius=.0018*L*(1-h)**.72+.00002*L
        for an in np.linspace(0,2*np.pi,10,endpoint=False):vv.append(root+[h*h*.0028*L+np.cos(an)*radius,np.sin(an)*radius,sgn*h*.012*L])
       for j in range(7):
        for k in range(10):a=j*10+k;b=j*10+(k+1)%10;c=(j+1)*10+k;d=(j+1)*10+(k+1)%10;ff.extend([[a,b,c],[b,d,c]])
       self.add(vv,ff,np.tile([230,224,201],(len(vv),1)),6 if lower else 9)
   else:
    # Blue whales have upper-jaw keratin baleen, NOT teeth. Lower jaw carries the tongue.
    for side in [-1,1]:
     for tv in np.linspace(.035,.294,170):
      ry=float(self.ry(tv));zz=float(self.cz(tv)-self.rz(tv)*.18);length=.55*float(self.rz(tv))
      vv=np.array([[tv-.00045,side*ry*.88,zz],[tv+.00045,side*ry*.88,zz],[tv+.00035,side*ry*.60,zz-length],[tv-.00035,side*ry*.60,zz-length]])*L
      self.add(vv,[[0,1,2],[0,2,3]],np.tile([62,70,68],(4,1)),9)
    before=len(self.v);tc=.13;tz=float(self.cz(tc)-self.rz(tc)*.18)-.006
    self.ellipsoid([tc*L,0,tz*L],[.095*L,.037*L,.010*L],[142,114,121])
    for j in range(before,len(self.v)):self.part[j]=6
  fincol=[32,57,71] if self.name.startswith('orca') else [103,143,164] if self.name=='blue_whale' else [104,123,128] if self.name in FISH else [46,64,74]
  x=s['dx'];z=float(self.cz(x)+self.rz(x));h=s['dh']
  self.blade([[x-.050,0,z-.012],[x-.025,0,z+h*.57],[x+.012,0,z+h],[x+.026,0,z+h*.86],[x+.018,0,z+.029],[x+.066,0,z-.013]],fincol,[0,1,0],.0025,1)
  for sign in [-1,1]:
   x=s['px'];ry=float(self.ry(x));z=float(self.cz(x)-self.rz(x)*.57);span=s['span'];blue=self.name=='blue_whale';width=.028 if blue else .070
   self.blade([[x-.022,sign*ry*.72,z],[x-.006,sign*(ry+span*.52),z-.024],[x+.040,sign*(ry+span),z-.066],[x+.066,sign*(ry+span*.92),z-.075],[x+width,sign*(ry+span*.49),z-.045],[x+.055,sign*ry*.63,z-.020]],fincol,[0,0,1],.0024,2 if sign==-1 else 3)
  if self.name in FISH:
   # Vertical heterocercal tail, strongly unequal upper/lower lobes in the hammerhead.
   for sign,ext in [(1,1.),(-1,1. if self.name=='salmon' else .66 if self.name=='hammerhead' else .82)]:
    span=s['fluke']*ext
    self.blade([[.936,0,0],[.942,0,sign*span*.53],[1.028,0,sign*span],[1.035,0,sign*span*.97],[.997,0,sign*span*.56],[.979,0,sign*.017],[.972,0,0]],fincol,[0,1,0],.0013,4)
   self.blade([[.655,0,.031],[.689,0,.020 if self.name=='salmon' else .073],[.723,0,.030]],fincol,[0,1,0],.001,1)
   for sign in [-1,1]:
    vv=np.array([[.638,sign*.018,-.014],[.690,sign*.068,-.031],[.729,sign*.035,-.031],[.705,sign*.012,-.025]])
    if self.name=='salmon':vv[:,0]-=.13
    self.blade(vv,fincol,[0,0,1],.001,4)
   if self.name=='salmon':self.blade([[.665,0,-.035],[.689,0,-.118],[.753,0,-.044]],fincol,[0,1,0],.001,4)
  else:
   for sign in [-1,1]:
    span=s['fluke']
    self.blade([[.935,0,-.003],[.932,sign*span*.53,.006],[.914,sign*span,.004],[.956,sign*span*.95,-.009],[1.028,sign*span*.54,-.020],[1.009,sign*.018,-.017],[.987,0,-.008]],fincol,[0,0,1],.0018,4)
  if self.name=='hammerhead':
   # Curved cephalofoil, not a rectangular hammer stuck on a cetacean.
   for sign in [-1,1]:self.blade([[.092,sign*.014,.006],[.017,sign*.039,.009],[.008,sign*.085,.007],[-.009,sign*.131,.001],[.012,sign*.145,-.005],[.055,sign*.146,-.010],[.095,sign*.103,-.012],[.104,sign*.025,-.007]],[141,158,151],[0,0,1],.006,5)
  # Eye spheres are depth-tested. The far eye can never be painted through the body.
  for sign in [-1,1]:
   t=.092 if self.name=='blue_whale' else .14 if self.name=='bottlenose_dolphin' else .10 if self.name=='salmon' else .080
   if self.name=='hammerhead':centre=np.array([.019,sign*.141,.003])*L;r=.0033*L
   else:centre=np.array([t,sign*float(self.ry(t))*.994,float(self.cz(t)+self.rz(t)*.13)])*L;r=(.010 if self.name=='salmon' else .0033 if self.name.startswith('orca') else .0023)*L
   self.ellipsoid(centre,[r,r*.57,r*.85],[6,19,26]);self.ellipsoid(centre+[-r*.2,sign*r*.40,r*.28],[r*.20,r*.18,r*.19],[205,220,218])
  # Thin mouth/gill polylines stay in body space and participate in occlusion.
  for sign in [-1,1]:
   ts=np.linspace(.012,.20 if self.name.startswith('orca') else .31 if self.name=='blue_whale' else .16,90)
   q=np.stack([ts,sign*self.ry(ts)*.997,self.cz(ts)-self.rz(ts)*.18],axis=1)*L;self.detail.append((q,[32,57,69],.0010*L))
   if self.name=='salmon':
    ang=np.linspace(-.75,.78,40);ts=.19+.025*np.cos(ang);q=np.stack([ts,sign*self.ry(ts)*np.cos(ang)*1.006,self.cz(ts)+self.rz(ts)*np.sin(ang)],axis=1)*L;self.detail.append((q,[61,91,94],.0020*L))
   if self.name in FISH and self.name!='salmon':
    for j in range(5):
     ts=np.linspace(.155+j*.011,.164+j*.011,17);ang=np.linspace(.42,-.46,17);q=np.stack([ts,sign*self.ry(ts)*np.cos(ang)*1.005,self.cz(ts)+self.rz(ts)*np.sin(ang)],axis=1)*L;self.detail.append((q,[63,80,82],.0012*L))
  self.v=np.asarray(self.v,np.float32);self.f=np.asarray(self.f,np.int32);self.col=np.asarray(self.col,np.float32);self.part=np.asarray(self.part,np.int8)

@njit(cache=True)
def raster(points,triangles,normals,colours,width,height,scale,cx,cy):
 image=np.zeros((height,width,4),np.uint8);depth=np.full((height,width),1e20,np.float32)
 light=np.array([-.25,-.55,.80]);light/=np.sqrt((light*light).sum())
 for ti in range(len(triangles)):
  ids=triangles[ti];p=points[ids];xx=p[:,0]*scale+cx;yy=-p[:,2]*scale+cy
  x0=max(0,int(np.floor(xx.min())));x1=min(width-1,int(np.ceil(xx.max())));y0=max(0,int(np.floor(yy.min())));y1=min(height-1,int(np.ceil(yy.max())))
  if x1<x0 or y1<y0:continue
  den=(yy[1]-yy[2])*(xx[0]-xx[2])+(xx[2]-xx[1])*(yy[0]-yy[2])
  if abs(den)<1e-6:continue
  for y in range(y0,y1+1):
   for x in range(x0,x1+1):
    a=((yy[1]-yy[2])*(x+.5-xx[2])+(xx[2]-xx[1])*(y+.5-yy[2]))/den;b=((yy[2]-yy[0])*(x+.5-xx[2])+(xx[0]-xx[2])*(y+.5-yy[2]))/den;c=1-a-b
    if a<-.0001 or b<-.0001 or c<-.0001:continue
    d=a*p[0,1]+b*p[1,1]+c*p[2,1]
    if d>=depth[y,x]:continue
    depth[y,x]=d
    n=normals[ids[0]]*a+normals[ids[1]]*b+normals[ids[2]]*c;n/=max(1e-8,np.sqrt((n*n).sum()))
    # Broad sky key, cool fill and subtle rim preserve an illustrated finish without dark polygon facets.
    diffuse=max(0.,(n*light).sum());rim=max(0.,1-abs(n[1]))**3;shade=.72+.26*diffuse+.08*rim
    cc=colours[ids[0]]*a+colours[ids[1]]*b+colours[ids[2]]*c
    for k in range(3):image[y,x,2-k]=min(255,max(0,int(cc[k]*shade)))
    image[y,x,3]=255
 return image,depth

@lru_cache(maxsize=7)
def model(name):return Model(name)

def articulate(points,name,phase,parts=None,jaw=0):
 p=np.asarray(points).copy();s=SPECS[name];u=p[:,0]/s['L'];a=np.maximum(0,(u-.42)/.58)**2;wave=np.sin(phase-u*4.1)*a*s['L']*.027
 if name in FISH:p[:,1]+=wave
 else:p[:,2]+=wave
 if parts is not None:
  if jaw and (name.startswith('orca') or name=='blue_whale'):
   hinge=.31 if name=='blue_whale' else .238;origin=np.array([hinge*s['L'],0,float(PchipInterpolator(ST,s['cz'])(hinge))*s['L']]);k=parts==6;q=p[k]-origin;a=-math.radians(jaw);c,ss=np.cos(a),np.sin(a);qx=q[:,0].copy();qz=q[:,2].copy();q[:,0]=qx*c+qz*ss;q[:,2]=-qx*ss+qz*c;p[k]=q+origin
  for part,sign in [(2,-1),(3,1)]:
   k=parts==part
   if np.any(k):
    root=np.array([s['px']*s['L'],sign*float(PchipInterpolator(ST,s['ry'])(s['px']))*s['L'],0]);q=p[k]-root;angle=.12*np.sin(phase+.8)*sign;c,ss=np.cos(angle),np.sin(angle);q[:,1],q[:,2]=q[:,1]*c-q[:,2]*ss,q[:,1]*ss+q[:,2]*c;p[k]=q+root
 return p

def render(name='orca',phase=0,roll=0,yaw=0,elevation=8,ppm=145,width=1600,height=900,flip=False,supersample=1.25,jaw=0,rope_start_camera=None,centre=None):
 m=model(name);p=articulate(m.v,name,phase,m.part,jaw);p[:,0]-=m.s['L']*.5;R=rotation(roll,yaw,elevation);p=p@R.T
 if flip:p[:,0]*=-1
 # Optional real three-dimensional rope is depth-tested against lips, teeth and mouth lining.
 f=m.f[:,::-1] if flip else m.f;colours=m.col
 if rope_start_camera is not None:
  u=.075;end=np.array([u*m.s['L'],-float(m.ry(u))*.91*m.s['L'],(float(m.cz(u)-m.rz(u)*.18)-.007)*m.s['L']]);end[0]-=m.s['L']*.5;end=end@R.T
  if flip:end[0]*=-1
  start=np.asarray(rope_start_camera,dtype=float);d=end-start;d/=np.linalg.norm(d);n=np.cross(d,[0,0,1]);n/=np.linalg.norm(n);b=np.cross(d,n);vv=[];ff=[]
  for k,u in enumerate(np.linspace(0,1,65)):
   q=start*(1-u)+end*u;q[2]-=.065*np.sin(np.pi*u)
   for a in np.linspace(0,2*np.pi,10,endpoint=False):vv.append(q+(n*np.cos(a)+b*np.sin(a))*.018)
  for j in range(64):
   for k in range(10):a=j*10+k;b0=j*10+(k+1)%10;c0=(j+1)*10+k;d0=(j+1)*10+(k+1)%10;ff.extend([[a,b0,c0],[b0,d0,c0]])
  off=len(p);p=np.concatenate([p,np.asarray(vv,np.float32)]);f=np.concatenate([f,np.asarray(ff,np.int32)+off]);colours=np.concatenate([colours,np.tile([211,188,143],(len(vv),1)).astype(np.float32)])
 # Vertex normals, recomputed after body articulation; rounded surfaces use interpolated illumination.
 tri=p[f];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm=np.zeros_like(p)
 for j in range(3):np.add.at(norm,f[:,j],fn)
 norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-9)
 ss=supersample;ww,hh=round(width*ss),round(height*ss);cx,cy=(width*.5,height*.54) if centre is None else centre;im,z=raster(p.astype(np.float32),f,norm.astype(np.float32),colours,ww,hh,ppm*ss,cx*ss,cy*ss)
 # Mouth and gill marks are drawn only where their own depth agrees with the visible surface.
 for q,colour,thick in m.detail:
  qp=articulate(q,name,phase);qp[:,0]-=m.s['L']*.5;qp=qp@R.T
  if flip:qp[:,0]*=-1
  pts=np.column_stack([qp[:,0]*ppm*ss+cx*ss,-qp[:,2]*ppm*ss+cy*ss]);vis=[]
  for j,xy in enumerate(pts):
   x,y=np.rint(xy).astype(int)
   if 0<=x<ww and 0<=y<hh and abs(qp[j,1]-z[y,x])<m.s['L']*.012:vis.append((x,y))
   elif len(vis)>1:cv2.polylines(im,[np.asarray(vis,np.int32)],False,(*colour[::-1],255),max(1,round(thick*ppm*ss)),cv2.LINE_AA);vis=[]
   else:vis=[]
  if len(vis)>1:cv2.polylines(im,[np.asarray(vis,np.int32)],False,(*colour[::-1],255),max(1,round(thick*ppm*ss)),cv2.LINE_AA)
 return cv2.resize(im,(width,height),interpolation=cv2.INTER_AREA) if ss!=1 else im


def render_world(objects,ppm=110,width=1920,height=1080,centre=None,elevation=8,supersample=1.1):
 """Shared three-dimensional depth buffer for interacting animals, at ONE physical scale.
 World positions are metres. Foreground teeth, prey tongue, baleen and jaws occlude by real depth.
 """
 camera=rotation(elevation=elevation);vv=[];ff=[];cc=[];details=[];offset=0
 for obj in objects:
  name=obj['name'];m=model(name);phase=obj.get('phase',0);jaw=obj.get('jaw',0);flip=obj.get('flip',False);pose=rotation(obj.get('roll',0),obj.get('yaw',0),0);translation=np.asarray(obj.get('position',[0,0,0]),float)
  p=articulate(m.v,name,phase,m.part,jaw);p[:,0]-=m.s['L']*.5;p=p@pose.T
  if flip:p[:,0]*=-1
  p=(p+translation)@camera.T;vv.append(p);ff.append((m.f[:,::-1] if flip else m.f)+offset);cc.append(m.col);offset+=len(p)
  for q,col,thick in m.detail:
   qp=articulate(q,name,phase);qp[:,0]-=m.s['L']*.5;qp=qp@pose.T
   if flip:qp[:,0]*=-1
   details.append(((qp+translation)@camera.T,col,thick,m.s['L']))
 p=np.concatenate(vv);f=np.concatenate(ff);colours=np.concatenate(cc);tri=p[f];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);norm=np.zeros_like(p)
 for j in range(3):np.add.at(norm,f[:,j],fn)
 norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-9);ss=supersample;ww,hh=round(width*ss),round(height*ss);cx,cy=centre if centre is not None else (width*.5,height*.54)
 im,z=raster(p.astype(np.float32),f,norm.astype(np.float32),colours,ww,hh,ppm*ss,cx*ss,cy*ss)
 for qp,col,thick,L in details:
  pts=np.column_stack([qp[:,0]*ppm*ss+cx*ss,-qp[:,2]*ppm*ss+cy*ss]);visible=[]
  for j,xy in enumerate(pts):
   x,y=np.rint(xy).astype(int)
   if 0<=x<ww and 0<=y<hh and abs(qp[j,1]-z[y,x])<L*.012:visible.append((x,y))
   else:
    if len(visible)>1:cv2.polylines(im,[np.asarray(visible,np.int32)],False,(*col[::-1],255),max(1,round(thick*ppm*ss)),cv2.LINE_AA)
    visible=[]
  if len(visible)>1:cv2.polylines(im,[np.asarray(visible,np.int32)],False,(*col[::-1],255),max(1,round(thick*ppm*ss)),cv2.LINE_AA)
 return cv2.resize(im,(width,height),interpolation=cv2.INTER_AREA) if ss!=1 else im

if __name__=='__main__':
 out=Path(__file__).resolve().parents[1]/'qa/smooth_rig';out.mkdir(exist_ok=True)
 for name,ppm,elev,yaw in [('orca',165,8,0),('blue_whale',82,6,0),('great_white',250,12,0),('hammerhead',285,36,8),('bronze_whaler',350,10,0),('pilot_whale',210,10,0)]:
  im=render(name,ppm=ppm,elevation=elev,yaw=yaw);cv2.imwrite(str(out/(name+'.png')),im);print(name,flush=True)
 for angle in [0,25,50,75,90]:cv2.imwrite(str(out/f'roll_{angle:03d}.png'),render('orca',roll=angle,ppm=165,elevation=5))
