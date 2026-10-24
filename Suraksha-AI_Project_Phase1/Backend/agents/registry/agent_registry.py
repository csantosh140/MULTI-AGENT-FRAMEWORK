import os
import json
import importlib
import logging
import threading
from agents.base.base_agent import BaseAgent

logger = logging.getLogger('app')

class AgentRegistry:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(AgentRegistry, cls).__new__(cls)
                cls._instance.initialize()
            return cls._instance

    def initialize(self):
        self.agents = {} # Maps agent_id -> BaseAgent instantiated object
        self.lock = threading.Lock()
        self.config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.json')

    def load_config(self):
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to read agent config: {str(e)}")
        return {}

    def save_config(self, config_data):
        try:
            with open(self.config_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to write agent config: {str(e)}")
            return False

    def register(self, agent_id, agent):
        """Manually registers an agent instance."""
        with self.lock:
            self.agents[agent_id] = agent
            logger.info(f"Manually registered agent: {agent.agent_name} (ID: {agent_id})")

    def discover_and_register_plugins(self):
        """Scans the plugins directory and imports classes inheriting from BaseAgent."""
        config = self.load_config()
        enabled_list = config.get("enabled_agents", [])
        priorities = config.get("priorities", {})
        
        plugins_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'plugins')
        if not os.path.exists(plugins_dir):
            os.makedirs(plugins_dir, exist_ok=True)
            # Create an __init__.py inside plugins to make it an importable package
            init_file = os.path.join(plugins_dir, '__init__.py')
            if not os.path.exists(init_file):
                with open(init_file, 'w') as f:
                    f.write('')
            return

        # Double check __init__.py exists
        init_file = os.path.join(plugins_dir, '__init__.py')
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('')

        with self.lock:
            # Shutdown active agents before reloading
            for agent in self.agents.values():
                try:
                    if agent.is_alive():
                        agent.shutdown()
                except Exception:
                    pass
            self.agents.clear()

            # Iterate over files in plugins folder
            for filename in os.listdir(plugins_dir):
                if filename.endswith('.py') and not filename.startswith('__'):
                    module_name = filename[:-3]
                    
                    # Verify if this agent type is enabled in config
                    if enabled_list and module_name not in enabled_list:
                        logger.info(f"Agent plugin {module_name} is disabled via config. Skipping.")
                        continue
                        
                    try:
                        # Dynamic import from agents.plugins
                        module_path = f"agents.plugins.{module_name}"
                        module = importlib.import_module(module_path)
                        
                        # Reload to grab recent edits if any
                        importlib.reload(module)
                        
                        # Inspect classes in module
                        for attr_name in dir(module):
                            attr = getattr(module, attr_name)
                            if (isinstance(attr, type) and 
                                issubclass(attr, BaseAgent) and 
                                attr is not BaseAgent):
                                
                                # Set priority from config
                                priority = priorities.get(module_name, "Medium")
                                
                                # Instantiate the Agent class
                                agent_instance = attr(
                                    agent_id=module_name,
                                    priority=priority
                                )
                                
                                self.agents[module_name] = agent_instance
                                logger.info(f"Registered Agent Plugin: {attr_name} (ID: {module_name}, Priority: {priority})")
                                break
                    except Exception as e:
                        logger.exception(f"Failed to register plugin {module_name}: {str(e)}")

    def get_agent(self, agent_id):
        with self.lock:
            return self.agents.get(agent_id)

    def list_agents(self):
        with self.lock:
            return list(self.agents.values())
