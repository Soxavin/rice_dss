# =============================================================================
# tests/test_secondary.py — Secondary Conditions Tests
# -----------------------------------------------------------------------------
# Validates that the DSS correctly surfaces co-occurring conditions in the
# secondary_conditions field. Uses existing test case patterns from test_dss.py.
# =============================================================================

import pytest
from dss.decision import generate_output
from dss.mode_layer import run_dss
from dss.output_builder import THRESHOLD_POSSIBLE
from translations.core import translate_output


# =============================================================================
# TEST CASES
# =============================================================================

class TestSecondaryConditionsExtraction:
    """Tests for _extract_secondary_conditions() via generate_output()."""

    def test_brown_spot_with_n_deficiency_secondary(self):
        """Case 8 pattern: Brown Spot primary, N Deficiency should be secondary."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        assert output['condition_key'] == 'brown_spot'
        assert 'secondary_conditions' in output

        secondary_keys = [s['condition_key'] for s in output['secondary_conditions']]
        assert 'n_deficiency' in secondary_keys

    def test_clean_blast_no_secondaries(self):
        """Strong blast case with minimal overlap should have no secondary conditions."""
        answers = {
            'growth_stage': 'flowering',
            'symptoms': ['dark_spots', 'dried_areas'],
            'symptom_location': ['leaf_blade', 'panicle'],
            'symptom_origin': 'upper_leaves',
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': True,
            'fertilizer_amount': 'normal',
            'weather': 'normal',
            'water_condition': 'dry',
            'spread_pattern': 'patches',
            'onset_speed': 'sudden',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        assert output['condition_key'] == 'blast'
        assert output['secondary_conditions'] == []

    def test_primary_excluded_from_secondary(self):
        """Primary condition must never appear in secondary_conditions."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        primary = output['condition_key']
        secondary_keys = [s['condition_key'] for s in output['secondary_conditions']]
        assert primary not in secondary_keys

    def test_secondary_sorted_by_score_descending(self):
        """Secondary conditions should be sorted highest score first."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        secondary = output['secondary_conditions']
        if len(secondary) >= 2:
            scores = [s['score'] for s in secondary]
            assert scores == sorted(scores, reverse=True)

    def test_secondary_scores_above_threshold(self):
        """All secondary conditions must score >= THRESHOLD_POSSIBLE."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        for sc in output['secondary_conditions']:
            assert sc['score'] >= THRESHOLD_POSSIBLE

    def test_secondary_entry_structure(self):
        """Each secondary entry must have condition, condition_key, and score."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        for sc in output['secondary_conditions']:
            assert 'condition' in sc
            assert 'condition_key' in sc
            assert 'score' in sc
            assert isinstance(sc['score'], float)


class TestSecondaryInSpecialOutputs:
    """Tests that non-standard outputs return empty secondary_conditions."""

    def test_uncertain_has_empty_secondary(self):
        """Uncertain output should have empty secondary_conditions."""
        answers = {
            'symptoms': ['slow_growth'],
            'farmer_confidence': 'not_sure',
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        assert output['status'] in ('uncertain', 'out_of_scope')
        assert output['secondary_conditions'] == []

    def test_ml_only_has_empty_secondary(self):
        """ML-only mode should have empty secondary_conditions."""
        answers = {
            'ml_probabilities': {
                'blast': 0.80,
                'brown_spot': 0.10,
                'bacterial_blight': 0.10,
            }
        }
        output = run_dss(answers, mode='ml')
        assert output['secondary_conditions'] == []

    def test_ml_only_no_probs_has_empty_secondary(self):
        """ML-only mode with no probabilities should have empty secondary_conditions."""
        output = run_dss({}, mode='ml')
        assert output['secondary_conditions'] == []


class TestSecondaryConditionsTranslation:
    """Tests that secondary condition names are translated correctly."""

    def test_english_translation_extracts_english(self):
        """English translation should extract English from bilingual labels."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        translated = translate_output(output, lang='en')

        for sc in translated['secondary_conditions']:
            # English names should not contain Khmer script
            assert '(' not in sc['condition'] or 'ជំងឺ' not in sc['condition']

    def test_khmer_translation_extracts_khmer(self):
        """Khmer translation should extract Khmer from bilingual labels."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = generate_output(answers)
        translated = translate_output(output, lang='km')

        for sc in translated['secondary_conditions']:
            # Khmer names should not contain English parenthetical
            assert not sc['condition'].endswith(')')

    def test_empty_secondary_translation_unchanged(self):
        """Empty secondary_conditions should pass through translation unchanged."""
        output = run_dss({}, mode='ml')
        translated = translate_output(output, lang='km')
        assert translated['secondary_conditions'] == []


class TestSecondaryViaRunDSS:
    """Tests secondary conditions through the full run_dss() pipeline."""

    def test_questionnaire_mode_has_secondary(self):
        """Questionnaire-only mode should surface secondary conditions."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
        }
        output = run_dss(answers, mode='questionnaire')
        assert 'secondary_conditions' in output
        assert output['mode_used'] == 'Questionnaire Only'

    def test_hybrid_mode_has_secondary(self):
        """Hybrid mode should surface secondary conditions."""
        answers = {
            'growth_stage': 'tillering',
            'symptoms': ['yellowing', 'dark_spots', 'brown_discoloration'],
            'symptom_origin': 'lower_leaves',
            'symptom_location': ['leaf_blade'],
            'farmer_confidence': 'very_sure',
            'fertilizer_applied': False,
            'weather': 'high_humidity',
            'water_condition': 'wet',
            'spread_pattern': 'patches',
            'onset_speed': 'gradual',
            'additional_symptoms': ['none'],
            'ml_probabilities': None,
        }
        output = run_dss(answers, mode='hybrid')
        assert 'secondary_conditions' in output
        assert output['mode_used'] == 'Hybrid (Recommended)'
