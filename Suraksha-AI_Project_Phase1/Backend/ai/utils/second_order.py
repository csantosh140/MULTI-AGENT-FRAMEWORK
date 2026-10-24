import logging

logger = logging.getLogger('app')

class SQLiSecondOrderDetector:
    """
    Stateful request correlator.
    Tracks user sessions, payloads, and warns if suspicious database inputs 
    are subsequently fetched in normal reads.
    """
    _state_registry = {}  # Registry mapping session_id -> list of payloads saved

    @classmethod
    def register_saved_payload(cls, session_id, user_id, payload):
        """Registers a payload that was saved/stored (e.g., in a profile or comment field)."""
        if not session_id or not payload:
            return
            
        # Detect if payload contains SQL characters
        if any(marker in payload for marker in ["'", '"', "--", "/*", "#", "union"]):
            if session_id not in cls._state_registry:
                cls._state_registry[session_id] = []
                
            cls._state_registry[session_id].append({
                'user_id': user_id,
                'payload': payload,
                'timestamp': float(0.0)  # Simple placeholder
            })
            logger.info(f"Second-Order Tracker: Registered potential stored payload for Session '{session_id}': {payload[:30]}...")

    @classmethod
    def analyze_subsequent_request(cls, session_id, requested_url):
        """
        Analyzes if a subsequent read URL request is rendering inputs 
        that correlate with stored payloads.
        """
        if not session_id or session_id not in cls._state_registry:
            return {
                'is_second_order_suspicious': False,
                'suspicion_score': 0.0,
                'explanation': "No prior stored payloads registered for this session."
            }
            
        stored_items = cls._state_registry[session_id]
        if not stored_items:
            return {
                'is_second_order_suspicious': False,
                'suspicion_score': 0.0,
                'explanation': "No active payloads in session registry."
            }
            
        # If the user is fetching views like dashboard, profile details, or list logs where stored data is rendered
        suspicious_pages = ['profile', 'details', 'dashboard', 'logs', 'view', 'history']
        is_rendering_view = any(page in requested_url.lower() for page in suspicious_pages)
        
        if is_rendering_view:
            score = min(100.0, 50.0 + 10.0 * len(stored_items))
            return {
                'is_second_order_suspicious': True,
                'suspicion_score': score,
                'explanation': f"Session request correlates with {len(stored_items)} previously stored inputs. Potential Second-Order SQLi execution on rendering: {requested_url}."
            }
            
        return {
            'is_second_order_suspicious': False,
            'suspicion_score': 15.0,
            'explanation': "Prior payloads exist in session registry, but requested page is not classified as high-risk rendering view."
        }
