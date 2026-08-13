import { createClient } from '@/lib/supabase/server'
import { completeOnboarding } from './actions'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: careers } = await supabase
    .from('careers')
    .select('id, name, university, faculty')
    .order('university')

  return (
    <div className="mx-auto mt-20 max-w-md p-6">
      <h1 className="mb-1 text-xl font-semibold">Contanos sobre vos</h1>
      <p className="mb-4 text-sm text-gray-500">
        Esto nos permite mostrarte el kit de herramientas de tu carrera.
      </p>

      <form action={completeOnboarding} className="flex flex-col gap-3">
        <input
          type="text"
          name="full_name"
          placeholder="Tu nombre"
          required
          className="rounded border px-3 py-2"
        />

        <select
          name="career_id"
          required
          defaultValue=""
          className="rounded border px-3 py-2"
        >
          <option value="" disabled>
            Elegí tu carrera
          </option>
          {careers?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.university}
            </option>
          ))}
        </select>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Continuar
        </button>
      </form>
    </div>
  )
}
