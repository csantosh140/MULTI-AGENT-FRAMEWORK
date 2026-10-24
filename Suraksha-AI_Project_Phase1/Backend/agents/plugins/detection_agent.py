import time
import logging
from agents.base.base_agent import BaseAgent
from app.services.detection_service import DetectionService

logger = logging.getLogger('app')

class DetectionAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="VulnerabilityDetectionAgent",
            agent_type="detection_agent",
            version="1.0.0",
            **kwargs
        )

    def initialize(self):
        super().initialize()
        logger.info("[DetectionAgent] VulnerabilityDetectionAgent active and ready.")

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "detect_threat":
            request_data = payload.get("request", {})
            transaction_id = payload.get("transaction_id")
            client_ip = payload.get("client_ip", "127.0.0.1")
            freq = payload.get("request_frequency", 1)
            
            method = request_data.get("method", "GET")
            url = request_data.get("url", "/")
            headers = request_data.get("headers", {})
            cookies = request_data.get("cookies", {})
            params = request_data.get("parameters", {})
            body = request_data.get("body", {})

            # Aggregate payload targets
            targets = []
            if isinstance(body, dict):
                targets.extend(body.values())
            elif isinstance(body, str):
                targets.append(body)
                
            if isinstance(params, dict):
                targets.extend(params.values())
            elif isinstance(params, str):
                targets.append(params)
                
            if isinstance(cookies, dict):
                targets.extend(cookies.values())
                
            if not targets:
                targets.append(url)
                
            # Evaluate using unified DetectionService
            analysis = DetectionService.analyze_request(
                url=url,
                payload=str(targets[0]) if targets else "",
                headers=headers,
                cookies=cookies,
                params=params,
                body=body
            )

            attack_type = analysis.get("prediction", "Safe")
            confidence = analysis.get("confidence", 0.0)
            severity = analysis.get("threat_level", "Info")
            explanation = analysis.get("reason", "Clean traffic.")

            # Log to local agent memory
            self.memory.add_payload_log(str(targets), attack_type)
            
            logger.info(f"[DetectionAgent] Classification complete: Type={attack_type}, Conf={confidence}%, Severity={severity}")
            
            # Forward threat metrics to Threat Intel Agent
            self.send(
                receiver="threat_intel_agent",
                payload={
                    "task": "evaluate_campaign",
                    "transaction_id": transaction_id,
                    "request": request_data,
                    "client_ip": client_ip,
                    "request_frequency": freq,
                    "detection_metrics": {
                        "attack_type": attack_type,
                        "confidence": confidence,
                        "severity": severity,
                        "explanation": explanation
                    },
                    "timestamp": time.time()
                },
                priority="High"
            )

        elif task == "evaluate_model_performance":
            logger.info("[DetectionAgent] Running scheduled model performance verification.")
