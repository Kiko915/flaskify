from dotenv import load_dotenv
import os
from cloudinary import config
from datetime import timedelta

load_dotenv()

class Config:
    """Base configuration."""
    # Secret key
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///flaskify.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Mail settings
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME')  # Use the same Gmail address as sender
    
    # Upload settings
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # CORS settings
    CORS_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]

    # Session configuration
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_NAME = 'flaskify_session'
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour
    REMEMBER_COOKIE_DURATION = timedelta(days=7)  # 7 days for remember me
    REMEMBER_COOKIE_SECURE = False  # Set to True in production with HTTPS
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = 'Lax'
    REMEMBER_COOKIE_NAME = 'flaskify_remember'

    # Cloudinary configuration
    config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )