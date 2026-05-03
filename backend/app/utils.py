"""Utility functions for data processing and model management."""

import os
import json
import pickle
import pandas as pd
import numpy as np
from typing import Any, Dict, List, Tuple


def handle_missing_values(df: pd.DataFrame, strategy: str = 'mean') -> pd.DataFrame:
    """Handle missing values in dataset."""
    df = df.copy()
    
    if strategy == 'drop':
        return df.dropna()
    elif strategy == 'mean':
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
    elif strategy == 'median':
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    elif strategy == 'forward_fill':
        df = df.fillna(method='ffill').fillna(method='bfill')
    
    return df


def remove_duplicates(df: pd.DataFrame, subset: list = None) -> pd.DataFrame:
    """Remove duplicate rows from dataset."""
    initial_count = len(df)
    df = df.drop_duplicates(subset=subset)
    removed = initial_count - len(df)
    
    if removed > 0:
        print(f"Removed {removed} duplicate rows")
    
    return df


def summarize_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """Get dataset summary statistics."""
    return {
        "rows":          len(df),
        "columns":       len(df.columns),
        "column_names":  list(df.columns),
        "missing_count": df.isnull().sum().to_dict(),
        "dtypes":        df.dtypes.astype(str).to_dict(),
    }


def calculate_yield_stats(df: pd.DataFrame, crop_col: str, yield_col: str) -> Dict[str, float]:
    """Calculate mean yields per crop."""
    return df.groupby(crop_col)[yield_col].mean().to_dict()


def remove_statistical_outliers(df: pd.DataFrame, column: str, threshold: float = 3.0) -> pd.DataFrame:
    """Remove statistical outliers from dataset."""
    if column not in df.columns:
        return df
    
    mean = df[column].mean()
    std  = df[column].std()
    
    return df[((df[column] - mean).abs() <= threshold * std)]


def save_model_artifact(model: Any, filepath: str) -> None:
    """Save trained model to disk."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        pickle.dump(model, f)
    print(f"Artifact saved → {filepath}")


def load_model_artifact(filepath: str) -> Any:
    """Load model from disk."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"No model found at {filepath}")
    with open(filepath, 'rb') as f:
        return pickle.load(f)


def is_within_agricultural_bounds(inputs: Dict[str, float], ranges: Dict[str, tuple]) -> bool:
    """Validate inputs are within agricultural ranges."""
    for field, (low, high) in ranges.items():
        if field in inputs:
            val = inputs[field]
            if not (low <= val <= high):
                return False
    return True


def log_prediction(inputs: Dict[str, Any], result: float, log_path: str = "prediction_log.jsonl") -> None:
    """Log prediction for audit trail."""
    log_entry = {
        "inputs": inputs,
        "prediction": result,
        "timestamp": os.getenv("CURRENT_TIME", "unknown")
    }
    with open(log_path, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
