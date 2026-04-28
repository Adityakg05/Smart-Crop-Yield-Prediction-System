"""
Data preprocessing module for the Crop Yield Prediction System.
Handles data cleaning, feature engineering, and validation.
"""

import pandas as pd
import numpy as np
from typing import Tuple


def handle_missing_values(df: pd.DataFrame, strategy: str = 'mean') -> pd.DataFrame:
    """
    Handle missing values in the dataset.
    
    Args:
        df: Input DataFrame
        strategy: 'mean', 'median', 'forward_fill', or 'drop'
    
    Returns:
        DataFrame with missing values handled
    """
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
    """
    Remove duplicate rows from the dataset.
    
    Args:
        df: Input DataFrame
        subset: List of column names to consider for duplicates
    
    Returns:
        DataFrame with duplicates removed
    """
    initial_count = len(df)
    df = df.drop_duplicates(subset=subset)
    removed = initial_count - len(df)
    
    if removed > 0:
        print(f"Removed {removed} duplicate rows")
    
    return df


def remove_outliers(df: pd.DataFrame, columns: list, method: str = 'iqr', 
                   threshold: float = 1.5) -> pd.DataFrame:
    """
    Remove outliers from numerical columns.
    
    Args:
        df: Input DataFrame
        columns: List of numerical column names
        method: 'iqr' (Interquartile Range) or 'zscore'
        threshold: IQR multiplier (1.5) or z-score threshold (3)
    
    Returns:
        DataFrame with outliers removed
    """
    df = df.copy()
    
    for col in columns:
        if col not in df.columns:
            continue
            
        if method == 'iqr':
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
            
        elif method == 'zscore':
            z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
            df = df[z_scores < threshold]
    
    return df


def normalize_features(df: pd.DataFrame, columns: list) -> Tuple[pd.DataFrame, dict]:
    """
    Normalize numerical features to 0-1 range.
    
    Args:
        df: Input DataFrame
        columns: List of numerical column names to normalize
    
    Returns:
        Normalized DataFrame and normalization parameters
    """
    df = df.copy()
    norm_params = {}
    
    for col in columns:
        if col not in df.columns:
            continue
        
        min_val = df[col].min()
        max_val = df[col].max()
        norm_params[col] = {'min': min_val, 'max': max_val}
        
        if max_val - min_val != 0:
            df[col] = (df[col] - min_val) / (max_val - min_val)
    
    return df, norm_params


def validate_data_types(df: pd.DataFrame, expected_types: dict) -> bool:
    """
    Validate that DataFrame columns have expected data types.
    
    Args:
        df: Input DataFrame
        expected_types: Dict mapping column names to expected types
    
    Returns:
        True if all types match, False otherwise
    """
    for col, expected_type in expected_types.items():
        if col not in df.columns:
            print(f"Missing column: {col}")
            return False
        
        if not df[col].dtype == expected_type:
            print(f"Type mismatch for {col}: expected {expected_type}, got {df[col].dtype}")
            return False
    
    return True


def create_interaction_features(df: pd.DataFrame, feature_pairs: list) -> pd.DataFrame:
    """
    Create interaction features from pairs of existing features.
    
    Args:
        df: Input DataFrame
        feature_pairs: List of tuples (col1, col2) for interaction
    
    Returns:
        DataFrame with new interaction features
    """
    df = df.copy()
    
    for col1, col2 in feature_pairs:
        if col1 in df.columns and col2 in df.columns:
            interaction_name = f"{col1}_x_{col2}"
            df[interaction_name] = df[col1] * df[col2]
    
    return df


def get_feature_statistics(df: pd.DataFrame, columns: list) -> dict:
    """
    Generate descriptive statistics for features.
    
    Args:
        df: Input DataFrame
        columns: List of column names
    
    Returns:
        Dictionary of statistics
    """
    stats = {}
    
    for col in columns:
        if col in df.columns:
            stats[col] = {
                'mean': df[col].mean(),
                'std': df[col].std(),
                'min': df[col].min(),
                'max': df[col].max(),
                'median': df[col].median(),
                'missing': df[col].isnull().sum()
            }
    
    return stats
