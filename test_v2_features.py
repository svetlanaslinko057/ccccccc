#!/usr/bin/env python3
"""
V2 Features Testing - Nova Poshta Delivery & Growth APIs
Testing specific features mentioned in review request:
- Delivery Calculate API: POST /api/delivery/v2/calculate с city_ref и cart_total
- Free delivery from 2000 UAH (is_free:true)  
- Health API: GET /api/health
- Growth APIs: /api/v2/growth/abandoned-carts, /api/v2/growth/segments
"""

import requests
import sys
import json
from datetime import datetime

class V2FeaturesTester:
    def __init__(self):
        # Use production URL from frontend .env
        self.base_url = "https://fullstack-deploy-45.preview.emergentagent.com"
        self.tests_run = 0
        self.tests_passed = 0

    def log_result(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, expect_status=200, timeout=30):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"🔍 Making {method} request to: {url}")
        if data:
            print(f"   📤 Request data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            else:
                return None, f"Unsupported method: {method}"
            
            print(f"   📥 Response status: {response.status_code}")
            
            success = response.status_code == expect_status
            result_data = {}
            try:
                result_data = response.json()
                if result_data:
                    print(f"   📋 Response data: {json.dumps(result_data, indent=2)}")
            except:
                result_data = {"text": response.text[:500]}
                if response.text:
                    print(f"   📄 Response text: {response.text[:200]}...")
            
            return {
                "success": success,
                "status_code": response.status_code,
                "data": result_data,
                "expected_status": expect_status
            }, None
            
        except requests.exceptions.Timeout:
            return None, "Request timeout"
        except requests.exceptions.ConnectionError:
            return None, "Connection error - server may be down"
        except Exception as e:
            return None, f"Request failed: {str(e)}"

    def test_health_api(self):
        """Test GET /api/health"""
        print(f"\n🔍 Testing Health API...")
        
        response, error = self.make_request('GET', '/api/health')
        
        if error:
            return self.log_result("Health API", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            has_status = "status" in data and data["status"] == "ok"
            has_service = "service" in data
            return self.log_result("Health API", has_status and has_service,
                f"Status: {data.get('status')}, Service: {data.get('service')}")
        else:
            return self.log_result("Health API", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_delivery_calculate_v2_below_threshold(self):
        """Test POST /api/delivery/v2/calculate with cart below 2000 UAH"""
        print(f"\n🔍 Testing Delivery V2 API - Below Free Threshold...")
        
        # Test with cart total below 2000 UAH
        test_data = {
            "city_ref": "8d5a980d-391c-11dd-90d9-001a92567626",  # Kyiv ref from code
            "cart_total": 1500,  # Below 2000 threshold
            "weight": 1
        }
        
        response, error = self.make_request(
            'POST', '/api/delivery/v2/calculate',
            data=test_data
        )
        
        if error:
            return self.log_result("Delivery V2 Below Threshold", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should have delivery cost (not free)
            required_fields = ["base_cost", "final_cost", "is_free", "free_delivery_threshold", "amount_for_free"]
            has_structure = all(field in data for field in required_fields)
            
            if has_structure:
                is_free = data.get("is_free", True)  # Should be False
                final_cost = data.get("final_cost", 0)
                amount_for_free = data.get("amount_for_free", 0)
                
                # Should not be free for 1500 UAH
                correct_logic = not is_free and final_cost > 0 and amount_for_free > 0
                
                return self.log_result("Delivery V2 Below Threshold", correct_logic,
                    f"Free: {is_free}, Cost: {final_cost}₴, Need: {amount_for_free}₴")
            else:
                missing = [f for f in required_fields if f not in data]
                return self.log_result("Delivery V2 Below Threshold", False,
                    f"Missing fields: {missing}")
        else:
            return self.log_result("Delivery V2 Below Threshold", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_delivery_calculate_v2_above_threshold(self):
        """Test POST /api/delivery/v2/calculate with cart above 2000 UAH (free delivery)"""
        print(f"\n🔍 Testing Delivery V2 API - Above Free Threshold...")
        
        # Test with cart total above 2000 UAH
        test_data = {
            "city_ref": "8d5a980d-391c-11dd-90d9-001a92567626",  # Kyiv ref
            "cart_total": 2500,  # Above 2000 threshold
            "weight": 1
        }
        
        response, error = self.make_request(
            'POST', '/api/delivery/v2/calculate',
            data=test_data
        )
        
        if error:
            return self.log_result("Delivery V2 Above Threshold", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            
            if "is_free" in data and "final_cost" in data:
                is_free = data.get("is_free", False)
                final_cost = data.get("final_cost", 100)
                
                # Should be free for 2500 UAH
                correct_logic = is_free and final_cost == 0
                
                return self.log_result("Delivery V2 Above Threshold", correct_logic,
                    f"Free: {is_free}, Final cost: {final_cost}₴")
            else:
                return self.log_result("Delivery V2 Above Threshold", False,
                    "Missing is_free or final_cost fields")
        else:
            return self.log_result("Delivery V2 Above Threshold", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_growth_abandoned_carts(self):
        """Test GET /api/v2/growth/abandoned-carts"""
        print(f"\n🔍 Testing Growth Abandoned Carts API...")
        
        response, error = self.make_request(
            'GET', '/api/v2/growth/abandoned-carts?minutes=60&limit=10'
        )
        
        if error:
            return self.log_result("Growth Abandoned Carts", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should return array of abandoned carts (might be empty)
            is_array = isinstance(data, list)
            return self.log_result("Growth Abandoned Carts", is_array,
                f"Found {len(data) if is_array else 0} abandoned carts")
        else:
            return self.log_result("Growth Abandoned Carts", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_growth_segments(self):
        """Test GET /api/v2/growth/segments"""
        print(f"\n🔍 Testing Growth Customer Segments API...")
        
        response, error = self.make_request(
            'GET', '/api/v2/growth/segments'
        )
        
        if error:
            return self.log_result("Growth Customer Segments", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            # Should return array of customer segments
            is_array = isinstance(data, list)
            
            if is_array and len(data) > 0:
                # Check segment structure
                sample_segment = data[0]
                expected_fields = ["segment", "label", "count", "avg_ltv", "avg_orders"]
                has_structure = all(field in sample_segment for field in expected_fields)
                
                return self.log_result("Growth Customer Segments", has_structure,
                    f"Found {len(data)} segments with correct structure")
            else:
                return self.log_result("Growth Customer Segments", is_array,
                    f"Empty segments list (might be expected)")
        else:
            return self.log_result("Growth Customer Segments", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_nova_poshta_cities(self):
        """Test GET /api/delivery/cities - supporting endpoint"""
        print(f"\n🔍 Testing Nova Poshta Cities Search...")
        
        response, error = self.make_request(
            'GET', '/api/delivery/cities?query=Київ&limit=5'
        )
        
        if error:
            return self.log_result("Nova Poshta Cities", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            is_array = isinstance(data, list)
            
            if is_array and len(data) > 0:
                # Check city structure
                sample_city = data[0]
                expected_fields = ["ref", "name", "delivery_city"]
                has_structure = all(field in sample_city for field in expected_fields)
                
                return self.log_result("Nova Poshta Cities", has_structure,
                    f"Found {len(data)} cities for 'Київ'")
            else:
                return self.log_result("Nova Poshta Cities", is_array,
                    "Empty cities list")
        else:
            return self.log_result("Nova Poshta Cities", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def test_nova_poshta_warehouses(self):
        """Test GET /api/delivery/warehouses - supporting endpoint"""
        print(f"\n🔍 Testing Nova Poshta Warehouses...")
        
        # Using Kyiv city ref from the code
        city_ref = "8d5a980d-391c-11dd-90d9-001a92567626"
        
        response, error = self.make_request(
            'GET', f'/api/delivery/warehouses?city_ref={city_ref}&number=1'
        )
        
        if error:
            return self.log_result("Nova Poshta Warehouses", False, f"Error: {error}")
        
        if response["success"]:
            data = response["data"]
            is_array = isinstance(data, list)
            
            if is_array and len(data) > 0:
                # Check warehouse structure
                sample_warehouse = data[0]
                expected_fields = ["ref", "number", "description"]
                has_structure = all(field in sample_warehouse for field in expected_fields)
                
                return self.log_result("Nova Poshta Warehouses", has_structure,
                    f"Found {len(data)} warehouses in Kyiv")
            else:
                return self.log_result("Nova Poshta Warehouses", is_array,
                    "Empty warehouses list")
        else:
            return self.log_result("Nova Poshta Warehouses", False,
                f"Status: {response['status_code']}, Data: {response['data']}")

    def run_all_tests(self):
        """Run all V2 feature tests"""
        print("🚀 Starting V2 Features Testing")
        print("🎯 Testing Nova Poshta Delivery V2 & Growth APIs")
        print("=" * 80)
        
        # Health check
        self.test_health_api()
        
        # Delivery V2 tests
        print(f"\n{'='*20} Nova Poshta Delivery V2 Tests {'='*20}")
        self.test_delivery_calculate_v2_below_threshold()
        self.test_delivery_calculate_v2_above_threshold()
        
        # Supporting Nova Poshta endpoints
        self.test_nova_poshta_cities()
        self.test_nova_poshta_warehouses()
        
        # Growth APIs tests
        print(f"\n{'='*20} Growth APIs Tests {'='*20}")
        self.test_growth_abandoned_carts()
        self.test_growth_segments()
        
        print("\n" + "=" * 80)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print("=" * 80)
        
        return self.tests_passed >= (self.tests_run * 0.8)  # 80% pass rate

def main():
    """Main test runner"""
    tester = V2FeaturesTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 V2 Features tests completed successfully!")
        return 0
    else:
        print("💥 Some V2 features tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())