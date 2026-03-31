import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { MessageCircle, Share2, ArrowRight } from 'lucide-react'

const HERO_IMG = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80'

export default function ArticleDetail() {
  const { id } = useParams()
  const { t } = useLanguage()

  // Placeholder article content — in production this comes from CMS/database
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

      {/* Hero banner */}
      <div className="relative h-64 sm:h-80">
        <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white">
            Combatting Rice Blast:<br />A Comprehensive Guide
          </h1>
          <p className="mt-2 text-white/80 text-sm max-w-xl">
            Learn about symptoms, causes, and effective prevention strategies for Magnaporthe oryzae.
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-4 border-b border-neutral-200">
          <span className="px-3 py-1 bg-primary-500 text-white text-xs rounded-full font-medium">Plant Diseases</span>
          <span className="text-xs text-neutral-500">📅 Feb 15, 2024</span>
          <span className="text-xs text-neutral-500">📄 By Source: Ministry of Agriculture</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article content — 2/3 */}
          <div className="lg:col-span-2 prose-sm max-w-none">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              🔎 {t('detail_symptoms')}
            </h2>
            <p className="mt-3 text-neutral-700 leading-relaxed">
              Rice Blast is caused by the fungus Magnaporthe oryzae. It can affect all above-ground parts of the
              rice plant: leaf, collar, node, internode, base of panicle, and sometimes the leaf sheath.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h4 className="font-semibold text-sm text-neutral-900">Leaf Blast</h4>
                <p className="text-xs text-neutral-600 mt-1">Diamond-shaped spots with gray to white centers and brown to reddish borders. Lesions 1-1.5 cm in expanded form.</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h4 className="font-semibold text-sm text-neutral-900">Neck Blast</h4>
                <p className="text-xs text-neutral-600 mt-1">Infection at the panicle base, affecting the panicle neck, causing it to rot and break. Leading to unfilled grains.</p>
              </div>
            </div>

            <h2 className="mt-8 text-xl font-bold text-neutral-900 flex items-center gap-2">
              🧬 {t('detail_causes')}
            </h2>
            <p className="mt-3 text-neutral-700 leading-relaxed">
              The fungus produces spores that are easily spread by wind and water. High humidity (over 90%)
              and temperatures between 25-28°C are ideal for infection. Excessive nitrogen fertilizer usage often
              increases the plant's susceptibility to the disease.
            </p>
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Note:</strong> Early morning dew is a critical factor for spore germination. Plants that remain wet for more
                than 8-10 hours are at high risk.
              </p>
            </div>

            <h2 className="mt-8 text-xl font-bold text-neutral-900 flex items-center gap-2">
              🛡️ {t('detail_prevention')}
            </h2>
            <p className="mt-3 text-neutral-700 leading-relaxed">
              An integrated approach is best for managing rice blast. Relying on a single method often leads to
              resistance or failure.
            </p>
            <div className="mt-4 space-y-3">
              {[
                { title: 'Resistant Varieties', desc: 'The most cost-effective way is to plant rice varieties that have built-in resistance to the local blast strains.' },
                { title: 'Water Management', desc: 'Alternate wetting and drying (AWD) to reduce leaf wetness period. Drought stress makes plants more vulnerable.' },
                { title: 'Proper Fertilization', desc: 'Avoid excessive nitrogen application. Split the nitrogen application into two to three doses distributed throughout the season.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-900">{item.title}</h4>
                    <p className="text-xs text-neutral-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center gap-4">
              <span className="text-sm text-neutral-500">{t('detail_want_more')}</span>
              <button className="flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-600 bg-transparent border-none cursor-pointer">
                <Share2 size={14} /> {t('detail_share')}
              </button>
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
              <h3 className="font-semibold text-primary-800">{t('detail_ai_assistant')}</h3>
              <p className="mt-2 text-sm text-neutral-600">{t('detail_ai_desc')}</p>
              <button className="mt-4 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg border-none cursor-pointer transition-colors">
                {t('detail_try_ai')}
              </button>
            </div>

            {/* Related Topics */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-semibold text-neutral-900">{t('detail_related')}</h3>
              <div className="mt-4 space-y-3">
                {[
                  'Identifying Bacterial Leaf Blight',
                  'Optimal Nitrogen Scheduling',
                  'Water Management for Beginners',
                ].map((topic) => (
                  <Link
                    key={topic}
                    to="/learn"
                    className="flex items-center justify-between text-sm text-neutral-700 hover:text-primary-600 no-underline py-2 border-b border-neutral-100 last:border-0"
                  >
                    {topic} <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
