import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminRequest } from '../../api/adminClient'

const TYPE_STYLE = {
  EXPERT:   { color: '#1e40af', bg: '#dbeafe' },
  SUPPLIER: { color: '#92400e', bg: '#fef3c7' },
}

const EMPTY_FORM = {
  type: 'EXPERT', name_en: '', name_km: '', bio_en: '', bio_km: '',
  job_title_en: '', job_title_km: '', education_en: '', education_km: '',
  experience_years: '', rating: '', location_en: '', location_km: '',
  availability_en: '', availability_km: '', telegram: '', contact_email: '',
  photo_url: '', languages: '', online: false, is_active: true,
  specialization_names: '',
}

export default function AdminProfiles() {
  const { getBackendToken } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)  // null | 'new' | profile object
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState('ALL')

  async function load() {
    setLoading(true)
    try {
      const r = await adminRequest(getBackendToken, 'get', '/admin/profiles')
      setProfiles(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(EMPTY_FORM)
    setModal('new')
  }

  function openEdit(p) {
    setForm({
      ...p,
      experience_years: p.experience_years ?? '',
      rating: p.rating ?? '',
      specialization_names: p.specializations?.map(s => s.name).join(', ') ?? '',
    })
    setModal(p)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        ...form,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        rating: form.rating ? Number(form.rating) : null,
        specialization_names: form.specialization_names
          ? form.specialization_names.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      }
      if (modal === 'new') {
        await adminRequest(getBackendToken, 'post', '/admin/profiles', body)
      } else {
        await adminRequest(getBackendToken, 'patch', `/admin/profiles/${modal.id}`, body)
      }
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this profile?')) return
    await adminRequest(getBackendToken, 'delete', `/admin/profiles/${id}`)
    load()
  }

  const visible = filter === 'ALL' ? profiles : profiles.filter(p => p.type === filter)

  const Field = ({ label, field, type = 'text', rows }) => (
    <div>
      <label className="text-xs font-semibold text-neutral-600 block mb-1">{label}</label>
      {rows ? (
        <textarea rows={rows} value={form[field] ?? ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 text-sm resize-none" style={{ borderColor: '#e0e0e0' }} />
      ) : (
        <input type={type} value={form[field] ?? ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e0e0e0' }} />
      )}
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Profiles</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>Experts and suppliers shown on /experts</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ backgroundColor: '#558b2f' }}>
          <Plus size={16} /> New Profile
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['ALL', 'EXPERT', 'SUPPLIER'].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer"
            style={filter === t ? { backgroundColor: '#558b2f', color: '#fff' } : { backgroundColor: '#f0f0f0', color: '#424242' }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: '#f0f0f0' }} />)}</div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                <th className="text-left px-5 py-3 font-semibold text-neutral-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600">Title</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const s = TYPE_STYLE[p.type]
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="px-5 py-3 font-medium">{p.name_en}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>{p.type}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{p.job_title_en ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg border-none cursor-pointer hover:bg-neutral-100"><Pencil size={15} style={{ color: '#9e9e9e' }} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg border-none cursor-pointer hover:bg-red-50"><Trash2 size={15} style={{ color: '#ef4444' }} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!visible.length && <tr><td colSpan={4} className="px-5 py-10 text-center text-neutral-400">No profiles yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-5">{modal === 'new' ? 'New Profile' : 'Edit Profile'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e0e0e0' }}>
                  <option value="EXPERT">Expert</option>
                  <option value="SUPPLIER">Supplier</option>
                </select>
              </div>
              <Field label="Photo URL" field="photo_url" />
              <Field label="Name (EN)" field="name_en" />
              <Field label="Name (KM)" field="name_km" />
              <Field label="Job Title (EN)" field="job_title_en" />
              <Field label="Job Title (KM)" field="job_title_km" />
              <Field label="Location (EN)" field="location_en" />
              <Field label="Location (KM)" field="location_km" />
              <Field label="Availability (EN)" field="availability_en" />
              <Field label="Availability (KM)" field="availability_km" />
              <Field label="Experience (years)" field="experience_years" type="number" />
              <Field label="Rating (0–5)" field="rating" type="number" />
              <Field label="Telegram handle" field="telegram" />
              <Field label="Contact email" field="contact_email" type="email" />
              <Field label="Languages (comma-sep)" field="languages" />
              <Field label="Specializations (comma-sep)" field="specialization_names" />
              <div className="col-span-2"><Field label="Education (EN)" field="education_en" rows={2} /></div>
              <div className="col-span-2"><Field label="Education (KM)" field="education_km" rows={2} /></div>
              <div className="col-span-2"><Field label="Bio (EN)" field="bio_en" rows={3} /></div>
              <div className="col-span-2"><Field label="Bio (KM)" field="bio_km" rows={3} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="online" checked={form.online} onChange={e => setForm(p => ({ ...p, online: e.target.checked }))} />
                <label htmlFor="online" className="text-sm">Currently online</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                <label htmlFor="active" className="text-sm">Active (visible on site)</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm border cursor-pointer" style={{ borderColor: '#e0e0e0' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-60" style={{ backgroundColor: '#558b2f' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
