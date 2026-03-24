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
import json
import pytest
import tempfile
from pathlib import Path

# Ensure project root is on path when running directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ml.dataset import CLASS_NAMES, ALL_CLASS_NAMES, get_class_index_map
from ml.inference import (
    RiceDSSInference, get_placeholder_probabilities,
    HEALTHY_DOMINANT_THRESHOLD, HEALTHY_CLASS_NAME
)
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


# =============================================================================
# TRAINING CLASS NAMES (4-class model)
# =============================================================================

class TestTrainingClassNames:
    """
    Tests for the 4-class training configuration (ALL_CLASS_NAMES).
    Ensures the training scope includes 'healthy' while the DSS contract
    (CLASS_NAMES) remains unchanged at 3 biotic classes.
    """

    def test_all_class_names_has_four_classes(self):
        """Training must use 4 classes: 3 diseases + healthy."""
        assert len(ALL_CLASS_NAMES) == 4

    def test_all_class_names_includes_healthy(self):
        """The 'healthy' class must be present for training."""
        assert HEALTHY_CLASS_NAME in ALL_CLASS_NAMES

    def test_all_biotic_classes_in_all_class_names(self):
        """Every DSS biotic condition must also appear in the training classes."""
        for cond in BIOTIC_CONDITIONS:
            assert cond in ALL_CLASS_NAMES, (
                f"BIOTIC_CONDITIONS has '{cond}' but ALL_CLASS_NAMES does not."
            )

    def test_dss_class_names_unchanged(self):
        """CLASS_NAMES (DSS contract) must remain at 3 biotic-only classes."""
        assert len(CLASS_NAMES) == 3
        assert HEALTHY_CLASS_NAME not in CLASS_NAMES

    def test_all_class_names_sorted(self):
        """ALL_CLASS_NAMES must be sorted (matches TF directory discovery order)."""
        assert ALL_CLASS_NAMES == sorted(ALL_CLASS_NAMES)


# =============================================================================
# HEALTHY CLASS BRIDGING LOGIC
# =============================================================================

class TestHealthyClassHandling:
    """
    Tests for the 4→3 class bridging logic in ml/inference.py.

    Uses a mock RiceDSSInference instance to test _bridge_to_dss()
    without requiring a trained model.
    """

    def _make_mock_inference(self):
        """Creates a minimal object with the bridging method and class names."""
        from unittest.mock import MagicMock
        obj = MagicMock(spec=RiceDSSInference)
        obj.all_class_names = ALL_CLASS_NAMES
        obj.dss_class_names = CLASS_NAMES
        # Bind the real method
        obj._bridge_to_dss = RiceDSSInference._bridge_to_dss.__get__(obj)
        return obj

    def test_healthy_dominant_returns_uniform_probs(self):
        """When healthy > threshold, inference should return uniform 1/3 probs."""
        import numpy as np
        obj = self._make_mock_inference()
        # bacterial_blight=0.05, blast=0.05, brown_spot=0.05, healthy=0.85
        raw = np.array([0.05, 0.05, 0.05, 0.85])
        result = obj._bridge_to_dss(raw)
        assert abs(result['blast'] - 0.333) < 0.01
        assert abs(result['brown_spot'] - 0.333) < 0.01
        assert abs(result['bacterial_blight'] - 0.334) < 0.01

    def test_disease_detected_renormalizes_probs(self):
        """When healthy < threshold, disease probs are renormalized to sum to 1.0."""
        import numpy as np
        obj = self._make_mock_inference()
        # bacterial_blight=0.05, blast=0.70, brown_spot=0.15, healthy=0.10
        raw = np.array([0.05, 0.70, 0.15, 0.10])
        result = obj._bridge_to_dss(raw)
        # After dropping healthy (0.10) and renormalizing 0.90 total:
        assert abs(result['blast'] - 0.70 / 0.90) < 0.01
        assert abs(result['brown_spot'] - 0.15 / 0.90) < 0.01
        assert abs(result['bacterial_blight'] - 0.05 / 0.90) < 0.01

    def test_renormalized_probs_sum_to_one(self):
        """Renormalized output probs must sum to ~1.0."""
        import numpy as np
        obj = self._make_mock_inference()
        raw = np.array([0.10, 0.60, 0.20, 0.10])
        result = obj._bridge_to_dss(raw)
        total = sum(result.values())
        assert abs(total - 1.0) < 0.01, f"Probs sum to {total}, expected ~1.0"

    def test_renormalized_probs_have_exactly_three_keys(self):
        """Output must have exactly {blast, brown_spot, bacterial_blight}."""
        import numpy as np
        obj = self._make_mock_inference()
        raw = np.array([0.10, 0.60, 0.20, 0.10])
        result = obj._bridge_to_dss(raw)
        assert set(result.keys()) == BIOTIC_CONDITIONS

    def test_healthy_at_threshold_returns_uniform(self):
        """Healthy probability exactly at threshold should return uniform."""
        import numpy as np
        obj = self._make_mock_inference()
        raw = np.array([0.10, 0.15, 0.15, HEALTHY_DOMINANT_THRESHOLD])
        result = obj._bridge_to_dss(raw)
        assert abs(result['blast'] - 0.333) < 0.01

    def test_healthy_just_below_threshold_renormalizes(self):
        """Healthy probability just below threshold should renormalize."""
        import numpy as np
        obj = self._make_mock_inference()
        healthy_val = HEALTHY_DOMINANT_THRESHOLD - 0.01
        remainder = 1.0 - healthy_val
        raw = np.array([remainder / 3, remainder / 3, remainder / 3, healthy_val])
        result = obj._bridge_to_dss(raw)
        # Should NOT be uniform — should be renormalized
        total = sum(result.values())
        assert abs(total - 1.0) < 0.01
        assert set(result.keys()) == BIOTIC_CONDITIONS

    def test_low_confidence_returns_none(self):
        """Images with no class above MIN_CONFIDENCE_THRESHOLD are rejected as non-leaf."""
        import numpy as np
        obj = self._make_mock_inference()
        # All classes below threshold — model is confused (not a leaf)
        raw = np.array([0.25, 0.25, 0.25, 0.25])
        result = obj._bridge_to_dss(raw)
        assert result is None

    def test_confidence_above_threshold_passes(self):
        """Images with at least one class above threshold should produce results."""
        import numpy as np
        obj = self._make_mock_inference()
        # Blast clearly dominant — valid leaf image
        raw = np.array([0.05, 0.80, 0.10, 0.05])
        result = obj._bridge_to_dss(raw)
        assert result is not None
        assert 'blast' in result


# =============================================================================
# MULTI-ARCHITECTURE SUPPORT
# =============================================================================

class TestMultiArchitecture:
    """
    Tests for the multi-backbone support in ml/train.py.
    These tests verify the _get_backbone() helper and build_model() contracts
    without requiring a full training run.
    """

    def test_supported_backbones_list(self):
        """SUPPORTED_BACKBONES must contain at least mobilenetv2."""
        from ml.train import SUPPORTED_BACKBONES
        assert 'mobilenetv2' in SUPPORTED_BACKBONES
        assert 'efficientnetv2b0' in SUPPORTED_BACKBONES

    def test_default_backbone_is_mobilenetv2(self):
        """Default backbone must be mobilenetv2 for backwards compatibility."""
        from ml.train import DEFAULT_BACKBONE
        assert DEFAULT_BACKBONE == 'mobilenetv2'

    @pytest.mark.skipif(
        not os.environ.get('RUN_TF_TESTS'),
        reason="TF tests disabled (set RUN_TF_TESTS=1 to enable)"
    )
    def test_get_backbone_mobilenetv2(self):
        """_get_backbone('mobilenetv2') returns a valid model and preprocess fn."""
        from ml.train import _get_backbone
        base_model, preprocess_fn = _get_backbone('mobilenetv2', 224)
        assert base_model is not None
        assert callable(preprocess_fn)

    @pytest.mark.skipif(
        not os.environ.get('RUN_TF_TESTS'),
        reason="TF tests disabled (set RUN_TF_TESTS=1 to enable)"
    )
    def test_get_backbone_efficientnetv2b0(self):
        """_get_backbone('efficientnetv2b0') returns a valid model and preprocess fn."""
        from ml.train import _get_backbone
        base_model, preprocess_fn = _get_backbone('efficientnetv2b0', 224)
        assert base_model is not None
        assert callable(preprocess_fn)

    def test_get_backbone_invalid_raises(self):
        """_get_backbone() with unsupported name must raise ValueError."""
        from ml.train import _get_backbone
        with pytest.raises(ValueError, match="Unsupported backbone"):
            _get_backbone('resnet50', 224)

    def test_label_smoothing_parameter_accepted(self):
        """build_model() must accept label_smoothing without crashing."""
        from ml.train import build_model
        # Just verify the signature accepts the parameter — actual model
        # building requires TF, tested separately with RUN_TF_TESTS=1
        import inspect
        sig = inspect.signature(build_model)
        assert 'label_smoothing' in sig.parameters
        assert 'backbone' in sig.parameters
        assert 'head_units' in sig.parameters
        assert 'dropout' in sig.parameters


# =============================================================================
# EXPERIMENT TRACKING
# =============================================================================

class TestExperimentTracking:
    """
    Tests for ml/experiment.py.
    Verifies experiment snapshot saving and comparison.
    """

    def test_save_experiment_creates_directory(self):
        """save_experiment() must create a timestamped directory with config.json."""
        from ml.experiment import save_experiment

        with tempfile.TemporaryDirectory() as tmpdir:
            # Create mock model and eval files
            model_path = Path(tmpdir) / "test_model.keras"
            model_path.write_text("mock model")
            meta_path = model_path.with_suffix(".meta.json")
            meta_path.write_text('{"class_names": ["a", "b"]}')
            eval_dir = Path(tmpdir) / "evaluation"
            eval_dir.mkdir()
            (eval_dir / "report.txt").write_text("mock report")

            # Monkey-patch EXPERIMENTS_DIR to use temp directory
            import ml.experiment as exp_mod
            original_dir = exp_mod.EXPERIMENTS_DIR
            exp_mod.EXPERIMENTS_DIR = Path(tmpdir) / "experiments"
            try:
                result = save_experiment(
                    experiment_name="test_run",
                    config={"backbone": "mobilenetv2", "best_val_accuracy": 0.88},
                    model_path=model_path,
                    eval_dir=eval_dir,
                )
                assert result.exists()
                assert (result / "config.json").exists()
                # Verify config content
                with open(result / "config.json") as f:
                    config = json.load(f)
                assert config["backbone"] == "mobilenetv2"
                assert config["experiment_name"] == "test_run"
                assert config["best_val_accuracy"] == 0.88
                # Verify model and eval files copied
                assert (result / "test_model.keras").exists()
                assert (result / "test_model.meta.json").exists()
                assert (result / "report.txt").exists()
            finally:
                exp_mod.EXPERIMENTS_DIR = original_dir

    def test_save_experiment_with_missing_model(self):
        """save_experiment() should not crash if model file doesn't exist."""
        from ml.experiment import save_experiment

        with tempfile.TemporaryDirectory() as tmpdir:
            model_path = Path(tmpdir) / "nonexistent.keras"
            eval_dir = Path(tmpdir) / "evaluation"
            eval_dir.mkdir()

            import ml.experiment as exp_mod
            original_dir = exp_mod.EXPERIMENTS_DIR
            exp_mod.EXPERIMENTS_DIR = Path(tmpdir) / "experiments"
            try:
                result = save_experiment(
                    experiment_name="no_model",
                    config={"backbone": "mobilenetv2"},
                    model_path=model_path,
                    eval_dir=eval_dir,
                )
                assert result.exists()
                assert (result / "config.json").exists()
                # Model should NOT be copied (doesn't exist)
                assert not (result / "nonexistent.keras").exists()
            finally:
                exp_mod.EXPERIMENTS_DIR = original_dir

    def test_metadata_includes_backbone(self):
        """Training metadata (.meta.json) must include the backbone field."""
        # Verify the train() function's metadata dict includes 'backbone'
        # by checking the train function signature
        from ml.train import train
        import inspect
        sig = inspect.signature(train)
        assert 'backbone' in sig.parameters
        assert 'experiment_name' in sig.parameters


# =============================================================================
# MULTI-IMAGE INFERENCE TESTS
# =============================================================================

class TestMultiImageInference:
    """
    Tests for predict_from_multiple_bytes() in ml/inference.py.
    Uses mocking to test the averaging logic without a trained model.
    """

    def _make_mock_inference(self):
        """Creates a mock inference object with predict_from_bytes and predict_from_multiple_bytes."""
        from unittest.mock import MagicMock
        obj = MagicMock(spec=RiceDSSInference)
        obj.all_class_names = ALL_CLASS_NAMES
        obj.dss_class_names = CLASS_NAMES
        obj.predict_from_multiple_bytes = RiceDSSInference.predict_from_multiple_bytes.__get__(obj)
        return obj

    def test_averages_two_predictions(self):
        """Two images should produce averaged probabilities."""
        from unittest.mock import MagicMock
        obj = self._make_mock_inference()
        obj.predict_from_bytes = MagicMock(side_effect=[
            {'blast': 0.80, 'brown_spot': 0.10, 'bacterial_blight': 0.10},
            {'blast': 0.60, 'brown_spot': 0.30, 'bacterial_blight': 0.10},
        ])
        result = obj.predict_from_multiple_bytes([b'img1', b'img2'])
        assert result is not None
        assert abs(result['blast'] - 0.70) < 0.001
        assert abs(result['brown_spot'] - 0.20) < 0.001
        assert abs(result['bacterial_blight'] - 0.10) < 0.001

    def test_averages_three_predictions(self):
        """Three images should produce averaged probabilities."""
        from unittest.mock import MagicMock
        obj = self._make_mock_inference()
        obj.predict_from_bytes = MagicMock(side_effect=[
            {'blast': 0.90, 'brown_spot': 0.05, 'bacterial_blight': 0.05},
            {'blast': 0.60, 'brown_spot': 0.20, 'bacterial_blight': 0.20},
            {'blast': 0.30, 'brown_spot': 0.50, 'bacterial_blight': 0.20},
        ])
        result = obj.predict_from_multiple_bytes([b'img1', b'img2', b'img3'])
        assert result is not None
        assert abs(result['blast'] - 0.60) < 0.001
        assert abs(result['brown_spot'] - 0.25) < 0.001
        assert abs(result['bacterial_blight'] - 0.15) < 0.001

    def test_skips_failed_images(self):
        """If one image fails, result is based on the successful ones."""
        from unittest.mock import MagicMock
        obj = self._make_mock_inference()
        obj.predict_from_bytes = MagicMock(side_effect=[
            {'blast': 0.80, 'brown_spot': 0.10, 'bacterial_blight': 0.10},
            None,  # failed image
            {'blast': 0.60, 'brown_spot': 0.30, 'bacterial_blight': 0.10},
        ])
        result = obj.predict_from_multiple_bytes([b'img1', b'img2', b'img3'])
        assert result is not None
        assert abs(result['blast'] - 0.70) < 0.001

    def test_all_images_fail_returns_none(self):
        """If all images fail inference, should return None."""
        from unittest.mock import MagicMock
        obj = self._make_mock_inference()
        obj.predict_from_bytes = MagicMock(return_value=None)
        result = obj.predict_from_multiple_bytes([b'img1', b'img2'])
        assert result is None

    def test_result_has_exactly_three_keys(self):
        """Averaged output must have exactly {blast, brown_spot, bacterial_blight}."""
        from unittest.mock import MagicMock
        obj = self._make_mock_inference()
        obj.predict_from_bytes = MagicMock(return_value={
            'blast': 0.50, 'brown_spot': 0.30, 'bacterial_blight': 0.20,
        })
        result = obj.predict_from_multiple_bytes([b'img1', b'img2'])
        assert set(result.keys()) == BIOTIC_CONDITIONS

    def test_result_sums_to_one(self):
        """Averaged probabilities should sum to ~1.0."""
        from unittest.mock import MagicMock
        obj = self._make_mock_inference()
        obj.predict_from_bytes = MagicMock(side_effect=[
            {'blast': 0.70, 'brown_spot': 0.20, 'bacterial_blight': 0.10},
            {'blast': 0.50, 'brown_spot': 0.30, 'bacterial_blight': 0.20},
        ])
        result = obj.predict_from_multiple_bytes([b'img1', b'img2'])
        total = sum(result.values())
        assert abs(total - 1.0) < 0.01, f"Probs sum to {total}, expected ~1.0"
