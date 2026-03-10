# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/explainer.py — Score Explanation / Traceability Module
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project improvement phase)
#
# PURPOSE:
#   Generates human-readable explanations of WHY each condition scored
#   the way it did. Traces each signal (positive or penalty) that
#   contributed to the final score.
#
# WHY:
#   1. Helps professor understand scoring during FYP defence
#   2. Helps farmers (via UI) understand why the system says what it says
#   3. Debugging — identify which signals are contributing most
#   4. FYP evaluation chapter — explainability is a graded criterion
#
# USAGE:
#   from dss.explainer import explain_scores
#   breakdown = explain_scores(validated_answers)
#   # Returns {condition: [list of signal explanations]}
#
# IMPORTANT:
#   This module READS the same answer dict as scoring.py but does NOT
#   modify any scores. It is purely observational. The actual scoring
#   logic in scoring.py remains untouched and frozen.
# =============================================================================

from dss.scoring import (
    get_confidence_modifier,
    has_symptom,
    has_location,
    has_additional,
)


def explain_scores(answers: dict) -> dict:
    """
    Generates a detailed breakdown of every signal that contributed to
    each condition's score. Mirrors the logic in scoring.py exactly,
    but records each signal as a human-readable explanation.

    Args:
        answers: Validated answer dict (output of validate_answers())

    Returns:
        dict: {
            condition_key: {
                'signals': [
                    {'field': str, 'value': str, 'effect': str, 'weight': float,
                     'reason': str},
                    ...
                ],
                'confidence_modifier': float,
                'raw_total': float,   # before confidence scaling
                'note': str           # any special notes
            }
        }
    """
    confidence_mod = get_confidence_modifier(answers)

    return {
        'iron_toxicity':    _explain_iron_toxicity(answers, confidence_mod),
        'n_deficiency':     _explain_nitrogen_deficiency(answers, confidence_mod),
        'salt_toxicity':    _explain_salt_toxicity(answers, confidence_mod),
        'bacterial_blight': _explain_bacterial_blight(answers, confidence_mod),
        'brown_spot':       _explain_brown_spot(answers, confidence_mod),
        'blast':            _explain_blast(answers, confidence_mod),
        'confidence_modifier': confidence_mod,
        'confidence_source': answers.get('farmer_confidence', 'missing'),
    }


def _signal(field, value, weight, reason):
    """Helper to create a signal entry."""
    return {
        'field': field,
        'value': str(value),
        'effect': '+' if weight >= 0 else '−',
        'weight': round(weight, 2),
        'reason': reason,
    }


# =============================================================================
# IRON TOXICITY EXPLANATION
# =============================================================================
def _explain_iron_toxicity(answers, confidence_mod):
    signals = []
    raw = 0.0

    if answers.get('water_condition') == 'flooded_continuously':
        signals.append(_signal('water_condition', 'flooded_continuously', +0.30,
                               'Continuous flooding is a prerequisite for iron toxicity (PDF2 p.30)'))
        raw += 0.30

    if has_additional(answers, 'purple_roots'):
        signals.append(_signal('additional_symptoms', 'purple_roots', +0.35,
                               'Purple/brown roots = most distinctive marker, near-unique to iron toxicity (PDF2 p.30)'))
        raw += 0.35

    if answers.get('soil_type') in ['kbal_po', 'toul_samroung']:
        signals.append(_signal('soil_type', answers.get('soil_type'), +0.15,
                               'Known high-risk soil type for iron toxicity (PDF2 p.31)'))
        raw += 0.15
    elif answers.get('soil_cracking') == 'large_cracks':
        signals.append(_signal('soil_cracking', 'large_cracks', +0.10,
                               'Proxy signal for iron-toxic soil types'))
        raw += 0.10

    if answers.get('symptom_timing') == 'right_after_transplant':
        signals.append(_signal('symptom_timing', 'right_after_transplant', +0.20,
                               'Iron toxicity peaks 1-8 weeks after transplant (PDF2 p.30)'))
        raw += 0.20

    if has_symptom(answers, 'yellowing'):
        signals.append(_signal('symptoms', 'yellowing', +0.05, 'Yellowing consistent with iron toxicity'))
        raw += 0.05
    if has_symptom(answers, 'brown_discoloration'):
        signals.append(_signal('symptoms', 'brown_discoloration', +0.05, 'Brown discoloration on leaves'))
        raw += 0.05
    if answers.get('symptom_origin') == 'lower_leaves':
        signals.append(_signal('symptom_origin', 'lower_leaves', +0.10, 'Lower leaves affected first (iron toxicity pattern)'))
        raw += 0.10
    if answers.get('onset_speed') == 'gradual':
        signals.append(_signal('onset_speed', 'gradual', +0.05, 'Gradual onset matches iron toxicity'))
        raw += 0.05
    if answers.get('spread_pattern') == 'most_of_field':
        signals.append(_signal('spread_pattern', 'most_of_field', +0.05, 'Field-wide = systemic condition'))
        raw += 0.05

    # Penalties
    if answers.get('onset_speed') == 'sudden':
        signals.append(_signal('onset_speed', 'sudden', -0.10, 'Iron toxicity develops slowly, not suddenly'))
        raw -= 0.10
    if has_location(answers, 'leaf_sheath'):
        signals.append(_signal('symptom_location', 'leaf_sheath', -0.15, 'Leaf sheath suggests sheath blight'))
        raw -= 0.15
    if has_additional(answers, 'morning_ooze'):
        signals.append(_signal('additional_symptoms', 'morning_ooze', -0.25, 'Morning ooze = bacterial blight, not iron toxicity'))
        raw -= 0.25
    if answers.get('water_condition') in ['dry', 'recently_drained']:
        signals.append(_signal('water_condition', answers.get('water_condition'), -0.20, 'Iron toxicity requires flooding'))
        raw -= 0.20
    if answers.get('symptom_origin') == 'upper_leaves':
        signals.append(_signal('symptom_origin', 'upper_leaves', -0.10, 'Iron toxicity starts at lower leaves'))
        raw -= 0.10

    return {'signals': signals, 'confidence_modifier': confidence_mod, 'raw_total': round(raw, 2),
            'note': 'All signals scaled by confidence modifier, then capped [0, 1]'}


# =============================================================================
# NITROGEN DEFICIENCY EXPLANATION
# =============================================================================
def _explain_nitrogen_deficiency(answers, confidence_mod):
    signals = []
    raw = 0.0

    if answers.get('fertilizer_applied') == False:
        signals.append(_signal('fertilizer_applied', 'False', +0.45, 'No fertilizer = strongest single signal for N deficiency'))
        raw += 0.45
    elif answers.get('fertilizer_amount') == 'less':
        signals.append(_signal('fertilizer_amount', 'less', +0.25, 'Less fertilizer than normal'))
        raw += 0.25
    elif answers.get('fertilizer_type') in ['potassium_rich', 'organic']:
        signals.append(_signal('fertilizer_type', answers.get('fertilizer_type'), +0.15, 'Fertilizer type lacking nitrogen'))
        raw += 0.15

    if has_symptom(answers, 'yellowing') and not has_symptom(answers, 'dark_spots'):
        signals.append(_signal('symptoms', 'yellowing (no spots)', +0.25, 'Yellowing WITHOUT spots = classic N deficiency'))
        raw += 0.25
    if answers.get('spread_pattern') == 'most_of_field':
        signals.append(_signal('spread_pattern', 'most_of_field', +0.15, 'Field-wide uniform = systemic nutrient issue'))
        raw += 0.15
    if answers.get('symptom_origin') == 'lower_leaves':
        signals.append(_signal('symptom_origin', 'lower_leaves', +0.10, 'Lower leaves yellow first = N remobilization (PDF2 p.27)'))
        raw += 0.10
    if answers.get('onset_speed') == 'gradual':
        signals.append(_signal('onset_speed', 'gradual', +0.05, 'Slow progression matches N deficiency'))
        raw += 0.05
    if answers.get('growth_stage') in ['seedling', 'tillering']:
        signals.append(_signal('growth_stage', answers.get('growth_stage'), +0.10, 'Early growth = highest N demand (PDF2 p.28)'))
        raw += 0.10
    if answers.get('soil_type') == 'prey_khmer':
        signals.append(_signal('soil_type', 'prey_khmer', +0.05, 'Sandy soil = low nutrient retention (PDF2 p.15)'))
        raw += 0.05
    elif answers.get('soil_cracking') == 'no_cracks':
        signals.append(_signal('soil_cracking', 'no_cracks', +0.03, 'Sandy/light soil signal'))
        raw += 0.03

    # Penalties
    if has_symptom(answers, 'dark_spots'):
        signals.append(_signal('symptoms', 'dark_spots', -0.15, 'Dark spots = fungal, not pure N deficiency'))
        raw -= 0.15
    if answers.get('weather') in ['heavy_rain', 'high_humidity']:
        signals.append(_signal('weather', answers.get('weather'), -0.10, 'Humid/rainy = suggests brown spot'))
        raw -= 0.10
    if answers.get('spread_pattern') == 'few_plants':
        signals.append(_signal('spread_pattern', 'few_plants', -0.20, 'Few plants = disease outbreak, not systemic deficiency'))
        raw -= 0.20
    if has_additional(answers, 'morning_ooze'):
        signals.append(_signal('additional_symptoms', 'morning_ooze', -0.20, 'Morning ooze = bacterial blight'))
        raw -= 0.20
    if has_symptom(answers, 'white_tips'):
        signals.append(_signal('symptoms', 'white_tips', -0.10, 'White tips = salt toxicity or bacterial blight'))
        raw -= 0.10

    return {'signals': signals, 'confidence_modifier': confidence_mod, 'raw_total': round(raw, 2),
            'note': 'All signals scaled by confidence modifier, then capped [0, 1]'}


# =============================================================================
# SALT TOXICITY EXPLANATION
# =============================================================================
def _explain_salt_toxicity(answers, confidence_mod):
    signals = []
    raw = 0.0

    if has_symptom(answers, 'white_tips'):
        signals.append(_signal('symptoms', 'white_tips', +0.35, 'White leaf tips = primary symptom (PDF2 p.33)'))
        raw += 0.35
    if answers.get('fertilizer_amount') == 'excessive':
        signals.append(_signal('fertilizer_amount', 'excessive', +0.30, 'Excessive fertilizer = main cause (PDF2 p.32)'))
        raw += 0.30
    if answers.get('spread_pattern') == 'most_of_field':
        signals.append(_signal('spread_pattern', 'most_of_field', +0.15, 'Salt is systemic, affects whole field'))
        raw += 0.15
    if answers.get('symptom_origin') == 'lower_leaves':
        signals.append(_signal('symptom_origin', 'lower_leaves', +0.10, 'Older leaves affected first (PDF2 p.33)'))
        raw += 0.10
    if has_symptom(answers, 'yellowing'):
        signals.append(_signal('symptoms', 'yellowing', +0.05, 'Supporting symptom'))
        raw += 0.05
    if has_symptom(answers, 'dried_areas'):
        signals.append(_signal('symptoms', 'dried_areas', +0.05, 'Supporting symptom'))
        raw += 0.05
    if has_additional(answers, 'stunted_growth'):
        signals.append(_signal('additional_symptoms', 'stunted_growth', +0.05, 'Reduced germination/tillering (PDF2 p.33)'))
        raw += 0.05
    if answers.get('water_condition') == 'flooded_continuously':
        signals.append(_signal('water_condition', 'flooded_continuously', +0.05, 'Flooding can introduce salinity'))
        raw += 0.05

    # Penalties
    if has_additional(answers, 'morning_ooze'):
        signals.append(_signal('additional_symptoms', 'morning_ooze', -0.35, 'Morning ooze = bacterial blight, NOT salt'))
        raw -= 0.35
    if answers.get('spread_pattern') == 'few_plants':
        signals.append(_signal('spread_pattern', 'few_plants', -0.20, 'Salt toxicity is field-wide, not patchy'))
        raw -= 0.20
    elif answers.get('spread_pattern') == 'patches':
        signals.append(_signal('spread_pattern', 'patches', -0.10, 'Salt toxicity is field-wide'))
        raw -= 0.10
    if has_symptom(answers, 'dark_spots'):
        signals.append(_signal('symptoms', 'dark_spots', -0.15, 'Dark spots = fungal disease'))
        raw -= 0.15
    if has_additional(answers, 'purple_roots'):
        signals.append(_signal('additional_symptoms', 'purple_roots', -0.15, 'Purple roots = iron toxicity'))
        raw -= 0.15
    if answers.get('fertilizer_amount') in ['normal', 'less']:
        signals.append(_signal('fertilizer_amount', answers.get('fertilizer_amount'), -0.10, 'Normal/less fertilizer reduces salt toxicity likelihood'))
        raw -= 0.10

    return {'signals': signals, 'confidence_modifier': confidence_mod, 'raw_total': round(raw, 2),
            'note': 'All signals scaled by confidence modifier, then capped [0, 1]'}


# =============================================================================
# BACTERIAL BLIGHT EXPLANATION
# =============================================================================
def _explain_bacterial_blight(answers, confidence_mod):
    signals = []
    ooze_raw = 0.0
    other_raw = 0.0

    # Part 1: Definitive marker (NOT confidence-scaled)
    if has_additional(answers, 'morning_ooze'):
        signals.append(_signal('additional_symptoms', 'morning_ooze', +0.60,
                               '⚡ Pathognomonic marker — NOT scaled by confidence (PDF1: milky bacterial exudate)'))
        ooze_raw = 0.60

    # Part 2: Supporting evidence (confidence-scaled)
    if answers.get('water_condition') == 'flooded_continuously':
        signals.append(_signal('water_condition', 'flooded_continuously', +0.20, 'Flooding = primary spread mechanism'))
        other_raw += 0.20
    if answers.get('weather') == 'heavy_rain':
        signals.append(_signal('weather', 'heavy_rain', +0.15, 'Warm wet weather favors bacteria'))
        other_raw += 0.15
    elif answers.get('weather') == 'high_humidity':
        signals.append(_signal('weather', 'high_humidity', +0.10, 'Humidity favors bacteria'))
        other_raw += 0.10
    if answers.get('onset_speed') == 'sudden':
        signals.append(_signal('onset_speed', 'sudden', +0.15, 'Bacterial diseases progress quickly'))
        other_raw += 0.15
    if has_symptom(answers, 'white_tips'):
        signals.append(_signal('symptoms', 'white_tips', +0.08, 'White tips / drying from margins'))
        other_raw += 0.08
    if has_symptom(answers, 'dried_areas'):
        signals.append(_signal('symptoms', 'dried_areas', +0.05, 'Leaf drying'))
        other_raw += 0.05
    if has_symptom(answers, 'yellowing'):
        signals.append(_signal('symptoms', 'yellowing', +0.05, 'Yellowing'))
        other_raw += 0.05
    if answers.get('spread_pattern') == 'patches':
        signals.append(_signal('spread_pattern', 'patches', +0.08, 'Patches following irrigation channels'))
        other_raw += 0.08
    if answers.get('previous_crop') == 'rice_same':
        signals.append(_signal('previous_crop', 'rice_same', +0.10, 'Infected stubble source'))
        other_raw += 0.10
    if answers.get('previous_disease') == 'yes_same':
        signals.append(_signal('previous_disease', 'yes_same', +0.05, 'Recurrent same disease'))
        other_raw += 0.05
    if answers.get('growth_stage') == 'tillering':
        signals.append(_signal('growth_stage', 'tillering', +0.05, 'Most susceptible growth phase'))
        other_raw += 0.05

    # Penalties
    if has_symptom(answers, 'dark_spots'):
        signals.append(_signal('symptoms', 'dark_spots', -0.10, 'Dark spots suggest fungal disease'))
        other_raw -= 0.10
    if has_additional(answers, 'purple_roots'):
        signals.append(_signal('additional_symptoms', 'purple_roots', -0.15, 'Purple roots = iron toxicity'))
        other_raw -= 0.15
    if answers.get('water_condition') == 'dry':
        signals.append(_signal('water_condition', 'dry', -0.20, 'Dry field reduces bacterial spread'))
        other_raw -= 0.20

    note = ('Morning ooze (0.60) is NOT confidence-scaled. '
            f'Supporting evidence ({other_raw:.2f}) is scaled by confidence ({confidence_mod}), '
            f'then both are summed and capped [0, 1].')

    return {'signals': signals, 'confidence_modifier': confidence_mod,
            'raw_total': round(ooze_raw + other_raw, 2), 'note': note}


# =============================================================================
# BROWN SPOT EXPLANATION
# =============================================================================
def _explain_brown_spot(answers, confidence_mod):
    signals = []
    raw = 0.0

    if answers.get('fertilizer_applied') == False:
        signals.append(_signal('fertilizer_applied', 'False', +0.25, 'No N fertilizer = primary predisposing factor (PDF1)'))
        raw += 0.25
    elif answers.get('fertilizer_amount') == 'less':
        signals.append(_signal('fertilizer_amount', 'less', +0.15, 'Low N input'))
        raw += 0.15

    if answers.get('weather') == 'heavy_rain':
        signals.append(_signal('weather', 'heavy_rain', +0.25, 'Heavy rain = spore germination trigger (PDF1)'))
        raw += 0.25
    elif answers.get('weather') == 'high_humidity':
        signals.append(_signal('weather', 'high_humidity', +0.20, 'High humidity = spore germination'))
        raw += 0.20

    if has_symptom(answers, 'dark_spots'):
        signals.append(_signal('symptoms', 'dark_spots', +0.15, 'Dark spots on leaf blade (PDF1)'))
        raw += 0.15
    if has_symptom(answers, 'brown_discoloration'):
        signals.append(_signal('symptoms', 'brown_discoloration', +0.10, 'Brown discoloration'))
        raw += 0.10
    if has_symptom(answers, 'yellowing') and has_symptom(answers, 'brown_discoloration'):
        signals.append(_signal('symptoms', 'yellowing+brown', +0.07, 'Halo-type fungal lesion pattern'))
        raw += 0.07

    if answers.get('water_condition') in ['wet', 'recently_drained']:
        signals.append(_signal('water_condition', answers.get('water_condition'), +0.10, 'Wet/drained cycle = classic trigger'))
        raw += 0.10
    elif answers.get('water_condition') == 'dry':
        signals.append(_signal('water_condition', 'dry', +0.05, 'Dry + N stress is risk factor'))
        raw += 0.05

    if answers.get('soil_type') == 'prey_khmer':
        signals.append(_signal('soil_type', 'prey_khmer', +0.08, 'Sandy nutrient-poor soil (PDF2)'))
        raw += 0.08
    if answers.get('water_condition') == 'recently_drained':
        signals.append(_signal('water_condition', 'recently_drained (contextual)', +0.05, 'Wet→dry transition favors brown spot'))
        raw += 0.05

    if answers.get('growth_stage') in ['tillering', 'flowering', 'grain_filling']:
        signals.append(_signal('growth_stage', answers.get('growth_stage'), +0.10, 'Typical stage for brown spot'))
        raw += 0.10
    if answers.get('onset_speed') == 'gradual':
        signals.append(_signal('onset_speed', 'gradual', +0.08, 'Fungal spread is slower than bacterial'))
        raw += 0.08
    if answers.get('spread_pattern') == 'patches':
        signals.append(_signal('spread_pattern', 'patches', +0.08, 'Spore spread pattern'))
        raw += 0.08
    if answers.get('previous_crop') in ['rice_same', 'rice_different']:
        signals.append(_signal('previous_crop', answers.get('previous_crop'), +0.08, 'Spore carryover in debris'))
        raw += 0.08
    if has_location(answers, 'leaf_blade'):
        signals.append(_signal('symptom_location', 'leaf_blade', +0.05, 'Primarily on leaf blade (PDF1)'))
        raw += 0.05
    if answers.get('previous_disease') == 'yes_same':
        signals.append(_signal('previous_disease', 'yes_same', +0.05, 'Persistent fungal pressure'))
        raw += 0.05

    # Penalties
    if has_additional(answers, 'morning_ooze'):
        signals.append(_signal('additional_symptoms', 'morning_ooze', -0.30, 'Morning ooze = bacterial, not fungal'))
        raw -= 0.30
    if has_additional(answers, 'purple_roots'):
        signals.append(_signal('additional_symptoms', 'purple_roots', -0.15, 'Purple roots = iron toxicity'))
        raw -= 0.15
    if has_location(answers, 'leaf_sheath'):
        signals.append(_signal('symptom_location', 'leaf_sheath', -0.15, 'Leaf sheath = sheath blight'))
        raw -= 0.15
    if has_location(answers, 'panicle'):
        signals.append(_signal('symptom_location', 'panicle', -0.15, 'Panicle = blast, not brown spot'))
        raw -= 0.15
    if answers.get('weather') == 'dry_hot':
        signals.append(_signal('weather', 'dry_hot', -0.10, 'Dry hot reduces spore germination'))
        raw -= 0.10
    if answers.get('spread_pattern') == 'most_of_field':
        signals.append(_signal('spread_pattern', 'most_of_field', -0.05, 'Field-wide = more systemic (N deficiency)'))
        raw -= 0.05

    return {'signals': signals, 'confidence_modifier': confidence_mod, 'raw_total': round(raw, 2),
            'note': 'All signals scaled by confidence modifier, then capped [0, 1]'}


# =============================================================================
# BLAST EXPLANATION
# =============================================================================
def _explain_blast(answers, confidence_mod):
    signals = []
    raw = 0.0

    if answers.get('weather') == 'high_humidity':
        signals.append(_signal('weather', 'high_humidity', +0.30, 'High humidity essential for blast (PDF1)'))
        raw += 0.30
    elif answers.get('weather') == 'heavy_rain':
        signals.append(_signal('weather', 'heavy_rain', +0.20, 'Rain + humidity'))
        raw += 0.20

    if has_location(answers, 'panicle'):
        signals.append(_signal('symptom_location', 'panicle', +0.30, 'Neck blast — near-unique to blast at heading (PDF1)'))
        raw += 0.30
    if answers.get('growth_stage') == 'flowering':
        signals.append(_signal('growth_stage', 'flowering', +0.25, 'Most critical stage for blast severity'))
        raw += 0.25
    if has_symptom(answers, 'dark_spots'):
        signals.append(_signal('symptoms', 'dark_spots', +0.15, 'Dark spots = leaf blast'))
        raw += 0.15
    if answers.get('onset_speed') == 'sudden':
        signals.append(_signal('onset_speed', 'sudden', +0.15, 'Wind-borne spores spread quickly'))
        raw += 0.15
    if answers.get('previous_crop') in ['rice_same', 'rice_different']:
        signals.append(_signal('previous_crop', answers.get('previous_crop'), +0.10, 'Spore carryover'))
        raw += 0.10
    if answers.get('spread_pattern') == 'patches':
        signals.append(_signal('spread_pattern', 'patches', +0.08, 'Initial foci then expanding'))
        raw += 0.08
    if has_location(answers, 'stem'):
        signals.append(_signal('symptom_location', 'stem', +0.10, 'Node blast (PDF1)'))
        raw += 0.10
    if answers.get('previous_disease') == 'yes_same':
        signals.append(_signal('previous_disease', 'yes_same', +0.05, 'Persistent blast pressure'))
        raw += 0.05
    if answers.get('growth_stage') == 'elongation':
        signals.append(_signal('growth_stage', 'elongation', +0.05, 'Susceptible to leaf blast'))
        raw += 0.05
    if answers.get('symptom_origin') == 'upper_leaves':
        signals.append(_signal('symptom_origin', 'upper_leaves', +0.05, 'Young tissue attacked first (PDF1)'))
        raw += 0.05

    # Penalties
    if has_additional(answers, 'morning_ooze'):
        signals.append(_signal('additional_symptoms', 'morning_ooze', -0.30, 'Morning ooze = bacterial, not blast'))
        raw -= 0.30
    if has_additional(answers, 'purple_roots'):
        signals.append(_signal('additional_symptoms', 'purple_roots', -0.15, 'Purple roots = iron toxicity'))
        raw -= 0.15
    if has_location(answers, 'leaf_sheath'):
        signals.append(_signal('symptom_location', 'leaf_sheath', -0.15, 'Leaf sheath = sheath blight'))
        raw -= 0.15
    if answers.get('weather') == 'dry_hot':
        signals.append(_signal('weather', 'dry_hot', -0.15, 'Dry hot reduces blast pressure (PDF1)'))
        raw -= 0.15
    if (answers.get('fertilizer_applied') == False and not has_symptom(answers, 'dark_spots')):
        signals.append(_signal('fertilizer+symptoms', 'no fertilizer, no spots', -0.10, 'N deficiency more likely'))
        raw -= 0.10
    if answers.get('spread_pattern') == 'most_of_field':
        signals.append(_signal('spread_pattern', 'most_of_field', -0.05, 'Systemic = not typical blast'))
        raw -= 0.05

    return {'signals': signals, 'confidence_modifier': confidence_mod, 'raw_total': round(raw, 2),
            'note': 'All signals scaled by confidence modifier, then capped [0, 1]'}
