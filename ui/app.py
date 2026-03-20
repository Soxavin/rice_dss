# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ui/app.py — Streamlit Testing Interface
# -----------------------------------------------------------------------------
# PURPOSE:
#   A local testing interface for teammates and the professor to:
#     1. Select one of three diagnosis modes:
#        - Questionnaire Only (rule-based, all 6 conditions)
#        - Image Only / ML (3 biotic diseases from leaf photo)
#        - Hybrid (questionnaire + ML, recommended)
#     2. Walk through the questionnaire step by step
#     3. Upload a leaf image for ML-based diagnosis
#     4. Submit and see the DSS result
#     5. Inspect the full score breakdown (debug mode)
#     6. Re-run with different answers quickly
#
# HOW TO RUN (single command, single terminal):
#   source .venv312/bin/activate && streamlit run ui/app.py
#
# NOTE:
#   All logic runs in-process — no API server needed.
#   DSS logic: dss/decision.py (direct import)
#   ML inference: ml/inference.py (direct import, requires TensorFlow)
# =============================================================================

# PATH SETUP: Add the project root to sys.path so we can import dss/, ml/, tests/
# directly. This is needed because Streamlit runs this file from ui/ directory,
# but our packages (dss, ml, tests) live one level up in rice_dss/.
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
from pathlib import Path
import streamlit as st

try:
    import plotly.graph_objects as go
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False

# DIRECT IMPORTS — no API server needed.
# The UI runs the DSS logic in-process by importing the same functions
# that the API endpoints use. This makes testing faster and simpler.
from dss.mode_layer import run_dss             # Main DSS entry point (3-mode routing)
from dss.validation import validate_answers     # Input cleaning for explain_scores()
from dss.explainer import explain_scores        # Score traceability / signal breakdown
from dss.logger import dss_logger               # Session audit trail
from tests.test_dss import TEST_CASES           # 20 validated test scenarios for sidebar loader
from translations import translate_output, get_ui_labels
from translations.core import get_label_map
from translations.en import UI_LABELS_EN


# =============================================================================
# ML MODEL LOADING (ផ្ទុកម៉ូដែល ML)
# =============================================================================

MODEL_PATH = Path(__file__).parent.parent / "models" / "rice_disease_model.keras"


@st.cache_resource
def load_ml_model():
    """
    Loads the ML inference model once and caches it across Streamlit reruns.
    Returns None if the model file is missing or TensorFlow is unavailable.
    """
    if not MODEL_PATH.exists():
        return None
    try:
        from ml.inference import RiceDSSInference
        return RiceDSSInference(str(MODEL_PATH))
    except ImportError:
        return None

# =============================================================================
# PAGE CONFIG
# =============================================================================

st.set_page_config(
    page_title="Rice DSS — Tester",
    page_icon="🌾",
    layout="wide"
)

# --- Custom CSS: constrain max width + polish ---
st.markdown("""
<style>
    .block-container { max-width: 1100px; padding-top: 1.5rem; }
    .stAlert > div { border-radius: 10px; }
</style>
""", unsafe_allow_html=True)

# =============================================================================
# LANGUAGE TOGGLE
# =============================================================================
_lang_choice = st.radio(
    "Language / ភាសា",
    ["English", "ខ្មែរ"],
    index=0, horizontal=True,
    key="ui_lang"
)
LANG = "km" if _lang_choice == "ខ្មែរ" else "en"
L = get_ui_labels(LANG)

# =============================================================================
# LABEL MAPS
# Human-readable labels for every valid value in validation.py.
# Each map translates DSS keys (e.g., 'seedling') to bilingual display labels
# (e.g., 'Seedling (ពន្លក)'). The Khmer translations help Cambodian users
# understand the options in their native language.
#
# IMPORTANT: The keys in these maps MUST match the valid values accepted by
# validate_answers() in dss/validation.py. If a new valid value is added there,
# it must also be added here for the UI to display it.
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

# --- Build monolingual label maps based on selected language ---
# When English is selected, shows "Seedling" instead of "Seedling (ពន្លក)".
# When Khmer is selected, shows "ពន្លក" instead of "Seedling (ពន្លក)".
_ALL_LABEL_MAPS = {
    'GROWTH_STAGE':     GROWTH_STAGE_LABELS,
    'SYMPTOM':          SYMPTOM_LABELS,
    'LOCATION':         LOCATION_LABELS,
    'ORIGIN':           ORIGIN_LABELS,
    'CONFIDENCE':       CONFIDENCE_LABELS,
    'WEATHER':          WEATHER_LABELS,
    'WATER':            WATER_LABELS,
    'SPREAD':           SPREAD_LABELS,
    'TIMING':           TIMING_LABELS,
    'ONSET':            ONSET_LABELS,
    'PREV_DISEASE':     PREV_DISEASE_LABELS,
    'PREV_CROP':        PREV_CROP_LABELS,
    'SOIL_TYPE':        SOIL_TYPE_LABELS,
    'SOIL_CRACKING':    SOIL_CRACKING_LABELS,
    'FERTILIZER_AMOUNT':FERTILIZER_AMOUNT_LABELS,
    'FERTILIZER_TYPE':  FERTILIZER_TYPE_LABELS,
    'FERTILIZER_TIMING':FERTILIZER_TIMING_LABELS,
    'ADDITIONAL':       ADDITIONAL_LABELS,
}

# Create display-ready maps (monolingual based on LANG)
DL = {name: get_label_map(m, LANG) for name, m in _ALL_LABEL_MAPS.items()}

# =============================================================================
# HELPER: selectbox with human-readable options
# =============================================================================
# These helpers solve a common Streamlit pattern: we want to display
# human-readable labels (with Khmer translations) in the UI, but the DSS
# expects raw keys (like 'seedling', 'heavy_rain'). The helpers:
#   1. Show the display labels in the widget
#   2. Reverse-map the selected label back to the DSS key
#   3. Return None if nothing is selected (DSS handles None safely)


def labeled_select(label, options_dict, key, help_text=None):
    """
    Renders a selectbox with no default selection (index=None).
    Returns the raw DSS key, or None if nothing has been picked yet.
    """
    labels = list(options_dict.values())   # Human-readable display strings
    keys   = list(options_dict.keys())     # Raw DSS keys

    chosen = st.selectbox(label, labels, index=None,
                          placeholder=L.get('select_placeholder', 'Select an option...'),
                          key=key, help=help_text)

    if chosen is None:
        return None
    # Reverse-map: find which DSS key corresponds to the chosen display label
    return keys[labels.index(chosen)]


def labeled_multiselect(label, options_dict, key, help_text=None):
    """
    Renders a multiselect — defaults to nothing selected.
    Returns list of raw DSS keys.
    """
    labels = list(options_dict.values())
    keys   = list(options_dict.keys())

    selected_labels = st.multiselect(label, labels, key=key, help=help_text)
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
# CONFIDENCE GAUGE (Plotly)
# =============================================================================

def render_gauge(score: float, condition_key: str, confidence_label: str):
    """Renders a Plotly gauge chart showing the DSS confidence score."""
    if not PLOTLY_AVAILABLE:
        return False  # caller falls back to st.metric

    color = CONDITION_COLORS.get(condition_key, '#95a5a6')
    pct = score * 100

    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=pct,
        number={'suffix': '%', 'font': {'size': 40}},
        gauge={
            'axis': {'range': [0, 100], 'tickwidth': 1, 'dtick': 20},
            'bar': {'color': color, 'thickness': 0.7},
            'bgcolor': 'white',
            'steps': [
                {'range': [0, 40], 'color': '#f5f5f5'},
                {'range': [40, 65], 'color': '#fff9e6'},
                {'range': [65, 100], 'color': '#e8f5e9'},
            ],
        }
    ))
    fig.update_layout(
        height=220,
        margin=dict(l=30, r=30, t=40, b=10),
        annotations=[
            dict(text="Possible", x=0.22, y=0.0, showarrow=False,
                 font=dict(size=10, color='#999')),
            dict(text="Probable", x=0.78, y=0.0, showarrow=False,
                 font=dict(size=10, color='#999')),
        ]
    )
    st.plotly_chart(fig, use_container_width=True)
    st.caption(f"**Confidence:** {confidence_label}")
    return True


# =============================================================================
# IMAGE + GRAD-CAM COMPARISON
# =============================================================================

def render_image_comparison(image_bytes, gradcam_image):
    """Shows original image and Grad-CAM overlay side by side."""
    if gradcam_image is None:
        st.image(image_bytes, caption="Uploaded leaf image", width=300)
        return

    col_img, col_cam = st.columns(2)
    with col_img:
        st.image(image_bytes, caption="Original", use_container_width=True)
    with col_cam:
        st.image(gradcam_image, caption="Grad-CAM — Model Focus Areas",
                 use_container_width=True)


# =============================================================================
# EXPLANATION RENDERER
# =============================================================================

CONDITION_DISPLAY = {
    'iron_toxicity':    '🟣 Iron Toxicity',
    'n_deficiency':     '🟢 Nitrogen Deficiency',
    'salt_toxicity':    '🔵 Salt Toxicity',
    'bacterial_blight': '🔴 Bacterial Blight',
    'brown_spot':       '🟠 Brown Spot',
    'blast':            '🔴 Blast',
}


def render_explanation(breakdown: dict, top_condition: str | None = None):
    """
    Renders the explain_scores() breakdown as a readable panel.
    Highlights the winning condition and shows all signals.
    """
    conf_mod = breakdown.get('confidence_modifier', '—')
    conf_src = breakdown.get('confidence_source', '—')
    st.markdown(
        f"**Confidence modifier:** `{conf_mod}` "
        f"(farmer said: `{conf_src}`)"
    )

    # Show the top condition first, then the rest
    conditions = [
        'iron_toxicity', 'n_deficiency', 'salt_toxicity',
        'bacterial_blight', 'brown_spot', 'blast'
    ]
    if top_condition and top_condition in conditions:
        conditions.remove(top_condition)
        conditions.insert(0, top_condition)

    for cond in conditions:
        info = breakdown.get(cond)
        if not info or not isinstance(info, dict):
            continue

        signals = info.get('signals', [])
        raw_total = info.get('raw_total', 0)
        display = CONDITION_DISPLAY.get(cond, cond)
        marker = " ← **winner**" if cond == top_condition else ""

        with st.expander(f"{display}  (raw: {raw_total:+.2f}){marker}",
                         expanded=(cond == top_condition)):
            if not signals:
                st.caption("No signals activated for this condition.")
                continue

            for s in signals:
                icon = "🟢" if s['weight'] >= 0 else "🔴"
                st.markdown(
                    f"{icon} **{s['field']}** = `{s['value']}` "
                    f"→ {s['effect']}{abs(s['weight']):.2f}  \n"
                    f"&nbsp;&nbsp;&nbsp;&nbsp;_{s['reason']}_"
                )

            st.caption(info.get('note', ''))


# =============================================================================
# RESULT RENDERER
# =============================================================================

def render_result(output: dict, labels: dict = None):
    """Renders the DSS output in a clear structured format."""
    if labels is None:
        labels = UI_LABELS_EN
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

    # --- Score + confidence gauge ---
    condition_key = output.get('condition_key', '')
    if not render_gauge(score, condition_key, conf):
        # Fallback if Plotly is not installed
        col1, col2 = st.columns(2)
        col1.metric("Score", f"{score:.0%}")
        col2.metric("Confidence", conf)

    st.divider()

    # --- Recommendations ---
    if recs:
        st.markdown(f"#### 📋 {labels['result_recommendations']}")

        immediate = recs.get('immediate', [])
        if immediate:
            st.markdown(f"**{labels['result_immediate']}**")
            for item in immediate:
                st.markdown(f"- {item}")

        preventive = recs.get('preventive', [])
        if preventive:
            st.markdown(f"**{labels['result_preventive']}**")
            for item in preventive:
                st.markdown(f"- {item}")

        monitoring = recs.get('monitoring', '')
        if monitoring:
            st.markdown(f"**{labels['result_monitoring']}** {monitoring}")

        if recs.get('consult'):
            st.warning(f"🩺 {labels['result_consult']}")

    # --- Sheath blight warning ---
    if warnings:
        for w in warnings:
            st.warning(f"⚠️ {w}")

    # --- Ambiguous details ---
    if status == 'ambiguous':
        amb = output.get('ambiguous_between', [])
        if amb:
            st.markdown(f"**{labels['result_conflicting']}**")
            for a in amb:
                st.markdown(f"- {a['condition']} — {a['score']:.0%}")

    st.divider()

    # --- Score breakdown ---
    if all_scores:
        st.markdown(f"#### 📊 {labels['result_score_breakdown']}")
        render_score_bars(all_scores)

    # --- Disclaimer ---
    st.caption(output.get('disclaimer', ''))


# =============================================================================
# ML PROBABILITY BAR RENDERER
# =============================================================================

def render_ml_bars(ml_probs: dict):
    """Renders ML prediction probability bars for the 3 biotic diseases."""
    st.markdown("#### 🤖 ML Model Prediction")
    st.caption("Probabilities from the image classification model (3 biotic diseases).")
    ml_sorted = sorted(ml_probs.items(), key=lambda x: x[1], reverse=True)
    for cond, prob in ml_sorted:
        pct = int(prob * 100)
        color = CONDITION_COLORS.get(cond, '#95a5a6')
        label = cond.replace('_', ' ').title()
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
# MAIN APP
# =============================================================================

st.title(f"🌾 {L['page_title']}")
st.markdown(f"**{L['page_subtitle']}**")

# =============================================================================
# MODE SELECTOR
# =============================================================================

_mode_options = [L['mode_hybrid'], L['mode_image'], L['mode_questionnaire']]
selected_mode = st.radio(
    L['mode_label'],
    options=_mode_options,
    index=0,
    horizontal=True,
    help=(
        "Questionnaire = rule-based only | "
        "Image Only = ML model only (3 biotic diseases) | "
        "Hybrid = both combined (most accurate)"
    )
)

# Normalise to internal keys for logic branching
_MODE_KEY = {
    L['mode_hybrid']:        "Hybrid (Recommended)",
    L['mode_image']:         "Image Only (ML)",
    L['mode_questionnaire']: "Questionnaire Only",
}
_internal_mode = _MODE_KEY.get(selected_mode, "Hybrid (Recommended)")

MODE_CAPTIONS = {
    "Questionnaire Only": (
        "Rule-based diagnosis from farmer-reported symptoms and field conditions. "
        "Detects all 6 conditions including non-biotic stresses."
    ),
    "Image Only (ML)": (
        "ML diagnosis from a leaf image only. Detects 3 biotic diseases "
        "(blast, brown spot, bacterial blight). "
        "**Cannot** detect non-biotic stresses (iron toxicity, N deficiency, salt toxicity)."
    ),
    "Hybrid (Recommended)": (
        "Combines questionnaire answers with ML image analysis for the most accurate diagnosis. "
        "Detects all 6 conditions. Falls back to questionnaire-only if no image is provided."
    ),
}
st.caption(MODE_CAPTIONS[_internal_mode])
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

# SIDEBAR: TEST CASE LOADER
# This lets teammates quickly test the DSS with known validated scenarios.
# Each test case comes from tests/test_dss.py (the same data used in pytest).
# Loading a case pre-fills the questionnaire form with the case's answers,
# so you can click "Run Diagnosis" and verify the expected result.
with st.sidebar:
    st.header("🧪 Load Test Case")

    if _internal_mode == "Image Only (ML)":
        st.caption(
            "Test cases contain questionnaire answers — switch to "
            "Questionnaire or Hybrid mode to use them."
        )
    else:
        st.caption("Pre-fills the form with a known validated scenario.")

        # Build display names for the dropdown, showing case number + expected condition
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

                # --- Map from raw DSS keys → display labels for each widget ---
                # Streamlit widgets read their current value from session_state[key].
                # For selectboxes, session_state stores the DISPLAY LABEL (string).
                # For multiselects, it stores a LIST of display labels.
                # So we must convert raw DSS keys (e.g., 'seedling') to their
                # display labels (e.g., 'Seedling (ពន្លក)') before writing to state.

                SELECT_FIELDS = {
                    'growth_stage':     GROWTH_STAGE_LABELS,
                    'symptom_origin':   ORIGIN_LABELS,
                    'farmer_confidence':CONFIDENCE_LABELS,
                    'fertilizer_amount':FERTILIZER_AMOUNT_LABELS,
                    'fertilizer_type':  FERTILIZER_TYPE_LABELS,
                    'fertilizer_timing':FERTILIZER_TIMING_LABELS,
                    'weather':          WEATHER_LABELS,
                    'water_condition':  WATER_LABELS,
                    'spread_pattern':   SPREAD_LABELS,
                    'symptom_timing':   TIMING_LABELS,
                    'onset_speed':      ONSET_LABELS,
                    'previous_disease': PREV_DISEASE_LABELS,
                    'previous_crop':    PREV_CROP_LABELS,
                    'soil_type':        SOIL_TYPE_LABELS,
                    'soil_cracking':    SOIL_CRACKING_LABELS,
                }

                MULTI_FIELDS = {
                    'symptoms':             SYMPTOM_LABELS,
                    'symptom_location':     LOCATION_LABELS,
                    'additional_symptoms':  ADDITIONAL_LABELS,
                }

                for field, label_map in SELECT_FIELDS.items():
                    raw_val = preset.get(field)
                    if raw_val in label_map:
                        st.session_state[field] = label_map[raw_val]
                    elif field in st.session_state:
                        del st.session_state[field]

                for field, label_map in MULTI_FIELDS.items():
                    raw_list = preset.get(field, [])
                    if isinstance(raw_list, list):
                        st.session_state[field] = [
                            label_map[k] for k in raw_list if k in label_map
                        ]
                    elif field in st.session_state:
                        del st.session_state[field]

                # fertilizer_applied is a radio (bool) — write the bool directly
                if 'fertilizer_applied' in preset:
                    st.session_state['fertilizer_applied'] = preset['fertilizer_applied']
                elif 'fertilizer_applied' in st.session_state:
                    del st.session_state['fertilizer_applied']

                # Test cases fill all fields — switch to Detailed mode
                st.session_state['q_depth'] = L['depth_detailed']
                st.success("✅ Test case loaded — scroll down and click **Run Diagnosis**.")
                st.rerun()
            else:
                st.warning("Select a test case first.")

        st.divider()
        st.caption("All 20 cases are from the validated specification. "
                   "Each one is guaranteed to produce the expected result.")

# =============================================================================
# IMAGE UPLOAD (Image Only and Hybrid modes)
# =============================================================================

uploaded_image = None
if _internal_mode in ("Image Only (ML)", "Hybrid (Recommended)"):
    if _internal_mode == "Image Only (ML)":
        st.subheader(f"📷 {L['image_title']}")
        st.caption(L['image_caption'])
    else:
        st.subheader(f"0. {L['image_title']}")
        st.caption(L['image_optional'])

    uploaded_image = st.file_uploader(
        "Upload a leaf image (រូបភាពស្លឹក)",
        type=["jpg", "jpeg", "png"],
        help="A clear, close-up photo of a diseased rice leaf works best."
    )
    if uploaded_image is not None:
        st.image(uploaded_image, caption="Uploaded leaf image", width=300)

    st.markdown("---")

# =============================================================================
# QUESTIONNAIRE FORM / ML-ONLY SUBMIT
# =============================================================================

ml_submitted = False
form_submitted = False

if _internal_mode == "Image Only (ML)":
    # --- ML Only: no questionnaire needed ---
    st.info("📋 In Image Only mode, the questionnaire is not needed. Upload a leaf image above.")
    ml_submitted = st.button(f"🔍 {L['btn_run_ml']}", use_container_width=True, type="primary")

else:
    # --- Questionnaire depth toggle (outside form so it triggers rerun) ---
    _depth_options = [L['depth_quick'], L['depth_detailed']]
    q_depth = st.radio(
        L['depth_label'],
        _depth_options,
        index=0, horizontal=True,
        help="Quick mode asks ~6 essential questions. "
             "Detailed mode includes all questions for more accurate diagnosis.",
        key="q_depth"
    )
    is_detailed = q_depth == L['depth_detailed']

    if not is_detailed:
        st.caption(L['depth_quick_caption'])

    # Default values for all questionnaire fields.
    # Quick mode skips some widgets, so these ensure the variables are defined.
    # None/[] values are safe — the DSS treats them as neutral (no signal).
    growth_stage = None
    symptoms = []
    symptom_location = []
    symptom_origin = None
    farmer_confidence = None
    fertilizer_applied = None
    fertilizer_amount = None
    fertilizer_type = None
    fertilizer_timing = None
    weather = None
    water_condition = None
    spread_pattern = None
    symptom_timing = None
    onset_speed = None
    previous_disease = None
    previous_crop = None
    soil_type = None
    soil_cracking = None
    additional_symptoms = []

    # --- Questionnaire form ---
    with st.form("questionnaire_form"):

        # --- ESSENTIAL QUESTIONS (always shown) ---
        st.subheader(f"1. {L['section_growth']}")
        growth_stage = labeled_select(
            L['q_growth_stage'],
            DL['GROWTH_STAGE'], key="growth_stage"
        )

        # ---------------------------------------------------------------------
        # SECTION 2 — Symptoms
        # ---------------------------------------------------------------------
        st.subheader(f"2. {L['section_symptoms']}")

        symptoms = labeled_multiselect(
            L['q_symptoms'],
            DL['SYMPTOM'], key="symptoms",
        )

        symptom_location = labeled_multiselect(
            L['q_symptom_location'],
            DL['LOCATION'], key="symptom_location"
        )

        if is_detailed:
            symptom_origin = labeled_select(
                L['q_symptom_origin'],
                DL['ORIGIN'], key="symptom_origin"
            )

        farmer_confidence = labeled_select(
            L['q_confidence'],
            DL['CONFIDENCE'], key="farmer_confidence"
        )

        # ---------------------------------------------------------------------
        # SECTION 3 — Fertilizer
        # ---------------------------------------------------------------------
        st.subheader(f"3. {L['section_fertilizer']}")

        _fert_preset = st.session_state.get('fertilizer_applied', None)
        _fert_index  = None if _fert_preset is None else ([True, False].index(_fert_preset) if _fert_preset in [True, False] else None)
        fertilizer_applied = st.radio(
            L['q_fertilizer_applied'],
            options=[True, False],
            format_func=lambda x: L['yes'] if x else L['no'],
            index=_fert_index,
            key="fertilizer_applied"
        )

        fertilizer_amount    = None
        fertilizer_type      = None
        fertilizer_timing    = None

        if fertilizer_applied and is_detailed:
            fertilizer_amount = labeled_select(
                L['q_fertilizer_amount'],
                DL['FERTILIZER_AMOUNT'], key="fertilizer_amount"
            )
            fertilizer_type = labeled_select(
                L['q_fertilizer_type'],
                DL['FERTILIZER_TYPE'], key="fertilizer_type"
            )
            fertilizer_timing = labeled_select(
                L['q_fertilizer_timing'],
                DL['FERTILIZER_TIMING'], key="fertilizer_timing"
            )

        # --- CONTEXT + OPTIONAL QUESTIONS (Detailed mode only) ---
        if is_detailed:
            st.subheader(f"4. {L['section_weather']}")

            weather = labeled_select(
                L['q_weather'],
                DL['WEATHER'], key="weather"
            )

            water_condition = labeled_select(
                L['q_water'],
                DL['WATER'], key="water_condition"
            )

            spread_pattern = labeled_select(
                L['q_spread'],
                DL['SPREAD'], key="spread_pattern"
            )

            st.subheader(f"5. {L['section_timing']}")

            symptom_timing = labeled_select(
                L['q_timing'],
                DL['TIMING'], key="symptom_timing"
            )

            onset_speed = labeled_select(
                L['q_onset'],
                DL['ONSET'], key="onset_speed"
            )

            # --- OPTIONAL: Field History & Soil (collapsible) ---
            with st.expander(f"6. {L['section_history']}"):
                previous_disease = labeled_select(
                    L['q_prev_disease'],
                    DL['PREV_DISEASE'], key="previous_disease"
                )

                previous_crop = labeled_select(
                    L['q_prev_crop'],
                    DL['PREV_CROP'], key="previous_crop"
                )

                soil_type = labeled_select(
                    L['q_soil_type'],
                    DL['SOIL_TYPE'], key="soil_type"
                )

                soil_cracking = labeled_select(
                    L['q_soil_cracking'],
                    DL['SOIL_CRACKING'], key="soil_cracking"
                )

        # --- ADDITIONAL OBSERVATIONS (always shown — contains pathognomonic markers) ---
        _section_num = "7" if is_detailed else "4"
        st.subheader(f"{_section_num}. {L['section_additional']}")

        additional_symptoms = labeled_multiselect(
            L['q_additional'],
            DL['ADDITIONAL'], key="additional_symptoms",
            help_text=L.get('morning_ooze_help', '')
        )

        # ---------------------------------------------------------------------
        # SUBMIT
        # ---------------------------------------------------------------------
        st.markdown("---")
        _btn_label = f"🔍 {L['btn_run_diagnosis']}" if is_detailed else f"🔍 {L['btn_quick_diagnosis']}"
        form_submitted = st.form_submit_button(_btn_label, use_container_width=True)


# =============================================================================
# RESULT SECTION
# =============================================================================

# --- PATH A: Image Only (ML) ---
# This path handles the simplest flow: upload image → ML prediction → display.
# No questionnaire form is shown — the user only provides a leaf photo.
if _internal_mode == "Image Only (ML)" and ml_submitted:
    if uploaded_image is None:
        st.error("⚠️ Please upload a leaf image for ML-only diagnosis.")
        st.stop()

    model = load_ml_model()
    if model is None:
        st.error(
            "ML model not available — train first with:\n\n"
            "`python -m ml.train --data_dir data/`"
        )
        st.stop()

    # --- Progressive reveal ---
    uploaded_image.seek(0)
    image_bytes = uploaded_image.read()
    ml_probs = None
    gradcam_image = None

    with st.status("Analyzing leaf image...", expanded=True) as status:
        status.update(label="Running ML prediction...")
        ml_probs = model.predict_from_bytes(image_bytes)

        if ml_probs is not None:
            status.update(label="Generating Grad-CAM heatmap...")
            gradcam_image = model.get_gradcam(image_bytes)

        status.update(label="Running decision engine...")
        output = run_dss({'ml_probabilities': ml_probs}, mode="ml")
        output = translate_output(output, LANG)

        status.update(label="Diagnosis complete!", state="complete", expanded=False)

    if ml_probs is None:
        st.error("Could not process image — please try a different photo.")
        st.stop()

    st.markdown(f"## 🩺 {L['result_title']}")
    st.info(f"**{L['result_mode']}:** {L['mode_image']}")

    # --- Side-by-side image + Grad-CAM ---
    render_image_comparison(image_bytes, gradcam_image)

    render_result(output, L)

    # ML probability bars
    render_ml_bars(ml_probs)

    # Debug + session log in sidebar
    with st.sidebar:
        st.divider()
        with st.expander("🔧 Raw Output (JSON)"):
            st.code(json.dumps(output, indent=2, ensure_ascii=False), language="json")
        with st.expander("📥 ML Probabilities"):
            st.code(json.dumps(ml_probs, indent=2, ensure_ascii=False), language="json")
        st.divider()
        st.header("📋 Session Log")
        summary = dss_logger.get_summary()
        st.metric("Total Runs", summary.get('total_runs', 0))
        dist = summary.get('condition_distribution', {})
        if dist:
            st.markdown("**Condition distribution:**")
            for cond, count in sorted(dist.items(), key=lambda x: x[1], reverse=True):
                st.markdown(f"- {cond}: {count}")

# --- PATH B: Questionnaire Only / Hybrid ---
# This path handles both modes that use the questionnaire form.
# The difference is whether ML probabilities are injected (Hybrid) or not.
elif _internal_mode != "Image Only (ML)" and form_submitted:
    # Minimum input validation: at least one symptom must be reported.
    # Without symptoms, the DSS would flag "out_of_scope" which isn't useful.
    missing = []
    if not symptoms and not additional_symptoms:
        missing.append("At least one symptom (Section 2 or Section 9)")

    if missing:
        st.error("⚠️ Please fill in the following before running:")
        for m in missing:
            st.markdown(f"- {m}")
        st.stop()

    # Build raw answers dict exactly as decision.py expects.
    # Every key here maps to a field that validate_answers() recognizes.
    # None values are fine — they produce neutral scoring (no positive or negative signal).
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

    # --- Progressive reveal: ML + Grad-CAM + DSS ---
    ml_probs = None
    gradcam_image = None
    image_bytes = None

    with st.status("Running diagnosis...", expanded=True) as status:
        # Step 1: ML prediction (Hybrid mode with image)
        if _internal_mode == "Hybrid (Recommended)" and uploaded_image is not None:
            model = load_ml_model()
            if model is not None:
                status.update(label="Analyzing leaf image with ML model...")
                uploaded_image.seek(0)
                image_bytes = uploaded_image.read()
                ml_probs = model.predict_from_bytes(image_bytes)
                if ml_probs is not None:
                    raw_answers['ml_probabilities'] = ml_probs
                    status.update(label="Generating Grad-CAM heatmap...")
                    gradcam_image = model.get_gradcam(image_bytes)

        # Step 2: DSS
        effective_mode = "hybrid" if ml_probs else "questionnaire"
        mode_label = "Hybrid (Questionnaire + ML)" if ml_probs else "Questionnaire Only"

        status.update(label="Running decision engine...")
        output = run_dss(raw_answers, mode=effective_mode)
        output = translate_output(output, LANG)
        validated = validate_answers(raw_answers)
        breakdown = explain_scores(validated)

        status.update(label="Diagnosis complete!", state="complete", expanded=False)

    # Show warnings outside status block so they remain visible
    if selected_mode == "Hybrid (Recommended)" and uploaded_image is not None:
        if ml_probs is None:
            st.warning(
                "ML model not available or could not process image — "
                "fell back to questionnaire only."
            )

    # --- Mode badge + diagnostic strength ---
    st.markdown(f"## 🩺 {L['result_title']}")
    if ml_probs:
        st.info(f"**{L['result_mode']}:** {mode_label}")
    else:
        st.caption(f"**{L['result_mode']}:** {mode_label}")

    # Diagnostic strength indicator — count how many fields the farmer filled
    _field_vals = [
        growth_stage, symptoms, symptom_location, symptom_origin,
        farmer_confidence, fertilizer_applied, fertilizer_amount,
        fertilizer_type, fertilizer_timing, weather, water_condition,
        spread_pattern, symptom_timing, onset_speed, previous_disease,
        previous_crop, soil_type, soil_cracking, additional_symptoms,
    ]
    _filled = sum(
        1 for v in _field_vals
        if v is not None and v != [] and v != ['none']
    )
    if _filled <= 4:
        st.caption(f"📊 {L['strength_limited']}")
    elif _filled <= 8:
        st.caption(f"📊 {L['strength_moderate']}")
    else:
        st.caption(f"📊 {L['strength_strong']}")

    # --- Side-by-side image + Grad-CAM ---
    if image_bytes is not None:
        render_image_comparison(image_bytes, gradcam_image)

    render_result(output, L)

    # --- Explanation panel ---
    st.markdown(f"#### 🔍 {L['result_why']}")
    st.caption(
        "Shows every signal (positive and penalty) that contributed to each "
        "condition's score. The winning condition is expanded by default."
    )
    render_explanation(breakdown, top_condition=output.get('condition_key'))

    # --- ML probabilities (if available) ---
    if ml_probs:
        render_ml_bars(ml_probs)

    # --- Debug + session log in sidebar ---
    with st.sidebar:
        st.divider()
        with st.expander("🔧 Raw Output (JSON)"):
            st.code(json.dumps(output, indent=2, ensure_ascii=False), language="json")
        with st.expander("📥 Raw Answers"):
            st.code(json.dumps(raw_answers, indent=2, ensure_ascii=False), language="json")
        with st.expander("📊 Full Explanation JSON"):
            st.code(json.dumps(breakdown, indent=2, ensure_ascii=False), language="json")
        st.divider()
        st.header("📋 Session Log")
        summary = dss_logger.get_summary()
        st.metric("Total Runs", summary.get('total_runs', 0))
        dist = summary.get('condition_distribution', {})
        if dist:
            st.markdown("**Condition distribution:**")
            for cond, count in sorted(dist.items(), key=lambda x: x[1], reverse=True):
                st.markdown(f"- {cond}: {count}")
