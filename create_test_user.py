from taxiapp import app, db
from taxiapp.models import User

def create_test_user():
    with app.app_context():
        # Check if test user already exists
        if not User.query.filter_by(username='test').first():
            test_user = User(
                username='test',
                email='test@example.com',
                password='password'  # In production, use password hashing
            )
            db.session.add(test_user)
            db.session.commit()
            print("Test user created successfully!")
        else:
            print("Test user already exists.")

if __name__ == "__main__":
    create_test_user() 