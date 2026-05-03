#!/usr/bin/env python3
import requests
import json

def test_signup_api():
    """Test the signup API endpoint"""
    url = "https://crop-yield-api-8kx2.onrender.com/register"
    
    payload = {
        "full_name": "Test User",
        "email": "test123@example.com", 
        "username": "test123@example.com",
        "password": "test123"
    }
    
    try:
        print(f"Testing signup API: {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response Data: {response_data}")
        except:
            print(f"Raw Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_signup_api()
