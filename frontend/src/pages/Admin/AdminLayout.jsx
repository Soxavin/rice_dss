import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, UserCheck,
  BarChart2, LogOut, ArrowLeft, Shield,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ToastProvider } from '../../context/ToastContext'

const NAV = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/resources', label: 'Resources',  icon: FileText },
  { to: '/admin/profiles',  label: 'Profiles',   icon: UserCheck },
  { to: '/admin/users',     label: 'Users',      icon: Users },
  { to: '/admin/analysis',  label: 'Analysis',   icon: BarChart2 },
]

const ROLE_BADGE = {
  SUPER_ADMIN: { label: 'Super Admin', bg: '#c5a028', color: '#fff' },
  ADMIN:       { label: 'Admin',       bg: '#558b2f', color: '#fff' },
  USER:        { label: 'User',        bg: '#616161', color: '#fff' },
}

export default function AdminLayout() {
  const { logout, user, isSuperAdmin, isAdmin } = useAuth()
  const navigate = useNavigate()

  const role = isSuperAdmin ? 'SUPER_ADMIN' : isAdmin ? 'ADMIN' : 'USER'
  const badge = ROLE_BADGE[role]

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen" style={{ backgroundColor: '#f0f2f0' }}>
        {/* Sidebar */}
        <aside className="w-64 shrink-0 flex flex-col" style={{ backgroundColor: '#1a2e0f', minHeight: '100vh' }}>
          {/* Brand */}
          <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #2d4a1e' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#558b2f' }}>
                <Shield size={15} color="#fff" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Srov Meas</p>
                <p className="text-xs" style={{ color: '#8aaa50' }}>Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <Link
            to="/"
            className="flex items-center gap-2 mx-3 mt-3 mb-1 px-3 py-2 rounded-lg text-xs font-medium no-underline transition-colors hover:bg-white/10"
            style={{ color: '#8aaa50' }}
          >
            <ArrowLeft size={13} /> Back to website
          </Link>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all no-underline ${
                    isActive ? 'text-white' : 'hover:bg-white/10'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: '#2d5016', color: '#fff', borderLeft: '3px solid #c5a028', paddingLeft: 9 }
                    : { color: '#c5dc8a' }
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="px-3 pb-5 pt-3" style={{ borderTop: '1px solid #2d4a1e' }}>
            <div className="px-3 mb-3">
              <p className="text-xs font-semibold text-white truncate">{user?.displayName || 'Admin'}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#8aaa50' }}>{user?.email}</p>
              <span
                className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: badge.bg, color: badge.color, fontSize: 10 }}
              >
                {badge.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-colors hover:bg-white/10 cursor-pointer"
              style={{ color: '#c5dc8a', border: 'none', background: 'none' }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  )
}
