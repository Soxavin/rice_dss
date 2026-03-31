import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Search, ArrowRight, MapPin } from 'lucide-react'

const SEARCH_RESULTS = [
  { type: 'ARTICLE', title: 'Rice Blast Disease', desc: 'A fungal infection caused by Magnaporthe oryzae affecting rice plants. It results in diamond-shaped lesions on leaves and severe grain loss, potentially reducing yields by up to 30%.', img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=200&q=80', link: '/learn/article/combating-blast' },
  { type: 'EXPERT', title: 'Dr. Ly Rottanak', desc: 'Senior Rice Pathologist & Research Lead. Specializes in fungal resistance and sustainable pest management in South Asian rice varieties. Over 15 years of field experience in diagnostic consulting.', img: '👨‍🔬', link: '/experts' },
  { type: 'ARTICLE', title: 'Optimizing Soil pH for Disease Resistance', desc: 'Maintaining the ideal soil pH in the rice for a line of defense against many common rice pathogens. Learn how soil alkalinity affects nutrient uptake and fungal growth.', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&q=80', link: '/learn/article/soil-ph' },
  { type: 'SUPPLIER', title: 'GreenGrowth Fertilizers', desc: 'Certified organic fertilizers and specialized pathogen treatments for industrial and small-scale rice farming. Official partner of the National Agriculture Bureau.', location: 'Phnom Penh, Cambodia', img: '🏢', link: '/experts?tab=Suppliers' },
]

export default function SearchResults() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [search, setSearch] = useState(query)
  const [activeTab, setActiveTab] = useState(null)

  const TABS = [
    { key: 'Articles',  label: t('search_articles') },
    { key: 'Videos',    label: t('search_videos') },
    { key: 'Experts',   label: t('search_experts_tab') },
    { key: 'Suppliers', label: t('search_suppliers_tab') },
  ]

  const filtered = activeTab
    ? SEARCH_RESULTS.filter((r) => r.type.toLowerCase() === activeTab.toLowerCase())
    : SEARCH_RESULTS

  const typeColors = {
    ARTICLE: 'bg-primary-100 text-primary-700',
    EXPERT: 'bg-amber-100 text-amber-700',
    SUPPLIER: 'bg-blue-100 text-blue-700',
    VIDEO: 'bg-purple-100 text-purple-700',
  }

  const typeActions = {
    ARTICLE: t('search_action_article'),
    EXPERT: t('search_action_expert'),
    SUPPLIER: t('search_action_supplier'),
    VIDEO: t('search_action_video'),
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
            className="border-none outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
            !activeTab ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-600 border-neutral-300'
          }`}
        >
          {t('search_all')}
        </button>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(activeTab === key ? null : key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
              activeTab === key ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-600 border-neutral-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8 space-y-4">
        {filtered.map((result, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 flex gap-5 hover:border-primary-300 transition-colors">
            {/* Image/avatar */}
            <div className="hidden sm:block w-20 h-20 rounded-lg bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
              {result.img.startsWith('http') ? (
                <img src={result.img} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl flex items-center justify-center w-full h-full">{result.img}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${typeColors[result.type] || 'bg-neutral-100 text-neutral-600'}`}>
                  {result.type}
                </span>
              </div>
              <h3 className="mt-1 font-bold text-neutral-900">{result.title}</h3>
              <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{result.desc}</p>
              {result.location && (
                <p className="mt-1 text-xs text-neutral-500 flex items-center gap-1">
                  <MapPin size={12} /> {result.location}
                </p>
              )}
            </div>

            {/* Action */}
            <div className="shrink-0 flex items-center">
              <Link
                to={result.link}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-primary-500 text-primary-600 hover:bg-primary-50 no-underline transition-colors whitespace-nowrap"
              >
                {typeActions[result.type]}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            className={`w-8 h-8 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
              n === 1 ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
