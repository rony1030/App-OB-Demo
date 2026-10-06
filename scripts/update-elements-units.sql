-- Update units and lots for Elements Residences (project_id = 35) with the latest architectural plan metrajes
-- Plan distribution: Lots 01-12 (unit codes 101-112), 13 = Area común 40.30 m2

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
