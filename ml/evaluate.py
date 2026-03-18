# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ml/evaluate.py — Model Evaluation Script
# -----------------------------------------------------------------------------
# PURPOSE:
#   Evaluates a trained model on the validation set and produces metrics
#   for the FYP report: classification report, confusion matrix, per-class
#   accuracy.
#
# HOW TO RUN:
#   python -m ml.evaluate --model_path models/rice_disease_model.keras --data_dir data/
#
# OUTPUT:
#   models/evaluation/
#   ├── classification_report.txt
#   └── confusion_matrix.png
# =============================================================================

import argparse
from pathlib import Path

try:
    import numpy as np
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

from ml.dataset import load_dataset, ALL_CLASS_NAMES, DEFAULT_IMG_SIZE, DEFAULT_BATCH_SIZE


def evaluate(
    model_path: str,
    data_dir: str,
    img_size: int = DEFAULT_IMG_SIZE,
    batch_size: int = DEFAULT_BATCH_SIZE
) -> None:
    """
    Evaluates the trained model on the validation split.

    Produces:
    - Classification report (precision, recall, F1 per class)
    - Confusion matrix (saved as PNG)
    - Overall accuracy

    Args:
        model_path (str): Path to the saved .keras model.
        data_dir (str): Path to dataset root directory.
        img_size (int): Image size used during training.
        batch_size (int): Batch size for evaluation.
    """
    if not TF_AVAILABLE:
        raise ImportError("TensorFlow is required. Install with: pip install tensorflow")

    try:
        from sklearn.metrics import classification_report, confusion_matrix
        import matplotlib
        matplotlib.use('Agg')  # Non-interactive backend
        import matplotlib.pyplot as plt
    except ImportError:
        raise ImportError(
            "scikit-learn and matplotlib are required for evaluation. "
            "Install with: pip install scikit-learn matplotlib"
        )

    model_path = Path(model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at: {model_path}")

    print("=" * 60)
    print("RICE DSS — MODEL EVALUATION")
    print("=" * 60)

    # Load model
    print(f"\nLoading model from: {model_path}")
    model = tf.keras.models.load_model(str(model_path))

    # Load validation dataset
    print(f"Loading validation set from: {data_dir}")
    _, val_ds, class_names = load_dataset(data_dir, img_size, batch_size)
    print(f"Classes: {class_names}")

    # Collect predictions
    print("\nRunning predictions on validation set...")
    y_true = []
    y_pred = []

    for images, labels in val_ds:
        preds = model.predict(images, verbose=0)
        y_pred.extend(np.argmax(preds, axis=1))
        y_true.extend(np.argmax(labels.numpy(), axis=1))

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    # Classification report
    report = classification_report(
        y_true, y_pred, target_names=class_names, digits=4
    )
    print(f"\n{report}")

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)

    # Overall accuracy
    accuracy = np.sum(y_true == y_pred) / len(y_true)
    print(f"Overall accuracy: {accuracy:.4f} ({np.sum(y_true == y_pred)}/{len(y_true)})")

    # Save results
    output_dir = model_path.parent / "evaluation"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save classification report
    report_path = output_dir / "classification_report.txt"
    with open(report_path, 'w') as f:
        f.write("RICE DSS — Model Evaluation Report\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Model: {model_path}\n")
        f.write(f"Dataset: {data_dir}\n")
        f.write(f"Validation samples: {len(y_true)}\n")
        f.write(f"Overall accuracy: {accuracy:.4f}\n\n")
        f.write(report)
    print(f"\nClassification report saved to: {report_path}")

    # Save confusion matrix plot
    fig, ax = plt.subplots(figsize=(8, 6))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=class_names,
        yticklabels=class_names,
        title='Confusion Matrix',
        ylabel='True Label',
        xlabel='Predicted Label'
    )
    plt.setp(ax.get_xticklabels(), rotation=45, ha='right', rotation_mode='anchor')

    # Add text annotations to cells
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'),
                    ha='center', va='center',
                    color='white' if cm[i, j] > thresh else 'black')

    fig.tight_layout()
    cm_path = output_dir / "confusion_matrix.png"
    fig.savefig(str(cm_path), dpi=150)
    plt.close(fig)
    print(f"Confusion matrix saved to: {cm_path}")

    print(f"\n{'='*60}")
    print("Evaluation complete.")
    print(f"{'='*60}")


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Evaluate trained Rice DSS ML model"
    )
    parser.add_argument(
        '--model_path', type=str,
        default='models/rice_disease_model.keras',
        help='Path to trained model (default: models/rice_disease_model.keras)'
    )
    parser.add_argument(
        '--data_dir', type=str, default='data/',
        help='Path to dataset directory (default: data/)'
    )
    parser.add_argument(
        '--img_size', type=int, default=DEFAULT_IMG_SIZE,
        help=f'Image size (default: {DEFAULT_IMG_SIZE})'
    )
    parser.add_argument(
        '--batch_size', type=int, default=DEFAULT_BATCH_SIZE,
        help=f'Batch size (default: {DEFAULT_BATCH_SIZE})'
    )

    args = parser.parse_args()
    evaluate(
        model_path=args.model_path,
        data_dir=args.data_dir,
        img_size=args.img_size,
        batch_size=args.batch_size
    )
