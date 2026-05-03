import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, UserCheck, BarChart2, PlusCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { adminRequest } from '../../api/adminClient'

const card = {
  border: '1px solid #e0e0e0',
  borderRadius: 16,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  backgroundColor: '#fff',
}

const CONDITION_COLORS = {
  blast:            { bg: '#fef2f2', color: '#991b1b' },
  brown_spot:       { bg: '#fef3c7', color: '#92400e' },
  bacterial_blight: { bg: '#dbeafe', color: '#1e40af' },
  iron_toxicity:    { bg: '#fce7f3', color: '#9d174d' },
  n_deficiency:     { bg: '#f3e8ff', color: '#6b21a8' },
  salt_toxicity:    { bg: '#ecfdf5', color: '#065f46' },
}
const MODE_STYLE = {
  HYBRID:        { bg: '#dcfce7', color: '#166534' },
  ML:            { bg: '#dbeafe', color: '#1e40af' },
  QUESTIONNAIRE: { bg: '#fef3c7', color: '#92400e' },
}

export default function AdminDashboard() {
  const { getBackendToken, user } = useAuth()
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, resourcesRes, profilesRes, analysesRes, recentRes] = await Promise.allSettled([
          adminRequest(getBackendToken, 'get', '/admin/users'),
          adminRequest(getBackendToken, 'get', '/admin/resources'),
          adminRequest(getBackendToken, 'get', '/admin/profiles'),
          adminRequest(getBackendToken, 'get', '/admin/analysis?limit=200'),
          adminRequest(getBackendToken, 'get', '/admin/analysis?limit=5'),
        ])

        const users     = usersRes.value?.data ?? []
        const resources = resourcesRes.value?.data ?? []
        const profiles  = profilesRes.value?.data ?? []
        const analyses  = analysesRes.value?.data ?? []
        const recent    = recentRes.value?.data ?? []

        setData({
          totalUsers:       users.length,
          activeUsers:      users.filter(u => u.is_active).length,
          adminCount:       users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
          totalResources:   resources.length,
          publishedResources: resources.filter(r => r.status === 'PUBLISHED').length,
          draftResources:   resources.filter(r => r.status === 'DRAFT').length,
          totalProfiles:    profiles.length,
          activeProfiles:   profiles.filter(p => p.is_active).length,
          totalAnalyses:    analyses.length,
          recent,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('admin_dash_morning') : hour < 18 ? t('admin_dash_afternoon') : t('admin_dash_evening')

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          {greeting}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#757575' }}>
          {t('admin_dash_subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: '#e8e8e8', height: 110 }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: '#e8e8e8', height: 80 }} />
            ))}
          </div>
        </div>
      ) : data && (
        <>
          {/* Primary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            {[
              { label: t('admin_dash_total_users'),     value: data.totalUsers,     icon: Users,     color: '#558b2f', bg: '#f0f7e6' },
              { label: t('admin_dash_total_resources'), value: data.totalResources,  icon: FileText,  color: '#1e40af', bg: '#dbeafe' },
              { label: t('admin_dash_active_profiles'), value: data.activeProfiles,  icon: UserCheck, color: '#92400e', bg: '#fef3c7' },
              { label: t('admin_dash_analyses_logged'), value: data.totalAnalyses,   icon: BarChart2, color: '#6b21a8', bg: '#f3e8ff' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} style={card} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-neutral-900">{value}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#9e9e9e' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            <div style={card} className="p-4 flex items-center gap-4">
              <div>
                <p className="text-xs font-medium" style={{ color: '#9e9e9e' }}>{t('admin_dash_active_inactive')}</p>
                <p className="text-lg font-bold text-neutral-900 mt-0.5">
                  {data.activeUsers} <span style={{ color: '#bdbdbd', fontWeight: 400 }}>/ {data.totalUsers - data.activeUsers}</span>
                </p>
              </div>
            </div>
            <div style={card} className="p-4 flex items-center gap-4">
              <div>
                <p className="text-xs font-medium" style={{ color: '#9e9e9e' }}>{t('admin_dash_pub_draft')}</p>
                <p className="text-lg font-bold text-neutral-900 mt-0.5">
                  {data.publishedResources} <span style={{ color: '#bdbdbd', fontWeight: 400 }}>/ {data.draftResources}</span>
                </p>
              </div>
            </div>
            <div style={card} className="p-4 flex items-center gap-4">
              <div>
                <p className="text-xs font-medium" style={{ color: '#9e9e9e' }}>{t('admin_dash_admin_count')}</p>
                <p className="text-lg font-bold text-neutral-900 mt-0.5">{data.adminCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Recent analyses */}
            <div style={{ ...card, gridColumn: 'span 2' }} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-neutral-900">{t('admin_dash_recent')}</h2>
                <Link to="/admin/analysis" className="text-xs font-medium no-underline flex items-center gap-1" style={{ color: '#558b2f' }}>
                  {t('admin_dash_view_all')} <ArrowRight size={12} />
                </Link>
              </div>
              {data.recent.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#9e9e9e' }}>{t('admin_dash_no_analyses')}</p>
              ) : (
                <div className="space-y-2">
                  {data.recent.map(r => {
                    const condition = r.result?.condition_key ?? r.result?.primary_condition ?? '—'
                    const cs = CONDITION_COLORS[condition] ?? { bg: '#f5f5f5', color: '#424242' }
                    const ms = MODE_STYLE[r.mode] ?? MODE_STYLE.ML
                    return (
                      <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#fafafa' }}>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: cs.bg, color: cs.color }}>
                          {condition.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: ms.bg, color: ms.color }}>
                          {r.mode}
                        </span>
                        <span className="text-xs ml-auto" style={{ color: '#9e9e9e' }}>
                          {r.user_email ?? t('admin_analysis_unknown')}
                        </span>
                        <span className="text-xs" style={{ color: '#bdbdbd' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div style={card} className="p-5">
              <h2 className="font-semibold text-neutral-900 mb-4">{t('admin_dash_quick_actions')}</h2>
              <div className="space-y-2">
                {[
                  { label: t('admin_dash_add_resource'),  to: '/admin/resources/new', icon: PlusCircle },
                  { label: t('admin_dash_manage_users'),  to: '/admin/users',         icon: Users },
                  { label: t('admin_dash_view_analyses'), to: '/admin/analysis',      icon: BarChart2 },
                  { label: t('admin_dash_add_profile'),   to: '/admin/profiles',      icon: UserCheck },
                ].map(({ label, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl no-underline transition-colors hover:bg-neutral-50"
                    style={{ color: '#424242', border: '1px solid #f0f0f0' }}
                  >
                    <Icon size={15} style={{ color: '#558b2f' }} />
                    <span className="text-sm font-medium">{label}</span>
                    <ArrowRight size={13} className="ml-auto" style={{ color: '#bdbdbd' }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
