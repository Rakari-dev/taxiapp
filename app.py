from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'  # Change this to a random secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taxiapp.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Import models
from models import User, Driver, Ride, Rating

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_type'] = user.user_type
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'danger')
    
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
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Please login first', 'warning')
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    if user.user_type == 'driver':
        driver = Driver.query.filter_by(user_id=user_id).first()
        rides = Ride.query.filter_by(driver_id=driver.id).order_by(Ride.created_at.desc()).limit(10).all()
        return render_template('driver_dashboard.html', user=user, driver=driver, rides=rides)
    else:
        rides = Ride.query.filter_by(user_id=user_id).order_by(Ride.created_at.desc()).limit(10).all()
        return render_template('passenger_dashboard.html', user=user, rides=rides)

@app.route('/book_ride', methods=['GET', 'POST'])
def book_ride():
    if 'user_id' not in session:
        flash('Please login first', 'warning')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        pickup = request.form.get('pickup')
        destination = request.form.get('destination')
        ride_type = request.form.get('ride_type')
        
        # Create new ride
        new_ride = Ride(
            user_id=session['user_id'],
            pickup_location=pickup,
            destination=destination,
            ride_type=ride_type,
            status='pending'
        )
        
        try:
            db.session.add(new_ride)
            db.session.commit()
            
            # In a real app, you would now search for available drivers
            # For demo purposes, we'll just redirect to a confirmation page
            return redirect(url_for('ride_confirmation', ride_id=new_ride.id))
        except Exception as e:
            db.session.rollback()
            flash(f'An error occurred: {str(e)}', 'danger')
    
    return render_template('book_ride.html')

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

# Run the app
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
    app.run(debug=True) 