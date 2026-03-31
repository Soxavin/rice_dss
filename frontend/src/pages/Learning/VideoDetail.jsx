import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Play, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react'

export default function VideoDetail() {
  const { id } = useParams()
  const { t } = useLanguage()

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="text-sm text-neutral-500">
          <Link to="/" className="hover:text-primary-600 no-underline text-neutral-500">{t('detail_breadcrumb_home')}</Link>
          {' › '}
          <Link to="/learn" className="hover:text-primary-600 no-underline text-neutral-500">{t('detail_breadcrumb_learn')}</Link>
          {' › '}
          <span className="text-neutral-800">{t('detail_breadcrumb_topic')}</span>
        </nav>
      </div>

      {/* Video hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-xl overflow-hidden bg-neutral-900">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80"
            alt="Video thumbnail"
            className="w-full h-64 sm:h-96 object-cover opacity-70"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-colors">
              <Play size={28} className="text-primary-600 ml-1" />
            </button>
          </div>
          {/* Video controls bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3 text-white text-sm">
              <Play size={16} />
              <span>00:00 / 13:00</span>
              <div className="flex-1 h-1 bg-white/30 rounded-full">
                <div className="w-0 h-1 bg-primary-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Video meta */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <span className="px-3 py-1 bg-primary-500 text-white text-xs rounded-full font-medium">Plant Diseases</span>
          <span className="text-xs text-neutral-500">📅 Feb 24, 2024</span>
          <span className="text-xs text-neutral-500">👁️ 1.2K views</span>
          <span className="text-xs text-neutral-500">By Dr. Soklam Chan</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Assistant */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">SM</div>
              </div>
              <div>
                <h3 className="font-semibold text-primary-800">{t('detail_ai_assistant')}</h3>
                <p className="mt-1 text-sm text-neutral-600">{t('detail_ai_desc')}</p>
                <button className="mt-3 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors">
                  {t('detail_try_ai')}
                </button>
              </div>
            </div>

            {/* About */}
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{t('detail_about_lesson')}</h2>
              <p className="mt-3 text-sm text-neutral-700 leading-relaxed">
                Bacterial Leaf Blight (BLB) is one of the most devastating diseases affecting rice crops globally. In this
                comprehensive guide, we walk through the earliest symptoms that often go unnoticed by the naked eye. Learn
                how to distinguish between BLB and common nutrient deficiencies.
              </p>
            </div>

            {/* Key takeaways */}
            <div>
              <p className="text-sm font-medium text-neutral-700">{t('detail_takeaways')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  'Identifying "kresek" symptoms in the seedling stage',
                  'Water-soaked lesions: Identification on leaf blades',
                  'Optimal weather conditions for disease spread',
                  'Organic and chemical control strategies',
                ].map((item) => (
                  <span key={item} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs rounded-full border border-neutral-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Helpful? */}
            <div className="pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">{t('detail_helpful')}</p>
              <div className="mt-2 flex gap-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-300 text-sm text-neutral-600 hover:border-primary-300 hover:text-primary-600 bg-white cursor-pointer">
                  <ThumbsUp size={14} /> {t('detail_thumbs_yes')}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-300 text-sm text-neutral-600 hover:border-red-300 hover:text-red-600 bg-white cursor-pointer">
                  <ThumbsDown size={14} /> {t('detail_thumbs_no')}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div>
            <h3 className="font-semibold text-neutral-900">{t('detail_related_videos')}</h3>
            <div className="mt-4 space-y-4">
              {[
                { title: 'Best Fertilization Practices for High-Yield Rice', views: '856 views' },
                { title: 'Managing Brown Spot: Plant Disease Treatment', views: '1.1K views' },
                { title: 'Advanced Soil Testing for Modern Agriculture', views: '620 views' },
                { title: 'Water Management in Dry Seasons', views: '940 views' },
              ].map((v) => (
                <Link
                  key={v.title}
                  to="/learn"
                  className="flex items-start gap-3 no-underline group"
                >
                  <div className="w-24 h-16 bg-neutral-200 rounded-lg shrink-0 flex items-center justify-center">
                    <Play size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors leading-snug">
                      {v.title}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">{v.views}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Find more */}
            <Link
              to="/learn"
              className="mt-6 block text-sm text-primary-600 font-medium no-underline hover:underline"
            >
              {t('detail_find_more')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
