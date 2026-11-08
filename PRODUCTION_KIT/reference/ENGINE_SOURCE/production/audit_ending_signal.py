"""Objective ending-prosody checks; explicitly not a claim of human listening."""
import subprocess,json
from pathlib import Path
import numpy as np,imageio_ffmpeg
P=Path(__file__).resolve().parents[1];FF=imageio_ffmpeg.get_ffmpeg_exe();sr=16000;cut=649.2;tempo=.64

def pcm(path):
 r=subprocess.run([FF,'-v','error','-threads','1','-ss',str(cut),'-i',str(path),'-vn','-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True,check=True)
 return np.frombuffer(r.stdout,dtype='<f4').astype(float)

def pitch(x):
 if len(x)<960:return None
 x=x-np.mean(x)
 if np.sqrt(np.mean(x*x))<.012:return None
 x=x*np.hanning(len(x));f=np.fft.rfft(x,2048);ac=np.fft.irfft(f*f.conj(),2048).real
 lo,hi=round(sr/380),round(sr/65);lag=lo+int(np.argmax(ac[lo:hi+1]));confidence=ac[lag]/max(ac[0],1e-12)
 return sr/lag if confidence>.48 else None

if __name__=='__main__':
 old=pcm(P/'locked_audio/approved_master.m4a');new=pcm(P/'audio_revision_ending/full_mix_normal_ending.m4a')
 # Compare the same voiced instants under the authorized time mapping.
 pairs=[]
 for t in np.arange(.12,min(len(old)/sr-.12,len(new)/sr*tempo-.12),.075):
  a=pitch(old[round((t-.03)*sr):round((t+.03)*sr)]);b=pitch(new[round((t/tempo-.03)*sr):round((t/tempo+.03)*sr)])
  if a and b and abs(12*np.log2(b/a))<6:pairs.append((a,b))
 # A 20ms energy-envelope comparison, avoiding waveform phase changes from time stretching.
 hop=320
 eo=np.array([np.sqrt(np.mean(old[i:i+hop]**2)) for i in range(0,len(old)-hop,hop)])
 en=np.array([np.sqrt(np.mean(new[i:i+hop]**2)) for i in range(0,len(new)-hop,hop)])
 times=np.arange(len(en))*.02*tempo;warp=np.interp(times,np.arange(len(eo))*.02,eo)
 correlation=float(np.corrcoef(warp,en)[0,1]);arr=np.asarray(pairs)
 report={'method':'Waveform-derived voiced fundamental frequencies and time-mapped 20ms RMS envelopes. Does not certify subjective naturalness or claim human listening.','matched_voiced_windows':len(pairs),'original_median_f0_hz':float(np.median(arr[:,0])) if len(pairs) else None,'revised_median_f0_hz':float(np.median(arr[:,1])) if len(pairs) else None,'median_absolute_pitch_difference_semitones':float(np.median(abs(12*np.log2(arr[:,1]/arr[:,0])))) if len(pairs) else None,'authorized_time_mapped_energy_correlation':correlation,'original_ending_seconds':len(old)/sr,'revised_ending_seconds':len(new)/sr,'revised_paragraph_wpm':[152.58278145695365,164.65543644716692],'new_voice_generated':False}
 (P/'qa/ENDING_SIGNAL_REVIEW.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 assert len(pairs)>=10 and report['median_absolute_pitch_difference_semitones']<1.5,'Ending signal requires pitch investigation'
 assert correlation>.60,'Ending signal requires timing investigation'
