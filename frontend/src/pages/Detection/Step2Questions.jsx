import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { hybridImages, hybridImage, diagnoseQuestionnaire, predictImage, predictImages } from '../../api/client'

// ─── DSS field constants — must match dss/validation.py exactly ───────────────
const GROWTH_STAGES     = ['seedling', 'tillering', 'elongation', 'flowering', 'grain_filling']
const SYMPTOMS          = ['dark_spots', 'yellowing', 'dried_areas', 'brown_discoloration', 'slow_growth', 'white_tips']
const SYMPTOM_LOCATIONS = ['leaf_blade', 'leaf_sheath', 'stem', 'panicle']
const SYMPTOM_ORIGINS   = ['lower_leaves', 'upper_leaves', 'all_leaves', 'unsure']
const WEATHER_OPTIONS   = ['heavy_rain', 'high_humidity', 'normal', 'dry_hot', 'unsure']
const WATER_CONDITIONS  = ['flooded_continuously', 'wet', 'dry', 'recently_drained']
const SPREAD_PATTERNS   = ['few_plants', 'patches', 'most_of_field']
const ONSET_SPEEDS      = ['sudden', 'gradual', 'unsure']
const FERTILIZER_AMTS   = ['excessive', 'normal', 'less']
const ADDL_SYMPTOMS     = ['purple_roots', 'reduced_tillers', 'stunted_growth', 'morning_ooze', 'none']
const FARMER_CONFIDENCE = ['very_sure', 'somewhat_sure', 'not_sure']

// ─── Chip component ────────────────────────────────────────────────────────────
function ChipSelect({ options, getLabel, selected, onSelect, multi = false, hint }) {
  const handleClick = (val) => {
    if (!multi) { onSelect(val === selected ? null : val); return }
    if (val === 'none') { onSelect(['none']); return }
    const prev = Array.isArray(selected) ? selected.filter(v => v !== 'none') : []
    onSelect(prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }
  const isActive = (val) => multi
    ? Array.isArray(selected) && selected.includes(val)
    : selected === val

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = isActive(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleClick(opt)}
              className="px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={active
                ? { backgroundColor: '#558b2f', color: '#fff', border: '2px solid #558b2f', boxShadow: '0 2px 6px rgba(85,139,47,0.28)' }
                : { backgroundColor: '#fff', color: '#424242', border: '2px solid #e0e0e0' }}
            >
              {getLabel(opt)}
            </button>
          )
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs italic" style={{ color: '#9e9e9e' }}>{hint}</p>}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, desc, answered, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(to right, #f7fbe7, #eef5d3)', borderBottom: '1px solid #d4e6a5' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-neutral-900 text-[15px]">{title}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#757575' }}>{desc}</p>
          </div>
        </div>
        {answered > 0 && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: '#d4e6a5', color: '#33691e' }}>
            {answered} ✓
          </span>
        )}
      </div>
      <div className="p-6 bg-white space-y-6">{children}</div>
    </div>
  )
}

// ─── Question row ─────────────────────────────────────────────────────────────
function QRow({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: '#212121' }}>{label}</label>
      {hint && <p className="text-xs mb-2.5" style={{ color: '#9e9e9e' }}>{hint}</p>}
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Step2Questions() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [uploadedImages, setUploadedImages] = useState([])
  const [mode, setMode] = useState('hybrid')

  const [answers, setAnswers] = useState({
    growth_stage:        null,
    symptoms:            [],
    symptom_location:    [],
    symptom_origin:      null,
    weather:             null,
    water_condition:     null,
    spread_pattern:      null,
    onset_speed:         null,
    fertilizer_applied:  null,
    fertilizer_amount:   null,
    additional_symptoms: [],
    farmer_confidence:   'somewhat_sure',
  })

  useEffect(() => {
    const savedMode = sessionStorage.getItem('detect_mode')
    if (!savedMode) {
      navigate('/detect', { replace: true })
      return
    }
    setMode(savedMode)
    const stored = sessionStorage.getItem('detect_images')
    if (stored) setUploadedImages(JSON.parse(stored))
  }, [navigate])

  const set = (field, val) => setAnswers(a => ({ ...a, [field]: val }))

  // Translation helpers for chips
  const gsLabel    = (v) => ({ seedling: t('gs_seedling'), tillering: t('gs_tillering'), elongation: t('gs_elongation'), flowering: t('gs_flowering'), grain_filling: t('gs_grain_filling') })[v] ?? v
  const locLabel   = (v) => ({ leaf_blade: t('loc_leaf_blade'), leaf_sheath: t('loc_leaf_sheath'), stem: t('loc_stem'), panicle: t('loc_panicle') })[v] ?? v
  const origLabel  = (v) => ({ lower_leaves: t('orig_lower_leaves'), upper_leaves: t('orig_upper_leaves'), all_leaves: t('orig_all_leaves'), unsure: t('orig_unsure') })[v] ?? v
  const symLabel   = (v) => ({ dark_spots: t('sym_dark_spots'), yellowing: t('sym_yellowing'), dried_areas: t('sym_dried_areas'), brown_discoloration: t('sym_brown_discoloration'), slow_growth: t('sym_slow_growth'), white_tips: t('sym_white_tips') })[v] ?? v
  const addlLabel  = (v) => ({ purple_roots: t('addl_purple_roots'), reduced_tillers: t('addl_reduced_tillers'), stunted_growth: t('addl_stunted_growth'), morning_ooze: t('addl_morning_ooze'), none: t('addl_none') })[v] ?? v
  const onsetLabel = (v) => ({ sudden: t('onset_sudden'), gradual: t('onset_gradual'), unsure: t('onset_unsure') })[v] ?? v
  const wxLabel    = (v) => ({ heavy_rain: t('weather_heavy_rain'), high_humidity: t('weather_high_humidity'), normal: t('weather_normal'), dry_hot: t('weather_dry_hot'), unsure: t('weather_unsure') })[v] ?? v
  const waterLabel = (v) => ({ flooded_continuously: t('water_flooded'), wet: t('water_wet'), dry: t('water_dry'), recently_drained: t('water_drained') })[v] ?? v
  const spreadLabel= (v) => ({ few_plants: t('spread_few'), patches: t('spread_patches'), most_of_field: t('spread_most') })[v] ?? v
  const fertAmtLabel=(v) => ({ excessive: t('fert_excessive'), normal: t('fert_normal'), less: t('fert_less') })[v] ?? v
  const confLabel  = (v) => ({ very_sure: t('conf_very_sure'), somewhat_sure: t('conf_somewhat_sure'), not_sure: t('conf_not_sure') })[v] ?? v

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const files = window.__detectFiles || []
      let result

      if (mode === 'ml') {
        // ML-only: image(s) only, no questionnaire
        const fd = new FormData()
        if (files.length > 1) {
          files.forEach(f => fd.append('images', f))
          const res = await predictImages(fd, lang)
          result = res.data
        } else {
          fd.append('image', files[0])
          const res = await predictImage(fd, lang)
          result = res.data
        }
      } else if (mode === 'questionnaire' || files.length === 0) {
        // Questionnaire-only
        const clean = Object.fromEntries(
          Object.entries(answers).filter(([, v]) => v !== null && !(Array.isArray(v) && v.length === 0))
        )
        const res = await diagnoseQuestionnaire(clean, lang)
        result = res.data
      } else {
        // Hybrid: image(s) + questionnaire JSON string
        const clean = Object.fromEntries(
          Object.entries(answers).filter(([, v]) => v !== null && !(Array.isArray(v) && v.length === 0))
        )
        const fd = new FormData()
        if (files.length > 1) {
          files.forEach(f => fd.append('images', f))
          fd.append('questionnaire', JSON.stringify(clean))
          const res = await hybridImages(fd, lang)
          result = res.data
        } else {
          fd.append('image', files[0])
          fd.append('questionnaire', JSON.stringify(clean))
          const res = await hybridImage(fd, lang)
          result = res.data
        }
      }

      sessionStorage.setItem('detect_result', JSON.stringify(result))
      navigate('/detect/results')
    } catch (err) {
      console.error('Analysis error:', err)
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (status === 422 && detail) {
        // Real backend error (e.g. OOD rejection, bad image) — surface it to the user
        setApiError(detail)
      } else {
        // Network/server unreachable — fall back to demo result
        sessionStorage.setItem('detect_result', JSON.stringify({
          status: 'assessed',
          primary_condition: 'ជំងឺប្លាស (Rice Blast)',
          condition_key: 'blast',
          confidence_label: t('demo_confidence_label'),
          confidence_level: 'high',
          score: 0.84,
          all_scores: { blast: 0.84, brown_spot: 0.32, bacterial_blight: 0.15, iron_toxicity: 0.0, n_deficiency: 0.05, salt_toxicity: 0.0 },
          recommendations: {
            immediate: [t('demo_rec_blast_1'), t('demo_rec_blast_2')],
            preventive: [t('demo_prev_blast_1'), t('demo_prev_blast_2')],
            monitoring: t('demo_monitoring_blast'),
            consult: answers.growth_stage === 'flowering',
          },
          secondary_conditions: [],
          warnings: [],
          mode_used: mode === 'questionnaire' ? t('demo_mode_questionnaire')
                   : mode === 'ml'            ? t('demo_mode_ml')
                   :                            t('demo_mode_hybrid'),
          disclaimer: t('demo_disclaimer'),
        }))
        navigate('/detect/results')
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── Section counters ────────────────────────────────────────────────────────
  const filled = {
    plant:       [answers.growth_stage, ...answers.symptom_location, answers.symptom_origin].filter(Boolean).length,
    symptoms:    [...answers.symptoms, ...answers.additional_symptoms, answers.onset_speed].filter(Boolean).length,
    environment: [answers.weather, answers.water_condition, answers.spread_pattern].filter(Boolean).length,
    management:  answers.fertilizer_applied !== null ? 1 : 0,
    confidence:  answers.farmer_confidence ? 1 : 0,
  }

  const hasImages = uploadedImages.length > 0

  // Mode badge config
  const modeBadge = {
    hybrid:        { label: t('detect_mode_badge_hybrid'),        color: '#33691e', bg: '#d4e6a5' },
    ml:            { label: t('detect_mode_badge_ml'),            color: '#1e40af', bg: '#dbeafe' },
    questionnaire: { label: t('detect_mode_badge_questionnaire'), color: '#92400e', bg: '#fef3c7' },
  }[mode]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">{t('detect_step2_title')}</h1>
          <p className="mt-1.5 text-sm max-w-lg" style={{ color: '#757575' }}>{t('detect_step2_subtitle')}</p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <span className="text-sm font-medium" style={{ color: '#558b2f' }}>{t('step_label')} 2 {t('step_of')} 3</span>
          <div className="mt-1 flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-8 h-1.5 rounded-full" style={{ backgroundColor: i < 2 ? '#558b2f' : '#e0e0e0' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Mode + image strip ───────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: modeBadge.bg, color: modeBadge.color }}>
          {modeBadge.label}
        </span>
        {hasImages && (
          <>
            <span className="text-xs shrink-0" style={{ color: '#9e9e9e' }}>{t('detect_analyzing_label')}</span>
            <div className="flex gap-2 flex-wrap">
              {uploadedImages.map((img, i) => (
                <img key={i} src={img.preview} alt={`Image ${i + 1}`}
                  className="w-10 h-10 object-cover rounded-lg"
                  style={{ border: '2px solid #a8d060' }} />
              ))}
            </div>
            <span className="text-xs ml-auto shrink-0" style={{ color: '#757575' }}>
              {uploadedImages.length} {t('detect_images_ready')}
            </span>
          </>
        )}
        {!hasImages && (
          <span className="text-xs" style={{ color: '#757575' }}>{t('detect_no_images_note')}</span>
        )}
      </div>

      {/* ── API error banner ────────────────────────────────────────────────── */}
      {apiError && (
        <div className="mt-4 flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
          <span className="text-xl shrink-0">🚫</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>{t('detect_error_title')}</p>
            <p className="mt-0.5 text-sm leading-relaxed" style={{ color: '#7f1d1d' }}>{apiError}</p>
            <button
              onClick={() => { setApiError(null); navigate('/detect') }}
              className="mt-3 text-xs font-semibold underline bg-transparent border-none cursor-pointer"
              style={{ color: '#991b1b' }}
            >
              ← {t('detect_error_back')}
            </button>
          </div>
        </div>
      )}

      {/* ── ML-only mode: skip questionnaire ────────────────────────────────── */}
      {mode === 'ml' && (
        <div className="mt-5 rounded-xl p-6 text-center" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="font-semibold text-neutral-900">{t('detect_ml_mode_notice')}</h3>
          <p className="mt-1.5 text-sm" style={{ color: '#757575' }}>{t('detect_ml_mode_desc')}</p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 px-8 py-3 rounded-xl font-semibold text-sm text-white border-none cursor-pointer disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#1d4ed8' }}
          >
            {loading ? t('detect_analyzing_btn') : t('detect_ml_run')}
          </button>
          <button
            onClick={() => navigate('/detect')}
            className="mt-3 block mx-auto text-xs bg-transparent border-none cursor-pointer hover:underline"
            style={{ color: '#9e9e9e' }}
          >
            ← {t('detect_cancel')}
          </button>
        </div>
      )}

      {/* ── Full questionnaire (hybrid / questionnaire modes) ────────────────── */}
      {mode !== 'ml' && (
        <>
          <p className="mt-4 text-xs italic" style={{ color: '#bdbdbd' }}>{t('detect_optional_note')}</p>

          <div className="mt-5 space-y-4">

            {/* Section 1 — Plant */}
            <SectionCard icon="🌱" title={t('detect_section_plant')} desc={t('detect_section_plant_desc')} answered={filled.plant}>
              <QRow label={t('detect_q_growth_stage')} hint={t('detect_q_growth_stage_hint')}>
                <ChipSelect options={GROWTH_STAGES} getLabel={gsLabel} selected={answers.growth_stage} onSelect={v => set('growth_stage', v)} />
              </QRow>
              <QRow label={t('detect_q_symptom_location')} hint={t('detect_q_symptom_location_hint')}>
                <ChipSelect options={SYMPTOM_LOCATIONS} getLabel={locLabel} selected={answers.symptom_location} onSelect={v => set('symptom_location', v)} multi />
              </QRow>
              <QRow label={t('detect_q_symptom_origin')}>
                <ChipSelect options={SYMPTOM_ORIGINS} getLabel={origLabel} selected={answers.symptom_origin} onSelect={v => set('symptom_origin', v)} />
              </QRow>
            </SectionCard>

            {/* Section 2 — Symptoms */}
            <SectionCard icon="👁️" title={t('detect_section_symptoms')} desc={t('detect_section_symptoms_desc')} answered={filled.symptoms}>
              <QRow label={t('detect_q_visible')} hint={t('detect_q_visible_hint')}>
                <ChipSelect options={SYMPTOMS} getLabel={symLabel} selected={answers.symptoms} onSelect={v => set('symptoms', v)} multi />
              </QRow>
              <QRow label={t('detect_q_additional')} hint={t('detect_q_additional_hint')}>
                <ChipSelect options={ADDL_SYMPTOMS} getLabel={addlLabel} selected={answers.additional_symptoms} onSelect={v => set('additional_symptoms', v)} multi hint={t('detect_q_additional_tip')} />
              </QRow>
              <QRow label={t('detect_q_onset')}>
                <ChipSelect options={ONSET_SPEEDS} getLabel={onsetLabel} selected={answers.onset_speed} onSelect={v => set('onset_speed', v)} />
              </QRow>
            </SectionCard>

            {/* Section 3 — Environment */}
            <SectionCard icon="🌦️" title={t('detect_section_environment')} desc={t('detect_section_environment_desc')} answered={filled.environment}>
              <QRow label={t('detect_q_weather')}>
                <ChipSelect options={WEATHER_OPTIONS} getLabel={wxLabel} selected={answers.weather} onSelect={v => set('weather', v)} />
              </QRow>
              <QRow label={t('detect_q_water')}>
                <ChipSelect options={WATER_CONDITIONS} getLabel={waterLabel} selected={answers.water_condition} onSelect={v => set('water_condition', v)} />
              </QRow>
              <QRow label={t('detect_q_spread')}>
                <ChipSelect options={SPREAD_PATTERNS} getLabel={spreadLabel} selected={answers.spread_pattern} onSelect={v => set('spread_pattern', v)} />
              </QRow>
            </SectionCard>

            {/* Section 4 — Management */}
            <SectionCard icon="🌾" title={t('detect_section_management')} desc={t('detect_section_management_desc')} answered={filled.management}>
              <QRow label={t('detect_q_fertilizer')}>
                <div className="flex gap-3">
                  {[{ val: true, key: 'fert_yes' }, { val: false, key: 'fert_no' }].map(({ val, key }) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => set('fertilizer_applied', answers.fertilizer_applied === val ? null : val)}
                      className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
                      style={answers.fertilizer_applied === val
                        ? { backgroundColor: '#558b2f', color: '#fff', border: '2px solid #558b2f' }
                        : { backgroundColor: '#fff', color: '#424242', border: '2px solid #e0e0e0' }}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </QRow>
              {answers.fertilizer_applied === true && (
                <QRow label={t('detect_q_fertilizer_amount')} hint={t('detect_q_fertilizer_amount_hint')}>
                  <ChipSelect options={FERTILIZER_AMTS} getLabel={fertAmtLabel} selected={answers.fertilizer_amount} onSelect={v => set('fertilizer_amount', v)} />
                </QRow>
              )}
            </SectionCard>

            {/* Section 5 — Confidence */}
            <SectionCard icon="🎯" title={t('detect_section_confidence')} desc={t('detect_section_confidence_desc')} answered={filled.confidence}>
              <QRow label={t('detect_q_confidence')} hint={t('detect_q_confidence_hint')}>
                <ChipSelect options={FARMER_CONFIDENCE} getLabel={confLabel} selected={answers.farmer_confidence} onSelect={v => set('farmer_confidence', v)} />
              </QRow>
            </SectionCard>

          </div>

          {/* ── Bottom actions ─────────────────────────────────────────────────── */}
          <div className="mt-8 flex items-center justify-between border-t pt-6" style={{ borderColor: '#eeeeee' }}>
            <button
              onClick={() => navigate('/detect')}
              className="text-sm bg-transparent border-none cursor-pointer hover:underline"
              style={{ color: '#757575' }}
            >
              ← {t('detect_cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 rounded-xl font-semibold text-sm text-white border-none cursor-pointer flex items-center gap-2 disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 10px rgba(85,139,47,0.35)' }}
            >
              {loading
                ? <><span className="inline-block animate-spin">⏳</span> {t('detect_analyzing_btn')}</>
                : <>{t('detect_start_analysis')} →</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
