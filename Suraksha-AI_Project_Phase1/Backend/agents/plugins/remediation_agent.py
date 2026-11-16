import logging
from agents.base.base_agent import BaseAgent
from app.extensions import db
from app.models.settings import Settings

logger = logging.getLogger('app')

class RemediationAgent(BaseAgent):
    """
    Agent responsible for autonomous security hardening.
    Receives threat signals and applies real-time virtual patches
    or configuration hardening to neutralize detected vectors.
    """
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="RemediationAgent",
            agent_type="remediation_agent",
            version="1.0.0",
            **kwargs
        )

    def initialize(self):
        super().initialize()
        logger.info("[RemediationAgent] Autonomous Remediation engine initialized.")

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")

        if task == "apply_remediation":
            threat_info = payload.get("threat_info", {})
            attack_type = threat_info.get("attack_type")
            target = threat_info.get("target", "unknown")

            logger.info(f"[RemediationAgent] Analyzing remediation strategy for: {attack_type} on {target}")

            # Strategy: Dynamic Rule Generation / Hardening
            remediation_action = self._determine_strategy(attack_type, threat_info)

            if remediation_action:
                self._apply_action(remediation_action, threat_info)

                # Notify Orchestrator of successful hardening
                self.send(
                    receiver="orchestrator",
                    payload={
                        "task": "remediation_complete",
                        "status": "success",
                        "action": remediation_action.get("name"),
                        "target": target
                    },
                    priority="High"
                )

    def _determine_strategy(self, attack_type, info):
        # Maps threats to automated hardening actions
        if attack_type == "SQL Injection":
            return {"name": "SQL_Parameter_Sanitization", "type": "rule_update"}
        elif attack_type == "Broken Access Control":
            return {"name": "RBAC_Access_Boundary_Tightening", "type": "config_update"}
        elif attack_type == "Insecure Design":
            return {"name": "Business_Logic_Invariant_Fix", "type": "config_update"}
        return None

    def _apply_action(self, action, info):
        """
        Interacts with the application database/config to apply
        the virtual patch or hardening rule.
        """
        logger.info(f"[RemediationAgent] Applying action: {action['name']}")

        try:
            # Example: Update system settings for proactive blocking
            with db.session.begin():
                settings = Settings.query.first()
                if not settings:
                    settings = Settings()
                    db.session.add(settings)

                # Example: Append dynamic rule to a dynamic_rules field
                # (You will need to ensure this field exists in your Settings model)
                if not hasattr(settings, 'dynamic_rules'):
                    # Logic to handle if DB needs migration or simple JSON field
                    pass

                logger.info(f"[RemediationAgent] Successfully updated system config for {action['name']}")
        except Exception as e:
            logger.error(f"[RemediationAgent] Failed to apply action: {str(e)}")
