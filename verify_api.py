import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def get_admin_token():
    email = "admin@test.gov"
    password = "password123"
    
    # 1. Signup
    print("1. Signing up...")
    try:
        resp = requests.post(f"{BASE_URL}/signup", json={
            "email": email,
            "password": password,
            "role": "admin"
        })
        print(f"Signup status: {resp.status_code}")
    except Exception as e:
        print(f"Signup failed (might already exist): {e}")

    # 2. Login
    print("\n2. Logging in...")
    resp = requests.post(f"{BASE_URL}/token", json={
        "email": email,
        "password": password
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        exit(1)
    
    token = resp.json()["access_token"]
    print("Login success")
    return token

def verify_workflow():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Issue
    print("\n3. Creating Issue...")
    with open("dummy.jpg", "wb") as f:
        f.write(b"fake image content")
        
    files = {"image": ("dummy.jpg", open("dummy.jpg", "rb"), "image/jpeg")}
    data = {"type": "Pothole", "location": "123 Test St"}
    
    resp = requests.post(f"{BASE_URL}/reports", data=data, files=files)
    if resp.status_code != 200:
        print(f"Create user failed: {resp.text}")
        exit(1)
    
    issue = resp.json()
    issue_id = issue["id"]
    print(f"Created Issue ID: {issue_id}")
    
    # 4. Resolve Issue
    print("\n4. Resolving Issue...")
    files_resolve = {"file": ("resolved.jpg", open("dummy.jpg", "rb"), "image/jpeg")}
    resp = requests.post(f"{BASE_URL}/reports/{issue_id}/resolve", files=files_resolve)
    
    if resp.status_code != 200:
        print(f"Resolve failed: {resp.text}")
        exit(1)
    print("Resolve success")
    
    # 5. Approve Issue
    print("\n5. Approving Issue...")
    resp = requests.post(f"{BASE_URL}/reports/{issue_id}/approve", headers=headers)
    if resp.status_code != 200:
        print(f"Approve failed: {resp.text}")
        exit(1)
    
    # 6. Verify Status
    print("\n6. Verifying Final Status...")
    resp = requests.get(f"{BASE_URL}/reports/{issue_id}")
    final_issue = resp.json()
    if final_issue["status"] == "APPROVED":
        print("✅ SUCCESS: Issue is APPROVED")
    else:
        print(f"❌ FAILED: Status is {final_issue['status']}")

    if os.path.exists("dummy.jpg"):
        os.remove("dummy.jpg")

if __name__ == "__main__":
    verify_workflow()
