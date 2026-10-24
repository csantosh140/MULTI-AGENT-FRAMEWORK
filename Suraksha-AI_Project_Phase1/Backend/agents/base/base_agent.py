import time
import logging
import uuid
import threading
from agents.memory.agent_memory import AgentMemory

logger = logging.getLogger('app')

class BaseAgent(threading.Thread):
    def __init__(self, agent_id=None, agent_name=None, agent_type=None, priority="Medium", version="1.0.0"):
        super().__init__()
        self.agent_id = agent_id or str(uuid.uuid4())[:8]
        self.agent_name = agent_name or self.__class__.__name__
        self.agent_type = agent_type or "Generic"
        self.priority = priority
        self.version = version
        
        self.status = "Stopped" # Stopped, Initializing, Active, Failed, Disabled
        self.last_heartbeat = time.time()
        self.messages_processed = 0
        self.total_execution_time = 0.0
        self.current_task = None
        
        # Instantiate agent memory system
        self.memory = AgentMemory(limit=100)
        
        # Thread event control
        self._stop_event = threading.Event()
        self.daemon = True # Allow main process to exit clean

    def initialize(self):
        """Prepares agent connections, memory caches, and sets status to Active."""
        self.status = "Initializing"
        logger.info(f"Agent {self.agent_name} ({self.agent_id}) is initializing...")
        self.status = "Active"
        self.last_heartbeat = time.time()

    def receive(self):
        """Pulls next message addressed to this agent from the global Message Bus."""
        from agents.communication.message_bus import MessageBus
        bus = MessageBus()
        msg = bus.receive(self.agent_id)
        if msg:
            self.memory.add_short_term_message(msg)
        return msg

    def send(self, receiver, payload, priority="Medium"):
        """Publishes a message to the global Message Bus."""
        from agents.communication.message_bus import MessageBus
        bus = MessageBus()
        return bus.send(
            sender=self.agent_id,
            receiver=receiver,
            payload=payload,
            priority=priority
        )

    def execute(self, message):
        """
        Executes action logic based on the received message. 
        Must be overridden by child classes.
        """
        logger.warning(f"Agent {self.agent_name} received execution fallback. Message: {message}")
        return None

    def run(self):
        """Asynchronous execution loop reading and executing incoming messages."""
        self.initialize()
        logger.info(f"Agent {self.agent_name} background worker loop started.")
        
        while not self._stop_event.is_set():
            if self.status != "Active":
                time.sleep(0.5)
                continue
                
            try:
                msg = self.receive()
                if msg:
                    t_start = time.perf_counter()
                    self.current_task = msg.payload.get("task", "generic_task")
                    
                    logger.info(f"[{self.agent_name}] Executing task: {self.current_task}")
                    
                    # Execute subclass implementation
                    self.execute(msg)
                    
                    # Track performance parameters
                    duration = time.perf_counter() - t_start
                    self.total_execution_time += duration
                    self.messages_processed += 1
                    self.current_task = None
                    self.last_heartbeat = time.time()
                    
            except Exception as e:
                logger.exception(f"Error in agent {self.agent_name} loop: {str(e)}")
                self.status = "Failed"
                
            time.sleep(0.005)

    def shutdown(self):
        """Stops the background execution thread."""
        logger.info(f"Shutting down agent {self.agent_name}...")
        self._stop_event.set()
        self.status = "Stopped"

    def heartbeat(self):
        """Updates last_heartbeat timestamp and outputs heartbeat state."""
        self.last_heartbeat = time.time()
        return self.last_heartbeat

    def health_check(self):
        """Verifies if the agent is healthy (not failed and heartbeat is fresh)."""
        if self.status == "Failed":
            return False, "Agent status is Failed."
        
        # If active but no heartbeat for > 15 seconds, raise concern
        if self.status == "Active" and (time.time() - self.last_heartbeat) > 15.0:
            return False, "Heartbeat is stale."
            
        return True, "Healthy"
