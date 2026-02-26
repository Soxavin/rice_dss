# Rice Paddy Disease Decision Support System (Rice DSS)

> **Final Year Project** — Rule-based + ML hybrid decision support system for rice paddy disease identification in Cambodia.

---

## Overview

This system helps farmers identify rice paddy diseases from observable field symptoms using a structured questionnaire. A Machine Learning (ML) image classifier can optionally be combined with the questionnaire output using a weighted fusion model.

**Supported conditions:**

| Type | Condition |
|------|-----------|
| Non-biotic | Iron Toxicity, Nitrogen Deficiency, Salt Toxicity |
| Biotic | Bacterial Blight, Brown Spot, Blast |
| Flagged | Sheath Blight (advisory only) |
| Unresolved | Out of Scope, Uncertain |

---

## Project Structure

```
rice_dss/
├── dss/                    # Core DSS logic (extracted from FYP.ipynb)
│   ├── __init__.py         # Public API exports
│   ├── validation.py       # Input validation + confidence modifier
│   ├── scoring.py          # All 6 scoring functions + compute_all_scores()
│   ├── recommendations.py  # Farmer-facing action recommendations
│   ├── output_builder.py   # Threshold constants + output formatters
│   ├── decision.py         # generate_output() — the immutable core logic
│   └── mode_layer.py       # run_dss() entry point (questionnaire/ml/hybrid)
│
├── api/                    # FastAPI REST interface
│   ├── __init__.py
│   ├── schemas.py          # Pydantic request/response models
│   └── main.py             # 3 endpoints: /questionnaire, /ml-only, /hybrid
│
├── ml/                     # ML pipeline scaffold (Phase 3)
│   ├── __init__.py
│   ├── dataset.py          # TensorFlow dataset loader
│   ├── train.py            # MobileNetV2 transfer learning trainer
│   └── inference.py        # Inference wrapper → DSS-compatible probabilities
│
├── tests/                  # Test suite
│   ├── __init__.py
│   ├── test_dss.py         # 20-case DSS unit tests
│   ├── test_robustness.py  # Noise simulation + farmer input testing
│   ├── test_api.py         # FastAPI endpoint tests
│   └── test_ml.py          # ML pipeline tests (Phase 3)
│
├── models/                 # Saved ML model weights (.keras files)
├── data/                   # Training images (gitignored)
├── run_local.py            # Local runner + sanity check script
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

---

## Setup

### 1. Create a virtual environment

```bash
cd "/Users/vin/Final Year Project/rice_dss"
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> **TensorFlow** is not included by default. Install it separately when you're ready for ML training (Phase 3):
> ```bash
> pip install tensorflow
> ```

### 3. Verify DSS logic

```bash
python run_local.py
```

This runs:
- **Sanity check** — Case 03: Bacterial Blight (morning ooze signal)
- **All 20 test cases** — reports PASS/FAIL
- **Score distribution analysis** — checks for overweighted conditions
- **Mode demonstration** — questionnaire / ml-only / hybrid

Expected output: `20/20 passed` with all sanity checks green.

---

## Running the API Server

```bash
uvicorn api.main:app --reload --port 8000
```

Or via the local runner:

```bash
python -c "import uvicorn; uvicorn.run('api.main:app', host='0.0.0.0', port=8000, reload=True)"
```

The API will be available at: [http://localhost:8000](http://localhost:8000)

Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints

### `POST /questionnaire`
Runs the questionnaire-only DSS. No ML image required.

**Request body:** `QuestionnaireRequest` (all symptom fields)

**Response:** `DSSResponse`

```json
{
  "condition_key": "bacterial_blight",
  "condition_label": "Bacterial Blight",
  "condition_label_kh": "ជំងឺ​ក្អែក​ស",
  "score": 0.74,
  "confidence_label": "Probable",
  "source": "questionnaire",
  "recommendations": { ... },
  "warnings": []
}
```

---

### `POST /ml-only`
Runs the ML-only mode. Returns a result based purely on image classifier probabilities.

**Request body:** `QuestionnaireRequest` with `ml_probabilities` populated.

**Note:** Non-biotic conditions cannot be detected by ML alone. The system will return a warning if the questionnaire signals a non-biotic condition.

---

### `POST /hybrid`
Fuses questionnaire + ML probabilities using a **60/40 weighted blend**.

- Questionnaire weight: **0.60** (dominant)
- ML weight: **0.40** (supporting)

Non-biotic conditions bypass the fusion and are returned directly from questionnaire logic (immutable override).

---

## Running Tests

```bash
# DSS core logic only (fastest, no API required)
pytest tests/test_dss.py -v

# Robustness simulation (farmer input noise)
pytest tests/test_robustness.py -v

# API endpoint tests (requires FastAPI + httpx)
pytest tests/test_api.py -v

# All tests
pytest tests/ -v
```

---

## ML Training (Phase 3)

### Dataset structure

Organise your training images in `data/` as follows:

```
data/
├── bacterial_blight/
│   ├── img_001.jpg
│   └── ...
├── brown_spot/
│   └── ...
└── blast/
    └── ...
```

### Train the model

```bash
python ml/train.py --data_dir data/ --epochs 20 --batch_size 32
```

The trained model will be saved to `models/rice_disease_model.keras`.

### Hyperparameters (defaults)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Architecture | MobileNetV2 | Pretrained on ImageNet |
| Image size | 224×224 | Standard MobileNetV2 input |
| Phase 1 epochs | 10 | Head only (base frozen) |
| Phase 2 epochs | remaining | Fine-tune last 20 layers |
| Batch size | 32 | Reduce if OOM on device |
| Learning rate | 1e-4 → 1e-5 | Reduced on plateau |

### Using a trained model with the API

Set the `MODEL_PATH` environment variable before starting the server:

```bash
MODEL_PATH=models/rice_disease_model.keras uvicorn api.main:app --reload
```

---

## Key Design Decisions

### Frozen constants (do not modify)
| Constant | Value | Purpose |
|----------|-------|---------|
| `THRESHOLD_PROBABLE` | 0.65 | Minimum score to report "Probable" |
| `THRESHOLD_POSSIBLE` | 0.40 | Minimum score to report "Possible" |
| `QUESTIONNAIRE_WEIGHT` | 0.60 | Questionnaire share in hybrid fusion |
| `ML_WEIGHT` | 0.40 | ML share in hybrid fusion |

### Decision hierarchy (in priority order)
1. Input validation
2. Questionnaire scoring
3. Out-of-scope / uncertain check
4. **Non-biotic dominance** — iron toxicity, N deficiency, salt toxicity override ML
5. **Pathognomonic lock** — morning ooze ≥ 0.60 locks to bacterial blight
6. Strong questionnaire dominance (score ≥ 0.80) bypasses ML fusion
7. Safe ML fusion (60/40 blend)
8. Final biotic evaluation

### Non-biotic conditions
Non-biotic conditions (Iron Toxicity, Nitrogen Deficiency, Salt Toxicity) are questionnaire-only. They cannot be detected by the image classifier and will always override ML output when the questionnaire signals them strongly.

---

## Development Notes

- All PDF source references (PDF1 = CARDI rice disease handbook, PDF2 = fertilizer management guide) are preserved as inline comments in the scoring functions.
- Khmer language annotations are preserved throughout the codebase as they appear in the original notebook.
- The `generate_output()` function in `dss/decision.py` is treated as immutable — do not modify its decision hierarchy.
- All scoring weights in `dss/scoring.py` are frozen. Changing them without re-running all 20 test cases risks breaking the calibration.

---

## License

Final Year Project — Academic use only.