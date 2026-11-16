from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from app.config.config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)

    from app.routes.account_routes import account_bp
    app.register_blueprint(account_bp, url_prefix='/api/accounts')

    @app.route('/health')
    def health_check():
        return {"status": "AccountService is healthy"}, 200

    return app
