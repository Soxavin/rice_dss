# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/__init__.py — Package Initialiser
# -----------------------------------------------------------------------------
# Exposes the primary public API of the DSS package so callers can do:
#
#   from dss import run_dss, generate_output, validate_answers
#
# DO NOT modify the imports below without updating all callers in:
#   - api/main.py
#   - tests/test_dss.py
#   - tests/test_api.py
# =============================================================================

# DSS Core Package — DO NOT MODIFY LOGIC
from .validation import validate_answers
from .scoring import compute_all_scores, get_confidence_modifier
from .decision import generate_output
from .output_builder import (
    build_standard_output,
    build_ambiguous_output,
    build_uncertain_output,
    build_out_of_scope_output,
    append_sheath_warning_if_needed,
)
from .recommendations import get_recommendations
from .mode_layer import run_dss, questionnaire_only_logic, ml_only_logic, hybrid_logic
from .logger import dss_logger
from .validation import validate_ml_probabilities
from .explainer import explain_scores
