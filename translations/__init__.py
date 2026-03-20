# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# translations/__init__.py — Translation Layer (Post-Processing)
# -----------------------------------------------------------------------------
# PURPOSE:
#   Provides a post-processing translation layer that sits between the frozen
#   DSS output and the API/UI response. Converts bilingual DSS output into
#   clean monolingual output (English or Khmer).
#
# ARCHITECTURE:
#   run_dss(answers, mode) → raw output (bilingual from frozen DSS)
#                          ↓
#   translate_output(output, lang) → clean monolingual output
#
# SUPPORTED LANGUAGES:
#   - "en" (English) — default
#   - "km" (Khmer / ភាសាខ្មែរ)
# =============================================================================

from translations.core import translate_output, get_ui_labels, split_bilingual

__all__ = ['translate_output', 'get_ui_labels', 'split_bilingual']
