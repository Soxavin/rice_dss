# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# ml/experiment.py — Lightweight Experiment Tracking
# -----------------------------------------------------------------------------
# PURPOSE:
#   Saves snapshots of training runs for comparison. Each experiment gets a
#   timestamped directory under models/experiments/ with the model, config,
#   and evaluation artifacts.
#
# USAGE:
#   # From train.py (automatic when --experiment_name is provided):
#   save_experiment("baseline_v1", config_dict, model_path, eval_dir)
#
#   # Compare all experiments:
#   python -m ml.experiment
# =============================================================================

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict


EXPERIMENTS_DIR = Path("models/experiments")


def save_experiment(
    experiment_name: str,
    config: Dict,
    model_path: Path,
    eval_dir: Path,
) -> Path:
    """
    Saves an experiment snapshot to models/experiments/{timestamp}_{name}/.

    Copies the trained model, metadata, and evaluation artifacts into a
    timestamped directory alongside a config.json recording all hyperparameters.

    Args:
        experiment_name: Human-readable name for this experiment.
        config: Dict of hyperparameters (backbone, epochs, lr, etc.).
        model_path: Path to the trained .keras model.
        eval_dir: Path to the evaluation directory (classification_report, etc.).

    Returns:
        Path to the experiment directory.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Sanitize name for filesystem
    safe_name = experiment_name.replace(" ", "_").replace("/", "_")
    exp_dir = EXPERIMENTS_DIR / f"{timestamp}_{safe_name}"
    exp_dir.mkdir(parents=True, exist_ok=True)

    # Save config
    config_with_meta = {
        **config,
        'experiment_name': experiment_name,
        'timestamp': timestamp,
    }
    with open(exp_dir / "config.json", "w") as f:
        json.dump(config_with_meta, f, indent=2)

    # Copy model
    if model_path.exists():
        shutil.copy2(model_path, exp_dir / model_path.name)

    # Copy metadata sidecar
    meta_path = model_path.with_suffix(".meta.json")
    if meta_path.exists():
        shutil.copy2(meta_path, exp_dir / meta_path.name)

    # Copy evaluation artifacts
    if eval_dir.exists():
        for f in eval_dir.iterdir():
            if f.is_file():
                shutil.copy2(f, exp_dir / f.name)

    print(f"\nExperiment saved to: {exp_dir}")
    return exp_dir


def compare_experiments() -> None:
    """
    Prints a comparison table of all saved experiments.
    Reads config.json from each experiment directory and displays
    key metrics side by side.
    """
    if not EXPERIMENTS_DIR.exists():
        print("No experiments found.")
        return

    experiments = sorted(EXPERIMENTS_DIR.iterdir())
    if not experiments:
        print("No experiments found.")
        return

    # Collect all configs
    rows = []
    for exp_dir in experiments:
        config_path = exp_dir / "config.json"
        if not config_path.exists():
            continue
        with open(config_path) as f:
            config = json.load(f)
        rows.append(config)

    if not rows:
        print("No experiment configs found.")
        return

    # Print comparison table
    print("\n" + "=" * 90)
    print("EXPERIMENT COMPARISON")
    print("=" * 90)

    header = f"{'Name':<25} {'Backbone':<18} {'Val Acc':>8} {'LSmooth':>8} {'Epochs':>7} {'FT Ep':>6} {'FT Ly':>6}"
    print(header)
    print("-" * 90)

    for row in rows:
        name = row.get('experiment_name', '?')[:24]
        backbone = row.get('backbone', '?')[:17]
        val_acc = row.get('best_val_accuracy', 0)
        ls = row.get('label_smoothing', 0)
        epochs = row.get('epochs', '?')
        ft_ep = row.get('fine_tune_epochs', '?')
        ft_ly = row.get('fine_tune_layers', '?')
        print(f"{name:<25} {backbone:<18} {val_acc:>7.4f} {ls:>8.2f} {epochs:>7} {ft_ep:>6} {ft_ly:>6}")

    print("=" * 90)


if __name__ == "__main__":
    compare_experiments()
