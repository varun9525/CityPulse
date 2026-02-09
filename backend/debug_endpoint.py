import sys
import os
import asyncio
from unittest.mock import MagicMock

# Setup path
sys.path.append(os.getcwd())

# Mock FastAPI Depends
def mock_depends():
    return MagicMock()

try:
    from backend import main
    from backend import models
    from backend.prediction_model import risk_predictor
    
    # Mock Session
    mock_db = MagicMock()
    # Mock query result
    mock_issue = MagicMock()
    mock_issue.lat = 19.0760
    mock_issue.lng = 72.8777
    mock_issue.created_at = None # Test None handling
    mock_issue.priority = "High"
    
    mock_db.query.return_value.all.return_value = [mock_issue]
    
    print("running get_predictions with mock DB...")
    
    # Run async function
    async def run_test():
        try:
            result = await main.get_predictions(db=mock_db)
            print("Success!")
            print(result)
        except Exception as e:
            print("Caught exception in run_test:")
            import traceback
            traceback.print_exc()

    asyncio.run(run_test())

except Exception as e:
    print(f"Import/Setup Error: {e}")
    import traceback
    traceback.print_exc()
