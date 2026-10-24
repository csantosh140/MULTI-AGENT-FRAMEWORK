# Suraksha-AI Multi-Agent AI Framework

This directory houses the stateful, multi-threaded, and message-driven Multi-Agent AI Cybersecurity Framework for the Suraksha-AI platform.

---

## 1. Directory Structure

```text
Backend/agents/
├── base/
│   └── base_agent.py          # BaseAgent parent class inheriting from Thread
├── communication/
│   └── message_bus.py         # Thread-safe Singleton priority MessageBus
├── memory/
│   └── agent_memory.py        # Short-term and long-term memory buffers
├── registry/
│   └── agent_registry.py      # Config-driven dynamic plugin auto-loader
├── scheduler/
│   └── scheduler.py           # Periodic background task dispatcher
├── orchestrator/
│   └── orchestrator.py        # System coordinator & health supervisor
├── plugins/                   # Folder containing agent plugins
│   ├── monitoring_agent.py
│   ├── detection_agent.py
│   ├── threat_intel_agent.py
│   ├── decision_agent.py
│   ├── prevention_agent.py
│   ├── report_agent.py
│   └── payload_generator_agent.py
└── config.json                # Enabled list and priorities configuration
```

---

## 2. Base Agent Class

Every agent inherits from `BaseAgent` (`agents/base/base_agent.py`), which subclassess `threading.Thread`.
*   **Properties**: `agent_id`, `agent_name`, `agent_type`, `status` (Stopped, Initializing, Active, Failed), `priority` (Critical, High, Medium, Low), `version`.
*   **Methods**:
    *   `initialize()`: Runs startup procedures.
    *   `execute(message)`: Overridden by subclass to implement custom agent logic.
    *   `receive()`: Pulls a pending message addressed to this agent from the bus.
    *   `send(receiver, payload, priority)`: Enqueues a message to the recipient agent.
    *   `heartbeat()`: Updates the last active timestamp.
    *   `health_check()`: Verifies operational state and heartbeat freshness.
    *   `shutdown()`: Safe termination of thread worker loop.

---

## 3. Communication Bus

Agents communicate **only** by exchanging prioritised `AgentMessage` objects over the global `MessageBus` (`agents/communication/message_bus.py`).
*   **Thread-Safety**: Governed by a mutual exclusion lock (`threading.Lock`) over a central registry of queues.
*   **Prioritization**: Enqueues `Critical` and `High` messages to the front of agent queues, ensuring rapid execution.

---

## 4. Memory System

Each agent maintains local instance state inside `AgentMemory` (`agents/memory/agent_memory.py`):
*   **Short-Term Memory**: Stores recent task names, states, and the last 100 received messages.
*   **Long-Term Memory**: Stores historical security incidents, campaign records, reputation trends, and bypass rules.

---

## 5. Dynamic Plugin System

Adding a new agent is purely file-based:
1. Create your python agent file under `agents/plugins/` (e.g. `analytics_agent.py`).
2. Implement your class inheriting from `BaseAgent`.
3. Add the agent ID to the `enabled_agents` array in `agents/config.json`.
4. The `AgentRegistry` scans, dynamically imports, instantiates, and executes the thread upon server restart or configuration reload.

---

## 6. Threat Containment Workflow

```text
Incoming Request 
       ↓
Monitoring Agent          (Tracks IP frequencies and triggers analysis)
       ↓
Detection Agent           (Invokes Rule engine + ML Ensemble predictors)
       ↓
Threat Intelligence Agent (Correlates attacker strikes & campaign footprints)
       ↓
Decision Agent            (Determines ALLOW, BLOCK, MONITOR, or ESCALATE)
       ↓
Prevention Agent          (Enforces firewall actions and writes SQL logs)
       ↓
Report Agent              (Compiles incident timelines and CSV summaries)
       ↓
System Orchestrator       (Resolves final transaction verdict & updates dashboard)
```
