-- Add grading scale column to courses table
-- This stores customizable grade boundaries for each course

ALTER TABLE courses ADD COLUMN IF NOT EXISTS grading_scale JSONB DEFAULT '{
  "A+": 1.5,
  "A": 1.0,
  "A-": 0.5,
  "B": 0.0,
  "C": -0.5,
  "D": -1.0,
  "E": -1.5,
  "F": -2.0
}'::jsonb;

-- Add comment explaining the grading scale
COMMENT ON COLUMN courses.grading_scale IS 'Z-score thresholds for letter grades. Each grade has a minimum z-score value.';
