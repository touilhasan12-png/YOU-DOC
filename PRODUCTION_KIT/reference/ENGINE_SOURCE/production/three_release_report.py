"""Release support assembled only on GitHub, from actual current native-render reports."""
import os,json,hashlib,shutil
from pathlib import Path
assert os.environ.get('GITHUB_ACTIONS')=='true'
P=Path(__file__).resolve().parents[1];D=P/'delivery';reports=[]
for file in sorted((P/'qa/three').glob('*_GEOMETRY.json')):
 x=json.loads(file.read_text());assert x['fps']==24 and len(x['checks'])==x['frames']
 flags=sorted({k for row in x['checks'] for k in row if 'penetration' in k or k.endswith('_failure') or k in ['orca_body_intersection','simultaneous_visitors']})
 bad=sum(any(row.get(k) is True for k in flags) for row in x['checks']);assert bad==0
 grips=[r['maximum_hand_to_rim_error_metres'] for r in x['checks'] if 'maximum_hand_to_rim_error_metres' in r]
 if grips:assert max(grips)<=1e-6
 reports.append({'key':x['key'],'frames':x['frames'],'fps':24,'engine':x['engine'],'webgl':x['webgl'],'applicable_flags_evaluated_each_frame':flags,'reported_failed_frames':bad,'hand_rim_test_applicable':bool(grips),'maximum_grip_attachment_error_metres':max(grips) if grips else None,'surfer_test':next((r.get('arm_board_test') for r in x['checks'] if 'arm_board_test' in r),None),'surfer_arm_triangles':next((r.get('arm_board_triangles') for r in x['checks'] if 'arm_board_triangles' in r),None)})
assert len(reports)==10 and sum(r['frames'] for r in reports)==2187
(D/'THREE_NATIVE_CHECKS.json').write_text(json.dumps({'source_commit':os.environ['GITHUB_SHA'],'scoped_only':True,'not_a_universal_collision_or_artistic_guarantee':True,'native_units':reports},indent=2))
shutil.copyfile(P/'FINAL_CREDITS.md',D/'CREDITS_AND_SOURCES.md');shutil.copyfile(P/'timing/English_ending_revised.srt',D/'English.srt')
(D/'DELIVERY_NOTES.md').write_text('''# Something That Plans — R4 character and ocean rebuild

## Preserved
- The canonical 1,730-word script is byte-identical. Narrator, authorized ending derivative, duration, scene boundaries, approved motion cycles and orca choreography are preserved.
- 1920 × 1080, horizontal, 24 fps, 15,969 native frames, 665.375 seconds. The final AAC payload is verified bit-identical to the preserved mix.
- Previous Drive editions and sharing are not overwritten. No graphical next-video card/UI was added.

## This revision
- Authored CC0 Quaternius skinned humanoid anatomy replaces segmented primitive humans: integrated face/neck, articulated fingers and weighted joint deformation, source hair and eyes.
- Retargeted helm grips use the actual hand attachment transforms. Helm location is adjusted for the authored body's reach; wheel size and balanced turn cycle are retained. Source foot vertices are checked against the deck.
- Ocean surface, waterline, hull foam and underwater depth cues are explicit. Mechanical/underwater illustrations use an intentional near-side surface cutaway, not a claim of event footage.
- Surfer recovery is above/outside the board; underwater pull stays beside it, retaining the existing stroke-cycle timing. Every native frame checks actual skinned arm/finger and full-body triangles against the board.
- The free diver has mask, snorkel, weights and long fins, no tank/regulator. The line-entanglement reconstruction is retained, not reinterpreted as an attack.

## Verification scope
`THREE_NATIVE_CHECKS.json` lists the applicable checks per shot, not invented zero-results for untested pairs. Rudder scenes retain explicit body/jaw-to-blade and paired-orca checks where applicable. Native decoding, exact timeline, immutable script and audio payload are independently checked. Technical passes do not constitute automated artistic approval or a claim of continuous subjective listening.

## Sources
Original licensed source archive, creator links, CC0 license, footage attribution, fonts and Spanish nonspoken safety correction are in `CREDITS_AND_SOURCES.md`.
''')
old=D/'Something_That_Plans_REVISION2_CANDIDATE.mp4';new=D/'Something_That_Plans_R4_CHARACTER_OCEAN_REBUILD_2026-11-06.mp4';old.rename(new)
r=json.loads((D/'CANDIDATE_RECEIPT.json').read_text());assert hashlib.sha256(new.read_bytes()).hexdigest()==r['sha256'];r.update({'file':new.name,'renamed_from':old.name,'edition':'R4 authored skinned characters / ocean / board contacts','rename_only_no_reencode':True});(D/'CANDIDATE_RECEIPT.json').write_text(json.dumps(r,indent=2))
print('R4 complete release support and exact native checks',new.name,new.stat().st_size)
