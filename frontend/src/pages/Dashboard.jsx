import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

const MANAGER_CARDS = [
  { label: 'Active Volunteers', value: '—' },
  { label: 'Open Shifts', value: '—' },
  { label: 'Season Fill Rate', value: '—' },
  { label: 'Upcoming (7 days)', value: '—' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager' || user?.role === 'super_admin'

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {isManager
              ? "Here's an overview of your roster."
              : 'Your upcoming shifts will appear here.'}
          </p>
        </div>

        {isManager ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MANAGER_CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              No shifts scheduled yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
