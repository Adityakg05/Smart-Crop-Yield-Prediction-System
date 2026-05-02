"""
prediction_utils.py — Helper functions for model lifecycle and API response logic.

Contains the 'boilerplate' logic for saving models, validating ranges, 
and logging results so the core logic stays focused on the problem domain.
"""

import os
import json
import pickle
from typing import Any, Dict, List

def save_model_artifact(model: Any, filepath: str) -> None:
    """
    Persists a trained model object to disk. 
    Using pickle is standard for scikit-learn as it preserves the full pipeline state.
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        pickle.dump(model, f)
    print(f"Artifact saved → {filepath}")

def load_model_artifact(filepath: str) -> Any:
    """Loads a previously saved model artifact."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"No model found at {filepath}")
    with open(filepath, 'rb') as f:
        return pickle.load(f)

def is_within_agricultural_bounds(inputs: Dict[str, float], ranges: Dict[str, tuple]) -> bool:
    """
    Double-checks that inputs are within sensible agronomic ranges.
    While Pydantic handles type safety, this handles agricultural logic 
    (e.g., checking if rainfall is physically possible).
    """
    for field, (low, high) in ranges.items():
        if field in inputs:
            val = inputs[field]
            if not (low <= val <= high):
                return False
    return True

def log_prediction(inputs: Dict[str, Any], result: float, log_path: str = "prediction_log.jsonl") -> None:
    """
    Maintains a lightweight audit trail of predictions for future model retraining.
    """
    log_entry = {
        "inputs": inputs,
        "prediction": result,
        "timestamp": os.getenv("CURRENT_TIME", "unknown")
    }
    with open(log_path, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
