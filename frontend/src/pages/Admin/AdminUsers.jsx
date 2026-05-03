import { useState, useEffect } from 'react'
import { Lock, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { adminRequest } from '../../api/adminClient'

const ROLE_BADGE = {
  SUPER_ADMIN: { bg: '#fef9e7', color: '#92700a', label: 'Super Admin' },
  ADMIN:       { bg: '#f0f7e6', color: '#33691e', label: 'Admin' },
  USER:        { bg: '#f0f0f0', color: '#424242', label: 'User' },
}

const STATUS_BADGE = {
  true:  { bg: '#dcfce7', color: '#166534', label: 'Active' },
  false: { bg: '#fef2f2', color: '#991b1b', label: 'Inactive' },
}

const TABS = ['All', 'SUPER_ADMIN', 'ADMIN', 'USER']

// Confirmation modal
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <p className="text-sm text-neutral-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
            style={{ border: '1.5px solid #e0e0e0', background: '#fff', color: '#424242' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white"
            style={{ backgroundColor: '#c62828', border: 'none' }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const { getBackendToken, user: currentUser, isSuperAdmin } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState('All')
  const [confirm, setConfirm] = useState(null) // { message, onConfirm }

  async function load() {
    setLoading(true)
    try {
      const r = await adminRequest(getBackendToken, 'get', '/admin/users')
      setUsers(r.data)
    } catch {
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function setRole(u, newRole) {
    try {
      await adminRequest(getBackendToken, 'patch', `/admin/users/${u.id}`, { role: newRole })
      showToast(`${u.name || u.email} is now ${ROLE_BADGE[newRole]?.label}`)
      load()
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Failed to change role', 'error')
    }
  }

  async function toggleActive(u) {
    const action = u.is_active ? 'deactivate' : 'activate'
    setConfirm({
      message: `Are you sure you want to ${action} ${u.name || u.email}?`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          await adminRequest(getBackendToken, 'patch', `/admin/users/${u.id}`, { is_active: !u.is_active })
          showToast(`Account ${u.is_active ? 'deactivated' : 'activated'}`)
          load()
        } catch (e) {
          showToast(e?.response?.data?.detail || 'Failed to update account', 'error')
        }
      },
    })
  }

  const tabCounts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? users.length : users.filter(u => u.role === t).length
    return acc
  }, {})

  const visible = users.filter(u => {
    const matchTab = tab === 'All' || u.role === tab
    const matchSearch = !search.trim() ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const isOwnAccount = (u) => u.email === currentUser?.email
  const canModify = (u) => {
    if (isOwnAccount(u)) return false
    if (!isSuperAdmin && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) return false
    return true
  }

  return (
    <div className="p-8">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>Manage roles and account status</p>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="rounded-xl border px-3 py-2 text-sm w-60 outline-none"
          style={{ borderColor: '#e0e0e0', backgroundColor: '#fafafa' }}
        />
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors"
            style={tab === t
              ? { backgroundColor: '#558b2f', color: '#fff', border: 'none' }
              : { backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid #e0e0e0' }}>
            {t === 'All' ? 'All' : ROLE_BADGE[t]?.label} ({tabCounts[t]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e8e8', backgroundColor: '#fafafa' }}>
              <th className="text-left px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: '#f0f0f0', width: j === 0 ? 160 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.map(u => {
              const roleBadge   = ROLE_BADGE[u.role] ?? ROLE_BADGE.USER
              const statusBadge = STATUS_BADGE[u.is_active]
              const own = isOwnAccount(u)
              const editable = canModify(u)

              return (
                <tr key={u.id}
                  style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: own ? '#fffef5' : undefined }}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-neutral-900">
                      {u.name ?? '—'}
                      {own && <span className="ml-1.5 text-xs" style={{ color: '#9e9e9e' }}>(you)</span>}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9e9e9e' }}>{u.email}</p>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    {isSuperAdmin && editable ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select
                          value={u.role}
                          onChange={e => setRole(u, e.target.value)}
                          className="rounded-full text-xs font-semibold pr-6 pl-2.5 py-1 appearance-none cursor-pointer outline-none"
                          style={{ backgroundColor: roleBadge.bg, color: roleBadge.color, border: 'none' }}
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                        <ChevronDown size={11} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: roleBadge.color, pointerEvents: 'none' }} />
                      </div>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}>
                        {roleBadge.label}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                      {statusBadge.label}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-xs" style={{ color: '#9e9e9e' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      {!editable || own ? (
                        <div className="p-1.5 rounded-lg" title={own ? 'Cannot modify your own account' : 'Protected account'}>
                          <Lock size={14} style={{ color: '#d0d0d0' }} />
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleActive(u)}
                          title={u.is_active ? 'Deactivate account' : 'Activate account'}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-neutral-100"
                          style={{ border: 'none', background: 'none' }}
                        >
                          {u.is_active
                            ? <ToggleRight size={16} style={{ color: '#558b2f' }} />
                            : <ToggleLeft  size={16} style={{ color: '#9e9e9e' }} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: '#9e9e9e' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
