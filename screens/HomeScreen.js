import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import MapContainer from '../components/MapContainer';
import { MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  // Mock function to fetch nearby drivers
  // In a real app, this would call your backend API
  useEffect(() => {
    const fetchNearbyDrivers = async () => {
      // This is mock data - in production, you'd fetch from your API
      const mockDrivers = [
        {
          id: '1',
          name: 'John D.',
          latitude: selectedLocation ? selectedLocation.latitude + 0.002 : 37.78925,
          longitude: selectedLocation ? selectedLocation.longitude + 0.001 : -122.4314,
          vehicleModel: 'Toyota Camry',
          licensePlate: 'ABC123',
        },
        {
          id: '2',
          name: 'Sarah M.',
          latitude: selectedLocation ? selectedLocation.latitude - 0.001 : 37.78725,
          longitude: selectedLocation ? selectedLocation.longitude + 0.002 : -122.4334,
          vehicleModel: 'Honda Civic',
          licensePlate: 'XYZ789',
        },
      ];
      
      setNearbyDrivers(mockDrivers);
    };

    fetchNearbyDrivers();
    
    // Set up a timer to periodically refresh drivers
    const interval = setInterval(fetchNearbyDrivers, 10000);
    
    return () => clearInterval(interval);
  }, [selectedLocation]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleBookRide = () => {
    // Navigate to booking screen with the selected location
    navigation.navigate('BookRide', { pickupLocation: selectedLocation });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TaxiApp</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <MaterialIcons name="person" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mapContainer}>
        <MapContainer 
          onLocationSelect={handleLocationSelect}
          showDrivers={true}
          nearbyDrivers={nearbyDrivers}
        />
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.whereToButton}
          onPress={() => navigation.navigate('SetDestination')}
        >
          <MaterialIcons name="search" size={24} color="#333" style={styles.searchIcon} />
          <Text style={styles.whereToText}>Where to?</Text>
        </TouchableOpacity>
        
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialIcons name="home" size={24} color="#333" />
            <Text style={styles.quickActionText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialIcons name="work" size={24} color="#333" />
            <Text style={styles.quickActionText}>Work</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialIcons name="history" size={24} color="#333" />
            <Text style={styles.quickActionText}>Recent</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBookRide}
          disabled={!selectedLocation}
        >
          <Text style={styles.bookButtonText}>Book a Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  actionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  whereToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  whereToText: {
    fontSize: 16,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    marginTop: 4,
    fontSize: 12,
  },
  bookButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 