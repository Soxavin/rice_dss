import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Play, BookOpen, ArrowRight, Search, Users } from 'lucide-react'
import { getResources } from '../../api/client'

function trans(resource, lang) {
  const t = resource.translations?.find(t => t.language === lang.toUpperCase())
         || resource.translations?.find(t => t.language === 'EN')
         || {}
  return { title: t.title || '', description: t.description || '', content: t.content || '' }
}

function normalize(r, lang) {
  const t = trans(r, lang)
  const catName = r.category?.name || ''
  return {
    id:           r.id,
    title:        { en: (r.translations?.find(t => t.language === 'EN')?.title || ''), km: (r.translations?.find(t => t.language === 'KM')?.title || t.title) },
    description:  t.description,
    img:          r.thumbnail_url || '/images/analysis-leaf.jpg',
    type:         r.type?.toLowerCase() || 'article',
    category:     catName.toLowerCase().replace(/\s+/g, '_'),
    category_name: catName,
    displayTitle: t.title,
  }
}

export default function ResourcesList() {
  const { t, lang } = useLanguage()
  const [resources, setResources] = useState([])
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab]             = useState('all')
  const [search, setSearch]       = useState('')

  useEffect(() => {
    getResources()
      .then(r => setResources(r.data || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const items = useMemo(() => resources.map(r => normalize(r, lang)), [resources, lang])

  const categories = useMemo(() => {
    const map = {}
    items.forEach(item => {
      if (item.category_name) {
        if (!map[item.category]) map[item.category] = { key: item.category, name: item.category_name, items: [] }
        map[item.category].items.push(item)
      }
    })
    return Object.values(map)
  }, [items])

  const TABS = [
    { key: 'all',      label: t('learn_all') },
    { key: 'articles', label: t('learn_articles') },
    ...categories.map(c => ({ key: c.key, label: c.name })),
  ]

  const title = (item) => item.title[lang] || item.title.en || item.displayTitle || ''

  const filtered = items.filter(item => {
    if (tab === 'articles' && item.type !== 'article') return false
    if (tab !== 'all' && tab !== 'articles' && item.category !== tab) return false
    if (search && !title(item).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const Skeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ border: '1px solid #e0e0e0' }}>
          <div className="h-44 bg-neutral-100" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-neutral-100 rounded w-3/4" />
            <div className="h-3 bg-neutral-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )

  const Empty = ({ message }) => (
    <div className="py-16 text-center">
      <BookOpen size={32} className="mx-auto mb-3 text-neutral-300" />
      <p className="text-neutral-400 text-sm">{message}</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loadError && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }}>
          {t('learn_load_error')}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 italic">
            {t('learn_title')}
          </h1>
          <p className="mt-2 text-neutral-600">{t('learn_subtitle')}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 bg-white" style={{ border: '1px solid #e0e0e0' }}>
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('learn_search_placeholder')}
            className="border-none outline-none text-sm w-48"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors"
            style={tab === key
              ? { backgroundColor: '#558b2f', border: '1px solid #558b2f', color: '#fff' }
              : { border: '1px solid #e0e0e0', backgroundColor: '#fff', color: '#525252' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: articles */}
        <div className="lg:col-span-2 space-y-10">

          {/* Recommended */}
          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-4">{t('learn_recommended')}</h2>
            {loading ? <Skeleton /> : filtered.length === 0 ? (
              <Empty message={search ? t('learn_empty_search') : t('learn_empty_all')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filtered.slice(0, 2).map(item => (
                  <Link
                    key={item.id}
                    to={item.type === 'video' ? `/learn/video/${item.id}` : `/learn/article/${item.id}`}
                    className="group bg-white rounded-xl overflow-hidden no-underline"
                    style={{ border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  >
                    <div className="relative">
                      <img src={item.img} alt={title(item)} className="w-full h-44 object-cover"
                        onError={e => { e.target.src = '/images/analysis-leaf.jpg' }} />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Play size={20} className="text-primary-600 ml-0.5" />
                          </div>
                        </div>
                      )}
                      {item.category_name && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-white text-xs rounded-full font-medium" style={{ backgroundColor: '#558b2f' }}>
                          {item.category_name}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors leading-snug">
                        {title(item)}
                      </h3>
                      {item.description && <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{item.description}</p>}
                      <span className="mt-2 text-xs text-primary-600 font-medium flex items-center gap-1">
                        {item.type === 'video' ? t('learn_watch_video') : t('learn_read_article')} <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Latest Updates */}
          {!loading && filtered.length > 2 && (
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-4">{t('learn_latest')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {filtered.slice(2, 5).map(item => (
                  <Link
                    key={item.id}
                    to={item.type === 'video' ? `/learn/video/${item.id}` : `/learn/article/${item.id}`}
                    className="group bg-white rounded-lg overflow-hidden no-underline transition-colors"
                    style={{ border: '1px solid #e0e0e0' }}
                  >
                    <img src={item.img} alt={title(item)} className="w-full h-32 object-cover"
                      onError={e => { e.target.src = '/images/analysis-leaf.jpg' }} />
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 leading-snug">{title(item)}</h4>
                      <span className="mt-1 text-xs text-primary-600 font-medium flex items-center gap-1">
                        {item.type === 'video' ? t('learn_watch_video') : t('learn_read_article')} <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Browse by Categories */}
          {!loading && categories.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold text-neutral-900 italic">{t('learn_browse_categories')}</h2>
              {categories.map(cat => (
                <div key={cat.key} className="mt-6">
                  <h3 className="font-semibold text-neutral-800">{cat.name}</h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {cat.items.slice(0, 3).map(item => (
                      <Link
                        key={item.id}
                        to={`/learn/article/${item.id}`}
                        className="group bg-white rounded-lg overflow-hidden no-underline"
                        style={{ border: '1px solid #e0e0e0' }}
                      >
                        <img src={item.img} alt={title(item)} className="w-full h-32 object-cover"
                          onError={e => { e.target.src = '/images/analysis-leaf.jpg' }} />
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 leading-snug">{title(item)}</h4>
                          <span className="text-xs text-primary-600 font-medium flex items-center gap-1 mt-1">
                            {t('learn_read_article')} <ArrowRight size={12} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          <div className="rounded-xl p-5" style={{ backgroundColor: '#f7fbe7', border: '1px solid #a8d060' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} style={{ color: '#558b2f' }} />
              <h3 className="font-semibold text-sm" style={{ color: '#33691e' }}>{t('learn_sidebar_expert_title')}</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">{t('learn_sidebar_expert_desc')}</p>
            <Link to="/experts" className="mt-3 inline-block px-4 py-1.5 text-white text-xs font-medium rounded-lg no-underline" style={{ backgroundColor: '#558b2f' }}>
              {t('learn_sidebar_expert_btn')}
            </Link>
          </div>

          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-2">🌾 {t('learn_sidebar_tips_title')}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{t('learn_sidebar_tips_desc')}</p>
          </div>

          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-2">🌱 {t('learn_sidebar_soil_title')}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{t('learn_sidebar_soil_desc')}</p>
          </div>

          {/* Fresh Resources sidebar */}
          {!loading && items.length > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
              <h3 className="font-semibold text-sm text-neutral-900 mb-3">{t('learn_fresh_title')}</h3>
              <div className="space-y-3">
                {items.slice(0, 3).map(item => (
                  <Link
                    key={item.id}
                    to={item.type === 'video' ? `/learn/video/${item.id}` : `/learn/article/${item.id}`}
                    className="flex items-start gap-2 no-underline group"
                  >
                    <BookOpen size={14} className="text-primary-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-neutral-700 group-hover:text-primary-600 leading-snug">{title(item)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
