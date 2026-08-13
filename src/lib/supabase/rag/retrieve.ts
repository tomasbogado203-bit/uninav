import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/supabase/gemini/embeddings'

export interface RetrievedChunk {
  id: string
  document_id: string
  content: string
  page_number: number | null
  similarity?: number
}

/**
 * Recupera los fragmentos (chunks) más relevantes para una consulta scopeada por materia.
 * Filtra automáticamente para excluir documentos de tipo 'examen_viejo'.
 */
export async function retrieveChunks(
  subjectId: string,
  query: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  const supabase = await createClient()

  // 1. Obtener embedding de la consulta del usuario
  const queryEmbedding = await embedText(query, 'RETRIEVAL_QUERY')

  // 2. Intentar llamar al RPC match_document_chunks
  const { data: rpcChunks, error: rpcError } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.2,
    match_count: topK,
    p_subject_id: subjectId,
  })

  if (!rpcError && rpcChunks && rpcChunks.length > 0) {
    return rpcChunks as RetrievedChunk[]
  }

  // Fallback si la función RPC aún no está creada en el dashboard de Supabase:
  // Traer chunks de documentos tipo 'apunte' de la materia
  const { data: documents } = await supabase
    .from('documents')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('document_type', 'apunte')

  if (!documents || documents.length === 0) return []

  const docIds = documents.map((d) => d.id)

  const { data: rawChunks } = await supabase
    .from('document_chunks')
    .select('id, document_id, content, page_number')
    .in('document_id', docIds)
    .limit(topK * 2)

  if (!rawChunks) return []

  return rawChunks.slice(0, topK) as RetrievedChunk[]
}
