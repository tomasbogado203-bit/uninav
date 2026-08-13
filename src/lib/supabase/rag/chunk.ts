import type { ExtractedPage } from '@/lib/supabase/pdf/extract'

// Aproximación: ~4 caracteres por token en español/inglés
const CHARS_PER_CHUNK = 2000 // ~500 tokens
const OVERLAP_CHARS = 200 // ~50 tokens

export interface Chunk {
  content: string
  page_number: number | null
}

export function chunkPages(pages: ExtractedPage[]): Chunk[] {
  const chunks: Chunk[] = []

  for (const { page, text } of pages) {
    const clean = text.replace(/\s+/g, ' ').trim()
    if (!clean) continue

    let start = 0
    while (start < clean.length) {
      const end = Math.min(start + CHARS_PER_CHUNK, clean.length)
      chunks.push({ content: clean.slice(start, end), page_number: page })
      if (end === clean.length) break
      start = end - OVERLAP_CHARS
    }
  }

  return chunks
}
