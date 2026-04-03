import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Phone, Send, Search, MapPin, ShoppingBag, ArrowRight, Star } from 'lucide-react'

/* Shared inline styles — matches site-wide design language */
const cardStyle = {
  border: '1px solid #bdbdbd',
  boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
  borderRadius: '16px',
}
const btnGreen = {
  backgroundColor: '#558b2f',
  color: '#fff',
  borderRadius: '10px',
  fontWeight: 600,
  fontSize: '12px',
  border: 'none',
}
const btnTelegram = {
  backgroundColor: '#0088cc',
  color: '#fff',
  borderRadius: '10px',
  fontWeight: 600,
  fontSize: '12px',
  border: 'none',
}

const EXPERTS_DATA = [
  { id: 1, name: 'Dr. Som Sopheap', nameKm: 'ដុក្តូរ សំ សុភ័ព', titleKey: 'expert_role_agricultural_scientist', location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' }, img: '👨‍🔬', telegram: 'dr_sopheap', online: true },
  { id: 2, name: 'Eng Chantrea', nameKm: 'អ៊ែង ច័ន្រ្ទា', titleKey: 'expert_role_rice_pathology', location: { en: 'Battambang Region', km: 'តំបន់បាត់ដំបង' }, img: '👨‍🌾', telegram: 'eng_chantrea', online: true },
  { id: 3, name: 'Dr. Ly Rottanak', nameKm: 'ដុក្តូរ លី រដ្ឋណាក់', titleKey: 'expert_role_soil_science', location: { en: 'Siem Reap Region', km: 'តំបន់សៀមរាប' }, img: '👩‍🔬', telegram: 'ly_rottanak', online: false },
  { id: 4, name: 'Nhem Sokha', nameKm: 'ញ៉ែម សុខា', titleKey: 'expert_role_agricultural_consultant', location: { en: 'Kampong Cham', km: 'កំពង់ចាម' }, img: '👨‍🏫', telegram: 'nhem_sokha', online: true },
  { id: 5, name: 'Chan Dara', nameKm: 'ចាន់ ដារ៉ា', titleKey: 'expert_role_rice_breeding', location: { en: 'Prey Veng', km: 'ព្រៃវែង' }, img: '👩‍🌾', telegram: 'chan_dara', online: false },
  { id: 6, name: 'Sok Visal', nameKm: 'សុក វិសាល', titleKey: 'expert_role_pest_management', location: { en: 'Takeo', km: 'តាកែវ' }, img: '👨‍🔬', telegram: 'sok_visal', online: true },
]

const PRODUCTS = [
  { id: 1, name: 'BlastGuard Pro',      price: '$42.00', img: '🧪', supplier: 'GreenGrowth', telegram: 'greengrowth_supply', tag: 'Fungicide',    tagColor: '#dc2626', tagBg: '#fef2f2' },
  { id: 2, name: 'Emamid Shield',       price: '$38.50', img: '🧴', supplier: 'AgriTech',    telegram: 'agritech_kh',        tag: 'Pesticide',    tagColor: '#d97706', tagBg: '#fffbeb' },
  { id: 3, name: 'Tenebricola Resist',  price: '$55.00', img: '💊', supplier: 'CropCare',    telegram: 'cropcare_kh',        tag: 'Bactericide',  tagColor: '#7c3aed', tagBg: '#f5f3ff' },
  { id: 4, name: 'Lithos Mineral Mix',  price: null,     img: '📦', supplier: 'GreenGrowth', telegram: 'greengrowth_supply', tag: 'Nutrient',     tagColor: '#059669', tagBg: '#ecfdf5' },
]

const FEATURED_SUPPLIERS = [
  {
    name: 'Green Growth Agri-Supply',
    icon: '🌱',
    badge: 'Verified',
    desc: { en: 'Sustainable farming solutions with a wide range of certified biological and chemical treatments.', km: 'ដំណោះស្រាយកសិកម្មចីរភាព ជាមួយការព្យាបាលជីវសាស្ត្រ និងគីមីដែលមានការបញ្ជាក់ជាច្រើន។' },
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    telegram: 'greengrowth_supply',
  },
  {
    name: 'Harvest HUB',
    icon: '🏪',
    badge: 'Verified',
    desc: { en: 'Premium seeds and modern farming equipment for Cambodian rice farmers.', km: 'គ្រាប់ពូជ និងឧបករណ៍កសិកម្មទំនើបសម្រាប់កសិករស្រូវខ្មែរ។' },
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    telegram: 'harvest_hub_kh',
  },
]

export default function ExpertsPage() {
  const { lang, t } = useLanguage()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSubmitted, setContactSubmitted] = useState(false)

  const bil = (obj) => (typeof obj === 'object' ? obj[lang] || obj.en : obj)
  const expertName = (expert) =>
    lang === 'km' && expert.nameKm ? `${expert.nameKm} (${expert.name})` : expert.name

  const EXPERTS = EXPERTS_DATA.map((e) => ({ ...e, title: t(e.titleKey) }))
  const filteredExperts = search.trim()
    ? EXPERTS.filter((e) =>
        expertName(e).toLowerCase().includes(search.toLowerCase()) ||
        bil(e.location).toLowerCase().includes(search.toLowerCase())
      )
    : EXPERTS

  const tabs = [
    { key: 'All',       label: t('experts_all') },
    { key: 'Experts',   label: t('experts_tab') },
    { key: 'Suppliers', label: t('experts_suppliers_tab') },
  ]

  const stats = [
    { val: '6+', label: t('experts_tab') },
    { val: '2',  label: t('experts_suppliers_tab') },
    { val: '4',  label: t('experts_section_treatments_title') },
  ]

  return (
    <div>
      {/* ═══════════════ PAGE HEADER BANNER ═══════════════ */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a1e 60%, #1a2e1a 100%)' }}
      >
        {/* Decorative rings */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ border: '36px solid #558b2f', opacity: 0.12 }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ border: '24px solid #c5a028', opacity: 0.08 }}
        />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* Title */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#8bc34a' }}>
                {t('nav_contact')}
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white italic leading-tight">
                {tab === 'Suppliers' ? t('suppliers_title') : t('experts_title')}
              </h1>
              <p className="mt-2 text-sm max-w-lg" style={{ color: '#a8c89a' }}>
                {t('experts_subtitle')}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 shrink-0 sm:pt-1">
              {stats.map(({ val, label }) => (
                <div key={val} className="text-center">
                  <p className="text-2xl font-bold text-white">{val}</p>
                  <p className="text-[11px] mt-0.5 leading-tight max-w-[72px]" style={{ color: '#a8c89a' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs & Search */}
          <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
                  style={
                    tab === item.key
                      ? { backgroundColor: '#558b2f', color: '#fff', border: '1px solid #558b2f' }
                      : { backgroundColor: 'rgba(255,255,255,0.08)', color: '#d4e6a5', border: '1px solid rgba(255,255,255,0.18)' }
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.16)' }}
            >
              <Search size={15} style={{ color: '#a8c89a' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('experts_search_placeholder')}
                className="border-none outline-none text-sm w-36 bg-transparent placeholder-neutral-400"
                style={{ color: '#fff' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ PAGE CONTENT ═══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ─── EXPERTS SECTION ─── */}
        {(tab === 'All' || tab === 'Experts') && (
          <section className="mb-14">
            {/* Section banner */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
                style={{ background: 'linear-gradient(135deg, #f7fbe7, #d4e6a5)', border: '1px solid #c5e09a' }}
              >
                🧑‍🔬
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{t('experts_tab')}</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{t('experts_section_experts_desc')}</p>
              </div>
            </div>
            <div className="h-px mb-8" style={{ background: 'linear-gradient(to right, #558b2f, #c5a028, transparent)' }} />

            {filteredExperts.length === 0 ? (
              <p className="text-neutral-400 text-sm py-10 text-center">No experts found matching your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperts.map((expert) => (
                  <div key={expert.id} className="bg-white hover-lift flex flex-col" style={cardStyle}>
                    <div className="p-5 pb-4">
                      {/* Avatar row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                            style={{ background: 'linear-gradient(135deg, #f7fbe7, #eef5d3)', border: '2px solid #d4e6a5' }}
                          >
                            {expert.img}
                          </div>
                          {expert.online && (
                            <span
                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                              style={{ backgroundColor: '#22c55e' }}
                            />
                          )}
                        </div>
                        {expert.online ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Online
                          </span>
                        ) : (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb' }}
                          >
                            Offline
                          </span>
                        )}
                      </div>

                      {/* Text */}
                      <p
                        className="text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: '#558b2f' }}
                      >
                        {expert.title}
                      </p>
                      <h3 className="mt-1 font-bold text-neutral-900 text-[15px] leading-snug">{expertName(expert)}</h3>
                      <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1">
                        <MapPin size={11} className="shrink-0" /> {bil(expert.location)}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="mx-5 h-px" style={{ backgroundColor: '#f0f0f0' }} />

                    {/* Buttons */}
                    <div className="p-4 flex gap-2">
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 cursor-pointer transition-opacity hover:opacity-85"
                        style={btnGreen}
                      >
                        <Phone size={13} /> {t('experts_phone')}
                      </button>
                      <a
                        href={`https://t.me/${expert.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 no-underline transition-opacity hover:opacity-85"
                        style={btnTelegram}
                      >
                        <Send size={13} /> {t('experts_telegram')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── SUPPLIERS SECTION ─── */}
        {(tab === 'All' || tab === 'Suppliers') && (
          <section className="mb-6">
            {/* Section banner */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
                style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a' }}
              >
                🏪
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{t('experts_suppliers_tab')}</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{t('experts_section_suppliers_desc')}</p>
              </div>
            </div>
            <div className="h-px mb-8" style={{ background: 'linear-gradient(to right, #c5a028, #558b2f, transparent)' }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FEATURED_SUPPLIERS.map((s) => (
                <div key={s.name} className="bg-white hover-lift overflow-hidden flex flex-col" style={cardStyle}>
                  {/* Green accent top bar */}
                  <div className="h-1.5" style={{ background: 'linear-gradient(to right, #558b2f, #c5a028)' }} />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{ backgroundColor: '#f7fbe7', border: '1px solid #d4e6a5' }}
                        >
                          {s.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-900 text-[15px]">{s.name}</h3>
                          <p className="text-xs flex items-center gap-1 text-neutral-500 mt-0.5">
                            <MapPin size={11} /> {bil(s.location)}
                          </p>
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                      >
                        ✓ {s.badge}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-neutral-600 leading-relaxed">{bil(s.desc)}</p>
                    <div className="mt-5 flex gap-2">
                      <Link
                        to="/experts"
                        className="px-4 py-2 text-white text-xs font-semibold rounded-lg no-underline transition-opacity hover:opacity-85 flex items-center gap-1.5"
                        style={{ backgroundColor: '#558b2f' }}
                      >
                        {t('suppliers_view')} <ArrowRight size={12} />
                      </Link>
                      <a
                        href={`https://t.me/${s.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-xs font-semibold rounded-lg no-underline transition-colors flex items-center gap-1.5 hover:border-primary-300"
                        style={{ border: '1px solid #d1d5db', color: '#374151' }}
                      >
                        <Send size={12} /> {t('suppliers_contact')}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── TREATMENTS SUB-SECTION ─── */}
            <div className="mt-14">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #ddd6fe' }}
                >
                  🧪
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">{t('experts_section_treatments_title')}</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">{t('experts_section_treatments_desc')}</p>
                </div>
              </div>
              <div className="h-px mb-8" style={{ background: 'linear-gradient(to right, #7c3aed, #558b2f, transparent)' }} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PRODUCTS.map((p) => (
                  <div key={p.id} className="bg-white hover-lift flex flex-col overflow-hidden" style={cardStyle}>
                    {/* Product image area */}
                    <div
                      className="h-28 flex items-center justify-center relative"
                      style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}
                    >
                      <span className="text-5xl">{p.img}</span>
                      <span
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: p.tagBg, color: p.tagColor }}
                      >
                        {p.tag}
                      </span>
                    </div>

                    {/* Product info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="font-semibold text-neutral-900 text-sm leading-snug">{p.name}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">{p.supplier}</p>
                      {p.price
                        ? <p className="mt-2 font-bold text-xl" style={{ color: '#558b2f' }}>{p.price}</p>
                        : <p className="mt-2 text-xs text-neutral-400 italic">Price on request</p>
                      }
                      <a
                        href={`https://t.me/${p.telegram}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name}. Please send me details and pricing.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto pt-3 w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-white text-xs font-semibold rounded-xl no-underline transition-opacity hover:opacity-85 cursor-pointer"
                        style={{ backgroundColor: '#558b2f' }}
                      >
                        <ShoppingBag size={13} /> {p.price ? t('suppliers_buy') : t('suppliers_inquire')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ CONTACT & JOIN CTA ═══════════════ */}
        <section
          className="mt-10 rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a1e 60%, #1a2e1a 100%)' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Join as expert */}
            <div
              className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(197,160,40,0.2)', border: '1px solid rgba(197,160,40,0.3)' }}
              >
                <Star size={22} style={{ color: '#c5a028' }} />
              </div>
              <h3 className="text-xl font-bold text-white">{t('experts_join')}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: '#a8c89a' }}>{t('experts_join_desc')}</p>
              <button
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                style={{ backgroundColor: '#c5a028', color: '#fff', border: 'none' }}
              >
                {t('experts_apply')} <ArrowRight size={14} />
              </button>
            </div>

            {/* Right: Contact form */}
            <div className="p-8 lg:p-10">
              <h3 className="text-xl font-bold text-white">{t('experts_cant_find')}</h3>
              <p className="mt-1 text-sm" style={{ color: '#a8c89a' }}>{t('experts_cant_find_desc')}</p>
              {contactSubmitted ? (
                <div className="mt-5 flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span className="text-4xl">✅</span>
                  <p className="mt-3 text-base font-semibold text-white">{t('experts_contact_thanks')}</p>
                  <button
                    onClick={() => { setContactSubmitted(false); setContactForm({ name: '', email: '', message: '' }) }}
                    className="mt-4 text-xs underline cursor-pointer bg-transparent border-none"
                    style={{ color: '#a8c89a' }}
                  >
                    {t('experts_send_another')}
                  </button>
                </div>
              ) : (
                <form className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t('experts_name_placeholder')}
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="px-3 py-2.5 rounded-lg text-sm outline-none text-white placeholder-neutral-400"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                    <input
                      type="email"
                      placeholder={t('experts_email_placeholder')}
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="px-3 py-2.5 rounded-lg text-sm outline-none text-white placeholder-neutral-400"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                  </div>
                  <textarea
                    placeholder={t('experts_message_placeholder')}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none text-white placeholder-neutral-400"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  />
                  <button
                    type="button"
                    onClick={() => { if (contactForm.name || contactForm.email || contactForm.message) setContactSubmitted(true) }}
                    className="w-full py-2.5 text-sm font-semibold rounded-lg border-none cursor-pointer transition-opacity hover:opacity-85"
                    style={{ backgroundColor: '#558b2f', color: '#fff' }}
                  >
                    {t('experts_submit')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
