# =============================================================================
# translations/en.py — English UI Labels
# -----------------------------------------------------------------------------
# English-only versions of UI chrome strings. Used when lang="en" to provide
# clean monolingual output (the DSS core already outputs in English by default,
# but the UI labels need a centralized source for language switching).
# =============================================================================


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

    # Misc
    'yes': 'Yes',
    'no': 'No',
    'select_placeholder': 'Select an option...',
    'morning_ooze_help': 'Morning ooze is a strong indicator of Bacterial Blight.',
}
