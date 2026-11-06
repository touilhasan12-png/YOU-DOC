"""Run with Blender, on GitHub Actions only. Metadata inspection, NOT a render.
Never enables embedded rig Python, opens a UI, executes Text blocks, or claims art approval.
"""
import bpy, json, sys, hashlib, os
from pathlib import Path
from mathutils import Vector
ROOT=Path.cwd(); OUT=ROOT/'R5_INSPECTION';OUT.mkdir(exist_ok=True)
args=sys.argv[sys.argv.index('--')+1:]; snow=Path(args[0]).resolve()
assert os.environ.get('GITHUB_ACTIONS')=='true', 'Media/3D inspection must run on GitHub Actions, not the local workspace.'
def vector(v):return [round(float(x),7) for x in v]
def inspect(label):
    objects=[]
    for ob in bpy.data.objects:
        item={'name':ob.name,'type':ob.type,'hide_render':ob.hide_render,'hide_viewport':ob.hide_viewport,'parent':ob.parent.name if ob.parent else None,'matrix_world':[vector(r) for r in ob.matrix_world],'collections':[c.name for c in ob.users_collection]}
        if ob.type in {'MESH','CURVE','CURVES','SURFACE'}:
            item['world_bounds']=[vector(ob.matrix_world@Vector(c)) for c in ob.bound_box]
            item['modifiers']=[{'name':m.name,'type':m.type,'viewport':m.show_viewport,'render':m.show_render,'object':getattr(getattr(m,'object',None),'name',None),'levels':getattr(m,'levels',None),'render_levels':getattr(m,'render_levels',None)} for m in ob.modifiers]
        if ob.type=='MESH':
            item.update(vertices=len(ob.data.vertices),polygons=len(ob.data.polygons),triangles=sum(len(f.vertices)-2 for f in ob.data.polygons),uv_layers=[l.name for l in ob.data.uv_layers],materials=[s.material.name if s.material else None for s in ob.material_slots],vertex_groups=[g.name for g in ob.vertex_groups],shape_keys=[k.name for k in ob.data.shape_keys.key_blocks] if ob.data.shape_keys else [])
        if ob.type=='ARMATURE':
            item['bones']=[{'name':b.name,'parent':b.parent.name if b.parent else None,'deform':b.use_deform,'head':vector(b.head_local),'tail':vector(b.tail_local),'length':round(b.length,7)} for b in ob.data.bones]
            item['pose_custom_props']={b.name:{str(k):str(v)[:160] for k,v in b.items()} for b in ob.pose.bones if b.keys()}
        objects.append(item)
    materials=[]
    for m in bpy.data.materials:
        materials.append({'name':m.name,'diffuse':vector(m.diffuse_color),'nodes':[{'name':n.name,'type':n.type,'node_group':n.node_tree.name if n.type=='GROUP' and n.node_tree else None,'image':n.image.name if n.type=='TEX_IMAGE' and n.image else None} for n in m.node_tree.nodes] if m.use_nodes else [],'links':[[l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name] for l in m.node_tree.links] if m.use_nodes else []})
    images=[]
    for im in bpy.data.images:
        path=bpy.path.abspath(im.filepath); check=path.replace('<UDIM>','1001')
        images.append({'name':im.name,'source':im.source,'path':im.filepath,'absolute':path,'exists':Path(check).exists(),'packed':bool(im.packed_file),'tiles':[t.number for t in im.tiles] if im.source=='TILED' else [],'colorspace':im.colorspace_settings.name})
    return {'edition':'R5','asset':label,'execution':'GitHub Actions metadata only; no frames rendered','run_id':os.environ.get('GITHUB_RUN_ID'),'blender':bpy.app.version_string,'autoexec_enabled':bpy.context.preferences.filepaths.use_scripts_auto_execute,'autoexec_fail':bpy.app.autoexec_fail,'autoexec_fail_message':bpy.app.autoexec_fail_message,'objects':objects,'materials':materials,'images':images,'embedded_texts_NOT_executed':[t.name for t in bpy.data.texts],'artistic_review_passed':False,'rig_export_verified':False}
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
bpy.ops.wm.open_mainfile(filepath=str(snow),load_ui=False,use_scripts=False)
assert not bpy.context.preferences.filepaths.use_scripts_auto_execute
(OUT/'SNOW_STATIC_INSPECTION.json').write_text(json.dumps(inspect('Snow v4 / original'),indent=2))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
orca=ROOT/'ENGINE_SOURCE/r5/assets/orca_pasilan/whale.CYCLES.gltf';bpy.ops.import_scene.gltf(filepath=str(orca))
(OUT/'ORCA_STATIC_INSPECTION.json').write_text(json.dumps(inspect('Junskie Pastilan / pasilan glTF source'),indent=2))
print('R5 source metadata written. No human conversion, final rendering, full-film rebuild or artistic approval is claimed.')
