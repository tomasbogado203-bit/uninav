import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSubject, deleteSubject } from './actions'
import JoinCommissionCard from '@/components/JoinCommissionCard'
import {

  IconBook,
  IconTrash,
  IconChevronLeft,
  IconPlus,
  IconDocument,
  IconChat,
  IconQuiz,
  IconSparkles,
  IconCalendar,
  IconCamera,
} from '@/components/icons'

export default async function MateriasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, color, created_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 flex flex-col gap-6 select-none">
      {/* Encabezado Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
            Gestión Académica
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Mis Materias Cursadas
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Organiza tus materias del cuatrimestre y accede a tus apuntes, evaluaciones y tutor socrático.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <IconChevronLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </Link>
      </div>

      {/* Banner de Sincronización con Cátedra de Profesor */}
      <JoinCommissionCard />

      {/* Grid de Materias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects?.map((s) => {
          const deleteWithId = deleteSubject.bind(null, s.id)
          const formattedName = s.name.charAt(0).toUpperCase() + s.name.slice(1)
          const isAnalysis = formattedName.toLowerCase().includes('analisis') || formattedName.toLowerCase().includes('análisis')

          return (
            <div
              key={s.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all gap-5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                      <IconBook className="w-5 h-5" />
                    </span>
                    {isAnalysis ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span>●</span> Cátedra Oficial
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Materia Activa
                      </span>
                    )}
                  </div>

                  <form action={deleteWithId}>
                    <button
                      type="submit"
                      className="rounded-xl p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar materia"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                <Link href={`/materias/${s.id}`} className="block mt-1">
                  <h2 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {formattedName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Workspace RAG • 6 herramientas de estudio activas
                  </p>
                </Link>
              </div>

              {/* Botón Principal de Acceso y Accesos Rápidos */}
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                <Link
                  href={`/materias/${s.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white py-2.5 text-xs font-bold transition-all shadow-2xs"
                >
                  <span>Ingresar al Workspace</span>
                  <span className="text-indigo-300 font-normal">→</span>
                </Link>

                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 font-bold px-1">
                  <Link
                    href={`/materias/${s.id}/temas`}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    title="Tutor Socrático RAG"
                  >
                    <IconChat className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chat</span>
                  </Link>

                  <Link
                    href={`/materias/${s.id}/simulador`}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    title="Simulador de Parciales"
                  >
                    <IconQuiz className="w-3.5 h-3.5 text-purple-600" />
                    <span>Quiz</span>
                  </Link>

                  <Link
                    href={`/materias/${s.id}/tarjetas`}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    title="Tarjetas Didácticas"
                  >
                    <IconSparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tarjetas</span>
                  </Link>

                  <Link
                    href={`/materias/${s.id}/calendario`}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    title="Fechas de Examen"
                  >
                    <IconCalendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Fechas</span>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}

        {(!subjects || subjects.length === 0) && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
              <IconBook className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">Aún no tenés materias cargadas</p>
            <p className="text-xs text-slate-500">Agregá tu primera materia a continuación para comenzar.</p>
          </div>
        )}
      </div>

      {/* Formulario para Agregar Materia */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs max-w-lg mt-2">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <IconPlus className="w-4 h-4 text-indigo-600" />
          Agregar Nueva Materia
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 mb-4">
          Ingresá el nombre oficial de la materia según tu plan de estudios de la facultad.
        </p>

        <form action={createSubject} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="Ej: Análisis Matemático I, Algoritmos..."
            required
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-2xs hover:bg-indigo-700 transition-all shrink-0 cursor-pointer"
          >
            Agregar
          </button>
        </form>
      </div>
    </div>
  )
}
