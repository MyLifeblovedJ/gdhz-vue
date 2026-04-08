import json

with open(r'd:\dev\projects\gdhz-vue\apps\gdhz-vue-2999\docs\data', 'r', encoding='utf-8') as f:
    d = json.load(f)

pts = d['points']
print(f'Total points: {len(pts)}')
print()

for i, p in enumerate(pts):
    t = p['time']
    if '09-22' in t or '09-23' in t or '09-24' in t:
        fc = p.get('forecast', [])
        fc_count = len(fc)
        china_fc = [x for x in fc if x['tm'] == '\u4e2d\u56fd']
        china_fc_pts = china_fc[0]['forecastpoints'] if china_fc else []
        r7 = p.get('radius7', '')
        r10 = p.get('radius10', '')
        r12 = p.get('radius12', '')
        print(f'Point[{i}]: time={t}')
        print(f'  lng={p["lng"]}, lat={p["lat"]}, strong={p["strong"]}')
        print(f'  power={p["power"]}, speed={p["speed"]}, pressure={p["pressure"]}')
        print(f'  movespeed={p.get("movespeed","")}, movedirection={p.get("movedirection","")}')
        print(f'  radius7={r7}, radius10={r10}, radius12={r12}')
        print(f'  forecasts={fc_count}, china_fc_pts={len(china_fc_pts)}')
        if china_fc_pts:
            for fp in china_fc_pts[:4]:
                print(f'    FC: time={fp["time"]}, lng={fp["lng"]}, lat={fp["lat"]}')
            if len(china_fc_pts) > 4:
                print(f'    ... and {len(china_fc_pts)-4} more')
        print()
