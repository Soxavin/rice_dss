# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/scoring.py — Scoring Engine
# -----------------------------------------------------------------------------
# Extracted from FYP.ipynb — Phase 1, Cell 1 (Sections 3, 4, 5, 6, 7, 8)
#
# PURPOSE:
#   Contains all individual condition scoring functions and the two special
#   flag detectors (sheath blight, out-of-scope).
#   compute_all_scores() is the single entry point called by decision.py.
#
# INFRASTRUCTURE NOTE (added during project conversion):
#   All weights and scoring logic in this file are SCIENTIFICALLY VALIDATED
#   and FROZEN. Do NOT modify scoring weights, thresholds, or penalty signals.
#   The comments referencing PDF1/PDF2 are the scientific justification for
#   each weight — they must remain in place.
#
# SCORING CONVENTIONS:
#   - Each function starts at 0.0
#   - Positive signals add to score; penalty signals subtract
#   - All scores are multiplied by confidence_modifier at the end
#   - cap_score() enforces [0.0, 1.0] bounds on every return value
# =============================================================================

from dss.validation import validate_answers


# =============================================================================
# SECTION 3: CONFIDENCE MODIFIER
# -----------------------------------------------------------------------------
# Q2b asks: "How sure are you about what you're seeing?"
# This multiplier is applied to ALL scores at the END of each function.
#
# WHY: A farmer who says "not sure" should not trigger a high-confidence
# output. The modifier scales down scores when observation quality is low.
#
# Very sure:     1.00 — full trust in observation
# Somewhat sure: 0.85 — slight reduction for mild uncertainty
# Not sure:      0.65 — significant reduction for high uncertainty
# Missing:       0.75 — conservative default
# =============================================================================

def get_confidence_modifier(answers: dict) -> float:
    """
    Returns a multiplier (0.65 to 1.0) based on farmer's self-reported
    confidence in their symptom observations (Q2b).

    Args:
        answers (dict): Validated answer dictionary

    Returns:
        float: Multiplier between 0.65 and 1.0
    """
    confidence_map = {
        'very_sure':     1.00,
        'somewhat_sure': 0.85,
        'not_sure':      0.65
    }
    # Default to 0.75 if confidence field is missing
    return confidence_map.get(answers.get('farmer_confidence'), 0.75)


# =============================================================================
# SECTION 4: HELPER FUNCTIONS
# -----------------------------------------------------------------------------
# Small utilities used across all scoring functions.
# =============================================================================

def cap_score(score: float) -> float:
    """
    Ensures a score stays within [0.0, 1.0].
    Prevents negative scores or scores above 1.0 from bugs in logic.
    """
    return max(0.0, min(1.0, score))


def has_symptom(answers: dict, symptom: str) -> bool:
    """Check if a specific symptom was selected by the farmer."""
    return symptom in answers.get('symptoms', [])


def has_location(answers: dict, location: str) -> bool:
    """Check if symptoms were reported at a specific plant location."""
    return location in answers.get('symptom_location', [])


def has_additional(answers: dict, symptom: str) -> bool:
    """Check if a specific additional symptom was selected."""
    return symptom in answers.get('additional_symptoms', [])


# =============================================================================
# SECTION 5: SCORING FUNCTIONS
# -----------------------------------------------------------------------------
# One function per condition. Each function:
#   1. Starts at 0.0
#   2. Adds points for signals that SUPPORT this condition
#   3. Subtracts points for signals that CONTRADICT this condition
#   4. Multiplies by confidence_modifier at the end
#   5. Caps result between 0.0 and 1.0
#
# Weights are based on PDF1 (disease guide) and PDF2 (soil/fertilizer guide).
# Comments reference which PDF supports each weight decision.
# =============================================================================


# -----------------------------------------------------------------------------
# 5A: IRON TOXICITY SCORE (ពុលជាតិដែក)
# Source: PDF2 pages 30-31
# Key: continuous flooding + low pH soil + nutrient imbalance
# Most distinctive sign: purple/brown roots
# -----------------------------------------------------------------------------

def score_iron_toxicity(answers: dict) -> float:
    """
    Scores the likelihood of Iron Toxicity based on questionnaire answers.
    Iron toxicity is NON-BIOTIC and overrides ML disease output if score >= 0.65.

    Key signals (from PDF2):
    - Continuous flooding in low pH, cracking soils
    - Purple/brown roots (most distinctive marker)
    - Peaks 1-8 weeks after transplanting
    - Worsens with nutrient imbalance
    """
    score = 0.0

    # --- POSITIVE SIGNALS ---

    # Continuous flooding is a prerequisite (PDF2 p.30)
    # "Iron toxicity occurs in continuously flooded lowland rice fields"
    if answers.get('water_condition') == 'flooded_continuously':
        score += 0.30  # STRONG — required condition

    # Purple/brown roots = most distinctive, near-unique marker (PDF2 p.30)
    # "Roots turn purple-brown, stunted"
    if has_additional(answers, 'purple_roots'):
        score += 0.35  # VERY STRONG — near-unique to iron toxicity

    # Soil types prone to iron toxicity: Kbal Po, Toul Samroung (PDF2 p.31)
    # "Kaolinite soils with low CEC and low P and K content"
    if answers.get('soil_type') in ['kbal_po', 'toul_samroung']:
        score += 0.15  # MEDIUM — known high-risk soil types
    elif answers.get('soil_cracking') == 'large_cracks':
        score += 0.10  # MEDIUM — proxy signal for above soil types

    # Symptom timing: peaks 1-8 weeks after transplant (PDF2 p.30)
    if answers.get('symptom_timing') == 'right_after_transplant':
        score += 0.20  # STRONG — timing match

    # Yellowing + brown discoloration on lower leaves (PDF2 p.30)
    if has_symptom(answers, 'yellowing'):
        score += 0.05
    if has_symptom(answers, 'brown_discoloration'):
        score += 0.05
    if answers.get('symptom_origin') == 'lower_leaves':
        score += 0.10  # MEDIUM — lower leaves affected first

    # Gradual onset over days/weeks (not sudden like bacterial)
    if answers.get('onset_speed') == 'gradual':
        score += 0.05

    # Field-wide spread (systemic condition, not isolated outbreak)
    if answers.get('spread_pattern') == 'most_of_field':
        score += 0.05

    # --- PENALTY SIGNALS ---

    # Sudden onset → iron toxicity develops slowly, not suddenly
    if answers.get('onset_speed') == 'sudden':
        score -= 0.10

    # Leaf sheath symptoms → suggests sheath blight instead
    if has_location(answers, 'leaf_sheath'):
        score -= 0.15

    # Morning ooze → definitively bacterial blight, not iron toxicity
    if has_additional(answers, 'morning_ooze'):
        score -= 0.25

    # Dry or drained field → iron toxicity requires flooding
    if answers.get('water_condition') in ['dry', 'recently_drained']:
        score -= 0.20

    # Upper leaves first → iron toxicity pattern starts at lower leaves
    if answers.get('symptom_origin') == 'upper_leaves':
        score -= 0.10

    # Apply confidence modifier and cap
    return cap_score(score * get_confidence_modifier(answers))


# -----------------------------------------------------------------------------
# 5B: NITROGEN DEFICIENCY SCORE (កង្វះជីអាស៊ូត)
# Source: PDF1 (symptoms), PDF2 pages 27-29 (N management)
# Key: no/insufficient nitrogen fertilizer + uniform yellowing
# Most distinctive: uniform field-wide yellowing without spots
# -----------------------------------------------------------------------------

def score_nitrogen_deficiency(answers: dict) -> float:
    """
    Scores the likelihood of Nitrogen Deficiency.
    N deficiency is NON-BIOTIC and overrides ML disease output if score >= 0.65.

    Key signals (from PDF1 + PDF2):
    - No fertilizer applied OR less than normal
    - Yellowing without dark spots
    - Uniform field spread (systemic, not outbreak)
    - Lower/older leaves yellow first (N remobilization)
    """
    score = 0.0

    # --- POSITIVE SIGNALS ---

    # No fertilizer = strongest single signal for N deficiency
    if answers.get('fertilizer_applied') == False:
        score += 0.45  # VERY STRONG

    # Less fertilizer than normal — partial deficiency
    elif answers.get('fertilizer_amount') == 'less':
        score += 0.25  # STRONG

    # Fertilizer type lacking N (K-only or organic may still be N-low)
    elif answers.get('fertilizer_type') in ['potassium_rich', 'organic']:
        score += 0.15  # MEDIUM

    # Yellowing WITHOUT spots = classic N deficiency (not disease)
    # PDF1: "leaves turn yellow or light green, no spots"
    if has_symptom(answers, 'yellowing') and not has_symptom(answers, 'dark_spots'):
        score += 0.25  # STRONG

    # Field-wide uniform spread = systemic nutrient issue
    if answers.get('spread_pattern') == 'most_of_field':
        score += 0.15  # MEDIUM

    # Lower/older leaves yellow first = N remobilization to new growth (PDF2 p.27)
    if answers.get('symptom_origin') == 'lower_leaves':
        score += 0.10  # MEDIUM

    # Slow gradual progression (weeks, not days)
    if answers.get('onset_speed') == 'gradual':
        score += 0.05

    # Early growth stages when N demand is highest (PDF2 p.28)
    if answers.get('growth_stage') in ['seedling', 'tillering']:
        score += 0.10  # MEDIUM

    # Sandy Prey Khmer soil = low nutrient retention (PDF2 p.15)
    if answers.get('soil_type') == 'prey_khmer':
        score += 0.05
    elif answers.get('soil_cracking') == 'no_cracks':
        score += 0.03  # slight signal for sandy/light soil

    # --- PENALTY SIGNALS ---

    # Dark spots present = fungal disease, not pure N deficiency
    if has_symptom(answers, 'dark_spots'):
        score -= 0.15

    # Humid/rainy weather = suggests brown spot rather than deficiency
    if answers.get('weather') in ['heavy_rain', 'high_humidity']:
        score -= 0.10

    # Only few plants = disease outbreak pattern, not systemic deficiency
    if answers.get('spread_pattern') == 'few_plants':
        score -= 0.20

    # Morning ooze = bacterial blight
    if has_additional(answers, 'morning_ooze'):
        score -= 0.20

    # White tips = different issue (salt toxicity or bacterial blight)
    if has_symptom(answers, 'white_tips'):
        score -= 0.10

    # Apply confidence modifier and cap
    return cap_score(score * get_confidence_modifier(answers))


# -----------------------------------------------------------------------------
# 5C: SALT TOXICITY SCORE (ពុលជាតិប្រៃ)
# Source: PDF2 pages 32-33
# Key: white leaf tips + excess fertilizer OR saline water
# Critical: must be separated from bacterial blight (both have white tips)
# =============================================================================

def score_salt_toxicity(answers: dict) -> float:
    """
    Scores the likelihood of Salt Toxicity.
    Salt toxicity is NON-BIOTIC and overrides ML output if score >= 0.65.

    Key signals (from PDF2 p.32-33):
    - White leaf tips (primary visible symptom)
    - Excessive fertilizer application OR saline irrigation water
    - Uniform field spread (whole field affected, not patches)
    - Older/lower leaves first
    CRITICAL SEPARATION: no morning ooze (that's bacterial blight)
    """
    score = 0.0

    # --- POSITIVE SIGNALS ---

    # White leaf tips = primary symptom of salt toxicity (PDF2 p.33)
    if has_symptom(answers, 'white_tips'):
        score += 0.35  # STRONG

    # Excessive fertilizer = main human-induced cause (PDF2 p.32)
    if answers.get('fertilizer_amount') == 'excessive':
        score += 0.30  # STRONG

    # Uniform field spread = salt is systemic, not outbreak
    if answers.get('spread_pattern') == 'most_of_field':
        score += 0.15  # MEDIUM

    # Lower/older leaves first (PDF2 p.33: starts on older leaves)
    if answers.get('symptom_origin') == 'lower_leaves':
        score += 0.10  # MEDIUM

    # Supporting symptoms
    if has_symptom(answers, 'yellowing'):
        score += 0.05
    if has_symptom(answers, 'dried_areas'):
        score += 0.05

    # Stunted growth = reduced germination/tillering (PDF2 p.33)
    if has_additional(answers, 'stunted_growth'):
        score += 0.05

    # Continuous flooding can introduce salinity via groundwater (PDF2 p.32)
    if answers.get('water_condition') == 'flooded_continuously':
        score += 0.05

    # --- PENALTY SIGNALS ---

    # Morning ooze = DEFINITIVELY bacterial blight, NOT salt toxicity
    # This is the single most important separator between these two conditions
    if has_additional(answers, 'morning_ooze'):
        score -= 0.35  # VERY STRONG PENALTY

    # Patchy spread = salt toxicity is field-wide
    if answers.get('spread_pattern') == 'few_plants':
        score -= 0.20
    elif answers.get('spread_pattern') == 'patches':
        score -= 0.10

    # Dark spots = fungal disease, not salt
    if has_symptom(answers, 'dark_spots'):
        score -= 0.15

    # Purple roots = iron toxicity
    if has_additional(answers, 'purple_roots'):
        score -= 0.15

    # Normal/less fertilizer = less likely to be over-fertilization salt toxicity
    if answers.get('fertilizer_amount') in ['normal', 'less']:
        score -= 0.10

    # Apply confidence modifier and cap
    return cap_score(score * get_confidence_modifier(answers))


# -----------------------------------------------------------------------------
# 5D: BACTERIAL BLIGHT SCORE (ជំងឺស្រកេន)
# Source: PDF1 (bacterial blight section)
# Pathogen: Xanthomonas campestris pv. oryzae
# Key: morning bacterial ooze is near-definitive
# Spreads via water — flooding accelerates outbreak
# -----------------------------------------------------------------------------

def score_bacterial_blight(answers: dict) -> float:
    """
    Scores the likelihood of Bacterial Blight.
    Bacterial blight is BIOTIC (bacterial) — spreads primarily via water.

    DESIGN UPDATE:
    Morning ooze is treated as a near-pathognomonic biological marker.
    It is NOT scaled by the farmer confidence modifier because:
      - It is a distinctive visible exudate
      - It is not a subjective interpretation (e.g., "yellowing")
      - Farmer uncertainty should not heavily suppress a definitive sign

    All OTHER supporting signals remain scaled by the confidence modifier.
    """

    # -------------------------------------------------------------------------
    # PART 1: DEFINITIVE MARKER (NOT confidence-scaled)
    # -------------------------------------------------------------------------

    morning_ooze_score = 0.0

    # Morning ooze = single most diagnostic sign
    # PDF1: "milky bacterial exudate observed in early morning"
    # Weight chosen so that:
    #   - Alone → POSSIBLE (0.60)
    #   - With any major supporting signal → PROBABLE (≥0.65)
    if has_additional(answers, 'morning_ooze'):
        morning_ooze_score = 0.60  # Near-definitive marker


    # -------------------------------------------------------------------------
    # PART 2: SUPPORTING EVIDENCE (confidence-scaled)
    # -------------------------------------------------------------------------

    other_score = 0.0

    # Continuous flooding = primary spread mechanism
    # PDF1: spreads via irrigation water and flooding
    if answers.get('water_condition') == 'flooded_continuously':
        other_score += 0.20  # STRONG

    # Warm wet weather favors bacterial multiplication
    if answers.get('weather') == 'heavy_rain':
        other_score += 0.15  # STRONG
    elif answers.get('weather') == 'high_humidity':
        other_score += 0.10  # MEDIUM

    # Rapid onset = bacterial diseases progress quickly
    if answers.get('onset_speed') == 'sudden':
        other_score += 0.15  # MEDIUM

    # Classic symptom pattern
    # White tips / drying from leaf margins inward
    if has_symptom(answers, 'white_tips'):
        other_score += 0.08
    if has_symptom(answers, 'dried_areas'):
        other_score += 0.05
    if has_symptom(answers, 'yellowing'):
        other_score += 0.05

    # Patch spread following irrigation channels
    if answers.get('spread_pattern') == 'patches':
        other_score += 0.08

    # Previous rice crop = infected stubble source
    if answers.get('previous_crop') == 'rice_same':
        other_score += 0.10  # MEDIUM

    # Recurrent same disease pattern
    if answers.get('previous_disease') == 'yes_same':
        other_score += 0.05

    # Tillering stage = most susceptible growth phase
    if answers.get('growth_stage') == 'tillering':
        other_score += 0.05


    # -------------------------------------------------------------------------
    # PART 3: PENALTY SIGNALS (applied to supporting evidence only)
    # -------------------------------------------------------------------------

    # Dark spots suggest fungal disease (blast/brown spot)
    if has_symptom(answers, 'dark_spots'):
        other_score -= 0.10

    # Purple roots strongly suggest iron toxicity
    if has_additional(answers, 'purple_roots'):
        other_score -= 0.15

    # Dry field reduces bacterial spread likelihood
    if answers.get('water_condition') == 'dry':
        other_score -= 0.20


    # -------------------------------------------------------------------------
    # PART 4: APPLY CONFIDENCE MODIFIER TO NON-DEFINITIVE SIGNALS
    # -------------------------------------------------------------------------

    confidence_modifier = get_confidence_modifier(answers)

    scaled_other = cap_score(other_score * confidence_modifier)

    # -------------------------------------------------------------------------
    # PART 5: FINAL SCORE (definitive + scaled supporting evidence)
    # -------------------------------------------------------------------------

    final_score = morning_ooze_score + scaled_other

    return cap_score(final_score)


# -----------------------------------------------------------------------------
# 5E: BROWN SPOT SCORE (ជំងឺអុជត្នោត)
# Source: PDF1 (brown spot section)
# Pathogen: Helminthosporium oryzae
# Key: N deficiency + high humidity = high risk
# Spreads via infected seed and plant debris
# -----------------------------------------------------------------------------

def score_brown_spot(answers: dict) -> float:
    """
    Scores the likelihood of Brown Spot (fungal disease).
    Brown spot is BIOTIC (fungal).

    Key signals (from PDF1):
    - No/low nitrogen + high humidity = primary risk combination
    - Brown spots with yellow halos on leaf blade
    - Tillering through grain filling stages
    - Wet then dry water pattern
    - Previous rice crop (spore carryover in debris)
    """
    score = 0.0

    # --- POSITIVE SIGNALS ---

    # No N or low N = primary predisposing factor (PDF1)
    # "Nitrogen deficient plants are more susceptible"
    if answers.get('fertilizer_applied') == False:
        score += 0.25  # STRONG
    elif answers.get('fertilizer_amount') == 'less':
        score += 0.15  # MEDIUM

    # High humidity or heavy rain = spore germination trigger (PDF1)
    # "Optimum: 20-25°C + humidity >90%"
    if answers.get('weather') == 'heavy_rain':
        score += 0.25  # STRONG
    elif answers.get('weather') == 'high_humidity':
        score += 0.20  # STRONG

    # Dark spots + brown discoloration on leaf blade (PDF1 symptom)
    if has_symptom(answers, 'dark_spots'):
        score += 0.15  # MEDIUM
    if has_symptom(answers, 'brown_discoloration'):
        score += 0.10

    # Yellowing + brown discoloration together may indicate halo-type fungal lesions
    # Even without explicitly reported "dark_spots"
    if has_symptom(answers, 'yellowing') and has_symptom(answers, 'brown_discoloration'):
        score += 0.07  # SMALL but meaningful boost

    # Wet then dry cycle = classic trigger (PDF1)
    # Alternating moisture stress increases fungal infection likelihood
    if answers.get('water_condition') in ['wet', 'recently_drained']:
        score += 0.10  # MEDIUM
    elif answers.get('water_condition') == 'dry':
        score += 0.05  # WEAK — dry + N stress is risk factor

    # ---------------------------------------------------------------------
    # CONTEXTUAL AGRONOMIC RISK BOOSTS (ADDED FOR CASE 16)
    # ---------------------------------------------------------------------
    # These are not direct symptoms, but increase susceptibility.
    # Particularly relevant for Cambodian sandy soils.
    #
    # Prey Khmer soil = sandy, nutrient-poor soil (PDF2)
    # Nutrient stress increases brown spot susceptibility.
    # This should slightly elevate risk but not dominate diagnosis.
    # ---------------------------------------------------------------------
    if answers.get('soil_type') == 'prey_khmer':
        score += 0.08  # SMALL contextual boost

    # Recently drained fields create plant stress
    # Wet → dry transitions favor brown spot outbreaks (PDF1)
    # Only add small additional boost (already partially counted above)
    if answers.get('water_condition') == 'recently_drained':
        score += 0.05  # Supplemental contextual boost

    # Tillering to grain filling = typical stages (PDF1)
    if answers.get('growth_stage') in ['tillering', 'flowering', 'grain_filling']:
        score += 0.10  # MEDIUM

    # Gradual progression (weeks) — fungal spread is slower than bacterial
    if answers.get('onset_speed') == 'gradual':
        score += 0.08

    # Patches or scattered (spore spread pattern)
    if answers.get('spread_pattern') == 'patches':
        score += 0.08

    # Previous rice = spore carryover in stubble/debris (PDF1)
    if answers.get('previous_crop') in ['rice_same', 'rice_different']:
        score += 0.08

    # Symptoms on leaf blade (PDF1: primarily on leaf blade)
    if has_location(answers, 'leaf_blade'):
        score += 0.05

    # Recurrent same issue = persistent fungal pressure
    if answers.get('previous_disease') == 'yes_same':
        score += 0.05

    # --- PENALTY SIGNALS ---

    # Morning ooze = bacterial blight, not fungal
    if has_additional(answers, 'morning_ooze'):
        score -= 0.30

    # Purple roots = iron toxicity
    if has_additional(answers, 'purple_roots'):
        score -= 0.15

    # Leaf sheath symptoms = sheath blight, not brown spot
    if has_location(answers, 'leaf_sheath'):
        score -= 0.15

    # Panicle symptoms = blast at heading stage, not brown spot
    if has_location(answers, 'panicle'):
        score -= 0.15

    # Dry hot weather = reduces humidity needed for spore germination
    if answers.get('weather') == 'dry_hot':
        score -= 0.10

    # Uniform field spread = more systemic (N deficiency), not disease outbreak
    if answers.get('spread_pattern') == 'most_of_field':
        score -= 0.05

    # Apply confidence modifier and cap
    return cap_score(score * get_confidence_modifier(answers))


# -----------------------------------------------------------------------------
# 5F: BLAST SCORE (ជំងឺប្លាស)
# Source: PDF1 (blast section)
# Pathogen: Pyricularia oryzae
# Key: humidity + flowering stage = highest severity
# Most distinctive: panicle/neck blast at heading
# -----------------------------------------------------------------------------

def score_blast(answers: dict) -> float:
    """
    Scores the likelihood of Rice Blast (fungal disease).
    Blast is BIOTIC (fungal) — wind-borne spores.

    Key signals (from PDF1):
    - High humidity = essential for spore germination
    - Panicle/neck blast at flowering = most damaging and distinctive
    - Rapid spread (wind-borne, faster than brown spot)
    - Any growth stage can be affected (unlike brown spot)
    """
    score = 0.0

    # --- POSITIVE SIGNALS ---

    # High humidity = essential for blast (PDF1: spores require moisture film)
    if answers.get('weather') == 'high_humidity':
        score += 0.30  # STRONG
    elif answers.get('weather') == 'heavy_rain':
        score += 0.20  # MEDIUM (rain + humidity)

    # Panicle symptoms = neck blast — near-unique to blast at heading (PDF1)
    # "Panicle blast: white, empty grains — most yield damage"
    if has_location(answers, 'panicle'):
        score += 0.30  # VERY STRONG — distinctive sign

    # Flowering = most critical stage for blast severity (PDF1)
    if answers.get('growth_stage') == 'flowering':
        score += 0.25  # STRONG

    # Dark spots on leaf blade = leaf blast
    if has_symptom(answers, 'dark_spots'):
        score += 0.15

    # Sudden rapid spread = wind-borne spores move quickly (PDF1)
    if answers.get('onset_speed') == 'sudden':
        score += 0.15  # MEDIUM

    # Previous rice = spore carryover in seed and debris (PDF1)
    if answers.get('previous_crop') in ['rice_same', 'rice_different']:
        score += 0.10  # MEDIUM

    # Patch spread = initial foci then expanding
    if answers.get('spread_pattern') == 'patches':
        score += 0.08

    # Stem symptoms = node blast (PDF1)
    if has_location(answers, 'stem'):
        score += 0.10

    # Recurrent disease = persistent blast pressure
    if answers.get('previous_disease') == 'yes_same':
        score += 0.05

    # Elongation stage = susceptible to leaf blast
    if answers.get('growth_stage') == 'elongation':
        score += 0.05

    # Upper/young leaves most susceptible (PDF1: young tissue attacked first)
    if answers.get('symptom_origin') == 'upper_leaves':
        score += 0.05

    # --- PENALTY SIGNALS ---

    # Morning ooze = bacterial blight, not blast
    if has_additional(answers, 'morning_ooze'):
        score -= 0.30

    # Purple roots = iron toxicity
    if has_additional(answers, 'purple_roots'):
        score -= 0.15

    # Leaf sheath symptoms = sheath blight
    if has_location(answers, 'leaf_sheath'):
        score -= 0.15

    # Dry hot weather = reduces blast pressure significantly (PDF1)
    if answers.get('weather') == 'dry_hot':
        score -= 0.15

    # No fertilizer + yellowing only = N deficiency more likely
    if (answers.get('fertilizer_applied') == False and
            not has_symptom(answers, 'dark_spots')):
        score -= 0.10

    # Uniform field spread = systemic issue
    if answers.get('spread_pattern') == 'most_of_field':
        score -= 0.05

    # Apply confidence modifier and cap
    return cap_score(score * get_confidence_modifier(answers))


# =============================================================================
# SECTION 6: SPECIAL FLAG FUNCTIONS
# -----------------------------------------------------------------------------
# These run in parallel with the scoring functions.
# They detect conditions outside the main scoring scope.
# =============================================================================

def flag_sheath_blight(answers: dict) -> bool:
    """
    Detects possible Sheath Blight (Rhizoctonia solani) — OUTSIDE system scope.
    Returns True if symptoms suggest sheath blight.
    When True: append a warning to ANY output asking farmer to consult expert.

    From PDF1: sheath blight appears on leaf sheath, common at flowering,
    thrives at 30-32°C with humidity 96-97%.
    """
    signals = 0

    # Primary location marker — sheath blight is ON the leaf sheath
    if has_location(answers, 'leaf_sheath'):
        signals += 2  # Counts double — most important signal

    # Environmental conditions that favor sheath blight (PDF1)
    if answers.get('water_condition') == 'flooded_continuously':
        signals += 1
    if answers.get('weather') in ['heavy_rain', 'high_humidity']:
        signals += 1
    if answers.get('growth_stage') in ['flowering', 'grain_filling']:
        signals += 1  # Most commonly observed at these stages

    # Threshold: 3 or more signals = flag sheath blight
    return signals >= 3


def flag_out_of_scope(answers: dict) -> bool:
    """
    Detects cases that are likely NOT plant disease.
    Examples: insect damage, physical damage, healthy slow-growing plants.

    Returns True if no meaningful diagnostic pattern is present.
    When True: output "Cannot assess" message.

    PATTERNS DETECTED:
    1. No symptoms at all → out of scope
    2. Only 'slow_growth' with no additional signs → not a disease
    3. Only one vague symptom + 'not_sure' confidence + no additional signs
       → insufficient evidence to attempt diagnosis
    4. Only 'dried_areas' on stem with few plants → likely physical/insect damage
    """
    symptoms = answers.get('symptoms', [])
    additional = answers.get('additional_symptoms', [])
    confidence = answers.get('farmer_confidence')

    # Meaningful additional symptoms (excluding 'none')
    meaningful_additional = [a for a in additional if a != 'none']

    # PATTERN 1: No symptoms at all
    if not symptoms:
        return True

    # PATTERN 2: Only "slow growth" with no other symptoms or additional signs
    # This pattern doesn't match any disease in scope
    if (symptoms == ['slow_growth'] and not meaningful_additional):
        return True

    # PATTERN 3: Single vague symptom + not_sure + no meaningful additional signs
    # Vague symptoms are those that appear across many conditions and cannot
    # narrow the diagnosis on their own
    vague_symptoms = {'slow_growth', 'dried_areas', 'yellowing'}
    if (len(symptoms) == 1 and
            symptoms[0] in vague_symptoms and
            confidence == 'not_sure' and
            not meaningful_additional):
        return True

    # PATTERN 4: Only 'dried_areas' on stem with few plants
    # This pattern strongly suggests physical damage or insect boring,
    # not any of the 6 conditions in scope
    if (symptoms == ['dried_areas'] and
            answers.get('spread_pattern') == 'few_plants' and
            'stem' in answers.get('symptom_location', [])):
        return True

    return False


# =============================================================================
# SECTION 7: COMPUTE ALL SCORES (MAIN SCORING ENTRY POINT)
# -----------------------------------------------------------------------------
# This function runs ALL scoring functions and returns a complete score dict.
# This is what Phase 2 (decision logic) will call.
# =============================================================================

def compute_all_scores(answers: dict) -> dict:
    """
    Runs all 6 scoring functions and returns a dictionary of scores.
    Also runs special flags.

    Args:
        answers (dict): VALIDATED answer dictionary (run through validate_answers first)

    Returns:
        dict: {
            'scores': {condition: float, ...},
            'flags': {'sheath_blight': bool, 'out_of_scope': bool}
        }
    """
    scores = {
        'iron_toxicity':      score_iron_toxicity(answers),
        'n_deficiency':       score_nitrogen_deficiency(answers),
        'salt_toxicity':      score_salt_toxicity(answers),
        'bacterial_blight':   score_bacterial_blight(answers),
        'brown_spot':         score_brown_spot(answers),
        'blast':              score_blast(answers)
    }

    flags = {
        'sheath_blight': flag_sheath_blight(answers),
        'out_of_scope':  flag_out_of_scope(answers)
    }

    return {'scores': scores, 'flags': flags}
