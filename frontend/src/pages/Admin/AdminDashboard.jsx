import { useEffect, useState } from 'react'
import { Users, FileText, UserCheck, BarChart2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminRequest } from '../../api/adminClient'
import { getResources, getProfiles } from '../../api/client'

export default function AdminDashboard() {
  const { getBackendToken } = useAuth()
  const [stats, setStats] = useState({ users: 0, resources: 0, profiles: 0, analyses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [users, resources, profiles, analyses] = await Promise.allSettled([
          adminRequest(getBackendToken, 'get', '/admin/users'),
          getResources(),
          getProfiles(),
          adminRequest(getBackendToken, 'get', '/admin/analysis?limit=200'),
        ])
        setStats({
          users:     users.value?.data?.length ?? 0,
          resources: resources.value?.data?.length ?? 0,
          profiles:  profiles.value?.data?.length ?? 0,
          analyses:  analyses.value?.data?.length ?? 0,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const CARDS = [
    { label: 'Total Users',      value: stats.users,     icon: Users,      color: '#558b2f', bg: '#f7fbe7' },
    { label: 'Resources',        value: stats.resources,  icon: FileText,   color: '#1e40af', bg: '#dbeafe' },
    { label: 'Profiles',         value: stats.profiles,   icon: UserCheck,  color: '#92400e', bg: '#fef3c7' },
    { label: 'Analyses Logged',  value: stats.analyses,   icon: BarChart2,  color: '#6b21a8', bg: '#f3e8ff' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Dashboard</h1>
      <p className="text-sm mb-8" style={{ color: '#757575' }}>Overview of the Sro Meas platform.</p>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: '#f0f0f0', height: 100 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: '#757575' }}>{label}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
