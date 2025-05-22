// Map initialization and functionality for TaxiApp
let map;
let userMarker;
let driverMarkers = [];
let directionsService;
let directionsRenderer;

// Initialize the map
function initMap() {
  // Default center (will be replaced with user's location if available)
  const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco
  
  // Create map instance
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultCenter,
    zoom: 14,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: true,
  });
  
  // Initialize directions service and renderer
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
  });
  
  // Try to get user's current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Center map on user location
        map.setCenter(userLocation);
        
        // Add user marker
        userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
          title: "Your Location",
        });
        
        // Fetch nearby drivers
        fetchNearbyDrivers(userLocation);
        
        // Set pickup location input value
        document.getElementById("pickup-location").value = "Current Location";
      },
      () => {
        // Handle location error
        console.log("Error: The Geolocation service failed.");
      }
    );
  } else {
    console.log("Error: Your browser doesn't support geolocation.");
  }
  
  // Add click listener to map for setting destination
  map.addListener("click", (event) => {
    setDestination(event.latLng);
  });
  
  // Add search box functionality
  initSearchBox();
}

// Initialize search box for destination input
function initSearchBox() {
  const destinationInput = document.getElementById("destination-input");
  const searchBox = new google.maps.places.SearchBox(destinationInput);
  
  // Bias the SearchBox results towards current map's viewport
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });
  
  // Listen for the event fired when the user selects a prediction
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();
    
    if (places.length === 0) {
      return;
    }
    
    const place = places[0];
    
    if (!place.geometry || !place.geometry.location) {
      console.log("Returned place contains no geometry");
      return;
    }
    
    // Set destination
    const destinationLatLng = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    
    // Update hidden fields
    document.getElementById("destination-lat").value = destinationLatLng.lat;
    document.getElementById("destination-lng").value = destinationLatLng.lng;
    
    // Add marker for destination
    if (destinationMarker) {
      destinationMarker.setMap(null);
    }
    
    destinationMarker = new google.maps.Marker({
      position: destinationLatLng,
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#DB4437",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      title: "Destination",
    });
    
    // Calculate and display route
    calculateRoute();
  });
}

// Set destination and calculate route
function setDestination(latLng) {
  if (destinationMarker) {
    destinationMarker.setMap(null);
  }
  
  destinationMarker = new google.maps.Marker({
    position: latLng,
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: "#DB4437",
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2,
    },
    title: "Destination",
  });
  
  // Get address for the selected location
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === "OK" && results[0]) {
      document.getElementById("destination-input").value = results[0].formatted_address;
      
      // Set hidden fields
      document.getElementById("destination-lat").value = latLng.lat();
      document.getElementById("destination-lng").value = latLng.lng();
      
      // Calculate and display route
      calculateRoute();
    }
  });
}

// Calculate route between pickup and destination
function calculateRoute() {
  if (!userMarker || !destinationMarker) {
    return;
  }
  
  const request = {
    origin: userMarker.getPosition(),
    destination: destinationMarker.getPosition(),
    travelMode: google.maps.TravelMode.DRIVING,
  };
  
  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result);
      
      // Show booking panel
      document.getElementById("booking-panel").classList.remove("hidden");
      
      // Update trip info
      const route = result.routes[0].legs[0];
      document.getElementById("trip-distance").textContent = route.distance.text;
      document.getElementById("trip-duration").textContent = route.duration.text;
      
      // Calculate fare (simple formula: base fare + distance in km * rate)
      const distanceInKm = route.distance.value / 1000;
      const baseFare = 2.5;
      const ratePerKm = 1.5;
      const fare = baseFare + (distanceInKm * ratePerKm);
      document.getElementById("trip-fare").textContent = `$${fare.toFixed(2)}`;
    }
  });
}

// Fetch nearby drivers (mock function)
function fetchNearbyDrivers(userLocation) {
  // Clear existing driver markers
  driverMarkers.forEach(marker => marker.setMap(null));
  driverMarkers = [];
  
  // In a real app, you would fetch this data from your backend
  // For now, we'll create some mock drivers around the user's location
  const mockDrivers = [
    {
      id: 1,
      name: "John D.",
      vehicle: "Toyota Camry",
      rating: 4.8,
      lat: userLocation.lat + 0.002,
      lng: userLocation.lng + 0.001,
    },
    {
      id: 2,
      name: "Sarah M.",
      vehicle: "Honda Civic",
      rating: 4.9,
      lat: userLocation.lat - 0.001,
      lng: userLocation.lng + 0.002,
    },
    {
      id: 3,
      name: "Mike T.",
      vehicle: "Tesla Model 3",
      rating: 4.7,
      lat: userLocation.lat + 0.003,
      lng: userLocation.lng - 0.002,
    },
  ];
  
  // Add driver markers to the map
  mockDrivers.forEach(driver => {
    const marker = new google.maps.Marker({
      position: { lat: driver.lat, lng: driver.lng },
      map: map,
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: "#0F9D58",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 1,
        rotation: Math.random() * 360, // Random rotation for variety
      },
      title: driver.name,
    });
    
    // Add info window with driver details
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="driver-info">
          <h4>${driver.name}</h4>
          <p>${driver.vehicle}</p>
          <p>Rating: ${driver.rating}⭐</p>
        </div>
      `,
    });
    
    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
    
    driverMarkers.push(marker);
  });
}

// Book ride function
function bookRide() {
  // Get the values from the hidden fields
  const pickupLat = document.getElementById("pickup-lat").value;
  const pickupLng = document.getElementById("pickup-lng").value;
  const destinationLat = document.getElementById("destination-lat").value;
  const destinationLng = document.getElementById("destination-lng").value;
  const pickupLocation = document.getElementById("pickup-location").value;
  const destinationInput = document.getElementById("destination-input").value;
  
  // Create a form to submit the data
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/book_ride";
  form.style.display = "none";
  
  // Add the form fields
  const fields = {
    "pickup_location": pickupLocation,
    "destination": destinationInput,
    "ride_type": "standard", // Default to standard
    "pickup_lat": pickupLat,
    "pickup_lng": pickupLng,
    "destination_lat": destinationLat,
    "destination_lng": destinationLng,
    "fare": document.getElementById("trip-fare").textContent.replace("$", "")
  };
  
  for (const key in fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = fields[key];
    form.appendChild(input);
  }
  
  // Add the form to the document and submit it
  document.body.appendChild(form);
  form.submit();
}

// Animate driver moving to user
function animateDriverToUser(driverMarker) {
  const start = driverMarker.getPosition();
  const end = userMarker.getPosition();
  
  // Animation duration in milliseconds
  const duration = 5000;
  const startTime = new Date().getTime();
  
  // Update driver position every 50ms
  const timer = setInterval(() => {
    const elapsed = new Date().getTime() - startTime;
    const fraction = elapsed / duration;
    
    if (fraction >= 1) {
      clearInterval(timer);
      driverMarker.setPosition(end);
      
      // Show driver arrived message
      document.getElementById("driver-status").textContent = "Your driver has arrived!";
      return;
    }
    
    const lat = start.lat() + (end.lat() - start.lat()) * fraction;
    const lng = start.lng() + (end.lng() - start.lng()) * fraction;
    
    driverMarker.setPosition(new google.maps.LatLng(lat, lng));
    
    // Update ETA
    const remainingSeconds = Math.round((duration - elapsed) / 1000);
    document.getElementById("driver-eta").textContent = `${remainingSeconds} seconds`;
  }, 50);
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check if the map element exists
  if (document.getElementById('map')) {
    // If Google Maps API is already loaded, initialize the map
    if (typeof google !== 'undefined') {
      initMap();
      handleDestinationInput();
    }
    // Otherwise, the callback in the script tag will initialize the map
  }
}); 