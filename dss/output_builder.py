# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/output_builder.py — Output Formatter
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 2, Cell 16
#
# PURPOSE:
#   Formats the final output dictionary that the UI reads.
#   Separates decision logic (decision.py) from presentation formatting.
#
# INFRASTRUCTURE NOTE (added during project conversion):
#   These functions are called only by dss/decision.py (generate_output).
#   The output dictionary structure is the contract with api/schemas.py —
#   do not add or remove top-level keys without updating the Pydantic schemas.
#
# DESIGN PRINCIPLES (from original notebook):
#   1. Separate decision logic from presentation formatting.
#   2. Ensure all branches produce consistent structure.
#   3. Ambiguous cases must reflect reduced certainty numerically.
#   4. Sheath warnings are injected centrally via append_sheath_warning_if_needed().
# =============================================================================

from dss.recommendations import get_recommendations


# =============================================================================
# CELL 14: THRESHOLDS AND LABEL MAPS
# -----------------------------------------------------------------------------
# Central place for all threshold values and display text.
# If you want to adjust sensitivity, change values HERE only.
# Everything else reads from these constants automatically.
# =============================================================================

# Score thresholds — documented in your project notes
THRESHOLD_PROBABLE = 0.65   # "Probable X" — strong indicators present
THRESHOLD_POSSIBLE = 0.40   # "Possible X" — some indicators, monitor closely
THRESHOLD_AMBIGUOUS_GAP = 0.20  # If top two scores are within this gap = ambiguous

# Non-biotic conditions (questionnaire-only — ML cannot override these)
NON_BIOTIC_CONDITIONS = {'iron_toxicity', 'n_deficiency', 'salt_toxicity'}

# Biotic conditions (questionnaire + ML combined scoring)
BIOTIC_CONDITIONS = {'bacterial_blight', 'brown_spot', 'blast'}

# ML weighting — questionnaire is primary, ML is supporting
# These must sum to 1.0
QUESTIONNAIRE_WEIGHT = 0.60
ML_WEIGHT = 0.40

# Display names (English + Khmer) for each condition
CONDITION_LABELS = {
    'blast':            'ជំងឺប្លាស (Rice Blast)',
    'brown_spot':       'ជំងឺអុជត្នោត (Brown Spot)',
    'bacterial_blight': 'ជំងឺស្រកេន (Bacterial Blight)',
    'iron_toxicity':    'ពុលជាតិដែក (Iron Toxicity)',
    'n_deficiency':     'កង្វះជីអាស៊ូត (Nitrogen Deficiency)',
    'salt_toxicity':    'ពុលជាតិប្រៃ (Salt Toxicity)',
    'uncertain':        'មិនច្បាស់ (Uncertain)',
    'out_of_scope':     'ក្រៅវិសាលភាព (Outside Scope)',
    'ambiguous_fungal': 'ជំងឺផ្សិត (Fungal Disease — Unconfirmed Type)'
}

# Confidence labels
CONFIDENCE_LABELS = {
    'high':     'ប្រហែលជា — ទំនុកចិត្តខ្ពស់ (Probable — High Confidence)',
    'medium':   'ប្រហែលជា — ទំនុកចិត្តមធ្យម (Probable — Medium Confidence)',
    'possible': 'អាចជា (Possible — Monitor Closely)',
    'low':      'មិនច្បាស់ — ពិនិត្យបន្ថែម (Uncertain — Further Assessment Needed)'
}


def _extract_secondary_conditions(all_scores: dict, primary_key: str) -> list:
    """Extract conditions scoring above THRESHOLD_POSSIBLE, excluding primary."""
    secondary = []
    for key, score in all_scores.items():
        if key != primary_key and score >= THRESHOLD_POSSIBLE:
            secondary.append({
                'condition': CONDITION_LABELS.get(key, key),
                'condition_key': key,
                'score': round(score, 3),
            })
    secondary.sort(key=lambda x: x['score'], reverse=True)
    return secondary


def determine_confidence_label(score: float, gap: float = 1.0) -> str:
    """
    Converts a numeric score + score gap into a human-readable confidence level.

    LOGIC:
    - High: Strong score AND clear separation from second condition.
    - Medium: Strong score but competing close condition.
    - Possible: Moderate evidence.
    - Low: Weak evidence.

    Args:
        score (float): Top condition score.
        gap (float): Difference between top and second score.

    Returns:
        str: 'high', 'medium', 'possible', or 'low'
    """
    if score >= THRESHOLD_PROBABLE and gap >= THRESHOLD_AMBIGUOUS_GAP:
        return 'high'
    elif score >= THRESHOLD_PROBABLE and gap < THRESHOLD_AMBIGUOUS_GAP:
        return 'medium'
    elif score >= THRESHOLD_POSSIBLE:
        return 'possible'
    else:
        return 'low'


# -----------------------------------------------------------------------------
# STANDARD OUTPUT (Clear Identified Condition)
# -----------------------------------------------------------------------------
def build_standard_output(condition: str,
                          score: float,
                          gap: float,
                          all_scores: dict,
                          answers: dict) -> dict:
    """
    Builds output when a single condition is confidently identified.
    """

    confidence = determine_confidence_label(score, gap)

    return {
        'status': 'assessed',
        'primary_condition': CONDITION_LABELS.get(condition, condition),
        'condition_key': condition,
        'confidence_label': CONFIDENCE_LABELS.get(confidence, ''),
        'confidence_level': confidence,
        'score': round(score, 3),
        'all_scores': {k: round(v, 3) for k, v in all_scores.items()},
        'recommendations': get_recommendations(condition, answers),
        'secondary_conditions': _extract_secondary_conditions(all_scores, condition),
        'secondary_note': None,
        'warnings': [],
        'disclaimer': (
            'ប្រព័ន្ធនេះជួយសំណេចការសម្រេចចិត្ត មិនមែនជាការធ្វើរោគវិនិច្ឆ័យ។ '
            'This system provides decision support only — not definitive diagnosis. '
            'Consult an agronomist or local extension officer for confirmation.'
        )
    }


# -----------------------------------------------------------------------------
# AMBIGUOUS OUTPUT (Two Strong Conflicting Conditions)
# -----------------------------------------------------------------------------
def build_ambiguous_output(condition_a: str,
                           score_a: float,
                           condition_b: str,
                           score_b: float,
                           all_scores: dict,
                           answers: dict,
                           ambiguity_score: float = None) -> dict:
    """
    Builds output when two strong conditions conflict.

    IMPORTANT UPDATE:
    - We now accept ambiguity_score.
    - Instead of displaying the top score (which could be 1.0),
      we display a conservative score (usually min(Q, ML)).
    - This better represents epistemic uncertainty.
    """

    # Use conservative ambiguity score if provided
    display_score = ambiguity_score if ambiguity_score is not None else score_a

    return {
        'status': 'ambiguous',
        'primary_condition': CONDITION_LABELS.get('ambiguous_fungal'),
        'condition_key': 'ambiguous_fungal',
        'confidence_label': CONFIDENCE_LABELS.get('low'),
        'confidence_level': 'low',
        'score': round(display_score, 3),
        'all_scores': {k: round(v, 3) for k, v in all_scores.items()},
        'ambiguous_between': [
            {'condition': CONDITION_LABELS.get(condition_a),
             'score': round(score_a, 3)},
            {'condition': CONDITION_LABELS.get(condition_b),
             'score': round(score_b, 3)}
        ],
        'recommendations': {
            'immediate': [
                f'Symptoms could be {CONDITION_LABELS.get(condition_a)} or '
                f'{CONDITION_LABELS.get(condition_b)}',
                'Upload a close-up, well-lit photo of a single lesion',
                'Confirm lesion shape: diamond (blast) vs oval (brown spot)'
            ],
            'preventive': [
                'Maintain current water and fertilizer management while awaiting confirmation'
            ],
            'monitoring': (
                'Do not apply fungicide until condition is confirmed — '
                'incorrect treatment wastes money and may not work.'
            ),
            'consult': True
        },
        'secondary_conditions': [],
        'secondary_note': None,
        'warnings': [],
        'disclaimer': (
            'ប្រព័ន្ធនេះជួយសំណេចការសម្រេចចិត្ត មិនមែនជាការធ្វើរោគវិនិច្ឆ័យ។ '
            'This system provides decision support only — not definitive diagnosis.'
        )
    }


# -----------------------------------------------------------------------------
# UNCERTAIN OUTPUT (Weak Evidence)
# -----------------------------------------------------------------------------
def build_uncertain_output(all_scores: dict) -> dict:
    """
    Builds output when no condition reaches POSSIBLE threshold.
    """

    return {
        'status': 'uncertain',
        'primary_condition': CONDITION_LABELS.get('uncertain'),
        'condition_key': 'uncertain',
        'confidence_label': CONFIDENCE_LABELS.get('low'),
        'confidence_level': 'low',
        'score': 0.0,
        'all_scores': {k: round(v, 3) for k, v in all_scores.items()},
        'recommendations': get_recommendations('uncertain', {}),
        'secondary_conditions': [],
        'secondary_note': None,
        'warnings': [],
        'disclaimer': (
            'This system provides decision support only — not definitive diagnosis.'
        )
    }


# -----------------------------------------------------------------------------
# OUT-OF-SCOPE OUTPUT
# -----------------------------------------------------------------------------
def build_out_of_scope_output(all_scores: dict) -> dict:
    """
    Builds output when symptoms fall outside system scope.
    """

    return {
        'status': 'out_of_scope',
        'primary_condition': CONDITION_LABELS.get('out_of_scope'),
        'condition_key': 'out_of_scope',
        'confidence_label': '',
        'confidence_level': 'low',
        'score': 0.0,
        'all_scores': {k: round(v, 3) for k, v in all_scores.items()},
        'recommendations': {
            'immediate': [
                'Symptoms do not match known disease patterns in this system.',
                'Consider insect damage, herbicide injury, or physical stress.'
            ],
            'preventive': ['Maintain normal field management.'],
            'monitoring': 'Observe 3–5 days. If symptoms worsen, consult extension officer.',
            'consult': True
        },
        'secondary_conditions': [],
        'secondary_note': None,
        'warnings': [],
        'disclaimer': (
            'This system provides decision support only — not definitive diagnosis.'
        )
    }


# -----------------------------------------------------------------------------
# SHEATH WARNING INJECTION
# -----------------------------------------------------------------------------
def append_sheath_warning_if_needed(output: dict, flags: dict) -> dict:
    """
    Ensures sheath blight warning is consistently appended.
    """
    if flags.get('sheath_blight'):
        output['warnings'].append(
            '⚠️ Leaf sheath symptoms detected — may indicate Sheath Blight '
            '(outside system scope). Consult local expert.'
        )
    return output
