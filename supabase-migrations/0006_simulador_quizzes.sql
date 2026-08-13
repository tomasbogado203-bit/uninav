-- Módulo de Simulador de Parciales y Quizes
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
  options jsonb, -- array de strings para multiple_choice
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

-- RLS Policies
alter table quizzes enable row level security;
alter table quiz_threads enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;

-- Policy pública/usuario para quizzes de sus materias
create policy "Usuarios gestionan quizzes de sus materias"
  on quizzes for all
  using (
    exists (
      select 1 from subjects
      where subjects.id = quizzes.subject_id
      and subjects.user_id = auth.uid()
    )
  );

create policy "Usuarios gestionan quiz_threads de sus materias"
  on quiz_threads for all
  using (
    exists (
      select 1 from quizzes
      join subjects on subjects.id = quizzes.subject_id
      where quizzes.id = quiz_threads.quiz_id
      and subjects.user_id = auth.uid()
    )
  );

create policy "Usuarios gestionan quiz_questions de sus materias"
  on quiz_questions for all
  using (
    exists (
      select 1 from quizzes
      join subjects on subjects.id = quizzes.subject_id
      where quizzes.id = quiz_questions.quiz_id
      and subjects.user_id = auth.uid()
    )
  );

create policy "Usuarios gestionan quiz_attempts de sus materias"
  on quiz_attempts for all
  using (
    exists (
      select 1 from quizzes
      join subjects on subjects.id = quizzes.subject_id
      where quizzes.id = quiz_attempts.quiz_id
      and subjects.user_id = auth.uid()
    )
  );
