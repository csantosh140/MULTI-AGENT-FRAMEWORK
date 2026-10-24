import re

class SQLiTimeDetector:
    """
    Evaluates requests for Time-Based SQL Injection vulnerabilities.
    Correlates server response delay parameters with matching database delay keywords.
    """
    def __init__(self):
        # Patterns related to sleep/delay triggers
        self.delay_signatures = [
            r'(?i)\bsleep\s*\(',
            r'(?i)\bpg_sleep\s*\(',
            r'(?i)\bbenchmark\s*\(',
            r'(?i)\bwaitfor\s+delay\b',
            r'(?i)dbms_lock\.sleep\b'
        ]
        self.compiled_signatures = [re.compile(pat) for pat in self.delay_signatures]
        # Threshold above which response times are considered anomalies
        self.time_threshold_seconds = 5.0

    def analyze_request(self, payload, response_time_seconds):
        """
        Analyzes response delay times and payload context.
        Returns:
            dict containing:
                time_behavior_score (float): Score (0.0 to 100.0)
                is_time_sqli_likely (bool): True if correlation matches
                explanation (str): Reason summary
        """
        has_delay_signature = False
        matched_pat = None
        
        if payload:
            for regex in self.compiled_signatures:
                if regex.search(payload):
                    has_delay_signature = True
                    matched_pat = regex.pattern
                    break

        if response_time_seconds is None:
            response_time_seconds = 0.0
        else:
            try:
                response_time_seconds = float(response_time_seconds)
            except ValueError:
                response_time_seconds = 0.0

        is_slow = response_time_seconds >= self.time_threshold_seconds
        
        # Determine classification score and likelihoods
        if has_delay_signature and is_slow:
            score = 100.0
            is_likely = True
            explanation = f"SQL Injection signature '{matched_pat}' verified by matching response delay of {response_time_seconds:.2f}s."
        elif has_delay_signature and not is_slow:
            # Payload contains SLEEP but server responded fast (either query failed, or database handled it)
            score = 80.0
            is_likely = True
            explanation = f"Dangerous database sleep/delay command found in payload, but response time was normal ({response_time_seconds:.2f}s)."
        elif not has_delay_signature and is_slow:
            # Server was slow but no signature found (could be regular server load)
            score = 40.0
            is_likely = False
            explanation = f"Server response delay is abnormal ({response_time_seconds:.2f}s), but no time-based SQLi signature detected."
        else:
            score = 0.0
            is_likely = False
            explanation = "Response latency within normal limits. No delay vectors identified."
            
        return {
            'time_behavior_score': score,
            'is_time_sqli_likely': is_likely,
            'explanation': explanation
        }
