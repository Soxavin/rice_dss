# =============================================================================
# translations/core.py — Translation Core Logic
# -----------------------------------------------------------------------------
# Parses bilingual strings from the frozen DSS output and produces clean
# monolingual output for the selected language.
#
# The frozen DSS uses two bilingual patterns:
#   Pattern A: "ខ្មែរ (English)"          — CONDITION_LABELS, CONFIDENCE_LABELS
#   Pattern B: "ខ្មែរ sentence. English sentence." — disclaimers
# =============================================================================

import copy
from translations.km import RECOMMENDATIONS_KM, WARNINGS_KM, UI_LABELS_KM
from translations.en import (
    UI_LABELS_EN, RECOMMENDATIONS_EN_REPLACEMENTS,
    RECOMMENDATIONS_EN_MONITORING, RECOMMENDATIONS_EN_EXTRAS,
)


SUPPORTED_LANGS = ('en', 'km')

# Fallback map for English-only confidence labels (from ML-only mode in mode_layer.py)
# These don't follow the bilingual "ខ្មែរ (English)" pattern so split_bilingual() can't parse them.
_CONFIDENCE_KM = {
    'Probable — High Confidence': 'ប្រហែលជា — ទំនុកចិត្តខ្ពស់',
    'Probable — Medium Confidence': 'ប្រហែលជា — ទំនុកចិត្តមធ្យម',
    'Possible — Moderate Confidence': 'អាចជា — ទំនុកចិត្តមធ្យម',
    'Possible — Monitor Closely': 'អាចជា',
    'Uncertain — Further Assessment Needed': 'មិនច្បាស់ — ពិនិត្យបន្ថែម',
}


def split_bilingual(label: str) -> tuple:
    """
    Splits a bilingual label in "ខ្មែរ (English)" format into (km, en) parts.

    Returns:
        tuple: (khmer_text, english_text)
    """
    if not label or not isinstance(label, str):
        return (label, label)

    # Pattern: "ខ្មែរ text (English text)"
    if ' (' in label and label.endswith(')'):
        idx = label.rfind(' (')
        km = label[:idx].strip()
        en = label[idx + 2:-1].strip()
        return (km, en)

    return (label, label)


def _translate_disclaimer(disclaimer: str, lang: str) -> str:
    """Extracts the Khmer or English portion of a bilingual disclaimer."""
    if not disclaimer:
        return disclaimer

    # Known Khmer sentence that starts bilingual disclaimers
    khmer_marker = 'ប្រព័ន្ធនេះជួយសំណេចការសម្រេចចិត្ត មិនមែនជាការធ្វើរោគវិនិច្ឆ័យ។'

    if khmer_marker in disclaimer:
        if lang == 'km':
            # Return Khmer portion + translated consultation advice
            return (
                'ប្រព័ន្ធនេះជួយសំណេចការសម្រេចចិត្ត មិនមែនជាការធ្វើរោគវិនិច្ឆ័យ។ '
                'សូមពិគ្រោះជាមួយអ្នកកសិកម្ម ឬមន្ត្រីផ្សព្វផ្សាយមូលដ្ឋាន ដើម្បីបញ្ជាក់។'
            )
        else:
            # Return English portion only
            en_start = disclaimer.find('This system')
            if en_start >= 0:
                return disclaimer[en_start:]
            return disclaimer
    else:
        # English-only disclaimer (uncertain/out_of_scope cases)
        if lang == 'km':
            return (
                'ប្រព័ន្ធនេះជួយសំណេចការសម្រេចចិត្តតែប៉ុណ្ណោះ — '
                'មិនមែនជាការធ្វើរោគវិនិច្ឆ័យច្បាស់លាស់ទេ។'
            )
        return disclaimer


def _translate_recommendations(recommendations: dict, condition_key: str,
                                lang: str) -> dict:
    """Refines recommendation text for the selected language.

    - English: applies string replacements to the frozen DSS output,
      preserving all dynamic personalization (soil-specific rates,
      flowering urgency, etc.).
    - Khmer: replaces with the full static RECOMMENDATIONS_KM dict.
    """
    if not recommendations:
        return recommendations

    if lang == 'km':
        km_recs = RECOMMENDATIONS_KM.get(condition_key)
        if km_recs:
            return km_recs
        return recommendations

    # English: apply wording improvements while preserving personalization
    result = copy.deepcopy(recommendations)

    for key in ('immediate', 'preventive'):
        items = result.get(key, [])
        result[key] = [
            RECOMMENDATIONS_EN_REPLACEMENTS.get(item, item) for item in items
        ]

    mon = result.get('monitoring', '')
    result['monitoring'] = RECOMMENDATIONS_EN_MONITORING.get(mon, mon)

    # Append condition-specific extras (e.g., "no chemical cure" for BB)
    extras = RECOMMENDATIONS_EN_EXTRAS.get(condition_key, {})
    for key in ('immediate', 'preventive'):
        extra_items = extras.get(key, [])
        if extra_items:
            result[key] = result.get(key, []) + extra_items

    return result


def _translate_warnings(warnings: list, lang: str) -> list:
    """Translates warning strings when lang='km'."""
    if lang != 'km' or not warnings:
        return warnings

    translated = []
    for w in warnings:
        km = WARNINGS_KM.get(w, w)
        translated.append(km)
    return translated


def _translate_secondary_note(note: str, lang: str) -> str:
    """Translates the secondary note if present."""
    if not note or lang != 'km':
        return note

    known = {
        'Evidence is suggestive but not conclusive. Monitor 3–5 days.':
            'ភស្តុតាងបង្ហាញប៉ុន្តែមិនទាន់ច្បាស់ទេ។ សូមតាមដានរយៈពេល ៣-៥ ថ្ងៃ។'
    }
    return known.get(note, note)


def _translate_ambiguous_between(amb_list: list, lang: str) -> list:
    """Translates the condition names in ambiguous_between entries."""
    if not amb_list:
        return amb_list

    translated = []
    for entry in amb_list:
        new_entry = dict(entry)
        if 'condition' in new_entry and new_entry['condition']:
            km, en = split_bilingual(new_entry['condition'])
            new_entry['condition'] = km if lang == 'km' else en
        translated.append(new_entry)
    return translated


def _translate_secondary_conditions(conditions: list, lang: str) -> list:
    """Translates the condition names in secondary_conditions entries."""
    if not conditions:
        return conditions

    translated = []
    for entry in conditions:
        new_entry = dict(entry)
        if 'condition' in new_entry and new_entry['condition']:
            km, en = split_bilingual(new_entry['condition'])
            new_entry['condition'] = km if lang == 'km' else en
        translated.append(new_entry)
    return translated


def translate_output(output: dict, lang: str = 'en') -> dict:
    """
    Post-processes DSS output for a specific language.

    Takes the raw bilingual output from run_dss() and produces a clean
    monolingual output dictionary.

    Args:
        output: Raw dict from run_dss()
        lang: "en" or "km" (default: "en")

    Returns:
        dict: Same structure, but with monolingual strings
    """
    if lang not in SUPPORTED_LANGS:
        lang = 'en'

    result = copy.deepcopy(output)

    # primary_condition: "ខ្មែរ (English)" → extract one side
    if result.get('primary_condition'):
        km, en = split_bilingual(result['primary_condition'])
        result['primary_condition'] = km if lang == 'km' else en

    # confidence_label: bilingual "ខ្មែរ (English)" or English-only from ML mode
    if result.get('confidence_label'):
        km, en = split_bilingual(result['confidence_label'])
        if km == en and lang == 'km':
            # English-only label (from ML mode) — use fallback lookup
            result['confidence_label'] = _CONFIDENCE_KM.get(km, km)
        else:
            result['confidence_label'] = km if lang == 'km' else en

    # disclaimer
    if result.get('disclaimer'):
        result['disclaimer'] = _translate_disclaimer(result['disclaimer'], lang)

    # recommendations
    condition_key = result.get('condition_key', '')
    if result.get('recommendations'):
        result['recommendations'] = _translate_recommendations(
            result['recommendations'], condition_key, lang
        )

    # warnings
    if result.get('warnings'):
        result['warnings'] = _translate_warnings(result['warnings'], lang)

    # secondary_note
    if result.get('secondary_note'):
        result['secondary_note'] = _translate_secondary_note(
            result['secondary_note'], lang
        )

    # ambiguous_between
    if result.get('ambiguous_between'):
        result['ambiguous_between'] = _translate_ambiguous_between(
            result['ambiguous_between'], lang
        )

    # secondary_conditions
    if result.get('secondary_conditions'):
        result['secondary_conditions'] = _translate_secondary_conditions(
            result['secondary_conditions'], lang
        )

    # mode_used
    if result.get('mode_used') and lang == 'km':
        mode_km = {
            'Questionnaire Only': 'កម្រងសំណួរតែប៉ុណ្ណោះ',
            'ML Only': 'ML តែប៉ុណ្ណោះ',
            'Hybrid (Recommended)': 'បញ្ចូលគ្នា (ណែនាំ)',
        }
        result['mode_used'] = mode_km.get(result['mode_used'], result['mode_used'])

    return result


def get_ui_labels(lang: str = 'en') -> dict:
    """
    Returns UI chrome strings (section headers, button labels, captions)
    in the selected language.

    Args:
        lang: "en" or "km"

    Returns:
        dict: UI label strings keyed by purpose
    """
    if lang == 'km':
        return UI_LABELS_KM
    return UI_LABELS_EN


def get_label_map(base_map: dict, lang: str = 'en') -> dict:
    """
    Returns bilingual labels with the selected language first.

    The UI label maps use "English (ខ្មែរ)" format. This function returns:
      - English mode: original "English (ខ្មែរ)" format (unchanged)
      - Khmer mode:   flipped  "ខ្មែរ (English)" format

    Args:
        base_map: Dict like {'seedling': 'Seedling (ពន្លក)', ...}
        lang: "en" or "km"

    Returns:
        dict: Same keys, bilingual values with selected language first
    """
    if lang == 'en':
        return dict(base_map)

    result = {}
    for key, bilingual_label in base_map.items():
        if ' (' in bilingual_label and bilingual_label.endswith(')'):
            idx = bilingual_label.rfind(' (')
            en_part = bilingual_label[:idx].strip()
            km_part = bilingual_label[idx + 2:-1].strip()
            result[key] = f"{km_part} ({en_part})"
        else:
            result[key] = bilingual_label
    return result
