"""Static exact source-compatibility proof; never a picture or artistic assessment."""
import json,hashlib
from full_film_contract import R,runtime_fingerprint,sha

def validate():
 m=json.loads((R/'production/SCOPED_CORRECTION_SOURCE.json').read_text());s=(R/'web/film.js').read_text()
 assert m['only_changed_picture_key']=='seal_capture'
 assert m['original_branch'].startswith("if(k==='seal_capture'){") and m['corrected_branch'].startswith("if(k==='seal_capture'){")
 assert s.count(m['corrected_branch'])==1 and sha(R/'web/film.js')==m['corrected_film_sha256']
 original=s.replace(m['corrected_branch'],m['original_branch'])
 assert hashlib.sha256(original.encode()).hexdigest()==m['original_film_sha256']
 assert runtime_fingerprint()==m['corrected_runtime_fingerprint']
 assert runtime_fingerprint(m['original_film_sha256'])==m['base_runtime_fingerprint']
 return {'base_runtime_fingerprint':m['base_runtime_fingerprint'],'corrected_runtime_fingerprint':m['corrected_runtime_fingerprint'],'only_changed_picture_key':'seal_capture','exact_unchanged_other_runtime_and_asset_bytes':True,'artistic_approval':False}
if __name__=='__main__':print(json.dumps(validate(),indent=2))
