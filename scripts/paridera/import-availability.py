"""Import Paridera Investors availability PDFs into lib/data/paridera-inventory.json.

Usage:
    python scripts/paridera/import-availability.py ["C:/Proyectos OSvaldo"] [--sql]

Reads "2. DISPONIBILIDAD & PRECIOS/*.pdf" for each phase folder, keeps every unit
for the counts and ships only units still on the market (Disponible/Reservado).
With --sql it also writes supabase/migrations/<date>_paridera_inventory_<as-of>.sql,
which upserts every unit (sold ones included), its typology and the project
counters, so each new availability PDF becomes one reviewable migration.
Requires PyMuPDF (pip install pymupdf).
"""
import collections
import datetime
import glob
import json
import os
import re
import sys

import fitz

ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
WRITE_SQL = '--sql' in sys.argv[1:]
BASE = ARGS[0] if ARGS else 'C:/Proyectos OSvaldo'
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'data', 'paridera-inventory.json')
PHASES = [('sunrise', '1. SUNRISE*'), ('sunset', '2. SUNSET*'), ('beach', '3. BEACH*'),
          ('villas', '4. VILLAS*'), ('golf', '5. BONITA GOLF*')]
STATUSES = ('Disponible', 'Vendido', 'Reservado', 'Bloqueado')


def money(s):
    m = re.search(r'[\d,]+(?:\.\d+)?', s or '')
    return float(m.group().replace(',', '')) if m else None


def m2(s):
    m = re.search(r'([\d,]+(?:\.\d+)?)\s*m', s or '')
    return round(float(m.group(1).replace(',', '')), 1) if m else None


def bedrooms(typ):
    t = typ.lower()
    if t.startswith('4'):
        return '4 Hab'
    if t.startswith('3'):
        return '3 Hab'
    if 'family' in t or '+fam' in t.replace(' ', ''):
        return '2 Hab + Family' if t.startswith('2') else '1 Hab + Family'
    if t.startswith('2h (1') or t.startswith('2 hab (1') or t.startswith('1'):
        return '1 Hab + Servicio'
    return '2 Hab'


def view(v):
    # The PDFs truncate long cells ("AR, GOLF Y PLAY"), so match by keyword.
    v = (v or '').strip().upper()
    if not v:
        return ''
    parts = [n for n, on in (('Mar', 'MAR' in v or v.startswith('AR')), ('Golf', 'GOLF' in v), ('Playa', 'PLAY' in v)) if on]
    if len(parts) == 1:
        return parts[0]
    words = [parts[0]] + [w.lower() for w in parts[1:]]
    return ', '.join(words[:-1]) + ' y ' + words[-1]


def rows_for(pdf):
    for page in fitz.open(pdf):
        for table in page.find_tables().tables:
            for row in table.extract():
                row = [(c or '').replace('\n', ' ').strip() for c in row]
                status = next((c for c in row if c in STATUSES), None)
                if status:
                    yield row, status


units, as_of = [], None
for key, pattern in PHASES:
    pdfs = glob.glob(os.path.join(BASE, pattern, '2. DISPON*', '*.pdf'))
    if not pdfs:
        sys.exit(f'No availability PDF found for {key} under {BASE}')
    date = re.search(r'(\d{2})[.-](\d{2})[.-](\d{4})', os.path.basename(pdfs[0]))
    if date:
        as_of = max(as_of or '', f'{date.group(3)}-{date.group(2)}-{date.group(1)}')
    for r, status in rows_for(pdfs[0]):
        if key == 'villas':
            level, code, typ, vw, it, te, ga, to = r[1], r[2], r[4], r[5], r[6], r[7], r[8], r[9]
        elif key == 'golf':
            level, code, typ, vw, it, te, ga, to = r[0], r[1], r[2], '', r[4], r[5], r[6], r[7]
        else:
            level, code, typ, vw, it, te, ga, to = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]
        typ = re.sub(r'\s+', ' ', typ).strip()
        terrace = m2(te)
        if key == 'villas' and typ.startswith('5') and terrace and terrace < 100:
            # The PDF cell is truncated ("44.45 m²"); the brochure gives 102.50 + 41.95.
            terrace = 144.45
        units.append({
            'phase': key,
            'code': code.replace('Villa', 'Villa ') if key == 'villas' else code,
            'level': int(level) if level.isdigit() else level,
            'typology': typ,
            'bedrooms': 'Villa 4 Hab' if key == 'villas' else bedrooms(typ),
            'view': view(vw),
            'interiorM2': m2(it),
            'terraceM2': terrace,
            'gardenM2': m2(ga),
            'totalM2': m2(to),
            'price': next((money(c) for c in r if '$' in c), None) if status != 'Vendido' else None,
            'status': status,
        })

dupes = [k for k, n in collections.Counter((u['phase'], u['code']) for u in units).items() if n > 1]
no_price = [(u['phase'], u['code']) for u in units if u['status'] == 'Disponible' and not u['price']]
if dupes or no_price:
    sys.exit(f'Check the PDFs: duplicated units {dupes}, available without price {no_price}')

counts = {}
for u in units:
    c = counts.setdefault(u['phase'], {'total': 0, 'Disponible': 0, 'Reservado': 0, 'Vendido': 0})
    c['total'] += 1
    c[u['status']] = c.get(u['status'], 0) + 1

with open(OUT, 'w', encoding='utf-8') as fh:
    json.dump({'asOf': as_of, 'source': 'Disponibilidad & Precios (Paridera Investors)', 'counts': counts,
               'units': [u for u in units if u['status'] != 'Vendido']}, fh, ensure_ascii=False, separators=(',', ':'))

for key, c in counts.items():
    print(f"{key:8} total {c['total']:4}  disponibles {c['Disponible']:3}  reservadas {c['Reservado']:3}  vendidas {c['Vendido']:4}")
print('as of', as_of, '->', os.path.normpath(OUT))


SLUGS = {'sunrise': 'sunrise-bonita-beach', 'sunset': 'sunset-bonita-beach', 'beach': 'beach-bonita-beach',
         'villas': 'villas-bonita-beach', 'golf': 'bonita-golf'}
DB_STATUS = {'Disponible': 'available', 'Reservado': 'reserved', 'Vendido': 'sold', 'Bloqueado': 'blocked'}


def q(v):
    if v is None:
        return 'null'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def write_sql():
    root = os.path.join(os.path.dirname(__file__), '..', '..', 'supabase', 'migrations')
    # Stamp with the generation time so it always runs after the onboarding migrations.
    stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    path = os.path.join(root, f'{stamp}_paridera_inventory_{as_of}.sql')
    typologies = {}
    for u in units:
        k = (u['phase'], u['typology'])
        t = typologies.setdefault(k, collections.Counter())
        t[(u['interiorM2'], u['terraceM2'], u['totalM2'])] += 1
    typ_rows, unit_rows = [], []
    for (phase, name), sizes in sorted(typologies.items()):
        (indoor, terrace, total), _ = sizes.most_common(1)[0]
        beds = re.match(r'\s*(\d)', name)
        bedrooms = int(beds.group(1)) if beds else 0
        if re.match(r'2H \(1|2 Hab \(1', name):
            bedrooms = 1  # "2H (1 Hab + Hab de Servicio)" is a one-bedroom plus service room
        typ_rows.append(f"    ({q(SLUGS[phase])}, {q(name)}, {bedrooms}, {q(indoor)}, {q(terrace)}, {q(total or (indoor or 0) + (terrace or 0) or 1)})")
    for u in units:
        notes = json.dumps({k: v for k, v in {'view': u['view'], 'interior_m2': u['interiorM2'], 'terrace_m2': u['terraceM2'],
                                               'garden_m2': u['gardenM2'], 'total_m2': u['totalM2']}.items() if v}, ensure_ascii=False)
        unit_rows.append(f"    ({q(SLUGS[u['phase']])}, {q(u['code'])}, {q(u['typology'])}, {q(u['level'] if isinstance(u['level'], int) else None)}, "
                         f"{q(u['price'] or 0)}, {q(DB_STATUS[u['status']])}, {q(notes)})")
    project_rows = []
    for key, c in counts.items():
        prices = [u['price'] for u in units if u['phase'] == key and u['status'] == 'Disponible' and u['price']]
        project_rows.append(f"    ({q(SLUGS[key])}, {c['total']}, {c['Disponible']}, {q(min(prices) if prices else None)})")
    sql = f"""-- Paridera inventory from the availability PDFs dated {as_of}.
-- Generated by scripts/paridera/import-availability.py --sql. Do not edit by hand:
-- regenerate from the next PDF instead. Idempotent (upserts by natural keys).

with source(project_slug, name, bedrooms, indoor_sqm, terrace_sqm, total_sqm) as (
  values
{',\n'.join(typ_rows)}
)
insert into public.typologies (organization_id, project_id, name, bedrooms, indoor_sqm, terrace_sqm, total_sqm)
select p.organization_id, p.id, source.name, source.bedrooms, source.indoor_sqm, source.terrace_sqm, source.total_sqm
from source
join public.projects p on p.slug = source.project_slug
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
on conflict (project_id, name) do update
set bedrooms = excluded.bedrooms,
    indoor_sqm = excluded.indoor_sqm,
    terrace_sqm = excluded.terrace_sqm,
    total_sqm = excluded.total_sqm,
    updated_at = now();

with source(project_slug, unit_code, typology, floor_level, list_price, status, notes) as (
  values
{',\n'.join(unit_rows)}
)
insert into public.units (
  organization_id, project_id, typology_id, unit_code, floor_level, list_price, currency, status, is_public, notes
)
select p.organization_id, p.id, t.id, source.unit_code, source.floor_level, source.list_price, 'USD', source.status,
       source.status <> 'sold', source.notes
from source
join public.projects p on p.slug = source.project_slug
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
left join public.typologies t on t.project_id = p.id and t.name = source.typology
on conflict (project_id, unit_code) do update
set typology_id = excluded.typology_id,
    floor_level = excluded.floor_level,
    list_price = excluded.list_price,
    status = excluded.status,
    is_public = excluded.is_public,
    notes = excluded.notes,
    updated_at = now();

with source(project_slug, total, available, from_price) as (
  values
{',\n'.join(project_rows)}
)
update public.projects p
set inventory_total_declared = source.total,
    inventory_available_declared = source.available,
    starting_price = coalesce(source.from_price, p.starting_price),
    inventory_is_complete = true,
    inventory_updated_at = {q(as_of)}::timestamptz,
    updated_at = now()
from source, public.organizations owner
where p.slug = source.project_slug
  and owner.id = p.organization_id
  and owner.slug = 'paridera-osvaldo-bello';
"""
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(sql)
    print('sql ->', os.path.normpath(path), f'({len(units)} units, {len(typ_rows)} typologies)')


if WRITE_SQL:
    write_sql()
