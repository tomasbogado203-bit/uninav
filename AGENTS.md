<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — UniNav

Este archivo es la fuente de verdad para cualquier agente de código (Antigravity, Claude Code, etc.) que trabaje en este repo. Leelo completo antes de tocar código. No asumas nada que no esté acá — si falta una decisión, preguntá antes de inventar una.

## 1. Qué es esto

UniNav es una plataforma web gratuita para reducir la deserción universitaria de primer año en Argentina. Combina:

- Curaduría de herramientas de software por carrera
- Un tutor RAG socrático (no le da las respuestas al alumno, lo guía)
- Un calendario/planificador de exámenes
- Un generador de diagramas Mermaid
- Extras: racha de estudio, panel de progreso, banco de exámenes viejos

**Deadline:** hackathon, entrega en septiembre 2026. Prioridad: funcionalidad real y demostrable por sobre pulido visual. No optimizar prematuramente. No agregar features fuera de este documento sin confirmarlo con el usuario primero.

**Idioma:** toda la UI visible al usuario va en español (Argentina, tono neutro/formal). El código (variables, funciones, comentarios) va en inglés, salvo strings de UI.

---

## 2. Stack técnico (decisiones cerradas, no renegociar)

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + pgvector + Storage), con RLS activo en TODAS las tablas
- **IA:** Gemini, unificado — un solo proveedor para chat, embeddings, y vision/OCR. NO usar OpenAI ni otro proveedor. SDK: `@google/genai`
- **Embeddings:** modelo `gemini-embedding-001`, `output_dimensionality: 1536`, con normalización L2 manual post-truncado (el modelo no la hace solo salvo que uses los 3072 dims completos)
- **Chat:** modelo Gemini flash-tier (rápido/barato) para RAG y generación
- **Diagramas:** Mermaid.js, renderizado client-side, costo $0
- **Deploy target:** Vercel (frontend) + Supabase (backend), no configurado todavía
- **Auth:** email/password (decisión tomada por simplicidad — NO hay Google OAuth implementado; si se agrega, es adicional, no reemplaza esto)

---

## 3. Estado actual del código (agosto 2026)

Lo que YA está implementado y funcionando — no lo reescribas desde cero, extendé sobre esto:

- ✅ **Auth** (signup/login con email/password) — `src/app/login/page.tsx`
- ✅ **Middleware de protección de rutas** — `src/middleware.ts` (redirige: sin sesión → `/login`; con sesión sin carrera elegida → `/onboarding`)
- ✅ **Onboarding** (selección de carrera desde careers, guarda en profiles) — `src/app/onboarding/`
- ✅ **Dashboard raíz mínimo** — `src/app/page.tsx`
- ✅ **CRUD de materias** (crear/listar) — `src/app/materias/`
- ✅ **Upload de apuntes PDF a Supabase Storage + registro en documents** — `src/app/materias/[subjectId]/`
- ✅ **Pipeline de chunking + embeddings**, sincrónico, corre dentro del mismo server action del upload — `src/lib/supabase/pdf/extract.ts`, `src/lib/supabase/rag/chunk.ts`, `src/lib/supabase/gemini/embeddings.ts`

Lo que FALTA (en este orden de prioridad):

1. **Chat RAG con citas** (`src/app/materias/[subjectId]/temas/`) — búsqueda vectorial sobre `document_chunks` scopeada por `subject_id`, con system prompt socrático (sección 6)
2. **Simulador de parciales** (tab propio, incluye quiz integrador multi-tema)
3. **Calendario** (carga manual primero, después fotos de pizarra + OCR async)
4. **Generador de diagramas Mermaid** (botón manual en el chat)
5. **Seed de contenido del Módulo A** (`careers`/`career_resources`/`glossary_terms` — dato, no código)
6. **Racha de estudio + "Dónde estoy parado"** (incrementales)

---

## 4. Estructura de carpetas (OBLIGATORIA — no la reinventes)

```text
src/
  app/
    login/
      page.tsx
    onboarding/
      page.tsx
      actions.ts
    page.tsx                         # dashboard raíz
    materias/
      page.tsx                       # listado + crear materia
      actions.ts
      [subjectId]/
        page.tsx                     # workspace de la materia (hoy: solo apuntes; falta: 5 tabs)
        actions.ts                   # upload + pipeline de embeddings
        temas/                       # FALTA CREAR — chat RAG
        simulador/                   # FALTA CREAR — quiz
        calendario/                  # FALTA CREAR — eventos de la materia
        fotos/                       # FALTA CREAR — carpeta de pizarra
  lib/
    supabase/
      client.ts                      # browser client
      server.ts                      # server client (Server Components/Actions)
      gemini/
        embeddings.ts                # embedText()
        chat.ts                      # FALTA CREAR — tutor socrático
        diagrams.ts                  # FALTA CREAR — generador Mermaid
        ocr.ts                       # FALTA CREAR — pizarra + ecuaciones
      pdf/
        extract.ts                   # extractTextByPage()
      rag/
        chunk.ts                     # chunkPages()
        retrieve.ts                  # FALTA CREAR — búsqueda vectorial + balanceo multi-thread
  middleware.ts
supabase-migrations/                 # NO es una carpeta oficial de Supabase CLI, es solo dónde
                                      # este proyecto guarda copias de las migraciones para
                                      # pegarlas manualmente en el SQL Editor del dashboard.
                                      # Si en algún momento se migra a `supabase db push` con
                                      # CLI, mover el contenido a `supabase/migrations/` (carpeta
                                      # estándar) y renombrar con timestamps.
  0001_init.sql
  0002_fix_career_fk.sql
  0003_seed_careers.sql
  0004_storage_apuntes.sql
```

**REGLA CRÍTICA de manejo de carpetas:** este proyecto ya sufrió dos incidentes de carpetas duplicadas anidadas (`uninav/uninav/`, `[subjectId]/subjectId/`) por crear rutas a mano en Windows. Antes de crear cualquier archivo o carpeta nueva:

1. Verificá primero si la ruta/carpeta ya existe.
2. Nunca ejecutes `create-next-app` u otro scaffolding estando ya parado dentro de una carpeta del proyecto — confirmá el working directory primero.
3. Al crear rutas dinámicas (`[algo]`), creá la carpeta con corchetes UNA sola vez y verificá que no haya quedado un subdirectorio con el mismo nombre sin corchetes adentro.

---

## 5. Schema completo de base de datos

Ejecutado en orden: `0001_init.sql` → `0002_fix_career_fk.sql` → `0003_seed_careers.sql` → `0004_storage_apuntes.sql`. Todas las tablas tienen RLS activo (policy estándar: `auth.uid() = user_id` directo, o join hacia `subjects.user_id` para tablas que cuelgan de materia).

```sql
-- profiles (extiende auth.users, se crea automático via trigger on_auth_user_created)
profiles(id uuid PK, full_name text, university text, career_id uuid FK->careers, created_at)

-- Módulo A
careers(id uuid PK, name text, university text, faculty text)
career_resources(id uuid PK, career_id FK->careers, tool_name text, category text['software'|'plantilla'|'otro'], description text, quickstart_url text, download_url text, display_order int)
glossary_terms(id uuid PK, term text, definition text, career_id FK->careers nullable[null=genérico])

-- Central
subjects(id uuid PK, user_id FK->profiles, name text, color text, career_id uuid FK->careers, created_at)

-- Módulo B
documents(id uuid PK, user_id FK->profiles, subject_id FK->subjects, title text, file_url text[path en Storage], document_type text['apunte'|'examen_viejo'], created_at)
document_chunks(id uuid PK, document_id FK->documents, content text, page_number int, embedding vector(1536))
chat_threads(id uuid PK, subject_id FK->subjects, title text, created_at)
quizzes(id uuid PK, subject_id FK->subjects, quiz_type text['multiple_choice'|'desarrollo'], scope text['tema_unico'|'integrador'], style_reference_document_id FK->documents nullable, created_at)
quiz_threads(quiz_id FK->quizzes, thread_id FK->chat_threads, coverage text['ok'|'baja'], PK compuesta)
quiz_questions(id uuid PK, quiz_id FK->quizzes, question_text text, question_format text['multiple_choice'|'desarrollo'], options jsonb nullable, correct_answer text, source_page int)
quiz_attempts(id uuid PK, quiz_id FK->quizzes, score int, answers jsonb, attempted_at)

-- Módulo C
board_photos(id uuid PK, subject_id FK->subjects, photo_url text, class_date date, ocr_text text, ocr_status text['pending'|'done'|'failed'], created_at)
detected_events(id uuid PK, board_photo_id FK->board_photos, suggested_date date, suggested_type text, suggested_title text, confirmed boolean)
academic_events(id uuid PK, subject_id FK->subjects, event_type text['parcial'|'entrega_tp'|'final'], event_date date, study_roadmap jsonb, google_event_id text nullable[stretch goal, no implementado])
critical_weeks -- VIEW: semanas con 2+ eventos solapados

-- Módulo D
generated_diagrams(id uuid PK, thread_id FK->chat_threads, source_message_id uuid, mermaid_code text, created_at)

-- Extras
study_streaks(user_id PK FK->profiles, current_streak int, longest_streak int, last_activity_date date)

-- Storage
bucket 'apuntes' (privado). Convención de path: {user_id}/{subject_id}/{timestamp}-{filename}
```

---

## 6. Reglas de producto no negociables

Estas decisiones ya se tomaron con el usuario. Un agente NO debe revertirlas sin preguntar explícitamente:

1. **El tutor RAG nunca redacta trabajos completos.** Si el alumno pide "hazme el informe", el sistema responde con estructura + preguntas guía, nunca con el texto final. System prompt de referencia:
   > Eres "UniNav AI", un tutor universitario socrático diseñado para acompañar a estudiantes ingresantes.  
   > TU OBJETIVO ES ENSEÑAR A PENSAR, NO HACER EL TRABAJO POR EL ALUMNO.  
   > REGLAS ESTRICTAS:  
   > 1. Jamás redactes un trabajo práctico, ensayo o informe completo de cero.  
   > 2. Si el usuario pide "hazme el informe/respuesta", responde con estructura en viñetas, conceptos clave según la bibliografía cargada, y pídele un primer borrador de 2 líneas.  
   > 3. Responde ÚNICAMENTE usando el contexto en `<CONTEXTO_BIBLIOGRAFICO>`.  
   > 4. Si la respuesta no está en el contexto, indicá explícitamente: "Esta información no está en el apunte cargado".  
   > 5. Cada afirmación basada en contexto lleva cita `[Pág. X]` al final de la frase.

2. **El RAG está scopeado por materia, siempre.** Nunca hacer una búsqueda vectorial global entre materias — filtrar siempre por `subject_id` vía `documents.subject_id`.
3. **Quiz integrador (multi-tema):** cuando se combinan 2+ threads, la recuperación de chunks es independiente por thread (top-K por separado, nunca una búsqueda mezclada) para no sesgar hacia el tema con más contenido. Si un thread recupera menos de 3 chunks, marcar `coverage = 'baja'` en `quiz_threads` y avisar al alumno antes de generar (no bloquear, solo avisar).
4. **Preguntas de desarrollo se autoevalúan, NUNCA se corrigen con IA.** El alumno compara su respuesta contra los puntos clave (`correct_answer`) y se autoasigna el resultado. Esto es deliberado — evita riesgo de alucinación en la corrección.
5. **Banco de exámenes viejos:** un documento marcado `document_type = 'examen_viejo'` solo puede aportar FORMATO/ESTILO al generar un quiz (via `style_reference_document_id`), nunca contenido textual. No mezclar sus chunks en el RAG de contenido normal.
6. **Diagramas Mermaid:** trigger manual, nunca automático. Un botón "Generar diagrama" debajo de cada respuesta del chat de Temas. Contexto enviado: los últimos 2-4 turnos del intercambio puntual, no todo el thread.
7. **OCR de pizarra nunca crea eventos directo.** Solo propone (`detected_events`, `confirmed = false`); el alumno confirma antes de que pase a `academic_events`.
8. **Calendario:** carga manual es la vía principal, no depender de OCR para tener el planner funcionando.
9. **Rate limiting** (15-20 consultas RAG/día, 3 PDFs activos simultáneos por materia) debe implementarse en código, no quedar solo de spec.
10. **Fuera de scope, no implementar salvo pedido explícito:** contención emocional/salud mental, grupos de estudio/red social, orientación vocacional, integración completa con Google Calendar (quedó documentada como flujo pero descartada como dependencia crítica — ver `google_event_id` nullable sin usar).

---

## 7. Convenciones de código

- **Server Actions** (`'use server'`) por sobre API routes para todo lo que sea mutación desde formularios — es el patrón ya usado en todo el repo (`onboarding/actions.ts`, `materias/actions.ts`, `materias/[subjectId]/actions.ts`), mantenerlo.
- **Cliente Supabase:** `@/lib/supabase/client` en Client Components, `@/lib/supabase/server` (async, usa `cookies()`) en Server Components/Actions. Nunca instanciar un cliente Supabase de otra forma.
- **Nunca usar `service_role` key** en código que corre client-side ni en server actions expuestos al usuario — solo si en algún momento se arma un edge function/cron admin explícitamente aislado.
- **Tailwind con clases utilitarias inline**, sin CSS modules ni styled-components. No hay design system propio todavía — mantené los componentes simples (bordes finos, radios chicos, sin sombras pesadas) hasta que se defina un estilo visual final.
- **TypeScript estricto** — tipar los params de rutas dinámicas como `Promise<{...}>` (Next.js App Router async params, ya usado en `[subjectId]/page.tsx`).
- **Todo texto visible al usuario en español**; nombres de variables/funciones en inglés.
- **Al insertar en columnas vector**, pasar un array de `number[]` directo — Supabase-js lo serializa correctamente para pgvector.

---

## 8. Si algo de este documento queda desactualizado

Este archivo se debe actualizar cada vez que se cierre una decisión de producto o se complete un módulo. Si el código diverge de lo que dice acá, el código real manda — pero avisá al usuario de la inconsistencia en vez de asumir en silencio cuál versión es la correcta.

---

## 9. Roadmap IoT — Lámpara Semáforo de Concentración (Hardware Companion)

Requisito de ecosistema IoT para el Hackathon:
1. **Captura:** Activación de bloques de estudio Pomodoro (ej: 30 min estudio / 10 min descanso) desde la web o botón físico en el dispositivo.
2. **Procesamiento:** UniNav en la nube (Supabase) gestiona la sesión, suma tiempo a la racha diaria de estudio y dispara el estado a los clientes.
3. **Acción / Actuador Físico:** Lámpara de escritorio inteligente basada en microcontrolador (ESP32/ESP8266 + LEDs NeoPixel WS2812B) que cambia de color:
   - 🔴 **Rojo (Modo Concentración / Estudio):** Señaliza al entorno del estudiante (familia, compañeros) que no debe ser interrumpido.
   - 🟡 **Amarillo:** Transición / últimos minutos de bloque.
   - 🟢 **Verde (Modo Descanso):** Estado libre para pausas y consultas.
   - **Enfoque Open Hardware / DIY:** Planos de circuito esquemático y firmware libre para que estudiantes de ingeniería puedan ensamblar su propio hardware a bajo costo (~$3 a $5 USD).

