import { createClient } from '@/lib/supabase/server'
import { retrieveChunks } from '@/lib/supabase/rag/retrieve'
import {
  generateSocraticResponseStream,
  generateSocraticResponse,
  type ChatMessageInput,
} from '@/lib/supabase/gemini/chat'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const {
      subjectId,
      userMessage,
      history = [],
    }: {
      subjectId: string
      userMessage: string
      history: ChatMessageInput[]
    } = body

    if (!subjectId || !userMessage || userMessage.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Mensaje o materia no válidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 1. RAG Vectorial scopeado por materia (excluye exámenes viejos)
    const chunks = await retrieveChunks(subjectId, userMessage.trim(), 5)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Enviar citas bibliográficas al inicio
          const citationsPayload = {
            type: 'citations',
            citations: chunks.map((c) => ({
              document_id: c.document_id,
              page_number: c.page_number,
              content: c.content,
            })),
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(citationsPayload)}\n\n`)
          )

          let hasSentTokens = false

          try {
            // Iniciar generación en streaming con Gemini 3.6 Flash
            const responseStream = await generateSocraticResponseStream(
              userMessage.trim(),
              history,
              chunks
            )

            const asyncIterable = (responseStream as any)?.stream || responseStream

            for await (const chunk of asyncIterable) {
              const text =
                chunk?.text ||
                chunk?.candidates?.[0]?.content?.parts?.[0]?.text ||
                ''

              if (text) {
                hasSentTokens = true
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'token', text })}\n\n`
                  )
                )
              }
            }
          } catch (streamErr) {
            console.warn('Error en streaming de Gemini, ejecutando fallback síncrono:', streamErr)
          }

          // Fallback síncrono si el streaming no envió ningún token
          if (!hasSentTokens) {
            const fallbackText = await generateSocraticResponse(
              userMessage.trim(),
              history,
              chunks
            )
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'token', text: fallbackText })}\n\n`
              )
            )
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          )
        } catch (err: unknown) {
          let errorMsg = 'Error durante la generación socrática'
          if (err instanceof Error) {
            errorMsg = err.message
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error interno del servidor'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
