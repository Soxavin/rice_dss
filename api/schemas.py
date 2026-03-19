# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# api/schemas.py — Pydantic Request / Response Models
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion)
#
# PURPOSE:
#   Defines the FastAPI request and response schemas for all three endpoints.
#   These schemas are the contract between the API and any frontend/client.
#
# IMPORTANT:
#   The field names in QuestionnaireRequest MUST match the keys expected by
#   validate_answers() in dss/validation.py — do not rename them.
#
#   The response schema (DSSResponse) mirrors the output structure of
#   generate_output() in dss/decision.py — do not remove fields.
#
# OPTIONAL FIELDS:
#   Most questionnaire fields are Optional — the DSS handles missing values
#   safely via validate_answers(). This allows partial questionnaire submission.
# =============================================================================

from __future__ import annotations
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# REQUEST SCHEMA
# =============================================================================
# This schema defines ALL fields the DSS can accept. It is shared across
# all three endpoints (/questionnaire, /ml-only, /hybrid) — the mode
# determines which fields are actually used.
#
# The sections below mirror the 9-section questionnaire that farmers fill out.
# Each section maps to specific scoring functions in dss/scoring.py.
# For example, Section 4 (weather) feeds into the blast/brown_spot scorers
# because those diseases are strongly influenced by humidity and rainfall.

class QuestionnaireRequest(BaseModel):
    """
    Incoming payload for all three DSS endpoints.

    All fields are Optional — missing values are handled safely by
    validate_answers() which replaces them with None (neutral scoring).

    ml_probabilities:
        Required for /ml-only and /hybrid endpoints when an image is available.
        Must be a dict with keys: 'blast', 'brown_spot', 'bacterial_blight'
        Values should be softmax probabilities summing to ~1.0.
        Leave None for questionnaire-only mode.
    """

    # Section 1 — Growth stage
    # Different diseases are more likely at different growth stages.
    # e.g., blast is most common during tillering and flowering.
    growth_stage: Optional[str] = Field(
        None,
        description="One of: seedling, tillering, elongation, flowering, grain_filling"
    )

    # Section 2 — Symptom identification
    # These are the primary diagnostic signals. The scoring functions in
    # dss/scoring.py assign positive weights when symptoms match a condition's
    # known profile. Multiple symptoms can be selected (multiselect in UI).
    symptoms: Optional[List[str]] = Field(
        None,
        description="List of observed symptoms. Valid values: dark_spots, yellowing, "
                    "dried_areas, brown_discoloration, slow_growth, white_tips"
    )
    symptom_location: Optional[List[str]] = Field(
        None,
        description="Where symptoms appear: leaf_blade, leaf_sheath, stem, panicle"
    )
    symptom_origin: Optional[str] = Field(
        None,
        description="Where symptoms started: lower_leaves, upper_leaves, all_leaves, unsure"
    )
    farmer_confidence: Optional[str] = Field(
        'somewhat_sure',
        description="Farmer's confidence: very_sure, somewhat_sure, not_sure"
    )

    # Section 3 — Fertilizer history
    # Critical for detecting non-biotic stresses (N deficiency, salt toxicity).
    # Excessive nitrogen application is a key risk factor for blast disease.
    fertilizer_applied: Optional[bool] = Field(None, description="Has fertilizer been applied?")
    fertilizer_timing: Optional[str] = None
    fertilizer_type: Optional[str] = None
    fertilizer_amount: Optional[str] = Field(
        None,
        description="Amount applied: excessive, normal, less"
    )

    # Section 4 — Weather
    weather: Optional[str] = Field(
        None,
        description="Recent weather: heavy_rain, high_humidity, normal, dry_hot, unsure"
    )

    # Section 5 — Water management
    water_condition: Optional[str] = Field(
        None,
        description="Field water status: flooded_continuously, wet, dry, recently_drained"
    )

    # Section 6 — Spread pattern
    spread_pattern: Optional[str] = Field(
        None,
        description="How widely affected: few_plants, patches, most_of_field"
    )

    # Section 7 — Timing and onset
    symptom_timing: Optional[str] = None
    onset_speed: Optional[str] = Field(
        None,
        description="How quickly symptoms appeared: sudden, gradual, unsure"
    )

    # Section 8 — Field history
    previous_disease: Optional[str] = None
    previous_crop: Optional[str] = None
    soil_type: Optional[str] = None
    soil_cracking: Optional[str] = None

    # Section 9 — Additional symptoms
    additional_symptoms: Optional[List[str]] = Field(
        None,
        description="Additional signs: purple_roots, reduced_tillers, stunted_growth, "
                    "morning_ooze, none"
    )

    # ML input — injected when image is available
    # This field is populated automatically by /predict-image and /hybrid-image
    # endpoints. For direct JSON requests, the frontend injects it after
    # calling the ML model separately. The DSS uses these in STEP 6 (fusion).
    ml_probabilities: Optional[Dict[str, float]] = Field(
        None,
        description="Softmax probabilities from ML model. "
                    "Keys: blast, brown_spot, bacterial_blight. "
                    "Leave None for questionnaire-only mode."
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "growth_stage": "flowering",
            "symptoms": ["dark_spots", "dried_areas"],
            "symptom_location": ["leaf_blade", "panicle"],
            "symptom_origin": "upper_leaves",
            "farmer_confidence": "very_sure",
            "fertilizer_applied": True,
            "fertilizer_amount": "normal",
            "weather": "high_humidity",
            "water_condition": "wet",
            "spread_pattern": "patches",
            "onset_speed": "sudden",
            "previous_crop": "rice_same",
            "additional_symptoms": ["none"],
            "ml_probabilities": None
        }
    })


# =============================================================================
# RECOMMENDATION SCHEMA
# =============================================================================
# This mirrors the structure returned by get_recommendations() in
# dss/recommendations.py. Each condition has its own set of advice.

class RecommendationResponse(BaseModel):
    """Nested recommendations block within DSSResponse."""
    immediate: List[str]     # Urgent actions farmer should take now
    preventive: List[str]    # Long-term prevention strategies
    monitoring: str          # What to watch for in the coming days
    consult: bool            # Whether to advise consulting an agronomist


# =============================================================================
# RESPONSE SCHEMA
# =============================================================================
# This is the API contract — any frontend consuming the Rice DSS API should
# parse this structure. The field names match exactly what generate_output()
# and ml_only_logic() return in dss/. Do not rename fields without updating
# the DSS output builders in dss/output_builder.py.

class DSSResponse(BaseModel):
    """
    Standard DSS output returned by all three endpoints.
    Structure mirrors generate_output() return value from dss/decision.py.
    """
    # Status tells the frontend how to render the result:
    #   - "assessed": clear diagnosis was made
    #   - "ambiguous": two conditions are equally likely (show both)
    #   - "uncertain": evidence too weak (suggest monitoring)
    #   - "out_of_scope": no symptoms provided
    #   - "no_image" / "invalid_ml_output": ML-only mode failures
    status: str = Field(
        description="assessed | ambiguous | uncertain | out_of_scope | no_image | invalid_ml_output"
    )
    # Human-readable label includes both English and Khmer translations
    # e.g., "ជំងឺប្លាស (Rice Blast)"
    primary_condition: Optional[str] = Field(
        None,
        description="Human-readable condition name (English + Khmer)"
    )
    # Machine-readable key for programmatic use (e.g., "blast", "brown_spot")
    condition_key: Optional[str] = Field(
        None,
        description="Machine-readable condition identifier"
    )
    confidence_label: Optional[str] = Field(
        None,
        description="Human-readable confidence level"
    )
    confidence_level: Optional[str] = Field(
        None,
        description="high | medium | possible | low | ml_only"
    )
    score: float = Field(description="Primary condition score [0.0 – 1.0]")
    all_scores: Dict[str, float] = Field(
        description="Scores for all six conditions"
    )
    recommendations: Optional[Any] = Field(
        None,
        description="Structured recommendations for the identified condition"
    )
    secondary_note: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    disclaimer: Optional[str] = None
    mode_used: Optional[str] = Field(
        None,
        description="Questionnaire Only | ML Only | Hybrid (Recommended)"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
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
            "secondary_note": None,
            "warnings": [],
            "mode_used": "Hybrid (Recommended)"
        }
    })


# =============================================================================
# IMAGE PREDICTION RESPONSE SCHEMA
# =============================================================================
# Extends DSSResponse because /predict-image returns the standard DSS output
# PLUS the raw ML probabilities, so the frontend can show both the diagnosis
# and the per-class confidence bars.

class ImagePredictionResponse(DSSResponse):
    """
    Response from /predict-image endpoint.
    Extends DSSResponse with the raw ML probabilities and Grad-CAM heatmap.
    """
    ml_probabilities: Optional[Dict[str, float]] = Field(
        None, description="The 3-class probabilities produced by the ML model"
    )
    gradcam_base64: Optional[str] = Field(
        None, description="Base64-encoded PNG of the Grad-CAM heatmap overlay"
    )


# =============================================================================
# EXPLANATION RESPONSE SCHEMA
# =============================================================================
# The /explain endpoint provides score traceability — it shows exactly which
# questionnaire answers (signals) contributed to each condition's score,
# with their weights and reasons. This is essential for:
#   - FYP defence: proving the scoring logic is scientifically grounded
#   - Debugging: understanding why a particular diagnosis was made
#   - Farmer transparency: showing "why this condition was detected"

class SignalEntry(BaseModel):
    """A single signal that contributed to a condition's score."""
    field: str       # Which questionnaire field triggered this signal
    value: str       # What the farmer answered
    effect: str      # "+" for positive contribution, "-" for penalty
    weight: float    # How much this signal added/subtracted from the score
    reason: str      # Scientific rationale (e.g., "High humidity essential for blast")

class ConditionExplanation(BaseModel):
    """Explanation for a single condition."""
    signals: List[SignalEntry] = Field(default_factory=list)
    confidence_modifier: float   # Farmer confidence multiplier (1.0, 0.85, or 0.70)
    raw_total: float             # Sum of all signal weights before capping
    note: str = ""

class ExplainResponse(BaseModel):
    """
    Response from the /explain endpoint.
    Contains signal-level breakdowns for all six conditions.
    """
    explanations: Dict[str, Any] = Field(
        description="Keyed by condition (blast, brown_spot, etc.) plus "
                    "confidence_modifier and confidence_source at top level."
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "explanations": {
                "blast": {
                    "signals": [
                        {
                            "field": "weather",
                            "value": "high_humidity",
                            "effect": "+",
                            "weight": 0.30,
                            "reason": "High humidity essential for blast (PDF1)"
                        }
                    ],
                    "confidence_modifier": 1.0,
                    "raw_total": 0.80,
                    "note": "All signals scaled by confidence modifier, then capped [0, 1]"
                },
                "confidence_modifier": 1.0,
                "confidence_source": "very_sure"
            }
        }
    })
