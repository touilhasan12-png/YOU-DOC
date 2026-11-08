from pathlib import Path
import shutil
R=Path(__file__).resolve().parents[1];src=R/'reference/ENGINE_SOURCE/r15';out=R/'runtime/engine';out.mkdir(exist_ok=True)
for n in ['scene.js','orca_jaw.js','shark.js','risk.js','species.js','blue_whale.js','app.js','illustrations.js','index.html','illustrations.html']:shutil.copyfile(src/n,out/n)
# Explicit intentional-blur policy. Geometric AA and environment lighting are not image blur.
p=out/'scene.js';p.write_text(p.read_text().replace('scene.fog=new T.FogExp2(0x074967,.021)','scene.fog=null').replace('else scene.fog=new T.FogExp2(0x9db2bd,.00065)','else scene.fog=null'))
p=out/'app.js';p.write_text(p.read_text().replace('S.scene.fog.density=.012','if(S.scene.fog)S.scene.fog.density=.012').replace('S.scene.fog.density=.00045','if(S.scene.fog)S.scene.fog.density=.00045'))
p=out/'index.html';p.write_text(p.read_text().replace('text-shadow:0 2px 8px #052938','text-shadow:0 2px 0 #052938'))
# Small test-only integration points; production/reference source bytes remain immutable.
p=out/'app.js';p.write_text(p.read_text()+"\nwindow.kitTitle=title;window.kitStage=S;\n")
p=out/'illustrations.js';p.write_text(p.read_text().replace("text('Human activity reaches the whole population.',108,620", "text(t>=8.75?'Not a monster. Something that plans.':'Human activity reaches the whole population.',108,620")+"\nwindow.kitClosing=()=>{};\n")
# Ready original human source is included. R15 test intentionally has no human actor;
# R5/R9 people runtime must use the real GLB, never R15's unused empty placeholder.
h=R/'reference/ENGINE_SOURCE/r5/production_assets';h.mkdir(parents=True,exist_ok=True)
shutil.copyfile(R/'assets/human/snow_clean.glb',h/'snow_clean.glb')
print('Prepared current sharp runtime and original human GLB without editing reference sources.')
