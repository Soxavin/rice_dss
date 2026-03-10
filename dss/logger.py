# =============================================================================
# RICE PADDY DISEASE DECISION SUPPORT SYSTEM
# dss/logger.py — DSS Audit Logger
# -----------------------------------------------------------------------------
# INFRASTRUCTURE FILE (added during project improvement phase)
#
# PURPOSE:
#   Logs every DSS run with: timestamp, input answers, all 6 scores,
#   final condition, confidence level, decision path taken, and mode used.
#
# WHY:
#   1. FYP evaluation — prove system was tested on N cases with X% accuracy
#   2. Debugging — trace exactly why a weird result appeared
#   3. Field testing — audit trail of real farmer interactions
#   4. Report material — charts showing score distributions
#
# USAGE:
#   from dss.logger import dss_logger
#   dss_logger.log_run(answers, output, mode='questionnaire')
#   dss_logger.get_summary()         # returns aggregate stats
#   dss_logger.export_csv('path')    # exports log to CSV
#
# LOG STORAGE:
#   - In-memory list for session analysis
#   - Optional file output to logs/dss_runs.jsonl (one JSON per line)
#
# IMPORTANT:
#   This module has NO impact on DSS logic. It is purely observational.
#   Removing it will not change any scoring, decision, or output behaviour.
# =============================================================================

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger('rice_dss.audit')


# =============================================================================
# LOG FILE CONFIGURATION
# =============================================================================

DEFAULT_LOG_DIR = Path('logs')
DEFAULT_LOG_FILE = DEFAULT_LOG_DIR / 'dss_runs.jsonl'


# =============================================================================
# DSS AUDIT LOGGER
# =============================================================================

class DSSLogger:
    """
    Audit logger for DSS runs.

    Records every generate_output() invocation with full traceability:
    - Input answers (sanitized)
    - All 6 condition scores
    - Final decision (condition_key, score, confidence)
    - Decision path (which STEP in the hierarchy was triggered)
    - Mode used (questionnaire / ml / hybrid)
    - Timestamp

    Data is stored in memory and optionally persisted to a JSONL file.
    """

    def __init__(self, log_file: Optional[str] = None, enable_file_logging: bool = True):
        """
        Args:
            log_file: Path to JSONL log file. Default: logs/dss_runs.jsonl
            enable_file_logging: If False, only stores in memory (no disk writes)
        """
        self._runs: List[Dict] = []
        self._enable_file = enable_file_logging

        if log_file:
            self._log_path = Path(log_file)
        else:
            self._log_path = DEFAULT_LOG_FILE

        # Create log directory if file logging is enabled
        if self._enable_file:
            self._log_path.parent.mkdir(parents=True, exist_ok=True)

    def log_run(self, answers: dict, output: dict, mode: str = 'unknown') -> dict:
        """
        Records a single DSS run.

        Args:
            answers: The validated (cleaned) answer dict that was scored
            output: The full output dict from generate_output() or run_dss()
            mode: One of 'questionnaire', 'ml', 'hybrid', or 'unknown'

        Returns:
            dict: The log entry that was recorded
        """
        entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'mode': mode,

            # --- INPUT SUMMARY ---
            'input': {
                'growth_stage':       answers.get('growth_stage'),
                'symptoms':           answers.get('symptoms', []),
                'symptom_location':   answers.get('symptom_location', []),
                'symptom_origin':     answers.get('symptom_origin'),
                'farmer_confidence':  answers.get('farmer_confidence'),
                'fertilizer_applied': answers.get('fertilizer_applied'),
                'fertilizer_amount':  answers.get('fertilizer_amount'),
                'weather':            answers.get('weather'),
                'water_condition':    answers.get('water_condition'),
                'spread_pattern':     answers.get('spread_pattern'),
                'onset_speed':        answers.get('onset_speed'),
                'soil_type':          answers.get('soil_type'),
                'additional_symptoms': answers.get('additional_symptoms', []),
                'has_ml':             answers.get('ml_probabilities') is not None,
            },

            # --- SCORING RESULTS ---
            'all_scores': output.get('all_scores', {}),

            # --- DECISION ---
            'result': {
                'status':           output.get('status'),
                'condition_key':    output.get('condition_key'),
                'score':            output.get('score'),
                'confidence_level': output.get('confidence_level'),
            },

            # --- FLAGS ---
            'warnings': output.get('warnings', []),
            'has_secondary_note': output.get('secondary_note') is not None,
        }

        # Store in memory
        self._runs.append(entry)

        # Persist to file
        if self._enable_file:
            try:
                with open(self._log_path, 'a', encoding='utf-8') as f:
                    f.write(json.dumps(entry, ensure_ascii=False) + '\n')
            except (IOError, OSError) as e:
                logger.warning(f"[DSSLogger] Failed to write log file: {e}")

        return entry

    def get_runs(self) -> List[Dict]:
        """Returns all logged runs from this session."""
        return list(self._runs)

    def get_run_count(self) -> int:
        """Returns total number of runs logged this session."""
        return len(self._runs)

    def get_summary(self) -> dict:
        """
        Returns aggregate statistics from all logged runs this session.

        Useful for FYP evaluation chapter and robustness reporting.

        Returns:
            dict with keys:
            - total_runs: int
            - status_distribution: {status: count}
            - condition_distribution: {condition_key: count}
            - confidence_distribution: {confidence_level: count}
            - average_score: float (of assessed outputs only)
            - mode_distribution: {mode: count}
        """
        if not self._runs:
            return {'total_runs': 0}

        status_dist = {}
        condition_dist = {}
        confidence_dist = {}
        mode_dist = {}
        assessed_scores = []

        for run in self._runs:
            result = run.get('result', {})
            status = result.get('status', 'unknown')
            condition = result.get('condition_key', 'unknown')
            confidence = result.get('confidence_level', 'unknown')
            mode = run.get('mode', 'unknown')

            status_dist[status] = status_dist.get(status, 0) + 1
            condition_dist[condition] = condition_dist.get(condition, 0) + 1
            confidence_dist[confidence] = confidence_dist.get(confidence, 0) + 1
            mode_dist[mode] = mode_dist.get(mode, 0) + 1

            if status == 'assessed' and result.get('score') is not None:
                assessed_scores.append(result['score'])

        avg_score = (
            round(sum(assessed_scores) / len(assessed_scores), 3)
            if assessed_scores else 0.0
        )

        return {
            'total_runs': len(self._runs),
            'status_distribution': status_dist,
            'condition_distribution': condition_dist,
            'confidence_distribution': confidence_dist,
            'average_score': avg_score,
            'mode_distribution': mode_dist,
        }

    def export_csv(self, filepath: str) -> int:
        """
        Exports all logged runs to a CSV file for analysis in Excel/Sheets.

        Args:
            filepath: Output CSV path

        Returns:
            int: Number of rows written
        """
        import csv

        if not self._runs:
            return 0

        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        fieldnames = [
            'timestamp', 'mode',
            'growth_stage', 'symptoms', 'farmer_confidence',
            'has_ml', 'weather', 'water_condition',
            'status', 'condition_key', 'score', 'confidence_level',
            'iron_toxicity', 'n_deficiency', 'salt_toxicity',
            'bacterial_blight', 'brown_spot', 'blast',
            'warning_count',
        ]

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for run in self._runs:
                inp = run.get('input', {})
                res = run.get('result', {})
                scores = run.get('all_scores', {})

                writer.writerow({
                    'timestamp':        run.get('timestamp'),
                    'mode':             run.get('mode'),
                    'growth_stage':     inp.get('growth_stage'),
                    'symptoms':         '|'.join(inp.get('symptoms', [])),
                    'farmer_confidence': inp.get('farmer_confidence'),
                    'has_ml':           inp.get('has_ml'),
                    'weather':          inp.get('weather'),
                    'water_condition':  inp.get('water_condition'),
                    'status':           res.get('status'),
                    'condition_key':    res.get('condition_key'),
                    'score':            res.get('score'),
                    'confidence_level': res.get('confidence_level'),
                    'iron_toxicity':    scores.get('iron_toxicity', 0),
                    'n_deficiency':     scores.get('n_deficiency', 0),
                    'salt_toxicity':    scores.get('salt_toxicity', 0),
                    'bacterial_blight': scores.get('bacterial_blight', 0),
                    'brown_spot':       scores.get('brown_spot', 0),
                    'blast':            scores.get('blast', 0),
                    'warning_count':    len(run.get('warnings', [])),
                })

        return len(self._runs)

    def clear(self):
        """Clears in-memory log entries. Does NOT delete the log file."""
        self._runs.clear()


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================
# Use this throughout the project:
#   from dss.logger import dss_logger
#   dss_logger.log_run(answers, output, mode='questionnaire')

dss_logger = DSSLogger()
