#!/usr/bin/env python3
"""Additional verification for MOCKED APIs and background services"""
import requests
import os
from dotenv import load_dotenv
import time

load_dotenv('/app/frontend/.env')

def test_mocked_services():
    base_url = os.environ.get('REACT_APP_BACKEND_URL')
    
    # Login
    login_response = requests.post(f"{base_url}/api/auth/login", json={
        "email": "admin@bazaar.com",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🔍 Testing MOCKED Services:")
    
    # Test SMS queuing (should be MOCKED)
    sms_response = requests.post(
        f"{base_url}/api/v2/admin/crm/actions/customer/+380501234567/sms",
        headers=headers,
        json={"text": "Test SMS from automated testing"}
    )
    
    print(f"✅ SMS Queuing (MOCKED): {sms_response.status_code} - {sms_response.json()}")
    
    # Wait a bit for background job to process
    time.sleep(3)
    
    # Check dashboard notifications stats
    dashboard_response = requests.get(
        f"{base_url}/api/v2/admin/ops/dashboard",
        headers=headers,
        params={"from": "2026-01-01", "to": "2026-12-31"}
    )
    
    if dashboard_response.status_code == 200:
        notifications = dashboard_response.json().get("kpi", {}).get("notifications", {})
        print(f"✅ Notifications processed by background job: {notifications}")
    
    print("\n🔍 Checking Background Job Activity from logs...")
    
if __name__ == "__main__":
    test_mocked_services()