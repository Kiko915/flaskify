import os
from datetime import datetime
from models import db, create_app, Users, AdminInfo
from werkzeug.security import generate_password_hash

# Initialize the Flask app context
app = create_app()
app.app_context().push()

def create_admin_user(first_name, last_name, username, email, phone, password):
    try:
        # Check if the user already exists
        existing_user = Users.query.filter_by(email=email).first()
        if existing_user:
            print(f"User with email {email} already exists.")
            return

        # Create a new admin user in the Users table
        new_user = Users(
            first_name=first_name,
            last_name=last_name,
            username=username,
            email=email,
            phone=phone,
            role="Admin"
        )
        new_user.password_hash = generate_password_hash(password, method='pbkdf2')
        db.session.add(new_user)
        db.session.commit()

        # Create a corresponding entry in AdminInfo table
        admin_info = AdminInfo(
            admin_id=new_user.user_uuid,
            admin_email=new_user.email,
            admin_name=f"{new_user.first_name} {new_user.last_name}",
            role="super_admin",  # Customize the role as needed
            created_at=datetime.now(),
            last_login=datetime.now()
        )
        db.session.add(admin_info)
        db.session.commit()

        print(f"Admin user '{username}' created successfully.")

    except Exception as e:
        db.session.rollback()
        print("Error creating admin user:", e)

# User input for admin details
first_name = input("Enter first name: ")
last_name = input("Enter last name: ")
username = input("Enter username: ")
email = input("Enter email: ")
phone = input("Enter phone number: ")
password = input("Enter password: ")

# Call the function to create the admin user
create_admin_user(first_name, last_name, username, email, phone, password)
