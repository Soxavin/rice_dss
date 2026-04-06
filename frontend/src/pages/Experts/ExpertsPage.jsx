import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Phone, Send, Search, MapPin, ShoppingBag, ArrowRight, Star, X, BookOpen, Globe, Clock } from 'lucide-react'

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
  {
    id: 1, name: 'Dr. Som Sopheap', nameKm: 'ដុក្តូរ សំ សុភ័ព',
    titleKey: 'expert_role_agricultural_scientist',
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    img: '👨‍🔬', telegram: 'dr_sopheap', online: true,
    phone: '+855 12 345 678',
    experience: 14, rating: 4.9, reviews: 38,
    bio: {
      en: 'Dr. Sopheap is a leading agricultural scientist specializing in rice disease management across Southeast Asia. He has advised the Ministry of Agriculture on disease outbreak protocols and authored several peer-reviewed studies on fungal pathogens in Cambodian rice fields.',
      km: 'ដុក្តូរ សុភ័ព គឺជាអ្នកវិទ្យាសាស្ត្រកសិកម្មឈានមុខ ដែលមានជំនាញខាងការគ្រប់គ្រងជំងឺស្រូវក្នុងអាស៊ីអាគ្នេយ៍។ លោកបានផ្តល់យោបល់ដល់ក្រសួងកសិកម្មលើពិធីការជំងឺ ហើយបានសរសេរការសិក្សាវិទ្យាសាស្ត្រជាច្រើនអំពីបណ្តេញជំងឺផ្សិតក្នុងស្រែស្រូវកម្ពុជា។',
    },
    specializations: ['Rice Blast', 'Brown Spot', 'Fungal Pathology', 'Disease Management'],
    education: 'Ph.D. Plant Pathology, Kasetsart University (Thailand)',
    languages: ['Khmer', 'English', 'Thai'],
    availability: 'Mon–Fri, 8:00–17:00',
  },
  {
    id: 2, name: 'Eng Chantrea', nameKm: 'អ៊ែង ច័ន្រ្ទា',
    titleKey: 'expert_role_rice_pathology',
    location: { en: 'Battambang Region', km: 'តំបន់បាត់ដំបង' },
    img: '👨‍🌾', telegram: 'eng_chantrea', online: true,
    phone: '+855 17 234 567',
    experience: 9, rating: 4.7, reviews: 21,
    bio: {
      en: 'Chantrea is a rice pathologist with nearly a decade of fieldwork in the Battambang rice belt. He focuses on early detection of bacterial blight and brown spot, and regularly conducts farmer training workshops on integrated pest management.',
      km: 'ច័ន្រ្ទា គឺជាអ្នកឯកទេសជំងឺស្រូវវ ដែលមានបទពិសោធន៍ជិតមួយទសវត្សនៅក្នុងវាលស្រូវបាត់ដំបង។ គាត់ផ្តោតលើការរកឃើញជំងឺ Bacterial Blight និង Brown Spot ។',
    },
    specializations: ['Bacterial Blight', 'Brown Spot', 'IPM', 'Farmer Training'],
    education: 'M.Sc. Plant Science, Royal University of Agriculture (Cambodia)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Sat, 7:00–16:00',
  },
  {
    id: 3, name: 'Dr. Ly Rottanak', nameKm: 'ដុក្តូរ លី រដ្ឋណាក់',
    titleKey: 'expert_role_soil_science',
    location: { en: 'Siem Reap Region', km: 'តំបន់សៀមរាប' },
    img: '👩‍🔬', telegram: 'ly_rottanak', online: false,
    phone: '+855 89 456 789',
    experience: 11, rating: 4.8, reviews: 29,
    bio: {
      en: 'Dr. Rottanak specializes in soil science and nutrient management for paddy fields in the Tonle Sap basin. Her research focuses on how soil composition affects susceptibility to root and leaf diseases, and she provides consulting services to large-scale rice farms.',
      km: 'ដុក្តូរ រដ្ឋណាក់ មានជំនាញខាងវិទ្យាសាស្ត្រដី និងការគ្រប់គ្រងជីជាតិសម្រាប់វាលស្រែក្នុងអាងទន្លេសាប។',
    },
    specializations: ['Soil Nutrition', 'Root Disease', 'Paddy Soil Management', 'Water Management'],
    education: 'Ph.D. Soil Science, Wageningen University (Netherlands)',
    languages: ['Khmer', 'English', 'French'],
    availability: 'Tue, Thu, Sat, 9:00–15:00',
  },
  {
    id: 4, name: 'Nhem Sokha', nameKm: 'ញ៉ែម សុខា',
    titleKey: 'expert_role_agricultural_consultant',
    location: { en: 'Kampong Cham', km: 'កំពង់ចាម' },
    img: '👨‍🏫', telegram: 'nhem_sokha', online: true,
    phone: '+855 77 890 123',
    experience: 7, rating: 4.6, reviews: 17,
    bio: {
      en: 'Sokha is an agricultural consultant who works directly with smallholder farmers in Kampong Cham. He focuses on practical, low-cost solutions for crop protection and has helped over 200 farming households improve their yield through better disease management.',
      km: 'សុខា គឺជាអ្នកប្រឹក្សាកសិកម្ម ដែលធ្វើការដោយផ្ទាល់ជាមួយកសិករក្នុងកំពង់ចាម។ គាត់ផ្តោតលើដំណោះស្រាយការពារដំណាំដែលមានតម្លៃទាប។',
    },
    specializations: ['Crop Protection', 'Smallholder Advisory', 'Disease Scouting', 'Cost Management'],
    education: 'B.Sc. Agriculture, National University of Battambang (Cambodia)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Fri, 7:00–18:00',
  },
  {
    id: 5, name: 'Chan Dara', nameKm: 'ចាន់ ដារ៉ា',
    titleKey: 'expert_role_rice_breeding',
    location: { en: 'Prey Veng', km: 'ព្រៃវែង' },
    img: '👩‍🌾', telegram: 'chan_dara', online: false,
    phone: '+855 96 567 890',
    experience: 12, rating: 4.7, reviews: 24,
    bio: {
      en: 'Dara is a rice breeding specialist at the Cambodian Agricultural Research and Development Institute. She works on developing disease-resistant rice varieties adapted to Cambodian growing conditions, and has contributed to the release of three certified local varieties.',
      km: 'ដារ៉ា គឺជាអ្នកឯកទេសការបន្តពូជស្រូវ នៅវិទ្យាស្ថានស្រាវជ្រាវ និងអភិវឌ្ឍន៍កសិកម្មកម្ពុជា ហើយបានរួមចំណែករំលេចពូជស្រូវ ៣ ប្រភេទ។',
    },
    specializations: ['Rice Breeding', 'Disease Resistance', 'Seed Systems', 'Varietal Selection'],
    education: 'M.Sc. Plant Breeding, IRRI – Los Baños (Philippines)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Wed, 8:00–17:00',
  },
  {
    id: 6, name: 'Sok Visal', nameKm: 'សុក វិសាល',
    titleKey: 'expert_role_pest_management',
    location: { en: 'Takeo', km: 'តាកែវ' },
    img: '👨‍🔬', telegram: 'sok_visal', online: true,
    phone: '+855 10 678 901',
    experience: 8, rating: 4.5, reviews: 14,
    bio: {
      en: 'Visal is a pest and disease management expert based in Takeo province. He specialises in integrated approaches combining chemical and biological controls, with particular expertise in diagnosing complex multi-pest infestations common to lowland rice.',
      km: 'វិសាល គឺជាអ្នកជំនាញការគ្រប់គ្រងជំងឺ និងសត្វល្អិតនៅខេត្តតាកែវ ដែលមានជំនាញពិសេសក្នុងការធ្វើរោគវិនិច្ឆ័យ។',
    },
    specializations: ['Pest Management', 'Biological Control', 'Multi-pest Diagnosis', 'Lowland Rice'],
    education: 'B.Sc. Agricultural Science, Royal University of Agriculture (Cambodia)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Sat, 6:30–15:00',
  },
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
  const [selectedExpert, setSelectedExpert] = useState(null)

  useEffect(() => {
    if (!selectedExpert) return
    const onKey = (e) => { if (e.key === 'Escape') setSelectedExpert(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedExpert])

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
                    <div className="px-4 pb-4 space-y-2">
                      {/* View Profile */}
                      <button
                        onClick={() => setSelectedExpert(expert)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 cursor-pointer transition-opacity hover:opacity-85 text-xs font-semibold rounded-lg"
                        style={{ backgroundColor: '#f7fbe7', color: '#33691e', border: '1px solid #a8d060' }}
                      >
                        {t('experts_view_profile')}
                      </button>
                      {/* Contact buttons */}
                      <div className="flex gap-2">
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

      {/* ═══════════════ EXPERT PROFILE BOTTOM SHEET ═══════════════ */}
      {selectedExpert && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setSelectedExpert(null)}
          />

          {/* Bottom sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col"
            style={{
              maxHeight: '78vh',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              transform: 'translateY(0)',
              transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#d4d4d4' }} />
            </div>

            {/* Sheet header — dark green banner */}
            <div
              className="relative px-6 py-4 shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a1e 100%)' }}
            >
              <button
                onClick={() => setSelectedExpert(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f7fbe7, #eef5d3)', border: '2px solid #a8d060' }}
                >
                  {selectedExpert.img}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#8bc34a' }}>
                      {t(selectedExpert.titleKey)}
                    </p>
                    {selectedExpert.online ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.12)' }}>
                        Offline
                      </span>
                    )}
                  </div>
                  <h2 className="mt-0.5 text-base font-bold text-white leading-snug">{expertName(selectedExpert)}</h2>
                  <p className="mt-0.5 text-xs flex items-center gap-1" style={{ color: '#a8c89a' }}>
                    <MapPin size={11} /> {bil(selectedExpert.location)}
                  </p>
                </div>

                {/* Stats inline */}
                <div className="shrink-0 flex gap-4 pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="text-center">
                    <p className="text-base font-bold text-white">{selectedExpert.experience}</p>
                    <p className="text-[10px] leading-tight" style={{ color: '#a8c89a' }}>{t('experts_profile_years_exp')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-white">{selectedExpert.rating} ⭐</p>
                    <p className="text-[10px] leading-tight" style={{ color: '#a8c89a' }}>{selectedExpert.reviews} {t('experts_profile_reviews')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable body — two-column layout on wide screens */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div className="sm:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#558b2f' }}>
                    <BookOpen size={13} /> {t('experts_profile_about')}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{bil(selectedExpert.bio)}</p>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#558b2f' }}>
                    {t('experts_profile_specializations')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpert.specializations.map((s) => (
                      <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: '#f0f7e6', color: '#33691e', border: '1px solid #c5e09a' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#558b2f' }}>
                    <Star size={13} /> {t('experts_profile_education')}
                  </h3>
                  <p className="text-sm text-neutral-700">{selectedExpert.education}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#558b2f' }}>
                      <Globe size={13} /> {t('experts_profile_languages')}
                    </h3>
                    <p className="text-sm text-neutral-700">{selectedExpert.languages.join(', ')}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#558b2f' }}>
                      <Clock size={13} /> {t('experts_profile_availability')}
                    </h3>
                    <p className="text-sm text-neutral-700">{selectedExpert.availability}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned footer actions */}
            <div className="px-6 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl cursor-pointer border-none transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#558b2f', color: '#fff' }}
              >
                <Phone size={14} /> {t('experts_phone')}
              </button>
              <a
                href={`https://t.me/${selectedExpert.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl no-underline transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#0088cc', color: '#fff' }}
              >
                <Send size={14} /> {t('experts_telegram')}
              </a>
              <button
                onClick={() => setSelectedExpert(null)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-colors hover:bg-neutral-50"
                style={{ border: '1.5px solid #e0e0e0', color: '#616161', backgroundColor: '#fff' }}
              >
                {t('experts_profile_close')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
