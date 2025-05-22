from taxiapp import db
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    
    def __repr__(self):
        return f'<User {self.username}>'

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

class Driver(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='offline')
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    vehicle_model = db.Column(db.String(100), nullable=True)
    license_plate = db.Column(db.String(20), nullable=True)
    average_rating = db.Column(db.Float, default=0.0)
    
    user = db.relationship('User', backref=db.backref('driver', uselist=False, lazy=True))
    
    def __repr__(self):
        return f'<Driver {self.id}>'

class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ride_id = db.Column(db.Integer, db.ForeignKey('ride.id'), nullable=False)
    rater_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rated_driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    ride = db.relationship('Ride', backref=db.backref('ratings', lazy=True))
    rater = db.relationship('User', foreign_keys=[rater_id], backref=db.backref('ratings_given', lazy=True))
    rated_driver = db.relationship('Driver', backref=db.backref('ratings_received', lazy=True))
    
    def __repr__(self):
        return f'<Rating {self.id}>' 