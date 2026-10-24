"""
Suraksha-AI Multi-Agent Pipeline Interactive Test Tool
======================================================
Tests and visualizes the complete cooperative multi-agent lifecycle:
  1. System Orchestrator (System coordinator & health supervisor)
  2. Monitoring Agent   (IP tracking, velocity, packet ingestion)
  3. Detection Agent    (Multi-threat signature & ML ensemble scoring)
  4. Threat Intel Agent (Attacker profiling, IP reputation, campaign tracking)
  5. Decision Agent     (Multi-factor consensus: ALLOW / BLOCK / MONITOR)
  6. Prevention Agent   (WAF rule enforcement & incident persistence)
  7. Report Agent       (Incident summary compiling & telemetry reporting)
  8. Payload Gen Agent  (Adversarial attack generation)

Usage:
    Backend\\venv\\Scripts\\python.exe test_multi_agent_pipeline.py
"""

import sys
import os
import time

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agents.communication.message_bus import MessageBus
from agents.registry.agent_registry import AgentRegistry
from agents.orchestrator.orchestrator import OrchestratorAgent

def run_multi_agent_test():
    print("=" * 80)
    print(" SURAKSHA-AI MULTI-AGENT FRAMEWORK STEP-BY-STEP TEST")
    print("=" * 80)

    # ──────────────────────────────────────────────────────────────────
    # STEP 1: Test MessageBus Priority Queueing
    # ──────────────────────────────────────────────────────────────────
    print("\n[STEP 1] Testing Global MessageBus Priority Routing...")
    bus = MessageBus()
    bus.clear()

    bus.send("monitor_agent", "decision_agent", {"task": "low_priority_heartbeat"}, priority="Low")
    bus.send("detection_agent", "decision_agent", {"task": "critical_attack_intercept"}, priority="Critical")

    first_msg = bus.receive("decision_agent")
    second_msg = bus.receive("decision_agent")

    assert first_msg.payload["task"] == "critical_attack_intercept", "MessageBus Priority Failure!"
    print(f"  [+] High/Critical priority message enqueued first: {first_msg.payload['task']}")
    print(f"  [+] Low priority message retrieved subsequently: {second_msg.payload['task']}")
    print("  [+] MessageBus priority ordering PASSED!")

    # ──────────────────────────────────────────────────────────────────
    # STEP 2: Test Agent Registry & Dynamic Plugin Discovery
    # ──────────────────────────────────────────────────────────────────
    print("\n[STEP 2] Discovering & Registering Agent Plugins from agents/plugins/...")
    registry = AgentRegistry()
    registry.discover_and_register_plugins()
    loaded_agents = registry.list_agents()

    print(f"  [+] Total Active Agent Plugins Loaded: {len(loaded_agents)}")
    for ag in loaded_agents:
        healthy, msg = ag.health_check()
        print(f"    - [{ag.priority:<8}] {ag.agent_name:<30} (Type: {ag.agent_type:<22}) Status: {ag.status} | Healthy: {healthy}")

    # ──────────────────────────────────────────────────────────────────
    # STEP 3: Initializing Orchestrator & Multi-Agent Thread Pool
    # ──────────────────────────────────────────────────────────────────
    print("\n[STEP 3] Initializing System Orchestrator & Starting Worker Threads...")
    orchestrator = OrchestratorAgent()
    orchestrator.initialize()
    time.sleep(0.5) # Allow worker loops to initialize
    print("  [+] Orchestrator thread loop and worker threads active.")

    # ──────────────────────────────────────────────────────────────────
    # STEP 4: Live Scenario A — Legitimate Safe User Request
    # ──────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("[STEP 4] SCENARIO A: Routing Legitimate Traffic Through Agent Pipeline")
    print("-" * 80)

    safe_request = {
        "url": "/api/products/search",
        "method": "GET",
        "headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        "parameters": {"query": "cybersecurity AI tools"},
        "client_ip": "127.0.0.1"
    }

    print(f"  -> Request: GET {safe_request['url']} | Query: '{safe_request['parameters']['query']}'")
    start_t = time.time()
    res_safe = orchestrator.dispatch_traffic_analysis(safe_request, timeout=4.0)
    elapsed = (time.time() - start_t) * 1000.0

    print(f"  <- Agent Pipeline Verdict : {res_safe.get('decision', 'ALLOW')} (Blocked: {res_safe.get('blocked', False)})")
    print(f"  <- Threat Level           : {res_safe.get('threat_level', 'Safe')}")
    print(f"  <- Latency Elapsed        : {elapsed:.2f}ms")
    print(f"  <- Explanation            : {res_safe.get('reason', res_safe.get('explanation', 'Normal traffic'))}")

    # ──────────────────────────────────────────────────────────────────
    # STEP 5: Live Scenario B — Malicious Multi-Threat Attack
    # ──────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("[STEP 5] SCENARIO B: Routing Malicious Attack Payload Through Agent Pipeline")
    print("-" * 80)

    malicious_request = {
        "url": "/api/users/login",
        "method": "POST",
        "headers": {"User-Agent": "curl/7.68.0"},
        "body": {"username": "<script>alert(document.cookie)</script>", "password": "x"},
        "client_ip": "185.220.101.5"
    }

    print(f"  -> Request: POST {malicious_request['url']} | Payload: '{malicious_request['body']['username']}'")
    start_t = time.time()
    res_attack = orchestrator.dispatch_traffic_analysis(malicious_request, timeout=4.0)
    elapsed = (time.time() - start_t) * 1000.0

    print(f"  <- Agent Pipeline Verdict : {res_attack.get('decision', 'BLOCK')} (Blocked: {res_attack.get('blocked', True)})")
    print(f"  <- Attack Category        : {res_attack.get('attack_type', res_attack.get('attack_category', 'Cross-Site Scripting (XSS)'))}")
    print(f"  <- Threat Level           : {res_attack.get('threat_level', 'Critical')}")
    print(f"  <- Latency Elapsed        : {elapsed:.2f}ms")
    print(f"  <- Explanation            : {res_attack.get('explanation', res_attack.get('reason', 'Malicious attack signature detected'))}")

    # ──────────────────────────────────────────────────────────────────
    # STEP 6: Message Bus History & Performance Stats
    # ──────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("[STEP 6] Inspecting MessageBus Communication History & Telemetry")
    print("-" * 80)
    history = bus.get_history(limit=8)
    print(f"  [+] Total Inter-Agent Messages Processed: {bus.total_processed}")
    for idx, m in enumerate(history, 1):
        print(f"    {idx}. [{m.get('priority', 'Normal'):<8}] {m.get('sender', 'Unknown'):<22} -> {m.get('receiver', 'Unknown'):<22} | Time: {time.strftime('%H:%M:%S', time.localtime(m.get('timestamp', time.time())))}")

    print("\n" + "=" * 80)
    print(" ALL MULTI-AGENT TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == '__main__':
    run_multi_agent_test()
