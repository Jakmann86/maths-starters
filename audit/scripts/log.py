#!/usr/bin/env python3
"""Audit log tool. Reads blocks from stdin and appends to audit/data/*.jsonl,
then re-renders audit/defects.md and audit/coverage.md.

  @@D skill | band | seed | category | severity | status
  OUT: exact printed output (verbatim, one line; use ⏎ for line breaks)
  WRONG: what is wrong
  FIX: suggested fix
  @@R skill | bands(F,C,S or *) | eye-count | status(Clean/Fixed/Needs Joakim/Not covered) | note
  @@S D012 | new status          (update a defect's status)
"""
import json, sys, os, re
root = os.path.join(os.path.dirname(__file__), '..')
DF = os.path.join(root, 'data', 'defects.jsonl'); RF = os.path.join(root, 'data', 'reads.jsonl')
load = lambda p: [json.loads(l) for l in open(p)] if os.path.exists(p) else []
defects, reads = load(DF), load(RF)
cur = None
for line in sys.stdin.read().split('\n'):
    if line.startswith('@@D '):
        f = [x.strip() for x in line[4:].split('|')]
        cur = dict(id='D%03d' % (len(defects) + 1), skill=f[0], band=f[1], seed=f[2], category=f[3], severity=f[4], status=f[5], out='', wrong='', fix='')
        defects.append(cur)
    elif line.startswith('@@R '):
        f = [x.strip() for x in line[4:].split('|')]
        reads.append(dict(skill=f[0], bands=f[1], eye=int(f[2]), status=f[3], note=f[4] if len(f) > 4 else '')); cur = None
    elif line.startswith('@@RR '):
        # @@RR fromIndex toIndex eye  — mark a catalogue range as read (Clean unless a defect says otherwise)
        a, b, e = [int(x) for x in line[5:].split()]
        order = list(dict.fromkeys(k.split('|')[0] for k in json.load(open(os.path.join(root, 'out', 'sweep-summary.json')))['stats']))
        for sk in order[a:b]: reads.append(dict(skill=sk, bands='*', eye=e, status='Clean', note=''))
        cur = None
    elif line.startswith('@@S '):
        f = [x.strip() for x in line[4:].split('|', 1)]
        for d in defects:
            if d['id'] == f[0]: d['status'] = f[1]
        cur = None
    elif cur is not None:
        for k, tag in (('out', 'OUT: '), ('wrong', 'WRONG: '), ('fix', 'FIX: ')):
            if line.startswith(tag): cur[k] = line[len(tag):]
dump = lambda p, rows: open(p, 'w').write(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in rows))
dump(DF, defects); dump(RF, reads)

esc = lambda s: s.replace('|', '\\|')
with open(os.path.join(root, 'defects.md'), 'w') as f:
    f.write('# Defect log\n\nOne entry per defect. Reproduce any entry with `node audit/scripts/show.mjs <skill-id> <band> <seed>` '
            '(the seed keys a PRNG installed over `Math.random`; see `audit/scripts/seed.mjs`). '
            'Printed output is copied verbatim as the LaTeX source; `⏎` marks a line break.\n\n'
            'ID | skill-id | band | seed | category | severity | exact printed output | what is wrong | status | suggested fix\n---|---|---|---|---|---|---|---|---|---\n')
    for d in defects:
        f.write(' | '.join([d['id'], d['skill'], d['band'], str(d['seed']), d['category'], d['severity'], '`' + esc(d['out']).replace('`', "'") + '`', esc(d['wrong']), esc(d['status']), esc(d['fix'])]) + '\n')

sw = os.path.join(root, 'out', 'sweep-summary.json')
stats = json.load(open(sw)) if os.path.exists(sw) else {'seeds': 0, 'stats': {}}
fg = os.path.join(root, 'data', 'figure-coverage.json')
figs = json.load(open(fg)) if os.path.exists(fg) else {}
B = {'F': 'foundation', 'C': 'core', 'S': 'stretch'}
eye, status, notes = {}, {}, {}
rank = {'Not covered': 0, 'Clean': 1, 'Fixed': 2, 'Needs Joakim': 3}
for r in reads:
    for key in stats['stats']:
        sk, band = key.split('|')
        if sk != r['skill']: continue
        if r['bands'] != '*' and band[0].upper() not in r['bands'].split(','): continue
        eye[key] = eye.get(key, 0) + r['eye']
        if r['status'] and (key not in status or rank[r['status']] >= rank[status[key]] or r['status'] == 'Clean' and False): status[key] = r['status']
        if r['note']: notes.setdefault(key, []).append(r['note'])
# a defect on a skill x band decides its status
for d in defects:
    for key in stats['stats']:
        sk, band = key.split('|')
        if sk != d['skill']: continue
        if d['band'] not in ('all', '*') and band not in [b.strip() for b in d['band'].split(',')]: continue
        if key not in eye: continue
        st = 'Needs Joakim' if d['status'].startswith('Needs') else 'Fixed'
        if rank[st] > rank.get(status.get(key, 'Clean'), 1) or status.get(key) == 'Clean': status[key] = st if rank[st] >= rank[status.get(key, 'Clean')] else status[key]
        notes.setdefault(key, [])
        if d['id'] not in notes[key]: notes[key].append(d['id'])
with open(os.path.join(root, 'coverage.md'), 'w') as f:
    f.write('# Coverage\n\nOne row per skill x band. "Mech" = seeds run through the mechanical sweep (`audit/scripts/sweep.mjs`); '
            '"verified stmts" = working-out statements whose arithmetic/equivalence was checked numerically, of all statements seen; '
            '"Eye" = full samples read by eye; "Fig" = figures rendered and measured / screenshots looked at.\n\n'
            'skill-id | band | status | mech seeds | verified stmts | eye | fig measured | fig looked | notes\n---|---|---|---|---|---|---|---|---\n')
    for key, s in stats['stats'].items():
        sk, band = key.split('|')
        fgc = figs.get(key, {})
        f.write(' | '.join([sk, band, status.get(key, 'Not covered'), str(s['n']), '%d/%d' % (s['verified'], s['stmts']), str(eye.get(key, 0)), str(fgc.get('measured', '')), str(fgc.get('looked', '')), ', '.join(notes.get(key, []))]) + '\n')
print('defects', len(defects), 'reads', len(reads), 'covered', len(eye), '/', len(stats['stats']))
