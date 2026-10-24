import time
import random
import requests
import argparse
from faker import Faker

fake = Faker()

VALID_USERS = {
    "admin@antigravity.io": "password123",
    "elena@antigravity.io": "securePassword2026",
    "marcus@antigravity.io": "marcusPassWord!"
}

SUITE_NAME = "Comprehensive All-Vectors SQLi Benchmark"
PAYLOADS = ["' OR 1=1 --", "admin' UNION ALL SELECT username, password FROM users --", "' AND (SELECT 2000 FROM(SELECT COUNT(*),CONCAT(0x7176706271,(SELECT version()),0x7176706271,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a) --", "' OR SLEEP(2) --", "admin'; DROP TABLE users; --"]

def generate_random_ip():
    return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

def create_random_user_agent():
    browsers = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"
    ]
    return random.choice(browsers)

def run_suite(url="http://localhost:3000/api/login", requests_count=15, delay=2.0):
    print("==========================================================")
    print(f" [LAUNCH] {SUITE_NAME} against {url}")
    print(f" [PACING] {delay} seconds per attack")
    print("==========================================================")

    for i in range(requests_count):
        is_legit = (i % 5 == 0)
        if is_legit:
            user = random.choice(list(VALID_USERS.keys()))
            pwd = VALID_USERS[user]
            category = "Legitimate"
        else:
            user = random.choice(PAYLOADS)
            pwd = "invalid_password"
            category = SUITE_NAME

        headers = {
            "Content-Type": "application/json",
            "User-Agent": create_random_user_agent(),
            "X-Forwarded-For": generate_random_ip()
        }

        data = { "email": user, "username": user, "password": pwd }

        try:
            res = requests.post(url, json=data, headers=headers, timeout=5)
            status_tag = "[403 BLOCKED]" if res.status_code == 403 else (f"[200 OK]" if res.status_code == 200 else f"[{res.status_code}]")
            print(f"[{i+1}/{requests_count}] {status_tag} IP: {headers['X-Forwarded-For']} | Payload: {user[:45]}")
        except Exception as e:
            print(f"[{i+1}/{requests_count}] [ERROR] Connection Error: {e}")

        time.sleep(delay)

    print("==========================================================")
    print(f" [COMPLETE] {SUITE_NAME} FINISHED!")
    print("==========================================================")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=SUITE_NAME)
    parser.add_argument('--url', type=str, default='http://localhost:3000/api/login')
    parser.add_argument('--requests', type=int, default=15)
    parser.add_argument('--delay', type=float, default=2.0)
    args = parser.parse_args()

    run_suite(url=args.url, requests_count=args.requests, delay=args.delay)
