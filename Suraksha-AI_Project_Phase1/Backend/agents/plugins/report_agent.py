import time
import os
import logging
from agents.base.base_agent import BaseAgent
from app.extensions import db
from app.models.report import Report
# Removed direct import of app to prevent duplicate execution deadlock

logger = logging.getLogger('app')

class ReportAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="IncidentReportAgent",
            agent_type="report_agent",
            version="1.0.0",
            **kwargs
        )

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "compile_incident":
            transaction_id = payload.get("transaction_id")
            client_ip = payload.get("client_ip")
            decision = payload.get("decision")
            attack_type = payload.get("attack_type")
            confidence = payload.get("confidence")
            severity = payload.get("severity")
            
            incident_data = {
                "transaction_id": transaction_id,
                "client_ip": client_ip,
                "decision": decision,
                "attack_type": attack_type,
                "confidence": confidence,
                "severity": severity,
                "timestamp": time.time()
            }
            # Record in agent memory
            self.memory.add_long_term_attack(incident_data)
            logger.info(f"[ReportAgent] Compiled Incident Timeline for {transaction_id}. Type: {attack_type}.")
            
        elif task == "generate_periodic_reports":
            logger.info("[ReportAgent] Generating periodic CSV/PDF reports.")
            try:
                from app.models.user import User
                from agents.orchestrator.orchestrator import OrchestratorAgent
                app_instance = OrchestratorAgent().app
                if app_instance:
                    with app_instance.app_context():
                        # Check first user to assign report generator FK
                        first_user = User.query.first()
                    user_id = first_user.id if first_user else 1
                    
                    # Create database report entry
                    r_name = f"Suraksha Agentic SOC Report - {int(time.time())}"
                    report = Report(
                        report_name=r_name,
                        report_type="Daily",
                        generated_by=user_id,
                        file_path=f"reports/report_{int(time.time())}.json"
                    )
                    db.session.add(report)
                    db.session.commit()
                    logger.info(f"[ReportAgent] Successfully saved SOC Daily Report: {r_name}")
            except Exception as e:
                logger.error(f"[ReportAgent] Failed to persist report entry: {str(e)}")
