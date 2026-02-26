# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ml/train.py — Model Training Script
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion)
#
# PURPOSE:
#   Trains a CNN image classifier on the rice disease dataset.
#   Uses transfer learning (MobileNetV2) as a lightweight baseline
#   suitable for edge deployment.
#
# IMPORTANT:
#   The model is trained ONLY on the three biotic disease classes:
#     - blast
#     - brown_spot
#     - bacterial_blight
#   Non-biotic stresses (iron toxicity, N deficiency, salt toxicity)
#   are NOT learnable from leaf images alone — they are handled by
#   the questionnaire engine in dss/scoring.py.
#
# OUTPUT:
#   Saved model artifact: models/rice_disease_model.keras
#   This file is loaded by ml/inference.py at runtime.
#
# HOW TO RUN:
#   python ml/train.py --data_dir data/ --epochs 20
#   python ml/train.py --data_dir data/ --epochs 20 --img_size 224
# =============================================================================

import argparse
import os
from pathlib import Path

try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

from ml.dataset import load_dataset, CLASS_NAMES


# =============================================================================
# TRAINING CONFIGURATION
# =============================================================================

# Default hyperparameters — adjust via CLI arguments
DEFAULT_EPOCHS = 20
DEFAULT_IMG_SIZE = 224
DEFAULT_BATCH_SIZE = 32
DEFAULT_LEARNING_RATE = 1e-4

# Model save path
MODEL_SAVE_PATH = Path("models/rice_disease_model.keras")


def build_model(num_classes: int, img_size: int = DEFAULT_IMG_SIZE) -> "keras.Model":
    """
    Builds a MobileNetV2-based transfer learning model.

    Architecture:
    - MobileNetV2 backbone (pretrained on ImageNet, frozen)
    - Global average pooling
    - Dense(128, relu) + Dropout(0.3)
    - Dense(num_classes, softmax)

    MobileNetV2 is chosen because:
    - Lightweight for edge/mobile deployment
    - Pretrained features transfer well to leaf disease tasks
    - Small enough to retrain on limited agricultural datasets

    Args:
        num_classes (int): Number of output classes (3 for this system).
        img_size (int): Input image dimensions.

    Returns:
        keras.Model: Compiled model ready for training.
    """
    # Load MobileNetV2 backbone with pretrained ImageNet weights
    # include_top=False removes the original classification head
    base_model = keras.applications.MobileNetV2(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights='imagenet'
    )
    # Freeze base model — only train the classification head initially
    base_model.trainable = False

    # Build classification head
    inputs = keras.Input(shape=(img_size, img_size, 3))

    # Normalize pixel values to [-1, 1] as expected by MobileNetV2
    x = keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base_model(x, training=False)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dense(128, activation='relu')(x)
    x = keras.layers.Dropout(0.3)(x)  # Reduces overfitting on small datasets
    outputs = keras.layers.Dense(num_classes, activation='softmax')(x)

    model = keras.Model(inputs, outputs)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=DEFAULT_LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model


def train(
    data_dir: str,
    epochs: int = DEFAULT_EPOCHS,
    img_size: int = DEFAULT_IMG_SIZE,
    batch_size: int = DEFAULT_BATCH_SIZE
) -> None:
    """
    Runs the full training pipeline.

    Steps:
    1. Load dataset from data_dir
    2. Build MobileNetV2 model
    3. Train for specified epochs
    4. Save model artifact to models/

    Args:
        data_dir (str): Path to dataset root (with class subdirectories).
        epochs (int): Number of training epochs.
        img_size (int): Input image size.
        batch_size (int): Training batch size.
    """
    if not TF_AVAILABLE:
        raise ImportError(
            "TensorFlow is required. Install with: pip install tensorflow"
        )

    print("=" * 60)
    print("RICE DSS — ML TRAINING PIPELINE")
    print("=" * 60)

    # Step 1: Load dataset
    print(f"\nLoading dataset from: {data_dir}")
    train_ds, val_ds, class_names = load_dataset(data_dir, img_size, batch_size)
    print(f"Classes found: {class_names}")
    print(f"Expected:      {CLASS_NAMES}")

    # Validate class alignment with DSS condition keys
    if sorted(class_names) != sorted(CLASS_NAMES):
        print(f"\n⚠️  WARNING: Dataset classes {class_names} do not match "
              f"expected DSS classes {CLASS_NAMES}.")
        print("   Inference wrapper may produce incorrect condition keys.")

    # Step 2: Build model
    print(f"\nBuilding MobileNetV2 model ({len(class_names)} classes)...")
    model = build_model(num_classes=len(class_names), img_size=img_size)
    model.summary()

    # Step 3: Callbacks
    callbacks = [
        # Save best model checkpoint (by validation accuracy)
        keras.callbacks.ModelCheckpoint(
            filepath=str(MODEL_SAVE_PATH),
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        # Stop early if validation loss stops improving
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        # Reduce learning rate on plateau
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            verbose=1
        )
    ]

    # Create models directory if it doesn't exist
    MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Step 4: Train
    print(f"\nTraining for up to {epochs} epochs...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks
    )

    # Summary
    best_val_acc = max(history.history.get('val_accuracy', [0]))
    print(f"\n{'='*60}")
    print(f"Training complete.")
    print(f"Best validation accuracy: {best_val_acc:.4f}")
    print(f"Model saved to: {MODEL_SAVE_PATH}")
    print(f"{'='*60}")


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train Rice DSS ML model"
    )
    parser.add_argument(
        '--data_dir', type=str, default='data/',
        help='Path to dataset directory (default: data/)'
    )
    parser.add_argument(
        '--epochs', type=int, default=DEFAULT_EPOCHS,
        help=f'Number of training epochs (default: {DEFAULT_EPOCHS})'
    )
    parser.add_argument(
        '--img_size', type=int, default=DEFAULT_IMG_SIZE,
        help=f'Input image size (default: {DEFAULT_IMG_SIZE})'
    )
    parser.add_argument(
        '--batch_size', type=int, default=DEFAULT_BATCH_SIZE,
        help=f'Batch size (default: {DEFAULT_BATCH_SIZE})'
    )

    args = parser.parse_args()
    train(
        data_dir=args.data_dir,
        epochs=args.epochs,
        img_size=args.img_size,
        batch_size=args.batch_size
    )
