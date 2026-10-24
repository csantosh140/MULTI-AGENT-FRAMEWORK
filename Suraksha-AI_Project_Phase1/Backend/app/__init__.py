import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException

from app.config.settings import Config
from app.utils.helpers import json_response
from app.middleware.logger import setup_logger_middleware
from app.extensions import db, migrate

# Import all models to ensure they register correctly with SQLAlchemy
from app.models import User, AttackLog, LiveRequest, ThreatAnalytics, Report, Payload, Settings

def configure_logging(app):
    """Configures global python logging to output to both console and logs/app.log."""
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, 'app.log')

    # Map text levels to logging constants
    level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'), logging.INFO)

    # Base configuration
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )

    # File Handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)

    # Attach logger handlers
    app_logger = logging.getLogger('app')
    app_logger.setLevel(level)
    app_logger.addHandler(file_handler)
    app_logger.addHandler(console_handler)

    # Prevent logs from propagating to default root logger
    app_logger.propagate = False
    
    app_logger.info("Application logging pipeline initialized successfully.")

def register_blueprints(app):
    """Registers all API route Blueprints with `/api` prefixes."""
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.logs import logs_bp
    from app.routes.monitor import monitor_bp
    from app.routes.reports import reports_bp
    from app.routes.settings import settings_bp
    from app.routes.payload import payload_bp
    from app.routes.detection import detection_bp
    from app.routes.analytics import analytics_bp
    from app.routes.ml import ml_bp
    from app.routes.detection_hybrid import detection_hybrid_bp
    from app.routes.agents import agents_bp
    from app.routes.target import target_bp
    from app.routes.multi_threat import multi_threat_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(logs_bp, url_prefix='/api')
    app.register_blueprint(monitor_bp, url_prefix='/api')
    app.register_blueprint(reports_bp, url_prefix='/api')
    app.register_blueprint(settings_bp, url_prefix='/api')
    app.register_blueprint(payload_bp, url_prefix='/api')
    app.register_blueprint(detection_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(ml_bp, url_prefix='/api')
    app.register_blueprint(detection_hybrid_bp, url_prefix='/api')
    app.register_blueprint(agents_bp, url_prefix='/api')
    app.register_blueprint(target_bp, url_prefix='/api')
    app.register_blueprint(multi_threat_bp, url_prefix='/api')

def setup_error_handlers(app):
    """Registers standardized JSON error handlers for all HTTP and code exceptions."""
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        app_logger = logging.getLogger('app')
        
        # If it's a standard HTTP error, return its code and description
        if isinstance(e, HTTPException):
            app_logger.warning(f"HTTP Exception intercepted: {e.code} - {e.description}")
            return json_response(
                success=False,
                message=e.description,
                status_code=e.code
            )
            
        # For non-HTTP exceptions, log the stack trace and return 500
        app_logger.exception(f"Unhandled system error intercepted: {str(e)}")
        return json_response(
            success=False,
            message="An unexpected server error occurred.",
            status_code=500
        )

def setup_jwt(app):
    """Configures JWTManager with customized standardized response formats."""
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return json_response(
            success=False,
            message="The provided authorization credentials have expired.",
            status_code=401
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return json_response(
            success=False,
            message=f"Invalid authorization signature: {error_string}",
            status_code=401
        )

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return json_response(
            success=False,
            message=f"Authorization access token headers missing: {error_string}",
            status_code=401
        )

def init_db(app):
    """Auto-creates and upgrades the database and runs core seeding operations."""
    app_logger = logging.getLogger('app')
    
    # Resolve absolute path for migrations directory
    migrations_dir = os.path.abspath(os.path.join(app.root_path, '../migrations'))
    
    with app.app_context():
        try:
            # If migrations directory exists, run db upgrade using Flask-Migrate
            if os.path.exists(migrations_dir):
                from flask_migrate import upgrade
                app_logger.info("Executing database schema upgrades via Flask-Migrate...")
                upgrade(directory=migrations_dir)
            else:
                # Direct SQL creation fallback
                app_logger.info("Migrations directory not found. Creating database tables directly...")
                db.create_all()
                
            # Seed default system configurations and initial superuser if not present
            from app.models.settings import Settings
            from app.models.user import User
            from werkzeug.security import generate_password_hash
            
            # Ensure Settings record exists
            if not Settings.query.first():
                settings = Settings()
                db.session.add(settings)
                app_logger.info("Default settings initialized in database.")
                
            # Ensure admin profile exists
            if not User.query.filter_by(email="admin@suraksha.ai").first():
                admin = User(
                    name="Admin Director",
                    email="admin@suraksha.ai",
                    password_hash=generate_password_hash("password123"),
                    role="Level-5 (Superuser)"
                )
                db.session.add(admin)
                app_logger.info("Default admin profile seeded into database.")
                
            db.session.commit()
            app_logger.info("Database bootstrap completed successfully.")
            
        except Exception as e:
            db.session.rollback()
            app_logger.error(f"Database initialization failed: {str(e)}")

def create_app(config_class=Config):
    """Flask application factory configuration."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Setup database and migrations
    db.init_app(app)
    migrate.init_app(app, db, directory=os.path.abspath(os.path.join(app.root_path, '../migrations')))

    # Setup core subsystems
    configure_logging(app)
    setup_jwt(app)
    setup_error_handlers(app)
    setup_logger_middleware(app)
    register_blueprints(app)
    
    # Avoid initializing subsystems twice in Flask debug mode (due to reloader)
    is_main_process = not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true'
    
    if is_main_process:
        # Initialize DB (Auto-creation / Upgrade)
        init_db(app)

        # Initialize ML Prediction Engine models
        try:
            from app.ml.prediction.predict import MLPredictionEngine
            from ai.predictors.ensemble import SQLiEnsemblePredictor
            with app.app_context():
                MLPredictionEngine()
                SQLiEnsemblePredictor()
        except Exception as e:
            app_logger = logging.getLogger('app')
            app_logger.warning(f"ML Hybrid Prediction Engine model preload failed on startup: {str(e)}")

        # Initialize Multi-Agent AI Subsystems
        try:
            from agents.orchestrator.orchestrator import OrchestratorAgent
            orchestrator = OrchestratorAgent()
            orchestrator.initialize(app)
            app_logger = logging.getLogger('app')
            app_logger.info("Multi-Agent AI subsystems and Orchestrator started.")
        except Exception as e:
            app_logger = logging.getLogger('app')
            app_logger.exception(f"Failed to start Orchestrator Agent thread: {str(e)}")
    else:
        app_logger = logging.getLogger('app')
        app_logger.info("Reloader parent process started. Skipping DB/ML/Agent subsystem initialization.")

    app_logger = logging.getLogger('app')
    app_logger.info(f"Suraksha-AI Flask application started in {'DEBUG' if app.debug else 'PRODUCTION'} mode.")

    return app
