import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../context/LanguageContext'
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

const inputStyle = { borderColor: '#e0e0e0', backgroundColor: '#fafafa', borderRadius: 8 }

function Field({ label, field, type = 'text', rows, form, setForm }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: '#616161' }}>{label}</label>
      {rows ? (
        <textarea rows={rows} value={form[field] ?? ''}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          className="w-full border px-3 py-2 text-sm resize-none outline-none"
          style={inputStyle} />
      ) : (
        <input type={type} value={form[field] ?? ''}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          className="w-full border px-3 py-2 text-sm outline-none"
          style={inputStyle} />
      )}
    </div>
  )
}

export default function AdminProfiles() {
  const { getBackendToken } = useAuth()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState('ALL')

  async function load() {
    setLoading(true)
    try {
      const r = await adminRequest(getBackendToken, 'get', '/admin/profiles')
      setProfiles(r.data)
    } catch {
      showToast(t('admin_profiles_toast_load_fail'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm(EMPTY_FORM); setModal('new') }

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
    if (!form.name_en.trim()) { showToast(t('admin_profiles_toast_name_req'), 'error'); return }
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
        showToast(t('admin_profiles_toast_created'))
      } else {
        await adminRequest(getBackendToken, 'patch', `/admin/profiles/${modal.id}`, body)
        showToast(t('admin_profiles_toast_updated'))
      }
      setModal(null)
      load()
    } catch {
      showToast(t('admin_profiles_toast_save_fail'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('admin_profiles_confirm_delete'))) return
    try {
      await adminRequest(getBackendToken, 'delete', `/admin/profiles/${id}`)
      showToast(t('admin_profiles_toast_deleted'))
      load()
    } catch {
      showToast(t('admin_profiles_toast_delete_fail'), 'error')
    }
  }

  const visible = filter === 'ALL' ? profiles : profiles.filter(p => p.type === filter)
  const fp = (field) => ({ label: field, field, form, setForm })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('admin_profiles_title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>{t('admin_profiles_subtitle')}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 8px rgba(85,139,47,0.3)' }}>
          <Plus size={16} /> {t('admin_profiles_new')}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[['ALL', t('admin_profiles_all')], ['EXPERT', t('admin_profiles_experts')], ['SUPPLIER', t('admin_profiles_suppliers')]].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
            style={filter === val
              ? { backgroundColor: '#558b2f', color: '#fff', border: 'none' }
              : { backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid #e8e8e8' }}>
            {lbl} ({val === 'ALL' ? profiles.length : profiles.filter(p => p.type === val).length})
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: '#f0f0f0' }} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e8e8', backgroundColor: '#fafafa' }}>
                <th className="text-left px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_profiles_col_name')}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_profiles_col_type')}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_profiles_col_title')}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_profiles_col_status')}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_profiles_col_specs')}</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const s = TYPE_STYLE[p.type] ?? TYPE_STYLE.EXPERT
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {p.photo_url
                          ? <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: '1px solid #e0e0e0' }} referrerPolicy="no-referrer" />
                          : <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: s.bg, color: s.color }}>{p.type === 'EXPERT' ? '🧑‍🌾' : '🏪'}</div>
                        }
                        <span className="font-medium text-neutral-900">{p.name_en}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: s.bg, color: s.color }}>
                        {p.type === 'EXPERT' ? t('admin_profiles_expert') : t('admin_profiles_supplier')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#616161' }}>{p.job_title_en ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={p.is_active ? { backgroundColor: '#dcfce7', color: '#166534' } : { backgroundColor: '#f5f5f5', color: '#9e9e9e' }}>
                        {p.is_active ? t('admin_profiles_active') : t('admin_profiles_inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: '#9e9e9e' }}>
                      {p.specializations?.length ? p.specializations.map(s => s.name).join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} title={t('admin_profiles_tip_edit')}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-neutral-100"
                          style={{ border: 'none', background: 'none' }}>
                          <Pencil size={15} style={{ color: '#9e9e9e' }} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} title={t('admin_profiles_tip_delete')}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-red-50"
                          style={{ border: 'none', background: 'none' }}>
                          <Trash2 size={15} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!visible.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#9e9e9e' }}>
                    {t('admin_profiles_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <h2 className="text-lg font-bold text-neutral-900">
                {modal === 'new' ? t('admin_profiles_modal_new') : `${t('admin_profiles_modal_edit')} ${form.name_en || t('admin_profiles_title')}`}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg cursor-pointer hover:bg-neutral-100"
                style={{ border: 'none', background: 'none' }}>
                <X size={18} style={{ color: '#9e9e9e' }} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Type + visibility */}
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#616161' }}>{t('admin_profiles_f_type')}</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border px-3 py-2 text-sm outline-none" style={inputStyle}>
                  <option value="EXPERT">{t('admin_profiles_expert')}</option>
                  <option value="SUPPLIER">{t('admin_profiles_supplier')}</option>
                </select>
              </div>
              <Field label={t('admin_profiles_f_photo')} field="photo_url" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_name_en')} field="name_en" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_name_km')} field="name_km" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_title_en')} field="job_title_en" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_title_km')} field="job_title_km" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_loc_en')} field="location_en" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_loc_km')} field="location_km" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_avail_en')} field="availability_en" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_avail_km')} field="availability_km" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_exp')} field="experience_years" type="number" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_rating')} field="rating" type="number" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_telegram')} field="telegram" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_email')} field="contact_email" type="email" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_langs')} field="languages" form={form} setForm={setForm} />
              <Field label={t('admin_profiles_f_specs')} field="specialization_names" form={form} setForm={setForm} />
              <div className="col-span-2"><Field label={t('admin_profiles_f_edu_en')} field="education_en" rows={2} form={form} setForm={setForm} /></div>
              <div className="col-span-2"><Field label={t('admin_profiles_f_edu_km')} field="education_km" rows={2} form={form} setForm={setForm} /></div>
              <div className="col-span-2"><Field label={t('admin_profiles_f_bio_en')} field="bio_en" rows={3} form={form} setForm={setForm} /></div>
              <div className="col-span-2"><Field label={t('admin_profiles_f_bio_km')} field="bio_km" rows={3} form={form} setForm={setForm} /></div>

              {/* Checkboxes */}
              <div className="col-span-2 flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.online} onChange={e => setForm(p => ({ ...p, online: e.target.checked }))} />
                  {t('admin_profiles_f_online')}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                  {t('admin_profiles_f_active')}
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ border: '1.5px solid #e0e0e0', background: '#fff', color: '#424242' }}>
                {t('admin_profiles_cancel')}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 8px rgba(85,139,47,0.3)' }}>
                {saving ? t('admin_profiles_saving') : modal === 'new' ? t('admin_profiles_create') : t('admin_profiles_save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
