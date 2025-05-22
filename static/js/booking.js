// Booking page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');
    const rideTypeSelect = document.getElementById('ride-type');
    const fareAmountElement = document.getElementById('fare-amount');
    const estimatedTimeElement = document.getElementById('estimated-time');
    
    // Hidden inputs
    const fareInput = document.getElementById('fare-input');
    const distanceInput = document.getElementById('distance-input');
    const durationInput = document.getElementById('duration-input');
    const pickupLatInput = document.getElementById('pickup-lat');
    const pickupLngInput = document.getElementById('pickup-lng');
    const destinationLatInput = document.getElementById('destination-lat');
    const destinationLngInput = document.getElementById('destination-lng');
    
    // Initialize autocomplete for pickup and destination
    if (pickupInput && destinationInput) {
        autocompletePickup = new google.maps.places.Autocomplete(pickupInput);
        autocompleteDestination = new google.maps.places.Autocomplete(destinationInput);
        
        // Add listeners to update the map when places are selected
        autocompletePickup.addListener('place_changed', updateRoute);
        autocompleteDestination.addListener('place_changed', updateRoute);
    }
    
    // Update fare when ride type changes
    if (rideTypeSelect) {
        rideTypeSelect.addEventListener('change', calculateFare);
    }
    
    // Function to update the route on the map
    function updateRoute() {
        const pickupPlace = autocompletePickup.getPlace();
        const destinationPlace = autocompleteDestination.getPlace();
        
        // Check if both places are valid
        if (!pickupPlace || !pickupPlace.geometry || !destinationPlace || !destinationPlace.geometry) {
            return;
        }
        
        // Store coordinates in hidden inputs
        pickupLatInput.value = pickupPlace.geometry.location.lat();
        pickupLngInput.value = pickupPlace.geometry.location.lng();
        destinationLatInput.value = destinationPlace.geometry.location.lat();
        destinationLngInput.value = destinationPlace.geometry.location.lng();
        
        // Create route request
        const request = {
            origin: pickupPlace.geometry.location,
            destination: destinationPlace.geometry.location,
            travelMode: google.maps.TravelMode.DRIVING
        };
        
        // Get route
        directionsService.route(request, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                // Display the route on the map
                directionsRenderer.setDirections(result);
                
                // Get distance and duration
                const route = result.routes[0];
                const leg = route.legs[0];
                
                // Store distance and duration in hidden inputs
                distanceInput.value = leg.distance.value / 1000; // Convert to kilometers
                durationInput.value = leg.duration.value / 60; // Convert to minutes
                
                // Update estimated time
                estimatedTimeElement.textContent = leg.duration.text;
                
                // Calculate fare
                calculateFare();
                
                // Add markers for pickup and destination
                addMarkers(pickupPlace.geometry.location, destinationPlace.geometry.location);
            }
        });
    }
    
    // Function to add markers for pickup and destination
    function addMarkers(pickupLocation, destinationLocation) {
        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        markers = [];
        
        // Add pickup marker
        const pickupMarker = new google.maps.Marker({
            position: pickupLocation,
            map: map,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new google.maps.Size(32, 32)
            },
            title: 'Pickup Location'
        });
        
        // Add destination marker
        const destinationMarker = new google.maps.Marker({
            position: destinationLocation,
            map: map,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
            },
            title: 'Destination'
        });
        
        // Store markers
        markers.push(pickupMarker, destinationMarker);
        
        // Fit map to show both markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(pickupLocation);
        bounds.extend(destinationLocation);
        map.fitBounds(bounds);
    }
    
    // Function to calculate fare based on distance and ride type
    function calculateFare() {
        const distance = parseFloat(distanceInput.value) || 0;
        const rideType = rideTypeSelect.value;
        
        let baseFare = 2.5;
        let perKmRate = 1.5;
        
        // Adjust rates based on ride type
        if (rideType === 'premium') {
            baseFare = 5;
            perKmRate = 2;
        } else if (rideType === 'luxury') {
            baseFare = 10;
            perKmRate = 3;
        }
        
        const totalFare = baseFare + (distance * perKmRate);
        
        // Update the displayed fare
        fareAmountElement.textContent = '$' + totalFare.toFixed(2);
        fareInput.value = totalFare.toFixed(2);
    }

    // Handle booking form submission
    const bookingForm = document.querySelector('.booking-form form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const pickup = document.getElementById('pickup').value;
            const destination = document.getElementById('destination').value;
            
            if (!pickup || !destination) {
                alert('Please enter both pickup and destination locations');
                return;
            }
            
            // Show booking confirmation
            showBookingConfirmation();
        });
    }
});

// Display booking confirmation modal
function showBookingConfirmation() {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
    };
    
    const title = document.createElement('h2');
    title.textContent = 'Booking Confirmation';
    
    const message = document.createElement('p');
    message.textContent = 'Looking for drivers near you...';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(spinner);
    modal.appendChild(modalContent);
    
    // Add modal to page
    document.body.appendChild(modal);
    
    // Simulate finding a driver (would be replaced with actual API call)
    setTimeout(function() {
        message.textContent = 'Driver found! Your ride will arrive in approximately 3 minutes.';
        spinner.style.display = 'none';
        
        const driverInfo = document.createElement('div');
        driverInfo.className = 'driver-info';
        driverInfo.innerHTML = `
            <div class="driver-profile">
                <img src="/static/img/driver-placeholder.jpg" alt="Driver">
                <div>
                    <h3>John Driver</h3>
                    <p>⭐ 4.8 (203 rides)</p>
                    <p>Toyota Camry • ABC 123</p>
                </div>
            </div>
            <button class="btn btn-primary">Contact Driver</button>
        `;
        
        modalContent.appendChild(driverInfo);
    }, 3000);
} 