import time
import logging

logger = logging.getLogger('app')

class AgentMemory:
    def __init__(self, limit=100):
        self.limit = limit
        
        # Short-term memory buffers
        self.recent_messages = []
        self.current_state = {}
        
        # Long-term memory stores
        self.historical_attacks = []
        self.payload_history = []
        self.threat_statistics = {
            "total_blocks": 0,
            "total_allows": 0,
            "severity_counts": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
        }
        self.knowledge_base = {
            "common_bypass_rules": [
                "tautology matches like OR '1'='1'",
                "comment block evasions like /**/",
                "time delay triggers pg_sleep or sleep"
            ]
        }

    def add_short_term_message(self, message):
        """Saves a message in short-term buffer, maintaining size limits."""
        self.recent_messages.append({
            "message_id": message.message_id,
            "sender": message.sender,
            "receiver": message.receiver,
            "priority": message.priority,
            "timestamp": message.timestamp,
            "payload_summary": str(message.payload)[:80]
        })
        if len(self.recent_messages) > self.limit:
            self.recent_messages.pop(0)

    def update_state(self, key, value):
        """Updates current state variable in short-term memory."""
        self.current_state[key] = value

    def add_long_term_attack(self, attack_details):
        """Persists details of identified security incidents."""
        self.historical_attacks.append({
            "timestamp": time.time(),
            "details": attack_details
        })
        if len(self.historical_attacks) > self.limit * 10:
            self.historical_attacks.pop(0)
            
        # Update statistics counters
        severity = attack_details.get("severity", "Info")
        if severity in self.threat_statistics["severity_counts"]:
            self.threat_statistics["severity_counts"][severity] += 1
            
        decision = attack_details.get("decision", "Allowed")
        if decision == "Blocked":
            self.threat_statistics["total_blocks"] += 1
        else:
            self.threat_statistics["total_allows"] += 1

    def add_payload_log(self, payload_string, attack_type):
        """Caches seen payloads for signature andCampaign detection."""
        self.payload_history.append({
            "payload": payload_string,
            "attack_type": attack_type,
            "timestamp": time.time()
        })
        if len(self.payload_history) > self.limit:
            self.payload_history.pop(0)
            
    def get_summary(self):
        """Returns statistics snapshot of memory state."""
        return {
            "recent_messages_count": len(self.recent_messages),
            "historical_attacks_count": len(self.historical_attacks),
            "payload_history_count": len(self.payload_history),
            "stats": self.threat_statistics
        }
