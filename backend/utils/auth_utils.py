from flask import jsonify
from flask_login import current_user, login_required
from functools import wraps

def format_phone(phone_number):
    if phone_number.startswith('0'):
        phone_number = '+63' + phone_number[1:]
        
    return phone_number

# RBAC decorator
def role_required(allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @login_required
        def wrapper(*args, **kwargs):
            # Convert single role to list for consistent handling
            roles = [allowed_roles] if isinstance(allowed_roles, str) else allowed_roles
            
            if current_user.role not in roles:
                return jsonify({
                    'message': 'Access forbidden. Insufficient permissions.'
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator