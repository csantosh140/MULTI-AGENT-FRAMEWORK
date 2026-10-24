import time
import uuid
import threading
from collections import defaultdict

class AgentMessage:
    def __init__(self, sender, receiver, payload, priority="Medium", message_id=None, timestamp=None, status="Pending"):
        self.message_id = message_id or str(uuid.uuid4())[:8]
        self.sender = sender
        self.receiver = receiver
        self.priority = priority # Critical, High, Medium, Low
        self.payload = payload # Dict payload
        self.timestamp = timestamp or time.time()
        self.status = status # Pending, Processing, Completed, Failed

    def to_dict(self):
        return {
            "message_id": self.message_id,
            "sender": self.sender,
            "receiver": self.receiver,
            "priority": self.priority,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "status": self.status
        }

class MessageBus:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(MessageBus, cls).__new__(cls)
                cls._instance.initialize()
            return cls._instance

    def initialize(self):
        self.queues = defaultdict(list) # Maps receiver_id -> list of AgentMessage
        self.message_history = []
        self.lock = threading.Lock()
        self.total_processed = 0

    def send(self, sender, receiver, payload, priority="Medium"):
        """Sends a message to a specific receiver queue with priority sorting."""
        msg = AgentMessage(sender, receiver, payload, priority)
        with self.lock:
            if priority in ["Critical", "High"]:
                self.queues[receiver].insert(0, msg)
            else:
                self.queues[receiver].append(msg)
            self.message_history.append(msg)
            if len(self.message_history) > 500:
                self.message_history.pop(0)
        return msg

    def receive(self, receiver_id):
        """Pulls the next pending message for the given receiver."""
        with self.lock:
            if self.queues[receiver_id]:
                msg = self.queues[receiver_id].pop(0)
                msg.status = "Processing"
                self.total_processed += 1
                return msg
        return None

    def get_history(self, limit=50):
        """Returns the history of passed messages."""
        with self.lock:
            return [msg.to_dict() for msg in reversed(self.message_history[-limit:])]

    def get_queue_size(self):
        """Calculates total pending messages in all queues."""
        with self.lock:
            return sum(len(q) for q in self.queues.values())

    def clear(self):
        """Resets the message queues."""
        with self.lock:
            self.queues.clear()
            self.message_history.clear()
            self.total_processed = 0
