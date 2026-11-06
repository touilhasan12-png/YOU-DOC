"""Authored Snow source -> clean realtime skinned cast. GitHub Actions ONLY.
Bakes evaluated modeled clothing, mirror/subdivision/masks, keeps authored UVs,
collapses the facial deformation hierarchy to the head (no face animation claim).
Creates a conventional anatomical skeleton from the actual source joints.
"""
import bpy,os,sys,json,re,math,hashlib
from pathlib import Path
from mathutils import Matrix,Vector
assert os.environ.get('GITHUB_ACTIONS')=='true'
args=sys.argv[sys.argv.index('--')+1:];source=Path(args[0]);out=Path('R5_PREP');out.mkdir(exist_ok=True)
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False,use_scripts=False)
source_rig=bpy.data.objects['RIG-Snow'];source_rig.data.pose_position='REST'
# Source maps are rebuilt as explicit PBR materials, not painted replacement clothing.
texture_dir=source.parent/'textures'; atlas_path=Path(args[1]).resolve()
oldbones={b.name:{'head':b.head_local.copy(),'tail':b.tail_local.copy(),'z':b.z_axis.copy()} for b in source_rig.data.bones}
joints={}
def add(name,src,parent=None,end=None):
 b=oldbones[src];joints[name]={'head':b['head'],'tail':oldbones[end]['tail'] if end else b['tail'],'z':b['z'],'parent':parent}
add('Hips','DEF-Hips');add('Spine','DEF-Spine','Hips');add('RibCage','DEF-RibCage','Spine');add('Chest','DEF-Chest','RibCage');add('Neck','DEF-Neck','Chest');add('Head','DEF-Head','Neck')
for side in ['L','R']:
 add('Shoulder_'+side,'DEF-Shoulder.'+side,'Chest')
 add('UpperArm_'+side,'DEF-UpperArm_1.'+side,'Shoulder_'+side,'DEF-UpperArm_2.'+side)
 add('Forearm_'+side,'DEF-Forearm_1.'+side,'UpperArm_'+side,'DEF-Forearm_2.'+side)
 add('Hand_'+side,'DEF-Wrist.'+side,'Forearm_'+side)
 add('Thigh_'+side,'DEF-Thigh_1.'+side,'Hips','DEF-Thigh_2.'+side)
 add('Shin_'+side,'DEF-Knee_1.'+side,'Thigh_'+side,'DEF-Knee_2.'+side)
 add('Foot_'+side,'DEF-Foot.'+side,'Shin_'+side);add('Toes_'+side,'DEF-Toes.'+side,'Foot_'+side)
 for finger in ['Index','Middle','Ring','Pinky','Thumb']:
  prev='Hand_'+side
  names=([finger+'_Carpal'] if finger!='Thumb' else [])+[finger+str(n) for n in [1,2,3]]
  for k in names:
   src='DEF-Finger_'+k+'.'+side
   if src not in oldbones:continue
   name=k+'_'+side;add(name,src,prev);prev=name
# Evaluate original silhouettes with authored masks; limit the production subdivision
# to one step, retaining continuous faces/hands and readable fabric/shoe geometry.
keep=[]
for ob in list(bpy.data.objects):
 if ob.type!='MESH' or not ob.name.startswith('GEO-snow'):continue
 if ob.hide_render or any(k in ob.name for k in ['helper','deformer','eye_corneas','eye_anim']):continue
 if ob.name.endswith('eye_dots'):continue # authored eyes already include their own highlight response
 for m in ob.modifiers:
  if m.type=='SUBSURF':m.levels=0 if any(k in ob.name for k in ['teeth','gums','tongue']) else 1;m.render_levels=m.levels
  if m.type=='ARMATURE':m.show_viewport=False;m.show_render=False
 keep.append(ob)
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();snapshots=[]
for ob in keep:
 mesh=bpy.data.meshes.new_from_object(ob.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg)
 names={g.index:g.name for g in ob.vertex_groups}
 weights=[[(names.get(g.group,''),g.weight) for g in v.groups] for v in mesh.vertices]
 snapshots.append((ob.name,mesh,weights,list(ob.data.materials),ob.matrix_world.copy()))
# Reconstruct explicit source-based materials; the three UDIM tiles form one atlas.
mat_cache={};img_cache={}
def image(name):
 p=atlas_path if name=='skin_atlas.png' else texture_dir/name
 if not p.exists():return None
 if str(p) not in img_cache:img_cache[str(p)]=bpy.data.images.load(str(p),check_existing=True)
 return img_cache[str(p)]
def material(name):
 if name in mat_cache:return mat_cache[name]
 base='skin' if name.startswith('snow.skin') else {'snow.eyes':'eyes','snow.hair':'hair','snow.pants':'pants','snow.shirt':'shirt','snow.shoe':'shoes'}.get(name)
 m=bpy.data.materials.new('R5_'+name.replace('.','_'));m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.62
 if base:
  im=image('skin_atlas.png' if base=='skin' else base+'_diffuse.png')
  if im:
   tex=n.new('ShaderNodeTexImage');tex.image=im;m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
  if base in ['pants','shirt','shoes','eyes']:
   im=image(base+'_normal.png')
   if im:
    im.colorspace_settings.name='Non-Color';tex=n.new('ShaderNodeTexImage');tex.image=im;normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.28;m.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
  if base=='eyes':bs.inputs['Roughness'].default_value=.2
  if base=='skin':bs.inputs['Subsurface Weight'].default_value=.045
 else:
  color=(.72,.68,.57,1) if 'teeth' in name else (.28,.055,.05,1);bs.inputs['Base Color'].default_value=color
 mat_cache[name]=m;return m
# Unlink old scene geometry/rigs, never run its embedded rig UI.
for ob in list(bpy.data.objects):bpy.data.objects.remove(ob,do_unlink=True)
arm=bpy.data.armatures.new('R5_AnatomicalRig');rig=bpy.data.objects.new('R5_HumanRig',arm);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,j in joints.items():
 b=arm.edit_bones.new(name);b.head=j['head'];b.tail=j['tail'];b.align_roll(j['z'])
 if j['parent']:b.parent=arm.edit_bones[j['parent']]
bpy.ops.object.mode_set(mode='OBJECT')
def mapped(g):
 s='L' if g.endswith('.L') else 'R' if g.endswith('.R') else None
 if g.startswith('DEF-Finger_') and s:
  k=g[len('DEF-Finger_'):-2]+'_'+s
  return k if k in joints else 'Hand_'+s
 if s:
  for text,dst in [('Shoulder','Shoulder'),('UpperArm','UpperArm'),('Forearm','Forearm'),('Wrist','Hand'),('Thigh','Thigh'),('Knee','Shin'),('Foot','Foot'),('Toes','Toes')]:
   if g.startswith('DEF-'+text):return dst+'_'+s
  if g.startswith('DEF-Hips'):return 'Hips'
 for text in ['Neck','Chest','RibCage','Spine']:
  if g=='DEF-'+text:return text
 if g in ['DEF-Hips','DEF-Hip_Center']:return 'Hips'
 if g.startswith('DEF-'):return 'Head'
 return None
report=[]
for name,mesh,weights,mats,matrix in snapshots:
 ob=bpy.data.objects.new(name.replace('-','_'),mesh);bpy.context.collection.objects.link(ob);ob.matrix_world=matrix
 mesh.materials.clear()
 for m in mats:mesh.materials.append(material(m.name))
 if mats and all(m.name.startswith('snow.skin') for m in mats):
  for uv in mesh.uv_layers:
   for loop in uv.data:loop.uv.x/=3
 for f in mesh.polygons:f.use_smooth=True
 groups={k:ob.vertex_groups.new(name=k) for k in joints};fallback=0
 for idx,w in enumerate(weights):
  total={}
  for group,val in w:
   dst=mapped(group)
   if dst:total[dst]=total.get(dst,0)+val
  if not total:
   fallback+=1;co=mesh.vertices[idx].co
   dst='Head' if any(k in name for k in ['head','hair','eye','teeth','gums','tongue']) else ('Foot_L' if co.x>0 else 'Foot_R') if 'shoe' in name else 'Chest';total={dst:1}
  # Standard glTF four-influence normalization; all influences come from authored weights.
  vals=sorted(total.items(),key=lambda x:-x[1])[:4];s=sum(x[1] for x in vals)
  for k,val in vals:groups[k].add([idx],val/s,'REPLACE')
 mod=ob.modifiers.new('Clean authored skin','ARMATURE');mod.object=rig;ob.parent=rig
 report.append({'mesh':name,'vertices':len(mesh.vertices),'faces':len(mesh.polygons),'fallback_vertices':fallback,'materials':[m.name for m in mesh.materials]})
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(out/'snow_clean.glb'),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_def_bones=True,export_yup=True,export_apply=False,export_extras=True)
report={'run_id':os.environ['GITHUB_RUN_ID'],'source_credit':'Snow Rig (CC) Blender Foundation | studio.blender.org','license':'CC-BY-4.0','autoexec_enabled':bpy.context.preferences.filepaths.use_scripts_auto_execute,'modifications':'One production subdivision, authored cloth geometry retained, skin UDIM atlas, simplified anatomical skeleton, original normalized four-influence skin weights; facial weights collapsed to Head. No facial animation or final-art approval claimed.','bone_count':len(joints),'joints':{k:{'head':list(v['head']),'tail':list(v['tail']),'parent':v['parent']} for k,v in joints.items()},'meshes':report,'sha256':hashlib.sha256((out/'snow_clean.glb').read_bytes()).hexdigest(),'bytes':(out/'snow_clean.glb').stat().st_size,'artistically_approved':False}
(out/'SNOW_CONVERSION.json').write_text(json.dumps(report,indent=2));print('R5_HUMAN_EXPORTED',report['bytes'],report['bone_count'],flush=True)
