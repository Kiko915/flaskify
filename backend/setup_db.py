from __init__ import db, create_app

app = create_app()

with app.app_context():
    db.create_all()
    print('Database tables created')