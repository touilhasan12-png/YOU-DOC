#!/usr/bin/env python3
"""Rule 17: every on-screen number must carry a source. Fails if any entry lacks one."""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
src = (ROOT / "src" / "data" / "chokepoints.ts").read_text()
blocks = re.split(r"\n  \{", src)[1:]
bad = []
for b in blocks:
    m = re.search(r"id:\s*'([^']+)'", b)
    if not m:
        continue
    cid = m.group(1)
    sm = re.search(r"sources:\s*\[([^\]]*)\]", b)
    if not sm or not sm.group(1).strip():
        bad.append(cid)
if bad:
    print("FAIL: missing sources:", bad); sys.exit(1)
print(f"PASS: {len(blocks)} entries, all sourced")
