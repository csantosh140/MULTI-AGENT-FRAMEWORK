import unittest
import json
import time
from app import create_app, db
from app.models.user import User
from flask_jwt_extended import create_access_token
from agents.communication.message_bus import MessageBus
from agents.registry.agent_registry import AgentRegistry
from agents.orchestrator.orchestrator import OrchestratorAgent

class TestAgenticAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Build app context
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        
        # Ensure tables exist
        pass
        
        # Create and seed admin user for JWT auth
        from werkzeug.security import generate_password_hash
        cls.admin = User.query.filter_by(email="admin@suraksha.ai").first()
        if not cls.admin:
            cls.admin = User(
                name="Admin Architect",
                email="admin@suraksha.ai",
                password_hash=generate_password_hash("password123"),
                role="Level-5 (Superuser)"
            )
            db.session.add(cls.admin)
            db.session.commit()
            
        cls.token = create_access_token(identity=str(cls.admin.id))
        cls.headers = {
            "Authorization": f"Bearer {cls.token}",
            "Content-Type": "application/json"
        }

    @classmethod
    def tearDownClass(cls):
        # Shutdown orchestrator background threads
        orchestrator = OrchestratorAgent()
        orchestrator.shutdown()
        
        db.session.remove()
        cls.app_context.pop()

    def setUp(self):
        # Clear MessageBus queues
        MessageBus().clear()

    def test_message_bus_delivery(self):
        """Verifies MessageBus queues priorities and delivery."""
        bus = MessageBus()
        # Send lower priority first
        bus.send(sender="test_sender", receiver="test_recv", payload={"val": 1}, priority="Low")
        # Send critical priority second
        bus.send(sender="test_sender", receiver="test_recv", payload={"val": 2}, priority="Critical")
        
        # Critical priority message must be retrieved first!
        msg1 = bus.receive("test_recv")
        self.assertIsNotNone(msg1)
        self.assertEqual(msg1.payload["val"], 2)
        
        msg2 = bus.receive("test_recv")
        self.assertIsNotNone(msg2)
        self.assertEqual(msg2.payload["val"], 1)

    def test_registry_discovery(self):
        """Asserts that all 7 agent plugins are loaded by the registry."""
        registry = AgentRegistry()
        registry.discover_and_register_plugins()
        agents = registry.list_agents()
        
        agent_types = [a.agent_type for a in agents]
        self.assertIn("monitoring_agent", agent_types)
        self.assertIn("detection_agent", agent_types)
        self.assertIn("threat_intel_agent", agent_types)
        self.assertIn("decision_agent", agent_types)
        self.assertIn("prevention_agent", agent_types)
        self.assertIn("report_agent", agent_types)
        self.assertIn("payload_generator_agent", agent_types)

    def test_orchestrator_verdict_workflow(self):
        """Tests that dispatching a request passes through the agents pipeline successfully."""
        orchestrator = OrchestratorAgent()
        # Initialize registers and starts threads
        orchestrator.initialize()
        
        # Test safe payload
        res_safe = orchestrator.dispatch_traffic_analysis({
            "method": "GET",
            "url": "/index.html",
            "headers": {"User-Agent": "Mozilla"},
            "body": {}
        }, timeout=4.0)
        
        self.assertEqual(res_safe["decision"], "ALLOW")
        self.assertFalse(res_safe["blocked"])

        # Test malicious injection payload
        res_blocked = orchestrator.dispatch_traffic_analysis({
            "method": "POST",
            "url": "/login",
            "body": {"username": "admin' OR '1'='1' --"}
        }, timeout=4.0)
        
        # Decision agent must flag this as BLOCK
        self.assertEqual(res_blocked["decision"], "BLOCK")
        self.assertTrue(res_blocked["blocked"])

    def test_agent_rest_apis(self):
        """Tests GET /api/agents and task details."""
        # 1. GET /api/agents
        response = self.client.get('/api/agents', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        
        agents_data = data["data"]
        self.assertTrue(len(agents_data) > 0)
        # Verify Orchestrator exists in the list
        orchestrator_in_list = any(a["type"] == "Orchestrator" for a in agents_data)
        self.assertTrue(orchestrator_in_list)

        # 2. GET /api/agents/tasks
        response = self.client.get('/api/agents/tasks', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        tasks_data = response.get_json()
        self.assertTrue(tasks_data["success"])
        self.assertIn("queue_size", tasks_data["data"])
        self.assertIn("recent_messages", tasks_data["data"])
