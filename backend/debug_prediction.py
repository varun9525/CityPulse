import sys
import os
import pandas as pd
from datetime import datetime

# Setup path
sys.path.append(os.getcwd())

try:
    from backend.prediction_model import risk_predictor
    print("Successfully imported risk_predictor")

    # Test Training
    print("Attempting to train model...")
    risk_predictor.train([]) # Train with no real issues first
    print("Training successful")

    # Test Forecast
    print("Attempting forecast...")
    forecast = risk_predictor.forecast_trends()
    print(f"Forecast generated: {len(forecast)} items")

    # Test Risk Zones
    print("Attempting risk zone prediction...")
    zones = risk_predictor.predict_risk_zones()
    print(f"Risk zones generated: {len(zones)} items")

except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
