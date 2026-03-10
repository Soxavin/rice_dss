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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import QuestionnaireRequest, DSSResponse, ExplainResponse
from dss.mode_layer import run_dss
from dss.validation import validate_answers
from dss.explainer import explain_scores
from dss.logger import dss_logger


# =============================================================================
# APP INITIALISATION
# =============================================================================

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

# Allow all origins for local development — restrict this in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# HELPER
# =============================================================================

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
async def questionnaire_endpoint(request: QuestionnaireRequest) -> dict:
    """
    Questionnaire-only mode.
    Explicitly disables ML fusion — ml_probabilities field is ignored.
    """
    raw = _request_to_dict(request)
    try:
        return run_dss(raw, mode="questionnaire")
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
async def ml_only_endpoint(request: QuestionnaireRequest) -> dict:
    """
    ML-only mode.
    Uses ml_probabilities field exclusively.
    Always warns that non-biotic stresses cannot be detected.
    """
    raw = _request_to_dict(request)
    try:
        return run_dss(raw, mode="ml")
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
async def hybrid_endpoint(request: QuestionnaireRequest) -> dict:
    """
    Hybrid mode (recommended).
    Runs full questionnaire scoring + ML fusion via generate_output().
    Falls back to questionnaire-only if ml_probabilities is None.
    """
    raw = _request_to_dict(request)
    try:
        return run_dss(raw, mode="hybrid")
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
async def explain_endpoint(request: QuestionnaireRequest) -> dict:
    """
    Explanation endpoint.
    Validates the incoming answers, then returns signal-level breakdown
    for all six conditions without running the decision engine.
    """
    raw = _request_to_dict(request)
    try:
        validated = validate_answers(raw)
        breakdown = explain_scores(validated)
        return {"explanations": breakdown}
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
# HEALTH CHECK
# =============================================================================

@app.get(
    "/health",
    summary="Health Check",
    description="Returns 200 OK if the API is running.",
    tags=["Utility"]
)
async def health_check():
    return {"status": "ok", "service": "Rice DSS API", "version": "1.0.0"}
