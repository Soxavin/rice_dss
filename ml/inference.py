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
from typing import Dict, List, Optional

# CONDITIONAL TENSORFLOW IMPORT
# TensorFlow is a heavy dependency (~500MB). We make it optional so that:
#   - The DSS can run in questionnaire-only mode without TF installed
#   - Tests that don't need ML can run without TF
#   - The API server can start and serve /questionnaire without TF
# If TF is not available, RiceDSSInference.__init__() will raise ImportError.
try:
    import numpy as np
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# CLASS_NAMES = ['bacterial_blight', 'blast', 'brown_spot'] — the 3 DSS keys
# ALL_CLASS_NAMES = ['bacterial_blight', 'blast', 'brown_spot', 'healthy'] — 4 training classes
# DEFAULT_IMG_SIZE = 224 — MobileNetV2's expected input dimensions
from ml.dataset import CLASS_NAMES, ALL_CLASS_NAMES, DEFAULT_IMG_SIZE


# When the model predicts 'healthy' above this threshold,
# return uniform probabilities so the DSS relies on questionnaire only.
HEALTHY_DOMINANT_THRESHOLD = 0.60
HEALTHY_CLASS_NAME = 'healthy'

# Minimum confidence the model must have in its top class (across all 4 classes)
# for the image to be considered a valid leaf. Images below this threshold
# (e.g., random photos, diagrams, non-leaf objects) are rejected.
MIN_CONFIDENCE_THRESHOLD = 0.80


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

        # METADATA SIDECAR PATTERN
        # The training script saves a .meta.json file alongside the .keras model.
        # This file records: class_names (in the order the model was trained on),
        # img_size, and dss_class_names. We use this to correctly map the model's
        # output neurons to condition keys, avoiding hard-coded index assumptions.
        # Falls back to ALL_CLASS_NAMES from dataset.py if no metadata exists.
        meta_path = model_path.with_suffix('.meta.json')
        if meta_path.exists():
            with open(meta_path) as f:
                meta = json.load(f)
            self.all_class_names = meta['class_names']
            self.img_size = meta.get('img_size', img_size)
        else:
            self.all_class_names = ALL_CLASS_NAMES

        # 3-class DSS contract — only these keys are accepted by the DSS
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
        # decode_image handles JPEG, PNG, BMP, GIF automatically
        # channels=3 forces RGB (drops alpha channel if present)
        # expand_animations=False prevents GIF frames from adding a dimension
        image = tf.image.decode_image(raw, channels=3, expand_animations=False)
        # Resize to model's expected input (224x224 for MobileNetV2)
        image = tf.image.resize(image, [self.img_size, self.img_size])
        # Cast to uint8 — MobileNetV2's preprocess_input() expects [0, 255] integers
        image = tf.cast(image, tf.uint8)
        # Add batch dimension: (H, W, 3) → (1, H, W, 3) for model.predict()
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

    def _bridge_to_dss(self, raw_probs: "np.ndarray") -> Optional[Dict[str, float]]:
        """
        Converts 4-class raw softmax output to 3-key DSS-compatible dict.

        If max confidence < MIN_CONFIDENCE_THRESHOLD → None (not a leaf).
        If healthy probability >= HEALTHY_DOMINANT_THRESHOLD → uniform probs.
        Otherwise → drop healthy, renormalize disease probs to sum to 1.0.

        Args:
            raw_probs: Array of shape (num_classes,) from model softmax.

        Returns:
            dict or None: {blast, brown_spot, bacterial_blight} summing to ~1.0.
            Returns None if the image is not recognized as a rice leaf.
        """
        # Validate raw_probs shape and content before mapping
        try:
            if len(raw_probs) != len(self.all_class_names):
                print(f"[ML Inference] raw_probs length {len(raw_probs)} != expected {len(self.all_class_names)}")
                return None
        except TypeError:
            return None

        # Map model output neurons to class names
        # e.g., [0.05, 0.80, 0.10, 0.05] → {bacterial_blight: 0.05, blast: 0.80, ...}
        try:
            full_probs = {
                self.all_class_names[i]: float(raw_probs[i])
                for i in range(len(self.all_class_names))
            }
        except (ValueError, TypeError, IndexError):
            print("[ML Inference] Could not convert raw_probs to float dict")
            return None

        # Reject if any probability is NaN or Inf
        if any(np.isnan(v) or np.isinf(v) for v in full_probs.values()):
            print("[ML Inference] raw_probs contains NaN or Inf values")
            return None

        # OUT-OF-DISTRIBUTION GATE
        # If the model's top class confidence is below MIN_CONFIDENCE_THRESHOLD,
        # the image is likely not a rice leaf (e.g., a diagram, random photo).
        # Return None so the caller can handle it as "unrecognizable".
        max_prob = max(full_probs.values())
        if max_prob < MIN_CONFIDENCE_THRESHOLD:
            return None

        healthy_prob = full_probs.get(HEALTHY_CLASS_NAME, 0.0)

        # HEALTHY CLASS BRIDGING LOGIC
        # If the model thinks the leaf is healthy (>= 60%), we return uniform
        # probabilities (1/3 each). This means the ML signal is "neutral" —
        # it neither supports nor opposes any disease. The DSS will then
        # rely entirely on questionnaire evidence for its diagnosis.
        # Why not just return None? Because uniform probs still allow the
        # hybrid fusion to run (STEP 6) without crashing — they just
        # contribute no directional information.
        if healthy_prob >= HEALTHY_DOMINANT_THRESHOLD:
            return {
                'blast': 0.333,
                'brown_spot': 0.333,
                'bacterial_blight': 0.334,  # 0.334 to make sum exactly 1.0
            }

        # DROP HEALTHY + RENORMALIZE
        # Extract only the 3 disease probabilities, then scale them up so they
        # sum to 1.0. Example: if model output is {blast: 0.40, brown_spot: 0.30,
        # bacterial_blight: 0.10, healthy: 0.20}, we get:
        #   total = 0.80, then blast = 0.40/0.80 = 0.50, etc.
        disease_probs = {k: full_probs[k] for k in self.dss_class_names}
        total = sum(disease_probs.values())
        if total > 0:
            disease_probs = {k: v / total for k, v in disease_probs.items()}
        else:
            # Edge case: all disease probs are 0 — fall back to uniform
            disease_probs = {k: 1.0 / 3 for k in self.dss_class_names}

        return disease_probs

    def _predict_with_tta(self, image_tensor: "tf.Tensor", n_augments: int = 5) -> "np.ndarray":
        """
        Test-Time Augmentation: averages predictions over augmented versions.

        Applies horizontal flip, vertical flip, and small rotations to the
        input image, then averages all softmax outputs. This typically adds
        1-3% accuracy at the cost of ~5x inference time.

        Args:
            image_tensor: Preprocessed image tensor of shape (1, H, W, 3).
            n_augments: Number of augmented versions (default: 5).

        Returns:
            np.ndarray: Averaged softmax probabilities.
        """
        predictions = [self.model.predict(image_tensor, verbose=0)[0]]

        # Horizontal flip
        flipped_h = tf.image.flip_left_right(image_tensor)
        predictions.append(self.model.predict(flipped_h, verbose=0)[0])

        # Vertical flip
        flipped_v = tf.image.flip_up_down(image_tensor)
        predictions.append(self.model.predict(flipped_v, verbose=0)[0])

        if n_augments >= 4:
            # Small brightness adjustment
            bright = tf.image.adjust_brightness(image_tensor, 0.05)
            predictions.append(self.model.predict(bright, verbose=0)[0])

        if n_augments >= 5:
            # Small contrast adjustment
            contrast = tf.image.adjust_contrast(image_tensor, 1.1)
            predictions.append(self.model.predict(contrast, verbose=0)[0])

        # Filter out any predictions containing NaN before averaging
        valid = [p for p in predictions if not np.any(np.isnan(p))]
        if not valid:
            return predictions[0]  # Fall back to original if all NaN
        return np.mean(valid, axis=0)

    def predict_from_image(
        self, image_path: str, use_tta: bool = False
    ) -> Optional[Dict[str, float]]:
        """
        Runs inference on a leaf image and returns DSS-compatible probabilities.

        Args:
            image_path (str): Path to the leaf image.
            use_tta (bool): Enable test-time augmentation for higher accuracy.

        Returns:
            dict or None: {blast, brown_spot, bacterial_blight} summing to ~1.0.
            Returns None if inference fails.
        """
        try:
            image_tensor = self.preprocess_image(image_path)
            if use_tta:
                raw_probs = self._predict_with_tta(image_tensor)
            else:
                raw_probs = self.model.predict(image_tensor, verbose=0)[0]
            return self._bridge_to_dss(raw_probs)
        except Exception as e:
            print(f"[ML Inference] Inference failed: {e}")
            return None

    def predict_from_bytes(
        self, image_bytes: bytes, use_tta: bool = False
    ) -> Optional[Dict[str, float]]:
        """
        Runs inference on raw image bytes and returns DSS-compatible probabilities.

        Args:
            image_bytes (bytes): Raw image file bytes (JPEG/PNG).
            use_tta (bool): Enable test-time augmentation for higher accuracy.

        Returns:
            dict or None: {blast, brown_spot, bacterial_blight} summing to ~1.0.
            Returns None if inference fails.
        """
        try:
            image_tensor = self.preprocess_image_bytes(image_bytes)
            if use_tta:
                raw_probs = self._predict_with_tta(image_tensor)
            else:
                raw_probs = self.model.predict(image_tensor, verbose=0)[0]
            return self._bridge_to_dss(raw_probs)
        except Exception as e:
            print(f"[ML Inference] Inference from bytes failed: {e}")
            return None

    def predict_from_multiple_bytes(
        self, images: List[bytes], use_tta: bool = False
    ) -> Optional[Dict[str, float]]:
        """
        Runs inference on multiple images of the same leaf (e.g., different angles)
        and averages the probability vectors for a more robust prediction.

        Args:
            images: List of raw image bytes (JPEG/PNG). Max 5 images.
            use_tta: Enable test-time augmentation per image.

        Returns:
            dict or None: Averaged {blast, brown_spot, bacterial_blight} summing to ~1.0.
            Returns None if all images fail inference.
        """
        all_probs = []
        for image_bytes in images:
            probs = self.predict_from_bytes(image_bytes, use_tta=use_tta)
            if probs is not None:
                all_probs.append(probs)

        if not all_probs:
            return None

        # Average across all successful predictions
        keys = all_probs[0].keys()
        averaged = {
            k: sum(p[k] for p in all_probs) / len(all_probs)
            for k in keys
        }
        # Store individual predictions for disagreement checking
        self._last_individual_probs = all_probs
        return averaged

    def check_multi_image_agreement(self) -> Dict:
        """
        Checks whether the most recent multi-image predictions agree on the
        top predicted class. Call after predict_from_multiple_bytes().

        Returns:
            dict with keys:
                'agree' (bool): True if all images predict the same top class.
                'top_classes' (list[str]): Per-image top predicted class.
                'unique_classes' (set[str]): Distinct top classes across images.
        """
        individual = getattr(self, '_last_individual_probs', [])
        if not individual:
            return {'agree': True, 'top_classes': [], 'unique_classes': set()}

        top_classes = [max(p, key=p.get) for p in individual]
        unique = set(top_classes)
        return {
            'agree': len(unique) == 1,
            'top_classes': top_classes,
            'unique_classes': unique,
        }

    def get_gradcam(
        self, image_source, class_index: int = None
    ):
        """
        Generates a Grad-CAM heatmap overlay for a leaf image.

        Shows which regions of the leaf the model focused on when making
        its prediction — useful for visual explainability in the UI and API.

        Args:
            image_source: File path (str) or raw bytes.
            class_index: Target class index. None = use predicted class.

        Returns:
            PIL Image with heatmap overlay, or None if generation fails.
        """
        try:
            from ml.gradcam import get_gradcam_overlay
            return get_gradcam_overlay(
                self.model, image_source, self.img_size, class_index
            )
        except Exception as e:
            print(f"[ML Inference] Grad-CAM failed: {e}")
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
