# FYP Progress Presentation
## Rice Paddy Disease Decision Support System (DSS)
### Student Update — March 2026

---

---

# SLIDE 1 — Project Title

## Rice Paddy Disease
## Decision Support System

**Final Year Project**
Student: Vin (Soxavin)
Date: March 2026

> A rule-based + machine learning hybrid system to help Cambodian rice farmers identify paddy diseases from field symptoms and leaf photos.

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
2. Uses AI to classify leaf photos for biotic diseases
3. Combines both sources to score each possible disease
4. Returns the most likely diagnosis + what to do next

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

# SLIDE 4 — System Architecture

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
└─────┬─────┘         │  (3 classes) │
      │               └──────┬───────┘
      ▼                      │
┌───────────┐                │
│  Scoring  │  6 conditions  │
│  Engine   │────────────────┤
└─────┬─────┘                │
      │                      │
      ▼                      ▼
┌──────────────────────────────────┐
│        Decision Engine           │
│   8-step hierarchy               │
│   Q weight: 60%  ML weight: 40%  │
│   Non-biotic ALWAYS overrides ML │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   Output + Recommendations       │
│   (Bilingual: English + Khmer)   │
└──────────────────────────────────┘
```

---

---

# SLIDE 5 — Three Diagnosis Modes

## The system supports 3 operational modes

| Mode | Input | Use Case |
|------|-------|----------|
| **Questionnaire Only** | Farmer answers only | No camera / no image available |
| **Image Only (ML)** | Leaf photo only | Quick field screening |
| **Hybrid (Recommended)** | Photo + questionnaire | Most accurate — full scoring + ML fusion |

### Key Safety Rules
- **Non-biotic stresses** (iron toxicity, N deficiency, salt toxicity) can only be detected via questionnaire — ML cannot see soil/water issues
- **Hybrid mode** gives 60% weight to questionnaire, 40% to ML
- If the questionnaire is very confident (score >= 0.80), ML is not needed
- **Pathognomonic lock**: Morning ooze → auto-lock to Bacterial Blight

---

---

# SLIDE 6 — How the Scoring Works

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

> If morning ooze is detected with score >= 0.60,
> the system **locks** to Bacterial Blight regardless of other signals.
> This is called a **pathognomonic lock**.

---

---

# SLIDE 7 — Decision Hierarchy (8 Steps)

## How the system decides what to output

| Step | What it does |
|------|-------------|
| **STEP 0** | Validate all inputs — clean bad/missing answers |
| **STEP 1** | Run all 6 scoring functions |
| **STEP 2** | Check if all scores are too low → return "Uncertain" or "Out of Scope" |
| **STEP 3** | If any **non-biotic** condition scores high → return it immediately (overrides ML) |
| **STEP 4** | If **morning ooze** detected → lock to Bacterial Blight |
| **STEP 5** | If top questionnaire score >= 0.80 → return it directly (no ML needed) |
| **STEP 6** | If ML image probabilities are available → fuse (60% Q + 40% ML) |
| **STEP 7** | Evaluate final biotic scores → return result or "Ambiguous" if two conditions are too close |

> The hierarchy ensures that **biological reasoning always takes priority over image AI**.

---

---

# SLIDE 8 — ML Pipeline (Completed)

## Image Classifier — Trained & Integrated

- **Architecture**: EfficientNetV2B0 (pretrained on ImageNet)
- **Dataset**: 9,200 images — 4 balanced classes (2,300 each)
  - Bacterial Blight, Blast, Brown Spot, Healthy
- **Training**: Frozen backbone + Dense(256) classification head, 30 epochs
- **Validation accuracy: 91.85%**

## Per-Class Performance

| Condition | Precision | Recall | F1-Score |
|-----------|-----------|--------|----------|
| Bacterial Blight | 92.7% | 93.7% | 93.2% |
| Blast | 89.3% | 84.1% | 86.6% |
| Brown Spot | 91.6% | 91.6% | 91.6% |
| Healthy | 93.6% | 98.0% | 95.8% |

## Model Selection (6 Experiments)

| Experiment | Backbone | Val Accuracy |
|-----------|----------|--------------|
| Baseline | MobileNetV2 | 86.96% |
| + Label smoothing | MobileNetV2 | 86.41% |
| + Extended fine-tune | MobileNetV2 | 85.87% |
| EfficientNetV2B0 | EfficientNetV2B0 | 90.82% |
| + No smoothing | EfficientNetV2B0 | 90.92% |
| **+ Big head (256)** | **EfficientNetV2B0** | **91.85%** |

Key findings: EfficientNetV2B0 gives +4% over MobileNetV2. Fine-tuning hurts on this dataset size. Bigger head (+0.9%) and more epochs help.
See full report: `models/experiments/EXPERIMENT_REPORT.md`

## 4→3 Class Bridge
- Model trains on 4 classes (including healthy) for better feature learning
- At inference: if healthy >= 60% → fall back to questionnaire
- Otherwise → drop healthy, renormalize 3 disease probs to sum to 1.0

---

---

# SLIDE 9 — Output Example

## What the farmer/system receives

```
Condition:      Bacterial Blight
Confidence:     Probable  (score: 0.82)
Mode:           Hybrid (Recommended)

Immediate action:
  - Apply copper-based bactericide
  - Drain field for 3-5 days if waterlogged

Preventive:
  - Avoid overhead irrigation during flowering
  - Use certified disease-free seed next season

Monitoring:
  - Re-check in 5 days — if spreading, consult extension officer

Consult specialist: Yes
```

> Recommendations are personalised based on the farmer's growth stage, fertilizer history, and soil type.
> All condition and confidence labels are bilingual (English + Khmer).

---

---

# SLIDE 10 — REST API

## 9 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/questionnaire` | POST | Rule-based diagnosis only |
| `/ml-only` | POST | ML probabilities only |
| `/hybrid` | POST | Full hybrid mode (recommended) |
| `/predict-image` | POST | Upload leaf photo → ML diagnosis |
| `/hybrid-image` | POST | Photo + questionnaire combined |
| `/explain` | POST | Signal-level score breakdown |
| `/logs/summary` | GET | Aggregated run statistics |
| `/logs/runs` | GET | Recent run history |
| `/health` | GET | System status check |

## To run locally
```bash
uvicorn api.main:app --reload --port 8000
# Interactive docs: http://localhost:8000/docs
```

---

---

# SLIDE 11 — Test Results

## 128 / 128 Tests Passing

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| DSS Core — 20 disease cases | 30 | All 6 conditions + edge cases |
| Hybrid ML fusion | 25 | Agreement, disagreement, non-biotic override |
| Robustness (adversarial inputs) | 14 | Noise simulation, contradictory inputs |
| API endpoints | 14 | All 9 endpoints + image upload |
| ML pipeline | 35 | Dataset, inference, 4→3 bridge, multi-arch, experiments |
| Grad-CAM | 10 | Heatmap generation, overlay, schema validation |

## Key test cases verified
- Classic Blast (Flowering Stage)
- Bacterial Blight with morning ooze lock
- Iron Toxicity overriding a high ML blast score (0.95)
- Ambiguous Blast vs Brown Spot → ambiguous output
- Non-biotic always overrides ML in hybrid mode
- Healthy class threshold at exactly 0.60
- False positive prevention (rain without disease)
- Incomplete farmer data → Uncertain output

---

---

# SLIDE 12 — Project File Structure

## Complete System

```
rice_dss/
├── dss/                         CORE DSS (FROZEN)
│   ├── validation.py            Input validation (150+ rules)
│   ├── scoring.py               6 scoring functions (832 lines)
│   ├── decision.py              8-step decision hierarchy
│   ├── output_builder.py        Output formatting + thresholds
│   ├── recommendations.py       Farmer action recommendations
│   ├── mode_layer.py            3-mode routing (Q / ML / Hybrid)
│   ├── explainer.py             Score traceability
│   └── logger.py                JSONL audit trail
├── api/
│   ├── schemas.py               Pydantic request/response models
│   └── main.py                  FastAPI (9 endpoints, CORS, image upload)
├── ml/
│   ├── dataset.py               TF dataset loader + augmentation
│   ├── train.py                 Multi-architecture training pipeline
│   ├── inference.py             4→3 class bridging + TTA
│   ├── gradcam.py               Grad-CAM heatmap generation
│   ├── experiment.py            Experiment tracking + comparison
│   └── evaluate.py              Classification report + confusion matrix
├── ui/
│   └── app.py                   Streamlit demo UI (3-mode support)
├── tests/
│   ├── test_dss.py              20 core disease test cases
│   ├── test_hybrid.py           Hybrid fusion tests
│   ├── test_robustness.py       Adversarial input tests
│   ├── test_api.py              API endpoint tests
│   └── test_ml.py               ML pipeline tests
├── models/
│   ├── rice_disease_model.keras  Trained model (91.85% accuracy)
│   ├── evaluation/              Confusion matrix + classification report
│   └── experiments/             Experiment snapshots for comparison
├── Dockerfile                   Container deployment
├── docker-compose.yml           API + UI services
├── docs/                        Project documentation
│   ├── API_GUIDE.md             Frontend integration guide
│   ├── PROJECT_GUIDE.md         File-by-file documentation
│   └── PRESENTATION.md          This presentation
```

---

---

# SLIDE 13 — What's Next

## Remaining work

| # | Task | Status |
|---|------|--------|
| 1 | Frontend UI (teammate — Figma design) | In Progress |
| 2 | Connect frontend to API endpoints | Pending |
| 3 | Deployment (Docker setup ready) | Ready |
| 4 | FYP report writing | Pending |
| 5 | Defence preparation | Pending |

---

---

# SLIDE 14 — Summary

## What has been achieved

- Full rule-based DSS logic — 6 conditions, 8-step decision hierarchy
- Scientifically validated scoring weights (referenced to agricultural literature)
- Personalised recommendations (soil type, growth stage, fertilizer history)
- ML image classifier trained — 91.85% accuracy on 9,200 images
- 4→3 class bridging for safe ML→DSS integration
- REST API with 9 endpoints (3 modes + image upload + explainability)
- Streamlit demo UI with 3-mode support
- 128/128 automated tests passing
- Docker deployment ready
- Bilingual output (English + Khmer)
- Version controlled on GitHub

## Core design principle
> Questionnaire biological reasoning always takes priority.
> ML image classification supports — it never overrides — the rule-based logic.

---

*FYP Progress Update — March 2026*
