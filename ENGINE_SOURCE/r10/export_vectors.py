"""Export source SVG artwork on the GitHub worker, never rasterize locally."""
import os,re,zipfile
from pathlib import Path
if os.environ.get('GITHUB_ACTIONS')!='true':raise RuntimeError('GitHub-only asset production')
p=Path('ENGINE_SOURCE/r10');out=Path('R10_DELIVERY');out.mkdir(exist_ok=True);source=(p/'web/vector.js').read_text();d=p/'exported_vectors';d.mkdir(exist_ok=True)
for name in ['orca','blue','shark','pilot','dolphin']:
 body=re.search(r"\b"+name+r":'([^']+)'",source).group(1)
 fill={'blue':'#527f95','shark':'#799397','dolphin':'#638b91','pilot':'#233c47','orca':'#15313e'}[name]
 extra='<path d="M-336 -44 C-332 -62 -293 -73 -264 -63 Q-243 -55 -260 -39 Q-297 -23 -326 -30Z" fill="#eee8d5"/>' if name=='orca' else ''
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="3840" height="2160" viewBox="-600 -340 1240 697.5"><title>Original programmatic {name} cutout source</title><path d="{body}" fill="{fill}" stroke="#88aaa6" stroke-width="1.5"/><path d="M-70 -88 Q-12 -216 12 -182 Q15 -104 95 -61Z" fill="{fill}"/><path d="M-210 54 Q-140 148 -42 156 Q-82 73 -128 37Z" fill="{fill}"/><path d="M455 -6 Q495 -47 579 -59 Q564 -10 504 8 Q567 38 570 65 Q497 49 453 11Z" fill="{fill}"/>{extra}<circle cx="-400" cy="-29" r="4.7" fill="#061923"/></svg>'''
 (d/(name+'.svg')).write_text(svg)
with zipfile.ZipFile(out/'VECTOR_ARTWORK_AND_SOURCE.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in d.glob('*.svg'):z.write(f,'svg/'+f.name)
 for f in [p/'web/vector.js',p/'web/index.html',p/'REQUEST.json',p/'render_vector.mjs']:z.write(f,'source/'+f.name)
print('Resolution-independent original SVG source artwork exported')
