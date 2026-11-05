import numpy as np
import torch
from PIL import Image
from transformers import pipeline
import trimesh
from pathlib import Path

out=Path('cloud_reconstruction');out.mkdir(exist_ok=True)
image=Image.open('public/prototype/hangar.png').convert('RGB')
# Monocular depth is estimated, not true multi-view geometry.
image.thumbnail((960,540), Image.Resampling.LANCZOS)
depth_estimator=pipeline(task='depth-estimation',model='depth-anything/Depth-Anything-V2-Small-hf',device=-1)
result=depth_estimator(image)
depth=result['depth'].resize(image.size,Image.Resampling.BICUBIC)
depth.save(out/'estimated_depth.png')
w,h=image.size
# Resample geometry independently from the high-resolution texture.
cols,rows=240,135
z=np.asarray(depth.resize((cols,rows),Image.Resampling.BICUBIC),dtype=np.float32)/255.0
x=np.linspace(-8,8,cols,dtype=np.float32); y=np.linspace(4.5,-4.5,rows,dtype=np.float32)
xx,yy=np.meshgrid(x,y)
# Keep inferred depth as actual displacement, but avoid advertising it as a complete room.
vertices=np.column_stack((xx.ravel(), yy.ravel(), (z*3.0).ravel()))
uv=np.column_stack((np.tile(np.linspace(0,1,cols),rows), np.repeat(np.linspace(1,0,rows),cols)))
i=np.arange((rows-1)*(cols-1)).reshape(rows-1,cols-1); base=(np.arange(rows-1)[:,None]*cols+np.arange(cols-1)).ravel();faces=np.vstack((np.column_stack((base,base+cols,base+1)),np.column_stack((base+1,base+cols,base+cols+1))))
visual=trimesh.visual.TextureVisuals(uv=uv,image=image)
mesh=trimesh.Trimesh(vertices=vertices,faces=faces,visual=visual,process=False)
mesh.export(out/'hangar_depth_mesh.glb')
(out/'README.txt').write_text('Image-derived textured depth mesh. This is 2.5D, not a complete watertight 3D room. Depth is estimated from one image; hidden surfaces and camera movement are limited.\n')
print('Saved vertices:',len(vertices),'faces:',len(faces))
