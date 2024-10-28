from datetime import datetime
from __init__ import db
from __init__ import OTP

def cleanup_expired_otps():
    """
    Deletes OTP records from the database that have expired.
    """
    try:
        # Current time to compare with the expiration time of each OTP
        current_time = datetime.now()
        
        # Query all OTPs that are expired
        expired_otps = OTP.query.filter(OTP.expires_at < current_time).all()
        print(expired_otps)
        
        # Delete each expired OTP
        for otp in expired_otps:
            db.session.delete(otp)
        
        # Commit the changes to the database
        db.session.commit()
        print(f"Cleanup complete. Deleted {len(expired_otps)} expired OTP(s).")
        
    except Exception as e:
        # Rollback in case of any exception
        db.session.rollback()
        print(f"An error occurred during OTP cleanup: {e}")

cleanup_expired_otps()