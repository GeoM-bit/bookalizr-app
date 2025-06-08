import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const AccountScreen = ({ navigation }) => {
  const [user, setUser] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {        
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userName = await AsyncStorage.getItem('userName');

        if (userEmail && userName) {
          setUser({
            name: userName,
            email: userEmail
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userEmail');
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('location');
              navigation.replace('Login');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

return (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Account</Text>
    </View>
    
    <View style={styles.contentContainer}>
      <View style={styles.profileContainer}>
        <View style={styles.profileIcon}>
          <Ionicons name="person" size={60} color="black" />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
    
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navIcon}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="home-outline" size={28} color="#333" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navIcon}
        onPress={() => navigation.navigate('Camera')}
      >
        <Ionicons name="camera-outline" size={28} color="#333" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navIcon}
        onPress={() => navigation.navigate('MyLibrary')}
      >
        <Ionicons name="book-outline" size={28} color="#333" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navIcon}
        onPress={() => navigation.navigate('Account')}
      >
        <Ionicons name="person-outline" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1, 
    paddingBottom: 70, 
  },
  header: {
    padding: 20,
    paddingTop: 40,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  profileIcon: {
    backgroundColor: '#f0f0f0',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'black',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'black',
  },
  userEmail: {
    fontSize: 16,
    color: '#555',
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
    color: 'black',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
    bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'white', 
  },
});

export default AccountScreen;