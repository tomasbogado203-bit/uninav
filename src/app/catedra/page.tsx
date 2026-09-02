import Link from 'next/link'
import { getUserRoleAction, getProfessorCommissionsAction } from './actions'
import CatedraDashboardView from './CatedraDashboardView'
import RoleSwitcherPill from '@/components/RoleSwitcherPill'
import { IconBook, IconChevronLeft, IconUsers } from '@/components/icons'

export default async function CatedraPage() {
  const userInfo = await getUserRoleAction()

  // Guard de Acceso: Si el usuario es un estudiante, mostrar pantalla de acceso docente
  if (userInfo.role === 'student') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 border border-purple-200 text-purple-600 shadow-sm text-3xl">
          👨‍🏫
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1 rounded-full">
              Acceso Docente
            </span>
            <RoleSwitcherPill currentRole="student" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Espacio Exclusivo para Profesores y Cátedras
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Esta sección permite a los docentes crear comisiones, subir bibliografía oficial y monitorear el mapa de calor de dudas de sus alumnos.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 max-w-md text-xs text-slate-600 flex flex-col gap-3 text-left">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <IconUsers className="w-4 h-4 text-purple-600" />
            <span>¿Sos alumno y tenés un código de comisión?</span>
          </div>
          <p>
            Para unirte a la cátedra de tu profesor, ingresá el código de 6 letras en tu panel de <Link href="/materias" className="text-indigo-600 font-bold underline">Mis Materias</Link>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-2xs"
          >
            <IconChevronLeft className="w-4 h-4" />
            <span>Volver a Mi Panel de Alumno</span>
          </Link>
        </div>
      </div>
    )
  }

  const commissions = await getProfessorCommissionsAction()

  return (
    <CatedraDashboardView
      userRole={userInfo.role}
      userName={userInfo.full_name}
      universityName={userInfo.university || 'Facultad de Ciencias Exactas e Ingeniería'}
      commissions={commissions}
    />
  )
}
