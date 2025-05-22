from flask import render_template, request, redirect, url_for, flash, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from taxiapp import app, db
from taxiapp.models import User, Driver, Ride, Rating
from datetime import datetime, timedelta
from flask_login import login_user, logout_user, login_required, current_user
import os

# Google Maps API key
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')

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

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        user_type = request.form.get('user_type', 'passenger')
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered', 'danger')
            return redirect(url_for('register'))
        
        # Create new user
        hashed_password = generate_password_hash(password)
        new_user = User(name=name, email=email, password=hashed_password, user_type=user_type)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            
            # If user is a driver, create driver profile
            if user_type == 'driver':
                new_driver = Driver(user_id=new_user.id, status='offline')
                db.session.add(new_driver)
                db.session.commit()
            
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            flash(f'An error occurred: {str(e)}', 'danger')
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get user's rides (in a real app, you would filter by user_id)
    # For the prototype, we'll create some mock rides
    mock_rides = [
        {
            'id': 1,
            'pickup_location': '123 Main St, San Francisco',
            'destination': 'SFO Airport',
            'ride_type': 'standard',
            'status': 'completed',
            'fare': 35.50,
            'created_at': datetime.now() - timedelta(days=2),
            'ratings': []
        },
        {
            'id': 2,
            'pickup_location': 'Golden Gate Park',
            'destination': 'Fisherman\'s Wharf',
            'ride_type': 'premium',
            'status': 'completed',
            'fare': 42.75,
            'created_at': datetime.now() - timedelta(days=5),
            'ratings': [{'rating': 5}]
        },
        {
            'id': 3,
            'pickup_location': 'Union Square',
            'destination': 'Oracle Park',
            'ride_type': 'standard',
            'status': 'cancelled',
            'fare': None,
            'created_at': datetime.now() - timedelta(days=7),
            'ratings': []
        }
    ]
    
    # Calculate stats
    completed_rides = sum(1 for ride in mock_rides if ride['status'] == 'completed')
    total_spent = sum(ride['fare'] or 0 for ride in mock_rides)
    
    # Mock user data
    user = {
        'name': current_user.username,
        'email': current_user.email,
        'joined_date': datetime.now() - timedelta(days=30)
    }
    
    return render_template('passenger_dashboard.html', 
                          user=user, 
                          rides=mock_rides, 
                          completed_rides=completed_rides, 
                          total_spent=total_spent)

@app.route('/book_ride', methods=['GET', 'POST'])
@login_required
def book_ride():
    if request.method == 'POST':
        # Get form data
        pickup_location = request.form.get('pickup_location')
        destination = request.form.get('destination')
        ride_type = request.form.get('ride_type', 'standard')
        pickup_lat = request.form.get('pickup_lat')
        pickup_lng = request.form.get('pickup_lng')
        destination_lat = request.form.get('destination_lat')
        destination_lng = request.form.get('destination_lng')
        fare = request.form.get('fare')
        
        # In a real app, you would save this to the database
        # For the prototype, we'll just redirect to the dashboard with a success message
        flash('Your ride has been booked successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('book_ride.html', google_maps_api_key=GOOGLE_MAPS_API_KEY)

@app.route('/ride_confirmation/<int:ride_id>')
def ride_confirmation(ride_id):
    if 'user_id' not in session:
        flash('Please login first', 'warning')
        return redirect(url_for('login'))
    
    ride = Ride.query.get_or_404(ride_id)
    
    # Ensure the ride belongs to the logged-in user
    if ride.user_id != session['user_id']:
        flash('Unauthorized access', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('ride_confirmation.html', ride=ride)

@app.route('/api/estimate_fare', methods=['POST'])
def estimate_fare():
    data = request.get_json()
    
    distance = data.get('distance', 0)  # in kilometers
    ride_type = data.get('ride_type', 'economy')
    
    # Base fare and per km rates based on ride type
    base_fare = 0
    per_km_rate = 0
    
    if ride_type == 'economy':
        base_fare = 2.5
        per_km_rate = 1.0
    elif ride_type == 'premium':
        base_fare = 5.0
        per_km_rate = 1.5
    elif ride_type == 'luxury':
        base_fare = 10.0
        per_km_rate = 2.5
    
    # Calculate total fare
    total_fare = base_fare + (distance * per_km_rate)
    
    return jsonify({
        'base_fare': base_fare,
        'per_km_rate': per_km_rate,
        'total_fare': round(total_fare, 2)
    })

# Add a route for the missing cancel_ride function
@app.route('/cancel_ride/<int:ride_id>')
def cancel_ride(ride_id):
    if 'user_id' not in session:
        flash('Please login first', 'warning')
        return redirect(url_for('login'))
    
    ride = Ride.query.get_or_404(ride_id)
    
    # Ensure the ride belongs to the logged-in user
    if ride.user_id != session['user_id']:
        flash('Unauthorized access', 'danger')
        return redirect(url_for('dashboard'))
    
    # Only allow cancellation if the ride is pending or accepted
    if ride.status in ['pending', 'accepted']:
        ride.status = 'cancelled'
        db.session.commit()
        flash('Your ride has been cancelled', 'success')
    else:
        flash('This ride cannot be cancelled', 'danger')
    
    return redirect(url_for('dashboard'))

# Add a route for the missing rate_ride function
@app.route('/rate_ride/<int:ride_id>', methods=['GET', 'POST'])
def rate_ride(ride_id):
    if 'user_id' not in session:
        flash('Please login first', 'warning')
        return redirect(url_for('login'))
    
    ride = Ride.query.get_or_404(ride_id)
    
    # Ensure the ride belongs to the logged-in user
    if ride.user_id != session['user_id']:
        flash('Unauthorized access', 'danger')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        rating_value = int(request.form.get('rating'))
        comment = request.form.get('comment')
        
        # Create new rating
        new_rating = Rating(
            ride_id=ride.id,
            rater_id=session['user_id'],
            rated_driver_id=ride.driver_id,
            rating=rating_value,
            comment=comment
        )
        
        try:
            db.session.add(new_rating)
            
            # Update driver's average rating
            driver = Driver.query.get(ride.driver_id)
            ratings = Rating.query.filter_by(rated_driver_id=driver.id).all()
            total_ratings = sum(r.rating for r in ratings)
            driver.average_rating = total_ratings / len(ratings)
            
            db.session.commit()
            flash('Thank you for your rating!', 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            db.session.rollback()
            flash(f'An error occurred: {str(e)}', 'danger')
    
    return render_template('rate_ride.html', ride=ride)

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