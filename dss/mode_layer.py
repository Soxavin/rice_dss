# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/mode_layer.py — Mode Layer (Phase 3)
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 3, Cells 18–24
#
# PURPOSE:
#   Defines the three operational modes of the DSS:
#     - questionnaire_only_logic()  — no ML, pure rule-based
#     - ml_only_logic()             — ML probabilities only, no questionnaire
#     - hybrid_logic()              — full questionnaire + ML fusion (default)
#   run_dss() is the unified public entry point that selects the mode.
#
# INFRASTRUCTURE NOTE (added during project conversion):
#   run_dss() is the function called by api/main.py for all three endpoints:
#     POST /questionnaire  → mode="questionnaire"
#     POST /ml-only        → mode="ml"
#     POST /hybrid         → mode="hybrid"
#   The ML threshold constants below are used only in ml_only_logic().
#   They do NOT affect questionnaire or hybrid scoring.
#
# IMPORTANT:
#   ml_only_logic() intentionally cannot detect non-biotic stresses
#   (iron toxicity, nitrogen deficiency, salt toxicity). This is by design —
#   those conditions require questionnaire data. The warning is always injected.
# =============================================================================

from dss.decision import generate_output
from dss.output_builder import CONDITION_LABELS, CONFIDENCE_LABELS
from dss.recommendations import get_recommendations


# =============================================================================
# MODE LAYER — Phase 3
# =============================================================================
# Define ML Thresholds

ML_THRESHOLD_STRONG = 0.65
ML_THRESHOLD_POSSIBLE = 0.40


def ml_only_logic(raw_answers: dict) -> dict:
    """
    ML-only mode:
    - Uses only ML probabilities
    - Does NOT run questionnaire scoring
    - Cannot detect non-biotic stresses
    """

    ml_probs = raw_answers.get("ml_probabilities")

    if not ml_probs:
        return {
            "status": "no_image",
            "primary_condition": None,
            "message": "No ML probabilities provided.",
            "warning": "Non-biotic nutrient stresses cannot be detected in ML-only mode."
        }

    allowed_conditions = {"blast", "brown_spot", "bacterial_blight"}
    filtered = {k: v for k, v in ml_probs.items() if k in allowed_conditions}

    if not filtered:
        return {
            "status": "invalid_ml_output",
            "primary_condition": None,
            "message": "ML output missing valid disease classes.",
            "warning": "Non-biotic nutrient stresses cannot be detected in ML-only mode."
        }

    top_condition = max(filtered, key=filtered.get)
    top_score = filtered[top_condition]

    if top_score >= ML_THRESHOLD_STRONG:
        confidence = "Probable — High Confidence"
    elif top_score >= ML_THRESHOLD_POSSIBLE:
        confidence = "Possible — Moderate Confidence"
    else:
        return {
            "status": "uncertain",
            "primary_condition": None,
            "message": "ML confidence too low to assess.",
            "warning": "Non-biotic nutrient stresses cannot be detected in ML-only mode."
        }

    return {
        "status": "assessed",
        "primary_condition": CONDITION_LABELS.get(top_condition),
        "condition_key": top_condition,
        "confidence_label": confidence,
        "confidence_level": "ml_only",
        "score": round(top_score, 3),
        "all_scores": {k: round(v, 3) for k, v in filtered.items()},
        "recommendations": get_recommendations(top_condition, raw_answers),
        "secondary_note": None,
        "warnings": [
            "⚠️ Non-biotic nutrient stresses cannot be detected in ML-only mode."
        ],
        "disclaimer": (
            "This ML-only mode does not consider fertilizer history, "
            "soil type, or water management. Use hybrid mode for full assessment."
        )
    }


def questionnaire_only_logic(raw_answers: dict) -> dict:
    """
    Questionnaire-only mode.
    Explicitly disables ML fusion.
    """

    answers_copy = raw_answers.copy()
    answers_copy["ml_probabilities"] = None

    return generate_output(answers_copy)


def hybrid_logic(raw_answers: dict) -> dict:
    """
    Hybrid mode (recommended).
    Uses full questionnaire + ML fusion logic.
    """
    return generate_output(raw_answers)


def run_dss(raw_answers: dict, mode: str = "hybrid") -> dict:
    """
    Unified DSS entry point.

    Modes:
        - "questionnaire"  — pure rule-based, no ML
        - "ml"             — ML probabilities only
        - "hybrid"         — full questionnaire + ML fusion (default, recommended)

    Args:
        raw_answers (dict): Raw or validated farmer answers dict.
                            For "ml" mode, must include 'ml_probabilities' key.
        mode (str): One of "questionnaire", "ml", "hybrid".

    Returns:
        dict: DSS output with 'mode_used' field appended.

    Raises:
        ValueError: If an invalid mode string is provided.
    """

    if mode == "questionnaire":
        output = questionnaire_only_logic(raw_answers)
        output["mode_used"] = "Questionnaire Only"
        return output

    elif mode == "ml":
        output = ml_only_logic(raw_answers)
        output["mode_used"] = "ML Only"
        return output

    elif mode == "hybrid":
        output = hybrid_logic(raw_answers)
        output["mode_used"] = "Hybrid (Recommended)"
        return output

    else:
        raise ValueError(f"Invalid mode '{mode}'. Choose from: 'questionnaire', 'ml', 'hybrid'.")
