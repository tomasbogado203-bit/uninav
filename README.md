# 🎓 UniNav — Plataforma Inteligente de Acompañamiento Universitario

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-success?style=for-the-badge&logo=github" alt="Status" />
  <img src="https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google%20Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

<p align="center">
  <strong>Plataforma integral orientada a reducir la deserción universitaria de primer año en Argentina mediante Inteligencia Artificial y herramientas de estudio socrático.</strong>
</p>

<p align="center">
  🔗 <strong>Live Demo:</strong> <a href="https://uninav-rho.vercel.app">https://uninav-rho.vercel.app</a>
</p>

---

## 📌 ¿Qué es UniNav?

El primer año universitario presenta las tasas de abandono más elevadas en Argentina debido a la falta de orientación metodológica, la complejidad del material de estudio y la desorganización académica. 

**UniNav** aborda esta problemática combinando:
1. 🧠 **Tutor RAG Socrático:** No entrega la respuesta servida; guía al alumno mediante preguntas y pistas contextualizadas en sus propios apuntes.
2. 📚 **Gestión Vectorial de Apuntes (RAG):** Carga y procesamiento automático de PDFs con vectorización semántica (`pgvector` + `gemini-embedding-001`).
3. 🗺️ **Generador de Diagramas Conceptuales:** Renderizado en tiempo real de mapas mentales y flujos con Mermaid.js ($0 costo de cómputo).
4. 📅 **Planificador de Exámenes & Cronograma:** Panel interactivo para seguimiento de fechas de parciales y entregas.
5. 🛠️ **Curaduría de Herramientas por Carrera:** Directorio curado de software, simuladores y recursos específicos para cada disciplina.

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TD
    A[Estudiante / UI] -->|Carga de Apuntes PDF| B[Next.js App Router]
    B -->|Storage & Metadata| C[Supabase Storage & PostgreSQL]
    B -->|Extracción de Texto & Chunking| D[Motor RAG]
    D -->|Embeddings 1536-dim| E[Google Gemini Embedding-001]
    E -->|Vectores L2 Normalizados| F[(pgvector / Supabase)]
    A -->|Consulta de Estudio| G[Tutor Socrático]
    G -->|Búsqueda Semántica de Fragmentos| F
    G -->|Contexto + Prompt Pedagógico| H[Google Gemini Flash]
    H -->|Explicación Guiada + Diagramas| A
```

---

## ⚡ Tech Stack

- **Frontend & Routing:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4 con diseño responsivo mobile-first.
- **Base de Datos & Backend:** Supabase (PostgreSQL, Row Level Security, `pgvector`, Storage).
- **Inteligencia Artificial:** Google Gemini AI (`@google/genai`) para embeddings vectoriales y generación de respuestas pedagógicas.
- **Visualización:** Mermaid.js para diagramas y mapas conceptuales renderizados en cliente.
- **Despliegue:** Vercel (Frontend) + Supabase Cloud (Base de datos y vectores).

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/tomasbogado203-bit/uninav.git
cd uninav
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
GEMINI_API_KEY=tu_gemini_api_key
```

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 👥 Autor
Desarrollado con dedicación por **Tomas Bogado** ([@tomasbogado203-bit](https://github.com/tomasbogado203-bit)) para la comunidad universitaria argentina.
