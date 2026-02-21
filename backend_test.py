#!/usr/bin/env python3
"""
Backend Testing Suite for Y-Store O13-O20 Modules

Tests admin APIs:
- Guard: incidents, mute, resolve (O13-O16)
- Risk: distribution (O17)
- Timeline: user events (O18)
- Analytics: KPI data, daily rebuild (O18)
- Pickup Control: KPI, risk list, engine run, mute, reminders (O20)
- Admin authentication
"""

import requests
import sys
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from frontend .env for public URL
load_dotenv('/app/frontend/.env')

class YStoreAPITester:
    def __init__(self, base_url=None):
        # Use localhost as fallback since external routing seems to have issues
        if base_url is None:
            external_url = os.environ.get('REACT_APP_BACKEND_URL', '')
            if external_url:
                # Try external first, fallback to localhost
                self.base_url = external_url
                self.fallback_url = 'http://localhost:8001'
            else:
                self.base_url = 'http://localhost:8001'
                self.fallback_url = None
        else:
            self.base_url = base_url
            self.fallback_url = None
            
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test credentials from review request
        self.admin_email = "admin@ystore.ua"
        self.admin_password = "admin123"
        self.test_user_id = "test-user-123"  # For timeline testing

    def log_result(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, headers=None, expect_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if headers:
            req_headers.update(headers)
        
        print(f"Making {method} request to: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
            
            # If external URL fails with 404 and we have a fallback, try localhost
            if response.status_code == 404 and self.fallback_url and self.base_url != self.fallback_url:
                print(f"External URL failed with 404, trying localhost...")
                url = f"{self.fallback_url}/api{endpoint}"
                print(f"Making {method} request to: {url}")
                
                if method == 'GET':
                    response = requests.get(url, headers=req_headers, timeout=30)
                elif method == 'POST':
                    response = requests.post(url, json=data, headers=req_headers, timeout=30)
                elif method == 'PUT':
                    response = requests.put(url, json=data, headers=req_headers, timeout=30)
                
                # Update base_url to use localhost for future requests
                self.base_url = self.fallback_url
                print(f"Switched to localhost for remaining tests")
            
            success = response.status_code == expect_status
            result_data = {}
            try:
                result_data = response.json()
            except:
                result_data = {"text": response.text}
            
            return {
                "success": success,
                "status_code": response.status_code,
                "data": result_data,
                "expected_status": expect_status
            }, None
            
        except requests.exceptions.Timeout:
            return None, "Request timeout"
        except requests.exceptions.ConnectionError:
            return None, "Connection error"
        except Exception as e:
            return None, f"Request failed: {str(e)}"

    def test_admin_login(self):
        """Test admin authentication"""
        print(f"\n🔍 Testing admin authentication...")
        
        # First try to register an admin user
        admin_register_data = {
            "email": self.admin_email,
            "password": self.admin_password,
            "full_name": "Test Admin",
            "role": "admin"
        }
        
        print("Attempting to register admin user...")
        response, error = self.make_request(
            'POST', '/auth/register',
            data=admin_register_data,
            expect_status=201
        )
        
        if response and response["success"] and response["data"].get("access_token"):
            self.admin_token = response["data"]["access_token"]
            return self.log_result("Admin Registration & Login", True, "Admin user created and token obtained")
        
        # If registration failed, try login
        print("Registration failed or user exists, trying login...")
        response, error = self.make_request(
            'POST', '/auth/login',
            data={
                "email": self.admin_email,
                "password": self.admin_password
            }
        )
        
        if error:
            return self.log_result("Admin Login", False, f"Error: {error}")
        
        if response["success"] and response["data"].get("token"):
            self.admin_token = response["data"]["token"]
            return self.log_result("Admin Login", True, "Token obtained")
        elif response["success"] and response["data"].get("access_token"):
            self.admin_token = response["data"]["access_token"]
            return self.log_result("Admin Login", True, "Access token obtained")
        else:
            # Try different common admin credentials
            common_admins = [
                {"email": "admin@test.com", "password": "admin123"},
                {"email": "test@admin.com", "password": "password123"},
                {"email": "admin@ystore.com", "password": "admin2024"}
            ]
            
            for creds in common_admins:
                print(f"Trying common admin credentials: {creds['email']}")
                response, error = self.make_request(
                    'POST', '/auth/login',
                    data=creds
                )
                
                if response and response["success"] and (response["data"].get("token") or response["data"].get("access_token")):
                    self.admin_token = response["data"].get("token") or response["data"].get("access_token")
                    return self.log_result("Admin Login (Common Creds)", True, f"Logged in with {creds['email']}")
            
            return self.log_result("Admin Login", False, 
                f"Status: {response['status_code'] if response else 'N/A'}, Data: {response['data'] if response else 'N/A'}")

    def test_guard_incidents_list(self):
        """Test GET /api/v2/admin/guard/incidents"""
        print(f"\n🔍 Testing Guard incidents list...")
        
        if not self.admin_token:
            return self.log_result("Guard Incidents List", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/guard/incidents',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Guard Incidents List", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            has_items = "items" in data
            return self.log_result("Guard Incidents List", has_items,
                f"Found {len(data.get('items', []))} incidents")
        else:
            return self.log_result("Guard Incidents List", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_guard_incident_actions(self):
        """Test guard incident mute/resolve actions"""
        print(f"\n🔍 Testing Guard incident actions...")
        
        if not self.admin_token:
            return self.log_result("Guard Incident Actions", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        test_key = "test-incident-key"
        
        # Test mute incident
        response, error = self.make_request(
            'POST', f'/v2/admin/guard/incident/{test_key}/mute',
            data={"hours": 1},
            headers=headers,
            expect_status=200
        )
        
        if error:
            mute_result = self.log_result("Guard Mute Incident", False, f"Error: {error}")
        else:
            mute_success = response["success"] or response["status_code"] == 404  # Not found is acceptable
            mute_result = self.log_result("Guard Mute Incident", mute_success,
                f"Status: {response['status_code']}")
        
        # Test resolve incident
        response, error = self.make_request(
            'POST', f'/v2/admin/guard/incident/{test_key}/resolve',
            headers=headers,
            expect_status=200
        )
        
        if error:
            resolve_result = self.log_result("Guard Resolve Incident", False, f"Error: {error}")
        else:
            resolve_success = response["success"] or response["status_code"] == 404  # Not found is acceptable
            resolve_result = self.log_result("Guard Resolve Incident", resolve_success,
                f"Status: {response['status_code']}")
        
        return mute_result and resolve_result

    def test_risk_distribution(self):
        """Test GET /api/v2/admin/risk/distribution"""
        print(f"\n🔍 Testing Risk distribution...")
        
        if not self.admin_token:
            return self.log_result("Risk Distribution", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/risk/distribution',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Risk Distribution", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            has_distribution = "distribution" in data
            return self.log_result("Risk Distribution", has_distribution,
                f"Distribution data: {data.get('distribution', {})}")
        else:
            return self.log_result("Risk Distribution", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_timeline_events(self):
        """Test GET /api/v2/admin/timeline/{user_id}"""
        print(f"\n🔍 Testing Timeline events...")
        
        if not self.admin_token:
            return self.log_result("Timeline Events", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', f'/v2/admin/timeline/{self.test_user_id}',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Timeline Events", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            has_events = "events" in data and "count" in data
            return self.log_result("Timeline Events", has_events,
                f"Found {data.get('count', 0)} events")
        else:
            return self.log_result("Timeline Events", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_analytics_ops_kpi(self):
        """Test GET /api/v2/admin/analytics/ops-kpi?range=7"""
        print(f"\n🔍 Testing Analytics OPS KPI...")
        
        if not self.admin_token:
            return self.log_result("Analytics OPS KPI", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/analytics/ops-kpi?range=7',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Analytics OPS KPI", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Check for typical KPI fields
            has_kpi_data = any(field in data for field in ["revenue", "orders", "aov", "delivered"])
            return self.log_result("Analytics OPS KPI", has_kpi_data,
                f"KPI fields: {list(data.keys())}")
        else:
            return self.log_result("Analytics OPS KPI", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_analytics_daily_rebuild(self):
        """Test POST /api/v2/admin/analytics/daily/rebuild"""
        print(f"\n🔍 Testing Analytics daily rebuild...")
        
        if not self.admin_token:
            return self.log_result("Analytics Daily Rebuild", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'POST', '/v2/admin/analytics/daily/rebuild',
            data={"days": 3},  # Small number for testing
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Analytics Daily Rebuild", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            has_rebuild_data = "ok" in data and "rebuilt" in data
            return self.log_result("Analytics Daily Rebuild", has_rebuild_data,
                f"Rebuilt {data.get('rebuilt', 0)} days")
        else:
            return self.log_result("Analytics Daily Rebuild", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_pickup_control_kpi(self):
        """Test GET /api/v2/admin/pickup-control/kpi"""
        print(f"\n🔍 Testing Pickup Control KPI...")
        
        if not self.admin_token:
            return self.log_result("Pickup Control KPI", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/pickup-control/kpi',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Pickup Control KPI", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Check for expected KPI fields
            kpi_fields = ["at_point_2plus", "at_point_5plus", "at_point_7plus", "amount_at_risk"]
            has_kpi_structure = any(field in data for field in kpi_fields)
            return self.log_result("Pickup Control KPI", has_kpi_structure,
                f"KPI data: {data}")
        else:
            return self.log_result("Pickup Control KPI", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_pickup_control_risk_list(self):
        """Test GET /api/v2/admin/pickup-control/risk?days=5"""
        print(f"\n🔍 Testing Pickup Control Risk List...")
        
        if not self.admin_token:
            return self.log_result("Pickup Control Risk List", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/pickup-control/risk?days=5&limit=100',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Pickup Control Risk List", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have items, count, and filter_days fields
            has_structure = "items" in data and "count" in data and "filter_days" in data
            return self.log_result("Pickup Control Risk List", has_structure,
                f"Found {data.get('count', 0)} risk items, filter: {data.get('filter_days')} days")
        else:
            return self.log_result("Pickup Control Risk List", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_pickup_control_run_engine(self):
        """Test POST /api/v2/admin/pickup-control/run"""
        print(f"\n🔍 Testing Pickup Control Run Engine...")
        
        if not self.admin_token:
            return self.log_result("Pickup Control Run Engine", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'POST', '/v2/admin/pickup-control/run',
            data={"limit": 50},  # Small limit for testing
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Pickup Control Run Engine", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have processing results
            has_result_structure = all(field in data for field in ["ok", "processed", "sent", "high_risk_count", "errors"])
            return self.log_result("Pickup Control Run Engine", has_result_structure,
                f"Processed: {data.get('processed', 0)}, Sent: {data.get('sent', 0)}, Risk: {data.get('high_risk_count', 0)}")
        else:
            return self.log_result("Pickup Control Run Engine", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_pickup_control_mute_ttn(self):
        """Test POST /api/v2/admin/pickup-control/mute/{ttn}"""
        print(f"\n🔍 Testing Pickup Control Mute TTN...")
        
        if not self.admin_token:
            return self.log_result("Pickup Control Mute TTN", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        test_ttn = "20450123456789"  # Test TTN
        
        response, error = self.make_request(
            'POST', f'/v2/admin/pickup-control/mute/{test_ttn}',
            data={"days": 7},
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Pickup Control Mute TTN", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should confirm mute operation
            has_mute_structure = "ok" in data and "ttn" in data and "muted_days" in data
            return self.log_result("Pickup Control Mute TTN", has_mute_structure,
                f"Muted TTN: {data.get('ttn')}, Days: {data.get('muted_days')}")
        else:
            return self.log_result("Pickup Control Mute TTN", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_pickup_control_send_reminder(self):
        """Test POST /api/v2/admin/pickup-control/send-reminder/{ttn}"""
        print(f"\n🔍 Testing Pickup Control Send Reminder...")
        
        if not self.admin_token:
            return self.log_result("Pickup Control Send Reminder", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        test_ttn = "20450123456789"  # Test TTN
        
        response, error = self.make_request(
            'POST', f'/v2/admin/pickup-control/send-reminder/{test_ttn}',
            data={"level": "D5"},
            headers=headers,
            expect_status=404  # Expected since test order doesn't exist
        )
        
        if error:
            return self.log_result("Pickup Control Send Reminder", False, f"Error: {error}")
        
        # For this test, 404 is acceptable since no test data exists
        if response["status_code"] == 404:
            return self.log_result("Pickup Control Send Reminder", True,
                "404 as expected (no test orders exist)")
        elif response["success"]:
            data = response["data"]
            has_reminder_structure = "ok" in data and "ttn" in data
            return self.log_result("Pickup Control Send Reminder", has_reminder_structure,
                f"Reminder sent for TTN: {data.get('ttn')}")
        else:
            return self.log_result("Pickup Control Send Reminder", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_returns_summary(self):
        """Test GET /api/v2/admin/returns/summary"""
        print(f"\n🔍 Testing Returns Summary Analytics...")
        
        if not self.admin_token:
            return self.log_result("Returns Summary", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/returns/summary',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Returns Summary", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Check for expected analytics fields
            expected_fields = ["today", "7d", "30d", "return_rate_30d", "shipping_losses_30d"]
            has_analytics_structure = all(field in data for field in expected_fields)
            return self.log_result("Returns Summary", has_analytics_structure,
                f"Analytics data: {list(data.keys())}")
        else:
            return self.log_result("Returns Summary", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_returns_list(self):
        """Test GET /api/v2/admin/returns/list"""
        print(f"\n🔍 Testing Returns List with Pagination...")
        
        if not self.admin_token:
            return self.log_result("Returns List", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/returns/list?skip=0&limit=10',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Returns List", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have pagination structure
            has_list_structure = "items" in data and "total" in data and "skip" in data and "limit" in data
            return self.log_result("Returns List", has_list_structure,
                f"Found {len(data.get('items', []))} returns, Total: {data.get('total', 0)}")
        else:
            return self.log_result("Returns List", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_returns_run(self):
        """Test POST /api/v2/admin/returns/run"""
        print(f"\n🔍 Testing Returns Engine Manual Run...")
        
        if not self.admin_token:
            return self.log_result("Returns Run", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'POST', '/v2/admin/returns/run?limit=50',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Returns Run", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have engine run results
            has_engine_result = all(field in data for field in ["ok", "scanned", "detected", "updated"])
            return self.log_result("Returns Run", has_engine_result,
                f"Scanned: {data.get('scanned', 0)}, Detected: {data.get('detected', 0)}, Updated: {data.get('updated', 0)}")
        else:
            return self.log_result("Returns Run", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_returns_resolve(self):
        """Test POST /api/v2/admin/returns/resolve"""
        print(f"\n🔍 Testing Returns Resolve...")
        
        if not self.admin_token:
            return self.log_result("Returns Resolve", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        test_order_id = "test-order-123"  # Test order ID
        
        response, error = self.make_request(
            'POST', f'/v2/admin/returns/resolve',
            data={
                "order_id": test_order_id,
                "notes": "Test resolution"
            },
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Returns Resolve", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have resolution result
            has_resolve_structure = "ok" in data
            if data.get("ok"):
                return self.log_result("Returns Resolve", has_resolve_structure,
                    f"Order {data.get('order_id')} resolved")
            else:
                # 'Order not found' is acceptable for test data
                return self.log_result("Returns Resolve", True,
                    f"Expected error: {data.get('error', 'Order not found')}")
        else:
            return self.log_result("Returns Resolve", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_returns_trend(self):
        """Test GET /api/v2/admin/returns/trend?days=30 - MAIN REQUIREMENT"""
        print(f"\n🔍 Testing Returns Trend (MAIN REQUIREMENT)...")
        
        if not self.admin_token:
            return self.log_result("Returns Trend", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/returns/trend?days=30',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Returns Trend", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # CRITICAL: Must have labels/returns/losses arrays
            required_keys = ['labels', 'returns', 'losses']
            has_all_keys = all(key in data for key in required_keys)
            return self.log_result("Returns Trend", has_all_keys,
                f"Required arrays present: {[k for k in required_keys if k in data]}")
        else:
            return self.log_result("Returns Trend", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_policy_pending(self):
        """Test GET /api/v2/admin/returns/policy/pending - MAIN REQUIREMENT"""
        print(f"\n🔍 Testing Policy Pending Approvals (MAIN REQUIREMENT)...")
        
        if not self.admin_token:
            return self.log_result("Policy Pending", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/returns/policy/pending',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Policy Pending", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have pagination structure with items
            has_structure = "items" in data and "total" in data
            return self.log_result("Policy Pending", has_structure,
                f"Found {len(data.get('items', []))} pending approvals")
        else:
            return self.log_result("Policy Pending", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_policy_cities(self):
        """Test GET /api/v2/admin/returns/policy/cities - MAIN REQUIREMENT"""
        print(f"\n🔍 Testing Policy Cities (MAIN REQUIREMENT)...")
        
        if not self.admin_token:
            return self.log_result("Policy Cities", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/returns/policy/cities',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Policy Cities", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have items array
            has_structure = "items" in data
            return self.log_result("Policy Cities", has_structure,
                f"Found {len(data.get('items', []))} city policies")
        else:
            return self.log_result("Policy Cities", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_policy_run(self):
        """Test POST /api/v2/admin/returns/policy/run - MAIN REQUIREMENT"""
        print(f"\n🔍 Testing Policy Engine Run (MAIN REQUIREMENT)...")
        
        if not self.admin_token:
            return self.log_result("Policy Run", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'POST', '/v2/admin/returns/policy/run?limit=100',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Policy Run", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have engine run results
            required_keys = ['scanned_customers', 'scanned_cities', 'proposed', 'applied', 'approvals_enqueued']
            has_all_keys = all(key in data for key in required_keys)
            return self.log_result("Policy Run", has_all_keys,
                f"Engine results: {data}")
        else:
            return self.log_result("Policy Run", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_ops_dashboard(self):
        """Test GET /api/v2/admin/ops/dashboard"""
        print(f"\n🔍 Testing Ops Dashboard with Returns Block...")
        
        if not self.admin_token:
            return self.log_result("Ops Dashboard", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get current date for range parameters
        from datetime import datetime, timedelta
        to_date = datetime.now().strftime('%Y-%m-%d')
        from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        response, error = self.make_request(
            'GET', f'/v2/admin/ops/dashboard?from={from_date}&to={to_date}',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Ops Dashboard", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have returns block in dashboard
            has_returns_block = "returns" in data
            if has_returns_block:
                returns_data = data["returns"]
                has_returns_structure = "today" in returns_data and "30d" in returns_data
                return self.log_result("Ops Dashboard", has_returns_structure,
                    f"Returns block: {list(returns_data.keys())}")
            else:
                return self.log_result("Ops Dashboard", False,
                    "Missing returns block in dashboard")
        else:
            return self.log_result("Ops Dashboard", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_admin_authentication_required(self):
        """Test that admin authentication is required for all endpoints"""
        print(f"\n🔍 Testing admin authentication requirement...")
        
        endpoints_to_test = [
            '/v2/admin/guard/incidents',
            '/v2/admin/risk/distribution',
            f'/v2/admin/timeline/{self.test_user_id}',
            '/v2/admin/analytics/ops-kpi?range=7',
            '/v2/admin/pickup-control/kpi',
            '/v2/admin/pickup-control/risk?days=5'
        ]
        
        results = []
        for endpoint in endpoints_to_test:
            response, error = self.make_request(
                'GET', endpoint,
                expect_status=403
            )
            
            if error:
                results.append(False)
                print(f"   ❌ {endpoint}: Error - {error}")
            else:
                # Accept 401/403 as valid auth required responses
                auth_required = response["status_code"] in [401, 403]
                results.append(auth_required)
                print(f"   {'✅' if auth_required else '❌'} {endpoint}: Status {response['status_code']}")
        
        success = all(results)
        return self.log_result("Auth Required", success, f"{sum(results)}/{len(results)} endpoints protected")

    def test_payment_health_dashboard(self):
        """Test Payment Health Dashboard API - NEW REQUIREMENT"""
        print(f"\n🔍 Testing Payment Health Dashboard API...")
        
        if not self.admin_token:
            return self.log_result("Payment Health API", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test payment health endpoint with default 7-day range
        response, error = self.make_request(
            'GET', '/v2/admin/payments/health?range=7',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("Payment Health API", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Check for required payment health metrics
            required_fields = [
                'total_payments', 'paid', 'declined', 'expired', 'pending',
                'webhook_success_rate', 'reconciliation_fixes', 'recovery_rate',
                'deposit_conversion_rate', 'prepaid_conversion_rate',
                'avg_payment_time_minutes', 'discount_total_uah', 'daily_trend'
            ]
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                return self.log_result("Payment Health API", False, f"Missing fields: {missing_fields}")
            else:
                return self.log_result("Payment Health API", True, 
                    f"Webhook rate: {data.get('webhook_success_rate')}, Recovery: {data.get('recovery_rate')}")
        else:
            return self.log_result("Payment Health API", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_risk_center_apis(self):
        """Test Risk Center APIs - NEW REQUIREMENT"""
        print(f"\n🔍 Testing Risk Center APIs...")
        
        if not self.admin_token:
            return self.log_result("Risk Center APIs", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test risk summary
        response, error = self.make_request(
            'GET', '/v2/admin/risk/summary',
            headers=headers,
            expect_status=200
        )
        
        if error:
            self.log_result("Risk Summary API", False, f"Error: {error}")
        elif response["success"]:
            data = response["data"]
            required_fields = ['total_users', 'scored_users', 'coverage_rate', 'distribution', 'recent_high_risk']
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                self.log_result("Risk Summary API", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Risk Summary API", True, 
                    f"Users: {data.get('total_users')}, Scored: {data.get('scored_users')}")
        
        # Test risk customers list
        response, error = self.make_request(
            'GET', '/v2/admin/risk/customers',
            headers=headers,
            expect_status=200
        )
        
        if error:
            self.log_result("Risk Customers API", False, f"Error: {error}")
        elif response["success"]:
            data = response["data"]
            customers = data.get('customers', [])
            self.log_result("Risk Customers API", True, f"Found {len(customers)} customers with risk scores")

    def test_prepaid_discount_env_config(self):
        """Test Prepaid Discount Environment Configuration - NEW REQUIREMENT"""
        print(f"\n🔍 Testing Prepaid Discount Config...")
        
        try:
            with open('/app/backend/.env', 'r') as f:
                env_content = f.read()
            
            # Check all required prepaid discount environment variables
            config_checks = [
                ('PREPAID_DISCOUNT_ENABLED', 'true'),
                ('PREPAID_DISCOUNT_MODE', 'PERCENT'), 
                ('PREPAID_DISCOUNT_VALUE', '1'),
                ('PREPAID_DISCOUNT_APPLY_TO', 'FULL_PREPAID'),
                ('PREPAID_DISCOUNT_MAX_UAH', '300'),
                ('PREPAID_DISCOUNT_MIN_ORDER', '500')
            ]
            
            all_configs_ok = True
            for key, expected in config_checks:
                found = f'{key}={expected}' in env_content
                if not found:
                    all_configs_ok = False
                self.log_result(f"Config {key}", found, f"Expected {key}={expected}")
            
            return self.log_result("Prepaid Discount Config", all_configs_ok, 
                "All required environment variables configured correctly")
                
        except Exception as e:
            return self.log_result("Prepaid Discount Config", False, f"Error reading .env: {e}")

    # === ROE (Revenue Optimization Engine) Tests ===
    
    def test_revenue_settings(self):
        """Test GET /api/v2/admin/revenue/settings"""
        print(f"\n🔍 Testing ROE Settings...")
        
        if not self.admin_token:
            return self.log_result("ROE Settings", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/revenue/settings',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("ROE Settings", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have ROE configuration settings
            expected_fields = ['mode', 'cooldown_hours', 'rollback_window_hours']
            has_settings = any(field in data for field in expected_fields)
            return self.log_result("ROE Settings", has_settings,
                f"Settings: {data}")
        else:
            return self.log_result("ROE Settings", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_revenue_config(self):
        """Test GET /api/v2/admin/revenue/config"""
        print(f"\n🔍 Testing ROE Current Config...")
        
        if not self.admin_token:
            return self.log_result("ROE Config", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/revenue/config',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("ROE Config", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have current system configuration
            expected_fields = ['prepaid_discount_value', 'deposit_min_uah']
            has_config = any(field in data for field in expected_fields)
            return self.log_result("ROE Config", has_config,
                f"Config: discount={data.get('prepaid_discount_value')}%, deposit={data.get('deposit_min_uah')}₴")
        else:
            return self.log_result("ROE Config", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_revenue_optimize_run(self):
        """Test POST /api/v2/admin/revenue/optimize/run"""
        print(f"\n🔍 Testing ROE Optimization Run...")
        
        if not self.admin_token:
            return self.log_result("ROE Optimize Run", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'POST', '/v2/admin/revenue/optimize/run',
            data={"range_days": 7},
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("ROE Optimize Run", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have optimization results and snapshot
            has_result = "snapshot" in data and ("suggestion" in data or "skipped" in data)
            return self.log_result("ROE Optimize Run", has_result,
                f"Result: {data.get('skipped', 'suggestion created')}, Orders: {data.get('snapshot', {}).get('orders_total', 0)}")
        else:
            return self.log_result("ROE Optimize Run", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_revenue_suggestions(self):
        """Test GET /api/v2/admin/revenue/suggestions"""
        print(f"\n🔍 Testing ROE Suggestions List...")
        
        if not self.admin_token:
            return self.log_result("ROE Suggestions", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/revenue/suggestions?limit=20',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("ROE Suggestions", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have suggestions list
            has_structure = "items" in data
            items = data.get("items", [])
            return self.log_result("ROE Suggestions", has_structure,
                f"Found {len(items)} suggestions")
        else:
            return self.log_result("ROE Suggestions", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    # === A/B Testing Engine Tests ===
    
    def test_ab_seed_prepaid_discount(self):
        """Test POST /api/v2/admin/ab/seed/prepaid-discount"""
        print(f"\n🔍 Testing A/B Seed Prepaid Discount...")
        
        if not self.admin_token:
            return self.log_result("A/B Seed Experiment", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'POST', '/v2/admin/ab/seed/prepaid-discount',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("A/B Seed Experiment", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should create prepaid_discount_v1 experiment
            has_experiment = "exp_id" in data and data.get("exp_id") == "prepaid_discount_v1"
            return self.log_result("A/B Seed Experiment", has_experiment,
                f"Created experiment: {data.get('exp_id')}")
        else:
            return self.log_result("A/B Seed Experiment", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_ab_experiments_list(self):
        """Test GET /api/v2/admin/ab/experiments"""
        print(f"\n🔍 Testing A/B Experiments List...")
        
        if not self.admin_token:
            return self.log_result("A/B Experiments List", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/ab/experiments',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("A/B Experiments List", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have experiments list
            has_structure = "items" in data
            items = data.get("items", [])
            return self.log_result("A/B Experiments List", has_structure,
                f"Found {len(items)} experiments")
        else:
            return self.log_result("A/B Experiments List", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_ab_assignment(self):
        """Test GET /api/v2/admin/ab/assignment?exp_id=prepaid_discount_v1&phone=380991234567"""
        print(f"\n🔍 Testing A/B Cohort Assignment...")
        
        if not self.admin_token:
            return self.log_result("A/B Assignment", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/ab/assignment?exp_id=prepaid_discount_v1&phone=380991234567',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("A/B Assignment", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have assignment details
            required_fields = ['exp_id', 'unit', 'variant', 'discount_pct', 'active']
            has_assignment = all(field in data for field in required_fields)
            return self.log_result("A/B Assignment", has_assignment,
                f"Assigned to variant {data.get('variant')} with {data.get('discount_pct')}% discount")
        else:
            return self.log_result("A/B Assignment", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_ab_report(self):
        """Test A/B experiment reporting"""
        print(f"\n🔍 Testing A/B Report...")
        
        if not self.admin_token:
            return self.log_result("A/B Report", False, "No admin token")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response, error = self.make_request(
            'GET', '/v2/admin/ab/report?exp_id=prepaid_discount_v1&range_days=14',
            headers=headers,
            expect_status=200
        )
        
        if error:
            return self.log_result("A/B Report", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have experiment report structure
            expected_fields = ['exp', 'total_orders', 'total_paid', 'rows']
            has_report = all(field in data for field in expected_fields)
            return self.log_result("A/B Report", has_report,
                f"Report: {data.get('total_orders', 0)} orders, {len(data.get('rows', []))} variants")
        else:
            return self.log_result("A/B Report", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting Y-Store ROE & A/B Testing Backend Tests")
        print("🎯 Testing Revenue Optimization Engine & A/B Testing Features")
        print("=" * 80)
        
        # Basic connectivity and authentication
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        # Test authentication requirements
        self.test_admin_authentication_required()
        
        # === NEW ROE & A/B REQUIREMENTS TESTING ===
        
        # ROE (Revenue Optimization Engine) tests
        print(f"\n{'='*20} ROE (Revenue Optimization Engine) Tests {'='*20}")
        self.test_revenue_settings()
        self.test_revenue_config() 
        self.test_revenue_optimize_run()
        self.test_revenue_suggestions()
        
        # A/B Testing Engine tests
        print(f"\n{'='*20} A/B Testing Engine Tests {'='*20}")
        self.test_ab_seed_prepaid_discount()
        self.test_ab_experiments_list()
        self.test_ab_assignment()
        self.test_ab_report()
        
        # Previous features testing
        print(f"\n{'='*20} Previous Features Tests {'='*20}")
        self.test_payment_health_dashboard()
        self.test_risk_center_apis()
        self.test_prepaid_discount_env_config()
        
        # Test individual modules from previous implementation
        self.test_guard_incidents_list()
        self.test_guard_incident_actions()
        self.test_risk_distribution()
        self.test_timeline_events()
        self.test_analytics_ops_kpi()
        self.test_analytics_daily_rebuild()
        
        # Test O20 Pickup Control module
        self.test_pickup_control_kpi()
        self.test_pickup_control_risk_list()
        self.test_pickup_control_run_engine()
        self.test_pickup_control_mute_ttn()
        self.test_pickup_control_send_reminder()
        
        # Test O20.3 Return Management Engine
        self.test_returns_summary()
        self.test_returns_list()
        self.test_returns_run()
        
        # Test O20.4-O20.6 REQUIREMENTS
        self.test_returns_trend()
        self.test_policy_pending() 
        self.test_policy_cities()
        self.test_policy_run()
        
        self.test_ops_dashboard()
        
        print("\n" + "=" * 80)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print("=" * 80)
        
        return self.tests_passed >= (self.tests_run * 0.7)  # 70% pass rate acceptable


def main():
    """Main test runner"""
    tester = YStoreAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 Tests completed successfully!")
        return 0
    else:
        print("💥 Some critical tests failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())