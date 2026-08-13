import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSubject, deleteSubject } from './actions'

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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Encabezado */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis Materias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestioná tus materias del cuatrimestre y accedé a tus apuntes e IA socrática.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          ← Inicio
        </Link>
      </div>

      {/* Grid de Materias */}
      <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {subjects?.map((s) => {
          const deleteWithId = deleteSubject.bind(null, s.id)

          return (
            <div
              key={s.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/materias/${s.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                  >
                    📘
                  </Link>
                  <form action={deleteWithId}>
                    <button
                      type="submit"
                      className="rounded-lg p-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar materia y todo su contenido"
                    >
                      🗑️
                    </button>
                  </form>
                </div>
                <Link href={`/materias/${s.id}`} className="block mt-3">
                  <h2 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {s.name}
                  </h2>
                </Link>
              </div>
              <Link
                href={`/materias/${s.id}`}
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500"
              >
                <span>Ver workspace →</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              </Link>
            </div>
          )
        })}

        {(!subjects || subjects.length === 0) && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-600">Aún no tenés materias cargadas.</p>
            <p className="mt-1 text-xs text-slate-400">Agregá tu primera materia a continuación para empezar.</p>
          </div>
        )}
      </div>

      {/* Tarjeta para Agregar Materia */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm max-w-lg">
        <h2 className="text-base font-semibold text-slate-900">Agregar nueva materia</h2>
        <p className="mt-1 text-xs text-slate-500 mb-4">
          Ingresá el nombre oficial de la materia según tu plan de estudios.
        </p>

        <form action={createSubject} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="Ej: Análisis Matemático I, Física II..."
            required
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all shrink-0"
          >
            Agregar
          </button>
        </form>
      </div>
    </div>
  )
}
