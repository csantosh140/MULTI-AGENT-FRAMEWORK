import time
import logging
from agents.base.base_agent import BaseAgent

logger = logging.getLogger('app')

class AnomalyDetectionAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="AnomalyDetectionAgent",
            agent_type="anomaly_detection",
            version="1.0.0",
            **kwargs
        )
        self.ip_request_counts = {}
        self.suspicious_ips = set()
        self.threshold = 100 # requests per minute
        self.window_start = time.time()

    def initialize(self):
        super().initialize()
        logger.info("[AnomalyDetectionAgent] AnomalyDetectionAgent active and ready.")

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")

        if task == "track_request":
            client_ip = payload.get("client_ip")
            if not client_ip:
                return

            current_time = time.time()
            if current_time - self.window_start > 60:
                self.ip_request_counts = {}
                self.window_start = current_time

            self.ip_request_counts[client_ip] = self.ip_request_counts.get(client_ip, 0) + 1

            if self.ip_request_counts[client_ip] > self.threshold:
                if client_ip not in self.suspicious_ips:
                    self.suspicious_ips.add(client_ip)
                    logger.warning(f"[AnomalyDetectionAgent] Suspicious activity detected from IP: {client_ip}. Frequency: {self.ip_request_counts[client_ip]} req/min")

                    # Notify Orchestrator or Prevention Agent
                    self.send(
                        receiver="orchestrator",
                        payload={
                            "task": "anomaly_alert",
                            "type": "High Frequency Request",
                            "client_ip": client_ip,
                            "count": self.ip_request_counts[client_ip],
                            "threshold": self.threshold
                        },
                        priority="High"
                    )

        elif task == "get_suspicious_ips":
            self.send(
                receiver=message.sender,
                payload={
                    "task": "suspicious_ips_report",
                    "suspicious_ips": list(self.suspicious_ips)
                }
            )

    def run(self):
        # Override run to include some periodic cleanup if needed
        super().run()
