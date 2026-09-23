import Link from 'next/link'
import StudentTutorialTrigger from '@/components/StudentTutorialTrigger'
import {
  IconIncadeLogo,
  IconBook,
  IconDocument,
  IconChat,
  IconQuiz,
  IconCalendar,
  IconFlame,
  IconSparkles,
  IconLightbulb,
  IconCheck,
  IconUsers,
  IconShield,
  IconClock,
  IconVolume,
  IconChevronRight,
} from '@/components/icons'

export default function TutorialPage() {
  const steps = [
    {
      stepNumber: '01',
      badge: 'Primer Paso • Cátedra & Materias',
      title: 'Vincular Cátedra Oficial o Crear tus Materias',
      description:
        'UniNav te permite unirte directamente a las comisiones oficiales de tus docentes en INCADE o crear tus propios espacios de estudio personalizados.',
      icon: IconBook,
      color: 'indigo',
      details: [
        {
          title: 'Con Código PIN de Cátedra (Recomendado)',
          text: 'Si tu profesor te compartió un código de 6 caracteres (ej: AN104N), ingresalo en la tarjeta de sincronización del Inicio. Al hacerlo, heredarás automáticamente toda la bibliografía oficial, guías de TP y fechas de examen sin tener que cargar nada a mano.',
        },
        {
          title: 'Creación Manual de Materias',
          text: 'Para materias que aún no tengan cátedra digital creada, hacé clic en "+ Nueva Materia" desde el menú o el inicio. Podés asignarle nombre, color identificador y comenzar a subir tus apuntes personales.',
        },
      ],
    },
    {
      stepNumber: '02',
      badge: 'Material de Estudio • PDFs & Vectores',
      title: 'Carga de Apuntes, Guías y Modelos de Examen',
      description:
        'El motor de IA aprende única y exclusivamente de los documentos que vos o tu profesor carguen en cada materia.',
      icon: IconDocument,
      color: 'blue',
      details: [
        {
          title: 'Formatos Compatibles y Extracción Inteligente',
          text: 'Subí archivos PDF de libros, teóricos, diapositivas y guías de trabajos prácticos. El sistema extrae el texto por página y calcula representaciones vectoriales matemáticas (embeddings) para búsquedas instantáneas en milisegundos.',
        },
        {
          title: 'Ficha de Repaso Pre-Parcial en 1 Clic',
          text: 'Dentro de la biblioteca de apuntes, podés generar una síntesis ejecutiva estructurada con los conceptos nodales, definiciones clave y advertencias sobre trampas habituales de examen.',
        },
        {
          title: 'Modelos de Exámenes Viejos',
          text: 'Podés cargar parciales de años anteriores clasificándolos como "Examen Viejo" para que el simulador imite el estilo y formato exacto de evaluación del docente.',
        },
      ],
    },
    {
      stepNumber: '03',
      badge: 'Pedagogía Activa • Tutor Socrático',
      title: 'Tutor Socrático RAG con Citas Exactas de Página',
      description:
        'El tutor no hace la tarea por vos: te enseña a razonar y pensar como un futuro profesional de nivel superior.',
      icon: IconChat,
      color: 'emerald',
      details: [
        {
          title: 'Regla Pedagógica Socrática Estricta',
          text: 'Si le pedís "haceme el trabajo práctico" o "dame la solución del ejercicio 2", el tutor responderá con un desglose estructurado, conceptos teóricos clave y te pedirá tu primer borrador o planteo de variables.',
        },
        {
          title: 'Citas Bibliográficas Reales [Pág. X]',
          text: 'Cada afirmación o explicación teórica incluye una pastilla con el número de página exacto del documento de origen. Hacé clic sobre la cita para verificar el texto original.',
        },
        {
          title: 'Diagramas Mermaid, Dictado por Voz y Audio',
          text: 'Podés dictar tus consultas con el micrófono, escuchar las respuestas con el sintetizador de voz (TTS) y generar diagramas de flujo o mapas conceptuales Mermaid con solo tocar un botón.',
        },
      ],
    },
    {
      stepNumber: '04',
      badge: 'Autoevaluación • Simulador & Flashcards',
      title: 'Simulador de Parciales y Tarjetas Didácticas',
      description:
        'Entrená antes de presentarte a rendir frente a la mesa examinadora y afianzá conceptos clave.',
      icon: IconQuiz,
      color: 'purple',
      details: [
        {
          title: 'Simuladores Multiple Choice y a Desarrollar',
          text: 'Generá exámenes de práctica a medida. Para preguntas de desarrollo, el sistema te proporciona la rúbrica oficial de corrección para que te autoevalúes honestamente, eliminando cualquier riesgo de alucinación.',
        },
        {
          title: 'Tarjetas Didácticas (Flashcards)',
          text: 'Repasá definiciones técnicas, fórmulas y sintaxis con tarjetas interactivas giratorias y sistema de repetición espaciada para consolidar la memoria a largo plazo.',
        },
        {
          title: 'Telemetría Anónima para el Docente',
          text: 'Tus dudas y resultados en simuladores se agregan de forma completamente anónima en el Radar de Cátedra de tu profesor, permitiéndole reforzar en clase los temas donde el grupo tiene más dificultades.',
        },
      ],
    },
    {
      stepNumber: '05',
      badge: 'Hábitos & Hardware • Pomodoro IoT',
      title: 'Calendario, Cápsula de Foco y Lámpara de Estudio',
      description:
        'Gestioná tu tiempo, prevení la sobrecarga en semanas críticas y mantené encendida tu racha de estudio diaria.',
      icon: IconCalendar,
      color: 'amber',
      details: [
        {
          title: 'Calendario y Semanas Críticas',
          text: 'Cargá fechas de parciales, recuperatorios y entregas de TP. La plataforma detecta automáticamente "Semanas Críticas" cuando coinciden dos o más evaluaciones para que planifiques con anticipación.',
        },
        {
          title: 'Cápsula Pomodoro Flotante & Lámpara Semáforo IoT',
          text: 'Activá bloques de estudio concentrado (ej: 30 min foco / 10 min descanso). Podés sincronizarlo con una lámpara física de escritorio con luces LED que se pone roja en foco (no interrumpir) y verde en descanso.',
        },
        {
          title: 'Racha Diaria de Estudio',
          text: 'Cada día que realizás una actividad pedagógica (consultar al tutor, hacer un quiz o completar un bloque de estudio), tu racha aumenta. ¡Mantené tu constancia!',
        },
      ],
    },
  ]

  const faqs = [
    {
      q: '¿La Inteligencia Artificial de UniNav puede equivocarse o inventar respuestas (alucinar)?',
      a: 'A diferencia de otros chats de IA generalistas, UniNav utiliza RAG (Retrieval-Augmented Generation) estricto. Esto significa que la IA sólo responde basándose en el texto exacto de los apuntes y libros cargados en tu materia, indicando siempre la página [Pág. X]. Si un tema no está en la bibliografía, el sistema te informará explícitamente que no se encuentra en el material.',
    },
    {
      q: '¿Mis profesores pueden leer mis preguntas o conversaciones privadas en el chat?',
      a: 'No. Tus conversaciones con el Tutor Socrático son 100% privadas. El cuerpo docente únicamente visualiza un "Radar de Dudas" estadístico, agregado y anónimo (por ejemplo: "El 64% de los alumnos consultó sobre Matrices Inversas"), lo que les permite mejorar las clases sin vulnerar la privacidad de ningún estudiante.',
    },
    {
      q: '¿Qué ocurre si mis apuntes son fotocopias o fotos de pizarrón?',
      a: 'La plataforma cuenta con un módulo de extracción de apuntes y digitalización de pizarra con OCR (Reconocimiento Óptico de Caracteres). Para obtener los mejores resultados, te recomendamos subir PDFs generados digitalmente o fotos de pizarrón con buena iluminación y enfoque.',
    },
    {
      q: '¿Puedo utilizar UniNav desde mi teléfono celular o tablet?',
      a: 'Sí. Toda la plataforma está diseñada con interfaz responsiva y ligera, permitiéndote consultar al tutor, escuchar respuestas en audio o repasar flashcards mientras viajás en colectivo, estás en el aula o estudiás en la biblioteca.',
    },
    {
      q: '¿Cómo funciona la Lámpara Semáforo de Concentración?',
      a: 'Es un dispositivo de hardware libre (open source) basado en microcontrolador ESP32 de bajo costo (~$3 a $5 USD). Se conecta vía Wi-Fi a tu cuenta de UniNav y cambia de color según el temporizador Pomodoro: Rojo = Estudiando (avisa a tu familia/compañeros que no te interrumpan), Amarillo = Últimos minutos, Verde = Tiempo libre de descanso.',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 flex flex-col gap-10 select-none">
      {/* Hero Banner Co-Branded INCADE & UniNav */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#1E1B4B] via-[#2A2478] to-[#1E1B4B] p-6 sm:p-10 text-white shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/20 shadow-inner shrink-0">
              <IconIncadeLogo className="w-10 h-10" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                  CAMPUS INCADE • GUÍA OFICIAL
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Guía Integral del Estudiante
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl leading-relaxed">
                Aprendé a sacar el máximo provecho de tu plataforma de acompañamiento universitario, tutor socrático con IA, simuladores y herramientas de foco.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <StudentTutorialTrigger
              label="Iniciar Tour Interactivo (5 Pasos)"
              variant="white"
            />
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white px-4 py-3 text-xs font-bold transition-all text-center"
            >
              <span>Ir al Inicio</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mini Badges de Características Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15 text-xs">
          <div className="flex items-center gap-2 text-indigo-100">
            <IconShield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Citas Reales [Pág. X]</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-100">
            <IconLightbulb className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Pedagogía Socrática</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-100">
            <IconVolume className="w-4 h-4 text-sky-300 shrink-0" />
            <span>Audio & Voz Activo</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-100">
            <IconFlame className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Foco Pomodoro & IoT</span>
          </div>
        </div>
      </div>

      {/* Navegación Rápida por Pasos */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {steps.map((s, idx) => {
          const Icon = s.icon
          return (
            <a
              key={idx}
              href={`#paso-${s.stepNumber}`}
              className="rounded-2xl border border-slate-200 bg-white p-3 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col gap-1.5 shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                  {s.stepNumber}
                </span>
                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <span className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-950">
                {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
              </span>
            </a>
          )
        })}
      </div>

      {/* Secciones Detalladas Paso a Paso */}
      <div className="flex flex-col gap-8">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <div
              key={idx}
              id={`paso-${step.stepNumber}`}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6 scroll-mt-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E1B4B] text-white shadow-xs shrink-0 border border-slate-800">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full w-fit mb-1">
                      {step.badge}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      {step.stepNumber}. {step.title}
                    </h2>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-400 self-start sm:self-auto">
                  MÓDULO {step.stepNumber}/05
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {step.description}
              </p>

              {/* Tarjetas de Detalle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {step.details.map((detail, dIdx) => (
                  <div
                    key={dIdx}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4.5 flex flex-col gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black shrink-0">
                        {dIdx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">
                        {detail.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-7">
                      {detail.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sección de Demostración Visual: Anatomía de una Respuesta Socrática */}
      <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs shrink-0">
            <IconLightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Anatomía de una Respuesta del Tutor Socrático
            </h3>
            <p className="text-xs text-slate-500">
              Así es cómo UniNav estructura sus respuestas para garantizar que comprendas el fundamento teórico:
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-3 font-sans text-xs text-slate-800">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-[11px] text-slate-500 font-semibold">
            <span className="font-bold text-slate-900">Pregunta del Estudiante:</span>
            <span className="italic">"¿Qué es una matriz inversa y cuándo existe?"</span>
          </div>

          <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-slate-700">
            <p>
              Una matriz cuadrada <code className="bg-slate-100 font-mono px-1 py-0.2 rounded border border-slate-200">A</code> tiene inversa <code className="bg-slate-100 font-mono px-1 py-0.2 rounded border border-slate-200">A⁻¹</code> si y solo si su determinante es distinto de cero (<code className="bg-slate-100 font-mono px-1 py-0.2 rounded border border-slate-200">det(A) ≠ 0</code>), lo que garantiza que sus filas sean linealmente independientes.{' '}
              <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700 shadow-2xs">
                [Pág. 14]
              </span>
            </p>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex flex-col gap-1 text-[11px] text-amber-950">
              <span className="font-bold flex items-center gap-1 text-amber-900">
                <IconLightbulb className="w-3.5 h-3.5 text-amber-600" />
                Pregunta Guía para tu Razonamiento:
              </span>
              <p>
                Si calculás el determinante de una matriz de 2x2 con filas <code className="bg-white px-1 py-0.2 rounded border border-amber-200 font-mono">[2, 4]</code> y <code className="bg-white px-1 py-0.2 rounded border border-amber-200 font-mono">[1, 2]</code>, ¿qué valor obtenés y qué conclusión podés extraer sobre su invertibilidad?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preguntas Frecuentes (FAQ) */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xs shrink-0">
              <IconUsers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Preguntas Frecuentes (FAQ)
              </h2>
              <p className="text-xs text-slate-500">
                Respuestas directas a las dudas habituales de estudiantes ingresantes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, fIdx) => (
            <div
              key={fIdx}
              className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 flex flex-col gap-2 hover:border-slate-200 hover:bg-slate-50 transition-all"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                <span className="text-indigo-600 font-black">P:</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Final para Abrir Tour o Comenzar a Estudiar */}
      <div className="rounded-3xl border border-slate-200 bg-[#1E1B4B] p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg sm:text-xl font-black text-white">
            ¿Listo para arrancar tu cursada en INCADE?
          </h3>
          <p className="text-xs text-indigo-200 max-w-lg">
            Creá tus materias, subí tus guías o ingresá el código PIN de tu cátedra para comenzar ahora mismo.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <StudentTutorialTrigger
            label="Ver Tour de 5 Pasos"
            variant="primary"
          />
          <Link
            href="/materias"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#1E1B4B] px-4 py-2.5 text-xs font-black transition-all shadow-xs"
          >
            <span>Ir a Mis Materias</span>
            <IconChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
