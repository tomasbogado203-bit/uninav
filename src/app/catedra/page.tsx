import { getUserRoleAction, getProfessorCommissionsAction } from './actions'
import CatedraDashboardView from './CatedraDashboardView'

export default async function CatedraPage() {
  const [userInfo, commissions] = await Promise.all([
    getUserRoleAction(),
    getProfessorCommissionsAction(),
  ])

  return (
    <CatedraDashboardView
      userRole={userInfo.role}
      userName={userInfo.full_name}
      universityName={userInfo.university || 'Facultad de Ciencias Exactas e Ingeniería'}
      commissions={commissions}
    />
  )
}
