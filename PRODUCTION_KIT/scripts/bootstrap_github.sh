#!/usr/bin/env bash
# Network/source transfer only; never render locally. No force push or branch deletion.
set -euo pipefail
set +x
KIT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN_FILE="${GH_TOKEN_FILE:-/tmp/gh_token}"
[[ -s "$TOKEN_FILE" ]] || { echo 'Provide the approved token privately in /tmp/gh_token first.' >&2; exit 2; }
chmod 600 "$TOKEN_FILE"
export GH_TOKEN_FILE="$TOKEN_FILE"
REPO="${1:-YOU-DOC}"
[[ "$REPO" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo 'Invalid repository name'; exit 2; }
HEADERS="$(mktemp)";ASKPASS="$(mktemp)";BODY="$(mktemp)"
trap 'rm -f "$HEADERS" "$ASKPASS" "$BODY"' EXIT
chmod 600 "$HEADERS" "$BODY"
printf 'Authorization: Bearer %s\nAccept: application/vnd.github+json\n' "$(cat "$TOKEN_FILE")" > "$HEADERS"
code=$(curl -sS -o "$BODY" -w '%{http_code}' -H @"$HEADERS" https://api.github.com/user)
[[ "$code" == 200 ]] || { echo "GitHub authentication HTTP $code; check token permissions/expiry, not a missing connector."; exit 3; }
OWNER=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["login"])' "$BODY")
code=$(curl -sS -o "$BODY" -w '%{http_code}' -H @"$HEADERS" "https://api.github.com/repos/$OWNER/$REPO")
if [[ "$code" == 404 ]]; then
 python3 -c 'import json,sys;print(json.dumps({"name":sys.argv[1],"private":False,"auto_init":True}))' "$REPO" > "$BODY"
 code=$(curl -sS -o "$BODY.response" -w '%{http_code}' -X POST -H @"$HEADERS" -H 'Content-Type: application/json' https://api.github.com/user/repos --data-binary @"$BODY")
 rm -f "$BODY.response"
 [[ "$code" == 201 ]] || { echo "Repository creation HTTP $code; do not overwrite an existing repo."; exit 4; }
elif [[ "$code" != 200 ]]; then echo "Repository lookup HTTP $code; do not interpret authentication/rate errors as missing repository.";exit 4;fi
BRANCH="${KIT_BRANCH:-kit-opening-test-$(date -u +%Y%m%d%H%M%S)}"
WORK_BASE="${KIT_WORK_BASE:-$HOME/.cache/documentary-kit-runs}"
mkdir -p "$WORK_BASE"
python3 - "$WORK_BASE" <<'CHECK'
import shutil,sys
assert shutil.disk_usage(sys.argv[1]).free>6*1024**3,'Need at least 6GiB of disk for the complete kit; do not copy large assets into a small /tmp tmpfs.'
CHECK
WORK="$(mktemp -d "$WORK_BASE/run.XXXXXX")"
python3 - "$KIT_ROOT" "$WORK/PRODUCTION_KIT" <<'PY'
import shutil,sys
shutil.copytree(sys.argv[1],sys.argv[2],ignore=shutil.ignore_patterns('node_modules','__pycache__','*.pyc','.git','generated','*.log','downloaded','RUN_STATE.json','RUN_REPORT.json','RUN_ARTIFACTS.json'))
PY
mkdir -p "$WORK/.github/workflows";cp "$KIT_ROOT/workflows/kit_opening_test.yml" "$WORK/.github/workflows/kit_opening_test.yml"
cat > "$ASKPASS" <<'SH'
#!/bin/sh
case "$1" in *Username*) printf '%s' x-access-token;; *) cat "$GH_TOKEN_FILE";; esac
SH
chmod 700 "$ASKPASS"
export GIT_ASKPASS="$ASKPASS" GIT_TERMINAL_PROMPT=0
cd "$WORK";git init -q;git checkout -q -b "$BRANCH";git config user.name 'Production Kit';git config user.email 'production-kit@users.noreply.github.com'
git remote add origin "https://github.com/$OWNER/$REPO.git"
# A root commit on a NEW isolated branch is portable and never replaces main/history.
git add PRODUCTION_KIT .github/workflows/kit_opening_test.yml
git commit -q -m 'Self-contained original documentary engine opening test'
git push -u origin "$BRANCH"
python3 - "$OWNER" "$REPO" "$BRANCH" "$(git rev-parse HEAD)" "$WORK" "$KIT_ROOT" <<'PY'
import json,sys,pathlib
owner,repo,branch,sha,work,root=sys.argv[1:];p=pathlib.Path(root)/'RUN_STATE.json';p.write_text(json.dumps({'owner':owner,'repo':repo,'branch':branch,'source_commit':sha,'worktree':work},indent=2));print('Pushed isolated kit branch:',owner+'/'+repo,branch,sha)
PY
# Push on any branch with this filename starts the workflow. Watch its exact SHA.
python3 "$KIT_ROOT/scripts/watch_run.py"
