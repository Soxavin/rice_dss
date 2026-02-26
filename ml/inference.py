# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ml/inference.py — ML Inference Wrapper
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion)
#
# PURPOSE:
#   Loads a trained model and runs inference on a leaf image.
#   Returns a probability dict compatible with generate_output() in dss/decision.py.
#
# CONNECTION TO DSS (from FYP.ipynb — Cell 18: ML Integration Helper):
#   The output of predict_from_image() is injected into raw_answers as:
#     raw_answers['ml_probabilities'] = {'blast': 0.x, 'brown_spot': 0.x, 'bacterial_blight': 0.x}
#   This is then consumed by generate_output() in the hybrid path (STEP 6).
#
# IMPORTANT:
#   - Values must sum to ~1.0 (softmax probabilities)
#   - Keys MUST be: 'blast', 'brown_spot', 'bacterial_blight'
#   - Do NOT include non-biotic conditions — they are handled by the questionnaire
#
# HOW TO USE (once a model is trained):
#   from ml.inference import RiceDSSInference
#   model = RiceDSSInference('models/rice_disease_model.keras')
#   probs = model.predict_from_image('path/to/leaf.jpg')
#   # probs = {'blast': 0.82, 'brown_spot': 0.12, 'bacterial_blight': 0.06}
#   raw_answers['ml_probabilities'] = probs
#   output = generate_output(raw_answers)
# =============================================================================

from pathlib import Path
from typing import Dict, Optional

try:
    import numpy as np
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

from ml.dataset import CLASS_NAMES, DEFAULT_IMG_SIZE


class RiceDSSInference:
    """
    Inference wrapper for the trained Rice DSS ML model.

    Loads a saved Keras model and provides predict_from_image()
    which returns a probability dict compatible with generate_output().

    Usage:
        model = RiceDSSInference('models/rice_disease_model.keras')
        probs = model.predict_from_image('path/to/leaf.jpg')

    Notes:
        - The model must be trained with ml/train.py
        - CLASS_NAMES order must match the training dataset order
        - probabilities returned always sum to 1.0
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
                f"Train a model first with: python ml/train.py --data_dir data/"
            )

        self.model = tf.keras.models.load_model(str(model_path))
        self.img_size = img_size

        # Map model output indices to DSS condition keys
        # CLASS_NAMES is sorted alphabetically: bacterial_blight, blast, brown_spot
        self.class_names = CLASS_NAMES

        print(f"[ML Inference] Model loaded from: {model_path}")
        print(f"[ML Inference] Classes: {self.class_names}")

    def preprocess_image(self, image_path: str) -> "tf.Tensor":
        """
        Loads and preprocesses a single image for model input.

        Preprocessing steps:
        1. Load JPEG/PNG from disk
        2. Resize to (img_size, img_size)
        3. Normalize to [0, 255] as uint8 — MobileNetV2 expects this
           (preprocess_input inside the model handles [-1, 1] normalization)
        4. Add batch dimension: (1, H, W, 3)

        Args:
            image_path (str): Path to the leaf image file.

        Returns:
            tf.Tensor: Preprocessed image tensor of shape (1, H, W, 3).
        """
        raw = tf.io.read_file(image_path)
        image = tf.image.decode_image(raw, channels=3, expand_animations=False)
        image = tf.image.resize(image, [self.img_size, self.img_size])
        image = tf.cast(image, tf.uint8)
        image = tf.expand_dims(image, axis=0)  # Add batch dimension
        return image

    def predict_from_image(self, image_path: str) -> Optional[Dict[str, float]]:
        """
        Runs inference on a leaf image and returns DSS-compatible probabilities.

        Args:
            image_path (str): Path to the leaf image.

        Returns:
            dict or None: {
                'blast': float,
                'brown_spot': float,
                'bacterial_blight': float
            }
            Values sum to 1.0 (softmax output).
            Returns None if inference fails.

        Example:
            {'blast': 0.82, 'brown_spot': 0.12, 'bacterial_blight': 0.06}
        """
        try:
            image_tensor = self.preprocess_image(image_path)
            predictions = self.model.predict(image_tensor, verbose=0)
            probabilities = predictions[0]  # Remove batch dimension

            # Map class indices to DSS condition keys
            result = {
                self.class_names[i]: float(probabilities[i])
                for i in range(len(self.class_names))
            }

            # Validate output keys match DSS expectations
            required_keys = {'blast', 'brown_spot', 'bacterial_blight'}
            if not required_keys.issubset(result.keys()):
                print(
                    f"[ML Inference] Warning: output keys {set(result.keys())} "
                    f"do not match required keys {required_keys}"
                )
                return None

            return result

        except Exception as e:
            print(f"[ML Inference] Inference failed: {e}")
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
