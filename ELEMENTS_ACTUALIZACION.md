# Elements Residences & Resort — Actualización Técnica de Proyecto

Documento de referencia para el proyecto **Elements Residences & Resort**, con los datos actualizados según los nuevos planos arquitectónicos y paquetes comerciales.

---

## 1. Master Plan & Nuevo Archivo 3D

- **Ruta de imagen 3D actualizada**: `/images/projects/elements/master-plan-3d.jpg` y `.png`
- **Ruta de imagen 2D actualizada**: `/images/projects/elements/master-plan-2d.jpg` y `.png`
- **Origen del plano 3D**: `Master_Plan_Elements.png`

---

## 2. Nueva Distribución de Solares y Metrajes

Distribución completa del complejo (12 Eco Suites independientes + área común / garita y estacionamientos):

| Unidad / Solar | Metraje de Solar (m²) | Área Const. (m²) | Interior (m²) | Terraza Deck (m²) | Parqueo (m²) | Precio Base (USD) | Precio Deluxe (USD) | Precio Royal (USD) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **#01** | **176.47 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $97,000 | $112,000 | $127,000 |
| **#02** | **169.58 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $98,500 | $113,500 | $128,500 |
| **#03** | **167.61 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $98,000 | $113,000 | $128,000 |
| **#04** | **171.79 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $99,000 | $114,000 | $129,000 |
| **#05** | **182.40 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $102,000 | $117,000 | $132,000 |
| **#06** | **206.30 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $104,000 | $119,000 | $134,000 |
| **#07** | **215.76 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $103,500 | $118,500 | $133,500 |
| **#08** | **165.50 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $108,000 | $123,000 | $138,000 |
| **#09** | **138.60 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $95,000 | $110,000 | $125,000 |
| **#10** | **138.58 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $95,000 | $110,000 | $125,000 |
| **#11** | **194.21 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $104,999 | $119,999 | $134,999 |
| **#12** | **165.45 m²** | 67.50 m² | 35.00 m² | 20.00 m² | 12.50 m² | $104,500 | $119,500 | $134,500 |
| **#13** | **40.30 m²** | — | — | — | — | *Área Común / Servicio* | *Área Común* | *Área Común* |

- **Rango de Solares**: De **138.58 m²** hasta **215.76 m²**.
- **Precio de Entrada**: Desde **US$ 95,000**.
- **Reserva oficial**: **US$ 500**.

---

## 3. Especificación de Paquetes Comerciales

### Opción 01 · Paquete Base
- Eco Suite de 67.50 m² construidos sobre solar individual privado.
- 1 Habitación amplia con ventilación cruzada y ventanales de piso a techo.
- 1 Baño estilo spa cenital.
- Terraza deck de 20 m² en madera tratada / porcelánico exterior.
- Parqueo asignado de 12.50 m² frente a la Eco Suite.

### Opción 02 · Paquete Deluxe (Upgrade: Base + US$ 15,000)
- **Desde US$ 110,000 con picuzzi**.
- Todo lo incluido en el Paquete Base.
- **Picuzzi Privado Integrado** construido en el patio con sistema de filtrado e hidromasaje completo.
- Deck de madera tratada / porcelánico extendido alrededor del picuzzi.
- Pergolado exterior reforzado con protección solar.
- *(Mobiliario y decoración interior no incluidos)*.

### Opción 03 · Paquete Royal (Llave en Mano: Base + US$ 30,000)
- **Desde US$ 125,000 listo para habitar o rentar**.
- Todo lo del Paquete Deluxe (incluye **Picuzzi**).
- **Mobiliario biofílico completo**: **Cama Queen** con cabecero en madera noble, sofá, comedor, mesas de noche.
- **Línea blanca completa**: Refrigerador, estufa de inducción, extractor y microondas.
- Climatización Inverter instalada y operativa.
- Cerradura inteligente con código digital para Airbnb.

---

## 4. Estado de Disponibilidad y Reglas

- Las unidades soportan dinámicamente tres estados:
  - `available` / `Disponible` (con botón para Apartar y modal de lead capture).
  - `reserved` / `Separada` / `Reservada` (badge ámbar).
  - `sold` / `Vendida` (badge neutro, botón inactivo).

---

## 5. SQL de Base de Datos para Ejecutar en Supabase

Para actualizar la base de datos de producción / Supabase con estos nuevos metrajes y estructura:

\`\`\`sql
-- Script de actualización para Elements Residences (project_id = 35 o por slug 'elements')
UPDATE units SET list_price = 97000.00, notes = '{"base_price": 97000, "lot_sqm": 176.47, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 112000, "royal_price": 127000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '101';
UPDATE units SET list_price = 98500.00, notes = '{"base_price": 98500, "lot_sqm": 169.58, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 113500, "royal_price": 128500, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '102';
UPDATE units SET list_price = 98000.00, notes = '{"base_price": 98000, "lot_sqm": 167.61, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 113000, "royal_price": 128000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '103';
UPDATE units SET list_price = 99000.00, notes = '{"base_price": 99000, "lot_sqm": 171.79, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 114000, "royal_price": 129000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '104';
UPDATE units SET list_price = 102000.00, notes = '{"base_price": 102000, "lot_sqm": 182.40, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 117000, "royal_price": 132000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '105';
UPDATE units SET list_price = 104000.00, notes = '{"base_price": 104000, "lot_sqm": 206.30, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 119000, "royal_price": 134000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '106';
UPDATE units SET list_price = 103500.00, notes = '{"base_price": 103500, "lot_sqm": 215.76, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 118500, "royal_price": 133500, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '107';
UPDATE units SET list_price = 108000.00, notes = '{"base_price": 108000, "lot_sqm": 165.50, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 123000, "royal_price": 138000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '108';
UPDATE units SET list_price = 95000.00, notes = '{"base_price": 95000, "lot_sqm": 138.60, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 110000, "royal_price": 125000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '109';
UPDATE units SET list_price = 95000.00, notes = '{"base_price": 95000, "lot_sqm": 138.58, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 110000, "royal_price": 125000, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '110';
UPDATE units SET list_price = 104999.00, notes = '{"base_price": 104999, "lot_sqm": 194.21, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 119999, "royal_price": 134999, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '111';
UPDATE units SET list_price = 104500.00, notes = '{"base_price": 104500, "lot_sqm": 165.45, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 119500, "royal_price": 134500, "typology": "Eco Suite", "bedrooms": 1, "bathrooms": 1, "parkings": 1}' WHERE project_id = 35 AND unit_code = '112';

DELETE FROM lots WHERE project_id = 35;
INSERT INTO lots (project_id, organization_id, lot_code, block, area_sqm, list_price, currency, status, polygon, is_public) VALUES
  (35, 1, '101', 'Manzana 1', 176.47, 97000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '102', 'Manzana 1', 169.58, 98500.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '103', 'Manzana 1', 167.61, 98000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '104', 'Manzana 1', 171.79, 99000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '105', 'Manzana 1', 182.40, 102000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '106', 'Manzana 1', 206.30, 104000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '107', 'Manzana 1', 215.76, 103500.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '108', 'Manzana 1', 165.50, 108000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '109', 'Manzana 1', 138.60, 95000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '110', 'Manzana 1', 138.58, 95000.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '111', 'Manzana 1', 194.21, 104999.00, 'USD', 'available', '[]'::jsonb, true),
  (35, 1, '112', 'Manzana 1', 165.45, 104500.00, 'USD', 'available', '[]'::jsonb, true);
\`\`\`
