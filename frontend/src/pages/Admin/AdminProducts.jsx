import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../context/LanguageContext'
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../../api/adminClient'
import { adminRequest } from '../../api/adminClient'

const EMPTY_FORM = {
  name_en: '', name_km: '', desc_en: '', desc_km: '',
  usage_instructions_en: '', usage_instructions_km: '',
  image_url: '', price: '', category: '', nutrients_json: '', profile_id: '',
}

const inputStyle = { borderColor: '#e0e0e0', backgroundColor: '#fafafa', borderRadius: 8 }

function Field({ label, field, type = 'text', rows, form, setForm, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: '#616161' }}>{label}</label>
      {rows ? (
        <textarea rows={rows} value={form[field] ?? ''}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full border px-3 py-2 text-sm resize-none outline-none"
          style={inputStyle} />
      ) : (
        <input type={type} value={form[field] ?? ''}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full border px-3 py-2 text-sm outline-none"
          style={inputStyle} />
      )}
    </div>
  )
}

export default function AdminProducts() {
  const { getBackendToken } = useAuth()
  const { showToast } = useToast()
  const { t } = useLanguage()

  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | 'edit'
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => {
    try {
      const [prodRes, suppRes] = await Promise.all([
        adminGetProducts(getBackendToken),
        adminRequest(getBackendToken, 'get', '/admin/profiles'),
      ])
      setProducts(prodRes.data || [])
      setSuppliers((suppRes.data || []).filter(p => p.type === 'SUPPLIER'))
    } catch {
      showToast(t('admin_products_toast_load_fail'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setModal('new')
  }

  const openEdit = (product) => {
    setForm({
      name_en:                  product.name_en || '',
      name_km:                  product.name_km || '',
      desc_en:                  product.desc_en || '',
      desc_km:                  product.desc_km || '',
      usage_instructions_en:    product.usage_instructions_en || '',
      usage_instructions_km:    product.usage_instructions_km || '',
      image_url:                product.image_url || '',
      price:                    product.price || '',
      category:                 product.category || '',
      nutrients_json:           product.nutrients_json ? JSON.stringify(product.nutrients_json, null, 2) : '',
      profile_id:               product.profile_id || '',
    })
    setEditing(product.id)
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditing(null) }

  const save = async () => {
    if (!form.name_en.trim()) { showToast('English name is required', 'error'); return }

    let nutrients = null
    if (form.nutrients_json.trim()) {
      try { nutrients = JSON.parse(form.nutrients_json) }
      catch { showToast(t('admin_products_toast_invalid_json'), 'error'); return }
    }

    const payload = {
      name_en:               form.name_en.trim() || null,
      name_km:               form.name_km.trim() || null,
      desc_en:               form.desc_en.trim() || null,
      desc_km:               form.desc_km.trim() || null,
      usage_instructions_en: form.usage_instructions_en.trim() || null,
      usage_instructions_km: form.usage_instructions_km.trim() || null,
      image_url:             form.image_url.trim() || null,
      price:                 form.price.trim() || null,
      category:              form.category.trim() || null,
      nutrients_json:        nutrients,
      profile_id:            form.profile_id || null,
    }

    setSaving(true)
    try {
      if (modal === 'new') {
        await adminCreateProduct(getBackendToken, payload)
        showToast(t('admin_products_toast_created'), 'success')
      } else {
        await adminUpdateProduct(getBackendToken, editing, payload)
        showToast(t('admin_products_toast_updated'), 'success')
      }
      closeModal()
      load()
    } catch {
      showToast(t('admin_products_toast_save_fail'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (id) => {
    try {
      await adminDeleteProduct(getBackendToken, id)
      showToast(t('admin_products_toast_deleted'), 'success')
      setConfirmDelete(null)
      load()
    } catch {
      showToast(t('admin_products_toast_delete_fail'), 'error')
    }
  }

  const supplierName = (profileId) => {
    const s = suppliers.find(s => s.id === profileId)
    return s ? s.name_en : '—'
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('admin_products_title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('admin_products_subtitle')}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl cursor-pointer border-none transition-opacity hover:opacity-85"
          style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 8px rgba(85,139,47,0.3)' }}
        >
          <Plus size={15} /> {t('admin_products_new')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div className="py-16 text-center text-sm text-neutral-400">Loading…</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm text-neutral-400">{t('admin_products_empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
                  {[
                    t('admin_products_col_name'),
                    t('admin_products_col_category'),
                    t('admin_products_col_supplier'),
                    t('admin_products_col_price'),
                    t('admin_products_col_actions'),
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name_en} className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ border: '1px solid #e0e0e0' }} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: '#f0f7e6', border: '1px solid #c5e09a' }}>
                            <Package size={18} style={{ color: '#558b2f' }} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900">{p.name_en}</p>
                          {p.name_km && <p className="text-xs text-neutral-400 mt-0.5">{p.name_km}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.category ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: '#f0f7e6', color: '#33691e', border: '1px solid #c5e09a' }}>
                          {p.category}
                        </span>
                      ) : <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{supplierName(p.profile_id)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: p.price ? '#558b2f' : undefined }}>
                      {p.price || <span className="text-neutral-400 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg cursor-pointer border-none transition-colors hover:bg-blue-50"
                          style={{ color: '#1e40af', backgroundColor: '#dbeafe' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          className="p-1.5 rounded-lg cursor-pointer border-none transition-colors hover:bg-red-100"
                          style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <h2 className="text-base font-bold text-neutral-900">
                  {modal === 'new' ? t('admin_products_modal_new') : t('admin_products_modal_edit')}
                </h2>
                <button onClick={closeModal} className="p-1.5 rounded-lg cursor-pointer border-none hover:bg-neutral-100" style={{ color: '#616161' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('admin_products_f_name_en') + ' *'} field="name_en" form={form} setForm={setForm} />
                  <Field label={t('admin_products_f_name_km')} field="name_km" form={form} setForm={setForm} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('admin_products_f_category')} field="category" form={form} setForm={setForm} />
                  <Field label={t('admin_products_f_price')} field="price" form={form} setForm={setForm} placeholder="e.g. $42.00" />
                </div>
                <Field label={t('admin_products_f_image')} field="image_url" form={form} setForm={setForm} placeholder="https://..." />

                {/* Supplier dropdown */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#616161' }}>{t('admin_products_f_supplier')}</label>
                  <select
                    value={form.profile_id}
                    onChange={e => setForm(p => ({ ...p, profile_id: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="">{t('admin_products_f_supplier_none')}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name_en}</option>
                    ))}
                  </select>
                </div>

                <Field label={t('admin_products_f_desc_en')} field="desc_en" rows={3} form={form} setForm={setForm} />
                <Field label={t('admin_products_f_desc_km')} field="desc_km" rows={3} form={form} setForm={setForm} />
                <Field label={t('admin_products_f_usage_en')} field="usage_instructions_en" rows={3} form={form} setForm={setForm} />
                <Field label={t('admin_products_f_usage_km')} field="usage_instructions_km" rows={3} form={form} setForm={setForm} />
                <Field label={`${t('admin_products_f_nutrients')} (JSON)`} field="nutrients_json" rows={4} form={form} setForm={setForm} placeholder='{"N": "0.63%", "P2O5": "0.48%"}' />
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 flex justify-end gap-3 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium rounded-xl cursor-pointer transition-colors hover:bg-neutral-50"
                  style={{ border: '1.5px solid #e0e0e0', color: '#616161', backgroundColor: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl border-none cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-60"
                  style={{ backgroundColor: '#558b2f' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
              <h3 className="font-bold text-neutral-900">{t('admin_products_confirm_delete')}</h3>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 text-sm font-medium rounded-xl cursor-pointer transition-colors"
                  style={{ border: '1.5px solid #e0e0e0', color: '#616161', backgroundColor: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => doDelete(confirmDelete)}
                  className="flex-1 py-2 text-sm font-semibold text-white rounded-xl border-none cursor-pointer"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
