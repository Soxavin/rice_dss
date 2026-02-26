# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# tests/test_ml.py — ML Pipeline Unit Tests
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion — Phase 3)
#
# PURPOSE:
#   Validates the ML pipeline scaffold before a real model is trained.
#   Tests run without a trained model by using placeholder probabilities.
#
# WHAT IS TESTED:
#   1. Dataset class names match DSS biotic condition keys
#   2. Class index map returns correct format
#   3. Inference wrapper loads gracefully (no model yet → raises FileNotFoundError)
#   4. Placeholder probabilities return valid DSS-compatible output
#   5. Probabilities sum to approximately 1.0
#   6. All three biotic conditions are represented in inference output
#   7. Inference output keys match BIOTIC_CONDITIONS in output_builder
# =============================================================================

import os
import sys
import pytest
import tempfile
from pathlib import Path

# Ensure project root is on path when running directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ml.dataset import CLASS_NAMES, get_class_index_map
from ml.inference import RiceDSSInference, get_placeholder_probabilities
from dss.output_builder import BIOTIC_CONDITIONS


# =============================================================================
# DATASET TESTS
# =============================================================================

class TestDataset:
    """
    Tests for ml/dataset.py.

    These tests do NOT require TensorFlow to be installed.
    They verify the constants and structural contracts that the
    DSS system depends on for ML fusion.
    """

    def test_class_names_are_defined(self):
        """CLASS_NAMES must be a non-empty list."""
        assert isinstance(CLASS_NAMES, list)
        assert len(CLASS_NAMES) > 0

    def test_class_names_match_biotic_conditions(self):
        """
        Every class name must be a valid BIOTIC_CONDITIONS key.
        This ensures ML output can be directly fused with questionnaire scores.
        """
        for name in CLASS_NAMES:
            assert name in BIOTIC_CONDITIONS, (
                f"ML class '{name}' is not in BIOTIC_CONDITIONS {BIOTIC_CONDITIONS}. "
                f"The ML model must only classify biotic conditions."
            )

    def test_all_biotic_conditions_covered(self):
        """
        All three biotic conditions must have a corresponding ML class.
        Missing a class would silently give that condition a score of 0.
        """
        for condition in BIOTIC_CONDITIONS:
            assert condition in CLASS_NAMES, (
                f"BIOTIC_CONDITIONS has '{condition}' but CLASS_NAMES does not. "
                f"Update CLASS_NAMES in ml/dataset.py."
            )

    def test_class_index_map_format(self):
        """
        get_class_index_map() must return a dict mapping int indices to class name strings.
        Format: {0: 'bacterial_blight', 1: 'blast', 2: 'brown_spot'}
        This is the format expected by inference.py when parsing model output.
        """
        idx_map = get_class_index_map(CLASS_NAMES)
        assert isinstance(idx_map, dict), "Class index map must be a dict"
        assert len(idx_map) == len(CLASS_NAMES), (
            "Class index map must have one entry per class"
        )
        for idx, name in idx_map.items():
            assert isinstance(idx, int), f"Key '{idx}' must be an int"
            assert isinstance(name, str), f"Value '{name}' must be a string"

    def test_class_indices_are_unique(self):
        """Each index must map to a unique class name (no collision)."""
        idx_map = get_class_index_map(CLASS_NAMES)
        names = list(idx_map.values())
        assert len(names) == len(set(names)), (
            "Duplicate class names found in class index map"
        )

    def test_class_indices_are_contiguous(self):
        """Indices must be 0..N-1 (contiguous), matching model output shape."""
        idx_map = get_class_index_map(CLASS_NAMES)
        indices = sorted(idx_map.keys())
        expected = list(range(len(CLASS_NAMES)))
        assert indices == expected, (
            f"Class indices must be 0..{len(CLASS_NAMES)-1}, got {indices}"
        )


# =============================================================================
# INFERENCE WRAPPER TESTS (no model required)
# =============================================================================

class TestInference:
    """
    Tests for ml/inference.py.

    Phase 3 note: These tests exercise the wrapper interface WITHOUT a trained
    model. They use placeholder probabilities to verify that the output format
    is correct for use in generate_output() ML fusion logic.
    """

    def test_no_model_raises_on_init(self):
        """
        RiceDSSInference should raise FileNotFoundError (or similar) if the
        model file does not exist. This prevents silent failures during API startup.
        """
        fake_path = "/tmp/does_not_exist_rice_model.keras"
        with pytest.raises((FileNotFoundError, OSError, Exception)):
            RiceDSSInference(model_path=fake_path)

    def test_placeholder_probabilities_format(self):
        """
        get_placeholder_probabilities() must return a dict with all three
        biotic condition keys mapping to float values.
        """
        probs = get_placeholder_probabilities()
        assert isinstance(probs, dict), "Placeholder probs must be a dict"
        for cond in BIOTIC_CONDITIONS:
            assert cond in probs, (
                f"Placeholder probs missing key '{cond}'"
            )
            assert isinstance(probs[cond], float), (
                f"Placeholder prob for '{cond}' must be a float"
            )

    def test_placeholder_probabilities_sum_to_one(self):
        """
        ML probabilities (from softmax) must sum to approximately 1.0.
        A sum significantly != 1.0 indicates the model output is not normalised.
        """
        probs = get_placeholder_probabilities()
        total = sum(probs.values())
        assert abs(total - 1.0) < 0.01, (
            f"Placeholder probs sum to {total:.4f}, expected ~1.0. "
            f"Probabilities must be from a softmax layer."
        )

    def test_placeholder_probabilities_are_non_negative(self):
        """Probabilities cannot be negative."""
        probs = get_placeholder_probabilities()
        for cond, val in probs.items():
            assert val >= 0.0, f"Probability for '{cond}' is negative: {val}"

    def test_placeholder_probabilities_are_bounded(self):
        """All probabilities must be in [0, 1]."""
        probs = get_placeholder_probabilities()
        for cond, val in probs.items():
            assert 0.0 <= val <= 1.0, (
                f"Probability for '{cond}' is {val}, must be in [0, 1]"
            )

    def test_placeholder_keys_exactly_match_biotic(self):
        """
        Placeholder (and real) probabilities must have EXACTLY the biotic
        condition keys — no extra keys, no missing keys.
        Extra keys could cause KeyError in the hybrid fusion code.
        """
        probs = get_placeholder_probabilities()
        assert set(probs.keys()) == BIOTIC_CONDITIONS, (
            f"Placeholder keys {set(probs.keys())} != BIOTIC_CONDITIONS {BIOTIC_CONDITIONS}"
        )


# =============================================================================
# INTEGRATION: ML PROBABILITIES INTO GENERATE_OUTPUT
# =============================================================================

class TestMLDSSIntegration:
    """
    Tests that ML probabilities flow through the DSS correctly.

    These tests use known ml_probabilities injected directly into test answers,
    bypassing the image classifier. They verify the hybrid fusion logic
    in generate_output() respects the 60/40 weighting.
    """

    def _make_blast_answers(self, ml_probs=None):
        """
        Blast-leaning questionnaire with all required fields populated.
        Uses the same pattern as Case 01 (Classic Blast — Flowering Stage)
        from test_dss.py to guarantee a non-uncertain result.
        """
        return {
            'growth_stage':         'flowering',
            'symptoms':             ['diamond_lesions', 'dried_areas', 'brown_discoloration'],
            'symptom_location':     ['leaf_blade', 'panicle'],
            'symptom_origin':       'upper_leaves',
            'farmer_confidence':    'very_sure',
            'fertilizer_applied':   True,
            'fertilizer_amount':    'excessive',
            'fertilizer_type':      'high_nitrogen',
            'weather':              'alternating',
            'water_condition':      'intermittent',
            'spread_pattern':       'patches',
            'symptom_timing':       'around_flowering',
            'onset_speed':          'sudden',
            'previous_disease':     'yes_same',
            'previous_crop':        'rice_same',
            'soil_type':            'prateah_lang',
            'soil_cracking':        None,
            'additional_symptoms':  ['none'],
            'ml_probabilities':     ml_probs
        }

    def test_questionnaire_result_without_ml(self):
        """Without ml_probabilities, generate_output runs questionnaire-only mode."""
        from dss.decision import generate_output
        answers = self._make_blast_answers(ml_probs=None)
        output = generate_output(answers)
        # Must not crash and must contain required keys
        assert 'condition_key' in output
        assert 'score' in output
        assert isinstance(output['score'], float)
        assert output['condition_key'] == 'blast'

    def test_ml_probabilities_are_used_in_hybrid(self):
        """
        When ml_probabilities is provided and both Q and ML agree on a biotic
        condition, the hybrid output should produce that condition.
        """
        from dss.decision import generate_output
        # Force ML to agree with blast
        ml_probs = {'blast': 0.80, 'brown_spot': 0.12, 'bacterial_blight': 0.08}
        answers = self._make_blast_answers(ml_probs=ml_probs)
        output = generate_output(answers)
        # When both Q and ML agree on blast, result should be blast
        assert output['condition_key'] == 'blast'
        assert output['score'] > 0.60, (
            f"Hybrid blast score {output['score']:.3f} seems too low — "
            f"check QUESTIONNAIRE_WEIGHT / ML_WEIGHT in output_builder.py"
        )

    def test_non_biotic_overrides_ml_probabilities(self):
        """
        Non-biotic conditions MUST override ML probabilities.
        Iron toxicity signs + high blast ML → should still return iron_toxicity.

        Uses the same answer pattern as Case 04 (Iron Toxicity — Must Override
        Brown Spot) from test_dss.py, which is verified to produce iron_toxicity.
        ML probabilities are injected on top to verify the override still holds.
        """
        from dss.decision import generate_output

        # Mirrors Case 04 from test_dss.py — known iron_toxicity result
        iron_answers = {
            'growth_stage':         'tillering',
            'symptoms':             ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_location':     ['leaf_blade', 'leaf_sheath'],
            'symptom_origin':       'lower_leaves',
            'farmer_confidence':    'very_sure',
            'fertilizer_applied':   False,
            'fertilizer_amount':    None,
            'weather':              'heavy_rain',
            'water_condition':      'flooded_continuously',
            'spread_pattern':       'uniform',
            'symptom_timing':       'during_tillering',
            'onset_speed':          'gradual',
            'previous_disease':     'yes_same',
            'previous_crop':        'rice_same',
            'soil_type':            'kbal_po',
            'soil_cracking':        'no_cracks',
            'additional_symptoms':  ['purple_roots', 'stunted_growth'],
            # High blast ML score — non-biotic dominance must still win
            'ml_probabilities': {
                'blast': 0.92,
                'brown_spot': 0.05,
                'bacterial_blight': 0.03
            }
        }

        output = generate_output(iron_answers)
        assert output['condition_key'] == 'iron_toxicity', (
            f"Expected iron_toxicity to override ML blast (0.92), "
            f"got {output['condition_key']} (score={output['score']:.3f}). "
            f"Check NON_BIOTIC_CONDITIONS override in generate_output()."
        )
