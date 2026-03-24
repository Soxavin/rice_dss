# =============================================================================
# translations/en.py — English UI Labels + Recommendation Refinements
# -----------------------------------------------------------------------------
# English-only versions of UI chrome strings. Used when lang="en" to provide
# clean monolingual output (the DSS core already outputs in English by default,
# but the UI labels need a centralized source for language switching).
#
# Also contains RECOMMENDATIONS_EN_REPLACEMENTS — a mapping from frozen DSS
# recommendation strings to improved farmer-friendly versions. This preserves
# all dynamic personalization (soil-specific rates, flowering urgency, etc.)
# while refining the base wording.
# =============================================================================


# =============================================================================
# RECOMMENDATION REFINEMENTS — maps frozen DSS strings → improved versions
# =============================================================================
# The frozen DSS (dss/recommendations.py) outputs technically correct but
# "textbook" recommendation text. These replacements improve:
#   - Safety: removed banned chemicals (Benlate), hardcoded rates → label-based
#   - Clarity: removed PDF references, simplified academic phrasing
#   - Actionability: observable farmer actions, explicit timing
#   - Trust: "what NOT to do" incorporated, "no chemical cure" noted
#
# Personalized items (flowering urgency, soil-specific N rates, tillering
# timing, excess fertilizer cause) are NOT in this dict — they pass through
# the replacement unchanged, preserving the frozen DSS's dynamic logic.

RECOMMENDATIONS_EN_REPLACEMENTS = {
    # --- BLAST immediate ---
    'Apply fungicide: Tricyclazole or Benlate 2kg/ha — spray before flowering if possible':
        'Apply a fungicide (e.g., Tricyclazole) according to label instructions',
    'Avoid applying nitrogen fertilizer during active outbreak — excess N worsens blast':
        'Avoid applying nitrogen fertilizer during active infection',
    'Do not flood field during outbreak — reduce leaf wetness':
        'Manage water levels — avoid keeping the field continuously flooded',

    # --- BLAST preventive ---
    'Use resistant varieties: IR36, IR42, IR64, IR60 (PDF1)':
        'Use resistant varieties (e.g., IR36, IR42, IR64, IR60)',
    'Clean field debris and stubble after harvest — spores survive in residue':
        'Remove and destroy infected crop residues after harvest',
    'Apply balanced NPK — avoid excess nitrogen which increases susceptibility':
        'Apply balanced NPK fertilization — avoid excess nitrogen',
    'Rotate with non-rice crops to break disease cycle':
        'Practice crop rotation with non-rice crops',

    # --- BROWN SPOT immediate ---
    'Apply fungicide: Benlate 2kg/ha or Zineb 3kg/ha (PDF1)':
        'Apply a fungicide (e.g., Zineb) according to label instructions',
    'Apply nitrogen fertilizer if none has been used — N deficiency increases susceptibility':
        'Apply nitrogen fertilizer if deficiency is suspected',

    # --- BROWN SPOT preventive ---
    'Use resistant varieties: IR36, IR42, IR64 (PDF1)':
        'Use resistant varieties (e.g., IR36, IR42, IR64)',
    # 'Apply balanced NPK fertilizer throughout the season' — kept as is
    'Clean infected seed: soak in water for 24hrs, heat treat at 53-57°C for 10 mins (PDF1)':
        'Treat seeds with hot water (~55°C for 10 minutes) before planting',
    'Remove and burn infected plant debris after harvest':
        'Remove infected residues after harvest',
    'Improve drainage — avoid alternating wet/dry stress':
        'Improve field drainage',

    # --- BACTERIAL BLIGHT immediate ---
    'Drain field immediately — bacterial blight spreads via water movement':
        'Drain excess water from the field immediately',
    'Do NOT flood or irrigate across fields during outbreak — spreads to healthy fields':
        'Avoid moving water between infected and healthy fields',
    'Remove and destroy infected plants/stubble — do not compost them':
        'Remove and destroy infected plants — do not compost',
    'Avoid working in wet field — movement spreads bacteria between plants':
        'Avoid working in wet fields to reduce spread',

    # --- BACTERIAL BLIGHT preventive ---
    'Use disease-free seed — do not use seed from infected plants (PDF1)':
        'Use disease-free seeds',
    'Avoid reusing water from infected fields for irrigation':
        'Avoid reusing irrigation water from infected fields',
    'Do not apply excess nitrogen — makes plants more susceptible':
        'Avoid excess nitrogen fertilizer',
    'Remove infected stubble after harvest before next planting':
        'Remove infected residues before the next season',

    # --- IRON TOXICITY immediate ---
    'Drain field for 7-10 days during tillering stage — reduces Fe2+ concentration (PDF2)':
        'Drain the field for 7–10 days to reduce Fe²⁺ toxicity',
    'Apply balanced NPK + potassium — K deficiency worsens iron toxicity (PDF2)':
        'Apply balanced NPK fertilizer with sufficient potassium (K)',
    'Apply lime (calcium) to raise soil pH if soil is very acidic':
        'Apply lime if soil is acidic',
    'Do NOT apply only nitrogen — full nutrient balance is required':
        'Avoid applying nitrogen alone',

    # --- IRON TOXICITY preventive ---
    'Avoid continuous flooding — drain field periodically during growing season (PDF2)':
        'Avoid continuous flooding',
    'Use varieties with strong root oxidation capacity':
        'Use tolerant rice varieties',
    'Apply potassium fertilizer sufficient to maintain K:Na balance in soil':
        'Ensure sufficient potassium levels',
    'Plow and dry field for 2-3 months between seasons to oxidize iron (PDF2)':
        'Dry and plough the field between seasons (2–3 months)',
    'Do not incorporate large amounts of undecomposed organic matter':
        'Avoid excessive use of undecomposed organic matter',

    # --- N DEFICIENCY immediate ---
    # First item is personalized (soil-specific) — each variant needs its PDF ref removed
    'Apply nitrogen fertilizer immediately — For Bakan soil: Apply Urea 134 kg/ha (PDF2 recommendation)':
        'Apply nitrogen fertilizer immediately — For Bakan soil: apply approximately 134 kg/ha of Urea',
    'Apply nitrogen fertilizer immediately — For Prateah Lang soil: Apply Urea 88 kg/ha (PDF2 recommendation)':
        'Apply nitrogen fertilizer immediately — For Prateah Lang soil: apply approximately 88 kg/ha of Urea',
    'Apply nitrogen fertilizer immediately — For Prey Khmer soil: Apply Urea 38 kg/ha (PDF2 — sandy soil, low rate)':
        'Apply nitrogen fertilizer immediately — For Prey Khmer soil: apply approximately 38 kg/ha of Urea (sandy soil — lower rate)',
    'Apply nitrogen fertilizer immediately — For Toul Samroung soil: Apply Urea 113 kg/ha (PDF2 recommendation)':
        'Apply nitrogen fertilizer immediately — For Toul Samroung soil: apply approximately 113 kg/ha of Urea',
    'Apply nitrogen fertilizer immediately — For Kbal Po soil: Apply Urea 87 kg/ha + nitrogen only (PDF2)':
        'Apply nitrogen fertilizer immediately — For Kbal Po soil: apply approximately 87 kg/ha of Urea',
    'Apply nitrogen fertilizer immediately — For Krakor soil: Apply Urea 238 kg/ha — high N response (PDF2)':
        'Apply nitrogen fertilizer immediately — For Krakor soil: apply approximately 238 kg/ha of Urea (high N-response soil)',
    'Split application: apply now + again at panicle initiation (PDF2)':
        'Apply now and reapply at early tillering stage',
    'Incorporate fertilizer into soil if possible — reduces N loss (PDF2)':
        'Incorporate fertilizer into soil if possible',

    # --- N DEFICIENCY preventive ---
    'Apply nitrogen at three stages: pre-planting, tillering (30 days), panicle initiation (PDF2)':
        'Apply nitrogen in 3 stages: pre-planting, tillering, panicle initiation',
    'Use balanced NPK — nitrogen alone without P is less effective on most Cambodian soils (PDF2)':
        'Maintain balanced NPK fertilization',
    'On sandy soils (Prey Khmer): split into more frequent small applications to reduce leaching':
        'On sandy soils, apply smaller amounts more frequently',
    'Consider organic matter / compost to improve long-term soil N retention':
        'Use organic matter/compost to improve nitrogen retention',

    # --- SALT TOXICITY immediate ---
    'Flush field with clean freshwater to dilute salt concentration (PDF2)':
        'Flush the field with fresh water to dilute salinity',
    'Stop applying fertilizer immediately — do not add more inputs':
        'Stop fertilizer application immediately',
    'Check irrigation water source — if saline, switch to alternative source':
        'Check irrigation water source',

    # --- SALT TOXICITY preventive ---
    'Never exceed recommended fertilizer rates — excess creates salt buildup (PDF2)':
        'Avoid over-fertilization',
    'Use balanced NPK: adequate K reduces salt damage by improving K:Na ratio in plant (PDF2)':
        'Maintain sufficient potassium levels',
    'Flood field 2-4 weeks before planting to leach salts (PDF2)':
        'Flood the field 2–4 weeks before planting to leach salts',
    'Avoid irrigation with groundwater or river water with high salt content':
        'Avoid saline water sources',
    'Use varieties with shorter growing periods to reduce salt exposure time':
        'Use salt-tolerant varieties',
}

# Monitoring strings (single string per condition, separate from list items)
RECOMMENDATIONS_EN_MONITORING = {
    # Blast
    'Check for spread to new leaves and panicles daily. '
    'If panicle is infected, yield loss may already be significant.':
        'Check new leaves daily for lesions. '
        'If panicles are infected, yield loss may already have occurred.',

    # Brown spot
    'Monitor after fungicide application — if spots continue spreading '
    'after 7 days, consult extension officer.':
        'Re-check the field 5–7 days after treatment. '
        'If symptoms continue spreading, consult an extension officer.',

    # Bacterial blight
    'Check leaf tips at dawn for yellow/milky ooze to confirm diagnosis. '
    'Monitor spread direction — if following water flow, confirms bacterial blight.':
        'Check leaf tips early in the morning for yellow/whitish ooze. '
        'Monitor spread pattern — water-direction spread is a key indicator.',

    # Iron toxicity
    'Check root color after 7 days of drainage — roots should return '
    'to white/normal color if iron toxicity is resolving. '
    'Leaf symptoms may persist even as recovery begins.':
        'Check root color after 7 days — healthy roots should return to white. '
        'Leaf symptoms may take longer to improve.',

    # N deficiency
    'Yellowing should improve within 7-10 days of nitrogen application. '
    'If no improvement after 10 days, reassess — may have secondary disease.':
        'Yellowing should improve within 7–10 days. '
        'If no improvement, reassess for other conditions.',

    # Salt toxicity
    'Symptoms should stop progressing within 5-7 days after flushing. '
    'If white tips continue spreading, check if new growth is also affected — '
    'if yes, salt source is ongoing.':
        'Symptoms should stop spreading within 5–7 days. '
        'If new growth is still affected, salinity is still present.',
}

# Extra items to append for specific conditions (not in frozen DSS)
RECOMMENDATIONS_EN_EXTRAS = {
    'bacterial_blight': {
        'immediate': [
            'There is no highly effective chemical cure — focus on management',
        ],
    },
}


UI_LABELS_EN = {
    # Page
    'page_title': 'Rice Paddy Disease DSS',
    'page_subtitle': 'Select a diagnosis mode and provide the required inputs.',

    # Mode selector
    'mode_label': 'Diagnosis Mode',
    'mode_hybrid': 'Hybrid (Recommended)',
    'mode_image': 'Image Only (ML)',
    'mode_questionnaire': 'Questionnaire Only',

    # Questionnaire depth
    'depth_label': 'Questionnaire depth',
    'depth_quick': 'Quick (essential only)',
    'depth_detailed': 'Detailed (all questions)',
    'depth_quick_caption': (
        'Essential questions only — the system scores from available evidence. '
        'Switch to Detailed for more accurate results.'
    ),

    # Section headers
    'section_growth': 'Crop Growth Stage',
    'section_symptoms': 'Symptoms Observed',
    'section_fertilizer': 'Fertilizer',
    'section_weather': 'Weather & Field Conditions',
    'section_timing': 'Symptom Timing',
    'section_history': 'Field History & Soil (optional)',
    'section_additional': 'Additional Observations',

    # Questions
    'q_growth_stage': 'What stage is the rice crop currently at?',
    'q_symptoms': 'What symptoms do you see? (select all that apply)',
    'q_symptom_location': 'Where on the plant are the symptoms?',
    'q_symptom_origin': 'Which leaves are showing symptoms first?',
    'q_confidence': 'How sure are you about what you\'re seeing?',
    'q_fertilizer_applied': 'Has fertilizer been applied this season?',
    'q_fertilizer_amount': 'How much fertilizer was applied?',
    'q_fertilizer_type': 'What type of fertilizer?',
    'q_fertilizer_timing': 'When was fertilizer last applied?',
    'q_weather': 'What has the weather been like recently?',
    'q_water': 'What is the current water condition in the field?',
    'q_spread': 'How widespread are the symptoms?',
    'q_timing': 'When did symptoms first appear?',
    'q_onset': 'How quickly did the symptoms spread?',
    'q_prev_disease': 'Has this field had disease problems before?',
    'q_prev_crop': 'What was grown in this field last season?',
    'q_soil_type': 'What type of soil does this field have?',
    'q_soil_cracking': 'Does the soil crack when dry?',
    'q_additional': 'Any additional symptoms? (select all that apply)',

    # Buttons
    'btn_run_diagnosis': 'Run Diagnosis',
    'btn_quick_diagnosis': 'Quick Diagnosis',
    'btn_run_ml': 'Run ML Diagnosis',

    # Results
    'result_title': 'Diagnosis Result',
    'result_mode': 'Mode',
    'result_recommendations': 'Recommendations',
    'result_immediate': 'Immediate actions:',
    'result_preventive': 'Preventive measures:',
    'result_monitoring': 'Monitoring:',
    'result_consult': 'Consult an agronomist or local extension officer to confirm.',
    'result_score_breakdown': 'Score Breakdown',
    'result_why': 'Why This Diagnosis?',
    'result_conflicting': 'Conflicting conditions:',

    # Diagnostic strength
    'strength_limited': 'Limited — switch to Detailed mode for better accuracy',
    'strength_moderate': 'Moderate — good for a preliminary check',
    'strength_strong': 'Strong — detailed input for best accuracy',

    # Image upload
    'image_title': 'Leaf Image',
    'image_caption': 'Upload a clear, close-up photo of the affected rice leaf.',
    'image_optional': 'Upload a photo of the affected leaf for ML-assisted diagnosis.',

    # Tooltips (help text for ? icons)
    'mode_help': (
        'Hybrid = both combined (most accurate) | '
        'Image Only = ML model only (3 biotic diseases) | '
        'Questionnaire = rule-based only'
    ),
    'depth_help': (
        'Quick mode asks ~6 essential questions. '
        'Detailed mode includes all questions for more accurate diagnosis.'
    ),
    'image_upload_help': 'A clear, close-up photo of a diseased rice leaf works best.',

    # Mode captions (description under mode selector)
    'mode_caption_questionnaire': (
        'Rule-based diagnosis from farmer-reported symptoms and field conditions. '
        'Detects all 6 conditions including non-biotic stresses.'
    ),
    'mode_caption_image': (
        'ML diagnosis from a leaf image only. Detects 3 biotic diseases '
        '(blast, brown spot, bacterial blight). '
        '**Cannot** detect non-biotic stresses (iron toxicity, N deficiency, salt toxicity).'
    ),
    'mode_caption_hybrid': (
        'Combines questionnaire answers with ML image analysis for the most accurate diagnosis. '
        'Detects all 6 conditions. Falls back to questionnaire-only if no image is provided.'
    ),

    # Image uploader
    'image_upload_label': 'Upload a leaf image',
    'image_uploaded_caption': 'Uploaded leaf image',
    'image_mode_single': 'Single photo',
    'image_mode_multi': 'Multiple angles (2–5 photos)',
    'image_multi_caption': 'Upload 2–5 photos of the same leaf from different angles for more accurate ML prediction.',
    'image_upload_multi_label': 'Upload leaf images (2–5)',
    'image_multi_count': 'images uploaded',
    'image_disagree_warning': (
        'Your images appear to show different conditions. '
        'For best results, upload photos of the same leaf from different angles.'
    ),

    # ML-only mode
    'ml_only_info': 'In Image Only mode, the questionnaire is not needed. Upload a leaf image above.',

    # Explain section
    'explain_caption': (
        'Shows every signal (positive and penalty) that contributed to each '
        "condition's score. The winning condition is expanded by default."
    ),

    # Score / Confidence (result section)
    'result_score': 'Score',
    'result_confidence': 'Confidence',
    'gauge_possible': 'Possible',
    'gauge_probable': 'Probable',
    'gauge_confidence': 'Confidence',

    # ML prediction section
    'ml_title': 'ML Model Prediction',
    'ml_caption': 'Probabilities from the image classification model (3 biotic diseases).',

    # Condition display names (score bars, ML bars, explanation)
    'cond_blast': 'Blast',
    'cond_brown_spot': 'Brown Spot',
    'cond_bacterial_blight': 'Bacterial Blight',
    'cond_iron_toxicity': 'Iron Toxicity',
    'cond_n_deficiency': 'Nitrogen Deficiency',
    'cond_salt_toxicity': 'Salt Toxicity',
    'cond_ambiguous': 'Ambiguous',
    'cond_uncertain': 'Uncertain',

    # Explanation section
    'explain_confidence_modifier': 'Confidence modifier',
    'explain_farmer_said': 'farmer said',
    'explain_winner': 'winner',
    'explain_no_signals': 'No signals activated for this condition.',

    # Sidebar test cases
    'sidebar_test_header': 'Load Test Case',
    'sidebar_test_caption': 'Pre-fills the form with a known validated scenario.',
    'sidebar_test_ml_caption': (
        'Test cases contain questionnaire answers — switch to '
        'Questionnaire or Hybrid mode to use them.'
    ),
    'sidebar_choose_test': 'Choose a test case',

    # UI messaging (trust-building)
    'nonbiotic_note': (
        'This condition is caused by soil or water factors, not a disease. '
        'Pesticides will not be effective.'
    ),
    'confidence_caveat': (
        'Confidence reflects the strength of available evidence, not guaranteed accuracy. '
        'Use Detailed mode for more reliable results.'
    ),
    'fertilizer_disclaimer': (
        'Fertilizer rates shown are research-based guidelines for Cambodian soil types. '
        'Adjust based on your specific field conditions.'
    ),
    'also_consider': 'Also Consider',
    'secondary_explanation': 'These conditions also showed indicators based on your answers.',

    # Misc
    'yes': 'Yes',
    'no': 'No',
    'select_placeholder': 'Select an option...',
    'multiselect_placeholder': 'Choose options',
    'morning_ooze_help': 'Morning ooze is a strong indicator of Bacterial Blight.',
}
