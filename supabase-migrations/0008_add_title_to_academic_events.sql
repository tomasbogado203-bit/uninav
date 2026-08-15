-- Agregar columna title a la tabla academic_events por si fue creada en una versión previa del schema
alter table if exists academic_events add column if not exists title text default 'Evaluación';

-- Recargar la caché de PostgREST en Supabase
notify pgrst, 'reload schema';
