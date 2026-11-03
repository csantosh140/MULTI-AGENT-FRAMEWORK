from agents.base.base_agent import BaseAgent
from app.services.crypto_failure_scanner import CryptoFailureScanner


class CryptoFailureAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="CryptographicFailureAgent",
            agent_type="cryptographic_failure_agent",
            version="1.0.0",
            **kwargs
        )

    @staticmethod
    def scan_files(files):
        return CryptoFailureScanner.scan_files(files)

    def execute(self, message):
        payload = message.payload
        if payload.get("task") == "scan_cryptographic_failures":
            return self.scan_files(payload.get("files", []))
        return None
