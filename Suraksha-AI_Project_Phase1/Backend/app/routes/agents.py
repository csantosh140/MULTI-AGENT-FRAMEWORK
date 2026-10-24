import logging
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.utils.helpers import json_response
from agents.orchestrator.orchestrator import OrchestratorAgent
from agents.registry.agent_registry import AgentRegistry
from agents.communication.message_bus import MessageBus

logger = logging.getLogger('app')
agents_bp = Blueprint('agents', __name__)

@agents_bp.route('/agents', methods=['GET'])
@agents_bp.route('/agents/status', methods=['GET'])
@jwt_required()
def get_agents():
    """
    GET /api/agents or /api/agents/status
    Retrieves status, health, priority, and message processing stats for all agents.
    """
    registry = AgentRegistry()
    orchestrator = OrchestratorAgent()
    
    agent_list = []
    
    # 1. Include Orchestrator
    o_healthy, o_msg = orchestrator.health_check()
    agent_list.append({
        "id": orchestrator.agent_id,
        "name": orchestrator.agent_name,
        "type": orchestrator.agent_type,
        "status": orchestrator.status,
        "priority": orchestrator.priority,
        "version": orchestrator.version,
        "messages_processed": orchestrator.messages_processed,
        "average_execution_time": round(
            (orchestrator.total_execution_time / orchestrator.messages_processed * 1000.0) 
            if orchestrator.messages_processed > 0 else 0.0, 2
        ),
        "healthy": o_healthy,
        "health_msg": o_msg,
        "active_task": orchestrator.current_task or "None"
    })
    
    # 2. Include Registry Agents
    for agent in registry.list_agents():
        healthy, msg = agent.health_check()
        avg_time = (agent.total_execution_time / agent.messages_processed * 1000.0) if agent.messages_processed > 0 else 0.0
        
        agent_list.append({
            "id": agent.agent_id,
            "name": agent.agent_name,
            "type": agent.agent_type,
            "status": agent.status,
            "priority": agent.priority,
            "version": agent.version,
            "messages_processed": agent.messages_processed,
            "average_execution_time": round(avg_time, 2),
            "healthy": healthy,
            "health_msg": msg,
            "active_task": agent.current_task or "None"
        })
        
    return json_response(
        success=True,
        message="Agent metadata retrieved successfully.",
        data=agent_list,
        status_code=200
    )

@agents_bp.route('/agents/tasks', methods=['GET'])
@jwt_required()
def get_agent_tasks():
    """
    GET /api/agents/tasks
    Retrieves the queue size and recently processed messages timeline.
    """
    bus = MessageBus()
    data = {
        "queue_size": bus.get_queue_size(),
        "total_processed": bus.total_processed,
        "recent_messages": bus.get_history(limit=50)
    }
    return json_response(
        success=True,
        message="Agent tasks and message bus timeline retrieved.",
        data=data,
        status_code=200
    )

@agents_bp.route('/agents/restart', methods=['POST'])
@jwt_required()
def restart_agent():
    """
    POST /api/agents/restart
    Restarts a specific agent thread on demand.
    """
    body = request.get_json() or {}
    agent_id = body.get("agent_id")
    
    if not agent_id:
        return json_response(success=False, message="agent_id is required.", status_code=400)
        
    orchestrator = OrchestratorAgent()
    
    if agent_id == "orchestrator":
        # Cannot restart orchestrator from its own API safely
        return json_response(success=False, message="Cannot restart Orchestrator via REST API.", status_code=400)
        
    success = orchestrator.restart_agent(agent_id)
    if success:
        return json_response(success=True, message=f"Agent {agent_id} thread successfully restarted.", status_code=200)
    else:
        return json_response(success=False, message=f"Failed to restart agent {agent_id}.", status_code=500)

@agents_bp.route('/agents/enable', methods=['POST'])
@jwt_required()
def enable_agent():
    """
    POST /api/agents/enable
    Enables a disabled agent plugin dynamically.
    """
    body = request.get_json() or {}
    agent_id = body.get("agent_id")
    
    if not agent_id:
        return json_response(success=False, message="agent_id is required.", status_code=400)
        
    registry = AgentRegistry()
    config = registry.load_config()
    
    enabled = config.get("enabled_agents", [])
    disabled = config.get("disabled_agents", [])
    
    if agent_id in disabled:
        disabled.remove(agent_id)
    if agent_id not in enabled:
        enabled.append(agent_id)
        
    config["enabled_agents"] = enabled
    config["disabled_agents"] = disabled
    
    if registry.save_config(config):
        # Trigger reload of plugins
        orchestrator = OrchestratorAgent()
        orchestrator.initialize() # Reload and restart threads
        return json_response(success=True, message=f"Agent {agent_id} enabled dynamically.", status_code=200)
        
    return json_response(success=False, message="Failed to save agent configuration.", status_code=500)

@agents_bp.route('/agents/disable', methods=['POST'])
@jwt_required()
def disable_agent():
    """
    POST /api/agents/disable
    Disables an active agent plugin dynamically.
    """
    body = request.get_json() or {}
    agent_id = body.get("agent_id")
    
    if not agent_id:
        return json_response(success=False, message="agent_id is required.", status_code=400)
        
    registry = AgentRegistry()
    config = registry.load_config()
    
    enabled = config.get("enabled_agents", [])
    disabled = config.get("disabled_agents", [])
    
    if agent_id in enabled:
        enabled.remove(agent_id)
    if agent_id not in disabled:
        disabled.append(agent_id)
        
    config["enabled_agents"] = enabled
    config["disabled_agents"] = disabled
    
    if registry.save_config(config):
        # Shut down active instance if running
        agent = registry.get_agent(agent_id)
        if agent:
            agent.shutdown()
            
        # Reload plugins
        orchestrator = OrchestratorAgent()
        orchestrator.initialize()
        return json_response(success=True, message=f"Agent {agent_id} disabled dynamically.", status_code=200)
        
    return json_response(success=False, message="Failed to save agent configuration.", status_code=500)
