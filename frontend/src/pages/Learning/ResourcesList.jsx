import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Play, BookOpen, ArrowRight, Search, Users } from 'lucide-react'

const SAMPLE_ARTICLES = [
  { id: 'combating-blast',   title: { en: 'Combating Bacterial Leaf Blight',  km: 'ការប្រឆាំងជំងឺបាក់តេរីស្លឹក' },        category: 'plant_diseases',      type: 'article', img: '/images/article1.jpg' },
  { id: 'early-detection',   title: { en: 'Early Detection of Stem Borers',   km: 'ការរកឃើញដំបូងនូវសត្វស្វានដំឡប' },      category: 'plant_diseases',      type: 'article', img: '/images/article2.jpg' },
  { id: 'fertilizer-timing', title: { en: 'Optimal Fertilizer Timing',         km: 'ពេលវេលាល្អបំផុតសម្រាប់ដាក់ជីបំប៉ន' },  category: 'nutrient_deficiency', type: 'video',   img: '/images/article3.jpg' },
  { id: 'soil-ph',           title: { en: 'Understanding Soil pH',             km: 'ការយល់ដឹងអំពី pH ដី' },                  category: 'nutrient_deficiency', type: 'article', img: '/images/article4.jpg' },
  { id: 'irrigation',        title: { en: 'Efficient Irrigation Systems',      km: 'ប្រព័ន្ធស្រោចស្រពប្រកបដោយប្រសិទ្ធភាព' }, category: 'water_management',    type: 'video',   img: '/images/article1.jpg' },
]

export default function ResourcesList() {
  const { t, lang } = useLanguage()
  const title = (item) => item.title[lang] || item.title.en
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  const TABS = [
    { key: 'all',                label: t('learn_all') },
    { key: 'articles',           label: t('learn_articles') },
    { key: 'plant_diseases',     label: t('learn_plant_diseases') },
    { key: 'nutrient_deficiency',label: t('learn_nutrient') },
    { key: 'water_management',   label: t('learn_water') },
  ]

  const CATEGORIES = [
    {
      key: 'nutrient_deficiency',
      name: t('learn_cat_nutrient'),
      items: [
        { id: 'nitrogen',   title: { en: 'Nitrogen Deficiency Signs', km: 'សញ្ញាខ្វះជីអ៊ីយ៉ូត N' },     img: '/images/article1.jpg' },
        { id: 'potassium',  title: { en: 'Potassium Management',      km: 'ការគ្រប់គ្រងជីប៉ូតាស K' },  img: '/images/article2.jpg' },
        { id: 'zinc',       title: { en: 'Zinc Deficiency Guide',     km: 'មគ្គុទ្ទេសសម្រាប់ខ្វះស័ង្កសី' }, img: '/images/article3.jpg' },
      ],
    },
    {
      key: 'fertilizer_practices',
      name: t('learn_cat_fertilizer'),
      items: [
        { id: 'basal-application', title: { en: 'Basal Application Tips', km: 'គន្លឹះការបន្ថែមជីមូលដ្ឋាន' }, img: '/images/article4.jpg' },
        { id: 'compost',           title: { en: 'Compost Preparation',    km: 'ការរៀបចំជីធម្មជាតិ' },        img: '/images/article1.jpg' },
        { id: 'npk',               title: { en: 'NPK Ratio Guide',        km: 'មគ្គុទ្ទេសសម្រាប់សមាមាត្រ NPK' }, img: '/images/article2.jpg' },
      ],
    },
    {
      key: 'soil_care',
      name: t('learn_cat_soil'),
      items: [
        { id: 'testing',    title: { en: 'Soil Testing Basics',      km: 'មូលដ្ឋានគ្រឹះនៃការតេស្តដី' }, img: '/images/article3.jpg' },
        { id: 'amendments', title: { en: 'Land Leveling Benefits',   km: 'អត្ថប្រយោជន៍នៃការលំអរដី' },  img: '/images/article4.jpg' },
        { id: 'drainage',   title: { en: 'Crop Resistance Strategy', km: 'យុទ្ធសាស្ត្រទប់ទល់ជំងឺដំណាំ' }, img: '/images/article1.jpg' },
      ],
    },
  ]

  const filtered = SAMPLE_ARTICLES.filter((a) => {
    if (tab === 'articles' && a.type !== 'article') return false
    if (tab !== 'all' && tab !== 'articles' && a.category !== tab) return false
    if (search && !(title(a)).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 italic">
            {t('learn_title')}
          </h1>
          <p className="mt-2 text-neutral-600">{t('learn_subtitle')}</p>
        </div>
        {/* Search */}
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
            className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
              tab === key ? 'text-white' : 'bg-white text-neutral-600 hover:border-primary-300'
            }`}
            style={tab === key
              ? { backgroundColor: '#558b2f', border: '1px solid #558b2f' }
              : { border: '1px solid #e0e0e0' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main layout: content + sidebar */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: articles */}
        <div className="lg:col-span-2 space-y-10">

          {/* Recommended */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">{t('learn_recommended')}</h2>
              <Link to="/learn" className="text-xs text-primary-600 font-medium no-underline hover:underline">
                {t('learn_see_all')} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filtered.slice(0, 2).map((item) => (
                <Link
                  key={item.id}
                  to={item.type === 'video' ? `/learn/video/${item.id}` : `/learn/article/${item.id}`}
                  className="group bg-white rounded-xl overflow-hidden no-underline"
                  style={{ border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <div className="relative">
                    <img src={item.img} alt={title(item)} className="w-full h-44 object-cover"
                      onError={(e) => { e.target.src = '/images/analysis-leaf.jpg' }} />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play size={20} className="text-primary-600 ml-0.5" />
                        </div>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-white text-xs rounded-full font-medium" style={{ backgroundColor: '#558b2f' }}>
                      {TABS.find(tb => tb.key === item.category)?.label || item.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors leading-snug">
                      {title(item)}
                    </h3>
                    <span className="mt-2 text-xs text-primary-600 font-medium flex items-center gap-1">
                      {item.type === 'video' ? t('learn_watch_video') : t('learn_read_article')} <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest Updates */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">{t('learn_latest')}</h2>
              <Link to="/learn" className="text-xs text-primary-600 font-medium no-underline hover:underline">
                {t('learn_see_all')} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {filtered.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={item.type === 'video' ? `/learn/video/${item.id}` : `/learn/article/${item.id}`}
                  className="group bg-white rounded-lg overflow-hidden no-underline transition-colors"
                  style={{ border: '1px solid #e0e0e0' }}
                >
                  <img src={item.img} alt={title(item)} className="w-full h-32 object-cover"
                    onError={(e) => { e.target.src = '/images/analysis-leaf.jpg' }} />
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

          {/* Browse by Categories */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-neutral-900 italic">{t('learn_browse_categories')}</h2>
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="mt-6">
                <h3 className="font-semibold text-neutral-800">{cat.name}</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {cat.items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/learn/article/${item.id}`}
                      className="group bg-white rounded-lg overflow-hidden no-underline"
                      style={{ border: '1px solid #e0e0e0' }}
                    >
                      <img src={item.img} alt={title(item)} className="w-full h-32 object-cover"
                        onError={(e) => { e.target.src = '/images/analysis-leaf.jpg' }} />
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
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-5">

          {/* Expert Advice */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#f7fbe7', border: '1px solid #a8d060' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} style={{ color: '#558b2f' }} />
              <h3 className="font-semibold text-sm" style={{ color: '#33691e' }}>{t('learn_sidebar_expert_title')}</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">{t('learn_sidebar_expert_desc')}</p>
            <Link
              to="/experts"
              className="mt-3 inline-block px-4 py-1.5 text-white text-xs font-medium rounded-lg no-underline"
              style={{ backgroundColor: '#558b2f' }}
            >
              {t('learn_sidebar_expert_btn')}
            </Link>
          </div>

          {/* Season Crop Tips */}
          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-2">🌾 {t('learn_sidebar_tips_title')}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{t('learn_sidebar_tips_desc')}</p>
          </div>

          {/* Soil Health Corner */}
          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-2">🌱 {t('learn_sidebar_soil_title')}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{t('learn_sidebar_soil_desc')}</p>
          </div>

          {/* Fresh Resources */}
          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm text-neutral-900 mb-3">{t('learn_fresh_title')}</h3>
            <div className="space-y-3">
              {SAMPLE_ARTICLES.slice(0, 3).map((item) => (
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
        </div>
      </div>
    </div>
  )
}
