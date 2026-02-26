# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# run_local.py — Local Development Runner
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project conversion)
#
# PURPOSE:
#   Quick sanity-check script that runs the DSS core logic directly
#   (without the API server) and prints results to the terminal.
#   Use this to verify the DSS is working correctly after installation.
#
# HOW TO RUN:
#   python run_local.py
#
# What it does:
#   1. Runs the original Phase 1 sanity check (Case 03: Bacterial Blight)
#   2. Runs the full 20-case test suite and reports PASS/FAIL
#   3. Runs the score distribution analysis
#   4. Demonstrates questionnaire / ml-only / hybrid modes
# =============================================================================

import sys
import os

# Ensure the project root is in the Python path when running directly
sys.path.insert(0, os.path.dirname(__file__))

from dss.validation import validate_answers
from dss.scoring import compute_all_scores, get_confidence_modifier
from dss.decision import generate_output
from dss.mode_layer import run_dss
from dss.output_builder import NON_BIOTIC_CONDITIONS, BIOTIC_CONDITIONS
from tests.test_dss import TEST_CASES


# =============================================================================
# SECTION 8: SANITY CHECK (from FYP.ipynb — Phase 1)
# -----------------------------------------------------------------------------
# Run this cell to confirm everything loaded correctly.
# Uses Case 03 (Bacterial Blight — clear morning ooze) from the test cases.
# Expected: bacterial_blight score should be the highest.
# =============================================================================

def run_sanity_check():
    """
    Quick test using Case 03 (Bacterial Blight with morning ooze).
    Expected: bacterial_blight score is the highest, all other scores are lower.
    """
    print("=" * 60)
    print("SANITY CHECK — Case 03: Bacterial Blight (Morning Ooze)")
    print("=" * 60)

    # Raw answers simulating a farmer with bacterial blight
    raw = {
        'growth_stage':         'tillering',
        'symptoms':             ['yellowing', 'white_tips', 'dried_areas'],
        'symptom_location':     ['leaf_blade'],
        'symptom_origin':       'lower_leaves',
        'farmer_confidence':    'very_sure',
        'fertilizer_applied':   True,
        'fertilizer_amount':    'normal',
        'fertilizer_type':      'balanced_npk',
        'weather':              'heavy_rain',
        'water_condition':      'flooded_continuously',
        'spread_pattern':       'patches',
        'symptom_timing':       'during_tillering',
        'onset_speed':          'sudden',
        'previous_disease':     'yes_same',
        'previous_crop':        'rice_same',
        'soil_type':            'unsure',
        'soil_cracking':        None,
        'additional_symptoms':  ['morning_ooze'],
        'ml_probabilities':     None
    }

    # Step 1: Validate
    validated = validate_answers(raw)
    print("\nStep 1: Validation passed ✓")
    print(f"  Confidence modifier: {get_confidence_modifier(validated):.2f}")

    # Step 2: Score
    result = compute_all_scores(validated)
    scores = result['scores']
    flags = result['flags']

    print("\nStep 2: Scores computed ✓")
    print("\nAll scores:")
    for condition, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        bar = '█' * int(score * 20)
        print(f"  {condition:<22} {score:.3f}  {bar}")

    print(f"\nFlags:")
    print(f"  Sheath blight flag: {flags['sheath_blight']}")
    print(f"  Out of scope flag:  {flags['out_of_scope']}")

    # Step 3: Verify
    top_condition = max(scores, key=scores.get)
    top_score = scores[top_condition]

    print("\nStep 3: Verification")
    if top_condition == 'bacterial_blight':
        print(f"  ✅ PASS — bacterial_blight is highest ({top_score:.3f})")
        print(f"  Morning ooze signal working correctly.")
    else:
        print(f"  ❌ FAIL — Expected bacterial_blight, got {top_condition} ({top_score:.3f})")
        print(f"  Check morning_ooze signal in score_bacterial_blight()")

    print("\n" + "=" * 60)
    print("Sanity check complete. If PASS, proceed to Phase 2.")
    print("=" * 60)


# =============================================================================
# FULL 20-CASE TEST RUNNER (from FYP.ipynb — Phase 2, Cell 19)
# =============================================================================

def run_all_tests(verbose: bool = False) -> None:
    """
    Runs all 20 test cases and reports PASS/FAIL for each.

    Args:
        verbose (bool): If True, prints full output for each case.
                        If False, prints summary table only.
    """
    print("=" * 70)
    print("FULL TEST RUNNER — 20 Cases")
    print("=" * 70)

    passed = 0
    failed = 0
    failed_cases = []

    for i, (answers, expected, name) in enumerate(TEST_CASES, 1):
        output = generate_output(answers)
        actual = output.get('condition_key', 'unknown')

        # Special handling for Case 14: Sheath Blight
        # Primary condition may vary — we check for warning presence
        if i == 14:
            has_sheath_warning = any(
                'Sheath Blight' in w for w in output.get('warnings', [])
            )
            passed_check = has_sheath_warning
            status = '✅ PASS' if passed_check else '❌ FAIL'
            detail = f'(sheath warning present: {has_sheath_warning})'
        else:
            passed_check = (actual == expected)
            status = '✅ PASS' if passed_check else '❌ FAIL'
            detail = f'got: {actual}' if not passed_check else ''

        if passed_check:
            passed += 1
        else:
            failed += 1
            failed_cases.append((i, name, expected, actual))

        # Print result line
        score_str = f"{output.get('score', 0):.3f}"
        print(f"  Case {i:02d}: {status}  [{score_str}]  {name[:45]:<45} {detail}")

        # Verbose: print full output
        if verbose:
            print(f"\n    Full output:")
            for k, v in output.items():
                if k not in ('all_scores', 'recommendations', 'disclaimer'):
                    print(f"      {k}: {v}")
            print()

    # Summary
    print("\n" + "=" * 70)
    print(f"RESULTS: {passed}/20 passed  |  {failed}/20 failed")
    print("=" * 70)

    if failed_cases:
        print("\nFailed cases (review scoring weights):")
        for case_num, name, expected, actual in failed_cases:
            print(f"  Case {case_num:02d}: {name}")
            print(f"    Expected: {expected}")
            print(f"    Got:      {actual}")
    else:
        print("\n✅ All 20 cases passed — decision logic is working correctly.")
        print("Phase 2 complete. System ready for UI integration.")

    print("=" * 70)


# =============================================================================
# SCORE DISTRIBUTION ANALYSIS (from FYP.ipynb — Cell 20)
# =============================================================================

def analyze_score_distribution():
    """
    Evaluates score distribution across ALL test cases.
    Helps detect overweighted or underpowered conditions.
    """
    print("\n" + "="*70)
    print("SCORE DISTRIBUTION ANALYSIS")
    print("="*70)

    all_distributions = {cond: [] for cond in
                         NON_BIOTIC_CONDITIONS.union(BIOTIC_CONDITIONS)}

    for answers, _, name in TEST_CASES:
        validated = validate_answers(answers)
        result = compute_all_scores(validated)
        scores = result['scores']

        for cond, val in scores.items():
            all_distributions[cond].append(val)

    print("\nCondition-wise Score Summary:")
    print("-"*70)

    for cond, values in all_distributions.items():
        if not values:
            continue
        print(f"{cond:<22} "
              f"min={min(values):.3f}  "
              f"max={max(values):.3f}  "
              f"avg={sum(values)/len(values):.3f}")

    print("\nINTERPRETATION GUIDE:")
    print("• If max ≈ 1.0 too often → condition may be overweighted.")
    print("• If max < 0.60 always → condition may be underpowered.")
    print("• Avg > 0.50 across most cases → risk of false positives.")
    print("="*70)


# =============================================================================
# MODE DEMONSTRATION
# =============================================================================

def demo_modes():
    """
    Demonstrates all three DSS modes on a single test case.
    """
    print("\n" + "=" * 60)
    print("MODE DEMONSTRATION")
    print("=" * 60)

    test_case = {
        'growth_stage':         'tillering',
        'symptoms':             ['dark_spots', 'yellowing'],
        'symptom_location':     ['leaf_blade'],
        'symptom_origin':       'lower_leaves',
        'farmer_confidence':    'very_sure',
        'fertilizer_applied':   False,
        'weather':              'heavy_rain',
        'water_condition':      'wet',
        'spread_pattern':       'patches',
        'onset_speed':          'gradual',
        'previous_crop':        'rice_same',
        'additional_symptoms':  ['none'],
        'ml_probabilities':     None
    }

    # Questionnaire only
    q_output = run_dss(test_case, mode="questionnaire")
    print(f"\n[questionnaire] → {q_output['condition_key']} (score: {q_output['score']:.3f})")

    # ML only (inject placeholder probabilities)
    ml_case = test_case.copy()
    ml_case['ml_probabilities'] = {
        'blast': 0.72,
        'brown_spot': 0.18,
        'bacterial_blight': 0.10
    }
    ml_output = run_dss(ml_case, mode="ml")
    print(f"[ml-only]       → {ml_output.get('condition_key')} (score: {ml_output.get('score', 0):.3f})")

    # Hybrid
    h_output = run_dss(ml_case, mode="hybrid")
    print(f"[hybrid]        → {h_output['condition_key']} (score: {h_output['score']:.3f})")

    print("=" * 60)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    run_sanity_check()
    print()
    run_all_tests(verbose=False)
    analyze_score_distribution()
    demo_modes()

    print("\n✅ run_local.py complete.")
    print("To start the API server, run:")
    print("  uvicorn api.main:app --reload --port 8000")
