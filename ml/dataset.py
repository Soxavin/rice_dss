# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ml/dataset.py — Dataset Loader
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion)
#
# PURPOSE:
#   Loads and preprocesses the rice disease image dataset for training.
#   Keeps data loading logic separate from training logic (ml/train.py).
#
# EXPECTED DATASET STRUCTURE:
#   data/
#   ├── blast/
#   │   ├── img001.jpg
#   │   └── ...
#   ├── brown_spot/
#   │   ├── img001.jpg
#   │   └── ...
#   └── bacterial_blight/
#       ├── img001.jpg
#       └── ...
#
# IMPORTANT:
#   The three class labels MUST match the biotic condition keys used by
#   the DSS scoring engine: 'blast', 'brown_spot', 'bacterial_blight'.
#   Do NOT rename the classes — they are referenced in dss/output_builder.py.
#
# USAGE:
#   from ml.dataset import load_dataset
#   train_ds, val_ds, class_names = load_dataset('data/', img_size=224)
# =============================================================================

import os
from pathlib import Path
from typing import Tuple, List

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


# The three biotic disease classes supported by the DSS.
# These MUST match the keys in BIOTIC_CONDITIONS in dss/output_builder.py.
CLASS_NAMES: List[str] = ['bacterial_blight', 'blast', 'brown_spot']

# All four classes used for model training (includes 'healthy').
# The inference layer (ml/inference.py) bridges 4-class output → 3-key DSS dict.
ALL_CLASS_NAMES: List[str] = ['bacterial_blight', 'blast', 'brown_spot', 'healthy']

# Default image dimensions for model input
DEFAULT_IMG_SIZE: int = 224
DEFAULT_BATCH_SIZE: int = 32

# Train/validation split ratio
VALIDATION_SPLIT: float = 0.20


def load_dataset(
    data_dir: str,
    img_size: int = DEFAULT_IMG_SIZE,
    batch_size: int = DEFAULT_BATCH_SIZE,
    seed: int = 42
) -> Tuple:
    """
    Loads the rice disease image dataset from a directory structure.
    Uses TensorFlow's image_dataset_from_directory for efficient loading.

    Args:
        data_dir (str): Path to the dataset root directory.
                        Expected subfolders: blast/, brown_spot/, bacterial_blight/
        img_size (int): Image dimensions (height = width). Default: 224.
        batch_size (int): Batch size for training. Default: 32.
        seed (int): Random seed for reproducibility. Default: 42.

    Returns:
        Tuple: (train_dataset, validation_dataset, class_names)
            - train_dataset: tf.data.Dataset for training
            - validation_dataset: tf.data.Dataset for validation
            - class_names: list of class name strings

    Raises:
        ImportError: If TensorFlow is not installed.
        FileNotFoundError: If data_dir does not exist.
    """
    if not TF_AVAILABLE:
        raise ImportError(
            "TensorFlow is required for the ML pipeline. "
            "Install it with: pip install tensorflow"
        )

    data_path = Path(data_dir)
    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset directory not found: {data_dir}\n"
            f"Expected structure: {data_dir}/blast/, {data_dir}/brown_spot/, "
            f"{data_dir}/bacterial_blight/"
        )

    # Load training split
    train_ds = tf.keras.utils.image_dataset_from_directory(
        data_path,
        validation_split=VALIDATION_SPLIT,
        subset='training',
        seed=seed,
        image_size=(img_size, img_size),
        batch_size=batch_size,
        label_mode='categorical'  # one-hot encoding for softmax output
    )

    # Load validation split
    val_ds = tf.keras.utils.image_dataset_from_directory(
        data_path,
        validation_split=VALIDATION_SPLIT,
        subset='validation',
        seed=seed,
        image_size=(img_size, img_size),
        batch_size=batch_size,
        label_mode='categorical'
    )

    # Infer class names from directory structure
    class_names = sorted([
        d.name for d in data_path.iterdir()
        if d.is_dir() and not d.name.startswith('.')
    ])

    # Performance optimization: cache and prefetch
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, class_names


def build_augmentation_layer():
    """
    Returns a Sequential data augmentation layer for training.

    Applied inside the model graph so it is automatically disabled
    during model.predict() and model.evaluate().

    Augmentations chosen for field photography of rice leaves:
    - Flips: leaf orientation is arbitrary
    - Rotation: farmers photograph at various angles
    - Zoom: varying distances from the leaf
    - Brightness/Contrast: outdoor lighting varies
    """
    if not TF_AVAILABLE:
        raise ImportError("TensorFlow is required for augmentation layers.")

    return tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal_and_vertical"),
        tf.keras.layers.RandomRotation(0.2),
        tf.keras.layers.RandomZoom(0.15),
        tf.keras.layers.RandomTranslation(0.1, 0.1),  # ±10% shift — improves position invariance
        tf.keras.layers.RandomBrightness(0.1),
        tf.keras.layers.RandomContrast(0.1),
    ], name="data_augmentation")


def get_class_index_map(class_names: List[str]) -> dict:
    """
    Returns a mapping from class index (int) to DSS condition key (str).

    This ensures the ML model's numerical output maps to the correct
    condition keys expected by dss/output_builder.py.

    Args:
        class_names (list): Ordered list of class names from dataset loader.

    Returns:
        dict: {0: 'bacterial_blight', 1: 'blast', 2: 'brown_spot'} (example)
    """
    return {i: name for i, name in enumerate(class_names)}
