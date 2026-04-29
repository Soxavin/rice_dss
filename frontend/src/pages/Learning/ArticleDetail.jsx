import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Share2, ArrowRight, ArrowLeft } from 'lucide-react'
import { getResource } from '../../api/client'

export default function ArticleDetail() {
  const { id } = useParams()
  const { t, lang } = useLanguage()
  const [resource, setResource] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    getResource(id)
      .then(r => setResource(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const translation = resource?.translations?.find(t => t.language === lang.toUpperCase())
                   || resource?.translations?.find(t => t.language === 'EN')
                   || null

  const fallbackTitle = resource?.translations?.find(t => t.language === 'EN')?.title
                     || resource?.translations?.[0]?.title
                     || ''

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-6 bg-neutral-100 rounded w-1/3" />
        <div className="h-64 bg-neutral-100 rounded-xl" />
        <div className="h-4 bg-neutral-100 rounded w-2/3" />
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-5/6" />
      </div>
    </div>
  )

  if (notFound || !resource) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <p className="text-5xl mb-4">📄</p>
      <h1 className="text-xl font-bold text-neutral-900 mb-2">Article not found</h1>
      <p className="text-neutral-500 text-sm mb-6">This article may have been removed or isn't published yet.</p>
      <Link to="/learn" className="inline-flex items-center gap-2 text-sm font-medium no-underline" style={{ color: '#558b2f' }}>
        <ArrowLeft size={14} /> Back to Learning Resources
      </Link>
    </div>
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="text-sm text-neutral-500">
          <Link to="/" className="hover:text-primary-600 no-underline text-neutral-500">{t('detail_breadcrumb_home')}</Link>
          {' › '}
          <Link to="/learn" className="hover:text-primary-600 no-underline text-neutral-500">{t('detail_breadcrumb_learn')}</Link>
          {' › '}
          <span className="text-neutral-800">{translation?.title || fallbackTitle}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="relative h-64 sm:h-80">
        <img
          src={resource.thumbnail_url || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80'}
          alt={translation?.title || ''}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white leading-snug">
            {translation?.title || fallbackTitle}
          </h1>
          {translation?.description && (
            <p className="mt-2 text-white/80 text-sm max-w-xl">{translation.description}</p>
          )}
        </div>
      </div>

      {/* Meta bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-4 border-b border-neutral-200 flex-wrap">
          {resource.category?.name && (
            <span className="px-3 py-1 text-white text-xs rounded-full font-medium" style={{ backgroundColor: '#558b2f' }}>
              {resource.category.name}
            </span>
          )}
          <span className="text-xs text-neutral-500 capitalize">{resource.type?.toLowerCase()}</span>
          {resource.published_at && (
            <span className="text-xs text-neutral-500">
              📅 {new Date(resource.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {resource.source && (
            <a href={resource.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 no-underline hover:underline">
              🔗 Source
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Article body */}
          <div className="lg:col-span-2">
            {translation?.content ? (
              <div
                className="prose prose-sm max-w-none text-neutral-700 leading-relaxed"
                style={{ lineHeight: '1.75' }}
                dangerouslySetInnerHTML={{ __html: translation.content }}
              />
            ) : (
              <div className="py-12 text-center text-neutral-400">
                <p className="text-sm">No content available in this language.</p>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between flex-wrap gap-3">
              <Link to="/learn" className="flex items-center gap-1.5 text-sm text-neutral-500 no-underline hover:text-primary-600 transition-colors">
                <ArrowLeft size={14} /> {t('detail_breadcrumb_learn')}
              </Link>
              <button className="flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-600 bg-transparent border-none cursor-pointer">
                <Share2 size={14} /> {t('detail_share')}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
              <h3 className="font-semibold text-primary-800">{t('detail_ai_assistant')}</h3>
              <p className="mt-2 text-sm text-neutral-600">{t('detail_ai_desc')}</p>
              <Link to="/detect" className="mt-4 block w-full py-2 text-center bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg no-underline transition-colors" style={{ backgroundColor: '#558b2f' }}>
                {t('detail_try_ai')}
              </Link>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-semibold text-neutral-900">{t('detail_related')}</h3>
              <div className="mt-4 space-y-3">
                <Link to="/learn" className="flex items-center justify-between text-sm text-neutral-700 hover:text-primary-600 no-underline py-2 border-b border-neutral-100">
                  {t('learn_browse_categories')} <ArrowRight size={14} />
                </Link>
                <Link to="/experts" className="flex items-center justify-between text-sm text-neutral-700 hover:text-primary-600 no-underline py-2 border-b border-neutral-100">
                  {t('learn_sidebar_expert_title')} <ArrowRight size={14} />
                </Link>
                <Link to="/detect" className="flex items-center justify-between text-sm text-neutral-700 hover:text-primary-600 no-underline py-2">
                  {t('detail_try_ai')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
