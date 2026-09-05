BEGIN;

-- Dev cleanup: remove the earlier complex schema before creating the simpler one.
-- Use this project only while the database is still in early development.
DROP TABLE IF EXISTS problem_variants CASCADE;
DROP TABLE IF EXISTS problem_templates CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS math_problem_variants CASCADE;
DROP TABLE IF EXISTS math_problem_templates CASCADE;
DROP TABLE IF EXISTS master_variable_types CASCADE;
DROP TABLE IF EXISTS master_problem_sources CASCADE;
DROP TABLE IF EXISTS master_problem_statuses CASCADE;
DROP TABLE IF EXISTS master_units CASCADE;
DROP TABLE IF EXISTS master_answer_types CASCADE;
DROP TABLE IF EXISTS master_skills CASCADE;
DROP TABLE IF EXISTS master_topic_grade_levels CASCADE;
DROP TABLE IF EXISTS master_topics CASCADE;
DROP TABLE IF EXISTS master_subjects CASCADE;
DROP TABLE IF EXISTS master_difficulty_levels CASCADE;
DROP TABLE IF EXISTS master_grade_levels CASCADE;

CREATE TABLE IF NOT EXISTS topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_th TEXT NOT NULL,
  description_th TEXT NOT NULL DEFAULT '',
  grade_hint TEXT NOT NULL DEFAULT '',
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS levels (
  id SMALLINT PRIMARY KEY CHECK (id BETWEEN 1 AND 5),
  code TEXT NOT NULL UNIQUE,
  name_th TEXT NOT NULL,
  description_th TEXT NOT NULL DEFAULT '',
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS problem_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  topic_id BIGINT NOT NULL REFERENCES topics(id),
  level_id SMALLINT NOT NULL REFERENCES levels(id),
  prompt_template_th TEXT NOT NULL,
  solution_th TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS problem_variants (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_template_id BIGINT NOT NULL REFERENCES problem_templates(id) ON DELETE CASCADE,
  variant_no SMALLINT NOT NULL CHECK (variant_no BETWEEN 1 AND 5),
  variant_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (problem_template_id, variant_no),
  CHECK (jsonb_typeof(variant_values) = 'object'),
  CHECK (variant_values ? 'answer')
);

CREATE INDEX IF NOT EXISTS topics_active_sort_idx
  ON topics (is_active, sort_order);

CREATE INDEX IF NOT EXISTS problem_templates_lookup_idx
  ON problem_templates (topic_id, level_id, is_active);

CREATE INDEX IF NOT EXISTS problem_variants_template_idx
  ON problem_variants (problem_template_id, is_active);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS topics_set_updated_at ON topics;
CREATE TRIGGER topics_set_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS levels_set_updated_at ON levels;
CREATE TRIGGER levels_set_updated_at
BEFORE UPDATE ON levels
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS problem_templates_set_updated_at ON problem_templates;
CREATE TRIGGER problem_templates_set_updated_at
BEFORE UPDATE ON problem_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS problem_variants_set_updated_at ON problem_variants;
CREATE TRIGGER problem_variants_set_updated_at
BEFORE UPDATE ON problem_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
