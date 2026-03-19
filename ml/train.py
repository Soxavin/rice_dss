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

import json

from ml.dataset import load_dataset, CLASS_NAMES, ALL_CLASS_NAMES, build_augmentation_layer


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


def build_model(
    num_classes: int,
    img_size: int = DEFAULT_IMG_SIZE,
    augment: bool = True
) -> "keras.Model":
    """
    Builds a MobileNetV2-based transfer learning model.

    Architecture:
    - Optional data augmentation (active during training only)
    - MobileNetV2 backbone (pretrained on ImageNet, frozen)
    - Global average pooling
    - Dense(128, relu) + Dropout(0.3)
    - Dense(num_classes, softmax)

    Args:
        num_classes (int): Number of output classes (4 for training).
        img_size (int): Input image dimensions.
        augment (bool): Whether to include data augmentation layers.

    Returns:
        keras.Model: Compiled model ready for training.
    """
    # TRANSFER LEARNING: Load MobileNetV2 backbone with pretrained ImageNet weights.
    # MobileNetV2 was chosen because:
    #   1. Small model size (~14MB) — suitable for edge/mobile deployment
    #   2. Strong feature extraction from ImageNet pretraining
    #   3. Fast inference — important for real-time field diagnosis
    # include_top=False removes the original ImageNet classification head
    # (1000 classes) — we add our own 4-class head below.
    base_model = keras.applications.MobileNetV2(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights='imagenet'
    )
    # PHASE 1 STRATEGY: Freeze the entire backbone so we only train our
    # classification head. This prevents the pretrained features from being
    # destroyed by random gradients from our randomly initialized head.
    base_model.trainable = False

    # BUILD CLASSIFICATION HEAD
    # The head sits on top of MobileNetV2 and maps its feature vectors
    # to our 4 disease/healthy classes.
    inputs = keras.Input(shape=(img_size, img_size, 3))

    # Data augmentation (random flips, rotation, zoom, contrast)
    # These layers are only active during training (training=True) and
    # pass through unchanged during inference — no need to disable manually.
    if augment:
        x = build_augmentation_layer()(inputs)
    else:
        x = inputs

    # MobileNetV2 expects pixel values in [-1, 1] range (not [0, 255])
    x = keras.applications.mobilenet_v2.preprocess_input(x)
    # training=False keeps BatchNorm layers in inference mode even during training
    # (important when backbone is frozen — we don't want to update BN statistics)
    x = base_model(x, training=False)
    # GlobalAveragePooling2D: reduces (7, 7, 1280) feature map to (1280,) vector
    x = keras.layers.GlobalAveragePooling2D()(x)
    # Dense + Dropout: learnable classification layer with regularization
    x = keras.layers.Dense(128, activation='relu')(x)
    x = keras.layers.Dropout(0.3)(x)  # 30% dropout — reduces overfitting on our 9,200 image dataset
    # Final softmax layer: outputs probabilities for each class
    outputs = keras.layers.Dense(num_classes, activation='softmax')(x)

    model = keras.Model(inputs, outputs)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=DEFAULT_LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model


def _plot_training_history(history: dict, output_dir: Path, phase1_epochs: int):
    """Saves accuracy and loss curves to output_dir/training_history.png."""
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not available — skipping training history plot.")
        return

    _, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

    epochs_range = range(1, len(history['accuracy']) + 1)

    # Accuracy
    ax1.plot(epochs_range, history['accuracy'], label='Train')
    ax1.plot(epochs_range, history['val_accuracy'], label='Validation')
    ax1.axvline(x=phase1_epochs, color='gray', linestyle='--', alpha=0.5, label='Fine-tune start')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Loss
    ax2.plot(epochs_range, history['loss'], label='Train')
    ax2.plot(epochs_range, history['val_loss'], label='Validation')
    ax2.axvline(x=phase1_epochs, color='gray', linestyle='--', alpha=0.5, label='Fine-tune start')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plot_path = output_dir / "training_history.png"
    plt.savefig(plot_path, dpi=150)
    plt.close()
    print(f"Training history plot saved to: {plot_path}")


def train(
    data_dir: str,
    epochs: int = DEFAULT_EPOCHS,
    img_size: int = DEFAULT_IMG_SIZE,
    batch_size: int = DEFAULT_BATCH_SIZE,
    augment: bool = True,
    fine_tune_epochs: int = 5,
    fine_tune_layers: int = 30
) -> None:
    """
    Runs the full training pipeline.

    Steps:
    1. Load dataset from data_dir
    2. Build MobileNetV2 model (with optional augmentation)
    3. Phase 1: Train classification head (backbone frozen)
    4. Phase 2: Fine-tune top backbone layers at lower LR
    5. Save model artifact + metadata to models/

    Args:
        data_dir (str): Path to dataset root (with class subdirectories).
        epochs (int): Number of training epochs (phase 1).
        img_size (int): Input image size.
        batch_size (int): Training batch size.
        augment (bool): Whether to use data augmentation.
        fine_tune_epochs (int): Additional epochs for fine-tuning phase.
        fine_tune_layers (int): Number of MobileNetV2 layers to unfreeze.
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
    print(f"Expected:      {ALL_CLASS_NAMES}")

    # Validate class alignment with training expectations
    if sorted(class_names) != sorted(ALL_CLASS_NAMES):
        print(f"\n⚠️  WARNING: Dataset classes {class_names} do not match "
              f"expected training classes {ALL_CLASS_NAMES}.")
        print("   Inference wrapper may produce incorrect condition keys.")

    # Step 2: Build model
    print(f"\nBuilding MobileNetV2 model ({len(class_names)} classes, "
          f"augment={augment})...")
    model = build_model(
        num_classes=len(class_names), img_size=img_size, augment=augment
    )
    model.summary()

    # Step 3: Callbacks
    # These callbacks automate training decisions that would otherwise
    # require manual monitoring. They work together:
    #   - ModelCheckpoint saves the best model so we never lose a good result
    #   - EarlyStopping prevents wasting compute when the model stops improving
    #   - ReduceLROnPlateau helps escape local minima by lowering learning rate
    callbacks = [
        # Save the model whenever val_accuracy improves (overwrites previous best)
        keras.callbacks.ModelCheckpoint(
            filepath=str(MODEL_SAVE_PATH),
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        # Stop training if val_loss hasn't improved for 5 consecutive epochs.
        # restore_best_weights=True ensures the final model is the best one,
        # not the last (potentially overfit) one.
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        # If val_loss plateaus for 3 epochs, halve the learning rate.
        # This helps the model converge more precisely in later epochs.
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            verbose=1
        )
    ]

    # Create models directory if it doesn't exist
    MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Step 4: Phase 1 — Train classification head (backbone frozen)
    print(f"\n--- Phase 1: Training classification head ({epochs} epochs) ---")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks
    )

    phase1_best = max(history.history.get('val_accuracy', [0]))
    print(f"Phase 1 best val accuracy: {phase1_best:.4f}")

    # Step 5: Phase 2 — Fine-tune top layers of MobileNetV2
    # PHASE 2 STRATEGY: Now that our classification head is trained,
    # we unfreeze the top layers of MobileNetV2 and train them with a
    # very low learning rate (1e-5 vs 1e-4 in Phase 1). This allows
    # the backbone to adapt its feature extraction to rice leaf images
    # specifically, rather than generic ImageNet features.
    # We only unfreeze the TOP layers (default: 30) because:
    #   - Lower layers detect universal features (edges, textures)
    #   - Upper layers detect task-specific features (leaf patterns)
    #   - Unfreezing everything risks catastrophic forgetting
    if fine_tune_epochs > 0:
        print(f"\n--- Phase 2: Fine-tuning top {fine_tune_layers} layers "
              f"({fine_tune_epochs} epochs, LR=1e-5) ---")

        # Find the MobileNetV2 base model layer within the full model
        base_model = None
        for layer in model.layers:
            if isinstance(layer, keras.Model) and 'mobilenetv2' in layer.name:
                base_model = layer
                break

        if base_model is not None:
            # Unfreeze the backbone, then re-freeze all but the top N layers
            base_model.trainable = True
            for layer in base_model.layers[:-fine_tune_layers]:
                layer.trainable = False

            # Must recompile after changing trainable layers.
            # Lower LR (1e-5) prevents large weight updates that could
            # destroy the pretrained features.
            model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=1e-5),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )

            # Continue training from where Phase 1 left off
            # initial_epoch ensures the epoch counter is continuous in logs/plots
            total_epochs = epochs + fine_tune_epochs
            initial_epoch = len(history.history['loss'])

            history_ft = model.fit(
                train_ds,
                validation_data=val_ds,
                epochs=total_epochs,
                initial_epoch=initial_epoch,
                callbacks=callbacks
            )

            phase2_best = max(history_ft.history.get('val_accuracy', [0]))
            print(f"Phase 2 best val accuracy: {phase2_best:.4f}")
        else:
            print("Could not find MobileNetV2 base layer — skipping fine-tuning.")

    # Step 6: Merge training history from both phases
    # Combine Phase 1 + Phase 2 history into a single continuous timeline.
    # This produces one set of loss/accuracy curves spanning all epochs,
    # which is what we plot and save for the FYP report.
    full_history = {k: list(v) for k, v in history.history.items()}
    if fine_tune_epochs > 0 and base_model is not None:
        for k, v in history_ft.history.items():
            full_history[k].extend(v)

    # Step 7: Save metadata sidecar (class names + config)
    # This .meta.json file is loaded by RiceDSSInference to correctly map
    # model output neurons to condition keys (see ml/inference.py).
    metadata_path = MODEL_SAVE_PATH.with_suffix('.meta.json')
    metadata = {
        'class_names': class_names,      # 4-class training order
        'img_size': img_size,
        'dss_class_names': CLASS_NAMES,   # 3-class DSS contract
    }
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to: {metadata_path}")

    # Step 8: Save training history JSON + plot
    # The JSON is useful for programmatic analysis (e.g., comparing runs).
    # The PNG plot shows accuracy/loss curves for the FYP report/presentation.
    eval_dir = MODEL_SAVE_PATH.parent / "evaluation"
    eval_dir.mkdir(parents=True, exist_ok=True)

    history_path = eval_dir / "training_history.json"
    with open(history_path, 'w') as f:
        json.dump(full_history, f, indent=2)
    print(f"Training history saved to: {history_path}")

    _plot_training_history(full_history, eval_dir, len(history.history['loss']))

    # Summary
    best_val_acc = max(full_history.get('val_accuracy', [0]))
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
    parser.add_argument(
        '--fine_tune_epochs', type=int, default=5,
        help='Additional epochs for fine-tuning top backbone layers (default: 5)'
    )
    parser.add_argument(
        '--fine_tune_layers', type=int, default=30,
        help='Number of MobileNetV2 layers to unfreeze for fine-tuning (default: 30)'
    )
    parser.add_argument(
        '--no_augment', action='store_true',
        help='Disable data augmentation'
    )

    args = parser.parse_args()
    train(
        data_dir=args.data_dir,
        epochs=args.epochs,
        img_size=args.img_size,
        batch_size=args.batch_size,
        augment=not args.no_augment,
        fine_tune_epochs=args.fine_tune_epochs,
        fine_tune_layers=args.fine_tune_layers
    )
