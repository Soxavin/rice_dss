import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Leaf, FlaskConical, ClipboardList, User } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { getFarmProfile, saveFarmProfile, getAnalyses } from '../../lib/firestore'

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
  // Firestore Timestamp has .toDate(), plain Date objects also work
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Analysis history card ─────────────────────────────────────────────────────
function HistoryCard({ item, t }) {
  const [open, setOpen] = useState(false)
  const conf = CONF_STYLE[item.confidence_level] || CONF_STYLE.ml_only

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <button
        className="w-full text-left px-5 py-4 bg-white flex items-center gap-4 border-none cursor-pointer hover:bg-neutral-50 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {/* Condition badge */}
        <div
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: conf.bg, border: `1px solid ${conf.border}`, color: conf.text }}
        >
          {item.primary_condition || item.condition_key || '—'}
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

      {open && (
        <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-100 space-y-4">
          {/* Immediate actions */}
          {item.recommendations?.immediate?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#558b2f' }}>Immediate Actions</p>
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
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#854d0e' }}>Preventive Measures</p>
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
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-neutral-500">Also Possible</p>
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
        </div>
      )}
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
  const [formLoading, setFormLoading] = useState(true)
  const [formSaving, setFormSaving] = useState(false)
  const [formSaved, setFormSaved] = useState(false)

  // Analysis history state
  const [analyses, setAnalyses] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) navigate('/sign-in')
  }, [isAuthenticated, navigate])

  // Load farm profile
  useEffect(() => {
    if (!user) return
    getFarmProfile(user.uid)
      .then(data => { if (data) setForm(f => ({ ...f, ...data })) })
      .finally(() => setFormLoading(false))
  }, [user])

  // Load analysis history
  useEffect(() => {
    if (!user) return
    getAnalyses(user.uid)
      .then(setAnalyses)
      .finally(() => setHistoryLoading(false))
  }, [user])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFormSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return
    setFormSaving(true)
    try {
      await saveFarmProfile(user.uid, form)
      setFormSaved(true)
      setTimeout(() => setFormSaved(false), 2500)
    } finally {
      setFormSaving(false)
    }
  }

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
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={formSaving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 8px rgba(85,139,47,0.3)' }}
              >
                {formSaving ? '…' : t('profile_save')}
              </button>
              {formSaved && (
                <span className="text-sm font-medium" style={{ color: '#558b2f' }}>{t('profile_saved')}</span>
              )}
            </div>
          </form>
        )}
      </section>

      {/* ── Analysis History ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} style={{ color: '#558b2f' }} />
            <h2 className="font-heading text-lg font-bold text-neutral-800">{t('profile_history_section')}</h2>
          </div>
          <Link
            to="/detect"
            className="text-sm font-semibold no-underline px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#558b2f', color: '#fff', boxShadow: '0 2px 6px rgba(85,139,47,0.3)' }}
          >
            + New Analysis
          </Link>
        </div>

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
        ) : (
          <div className="space-y-3">
            {analyses.map(item => (
              <HistoryCard key={item.id} item={item} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
