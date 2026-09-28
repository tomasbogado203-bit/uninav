# PLAN DE NEGOCIOS: UniNav (Copiloto de Adaptación y Retención Universitaria)

**Fecha:** Septiembre / Octubre 2026  
**Autor:** Tomás Bogado (Fundador & Desarrollador Principal)  
**Institución / Ecosistema:** Incade / Hackathon 2026  
**Modelo:** B2B (Instituciones de Educación Superior / Universidades e Institutos) + Freemium B2C  

---

## 1. RESUMEN EJECUTIVO

### 1.1 La Oportunidad
En Argentina y Latinoamérica, la deserción estudiantil en el primer año universitario alcanza el **50% al 58%** según datos oficiales del Ministerio de Educación y estadísticas regionales (NEA / Misiones). Esta pérdida representa:
- Una frustración vocacional y personal crítica para el estudiante ingresante.
- Un costo financiero masivo para las universidades e institutos terciarios privados, que pierden entre **\$1.200.000 y \$2.200.000 ARS anuales en cuotas por cada alumno que abandona**.

### 1.2 La Solución UniNav
UniNav es una plataforma integral que actúa como el **copiloto de estudio socrático y adaptación institucional** para ingresantes. No hace el trabajo por el alumno; lo guía mediante inteligencia artificial RAG (*Retrieval-Augmented Generation*) scopeada estrictamente a la bibliografía de su cátedra, complementada con un banco comunitario de apuntes y exámenes, un calendario automatizado de fechas clave, un simulador de parciales autoevaluado, una pizarra digital interactiva y un dispositivo IoT de concentración (Lámpara Semáforo Pomodoro).

### 1.3 Propuesta de Valor y Modelo de Negocio B2B
UniNav se comercializa como una **licencia institucional por cohorte (B2B)** para universidades e institutos. El retorno de inversión (ROI) es directo e inmediato: **con retener a tan solo 2 a 3 estudiantes por año que hubiesen desertado, la institución recupera el 100% del costo de la plataforma** y protege su flujo de ingresos de cuotas para el resto de la carrera.

---

## 2. EL PROBLEMA Y EL MERCADO

### 2.1 El Dolor del Estudiante Ingresante
1. **Brecha Metodológica:** El salto entre la secundaria y la universidad es abrupto. El alumno no comprende la terminología académica (*regularidad, correlativas, coloquios, recuperatorios*), ni cómo sintetizar tomos bibliográficos de 500 páginas.
2. **Aislamiento:** El 60% de los ingresantes refiere sentirse solo en el proceso de estudio, sin saber a quién consultar fuera de los horarios de clase.
3. **Desorganización en el Cronograma:** La superposición de entregas de trabajos prácticos y parciales genera estrés extremo y abandono prematuro antes del primer turno de exámenes.

### 2.2 El Dolor Financiero de la Universidad
- Para una universidad privada con **300 ingresantes anuales**, una deserción del 50% significa perder 150 alumnos.
- Con una cuota mensual estimada de **\$120.000 ARS** (10 meses lectivos al año):
  - Pérdida anual de la cohorte: **\$180.000.000 ARS**.
  - Pérdida acumulada en una carrera de 5 años: **\$900.000.000 ARS**.
- **Costo de Adquisición de Alumnos (CAC):** Conseguir un nuevo ingresante cuesta millones en marketing y publicidad; retener al que ya ingresó es hasta 5 veces más rentable.

### 2.3 Tamaño de Mercado (TAM - SAM - SOM)
- **TAM (Total Addressable Market):** Más de 2.500.000 estudiantes universitarios en Argentina y más de 30.000.000 en Hispanoamérica.
- **SAM (Serviceable Addressable Market):** 140 universidades e institutos de educación superior en Argentina (públicos y privados), con más de 550.000 ingresantes anuales.
- **SOM (Serviceable Obtainable Market - 24 meses):** 10 a 15 instituciones privadas e institutos terciarios en la región NEA (Misiones, Corrientes, Chaco) y convenios de cátedra piloto (aproximadamente 4.500 usuarios activos).

---

## 3. PRODUCTO Y DIFERENCIACIÓN TECNOLÓGICA

### 3.1 Módulos de la Plataforma UniNav

| Módulo | Funcionalidad | Impacto en el Alumno |
| :--- | :--- | :--- |
| **Tutor Socrático RAG** | Chat de IA con citas exactas `[Pág. X]` que no redacta trabajos, sino que enseña a pensar mediante preguntas guía. | Evita el plagio y desarrolla pensamiento crítico sobre la bibliografía oficial. |
| **Glosario Universitario & Onboarding** | Guía de términos de vida universitaria según la carrera y facultad elegida. | Reduce el shock de transición secundaria-universidad. |
| **Banco Comunitario por Carrera** | Repositorio colaborativo de apuntes, resúmenes, parciales viejos y modelos de informes. | Crea sentido de pertenencia y apoyo entre pares. |
| **Simulador de Parciales** | Generador de quizes de opción múltiple y desarrollo con autoevaluación guiada. | Reduce la ansiedad pre-examen y entrena el formato real de evaluación. |
| **Pizarra & Anotador Digital** | OCR de pizarrón con Gemini Vision + Lienzo interactivo para dibujar y anotar fotos y PDFs. | Facilita el estudio visual y la transcripción de fórmulas manuscritas. |
| **Hardware IoT Pomodoro** | Lámpara semáforo de escritorio (ESP32) que señaliza bloques de estudio y descanso. | Fomenta hábitos de estudio sostenibles y señaliza al entorno familiar no interrumpir. |
| **Panel de Cátedra e Institucional** | Telemetría docente con mapa de calor de dudas y sistema de alerta temprana de deserción. | Permite al docente intervenir a tiempo antes de que el alumno repruebe. |

### 3.2 Cuadro Comparativo vs Competencia

| Criterio | UniNav | NotebookLM (Google) | ChatGPT / Claude | Moodle / Aula Virtual |
| :--- | :---: | :---: | :---: | :---: |
| **Tutor Socrático (no hace la tarea)** | SI | NO (Resume todo) | NO (Redacta de cero) | NO (Estático) |
| **Glosario Institucional y Adaptación** | SI | NO | NO | NO |
| **Banco Comunitario por Carrera** | SI | NO (Archivos privados) | NO | NO |
| **Simulador de Parciales Integrador** | SI | NO | NO | Básico (Manual) |
| **Panel de Alerta Temprana para Cátedras**| SI | NO | NO | Limitado a descargas |
| **Hardware IoT de Concentración** | SI | NO | NO | NO |
| **Enfoque B2B para Retención Universitaria**| SI | NO | NO | NO |

---

## 4. MODELO DE NEGOCIO Y ESTRATEGIA FINANCIERA

### 4.1 Esquema de Licenciamiento B2B

1. **Plan Institución Piloto (3 meses / Curso de Ingreso):**
   - \$800.000 ARS por cohorte de hasta 150 alumnos.
   - Incluye onboarding guiado, carga de bibliografía oficial, telemetría docente y reporte final de impacto y retención.

2. **Plan Institucional Anual (Universidades / Institutos Privados):**
   - \$2.400.000 a \$4.800.000 ARS por año (según volumen de 300 a 1.000 ingresantes).
   - Equivalente a \$800 ARS por estudiante/mes.
   - Acceso completo a todos los módulos web, panel de cátedra ilimitado, banco comunitario institucional y soporte técnico.

3. **Kits IoT Semáforo de Concentración (Hardware Companion):**
   - Kit DIY Open Hardware: Planos y código libre.
   - Dispositivo ensamblado institucional: \$12.000 ARS / unidad (opcional para laboratorios o becas de estudio).

### 4.2 Análisis del Retorno de Inversión (ROI) para la Universidad

- **Costo de la Licencia Anual:** \$3.000.000 ARS
- **Cuota Mensual Promedio por Alumno:** \$130.000 ARS (\$1.300.000 ARS / año lectivo de 10 cuotas)
- **Punto de Equilibrio (Break-even):**
  $$\text{Alumnos retenidos necesarios} = \frac{\$3.000.000}{\$1.300.000} \approx 2.3 \text{ alumnos}$$

> **Conclusión Financiera:** Si una universidad de 300 ingresantes utiliza UniNav y logra evitar que apenas **3 estudiantes** dejen la carrera en el primer año, la universidad ya obtiene **ganancia neta** sobre la inversión.

---

## 5. PLAN DE VALIDACIÓN Y PROGRAMA PILOTO (60 - 90 DÍAS)

Para responder a la necesidad de validación empírica planteada por asesores e inversores, UniNav implementa el siguiente protocolo experimental de validación:

```
[Diseño de Programa Piloto]
       │
       ├── Cohorte Experimental (50-100 alumnos con acceso a UniNav)
       └── Cohorte de Control (50-100 alumnos con métodos tradicionales)
       │
       ├── Hito 1 (Día 30): Tasa de retención al primer mes + Encuesta de adaptación
       ├── Hito 2 (Día 60): Tasa de aprobación del 1er Examen Parcial
       └── Hito 3 (Día 90): Tasa de permanencia final al cierre del cuatrimestre + NPS
```

### 5.1 Indicadores Clave de Desempeño (KPIs)

1. **KPI Principal de Retención:** 
   $$\Delta \text{Retención} = \% \text{Permanencia Grupo UniNav} - \% \text{Permanencia Grupo Control}$$
   *(Objetivo meta: Incrementar la retención relativa entre un +12% y +18%).*
2. **KPI de Rendimiento Académico:**
   - Tasa de aprobación en primera instancia del 1er parcial (Meta: > 70%).
3. **KPI de Alerta Temprana:**
   - % de alumnos en riesgo contactados por la cátedra antes de la semana 6 gracias a la telemetría del dashboard.
4. **KPI de Engagement y Satisfacción:**
   - Horas promedio de estudio semanal registradas.
   - Net Promoter Score (NPS) del estudiante > 65 puntos.

---

## 6. ESTRUCTURA DE COSTOS Y PROYECCIÓN A 3 AÑOS

### 6.1 Costos Operativos Unitarios (Infraestructura Cloud)
- **Base de Datos & Auth (Supabase Pro):** \$25 USD / mes
- **Modelos de IA (Google Gemini Flash + Embeddings 1536):** ~\$0.0002 USD por consulta RAG.
- **Hosting y Edge CDN (Vercel Pro):** \$20 USD / mes
- **Costo de servicio por estudiante activo al mes:** < \$0.15 USD (~ \$180 ARS). Margen bruto superior al **75%**.

### 6.2 Proyección de Crecimiento (3 Años)

| Métrica | Año 1 (2026-2027) | Año 2 (2027-2028) | Año 3 (2028-2029) |
| :--- | :---: | :---: | :---: |
| **Instituciones Clientes** | 3 (Pilotos y Regionales) | 12 (Región NEA / Centro) | 35 (Nacional) |
| **Estudiantes Activos** | 1.200 | 6.500 | 25.000 |
| **Ingresos Anuales (ARR)** | \$8.500.000 ARS | \$42.000.000 ARS | \$185.000.000 ARS |
| **Margen Operativo Neto** | 62% | 71% | 78% |

---

## 7. EQUIPO, ALIANZAS Y PRÓXIMOS PASOS

### 7.1 Estructura del Equipo y Ecosistema
- **Tomás Bogado:** Fundador, Arquitectura Técnica y Desarrollo Fullstack.
- **Alianzas Estratégicas:**
  - **Incade / Incubadoras Regionales:** Mentoría de negocios, acceso a redes universitarias y vinculación B2B.
  - **Centros de Estudiantes y Cátedras Piloto:** Validación en campo y carga de contenido curado por carrera.

### 7.2 Roadmap de Ejecución
- **Octubre 2026:** Presentación Final del Prototipo Funcional y Modelo de Negocio en Hackathon.
- **Noviembre - Diciembre 2026:** Cierre del primer convenio de prueba piloto con 1 institución educativa para el Curso de Ingreso 2027.
- **Febrero - Marzo 2027:** Ejecución y medición del Programa Piloto de Ingresantes 2027.
- **Junio 2027:** Publicación del primer Informe de Impacto en Retención Estudiantil y escalado comercial B2B.
