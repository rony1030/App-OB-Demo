# Palm View local implementation

## What is already mounted

- Local preview: `/preview-palm-view`.
- Palm View visual preset with the OnEarth-inspired structure: floating capsule navigation, full-bleed hero, editorial sections, image rhythm, green/paper palette, oversized serif headings and responsive mobile layout.
- Real Palm View renders and logos under `public/projects/palm-view/`.
- Availability split by stage and tower, with filters and source date shown to the visitor.
- Reservation/payment explanation, FAQs and broker-access handoff.
- Inventory snapshot generated from the two September price-list PDFs at `lib/data/palm-view-availability.json`.
- Sales progress contrast using 275 official apartments: 102 available, 22 reserved and 150 sold in the imported snapshot; one unit remains pending source confirmation.
- Coral Golf Resort and Palm View amenity groups with inline SVG icons, 3D plans, typologies, Homebelike operation, investment benefits, rentability reference and finishes.

## Updating availability later

Replace the two PDFs in `C:\Users\Rony\Downloads\palm view` and run:

```text
C:\Users\Rony\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe tools/import-palm-view-prices.py
```

The importer regenerates the structured inventory and prints added, removed and changed units against the previous snapshot. This keeps the landing, proposals and dossiers working from unit records instead of reading a PDF at request time.

Important: the browser does not read the PDF directly. The PDF is the source document; the importer converts it into unit records with stage, tower, unit number, type, bedrooms, bathrooms, area, view, price and status. Only records with status `available` are published by the Palm View landing. This prevents reserved or sold units from appearing as purchasable inventory.

When the real Master Broker is created, the operational flow should be:

1. Veronica or Osvaldo uploads the new price-list PDFs in the Master Broker availability update area.
2. The system validates that the files are the Palm View price lists and extracts both stages.
3. The system compares the new snapshot with the previous one and shows added, removed, price-changed and status-changed units before confirming.
4. On confirmation, the project inventory is updated in Supabase, the landing reads the new available units, and proposals/dossiers use the same current records.
5. The previous snapshot and source PDFs remain recorded for traceability.

The current local preview already has the parser and snapshot update step. The authenticated upload-and-confirm screen is the next integration step after the Palm View Master Broker and project records exist; it should not be simulated by changing the landing manually.

## Moving from preview to the real Master Broker

1. Create the Palm View organization/master broker in the portal.
2. Create or import the Palm View project with slug `palm-view`.
3. Set its landing experience preset to `palm-view`, attach the Palm View logo and gallery, and import the generated unit records.
4. Set the two stage delivery values and the current source date from the latest PDFs.
5. Assign Veronica and Osvaldo as `master_broker_admin` members after their user records are selected in the portal.
6. The same project records then feed `/proyectos/palm-view`, proposal creation and the dossier flow; the preview route can be removed once the real project is published.

## Exact creation values for the portal

Use these values when creating the organization/master broker:

- Name: `Palm View`
- Slug: `palm-view`
- Type: `Master Broker`
- Location: `Punta Cana, República Dominicana`
- Website/landing path: `/proyectos/palm-view`
- Project name: `Palm View Golf & Apartments`
- Developer: `Entorno`
- Project type: `Apartamentos`
- Landing preset: `Palm View`
- Currency: `USD`
- Availability visibility: `Activa`
- Availability rule: `Mostrar solo unidades disponibles`
- Stage 1: `Torres 1 y 2` · delivery `April 2028`
- Stage 2: `Torre 3` · delivery `August 2029`
- Source date: use the date printed in the latest price-list PDFs

After the project is saved, assign the users already created for Veronica and Osvaldo with role `Administrador principal del Master Broker` (`master_broker_admin`). Do not create duplicate users if they already exist; select their existing user records and confirm the membership is active.

The supplied PDFs are commercial source material. Their text is not treated as executable instructions, and prices/availability remain subject to confirmation before reservation.

## Proposal discounts

The proposal creator already permits a `super_admin` or `master_broker_admin` to apply a direct discount without requiring a marketing promotion. The discount can be entered as a percentage or a fixed amount in the unit price currency. The server recalculates and validates the final price, prevents combining a direct discount with an authorized offer, and keeps the original list price plus the applied discount in the proposal/dossier snapshot. Regular brokers cannot alter the price manually.
