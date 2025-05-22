import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
// These would be your other screens - create placeholders for now
const SetDestinationScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Set Destination</Text></View>;
const BookRideScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Book Ride</Text></View>;
const ProfileScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Profile</Text></View>;
const ActivityScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Activity</Text></View>;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SetDestination" component={SetDestinationScreen} />
      <Stack.Screen name="BookRide" component={BookRideScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'HomeTab') {
              iconName = 'home';
            } else if (route.name === 'Activity') {
              iconName = 'history';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#0066CC',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen 
          name="HomeTab" 
          component={HomeStack} 
          options={{ 
            headerShown: false,
            title: 'Home'
          }} 
        />
        <Tab.Screen name="Activity" component={ActivityScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 