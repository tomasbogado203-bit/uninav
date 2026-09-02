import Link from 'next/link'
import { getUserRoleAction } from '@/app/catedra/actions'
import { getFacultyAnalyticsAction } from './actions'
import InstitutionalDashboardView from './InstitutionalDashboardView'
import RoleSwitcherPill from '@/components/RoleSwitcherPill'
import { IconChevronLeft, IconBuilding } from '@/components/icons'

export default async function InstitutionalPage() {
  const userInfo = await getUserRoleAction()

  // Guard de Acceso: Solo para Decanato y Administradores
  if (userInfo.role !== 'dean' && userInfo.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 border border-sky-200 text-sky-600 shadow-sm">
          <IconBuilding className="w-8 h-8 text-sky-600" />
        </div>


        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 border border-sky-200 px-3 py-1 rounded-full">
              Acceso Institucional
            </span>
            <RoleSwitcherPill currentRole={userInfo.role} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Centro de Retención Reservado para Decanatos
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Esta sección es para autoridades académicas, decanatos y directores de carrera que supervisan las métricas globales de retención y acreditación institucional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-2xs"
          >
            <IconChevronLeft className="w-4 h-4" />
            <span>Volver a Mi Panel Principal</span>
          </Link>
        </div>
      </div>
    )
  }

  const analyticsData = await getFacultyAnalyticsAction()

  return <InstitutionalDashboardView data={analyticsData} />
}
