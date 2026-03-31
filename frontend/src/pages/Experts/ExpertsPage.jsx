import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Phone, Send, Search, MapPin, ShoppingBag } from 'lucide-react'

const EXPERTS_DATA = [
  { id: 1, name: 'Dr. Som Sopheap', nameKm: 'ដុក្តូរ សំ សុភ័ព', titleKey: 'expert_role_agricultural_scientist', location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' }, img: '👨‍🔬', telegram: 'dr_sopheap', online: true },
  { id: 2, name: 'Eng Chantrea', nameKm: 'អ៊ែង ច័ន្រ្ទា', titleKey: 'expert_role_rice_pathology', location: { en: 'Battambang Region', km: 'តំបន់បាត់ដំបង' }, img: '👨‍🌾', telegram: 'eng_chantrea', online: true },
  { id: 3, name: 'Dr. Ly Rottanak', nameKm: 'ដុក្តូរ លី រដ្ឋណាក់', titleKey: 'expert_role_soil_science', location: { en: 'Siem Reap Region', km: 'តំបន់សៀមរាប' }, img: '👩‍🔬', telegram: 'ly_rottanak', online: false },
  { id: 4, name: 'Nhem Sokha', nameKm: 'ញ៉ែម សុខា', titleKey: 'expert_role_agricultural_consultant', location: { en: 'Kampong Cham', km: 'កំពង់ចាម' }, img: '👨‍🏫', telegram: 'nhem_sokha', online: true },
  { id: 5, name: 'Chan Dara', nameKm: 'ចាន់ ដារ៉ា', titleKey: 'expert_role_rice_breeding', location: { en: 'Prey Veng', km: 'ព្រៃវែង' }, img: '👩‍🌾', telegram: 'chan_dara', online: false },
  { id: 6, name: 'Sok Visal', nameKm: 'សុក វិសាល', titleKey: 'expert_role_pest_management', location: { en: 'Takeo', km: 'តាកែវ' }, img: '👨‍🔬', telegram: 'sok_visal', online: true },
]

const PRODUCTS = [
  { id: 1, name: 'BlastGuard Pro', price: '$42.00', img: '🧪', supplier: 'GreenGrowth', telegram: 'greengrowth_supply' },
  { id: 2, name: 'Emamid Shield', price: '$38.50', img: '🧴', supplier: 'AgriTech', telegram: 'agritech_kh' },
  { id: 3, name: 'Tenebricola Resist', price: '$55.00', img: '💊', supplier: 'CropCare', telegram: 'cropcare_kh' },
  { id: 4, name: 'Lithos Mineral Mix', price: null, img: '📦', supplier: 'GreenGrowth', telegram: 'greengrowth_supply' },
]

const FEATURED_SUPPLIERS = [
  {
    name: 'Green Growth Agri-Supply',
    desc: { en: 'Sustainable farming solutions', km: 'ដំណោះស្រាយកសិកម្មចីរភាព' },
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    telegram: 'greengrowth_supply',
  },
  {
    name: 'Harvest HUB',
    desc: { en: 'Seeds & Farming Equipment', km: 'គ្រាប់ពូជ និងឧបករណ៍កសិកម្ម' },
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    telegram: 'harvest_hub_kh',
  },
]

export default function ExpertsPage() {
  const { lang, t } = useLanguage()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })

  const bil = (obj) => (typeof obj === 'object' ? obj[lang] || obj.en : obj)

  const expertName = (expert) =>
    lang === 'km' && expert.nameKm
      ? `${expert.nameKm} (${expert.name})`
      : expert.name

  const EXPERTS = EXPERTS_DATA.map((e) => ({ ...e, title: t(e.titleKey) }))

  const tabs = [
    { key: 'All', label: t('experts_all') },
    { key: 'Experts', label: t('experts_tab') },
    { key: 'Suppliers', label: t('experts_suppliers_tab') },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 italic">
        {tab === 'Suppliers' ? t('suppliers_title') : t('experts_title')}
      </h1>
      <p className="mt-2 text-neutral-600 max-w-2xl">{t('experts_subtitle')}</p>

      {/* Tabs & Search */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                tab === item.key
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-neutral-300 rounded-lg px-3 py-2 bg-white">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('experts_search_placeholder')}
            className="border-none outline-none text-sm w-40"
          />
        </div>
      </div>

      {/* EXPERTS TAB */}
      {(tab === 'All' || tab === 'Experts') && (
        <section className="mt-8">
          {tab === 'All' && <h2 className="text-lg font-bold text-neutral-900 mb-4">{t('experts_tab')}</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPERTS.map((expert) => (
              <div key={expert.id} className="bg-white border border-neutral-200 rounded-xl p-5 hover-lift">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-3xl">
                    {expert.img}
                  </div>
                  {expert.online && (
                    <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <p className="mt-3 text-[10px] font-semibold tracking-wider text-primary-600 uppercase">{expert.title}</p>
                <h3 className="mt-1 font-bold text-neutral-900">{expertName(expert)}</h3>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {bil(expert.location)}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium border-none cursor-pointer hover:bg-primary-700">
                    <Phone size={14} /> {t('experts_phone')}
                  </button>
                  <a
                    href={`https://t.me/${expert.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0088cc] text-white rounded-lg text-xs font-medium no-underline hover:bg-[#0077b5]"
                  >
                    <Send size={14} /> {t('experts_telegram')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SUPPLIERS TAB */}
      {(tab === 'All' || tab === 'Suppliers') && (
        <section className="mt-8">
          {tab === 'All' && <h2 className="text-lg font-bold text-neutral-900 mb-4">{t('experts_suppliers_tab')}</h2>}

          {/* Featured suppliers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {FEATURED_SUPPLIERS.map((s) => (
              <div key={s.name} className="bg-white border border-primary-200 rounded-xl p-5">
                <h3 className="font-bold text-neutral-900">{s.name}</h3>
                <p className="text-sm text-neutral-600 mt-1">{bil(s.desc)}</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-2">
                  <MapPin size={12} /> {bil(s.location)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link to="/experts" className="px-4 py-1.5 bg-primary-600 text-white text-xs rounded-lg font-medium no-underline hover:bg-primary-700">
                    {t('suppliers_view')}
                  </Link>
                  <a
                    href={`https://t.me/${s.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 border border-neutral-300 text-neutral-700 text-xs rounded-lg font-medium no-underline hover:border-primary-300"
                  >
                    {t('suppliers_contact')}
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Products */}
          <h3 className="text-lg font-bold text-neutral-900">{t('suppliers_essential')}</h3>
          <p className="text-sm text-neutral-600 mt-1">{t('suppliers_essential_desc')}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="bg-white border border-neutral-200 rounded-xl p-4 hover-lift flex flex-col">
                <div className="w-full h-24 bg-neutral-50 rounded-lg flex items-center justify-center text-4xl">
                  {p.img}
                </div>
                <h4 className="mt-3 font-semibold text-neutral-900 text-sm">{p.name}</h4>
                <p className="text-xs text-neutral-500">{p.supplier}</p>
                {p.price && <p className="mt-1 font-bold text-primary-700 text-sm">{p.price}</p>}
                <a
                  href={`https://t.me/${p.telegram}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name}. Please send me details and pricing.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium no-underline hover:bg-primary-700 cursor-pointer"
                >
                  <ShoppingBag size={14} /> {p.price ? t('suppliers_buy') : t('suppliers_inquire')}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CONTACT FORM */}
      <section className="mt-12 bg-gradient-green rounded-2xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Join as expert */}
          <div>
            <div className="bg-white/80 rounded-xl p-5 inline-block">
              <h4 className="font-semibold text-neutral-900">{t('experts_join')}</h4>
              <p className="text-sm text-neutral-600 mt-1">{t('experts_join_desc')}</p>
              <button className="mt-3 text-sm text-primary-600 font-medium underline cursor-pointer bg-transparent border-none">
                {t('experts_apply')}
              </button>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h3 className="text-xl font-bold text-neutral-900">{t('experts_cant_find')}</h3>
            <p className="mt-1 text-sm text-neutral-600">{t('experts_cant_find_desc')}</p>
            <form className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t('experts_name_placeholder')}
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
                />
                <input
                  type="email"
                  placeholder={t('experts_email_placeholder')}
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
                />
              </div>
              <textarea
                placeholder={t('experts_message_placeholder')}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white resize-none"
              />
              <button
                type="button"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg border-none cursor-pointer transition-colors"
              >
                {t('experts_submit')}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
