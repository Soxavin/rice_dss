# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# tests/test_hybrid.py — Hybrid / ML Fusion Test Suite
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project improvement phase)
#
# PURPOSE:
#   Validates STEP 5 (strong Q dominance + ML disagreement → ambiguity)
#   and STEP 6 (safe ML fusion → 60/40 weighted combination) of decision.py.
#
#   Also validates:
#     - ML agrees with questionnaire → score boosted via fusion
#     - ML mildly disagrees → questionnaire still wins
#     - ML strongly disagrees at ≥0.80 → STEP 5 ambiguity triggered
#     - Non-biotic override holds even when ML says blast at 0.95
#     - Pathognomonic lock (morning ooze) holds despite ML disagreement
#     - ML validation (bad keys, bad values) → graceful degradation
#
# RUNNING:
#   pytest tests/test_hybrid.py -v
# =============================================================================

import pytest
from dss.decision import generate_output
from dss.validation import validate_answers, validate_ml_probabilities
from dss.scoring import compute_all_scores
from dss.output_builder import QUESTIONNAIRE_WEIGHT, ML_WEIGHT


# =============================================================================
# HELPER: BASE ANSWER SETS FOR REUSE
# =============================================================================

def _blast_base():
    """Strong blast questionnaire case (flowering, panicle, humidity, sudden)."""
    return {
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
        'additional_symptoms': ['none'],
    }


def _bacterial_blight_base():
    """Strong bacterial blight case with morning ooze (pathognomonic lock)."""
    return {
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
    }


def _iron_toxicity_base():
    """Strong iron toxicity case (non-biotic, overrides ML)."""
    return {
        'growth_stage': 'tillering',
        'symptoms': ['yellowing', 'brown_discoloration'],
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
    }


def _brown_spot_base():
    """Moderate brown spot case (tillering, no fertilizer, humidity)."""
    return {
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
    }


# =============================================================================
# TEST 1: ML AGREES WITH QUESTIONNAIRE → SCORE BOOSTED
# =============================================================================

class TestMLAgreesWithQuestionnaire:
    """
    When ML output agrees with the questionnaire's top condition,
    the 60/40 fusion should boost or maintain the final score.
    """

    def test_blast_ml_agrees_boosts_score(self):
        """Blast questionnaire + blast ML → combined blast score ≥ Q-only score."""
        base = _blast_base()

        # Questionnaire only (no ML)
        base_no_ml = {**base, 'ml_probabilities': None}
        output_q = generate_output(base_no_ml)
        q_blast = output_q['all_scores']['blast']

        # With agreeing ML
        base_ml = {**base, 'ml_probabilities': {
            'blast': 0.85, 'brown_spot': 0.10, 'bacterial_blight': 0.05
        }}
        output_h = generate_output(base_ml)

        assert output_h['condition_key'] == 'blast', (
            f"Expected blast, got {output_h['condition_key']}"
        )
        # Score should be at least as high as Q-only
        assert output_h['all_scores']['blast'] >= q_blast - 0.01, (
            f"Fused blast ({output_h['all_scores']['blast']:.3f}) should be "
            f">= Q-only blast ({q_blast:.3f})"
        )

    def test_brown_spot_ml_agrees(self):
        """Brown spot Q + brown spot ML → brown spot wins."""
        base = _brown_spot_base()
        base['ml_probabilities'] = {
            'blast': 0.10, 'brown_spot': 0.75, 'bacterial_blight': 0.15
        }
        output = generate_output(base)
        assert output['condition_key'] == 'brown_spot'


# =============================================================================
# TEST 2: ML MILDLY DISAGREES → QUESTIONNAIRE STILL WINS
# =============================================================================

class TestMLMildDisagreement:
    """
    When ML mildly disagrees (ML score < 0.80 for a different condition),
    the questionnaire's dominant signal should still drive the final output.
    """

    def test_blast_q_dominant_ml_prefers_brown_spot_mildly(self):
        """Strong blast Q + mild brown spot ML → blast survives fusion."""
        base = _blast_base()
        base['ml_probabilities'] = {
            'blast': 0.30, 'brown_spot': 0.50, 'bacterial_blight': 0.20
        }
        output = generate_output(base)
        # Questionnaire blast is very strong (>= 0.80), so STEP 5 applies:
        # ML top (brown_spot at 0.50) is < 0.80, so Q dominates
        assert output['condition_key'] == 'blast', (
            f"Expected blast (strong Q dominance), got {output['condition_key']}"
        )

    def test_brown_spot_q_with_mild_blast_ml(self):
        """Moderate brown spot Q + mild blast ML → brown spot still wins."""
        base = _brown_spot_base()
        base['ml_probabilities'] = {
            'blast': 0.45, 'brown_spot': 0.30, 'bacterial_blight': 0.25
        }
        output = generate_output(base)
        # Brown spot Q is moderate, blast ML is moderate → fusion shouldn't flip
        assert output['condition_key'] == 'brown_spot', (
            f"Expected brown_spot, got {output['condition_key']}"
        )


# =============================================================================
# TEST 3: ML STRONGLY DISAGREES (≥0.80) → STEP 5 AMBIGUITY
# =============================================================================

class TestMLStrongDisagreement:
    """
    When Q score ≥ 0.80 AND ML ≥ 0.80 for a DIFFERENT condition,
    STEP 5 triggers and produces an ambiguous output.
    """

    def test_blast_q_vs_brown_spot_ml_ambiguity(self):
        """Blast Q ≥ 0.80 + brown spot ML ≥ 0.80 → ambiguous."""
        base = _blast_base()
        base['ml_probabilities'] = {
            'blast': 0.05, 'brown_spot': 0.85, 'bacterial_blight': 0.10
        }
        output = generate_output(base)

        # Need to check: if Q blast >= 0.80 AND ML brown_spot >= 0.80
        # → STEP 5 should fire ambiguity
        validated = validate_answers(base)
        q_result = compute_all_scores(validated)
        q_blast = q_result['scores']['blast']

        if q_blast >= 0.80:
            assert output['status'] == 'ambiguous', (
                f"Expected ambiguous (STEP 5 conflict), got {output['status']}. "
                f"Q blast={q_blast:.3f}, ML brown_spot=0.85"
            )
            # Ambiguous score should be conservative min(Q, ML)
            assert output['score'] <= 0.85 + 0.01, (
                f"Ambiguous score should be conservative, got {output['score']:.3f}"
            )

    def test_ambiguous_output_structure(self):
        """Ambiguous output must have ambiguous_between list and correct status."""
        base = _blast_base()
        base['ml_probabilities'] = {
            'blast': 0.05, 'brown_spot': 0.90, 'bacterial_blight': 0.05
        }
        output = generate_output(base)

        validated = validate_answers(base)
        q_result = compute_all_scores(validated)
        q_blast = q_result['scores']['blast']

        if q_blast >= 0.80:
            assert output.get('ambiguous_between') is not None, (
                "Ambiguous output should have an ambiguous_between list"
            )
            assert len(output['ambiguous_between']) == 2, (
                "ambiguous_between should list two competing conditions"
            )


# =============================================================================
# TEST 4: NON-BIOTIC OVERRIDE HOLDS DESPITE ML
# =============================================================================

class TestNonBioticOverrideHoldsWithML:
    """
    Non-biotic conditions (iron toxicity, N deficiency, salt toxicity)
    MUST override ML entirely. ML cannot flip a non-biotic diagnosis.
    """

    def test_iron_toxicity_overrides_blast_ml_095(self):
        """Iron toxicity Q + blast ML at 0.95 → iron toxicity wins (STEP 3)."""
        base = _iron_toxicity_base()
        base['ml_probabilities'] = {
            'blast': 0.95, 'brown_spot': 0.03, 'bacterial_blight': 0.02
        }
        output = generate_output(base)
        assert output['condition_key'] == 'iron_toxicity', (
            f"Non-biotic override failed! Expected iron_toxicity, got {output['condition_key']}"
        )

    def test_n_deficiency_overrides_ml(self):
        """N deficiency Q + brown spot ML at 0.90 → N deficiency wins."""
        base = {
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
            'ml_probabilities': {
                'blast': 0.05, 'brown_spot': 0.90, 'bacterial_blight': 0.05
            }
        }
        output = generate_output(base)
        assert output['condition_key'] == 'n_deficiency', (
            f"Non-biotic override failed! Expected n_deficiency, got {output['condition_key']}"
        )

    def test_salt_toxicity_overrides_ml(self):
        """Salt toxicity Q + bacterial blight ML at 0.85 → salt wins."""
        base = {
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
            'ml_probabilities': {
                'blast': 0.05, 'brown_spot': 0.10, 'bacterial_blight': 0.85
            }
        }
        output = generate_output(base)
        assert output['condition_key'] == 'salt_toxicity', (
            f"Non-biotic override failed! Expected salt_toxicity, got {output['condition_key']}"
        )


# =============================================================================
# TEST 5: PATHOGNOMONIC LOCK HOLDS DESPITE ML
# =============================================================================

class TestPathognomonicLockWithML:
    """
    Morning ooze ≥ 0.60 → bacterial_blight is locked (STEP 4).
    ML cannot override pathognomonic biological markers.
    """

    def test_morning_ooze_locks_bb_despite_blast_ml(self):
        """Morning ooze → BB lock holds even when ML says blast at 0.95."""
        base = _bacterial_blight_base()
        base['ml_probabilities'] = {
            'blast': 0.95, 'brown_spot': 0.03, 'bacterial_blight': 0.02
        }
        output = generate_output(base)
        assert output['condition_key'] == 'bacterial_blight', (
            f"Pathognomonic lock failed! Expected bacterial_blight, "
            f"got {output['condition_key']}. Morning ooze should lock BB."
        )

    def test_morning_ooze_locks_bb_despite_brown_spot_ml(self):
        """Morning ooze → BB lock holds when ML says brown_spot at 0.90."""
        base = _bacterial_blight_base()
        base['ml_probabilities'] = {
            'blast': 0.05, 'brown_spot': 0.90, 'bacterial_blight': 0.05
        }
        output = generate_output(base)
        assert output['condition_key'] == 'bacterial_blight', (
            f"Pathognomonic lock failed! Got {output['condition_key']}"
        )


# =============================================================================
# TEST 6: SAFE ML FUSION MATH (STEP 6)
# =============================================================================

class TestSafeMLFusionMath:
    """
    When Q score is moderate (< 0.80) and ML is provided,
    STEP 6 applies: fused = 0.60 * Q + 0.40 * ML for biotic conditions.
    """

    def test_fusion_formula_correct(self):
        """Verify the 60/40 fusion math on a moderate brown spot case."""
        base = _brown_spot_base()
        ml_probs = {'blast': 0.10, 'brown_spot': 0.70, 'bacterial_blight': 0.20}
        base['ml_probabilities'] = ml_probs

        # Get Q-only scores first
        validated = validate_answers({**base, 'ml_probabilities': None})
        q_result = compute_all_scores(validated)
        q_scores = q_result['scores']

        # Get hybrid output
        output = generate_output(base)

        # For biotic conditions, if Q < 0.80 (not STEP 5), fusion applies
        # Check the formula: fused = 0.60 * Q + 0.40 * ML
        for condition in ['blast', 'brown_spot', 'bacterial_blight']:
            q_val = q_scores[condition]
            ml_val = ml_probs.get(condition, 0.0)
            expected_fused = min(1.0, max(0.0,
                QUESTIONNAIRE_WEIGHT * q_val + ML_WEIGHT * ml_val
            ))

            # Only check if Q top < 0.80 (STEP 5 didn't grab it)
            biotic_q = {k: q_scores[k] for k in ['blast', 'brown_spot', 'bacterial_blight']}
            top_q = max(biotic_q.values())
            if top_q < 0.80:
                actual = output['all_scores'][condition]
                assert abs(actual - expected_fused) < 0.02, (
                    f"{condition}: expected fused ~{expected_fused:.3f}, "
                    f"got {actual:.3f} (Q={q_val:.3f}, ML={ml_val:.3f})"
                )

    def test_fusion_does_not_affect_non_biotic(self):
        """Non-biotic scores should NOT be changed by ML fusion."""
        base = _iron_toxicity_base()
        ml_probs = {'blast': 0.70, 'brown_spot': 0.20, 'bacterial_blight': 0.10}

        # Get Q-only non-biotic scores
        validated_no_ml = validate_answers({**base, 'ml_probabilities': None})
        q_result = compute_all_scores(validated_no_ml)
        q_iron = q_result['scores']['iron_toxicity']
        q_n_def = q_result['scores']['n_deficiency']
        q_salt = q_result['scores']['salt_toxicity']

        # Get hybrid output
        base['ml_probabilities'] = ml_probs
        output = generate_output(base)

        # Non-biotic scores must remain unchanged (allow rounding tolerance)
        assert abs(output['all_scores']['iron_toxicity'] - q_iron) < 0.01
        assert abs(output['all_scores']['n_deficiency'] - q_n_def) < 0.01
        assert abs(output['all_scores']['salt_toxicity'] - q_salt) < 0.01


# =============================================================================
# TEST 7: ML VALIDATION — GRACEFUL DEGRADATION
# =============================================================================

class TestMLValidationGracefulDegradation:
    """
    When ML probabilities are malformed, the validation layer should
    return None, causing the system to fall back to questionnaire-only.
    """

    def test_invalid_ml_keys_fallback(self):
        """Wrong keys in ml_probabilities → treated as no ML."""
        base = _blast_base()
        base['ml_probabilities'] = {
            'rice_blast': 0.80, 'leaf_spot': 0.10, 'blight': 0.10
        }
        output = generate_output(base)
        # Should still produce a valid output (Q-only fallback)
        assert output['status'] in {'assessed', 'ambiguous', 'uncertain', 'out_of_scope'}
        assert output['condition_key'] == 'blast', (
            f"Q-only fallback should still detect blast, got {output['condition_key']}"
        )

    def test_invalid_ml_values_fallback(self):
        """Negative values in ml_probabilities → treated as no ML."""
        base = _blast_base()
        base['ml_probabilities'] = {
            'blast': -0.50, 'brown_spot': 1.50, 'bacterial_blight': 0.00
        }
        output = generate_output(base)
        assert output['status'] in {'assessed', 'ambiguous', 'uncertain', 'out_of_scope'}

    def test_ml_not_dict_fallback(self):
        """Non-dict ml_probabilities → treated as no ML."""
        base = _blast_base()
        base['ml_probabilities'] = [0.80, 0.10, 0.10]
        output = generate_output(base)
        assert output['condition_key'] == 'blast'

    def test_ml_empty_dict_fallback(self):
        """Empty dict ml_probabilities → treated as no ML."""
        base = _blast_base()
        base['ml_probabilities'] = {}
        output = generate_output(base)
        assert output['condition_key'] == 'blast'

    def test_validate_ml_probabilities_good_input(self):
        """Good ML probabilities pass validation unchanged."""
        ml = {'blast': 0.70, 'brown_spot': 0.20, 'bacterial_blight': 0.10}
        result = validate_ml_probabilities(ml)
        assert result == ml

    def test_validate_ml_probabilities_wrong_keys(self):
        """Wrong keys → returns None."""
        ml = {'rice_blast': 0.70, 'leaf_spot': 0.20, 'blight': 0.10}
        result = validate_ml_probabilities(ml)
        assert result is None

    def test_validate_ml_probabilities_out_of_range(self):
        """Values outside [0, 1] → returns None."""
        ml = {'blast': 1.50, 'brown_spot': -0.30, 'bacterial_blight': 0.10}
        result = validate_ml_probabilities(ml)
        assert result is None

    def test_validate_ml_probabilities_none_passthrough(self):
        """None input → returns None (no ML)."""
        result = validate_ml_probabilities(None)
        assert result is None

    def test_validate_ml_probabilities_non_numeric(self):
        """String values → returns None."""
        ml = {'blast': 'high', 'brown_spot': 'low', 'bacterial_blight': 'none'}
        result = validate_ml_probabilities(ml)
        assert result is None


# =============================================================================
# TEST 8: COMPLETE HYBRID PIPELINE (END-TO-END)
# =============================================================================

class TestHybridEndToEnd:
    """
    Full end-to-end tests exercising the complete pipeline with ML data.
    """

    def test_moderate_q_with_agreeing_ml_upgrades_confidence(self):
        """Moderate Q score + agreeing ML should produce higher confidence."""
        base = _brown_spot_base()

        # Q-only → check baseline
        base_no_ml = {**base, 'ml_probabilities': None}
        output_q = generate_output(base_no_ml)

        # With agreeing ML
        base_ml = {**base, 'ml_probabilities': {
            'blast': 0.05, 'brown_spot': 0.80, 'bacterial_blight': 0.15
        }}
        output_h = generate_output(base_ml)

        assert output_h['condition_key'] == 'brown_spot'
        # Fused score should be >= Q-only (ML is boosting)
        assert output_h['all_scores']['brown_spot'] >= output_q['all_scores']['brown_spot'] - 0.01

    def test_output_structure_with_ml(self):
        """Hybrid output should have all required keys."""
        required_keys = {
            'status', 'primary_condition', 'condition_key',
            'confidence_label', 'confidence_level', 'score',
            'all_scores', 'recommendations', 'secondary_note',
            'warnings', 'disclaimer'
        }
        base = _blast_base()
        base['ml_probabilities'] = {
            'blast': 0.80, 'brown_spot': 0.10, 'bacterial_blight': 0.10
        }
        output = generate_output(base)
        missing = required_keys - set(output.keys())
        assert not missing, f"Output missing keys: {missing}"

    def test_all_scores_bounded_with_ml(self):
        """All fused scores must be in [0.0, 1.0]."""
        base = _blast_base()
        base['ml_probabilities'] = {
            'blast': 0.95, 'brown_spot': 0.03, 'bacterial_blight': 0.02
        }
        output = generate_output(base)
        for condition, score in output['all_scores'].items():
            assert 0.0 <= score <= 1.0, (
                f"{condition} score out of bounds: {score}"
            )
