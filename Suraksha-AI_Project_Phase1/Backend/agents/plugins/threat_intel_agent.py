import time
import logging
from collections import defaultdict
from agents.base.base_agent import BaseAgent

logger = logging.getLogger('app')

class ThreatIntelAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="CyberThreatIntelAgent",
            agent_type="threat_intel_agent",
            version="1.0.0",
            **kwargs
        )
        # In-memory IP reputation registry: IP -> {score, strikes, last_seen, campaigns}
        self.ip_reputation = defaultdict(lambda: {"score": 0.0, "strikes": 0, "last_seen": 0.0})
        self.campaigns = []

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "evaluate_campaign":
            transaction_id = payload.get("transaction_id")
            client_ip = payload.get("client_ip")
            detection_metrics = payload.get("detection_metrics", {})
            req_freq = payload.get("request_frequency", 1)
            
            attack_type = detection_metrics.get("attack_type", "Safe")
            confidence = detection_metrics.get("confidence", 0.0)
            
            # Retrieve profile
            profile = self.ip_reputation[client_ip]
            profile["last_seen"] = time.time()
            
            # Calculate dynamic strikes and reputation scores
            campaign_detected = False
            if attack_type != "Safe" and confidence > 50.0:
                profile["strikes"] += 1
                # Exponential reputation degradation
                profile["score"] = min(100.0, profile["score"] + (profile["strikes"] * 15.0) + (req_freq * 2.0))
                
                # Check for active multi-request campaign (e.g. > 3 strikes in 1 min)
                if profile["strikes"] >= 3:
                    campaign_detected = True
                    logger.warning(f"[ThreatIntelAgent] Attacker Campaign detected from IP {client_ip}!")
            else:
                # Gradual reputation recovery for safe requests
                profile["score"] = max(0.0, profile["score"] - 0.5)
            
            self.memory.update_state(f"ip_reputation_{client_ip}", profile["score"])
            
            logger.info(f"[ThreatIntelAgent] IP {client_ip} reputation score: {profile['score']} ({profile['strikes']} strikes).")
            
            # Forward intelligence bundle to Decision Agent
            self.send(
                receiver="decision_agent",
                payload={
                    "task": "make_decision",
                    "transaction_id": transaction_id,
                    "request": payload.get("request"),
                    "client_ip": client_ip,
                    "reputation_score": profile["score"],
                    "campaign_detected": campaign_detected,
                    "detection_metrics": detection_metrics,
                    "timestamp": time.time()
                },
                priority="High"
            )

        elif task == "update_threat_scores":
            logger.info("[ThreatIntelAgent] Executing scheduled threat scores decay.")
            # Decay reputation scores for inactive attackers
            now = time.time()
            for ip, profile in list(self.ip_reputation.items()):
                if now - profile["last_seen"] > 300: # 5 minutes inactivity
                    profile["score"] = max(0.0, profile["score"] - 10.0)
                    if profile["score"] == 0.0:
                        profile["strikes"] = max(0, profile["strikes"] - 1)
