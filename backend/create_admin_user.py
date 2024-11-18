import os
import re
from datetime import datetime
from models import db, Users, AdminInfo
from wsgi import create_app
from werkzeug.security import generate_password_hash
from getpass import getpass

# Initialize the Flask app context
app = create_app()
app.app_context().push()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    pattern = r'^\+?[0-9]{10,15}$'
    return re.match(pattern, phone) is not None

def validate_password(password):
    """
    Validate password strength
    - At least 8 characters
    - Contains uppercase and lowercase
    - Contains numbers
    - Contains special characters
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    return True, "Password is valid"

def create_admin_user(first_name, last_name, username, email, phone, password):
    """Create a new admin user with validation"""
    try:
        # Input validation
        if not all([first_name, last_name, username, email, phone, password]):
            raise ValueError("All fields are required")

        if not validate_email(email):
            raise ValueError("Invalid email format")

        if not validate_phone(phone):
            raise ValueError("Invalid phone number format")

        is_valid_password, password_message = validate_password(password)
        if not is_valid_password:
            raise ValueError(password_message)

        # Check if user already exists
        if Users.query.filter(
            (Users.email == email) | 
            (Users.username == username) |
            (Users.phone == phone)
        ).first():
            raise ValueError("User with this email, username, or phone already exists")

        # Create new admin user
        new_user = Users(
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            username=username.strip(),
            email=email.lower().strip(),
            phone=phone.strip(),
            role="Admin"
        )
        new_user.password_hash = generate_password_hash(password, method='pbkdf2:sha256:260000')
        db.session.add(new_user)
        db.session.flush()  # Get the user_uuid without committing

        # Create admin info
        admin_info = AdminInfo(
            admin_id=new_user.user_uuid,
            admin_email=new_user.email,
            admin_name=f"{new_user.first_name} {new_user.last_name}",
            role="super_admin",
            created_at=datetime.now(),
            last_login=datetime.now()
        )
        db.session.add(admin_info)
        db.session.commit()

        print("\nAdmin user created successfully:")
        print(f"Username: {username}")
        print(f"Email: {email}")
        print(f"Role: super_admin")
        return True

    except ValueError as ve:
        print(f"\nValidation Error: {str(ve)}")
        db.session.rollback()
        return False
    except Exception as e:
        print(f"\nError creating admin user: {str(e)}")
        db.session.rollback()
        return False

def main():
    """Main function to handle user input and creation"""
    print("\n=== Create Admin User ===\n")
    
    try:
        first_name = input("Enter first name: ").strip()
        last_name = input("Enter last name: ").strip()
        username = input("Enter username: ").strip()
        email = input("Enter email: ").strip()
        phone = input("Enter phone number: ").strip()
        
        # Use getpass for password input (hidden input)
        while True:
            password = getpass("Enter password: ")
            confirm_password = getpass("Confirm password: ")
            
            if password != confirm_password:
                print("Passwords don't match. Please try again.")
                continue
                
            is_valid, message = validate_password(password)
            if not is_valid:
                print(f"Invalid password: {message}")
                continue
                
            break

        if create_admin_user(first_name, last_name, username, email, phone, password):
            print("\nAdmin user creation completed successfully!")
        else:
            print("\nFailed to create admin user. Please try again.")

    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    main()