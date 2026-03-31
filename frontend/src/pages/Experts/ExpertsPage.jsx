import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Phone, Send, Search, MapPin, Star, ArrowRight, ShoppingBag } from 'lucide-react'

const EXPERTS_DATA = [
  { id: 1, name: 'Dr. Som Sopheap', titleKey: 'expert_role_agricultural_scientist', location: 'Phnom Penh, Cambodia', img: '👨‍🔬', telegram: 'dr_sopheap', online: true },
  { id: 2, name: 'Eng Chantrea', titleKey: 'expert_role_rice_pathology', location: 'Battambang Region', img: '👨‍🌾', telegram: 'eng_chantrea', online: true },
  { id: 3, name: 'Dr. Ly Rottanak', titleKey: 'expert_role_soil_science', location: 'Siem Reap Region', img: '👩‍🔬', telegram: 'ly_rottanak', online: false },
  { id: 4, name: 'Nhem Sokha', titleKey: 'expert_role_agricultural_consultant', location: 'Kampong Cham', img: '👨‍🏫', telegram: 'nhem_sokha', online: true },
  { id: 5, name: 'Chan Dara', titleKey: 'expert_role_rice_breeding', location: 'Prey Veng', img: '👩‍🌾', telegram: 'chan_dara', online: false },
  { id: 6, name: 'Sok Visal', titleKey: 'expert_role_pest_management', location: 'Takeo', img: '👨‍🔬', telegram: 'sok_visal', online: true },
]

const SUPPLIERS = [
  { id: 1, name: 'GreenGrowth Fertilizers', type: 'COMPANY', desc: 'Certified organic fertilizers and specialized pathogen treatments for industrial and small-scale rice farming.', location: 'Phnom Penh, Cambodia', rating: 4.5, telegram: 'greengrowth_supply' },
  { id: 2, name: 'Rice Blast Disease', type: 'ARTICLE', desc: 'A fungal infection caused by Magnaporthe oryzae affecting rice plants. Crucial to understand for disease management.', location: null, telegram: null },
  { id: 3, name: 'Optimizing Soil pH for Disease Resistance', type: 'ARTICLE', desc: 'Maintaining the ideal soil pH in the rice for a line of defense against many common rice pathogens.', location: null, telegram: null },
]

const PRODUCTS = [
  { id: 1, name: 'BlastGuard Pro', price: '$42.00', img: '🧪', supplier: 'GreenGrowth', telegram: 'greengrowth_supply' },
  { id: 2, name: 'Emamid Shield', price: '$38.50', img: '🧴', supplier: 'AgriTech', telegram: 'agritech_kh' },
  { id: 3, name: 'Tenebricola Resist', price: '$55.00', img: '💊', supplier: 'CropCare', telegram: 'cropcare_kh' },
  { id: 4, name: 'Lithos Mineral Mix', price: null, img: '📦', supplier: 'GreenGrowth', telegram: 'greengrowth_supply' },
]

const FEATURED_SUPPLIERS = [
  { name: 'Green Growth Agri-Supply', desc: 'Sustainable farming solutions', location: 'Phnom Penh, Cambodia', telegram: 'greengrowth_supply' },
  { name: 'Harvest HUB', desc: 'Seeds & Farming Equipment', location: 'Phnom Penh, Cambodia', telegram: 'harvest_hub_kh' },
]

export default function ExpertsPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('All')

  const EXPERTS = EXPERTS_DATA.map(e => ({ ...e, title: t(e.titleKey) }))
  const [search, setSearch] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })

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
                <h3 className="mt-1 font-bold text-neutral-900">{expert.name}</h3>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {expert.location}
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
                <p className="text-sm text-neutral-600 mt-1">{s.desc}</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-2">
                  <MapPin size={12} /> {s.location}
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
              <div key={p.id} className="bg-white border border-neutral-200 rounded-xl p-4 hover-lift">
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
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium no-underline hover:bg-primary-700 cursor-pointer"
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
