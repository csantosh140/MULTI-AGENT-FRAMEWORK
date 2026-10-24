import time
import logging
from agents.base.base_agent import BaseAgent

logger = logging.getLogger('app')

class DecisionAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="SecurityDecisionAgent",
            agent_type="decision_agent",
            version="1.0.0",
            **kwargs
        )

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "make_decision":
            transaction_id = payload.get("transaction_id")
            client_ip = payload.get("client_ip")
            reputation_score = payload.get("reputation_score", 0.0)
            campaign_detected = payload.get("campaign_detected", False)
            detection_metrics = payload.get("detection_metrics", {})
            
            confidence = detection_metrics.get("confidence", 0.0)
            severity = detection_metrics.get("severity", "Info")
            attack_type = detection_metrics.get("attack_type", "Safe")
            
            # Determine Action: ALLOW, BLOCK, MONITOR, ESCALATE
            decision = "ALLOW"
            blocked = False
            
            if attack_type != "Safe" and (campaign_detected or reputation_score > 70.0 or confidence > 70.0 or (severity in ["High", "Critical"] and confidence > 50.0)):
                decision = "BLOCK"
                blocked = True
            elif attack_type != "Safe" and (confidence > 35.0 or reputation_score > 30.0):
                decision = "MONITOR"
                blocked = False
            elif attack_type != "Safe" and (severity == "High" or reputation_score > 15.0):
                decision = "ESCALATE"
                blocked = False
            else:
                decision = "ALLOW"
                blocked = False
                
            self.memory.update_state("last_decision", decision)
            
            logger.info(f"[DecisionAgent] Verdict for transaction {transaction_id}: {decision} (reputation={reputation_score}, confidence={confidence}%).")
            
            # Forward action to Prevention Agent
            self.send(
                receiver="prevention_agent",
                payload={
                    "task": "execute_prevention",
                    "transaction_id": transaction_id,
                    "request": payload.get("request"),
                    "client_ip": client_ip,
                    "decision": decision,
                    "blocked": blocked,
                    "attack_type": attack_type,
                    "confidence": confidence,
                    "severity": severity,
                    "explanation": detection_metrics.get("explanation", ""),
                    "timestamp": time.time()
                },
                priority="Critical"
            )
