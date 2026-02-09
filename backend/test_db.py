import sys
import os

# Add the parent directory to sys.path to allow importing backend.*
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models

def test_db():
    print("Testing DB connection...")
    db = SessionLocal()
    try:
        issues = db.query(models.Issue).all()
        print(f"Successfully fetched {len(issues)} issues.")
        for i, issue in enumerate(issues[:3]):
            print(f"Issue {i}: {issue.type}, {issue.lat}, {issue.lng}, Created: {type(issue.created_at)} {issue.created_at}")
    except Exception as e:
        print(f"DB Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
