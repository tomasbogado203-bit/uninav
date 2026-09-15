'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  IconBook,
  IconChat,
  IconQuiz,
  IconCalendar,
  IconFlame,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconLightbulb,
  IconSparkles,
  IconIncadeLogo,
} from '@/components/icons'

interface StudentTutorialModalProps {
  isOpen?: boolean
  onClose?: () => void
  autoTriggerOnFirstVisit?: boolean
}

export default function StudentTutorialModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  autoTriggerOnFirstVisit = true,
}: StudentTutorialModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const isControlled = externalIsOpen !== undefined
  const isOpen = isControlled ? externalIsOpen : internalIsOpen

  useEffect(() => {
    if (autoTriggerOnFirstVisit && !isControlled) {
      try {
        const completed = localStorage.getItem('uninav_student_tutorial_seen')
        if (!completed) {
          setInternalIsOpen(true)
        }
      } catch {
        // Ignorar errores de storage
      }
    }
  }, [autoTriggerOnFirstVisit, isControlled])

  const handleClose = () => {
    try {
      localStorage.setItem('uninav_student_tutorial_seen', 'true')
    } catch {
      // Ignorar errores
    }
    if (externalOnClose) {
      externalOnClose()
    } else {
      setInternalIsOpen(false)
    }
  }

  const steps = [
    {
      title: '¡Te damos la bienvenida al Campus de INCADE!',
      subtitle: 'Tu plataforma de acompañamiento universitario socrático con IA.',
      icon: IconIncadeLogo,
      badge: 'Paso 1 de 5 • Primeros Pasos',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
          <p>
            UniNav fue diseñada para que el salto del secundario al nivel superior sea claro, ordenado y sin frustraciones.
          </p>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 flex flex-col gap-2">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
              <IconSparkles className="w-3.5 h-3.5 text-indigo-600" />
              ¿Cómo arrancar?
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li>
                <strong>Vincular Cátedra Oficial:</strong> Si tu docente te dio un código PIN de 6 letras (ej: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">AN104N</code>), ingresalo en el inicio para heredar los apuntes oficiales de una sola vez.
              </li>
              <li>
                <strong>Crear tus Materias:</strong> Podés crear cada materia de tu cursada (*Matemática*, *Programación*, etc.) y personalizarla.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Carga de Apuntes y Bibliografía (PDFs)',
      subtitle: 'El motor de IA aprende únicamente de los textos que vos y tu cátedra carguen.',
      icon: IconBook,
      badge: 'Paso 2 de 5 • Material de Estudio',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
          <p>
            Cada materia tiene su propia biblioteca de apuntes privada e indexada con vectores de IA.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col gap-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              📄 ¿Qué podés subir?
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li><strong>Guías de Trabajos Prácticos y Teóricos:</strong> Libros y PDFs de clase. El sistema detecta automáticamente los temas principales.</li>
              <li><strong>Modelos de Exámenes Viejos:</strong> Subí parciales de años anteriores para que la IA entienda el estilo de evaluación de tu profesor.</li>
            </ul>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Tip: Podés generar una <strong>Ficha de Repaso Pre-Parcial</strong> en 1 clic desde la pestaña de apuntes.
          </p>
        </div>
      ),
    },
    {
      title: 'Tutor Socrático RAG con Citas Exactas',
      subtitle: 'La IA no te regala la tarea: te enseña a razonar como un profesional.',
      icon: IconChat,
      badge: 'Paso 3 de 5 • Aprendizaje Activo',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
          <p>
            A diferencia de ChatGPT tradicional, el <strong>Tutor Socrático de UniNav</strong> aplica pedagogía estricta:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 flex flex-col gap-1">
              <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                Citas Bibliográficas Reales
              </span>
              <p className="text-[11px] text-emerald-800">
                Cada afirmación incluye una pastilla <code className="bg-white border border-emerald-300 px-1 py-0.2 rounded font-mono text-[10px]">[Pág. 2]</code>. Hacé clic para ver el fragmento original del libro.
              </p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-2.5 flex flex-col gap-1">
              <span className="font-bold text-indigo-900 text-[11px] flex items-center gap-1">
                <IconLightbulb className="w-3.5 h-3.5 text-indigo-600" />
                Preguntas Guía Paso a Paso
              </span>
              <p className="text-[11px] text-indigo-800">
                Si preguntás <em>"¿Cómo resuelvo el ejercicio 3?"</em>, te preguntará cuál es tu primer borrador o variable identificada.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Podés usar dictado por voz (micrófono), escuchar las explicaciones en audio y generar <strong>Diagramas de Flujo Mermaid</strong> en 1 clic.
          </p>
        </div>
      ),
    },
    {
      title: 'Simuladores de Parcial y Tarjetas Didácticas',
      subtitle: 'Poné a prueba tu conocimiento antes de rendir frente al docente.',
      icon: IconQuiz,
      badge: 'Paso 4 de 5 • Autoevaluación',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
          <p>
            Practicar con exámenes simulados es la forma más efectiva de aprobar en el primer intento:
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col gap-2">
            <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
              <li>
                <strong>Simulador de Parciales:</strong> Genera exámenes Multiple Choice y a Desarrollar basados en la bibliografía oficial de tu cátedra.
              </li>
              <li>
                <strong>Tarjetas Didácticas (Flashcards):</strong> Repaso rápido de conceptos clave con sistema de repetición espaciada para fijar definiciones.
              </li>
              <li>
                <strong>Telemetría Anónima:</strong> Si muchos compañeros tienen dudas en el mismo tema, el profesor lo ve en su radar y lo refuerza en clase.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Calendario, Foco Pomodoro y Racha de Estudio',
      subtitle: 'Mantené la constancia y organizá tus semanas de exámenes.',
      icon: IconFlame,
      badge: 'Paso 5 de 5 • Hábitos y Foco',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-600">
          <div className="flex flex-col gap-2.5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2.5">
              <IconFlame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-amber-950 text-xs">Racha Diaria de Estudio</span>
                <p className="text-[11px] text-amber-900">
                  Cada día que consultás al tutor, resolvés un simulador o activás una sesión Pomodoro, tu racha aumenta. ¡Mantené el fuego encendido!
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3 flex items-start gap-2.5">
              <IconCalendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-indigo-950 text-xs">Cápsula Pomodoro / Lámpara IoT</span>
                <p className="text-[11px] text-indigo-900">
                  En la esquina superior derecha tenés la cápsula flotante de foco (ej: 30 min estudio / 10 min descanso). Podés arrastrarla o sincronizarla con tu lámpara física.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  if (!isOpen) return null

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera del Paso */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E1B4B] text-white shadow-xs shrink-0 border border-slate-800">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full w-fit mb-1">
                {currentStepData.badge}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {currentStepData.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="Cerrar tutorial"
          >
            ✕
          </button>
        </div>

        {/* Subtítulo y Contenido */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-700">
            {currentStepData.subtitle}
          </p>
          {currentStepData.content}
        </div>

        {/* Indicadores de Pasos (Dots) y Botones de Navegación */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-auto">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>

          {/* Botones Anterior / Siguiente / Finalizar */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              >
                <IconChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
              >
                <span>Siguiente</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
              >
                <IconCheck className="w-3.5 h-3.5" />
                <span>¡Empezar a Estudiar!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
