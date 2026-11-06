"""Five pairs of actual attached 3-D gill slits for world-space shark compositions."""
import numpy as np
import illustrated_rig as rig
import physical_scene as phys
from pinniped_rig import Mesh

def shark(name='great_white',phase=0,position=(0,0,0),yaw=0,flip=False,**kw):
 v,f,c=phys.whale(name,phase=phase,position=position,yaw=yaw,flip=flip,**kw);m=rig.model(name);L=m.s['L'];g=Mesh()
 for side in [-1,1]:
  for u in [.185,.203,.221,.239,.257]:
   a=np.linspace(2.43,3.83,12) if side<0 else np.linspace(-.69,.69,12);pts=np.array([[u*L,float((m.ry(u)*m.s['L']))*np.cos(t)*1.009,float((m.cz(u)*m.s['L']))+float((m.rz(u)*m.s['L']))*np.sin(t)*1.009] for t in a]);g.tube(pts,L*.00085,[57,73,78],6)
 for side in [-1,1]:
  u=.078;ry=float(m.ry(u))*L;rz=float(m.rz(u))*L;cz=float(m.cz(u))*L
  g.sphere([u*L,side*ry*.995,cz+rz*.13],[.004*L,.0018*L,.003*L],[17,28,32],10,14)
  pts=[]
  for u in np.linspace(.025,.18,24):
   sz=-.8+.6*(u-.025)/.155;pts.append([u*L,side*float(m.ry(u))*L*np.sqrt(1-sz*sz)*1.01,float(m.cz(u))*L+float(m.rz(u))*L*sz*1.01])
  g.tube(pts,L*.0008,[65,76,79],6)
 gv,gf,gc=g.arrays();gv=rig.articulate(gv,name,phase,np.zeros(len(gv),np.int8),0);gv[:,0]-=L*.5;gv=phys.pose(gv,position=position,yaw=yaw,flip=flip)
 if flip:gf=gf[:,::-1]
 return np.concatenate([v,gv]),np.concatenate([f,gf+len(v)]),np.concatenate([c,gc])
