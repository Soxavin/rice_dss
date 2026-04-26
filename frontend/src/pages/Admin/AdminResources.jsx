import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminRequest } from '../../api/adminClient'

const STATUS_STYLE = {
  PUBLISHED: { color: '#166534', bg: '#dcfce7' },
  SCHEDULED: { color: '#92400e', bg: '#fef3c7' },
  DRAFT:     { color: '#374151', bg: '#f3f4f6' },
}

export default function AdminResources() {
  const navigate = useNavigate()
  const { getBackendToken } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading]     = useState(true)

  async function load() {
    setLoading(true)
    try {
      const r = await adminRequest(getBackendToken, 'get', '/admin/resources')
      setResources(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function togglePublish(resource) {
    const newStatus = resource.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    await adminRequest(getBackendToken, 'patch', `/admin/resources/${resource.id}`, { status: newStatus })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this resource?')) return
    await adminRequest(getBackendToken, 'delete', `/admin/resources/${id}`)
    load()
  }

  const getTitle = (r) => r.translations.find(t => t.language === 'EN')?.title ?? '(untitled)'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resources</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>Manage articles and videos shown in /learn</p>
        </div>
        <button onClick={() => navigate('/admin/resources/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
          style={{ backgroundColor: '#558b2f' }}>
          <Plus size={16} /> New Resource
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: '#f0f0f0' }} />)}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                <th className="text-left px-5 py-3 font-semibold text-neutral-600">Title (EN)</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {resources.map(r => {
                const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.DRAFT
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="px-5 py-3 font-medium text-neutral-900">{getTitle(r)}</td>
                    <td className="px-4 py-3 text-neutral-500 capitalize">{r.type.toLowerCase()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => togglePublish(r)} title={r.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          className="p-1.5 rounded-lg border-none cursor-pointer hover:bg-neutral-100">
                          {r.status === 'PUBLISHED' ? <EyeOff size={15} style={{ color: '#9e9e9e' }} /> : <Eye size={15} style={{ color: '#558b2f' }} />}
                        </button>
                        <button onClick={() => navigate(`/admin/resources/${r.id}`)} title="Edit"
                          className="p-1.5 rounded-lg border-none cursor-pointer hover:bg-neutral-100">
                          <Pencil size={15} style={{ color: '#9e9e9e' }} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} title="Delete"
                          className="p-1.5 rounded-lg border-none cursor-pointer hover:bg-red-50">
                          <Trash2 size={15} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!resources.length && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-neutral-400">No resources yet. Create one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
