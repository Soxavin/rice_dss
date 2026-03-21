# Rice Paddy Disease Decision Support System (Rice DSS)

> **Final Year Project** — A hybrid rule-based + ML decision support system for identifying rice paddy diseases in Cambodia.

---

## Overview

Cambodian rice farmers often misidentify crop diseases due to limited access to agricultural specialists. This system helps farmers diagnose rice paddy diseases by combining two complementary approaches:

1. **Structured Questionnaire** — A rule-based scoring engine that evaluates farmer-reported symptoms, field conditions, soil type, fertilizer history, and weather patterns against scientifically validated disease profiles.

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
| Advisory | Sheath Blight Warning | Questionnaire flag |
| Unresolved | Uncertain / Out of Scope | Insufficient evidence |

---

## Three Diagnosis Modes

| Mode | Input Required | Use Case |
|------|---------------|----------|
| **Questionnaire Only** | Farmer answers | No camera / no leaf image available |
| **Image Only (ML)** | Leaf photo | Quick field screening (3 biotic diseases only) |
| **Hybrid (Recommended)** | Photo + answers | Most accurate — full scoring + ML fusion |

---

## Project Structure

```
rice_dss/
├── dss/                         Core DSS engine (FROZEN LOGIC)
│   ├── __init__.py              Public API exports
│   ├── validation.py            Input validation + confidence modifier
│   ├── scoring.py               6 scoring functions (scientifically validated)
│   ├── decision.py              8-step decision hierarchy (immutable)
│   ├── output_builder.py        Threshold constants + output formatters
│   ├── recommendations.py       Condition-specific treatment advice
│   ├── mode_layer.py            run_dss() — 3-mode routing entry point
│   ├── explainer.py             Score traceability / signal breakdown
│   └── logger.py                JSONL audit trail for every DSS run
│
├── api/                         REST API (FastAPI)
│   ├── __init__.py
│   ├── main.py                  9 endpoints + CORS + image upload
│   └── schemas.py               Pydantic v2 request/response models
│
├── ml/                          ML Pipeline (EfficientNetV2B0)
│   ├── __init__.py
│   ├── dataset.py               TF dataset loader + augmentation
│   ├── train.py                 Multi-architecture training pipeline
│   ├── inference.py             4→3 class bridging + TTA for DSS integration
│   ├── gradcam.py               Grad-CAM heatmap generation + overlay
│   ├── experiment.py            Experiment tracking + comparison
│   └── evaluate.py              Classification report + confusion matrix
│
├── translations/                Language Layer (post-processing)
│   ├── __init__.py              Exports: translate_output, get_ui_labels
│   ├── core.py                  Bilingual string parsing + translation logic
│   ├── km.py                    Khmer translations (recommendations, warnings, UI)
│   └── en.py                    English UI labels + recommendation refinements
│
├── ui/                          Demo Interface (Streamlit)
│   └── app.py                   3-mode testing UI with Quick/Detailed questionnaire + language toggle
│
├── tests/                       Test Suite (142 tests)
│   ├── __init__.py
│   ├── test_dss.py              20 core disease cases (30 tests)
│   ├── test_hybrid.py           Hybrid ML fusion tests (25 tests)
│   ├── test_robustness.py       Adversarial input tests (14 tests)
│   ├── test_api.py              API endpoint tests (14 tests)
│   ├── test_ml.py               ML pipeline tests (35 tests)
│   ├── test_gradcam.py          Grad-CAM explainability tests (10 tests)
│   └── test_secondary.py        Secondary conditions tests (12 tests)
│
├── models/                      ML Model Artifacts
│   ├── rice_disease_model.keras Trained model (91.85% val accuracy)
│   ├── rice_disease_model.meta.json  Class names + config + backbone
│   ├── evaluation/              Confusion matrix + classification report
│   └── experiments/             Experiment snapshots for comparison
│
├── data/                        Training images (gitignored, see Dataset section)
├── logs/                        Runtime audit logs (gitignored)
│
├── docs/                        Project Documentation
│   ├── API_GUIDE.md             Frontend integration guide (for teammates)
│   ├── PROJECT_GUIDE.md         Detailed file-by-file documentation
│   └── PRESENTATION.md          FYP progress presentation (14 slides)
│
├── Dockerfile                   Container image (python:3.12-slim + TF CPU)
├── docker-compose.yml           API + UI services
├── .dockerignore                Docker build exclusions
├── .github/workflows/ci.yml    GitHub Actions CI (pytest on push/PR)
│
├── requirements.txt             Python dependencies
├── run_local.py                 Local sanity check + demo script
└── .gitignore                   Git exclusions
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [API Guide](docs/API_GUIDE.md) | Full frontend integration guide — curl examples, JS/TS code, request/response reference, error codes |
| [Project Guide](docs/PROJECT_GUIDE.md) | Detailed file-by-file documentation — what each file does, how they relate, data flow walkthroughs |
| [Presentation](docs/PRESENTATION.md) | FYP progress presentation — 14 slides covering architecture, ML results, and system design |
| [Experiment Report](models/experiments/EXPERIMENT_REPORT.md) | ML model selection — 6 experiments, comparison table, key findings, per-class metrics |

---

## Quick Start

### Prerequisites

- Python 3.12
- (Optional) TensorFlow 2.16+ for ML features

### 1. Set up the environment

```bash
cd rice_dss
python3.12 -m venv .venv312
source .venv312/bin/activate
pip install -r requirements.txt
pip install tensorflow    # Required for ML features
```

### 2. Verify the system

```bash
# Run the full test suite (142 tests)
pytest tests/ -v --tb=short

# Run the local sanity check
python run_local.py
```

### 3. Start the API server

```bash
uvicorn api.main:app --reload --port 8000
```

- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 4. Start the Streamlit UI

```bash
streamlit run ui/app.py
```

Opens at http://localhost:8501

### 5. Docker (alternative)

```bash
# API only
docker compose up

# API + Streamlit UI
docker compose --profile demo up
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/questionnaire` | POST | Rule-based diagnosis only |
| `/ml-only` | POST | ML probabilities only |
| `/hybrid` | POST | Full hybrid mode (recommended) |
| `/predict-image` | POST | Upload leaf photo for ML diagnosis |
| `/hybrid-image` | POST | Photo + questionnaire combined |
| `/explain` | POST | Signal-level score breakdown |

All DSS endpoints accept an optional `?lang=km` query parameter to return Khmer output (default: `en`).
| `/logs/summary` | GET | Aggregated run statistics |
| `/logs/runs` | GET | Recent run history |
| `/health` | GET | System status + model availability |

See [API_GUIDE.md](docs/API_GUIDE.md) for full integration documentation with curl examples and JS/TS code.

---

## ML Model

| Detail | Value |
|--------|-------|
| Architecture | EfficientNetV2B0 (pretrained ImageNet) |
| Dataset | 9,200 images, 4 balanced classes (2,300 each) |
| Training | Frozen backbone + Dense(256) head, 30 epochs |
| Validation Accuracy | **91.85%** |
| Input Size | 224 x 224 px |

### Per-Class Performance

| Condition | Precision | Recall | F1-Score |
|-----------|-----------|--------|----------|
| Bacterial Blight | 92.7% | 93.7% | 93.2% |
| Blast | 89.3% | 84.1% | 86.6% |
| Brown Spot | 91.6% | 91.6% | 91.6% |
| Healthy | 93.6% | 98.0% | 95.8% |

### Model Selection

6 experiments were conducted comparing MobileNetV2 vs EfficientNetV2B0 across different hyperparameters (label smoothing, fine-tuning depth, head size). See [Experiment Report](models/experiments/EXPERIMENT_REPORT.md) for full methodology, comparison table, and key findings.

### 4-to-3 Class Bridging

The model trains on 4 classes (including healthy) for better feature learning. At inference time:
- If healthy probability >= 60%: return uniform probabilities (DSS relies on questionnaire)
- Otherwise: drop healthy class, renormalize 3 disease probabilities to sum to 1.0

---

## Key Design Decisions

1. **Questionnaire always takes priority** — Biological reasoning from the scoring engine is the primary diagnostic signal. ML supports but never overrides.

2. **Non-biotic conditions override ML** — Iron toxicity, nitrogen deficiency, and salt toxicity are undetectable from leaf images. If the questionnaire scores them highly, they take precedence regardless of ML output.

3. **Pathognomonic lock** — Morning ooze (milky bacterial exudate at leaf tips) is a near-unique marker for Bacterial Blight. If detected with a score >= 0.60, the diagnosis locks to Bacterial Blight.

4. **Safe ML fusion** — Only applies when questionnaire evidence is moderate (< 0.80). Formula: `fused = 0.60 * Q + 0.40 * ML` for biotic conditions only.

5. **Strong disagreement = ambiguity** — If questionnaire and ML both score >= 0.80 for *different* conditions, the system reports ambiguity rather than silently overriding either source.

6. **Secondary conditions** — When other conditions score above the monitoring threshold (>= 0.40), they are surfaced alongside the primary diagnosis in an "Also Consider" section. This catches clinically relevant co-occurrences (e.g., Brown Spot + Nitrogen Deficiency).

7. **Smart questionnaire** — The UI offers Quick mode (~6 key questions) and Detailed mode (all fields + progressive disclosure). The backend handles missing fields gracefully, so Quick mode works without loss of safety.

---

## Frozen Constants (Do Not Modify)

| Constant | Value | Location |
|----------|-------|----------|
| `THRESHOLD_PROBABLE` | 0.65 | `dss/output_builder.py` |
| `THRESHOLD_POSSIBLE` | 0.40 | `dss/output_builder.py` |
| `THRESHOLD_AMBIGUOUS_GAP` | 0.20 | `dss/output_builder.py` |
| `QUESTIONNAIRE_WEIGHT` | 0.60 | `dss/output_builder.py` |
| `ML_WEIGHT` | 0.40 | `dss/output_builder.py` |

---

## Tests

142 tests across 7 suites, all passing (some may be skipped depending on optional TF/Plotly dependencies):

```bash
pytest tests/ -v --tb=short
```

| Suite | Count | Coverage |
|-------|-------|----------|
| Core DSS (20 disease cases) | 30 | All 6 conditions + edge cases |
| Hybrid ML fusion | 25 | Agreement, disagreement, non-biotic override |
| Robustness (adversarial) | 14 | Noise simulation, contradictory inputs |
| API endpoints | 14 | All 9 endpoints + image upload |
| ML pipeline | 35 | Dataset, inference, 4-to-3 bridge, multi-arch, experiments |
| Grad-CAM | 10 | Heatmap generation, overlay, schema validation |
| Secondary conditions | 12 | Extraction, translation, special outputs, full pipeline |

---

## Language Support

The system supports **English** (default) and **Khmer (ភាសាខ្មែរ)**.

- **UI**: Language toggle at the top of the Streamlit interface switches all labels, questions, and results
- **API**: Add `?lang=km` to any DSS endpoint to get Khmer output
- **Architecture**: Translations are a post-processing layer (`translations/`) that sits between the frozen DSS output and the response — no DSS core files are modified
- **Recommendations**: Refined for clarity, safety (label-based chemical guidance, banned chemicals removed), and real-world farmer usability. Both languages match in decision intent while using natural phrasing for each language
- **Trust messaging**: Non-biotic conditions (iron toxicity, N deficiency, salt toxicity) display an explicit note that pesticides are not effective. Confidence scores include a caveat about evidence strength
- **Guided specificity**: Soil-specific fertilizer rates from research are presented with "approximately" framing and a disclaimer encouraging farmers to adjust for their field conditions

---

## Dataset

The training dataset contains **9,200 leaf images** across 4 balanced classes (2,300 each): Bacterial Blight, Blast, Brown Spot, and Healthy. It was manually curated by the team from publicly available online datasets.

The dataset is **not included in the repository** (`data/` is gitignored) because it is too large for version control. The trained model (`models/rice_disease_model.keras`) is committed, so the dataset is **only needed if you want to retrain the model**.

### Setting up the dataset for training

1. Obtain the dataset from a team member
2. Place the images in the `data/` directory with this structure:

```
data/
├── bacterial_blight/   (2,300 images)
├── blast/              (2,300 images)
├── brown_spot/         (2,300 images)
└── healthy/            (2,300 images)
```

3. Train the model:

```bash
python -m ml.train --data_dir data/ --backbone efficientnetv2b0 --head_units 256 --epochs 30
```

---

## Deployment (Google Cloud Run)

### Prerequisites

- Google Cloud account with billing enabled (free tier covers this)
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed

### Setup

```bash
# Authenticate and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Deploy

```bash
cd rice_dss
gcloud run deploy rice-dss \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --memory 1Gi \
  --allow-unauthenticated \
  --set-env-vars "CORS_ORIGINS=*"
```

After deployment:
- **API URL**: `https://rice-dss-xxxxx.asia-southeast1.run.app`
- **Swagger docs**: `https://rice-dss-xxxxx.asia-southeast1.run.app/docs`
- **Health check**: `GET /health`

### Notes

- **Region**: `asia-southeast1` (Singapore) — closest to Cambodia
- **Memory**: 1Gi — enough for TensorFlow CPU + model
- **Cold starts**: First request after idle takes ~15-20s (TensorFlow loading). Subsequent requests are fast.
- **CORS**: Set `CORS_ORIGINS` to your frontend domain in production (e.g., `CORS_ORIGINS=https://myapp.com`)

---

## License

Final Year Project — Academic use only.
