-- EV spec fields for cars/motorbikes with fuel_type = 'electric'.
-- Nullable and not DB-gated to fuel_type, matching the existing pattern for
-- other type-specific columns (e.g. engine_cc isn't constrained to motorbikes
-- either) — validation of "does this field make sense for this vehicle"
-- stays in the form layer (src/components/admin/CarForm.tsx), not the schema.
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS ev_range_km INTEGER,
  ADD COLUMN IF NOT EXISTS ev_charging_connector TEXT,
  ADD COLUMN IF NOT EXISTS ev_charging_time_hours NUMERIC;
