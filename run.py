from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-dev-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///taxiapp.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Google Maps API key
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')

# Initialize database
db = SQLAlchemy(app)

# Initialize login manager
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    
    def __repr__(self):
        return f'<User {self.username}>'

# Ride model
class Ride(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pickup_lat = db.Column(db.Float, nullable=False)
    pickup_lng = db.Column(db.Float, nullable=False)
    destination_lat = db.Column(db.Float, nullable=False)
    destination_lng = db.Column(db.Float, nullable=False)
    pickup_address = db.Column(db.String(200), nullable=False)
    destination_address = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='pending')
    fare = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    user = db.relationship('User', backref=db.backref('rides', lazy=True))
    
    def __repr__(self):
        return f'<Ride {self.id}>'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    return render_template('index.html', google_maps_api_key=GOOGLE_MAPS_API_KEY)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.password == password:  # In production, use proper password hashing
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

@app.route('/rides')
@login_required
def rides():
    user_rides = Ride.query.filter_by(user_id=current_user.id).order_by(Ride.created_at.desc()).all()
    return render_template('rides.html', rides=user_rides)

@app.route('/book_ride', methods=['POST'])
@login_required
def book_ride():
    pickup_lat = request.form.get('pickup_lat')
    pickup_lng = request.form.get('pickup_lng')
    destination_lat = request.form.get('destination_lat')
    destination_lng = request.form.get('destination_lng')
    pickup_address = request.form.get('pickup_address')
    destination_address = request.form.get('destination_address')
    fare = request.form.get('fare')
    
    # Create new ride
    new_ride = Ride(
        user_id=current_user.id,
        pickup_lat=float(pickup_lat),
        pickup_lng=float(pickup_lng),
        destination_lat=float(destination_lat),
        destination_lng=float(destination_lng),
        pickup_address=pickup_address,
        destination_address=destination_address,
        fare=float(fare),
        status='pending'
    )
    
    db.session.add(new_ride)
    db.session.commit()
    
    return redirect(url_for('ride_confirmation', ride_id=new_ride.id))

@app.route('/ride_confirmation/<int:ride_id>')
@login_required
def ride_confirmation(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    
    # Make sure the ride belongs to the current user
    if ride.user_id != current_user.id:
        flash('Unauthorized access')
        return redirect(url_for('index'))
    
    return render_template('ride_confirmation.html', ride=ride)

# API endpoints for AJAX requests
@app.route('/api/drivers/nearby', methods=['GET'])
def get_nearby_drivers():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    
    if not lat or not lng:
        return jsonify({'error': 'Missing coordinates'}), 400
    
    # In a real app, you would query your database for nearby drivers
    # For now, we'll return mock data
    mock_drivers = [
        {
            'id': 1,
            'name': 'John D.',
            'vehicle': 'Toyota Camry',
            'license_plate': 'ABC123',
            'rating': 4.8,
            'lat': lat + 0.002,
            'lng': lng + 0.001,
        },
        {
            'id': 2,
            'name': 'Sarah M.',
            'vehicle': 'Honda Civic',
            'license_plate': 'XYZ789',
            'rating': 4.9,
            'lat': lat - 0.001,
            'lng': lng + 0.002,
        },
        {
            'id': 3,
            'name': 'Mike T.',
            'vehicle': 'Tesla Model 3',
            'license_plate': 'DEF456',
            'rating': 4.7,
            'lat': lat + 0.003,
            'lng': lng - 0.002,
        },
    ]
    
    return jsonify(mock_drivers)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
    app.run(debug=True) 