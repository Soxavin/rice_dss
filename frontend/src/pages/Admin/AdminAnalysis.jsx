import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../context/LanguageContext'
import { adminRequest } from '../../api/adminClient'

const MODE_STYLE = {
  HYBRID:        { color: '#166534', bg: '#dcfce7' },
  ML:            { color: '#1e40af', bg: '#dbeafe' },
  QUESTIONNAIRE: { color: '#92400e', bg: '#fef3c7' },
}

const CONDITION_STYLE = {
  blast:            { color: '#991b1b', bg: '#fef2f2' },
  brown_spot:       { color: '#92400e', bg: '#fef3c7' },
  bacterial_blight: { color: '#1e40af', bg: '#dbeafe' },
  iron_toxicity:    { color: '#9d174d', bg: '#fce7f3' },
  n_deficiency:     { color: '#6b21a8', bg: '#f3e8ff' },
  salt_toxicity:    { color: '#065f46', bg: '#ecfdf5' },
}

const MODE_TABS = ['All', 'HYBRID', 'ML', 'QUESTIONNAIRE']

function exportCSV(records) {
  const headers = ['ID', 'User Email', 'Condition', 'Mode', 'Confidence', 'Date']
  const rows = records.map(r => [
    r.id,
    r.user_email ?? '',
    (r.result?.condition_key ?? r.result?.primary_condition ?? '').replace(/_/g, ' '),
    r.mode,
    r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '',
    new Date(r.created_at).toLocaleString(),
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analyses_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminAnalysis() {
  const { getBackendToken } = useAuth()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modeFilter, setModeFilter] = useState('')
  const [fromDate, setFromDate]     = useState('')
  const [toDate, setToDate]         = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', '200')
        if (modeFilter) params.set('mode', modeFilter)
        if (fromDate)   params.set('from_date', new Date(fromDate).toISOString())
        if (toDate)     params.set('to_date', new Date(toDate + 'T23:59:59').toISOString())
        const r = await adminRequest(getBackendToken, 'get', `/admin/analysis?${params}`)
        setRecords(r.data)
      } catch {
        showToast(t('admin_analysis_toast_fail'), 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [modeFilter, fromDate, toDate])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('admin_analysis_title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>{t('admin_analysis_subtitle')}</p>
        </div>
        <button
          onClick={() => { exportCSV(records); showToast(t('admin_analysis_toast_exported')) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors hover:opacity-90"
          style={{ border: '1.5px solid #558b2f', color: '#33691e', background: '#fff' }}
          disabled={!records.length}
        >
          <Download size={15} /> {t('admin_analysis_export')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* Mode filter */}
        <div className="flex gap-1.5">
          {MODE_TABS.map(m => (
            <button key={m} onClick={() => setModeFilter(m === 'All' ? '' : m)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              style={(modeFilter === m || (m === 'All' && !modeFilter))
                ? { backgroundColor: '#558b2f', color: '#fff', border: 'none' }
                : { backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid #e8e8e8' }}>
              {m}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 ml-2">
          <label className="text-xs font-medium" style={{ color: '#9e9e9e' }}>{t('admin_analysis_from')}</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="rounded-xl border px-2.5 py-1.5 text-xs outline-none"
            style={{ borderColor: '#e0e0e0', backgroundColor: '#fafafa' }} />
          <label className="text-xs font-medium" style={{ color: '#9e9e9e' }}>{t('admin_analysis_to')}</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="rounded-xl border px-2.5 py-1.5 text-xs outline-none"
            style={{ borderColor: '#e0e0e0', backgroundColor: '#fafafa' }} />
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate('') }}
              className="text-xs cursor-pointer" style={{ color: '#9e9e9e', background: 'none', border: 'none' }}>
              {t('admin_analysis_clear')}
            </button>
          )}
        </div>

        <span className="ml-auto text-xs" style={{ color: '#9e9e9e' }}>{records.length} {t('admin_analysis_records')}</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e8e8', backgroundColor: '#fafafa' }}>
              <th className="text-left px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_analysis_col_condition')}</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_analysis_col_mode')}</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_analysis_col_confidence')}</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_analysis_col_user')}</th>
              <th className="text-left px-4 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wide">{t('admin_analysis_col_date')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: '#f0f0f0', width: j === 0 ? 140 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : records.map(r => {
              const condition = r.result?.condition_key ?? r.result?.primary_condition ?? '—'
              const cs = CONDITION_STYLE[condition] ?? { bg: '#f5f5f5', color: '#616161' }
              const ms = MODE_STYLE[r.mode] ?? MODE_STYLE.ML
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{ backgroundColor: cs.bg, color: cs.color }}>
                      {condition.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: ms.bg, color: ms.color }}>
                      {r.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-neutral-700">
                    {r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#757575' }}>
                    {r.user_email ?? <span style={{ color: '#bdbdbd' }}>{t('admin_analysis_unknown')}</span>}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#9e9e9e' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              )
            })}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: '#9e9e9e' }}>
                  {t('admin_analysis_empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
