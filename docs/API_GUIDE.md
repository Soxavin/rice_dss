# Rice DSS — API Integration Guide

> Quick reference for frontend developers integrating with the Rice DSS backend.

## Getting Started

**Base URL (local development):**
```
http://localhost:8000
```

**Interactive API docs:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

**Start the API server:**
```bash
source .venv312/bin/activate
uvicorn api.main:app --reload --port 8000
```

**CORS:** All origins are allowed in development (`*`). For production, set the `CORS_ORIGINS` environment variable:
```bash
CORS_ORIGINS="https://yourdomain.com,http://localhost:3000" uvicorn api.main:app
```

---

## Endpoints Overview

| Endpoint | Method | Purpose | Content-Type |
|----------|--------|---------|--------------|
| `/questionnaire` | POST | Rule-based diagnosis (no image) | `application/json` |
| `/ml-only` | POST | ML probabilities only | `application/json` |
| `/hybrid` | POST | Full hybrid (recommended) | `application/json` |
| `/predict-image` | POST | Image upload → ML diagnosis | `multipart/form-data` |
| `/hybrid-image` | POST | Image + questionnaire combined | `multipart/form-data` |
| `/explain` | POST | Score breakdown / traceability | `application/json` |
| `/logs/summary` | GET | Aggregated run statistics | — |
| `/logs/runs` | GET | Recent run history | — |
| `/health` | GET | Health check | — |

---

## 1. Questionnaire-Only Mode

Use when the farmer fills out the questionnaire but has no leaf image.

```bash
curl -X POST http://localhost:8000/questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "growth_stage": "flowering",
    "symptoms": ["dark_spots", "dried_areas"],
    "symptom_location": ["leaf_blade", "panicle"],
    "symptom_origin": "upper_leaves",
    "farmer_confidence": "very_sure",
    "fertilizer_applied": true,
    "fertilizer_amount": "normal",
    "weather": "high_humidity",
    "water_condition": "wet",
    "spread_pattern": "patches",
    "onset_speed": "sudden",
    "additional_symptoms": ["none"],
    "ml_probabilities": null
  }'
```

**Response:**
```json
{
  "status": "assessed",
  "primary_condition": "ជំងឺប្លាស (Rice Blast)",
  "condition_key": "blast",
  "confidence_label": "ប្រហែលជា — ទំនុកចិត្តខ្ពស់ (Probable — High Confidence)",
  "confidence_level": "high",
  "score": 0.812,
  "all_scores": {
    "blast": 0.812,
    "brown_spot": 0.421,
    "bacterial_blight": 0.183,
    "iron_toxicity": 0.0,
    "n_deficiency": 0.0,
    "salt_toxicity": 0.0
  },
  "recommendations": {
    "immediate": ["Apply fungicide (tricyclazole or isoprothiolane)..."],
    "preventive": ["Use resistant varieties..."],
    "monitoring": "Check field daily for 5-7 days...",
    "consult": false
  },
  "secondary_note": null,
  "warnings": [],
  "disclaimer": "This is a decision support tool...",
  "mode_used": "Questionnaire Only"
}
```

---

## 2. ML-Only Mode (with JSON probabilities)

Use when you have ML probabilities from a separate prediction step. **Cannot detect non-biotic stresses.**

```bash
curl -X POST http://localhost:8000/ml-only \
  -H "Content-Type: application/json" \
  -d '{
    "ml_probabilities": {
      "blast": 0.85,
      "brown_spot": 0.10,
      "bacterial_blight": 0.05
    }
  }'
```

---

## 3. Hybrid Mode (Recommended)

Combines questionnaire answers with ML probabilities. Falls back to questionnaire-only if `ml_probabilities` is `null`.

```bash
curl -X POST http://localhost:8000/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "growth_stage": "flowering",
    "symptoms": ["dark_spots"],
    "symptom_location": ["leaf_blade"],
    "farmer_confidence": "very_sure",
    "weather": "high_humidity",
    "additional_symptoms": ["none"],
    "ml_probabilities": {
      "blast": 0.80,
      "brown_spot": 0.12,
      "bacterial_blight": 0.08
    }
  }'
```

---

## 4. Image Upload — Predict from Photo

Upload a leaf image directly. The server runs ML inference and returns the diagnosis.

```bash
curl -X POST http://localhost:8000/predict-image \
  -F "image=@leaf_photo.jpg"
```

**Response** (extends standard DSS response with `ml_probabilities`):
```json
{
  "status": "assessed",
  "condition_key": "blast",
  "score": 0.78,
  "ml_probabilities": {
    "blast": 0.82,
    "brown_spot": 0.11,
    "bacterial_blight": 0.07
  },
  "mode_used": "ML Only",
  "warnings": ["ML-only mode: non-biotic nutrient stresses cannot be detected..."],
  "..."
}
```

---

## 5. Hybrid with Image Upload

Upload a leaf image AND questionnaire answers together. The server runs ML inference on the image and fuses it with questionnaire scoring.

```bash
curl -X POST http://localhost:8000/hybrid-image \
  -F "image=@leaf_photo.jpg" \
  -F 'questionnaire={
    "growth_stage": "flowering",
    "symptoms": ["dark_spots"],
    "farmer_confidence": "very_sure",
    "weather": "high_humidity",
    "additional_symptoms": ["none"]
  }'
```

> **Note:** The `questionnaire` field is a JSON **string** sent as a form field, not as a file.

---

## 6. Score Explanation

Get a detailed signal-by-signal breakdown of how each condition was scored.

```bash
curl -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["dark_spots"],
    "weather": "high_humidity",
    "farmer_confidence": "very_sure",
    "additional_symptoms": ["none"]
  }'
```

---

## Questionnaire Field Reference

All fields are **optional** — the DSS handles missing values safely.

| Field | Type | Valid Values |
|-------|------|-------------|
| `growth_stage` | string | `seedling`, `tillering`, `elongation`, `flowering`, `grain_filling` |
| `symptoms` | string[] | `dark_spots`, `yellowing`, `dried_areas`, `brown_discoloration`, `slow_growth`, `white_tips` |
| `symptom_location` | string[] | `leaf_blade`, `leaf_sheath`, `stem`, `panicle` |
| `symptom_origin` | string | `lower_leaves`, `upper_leaves`, `all_leaves`, `unsure` |
| `farmer_confidence` | string | `very_sure`, `somewhat_sure`, `not_sure` |
| `fertilizer_applied` | boolean | `true`, `false` |
| `fertilizer_amount` | string | `excessive`, `normal`, `less` |
| `fertilizer_type` | string | `urea_only`, `balanced_npk`, `organic`, `unsure` |
| `weather` | string | `heavy_rain`, `high_humidity`, `normal`, `dry_hot`, `unsure` |
| `water_condition` | string | `flooded_continuously`, `wet`, `dry`, `recently_drained` |
| `spread_pattern` | string | `few_plants`, `patches`, `most_of_field` |
| `onset_speed` | string | `sudden`, `gradual`, `unsure` |
| `symptom_timing` | string | `right_after_transplant`, `during_tillering`, `around_flowering`, `near_harvest`, `unsure` |
| `previous_disease` | string | `yes_same`, `yes_different`, `no`, `unsure` |
| `previous_crop` | string | `rice_same`, `rice_different`, `other_crop`, `unsure` |
| `soil_type` | string | `kbal_po` (heavy clay), `dey_chheh` (sandy), `dey_lbeng` (loam), `unsure` |
| `soil_cracking` | string | `large_cracks`, `some_cracks`, `no_cracks`, `unsure` |
| `additional_symptoms` | string[] | `purple_roots`, `reduced_tillers`, `stunted_growth`, `morning_ooze`, `none` |
| `ml_probabilities` | object\|null | `{"blast": 0.8, "brown_spot": 0.1, "bacterial_blight": 0.1}` |

---

## Response Structure

Every DSS endpoint returns this structure:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `assessed`, `ambiguous`, `uncertain`, `out_of_scope`, `no_image`, `invalid_ml_output` |
| `primary_condition` | string | Bilingual condition name (Khmer + English) |
| `condition_key` | string | Machine-readable: `blast`, `brown_spot`, `bacterial_blight`, `iron_toxicity`, `n_deficiency`, `salt_toxicity` |
| `confidence_level` | string | `high`, `medium`, `possible`, `low`, `ml_only` |
| `confidence_label` | string | Bilingual confidence label |
| `score` | float | Primary condition score (0.0–1.0) |
| `all_scores` | object | All 6 condition scores |
| `recommendations` | object | `{immediate, preventive, monitoring, consult}` |
| `secondary_note` | string\|null | Note about close runner-up condition |
| `warnings` | string[] | System warnings (e.g., "non-biotic not detected in ML-only mode") |
| `disclaimer` | string | Standard disclaimer text |
| `mode_used` | string | `Questionnaire Only`, `ML Only`, `Hybrid (Recommended)` |

---

## Error Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Normal response |
| 422 | Unprocessable Entity | Invalid image format, malformed JSON |
| 500 | Internal Server Error | DSS logic error (should not happen) |
| 503 | Service Unavailable | ML model not loaded (for image endpoints) |

---

## JavaScript/TypeScript Integration Example

```typescript
// Questionnaire-only
const response = await fetch('http://localhost:8000/questionnaire', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    growth_stage: 'flowering',
    symptoms: ['dark_spots'],
    farmer_confidence: 'very_sure',
    additional_symptoms: ['none'],
    ml_probabilities: null,
  }),
});
const result = await response.json();
console.log(result.condition_key);  // "blast"
console.log(result.score);          // 0.812

// Image upload
const formData = new FormData();
formData.append('image', fileInput.files[0]);
const imgResponse = await fetch('http://localhost:8000/predict-image', {
  method: 'POST',
  body: formData,
});
const imgResult = await imgResponse.json();
console.log(imgResult.ml_probabilities);  // {blast: 0.82, ...}

// Hybrid with image
const hybridForm = new FormData();
hybridForm.append('image', fileInput.files[0]);
hybridForm.append('questionnaire', JSON.stringify({
  growth_stage: 'flowering',
  symptoms: ['dark_spots'],
  farmer_confidence: 'very_sure',
  additional_symptoms: ['none'],
}));
const hybridResponse = await fetch('http://localhost:8000/hybrid-image', {
  method: 'POST',
  body: hybridForm,
});
```
