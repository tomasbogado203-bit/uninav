import { getFacultyAnalyticsAction } from './actions'
import InstitutionalDashboardView from './InstitutionalDashboardView'

export default async function InstitutionalPage() {
  const analyticsData = await getFacultyAnalyticsAction()

  return <InstitutionalDashboardView data={analyticsData} />
}
