from dotenv import load_dotenv
import os
from cloudinary import config

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY')
    MAIL_SERVER = 'smtp.gmail.com'
    #MAIL_SERVER = 'sandbox.smtp.mailtrap.io'
    MAIL_PORT = 587
    #MAIL_PORT = 2525    
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    #MAIL_USERNAME = 'ca0a8fb76ac6d3'
    MAIL_PASSWORD = 'cqel hbun keid yidv'
    #MAIL_PASSWORD = 'd326df77ab9430'
    MAIL_USE_SSL = False

    # Cloudinary configuration
    config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )