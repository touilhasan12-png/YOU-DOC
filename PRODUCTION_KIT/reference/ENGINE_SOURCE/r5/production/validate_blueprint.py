"""Static preflight; no media processing. Suitable for local and GitHub use."""
import json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R.parent
x=json.loads((R/'design/DIRECTOR_PLAN_93.json').read_text());old=json.loads((P/'shots/NEW_SHOT_PLAN_ENDING_REVISED.json').read_text());request=json.loads((R/'production/INSPECTION_REQUEST.json').read_text())
assert request['edition']=='R5' and request['sequence']==1
assert request['film_frames_requested']==0 and not request['execute_embedded_rig_scripts']
assert request['maximum_jobs']==1 and request['timeout_minutes']<=12
assert hashlib.sha256((P/'script_original.txt').read_bytes()).hexdigest()=='af5f03682a9d6fe4c53393a806e2dbb35e51ae2818de102efc42ef242be70eb9'
assert len(x)==len(old)==93
assert x[0]['frame_start']==0 and x[-1]['frame_end']==15969
for i,(a,b) in enumerate(zip(x,old)):
    assert a['key']==b['key'] and a['start']==b['start'] and a['end']==b['end']
    assert a['frame_start']==math.ceil(b['start']*24-1e-7)
    assert a['frame_end']==min(15969,math.ceil(b['end']*24-1e-7))
    assert a['previous_encoded_unit_allowed'] is False and a['new_authored_composition_required'] is True
    assert all(len(a[k])>35 for k in ['framing','on_screen_action'])
    assert len(a['environment_contract'])>=20 and len(a['information_design'])>=15
    assert not a['artistically_reviewed'] and not a['renderer_implemented'] and not a['native_render_approved']
    if i: assert x[i-1]['frame_end']==a['frame_start']
assert len({a['framing'] for a in x})==93 and len({a['on_screen_action'] for a in x})==93
assert sum(a['encoded_frames'] for a in x)==15969
asset=R/'assets/orca_pasilan';receipt=json.loads((asset/'SOURCE_RECEIPT.json').read_text())
for f in receipt['files']:
    p=asset/f['file'];assert p.stat().st_size==f['bytes'];assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
assert receipt['original_blend_downloaded'] is False
print('R5 static preflight passed: 93 individually authored shots, exact original timeline/script, original-pixel reuse disabled, complete obtained orca source hash-verified; single metadata-only inspection authorized. No artistic PASS.')
