import time
import logging
import threading
from agents.base.base_agent import BaseAgent
from agents.registry.agent_registry import AgentRegistry
from agents.communication.message_bus import MessageBus
from agents.scheduler.scheduler import AgentScheduler

logger = logging.getLogger('app')

class OrchestratorAgent(BaseAgent):
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(OrchestratorAgent, cls).__new__(cls)
                cls._instance._pre_init()
            return cls._instance

    def __init__(self, *args, **kwargs):
        pass

    def _pre_init(self):
        # Initialize BaseAgent fields
        super().__init__(
            agent_id="orchestrator",
            agent_name="SystemOrchestrator",
            agent_type="Orchestrator",
            priority="Critical",
            version="1.0.0"
        )
        self.registry = AgentRegistry()
        self.scheduler = AgentScheduler()
        self.active_transactions = {} # Maps transaction_id -> final verdict dict
        self.lock = threading.Lock()
        self.health_monitor_thread = None
        self.health_active = False
        self.app = None

    def initialize(self, app=None):
        """Discovers, registers, and starts all background agent threads."""
        self.app = app
        super().initialize()
        
        # 1. Discover and load plugins
        self.registry.discover_and_register_plugins()
        
        # 2. Start all enabled agent worker threads
        for agent in self.registry.list_agents():
            try:
                if not agent.is_alive():
                    agent.start()
                    logger.info(f"Worker thread for agent {agent.agent_name} started.")
            except Exception as e:
                logger.error(f"Failed to start worker for {agent.agent_name}: {str(e)}")

        # 3. Start Scheduler
        self.scheduler.start_scheduler()

        # 4. Start Health Monitoring loop
        self.health_active = True
        self.health_monitor_thread = threading.Thread(target=self._health_monitoring_loop, daemon=True)
        self.health_monitor_thread.start()
        logger.info("Orchestrator health monitoring daemon started.")

        # 5. Start Orchestrator's own worker thread
        if not self.is_alive():
            self.start()
            logger.info("Orchestrator background thread started.")


    def execute(self, message):
        """Handles coordination replies and workflow overrides from the message bus."""
        payload = message.payload
        task = payload.get("task")
        
        if task == "verdict_response":
            # Prevention agent has returned a final decision
            transaction_id = payload.get("transaction_id")
            with self.lock:
                self.active_transactions[transaction_id] = payload
            logger.info(f"[Orchestrator] Verdict received for transaction {transaction_id}: {payload.get('decision')}")

    def dispatch_traffic_analysis(self, request_payload, timeout=5.0):
        """
        Dispatches request telemetry into the multi-agent pipeline.
        Waits for the final verdict message.
        """
        import uuid
        transaction_id = str(uuid.uuid4())[:8]
        
        # Initiate state tracker
        with self.lock:
            self.active_transactions[transaction_id] = None

        logger.info(f"[Orchestrator] Dispatching request analysis transaction: {transaction_id}")

        # Send initial message to Monitoring Agent
        self.send(
            receiver="monitoring_agent",
            payload={
                "task": "monitor_request",
                "transaction_id": transaction_id,
                "request": request_payload,
                "timestamp": time.time()
            },
            priority="High"
        )

        # Wait for the Prevention agent to route the verdict back to us via message execution
        t_start = time.time()
        while (time.time() - t_start) < timeout:
            msg = self.receive()
            if msg:
                self.execute(msg)
            with self.lock:
                verdict = self.active_transactions.get(transaction_id)
                if verdict is not None:
                    # Clean up tracker
                    del self.active_transactions[transaction_id]
                    return verdict
            time.sleep(0.02)

        # Time out fallback - return Safe-mode Allow and log warning
        logger.warning(f"[Orchestrator] Request transaction {transaction_id} timed out. Defaulting to ALLOW.")
        with self.lock:
            if transaction_id in self.active_transactions:
                del self.active_transactions[transaction_id]
        
        return {
            "decision": "ALLOW",
            "confidence": 50.0,
            "severity": "Info",
            "explanation": "Agent pipeline evaluation timed out. Fallback safety bypass triggered.",
            "blocked": False
        }

    def restart_agent(self, agent_id):
        """Restarts a specific agent thread on demand."""
        agent = self.registry.get_agent(agent_id)
        if not agent:
            logger.error(f"Cannot restart agent {agent_id}: agent not found.")
            return False
            
        logger.info(f"Restarting agent thread: {agent.agent_name}...")
        try:
            if agent.is_alive():
                agent.shutdown()
                agent.join(timeout=2.0)
            
            # Reload from registry to get a fresh instance
            self.registry.discover_and_register_plugins()
            new_agent = self.registry.get_agent(agent_id)
            if new_agent:
                new_agent.start()
                logger.info(f"Agent {new_agent.agent_name} successfully restarted.")
                return True
        except Exception as e:
            logger.error(f"Failed to restart agent {agent_id}: {str(e)}")
        return False

    def _health_monitoring_loop(self):
        """Periodic loop checking agent heartbeats and reviving failed threads."""
        while self.health_active:
            try:
                for agent in self.registry.list_agents():
                    healthy, msg = agent.health_check()
                    if not healthy:
                        logger.warning(f"[Health Check] Agent {agent.agent_name} is unhealthy: {msg}. Restarting...")
                        self.restart_agent(agent.agent_id)
            except Exception as e:
                logger.error(f"Error in health monitor: {str(e)}")
            time.sleep(5.0)

    def shutdown(self):
        """Safely stops all scheduler, health monitor, and agent worker threads."""
        self.health_active = False
        self.scheduler.stop_scheduler()
        
        for agent in self.registry.list_agents():
            try:
                agent.shutdown()
            except Exception:
                pass
        
        super().shutdown()
        logger.info("System Orchestrator completely shutdown.")
