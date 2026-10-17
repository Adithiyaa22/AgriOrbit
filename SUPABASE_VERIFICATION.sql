-- AgriOrbit final verification queries.
-- READ-ONLY: these queries do not modify your Supabase database.

-- 1. Confirm the survey columns used by the offline/online survey flow.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'surveys'
order by ordinal_position;

-- 2. Confirm the profile columns used by the intern UI.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

-- 3. Confirm survey foreign keys.
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'surveys',
    'survey_dynamic_answers',
    'soil_information',
    'crop_information',
    'seed_information',
    'input_information',
    'irrigation_information',
    'crop_problems',
    'field_observations',
    'economics',
    'market_information',
    'labour_operations',
    'farmer_knowledge',
    'future_farmer_needs'
  )
order by tc.table_name, kcu.column_name;

-- 4. Check that the photo/voice storage buckets exist.
select id, name, public, file_size_limit
from storage.buckets
where id in ('photos', 'voices')
order by id;

-- 5. Inspect RLS policies without changing them.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'surveys',
    'farmers',
    'fields',
    'soil_information',
    'crop_information',
    'seed_information',
    'input_information',
    'irrigation_information',
    'crop_problems',
    'field_observations',
    'economics',
    'market_information',
    'labour_operations',
    'farmer_knowledge',
    'future_farmer_needs',
    'photos',
    'voice_notes'
  )
order by tablename, policyname;
