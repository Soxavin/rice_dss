import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Leaf, FlaskConical, ClipboardList, User, Trash2, AlertCircle, Download } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { getFarmProfile, saveFarmProfile, getAnalyses, deleteAnalysis, clearAllAnalyses } from '../../lib/firestore'

// Reuse same confidence colours as Step3Results
const CONF_STYLE = {
  high:     { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  medium:   { bg: '#fefce8', border: '#fde047', text: '#854d0e' },
  possible: { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },
  low:      { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  ml_only:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
}

const MODE_LABEL = { ml: 'Image Only (AI)', questionnaire: 'Questionnaire', hybrid: 'Hybrid' }

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Analysis history card ─────────────────────────────────────────────────────
function HistoryCard({ item, t, onDelete, conditionCounts }) {
  const [open, setOpen] = useState(false)
  const [deleteState, setDeleteState] = useState('idle') // 'idle' | 'confirming' | 'deleting'
  const conf = CONF_STYLE[item.confidence_level] || CONF_STYLE.ml_only
  const navigate = useNavigate()

  const handleTrashClick = (e) => {
    e.stopPropagation()
    setDeleteState('confirming')
  }

  const handleConfirmDelete = async (e) => {
    e.stopPropagation()
    setDeleteState('deleting')
    await onDelete(item.id)
  }

  const handleCancelDelete = (e) => {
    e.stopPropagation()
    setDeleteState('idle')
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div className="w-full text-left px-5 py-4 bg-white flex items-center gap-4">
        {/* Clickable area for expand/collapse */}
        <button
          className="flex items-center gap-4 flex-1 min-w-0 border-none bg-transparent cursor-pointer text-left hover:bg-neutral-50 transition-colors rounded-xl -mx-1 px-1"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          {/* Condition badge */}
          <div
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: conf.bg, border: `1px solid ${conf.border}`, color: conf.text }}
          >
            {item.condition_key ? (t(`cond_name_${item.condition_key}`) || item.primary_condition) : (item.primary_condition || '—')}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">
              {item.confidence_label || item.confidence_level}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {formatDate(item.createdAt)} · {MODE_LABEL[item.mode] || item.mode}
            </p>
          </div>

          {open ? <ChevronUp size={16} className="text-neutral-400 shrink-0" /> : <ChevronDown size={16} className="text-neutral-400 shrink-0" />}
        </button>

        {/* Delete controls */}
        <div className="shrink-0 flex items-center gap-2">
          {deleteState === 'idle' && (
            <button
              onClick={handleTrashClick}
              aria-label={t('profile_delete_entry')}
              className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
              style={{ color: '#bdbdbd' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#bdbdbd'}
            >
              <Trash2 size={15} />
            </button>
          )}
          {deleteState === 'confirming' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">{t('profile_delete_confirm')}</span>
              <button
                onClick={handleConfirmDelete}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border-none cursor-pointer transition-colors"
                style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
              >
                {t('profile_delete_entry')}
              </button>
              <button
                onClick={handleCancelDelete}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border-none cursor-pointer bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-600"
              >
                {t('profile_cancel')}
              </button>
            </div>
          )}
          {deleteState === 'deleting' && (
            <span className="text-xs text-neutral-400">…</span>
          )}
        </div>
      </div>

      {open && (
        <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-100 space-y-4">
          {/* Immediate actions */}
          {item.recommendations?.immediate?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#558b2f' }}>{t('profile_rec_immediate')}</p>
              <ul className="space-y-1">
                {item.recommendations.immediate.map((r, i) => (
                  <li key={i} className="text-sm text-neutral-700 flex gap-2">
                    <span className="shrink-0 mt-0.5" style={{ color: '#558b2f' }}>•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Preventive */}
          {item.recommendations?.preventive?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#854d0e' }}>{t('profile_rec_preventive')}</p>
              <ul className="space-y-1">
                {item.recommendations.preventive.map((r, i) => (
                  <li key={i} className="text-sm text-neutral-700 flex gap-2">
                    <span className="shrink-0 mt-0.5" style={{ color: '#854d0e' }}>•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Secondary conditions */}
          {item.secondary_conditions?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-neutral-500">{t('profile_also_possible')}</p>
              <div className="flex flex-wrap gap-2">
                {item.secondary_conditions.map((sc, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-600">
                    {sc.condition || sc.condition_key}
                    {sc.score != null && <span className="ml-1 text-neutral-400">({Math.round(sc.score * 100)}%)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Run again */}
          <div className="pt-1">
            <button
              onClick={() => navigate('/detect', { state: { mode: item.mode } })}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#f0f7e6', color: '#558b2f' }}
            >
              {t('profile_run_again')}
            </button>
          </div>

          {/* Trend insight — shown when same condition appears 2+ times */}
          {conditionCounts && conditionCounts[item.primary_condition || item.condition_key] >= 2 && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
              <span className="shrink-0">⚠</span>
              <span>
                {t('profile_trend_seen')} {conditionCounts[item.primary_condition || item.condition_key]}× {t('profile_trend_times')}{' '}
                {t(`profile_trend_${item.condition_key}`) || t('profile_trend_generic')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ClearAllModal({ count, t, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#fef2f2' }}>
          <Trash2 size={20} style={{ color: '#dc2626' }} />
        </div>
        <h3 className="font-bold text-neutral-900 text-lg">{t('profile_clear_confirm_title')}</h3>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{t('profile_clear_confirm_body')}</p>
        <p className="text-sm font-semibold mt-1" style={{ color: '#dc2626' }}>
          {count} {count === 1 ? t('profile_clear_entry') : t('profile_clear_entries')} will be deleted.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer hover:bg-neutral-50 transition-colors disabled:opacity-60"
            style={{ borderColor: '#e0e0e0', color: '#616161', backgroundColor: '#fff' }}
          >
            {t('profile_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#dc2626' }}
          >
            {loading ? '…' : t('profile_clear_confirm_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // Farm profile form state
  const [form, setForm] = useState({ variety: '', region: '', field_size: '', planting_method: '', notes: '' })
  const [savedForm, setSavedForm] = useState(null)  // last Firestore-persisted snapshot
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [formLoading, setFormLoading] = useState(true)
  const [formSaving, setFormSaving] = useState(false)
  const [formSaved, setFormSaved] = useState(false)
  const [farmError, setFarmError] = useState(null)
  const [saveError, setSaveError] = useState(null)

  // Analysis history state
  const [analyses, setAnalyses] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Undo-delete state
  const [undoPending, setUndoPending] = useState(null) // { item, snapshot, timerId }

  // Clear all state
  const [clearModal, setClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)

  // Filter state
  const [filterMode, setFilterMode] = useState('all')
  const [filterCondition, setFilterCondition] = useState('all')

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) navigate('/sign-in')
  }, [isAuthenticated, navigate])

  // Load farm profile
  useEffect(() => {
    if (!user) return
    getFarmProfile(user.uid)
      .then(data => {
        const merged = { variety: '', region: '', field_size: '', planting_method: '', notes: '', ...(data || {}) }
        setForm(merged)
        setSavedForm(merged)
      })
      .catch(() => setFarmError(t('profile_farm_error')))
      .finally(() => setFormLoading(false))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load analysis history (first page)
  useEffect(() => {
    if (!user) return
    getAnalyses(user.uid)
      .then(({ items, lastDoc: ld, hasMore: hm }) => {
        setAnalyses(items)
        setLastDoc(ld)
        setHasMore(hm)
      })
      .catch(() => setHistoryError(t('profile_history_error')))
      .finally(() => setHistoryLoading(false))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFormSaved(false)
    setSaveError(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return
    setFormSaving(true)
    setSaveError(null)
    try {
      await saveFarmProfile(user.uid, form)
      setSavedForm({ ...form })
      setLastSavedAt(new Date())
      setFormSaved(true)
      setTimeout(() => setFormSaved(false), 2500)
    } catch {
      setSaveError(t('profile_save_error'))
    } finally {
      setFormSaving(false)
    }
  }

  const handleReset = () => {
    if (savedForm) {
      setForm({ ...savedForm })
      setFormSaved(false)
      setSaveError(null)
    }
  }

  const isFormDirty = savedForm !== null && JSON.stringify(form) !== JSON.stringify(savedForm)

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Condition', 'Confidence Level', 'Confidence Label', 'Score (%)', 'Mode', 'Immediate Actions', 'Preventive Measures'],
      ...analyses.map(a => [
        formatDate(a.createdAt),
        a.primary_condition || a.condition_key || '',
        a.confidence_level || '',
        a.confidence_label || '',
        a.score != null ? Math.round(a.score * 100) : '',
        MODE_LABEL[a.mode] || a.mode || '',
        (a.recommendations?.immediate || []).join(' | '),
        (a.recommendations?.preventive || []).join(' | '),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `srov-meas-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const { items, lastDoc: ld, hasMore: hm } = await getAnalyses(user.uid, lastDoc)
      setAnalyses(prev => [...prev, ...items])
      setLastDoc(ld)
      setHasMore(hm)
    } catch {
      setHistoryError(t('profile_history_error'))
    } finally {
      setLoadingMore(false)
    }
  }

  const handleDeleteAnalysis = (id) => {
    // Commit any already-pending delete before starting a new one
    if (undoPending) {
      clearTimeout(undoPending.timerId)
      deleteAnalysis(user.uid, undoPending.id).catch(() => {})
      setUndoPending(null)
    }
    const snapshot = analyses
    setAnalyses(prev => prev.filter(a => a.id !== id))
    const timerId = setTimeout(() => {
      deleteAnalysis(user.uid, id).catch(() => setHistoryError(t('profile_history_error')))
      setUndoPending(null)
    }, 5000)
    setUndoPending({ id, snapshot, timerId })
  }

  const handleUndoDelete = () => {
    if (!undoPending) return
    clearTimeout(undoPending.timerId)
    setAnalyses(undoPending.snapshot)
    setUndoPending(null)
  }

  const handleClearAll = async () => {
    // Commit any pending delete first
    if (undoPending) {
      clearTimeout(undoPending.timerId)
      await deleteAnalysis(user.uid, undoPending.id).catch(() => {})
      setUndoPending(null)
    }
    setClearing(true)
    try {
      await clearAllAnalyses(user.uid)
      setAnalyses([])
      setLastDoc(null)
      setHasMore(false)
      setFilterMode('all')
      setFilterCondition('all')
      setClearModal(false)
    } catch {
      setHistoryError(t('profile_history_error'))
    } finally {
      setClearing(false)
    }
  }

  // Summary stats computed from full history — keyed by condition_key for language-invariance
  const stats = useMemo(() => {
    if (!analyses.length) return null
    const counts = {}
    analyses.forEach(a => {
      const k = a.condition_key || a.primary_condition || 'unknown'
      counts[k] = (counts[k] || 0) + 1
    })
    const [mostCommonKey, mostCommonCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return {
      total: analyses.length,
      mostCommonKey,
      mostCommonCount,
      lastDate: formatDate(analyses[0].createdAt),
    }
  }, [analyses])

  // Condition counts for trend insight chips — keyed by condition_key
  const conditionCounts = useMemo(() => {
    const counts = {}
    analyses.forEach(a => {
      const k = a.condition_key
      if (k) counts[k] = (counts[k] || 0) + 1
    })
    return counts
  }, [analyses])

  // Unique condition_keys for dropdown (only shown when >1 distinct condition)
  const uniqueConditions = useMemo(() =>
    [...new Set(analyses.map(a => a.condition_key).filter(Boolean))].sort(),
    [analyses]
  )

  // Mode counts for tab badges
  const modeCounts = useMemo(() => {
    const counts = { all: analyses.length, ml: 0, hybrid: 0, questionnaire: 0 }
    analyses.forEach(a => { if (a.mode in counts) counts[a.mode]++ })
    return counts
  }, [analyses])

  // Filtered list
  const filteredAnalyses = useMemo(() => analyses.filter(a => {
    if (filterMode !== 'all' && a.mode !== filterMode) return false
    if (filterCondition !== 'all' && a.condition_key !== filterCondition) return false
    return true
  }), [analyses, filterMode, filterCondition])

  if (!isAuthenticated) return null

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm border border-neutral-200 focus:outline-none focus:border-primary-400 bg-white transition-colors"
  const labelClass = "block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5"

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold shrink-0">
            {user?.displayName?.[0]?.toUpperCase() || <User size={24} />}
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900">{t('profile_title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{user?.displayName || user?.email}</p>
        </div>
      </div>

      {/* ── Farm Information ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={18} style={{ color: '#558b2f' }} />
          <h2 className="font-heading text-lg font-bold text-neutral-800">{t('profile_farm_section')}</h2>
        </div>

        {/* Farm load error */}
        {farmError && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-start gap-2 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {farmError}
          </div>
        )}

        {formLoading ? (
          <div className="rounded-2xl p-6 space-y-4" style={{ border: '1px solid #e0e0e0' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
          </div>
        ) : (
          <form onSubmit={handleSave} className="rounded-2xl p-6 bg-white space-y-5" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="variety" className={labelClass}>{t('profile_variety')}</label>
                <input
                  id="variety" name="variety" type="text"
                  placeholder={t('profile_variety_placeholder')}
                  value={form.variety} onChange={handleFormChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="region" className={labelClass}>{t('profile_region')}</label>
                <input
                  id="region" name="region" type="text"
                  value={form.region} onChange={handleFormChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="field_size" className={labelClass}>{t('profile_field_size')}</label>
                <input
                  id="field_size" name="field_size" type="text"
                  value={form.field_size} onChange={handleFormChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="planting_method" className={labelClass}>{t('profile_planting_method')}</label>
                <select
                  id="planting_method" name="planting_method"
                  value={form.planting_method} onChange={handleFormChange}
                  className={inputClass}
                >
                  <option value="">—</option>
                  <option value="transplanted">{t('profile_method_transplanted')}</option>
                  <option value="direct">{t('profile_method_direct')}</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>{t('profile_notes')}</label>
              <textarea
                id="notes" name="notes" rows={3}
                value={form.notes} onChange={handleFormChange}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={formSaving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 8px rgba(85,139,47,0.3)' }}
              >
                {formSaving ? '…' : t('profile_save')}
              </button>
              {isFormDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer hover:bg-neutral-50 transition-colors"
                  style={{ borderColor: '#e0e0e0', color: '#757575', backgroundColor: '#fff' }}
                >
                  {t('profile_reset')}
                </button>
              )}
              {formSaved && (
                <span className="text-sm font-medium" style={{ color: '#558b2f' }}>{t('profile_saved')}</span>
              )}
              {!formSaved && lastSavedAt && !isFormDirty && (
                <span className="text-xs text-neutral-400">
                  Last saved: {lastSavedAt.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {saveError && (
                <span className="text-sm flex items-center gap-1.5" style={{ color: '#dc2626' }}>
                  <AlertCircle size={14} /> {saveError}
                </span>
              )}
            </div>
          </form>
        )}
      </section>

      {/* ── Analysis History ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} style={{ color: '#558b2f' }} />
            <h2 className="font-heading text-lg font-bold text-neutral-800">{t('profile_history_section')}</h2>
          </div>
          <div className="flex items-center gap-2">
            {analyses.length > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-neutral-100 transition-colors"
                  style={{ color: '#558b2f', backgroundColor: '#f0f7e6' }}
                >
                  <Download size={13} /> {t('profile_export_csv')}
                </button>
                <button
                  onClick={() => setClearModal(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-red-50 transition-colors"
                  style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}
                >
                  {t('profile_clear_all')}
                </button>
              </>
            )}
            <Link
              to="/detect"
              className="text-sm font-semibold no-underline px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#558b2f', color: '#fff', boxShadow: '0 2px 6px rgba(85,139,47,0.3)' }}
            >
              {t('profile_new_analysis')}
            </Link>
          </div>
        </div>

        {/* Summary stats bar */}
        {stats && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs" style={{ color: '#757575' }}>
            <span><strong className="text-neutral-800">{stats.total}</strong> {stats.total === 1 ? t('profile_stat_analysis') : t('profile_stat_analyses')}</span>
            <span>·</span>
            <span>{t('profile_stat_most_common')} <strong className="text-neutral-800">{t(`cond_name_${stats.mostCommonKey}`) || stats.mostCommonKey}</strong>{stats.mostCommonCount > 1 && <span className="ml-1 text-neutral-400">({stats.mostCommonCount}×)</span>}</span>
            <span>·</span>
            <span>{t('profile_stat_last')} <strong className="text-neutral-800">{stats.lastDate}</strong></span>
          </div>
        )}

        {/* Filters — only shown once history is loaded and non-empty */}
        {!historyLoading && analyses.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Mode tabs */}
            <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid #e0e0e0' }}>
              {[
                { key: 'all',           labelKey: 'profile_tab_all' },
                { key: 'ml',            labelKey: 'profile_tab_ml' },
                { key: 'hybrid',        labelKey: 'profile_tab_hybrid' },
                { key: 'questionnaire', labelKey: 'profile_tab_questionnaire' },
              ].filter(tab => tab.key === 'all' || modeCounts[tab.key] > 0).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterMode(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-none cursor-pointer transition-colors"
                  style={{
                    backgroundColor: filterMode === tab.key ? '#558b2f' : '#fff',
                    color: filterMode === tab.key ? '#fff' : '#616161',
                  }}
                >
                  {t(tab.labelKey)}
                  <span
                    className="text-xs rounded-full px-1.5 py-0.5 font-semibold"
                    style={{
                      backgroundColor: filterMode === tab.key ? 'rgba(255,255,255,0.25)' : '#f0f0f0',
                      color: filterMode === tab.key ? '#fff' : '#757575',
                    }}
                  >
                    {tab.key === 'all' ? modeCounts.all : modeCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Condition dropdown — only shown when >1 unique condition exists */}
            {uniqueConditions.length > 1 && (
              <select
                value={filterCondition}
                onChange={e => setFilterCondition(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer outline-none transition-colors"
                style={{ borderColor: '#e0e0e0', color: '#616161', backgroundColor: '#fff' }}
              >
                <option value="all">{t('profile_filter_all_conditions')}</option>
                {uniqueConditions.map(c => (
                  <option key={c} value={c}>{t(`cond_name_${c}`) || c}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* History error */}
        {historyError && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-start gap-2 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {historyError}
          </div>
        )}

        {historyLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded-2xl p-8 text-center bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <FlaskConical size={36} className="mx-auto mb-3" style={{ color: '#bdbdbd' }} />
            <p className="text-sm text-neutral-500">{t('profile_no_history')}</p>
            <Link
              to="/detect"
              className="inline-block mt-4 text-sm font-semibold no-underline px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#558b2f', color: '#fff' }}
            >
              {t('nav_start_analysis')}
            </Link>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="rounded-2xl p-6 text-center bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <p className="text-sm text-neutral-500">{t('profile_no_filter_match')}</p>
            <button
              onClick={() => { setFilterMode('all'); setFilterCondition('all') }}
              className="mt-3 text-xs font-semibold border-none bg-transparent cursor-pointer hover:underline"
              style={{ color: '#558b2f' }}
            >
              {t('profile_clear_filters')}
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredAnalyses.map(item => (
                <HistoryCard key={item.id} item={item} t={t} onDelete={handleDeleteAnalysis} conditionCounts={conditionCounts} />
              ))}
            </div>

            {/* Load more — only shown when no filters active (cursor-based) */}
            {hasMore && filterMode === 'all' && filterCondition === 'all' && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-5 py-2 rounded-xl text-sm font-semibold border cursor-pointer hover:bg-neutral-50 transition-colors disabled:opacity-60"
                  style={{ borderColor: '#e0e0e0', color: '#558b2f', backgroundColor: '#fff' }}
                >
                  {loadingMore ? '…' : t('profile_load_more')}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Undo delete toast ─────────────────────────────────────────────────── */}
      {undoPending && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl" style={{ backgroundColor: '#1c1c1e', color: '#fff', whiteSpace: 'nowrap' }}>
          <span>{t('profile_entry_deleted')}</span>
          <button
            onClick={handleUndoDelete}
            className="font-bold border-none bg-transparent cursor-pointer hover:underline"
            style={{ color: '#a8d060' }}
          >
            Undo
          </button>
        </div>
      )}

      {/* ── Clear all confirmation modal ──────────────────────────────────────── */}
      {clearModal && (
        <ClearAllModal
          count={analyses.length}
          t={t}
          loading={clearing}
          onConfirm={handleClearAll}
          onCancel={() => setClearModal(false)}
        />
      )}
    </div>
  )
}
