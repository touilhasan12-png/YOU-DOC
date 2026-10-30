#!/usr/bin/env python3
"""RENDER PROBE -- measures the machine before promising anything, and refuses to run 1080p on <4GB RAM."""
import os, shutil, sys
ram_gb = (os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES')) / 1e9
cpus = os.cpu_count()
ff = shutil.which('ffmpeg')
print(f"RAM {ram_gb:.1f} GB | vCPU {cpus} | ffmpeg {'yes' if ff else 'NO'}")
if ram_gb < 4:
    print("RESULT: preview-only (480p / short). Full 1080p MUST run on GitHub Actions.")
    sys.exit(0)
print("RESULT: 1080p feasible locally.")
