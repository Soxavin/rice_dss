import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import {
  Search, Leaf, Users, BookOpen, ShoppingBag,
  ArrowRight, Camera, FileText, Cpu, Lightbulb,
  Play, CheckCircle2, Check, Microscope, 
  Droplets, Thermometer
} from 'lucide-react'

const HERO_BG = '/images/hero-bg.jpg'
const FARMER_IMG = '/images/farmer.jpg'
const ANALYSIS_IMG = '/images/analysis-leaf.jpg'

/* Shared inline styles — hardcoded for Tailwind v4 compatibility */
const cardStyle = {
  border: '1px solid #bdbdbd',
  boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
  borderRadius: '16px',
}
const floatingCard = {
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
}
const btnGreenFilled = {
  backgroundColor: '#558b2f',
  color: '#fff',
  borderRadius: '8px',
  padding: '12px 24px',
  fontWeight: 600,
  fontSize: '14px',
  fontFamily: 'Roboto, sans-serif',
  boxShadow: '0 2px 8px rgba(85,139,47,0.35)',
}
const btnGreenOutline = {
  border: '2px solid #558b2f',
  color: '#33691e',
  borderRadius: '8px',
  padding: '10px 24px',
  fontWeight: 600,
  fontSize: '14px',
  fontFamily: 'Roboto, sans-serif',
  backgroundColor: '#ffffff',
}
const btnWhiteOutline = {
  border: '2px solid rgba(255,255,255,0.65)',
  borderRadius: '8px',
  padding: '12px 28px',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '14px',
  fontFamily: 'Roboto, sans-serif',
}

export default function Landing() {
  const { t, lang } = useLanguage()

  const services = [
    {
      icon: Search, title: t('service_detection'),
      desc: t('service_detection_desc'),
      bullets: [t('service_detection_b1'), t('service_detection_b2')],
      link: '/detect',
      iconGradient: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%)',
      iconColor: '#16a34a',
    },
    {
      icon: Leaf, title: t('service_crop'),
      desc: t('service_crop_desc'),
      bullets: [t('service_crop_b1'), t('service_crop_b2')],
      link: '/profile',
      iconGradient: 'linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)',
      iconColor: '#1d4ed8',
    },
    {
      icon: Users, title: t('service_expert'),
      desc: t('service_expert_desc'),
      bullets: [t('service_expert_b1'), t('service_expert_b2')],
      link: '/experts',
      iconGradient: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
      iconColor: '#0d9488',
    },
    {
      icon: BookOpen, title: t('service_learning'),
      desc: t('service_learning_desc'),
      bullets: [t('service_learning_b1'), t('service_learning_b2')],
      link: '/learn',
      iconGradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
      iconColor: '#7c3aed',
    },
    {
      icon: ShoppingBag, title: t('service_suppliers'),
      desc: t('service_suppliers_desc'),
      bullets: [t('service_suppliers_b1'), t('service_suppliers_b2')],
      link: '/experts?tab=suppliers',
      iconGradient: 'linear-gradient(135deg, #f87171 0%, #b91c1c 100%)',
      iconColor: '#b91c1c',
    },
  ]

  const steps = [
    { icon: Camera, label: t('how_step1'), desc: t('how_step1_desc') },
    { icon: FileText, label: t('how_step2'), desc: t('how_step2_desc') },
    { icon: Cpu, label: t('how_step3'), desc: t('how_step3_desc') },
    { icon: Lightbulb, label: t('how_step4'), desc: t('how_step4_desc') },
  ]

  const articles = [
    { title: t('edu_art1_title'), desc: t('edu_art1_desc'), category: t('edu_art1_cat'), catBg: '#fef2f2', catColor: '#dc2626', type: 'article', img: '/images/article1.png' },
    { title: t('edu_art2_title'), desc: t('edu_art2_desc'), category: t('edu_art2_cat'), catBg: '#fffbeb', catColor: '#d97706', type: 'video', img: '/images/article2.jpg' },
    { title: t('edu_art3_title'), desc: t('edu_art3_desc'), category: t('edu_art3_cat'), catBg: '#eff6ff', catColor: '#2563eb', type: 'article', img: '/images/article3.jpg' },
    { title: t('edu_art4_title'), desc: t('edu_art4_desc'), category: t('edu_art4_cat'), catBg: '#f0fdf4', catColor: '#16a34a', type: 'video', img: '/images/article4.jpg' },
  ]

  /* Reusable service card renderer */
  const ServiceCard = ({ s }) => (
    <Link
      to={s.link}
      className="group px-6 py-6 no-underline text-left transition-all hover-lift flex flex-col"
      style={{ ...cardStyle, backgroundColor: '#fff', display: 'flex' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.12), inset 0 3px 0 ${s.iconColor}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#bdbdbd'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)'; }}
    >
      <div className="w-14 h-14 flex items-center justify-center" style={{ background: s.iconGradient, borderRadius: '14px' }}>
        <s.icon size={26} style={{ color: '#fff' }} />
      </div>
      <h3 className="mt-4 font-semibold text-base" style={{ color: '#212121' }}>{s.title}</h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: '#757575' }}>{s.desc}</p>
      <ul className="mt-auto pt-3 space-y-1.5 list-none">
        {s.bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm" style={{ color: '#616161' }}>
            <span className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 17, height: 17, backgroundColor: s.iconColor }}>
              <Check size={10} style={{ color: '#fff', strokeWidth: 2.5 }} />
            </span>
            {b}
          </li>
        ))}
      </ul>
    </Link>
  )

  return (
    <div>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(252, 255, 242, 0.97) 0%, rgba(248, 255, 243, 0.92) 20%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.05) 70%)'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-center">
            <div>
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-primary-700 mb-6"
                style={{ backgroundColor: '#eef5d3', border: '1px solid #d4e6a5' }}
              >
                {t('hero_badge')}
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.75rem] font-bold text-neutral-900 leading-[1.15] tracking-tight">
                {t('hero_title_1')}{' '}
                <br className="hidden sm:block" />
                <span className="text-primary-700">{t('hero_title_2')}</span>
              </h1>
              <p className="mt-5 text-neutral-600 text-base sm:text-xl leading-relaxed max-w-md">
                {t('hero_subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/detect"
                  className="inline-flex items-center gap-2 no-underline transition-all hover:brightness-110 active:brightness-95"
                  style={btnGreenFilled}
                >
                  {t('hero_cta')} <ArrowRight size={18} />
                </Link>
                <Link
                  to="/learn"
                  className="inline-flex items-center gap-2 no-underline transition-colors"
                  style={btnGreenOutline}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fbe7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
                >
                  {t('hero_learn_more')}
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6">
                {[
                  { value: '6', label: t('hero_stat_conditions') },
                  { value: '3', label: t('hero_stat_modes') },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    {i > 0 && <div className="w-px h-8 bg-neutral-200" />}
                    <div>
                      <p className="text-xl font-bold leading-none" style={{ color: '#33691e' }}>{stat.value}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Farmer card */}
            <div className="hidden lg:flex justify-end items-center">
              <div className="w-full max-w-[400px] p-3" style={floatingCard}>
                <div className="relative overflow-hidden" style={{ borderRadius: '12px' }}>
                  <img src={FARMER_IMG} alt="Farmer in rice field" className="w-full h-64 object-cover" />
                  {/* Overlay badge on image */}
                  <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#6b9f37' }} />
                      <span className="text-xs font-medium" style={{ color: '#424242' }}>{t('hero_card_detected')}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#eef5d3', color: '#33691e' }}>{t('hero_card_match')}</span>
                  </div>
                </div>
                <div className="mt-3 px-1 pb-1 flex items-center gap-2">
                  <CheckCircle2 size={14} style={{ color: '#558b2f' }} />
                  <span className="text-xs text-neutral-500">{t('hero_card_complete')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICES ═══════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #eef5d3 0%, #ffffff 14%, #ffffff 82%, #f0f7e0 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div><span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: '#eef5d3', color: '#33691e', border: '1px solid #c5dc8a' }}>
              {t('section_label_features')}
            </span></div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900">
              {t('services_title')}
            </h2>
            <div className="mt-3 mx-auto w-20 h-1 rounded-full" style={{ background: 'linear-gradient(to right, #8bc34a, #c5a028)' }} />
            <p className="mt-4 text-neutral-600 text-l leading-relaxed">
              {t('services_subtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.slice(0, 3).map((s) => <ServiceCard key={s.title} s={s} />)}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[44rem] mx-auto">
            {services.slice(3).map((s) => <ServiceCard key={s.title} s={s} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS + AI VISUAL ANALYSIS (unified) ═══════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #f0f7e0 0%, #eef5d3 6%, #d4e6a5 42%, #e8f4cc 54%, #f7fbee 62%, #ffffff 74%, #f5f5f5 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div><span className="inline-block px-3 py-1 rounded-full text-s font-semibold mb-4" style={{ backgroundColor: '#eef5d3', color: '#33691e', border: '1px solid #c5dc8a' }}>
              {t('section_label_process')}
            </span></div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900">
              {t('how_title')}
            </h2>
            <div className="mt-3 mx-auto w-20 h-1 rounded-full" style={{ background: 'linear-gradient(to right, #8bc34a, #c5a028)' }} />
            <p className="mt-4 text-neutral-600 text-m">{t('how_subtitle')}</p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => {
              const stepGradients = [
                'linear-gradient(180deg, #558b2f 0%, #33691e 100%)',
                'linear-gradient(180deg, #d4b438 0%, #b8960c 100%)',
                'linear-gradient(180deg, #558b2f 0%, #33691e 100%)',
                'linear-gradient(180deg, #d4b438 0%, #b8960c 100%)',
              ]
              return (
                <div key={step.label} className="relative overflow-hidden rounded-2xl p-6 text-white flex flex-col transition-transform duration-200 hover:scale-[1.02] cursor-default" style={{
                  background: stepGradients[i],
                  boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                  minHeight: '220px',
                }}>
                  {/* Watermark number — top-right */}
                  <span className="absolute right-3 top-2 font-black leading-none select-none pointer-events-none" style={{ fontSize: '5rem', color: 'rgba(255,255,255,0.13)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                      <step.icon size={22} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold leading-snug" style={{ fontSize: lang === 'km' ? '1.1rem' : '1rem' }}>{step.label}</h4>
                    <p className="mt-2 leading-relaxed" style={{ fontSize: lang === 'km' ? '15px' : '13px', color: 'rgba(255,255,255,0.85)' }}>{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Visual Analysis — same section, separated by spacing */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: '#eef5d3', color: '#33691e', border: '1px solid #c5dc8a' }}>
                {t('section_label_ai')}
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900">
                {t('visual_title')}
              </h2>
              <p className="mt-4 text-neutral-800 text-l leading-relaxed">
                {t('visual_subtitle')}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: t('visual_item1'), icon: Leaf, bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
                  { label: t('visual_item2'), icon: Microscope, bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
                  { label: t('visual_item3'), icon: Droplets, bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' },
                  { label: t('visual_item4'), icon: Thermometer, bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="
                        group flex items-center gap-3 p-4 rounded-xl cursor-pointer
                        transition-all duration-300 ease-out
                        hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]
                      "
                      style={{
                        backgroundColor: item.bg,
                        border: `1px solid ${item.border}`,
                      }}
                    >
                      <Icon
                        size={20}
                        strokeWidth={2}
                        className="transition-transform duration-300 group-hover:scale-110"
                        style={{ color: item.color }}
                      />

                      <span className="text-sm md:text-base font-semibold text-neutral-800">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link
                to="/detect"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg no-underline text-sm transition-all"
                style={{ boxShadow: '0 2px 8px rgba(85,139,47,0.3)', fontFamily: 'Roboto, sans-serif' }}
              >
                {t('visual_cta')} <ArrowRight size={16} />
              </Link>
            </div>

            {/* Analysis card */}
            <div
              className="
                p-10 rounded-2xl transition-all duration-300
                hover:shadow-2xl hover:-translate-y-2
              "
              style={{
                ...floatingCard,
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Label */}
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                {t('visual_card_label')}
              </p>

              {/* Disease */}
              <div className="flex items-center gap-2 mt-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-semibold text-neutral-900">
                  {t('visual_card_disease')}
                </span>
              </div>

              {/* Confidence */}
              <div className="mt-2 ml-5">
                <span className="text-xs text-neutral-500">
                  {t('visual_card_confidence')}
                </span>

                {/* Progress bar */}
                <div className="mt-1 h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full w-[78%] transition-all duration-500" />
                </div>
              </div>

              {/* Image */}
              <div className="mt-5 w-full h-44 rounded-xl overflow-hidden group">
                <img
                  src={ANALYSIS_IMG}
                  alt="Analysis"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Recommendations */}
              <div className="mt-5">
                <p className="text-s font-semibold text-neutral-700">
                  {t('visual_card_recs')}
                </p>

                <ul className="mt-3 space-y-2 list-none">
                  {[t('visual_card_rec1'), t('visual_card_rec2'), t('visual_card_rec3')].map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-neutral-600">
                      <CheckCircle2 size={16} className="text-primary-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* ═══════════════ EDUCATIONAL RESOURCES ═══════════════ */}

      <section className="py-20" style={{ background: 'linear-gradient(180deg, #f5f5f5 0%, #fafafa 8%, #fafafa 92%, #f0f0f0 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div><span className="inline-block px-3 py-1 rounded-full text-s font-semibold mb-4" style={{ backgroundColor: '#eef5d3', color: '#33691e', border: '1px solid #c5dc8a' }}>
              {t('section_label_learning')}
            </span></div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900">
              {t('edu_title')}
            </h2>
            <div className="mt-3 mx-auto w-20 h-1 rounded-full" style={{ background: 'linear-gradient(to right, #8bc34a, #c5a028)' }} />
            <p className="mt-4 text-neutral-600 text-m">{t('edu_subtitle')}</p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((a) => (
              <Link key={a.title} to="/learn" className="group overflow-hidden hover-lift no-underline text-left transition-all flex flex-col" style={{ ...cardStyle, backgroundColor: '#fff' }}>
                <div className="relative h-40 overflow-hidden shrink-0">
                  <img src={a.img} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {a.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
                        <Play size={18} className="text-primary-600 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-7 flex flex-col flex-1">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[13px] font-semibold mb-3" style={{ backgroundColor: a.catBg, color: a.catColor }}>
                    {a.category}
                  </span>
                  <h4 className="font-semibold text-neutral-900 text-m group-hover:text-primary-600 transition-colors leading-snug">
                    {a.title}
                  </h4>
                  <p className="mt-2 text-xs text-neutral-600 leading-relaxed">{a.desc}</p>
                  <span className="mt-auto pt-3 text-s text-primary-600 font-semibold flex items-center gap-1 group-hover:gap-2 
                                    transition-all group-hover:underline underline-offset-4 decoration-2">
                    {a.type === 'video' ? t('edu_watch_video') : t('edu_read_article')} 
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 no-underline transition-colors"
              style={btnGreenOutline}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fbe7' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
            >
              {t('edu_view_all')}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ PARTNERS ═══════════════ */}
      <section className="py-16" style={{ background: 'linear-gradient(180deg, #f0f0f0 0%, #ffffff 12%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-s font-semibold mb-4" style={{ backgroundColor: '#eef5d3', color: '#33691e', border: '1px solid #c5dc8a' }}>
            {t('section_label_trusted')}
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900">{t('partners_title')}</h2>
          <div className="mt-3 mx-auto w-20 h-1 rounded-full" style={{ background: 'linear-gradient(to right, #8bc34a, #c5a028)' }} />

          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {[
            {
              abbr: 'AUPP',
              full: t('partner_aupp'),
              logo: '/images/AUPP-logo.png'
            },
            {
              abbr: 'MOA',
              full: t('partner_mrd'),
              logo: '/images/MRD-logo.png'
            },
            {
              abbr: 'ARI',
              full: t('partner_vigor'),
              logo: '/images/Vigor Cambodia Logo-01.png'
            },
          ].map((p) => (
            <div
              key={p.abbr}
              className="
                flex items-center gap-4 px-6 py-4 rounded-xl
                bg-white border border-neutral-200
                transition-all duration-300
                hover:shadow-md hover:-translate-y-1
              "
              style={{ minWidth: '220px' }}
            >
              {/* Logo circle */}
              <div
                className="
                  w-12 h-12 rounded-full flex items-center justify-center
                  bg-neutral-100 border border-neutral-200
                  overflow-hidden shrink-0
                "
              >
                <img
                  src={p.logo}
                  alt={p.abbr}
                  className="w-8 h-8 object-contain"
                />
              </div>

              {/* Text */}
              <span className="text-sm sm:text-base font-semibold text-neutral-800 leading-snug">
                {p.full}
              </span>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-16" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl overflow-hidden text-center py-14 px-8" style={{ background: 'linear-gradient(135deg, #2d5a1b 0%, #1e3d12 100%)', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              {t('cta_title')}
            </h2>
            <p className="mt-3 text-m max-w-md mx-auto" style={{ color: '#a8c89a' }}>
              {t('cta_subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/detect"
                className="inline-flex items-center gap-2 no-underline transition-colors"
                style={{ backgroundColor: '#fff', color: '#212121', borderRadius: '8px', padding: '12px 28px', fontWeight: 600, fontSize: '14px', fontFamily: 'Roboto, sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                {t('cta_button')} 
              </Link>
              <Link
                to="/experts"
                className="inline-flex items-center gap-2 no-underline transition-colors text-white hover:bg-white/10 font-semibold text-sm"
                style={btnWhiteOutline}
              >
                {t('cta_experts')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
