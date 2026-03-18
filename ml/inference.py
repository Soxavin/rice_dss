# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ml/inference.py — ML Inference Wrapper
# -----------------------------------------------------------------------------
# PURPOSE:
#   Loads a trained 4-class model (blast, brown_spot, bacterial_blight, healthy)
#   and returns a 3-key probability dict compatible with the DSS.
#
# CONNECTION TO DSS:
#   The output of predict_from_image() is injected into raw_answers as:
#     raw_answers['ml_probabilities'] = {'blast': 0.x, 'brown_spot': 0.x, 'bacterial_blight': 0.x}
#   This is then consumed by generate_output() in the hybrid path (STEP 6).
#
# HEALTHY CLASS BRIDGING:
#   The model is trained on 4 classes including 'healthy'. In inference:
#   - If healthy probability >= HEALTHY_DOMINANT_THRESHOLD (0.60):
#     Return uniform 1/3 probs → DSS falls back to questionnaire-only.
#   - Otherwise: drop healthy, renormalize 3 disease probs to sum to 1.0.
#
# IMPORTANT:
#   - Output values must sum to ~1.0 (softmax probabilities)
#   - Output keys MUST be: 'blast', 'brown_spot', 'bacterial_blight'
#   - Do NOT include non-biotic conditions — they are handled by the questionnaire
# =============================================================================

import json
from pathlib import Path
from typing import Dict, Optional

try:
    import numpy as np
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

from ml.dataset import CLASS_NAMES, ALL_CLASS_NAMES, DEFAULT_IMG_SIZE


# When the model predicts 'healthy' above this threshold,
# return uniform probabilities so the DSS relies on questionnaire only.
HEALTHY_DOMINANT_THRESHOLD = 0.60
HEALTHY_CLASS_NAME = 'healthy'


class RiceDSSInference:
    """
    Inference wrapper for the trained Rice DSS ML model.

    Bridges the 4-class model output (blast, brown_spot, bacterial_blight,
    healthy) to the 3-key probability dict expected by the DSS.

    Usage:
        model = RiceDSSInference('models/rice_disease_model.keras')
        probs = model.predict_from_image('path/to/leaf.jpg')
        # probs = {'blast': 0.82, 'brown_spot': 0.12, 'bacterial_blight': 0.06}
    """

    def __init__(self, model_path: str, img_size: int = DEFAULT_IMG_SIZE):
        """
        Loads the trained model from disk.

        Args:
            model_path (str): Path to saved .keras model file.
            img_size (int): Image size the model was trained on. Default: 224.

        Raises:
            ImportError: If TensorFlow is not installed.
            FileNotFoundError: If model file does not exist at model_path.
        """
        if not TF_AVAILABLE:
            raise ImportError(
                "TensorFlow is required for ML inference. "
                "Install with: pip install tensorflow"
            )

        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at: {model_path}\n"
                f"Train a model first with: python -m ml.train --data_dir data/"
            )

        self.model = tf.keras.models.load_model(str(model_path))
        self.img_size = img_size

        # Load class names from metadata sidecar if available
        meta_path = model_path.with_suffix('.meta.json')
        if meta_path.exists():
            with open(meta_path) as f:
                meta = json.load(f)
            self.all_class_names = meta['class_names']
            self.img_size = meta.get('img_size', img_size)
        else:
            self.all_class_names = ALL_CLASS_NAMES

        # 3-class DSS contract
        self.dss_class_names = CLASS_NAMES

        print(f"[ML Inference] Model loaded from: {model_path}")
        print(f"[ML Inference] Training classes: {self.all_class_names}")
        print(f"[ML Inference] DSS classes: {self.dss_class_names}")

    def preprocess_image(self, image_path: str) -> "tf.Tensor":
        """
        Loads and preprocesses a single image for model input.

        Args:
            image_path (str): Path to the leaf image file.

        Returns:
            tf.Tensor: Preprocessed image tensor of shape (1, H, W, 3).
        """
        raw = tf.io.read_file(image_path)
        image = tf.image.decode_image(raw, channels=3, expand_animations=False)
        image = tf.image.resize(image, [self.img_size, self.img_size])
        image = tf.cast(image, tf.uint8)
        image = tf.expand_dims(image, axis=0)
        return image

    def preprocess_image_bytes(self, image_bytes: bytes) -> "tf.Tensor":
        """
        Preprocesses an image from raw bytes (e.g., from an upload).

        Args:
            image_bytes (bytes): Raw image file bytes.

        Returns:
            tf.Tensor: Preprocessed image tensor of shape (1, H, W, 3).
        """
        image = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
        image = tf.image.resize(image, [self.img_size, self.img_size])
        image = tf.cast(image, tf.uint8)
        image = tf.expand_dims(image, axis=0)
        return image

    def _bridge_to_dss(self, raw_probs: "np.ndarray") -> Dict[str, float]:
        """
        Converts 4-class raw softmax output to 3-key DSS-compatible dict.

        If healthy probability >= HEALTHY_DOMINANT_THRESHOLD → uniform probs.
        Otherwise → drop healthy, renormalize disease probs to sum to 1.0.

        Args:
            raw_probs: Array of shape (num_classes,) from model softmax.

        Returns:
            dict: {blast, brown_spot, bacterial_blight} summing to ~1.0.
        """
        # Build full probability dict
        full_probs = {
            self.all_class_names[i]: float(raw_probs[i])
            for i in range(len(self.all_class_names))
        }

        healthy_prob = full_probs.get(HEALTHY_CLASS_NAME, 0.0)

        # If model is confident the leaf is healthy, return uniform probs
        # so the DSS relies entirely on questionnaire evidence
        if healthy_prob >= HEALTHY_DOMINANT_THRESHOLD:
            return {
                'blast': 0.333,
                'brown_spot': 0.333,
                'bacterial_blight': 0.334,
            }

        # Extract 3 disease probs and renormalize to sum to 1.0
        disease_probs = {k: full_probs[k] for k in self.dss_class_names}
        total = sum(disease_probs.values())
        if total > 0:
            disease_probs = {k: v / total for k, v in disease_probs.items()}
        else:
            disease_probs = {k: 1.0 / 3 for k in self.dss_class_names}

        return disease_probs

    def predict_from_image(self, image_path: str) -> Optional[Dict[str, float]]:
        """
        Runs inference on a leaf image and returns DSS-compatible probabilities.

        Args:
            image_path (str): Path to the leaf image.

        Returns:
            dict or None: {blast, brown_spot, bacterial_blight} summing to ~1.0.
            Returns None if inference fails.
        """
        try:
            image_tensor = self.preprocess_image(image_path)
            predictions = self.model.predict(image_tensor, verbose=0)
            return self._bridge_to_dss(predictions[0])
        except Exception as e:
            print(f"[ML Inference] Inference failed: {e}")
            return None

    def predict_from_bytes(self, image_bytes: bytes) -> Optional[Dict[str, float]]:
        """
        Runs inference on raw image bytes and returns DSS-compatible probabilities.

        Args:
            image_bytes (bytes): Raw image file bytes (JPEG/PNG).

        Returns:
            dict or None: {blast, brown_spot, bacterial_blight} summing to ~1.0.
            Returns None if inference fails.
        """
        try:
            image_tensor = self.preprocess_image_bytes(image_bytes)
            predictions = self.model.predict(image_tensor, verbose=0)
            return self._bridge_to_dss(predictions[0])
        except Exception as e:
            print(f"[ML Inference] Inference from bytes failed: {e}")
            return None

    def get_raw_probabilities(self, image_path: str) -> Optional[Dict[str, float]]:
        """
        Returns raw 4-class probabilities without renormalization.
        Useful for debugging and evaluation.

        Args:
            image_path (str): Path to the leaf image.

        Returns:
            dict or None: All 4 classes with raw softmax values.
        """
        try:
            image_tensor = self.preprocess_image(image_path)
            predictions = self.model.predict(image_tensor, verbose=0)
            return {
                self.all_class_names[i]: float(predictions[0][i])
                for i in range(len(self.all_class_names))
            }
        except Exception as e:
            print(f"[ML Inference] Raw inference failed: {e}")
            return None


# =============================================================================
# PLACEHOLDER FOR PRE-TRAINED MODEL (BEFORE TRAINING)
# =============================================================================

def get_placeholder_probabilities() -> Dict[str, float]:
    """
    Returns uniform placeholder probabilities for testing the API
    before a real model is trained.

    DO NOT use in production — for development scaffolding only.

    Returns:
        dict: Uniform probabilities (1/3 each) across biotic classes.
    """
    return {
        'blast': 0.333,
        'brown_spot': 0.333,
        'bacterial_blight': 0.334
    }
