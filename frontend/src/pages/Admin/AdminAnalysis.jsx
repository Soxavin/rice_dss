import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { adminRequest } from '../../api/adminClient'

const MODE_STYLE = {
  HYBRID:        { color: '#166534', bg: '#dcfce7' },
  ML:            { color: '#1e40af', bg: '#dbeafe' },
  QUESTIONNAIRE: { color: '#92400e', bg: '#fef3c7' },
}

export default function AdminAnalysis() {
  const { getBackendToken } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = filter ? `?mode=${filter}` : ''
        const r = await adminRequest(getBackendToken, 'get', `/admin/analysis${params}`)
        setRecords(r.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Analysis Logs</h1>
          <p className="text-sm mt-0.5" style={{ color: '#757575' }}>All DSS diagnosis runs stored in PostgreSQL</p>
        </div>
        <div className="flex gap-2">
          {['', 'ML', 'QUESTIONNAIRE', 'HYBRID'].map(m => (
            <button key={m} onClick={() => setFilter(m)}
              className="px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer"
              style={filter === m ? { backgroundColor: '#558b2f', color: '#fff' } : { backgroundColor: '#f0f0f0', color: '#424242' }}>
              {m || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #e0e0e0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
              <th className="text-left px-5 py-3 font-semibold text-neutral-600">Condition</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600">Mode</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600">Confidence</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-neutral-400">Loading…</td></tr>
            ) : records.map(r => {
              const s = MODE_STYLE[r.mode] ?? MODE_STYLE.ML
              const condition = r.result?.condition_key ?? r.result?.primary_condition ?? '—'
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td className="px-5 py-3 font-medium capitalize text-neutral-900">{condition.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>{r.mode}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '—'}</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              )
            })}
            {!loading && !records.length && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-neutral-400">No analyses logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
