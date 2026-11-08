"""Explicit new-scene dispatch. Never substitutes repeated generic filler for missing scenes."""
import json
from pathlib import Path
import opening_scenes as opening
import hardware_ecology_scenes as hardware
import ice_coast_scenes as ice_coast
import investigation_scenes as investigation
import human_history_scenes as humans
P=Path(__file__).resolve().parents[1]
PLAN=json.loads((P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text())
IMPLEMENTED=opening.IMPLEMENTED|hardware.IMPLEMENTED|ice_coast.IMPLEMENTED|investigation.IMPLEMENTED|humans.IMPLEMENTED

def _dependencies(key):
 common=['illustrated_rig.py','people_boats.py','compositor.py','opening_scenes.py']
 if key in opening.IMPLEMENTED:return common
 if key in hardware.IMPLEMENTED:return common+['hardware_ecology_scenes.py']
 if key in ice_coast.IMPLEMENTED:return common+['pinniped_rig.py','physical_scene.py','fast_raster.py','ice_coast_scenes.py']
 if key in investigation.IMPLEMENTED:return common+['pinniped_rig.py','physical_scene.py','fast_raster.py','investigation_scenes.py','scene_text.py','shark_details.py']
 if key in humans.IMPLEMENTED:return common+['pinniped_rig.py','physical_scene.py','fast_raster.py','investigation_scenes.py','scene_text.py','shark_details.py','human_history_scenes.py']
 raise NotImplementedError('Scene still unauthored: '+key)

def _frame(s,t):
 if s['key'] in opening.IMPLEMENTED:return opening.frame(s,t)
 if s['key'] in hardware.IMPLEMENTED:return hardware.frame(s,t)
 if s['key'] in ice_coast.IMPLEMENTED:return ice_coast.frame(s,t)
 if s['key'] in investigation.IMPLEMENTED:return investigation.frame(s,t)
 if s['key'] in humans.IMPLEMENTED:return humans.frame(s,t)
 raise NotImplementedError('No new authored scene for '+s['key'])


def dependencies(key):
 return _dependencies(key)+['story_scenes.py','revision_geometry.py','revision_scenes.py','scene_context.py']

def frame(s,t):
 from scene_context import augment
 return augment(s,_frame(s,t),t)
