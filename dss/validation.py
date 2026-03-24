# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/validation.py — Input Validation Module
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 1, Cell 1 (Sections 1 & 2)
#
# PURPOSE:
#   Defines all valid input values for each questionnaire field and
#   validates raw farmer answers before they reach the scoring engine.
#
# INFRASTRUCTURE NOTE (added during project conversion):
#   This module is imported by dss/scoring.py and dss/decision.py.
#   It is also used directly by api/main.py to sanitize API payloads.
#   The VALID_* sets and validate_answers() are FROZEN — do not modify.
#
# HOW TO USE:
#   from dss.validation import validate_answers
#   cleaned = validate_answers(raw_answers_dict)
# =============================================================================

import logging

logger = logging.getLogger('rice_dss.validation')


# =============================================================================
# SECTION 1: VALID INPUT VALUES
# -----------------------------------------------------------------------------
# These are the ONLY accepted values for each answer field.
# Any value not in these lists will be treated as None (neutral/unknown).
# This prevents typos from silently breaking your scoring logic.
# =============================================================================

VALID_GROWTH_STAGES = {
    'seedling',       # ដំណាក់កាលពន្លក
    'tillering',      # ដំណាក់កាលចេញកន្ទុយ
    'elongation',     # ដំណាក់កាលលូតលាស់ដើម
    'flowering',      # ដំណាក់កាលផ្កា
    'grain_filling'   # ដំណាក់កាលកំពុងទុំ
}

VALID_SYMPTOMS = {
    'dark_spots',          # ចំណុចខ្មៅ ឬ ស្នាមខ្មៅ
    'yellowing',           # ស្លឹកលឿង ឬ ស្រាល
    'dried_areas',         # ផ្នែកស្ងួត/ស្លាប់
    'brown_discoloration', # ពណ៌ត្នោត
    'slow_growth',         # មើលទៅល្អ ប៉ុន្តែលូតលាស់យឺត
    'white_tips'           # ចុងស្លឹកពណ៌ស
}

VALID_SYMPTOM_LOCATIONS = {
    'leaf_blade',   # លើស្លឹក (flat part)
    'leaf_sheath',  # លើស្រទាប់ស្លឹក (base wrapping stem)
    'stem',         # លើដើម
    'panicle'       # លើគ្រាប់/ក្អែ
}

VALID_SYMPTOM_ORIGINS = {
    'lower_leaves',  # ស្លឹកចាស់ខាងក្រោម
    'upper_leaves',  # ស្លឹកថ្មីខាងលើ
    'all_leaves',    # ស្លឹកទាំងអស់
    'unsure'         # មិនប្រាកដ
}

VALID_FARMER_CONFIDENCE = {
    'very_sure',      # ប្រាកដណាស់
    'somewhat_sure',  # ប្រាកដបន្តិច
    'not_sure'        # មិនសូវប្រាកដ
}

VALID_FERTILIZER_TIMING = {
    'before_planting',  # មុនដាំ
    '30_days_after',    # ប្រហែល ៣០ ថ្ងៃ
    'flowering',        # ពេលចេញផ្កា
    'other'             # ពេលផ្សេង
}

VALID_FERTILIZER_TYPES = {
    'high_nitrogen',  # ជីអាស៊ូតខ្ពស់
    'balanced_npk',   # ជីសមាមាត្រ NPK
    'potassium_rich', # ជីប៉ូតាស្យូម
    'organic',        # ជីកំប៉ុស
    'unsure'          # មិនប្រាកដ
}

VALID_FERTILIZER_AMOUNTS = {
    'excessive',  # ប្រើលើស
    'normal',     # ធម្មតា
    'less'        # ប្រើតិច
}

VALID_WEATHER = {
    'heavy_rain',     # ភ្លៀងខ្លាំង
    'high_humidity',  # សំណើមខ្ពស់
    'normal',         # អាកាសធាតុធម្មតា
    'dry_hot',        # ស្ងួត/ក្តៅ
    'unsure'          # មិនដឹង
}

VALID_WATER_CONDITIONS = {
    'flooded_continuously',  # ទឹកជាប់ជានិច្ច
    'wet',                   # សើម
    'dry',                   # ស្ងួត
    'recently_drained'       # ទើបទម្លាក់ទឹក
}

VALID_SPREAD_PATTERNS = {
    'few_plants',    # មានតិច
    'patches',       # ជាកន្លែងៗ
    'most_of_field'  # ពេញស្រែ
}

VALID_SYMPTOM_TIMINGS = {
    'right_after_transplant',  # ក្រោយដាំភ្លាម (1-2 weeks)
    'during_tillering',        # ពេលចេញកន្ទុយ (3-5 weeks)
    'around_flowering',        # ពេលផ្កា
    'grain_filling',           # ពេលទុំ
    'unsure'                   # មិនដឹង
}

VALID_ONSET_SPEEDS = {
    'sudden',   # រហ័ស (few days)
    'gradual',  # បន្តិចៗ (weeks)
    'unsure'    # មិនដឹង
}

VALID_PREVIOUS_DISEASE = {
    'yes_same',       # បាទ រោគសញ្ញាដូចគ្នា
    'yes_different',  # បាទ រោគសញ្ញាខុសគ្នា
    'no',             # ទេ
    'unsure'          # មិនប្រាកដ
}

VALID_PREVIOUS_CROPS = {
    'rice_same',       # ស្រូវម្តងទៀត (same season)
    'rice_different',  # ស្រូវរដូវផ្សេង
    'fallow',          # ទុកទំនេរ
    'other'            # ដំណាំផ្សេង
}

VALID_SOIL_TYPES = {
    'prateah_lang',  # ប្រទះǔង (28% of rice land)
    'bakan',         # បកន (12-13%)
    'prey_khmer',    # ព្រៃខ្មែរ (11%) — sandy
    'kbal_po',       # កបោ (13%) — flooded lowland
    'krakor',        # ក្រគរ (15%)
    'toul_samroung', # ទួលសំរោង (10%) — cracks when dry
    'unsure'         # មិនដឹង
}

VALID_SOIL_CRACKING = {
    'large_cracks',   # ដីបែកធំៗ
    'small_cracks',   # ដីបែកតូចៗ
    'no_cracks'       # មិនបែក
}

VALID_ADDITIONAL_SYMPTOMS = {
    'purple_roots',      # ឬសពណ៌ស្វាយ/ត្នោត
    'reduced_tillers',   # ចេញកន្ទុយតិច
    'stunted_growth',    # លូតលាស់យឺត
    'morning_ooze',      # ទឹកពណ៌លឿង/ស ពេលព្រឹក (bacterial blight marker)
    'none'               # គ្មាន
}


# =============================================================================
# SECTION 1B: ML PROBABILITY VALIDATION
# -----------------------------------------------------------------------------
# The ML model outputs softmax probabilities for 3 biotic conditions.
# Keys must match BIOTIC_CONDITIONS in dss/output_builder.py.
# Values must be floats in [0.0, 1.0].
# Sum should be approximately 1.0 (softmax guarantee).
#
# WHY VALIDATE:
#   Malformed ML output (wrong keys, out-of-range values, non-numeric types)
#   would silently corrupt the fusion math in decision.py STEP 6.
#   Validating here prevents that and logs warnings for debugging.
# =============================================================================

VALID_ML_KEYS = {'blast', 'brown_spot', 'bacterial_blight'}
ML_SUM_TOLERANCE = 0.15  # Allow ±0.15 from 1.0 for floating point drift


def validate_ml_probabilities(ml_probs) -> dict:
    """
    Validates and sanitizes ML probability output before it reaches scoring.

    Checks performed:
    1. Must be a dict (or None → pass through as None)
    2. Keys must be exactly {'blast', 'brown_spot', 'bacterial_blight'}
    3. All values must be numeric and in [0.0, 1.0]
    4. Sum should be approximately 1.0 (warn if not, but don't reject)

    If validation fails, returns None (disables ML fusion safely)
    and logs a warning explaining why.

    Args:
        ml_probs: Raw ml_probabilities value from input

    Returns:
        dict or None: Validated probabilities or None if invalid
    """
    # None = no ML input → pass through
    if ml_probs is None:
        return None

    # Must be a dict
    if not isinstance(ml_probs, dict):
        logger.warning(
            f"[ML Validation] ml_probabilities is not a dict (got {type(ml_probs).__name__}). "
            f"Disabling ML fusion."
        )
        return None

    # Check keys match exactly
    provided_keys = set(ml_probs.keys())
    if provided_keys != VALID_ML_KEYS:
        missing = VALID_ML_KEYS - provided_keys
        extra = provided_keys - VALID_ML_KEYS
        logger.warning(
            f"[ML Validation] Invalid keys in ml_probabilities. "
            f"Missing: {missing or 'none'}, Extra: {extra or 'none'}. "
            f"Expected exactly: {VALID_ML_KEYS}. Disabling ML fusion."
        )
        return None

    # Check all values are numeric, finite, and in [0.0, 1.0]
    import math
    validated = {}
    for key in VALID_ML_KEYS:
        val = ml_probs[key]
        if not isinstance(val, (int, float)):
            logger.warning(
                f"[ML Validation] ml_probabilities['{key}'] is not numeric "
                f"(got {type(val).__name__}: {val!r}). Disabling ML fusion."
            )
            return None
        if math.isnan(val) or math.isinf(val):
            logger.warning(
                f"[ML Validation] ml_probabilities['{key}'] = {val} is not finite. "
                f"Disabling ML fusion."
            )
            return None
        if val < 0.0 or val > 1.0:
            logger.warning(
                f"[ML Validation] ml_probabilities['{key}'] = {val} is out of "
                f"range [0.0, 1.0]. Disabling ML fusion."
            )
            return None
        validated[key] = float(val)

    # Warn (but don't reject) if sum is far from 1.0
    total = sum(validated.values())
    if abs(total - 1.0) > ML_SUM_TOLERANCE:
        logger.warning(
            f"[ML Validation] ml_probabilities sum = {total:.4f} "
            f"(expected ~1.0, tolerance ±{ML_SUM_TOLERANCE}). "
            f"Probabilities may not be properly softmaxed. Proceeding anyway."
        )

    return validated


# =============================================================================
# SECTION 2: ANSWER VALIDATION FUNCTION
# -----------------------------------------------------------------------------
# Before scoring, we validate the incoming answer dictionary.
# Invalid values are replaced with None so they score as neutral (0.0).
# This prevents crashes and silent scoring errors.
# =============================================================================

def validate_answers(raw_answers: dict) -> dict:
    """
    Takes raw answers from the questionnaire and returns a cleaned version.
    Invalid or missing values are replaced with safe defaults.

    Args:
        raw_answers (dict): Raw answers from the questionnaire UI

    Returns:
        dict: Cleaned answers ready for scoring
    """

    def get_valid(key, valid_set, default=None):
        """Helper: return value if valid, else default."""
        val = raw_answers.get(key, default)
        try:
            if val in valid_set:
                return val
        except TypeError:
            pass  # unhashable type (e.g., list passed where string expected)
        return default  # treat invalid/missing as None (neutral)

    def get_valid_list(key, valid_set):
        """Helper: filter a list to only valid values."""
        raw_list = raw_answers.get(key, [])
        if not isinstance(raw_list, list):
            return []
        return [v for v in raw_list if v in valid_set]

    def get_bool(key):
        """Helper: ensure boolean fields are actually boolean."""
        val = raw_answers.get(key, None)
        if isinstance(val, bool):
            return val
        return None  # treat missing bool as unknown

    cleaned = {
        # Section 1
        'growth_stage':     get_valid('growth_stage', VALID_GROWTH_STAGES),

        # Section 2
        'symptoms':             get_valid_list('symptoms', VALID_SYMPTOMS),
        'symptom_location':     get_valid_list('symptom_location', VALID_SYMPTOM_LOCATIONS),
        'symptom_origin':       get_valid('symptom_origin', VALID_SYMPTOM_ORIGINS),
        'farmer_confidence':    get_valid('farmer_confidence', VALID_FARMER_CONFIDENCE, 'somewhat_sure'),

        # Section 3
        'fertilizer_applied':   get_bool('fertilizer_applied'),
        'fertilizer_timing':    get_valid('fertilizer_timing', VALID_FERTILIZER_TIMING),
        'fertilizer_type':      get_valid('fertilizer_type', VALID_FERTILIZER_TYPES),
        'fertilizer_amount':    get_valid('fertilizer_amount', VALID_FERTILIZER_AMOUNTS),

        # Section 4
        'weather':              get_valid('weather', VALID_WEATHER),

        # Section 5
        'water_condition':      get_valid('water_condition', VALID_WATER_CONDITIONS),

        # Section 6
        'spread_pattern':       get_valid('spread_pattern', VALID_SPREAD_PATTERNS),

        # Section 7
        'symptom_timing':       get_valid('symptom_timing', VALID_SYMPTOM_TIMINGS),
        'onset_speed':          get_valid('onset_speed', VALID_ONSET_SPEEDS),

        # Section 8
        'previous_disease':     get_valid('previous_disease', VALID_PREVIOUS_DISEASE),
        'previous_crop':        get_valid('previous_crop', VALID_PREVIOUS_CROPS),
        'soil_type':            get_valid('soil_type', VALID_SOIL_TYPES),
        'soil_cracking':        get_valid('soil_cracking', VALID_SOIL_CRACKING),

        # Section 9
        'additional_symptoms':  get_valid_list('additional_symptoms', VALID_ADDITIONAL_SYMPTOMS),

        # ML output (validated — None until ML is integrated)
        'ml_probabilities':     validate_ml_probabilities(raw_answers.get('ml_probabilities', None))
    }

    return cleaned
