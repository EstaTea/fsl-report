#!/usr/bin/env python3
"""当 github.com 直连不通时，用 GitHub Git Data API 推送本地提交。
用法: python3 push_via_api.py <repo_dir> <base_sha> <message>
- 以远端 base_sha 的 tree 为基底（base_tree），只覆盖本地相对远端变更的文件
- 不删除远端独有文件，不改动账号配置
"""
import base64
import json
import os
import subprocess
import sys

REPO = sys.argv[1]
BASE = sys.argv[2]
MSG = sys.argv[3]
API = "repos/EstaTea/fsl-report"
EXPLICIT = sys.argv[4:]  # 显式指定待推送文件（优先）


def gh(args, **kw):
    return subprocess.run(["gh", "api"] + args, capture_output=True, text=True, **kw)


os.chdir(REPO)

# 1. 待提交文件清单
if EXPLICIT:
    files = [f for f in EXPLICIT if f.strip()]
else:
    # 回退：相对本地缓存 origin/main 的差异（仅当 origin/main 是最新时可靠）
    diff = subprocess.run(
        ["git", "-c", "core.quotepath=false", "diff", "--name-only", "-z",
         "--diff-filter=AM", "origin/main", "main"],
        capture_output=True, text=True).stdout
    files = [f for f in diff.split("\0") if f.strip()]
print(f"[1] 待提交文件 {len(files)} 个")

# 2. 逐个创建 blob
tree = []
for i, path in enumerate(files, 1):
    with open(path, "rb") as fh:
        raw = fh.read()
    mode = "100755" if os.access(path, os.X_OK) else "100644"
    body = {"content": base64.b64encode(raw).decode(), "encoding": "base64"}
    tmp = "/tmp/_blob_body.json"
    with open(tmp, "w") as fh:
        json.dump(body, fh)
    size_mb = len(raw) / 1024 / 1024
    r = gh(["-X", "POST", f"{API}/git/blobs", "--input", tmp, "--jq", ".sha"])
    if r.returncode != 0:
        print(f"  !! blob 失败 {path}: {r.stderr[:300]}")
        sys.exit(1)
    sha = r.stdout.strip()
    print(f"  [{i}/{len(files)}] {size_mb:5.2f}MB {sha[:8]}  {path}")
    tree.append({"path": path, "mode": mode, "type": "blob", "sha": sha})

# 3. 以远端 tree 为基底创建新 tree（base_tree 保证远端独有文件不丢）
base_tree = gh([f"{API}/git/commits/{BASE}", "--jq", ".tree.sha"]).stdout.strip()
print(f"[2] base_tree={base_tree[:8]}")
with open("/tmp/_tree_body.json", "w") as fh:
    json.dump({"base_tree": base_tree, "tree": tree}, fh)
r = gh(["-X", "POST", f"{API}/git/trees", "--input", "/tmp/_tree_body.json", "--jq", ".sha"])
if r.returncode != 0:
    print("!! tree 失败:", r.stderr[:500]); sys.exit(1)
new_tree = r.stdout.strip()
print(f"[3] new_tree={new_tree[:8]}")

# 4. 创建 commit
with open("/tmp/_commit_body.json", "w") as fh:
    json.dump({"message": MSG, "tree": new_tree, "parents": [BASE]}, fh)
r = gh(["-X", "POST", f"{API}/git/commits", "--input", "/tmp/_commit_body.json", "--jq", ".sha"])
if r.returncode != 0:
    print("!! commit 失败:", r.stderr[:500]); sys.exit(1)
new_commit = r.stdout.strip()
print(f"[4] new_commit={new_commit}")

# 5. 更新 main ref
with open("/tmp/_ref_body.json", "w") as fh:
    json.dump({"sha": new_commit, "force": False}, fh)
r = gh(["-X", "PATCH", f"{API}/git/refs/heads/main", "--input", "/tmp/_ref_body.json", "--jq", ".object.sha"])
if r.returncode != 0:
    print("!! ref 更新失败:", r.stderr[:500]); sys.exit(1)
print(f"[5] main -> {r.stdout.strip()}  推送完成")
