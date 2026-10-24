import re

class SQLiBlindDetector:
    """
    Analyzes differences between a standard server response and an injected response.
    Monitors status codes, content lengths, DOM elements, and keyword deviations.
    """
    def __init__(self):
        # Allowable divergence before flagging anomaly
        self.length_diff_ratio_threshold = 0.25

    def analyze_responses(self, normal_response_dict, injected_response_dict):
        """
        Compares normal response and injected response maps.
        Format of arguments:
            {
                'status_code': 200,
                'body': '<html>...</html>',
                'length': 1024
            }
        Returns:
            dict containing:
                blind_behavior_score (float): Score (0.0 to 100.0)
                is_blind_sqli_likely (bool): True if changes are suspicious
                anomalies (list): Identified anomalies list
        """
        if not normal_response_dict or not injected_response_dict:
            return {
                'blind_behavior_score': 0.0,
                'is_blind_sqli_likely': False,
                'anomalies': ['Missing response data for comparison.']
            }
            
        anomalies = []
        score = 0.0
        
        # 1. Status Code comparison
        normal_status = int(normal_response_dict.get('status_code', 200))
        injected_status = int(injected_response_dict.get('status_code', 200))
        
        if normal_status != injected_status:
            # Shift from 200 to 500 or 400 is common in blind/conditional checks
            anomalies.append(f"HTTP status code mismatch: {normal_status} (Normal) vs {injected_status} (Injected)")
            score += 40.0
            
        # 2. Content Length comparison
        normal_len = int(normal_response_dict.get('length', len(normal_response_dict.get('body', ''))))
        injected_len = int(injected_response_dict.get('length', len(injected_response_dict.get('body', ''))))
        
        if normal_len > 0:
            diff_ratio = abs(normal_len - injected_len) / normal_len
            if diff_ratio >= self.length_diff_ratio_threshold:
                anomalies.append(f"Content length changed significantly by {diff_ratio*100:.1f}% ({normal_len} vs {injected_len})")
                score += 35.0
        elif injected_len > 0:
            anomalies.append("Normal response was empty, but injected response returned data.")
            score += 35.0
            
        # 3. DOM keyword check & elements count
        # Look for indicators of database errors or structural keyword changes
        normal_body = normal_response_dict.get('body', '')
        injected_body = injected_response_dict.get('body', '')
        
        # Count elements (e.g. table rows or input tags)
        normal_tags = len(re.findall(r'<tr|<input|<div', normal_body, re.IGNORECASE))
        injected_tags = len(re.findall(r'<tr|<input|<div', injected_body, re.IGNORECASE))
        
        if normal_tags != injected_tags:
            anomalies.append(f"DOM structure changed: matched tags count changed from {normal_tags} to {injected_tags}")
            score += 25.0
            
        # 4. Check for system keywords inside injected but not normal response
        db_keywords = ['database', 'sqlite', 'mysql', 'postgresql', 'oracle', 'driver', 'syntax error']
        for kw in db_keywords:
            if kw in injected_body.lower() and kw not in normal_body.lower():
                anomalies.append(f"Database leak keyword '{kw}' found in injected response only.")
                score += 50.0

        # Cap score at 100
        final_score = min(100.0, score)
        is_likely = final_score >= 60.0
        
        return {
            'blind_behavior_score': final_score,
            'is_blind_sqli_likely': is_likely,
            'anomalies': anomalies
        }
