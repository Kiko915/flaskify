from dotenv import load_dotenv
import os
from cloudinary import config

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY')
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'francismistica06@gmail.com'
    MAIL_PASSWORD = 'cqel hbun keid yidv'
    MAIL_USE_SSL = False

    # Twilio configuration
    account_sid = 'AC0afab8bdaf61803f416c955a399afe4f'
    auth_token = '31425bf65bf994ef4927cc35b7a3ad9e'
    twilio_phone_number = '+1 706 685 6398'

    # Cloudinary configuration
    config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )