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

          return (
            <div
              key={s.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-sm hover:border-indigo-300 transition-all gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/materias/${s.id}`}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs"
                  >
                    <IconBook className="w-4 h-4" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/materias/${s.id}`}
                      className="text-[10px] font-bold text-indigo-700 hover:underline bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full transition-colors"
                    >
                      Diagnóstico →
                    </Link>

                    <form action={deleteWithId}>
                      <button
                        type="submit"
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar materia y todo su contenido"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>

                <Link href={`/materias/${s.id}`} className="block mt-3">
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {formattedName}
                  </h2>
                </Link>
              </div>

              {/* Atajos Rápidos a las 6 Herramientas del Workspace */}
              <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100 text-[10px] font-bold">
                <Link
                  href={`/materias/${s.id}`}
                  className="rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                  title="Apuntes y PDFs"
                >
                  <IconDocument className="w-3 h-3 text-slate-500" />
                  <span>Apuntes</span>
                </Link>

                <Link
                  href={`/materias/${s.id}/temas`}
                  className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                  title="Tutor Socrático RAG"
                >
                  <IconChat className="w-3 h-3 text-emerald-600" />
                  <span>Chat</span>
                </Link>

                <Link
                  href={`/materias/${s.id}/simulador`}
                  className="rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                  title="Simulador de Parciales"
                >
                  <IconQuiz className="w-3 h-3 text-purple-600" />
                  <span>Quiz</span>
                </Link>

                <Link
                  href={`/materias/${s.id}/tarjetas`}
                  className="rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                  title="Tarjetas Didácticas"
                >
                  <IconSparkles className="w-3 h-3 text-indigo-600" />
                  <span>Tarjetas</span>
                </Link>

                <Link
                  href={`/materias/${s.id}/calendario`}
                  className="rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                  title="Calendario de la Materia"
                >
                  <IconCalendar className="w-3 h-3 text-amber-600" />
                  <span>Fechas</span>
                </Link>

                <Link
                  href={`/materias/${s.id}/pizarra`}
                  className="rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                  title="Fotos de Pizarra OCR"
                >
                  <IconCamera className="w-3 h-3 text-sky-600" />
                  <span>Pizarra</span>
                </Link>
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
