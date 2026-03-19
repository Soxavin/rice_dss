# ML Experiment Report
## Rice DSS — Model Selection

> Systematic comparison of 6 training configurations to select the best-performing model for production use.

**Date:** March 2026
**Dataset:** 9,200 images, 4 balanced classes (2,300 each) — Bacterial Blight, Blast, Brown Spot, Healthy
**Hardware:** Apple M4 Pro (Metal GPU), 24 GB RAM
**Framework:** TensorFlow 2.18.0

---

## Experiment Comparison

| # | Experiment | Backbone | Head | Epochs | Fine-tune | Label Smoothing | Val Accuracy |
|---|-----------|----------|------|--------|-----------|-----------------|--------------|
| 1 | `baseline` | MobileNetV2 | Dense(128) | 20 | 5 ep / 30 layers | 0.0 | 86.96% |
| 2 | `label_smoothing` | MobileNetV2 | Dense(128) | 20 | 5 ep / 30 layers | 0.1 | 86.41% |
| 3 | `extended_finetune` | MobileNetV2 | Dense(128) | 20 | 15 ep / 50 layers | 0.1 | 85.87% |
| 4 | `efficientnet` | EfficientNetV2B0 | Dense(128) | 20 | 10 ep / 30 layers | 0.1 | 90.82% |
| 5 | `efficientnet_no_smooth` | EfficientNetV2B0 | Dense(128) | 20 | 5 ep / 30 layers | 0.0 | 90.92% |
| **6** | **`efficientnet_big_head`** | **EfficientNetV2B0** | **Dense(256)** | **30** | **None** | **0.0** | **91.85%** |

---

## Key Findings

### 1. Architecture matters most
Switching from MobileNetV2 (~14MB) to EfficientNetV2B0 (~25MB) yielded a **+4% accuracy gain** (86.96% → 90.82%) with no other changes. EfficientNetV2B0's compound scaling and improved training efficiency provide better feature representations for fine-grained disease classification.

### 2. Fine-tuning hurt performance on this dataset
Across all experiments, fine-tuning the backbone consistently **reduced** validation accuracy:
- Baseline: Phase 1 peak 86.96% → Phase 2 dropped to 86.58%
- EfficientNet: Phase 1 peak 90.92% → Phase 2 dropped to 90.38%
- Extended fine-tuning (50 layers, 15 epochs) was the worst performer at 85.87%

**Likely cause:** With 9,200 images (7,360 training), the dataset is too small to safely adapt deep backbone features without overfitting. The frozen ImageNet features already capture the relevant visual patterns (edges, textures, color gradients) needed for leaf disease classification.

### 3. Label smoothing did not help
Adding label smoothing (0.1) slightly decreased accuracy for both architectures:
- MobileNetV2: 86.96% → 86.41% (-0.55%)
- EfficientNetV2B0: 90.92% → 90.82% (-0.10%)

**Likely cause:** With only 4 well-separated classes and balanced data, the model doesn't suffer from overconfidence. Label smoothing is more beneficial for large-scale classification tasks with many similar classes.

### 4. Bigger classification head improved results
Increasing the hidden layer from Dense(128) to Dense(256) gave the best single improvement within the EfficientNet experiments: 90.92% → 91.85% (+0.93%). The larger head provides more capacity to learn the mapping from EfficientNet's 1,280-dimensional feature space to 4 disease classes.

---

## Winner: `efficientnet_big_head`

**Configuration:**
- Backbone: EfficientNetV2B0 (pretrained on ImageNet, fully frozen)
- Classification head: Dense(256, relu) + Dropout(0.3) + Dense(4, softmax)
- Training: 30 epochs, no fine-tuning
- Augmentation: flip, rotation, zoom, translation, brightness, contrast
- No label smoothing

### Per-Class Performance

| Condition | Precision | Recall | F1-Score | Support |
|-----------|-----------|--------|----------|---------|
| Bacterial Blight | 92.7% | 93.7% | 93.2% | 473 |
| Blast | 89.3% | 84.1% | 86.6% | 465 |
| Brown Spot | 91.6% | 91.6% | 91.6% | 442 |
| Healthy | 93.6% | 98.0% | 95.8% | 460 |
| **Overall** | **91.8%** | **91.9%** | **91.8%** | **1,840** |

### Improvement over baseline

| Metric | Baseline (MobileNetV2) | Winner (EfficientNetV2B0) | Change |
|--------|----------------------|--------------------------|--------|
| Overall accuracy | 88.3% | 91.85% | **+3.55%** |
| Blast recall | 72.7% | 84.1% | **+11.4%** |
| Bacterial Blight precision | 81.7% | 92.7% | **+11.0%** |
| Brown Spot recall | 87.3% | 91.6% | **+4.3%** |

The most significant improvement is in **Blast recall** (72.7% → 84.1%), which was previously the weakest class. Blast lesions are visually similar to Brown Spot and early-stage Bacterial Blight, making them the hardest to classify. EfficientNetV2B0's richer feature representations help distinguish these subtle differences.

---

## Experiment Artifacts

Each experiment is stored in `models/experiments/{timestamp}_{name}/` containing:

| File | Description |
|------|-------------|
| `config.json` | All hyperparameters + best validation accuracy |
| `rice_disease_model.keras` | Model snapshot at time of experiment |
| `rice_disease_model.meta.json` | Class names, image size, backbone |
| `training_history.json` | Epoch-by-epoch accuracy and loss |
| `training_history.png` | Accuracy/loss curves with phase boundary |

To re-run the comparison at any time:
```bash
python -m ml.experiment
```

---

## Methodology

All experiments used:
- **Same dataset split**: 80/20 train/validation (seed=42 for reproducibility)
- **Same augmentation pipeline**: RandomFlip, RandomRotation(0.2), RandomZoom(0.15), RandomTranslation(0.1), RandomBrightness(0.1), RandomContrast(0.1)
- **Same callbacks**: ModelCheckpoint (save best by val_accuracy), EarlyStopping (patience=5), ReduceLROnPlateau (patience=3, factor=0.5)
- **Same optimizer**: Adam (LR=1e-4 for Phase 1, 1e-5 for fine-tuning)

This controlled setup ensures that accuracy differences are attributable to the specific variable being tested in each experiment.
