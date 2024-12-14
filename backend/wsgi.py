from flask import Flask, jsonify, request
from flask_mail import Mail
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from models import db, Users, Role
from config import Config
from uploads import uploads
from scheduler import init_scheduler
from featured_products import featured_products
from newsletter import newsletter, init_mail
from banners import banners
from checkout import checkout
from orders import orders
from seller_finance import seller_finance

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
    
    # Initialize the scheduler
    with app.app_context():
        init_scheduler(app)
    
    # Configure CORS with credentials support
    CORS(app, 
         resources={
             r"/*": {
                 "origins": ["http://localhost:5173"],
                 "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
                 "expose_headers": ["Content-Type", "Authorization", "Location"],
                 "supports_credentials": True,
                 "max_age": 120
             }
         },
         supports_credentials=True
    )
    
    # Configure login manager
    login_manager.init_app(app)
    login_manager.login_view = None  # Disable redirect
    login_manager.session_protection = 'strong'

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({
            "message": "Session expired. Please log in again.",
            "status": "error",
            "code": "SESSION_EXPIRED"
        }), 401

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

    from products import products
    app.register_blueprint(products)

    from categories import categories
    app.register_blueprint(categories)

    from uploads import uploads
    app.register_blueprint(uploads)

    from shipping import shipping
    app.register_blueprint(shipping)

    from featured_products import featured_products
    app.register_blueprint(featured_products)

    from wishlist import wishlist_bp
    app.register_blueprint(wishlist_bp)

    from cart import cart_bp
    app.register_blueprint(cart_bp)

    # Initialize mail for newsletter and register blueprint
    init_mail(mail)
    app.register_blueprint(newsletter)

    from contact import contact
    app.register_blueprint(contact)

    # Register banners blueprint
    app.register_blueprint(banners)

    # Register checkout blueprint
    app.register_blueprint(checkout)

    # Register orders blueprint
    app.register_blueprint(orders)

    # Register admin blueprint
    from admin import admin
    app.register_blueprint(admin)

    # Register chat blueprint
    from chat import chat
    app.register_blueprint(chat, url_prefix='/api')

    # Register seller finance blueprint
    app.register_blueprint(seller_finance, url_prefix='/api')

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5555)
