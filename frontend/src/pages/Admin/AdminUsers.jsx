import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldOff, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminRequest } from '../../api/adminClient'

export default function AdminUsers() {
  const { getBackendToken } = useAuth()
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await adminRequest(getBackendToken, 'get', '/admin/users')
      setUsers(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleRole(user) {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    await adminRequest(getBackendToken, 'patch', `/admin/users/${user.id}`, { role: newRole })
    load()
  }

  async function toggleActive(user) {
    await adminRequest(getBackendToken, 'patch', `/admin/users/${user.id}`, { is_active: !user.is_active })
    load()
  }

  const visible = search.trim()
    ? users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()))
    : users

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>Manage roles and account status</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          className="rounded-xl border px-3 py-2 text-sm w-56" style={{ borderColor: '#e0e0e0' }} />
      </div>

      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
              <th className="text-left px-5 py-3 font-semibold text-neutral-600">User</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-400">Loading…</td></tr>
            ) : visible.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td className="px-5 py-3">
                  <p className="font-medium text-neutral-900">{u.name ?? '—'}</p>
                  <p className="text-xs" style={{ color: '#9e9e9e' }}>{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={u.role === 'ADMIN' ? { backgroundColor: '#fce7f3', color: '#9d174d' } : { backgroundColor: '#f0f0f0', color: '#424242' }}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={u.is_active ? { backgroundColor: '#dcfce7', color: '#166534' } : { backgroundColor: '#fef2f2', color: '#991b1b' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => toggleRole(u)} title={u.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                      className="p-1.5 rounded-lg border-none cursor-pointer hover:bg-neutral-100">
                      {u.role === 'ADMIN'
                        ? <ShieldOff size={15} style={{ color: '#9e9e9e' }} />
                        : <ShieldCheck size={15} style={{ color: '#558b2f' }} />}
                    </button>
                    <button onClick={() => toggleActive(u)} title={u.is_active ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg border-none cursor-pointer hover:bg-neutral-100">
                      {u.is_active
                        ? <ToggleRight size={15} style={{ color: '#558b2f' }} />
                        : <ToggleLeft size={15} style={{ color: '#9e9e9e' }} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !visible.length && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
