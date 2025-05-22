import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

const MapContainer = ({ onLocationSelect, initialRegion, showDrivers, nearbyDrivers }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(initialRegion || {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          setLoading(false);
          return;
        }
        
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
        
        // Update region to current location
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error getting location:', error);
        setLoading(false);
      }
    })();
  }, []);

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
    if (onLocationSelect) {
      onLocationSelect({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
    }
  };

  const animateToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Show nearby drivers if enabled */}
        {showDrivers && nearbyDrivers && nearbyDrivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={{
              latitude: driver.latitude,
              longitude: driver.longitude,
            }}
            title={`Driver ${driver.name}`}
            description={`${driver.vehicleModel} - ${driver.licensePlate}`}
          >
            <MaterialIcons name="local-taxi" size={24} color="#000" />
          </Marker>
        ))}
      </MapView>
      
      {/* Current location button */}
      <View style={styles.buttonContainer}>
        <MaterialIcons
          name="my-location"
          size={28}
          color="#000"
          style={styles.locationButton}
          onPress={animateToCurrentLocation}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  locationButton: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MapContainer; 