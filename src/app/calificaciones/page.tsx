import { getStudentGradesAction } from './actions'
import GradesDashboardView from './GradesDashboardView'

export default async function CalificacionesPage() {
  const data = await getStudentGradesAction()

  return <GradesDashboardView initialData={data} />
}
