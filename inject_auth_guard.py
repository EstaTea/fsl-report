#!/usr/bin/env python3
'''
批量向所有受保护的 HTML 页面注入 auth-guard.js
跳过 login.html 和 admin.html（不需要守卫自身）
'''
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))

SKIP = {
    'kanban/login.html',
    'kanban/admin.html',
}

GUARD_TAG = '<script src="/fsl-report/auth-guard.js"></script>'
GUARD_MARKER = 'auth-guard.js'

def relative_path(full_path):
    return os.path.relpath(full_path, ROOT).replace(os.sep, '/')

def inject(path):
    rel = relative_path(path)
    if rel in SKIP:
        return 'skip', rel

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    if GUARD_MARKER in content:
        return 'already', rel

    # 注入位置：</head> 之前，或 <body> 之前，或文件头部
    if '</head>' in content:
        content = content.replace('</head>', GUARD_TAG + '\n</head>', 1)
    elif '<body' in content:
        content = re.sub(r'(<body[^>]*>)', r'\1\n' + GUARD_TAG, content, count=1)
    else:
        content = GUARD_TAG + '\n' + content

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return 'injected', rel

results = {'injected': [], 'already': [], 'skip': []}

for dirpath, dirnames, filenames in os.walk(ROOT):
    # 跳过隐藏目录和 node_modules
    dirnames[:] = [d for d in dirnames if not d.startswith('.') and d != 'node_modules']
    for fname in filenames:
        if not fname.endswith('.html'):
            continue
        full = os.path.join(dirpath, fname)
        status, rel = inject(full)
        results[status].append(rel)

print(f'✅ 注入成功 ({len(results["injected"])} 个):')
for p in sorted(results['injected']): print(f'   {p}')

print(f'\n⏭  已有守卫 ({len(results["already"])} 个):')
for p in sorted(results['already']): print(f'   {p}')

print(f'\n🚫 跳过 ({len(results["skip"])} 个):')
for p in sorted(results['skip']): print(f'   {p}')
