# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# api/main.py — FastAPI Application
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion)
#
# PURPOSE:
#   Exposes the DSS as a REST API with three endpoints:
#     POST /questionnaire  — questionnaire-only mode (no ML)
#     POST /ml-only        — ML probabilities only (no questionnaire scoring)
#     POST /hybrid         — full hybrid mode (default, recommended)
#
# IMPORTANT:
#   The three route handlers do NOT contain any DSS logic.
#   They only convert the request payload into a dict, delegate to run_dss(),
#   and return the result. All logic lives in dss/.
#
# HOW TO RUN LOCALLY:
#   uvicorn api.main:app --reload --port 8000
#
# INTERACTIVE DOCS:
#   http://localhost:8000/docs   ← Swagger UI
#   http://localhost:8000/redoc  ← ReDoc
# =============================================================================

import base64
import io
import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    QuestionnaireRequest, DSSResponse, ExplainResponse, ImagePredictionResponse,
    MultiImagePredictionResponse,
)
from dss.mode_layer import run_dss
from dss.validation import validate_answers
from dss.explainer import explain_scores
from dss.logger import dss_logger
from translations import translate_output


# =============================================================================
# APP INITIALISATION
# =============================================================================
# FastAPI app with metadata for auto-generated Swagger docs (/docs).
# The description, tags, and examples here are what Swagger renders —
# they help teammates integrate without reading Python code.

app = FastAPI(
    title="Rice Paddy Disease Decision Support System",
    description=(
        "Hybrid questionnaire + ML architecture for diagnosing rice paddy diseases "
        "and non-biotic nutrient stresses. Developed for Cambodian rice farmers.\n\n"
        "**Endpoints:**\n"
        "- `/questionnaire` — Rule-based diagnosis only (no image required)\n"
        "- `/ml-only` — ML model prediction only (image required)\n"
        "- `/hybrid` — Full hybrid mode (recommended)\n\n"
        "**Non-biotic stresses** (iron toxicity, nitrogen deficiency, salt toxicity) "
        "are detected by the questionnaire only and will override ML output."
    ),
    version="1.0.0",
    contact={
        "name": "Rice DSS Project",
    },
    license_info={
        "name": "Academic Use Only",
    }
)

# CORS CONFIGURATION
# In development, defaults to ["*"] (allow all origins) so the Streamlit UI
# and any local frontend can hit the API without CORS errors.
# In production, set CORS_ORIGINS="https://myapp.com,https://admin.myapp.com"
# to restrict which domains can make cross-origin requests.
_cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],     # Allow all headers (Authorization, Content-Type, etc.)
)


# =============================================================================
# HELPER
# =============================================================================
# All three DSS endpoints share the same conversion step:
#   Pydantic model → plain dict → run_dss()
# This keeps the route handlers thin — they only handle HTTP concerns
# (status codes, error wrapping) while all logic lives in dss/.

def _request_to_dict(request: QuestionnaireRequest) -> dict:
    """
    Converts Pydantic request model to a plain dict for DSS consumption.
    Uses model_dump() to include only explicitly set fields.
    None values are kept — validate_answers() handles them safely.
    """
    return request.model_dump()


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get(
    "/",
    summary="API Root",
    tags=["General"]
)
async def root():
    return {
        "service": "Rice Paddy Disease Decision Support System (Rice DSS)",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "questionnaire": "POST /questionnaire",
            "ml_only": "POST /ml-only",
            "hybrid": "POST /hybrid",
            "predict_image": "POST /predict-image",
            "hybrid_image": "POST /hybrid-image",
            "predict_images": "POST /predict-images",
            "hybrid_images": "POST /hybrid-images",
            "explain": "POST /explain",
        }
    }


@app.post(
    "/questionnaire",
    response_model=DSSResponse,
    summary="Questionnaire-Only Diagnosis",
    description=(
        "Runs the rule-based questionnaire scoring engine only. "
        "ML probabilities in the payload are ignored. "
        "Use this when no leaf image is available."
    ),
    tags=["DSS Endpoints"]
)
async def questionnaire_endpoint(
    request: QuestionnaireRequest,
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
) -> dict:
    """
    Questionnaire-only mode.
    Explicitly disables ML fusion — ml_probabilities field is ignored.
    """
    raw = _request_to_dict(request)
    try:
        output = run_dss(raw, mode="questionnaire")
        return translate_output(output, lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS error: {str(e)}")


@app.post(
    "/ml-only",
    response_model=DSSResponse,
    summary="ML-Only Diagnosis",
    description=(
        "Uses only the ML model probabilities for diagnosis. "
        "Does NOT run questionnaire scoring. "
        "**Cannot detect non-biotic stresses** (iron toxicity, N deficiency, salt toxicity). "
        "Requires ml_probabilities in the payload."
    ),
    tags=["DSS Endpoints"]
)
async def ml_only_endpoint(
    request: QuestionnaireRequest,
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
) -> dict:
    """
    ML-only mode.
    Uses ml_probabilities field exclusively.
    Always warns that non-biotic stresses cannot be detected.
    """
    raw = _request_to_dict(request)
    try:
        output = run_dss(raw, mode="ml")
        return translate_output(output, lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS error: {str(e)}")


@app.post(
    "/hybrid",
    response_model=DSSResponse,
    summary="Hybrid Diagnosis (Recommended)",
    description=(
        "Full hybrid mode combining questionnaire scoring and ML probabilities. "
        "This is the recommended endpoint for production use. "
        "If ml_probabilities is None, falls back to questionnaire-only scoring. "
        "Non-biotic stresses always override ML output."
    ),
    tags=["DSS Endpoints"]
)
async def hybrid_endpoint(
    request: QuestionnaireRequest,
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
) -> dict:
    """
    Hybrid mode (recommended).
    Runs full questionnaire scoring + ML fusion via generate_output().
    Falls back to questionnaire-only if ml_probabilities is None.
    """
    raw = _request_to_dict(request)
    try:
        output = run_dss(raw, mode="hybrid")
        return translate_output(output, lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS error: {str(e)}")


# =============================================================================
# EXPLAINABILITY ENDPOINT
# =============================================================================

@app.post(
    "/explain",
    response_model=ExplainResponse,
    summary="Score Explanation / Traceability",
    description=(
        "Returns a detailed breakdown of every signal (positive or penalty) "
        "that contributed to each condition's score. Useful for debugging, "
        "FYP defence, and farmer transparency. Does NOT run the full DSS — "
        "only computes explanations for the validated answers."
    ),
    tags=["DSS Endpoints"]
)
async def explain_endpoint(
    request: QuestionnaireRequest,
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
) -> dict:
    """
    Explanation endpoint.
    Validates the incoming answers, then returns signal-level breakdown
    for all six conditions without running the decision engine.
    """
    raw = _request_to_dict(request)
    try:
        validated = validate_answers(raw)
        breakdown = explain_scores(validated)
        return translate_output({"explanations": breakdown}, lang)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explainer error: {str(e)}")


# =============================================================================
# LOGGER / AUDIT ENDPOINTS
# =============================================================================

@app.get(
    "/logs/summary",
    summary="DSS Run Summary",
    description="Returns aggregated statistics from all DSS runs in this session.",
    tags=["Utility"]
)
async def logs_summary():
    return dss_logger.get_summary()


@app.get(
    "/logs/runs",
    summary="Recent DSS Runs",
    description="Returns the most recent DSS run logs (newest first).",
    tags=["Utility"]
)
async def logs_runs(limit: int = 20):
    runs = dss_logger.get_runs()
    return {"total": len(runs), "runs": runs[-limit:][::-1]}


# =============================================================================
# IMAGE UPLOAD ENDPOINTS
# =============================================================================
# These endpoints handle leaf image uploads for ML-based diagnosis.
# Two validation gates protect against bad uploads:
#   1. MIME type check — only JPEG, PNG, WebP accepted (rejects PDFs, ZIPs, etc.)
#   2. File size check — max 10 MB (prevents memory issues on the server)
# Both checks happen BEFORE loading the model or reading the full file.

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_MULTI_IMAGES = 5  # Maximum images for multi-angle endpoints


def _generate_gradcam_base64(model, image_bytes: bytes) -> str | None:
    """
    Generates a Grad-CAM overlay and returns it as a base64-encoded PNG string.
    Returns None if generation fails (graceful degradation).
    """
    try:
        overlay = model.get_gradcam(image_bytes)
        if overlay is None:
            return None
        buf = io.BytesIO()
        overlay.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        return None
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# LAZY-LOADED ML MODEL SINGLETON
# TensorFlow takes several seconds to import and the model takes memory to load.
# We defer both until the first image endpoint is actually called, so that:
#   - The API starts fast (useful for health checks, questionnaire-only usage)
#   - TensorFlow is never imported if only questionnaire endpoints are used
#   - The model is loaded exactly once and reused across all subsequent requests
_inference_model = None


def get_inference_model():
    """
    Returns the ML inference model, loading it on first call (lazy singleton).

    Returns None (instead of raising) if:
    - The .keras model file doesn't exist on disk (not yet trained)
    - TensorFlow is not installed (ImportError)
    This lets endpoints return HTTP 503 gracefully.
    """
    global _inference_model
    if _inference_model is None:
        model_path = Path("models/rice_disease_model.keras")
        if not model_path.exists():
            return None
        try:
            # Import is inside the function to avoid loading TensorFlow at module level
            from ml.inference import RiceDSSInference
            _inference_model = RiceDSSInference(str(model_path))
        except ImportError:
            return None
    return _inference_model


@app.post(
    "/predict-image",
    response_model=ImagePredictionResponse,
    summary="Image-Only Prediction",
    description=(
        "Upload a leaf image for ML-only diagnosis. "
        "Returns ML probabilities and an ML-only DSS output. "
        "**Cannot detect non-biotic stresses** — use /hybrid-image for full diagnosis."
    ),
    tags=["Image Endpoints"]
)
async def predict_image(
    image: UploadFile = File(...),
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
):
    """
    ML-only prediction from an uploaded leaf image.
    Returns HTTP 503 if no trained model is available.

    Flow:
      1. Validate MIME type (reject non-image files)
      2. Ensure ML model is loaded (lazy singleton)
      3. Read image bytes and check file size
      4. Run ML inference → 3-class probabilities
      5. Feed probabilities into ml_only_logic() via run_dss()
      6. Return DSS output + raw ML probabilities
    """
    # Gate 1: MIME type validation (happens before reading the file body)
    if image.content_type and image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported image type: {image.content_type}. Use JPEG, PNG, or WebP.")

    # Gate 2: Model availability (503 = service temporarily unavailable)
    model = get_inference_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not available. Train first with: python -m ml.train --data_dir data/"
        )

    # Gate 3: File size check (read bytes, then verify before processing)
    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=422, detail="Image too large. Maximum size is 10 MB.")

    # Run ML inference: image bytes → {blast, brown_spot, bacterial_blight} probs
    probs = model.predict_from_bytes(contents)
    if probs is None:
        raise HTTPException(status_code=422, detail="Could not recognize a rice leaf in this image. Please upload a clear photo of a rice leaf.")

    # Generate Grad-CAM overlay (non-blocking — failure is OK)
    gradcam_b64 = _generate_gradcam_base64(model, contents)

    # Feed ML probabilities into DSS (ml-only mode — no questionnaire scoring)
    raw = {'ml_probabilities': probs}
    try:
        output = run_dss(raw, mode="ml")
        output = translate_output(output, lang)
        # Attach raw ML probs and Grad-CAM to the response
        output['ml_probabilities'] = probs
        output['gradcam_base64'] = gradcam_b64
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS error: {str(e)}")


@app.post(
    "/hybrid-image",
    response_model=ImagePredictionResponse,
    summary="Hybrid Diagnosis with Image Upload",
    description=(
        "Upload a leaf image alongside questionnaire answers (as a JSON string) "
        "for full hybrid diagnosis. The ML probabilities are automatically "
        "injected from the image. Non-biotic stresses override ML output."
    ),
    tags=["Image Endpoints"]
)
async def hybrid_image(
    image: UploadFile = File(...),
    questionnaire: str = Form(
        ...,
        description="JSON string of questionnaire answers (same fields as QuestionnaireRequest)"
    ),
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
):
    """
    Full hybrid diagnosis: uploaded image + questionnaire JSON.
    Returns HTTP 503 if no trained model is available.

    This endpoint uses multipart/form-data (not JSON body) because it
    receives both a file upload AND form data in a single request.
    The questionnaire answers are sent as a JSON string in a form field.

    Flow:
      1. Validate image (MIME type, model availability, file size)
      2. Run ML inference → 3-class probabilities
      3. Parse questionnaire JSON string
      4. Inject ML probs into the answers dict
      5. Run full hybrid DSS (questionnaire scoring + ML fusion)
    """
    # Same validation gates as /predict-image
    if image.content_type and image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported image type: {image.content_type}. Use JPEG, PNG, or WebP.")

    model = get_inference_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not available. Train first with: python -m ml.train --data_dir data/"
        )

    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=422, detail="Image too large. Maximum size is 10 MB.")

    probs = model.predict_from_bytes(contents)
    if probs is None:
        raise HTTPException(status_code=422, detail="Could not recognize a rice leaf in this image. Please upload a clear photo of a rice leaf.")

    # Parse the questionnaire JSON string from the form field
    try:
        raw = json.loads(questionnaire)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Invalid JSON in questionnaire field.")

    # Generate Grad-CAM overlay (non-blocking — failure is OK)
    gradcam_b64 = _generate_gradcam_base64(model, contents)

    # Inject ML predictions into the answers dict — generate_output() will
    # pick these up in STEP 6 (Safe ML Fusion) of the decision hierarchy
    raw['ml_probabilities'] = probs
    try:
        output = run_dss(raw, mode="hybrid")
        output = translate_output(output, lang)
        output['ml_probabilities'] = probs
        output['gradcam_base64'] = gradcam_b64
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS error: {str(e)}")


# =============================================================================
# MULTI-IMAGE ENDPOINTS
# =============================================================================
# These endpoints accept multiple leaf images (e.g., different angles of the
# same leaf) and average the ML predictions across all images for a more
# robust diagnosis. The single-image endpoints above remain unchanged.


async def _validate_multi_images(images: list[UploadFile]) -> list[bytes]:
    """
    Validates and reads multiple uploaded images.
    Returns list of image bytes. Raises HTTPException on validation failure.
    """
    if len(images) < 2:
        raise HTTPException(
            status_code=422,
            detail="Multi-image endpoints require at least 2 images. Use /predict-image for single images."
        )
    if len(images) > MAX_MULTI_IMAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Too many images. Maximum is {MAX_MULTI_IMAGES}."
        )

    all_contents = []
    for i, img in enumerate(images):
        if img.content_type and img.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"Image {i+1}: unsupported type {img.content_type}. Use JPEG, PNG, or WebP."
            )
        contents = await img.read()
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=422,
                detail=f"Image {i+1}: too large. Maximum size is 10 MB per image."
            )
        all_contents.append(contents)

    return all_contents


@app.post(
    "/predict-images",
    response_model=MultiImagePredictionResponse,
    summary="Multi-Image Prediction (Multiple Angles)",
    description=(
        "Upload multiple leaf images (2–5, e.g., different angles of the same leaf) "
        "for ML-only diagnosis. Predictions are averaged across all images for higher accuracy. "
        "**Cannot detect non-biotic stresses** — use /hybrid-images for full diagnosis."
    ),
    tags=["Image Endpoints"]
)
async def predict_images(
    images: list[UploadFile] = File(..., description="2–5 leaf images (different angles)"),
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
):
    all_contents = await _validate_multi_images(images)

    model = get_inference_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not available. Train first with: python -m ml.train --data_dir data/"
        )

    probs = model.predict_from_multiple_bytes(all_contents)
    if probs is None:
        raise HTTPException(status_code=422, detail="Could not recognize rice leaves in the uploaded images. Please upload clear photos of rice leaves.")

    agreement = model.check_multi_image_agreement()
    gradcam_b64 = _generate_gradcam_base64(model, all_contents[0])

    raw = {'ml_probabilities': probs}
    try:
        output = run_dss(raw, mode="ml")
        output = translate_output(output, lang)
        output['ml_probabilities'] = probs
        output['gradcam_base64'] = gradcam_b64
        output['images_used'] = len(all_contents)
        output['images_agree'] = agreement['agree']
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS error: {str(e)}")


@app.post(
    "/hybrid-images",
    response_model=MultiImagePredictionResponse,
    summary="Hybrid Diagnosis with Multiple Images",
    description=(
        "Upload multiple leaf images (2–5) alongside questionnaire answers for "
        "full hybrid diagnosis. ML predictions are averaged across all images, "
        "then fused with questionnaire scoring. Non-biotic stresses override ML output."
    ),
    tags=["Image Endpoints"]
)
async def hybrid_images(
    images: list[UploadFile] = File(..., description="2–5 leaf images (different angles)"),
    questionnaire: str = Form(
        ...,
        description="JSON string of questionnaire answers (same fields as QuestionnaireRequest)"
    ),
    lang: str = Query("en", description="Response language: 'en' or 'km'"),
):
    all_contents = await _validate_multi_images(images)

    model = get_inference_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not available. Train first with: python -m ml.train --data_dir data/"
        )

    probs = model.predict_from_multiple_bytes(all_contents)
    if probs is None:
        raise HTTPException(status_code=422, detail="Could not recognize rice leaves in the uploaded images. Please upload clear photos of rice leaves.")

    agreement = model.check_multi_image_agreement()

    try:
        raw = json.loads(questionnaire)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Invalid JSON in questionnaire field.")

    gradcam_b64 = _generate_gradcam_base64(model, all_contents[0])

    raw['ml_probabilities'] = probs
    try:
        output = run_dss(raw, mode="hybrid")
        output = translate_output(output, lang)
        output['ml_probabilities'] = probs
        output['gradcam_base64'] = gradcam_b64
        output['images_used'] = len(all_contents)
        output['images_agree'] = agreement['agree']
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS error: {str(e)}")


# =============================================================================
# HEALTH CHECK
# =============================================================================
# Used by Docker HEALTHCHECK, load balancers, and monitoring to verify the API
# is running. Also reports whether the ML model has been loaded — if model_loaded
# is false, image endpoints will return 503 but questionnaire endpoints still work.

@app.get(
    "/health",
    summary="Health Check",
    description="Returns 200 OK if the API is running.",
    tags=["Utility"]
)
async def health_check():
    model = get_inference_model()
    return {
        "status": "ok",
        "service": "Rice DSS API",
        "version": "1.0.0",
        "model_loaded": model is not None,  # False if .keras file missing or TF unavailable
    }
