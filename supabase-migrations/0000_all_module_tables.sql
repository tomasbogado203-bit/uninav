-- Script Completo para ejecutar en el SQL Editor del Dashboard de Supabase
-- Crea todas las tablas para Módulo A (Recursos y Glosario), Simulador, Calendario, Roadmap IA, Fotos de Pizarra y Racha de Estudio

-- 0. TABLAS DE MÓDULO A (career_resources y glossary_terms)
create table if not exists career_resources (
  id uuid primary key default gen_random_uuid(),
  career_id uuid references careers(id) on delete cascade,
  tool_name text not null,
  category text not null check (category in ('software', 'plantilla', 'otro')),
  description text not null,
  quickstart_url text,
  download_url text,
  display_order int default 0,
  created_at timestamp with time zone default now()
);

create table if not exists glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  definition text not null,
  career_id uuid references careers(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- 1. TABLAS DE SIMULADOR DE PARCIALES
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  quiz_type text not null check (quiz_type in ('multiple_choice', 'desarrollo')),
  scope text not null check (scope in ('tema_unico', 'integrador')),
  style_reference_document_id uuid references documents(id) on delete set null,
  created_at timestamp with time zone default now()
);

create table if not exists quiz_threads (
  quiz_id uuid not null references quizzes(id) on delete cascade,
  thread_id uuid not null references chat_threads(id) on delete cascade,
  coverage text not null check (coverage in ('ok', 'baja')),
  primary key (quiz_id, thread_id)
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  question_format text not null check (question_format in ('multiple_choice', 'desarrollo')),
  options jsonb,
  correct_answer text not null,
  source_page int
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score int not null default 0,
  answers jsonb not null default '{}'::jsonb,
  attempted_at timestamp with time zone default now()
);

-- 2. TABLAS DE CALENDARIO Y NOTAS POST-IT
create table if not exists academic_events (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  event_type text not null check (event_type in ('parcial', 'entrega_tp', 'final')),
  title text not null default 'Evaluación',
  event_date date not null,
  study_roadmap jsonb default '[]'::jsonb,
  google_event_id text,
  created_at timestamp with time zone default now()
);

alter table if exists academic_events add column if not exists title text default 'Evaluación';

create table if not exists academic_notes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text,
  color text not null default 'yellow' check (color in ('yellow', 'blue', 'green', 'pink', 'purple')),
  event_date date,
  created_at timestamp with time zone default now()
);

create table if not exists board_photos (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  photo_url text not null,
  class_date date default CURRENT_DATE,
  ocr_text text,
  ocr_status text not null default 'pending' check (ocr_status in ('pending', 'done', 'failed')),
  created_at timestamp with time zone default now()
);

create table if not exists detected_events (
  id uuid primary key default gen_random_uuid(),
  board_photo_id uuid not null references board_photos(id) on delete cascade,
  suggested_date date,
  suggested_type text,
  suggested_title text,
  confirmed boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. TABLA DE RACHA DE ESTUDIO (study_streaks)
create table if not exists study_streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_streak int not null default 1,
  longest_streak int not null default 1,
  last_activity_date date not null default CURRENT_DATE,
  updated_at timestamp with time zone default now()
);

-- 4. VISTA DE SEMANAS CRÍTICAS
drop view if exists critical_weeks cascade;

create view critical_weeks as
select
  subject_id,
  date_trunc('week', event_date)::date as week_start,
  count(*) as total_events
from academic_events
group by subject_id, date_trunc('week', event_date)::date
having count(*) >= 2;

-- 5. POLÍTICAS RLS
alter table career_resources enable row level security;
alter table glossary_terms enable row level security;
alter table quizzes enable row level security;
alter table quiz_threads enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table academic_events enable row level security;
alter table academic_notes enable row level security;
alter table board_photos enable row level security;
alter table detected_events enable row level security;
alter table study_streaks enable row level security;

drop policy if exists "career_resources_policy" on career_resources;
drop policy if exists "glossary_terms_policy" on glossary_terms;
drop policy if exists "quizzes_policy" on quizzes;
drop policy if exists "quiz_threads_policy" on quiz_threads;
drop policy if exists "quiz_questions_policy" on quiz_questions;
drop policy if exists "quiz_attempts_policy" on quiz_attempts;
drop policy if exists "academic_events_policy" on academic_events;
drop policy if exists "academic_notes_policy" on academic_notes;
drop policy if exists "board_photos_policy" on board_photos;
drop policy if exists "detected_events_policy" on detected_events;
drop policy if exists "study_streaks_policy" on study_streaks;

create policy "career_resources_policy" on career_resources for select using (true);
create policy "glossary_terms_policy" on glossary_terms for select using (true);
create policy "quizzes_policy" on quizzes for all using (exists (select 1 from subjects where subjects.id = quizzes.subject_id and subjects.user_id = auth.uid()));
create policy "quiz_threads_policy" on quiz_threads for all using (exists (select 1 from quizzes join subjects on subjects.id = quizzes.subject_id where quizzes.id = quiz_threads.quiz_id and subjects.user_id = auth.uid()));
create policy "quiz_questions_policy" on quiz_questions for all using (exists (select 1 from quizzes join subjects on subjects.id = quizzes.subject_id where quizzes.id = quiz_questions.quiz_id and subjects.user_id = auth.uid()));
create policy "quiz_attempts_policy" on quiz_attempts for all using (exists (select 1 from quizzes join subjects on subjects.id = quizzes.subject_id where quizzes.id = quiz_attempts.quiz_id and subjects.user_id = auth.uid()));
create policy "academic_events_policy" on academic_events for all using (exists (select 1 from subjects where subjects.id = academic_events.subject_id and subjects.user_id = auth.uid()));
create policy "academic_notes_policy" on academic_notes for all using (auth.uid() = user_id);
create policy "board_photos_policy" on board_photos for all using (exists (select 1 from subjects where subjects.id = board_photos.subject_id and subjects.user_id = auth.uid()));
create policy "detected_events_policy" on detected_events for all using (exists (select 1 from board_photos join subjects on subjects.id = board_photos.subject_id where board_photos.id = detected_events.board_photo_id and subjects.user_id = auth.uid()));
create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  front_text text not null,
  back_text text not null,
  source_page int,
  mastered boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table flashcards enable row level security;
create policy "flashcards_policy" on flashcards for all using (exists (select 1 from subjects where subjects.id = flashcards.subject_id and subjects.user_id = auth.uid()));

-- Recargar la caché del esquema de PostgREST
notify pgrst, 'reload schema';
