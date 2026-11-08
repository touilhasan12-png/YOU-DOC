"""Dimensioned scene coordinates. Metres first, one camera projection second.
Dimensions below are illustration design values, NOT claims about measured historic craft/individuals.
"""
from dataclasses import dataclass
import math
import numpy as np

DIMENSIONS={
 'adult_orca':{'length':7.5,'height':2.5,'kind':'animal'},
 'old_tom_design':{'length':6.7,'height':2.2,'kind':'animal'},
 'blue_whale_reported':{'length':16.,'height':2.6,'kind':'animal'},
 'adult_human':{'length':.5,'height':1.75,'kind':'human'},
 'accepted_quality_yacht':{'length':12.8,'height':3.2,'kind':'vessel'},
 'historical_whaleboat_design':{'length':8.,'height':1.25,'kind':'vessel'},
 'modern_rescue_design':{'length':8.2,'height':2.,'kind':'vessel'},
 'surfboard':{'length':2.1,'height':.09,'kind':'equipment'}
}
@dataclass
class Camera:
 width:int=1920
 height:int=1080
 focal_px:float=1450.
 horizon_y:float=390.
 camera_height:float=1.8
 def project(self,point):
  x,depth,z=point
  if depth<=.1:raise ValueError('Actor lies behind/too close to camera')
  return (self.width*.5+x*self.focal_px/depth,self.horizon_y-(z-self.camera_height)*self.focal_px/depth)
 def projected_length(self,metres,depth):return metres*self.focal_px/depth

def screen_point(camera,actor_position,local_point,yaw_degrees=0,roll_degrees=0):
 p=np.array(local_point,dtype=float);a=math.radians(roll_degrees);c,s=math.cos(a),math.sin(a);p=np.array([p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c]);a=math.radians(yaw_degrees);c,s=math.cos(a),math.sin(a);p=np.array([p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]])+actor_position
 return camera.project(p)

def rope_points(camera,boat_position,boat_bollard,animal_position,animal_grip,sag_metres=.10,samples=24):
 # Both endpoints are actual local attachment coordinates. Neither endpoint is a loose screen-space guess.
 a=np.asarray(boat_position)+boat_bollard;b=np.asarray(animal_position)+animal_grip;pts=[]
 for u in np.linspace(0,1,samples):
  p=a*(1-u)+b*u;p[2]-=4*u*(1-u)*sag_metres;pts.append(camera.project(p))
 return pts

def validate_scale():
 c=Camera();depth=22.
 orca=c.projected_length(DIMENSIONS['old_tom_design']['length'],depth);boat=c.projected_length(DIMENSIONS['historical_whaleboat_design']['length'],depth)
 assert abs(orca/boat-6.7/8)<1e-10
 a=np.array([-3.,22.,.8]);b=np.array([4.,22.,.3]);points=rope_points(c,a,np.array([1.,0.,0.]),b,np.array([-.6,0.,0.]))
 assert np.allclose(points[0],c.project(a+[1,0,0])) and np.allclose(points[-1],c.project(b+[-.6,0,0]))
 return {'same_depth_orca_to_boat_ratio':orca/boat,'same_camera_for_all_actors':True,'rope_endpoints_exact':True,'illustrative_dimensions_not_historic_measurements':True}
if __name__=='__main__':print(validate_scale())
