-- ====================================================================
-- OPTIMIZACIÓN DE ÍNDICES Y REDUCCIÓN DE DISK I/O PARA SUPABASE PGVECTOR
-- ====================================================================

-- 1. Índice HNSW para búsqueda vectorial ultrarrápida en memoria (evita Sequential Scans de disco)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Índices B-Tree en Foreign Keys críticas para joins instantáneos sin leer disco
CREATE INDEX IF NOT EXISTS idx_documents_subject_id ON documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_subject_id ON chat_threads(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_academic_events_subject_id ON academic_events(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_streaks_user_id ON study_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_subject_id ON flashcards(subject_id);
CREATE INDEX IF NOT EXISTS idx_commissions_professor_id ON commissions(professor_id);

-- 3. Optimización de la función match_document_chunks con filtrado previo
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_subject_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  page_number int,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  WITH relevant_docs AS (
    SELECT id FROM documents 
    WHERE subject_id = p_subject_id AND document_type = 'apunte'
  )
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.document_id IN (SELECT id FROM relevant_docs)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
