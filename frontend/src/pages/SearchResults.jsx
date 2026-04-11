import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Search, ArrowRight, MapPin } from 'lucide-react'
import { SEARCH_INDEX } from '../data/searchData'

const TYPE_COLORS = {
  article:  { bg: '#f0fdf4', color: '#16a34a' },
  video:    { bg: '#f5f3ff', color: '#7c3aed' },
  expert:   { bg: '#fffbeb', color: '#d97706' },
  supplier: { bg: '#eff6ff', color: '#2563eb' },
  service:  { bg: '#f7fbe7', color: '#33691e' },
}

const TYPE_ACTIONS = {
  article:  'Read Article',
  video:    'Watch Video',
  expert:   'View Expert',
  supplier: 'View Supplier',
  service:  'Go to Service',
}

function filterIndex(query, tab) {
  const q = query.toLowerCase().trim()
  return SEARCH_INDEX.filter((item) => {
    if (tab && item.type !== tab) return false
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      item.titleKm.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    )
  })
}

export default function SearchResults() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [search, setSearch] = useState(query)
  const [activeTab, setActiveTab] = useState(null)

  const TABS = [
    { key: 'article',  label: t('search_articles') },
    { key: 'video',    label: t('search_videos') },
    { key: 'expert',   label: t('search_experts_tab') },
    { key: 'supplier', label: t('search_suppliers_tab') },
  ]

  const filtered = filterIndex(query, activeTab)

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">{t('search_title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {t('search_showing')} {filtered.length} {t('search_results_for')} "<span className="font-medium text-neutral-700">{query}</span>"
          </p>
        </div>
        <div className="flex items-center gap-2 border border-neutral-300 rounded-lg px-3 py-2 bg-white w-72">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Refine search…"
            className="border-none outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
            !activeTab ? 'text-white border-primary-500' : 'bg-white text-neutral-600 border-neutral-300'
          }`}
          style={!activeTab ? { backgroundColor: '#558b2f', borderColor: '#558b2f' } : {}}
        >
          {t('search_all')}
        </button>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(activeTab === key ? null : key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
              activeTab === key ? 'text-white' : 'bg-white text-neutral-600 border-neutral-300'
            }`}
            style={activeTab === key ? { backgroundColor: '#558b2f', borderColor: '#558b2f' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-400 text-sm">No results for "<strong className="text-neutral-600">{query}</strong>"</p>
            <p className="text-xs text-neutral-300 mt-1">Try a disease name, expert, or topic</p>
          </div>
        ) : (
          filtered.map((result) => {
            const badge = TYPE_COLORS[result.type] || { bg: '#f5f5f5', color: '#616161' }
            const action = TYPE_ACTIONS[result.type] || 'View'
            const isEmoji = !result.img.startsWith('/')
            return (
              <div key={result.id} className="bg-white border border-neutral-200 rounded-xl p-5 flex gap-5 hover:border-primary-300 transition-colors">
                {/* Image/avatar */}
                <div className="hidden sm:flex w-20 h-20 rounded-lg bg-neutral-50 overflow-hidden shrink-0 items-center justify-center" style={{ border: '1px solid #f0f0f0' }}>
                  {isEmoji ? (
                    <span className="text-3xl">{result.img}</span>
                  ) : (
                    <img src={result.img} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.color }}>
                    {result.type}
                  </span>
                  <h3 className="mt-1.5 font-bold text-neutral-900 text-base">{result.title}</h3>
                  {result.desc && (
                    <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{result.desc}</p>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0 flex items-center">
                  <Link
                    to={result.link}
                    className="px-4 py-2 text-xs font-medium rounded-lg no-underline transition-colors whitespace-nowrap flex items-center gap-1"
                    style={{ border: '1px solid #558b2f', color: '#558b2f' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fbe7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {action} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
