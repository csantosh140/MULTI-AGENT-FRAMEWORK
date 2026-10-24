from app import create_app
from app.config.settings import Config

app = create_app(Config)

if __name__ == '__main__':
    # Start the server on host 0.0.0.0 to enable network accessibility tests
    app.run(
        host='0.0.0.0',
        port=app.config.get('PORT', 5000),
        debug=app.config.get('DEBUG', True)
    )
