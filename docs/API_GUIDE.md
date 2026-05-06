# Rice DSS — API Integration Guide

> Quick reference for frontend developers integrating with the Rice DSS backend.

## Getting Started

**Live deployment (Cloud Run):**
```
https://rice-dss-137747818788.asia-southeast1.run.app
```

**Local development:**
```
http://localhost:8000
```

**Interactive API docs:**
- Live: https://rice-dss-137747818788.asia-southeast1.run.app/docs
- Local: http://localhost:8000/docs

**Start the API server locally:**
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

### DSS Diagnosis Endpoints

| Endpoint | Method | Purpose | Content-Type |
|----------|--------|---------|--------------|
| `/` | GET | API root — lists all endpoints | — |
| `/questionnaire` | POST | Rule-based diagnosis (no image) | `application/json` |
| `/ml-only` | POST | ML probabilities only | `application/json` |
| `/hybrid` | POST | Full hybrid (recommended) | `application/json` |
| `/predict-image` | POST | Image upload → ML diagnosis | `multipart/form-data` |
| `/hybrid-image` | POST | Image + questionnaire combined | `multipart/form-data` |
| `/predict-images` | POST | Multi-image (2–5) → averaged ML diagnosis | `multipart/form-data` |
| `/hybrid-images` | POST | Multi-image + questionnaire combined | `multipart/form-data` |
| `/explain` | POST | Score breakdown / traceability | `application/json` |
| `/logs/summary` | GET | Aggregated run statistics | — |
| `/logs/runs` | GET | Recent run history | — |
| `/health` | GET | Health check | — |

### Auth Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/me` | POST | `Authorization: Bearer <firebase_id_token>` | Exchange Firebase token for a backend JWT; creates user row on first call |
| `/auth/me` | GET | `Authorization: Bearer <backend_jwt>` | Return current user profile and role |

### Content API (No Auth Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/resources` | GET | List all published resources with translations |
| `/resources/{id}` | GET | Single resource with all translations |
| `/profiles` | GET | List all active expert/supplier profiles |
| `/profiles/{id}` | GET | Single active profile with specializations |
| `/products` | GET | List all products (optional `?profile_id=UUID` to filter by supplier) |
| `/products/{id}` | GET | Single product |

### Analysis History (Backend JWT Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/analyses` | POST | Save a DSS result for the current user |
| `/admin/analyses?limit=15&offset=0` | GET | Paginated analysis history for the current user |
| `/admin/analyses/{id}` | DELETE | Delete one of your own analyses |
| `/admin/analyses` | DELETE | Clear all of your analyses |

> **Note:** Although these endpoints are under the `/admin/` URL prefix, they do **not** require admin role — any authenticated user can access their own analyses. The `/admin` prefix is an artefact of how the router is registered in `main.py`. Access control is per-endpoint (user endpoints use `get_current_user`, admin endpoints use `require_admin`).

### Admin Endpoints (role=ADMIN JWT Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/resources` | GET | All resources (all statuses) |
| `/admin/resources` | POST | Create resource + translations |
| `/admin/resources/{id}` | PATCH | Update resource or translations |
| `/admin/resources/{id}` | DELETE | Delete resource (cascades to translations) |
| `/admin/profiles` | GET/POST | List or create profiles |
| `/admin/profiles/{id}` | PATCH/DELETE | Update or delete a profile |
| `/admin/users` | GET | All registered users |
| `/admin/users/{id}` | PATCH | Update user role or is_active |
| `/admin/analysis` | GET | All analyses across all users (filterable by mode) |
| `/admin/products` | GET | All products (no active filter) |
| `/admin/products` | POST | Create a product |
| `/admin/products/{id}` | PATCH | Update a product |
| `/admin/products/{id}` | DELETE | Delete a product |

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
  "secondary_conditions": [
    {
      "condition": "Brown Spot",
      "condition_key": "brown_spot",
      "score": 0.421
    }
  ],
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

**Response** (extends standard DSS response with `ml_probabilities` and `gradcam_base64`):
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
  "gradcam_base64": "iVBORw0KGgo...",
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

## 6. Multi-Image Prediction (Multiple Angles)

Upload 2–5 images of the same leaf (e.g., different angles, lighting) for a more robust ML prediction. The model runs on each image independently and **averages the probability vectors** across all images.

```bash
curl -X POST http://localhost:8000/predict-images \
  -F "images=@leaf_top.jpg" \
  -F "images=@leaf_side.jpg" \
  -F "images=@leaf_close.jpg"
```

**Response** (extends standard DSS response with `ml_probabilities`, `gradcam_base64`, and `images_used`):
```json
{
  "status": "assessed",
  "condition_key": "blast",
  "score": 0.78,
  "ml_probabilities": {
    "blast": 0.76,
    "brown_spot": 0.16,
    "bacterial_blight": 0.08
  },
  "gradcam_base64": "iVBORw0KGgo...",
  "images_used": 3,
  "mode_used": "ML Only",
  "..."
}
```

> **Limits:** Minimum 2 images, maximum 5. Each image max 10 MB. Grad-CAM is generated from the first image only.

---

## 7. Multi-Image Hybrid

Upload multiple leaf images AND questionnaire answers together. ML predictions are averaged across all images, then fused with questionnaire scoring.

```bash
curl -X POST http://localhost:8000/hybrid-images \
  -F "images=@leaf_top.jpg" \
  -F "images=@leaf_side.jpg" \
  -F 'questionnaire={
    "growth_stage": "flowering",
    "symptoms": ["dark_spots"],
    "farmer_confidence": "very_sure",
    "weather": "high_humidity",
    "additional_symptoms": ["none"]
  }'
```

> Same limits and response structure as `/predict-images`, but `mode_used` will be `"Hybrid (Recommended)"`.

---

## 8. Score Explanation

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
| `secondary_conditions` | array | Other conditions scoring >= 0.40 (empty `[]` if none). Each entry: `{condition, condition_key, score}` |
| `secondary_note` | string\|null | Note about close runner-up condition |
| `warnings` | string[] | System warnings (e.g., "non-biotic not detected in ML-only mode") |
| `disclaimer` | string | Standard disclaimer text |
| `mode_used` | string | `Questionnaire Only`, `ML Only`, `Hybrid (Recommended)` |

**Image endpoint responses** (`/predict-image`, `/hybrid-image`) also include:

| Field | Type | Description |
|-------|------|-------------|
| `ml_probabilities` | object | Raw 3-class ML model probabilities |
| `gradcam_base64` | string\|null | Base64-encoded PNG of the Grad-CAM heatmap overlay (null if generation failed) |

**Multi-image endpoint responses** (`/predict-images`, `/hybrid-images`) also include:

| Field | Type | Description |
|-------|------|-------------|
| `images_used` | int | Number of images successfully processed and averaged |

---

## Error Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Normal response |
| 422 | Unprocessable Entity | Invalid image format; image too large (>10 MB); image not recognised as a rice leaf (ML confidence < 0.80); malformed JSON |
| 500 | Internal Server Error | DSS logic error (should not happen) |
| 503 | Service Unavailable | ML model not loaded (for image endpoints) |

### OOD (Non-Rice Image) Error

When an uploaded image does not pass the ML confidence gate (`MIN_CONFIDENCE_THRESHOLD = 0.80`), the API returns:
```json
{
  "detail": "Could not recognize a rice leaf in this image. Please upload a clear photo of an affected rice plant leaf."
}
```
HTTP status: `422`. The frontend should surface this as a user-facing error message on Step 2/3. The model is a closed-world classifier — it cannot distinguish "not a rice plant" from "a rice plant I'm uncertain about." Images that strongly resemble disease textures may still pass this gate.

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

// Multi-image upload (multiple angles)
const multiForm = new FormData();
for (const file of fileInput.files) {  // 2–5 images
  multiForm.append('images', file);
}
const multiResponse = await fetch('http://localhost:8000/predict-images', {
  method: 'POST',
  body: multiForm,
});
const multiResult = await multiResponse.json();
console.log(multiResult.images_used);        // 3
console.log(multiResult.ml_probabilities);   // averaged across all images
```

---

## 9. Auth — Firebase Token Exchange

The frontend exchanges a Firebase ID token for a backend JWT once per login. All
subsequent requests to protected endpoints use the backend JWT.

```javascript
// Step 1: get Firebase ID token after sign-in
const firebaseUser = firebase.auth().currentUser;
const idToken = await firebaseUser.getIdToken();

// Step 2: exchange for backend JWT
const res = await fetch('https://rice-dss-137747818788.asia-southeast1.run.app/auth/me', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${idToken}` },
});
const { access_token } = await res.json();
// access_token is a HS256 JWT, valid for 24 hours

// Step 3: read user role
const profile = await fetch('.../auth/me', {
  headers: { 'Authorization': `Bearer ${access_token}` },
});
const { role } = await profile.json();  // "USER" or "ADMIN"
```

**Error codes:**
- `401` — invalid or expired Firebase ID token
- `403` — account is deactivated (`is_active = false`)

---

## 10. Content API — Resources

Public endpoints — no authentication required.

```javascript
// List all published resources
const res = await fetch('.../resources');
const resources = await res.json();
// resources = [{ id, type, category, thumbnail_url, published_at, translations: [...] }]

// Each resource has translations array:
const en = resource.translations.find(t => t.language === 'EN');
// { language, title, description, content }
// content is TipTap-generated HTML — render with dangerouslySetInnerHTML

// Get a single resource
const detail = await fetch(`.../resources/${id}`);
```

**Response shape:**
```json
[{
  "id": "uuid",
  "type": "ARTICLE",
  "status": "PUBLISHED",
  "thumbnail_url": "https://...",
  "published_at": "2026-04-30T00:00:00Z",
  "category": { "id": "uuid", "name": "Disease Management" },
  "translations": [
    { "language": "EN", "title": "...", "description": "...", "content": "<p>...</p>" },
    { "language": "KM", "title": "...", "description": "...", "content": "<p>...</p>" }
  ]
}]
```

---

## 11. Content API — Profiles

Public endpoints — no authentication required.

```javascript
// List all active profiles (experts + suppliers)
const res = await fetch('.../profiles');
const profiles = await res.json();

// Filter by type
const experts   = profiles.filter(p => p.type === 'EXPERT');
const suppliers = profiles.filter(p => p.type === 'SUPPLIER');
```

**Response shape:**
```json
{
  "id": "uuid",
  "type": "EXPERT",
  "name_en": "Dr. Sophal Chan",
  "name_km": "...",
  "bio_en": "...",
  "bio_km": "...",
  "job_title_en": "Rice Pathologist",
  "job_title_km": "...",
  "location_en": "Phnom Penh",
  "location_km": "...",
  "telegram": "sophal_rice",
  "experience_years": 12,
  "rating": 4.8,
  "online": true,
  "photo_url": "https://...",
  "languages": "Khmer,English",
  "specializations": [
    { "id": "uuid", "name": "Crop Disease Management" }
  ]
}
```

---

## 12. Analysis History (Authenticated)

All endpoints require `Authorization: Bearer <backend_jwt>`.

```javascript
const headers = { 'Authorization': `Bearer ${backendJwt}` };

// Save a result
await fetch('.../admin/analyses', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'HYBRID',            // ML | QUESTIONNAIRE | HYBRID
    result: dssResponseObject, // full DSS response
    confidence: 0.85,
  }),
});

// Get paginated history
const history = await fetch('.../admin/analyses?limit=15&offset=0', { headers });
// Returns: [{ id, mode, result, confidence, created_at }]

// Delete one entry
await fetch(`.../admin/analyses/${id}`, { method: 'DELETE', headers });

// Clear all
await fetch('.../admin/analyses', { method: 'DELETE', headers });
```

---

## 13. Content API — Products

Public endpoints — no authentication required. Used by the Experts & Support page to show treatment products.

```javascript
// List all products (optionally filtered by supplier profile)
const res = await fetch('.../products');
const products = await res.json();

// Filter by supplier
const supplierProducts = await fetch(`.../products?profile_id=${supplierId}`);

// Get a single product
const detail = await fetch(`.../products/${id}`);
```

**Response shape:**
```json
[{
  "id": "uuid",
  "profile_id": "uuid",
  "name_en": "Vigor BioYield+",
  "name_km": "វីហ្គីប យអូមហ ផល",
  "desc_en": "A biotechnology-based natural fertilizer...",
  "desc_km": "...",
  "category": "Yield Booster",
  "price": null,
  "image_url": null,
  "usage_instructions_en": "Apply 500ml per 20L water...",
  "usage_instructions_km": "...",
  "nutrients_json": {
    "N": "0.63%", "P": "0.48%", "K": "3.6%", "MgO": "3500ppm"
  },
  "created_at": "2026-05-06T00:00:00Z",
  "updated_at": "2026-05-06T00:00:00Z"
}]
```

**Admin CRUD** (requires `Authorization: Bearer <admin_jwt>`):

```javascript
const headers = {
  'Authorization': `Bearer ${adminJwt}`,
  'Content-Type': 'application/json',
};

// Create
await fetch('.../admin/products', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name_en: 'Product Name',
    name_km: 'ឈ្មោះផលិតផល',
    desc_en: 'Description...',
    category: 'Yield Booster',
    profile_id: 'supplier-uuid',   // optional FK to profiles
    nutrients_json: { N: '0.63%' }, // optional
  }),
});

// Update
await fetch(`.../admin/products/${id}`, { method: 'PATCH', headers, body: JSON.stringify({...}) });

// Delete
await fetch(`.../admin/products/${id}`, { method: 'DELETE', headers });
```
