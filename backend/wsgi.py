from flask import Flask
from flask_mail import Mail
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from models import db, Users, Role
from config import Config

mail = Mail()
migrate = Migrate()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    
    # Load configuration from Config class
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS with credentials support
    CORS(app, supports_credentials=True, resources={
        r"/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(user_uuid):
        return Users.query.get(user_uuid)

    # Register blueprints
    from routes import main
    app.register_blueprint(main)

    from auth import auth
    app.register_blueprint(auth)

    from profile import profile_bp
    app.register_blueprint(profile_bp)

    from seller import seller
    app.register_blueprint(seller)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5555)