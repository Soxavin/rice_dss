import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { adminRequest } from '../../api/adminClient'

const STATUS_STYLE = {
  PUBLISHED: { color: '#166534', bg: '#dcfce7', label: 'Published' },
  SCHEDULED: { color: '#92400e', bg: '#fef3c7', label: 'Scheduled' },
  DRAFT:     { color: '#374151', bg: '#f3f4f6', label: 'Draft' },
}
const TYPE_STYLE = {
  ARTICLE: { color: '#1e40af', bg: '#dbeafe' },
  VIDEO:   { color: '#6b21a8', bg: '#f3e8ff' },
}

const STATUS_TABS = ['All', 'PUBLISHED', 'SCHEDULED', 'DRAFT']
const TYPE_TABS   = ['All', 'ARTICLE', 'VIDEO']

export default function AdminResources() {
  const navigate = useNavigate()
  const { getBackendToken } = useAuth()
  const { showToast } = useToast()
  const [resources, setResources] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusTab, setStatusTab] = useState('All')
  const [typeTab, setTypeTab]     = useState('All')

  async function load() {
    setLoading(true)
    try {
      const r = await adminRequest(getBackendToken, 'get', '/admin/resources')
      setResources(r.data)
    } catch {
      showToast('Failed to load resources', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function togglePublish(resource) {
    const newStatus = resource.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await adminRequest(getBackendToken, 'patch', `/admin/resources/${resource.id}`, { status: newStatus })
      showToast(`Resource ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}`)
      load()
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return
    try {
      await adminRequest(getBackendToken, 'delete', `/admin/resources/${id}`)
      showToast('Resource deleted')
      load()
    } catch {
      showToast('Failed to delete resource', 'error')
    }
  }

  const getTitle = (r) => r.translations?.find(t => t.language === 'EN')?.title ?? '(untitled)'
  const getCategory = (r) => r.category?.name ?? '—'

  const visible = useMemo(() => resources.filter(r => {
    const title = getTitle(r).toLowerCase()
    const matchSearch = !search.trim() || title.includes(search.toLowerCase())
    const matchStatus = statusTab === 'All' || r.status === statusTab
    const matchType   = typeTab   === 'All' || r.type   === typeTab
    return matchSearch && matchStatus && matchType
  }), [resources, search, statusTab, typeTab])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resources</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>Articles and videos shown on /learn</p>
        </div>
        <button onClick={() => navigate('/admin/resources/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 8px rgba(85,139,47,0.3)' }}>
          <Plus size={16} /> New Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search titles…"
            className="rounded-xl border pl-8 pr-3 py-1.5 text-sm outline-none"
            style={{ borderColor: '#e0e0e0', backgroundColor: '#fafafa', width: 200 }}
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => setStatusTab(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              style={statusTab === t
                ? { backgroundColor: '#558b2f', color: '#fff', border: 'none' }
                : { backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid #e8e8e8' }}>
              {t === 'All' ? 'All Status' : STATUS_STYLE[t]?.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5">
          {TYPE_TABS.map(t => (
            <button key={t} onClick={() => setTypeTab(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              style={typeTab === t
                ? { backgroundColor: '#1565c0', color: '#fff', border: 'none' }
                : { backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid #e8e8e8' }}>
              {t === 'All' ? 'All Types' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e8e8', backgroundColor: '#fafafa' }}>
              <th className="text-left px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">Category</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: '#f0f0f0', width: j === 0 ? 200 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.map(r => {
              const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.DRAFT
              const ty = TYPE_STYLE[r.type]   ?? TYPE_STYLE.ARTICLE
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td className="px-5 py-3.5 font-medium text-neutral-900 max-w-xs">
                    <span className="truncate block">{getTitle(r)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{ backgroundColor: ty.bg, color: ty.color }}>
                      {r.type.charAt(0) + r.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#9e9e9e' }}>{getCategory(r)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => togglePublish(r)}
                        title={r.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-neutral-100"
                        style={{ border: 'none', background: 'none' }}>
                        {r.status === 'PUBLISHED'
                          ? <EyeOff size={15} style={{ color: '#9e9e9e' }} />
                          : <Eye    size={15} style={{ color: '#558b2f' }} />}
                      </button>
                      <button onClick={() => navigate(`/admin/resources/${r.id}`)} title="Edit"
                        className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-neutral-100"
                        style={{ border: 'none', background: 'none' }}>
                        <Pencil size={15} style={{ color: '#9e9e9e' }} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} title="Delete"
                        className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-red-50"
                        style={{ border: 'none', background: 'none' }}>
                        <Trash2 size={15} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: '#9e9e9e' }}>
                  {resources.length === 0 ? 'No resources yet. Create one above.' : 'No results match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
