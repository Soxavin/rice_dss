# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/decision.py — Main Decision Logic
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 2, Cell 17
#
# PURPOSE:
#   Contains generate_output() — the single immutable core entry point for
#   the entire DSS. All API endpoints and mode wrappers call this function.
#
# ⚠️  INFRASTRUCTURE NOTE (added during project conversion):
#   generate_output() is IMMUTABLE CORE LOGIC. Do NOT modify the decision
#   hierarchy, step ordering, threshold checks, or fusion logic below.
#   Any change here will break the scientifically validated behaviour and
#   the 20-case test suite in tests/test_dss.py.
#
# CONTROLLED DOMINANCE HIERARCHY (from original notebook):
#   STEP 0 — Validate inputs
#   STEP 1 — Questionnaire scoring
#   STEP 2 — Out-of-scope / uncertain detection
#   STEP 3 — Non-biotic dominance (overrides ML)
#   STEP 4 — Pathognomonic lock (morning ooze → bacterial blight)
#   STEP 5 — Strong questionnaire dominance (≥0.80 resists ML override)
#   STEP 6 — Safe ML fusion (moderate evidence only)
#   STEP 7 — Final biotic evaluation
#
# DESIGN PHILOSOPHY (unchanged from original):
#   1. Questionnaire evidence is primary biological reasoning.
#   2. Non-biotic stresses override ML entirely.
#   3. Pathognomonic signs (morning ooze) cannot be suppressed by ML.
#   4. Strong questionnaire dominance (≥0.80) resists ML override.
#   5. ML fusion only occurs when evidence is moderate and safe to combine.
#   6. Strong disagreement triggers ambiguity, not silent override.
# =============================================================================

from dss.validation import validate_answers
from dss.scoring import compute_all_scores, cap_score
from dss.output_builder import (
    THRESHOLD_PROBABLE,
    THRESHOLD_POSSIBLE,
    THRESHOLD_AMBIGUOUS_GAP,
    NON_BIOTIC_CONDITIONS,
    BIOTIC_CONDITIONS,
    QUESTIONNAIRE_WEIGHT,
    ML_WEIGHT,
    build_standard_output,
    build_ambiguous_output,
    build_uncertain_output,
    build_out_of_scope_output,
    append_sheath_warning_if_needed,
)


# =============================================================================
# CELL 17 (UPDATED): MAIN DECISION LOGIC — generate_output()
# -----------------------------------------------------------------------------
# CONTROLLED DOMINANCE HIERARCHY
#
# NEW:
#   ✓ Ambiguous score now uses conservative min(Q, ML)
#   ✓ No structural logic change
# =============================================================================

def generate_output(raw_answers: dict) -> dict:

    # STEP 0 — Validate
    answers = validate_answers(raw_answers)

    # STEP 1 — Questionnaire scoring
    result = compute_all_scores(answers)
    questionnaire_scores = result['scores'].copy()
    flags = result['flags']
    scores = questionnaire_scores.copy()

    # STEP 2 — OUT OF SCOPE vs UNCERTAIN
    if flags['out_of_scope']:
        if not answers.get('symptoms'):
            output = build_out_of_scope_output(scores)
        else:
            output = build_uncertain_output(scores)
        return append_sheath_warning_if_needed(output, flags)

    # STEP 3 — NON-BIOTIC DOMINANCE
    non_biotic_scores = {k: scores[k] for k in NON_BIOTIC_CONDITIONS}
    top_nb = max(non_biotic_scores, key=non_biotic_scores.get)
    top_nb_score = non_biotic_scores[top_nb]

    if top_nb_score >= THRESHOLD_PROBABLE:
        sorted_nb = sorted(non_biotic_scores.values(), reverse=True)
        gap = sorted_nb[0] - sorted_nb[1] if len(sorted_nb) > 1 else 1.0
        output = build_standard_output(top_nb, top_nb_score, gap, scores, answers)
        return append_sheath_warning_if_needed(output, flags)

    # STEP 4 — PATHOGNOMONIC LOCK
    if 'morning_ooze' in answers.get('additional_symptoms', []):
        if questionnaire_scores.get('bacterial_blight', 0.0) >= 0.60:
            biotic_q = {k: questionnaire_scores[k] for k in BIOTIC_CONDITIONS}
            sorted_b = sorted(biotic_q.items(), key=lambda x: x[1], reverse=True)
            gap = sorted_b[0][1] - sorted_b[1][1]

            output = build_standard_output(
                'bacterial_blight',
                questionnaire_scores['bacterial_blight'],
                gap,
                questionnaire_scores,
                answers
            )
            return append_sheath_warning_if_needed(output, flags)

    # STEP 5 — STRONG QUESTIONNAIRE DOMINANCE
    biotic_q = {k: questionnaire_scores[k] for k in BIOTIC_CONDITIONS}
    sorted_q = sorted(biotic_q.items(), key=lambda x: x[1], reverse=True)

    top_q_condition, top_q_score = sorted_q[0]
    second_q_score = sorted_q[1][1]
    q_gap = top_q_score - second_q_score

    ml = answers.get('ml_probabilities')

    if top_q_score >= 0.80 and ml and isinstance(ml, dict):

        top_ml_condition = max(ml, key=ml.get)
        top_ml_score = ml[top_ml_condition]

        if top_ml_score >= 0.80 and top_ml_condition != top_q_condition:

            # NEW: conservative ambiguity score
            ambiguity_score = min(top_q_score, top_ml_score)

            output = build_ambiguous_output(
                top_q_condition, top_q_score,
                top_ml_condition, top_ml_score,
                questionnaire_scores,
                answers,
                ambiguity_score=ambiguity_score
            )
            return append_sheath_warning_if_needed(output, flags)

        output = build_standard_output(
            top_q_condition, top_q_score, q_gap,
            questionnaire_scores, answers
        )
        return append_sheath_warning_if_needed(output, flags)

    # STEP 6 — SAFE ML FUSION
    if ml and isinstance(ml, dict):
        for condition in BIOTIC_CONDITIONS:
            scores[condition] = cap_score(
                QUESTIONNAIRE_WEIGHT * questionnaire_scores[condition] +
                ML_WEIGHT * ml.get(condition, 0.0)
            )

    # STEP 7 — Evaluate final biotic
    biotic_scores = {k: scores[k] for k in BIOTIC_CONDITIONS}
    sorted_biotic = sorted(biotic_scores.items(), key=lambda x: x[1], reverse=True)

    top_condition, top_score = sorted_biotic[0]
    second_condition, second_score = sorted_biotic[1]
    gap = top_score - second_score

    if top_score >= THRESHOLD_PROBABLE and gap >= THRESHOLD_AMBIGUOUS_GAP:
        output = build_standard_output(top_condition, top_score, gap, scores, answers)
        return append_sheath_warning_if_needed(output, flags)

    if (top_score >= THRESHOLD_PROBABLE and
    top_score < 0.75 and
    gap < THRESHOLD_AMBIGUOUS_GAP):
        if top_condition in {'blast', 'brown_spot'} and \
           second_condition in {'blast', 'brown_spot'}:

            ambiguity_score = min(top_score, second_score)

            output = build_ambiguous_output(
                top_condition, top_score,
                second_condition, second_score,
                scores, answers,
                ambiguity_score=ambiguity_score
            )
            return append_sheath_warning_if_needed(output, flags)

    if top_score >= THRESHOLD_POSSIBLE:
        output = build_standard_output(top_condition, top_score, gap, scores, answers)
        output['secondary_note'] = (
            'Evidence is suggestive but not conclusive. Monitor 3–5 days.'
        )
        return append_sheath_warning_if_needed(output, flags)

    output = build_uncertain_output(scores)
    return append_sheath_warning_if_needed(output, flags)
