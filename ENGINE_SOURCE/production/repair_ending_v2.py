"""GitHub-only ending repair from the untouched original, NOT from the rejected stretch.
Two moderate time-domain WSOLA stages replace the long-window phase-vocoder algorithm.
No voice regeneration, pitch shift, noise gate, word deletion or second slowdown of rejected audio.
"""
import os,json,hashlib,subprocess
from pathlib import Path
import imageio_ffmpeg
P=Path(__file__).resolve().parents[1];FF=imageio_ffmpeg.get_ffmpeg_exe()

def repair():
 assert os.environ.get('GITHUB_ACTIONS')=='true','Audio generation is restricted to GitHub Actions'
 d=P/'audio_revision_ending';d.mkdir(exist_ok=True);q=P/'qa/ending_comparison';q.mkdir(parents=True,exist_ok=True)
 source=P/'locked_audio/approved_master.m4a';assert hashlib.md5(source.read_bytes()).hexdigest()=='2ea20c57c19ad6298c0fc35171ca5a55'
 cut=649.2;total=15969/24;dur=total-cut;output=d/'full_mix_normal_ending.m4a'
 def ff(args):subprocess.run([FF,'-hide_banner','-v','error','-threads','1','-y',*args],check=True)
 # atempo is time-domain waveform-similarity overlap-add, not the rejected spectral phase vocoder.
 # Pad/trim applies only to the final quiet tail. Last spoken word maps to 663.544, >1.8s before endpoint.
 graph=f'[0:a]asplit=2[a][b];[a]atrim=end={cut},asetpts=PTS-STARTPTS[p];[b]atrim=start={cut},asetpts=PTS-STARTPTS,atempo=0.8,atempo=0.8,apad=whole_dur={dur},atrim=duration={dur},afade=t=out:st={dur-.65}:d=0.65[e];[p][e]concat=n=2:v=0:a=1[out]'
 ff(['-i',str(source),'-filter_complex',graph,'-map','[out]','-ar','48000','-ac','2','-c:a','aac','-b:a','320k','-movflags','+faststart',str(output)])
 for name,path in [('ORIGINAL_END_UNPROCESSED',source),('REPAIRED_END_WSOLAx2',output),('REJECTED_END_DO_NOT_USE',P/'reference_audio/REJECTED_DO_NOT_MUX.m4a')]:
  ff(['-ss',str(cut),'-i',str(path),'-vn','-c:a','flac',str(q/(name+'.flac'))])
 ff(['-i',str(output),'-f','null','-'])
 manifest={'pipeline':'untouched original master -> two time-domain WSOLA stages -> one AAC encode','tempo_after_cut':.64,'pitch_factor':1,'new_voice_generated':False,'speech_or_text_deleted':False,'cut_in_existing_pause_seconds':cut,'new_video_frames':15969,'new_audio_duration':total,'new_derivative':'audio_revision_ending/full_mix_normal_ending.m4a','sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'status':'TECHNICAL CANDIDATE: audible comparison required; numeric checks are not a claim of human listening','not_used':'Rejected long-window Rubber Band / phase-vocoder derivative','rate_measurements':[{'paragraph':31,'revised_wpm':152.5828},{'paragraph':32,'revised_wpm':164.6554}]}
 (d/'ENDING_REVISION.json').write_text(json.dumps(manifest,indent=2));return manifest
if __name__=='__main__':repair()
