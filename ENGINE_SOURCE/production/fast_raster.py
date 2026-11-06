"""Allocation-free scalar form of the same Gouraud depth renderer. Native pixel resolution unchanged."""
import numpy as np,math
from numba import njit
@njit(cache=True)
def raster(points,triangles,normals,colours,width,height,scale,cx,cy):
 image=np.zeros((height,width,4),np.uint8);depth=np.full((height,width),1e20,np.float32)
 ll=math.sqrt(.25*.25+.55*.55+.8*.8);lx=-.25/ll;ly=-.55/ll;lz=.8/ll
 for ti in range(len(triangles)):
  i,j,k=triangles[ti];x0=points[i,0]*scale+cx;x1=points[j,0]*scale+cx;x2=points[k,0]*scale+cx;y0=-points[i,2]*scale+cy;y1=-points[j,2]*scale+cy;y2=-points[k,2]*scale+cy
  xmin=max(0,int(math.floor(min(x0,x1,x2))));xmax=min(width-1,int(math.ceil(max(x0,x1,x2))));ymin=max(0,int(math.floor(min(y0,y1,y2))));ymax=min(height-1,int(math.ceil(max(y0,y1,y2))))
  den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
  if abs(den)<1e-6:continue
  for y in range(ymin,ymax+1):
   for x in range(xmin,xmax+1):
    a=((y1-y2)*(x+.5-x2)+(x2-x1)*(y+.5-y2))/den;b=((y2-y0)*(x+.5-x2)+(x0-x2)*(y+.5-y2))/den;c=1-a-b
    if a<-.0001 or b<-.0001 or c<-.0001:continue
    d=a*points[i,1]+b*points[j,1]+c*points[k,1]
    if d>=depth[y,x]:continue
    depth[y,x]=d;nx=a*normals[i,0]+b*normals[j,0]+c*normals[k,0];ny=a*normals[i,1]+b*normals[j,1]+c*normals[k,1];nz=a*normals[i,2]+b*normals[j,2]+c*normals[k,2];nn=max(1e-8,math.sqrt(nx*nx+ny*ny+nz*nz));nx/=nn;ny/=nn;nz/=nn
    diffuse=max(0.,nx*lx+ny*ly+nz*lz);rim=max(0.,1-abs(ny))**3;shade=.72+.26*diffuse+.08*rim
    for ch in range(3):image[y,x,2-ch]=min(255,max(0,int((a*colours[i,ch]+b*colours[j,ch]+c*colours[k,ch])*shade)))
    image[y,x,3]=255
 return image,depth
