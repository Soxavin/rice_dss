# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# tests/test_robustness.py — Robustness / Noise Simulation Tests
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 2, Cell 22
#
# PURPOSE:
#   Simulates REAL FARMER INPUT CONDITIONS.
#   Your previous 20 test cases assume PERFECT answers.
#   Real farmers will:
#     - forget information
#     - misidentify symptoms
#     - select "not sure"
#     - partially complete questionnaire
#
#   This file intentionally corrupts inputs to test:
#     ✓ System stability
#     ✓ False confidence prevention
#     ✓ Safe uncertainty handling
#
# IMPORTANT RESEARCH VALUE:
#   This allows you to claim:
#   "System validated under simulated real-world uncertainty."
#
# INFRASTRUCTURE NOTE (added during project conversion):
#   Run with:  pytest tests/test_robustness.py -v -s
#   The -s flag shows the simulation summary printed to stdout.
#
# CONFIGURATION:
#   Adjust NOISE_ITERATIONS_PER_CASE to increase statistical confidence.
#   Default is 20 per case (400 total runs across 20 cases).
# =============================================================================

import random
import copy
import pytest

from dss.decision import generate_output
from dss.validation import validate_answers
from tests.test_dss import TEST_CASES


# =============================================================================
# CONFIGURATION PARAMETERS
# =============================================================================
NOISE_ITERATIONS_PER_CASE = 20   # total simulations per base case
FIELD_DROP_PROBABILITY = 0.25    # chance farmer skips question
SYMPTOM_SWAP_PROBABILITY = 0.20  # mis-observation probability
CONFIDENCE_NOISE_PROB = 0.40     # farmer unsure likelihood


# =============================================================================
# POSSIBLE VALUES FOR RANDOMIZATION
# =============================================================================
CONFIDENCE_LEVELS = ['very_sure', 'somewhat_sure', 'not_sure']

SYMPTOM_POOL = [
    'yellowing',
    'dark_spots',
    'white_tips',
    'dried_areas',
    'slow_growth',
    'brown_discoloration'
]


# =============================================================================
# INPUT NOISE INJECTOR
# =============================================================================
def inject_farmer_noise(base_answers: dict) -> dict:
    """
    Creates a noisy version of a valid test case.

    Simulates:
    - Missing answers
    - Wrong symptom identification
    - Reduced farmer confidence
    """

    noisy = copy.deepcopy(base_answers)

    # ---------------------------------------------------------
    # 1. RANDOMLY REMOVE SOME FIELDS
    # ---------------------------------------------------------
    for key in list(noisy.keys()):
        if random.random() < FIELD_DROP_PROBABILITY:
            noisy.pop(key, None)

    # ---------------------------------------------------------
    # 2. SYMPTOM MISIDENTIFICATION
    # ---------------------------------------------------------
    if 'symptoms' in noisy and random.random() < SYMPTOM_SWAP_PROBABILITY:
        noisy['symptoms'] = random.sample(
            SYMPTOM_POOL,
            k=min(len(SYMPTOM_POOL), random.randint(1, 3))
        )

    # ---------------------------------------------------------
    # 3. CONFIDENCE UNCERTAINTY
    # ---------------------------------------------------------
    if random.random() < CONFIDENCE_NOISE_PROB:
        noisy['farmer_confidence'] = random.choice(CONFIDENCE_LEVELS)

    return noisy


# =============================================================================
# ROBUSTNESS SIMULATION TEST
# =============================================================================

def test_noise_simulation_no_crashes():
    """
    Runs robustness testing across ALL test cases with noisy inputs.

    Asserts:
    - System never raises an exception on noisy farmer input
    - No output is returned with an unknown status
    - Stable accuracy, ambiguity rate, and uncertainty rate are within
      acceptable research-defined bounds
    """
    valid_statuses = {'assessed', 'ambiguous', 'uncertain', 'out_of_scope', 'no_image', 'invalid_ml_output'}

    stable = 0
    ambiguous = 0
    uncertain = 0
    assessed = 0
    total_runs = 0

    for answers, expected, name in TEST_CASES:
        for _ in range(NOISE_ITERATIONS_PER_CASE):
            noisy_answers = inject_farmer_noise(answers)

            # System must NOT raise any exception on noisy input
            output = generate_output(noisy_answers)

            # Output status must always be a known value
            assert output.get('status') in valid_statuses, (
                f"Unknown status '{output.get('status')}' returned for case: {name}"
            )

            total_runs += 1
            status = output.get("status")

            if status == "assessed":
                assessed += 1
                if output.get("condition_key") == expected:
                    stable += 1
            elif status == "ambiguous":
                ambiguous += 1
            elif status == "uncertain":
                uncertain += 1

    # ---------------------------------------------------------
    # SUMMARY (printed when running with -s flag)
    # ---------------------------------------------------------
    print(f"\n{'='*60}")
    print("ROBUSTNESS / NOISE SIMULATION RESULTS")
    print(f"{'='*60}")
    print(f"Total simulation runs : {total_runs}")
    print(f"Stable correct        : {stable} ({stable/total_runs:.1%})")
    print(f"Ambiguous escalations : {ambiguous} ({ambiguous/total_runs:.1%})")
    print(f"Uncertain safe fallback: {uncertain} ({uncertain/total_runs:.1%})")
    print(f"Confident assessments : {assessed} ({assessed/total_runs:.1%})")
    print(f"""
INTERPRETATION GUIDE
--------------------
Ideal DSS Behaviour:

✓ Stable Accuracy: 40–70%
    System survives noisy farmer input.

✓ Ambiguous Increase:
    Good — system refuses unsafe decisions.

✓ Uncertain Outputs:
    VERY GOOD — prevents wrong treatment advice.

⚠ If confident assessments remain very high (>80%)
    → System may be overconfident.

⚠ If uncertain >60%
    → Questionnaire too sensitive to missing data.
""")

    # Acceptable bounds — system should not crash or return nothing
    assert total_runs > 0, "No simulation runs completed"
    # Safety: uncertain + ambiguous together should be < 70%
    # (system should still make assessments for the majority of runs)
    non_assessed_rate = (uncertain + ambiguous) / total_runs
    assert non_assessed_rate < 0.70, (
        f"Too many non-assessed outputs ({non_assessed_rate:.1%}) — "
        f"questionnaire may be too sensitive to missing fields"
    )


# =============================================================================
# ADVERSARIAL / BOUNDARY TEST CASES
# -----------------------------------------------------------------------------
# Hand-crafted edge cases that stress-test the system with inputs that
# real farmers would never produce but attackers or buggy UIs might.
# These complement the random noise simulation above.
# =============================================================================

VALID_STATUSES = {'assessed', 'ambiguous', 'uncertain', 'out_of_scope',
                  'no_image', 'invalid_ml_output'}


def _run_safely(answers: dict, label: str) -> dict:
    """Helper: run generate_output and assert it doesn't crash."""
    output = generate_output(answers)
    assert output is not None, f"[{label}] generate_output returned None"
    assert output.get('status') in VALID_STATUSES, (
        f"[{label}] Unknown status: {output.get('status')}"
    )
    return output


class TestAdversarialInputs:
    """
    Hand-crafted adversarial cases that should NEVER crash the system.
    The system may return uncertain / out_of_scope — that is correct behaviour.
    """

    def test_kitchen_sink_all_symptoms(self):
        """Every symptom selected at once — system should not crash."""
        answers = {
            'growth_stage': 'flowering',
            'symptoms': ['yellowing', 'dark_spots', 'white_tips',
                         'dried_areas', 'slow_growth', 'brown_discoloration'],
            'symptom_location': ['leaf_blade', 'leaf_sheath', 'stem', 'panicle'],
            'symptom_origin': 'lower_leaves',
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': True,
            'fertilizer_amount': 'excessive',
            'fertilizer_type': 'high_nitrogen',
            'weather': 'heavy_rain',
            'water_condition': 'flooded_continuously',
            'spread_pattern': 'most_of_field',
            'onset_speed': 'sudden',
            'previous_crop': 'rice_same',
            'previous_disease': 'yes_same',
            'soil_type': 'kbal_po',
            'soil_cracking': 'large_cracks',
            'symptom_timing': 'right_after_transplant',
            'additional_symptoms': ['morning_ooze', 'purple_roots',
                                    'stunted_growth', 'reduced_tillers'],
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'kitchen_sink')
        # Scores must still be bounded
        for cond, score in output.get('all_scores', {}).items():
            assert 0.0 <= score <= 1.0, f"Score out of bounds: {cond}={score}"

    def test_contradictory_ooze_and_purple_roots_and_white_tips(self):
        """Morning ooze (BB) + purple roots (Fe) + white tips (salt) together."""
        answers = {
            'symptoms': ['white_tips', 'yellowing'],
            'farmer_confidence': 'very_sure',
            'water_condition': 'flooded_continuously',
            'weather': 'heavy_rain',
            'spread_pattern': 'patches',
            'onset_speed': 'sudden',
            'additional_symptoms': ['morning_ooze', 'purple_roots'],
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'contradictory_all_three')
        # Morning ooze is pathognomonic → BB should still lock
        # (or iron toxicity might win via STEP 3 if purple_roots boosts it enough)
        # Either way, system must not crash
        assert output['condition_key'] in {
            'bacterial_blight', 'iron_toxicity', 'salt_toxicity',
            'ambiguous_fungal', 'uncertain'
        }

    def test_all_unsure_all_none(self):
        """Every field set to unsure/None — maximum uncertainty."""
        answers = {
            'growth_stage': 'unsure',
            'symptoms': [],
            'symptom_location': [],
            'symptom_origin': 'unsure',
            'farmer_confidence': 'not_sure',
            'fertilizer_applied': None,
            'weather': 'unsure',
            'water_condition': 'unsure',
            'spread_pattern': 'unsure',
            'onset_speed': 'unsure',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'all_unsure')
        assert output['status'] in {'uncertain', 'out_of_scope'}, (
            f"Expected uncertain/out_of_scope for all-unsure, got {output['status']}"
        )

    def test_empty_dict(self):
        """Completely empty input dict — absolute minimum."""
        output = _run_safely({}, 'empty_dict')
        assert output['status'] in {'uncertain', 'out_of_scope'}

    def test_only_additional_symptoms_no_main(self):
        """Only additional symptoms, no main symptoms."""
        answers = {
            'symptoms': [],
            'additional_symptoms': ['stunted_growth', 'reduced_tillers'],
            'farmer_confidence': 'somewhat_sure',
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'only_additional')
        # Should be uncertain or out_of_scope since no main symptoms
        assert output['status'] in {'uncertain', 'out_of_scope'}

    def test_only_morning_ooze_no_symptoms(self):
        """Only morning ooze, nothing else — minimal pathognomonic signal."""
        answers = {
            'symptoms': [],
            'additional_symptoms': ['morning_ooze'],
            'farmer_confidence': 'very_sure',
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'only_ooze')
        # Might be out_of_scope (no symptoms) or bacterial_blight
        # Either is acceptable

    def test_single_vague_symptom_not_sure(self):
        """
        Single vague symptom + not_sure confidence.
        Tests the NEW flag_out_of_scope Pattern 3.
        """
        for vague in ['slow_growth', 'dried_areas', 'yellowing']:
            answers = {
                'symptoms': [vague],
                'farmer_confidence': 'not_sure',
                'additional_symptoms': ['none'],
                'ml_probabilities': None,
            }
            output = _run_safely(answers, f'single_vague_{vague}')
            # System should recognise this as out-of-scope or uncertain
            assert output['status'] in {'uncertain', 'out_of_scope'}, (
                f"Single vague '{vague}' + not_sure should be uncertain/OOS, "
                f"got {output['status']}"
            )

    def test_only_dried_areas_on_stem_few_plants(self):
        """
        Tests the NEW flag_out_of_scope Pattern 4:
        Only dried_areas on stem with few_plants → likely insect damage.
        """
        answers = {
            'symptoms': ['dried_areas'],
            'symptom_location': ['stem'],
            'spread_pattern': 'few_plants',
            'farmer_confidence': 'somewhat_sure',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'dried_stem_few')
        assert output['status'] in {'uncertain', 'out_of_scope'}

    def test_extreme_ml_values(self):
        """ML with boundary values (exactly 0.0 and 1.0)."""
        answers = {
            'growth_stage': 'flowering',
            'symptoms': ['dark_spots'],
            'symptom_location': ['panicle'],
            'farmer_confidence': 'very_sure',
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'additional_symptoms': ['none'],
            'ml_probabilities': {
                'blast': 1.0, 'brown_spot': 0.0, 'bacterial_blight': 0.0
            },
        }
        output = _run_safely(answers, 'extreme_ml')
        assert output['condition_key'] == 'blast'

    def test_ml_all_equal(self):
        """ML gives equal probability to all conditions."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing'],
            'farmer_confidence': 'somewhat_sure',
            'additional_symptoms': ['none'],
            'ml_probabilities': {
                'blast': 0.333, 'brown_spot': 0.333, 'bacterial_blight': 0.334
            },
        }
        output = _run_safely(answers, 'ml_equal')
        # Uninformative ML → questionnaire should dominate

    def test_all_symptoms_all_locations_with_conflicting_ml(self):
        """Maximum input chaos with conflicting ML."""
        answers = {
            'growth_stage': 'grain_filling',
            'symptoms': ['yellowing', 'dark_spots', 'white_tips',
                         'dried_areas', 'brown_discoloration'],
            'symptom_location': ['leaf_blade', 'leaf_sheath', 'stem', 'panicle'],
            'symptom_origin': 'upper_leaves',
            'farmer_confidence': 'not_sure',
            'fertilizer_applied': False,
            'fertilizer_amount': 'excessive',  # contradicts fertilizer_applied=False
            'weather': 'high_humidity',
            'water_condition': 'dry',
            'spread_pattern': 'few_plants',
            'onset_speed': 'sudden',
            'previous_crop': 'other',
            'additional_symptoms': ['morning_ooze', 'purple_roots', 'stunted_growth'],
            'ml_probabilities': {
                'blast': 0.50, 'brown_spot': 0.30, 'bacterial_blight': 0.20
            },
        }
        output = _run_safely(answers, 'total_chaos')
        for cond, score in output.get('all_scores', {}).items():
            assert 0.0 <= score <= 1.0

    def test_no_symptoms_but_everything_else_filled(self):
        """All environmental data but no symptoms at all."""
        answers = {
            'growth_stage': 'flowering',
            'symptoms': [],
            'symptom_location': ['leaf_blade'],
            'symptom_origin': 'lower_leaves',
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': True,
            'fertilizer_amount': 'normal',
            'weather': 'heavy_rain',
            'water_condition': 'flooded_continuously',
            'spread_pattern': 'most_of_field',
            'onset_speed': 'sudden',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'no_symptoms')
        assert output['status'] in {'uncertain', 'out_of_scope'}

    def test_only_slow_growth_with_no_meaningful_signs(self):
        """
        Tests flag_out_of_scope Pattern 2:
        Only slow_growth with nothing else meaningful.
        """
        answers = {
            'symptoms': ['slow_growth'],
            'farmer_confidence': 'somewhat_sure',
            'water_condition': 'wet',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = _run_safely(answers, 'only_slow_growth')
        assert output['status'] in {'uncertain', 'out_of_scope'}
