from __init__ import create_app, db
from utils.otp_cleanup import cleanup_expired_otps

app = create_app()

with app.app_context():
    cleanup_expired_otps()
    

if __name__ == '__main__':
    app.run(debug=True, port=5555)
