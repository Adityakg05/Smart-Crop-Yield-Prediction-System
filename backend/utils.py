"""
Utility functions for the Crop Yield Prediction System.
"""

import json
import os
from typing import Any, Dict, List
import pickle


def save_model(model: Any, filepath: str) -> None:
    """
    Save a trained model to disk using pickle.
    
    Args:
        model: The trained model object
        filepath: Path to save the model
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        pickle.dump(model, f)
    print(f"Model saved to {filepath}")


def load_model(filepath: str) -> Any:
    """
    Load a saved model from disk.
    
    Args:
        filepath: Path to the saved model
    
    Returns:
        The loaded model
    """
    with open(filepath, 'rb') as f:
        model = pickle.load(f)
    print(f"Model loaded from {filepath}")
    return model


def save_metrics(metrics: Dict[str, float], filepath: str) -> None:
    """
    Save model metrics to a JSON file.
    
    Args:
        metrics: Dictionary of metrics
        filepath: Path to save the metrics
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"Metrics saved to {filepath}")


def load_metrics(filepath: str) -> Dict[str, float]:
    """
    Load model metrics from a JSON file.
    
    Args:
        filepath: Path to the metrics file
    
    Returns:
        Dictionary of metrics
    """
    with open(filepath, 'r') as f:
        metrics = json.load(f)
    print(f"Metrics loaded from {filepath}")
    return metrics


def validate_input_data(data: Dict[str, Any], required_fields: List[str]) -> bool:
    """
    Validate that all required fields are present in input data.
    
    Args:
        data: Input data dictionary
        required_fields: List of required field names
    
    Returns:
        True if all fields present, False otherwise
    """
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        print(f"Missing required fields: {missing_fields}")
        return False
    
    return True


def validate_value_ranges(data: Dict[str, float], ranges: Dict[str, tuple]) -> bool:
    """
    Validate that numerical values fall within expected ranges.
    
    Args:
        data: Input data dictionary
        ranges: Dict mapping field names to (min, max) tuples
    
    Returns:
        True if all values within ranges, False otherwise
    """
    for field, (min_val, max_val) in ranges.items():
        if field not in data:
            continue
        
        value = data[field]
        if not (min_val <= value <= max_val):
            print(f"Field '{field}' value {value} outside range [{min_val}, {max_val}]")
            return False
    
    return True


def format_prediction_output(prediction: float, decimals: int = 2) -> float:
    """
    Format prediction output to specified decimal places.
    
    Args:
        prediction: Raw prediction value
        decimals: Number of decimal places
    
    Returns:
        Formatted prediction
    """
    return round(prediction, decimals)


def log_prediction(input_data: Dict[str, Any], prediction: float, filepath: str = None) -> None:
    """
    Log a prediction request and result.
    
    Args:
        input_data: Input data dictionary
        prediction: Prediction result
        filepath: Optional file path to log to
    """
    log_entry = {
        'input': input_data,
        'prediction': prediction
    }
    
    if filepath:
        with open(filepath, 'a') as f:
            json.dump(log_entry, f)
            f.write('\n')
    else:
        print(f"Prediction logged: {log_entry}")


def get_model_info(model: Any) -> Dict[str, Any]:
    """
    Extract information about a trained model.
    
    Args:
        model: The trained model object
    
    Returns:
        Dictionary containing model information
    """
    info = {
        'model_type': type(model).__name__,
        'is_fitted': hasattr(model, 'classes_') or hasattr(model, 'coef_')
    }
    
    # Add additional information if available
    if hasattr(model, 'n_estimators'):
        info['n_estimators'] = model.n_estimators
    
    if hasattr(model, 'feature_importances_'):
        info['has_feature_importances'] = True
    
    return info


def create_data_summary(df: Any) -> Dict[str, Any]:
    """
    Create a summary of dataset statistics.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Dictionary containing data summary
    """
    summary = {
        'total_rows': len(df),
        'total_columns': len(df.columns),
        'column_names': list(df.columns),
        'missing_values': df.isnull().sum().to_dict(),
        'data_types': df.dtypes.astype(str).to_dict()
    }
    
    return summary
