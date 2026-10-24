import time
import json
import logging
from agents.base.base_agent import BaseAgent
from app.extensions import db
from app.models.attack_log import AttackLog

logger = logging.getLogger('app')

class PreventionAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="IntrusionPreventionAgent",
            agent_type="prevention_agent",
            version="1.0.0",
            **kwargs
        )

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "execute_prevention":
            transaction_id = payload.get("transaction_id")
            request_data = payload.get("request", {})
            client_ip = payload.get("client_ip")
            decision = payload.get("decision")
            blocked = payload.get("blocked", False)
            attack_type = payload.get("attack_type", "Safe")
            confidence = payload.get("confidence", 0.0)
            severity = payload.get("severity", "Info")
            explanation = payload.get("explanation", "")
            
            method = request_data.get("method", "GET")
            url = request_data.get("url", "/")
            body = request_data.get("body", {})
            
            payload_str = str(body) if body else ""
            
            # Map decision to database values: Allowed, Blocked, Logged
            db_status = "Allowed"
            if decision == "BLOCK":
                db_status = "Blocked"
            elif decision == "MONITOR":
                db_status = "Logged"
            elif decision == "ESCALATE":
                db_status = "Logged"
                
            # Perform DB writes under Flask app context if available
            try:
                from app.models.live_request import LiveRequest
                from agents.orchestrator.orchestrator import OrchestratorAgent
                app_instance = OrchestratorAgent().app
                if app_instance:
                    with app_instance.app_context():
                        # 1. Update LiveRequest dashboard feed
                        live_req = LiveRequest(
                            method=method,
                            url=url,
                            payload=payload_str,
                            decision=db_status,
                            confidence=confidence
                        )
                        db.session.add(live_req)
                        
                        # 2. Persist to AttackLog if suspicious/malicious
                        if db_status in ["Blocked", "Logged"] or attack_type != "Safe":
                            attack_log = AttackLog(
                                client_ip=client_ip,
                                method=method,
                                url=url,
                                payload=payload_str,
                                headers=json.dumps(request_data.get("headers", {})),
                                cookies=json.dumps(request_data.get("cookies", {})),
                                prediction=attack_type,
                                confidence=confidence,
                                risk_score=confidence,
                                status=db_status,
                                blocked=blocked,
                                response_time=request_data.get("response_time", 0.0),
                                threat_level=severity
                            )
                            db.session.add(attack_log)
                            
                        db.session.commit()
                        logger.info(f"[PreventionAgent] DB persistence completed for transaction {transaction_id}.")
            except Exception as e:
                logger.error(f"[PreventionAgent] Failed to persist attack logs: {str(e)}")
            
            # Send message to Report Agent
            self.send(
                receiver="report_agent",
                payload={
                    "task": "compile_incident",
                    "transaction_id": transaction_id,
                    "client_ip": client_ip,
                    "decision": decision,
                    "blocked": blocked,
                    "attack_type": attack_type,
                    "confidence": confidence,
                    "severity": severity,
                    "timestamp": time.time()
                },
                priority="Medium"
            )
            
            # Send verdict response back to Orchestrator to resolve the waiting block
            self.send(
                receiver="orchestrator",
                payload={
                    "task": "verdict_response",
                    "transaction_id": transaction_id,
                    "decision": decision,
                    "blocked": blocked,
                    "confidence": confidence,
                    "severity": severity,
                    "explanation": explanation
                },
                priority="Critical"
            )
            
        elif task == "cleanup_logs":
            logger.info("[PreventionAgent] Executing scheduled logs rotation audit.")
            try:
                from app.models.live_request import LiveRequest
                from agents.orchestrator.orchestrator import OrchestratorAgent
                app_instance = OrchestratorAgent().app
                if app_instance:
                    with app_instance.app_context():
                        total_count = LiveRequest.query.count()
                        if total_count > 1000:
                            stale = LiveRequest.query.order_by(LiveRequest.timestamp.asc()).limit(total_count - 1000).all()
                            for s in stale:
                                db.session.delete(s)
                            db.session.commit()
                            logger.info(f"[PreventionAgent] Pruned {len(stale)} old live requests from DB.")
            except Exception as e:
                logger.error(f"[PreventionAgent] Stale logs pruning failed: {str(e)}")
