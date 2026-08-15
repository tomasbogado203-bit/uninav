-- Módulo C: Calendario de Exámenes, Fotos de Pizarra y Notas Post-it
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

-- Tabla de Notas Post-it Adhesivas
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

-- Fotos de Pizarra
create table if not exists board_photos (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  photo_url text not null,
  class_date date default CURRENT_DATE,
  ocr_text text,
  ocr_status text not null default 'pending' check (ocr_status in ('pending', 'done', 'failed')),
  created_at timestamp with time zone default now()
);

-- Eventos Detectados por OCR (Regla 7: solo propone con confirmed = false)
create table if not exists detected_events (
  id uuid primary key default gen_random_uuid(),
  board_photo_id uuid not null references board_photos(id) on delete cascade,
  suggested_date date,
  suggested_type text,
  suggested_title text,
  confirmed boolean default false,
  created_at timestamp with time zone default now()
);

-- Vista de Semanas Críticas (Semanas con 2 o más eventos solapados)
drop view if exists critical_weeks cascade;

create view critical_weeks as
select
  subject_id,
  date_trunc('week', event_date)::date as week_start,
  count(*) as total_events
from academic_events
group by subject_id, date_trunc('week', event_date)::date
having count(*) >= 2;

-- RLS Policies
alter table academic_events enable row level security;
alter table academic_notes enable row level security;
alter table board_photos enable row level security;
alter table detected_events enable row level security;

drop policy if exists "Usuarios gestionan academic_events de sus materias" on academic_events;
drop policy if exists "Usuarios gestionan academic_notes de sus materias" on academic_notes;
drop policy if exists "Usuarios gestionan board_photos de sus materias" on board_photos;
drop policy if exists "Usuarios gestionan detected_events de sus materias" on detected_events;

create policy "Usuarios gestionan academic_events de sus materias"
  on academic_events for all
  using (
    exists (
      select 1 from subjects
      where subjects.id = academic_events.subject_id
      and subjects.user_id = auth.uid()
    )
  );

create policy "Usuarios gestionan academic_notes de sus materias"
  on academic_notes for all
  using (
    auth.uid() = user_id
  );

create policy "Usuarios gestionan board_photos de sus materias"
  on board_photos for all
  using (
    exists (
      select 1 from subjects
      where subjects.id = board_photos.subject_id
      and subjects.user_id = auth.uid()
    )
  );

create policy "Usuarios gestionan detected_events de sus materias"
  on detected_events for all
  using (
    exists (
      select 1 from board_photos
      join subjects on subjects.id = board_photos.subject_id
      where board_photos.id = detected_events.board_photo_id
      and subjects.user_id = auth.uid()
    )
  );
