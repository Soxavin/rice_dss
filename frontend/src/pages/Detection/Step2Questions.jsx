import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { hybridImages, hybridImage, diagnoseQuestionnaire, predictImage, predictImages } from '../../api/client'

// ─── DSS field constants — must match dss/validation.py exactly ───────────────
const GROWTH_STAGES      = ['seedling', 'tillering', 'elongation', 'flowering', 'grain_filling']
const SYMPTOMS           = ['dark_spots', 'yellowing', 'dried_areas', 'brown_discoloration', 'slow_growth', 'white_tips']
const SYMPTOM_LOCATIONS  = ['leaf_blade', 'leaf_sheath', 'stem', 'panicle']
const SYMPTOM_ORIGINS    = ['lower_leaves', 'upper_leaves', 'all_leaves', 'unsure']
const WEATHER_OPTIONS    = ['heavy_rain', 'high_humidity', 'normal', 'dry_hot', 'unsure']
const WATER_CONDITIONS   = ['flooded_continuously', 'wet', 'dry', 'recently_drained']
const SPREAD_PATTERNS    = ['few_plants', 'patches', 'most_of_field']
const ONSET_SPEEDS       = ['sudden', 'gradual', 'unsure']
const FERTILIZER_AMTS    = ['excessive', 'normal', 'less']
const FERTILIZER_TIMINGS = ['before_planting', '30_days', 'flowering', 'other']
const FERTILIZER_TYPES   = ['high_nitrogen', 'balanced_npk', 'potassium', 'organic']
const SYMPTOM_TIMINGS    = ['transplant', 'tillering', 'flowering', 'grain']
const ADDL_SYMPTOMS      = ['purple_roots', 'reduced_tillers', 'stunted_growth', 'morning_ooze', 'none']
const FARMER_CONFIDENCE  = ['very_sure', 'somewhat_sure', 'not_sure']
const PREV_DISEASES      = ['yes_same', 'yes_diff', 'no']
const PREV_CROPS         = ['rice_same', 'rice_diff', 'fallow', 'other']
const SOIL_TYPES         = ['prateah_lang', 'bakan', 'prey_khmer', 'kbal_po', 'krakor', 'toul_samroung']
const SOIL_CRACKINGS     = ['large', 'small', 'none']

// ─── Translation key resolvers ────────────────────────────────────────────────
const SPREAD_KEY  = { few_plants: 'spread_few', patches: 'spread_patches', most_of_field: 'spread_most' }
const WATER_KEY   = { flooded_continuously: 'water_flooded', wet: 'water_wet', dry: 'water_dry', recently_drained: 'water_drained' }

// ─── Question definitions ─────────────────────────────────────────────────────
// depth 'both'     → shown in quick (12-field) AND detailed/hybrid (18-field)
// depth 'detailed' → shown only in detailed questionnaire or hybrid mode
// skip(answers)    → return true to branch past this question
const QUESTIONS = [
  {
    id: 'growth_stage',
    type: 'single',
    promptKey: 'q_growth_stage',
    options: GROWTH_STAGES,
    toKey: v => 'gs_' + v,
    required: true,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'symptoms',
    type: 'multi',
    promptKey: 'q_symptoms',
    options: SYMPTOMS,
    toKey: v => 'sym_' + v,
    required: true,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'symptom_location',
    type: 'multi',
    promptKey: 'q_symptom_location',
    options: SYMPTOM_LOCATIONS,
    toKey: v => 'loc_' + v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: true,
  },
  {
    id: 'symptom_origin',
    type: 'single',
    promptKey: 'q_symptom_origin',
    options: SYMPTOM_ORIGINS,
    toKey: v => 'orig_' + v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'onset_speed',
    type: 'single',
    promptKey: 'q_onset_speed',
    options: ONSET_SPEEDS,
    toKey: v => 'onset_' + v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'spread_pattern',
    type: 'single',
    promptKey: 'q_spread_pattern',
    options: SPREAD_PATTERNS,
    toKey: v => SPREAD_KEY[v] ?? v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'weather',
    type: 'single',
    promptKey: 'q_weather',
    options: WEATHER_OPTIONS,
    toKey: v => 'weather_' + v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'water_condition',
    type: 'single',
    promptKey: 'q_water_condition',
    options: WATER_CONDITIONS,
    toKey: v => WATER_KEY[v] ?? v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'fertilizer_applied',
    type: 'boolean',
    promptKey: 'q_fertilizer_applied',
    options: [true, false],
    toKey: v => v === true ? 'fert_yes' : 'fert_no',
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'fertilizer_amount',
    type: 'single',
    promptKey: 'q_fertilizer_amount',
    options: FERTILIZER_AMTS,
    toKey: v => 'fert_' + v,
    required: false,
    depth: 'both',
    skip: a => a.fertilizer_applied !== true,
    skippable: false,
  },
  {
    id: 'fertilizer_timing',
    type: 'single',
    promptKey: 'q_fertilizer_timing',
    options: FERTILIZER_TIMINGS,
    toKey: v => 'fert_timing_' + v,
    required: false,
    depth: 'detailed',
    skip: a => a.fertilizer_applied !== true,
    skippable: false,
  },
  {
    id: 'fertilizer_type',
    type: 'single',
    promptKey: 'q_fertilizer_type',
    options: FERTILIZER_TYPES,
    toKey: v => 'fert_type_' + v,
    required: false,
    depth: 'detailed',
    skip: a => a.fertilizer_applied !== true,
    skippable: false,
  },
  {
    id: 'symptom_timing',
    type: 'single',
    promptKey: 'q_symptom_timing',
    options: SYMPTOM_TIMINGS,
    toKey: v => 'sym_timing_' + v,
    required: false,
    depth: 'detailed',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'previous_disease',
    type: 'single',
    promptKey: 'q_previous_disease',
    options: PREV_DISEASES,
    toKey: v => 'prev_disease_' + v,
    required: false,
    depth: 'detailed',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'previous_crop',
    type: 'single',
    promptKey: 'q_previous_crop',
    options: PREV_CROPS,
    toKey: v => 'prev_crop_' + v,
    required: false,
    depth: 'detailed',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'soil_type',
    type: 'single',
    promptKey: 'q_soil_type',
    options: SOIL_TYPES,
    toKey: v => 'soil_' + v,
    required: false,
    depth: 'detailed',
    skip: () => false,
    skippable: true,
  },
  {
    id: 'soil_cracking',
    type: 'single',
    promptKey: 'q_soil_cracking',
    options: SOIL_CRACKINGS,
    toKey: v => 'crack_' + v,
    required: false,
    depth: 'detailed',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'additional_symptoms',
    type: 'multi',
    promptKey: 'q_additional_symptoms',
    options: ADDL_SYMPTOMS,
    toKey: v => 'addl_' + v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
  {
    id: 'farmer_confidence',
    type: 'single',
    promptKey: 'q_farmer_confidence',
    options: FARMER_CONFIDENCE,
    toKey: v => 'conf_' + v,
    required: false,
    depth: 'both',
    skip: () => false,
    skippable: false,
  },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function Step2Questions() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)
  const [apiError, setApiError] = useState(null)
  const [uploadedImages, setUploadedImages] = useState([])
  const [mode, setMode] = useState('hybrid')
  const [step, setStep] = useState(0)
  const [stepError, setStepError] = useState(false)
  const mountedRef = useRef(true)
  const questionRef = useRef(null)
  const autoSubmittedRef = useRef(false)

  const [answers, setAnswers] = useState({
    growth_stage:        null,
    symptoms:            [],
    symptom_location:    [],
    symptom_origin:      null,
    onset_speed:         null,
    spread_pattern:      null,
    weather:             null,
    water_condition:     null,
    fertilizer_applied:  null,
    fertilizer_amount:   null,
    fertilizer_timing:   null,
    fertilizer_type:     null,
    symptom_timing:      null,
    previous_disease:    null,
    previous_crop:       null,
    soil_type:           null,
    soil_cracking:       null,
    additional_symptoms: [],
    farmer_confidence:   'somewhat_sure',
  })

  useEffect(() => {
    mountedRef.current = true
    const savedMode = sessionStorage.getItem('detect_mode')
    if (!savedMode || !['hybrid', 'ml', 'questionnaire'].includes(savedMode)) {
      navigate('/detect', { replace: true })
      return
    }
    if (savedMode !== 'questionnaire' && !window.__detectFiles?.length) {
      navigate('/detect', { replace: true })
      return
    }
    setMode(savedMode)
    const stored = sessionStorage.getItem('detect_images')
    if (stored) {
      try { setUploadedImages(JSON.parse(stored)) } catch { /* ignore */ }
    }
    return () => { mountedRef.current = false }
  }, [navigate])

  // Auto-submit for ml mode — fires once after mode resolves, no manual button needed
  useEffect(() => {
    if (mode !== 'ml' || autoSubmittedRef.current) return
    autoSubmittedRef.current = true
    const timer = setTimeout(() => { handleSubmit() }, 300)
    return () => clearTimeout(timer)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Simulated progress bar — multi-stage fill so bar is still moving when API responds
  useEffect(() => {
    if (!loading) { setProgressWidth(0); return }
    setProgressWidth(0)
    const t1 = setTimeout(() => setProgressWidth(22), 500)
    const t2 = setTimeout(() => setProgressWidth(48), 6000)
    const t3 = setTimeout(() => setProgressWidth(68), 14000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [loading])

  // Depth: hybrid always gets full 18-field set; questionnaire respects stored depth
  const depth = sessionStorage.getItem('questionnaire_depth') || 'quick'
  const isDetailed = mode === 'hybrid' || depth === 'detailed'

  // Active question list after depth filter and branching
  const activeQuestions = useMemo(() =>
    QUESTIONS.filter(q =>
      (isDetailed || q.depth === 'both') && !q.skip(answers)
    ),
    [answers, isDetailed]
  )

  // Move focus to question heading on step change
  useEffect(() => {
    questionRef.current?.focus()
  }, [step])

  // If branching removes the current step's question, snap to previous valid step
  useEffect(() => {
    if (step >= activeQuestions.length && activeQuestions.length > 0) {
      setStep(activeQuestions.length - 1)
    }
  }, [activeQuestions.length, step])

  // ─── Selection handler ────────────────────────────────────────────────────
  const handleSelect = (question, val) => {
    setStepError(false)
    if (question.type === 'multi') {
      setAnswers(prev => {
        const current = Array.isArray(prev[question.id]) ? prev[question.id] : []
        // 'none' is exclusive
        if (val === 'none') return { ...prev, [question.id]: ['none'] }
        const filtered = current.filter(v => v !== 'none')
        const updated = filtered.includes(val)
          ? filtered.filter(v => v !== val)
          : [...filtered, val]
        return { ...prev, [question.id]: updated }
      })
    } else {
      setAnswers(prev => ({ ...prev, [question.id]: val }))
    }
  }

  const handleSkip = (fieldId) => {
    setAnswers(prev => ({ ...prev, [fieldId]: null }))
    setStep(s => Math.min(s + 1, activeQuestions.length - 1))
  }

  const handleNext = () => {
    const q = activeQuestions[step]
    if (q.required) {
      const val = answers[q.id]
      const isEmpty = val === null || (Array.isArray(val) && val.length === 0)
      if (isEmpty) { setStepError(true); return }
    }
    setStepError(false)
    setStep(s => Math.min(s + 1, activeQuestions.length - 1))
  }

  const handleBack = () => {
    setStepError(false)
    if (step === 0) {
      navigate('/detect')
    } else {
      setStep(s => s - 1)
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const files = window.__detectFiles || []
      let result

      if (mode === 'ml') {
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
        const clean = Object.fromEntries(
          Object.entries(answers).filter(([, v]) => v !== null && !(Array.isArray(v) && v.length === 0))
        )
        const res = await diagnoseQuestionnaire(clean, lang)
        result = res.data
      } else {
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
      setProgressWidth(100)
      if (mountedRef.current) navigate('/detect/results')
    } catch (err) {
      console.error('Analysis error:', err)
      if (!mountedRef.current) return
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (status === 422 && detail) {
        setApiError(detail)
      } else {
        sessionStorage.setItem('detect_result', JSON.stringify({
          is_demo: true,
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
        if (mountedRef.current) navigate('/detect/results')
      }
    } finally {
      setLoading(false)
    }
  }

  const hasImages = uploadedImages.length > 0

  const modeBadge = {
    hybrid:        { label: t('detect_mode_badge_hybrid'),        color: '#33691e', bg: '#d4e6a5' },
    ml:            { label: t('detect_mode_badge_ml'),            color: '#1e40af', bg: '#dbeafe' },
    questionnaire: { label: t('detect_mode_badge_questionnaire'), color: '#92400e', bg: '#fef3c7' },
  }[mode]

  const currentQ = activeQuestions[step]
  const total = activeQuestions.length
  const progressPct = total > 0 ? ((step + 1) / total) * 100 : 0
  const progressLabel = t('q_progress')
    .replace('{current}', String(step + 1))
    .replace('{total}', String(total))

  const isLastStep = step === total - 1

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 mb-5">
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
      <div className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: modeBadge.bg, color: modeBadge.color }}>
          {modeBadge.label}
        </span>
        {hasImages && (
          <>
            <span className="text-xs shrink-0" style={{ color: '#9e9e9e' }}>{t('detect_analyzing_label')}</span>
            <div className="flex gap-2 flex-wrap">
              {uploadedImages.map((img, i) => (
                <img key={i} src={img.preview} alt={`${t('detect_image_label')} ${i + 1}`}
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

      {/* ── API error banner ─────────────────────────────────────────────────── */}
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

      {/* ── ML-only mode ─────────────────────────────────────────────────────── */}
      {mode === 'ml' && (
        <div className="mt-5 rounded-2xl overflow-hidden" style={{ border: '1px solid #a8d060', backgroundColor: '#f7fbe7' }}>
          {/* Icon + heading */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: '#d4edaa' }}>
              🤖
            </div>
            <h3 className="font-semibold text-neutral-900 text-lg">{t('detect_ml_mode_notice')}</h3>
            <p className="mt-1 text-sm" style={{ color: '#4b5563' }}>
              {loading ? t('detect_analyzing_hint') : t('detect_ml_mode_desc')}
            </p>
          </div>

          {/* Progress / button section */}
          <div className="px-6 pb-6">
            {loading ? (
              <>
                <div className="w-full rounded-full overflow-hidden mt-2" style={{ height: '8px', backgroundColor: '#c5dc8a' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progressWidth}%`,
                      backgroundColor: '#558b2f',
                      transition: progressWidth === 0 ? 'none' : 'width 2s ease-out',
                    }}
                  />
                </div>
                <p className="mt-3 text-center text-sm font-medium" style={{ color: '#558b2f' }}>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  {t('detect_analyzing_btn')}
                </p>
              </>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl font-semibold text-sm text-white border-none cursor-pointer disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#558b2f' }}
              >
                {t('detect_ml_run')}
              </button>
            )}
          </div>

          {!loading && (
            <div className="px-6 pb-5 text-center">
              <button
                onClick={() => navigate('/detect')}
                className="text-xs bg-transparent border-none cursor-pointer hover:underline"
                style={{ color: '#9e9e9e' }}
              >
                ← {t('detect_cancel')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Conversational questionnaire ─────────────────────────────────────── */}
      {mode !== 'ml' && currentQ && (
        <div className="mt-6">

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label={progressLabel}
            className="w-full rounded-full overflow-hidden"
            style={{ height: '6px', backgroundColor: '#e0e0e0' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%`, backgroundColor: '#558b2f' }}
            />
          </div>
          <p className="text-xs mt-1.5 text-right" style={{ color: '#9e9e9e' }}>{progressLabel}</p>

          {/* Question card */}
          <fieldset className="mt-5 border-none p-0 m-0">
            <legend
              ref={questionRef}
              tabIndex={-1}
              className="font-heading text-xl font-semibold text-neutral-900 mb-1 focus:outline-none w-full"
            >
              {t(currentQ.promptKey)}
              {currentQ.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </legend>
            {currentQ.type === 'multi' && (
              <p className="text-xs mb-4" style={{ color: '#9e9e9e' }}>{t('detect_q_symptom_location_hint')}</p>
            )}

            {/* Validation error */}
            {stepError && (
              <p role="alert" className="text-sm mb-3 font-medium" style={{ color: '#dc2626' }}>
                {t('crop_validation_msg')}
              </p>
            )}

            {/* Option cards */}
            <div
              role={currentQ.type === 'multi' ? 'group' : undefined}
              aria-labelledby={currentQ.type === 'multi' ? 'question-legend' : undefined}
              className={`grid gap-3 ${currentQ.type === 'boolean' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}
            >
              {currentQ.options.map((opt) => {
                const key = String(opt)
                const label = t(currentQ.toKey(opt))
                const isSelected = currentQ.type === 'multi'
                  ? Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(opt)
                  : answers[currentQ.id] === opt
                return (
                  <button
                    key={key}
                    type="button"
                    role={currentQ.type === 'multi' ? 'checkbox' : 'radio'}
                    aria-checked={isSelected}
                    onClick={() => handleSelect(currentQ, opt)}
                    className="w-full text-left rounded-2xl transition-all duration-150 cursor-pointer"
                    style={{
                      padding: '14px 18px',
                      border: isSelected ? '2px solid #558b2f' : '2px solid #e0e0e0',
                      backgroundColor: isSelected ? '#f7fbe7' : '#ffffff',
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? '#33691e' : '#424242',
                      boxShadow: isSelected ? '0 2px 8px rgba(85,139,47,0.15)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Skip option */}
            {currentQ.skippable && (
              <button
                type="button"
                onClick={() => handleSkip(currentQ.id)}
                className="mt-3 w-full text-center text-sm bg-transparent border-none cursor-pointer hover:underline"
                style={{ color: '#9e9e9e', padding: '8px' }}
              >
                {t('q_skip')}
              </button>
            )}
          </fieldset>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid #eeeeee' }}>
            <button
              type="button"
              onClick={handleBack}
              className="text-sm bg-transparent border-none cursor-pointer hover:underline flex items-center gap-1"
              style={{ color: '#757575' }}
            >
              ← {t('q_back')}
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 rounded-xl font-semibold text-sm text-white border-none cursor-pointer flex items-center gap-2 disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 10px rgba(85,139,47,0.35)' }}
              >
                {loading
                  ? <><span className="inline-block animate-spin">⏳</span> {t('detect_analyzing_btn')}</>
                  : <>{t('q_submit')} →</>
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl font-semibold text-sm text-white border-none cursor-pointer transition-all"
                style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 10px rgba(85,139,47,0.25)' }}
              >
                {t('q_next')} →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
