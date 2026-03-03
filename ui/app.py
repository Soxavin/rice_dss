# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ui/app.py — Streamlit Testing Interface
# -----------------------------------------------------------------------------
# PURPOSE:
#   A local testing interface for teammates and the professor to:
#     1. Walk through the questionnaire step by step
#     2. Submit answers and see the DSS result
#     3. Inspect the full score breakdown (debug mode)
#     4. Re-run with different answers quickly
#
# HOW TO RUN:
#   streamlit run ui/app.py
#
# NOTE:
#   This calls dss/decision.py directly (no API server needed).
#   All questionnaire fields map exactly to dss/validation.py VALID_* sets.
# =============================================================================

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import streamlit as st
from dss.decision import generate_output
from tests.test_dss import TEST_CASES

# =============================================================================
# PAGE CONFIG
# =============================================================================

st.set_page_config(
    page_title="Rice DSS — Tester",
    page_icon="🌾",
    layout="centered"
)

# =============================================================================
# LABEL MAPS
# Human-readable labels for every valid value in validation.py
# =============================================================================

GROWTH_STAGE_LABELS = {
    'seedling':     'Seedling (ពន្លក)',
    'tillering':    'Tillering — 3–5 weeks (ចេញកន្ទុយ)',
    'elongation':   'Stem Elongation (លូតលាស់ដើម)',
    'flowering':    'Flowering (ផ្កា)',
    'grain_filling':'Grain Filling / Ripening (ទុំ)',
}

SYMPTOM_LABELS = {
    'dark_spots':           'Dark / black spots on leaves (ចំណុចខ្មៅ)',
    'yellowing':            'Yellowing or pale leaves (ស្លឹកលឿង)',
    'dried_areas':          'Dried / dead patches (ផ្នែកស្ងួត)',
    'brown_discoloration':  'Brown discolouration (ពណ៌ត្នោត)',
    'slow_growth':          'Slow / stunted growth (លូតលាស់យឺត)',
    'white_tips':           'White leaf tips (ចុងស្លឹកពណ៌ស)',
}

LOCATION_LABELS = {
    'leaf_blade':   'Leaf blade — flat part (ស្លឹក)',
    'leaf_sheath':  'Leaf sheath — base around stem (ស្រទាប់ស្លឹក)',
    'stem':         'Stem (ដើម)',
    'panicle':      'Panicle / grain head (ក្អែ/គ្រាប់)',
}

ORIGIN_LABELS = {
    'lower_leaves': 'Lower / older leaves first (ស្លឹកចាស់ខាងក្រោម)',
    'upper_leaves': 'Upper / newer leaves first (ស្លឹកថ្មីខាងលើ)',
    'all_leaves':   'All leaves at the same time (ស្លឹកទាំងអស់)',
    'unsure':       'Not sure (មិនប្រាកដ)',
}

CONFIDENCE_LABELS = {
    'very_sure':     'Very sure — I can clearly see it (ប្រាកដណាស់)',
    'somewhat_sure': 'Somewhat sure (ប្រាកដបន្តិច)',
    'not_sure':      'Not sure at all (មិនប្រាកដ)',
}

WEATHER_LABELS = {
    'heavy_rain':    'Heavy rain recently (ភ្លៀងខ្លាំង)',
    'high_humidity': 'High humidity / foggy mornings (សំណើមខ្ពស់)',
    'normal':        'Normal weather (ធម្មតា)',
    'dry_hot':       'Dry and hot (ស្ងួត/ក្តៅ)',
    'unsure':        'Not sure (មិនដឹង)',
}

WATER_LABELS = {
    'flooded_continuously': 'Continuously flooded (ទឹកជាប់ជានិច្ច)',
    'wet':                  'Wet / waterlogged (សើម)',
    'dry':                  'Dry field (ស្ងួត)',
    'recently_drained':     'Recently drained (ទើបទម្លាក់ទឹក)',
}

SPREAD_LABELS = {
    'few_plants':    'Only a few plants (មានតិច)',
    'patches':       'Patches scattered around field (ជាកន្លែងៗ)',
    'most_of_field': 'Most of the field affected (ពេញស្រែ)',
}

TIMING_LABELS = {
    'right_after_transplant': 'Right after transplanting — 1–2 weeks (ក្រោយដាំភ្លាម)',
    'during_tillering':       'During tillering — 3–5 weeks (ពេលចេញកន្ទុយ)',
    'around_flowering':       'Around flowering (ពេលផ្កា)',
    'grain_filling':          'Grain filling / ripening (ពេលទុំ)',
    'unsure':                 'Not sure (មិនដឹង)',
}

ONSET_LABELS = {
    'sudden':  'Sudden — appeared within a few days (រហ័ស)',
    'gradual': 'Gradual — spread over weeks (បន្តិចៗ)',
    'unsure':  'Not sure (មិនដឹង)',
}

PREV_DISEASE_LABELS = {
    'yes_same':       'Yes — same symptoms as before (បាទ — ដូចគ្នា)',
    'yes_different':  'Yes — but different symptoms (បាទ — ខុសគ្នា)',
    'no':             'No previous disease (ទេ)',
    'unsure':         'Not sure (មិនប្រាកដ)',
}

PREV_CROP_LABELS = {
    'rice_same':       'Rice — same season (ស្រូវ — ដូចគ្នា)',
    'rice_different':  'Rice — different season (ស្រូវ — រដូវផ្សេង)',
    'fallow':          'Field was left fallow (ទុកទំនេរ)',
    'other':           'Different crop (ដំណាំផ្សេង)',
}

SOIL_TYPE_LABELS = {
    'prateah_lang':  'Prateah Lang — most common (ប្រទះlung)',
    'bakan':         'Bakan (បកន)',
    'prey_khmer':    'Prey Khmer — sandy (ព្រៃខ្មែរ)',
    'kbal_po':       'Kbal Po — flooded lowland (កបោ)',
    'krakor':        'Krakor (ក្រគរ)',
    'toul_samroung': 'Toul Samroung — cracks when dry (ទួលសំរោង)',
    'unsure':        'Not sure (មិនដឹង)',
}

SOIL_CRACKING_LABELS = {
    'large_cracks': 'Large visible cracks (ដីបែកធំ)',
    'small_cracks': 'Small surface cracks (ដីបែកតូច)',
    'no_cracks':    'No cracks (មិនបែក)',
}

FERTILIZER_AMOUNT_LABELS = {
    'excessive': 'More than recommended — excessive (លើស)',
    'normal':    'Normal / recommended amount (ធម្មតា)',
    'less':      'Less than recommended (តិច)',
}

FERTILIZER_TYPE_LABELS = {
    'high_nitrogen': 'High nitrogen (e.g. Urea) (ជីអាស៊ូត)',
    'balanced_npk':  'Balanced NPK (ជី NPK)',
    'potassium_rich':'Potassium-rich (ជីប៉ូតាស្យូម)',
    'organic':       'Organic / compost (ជីធម្មជាតិ)',
    'unsure':        'Not sure (មិនប្រាកដ)',
}

FERTILIZER_TIMING_LABELS = {
    'before_planting': 'Before planting (មុនដាំ)',
    '30_days_after':   'About 30 days after transplanting (ប្រហែល ៣០ ថ្ងៃ)',
    'flowering':       'At flowering stage (ពេលផ្កា)',
    'other':           'Other timing (ផ្សេង)',
}

ADDITIONAL_LABELS = {
    'purple_roots':    'Purple / dark roots visible (ឬសពណ៌ស្វាយ)',
    'reduced_tillers': 'Fewer tillers than expected (ចេញកន្ទុយតិច)',
    'stunted_growth':  'Stunted / unusually short plants (លូតលាស់យឺត)',
    'morning_ooze':    'Yellow/white ooze at leaf tips in the morning (ទឹកពណ៌លឿង ពេលព្រឹក)',
    'none':            'None of the above (គ្មាន)',
}

# =============================================================================
# HELPER: selectbox with human-readable options
# =============================================================================

def labeled_select(label, options_dict, key, help_text=None):
    """
    Renders a selectbox with no default selection (index=None).
    If session_state has a value for this key (set by Load Test Case),
    pre-selects that option.
    Returns the raw DSS key, or None if nothing has been picked yet.
    """
    labels = list(options_dict.values())
    keys   = list(options_dict.keys())

    # Check if a test case pre-filled this field
    preset = st.session_state.get(key, None)
    if preset in keys:
        default_index = keys.index(preset)
        chosen = st.selectbox(label, labels, index=default_index,
                              key=key, help=help_text)
    else:
        chosen = st.selectbox(label, labels, index=None,
                              placeholder="Select an option...",
                              key=key, help=help_text)

    if chosen is None:
        return None
    return keys[labels.index(chosen)]


def labeled_multiselect(label, options_dict, key, help_text=None):
    """
    Renders a multiselect — defaults to nothing selected.
    If session_state has a value for this key (set by Load Test Case),
    pre-selects those options.
    Returns list of raw DSS keys.
    """
    labels = list(options_dict.values())
    keys   = list(options_dict.keys())

    # Check if a test case pre-filled this field
    preset = st.session_state.get(key, [])
    if isinstance(preset, list):
        preset_labels = [options_dict[k] for k in preset if k in options_dict]
    else:
        preset_labels = []

    selected_labels = st.multiselect(label, labels, default=preset_labels,
                                     key=key, help=help_text)
    return [keys[labels.index(l)] for l in selected_labels]


# =============================================================================
# SCORE BAR RENDERER
# =============================================================================

CONDITION_COLORS = {
    'blast':            '#e74c3c',
    'brown_spot':       '#e67e22',
    'bacterial_blight': '#c0392b',
    'iron_toxicity':    '#8e44ad',
    'n_deficiency':     '#27ae60',
    'salt_toxicity':    '#2980b9',
}

def render_score_bars(all_scores: dict):
    """Renders a horizontal score bar for each condition."""
    sorted_scores = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
    for condition, score in sorted_scores:
        pct = int(score * 100)
        color = CONDITION_COLORS.get(condition, '#95a5a6')
        label = condition.replace('_', ' ').title()
        st.markdown(
            f"""
            <div style="margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85em;">
                    <span>{label}</span><span>{pct}%</span>
                </div>
                <div style="background:#eee; border-radius:4px; height:12px;">
                    <div style="width:{pct}%; background:{color};
                                border-radius:4px; height:12px;"></div>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )


# =============================================================================
# RESULT RENDERER
# =============================================================================

def render_result(output: dict):
    """Renders the DSS output in a clear structured format."""
    status    = output.get('status', '')
    condition = output.get('primary_condition', '—')
    conf      = output.get('confidence_label', '')
    score     = output.get('score', 0.0)
    recs      = output.get('recommendations', {})
    warnings  = output.get('warnings', [])
    all_scores = output.get('all_scores', {})

    # --- Status banner ---
    if status == 'assessed':
        st.success(f"### 🌾 {condition}")
    elif status == 'ambiguous':
        st.warning(f"### ⚠️ {condition}")
    elif status in ('uncertain', 'out_of_scope'):
        st.info(f"### ℹ️ {condition}")

    # --- Score + confidence ---
    col1, col2 = st.columns(2)
    col1.metric("Score", f"{score:.0%}")
    col2.metric("Confidence", conf.split('(')[-1].replace(')', '') if '(' in conf else conf)

    st.divider()

    # --- Recommendations ---
    if recs:
        st.markdown("#### 📋 Recommendations")

        immediate = recs.get('immediate', [])
        if immediate:
            st.markdown("**Immediate actions:**")
            for item in immediate:
                st.markdown(f"- {item}")

        preventive = recs.get('preventive', [])
        if preventive:
            st.markdown("**Preventive measures:**")
            for item in preventive:
                st.markdown(f"- {item}")

        monitoring = recs.get('monitoring', '')
        if monitoring:
            st.markdown(f"**Monitoring:** {monitoring}")

        if recs.get('consult'):
            st.warning("🩺 Consult an agronomist or local extension officer to confirm.")

    # --- Sheath blight warning ---
    if warnings:
        for w in warnings:
            st.warning(f"⚠️ {w}")

    # --- Ambiguous details ---
    if status == 'ambiguous':
        amb = output.get('ambiguous_between', [])
        if amb:
            st.markdown("**Conflicting conditions:**")
            for a in amb:
                st.markdown(f"- {a['condition']} — {a['score']:.0%}")

    st.divider()

    # --- Score breakdown ---
    if all_scores:
        st.markdown("#### 📊 Score Breakdown")
        render_score_bars(all_scores)

    # --- Disclaimer ---
    st.caption(output.get('disclaimer', ''))


# =============================================================================
# MAIN APP
# =============================================================================

st.title("🌾 Rice Paddy Disease DSS")
st.markdown("**Testing Interface** — Fill in the questionnaire below and submit to see the diagnosis.")
st.markdown("---")

# =============================================================================
# SIDEBAR — Load Test Case
# =============================================================================

# Expected condition labels for the sidebar badge
EXPECTED_BADGE = {
    'blast':            '🔴 Blast',
    'brown_spot':       '🟠 Brown Spot',
    'bacterial_blight': '🔴 Bacterial Blight',
    'iron_toxicity':    '🟣 Iron Toxicity',
    'n_deficiency':     '🟢 N Deficiency',
    'salt_toxicity':    '🔵 Salt Toxicity',
    'ambiguous_fungal': '⚠️ Ambiguous',
    'uncertain':        'ℹ️ Uncertain',
}

with st.sidebar:
    st.header("🧪 Load Test Case")
    st.caption("Pre-fills the form with a known validated scenario.")

    # Build display names for the dropdown
    case_options = {
        f"Case {i+1:02d} — {name}  [{EXPECTED_BADGE.get(exp, exp)}]": answers
        for i, (answers, exp, name) in enumerate(TEST_CASES)
    }

    selected_case_label = st.selectbox(
        "Choose a test case",
        options=["— none —"] + list(case_options.keys()),
        index=0,
        key="case_selector"
    )

    if st.button("▶ Load", use_container_width=True, type="primary"):
        if selected_case_label != "— none —":
            preset = case_options[selected_case_label]
            # Store each field into session_state so the form widgets pick it up
            for field, value in preset.items():
                if field != 'ml_probabilities':
                    st.session_state[field] = value
            # fertilizer_applied must be a bool
            if 'fertilizer_applied' not in preset:
                st.session_state['fertilizer_applied'] = None
            st.success("Test case loaded — scroll down and click **Run Diagnosis**.")
        else:
            st.warning("Select a test case first.")

    st.divider()
    st.caption("All 20 cases are from the validated specification. "
               "Each one is guaranteed to produce the expected result.")



    # -------------------------------------------------------------------------
    # SECTION 1 — Growth Stage
    # -------------------------------------------------------------------------
    st.subheader("1. Crop Growth Stage")
    growth_stage = labeled_select(
        "What stage is the rice crop currently at?",
        GROWTH_STAGE_LABELS, key="growth_stage"
    )

    # -------------------------------------------------------------------------
    # SECTION 2 — Symptoms
    # -------------------------------------------------------------------------
    st.subheader("2. Symptoms Observed")

    symptoms = labeled_multiselect(
        "What symptoms do you see? (select all that apply)",
        SYMPTOM_LABELS, key="symptoms",
        help_text="Select every symptom you can clearly observe on the plants."
    )

    symptom_location = labeled_multiselect(
        "Where on the plant are the symptoms?",
        LOCATION_LABELS, key="symptom_location"
    )

    symptom_origin = labeled_select(
        "Which leaves are showing symptoms first?",
        ORIGIN_LABELS, key="symptom_origin"
    )

    farmer_confidence = labeled_select(
        "How sure are you about what you're seeing?",
        CONFIDENCE_LABELS, key="farmer_confidence"
    )

    # -------------------------------------------------------------------------
    # SECTION 3 — Fertilizer
    # -------------------------------------------------------------------------
    st.subheader("3. Fertilizer")

    _fert_preset = st.session_state.get('fertilizer_applied', None)
    _fert_index  = None if _fert_preset is None else ([True, False].index(_fert_preset) if _fert_preset in [True, False] else None)
    fertilizer_applied = st.radio(
        "Has fertilizer been applied this season?",
        options=[True, False],
        format_func=lambda x: "Yes" if x else "No",
        index=_fert_index,
        key="fertilizer_applied"
    )

    fertilizer_amount    = None
    fertilizer_type      = None
    fertilizer_timing    = None

    if fertilizer_applied:
        fertilizer_amount = labeled_select(
            "How much fertilizer was applied?",
            FERTILIZER_AMOUNT_LABELS, key="fertilizer_amount"
        )
        fertilizer_type = labeled_select(
            "What type of fertilizer?",
            FERTILIZER_TYPE_LABELS, key="fertilizer_type"
        )
        fertilizer_timing = labeled_select(
            "When was fertilizer last applied?",
            FERTILIZER_TIMING_LABELS, key="fertilizer_timing"
        )

    # -------------------------------------------------------------------------
    # SECTION 4 — Weather
    # -------------------------------------------------------------------------
    st.subheader("4. Recent Weather")

    weather = labeled_select(
        "What has the weather been like recently?",
        WEATHER_LABELS, key="weather"
    )

    # -------------------------------------------------------------------------
    # SECTION 5 — Water
    # -------------------------------------------------------------------------
    st.subheader("5. Water / Field Conditions")

    water_condition = labeled_select(
        "What is the current water condition in the field?",
        WATER_LABELS, key="water_condition"
    )

    # -------------------------------------------------------------------------
    # SECTION 6 — Spread
    # -------------------------------------------------------------------------
    st.subheader("6. Spread Pattern")

    spread_pattern = labeled_select(
        "How widespread are the symptoms?",
        SPREAD_LABELS, key="spread_pattern"
    )

    # -------------------------------------------------------------------------
    # SECTION 7 — Timing
    # -------------------------------------------------------------------------
    st.subheader("7. Symptom Timing")

    symptom_timing = labeled_select(
        "When did symptoms first appear?",
        TIMING_LABELS, key="symptom_timing"
    )

    onset_speed = labeled_select(
        "How quickly did the symptoms spread?",
        ONSET_LABELS, key="onset_speed"
    )

    # -------------------------------------------------------------------------
    # SECTION 8 — History & Soil
    # -------------------------------------------------------------------------
    st.subheader("8. Field History & Soil")

    previous_disease = labeled_select(
        "Has this field had disease problems before?",
        PREV_DISEASE_LABELS, key="previous_disease"
    )

    previous_crop = labeled_select(
        "What was grown in this field last season?",
        PREV_CROP_LABELS, key="previous_crop"
    )

    soil_type = labeled_select(
        "What type of soil does this field have?",
        SOIL_TYPE_LABELS, key="soil_type"
    )

    soil_cracking = labeled_select(
        "Does the soil crack when dry?",
        SOIL_CRACKING_LABELS, key="soil_cracking"
    )

    # -------------------------------------------------------------------------
    # SECTION 9 — Additional Symptoms
    # -------------------------------------------------------------------------
    st.subheader("9. Additional Observations")

    additional_symptoms = labeled_multiselect(
        "Any additional symptoms? (select all that apply)",
        ADDITIONAL_LABELS, key="additional_symptoms",
        help_text="Morning ooze is a strong indicator of Bacterial Blight."
    )

    # -------------------------------------------------------------------------
    # SUBMIT
    # -------------------------------------------------------------------------
    st.markdown("---")
    submitted = st.form_submit_button("🔍 Run Diagnosis", use_container_width=True)


# =============================================================================
# RESULT SECTION
# =============================================================================

if submitted:
    # --- Required field validation ---
    missing = []
    if not growth_stage:        missing.append("Growth Stage")
    if not symptoms:            missing.append("Symptoms (Section 2)")
    if not symptom_location:    missing.append("Symptom Location (Section 2)")
    if not symptom_origin:      missing.append("Which leaves (Section 2)")
    if not farmer_confidence:   missing.append("How sure are you (Section 2)")
    if fertilizer_applied is None: missing.append("Fertilizer applied? (Section 3)")
    if not weather:             missing.append("Recent Weather (Section 4)")
    if not water_condition:     missing.append("Water Condition (Section 5)")
    if not spread_pattern:      missing.append("Spread Pattern (Section 6)")
    if not symptom_timing:      missing.append("When symptoms appeared (Section 7)")
    if not onset_speed:         missing.append("How fast symptoms spread (Section 7)")

    if missing:
        st.error("⚠️ Please fill in the following required fields before running:")
        for m in missing:
            st.markdown(f"- {m}")
        st.stop()

    # Build raw answers dict exactly as decision.py expects
    raw_answers = {
        'growth_stage':         growth_stage,
        'symptoms':             symptoms,
        'symptom_location':     symptom_location,
        'symptom_origin':       symptom_origin,
        'farmer_confidence':    farmer_confidence,
        'fertilizer_applied':   fertilizer_applied,
        'fertilizer_amount':    fertilizer_amount,
        'fertilizer_type':      fertilizer_type,
        'fertilizer_timing':    fertilizer_timing,
        'weather':              weather,
        'water_condition':      water_condition,
        'spread_pattern':       spread_pattern,
        'symptom_timing':       symptom_timing,
        'onset_speed':          onset_speed,
        'previous_disease':     previous_disease,
        'previous_crop':        previous_crop,
        'soil_type':            soil_type,
        'soil_cracking':        soil_cracking,
        'additional_symptoms':  additional_symptoms if additional_symptoms else ['none'],
        'ml_probabilities':     None,
    }

    with st.spinner("Running DSS..."):
        output = generate_output(raw_answers)

    st.markdown("## 🩺 Diagnosis Result")
    render_result(output)

    # --- Raw JSON expander (debug mode for teammates) ---
    with st.expander("🔧 Raw Output (Debug / JSON)"):
        import json
        st.code(json.dumps(output, indent=2, ensure_ascii=False), language="json")

    with st.expander("📥 Raw Answers Sent to DSS"):
        import json
        st.code(json.dumps(raw_answers, indent=2, ensure_ascii=False), language="json")
