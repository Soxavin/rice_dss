# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# tests/test_gradcam.py — Grad-CAM Unit Tests
# -----------------------------------------------------------------------------
# PURPOSE:
#   Validates the Grad-CAM heatmap generation and overlay functions.
#   Tests that require TensorFlow are skipped in CI (no TF installed).
# =============================================================================

import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


# =============================================================================
# OVERLAY TESTS (no TF required — just numpy + PIL)
# =============================================================================

class TestOverlayGradcam:
    """Tests for the overlay_gradcam() function (numpy/PIL only)."""

    @pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL required")
    def test_overlay_returns_pil_image(self):
        """overlay_gradcam() must return a PIL Image."""
        from ml.gradcam import overlay_gradcam
        original = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        heatmap = np.random.rand(7, 7).astype(np.float32)
        result = overlay_gradcam(original, heatmap)
        assert isinstance(result, Image.Image)

    @pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL required")
    def test_overlay_correct_size(self):
        """Overlay image must match the original image dimensions."""
        from ml.gradcam import overlay_gradcam
        original = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        heatmap = np.random.rand(7, 7).astype(np.float32)
        result = overlay_gradcam(original, heatmap)
        assert result.size == (224, 224)

    @pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL required")
    def test_overlay_different_heatmap_sizes(self):
        """Overlay must work when heatmap size differs from image size."""
        from ml.gradcam import overlay_gradcam
        original = np.random.randint(0, 255, (300, 400, 3), dtype=np.uint8)
        heatmap = np.random.rand(14, 14).astype(np.float32)
        result = overlay_gradcam(original, heatmap)
        assert result.size == (400, 300)  # PIL uses (width, height)

    @pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL required")
    def test_overlay_alpha_blending(self):
        """With alpha=0, overlay should look like the original image."""
        from ml.gradcam import overlay_gradcam
        original = np.full((100, 100, 3), 128, dtype=np.uint8)
        heatmap = np.ones((10, 10), dtype=np.float32)
        result = overlay_gradcam(original, heatmap, alpha=0.0)
        result_np = np.array(result)
        # With alpha=0, result should be very close to original
        assert np.allclose(result_np, 128, atol=2)


# =============================================================================
# GRAD-CAM GENERATION TESTS (require TF)
# =============================================================================

@pytest.mark.skipif(not TF_AVAILABLE, reason="TensorFlow required")
class TestGradcamGeneration:
    """Tests for generate_gradcam() and _find_last_conv_layer()."""

    def _build_tiny_model(self):
        """Creates a minimal conv model for testing (no ImageNet download)."""
        inputs = tf.keras.Input(shape=(32, 32, 3))
        x = tf.keras.layers.Conv2D(8, 3, padding='same', activation='relu')(inputs)
        x = tf.keras.layers.Conv2D(16, 3, padding='same', activation='relu')(x)
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        outputs = tf.keras.layers.Dense(4, activation='softmax')(x)
        model = tf.keras.Model(inputs, outputs)
        return model

    def _build_transfer_model(self):
        """Creates a model mimicking the project's transfer learning structure."""
        # Simulate a backbone wrapped as a sublayer
        backbone_input = tf.keras.Input(shape=(32, 32, 3))
        x = tf.keras.layers.Conv2D(8, 3, padding='same', activation='relu')(backbone_input)
        x = tf.keras.layers.Conv2D(16, 3, padding='same', activation='relu')(x)
        backbone = tf.keras.Model(backbone_input, x, name='mock_backbone')
        backbone.trainable = False

        inputs = tf.keras.Input(shape=(32, 32, 3))
        x = backbone(inputs)
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        x = tf.keras.layers.Dense(32, activation='relu')(x)
        outputs = tf.keras.layers.Dense(4, activation='softmax')(x)
        return tf.keras.Model(inputs, outputs)

    def test_find_last_conv_layer_transfer_model(self):
        """_find_last_conv_layer() finds the correct layer in a transfer model."""
        from ml.gradcam import _find_last_conv_layer
        model = self._build_transfer_model()
        layer = _find_last_conv_layer(model)
        assert layer is not None
        assert isinstance(layer, tf.keras.layers.Conv2D)

    def test_find_last_conv_no_backbone(self):
        """_find_last_conv_layer() returns None for a model with no sublayer backbone."""
        from ml.gradcam import _find_last_conv_layer
        # A flat model with no keras.Model sublayer
        inputs = tf.keras.Input(shape=(32, 32, 3))
        x = tf.keras.layers.Flatten()(inputs)
        outputs = tf.keras.layers.Dense(4, activation='softmax')(x)
        model = tf.keras.Model(inputs, outputs)
        layer = _find_last_conv_layer(model)
        # No backbone sublayer → should return None
        assert layer is None

    def test_generate_gradcam_returns_heatmap(self):
        """generate_gradcam() must return a 2D numpy array."""
        from ml.gradcam import generate_gradcam
        model = self._build_transfer_model()
        dummy_image = tf.random.uniform((1, 32, 32, 3), 0, 255, dtype=tf.float32)
        heatmap = generate_gradcam(model, dummy_image)
        assert heatmap is not None
        assert isinstance(heatmap, np.ndarray)
        assert heatmap.ndim == 2

    def test_generate_gradcam_values_normalized(self):
        """Heatmap values must be in [0, 1]."""
        from ml.gradcam import generate_gradcam
        model = self._build_transfer_model()
        dummy_image = tf.random.uniform((1, 32, 32, 3), 0, 255, dtype=tf.float32)
        heatmap = generate_gradcam(model, dummy_image)
        assert heatmap is not None
        assert heatmap.min() >= 0.0
        assert heatmap.max() <= 1.0

    def test_generate_gradcam_with_explicit_class(self):
        """generate_gradcam() with explicit class_index should not crash."""
        from ml.gradcam import generate_gradcam
        model = self._build_transfer_model()
        dummy_image = tf.random.uniform((1, 32, 32, 3), 0, 255, dtype=tf.float32)
        heatmap = generate_gradcam(model, dummy_image, class_index=2)
        assert heatmap is not None
        assert isinstance(heatmap, np.ndarray)


# =============================================================================
# SCHEMA TESTS (no TF required)
# =============================================================================

class TestGradcamSchema:
    """Tests that the API schema includes the gradcam_base64 field."""

    def test_image_prediction_response_has_gradcam_field(self):
        """ImagePredictionResponse must have an optional gradcam_base64 field."""
        from api.schemas import ImagePredictionResponse
        fields = ImagePredictionResponse.model_fields
        assert 'gradcam_base64' in fields
        # Should be optional (default None)
        assert fields['gradcam_base64'].default is None
