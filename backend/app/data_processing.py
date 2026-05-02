"""
data_processing.py — Utilities for cleaning and summarizing agricultural data.

These functions help bridge the gap between raw CSV data and the model-ready 
DataFrames. Keeping them here avoids cluttering the main model.py pipeline.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

def summarize_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Returns a quick health check of the dataset.
    Helps identify missing data or unexpected types before training starts.
    """
    return {
        "rows":          len(df),
        "columns":       len(df.columns),
        "column_names":  list(df.columns),
        "missing_count": df.isnull().sum().to_dict(),
        "dtypes":        df.dtypes.astype(str).to_dict(),
    }

def calculate_yield_stats(df: pd.DataFrame, crop_col: str, yield_col: str) -> Dict[str, float]:
    """
    Aggregates mean yields per crop. 
    Used to generate the 'Crop Influence Factors' that normalize our predictions.
    """
    return df.groupby(crop_col)[yield_col].mean().to_dict()

def remove_statistical_outliers(df: pd.DataFrame, column: str, threshold: float = 3.0) -> pd.DataFrame:
    """
    Strips rows where a specific column value is more than N standard deviations away.
    Agricultural data often has entry errors (e.g., extra zeros) that can skew models.
    """
    if column not in df.columns:
        return df
    
    mean = df[column].mean()
    std  = df[column].std()
    
    return df[((df[column] - mean).abs() <= threshold * std)]
