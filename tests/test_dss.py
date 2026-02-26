# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# tests/test_dss.py — DSS Core Test Suite
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 2, Cell 19 (20-case test runner)
#
# PURPOSE:
#   Validates the correctness of generate_output() across all 20 defined
#   test cases from the specification document.
#   Each case has an expected output — PASS/FAIL is determined automatically.
#   Run this after ANY change to scoring functions to catch regressions.
#
# INFRASTRUCTURE NOTE (added during project conversion):
#   Run with:  pytest tests/test_dss.py -v
#   Or with:   python -m pytest tests/test_dss.py -v
#
# STRICT RULES:
#   - Do NOT change expected outputs without scientific justification.
#   - Do NOT modify test case inputs — they are validated scenarios.
#   - Case 14 is a special case: checks for sheath blight WARNING, not
#     a specific primary condition. See the comment in that test.
#
# EDGE CASE TESTS (from Phase 1, Cell 2) are included at the bottom.
# ROBUSTNESS / NOISE SIMULATION is in tests/test_robustness.py.
# =============================================================================

import pytest
from dss.decision import generate_output
from dss.validation import validate_answers
from dss.scoring import compute_all_scores, get_confidence_modifier


# =============================================================================
# CELL 19: FULL 20-CASE TEST RUNNER
# -----------------------------------------------------------------------------
# Runs all 20 test cases from the specification document.
# Each case has an expected output — PASS/FAIL is determined automatically.
# Run this after any change to scoring functions to catch regressions.
# =============================================================================

# All 20 test cases defined as (answers_dict, expected_condition_key, case_name)
TEST_CASES = [

    # Case 01: Classic Blast — Flowering Stage
    ({
        'growth_stage': 'flowering',
        'symptoms': ['dark_spots', 'dried_areas'],
        'symptom_location': ['leaf_blade', 'panicle'],
        'symptom_origin': 'upper_leaves',
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'fertilizer_type': 'balanced_npk',
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'symptom_timing': 'around_flowering',
        'onset_speed': 'sudden',
        'previous_disease': 'yes_same',
        'previous_crop': 'rice_same',
        'soil_type': 'unsure',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'blast', 'Classic Blast — Flowering Stage'),

    # Case 02: Classic Brown Spot — N Deficient Field
    ({
        'growth_stage': 'tillering',
        'symptoms': ['dark_spots', 'brown_discoloration', 'yellowing'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'somewhat_sure',
        'fertilizer_applied': False,
        'weather': 'heavy_rain',
        'water_condition': 'recently_drained',
        'spread_pattern': 'patches',
        'onset_speed': 'gradual',
        'previous_crop': 'rice_same',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'brown_spot', 'Classic Brown Spot — N Deficient Field'),

    # Case 03: Bacterial Blight — Morning Ooze
    ({
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'white_tips', 'dried_areas'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'fertilizer_type': 'balanced_npk',
        'weather': 'heavy_rain',
        'water_condition': 'flooded_continuously',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'previous_crop': 'rice_same',
        'additional_symptoms': ['morning_ooze'],
        'ml_probabilities': None
    }, 'bacterial_blight', 'Bacterial Blight — Morning Ooze'),

    # Case 04: Iron Toxicity — Misidentifiable as Brown Spot
    ({
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'brown_discoloration', 'dark_spots'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'somewhat_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'weather': 'normal',
        'water_condition': 'flooded_continuously',
        'spread_pattern': 'most_of_field',
        'symptom_timing': 'right_after_transplant',
        'onset_speed': 'gradual',
        'soil_type': 'kbal_po',
        'soil_cracking': 'large_cracks',
        'additional_symptoms': ['purple_roots', 'stunted_growth'],
        'ml_probabilities': None
    }, 'iron_toxicity', 'Iron Toxicity — Must Override Brown Spot'),

    # Case 05: Nitrogen Deficiency — Clear Case
    ({
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'slow_growth'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': False,
        'weather': 'normal',
        'water_condition': 'wet',
        'spread_pattern': 'most_of_field',
        'onset_speed': 'gradual',
        'previous_crop': 'rice_different',
        'additional_symptoms': ['reduced_tillers'],
        'ml_probabilities': None
    }, 'n_deficiency', 'Nitrogen Deficiency — Clear Case'),

    # Case 06: Salt Toxicity — Excess Fertilizer
    ({
        'growth_stage': 'seedling',
        'symptoms': ['white_tips', 'yellowing', 'slow_growth'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'somewhat_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'excessive',
        'fertilizer_type': 'high_nitrogen',
        'weather': 'dry_hot',
        'water_condition': 'flooded_continuously',
        'spread_pattern': 'most_of_field',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'salt_toxicity', 'Salt Toxicity — Excess Fertilizer'),

    # Case 07: Ambiguous — Blast vs Brown Spot
    ({
        'growth_stage': 'elongation',
        'symptoms': ['dark_spots', 'brown_discoloration'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'upper_leaves',
        'farmer_confidence': 'somewhat_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'gradual',
        'previous_crop': 'rice_same',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'ambiguous_fungal', 'Ambiguous — Blast vs Brown Spot'),

    # Case 08: Brown Spot + N Deficiency Combined
    ({
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
        'symptom_origin': 'lower_leaves',
        'symptom_location': ['leaf_blade'],
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': False,
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'brown_spot', 'Brown Spot + N Deficiency Combined'),

    # Case 09: Bacterial Blight vs Salt — No Ooze Observed
    ({
        'symptoms': ['white_tips', 'yellowing', 'dried_areas'],
        'farmer_confidence': 'not_sure',
        'fertilizer_amount': 'normal',
        'water_condition': 'flooded_continuously',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'weather': 'heavy_rain',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'bacterial_blight', 'Bacterial Blight vs Salt — No Ooze'),

    # Case 10: Iron Toxicity vs Bacterial — Flooding, No Purple Roots
    ({
        'symptoms': ['yellowing', 'brown_discoloration'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'somewhat_sure',
        'water_condition': 'flooded_continuously',
        'symptom_timing': 'right_after_transplant',
        'onset_speed': 'gradual',
        'soil_cracking': 'large_cracks',
        'spread_pattern': 'most_of_field',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'iron_toxicity', 'Iron Toxicity vs Bacterial — No Purple Roots'),

    # Case 11: Out of Scope — Likely Insect Damage
    ({
        'growth_stage': 'tillering',
        'symptoms': ['slow_growth', 'dried_areas'],
        'symptom_location': ['stem'],
        'symptom_origin': 'unsure',
        'farmer_confidence': 'not_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'weather': 'normal',
        'water_condition': 'wet',
        'spread_pattern': 'few_plants',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'uncertain', 'Out of Scope — Insect Damage'),

    # Case 12: Seedling Blast
    ({
        'growth_stage': 'seedling',
        'symptoms': ['dark_spots', 'dried_areas'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'upper_leaves',
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': True,
        'fertilizer_type': 'high_nitrogen',
        'fertilizer_amount': 'excessive',
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'previous_crop': 'rice_same',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'blast', 'Seedling Blast'),

    # Case 13: Incomplete Data — Mostly Unsure
    ({
        'growth_stage': 'tillering',
        'symptoms': ['yellowing'],
        'symptom_origin': 'unsure',
        'farmer_confidence': 'not_sure',
        'fertilizer_applied': True,
        'weather': 'unsure',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'unsure',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'uncertain', 'Incomplete Data — Mostly Unsure'),

    # Case 14: Sheath Blight Flag
    # NOTE: Primary condition may vary — we check for sheath blight WARNING presence,
    # not a specific condition key. This is a special case in the test runner.
    ({
        'growth_stage': 'flowering',
        'symptoms': ['dark_spots', 'dried_areas'],
        'symptom_location': ['leaf_sheath', 'leaf_blade'],
        'farmer_confidence': 'very_sure',
        'water_condition': 'flooded_continuously',
        'weather': 'high_humidity',
        'spread_pattern': 'patches',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'blast', 'Sheath Blight Flag — Must Have Warning'),

    # Case 15: Blast on Panicle — Grain Filling
    ({
        'growth_stage': 'grain_filling',
        'symptoms': ['dark_spots', 'dried_areas'],
        'symptom_location': ['panicle', 'leaf_blade'],
        'farmer_confidence': 'very_sure',
        'water_condition': 'wet',
        'weather': 'high_humidity',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'previous_crop': 'rice_same',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'blast', 'Blast on Panicle — Grain Filling'),

    # Case 16: Potassium Deficiency / Brown Spot (Sandy Soil)
    ({
        'growth_stage': 'grain_filling',
        'symptoms': ['yellowing', 'dried_areas', 'brown_discoloration'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'somewhat_sure',
        'fertilizer_applied': True,
        'fertilizer_type': 'high_nitrogen',
        'fertilizer_amount': 'normal',
        'weather': 'normal',
        'water_condition': 'recently_drained',
        'spread_pattern': 'most_of_field',
        'onset_speed': 'gradual',
        'soil_type': 'prey_khmer',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'brown_spot', 'Sandy Soil — K Deficiency + Brown Spot'),

    # Case 17: Bacterial Blight — Irrigated Field
    ({
        'growth_stage': 'tillering',
        'symptoms': ['white_tips', 'yellowing', 'dried_areas'],
        'farmer_confidence': 'very_sure',
        'water_condition': 'wet',
        'weather': 'high_humidity',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'fertilizer_amount': 'normal',
        'previous_crop': 'rice_same',
        'additional_symptoms': ['morning_ooze'],
        'ml_probabilities': None
    }, 'bacterial_blight', 'Bacterial Blight — Irrigated Field'),

    # Case 18: Iron Toxicity — No Root Check
    ({
        'water_condition': 'flooded_continuously',
        'symptom_timing': 'right_after_transplant',
        'soil_cracking': 'large_cracks',
        'symptoms': ['yellowing', 'brown_discoloration'],
        'onset_speed': 'gradual',
        'spread_pattern': 'most_of_field',
        'farmer_confidence': 'somewhat_sure',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'iron_toxicity', 'Iron Toxicity — No Root Check (Reduced Confidence)'),

    # Case 19: False Positive Prevention — Rain but No Disease
    ({
        'growth_stage': 'tillering',
        'symptoms': ['slow_growth'],
        'symptom_location': ['leaf_blade'],
        'farmer_confidence': 'not_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'weather': 'heavy_rain',
        'water_condition': 'flooded_continuously',
        'spread_pattern': 'few_plants',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'uncertain', 'False Positive Prevention — Rain Without Disease'),

    # Case 20: N Deficiency vs Salt Toxicity
    ({
        'growth_stage': 'seedling',
        'symptoms': ['yellowing', 'white_tips', 'slow_growth'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'somewhat_sure',
        'fertilizer_applied': False,
        'weather': 'normal',
        'water_condition': 'flooded_continuously',
        'spread_pattern': 'most_of_field',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none'],
        'ml_probabilities': None
    }, 'n_deficiency', 'N Deficiency vs Salt Toxicity — Fertilizer History Wins'),
]


# =============================================================================
# PYTEST PARAMETRIZED TEST — 20 CASES
# =============================================================================

@pytest.mark.parametrize("answers, expected, name", TEST_CASES)
def test_case(answers, expected, name):
    """
    Runs a single test case against generate_output().
    Case 14 is special: checks for sheath blight warning instead of condition key.
    """
    output = generate_output(answers)
    actual = output.get('condition_key', 'unknown')

    # Special handling for Case 14 — sheath blight flag check
    if name == 'Sheath Blight Flag — Must Have Warning':
        has_sheath_warning = any(
            'Sheath Blight' in w for w in output.get('warnings', [])
        )
        assert has_sheath_warning, (
            f"[{name}] Expected sheath blight warning in output, but none found.\n"
            f"Warnings: {output.get('warnings', [])}"
        )
    else:
        assert actual == expected, (
            f"[{name}]\n"
            f"  Expected: {expected}\n"
            f"  Got:      {actual}\n"
            f"  Score:    {output.get('score', 0):.3f}\n"
            f"  All scores: {output.get('all_scores', {})}"
        )


# =============================================================================
# EDGE CASE TESTS (from Phase 1, Cell 2)
# -----------------------------------------------------------------------------
# Validates critical boundary scenarios.
# =============================================================================

def test_edge_morning_ooze_only():
    """
    EDGE CASE 1: Morning ooze only.
    Expected: bacterial_blight ≈ 0.60 (POSSIBLE), others < 0.40
    """
    answers = {
        'growth_stage': 'tillering',
        'symptoms': ['white_tips'],
        'symptom_location': ['leaf_blade'],
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'weather': 'normal',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'unsure',
        'additional_symptoms': ['morning_ooze'],
        'previous_crop': 'other'
    }
    validated = validate_answers(answers)
    result = compute_all_scores(validated)
    bb_score = result['scores']['bacterial_blight']
    # Morning ooze alone should push bacterial_blight to ~0.60
    assert bb_score >= 0.55, f"Expected bacterial_blight >= 0.55, got {bb_score:.3f}"
    assert bb_score == max(result['scores'].values()), \
        f"bacterial_blight should be the highest score, scores: {result['scores']}"


def test_edge_n_deficiency_vs_brown_spot():
    """
    EDGE CASE 2: No fertilizer + yellowing + humidity.
    Expected: brown_spot > n_deficiency (fungal wins when dark_spots present)
    """
    answers = {
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'dark_spots'],
        'symptom_location': ['leaf_blade'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'very_sure',
        'fertilizer_applied': False,
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none'],
        'previous_crop': 'rice_same'
    }
    output = generate_output(answers)
    assert output['condition_key'] == 'brown_spot', (
        f"Expected brown_spot, got {output['condition_key']} "
        f"(score: {output['score']:.3f})"
    )


def test_edge_salt_toxicity():
    """
    EDGE CASE 3: White tips + excessive fertilizer + flooding.
    Expected: salt_toxicity PROBABLE (>= 0.65)
    """
    answers = {
        'growth_stage': 'tillering',
        'symptoms': ['white_tips', 'yellowing'],
        'symptom_origin': 'lower_leaves',
        'farmer_confidence': 'somewhat_sure',
        'fertilizer_applied': True,
        'fertilizer_amount': 'excessive',
        'weather': 'normal',
        'water_condition': 'flooded_continuously',
        'spread_pattern': 'most_of_field',
        'onset_speed': 'gradual',
        'additional_symptoms': ['none']
    }
    output = generate_output(answers)
    assert output['condition_key'] == 'salt_toxicity', (
        f"Expected salt_toxicity, got {output['condition_key']}"
    )


def test_edge_sheath_blight_flag():
    """
    EDGE CASE 4: Leaf sheath + humidity + flowering.
    Expected: sheath_blight flag = True in compute_all_scores.
    """
    answers = {
        'growth_stage': 'flowering',
        'symptoms': ['dark_spots', 'dried_areas'],
        'symptom_location': ['leaf_sheath', 'leaf_blade'],
        'farmer_confidence': 'very_sure',
        'water_condition': 'flooded_continuously',
        'weather': 'high_humidity',
        'spread_pattern': 'patches',
        'onset_speed': 'gradual',
        'fertilizer_applied': True,
        'fertilizer_amount': 'normal',
        'additional_symptoms': ['none']
    }
    validated = validate_answers(answers)
    result = compute_all_scores(validated)
    assert result['flags']['sheath_blight'] is True, \
        "Expected sheath_blight flag to be True for this symptom pattern"


# =============================================================================
# CONFIDENCE MODIFIER TESTS
# =============================================================================

def test_confidence_modifier_values():
    """Confidence modifier should return correct multipliers."""
    assert get_confidence_modifier({'farmer_confidence': 'very_sure'}) == 1.00
    assert get_confidence_modifier({'farmer_confidence': 'somewhat_sure'}) == 0.85
    assert get_confidence_modifier({'farmer_confidence': 'not_sure'}) == 0.65
    assert get_confidence_modifier({}) == 0.75  # missing → conservative default


# =============================================================================
# VALIDATION TESTS
# =============================================================================

def test_validate_strips_invalid_values():
    """Invalid values should be replaced with None (neutral)."""
    raw = {
        'growth_stage': 'invalid_stage',
        'symptoms': ['invalid_symptom', 'yellowing'],
        'farmer_confidence': 'very_sure',
    }
    cleaned = validate_answers(raw)
    assert cleaned['growth_stage'] is None
    assert cleaned['symptoms'] == ['yellowing']


def test_validate_ml_probabilities_passthrough():
    """ml_probabilities should pass through as-is."""
    ml = {'blast': 0.7, 'brown_spot': 0.2, 'bacterial_blight': 0.1}
    cleaned = validate_answers({'ml_probabilities': ml})
    assert cleaned['ml_probabilities'] == ml


def test_validate_missing_confidence_defaults():
    """Missing farmer_confidence should default to 'somewhat_sure'."""
    cleaned = validate_answers({})
    assert cleaned['farmer_confidence'] == 'somewhat_sure'


# =============================================================================
# OUTPUT STRUCTURE TESTS
# =============================================================================

def test_output_has_required_keys():
    """Every output must contain the required top-level keys."""
    required_keys = {
        'status', 'primary_condition', 'condition_key',
        'confidence_label', 'confidence_level', 'score',
        'all_scores', 'recommendations', 'secondary_note',
        'warnings', 'disclaimer'
    }
    answers = {
        'growth_stage': 'flowering',
        'symptoms': ['dark_spots'],
        'symptom_location': ['panicle'],
        'farmer_confidence': 'very_sure',
        'weather': 'high_humidity',
        'water_condition': 'wet',
        'spread_pattern': 'patches',
        'onset_speed': 'sudden',
        'additional_symptoms': ['none'],
    }
    output = generate_output(answers)
    missing = required_keys - set(output.keys())
    assert not missing, f"Output missing keys: {missing}"


def test_scores_bounded():
    """All scores must be in [0.0, 1.0]."""
    for answers, _, name in TEST_CASES:
        validated = validate_answers(answers)
        result = compute_all_scores(validated)
        for condition, score in result['scores'].items():
            assert 0.0 <= score <= 1.0, (
                f"[{name}] {condition} score out of bounds: {score}"
            )
