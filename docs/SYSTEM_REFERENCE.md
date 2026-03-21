# Rice DSS — Complete System Reference

> **Purpose:** This document is a comprehensive reference for the Rice Paddy Disease Decision Support System. It covers every module, function, threshold, and design decision in the codebase. Teammates can read it directly or paste it into any AI chatbot (ChatGPT, Claude, Gemini, etc.) to ask detailed questions about the project.
>
> **Generated:** March 2026 | **Author:** Soxavin | **Project:** Final Year Project

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Data Flow Walkthrough](#3-data-flow-walkthrough)
4. [DSS Core Engine (dss/)](#4-dss-core-engine)
   - 4.1 validation.py — Input Validation
   - 4.2 scoring.py — Scoring Engine
   - 4.3 decision.py — 8-Step Decision Hierarchy
   - 4.4 output_builder.py — Output Formatting
   - 4.5 mode_layer.py — Three Diagnosis Modes
   - 4.6 recommendations.py — Farmer Advice
   - 4.7 explainer.py — Score Traceability
   - 4.8 logger.py — Audit Logging
5. [ML Pipeline (ml/)](#5-ml-pipeline)
   - 5.1 dataset.py — Data Loading
   - 5.2 train.py — Training Pipeline
   - 5.3 inference.py — 4→3 Class Bridging
   - 5.4 gradcam.py — Visual Explainability
   - 5.5 evaluate.py — Model Evaluation
   - 5.6 experiment.py — Experiment Tracking
6. [REST API (api/)](#6-rest-api)
   - 6.1 schemas.py — Request/Response Models
   - 6.2 main.py — Endpoints
7. [Translations Layer (translations/)](#7-translations-layer)
8. [Streamlit UI (ui/)](#8-streamlit-ui)
9. [Test Suite (tests/)](#9-test-suite)
10. [Frozen Constants & Thresholds](#10-frozen-constants--thresholds)
11. [Key Design Decisions](#11-key-design-decisions)
12. [File-by-File Summary Table](#12-file-by-file-summary-table)
13. [Deployment](#13-deployment)

---

## 1. Project Overview

Cambodian rice farmers often misidentify crop diseases due to limited access to agricultural specialists. This system helps farmers diagnose rice paddy diseases by combining two complementary approaches:

1. **Structured Questionnaire** — A rule-based scoring engine that evaluates farmer-reported symptoms, field conditions, soil type, fertilizer history, and weather patterns against scientifically validated disease profiles (referenced from Cambodian agricultural literature).

2. **ML Image Classifier** — An EfficientNetV2B0-based CNN trained on 9,200 leaf images that classifies photos into one of 4 classes (Bacterial Blight, Blast, Brown Spot, Healthy).

The system fuses both sources using a weighted hybrid model (60% questionnaire, 40% ML) and produces a diagnosis with actionable recommendations in English and Khmer.

### Supported Conditions

| Type | Condition | Detection Method |
|------|-----------|-----------------|
| Biotic (bacterial) | Bacterial Blight | Questionnaire + ML |
| Biotic (fungal) | Blast | Questionnaire + ML |
| Biotic (fungal) | Brown Spot | Questionnaire + ML |
| Non-biotic | Iron Toxicity | Questionnaire only |
| Non-biotic | Nitrogen Deficiency | Questionnaire only |
| Non-biotic | Salt Toxicity | Questionnaire only |
| Advisory | Sheath Blight Warning | Questionnaire flag (outside scope) |
| Unresolved | Uncertain / Out of Scope | Insufficient evidence |

### Three Diagnosis Modes

| Mode | Input | Use Case |
|------|-------|----------|
| **Questionnaire Only** | Farmer answers only | No camera / no leaf image available |
| **Image Only (ML)** | Leaf photo only | Quick field screening (3 biotic diseases only) |
| **Hybrid (Recommended)** | Photo + questionnaire answers | Most accurate — full scoring + ML fusion |

---

## 2. Architecture Summary

```
                    ┌─────────────────┐
                    │  Leaf Image     │
                    │  (Optional)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ EfficientNetV2B0│
                    │  Classifier     │──── 4 classes (incl. healthy)
                    └────────┬────────┘
                             │
                     4→3 class bridge
                     (drop healthy,
                      renormalize)
                             │
Farmer Input                 │
(Questionnaire)              │
      │                      │
      ▼                      ▼
┌───────────┐         ┌──────────────┐
│ Validation│         │   ML Probs   │
│  (341 LOC)│         │  (3 classes) │
└─────┬─────┘         └──────┬───────┘
      │                      │
      ▼                      │
┌───────────┐                │
│  Scoring  │  6 conditions  │
│  (832 LOC)│────────────────┤
└─────┬─────┘                │
      │                      │
      ▼                      ▼
┌──────────────────────────────────┐
│        Decision Engine           │
│   8-step hierarchy (262 LOC)     │
│   Q weight: 60%  ML weight: 40%  │
│   Non-biotic ALWAYS overrides ML │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   Output Builder + Recs          │
│   (283 + 229 LOC)                │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   Translations (post-processing) │
│   English (384 LOC) + Khmer      │
│   (383 LOC)                      │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   REST API (FastAPI, 10 endpoints)│
│   OR Streamlit UI (direct import)│
└──────────────────────────────────┘
```

### Module Boundaries

| Layer | Files | Total LOC | Role |
|-------|-------|-----------|------|
| DSS Core | `dss/*.py` (8 files) | ~2,645 | Validation, scoring, decision, output, recommendations, explainability, logging |
| ML Pipeline | `ml/*.py` (6 files) | ~1,699 | Dataset loading, training, inference, Grad-CAM, evaluation, experiment tracking |
| API | `api/*.py` (2 files) | ~835 | FastAPI endpoints + Pydantic schemas |
| Translations | `translations/*.py` (4 files) | ~1,067 | Bilingual post-processing (English + Khmer) |
| UI | `ui/app.py` | ~700 | Streamlit demo interface |
| Tests | `tests/*.py` (7 files) | ~1,400 | 142 automated tests |

---

## 3. Data Flow Walkthrough

### 3A. Questionnaire-Only Flow

```
User submits questionnaire answers (JSON)
  → api/main.py: questionnaire_endpoint()
    → _request_to_dict(request) → plain dict
    → dss/mode_layer.py: run_dss(raw, mode="questionnaire")
      → questionnaire_only_logic(raw)
        → Forces ml_probabilities = None
        → dss/decision.py: generate_output(raw)
          → STEP 0: validate_answers(raw) → cleaned dict
          → STEP 1: compute_all_scores(answers) → 6 scores + flags
          → STEP 2: Check out-of-scope / uncertain
          → STEP 3: Non-biotic dominance check (≥ 0.65)
          → STEP 4: Pathognomonic lock (morning ooze)
          → STEP 5: Strong Q dominance (≥ 0.80)
          → STEP 6: SKIPPED (no ML probs)
          → STEP 7: Final biotic evaluation
          → build_*_output() → result dict
      → Append mode_used = "Questionnaire Only"
      → dss_logger.log_run()
    → translations/core.py: translate_output(output, lang)
  → Return JSON response
```

### 3B. Image-Only Flow

```
User uploads leaf image
  → api/main.py: predict_image()
    → Validate MIME type (JPEG/PNG/WebP only)
    → get_inference_model() → lazy-load ML model
    → Read image bytes, check size (≤ 10 MB)
    → ml/inference.py: predict_from_bytes(contents)
      → preprocess_image_bytes() → 224×224 tensor
      → model.predict() → 4-class probabilities
      → _bridge_to_dss():
          if healthy ≥ 0.60 → uniform {0.333, 0.333, 0.334}
          else → drop healthy, renormalize 3 diseases to sum 1.0
    → ml/gradcam.py: get_gradcam_overlay() → heatmap PNG
    → dss/mode_layer.py: run_dss({ml_probabilities: probs}, mode="ml")
      → ml_only_logic():
          if max prob ≥ 0.65 → "assessed" (Probable)
          elif max prob ≥ 0.40 → "assessed" (Possible)
          else → "uncertain"
    → Attach ml_probabilities + gradcam_base64 to response
  → Return JSON response
```

### 3C. Hybrid Flow

```
User submits questionnaire + image (or pre-computed ML probs)
  → api/main.py: hybrid_endpoint() or hybrid_image()
    → If image: run ML inference, inject probs into answers dict
    → dss/mode_layer.py: run_dss(raw, mode="hybrid")
      → hybrid_logic(raw) → generate_output(raw)
        → STEP 0–5: Same as questionnaire-only
        → STEP 6: Safe ML Fusion
            For biotic conditions only:
            fused_score = 0.60 * questionnaire_score + 0.40 * ml_prob
        → STEP 7: Evaluate fused scores
    → translate_output() → bilingual response
  → Return JSON response
```

---

## 4. DSS Core Engine

The `dss/` directory contains the core decision support logic. Files marked **FROZEN** have scientifically validated logic that must not be modified.

### 4.1 validation.py (341 lines) — FROZEN

**Purpose:** Sanitizes all farmer inputs before they reach the scoring engine.

**Entry Points:**
- `validate_answers(raw_answers: dict) -> dict` — Cleans all questionnaire fields
- `validate_ml_probabilities(ml_probs) -> dict | None` — Validates ML output format

**What It Does:**
- Checks each field against its allowed values (17 sets of valid inputs)
- Replaces invalid/missing values with `None` (which scores neutrally — no penalty, no bonus)
- Validates ML probabilities: must be a dict with keys `{blast, brown_spot, bacterial_blight}`, values in [0.0, 1.0], sum within tolerance of 1.0

**Key Constant:**
- `ML_SUM_TOLERANCE = 0.15` — softmax outputs don't always sum to exactly 1.0

**Valid Input Sets (17 total):**

| Field | Example Values |
|-------|---------------|
| `growth_stage` | seedling, tillering, elongation, flowering, grain_filling |
| `symptoms` | dark_spots, yellowing, dried_areas, brown_discoloration, slow_growth, white_tips |
| `symptom_location` | leaf_blade, leaf_sheath, stem, panicle |
| `symptom_origin` | lower_leaves, upper_leaves, all_leaves, unsure |
| `farmer_confidence` | very_sure, somewhat_sure, not_sure |
| `fertilizer_applied` | true, false |
| `fertilizer_amount` | excessive, normal, less |
| `fertilizer_type` | urea_only, balanced_npk, organic, unsure |
| `weather` | heavy_rain, high_humidity, normal, dry_hot, unsure |
| `water_condition` | flooded_continuously, wet, dry, recently_drained |
| `spread_pattern` | few_plants, patches, most_of_field |
| `onset_speed` | sudden, gradual, unsure |
| `symptom_timing` | right_after_transplant, during_tillering, around_flowering, near_harvest, unsure |
| `previous_disease` | yes_same, yes_different, no, unsure |
| `previous_crop` | rice_same, rice_different, other_crop, unsure |
| `soil_type` | kbal_po, dey_chheh, dey_lbeng, unsure |
| `soil_cracking` | large_cracks, some_cracks, no_cracks, unsure |
| `additional_symptoms` | purple_roots, reduced_tillers, stunted_growth, morning_ooze, none |

---

### 4.2 scoring.py (832 lines) — FROZEN

**Purpose:** Calculates a 0.0–1.0 likelihood score for each of the 6 conditions based on farmer answers. Every weight is derived from Cambodian agricultural research (PDF1 = disease guide, PDF2 = soil/fertilizer guide).

**Entry Point:**
- `compute_all_scores(answers: dict) -> dict` — Returns `{'scores': {condition: float}, 'flags': {'sheath_blight': bool, 'out_of_scope': bool}}`

**Scoring Logic Pattern (all 6 conditions follow this):**
```
Start at 0.0
  + Add positive signals (symptoms, weather, soil conditions that match)
  − Subtract penalties (symptoms/conditions that contradict)
  × Multiply by confidence modifier (0.65–1.00)
  Cap result to [0.0, 1.0]
```

**Confidence Modifier** (from `farmer_confidence` field):
| Value | Modifier |
|-------|----------|
| very_sure | 1.00 |
| somewhat_sure | 0.85 |
| not_sure | 0.65 |
| missing/None | 0.75 |

**6 Scoring Functions:**

#### score_bacterial_blight()
| Signal | Weight | Note |
|--------|--------|------|
| Morning ooze (pathognomonic) | +0.60 | **NOT scaled by confidence** — definitive marker |
| Flooded continuously | +0.20 | |
| Heavy rain | +0.15 | |
| Sudden onset | +0.15 | |
| High humidity | +0.10 | |
| Previous rice crop | +0.10 | |
| White tips | +0.08 | |
| Patchy spread | +0.08 | |
| Dark spots | −0.10 | |
| Purple roots | −0.15 | |
| Dry field | −0.20 | |

#### score_blast()
| Signal | Weight |
|--------|--------|
| High humidity | +0.30 |
| Panicle symptoms | +0.30 |
| Flowering stage | +0.25 |
| Dark spots | +0.15 |
| Sudden spread | +0.15 |
| Previous rice | +0.10 |
| Stem symptoms | +0.10 |
| Upper leaves | +0.05 |
| Morning ooze | −0.30 |
| Purple roots | −0.15 |
| Leaf sheath | −0.15 |
| Dry/hot weather | −0.15 |
| Field-wide | −0.05 |

#### score_brown_spot()
| Signal | Weight |
|--------|--------|
| No fertilizer | +0.25 |
| Heavy rain | +0.25 |
| High humidity | +0.20 |
| Dark spots | +0.15 |
| Low fertilizer | +0.15 |
| Wet/drained cycle | +0.10 |
| Tillering–grain filling | +0.10 |
| Sandy soil | +0.08 |
| Patchy spread | +0.08 |
| Morning ooze | −0.30 |
| Purple roots | −0.15 |
| Leaf sheath | −0.15 |
| Panicle | −0.15 |
| Dry/hot | −0.10 |
| Field-wide | −0.05 |

#### score_iron_toxicity()
| Signal | Weight |
|--------|--------|
| Purple roots | +0.35 |
| Continuous flooding | +0.30 |
| Early timing (right after transplant) | +0.20 |
| Iron-prone soils (kbal_po) | +0.15 |
| Sudden onset | −0.10 |
| Leaf sheath symptoms | −0.15 |
| Dry fields | −0.20 |
| Morning ooze | −0.25 |

#### score_nitrogen_deficiency()
| Signal | Weight |
|--------|--------|
| No fertilizer applied | +0.45 |
| Less fertilizer | +0.25 |
| Yellowing without spots | +0.25 |
| Field-wide spread | +0.15 |
| Lower leaves first | +0.10 |
| Dark spots | −0.15 |
| Humid weather | −0.10 |
| Few plants | −0.20 |
| Morning ooze | −0.20 |

#### score_salt_toxicity()
| Signal | Weight |
|--------|--------|
| White tips | +0.35 |
| Excessive fertilizer | +0.30 |
| Field-wide spread | +0.15 |
| Lower leaves | +0.10 |
| Morning ooze | −0.35 |
| Patchy spread | −0.20 |
| Dark spots | −0.15 |
| Purple roots | −0.15 |
| Normal/less fertilizer | −0.10 |

**Flag Functions:**

- `flag_sheath_blight(answers)` → True if ≥ 3 sheath blight signals detected (leaf sheath location [+2], flooding, heavy rain, humidity, flowering/grain filling [+1 each])
- `flag_out_of_scope(answers)` → True if no symptoms, or only vague symptoms with low confidence

---

### 4.3 decision.py (262 lines) — FROZEN (IMMUTABLE)

**Purpose:** The core 8-step decision hierarchy that determines the final diagnosis. This is the most critical file in the system.

**Entry Point:**
- `generate_output(raw_answers: dict) -> dict`

**8-Step Hierarchy:**

| Step | Name | What Happens |
|------|------|-------------|
| **0** | Validate | `validate_answers(raw_answers)` — clean all inputs |
| **1** | Score | `compute_all_scores(answers)` — get 6 scores + flags |
| **2** | Out of Scope | If `out_of_scope` flag → `build_out_of_scope_output()`. If all scores < 0.40 → `build_uncertain_output()` |
| **3** | Non-Biotic Dominance | If any non-biotic score ≥ 0.65 → return immediately. **ML is completely ignored.** Non-biotic = iron_toxicity, n_deficiency, salt_toxicity |
| **4** | Pathognomonic Lock | If morning ooze AND bacterial_blight ≥ 0.60 → lock to bacterial_blight. Cannot be overridden. |
| **5** | Strong Q Dominance | If top biotic Q score ≥ 0.80: check for strong ML disagreement (ML ≥ 0.80 for different condition → ambiguous). Else → trust questionnaire. |
| **6** | Safe ML Fusion | If moderate evidence (< 0.80) and ML probs available: `fused = 0.60 * Q + 0.40 * ML` for biotic conditions only. Non-biotic scores unchanged. |
| **7** | Final Evaluation | Clear winner (≥ 0.65, gap ≥ 0.20) → assessed. Ambiguous fungal (blast vs brown_spot too close) → ambiguous. Moderate (≥ 0.40) → assessed with secondary_note. Weak (< 0.40) → uncertain. |

**Design Philosophy:**
- Questionnaire (biological reasoning) is always primary
- Non-biotic conditions cannot be seen in images → always override ML
- Pathognomonic signs (morning ooze = bacterial blight) are definitive
- When questionnaire and ML strongly disagree → report ambiguity rather than silently override either

---

### 4.4 output_builder.py (283 lines)

**Purpose:** Constructs the final output dictionaries returned by the decision engine.

**Constants:**

| Constant | Value | Purpose |
|----------|-------|---------|
| `THRESHOLD_PROBABLE` | 0.65 | Score needed for "Probable" diagnosis |
| `THRESHOLD_POSSIBLE` | 0.40 | Score needed for "Possible" / monitoring |
| `THRESHOLD_AMBIGUOUS_GAP` | 0.20 | Minimum gap between top two conditions |
| `QUESTIONNAIRE_WEIGHT` | 0.60 | Weight for questionnaire in hybrid fusion |
| `ML_WEIGHT` | 0.40 | Weight for ML in hybrid fusion |
| `NON_BIOTIC_CONDITIONS` | {iron_toxicity, n_deficiency, salt_toxicity} | Conditions undetectable by ML |
| `BIOTIC_CONDITIONS` | {bacterial_blight, brown_spot, blast} | Conditions detectable by both |

**Condition Labels (bilingual):**

| Key | Label |
|-----|-------|
| blast | ជំងឺប្លាស (Rice Blast) |
| brown_spot | ជំងឺចំណុចត្នោត (Brown Spot) |
| bacterial_blight | ជំងឺស្រកេន (Bacterial Blight) |
| iron_toxicity | ពុលជាតិដែក (Iron Toxicity) |
| n_deficiency | កង្វះអាស៊ូត (Nitrogen Deficiency) |
| salt_toxicity | ពុលជាតិប្រៃ (Salt Toxicity) |

**Builder Functions:**

| Function | When Used | Status Value |
|----------|-----------|-------------|
| `build_standard_output()` | Clear diagnosis found | "assessed" |
| `build_ambiguous_output()` | Two conditions too close | "ambiguous" |
| `build_uncertain_output()` | Not enough evidence | "uncertain" |
| `build_out_of_scope_output()` | No symptoms provided | "out_of_scope" |

**Secondary Conditions Extraction:**
- `_extract_secondary_conditions(all_scores, primary_key)` — Returns conditions scoring ≥ 0.40 (excluding the primary), sorted by score descending. These are surfaced as "Also Consider" items.

**Confidence Label Logic:**

| Score | Gap | Label |
|-------|-----|-------|
| ≥ 0.65 | ≥ 0.20 | High |
| ≥ 0.65 | < 0.20 | Medium |
| ≥ 0.40 | — | Possible |
| < 0.40 | — | Low |

---

### 4.5 mode_layer.py (257 lines)

**Purpose:** Routes requests to the correct diagnosis mode and serves as the public entry point for the DSS.

**Entry Point:**
- `run_dss(raw_answers: dict, mode: str = "hybrid") -> dict`

**Three Modes:**

| Mode | Function | Logic |
|------|----------|-------|
| `"questionnaire"` | `questionnaire_only_logic()` | Forces ml_probabilities=None, calls generate_output(). STEP 6 is skipped. Detects all 6 conditions. |
| `"ml"` | `ml_only_logic()` | Evaluates ML probabilities only. **Cannot detect non-biotic stresses.** Thresholds: ≥0.65 probable, ≥0.40 possible, <0.40 uncertain. |
| `"hybrid"` | `hybrid_logic()` | Passes everything to generate_output(). Full 8-step hierarchy with ML fusion. Falls back to questionnaire-only if ml_probabilities is None. |

**ML-Only Thresholds:**
- `ML_THRESHOLD_STRONG = 0.65`
- `ML_THRESHOLD_POSSIBLE = 0.40`

**Post-Processing:**
- Appends `mode_used` field: "Questionnaire Only", "ML Only", or "Hybrid (Recommended)"
- Logs every run via `dss_logger.log_run()`

---

### 4.6 recommendations.py (229 lines) — FROZEN

**Purpose:** Returns condition-specific farmer recommendations based on the diagnosis and field conditions.

**Entry Point:**
- `get_recommendations(condition: str, answers: dict) -> dict`

**Return Structure:**
```python
{
    'immediate': ['Action 1...', 'Action 2...'],   # What to do right now
    'preventive': ['Prevention 1...', ...],          # Long-term prevention
    'monitoring': 'Check field in X days...',        # Follow-up guidance
    'consult': True/False                            # Whether to seek specialist
}
```

**Per-Condition Recommendations (sourced from agricultural literature):**

| Condition | Key Immediate Actions | Key Preventive Actions |
|-----------|----------------------|----------------------|
| Blast | Fungicide (Tricyclazole), avoid N during outbreak | Resistant varieties (IR36, IR42, IR64), clean debris |
| Brown Spot | Fungicide, apply N if deficient | Resistant varieties, clean seed (soak 24h + heat 53–57°C) |
| Bacterial Blight | Drain field, destroy infected plants | Disease-free seed, avoid excess N |
| Iron Toxicity | Drain 7–10 days, apply balanced NPK + K | Avoid continuous flooding, strong-root varieties |
| N Deficiency | Apply Urea (soil-specific rates), split application | N at three growth stages, compost for sandy soils |
| Salt Toxicity | Flush with freshwater, stop fertilizer | Never exceed N rates, flood 2–4 weeks pre-planting |

**Soil-Specific Urea Rates (for N Deficiency):**
| Soil Type | Rate |
|-----------|------|
| Bakan | ~134 kg/ha |
| Prateah Lang | ~88 kg/ha |
| Prey Khmer | ~38 kg/ha (sandy, low rate) |
| Toul Samroung | ~113 kg/ha |
| Kbal Po | ~87 kg/ha |
| Krakor | ~238 kg/ha (high N-response) |

---

### 4.7 explainer.py (492 lines)

**Purpose:** Generates human-readable signal-by-signal breakdowns of how each condition was scored. Used for debugging, FYP defence, and farmer transparency.

**Entry Point:**
- `explain_scores(answers: dict) -> dict`

**Return Structure:**
```python
{
    'blast': {
        'signals': [
            {'field': 'weather', 'value': 'high_humidity', 'effect': '+', 'weight': 0.30, 'reason': 'High humidity favours blast spore germination'},
            {'field': 'symptoms', 'value': 'dark_spots', 'effect': '+', 'weight': 0.15, 'reason': 'Dark spots are typical blast lesions'},
            ...
        ],
        'confidence_modifier': 1.00,
        'raw_total': 0.75,
        'note': 'Signals scaled by confidence modifier (1.00), then capped [0, 1]'
    },
    'brown_spot': { ... },
    ...  # all 6 conditions
}
```

Mirrors `scoring.py` logic exactly but records each signal as an explanation object rather than just adding to the score. One helper function per condition (`_explain_blast()`, `_explain_brown_spot()`, etc.).

---

### 4.8 logger.py (285 lines)

**Purpose:** JSONL audit trail of every DSS run for evaluation and debugging.

**Singleton:** `dss_logger = DSSLogger()` — global instance, used by mode_layer.py

**Methods:**

| Method | Purpose |
|--------|---------|
| `log_run(answers, output, mode)` | Records timestamp, mode, input summary, scores, result to memory + JSONL file |
| `get_runs()` | Returns all logged runs |
| `get_summary()` | Aggregated stats: total runs, status/condition/confidence distributions, avg score |
| `export_csv(filepath)` | Exports to CSV for spreadsheet analysis |
| `clear()` | Clears in-memory logs |

**Log File:** `logs/dss_runs.jsonl` — one JSON object per line, gitignored.

---

## 5. ML Pipeline

### 5.1 dataset.py (177 lines)

**Purpose:** TensorFlow dataset loader with augmentation.

**Constants:**
- `CLASS_NAMES = ['bacterial_blight', 'blast', 'brown_spot']` — 3-class DSS keys
- `ALL_CLASS_NAMES = ['bacterial_blight', 'blast', 'brown_spot', 'healthy']` — 4-class training
- `DEFAULT_IMG_SIZE = 224`, `DEFAULT_BATCH_SIZE = 32`, `VALIDATION_SPLIT = 0.20`

**Functions:**
- `load_dataset(data_dir, img_size=224, batch_size=32, seed=42)` — Returns (train_ds, val_ds, class_names) using tf.keras.utils.image_dataset_from_directory with 80/20 split
- `build_augmentation_layer()` — Returns Sequential layer: RandomFlip, RandomRotation(0.2), RandomZoom(0.15), RandomTranslation(0.1), RandomBrightness(0.1), RandomContrast(0.1)

**Dataset:** 9,200 images, 4 balanced classes (2,300 each), manually curated from public datasets. Not included in git (too large). Structure:
```
data/
├── bacterial_blight/   (2,300 images)
├── blast/              (2,300 images)
├── brown_spot/         (2,300 images)
└── healthy/            (2,300 images)
```

---

### 5.2 train.py (539 lines)

**Purpose:** Complete multi-architecture training pipeline with 2-phase fine-tuning.

**Supported Backbones:** `mobilenetv2`, `efficientnetv2b0`

**Model Architecture:**
```
Input (224×224×3)
  → Data Augmentation (training only)
  → Backbone Preprocessing (per-architecture)
  → Backbone (frozen in Phase 1)
  → GlobalAveragePooling2D
  → Dense(head_units, relu)
  → Dropout(0.3)
  → Dense(num_classes, softmax)
```

**Two-Phase Training:**

| Phase | Epochs | Learning Rate | What's Trained |
|-------|--------|---------------|----------------|
| Phase 1 | ~20 | 1e-4 | Classification head only (backbone frozen) |
| Phase 2 | ~5 | 1e-5 | Top 30 backbone layers + head (fine-tuning) |

**Callbacks:** ModelCheckpoint (save best val_accuracy), EarlyStopping (patience=5), ReduceLROnPlateau (patience=3, factor=0.5)

**Outputs:**
- `models/rice_disease_model.keras` — trained model
- `models/rice_disease_model.meta.json` — metadata sidecar {class_names, img_size, backbone}
- `models/evaluation/training_history.json` — accuracy/loss curves
- `models/evaluation/training_history.png` — plot

**CLI Usage:**
```bash
python -m ml.train --data_dir data/ --backbone efficientnetv2b0 --head_units 256 --epochs 30
```

---

### 5.3 inference.py (363 lines) — Critical Bridge Logic

**Purpose:** Wraps the trained 4-class model for DSS integration. The key innovation is the 4→3 class bridge.

**Class: `RiceDSSInference`**

**Key Method — `_bridge_to_dss(raw_probs)`:**
```
If healthy probability ≥ 0.60:
    → Return uniform {blast: 0.333, brown_spot: 0.333, bacterial_blight: 0.334}
    → This means "the model thinks the leaf is healthy, let the questionnaire decide"

Else:
    → Drop the healthy class
    → Renormalize remaining 3 disease probabilities to sum to 1.0
    → Return {blast: X, brown_spot: Y, bacterial_blight: Z}
```

**Why 4→3 Bridge?**
- Training on 4 classes (including healthy) gives the model better feature learning — it learns what healthy looks like, improving disease detection accuracy
- But the DSS only scores 3 biotic diseases (+ 3 non-biotic from questionnaire)
- The bridge safely converts between the two representations

**Threshold:** `HEALTHY_DOMINANT_THRESHOLD = 0.60` — below this, the model is uncertain enough that disease probabilities are informative

**Test-Time Augmentation (TTA):**
- `_predict_with_tta(image_tensor, n_augments=5)` — Averages predictions over: original, horizontal flip, vertical flip, brightness +0.05, contrast ×1.1

**Metadata Sidecar:** Loads `.meta.json` alongside `.keras` model for class name ordering. Falls back to hardcoded defaults if missing.

---

### 5.4 gradcam.py (281 lines)

**Purpose:** Gradient-weighted Class Activation Mapping — shows which parts of the leaf image the model focused on.

**Functions:**
- `generate_gradcam(model, image_tensor, class_index=None)` → heatmap as numpy array
- `overlay_gradcam(original_image, heatmap, alpha=0.4)` → PIL Image with blue-to-red overlay
- `get_gradcam_overlay(model, image_source, ...)` → convenience wrapper

**How It Works:**
1. Find the last convolutional layer in the backbone
2. Forward pass, compute gradients of target class w.r.t. that conv layer
3. Global average pool gradients → per-channel importance weights
4. Weighted sum of feature maps → ReLU → normalize to [0, 1]
5. Resize heatmap to original image dimensions
6. Apply matplotlib 'jet' colormap (blue = low attention, red = high attention)
7. Blend with original image at alpha=0.4

**Output:** Base64-encoded PNG string sent to frontend via `gradcam_base64` field.

---

### 5.5 evaluate.py (203 lines)

**Purpose:** Generates classification report + confusion matrix on validation set.

**Outputs:**
- `models/evaluation/classification_report.txt` — Per-class precision, recall, F1-score
- `models/evaluation/confusion_matrix.png` — Heatmap visualization

**Current Model Performance (EfficientNetV2B0, 91.85% val accuracy):**

| Condition | Precision | Recall | F1-Score |
|-----------|-----------|--------|----------|
| Bacterial Blight | 92.7% | 93.7% | 93.2% |
| Blast | 89.3% | 84.1% | 86.6% |
| Brown Spot | 91.6% | 91.6% | 91.6% |
| Healthy | 93.6% | 98.0% | 95.8% |

---

### 5.6 experiment.py (136 lines)

**Purpose:** Lightweight experiment tracking and comparison.

**Functions:**
- `save_experiment(name, config, model_path, eval_dir)` — Snapshots model + config to `models/experiments/{timestamp}_{name}/`
- `compare_experiments()` — Prints comparison table of all saved experiments

**6 Experiments Conducted:**

| Experiment | Backbone | Val Accuracy |
|-----------|----------|--------------|
| Baseline | MobileNetV2 | 86.96% |
| + Label smoothing | MobileNetV2 | 86.41% |
| + Extended fine-tune | MobileNetV2 | 85.87% |
| EfficientNetV2B0 | EfficientNetV2B0 | 90.82% |
| + No smoothing | EfficientNetV2B0 | 90.92% |
| **+ Big head (256)** | **EfficientNetV2B0** | **91.85%** |

**Key Findings:** EfficientNetV2B0 +4% over MobileNetV2. Fine-tuning hurts on small datasets. Bigger head (+0.9%) helps.

---

## 6. REST API

### 6.1 schemas.py (339 lines)

**Pydantic v2 Models:**

**QuestionnaireRequest** — 25+ optional fields across 9 sections:
1. Growth Stage: `growth_stage`
2. Symptoms: `symptoms`, `symptom_location`, `symptom_origin`, `farmer_confidence`
3. Fertilizer: `fertilizer_applied`, `fertilizer_timing`, `fertilizer_type`, `fertilizer_amount`
4. Weather: `weather`
5. Water: `water_condition`
6. Spread: `spread_pattern`
7. Timing: `symptom_timing`, `onset_speed`
8. History: `previous_disease`, `previous_crop`, `soil_type`, `soil_cracking`
9. Additional: `additional_symptoms`
10. ML Input: `ml_probabilities` (optional)

All fields are optional — the DSS handles missing values safely.

**DSSResponse:**
```
status: "assessed" | "ambiguous" | "uncertain" | "out_of_scope" | "no_image" | "invalid_ml_output"
primary_condition: str (bilingual)
condition_key: str (machine-readable)
confidence_label: str (bilingual)
confidence_level: "high" | "medium" | "possible" | "low" | "ml_only"
score: float (0.0–1.0)
all_scores: {condition: float} (all 6)
recommendations: {immediate: [], preventive: [], monitoring: str, consult: bool}
secondary_conditions: [{condition, condition_key, score}, ...] (conditions ≥ 0.40)
secondary_note: str | null
warnings: [str]
disclaimer: str
mode_used: str
```

**ImagePredictionResponse** extends DSSResponse with:
- `ml_probabilities`: raw 3-class model output
- `gradcam_base64`: base64-encoded PNG heatmap overlay

---

### 6.2 main.py (496 lines)

**10 Endpoints:**

| Endpoint | Method | Content-Type | Purpose |
|----------|--------|-------------|---------|
| `/` | GET | — | API root — lists all endpoints |
| `/questionnaire` | POST | application/json | Rule-based diagnosis only |
| `/ml-only` | POST | application/json | ML probabilities only |
| `/hybrid` | POST | application/json | Full hybrid (recommended) |
| `/predict-image` | POST | multipart/form-data | Image upload → ML diagnosis |
| `/hybrid-image` | POST | multipart/form-data | Image + questionnaire combined |
| `/explain` | POST | application/json | Signal-level score breakdown |
| `/logs/summary` | GET | — | Aggregated run statistics |
| `/logs/runs` | GET | — | Recent run history |
| `/health` | GET | — | System status + model availability |

**All DSS endpoints accept `?lang=km` for Khmer output (default: `en`).**

**Image Upload Protections:**
- MIME type check: only JPEG, PNG, WebP accepted
- File size limit: max 10 MB
- Model availability check: returns HTTP 503 if model not loaded

**ML Model Loading:** Lazy singleton — TensorFlow is only imported when the first image endpoint is called. The API starts fast for questionnaire-only usage.

**CORS:** Defaults to `*` (allow all origins). Set `CORS_ORIGINS` env var for production.

**Live Deployment:** `https://rice-dss-137747818788.asia-southeast1.run.app`

---

## 7. Translations Layer

The `translations/` directory is a **post-processing layer** that sits between the frozen DSS output and the API response. It does not modify any DSS logic.

### How It Works

The DSS core (`dss/`) produces bilingual strings internally:
- Condition labels: `"ជំងឺប្លាស (Rice Blast)"`
- Confidence labels: `"ប្រហែលជា — ទំនុកចិត្តខ្ពស់ (Probable — High Confidence)"`

The translations layer:
1. Receives the full DSS output dict
2. Parses bilingual strings using `split_bilingual()` → extracts (Khmer, English)
3. Picks the correct language based on `?lang=` parameter
4. For English: applies wording improvements to recommendations (removes PDF references, replaces banned chemicals, adds safety framing)
5. For Khmer: replaces recommendations with full Khmer translations

### Files

| File | Lines | Purpose |
|------|-------|---------|
| `translations/__init__.py` | — | Exports: `translate_output`, `get_ui_labels` |
| `translations/core.py` | 300 | Main translation logic: `translate_output()`, `split_bilingual()`, helpers |
| `translations/en.py` | 384 | English UI labels (~80), recommendation wording improvements (~50 replacements) |
| `translations/km.py` | 383 | Khmer UI labels (~80), full Khmer recommendations, Khmer warnings |

### Key Design Choices
- **English recommendations** use find-and-replace on the frozen DSS strings (preserves dynamic content like soil-specific rates)
- **Khmer recommendations** are static replacements (entire recommendation dicts per condition)
- **Banned chemical removal:** Benlate (carcinogen) replaced with safe alternatives in English
- **Fertilizer rates** are presented with "approximately" framing + disclaimer for field adjustment
- **Trust messaging:** Non-biotic conditions explicitly note that pesticides are not effective

---

## 8. Streamlit UI

**File:** `ui/app.py` (~700 lines)

**Purpose:** Local testing interface for teammates and professors. Runs entirely in-process — no API server needed.

**Features:**
- 3-mode selection (Questionnaire Only, Image Only, Hybrid)
- Smart questionnaire with Quick mode (~6 key questions) and Detailed mode (all fields + progressive disclosure)
- Image upload with ML inference + Grad-CAM visualization
- Full score breakdown (debug mode)
- Language toggle (English / Khmer)
- Confidence gauge visualization
- Secondary conditions ("Also Consider") section
- Sheath blight warning rendering

**How to Run:**
```bash
source .venv312/bin/activate && streamlit run ui/app.py
```
Opens at http://localhost:8501

---

## 9. Test Suite

**142 tests across 7 test files, all passing.**

| File | Tests | Coverage |
|------|-------|----------|
| `test_dss.py` | 30 | 20 core disease cases — all 6 conditions + edge cases |
| `test_hybrid.py` | 25 | Hybrid ML fusion — agreement, disagreement, non-biotic override |
| `test_robustness.py` | 14 | Adversarial inputs — noise simulation, contradictory inputs |
| `test_api.py` | 14 | All 10 API endpoints + image upload |
| `test_ml.py` | 35 | ML pipeline — dataset, inference, 4→3 bridge, multi-arch, experiments |
| `test_gradcam.py` | 10 | Grad-CAM — heatmap generation, overlay, schema validation |
| `test_secondary.py` | 14 | Secondary conditions — extraction, translation, special outputs |

**Key Test Cases:**
- Classic Blast (Flowering Stage)
- Bacterial Blight with morning ooze pathognomonic lock
- Iron Toxicity overriding a high ML blast score (0.95)
- Ambiguous Blast vs Brown Spot → ambiguous output
- Non-biotic always overrides ML in hybrid mode
- Healthy class threshold at exactly 0.60
- False positive prevention (rain without disease)
- Incomplete farmer data → Uncertain output
- Primary condition excluded from secondary conditions list
- Translation of secondary condition names to Khmer

**Run:**
```bash
pytest tests/ -v --tb=short
```

---

## 10. Frozen Constants & Thresholds

These values are scientifically validated and must not be modified:

| Constant | Value | Location | Purpose |
|----------|-------|----------|---------|
| `THRESHOLD_PROBABLE` | 0.65 | output_builder.py | Minimum score for "Probable" diagnosis |
| `THRESHOLD_POSSIBLE` | 0.40 | output_builder.py | Minimum score for "Possible" / monitoring |
| `THRESHOLD_AMBIGUOUS_GAP` | 0.20 | output_builder.py | Minimum gap between top 2 conditions |
| `QUESTIONNAIRE_WEIGHT` | 0.60 | output_builder.py | Hybrid fusion: questionnaire weight |
| `ML_WEIGHT` | 0.40 | output_builder.py | Hybrid fusion: ML weight |
| `HEALTHY_DOMINANT_THRESHOLD` | 0.60 | inference.py | Below this, healthy class is uncertain → use disease probs |
| `ML_SUM_TOLERANCE` | 0.15 | validation.py | Tolerance for softmax sum deviation from 1.0 |
| Confidence: very_sure | 1.00 | scoring.py | Confidence modifier — no scaling |
| Confidence: somewhat_sure | 0.85 | scoring.py | Confidence modifier — moderate scaling |
| Confidence: not_sure | 0.65 | scoring.py | Confidence modifier — heavy scaling |
| Morning ooze weight | 0.60 | scoring.py | Pathognomonic marker — NOT scaled by confidence |
| ML_THRESHOLD_STRONG | 0.65 | mode_layer.py | ML-only mode: "Probable" threshold |
| ML_THRESHOLD_POSSIBLE | 0.40 | mode_layer.py | ML-only mode: "Possible" threshold |
| Sheath blight flag | ≥ 3 signals | scoring.py | Threshold for sheath blight warning |

---

## 11. Key Design Decisions

1. **Questionnaire always takes priority** — Biological reasoning from the scoring engine is the primary diagnostic signal. ML supports but never overrides.

2. **Non-biotic conditions override ML** — Iron toxicity, nitrogen deficiency, and salt toxicity are undetectable from leaf images. If the questionnaire scores them highly, they take precedence regardless of ML output.

3. **Pathognomonic lock** — Morning ooze (milky bacterial exudate at leaf tips) is a near-unique marker for Bacterial Blight. If detected with a score ≥ 0.60, the diagnosis locks to Bacterial Blight. The 0.60 weight is NOT scaled by farmer confidence — this is the only signal in the system that bypasses confidence scaling.

4. **Safe ML fusion** — Only applies when questionnaire evidence is moderate (< 0.80). Formula: `fused = 0.60 * Q + 0.40 * ML` for biotic conditions only. Non-biotic scores are never fused with ML.

5. **Strong disagreement = ambiguity** — If questionnaire and ML both score ≥ 0.80 for *different* conditions, the system reports ambiguity rather than silently overriding either source.

6. **4-class training, 3-class inference** — Training on 4 classes (including healthy) gives better feature learning. At inference: healthy ≥ 60% → fall back to questionnaire; otherwise drop healthy and renormalize.

7. **Secondary conditions** — When other conditions score ≥ 0.40 alongside the primary, they are surfaced as "Also Consider" items. This catches clinically relevant co-occurrences (e.g., Brown Spot + Nitrogen Deficiency — N deficiency makes plants susceptible to brown spot).

8. **Translations as post-processing** — All bilingual support is a layer on top of the frozen DSS output. The DSS core never needs to know about language preferences.

9. **Lazy ML loading** — TensorFlow is only imported when the first image endpoint is called. The API starts fast for questionnaire-only usage, and works even when TF is not installed.

10. **All fields optional** — The questionnaire handles missing answers safely (missing → None → neutral score). This enables Quick mode (~6 questions) without loss of safety.

---

## 12. File-by-File Summary Table

| File | Lines | Purpose |
|------|-------|---------|
| **dss/validation.py** | 341 | Input validation + confidence modifier (FROZEN) |
| **dss/scoring.py** | 832 | 6 scoring functions — scientifically validated weights (FROZEN) |
| **dss/decision.py** | 262 | 8-step decision hierarchy — immutable core logic (FROZEN) |
| **dss/output_builder.py** | 283 | Threshold constants + output formatting + secondary extraction |
| **dss/mode_layer.py** | 257 | run_dss() — 3-mode routing entry point |
| **dss/recommendations.py** | 229 | Condition-specific treatment advice (FROZEN) |
| **dss/explainer.py** | 492 | Score traceability / signal breakdown |
| **dss/logger.py** | 285 | JSONL audit trail for every DSS run |
| **ml/dataset.py** | 177 | TF dataset loader + augmentation pipeline |
| **ml/train.py** | 539 | Multi-architecture 2-phase training pipeline |
| **ml/inference.py** | 363 | 4→3 class bridging + TTA for DSS integration |
| **ml/gradcam.py** | 281 | Grad-CAM heatmap generation + overlay |
| **ml/evaluate.py** | 203 | Classification report + confusion matrix |
| **ml/experiment.py** | 136 | Experiment tracking + comparison |
| **api/main.py** | 496 | FastAPI — 10 endpoints + CORS + image upload |
| **api/schemas.py** | 339 | Pydantic v2 request/response models |
| **translations/core.py** | 300 | Bilingual string parsing + translation logic |
| **translations/en.py** | 384 | English UI labels + recommendation refinements |
| **translations/km.py** | 383 | Khmer translations (full) |
| **ui/app.py** | ~700 | Streamlit demo UI — 3-mode support + language toggle |
| **tests/** (7 files) | ~1,400 | 142 automated tests |

**Total codebase: ~7,600+ lines**

---

## 13. Deployment

**Platform:** Google Cloud Run (Singapore — asia-southeast1, closest to Cambodia)

**Live URL:** `https://rice-dss-137747818788.asia-southeast1.run.app`

**Deploy command:**
```bash
gcloud run deploy rice-dss \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --memory 1Gi \
  --allow-unauthenticated \
  --set-env-vars "CORS_ORIGINS=*"
```

**Container:** python:3.12-slim + TensorFlow CPU. Dockerfile + docker-compose.yml included.

**Cold starts:** ~15-20s (TensorFlow loading). Subsequent requests are fast.

**CI/CD:** GitHub Actions (`/.github/workflows/ci.yml`) runs `pytest` on every push/PR.

---

*This document was generated from the source code of the Rice DSS repository. For the most up-to-date information, refer to the code itself.*
