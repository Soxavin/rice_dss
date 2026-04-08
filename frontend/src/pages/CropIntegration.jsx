import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { diagnoseQuestionnaire } from '../api/client'

// Match the REAL DSS validation fields from dss/validation.py
const GROWTH_STAGES     = ['seedling', 'tillering', 'elongation', 'flowering', 'grain_filling']
const SYMPTOMS          = ['dark_spots', 'yellowing', 'dried_areas', 'brown_discoloration', 'slow_growth', 'white_tips']
const SYMPTOM_LOCATIONS = ['leaf_blade', 'leaf_sheath', 'stem', 'panicle']
const SYMPTOM_ORIGINS   = ['lower_leaves', 'upper_leaves', 'all_leaves', 'unsure']
const FARMER_CONFIDENCE = ['very_sure', 'somewhat_sure', 'not_sure']
const FERTILIZER_TIMING = ['before_planting', '30_days_after', 'flowering', 'other']
const FERTILIZER_TYPES  = ['high_nitrogen', 'balanced_npk', 'potassium_rich', 'organic', 'unsure']
const FERTILIZER_AMOUNTS= ['excessive', 'normal', 'less']
const WEATHER_OPTIONS   = ['heavy_rain', 'high_humidity', 'normal', 'dry_hot', 'unsure']
const WATER_CONDITIONS  = ['flooded_continuously', 'wet', 'dry', 'recently_drained']
const SPREAD_PATTERNS   = ['few_plants', 'patches', 'most_of_field']
const SYMPTOM_TIMINGS   = ['right_after_transplant', 'during_tillering', 'around_flowering', 'grain_filling', 'unsure']
const ONSET_SPEEDS      = ['sudden', 'gradual', 'unsure']
const PREVIOUS_DISEASE  = ['yes_same', 'yes_different', 'no', 'unsure']
const PREVIOUS_CROPS    = ['rice_same', 'rice_different', 'fallow', 'other']
const SOIL_TYPES        = ['prateah_lang', 'bakan', 'prey_khmer', 'kbal_po', 'krakor', 'toul_samroung', 'unsure']
const SOIL_CRACKING     = ['large_cracks', 'small_cracks', 'no_cracks']
const ADDITIONAL_SYMPTOMS=['purple_roots', 'reduced_tillers', 'stunted_growth', 'morning_ooze', 'none']

function ChipSelect({ options, selected, onSelect, multi = false, getLabel }) {
  const handleClick = (val) => {
    if (multi) {
      onSelect(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
    } else {
      onSelect(val === selected ? null : val)
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = multi ? selected.includes(opt) : selected === opt
        return (
          <button
            key={opt}
            onClick={() => handleClick(opt)}
            className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${
              isSelected ? 'text-white' : 'bg-white text-neutral-700 hover:border-primary-300'
            }`}
            style={isSelected
              ? { backgroundColor: '#558b2f', border: '1px solid #558b2f' }
              : { border: '1px solid #e0e0e0' }}
          >
            {getLabel(opt)}
          </button>
        )
      })}
    </div>
  )
}

function Section({ number, title, children }) {
  return (
    <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #e0e0e0' }}>
      <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{number}</span>
        {title}
      </h3>
      <div className="mt-4 space-y-4">
        {children}
      </div>
    </div>
  )
}

export default function CropIntegration() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState(false)
  const [step, setStep] = useState(1)

  const [answers, setAnswers] = useState({
    growth_stage: null, symptoms: [], symptom_location: [], symptom_origin: null,
    farmer_confidence: 'somewhat_sure', fertilizer_applied: null, fertilizer_timing: null,
    fertilizer_type: null, fertilizer_amount: null, weather: null, water_condition: null,
    spread_pattern: null, symptom_timing: null, onset_speed: null, previous_disease: null,
    previous_crop: null, soil_type: null, soil_cracking: null, additional_symptoms: [],
  })

  const update = (field, value) => {
    setAnswers((a) => ({ ...a, [field]: value }))
    if (field === 'growth_stage' || field === 'symptoms') setValidationError(false)
  }

  // ── Chip label lookup helpers (all use t()) ──────────────────────────────
  const gsLabel   = (v) => ({ seedling: t('gs_seedling'), tillering: t('gs_tillering'), elongation: t('gs_elongation'), flowering: t('gs_flowering'), grain_filling: t('gs_grain_filling') }[v] || v)
  const symLabel  = (v) => ({ dark_spots: t('sym_dark_spots'), yellowing: t('sym_yellowing'), dried_areas: t('sym_dried_areas'), brown_discoloration: t('sym_brown_discoloration'), slow_growth: t('sym_slow_growth'), white_tips: t('sym_white_tips') }[v] || v)
  const locLabel  = (v) => ({ leaf_blade: t('loc_leaf_blade'), leaf_sheath: t('loc_leaf_sheath'), stem: t('loc_stem'), panicle: t('loc_panicle') }[v] || v)
  const origLabel = (v) => ({ lower_leaves: t('orig_lower_leaves'), upper_leaves: t('orig_upper_leaves'), all_leaves: t('orig_all_leaves'), unsure: t('orig_unsure') }[v] || v)
  const confLabel = (v) => ({ very_sure: t('conf_very_sure'), somewhat_sure: t('conf_somewhat_sure'), not_sure: t('conf_not_sure') }[v] || v)
  const fertTimingLabel = (v) => ({ before_planting: t('fert_timing_before_planting'), '30_days_after': t('fert_timing_30_days'), flowering: t('fert_timing_flowering'), other: t('fert_timing_other') }[v] || v)
  const fertTypeLabel   = (v) => ({ high_nitrogen: t('fert_type_high_nitrogen'), balanced_npk: t('fert_type_balanced_npk'), potassium_rich: t('fert_type_potassium'), organic: t('fert_type_organic'), unsure: t('orig_unsure') }[v] || v)
  const fertAmtLabel    = (v) => ({ excessive: t('fert_excessive'), normal: t('fert_normal'), less: t('fert_less') }[v] || v)
  const wxLabel         = (v) => ({ heavy_rain: t('weather_heavy_rain'), high_humidity: t('weather_high_humidity'), normal: t('weather_normal'), dry_hot: t('weather_dry_hot'), unsure: t('weather_unsure') }[v] || v)
  const waterLabel      = (v) => ({ flooded_continuously: t('water_flooded'), wet: t('water_wet'), dry: t('water_dry'), recently_drained: t('water_drained') }[v] || v)
  const spreadLabel     = (v) => ({ few_plants: t('spread_few'), patches: t('spread_patches'), most_of_field: t('spread_most') }[v] || v)
  const symTimingLabel  = (v) => ({ right_after_transplant: t('sym_timing_transplant'), during_tillering: t('sym_timing_tillering'), around_flowering: t('sym_timing_flowering'), grain_filling: t('gs_grain_filling'), unsure: t('orig_unsure') }[v] || v)
  const onsetLabel      = (v) => ({ sudden: t('onset_sudden'), gradual: t('onset_gradual'), unsure: t('onset_unsure') }[v] || v)
  const prevDiseaseLabel= (v) => ({ yes_same: t('prev_disease_yes_same'), yes_different: t('prev_disease_yes_diff'), no: t('prev_disease_no'), unsure: t('orig_unsure') }[v] || v)
  const prevCropLabel   = (v) => ({ rice_same: t('prev_crop_rice_same'), rice_different: t('prev_crop_rice_diff'), fallow: t('prev_crop_fallow'), other: t('prev_crop_other') }[v] || v)
  const soilLabel       = (v) => ({ prateah_lang: t('soil_prateah_lang'), bakan: t('soil_bakan'), prey_khmer: t('soil_prey_khmer'), kbal_po: t('soil_kbal_po'), krakor: t('soil_krakor'), toul_samroung: t('soil_toul_samroung'), unsure: t('orig_unsure') }[v] || v)
  const crackLabel      = (v) => ({ large_cracks: t('crack_large'), small_cracks: t('crack_small'), no_cracks: t('crack_none') }[v] || v)
  const addlLabel       = (v) => ({ purple_roots: t('addl_purple_roots'), reduced_tillers: t('addl_reduced_tillers'), stunted_growth: t('addl_stunted_growth'), morning_ooze: t('addl_morning_ooze'), none: t('addl_none') }[v] || v)

  const handleReview = () => {
    if (!answers.growth_stage || answers.symptoms.length === 0) {
      setValidationError(true)
      return
    }
    setValidationError(false)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await diagnoseQuestionnaire(answers, lang)
      sessionStorage.setItem('detect_result', JSON.stringify(res.data))
      navigate('/detect/results')
    } catch {
      sessionStorage.setItem('detect_result', JSON.stringify({
        is_demo: true,
        status: 'assessed', primary_condition: 'Brown Spot', condition_key: 'brown_spot',
        confidence_label: 'Medium Confidence', confidence_level: 'medium', score: 0.62,
        all_scores: { blast: 0.25, brown_spot: 0.62, bacterial_blight: 0.18, iron_toxicity: 0.0, n_deficiency: 0.35, salt_toxicity: 0.0 },
        recommendations: { immediate: ['Apply potassium-rich fertilizer', 'Improve drainage'], preventive: ['Balanced NPK application'], monitoring: 'Check for spread over 3-5 days', consult: false },
        warnings: [], mode_used: 'Questionnaire Only',
      }))
      navigate('/detect/results')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 1: Form screen ───────────────────────────────────────── */
  const FormScreen = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900">{t('crop_title')}</h1>
        <p className="mt-2 text-neutral-600">{t('crop_subtitle')}</p>
      </div>
      {validationError && (
        <div className="mt-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
          <span>⚠</span> {t('crop_validation_msg')}
        </div>
      )}

      <div className="mt-8 space-y-6">

        {/* Section 1: Crop Info */}
        <Section number="1" title={t('crop_info')}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_growth_stage')}</label>
            <ChipSelect options={GROWTH_STAGES} selected={answers.growth_stage} onSelect={(v) => update('growth_stage', v)} getLabel={gsLabel} />
          </div>
        </Section>

        {/* Section 2: Symptoms */}
        <Section number="2" title={t('crop_symptoms')}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_observed_symptoms')}</label>
            <ChipSelect options={SYMPTOMS} selected={answers.symptoms} onSelect={(v) => update('symptoms', v)} multi getLabel={symLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_affected_part')}</label>
            <ChipSelect options={SYMPTOM_LOCATIONS} selected={answers.symptom_location} onSelect={(v) => update('symptom_location', v)} multi getLabel={locLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_where_started')}</label>
            <ChipSelect options={SYMPTOM_ORIGINS} selected={answers.symptom_origin} onSelect={(v) => update('symptom_origin', v)} getLabel={origLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_confidence')}</label>
            <ChipSelect options={FARMER_CONFIDENCE} selected={answers.farmer_confidence} onSelect={(v) => update('farmer_confidence', v)} getLabel={confLabel} />
          </div>
        </Section>

        {/* Section 3: Farming Inputs */}
        <Section number="3" title={t('crop_farming')}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_fertilizer_applied')}</label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => update('fertilizer_applied', val)}
                  className={`px-4 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${answers.fertilizer_applied === val ? 'text-white' : 'bg-white text-neutral-700'}`}
                  style={answers.fertilizer_applied === val
                    ? { backgroundColor: '#558b2f', border: '1px solid #558b2f' }
                    : { border: '1px solid #e0e0e0' }}
                >
                  {val ? t('crop_yes') : t('crop_no')}
                </button>
              ))}
            </div>
          </div>
          {answers.fertilizer_applied && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_fert_timing')}</label>
                <ChipSelect options={FERTILIZER_TIMING} selected={answers.fertilizer_timing} onSelect={(v) => update('fertilizer_timing', v)} getLabel={fertTimingLabel} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_fert_type')}</label>
                <ChipSelect options={FERTILIZER_TYPES} selected={answers.fertilizer_type} onSelect={(v) => update('fertilizer_type', v)} getLabel={fertTypeLabel} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_fert_amount')}</label>
                <ChipSelect options={FERTILIZER_AMOUNTS} selected={answers.fertilizer_amount} onSelect={(v) => update('fertilizer_amount', v)} getLabel={fertAmtLabel} />
              </div>
            </>
          )}
        </Section>

        {/* Section 4: Environment */}
        <Section number="4" title={t('crop_environment')}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_recent_weather')}</label>
            <ChipSelect options={WEATHER_OPTIONS} selected={answers.weather} onSelect={(v) => update('weather', v)} getLabel={wxLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_water_condition')}</label>
            <ChipSelect options={WATER_CONDITIONS} selected={answers.water_condition} onSelect={(v) => update('water_condition', v)} getLabel={waterLabel} />
          </div>
        </Section>

        {/* Section 5: Spread & Timing */}
        <Section number="5" title={t('crop_spread_timing')}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_spread_pattern')}</label>
            <ChipSelect options={SPREAD_PATTERNS} selected={answers.spread_pattern} onSelect={(v) => update('spread_pattern', v)} getLabel={spreadLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_symptom_timing')}</label>
            <ChipSelect options={SYMPTOM_TIMINGS} selected={answers.symptom_timing} onSelect={(v) => update('symptom_timing', v)} getLabel={symTimingLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_onset_speed')}</label>
            <ChipSelect options={ONSET_SPEEDS} selected={answers.onset_speed} onSelect={(v) => update('onset_speed', v)} getLabel={onsetLabel} />
          </div>
        </Section>

        {/* Section 6: Field History */}
        <Section number="6" title={t('crop_field_history')}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_prev_disease')}</label>
            <ChipSelect options={PREVIOUS_DISEASE} selected={answers.previous_disease} onSelect={(v) => update('previous_disease', v)} getLabel={prevDiseaseLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_prev_crop')}</label>
            <ChipSelect options={PREVIOUS_CROPS} selected={answers.previous_crop} onSelect={(v) => update('previous_crop', v)} getLabel={prevCropLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_soil_type')}</label>
            <ChipSelect options={SOIL_TYPES} selected={answers.soil_type} onSelect={(v) => update('soil_type', v)} getLabel={soilLabel} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('crop_soil_cracking')}</label>
            <ChipSelect options={SOIL_CRACKING} selected={answers.soil_cracking} onSelect={(v) => update('soil_cracking', v)} getLabel={crackLabel} />
          </div>
        </Section>

        {/* Section 7: Additional Symptoms */}
        <Section number="7" title={t('crop_additional')}>
          <ChipSelect options={ADDITIONAL_SYMPTOMS} selected={answers.additional_symptoms} onSelect={(v) => update('additional_symptoms', v)} multi getLabel={addlLabel} />
        </Section>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-sm text-neutral-600 hover:text-neutral-800 bg-transparent border-none cursor-pointer">
          {t('detect_cancel')}
        </button>
        <button
          onClick={handleReview}
          className="px-6 py-2.5 rounded-lg font-medium text-sm text-white border-none cursor-pointer transition-colors flex items-center gap-2"
          style={{ backgroundColor: '#558b2f' }}
        >
          {t('crop_review_answers')} →
        </button>
      </div>
    </div>
  )

  /* ── Step 2: Review screen ─────────────────────────────────────── */
  const none = t('crop_not_provided')
  const tag = (label) => (
    <span key={label} className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mr-1.5 mb-1" style={{ backgroundColor: '#eef5d3', color: '#33691e' }}>
      {label}
    </span>
  )
  const row = (label, value) => value ? (
    <div key={label} className="flex gap-3 py-2 border-b border-neutral-100 last:border-0">
      <span className="text-xs text-neutral-500 w-36 shrink-0">{label}</span>
      <span className="text-xs text-neutral-800 font-medium">{value}</span>
    </div>
  ) : null

  const ReviewScreen = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => setStep(1)} className="text-sm font-medium bg-transparent border-none cursor-pointer" style={{ color: '#558b2f' }}>
          {t('crop_edit')}
        </button>
        <span className="text-neutral-300">|</span>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">{t('crop_review_title')}</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-8">{t('crop_review_subtitle')}</p>

      <div className="space-y-5">

        {/* Crop Info */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e0e0e0' }}>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('crop_info')}</h3>
          {row(t('crop_growth_stage'), answers.growth_stage ? gsLabel(answers.growth_stage) : null) || row(t('crop_growth_stage'), none)}
        </div>

        {/* Symptoms */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e0e0e0' }}>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('crop_symptoms')}</h3>
          <div className="flex gap-3 py-2 border-b border-neutral-100">
            <span className="text-xs text-neutral-500 w-36 shrink-0">{t('crop_observed_symptoms')}</span>
            <div>{answers.symptoms.length > 0 ? answers.symptoms.map((s) => tag(symLabel(s))) : <span className="text-xs text-neutral-400">{none}</span>}</div>
          </div>
          <div className="flex gap-3 py-2 border-b border-neutral-100">
            <span className="text-xs text-neutral-500 w-36 shrink-0">{t('crop_affected_part')}</span>
            <div>{answers.symptom_location.length > 0 ? answers.symptom_location.map((s) => tag(locLabel(s))) : <span className="text-xs text-neutral-400">{none}</span>}</div>
          </div>
          {row(t('crop_where_started'), answers.symptom_origin ? origLabel(answers.symptom_origin) : null)}
          {row(t('crop_confidence'), answers.farmer_confidence ? confLabel(answers.farmer_confidence) : null)}
        </div>

        {/* Farming Inputs */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e0e0e0' }}>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('crop_farming')}</h3>
          {row(t('crop_fertilizer_applied'), answers.fertilizer_applied === null ? none : answers.fertilizer_applied ? t('crop_yes') : t('crop_no'))}
          {answers.fertilizer_applied && row(t('crop_fert_timing'), answers.fertilizer_timing ? fertTimingLabel(answers.fertilizer_timing) : null)}
          {answers.fertilizer_applied && row(t('crop_fert_type'), answers.fertilizer_type ? fertTypeLabel(answers.fertilizer_type) : null)}
          {answers.fertilizer_applied && row(t('crop_fert_amount'), answers.fertilizer_amount ? fertAmtLabel(answers.fertilizer_amount) : null)}
        </div>

        {/* Environment */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e0e0e0' }}>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('crop_environment')}</h3>
          {row(t('crop_recent_weather'), answers.weather ? wxLabel(answers.weather) : null)}
          {row(t('crop_water_condition'), answers.water_condition ? waterLabel(answers.water_condition) : null)}
        </div>

        {/* Spread & Timing */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e0e0e0' }}>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('crop_spread_timing')}</h3>
          {row(t('crop_spread_pattern'), answers.spread_pattern ? spreadLabel(answers.spread_pattern) : null)}
          {row(t('crop_symptom_timing'), answers.symptom_timing ? symTimingLabel(answers.symptom_timing) : null)}
          {row(t('crop_onset_speed'), answers.onset_speed ? onsetLabel(answers.onset_speed) : null)}
        </div>

        {/* Field History */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e0e0e0' }}>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('crop_field_history')}</h3>
          {row(t('crop_prev_disease'), answers.previous_disease ? prevDiseaseLabel(answers.previous_disease) : null)}
          {row(t('crop_prev_crop'), answers.previous_crop ? prevCropLabel(answers.previous_crop) : null)}
          {row(t('crop_soil_type'), answers.soil_type ? soilLabel(answers.soil_type) : null)}
          {row(t('crop_soil_cracking'), answers.soil_cracking ? crackLabel(answers.soil_cracking) : null)}
        </div>

        {/* Additional Symptoms */}
        {answers.additional_symptoms.length > 0 && (
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e0e0e0' }}>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('crop_additional')}</h3>
            <div>{answers.additional_symptoms.map((s) => tag(addlLabel(s)))}</div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={() => setStep(1)} className="text-sm text-neutral-600 hover:text-neutral-800 bg-transparent border-none cursor-pointer">
          {t('crop_edit')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg font-medium text-sm text-white border-none cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: '#558b2f' }}
        >
          {loading ? t('crop_analyzing') : t('crop_confirm_analyze')} →
        </button>
      </div>
    </div>
  )

  return step === 1 ? FormScreen : ReviewScreen
}
