import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_auth():
    print("Testing Registration...")
    reg_data = {
        "name": "Test Patient",
        "email": "patient@test.com",
        "password": "password123",
        "role": "patient"
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    print(f"Register Status: {res.status_code}")
    
    print("\nTesting Login...")
    login_data = {
        "email": "patient@test.com",
        "password": "password123"
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login Status: {res.status_code}")
    if res.status_code == 200:
        token = res.json().get("token")
        print("Login successful, token received.")
        return token
    return None

if __name__ == "__main__":
    token = test_auth()
    if token:
        print("\nAuth tests passed!")
    else:
        print("\nAuth tests failed (likely due to no MongoDB).")
