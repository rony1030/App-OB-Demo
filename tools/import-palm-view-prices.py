"""Build Palm View availability JSON from the two current price-list PDFs.

This is intentionally a small, repeatable bridge: replace the PDFs in the source
folder, run this script again, and compare the generated JSON before publishing.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path(r"C:\Users\Rony\Downloads\palm view")
OUTPUT = ROOT / "lib" / "data" / "palm-view-availability.json"


def money(value: str) -> float | None:
    value = value.replace(",", "").strip()
    try:
        parsed = float(value)
    except ValueError:
        return None
    return parsed if parsed > 0 else None


def parse_line(line: str, stage: int, stage_label: str, delivery: str, source: str, tower: int):
    tokens = line.split()
    if not tokens or not re.fullmatch(r"\d{3}", tokens[0]):
        return None

    unit = tokens[0]
    type_index = next((i for i, token in enumerate(tokens[1:], 1) if re.fullmatch(r"[A-Z]", token) and i + 3 < len(tokens) and re.fullmatch(r"\d+", tokens[i + 1])), None)
    if type_index is None:
        return None

    bedroom = int(tokens[type_index + 1])
    bath_token = tokens[type_index + 2]
    area_index = type_index + 3
    if area_index < len(tokens) and tokens[area_index].startswith("."):
        bath_token += tokens[area_index]
        area_index += 1
    bath = float(bath_token)
    area = money(tokens[area_index])
    if area is None:
        return None

    tail = tokens[area_index + 1:]
    status_text = " ".join(tail).upper()
    status = "available"
    if "VENDIDO" in status_text or "SOLD" in status_text:
        status = "sold"
    elif "RESERVADO" in status_text or "RESERVED" in status_text:
        status = "reserved"

    price = None
    if status == "available":
        for token in reversed(tail):
            if re.fullmatch(r"[\d,]+(?:\.\d+)?", token):
                price = money(token)
                break

    view_tokens = tokens[1:type_index]
    view = " ".join(view_tokens).replace("/", " / ")
    return {
        "unit": unit,
        "stage": stage,
        "stageLabel": stage_label,
        "delivery": delivery,
        "tower": f"Torre {tower}",
        "view": view,
        "type": tokens[type_index],
        "bedrooms": bedroom,
        "bathrooms": bath,
        "areaSqm": area,
        "price": price,
        "status": status,
        "source": source,
    }


def parse_pdf(path: Path, stage: int, stage_label: str, delivery: str):
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            tower_match = re.search(r"TORRE\s+(\d)", text.upper())
            tower = int(tower_match.group(1)) if tower_match else (3 if stage == 2 else 1)
            for line in text.splitlines():
                row = parse_line(line, stage, stage_label, delivery, path.name, tower)
                if row:
                    rows.append(row)
    return rows


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    sources = [
        (source / "Torre 1y2 Lista de Precios - 01 Septiembre.pdf", 1, "Primera etapa", "Abril 2028"),
        (source / "Torre 3 Lista de Precios - 01 Septiembre.pdf", 2, "Segunda etapa", "Agosto 2029"),
    ]
    rows = []
    for path, stage, label, delivery in sources:
        if not path.exists():
            raise SystemExit(f"Missing source PDF: {path}")
        rows.extend(parse_pdf(path, stage, label, delivery))

    previous = None
    if OUTPUT.exists():
        previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
    payload = {
        "project": "Palm View",
        "currency": "USD",
        "updatedAt": "2026-09-01",
        "sources": [path.name for path, *_ in sources],
        "units": rows,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(rows)} units to {OUTPUT}")
    if previous:
        key = lambda item: f"{item.get('tower')}::{item.get('unit')}"
        before = {key(item): item for item in previous.get("units", [])}
        after = {key(item): item for item in rows}
        added = sorted(set(after) - set(before))
        removed = sorted(set(before) - set(after))
        changed = sorted(item_key for item_key in set(before) & set(after) if before[item_key] != after[item_key])
        print(f"Changes: {len(added)} added, {len(removed)} removed, {len(changed)} changed")
        if added:
            print("Added:", ", ".join(added))
        if removed:
            print("Removed:", ", ".join(removed))
        if changed:
            print("Changed:", ", ".join(changed))


if __name__ == "__main__":
    main()
