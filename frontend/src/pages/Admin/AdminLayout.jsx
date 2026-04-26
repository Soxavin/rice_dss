import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, UserCheck, BarChart2, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/resources', label: 'Resources',  icon: FileText },
  { to: '/admin/profiles',  label: 'Profiles',   icon: UserCheck },
  { to: '/admin/users',     label: 'Users',      icon: Users },
  { to: '/admin/analysis',  label: 'Analysis',   icon: BarChart2 },
]

export default function AdminLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col" style={{ backgroundColor: '#1a2e0f', minHeight: '100vh' }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: '#2d4a1e' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a8d060' }}>Admin</p>
          <p className="text-sm font-bold text-white mt-0.5">Sro Meas</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'hover:bg-white/10'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#558b2f', color: '#fff' } : { color: '#c5dc8a' }}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: '#2d4a1e' }}>
          <p className="text-xs truncate mb-2 px-3" style={{ color: '#8aaa50' }}>{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors hover:bg-white/10"
            style={{ color: '#c5dc8a' }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
