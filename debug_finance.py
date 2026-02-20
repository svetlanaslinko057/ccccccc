#!/usr/bin/env python3
import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')

# Login and get token
base_url = os.environ.get('REACT_APP_BACKEND_URL')
login_response = requests.post(f"{base_url}/api/auth/login", json={
    "email": "admin@bazaar.com",
    "password": "admin123"
})

if login_response.status_code == 200:
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test finance summary
    today = datetime.now()
    date_to = today.strftime("%Y-%m-%d")
    date_from = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    
    response = requests.get(
        f"{base_url}/api/v2/admin/finance/summary",
        headers=headers,
        params={"from": date_from, "to": date_to}
    )
    
    print("Finance Summary Response:")
    print(f"Status: {response.status_code}")
    print(f"Data: {response.json()}")
else:
    print(f"Login failed: {login_response.status_code}")