# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/recommendations.py — Recommendation Engine
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 2, Cell 15
#
# PURPOSE:
#   Returns structured, farmer-facing recommendations for each confirmed
#   condition. Content is sourced directly from PDF1 (disease guide) and
#   PDF2 (soil/fertilizer guide) and written in plain language for UI display.
#
# INFRASTRUCTURE NOTE (added during project conversion):
#   This module is called exclusively by dss/output_builder.py via
#   build_standard_output() and build_ambiguous_output().
#   Recommendation text is FROZEN — do not reword, as phrasing is aligned
#   with the validated scientific sources.
#
# RETURN STRUCTURE per condition:
#   {
#       'immediate':  [list of immediate actions],
#       'preventive': [list of preventive measures],
#       'monitoring': str — what to watch for,
#       'consult':    bool — whether to seek expert help
#   }
# =============================================================================


def get_recommendations(condition: str, answers: dict) -> dict:
    """
    Returns structured recommendations for a given condition.
    Content sourced from PDF1 (disease guide) and PDF2 (soil/fertilizer guide).

    Args:
        condition (str): The identified condition key
        answers (dict): Validated answers (used to personalize advice)

    Returns:
        dict: {
            'immediate':    [list of immediate actions],
            'preventive':   [list of preventive measures],
            'monitoring':   str — what to watch for,
            'consult':      bool — whether to seek expert help
        }
    """

    # -------------------------------------------------------------------------
    # BLAST (PDF1: blast section)
    # -------------------------------------------------------------------------
    if condition == 'blast':
        immediate = [
            'Apply fungicide: Tricyclazole or Benlate 2kg/ha — spray before flowering if possible',
            'Avoid applying nitrogen fertilizer during active outbreak — excess N worsens blast',
            'Do not flood field during outbreak — reduce leaf wetness'
        ]
        # Personalize: if at flowering, add urgency
        if answers.get('growth_stage') == 'flowering':
            immediate.insert(0, '⚠️ URGENT: Blast at flowering causes severe yield loss — act within 2-3 days')

        preventive = [
            'Use resistant varieties: IR36, IR42, IR64, IR60 (PDF1)',
            'Clean field debris and stubble after harvest — spores survive in residue',
            'Apply balanced NPK — avoid excess nitrogen which increases susceptibility',
            'Rotate with non-rice crops to break disease cycle'
        ]
        return {
            'immediate':  immediate,
            'preventive': preventive,
            'monitoring': 'Check for spread to new leaves and panicles daily. '
                          'If panicle is infected, yield loss may already be significant.',
            'consult': answers.get('growth_stage') == 'flowering'
        }

    # -------------------------------------------------------------------------
    # BROWN SPOT (PDF1: brown spot section)
    # -------------------------------------------------------------------------
    elif condition == 'brown_spot':
        immediate = [
            'Apply fungicide: Benlate 2kg/ha or Zineb 3kg/ha (PDF1)',
            'Apply nitrogen fertilizer if none has been used — N deficiency increases susceptibility'
        ]
        # Personalize based on fertilizer history
        if answers.get('fertilizer_applied') == False:
            immediate.insert(0, 'Apply Urea (nitrogen) immediately — N deficiency is predisposing this field to brown spot')

        preventive = [
            'Use resistant varieties: IR36, IR42, IR64 (PDF1)',
            'Apply balanced NPK fertilizer throughout the season',
            'Clean infected seed: soak in water for 24hrs, heat treat at 53-57°C for 10 mins (PDF1)',
            'Remove and burn infected plant debris after harvest',
            'Improve drainage — avoid alternating wet/dry stress'
        ]
        return {
            'immediate':  immediate,
            'preventive': preventive,
            'monitoring': 'Monitor after fungicide application — if spots continue spreading '
                          'after 7 days, consult extension officer.',
            'consult': False
        }

    # -------------------------------------------------------------------------
    # BACTERIAL BLIGHT (PDF1: bacterial blight section)
    # -------------------------------------------------------------------------
    elif condition == 'bacterial_blight':
        immediate = [
            'Drain field immediately — bacterial blight spreads via water movement',
            'Do NOT flood or irrigate across fields during outbreak — spreads to healthy fields',
            'Remove and destroy infected plants/stubble — do not compost them',
            'Avoid working in wet field — movement spreads bacteria between plants'
        ]
        preventive = [
            'Use disease-free seed — do not use seed from infected plants (PDF1)',
            'Avoid reusing water from infected fields for irrigation',
            'Do not apply excess nitrogen — makes plants more susceptible',
            'Remove infected stubble after harvest before next planting'
        ]
        return {
            'immediate':  immediate,
            'preventive': preventive,
            'monitoring': 'Check leaf tips at dawn for yellow/milky ooze to confirm diagnosis. '
                          'Monitor spread direction — if following water flow, confirms bacterial blight.',
            'consult': True  # Bacterial blight warrants expert confirmation
        }

    # -------------------------------------------------------------------------
    # IRON TOXICITY (PDF2: pages 30-31)
    # -------------------------------------------------------------------------
    elif condition == 'iron_toxicity':
        immediate = [
            'Drain field for 7-10 days during tillering stage — reduces Fe2+ concentration (PDF2)',
            'Apply balanced NPK + potassium — K deficiency worsens iron toxicity (PDF2)',
            'Apply lime (calcium) to raise soil pH if soil is very acidic',
            'Do NOT apply only nitrogen — full nutrient balance is required'
        ]
        # Personalize: if at tillering (optimal drainage window)
        if answers.get('growth_stage') == 'tillering':
            immediate.insert(0, '✓ GOOD TIMING: Draining now during tillering is the most effective intervention')

        preventive = [
            'Avoid continuous flooding — drain field periodically during growing season (PDF2)',
            'Use varieties with strong root oxidation capacity',
            'Apply potassium fertilizer sufficient to maintain K:Na balance in soil',
            'Plow and dry field for 2-3 months between seasons to oxidize iron (PDF2)',
            'Do not incorporate large amounts of undecomposed organic matter'
        ]
        return {
            'immediate':  immediate,
            'preventive': preventive,
            'monitoring': 'Check root color after 7 days of drainage — roots should return '
                          'to white/normal color if iron toxicity is resolving. '
                          'Leaf symptoms may persist even as recovery begins.',
            'consult': False
        }

    # -------------------------------------------------------------------------
    # NITROGEN DEFICIENCY (PDF2: pages 27-29)
    # -------------------------------------------------------------------------
    elif condition == 'n_deficiency':
        # Choose fertilizer rate based on soil type (PDF2 recommendations)
        soil = answers.get('soil_type', 'unsure')
        soil_advice = {
            'bakan':         'For Bakan soil: Apply Urea 134 kg/ha (PDF2 recommendation)',
            'prateah_lang':  'For Prateah Lang soil: Apply Urea 88 kg/ha (PDF2 recommendation)',
            'prey_khmer':    'For Prey Khmer soil: Apply Urea 38 kg/ha (PDF2 — sandy soil, low rate)',
            'toul_samroung': 'For Toul Samroung soil: Apply Urea 113 kg/ha (PDF2 recommendation)',
            'kbal_po':       'For Kbal Po soil: Apply Urea 87 kg/ha + nitrogen only (PDF2)',
            'krakor':        'For Krakor soil: Apply Urea 238 kg/ha — high N response (PDF2)',
        }
        n_advice = soil_advice.get(soil, 'Apply Urea at standard rate ~50-100 kg/ha — consult local rates')

        immediate = [
            f'Apply nitrogen fertilizer immediately — {n_advice}',
            'Split application: apply now + again at panicle initiation (PDF2)',
            'Incorporate fertilizer into soil if possible — reduces N loss (PDF2)'
        ]
        preventive = [
            'Apply nitrogen at three stages: pre-planting, tillering (30 days), panicle initiation (PDF2)',
            'Use balanced NPK — nitrogen alone without P is less effective on most Cambodian soils (PDF2)',
            'On sandy soils (Prey Khmer): split into more frequent small applications to reduce leaching',
            'Consider organic matter / compost to improve long-term soil N retention'
        ]
        return {
            'immediate':  immediate,
            'preventive': preventive,
            'monitoring': 'Yellowing should improve within 7-10 days of nitrogen application. '
                          'If no improvement after 10 days, reassess — may have secondary disease.',
            'consult': False
        }

    # -------------------------------------------------------------------------
    # SALT TOXICITY (PDF2: pages 32-33)
    # -------------------------------------------------------------------------
    elif condition == 'salt_toxicity':
        immediate = [
            'Flush field with clean freshwater to dilute salt concentration (PDF2)',
            'Stop applying fertilizer immediately — do not add more inputs',
            'Check irrigation water source — if saline, switch to alternative source'
        ]
        # Personalize: if excess fertilizer was the cause
        if answers.get('fertilizer_amount') == 'excessive':
            immediate.insert(0, 'CAUSE IDENTIFIED: Excess fertilizer application — stop all inputs and flush field')

        preventive = [
            'Never exceed recommended fertilizer rates — excess creates salt buildup (PDF2)',
            'Use balanced NPK: adequate K reduces salt damage by improving K:Na ratio in plant (PDF2)',
            'Flood field 2-4 weeks before planting to leach salts (PDF2)',
            'Avoid irrigation with groundwater or river water with high salt content',
            'Use varieties with shorter growing periods to reduce salt exposure time'
        ]
        return {
            'immediate':  immediate,
            'preventive': preventive,
            'monitoring': 'Symptoms should stop progressing within 5-7 days after flushing. '
                          'If white tips continue spreading, check if new growth is also affected — '
                          'if yes, salt source is ongoing.',
            'consult': False
        }

    # -------------------------------------------------------------------------
    # UNCERTAIN / OUT OF SCOPE
    # -------------------------------------------------------------------------
    else:
        return {
            'immediate':  ['Document symptoms with photos', 'Note which plants are affected and location in field'],
            'preventive': ['Maintain good field hygiene — remove debris', 'Continue normal water and fertilizer management'],
            'monitoring': 'Monitor daily for 3-5 days. If symptoms worsen or spread, '
                          'resubmit with updated photos and symptom information.',
            'consult': True
        }
