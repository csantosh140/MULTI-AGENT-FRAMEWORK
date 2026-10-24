import time
import logging
from collections import defaultdict
from agents.base.base_agent import BaseAgent

logger = logging.getLogger('app')

class MonitoringAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="TrafficMonitoringAgent",
            agent_type="monitoring_agent",
            version="1.0.0",
            **kwargs
        )
        self.ip_request_history = defaultdict(list)
        self.session_activity = {}

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "monitor_request":
            request_data = payload.get("request", {})
            transaction_id = payload.get("transaction_id")
            
            # Extract client IP and track stats
            headers = request_data.get("headers", {})
            client_ip = headers.get("X-Forwarded-For", "127.0.0.1")
            
            now = time.time()
            # Clean window history (keep last 60 seconds)
            self.ip_request_history[client_ip] = [t for t in self.ip_request_history[client_ip] if now - t < 60.0]
            self.ip_request_history[client_ip].append(now)
            
            req_frequency = len(self.ip_request_history[client_ip])
            self.memory.update_state("request_frequency", req_frequency)
            
            logger.info(f"[MonitoringAgent] Intercepted request from {client_ip}. Frequency: {req_frequency} req/min.")
            
            # Forward analysis packet to Detection Agent
            self.send(
                receiver="detection_agent",
                payload={
                    "task": "detect_threat",
                    "transaction_id": transaction_id,
                    "request": request_data,
                    "client_ip": client_ip,
                    "request_frequency": req_frequency,
                    "timestamp": now
                },
                priority="High"
            )
        
        elif task == "system_health_audit":
            logger.info("[MonitoringAgent] Executing scheduled system health audit.")
            # Clear stale sessions
            now = time.time()
            self.session_activity = {k: v for k, v in self.session_activity.items() if now - v < 300.0}
