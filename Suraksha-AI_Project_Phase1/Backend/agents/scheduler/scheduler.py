import time
import logging
import threading
from agents.communication.message_bus import MessageBus

logger = logging.getLogger('app')

class AgentScheduler(threading.Thread):
    def __init__(self):
        super().__init__()
        self.daemon = True
        self.lock = threading.Lock()
        self.active = False
        
        # Periodic tasks: (task_name, interval_seconds, last_run_timestamp, recipient_agent_id)
        self.tasks = [
            {"name": "cleanup_logs", "interval": 60, "last_run": 0.0, "receiver": "prevention_agent"},
            {"name": "generate_periodic_reports", "interval": 120, "last_run": 0.0, "receiver": "report_agent"},
            {"name": "update_threat_scores", "interval": 45, "last_run": 0.0, "receiver": "threat_intel_agent"},
            {"name": "evaluate_model_performance", "interval": 180, "last_run": 0.0, "receiver": "detection_agent"},
            {"name": "system_health_audit", "interval": 30, "last_run": 0.0, "receiver": "monitoring_agent"}
        ]

    def start_scheduler(self):
        with self.lock:
            if not self.active:
                self.active = True
                self.start()
                logger.info("Agent Scheduler service started.")

    def stop_scheduler(self):
        with self.lock:
            self.active = False
        logger.info("Agent Scheduler service stopped.")

    def run(self):
        time.sleep(5) # Delay initial run for agent initialization
        while self.active:
            now = time.time()
            for task in self.tasks:
                if (now - task["last_run"]) >= task["interval"]:
                    try:
                        logger.info(f"[Scheduler] Triggering periodic task: {task['name']} for {task['receiver']}")
                        
                        # Emit a message on the MessageBus to the respective agent
                        bus = MessageBus()
                        bus.send(
                            sender="scheduler",
                            receiver=task["receiver"],
                            payload={
                                "task": task["name"],
                                "timestamp": now,
                                "scheduled": True
                            },
                            priority="Low"
                        )
                        
                        # Update last run timestamp
                        task["last_run"] = now
                    except Exception as e:
                        logger.error(f"[Scheduler] Failed to trigger task {task['name']}: {str(e)}")
            
            time.sleep(1.0)
