# FYP Progress Presentation
## Rice Paddy Disease Decision Support System (DSS)
### Student Update — February 2026

---

---

# SLIDE 1 — Project Title

## Rice Paddy Disease
## Decision Support System

**Final Year Project**
Student: Vin (Soxavin)
Date: February 2026

> A rule-based + machine learning hybrid system to help
> Cambodian rice farmers identify paddy diseases from
> field symptoms — without needing internet or a specialist.

---

---

# SLIDE 2 — Problem Statement

## What problem are we solving?

- Rice is Cambodia's primary staple crop
- Farmers often misidentify diseases → wrong treatment → crop loss
- Agricultural specialists are not always accessible in rural areas
- Most farmers rely on visual symptoms alone

## Our Solution

A **Decision Support System (DSS)** that:
1. Asks farmers structured questions about what they observe
2. Scores each possible disease based on their answers
3. Returns the most likely diagnosis + what to do next
4. (Phase 3) Combines with a photo-based AI classifier for higher accuracy

---

---

# SLIDE 3 — Conditions the System Covers

## 6 Identifiable Conditions

| Type | Condition |
|------|-----------|
| Non-biotic (soil/water stress) | Iron Toxicity |
| Non-biotic | Nitrogen Deficiency |
| Non-biotic | Salt Toxicity |
| Biotic (fungal/bacterial) | Bacterial Blight |
| Biotic | Brown Spot |
| Biotic | Blast |

## Special Outputs
- **Sheath Blight Warning** — advisory flag (outside current scope)
- **Uncertain** — not enough information to diagnose
- **Out of Scope** — symptoms don't match any known pattern

---

---

# SLIDE 4 — System Architecture (Overview)

```
Farmer Input (Questionnaire)
         │
         ▼
  ┌─────────────┐
  │  Validation │  ← Cleans and validates all answers
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Scoring   │  ← Scores all 6 conditions using rule weights
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     ┌───────────────┐
  │  Decision   │◄────│ ML Image      │  (Phase 3)
  │  Engine     │     │ Classifier    │
  └──────┬──────┘     └───────────────┘
         │
         ▼
  ┌─────────────┐
  │   Output    │  ← Condition + confidence + recommendations
  └─────────────┘
```

- **Questionnaire weight: 60%**
- **ML weight: 40%**
- Non-biotic conditions always override ML (water/soil stress cannot be seen in a photo)

---
The system follows a hybrid architecture.
Farmers first provide questionnaire inputs describing symptoms, fertilizer usage, water conditions, and crop history.
- These inputs are validated and passed into scoring functions that estimate the likelihood of each condition.
- In Phase 3, an image-based machine learning classifier analyzes leaf lesions.
- The decision engine then combines agronomic reasoning and visual AI evidence.

Importantly, questionnaire reasoning carries higher weight because soil and nutrient stresses cannot be detected from images alone.

---

# SLIDE 5 — How the Scoring Works

## Each condition has its own scoring function (derived from agricultural literature)

- The system asks ~15 questions about the crop
- Each answer either **adds** or **subtracts** from a condition's score
- Scores range from **0.0 to 1.0**
- A **confidence modifier** (0.65–1.0) scales all scores based on how sure the farmer is

## Example — Bacterial Blight scoring signals

| Signal | Effect |
|--------|--------|
| Symptoms include white tips or dried areas | +score |
| Morning ooze observed at leaf tips | +strong boost (pathognomonic marker) |
| Flooded field + heavy rain | +score |
| Symptoms on lower leaves only | -penalty |
| Previous season had same disease | +score |

> If morning ooze is detected with score ≥ 0.60, (some biological indicators)
> the system **locks** to Bacterial Blight regardless of other signals.
> This is called a **pathognomonic lock**.

---

---

# SLIDE 6 — Decision Hierarchy (8 Steps)

## How the system decides what to output

| Step | What it does |
|------|-------------|
| **STEP 0** | Validate all inputs — clean bad/missing answers |
| **STEP 1** | Run all 6 scoring functions |
| **STEP 2** | Check if all scores are too low → return "Uncertain" or "Out of Scope" |
| **STEP 3** | If any **non-biotic** condition scores high → return it immediately (overrides ML) |
| **STEP 4** | If **morning ooze** detected → lock to Bacterial Blight |
| **STEP 5** | If top questionnaire score ≥ 0.80 → return it directly (no ML needed) |
| **STEP 6** | If ML image probabilities are available → fuse (60% Q + 40% ML) |
| **STEP 7** | Evaluate final biotic scores → return result or "Ambiguous" if two conditions are too close |

> The hierarchy ensures that **biological reasoning always takes priority over image AI**.

---

---

# SLIDE 7 — Output Example

## What the farmer/system receives

```
Condition:      Bacterial Blight
Confidence:     Probable  (score: 0.82)

Immediate action:
  • Apply copper-based bactericide
  • Drain field for 3–5 days if waterlogged

Preventive:
  • Avoid overhead irrigation during flowering
  • Use certified disease-free seed next season

Monitoring:
  • Re-check in 5 days — if spreading, consult extension officer

Consult specialist: Yes
```

> Recommendations are personalised based on the farmer's growth stage, fertilizer history, and soil type.

---

---

# SLIDE 8 — Project File Structure

## What has been built (Phase 1 & 2 complete)

```
rice_dss/
├── dss/
│   ├── validation.py       ✅ Input validation
│   ├── scoring.py          ✅ All 6 scoring functions
│   ├── recommendations.py  ✅ Farmer action recommendations
│   ├── output_builder.py   ✅ Output formatting
│   ├── decision.py         ✅ Core decision logic
│   └── mode_layer.py       ✅ Mode switcher (Q / ML / Hybrid)
├── api/
│   ├── schemas.py          ✅ API request/response models
│   └── main.py             ✅ REST API (3 endpoints)
├── ml/
│   ├── dataset.py          ✅ Image dataset loader
│   ├── train.py            ✅ MobileNetV2 training script
│   └── inference.py        ✅ Inference wrapper
└── tests/
    ├── test_dss.py         ✅ 20 validated test cases
    ├── test_robustness.py  ✅ Farmer noise simulation
    ├── test_api.py         ✅ API endpoint tests
    └── test_ml.py          ✅ ML pipeline tests
```

---

---

# SLIDE 9 — Test Results

## 46 / 46 Tests Passing ✅

| Test Suite | Tests | Status |
|------------|-------|--------|
| DSS Core — 20 original cases | 20 | ✅ All pass |
| DSS Edge cases + validation | 10 | ✅ All pass |
| Robustness (farmer noise simulation) | 1 | ✅ Pass |
| ML pipeline contracts | 15 | ✅ All pass |

## Key test cases verified
- Classic Blast (Flowering Stage)
- Bacterial Blight with morning ooze lock
- Iron Toxicity overriding a high ML blast score
- Ambiguous Blast vs Brown Spot
- False positive prevention (rain without disease)
- Incomplete farmer data → Uncertain output

---

---

# SLIDE 10 — REST API (Phase 2 Complete)

## 3 Endpoints, running locally

| Endpoint | Mode | Description |
|----------|------|-------------|
| `POST /questionnaire` | Questionnaire only | No image needed |
| `POST /ml-only` | ML only | Image classifier result only |
| `POST /hybrid` | Fused 60/40 | Questionnaire + ML combined |
| `GET /health` | — | System status check |

## To run locally
```bash
uvicorn api.main:app --reload --port 8000
```

Interactive API docs available at:
`http://localhost:8000/docs`

---

---

# SLIDE 11 — ML Component (Phase 3 — In Progress)

## Image Classifier Design

- **Architecture**: MobileNetV2 (pretrained on ImageNet)
- **Task**: Classify 3 biotic rice diseases from leaf photos
- **Classes**: Bacterial Blight, Brown Spot, Blast
- **Output**: Probability per class → fed into hybrid DSS

## Training Plan
```
Phase 1:  Train head only (base frozen)     — 10 epochs
Phase 2:  Fine-tune last 20 layers          — remaining epochs
Callbacks: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
```

## Why MobileNetV2?
- Lightweight — suitable for mobile deployment
- Strong feature extraction from small datasets
- Pretrained features transfer well to plant disease patterns

## Status
> Training script is ready (`ml/train.py`).
> Awaiting labelled training images in `data/` folder.

---

---

# SLIDE 12 — What's Next (Phase 3)

## Remaining work

| # | Task | Status |
|---|------|--------|
| 1 | Collect & label training images | ⏳ Pending |
| 2 | Train MobileNetV2 model | ⏳ Pending |
| 3 | Evaluate model accuracy | ⏳ Pending |
| 4 | Connect model to API hybrid endpoint | ⏳ Pending |
| 5 | Build farmer-facing UI (mobile/web) | ⏳ Pending |
| 6 | Field testing with real farmer inputs | ⏳ Pending |

## Immediate next step
Organise training images into:
```
data/
├── bacterial_blight/
├── blast/
└── brown_spot/
```
Then run: `python ml/train.py --data_dir data/ --epochs 20`

---

---

# SLIDE 13 — Summary

## What has been achieved

✅ Full rule-based DSS logic — 6 conditions, 8-step decision hierarchy

✅ Scientifically validated scoring weights (referenced to agricultural literature)

✅ Personalised recommendations (soil type, growth stage, fertilizer history)

✅ REST API with 3 inference modes (questionnaire / ML / hybrid)

✅ ML training pipeline ready (MobileNetV2, awaiting data)

✅ 46/46 automated tests passing

✅ Version controlled on GitHub (`github.com/Soxavin/rice_dss`)

## Core design principle
> Questionnaire biological reasoning always takes priority.
> ML image classification supports — it never overrides — the rule-based logic.

---

*FYP Progress Update — February 2026*
