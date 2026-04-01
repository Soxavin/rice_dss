import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { AlertCircle, CheckCircle, Leaf, Phone, ArrowRight, Download, TriangleAlert, Info, ChevronLeft } from 'lucide-react'

// ─── Confidence level colours ─────────────────────────────────────────────────
const CONF_STYLE = {
  high:     { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#22c55e' },
  medium:   { bg: '#fefce8', border: '#fde047', text: '#854d0e', dot: '#eab308' },
  possible: { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', dot: '#f97316' },
  low:      { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', dot: '#ef4444' },
  ml_only:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', dot: '#3b82f6' },
}

// ─── Products — filtered by condition ────────────────────────────────────────
const PRODUCTS = [
  { name: 'Tricyclazole Fungicide 75WP', price: '$12.00', img: '🧪', supplier: 'GreenGrowth Agri-Supply',   telegram: 'greengrowth_supply', conditions: ['blast'] },
  { name: 'Copper-based Bactericide',    price: '$15.00', img: '🧴', supplier: 'AgriTech Solutions KH',     telegram: 'agritech_kh',        conditions: ['bacterial_blight'] },
  { name: 'Zineb Fungicide 3 kg/ha',     price: '$9.50',  img: '🌿', supplier: 'PhnomPenh AgroShop',        telegram: 'ppagro_kh',          conditions: ['brown_spot', 'blast'] },
  { name: 'Urea / Nitrogen Fertilizer',  price: '$8.00',  img: '🌱', supplier: 'Cambodia Farm Supplies',    telegram: 'cam_farmsupply',     conditions: ['n_deficiency', 'brown_spot'] },
  { name: 'Gypsum / Calcium Amendment',  price: '$10.00', img: '🪨', supplier: 'SoilCare Cambodia',         telegram: 'soilcare_kh',        conditions: ['salt_toxicity', 'iron_toxicity'] },
]

const FALLBACK_IMG = '/images/analysis-leaf.jpg'

export default function Step3Results() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [uploadedImages, setUploadedImages] = useState([])
  const [activeImg, setActiveImg] = useState(0)
  const [activeTab, setActiveTab] = useState('photo') // 'photo' | 'gradcam'

  useEffect(() => {
    const r = sessionStorage.getItem('detect_result')
    if (r) setResult(JSON.parse(r))
    const imgs = sessionStorage.getItem('detect_images')
    if (imgs) setUploadedImages(JSON.parse(imgs))
  }, [])

  if (!result) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-500">{t('detect_no_result')}</p>
        <Link to="/detect" className="mt-4 inline-block font-medium no-underline hover:underline" style={{ color: '#558b2f' }}>
          ← {t('detect_start_new')}
        </Link>
      </div>
    )
  }

  // ─── Derived ────────────────────────────────────────────────────────────────
  const condKey       = result.condition_key || 'uncertain'
  const score         = result.score || 0
  const scorePct      = Math.round(score * 100)
  const recs          = result.recommendations || {}
  const allScores     = result.all_scores || {}
  const confLevel     = result.confidence_level || 'low'
  const confStyle     = CONF_STYLE[confLevel] || CONF_STYLE.low
  const isAmbiguous   = result.status === 'ambiguous'
  const hasWarnings   = (result.warnings || []).length > 0
  const secondaryConds = result.secondary_conditions || []

  const gradcamSrc    = result.gradcam_base64 ? `data:image/png;base64,${result.gradcam_base64}` : null
  const hasUploads    = uploadedImages.length > 0
  const hasTabs       = gradcamSrc && hasUploads
  const displayImg    = activeTab === 'gradcam' && gradcamSrc
    ? gradcamSrc
    : (uploadedImages[activeImg]?.preview || FALLBACK_IMG)

  // Translate mode_used badge — backend sends English string, map to t() key
  const modeLabel = (raw) => {
    if (!raw) return null
    const r = raw.toLowerCase()
    if (r.includes('hybrid'))         return t('detect_mode_badge_hybrid')
    if (r.includes('ml') || r.includes('image') || r.includes('only')) return t('detect_mode_badge_ml')
    if (r.includes('questionnaire'))  return t('detect_mode_badge_questionnaire')
    return raw
  }

  const products      = PRODUCTS.filter(p => p.conditions.includes(condKey))
  const displayProducts = products.length > 0 ? products : PRODUCTS.slice(0, 2)

  // Translatable short condition names for the All Scores panel
  const condLabel = (key) => ({
    blast:            t('cond_name_blast'),
    brown_spot:       t('cond_name_brown_spot'),
    bacterial_blight: t('cond_name_bacterial_blight'),
    iron_toxicity:    t('cond_name_iron_toxicity'),
    n_deficiency:     t('cond_name_n_deficiency'),
    salt_toxicity:    t('cond_name_salt_toxicity'),
  })[key] || key.replace(/_/g, ' ')

  // Translatable condition data (built inside component so t() is in scope)
  const condDesc = {
    blast:             t('cond_desc_blast'),
    brown_spot:        t('cond_desc_brown_spot'),
    bacterial_blight:  t('cond_desc_bacterial_blight'),
    iron_toxicity:     t('cond_desc_iron_toxicity'),
    n_deficiency:      t('cond_desc_n_deficiency'),
    salt_toxicity:     t('cond_desc_salt_toxicity'),
    uncertain:         t('cond_desc_uncertain'),
    ambiguous_fungal:  t('cond_desc_ambiguous_fungal'),
    out_of_scope:      t('cond_desc_out_of_scope'),
  }

  const condSymptoms = {
    blast:            [ { name: t('cond_blast_s1'), desc: t('cond_blast_s1_desc') }, { name: t('cond_blast_s2'), desc: t('cond_blast_s2_desc') }, { name: t('cond_blast_s3'), desc: t('cond_blast_s3_desc') } ],
    brown_spot:       [ { name: t('cond_brown_spot_s1'), desc: t('cond_brown_spot_s1_desc') }, { name: t('cond_brown_spot_s2'), desc: t('cond_brown_spot_s2_desc') }, { name: t('cond_brown_spot_s3'), desc: t('cond_brown_spot_s3_desc') } ],
    bacterial_blight: [ { name: t('cond_bacterial_blight_s1'), desc: t('cond_bacterial_blight_s1_desc') }, { name: t('cond_bacterial_blight_s2'), desc: t('cond_bacterial_blight_s2_desc') }, { name: t('cond_bacterial_blight_s3'), desc: t('cond_bacterial_blight_s3_desc') } ],
    iron_toxicity:    [ { name: t('cond_iron_toxicity_s1'), desc: t('cond_iron_toxicity_s1_desc') }, { name: t('cond_iron_toxicity_s2'), desc: t('cond_iron_toxicity_s2_desc') }, { name: t('cond_iron_toxicity_s3'), desc: t('cond_iron_toxicity_s3_desc') } ],
    n_deficiency:     [ { name: t('cond_n_deficiency_s1'), desc: t('cond_n_deficiency_s1_desc') }, { name: t('cond_n_deficiency_s2'), desc: t('cond_n_deficiency_s2_desc') }, { name: t('cond_n_deficiency_s3'), desc: t('cond_n_deficiency_s3_desc') } ],
    salt_toxicity:    [ { name: t('cond_salt_toxicity_s1'), desc: t('cond_salt_toxicity_s1_desc') }, { name: t('cond_salt_toxicity_s2'), desc: t('cond_salt_toxicity_s2_desc') }, { name: t('cond_salt_toxicity_s3'), desc: t('cond_salt_toxicity_s3_desc') } ],
    uncertain:        [ { name: t('cond_uncertain_s1'), desc: t('cond_uncertain_s1_desc') }, { name: t('cond_uncertain_s2'), desc: t('cond_uncertain_s2_desc') }, { name: t('cond_uncertain_s3'), desc: t('cond_uncertain_s3_desc') } ],
    ambiguous_fungal: [ { name: t('cond_ambiguous_fungal_s1'), desc: t('cond_ambiguous_fungal_s1_desc') }, { name: t('cond_ambiguous_fungal_s2'), desc: t('cond_ambiguous_fungal_s2_desc') }, { name: t('cond_ambiguous_fungal_s3'), desc: t('cond_ambiguous_fungal_s3_desc') } ],
    out_of_scope:     [ { name: t('cond_out_of_scope_s1'), desc: t('cond_out_of_scope_s1_desc') }, { name: t('cond_out_of_scope_s2'), desc: t('cond_out_of_scope_s2_desc') } ],
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">{t('detect_step3_title')}</h1>
          <p className="mt-1 text-sm" style={{ color: '#757575' }}>{t('detect_step3_subtitle')}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0 gap-1">
          <span className="text-sm font-medium" style={{ color: '#558b2f' }}>{t('step_label')} 3 {t('step_of')} 3</span>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-8 h-1.5 rounded-full" style={{ backgroundColor: '#558b2f' }} />
            ))}
          </div>
          <button
            onClick={() => navigate('/detect')}
            className="mt-1 text-xs font-medium border-none cursor-pointer hover:underline bg-transparent"
            style={{ color: '#558b2f' }}
          >
            + {t('detect_start_new')}
          </button>
        </div>
      </div>

      {/* ── Warnings banner ──────────────────────────────────────────────────── */}
      {hasWarnings && (
        <div className="mt-5 rounded-xl p-4 flex gap-3" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde047' }}>
          <TriangleAlert size={18} className="shrink-0 mt-0.5" style={{ color: '#ca8a04' }} />
          <div className="space-y-1">
            {result.warnings.map((w, i) => <p key={i} className="text-sm" style={{ color: '#854d0e' }}>{w}</p>)}
          </div>
        </div>
      )}

      {/* ── Main result card ─────────────────────────────────────────────────── */}
      <div className="mt-5 rounded-2xl overflow-hidden" style={{ border: '1px solid #e0e0e0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── Image panel ── */}
          <div className="flex flex-col bg-neutral-900">

            {/* Tab bar (only shown when there are both uploads + grad-cam) */}
            {hasTabs && (
              <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {[
                  { key: 'photo',   label: t('detect_tab_photo') },
                  { key: 'gradcam', label: t('detect_tab_gradcam') },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex-1 py-2.5 text-xs font-semibold cursor-pointer border-none transition-all"
                    style={{
                      backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.5)',
                      borderBottom: activeTab === tab.key ? '2px solid #a8d060' : '2px solid transparent',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Grad-CAM label when no tabs (only gradcam, no upload) */}
            {gradcamSrc && !hasTabs && (
              <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <span className="text-xs font-semibold" style={{ color: '#a8d060' }}>{t('detect_gradcam_badge')}</span>
              </div>
            )}

            {/* Main image */}
            <div className="relative flex-1" style={{ minHeight: '300px', maxHeight: '420px' }}>
              <img
                src={displayImg}
                alt={result.primary_condition || 'Analysis result'}
                className="w-full h-full object-contain"
                style={{ maxHeight: '380px' }}
                onError={e => { e.target.src = FALLBACK_IMG }}
              />
            </div>

            {/* Thumbnail strip (only for "Your Photo" tab or when no tabs) */}
            {hasUploads && activeTab !== 'gradcam' && uploadedImages.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                {uploadedImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer shrink-0 transition-all border-2"
                    style={{ borderColor: i === activeImg ? '#a8d060' : 'rgba(255,255,255,0.25)' }}
                  >
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <div className="p-6 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9e9e9e' }}>
                  <Leaf size={13} style={{ color: '#558b2f' }} />
                  {t('detect_detected')}
                </div>
                {result.mode_used && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#eef5d3', color: '#33691e' }}>
                    {modeLabel(result.mode_used)}
                  </span>
                )}
              </div>

              <h2 className="mt-2 font-heading text-2xl font-bold text-neutral-900 leading-snug">
                {result.primary_condition || 'Uncertain'}
              </h2>

              {isAmbiguous && result.ambiguous_between && (
                <p className="mt-1 text-xs" style={{ color: '#757575' }}>
                  {t('detect_could_be')} {result.ambiguous_between.map(a => a.condition).join(' or ')}
                </p>
              )}

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: confStyle.bg, border: `1px solid ${confStyle.border}`, color: confStyle.text }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: confStyle.dot }} />
                {result.confidence_label || 'Unknown confidence'}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-bold leading-none" style={{ color: '#558b2f' }}>
                  {scorePct}<span className="text-2xl">%</span>
                </span>
                <span className="text-sm mb-1" style={{ color: '#9e9e9e' }}>{t('detect_confidence_score')}</span>
              </div>
              <div className="w-full rounded-full h-2.5" style={{ backgroundColor: '#f0f0f0' }}>
                <div className="h-2.5 rounded-full transition-all duration-1000"
                  style={{ width: `${scorePct}%`, backgroundColor: '#558b2f' }} />
              </div>
              {result.disclaimer && (
                <p className="mt-3 text-xs leading-relaxed italic" style={{ color: '#bdbdbd' }}>{result.disclaimer}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail grid ──────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left 2/3 ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* About condition */}
          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm flex items-center gap-2 text-neutral-900">
              <Info size={15} style={{ color: '#558b2f' }} /> {t('detect_about_condition')}
            </h3>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#616161' }}>
              {condDesc[condKey] || condDesc.uncertain}
            </p>
          </div>

          {/* Key symptoms */}
          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm flex items-center gap-2 text-neutral-900">
              🔍 {t('detect_key_symptoms')}
            </h3>
            <div className="mt-3 space-y-2">
              {(condSymptoms[condKey] || condSymptoms.uncertain).map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f7fbe7' }}>
                  <CheckCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#558b2f' }} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{s.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#757575' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immediate actions */}
          {(recs.immediate || []).length > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
              <h3 className="font-semibold text-sm flex items-center gap-2 text-neutral-900">
                ✅ {t('detect_recommended_actions')}
              </h3>
              <div className="mt-3 space-y-3">
                {recs.immediate.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                      style={{ backgroundColor: '#558b2f' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm pt-0.5" style={{ color: '#424242' }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preventive + monitoring */}
          {(recs.preventive || []).length > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
              <h3 className="font-semibold text-sm flex items-center gap-2 text-neutral-900">
                🛡️ {t('detect_preventive')}
              </h3>
              <ul className="mt-3 space-y-2">
                {recs.preventive.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#616161' }}>
                    <span style={{ color: '#558b2f' }} className="shrink-0">•</span> {p}
                  </li>
                ))}
              </ul>
              {recs.monitoring && (
                <div className="mt-4 p-3 rounded-lg text-xs leading-relaxed" style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', color: '#616161' }}>
                  <span className="font-semibold text-neutral-700">📅 {t('detect_monitoring_label')} </span>{recs.monitoring}
                </div>
              )}
            </div>
          )}

          {/* Secondary conditions */}
          {secondaryConds.length > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #fde047' }}>
              <h3 className="font-semibold text-sm flex items-center gap-2 text-neutral-900">
                <AlertCircle size={15} style={{ color: '#ca8a04' }} /> {t('detect_secondary_conditions')}
              </h3>
              <p className="mt-1 text-xs" style={{ color: '#9e9e9e' }}>{t('detect_secondary_hint')}</p>
              <div className="mt-3 space-y-2">
                {secondaryConds.map((sc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#fefce8' }}>
                    <div>
                      <span className="text-sm font-medium text-neutral-800">{sc.condition || sc.condition_key}</span>
                      {sc.note && <span className="ml-2 text-xs" style={{ color: '#9e9e9e' }}>{sc.note}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 rounded-full h-1.5" style={{ backgroundColor: '#e0e0e0' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.round((sc.score || 0) * 100)}%`, backgroundColor: '#eab308' }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#616161' }}>{Math.round((sc.score || 0) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right 1/3 ── */}
        <div className="space-y-5">

          {/* All condition scores */}
          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm text-neutral-900">{t('detect_all_scores')}</h3>
            <div className="mt-3 space-y-3">
              {Object.entries(allScores)
                .sort(([, a], [, b]) => b - a)
                .map(([key, val]) => {
                  const isPrimary = key === condKey
                  const pct = Math.round(val * 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium" style={{ color: isPrimary ? '#33691e' : '#616161' }}>
                          {isPrimary && '▶ '}{condLabel(key)}
                        </span>
                        <span className="font-semibold" style={{ color: '#424242' }}>{pct}%</span>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#eeeeee' }}>
                        <div className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: isPrimary ? '#558b2f' : '#a8d060' }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Recommended products */}
          <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="font-semibold text-sm text-neutral-900">{t('detect_recommended_products')}</h3>
            <div className="mt-3 space-y-3">
              {displayProducts.map((p) => (
                <div key={p.name} className="rounded-lg p-3" style={{ border: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl shrink-0">{p.img}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-medium text-neutral-900 leading-snug">{p.name}</h4>
                        <span className="text-sm font-bold shrink-0" style={{ color: '#558b2f' }}>{p.price}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#9e9e9e' }}>{p.supplier}</p>
                    </div>
                  </div>
                  <a
                    href={`https://t.me/${p.telegram}?text=${encodeURIComponent(`Hi, I need ${p.name} for treating ${result.primary_condition || 'rice disease'}. Please send details and pricing.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium no-underline hover:underline"
                    style={{ color: '#558b2f' }}
                  >
                    {t('detect_contact_telegram')} <ArrowRight size={10} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Expert help */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#f7fbe7', border: '1px solid #d4e6a5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1b5e20' }}>{t('detect_need_help')}</h3>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: '#558b2f' }}>
              {recs.consult ? t('detect_consult_urgent') : t('detect_consult_normal')}
            </p>
            <Link
              to="/experts"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg no-underline text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#558b2f' }}
            >
              <Phone size={14} /> {t('detect_book_call')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom actions ───────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between border-t pt-6" style={{ borderColor: '#eeeeee' }}>
        <button
          onClick={() => navigate('/detect')}
          className="text-sm bg-transparent border-none cursor-pointer flex items-center gap-1 hover:underline"
          style={{ color: '#757575' }}
        >
          <ChevronLeft size={14} /> {t('detect_start_new')}
        </button>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `srovmeas-result-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#558b2f' }}
        >
          <Download size={14} /> {t('detect_save_data')}
        </button>
      </div>
    </div>
  )
}
