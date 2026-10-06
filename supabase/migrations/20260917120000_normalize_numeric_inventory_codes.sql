-- Spreadsheet numeric cells can arrive as 109.0 even when the official
-- source displays 109. Keep unit identifiers faithful to the source.
update public.units
set unit_code = regexp_replace(unit_code, '[.]0+$', ''),
    updated_at = now()
where unit_code ~ '^[0-9]+[.]0+$';
