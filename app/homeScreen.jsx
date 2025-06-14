import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, doc, getDoc, setDoc, query, where, limit } from 'firebase/firestore';
import { db } from './firebaseConfig';
import BottomNav from './bottomNav';

const MapContent = ({navigation}) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookIsbn, setSelectedBookIsbn] = useState(null);
  const [nearbyBooks, setNearbyBooks] = useState([]);
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);

  const startChat = async (chatId, userEmail, otherEmail) => {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        chatId,
        participants: [userEmail, otherEmail],
        createdAt: new Date(),
      });
    }
  };

  const getNearbyReadings = async (latitude, longitude, username) => {
    const radiusKm = 5.0;
    
    try {
      const readingsQuery = query(
        collection(db, 'reading'),
        where('username', '!=', username)
      );
      
      const readingsSnapshot = await getDocs(readingsQuery);
      const nearbyReadings = [];
      
      const filtered = readingsSnapshot.docs.filter(doc => 
        doc.data().status !== 'lent' && doc.data().status !== 'notReading'
      );

      for (const snap of filtered) {
        const reading = snap.data();

        try {
          const readingLat = parseFloat(reading.latitude);
          const readingLon = parseFloat(reading.longitude);
          
          const distance = distanceInKm(latitude, longitude, readingLat, readingLon);
          if (distance <= radiusKm) {
            const q = query(
              collection(db, 'book'),
              where('isbn', '==', reading.isbn),
              limit(1) 
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const book = querySnapshot.docs[0].data();
              
              nearbyReadings.push({
                isbn: reading.isbn,
                title: book.title,
                author: book.author,
                publisher: book.publisher,
                year: book.year, 
                coverUrl: book.cover_url,
                latitude: reading.latitude,
                longitude: reading.longitude,
                owner: reading.username,
                status: reading.status
              });
            }
          }
        } catch (e) {
          console.error('Error processing reading:', e);
        }
      }
      
      return nearbyReadings;
    } catch (error) {
      console.error('Error fetching nearby readings:', error);
      throw error;
    }
  };

  function distanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  const getStatusInfo = (status) => {
    switch(status) {
      case 'reading':
        return { text: 'Currently Reading', color: 'black', canBorrow: false };
      case 'toLend':
        return { text: 'Available to Borrow', color: 'black', canBorrow: true };
      default:
        return { text: 'Unknown Status', color: '#9E9E9E', canBorrow: false };
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return;
      }
      try {
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        await AsyncStorage.setItem('location', JSON.stringify(coords));
        const userEmail = await AsyncStorage.getItem('userEmail');
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
        const token = await AsyncStorage.getItem('token');

        const nearbyReadings = await getNearbyReadings(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          userEmail
        );
        
        setNearbyBooks(nearbyReadings);
      } catch (error) {
        setErrorMsg('Error getting location');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleBookSelection = (bookIsbn) => {
    setSelectedBookIsbn(bookIsbn);
    scrollToBook(bookIsbn);
    
    if (mapRef.current) {
      const book = nearbyBooks.find(b => b.isbn === bookIsbn);
      if (book) {
        mapRef.current.animateToRegion({
          ...{
                latitude: parseFloat(book.latitude),
                longitude: parseFloat(book.longitude)
              },
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    }
  };

  const scrollToBook = (bookIsbn) => {
    const index = nearbyBooks.findIndex(book => book.isbn === bookIsbn);
    if (index >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: index * 100,
        animated: true
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to determine location</Text>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView 
        style={styles.map}
        initialRegion={location}
        showsUserLocation={true}
        ref={mapRef}
      >
        {nearbyBooks.map(book => (
          <Marker
            key={book.isbn}
            coordinate={
              {
                latitude: parseFloat(book.latitude),
                longitude: parseFloat(book.longitude)
              }
            }
            title={book.title}
            titleVisibility='adaptive'
            onPress={() => handleBookSelection(book.isbn)}
          >
          </Marker>
        )
        )}
      </MapView>     
      <ScrollView 
        style={styles.nearbyBooksContainer}
        ref={scrollViewRef}
      >       
        {nearbyBooks.map(book => {
          const statusInfo = getStatusInfo(book.status);
          return (
            <TouchableOpacity 
              key={book.isbn}
              style={[
                styles.bookCard,
                selectedBookIsbn === book.isbn && styles.selectedBookCard
              ]}
              onPress={() => handleBookSelection(book.isbn)}
            >
              <View style={styles.bookInfo}>
                <Image
                  source={{ uri: book.coverUrl }}
                  style={styles.coverImage}
                  resizeMode="contain"
                />    
                <View style={styles.textContainer}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>{book.author}</Text>  
                  <Text style={styles.bookDetails}>{book.publisher}, {book.year}</Text>
                  
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.text}
                    </Text>
                  </View>

                  {statusInfo.canBorrow && (
                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={async () => {
                        const currentUser = await AsyncStorage.getItem('userEmail');
                        const chatId = [currentUser, book.owner].sort().join('_');

                        try {
                          await startChat(chatId, currentUser, book.owner);
                          navigation.navigate('Chat', {
                            chatId,
                            recipient: book.owner,
                          });
                        } catch (error) {
                          console.log('Error starting chat:', error);
                        }
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                      <Text style={styles.chatButtonText}>Chat to Borrow</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Books in your area</Text>
      </View>
      <MapContent navigation={navigation} />
      <BottomNav navigation={navigation}></BottomNav>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 25, 
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: '50%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  nearbyBooksContainer: {
    height: '50%',
    padding: 15,
  },
  bookCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedBookCard: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 3,
    borderLeftColor: 'blue',
  },
  bookInfo: {
    flexDirection: 'row',      
    alignItems: 'flex-start',     
    gap: 16,                  
    padding: 4,
  },              
  coverImage: {
    width: 60,               
    height: 90,              
    borderRadius: 4,         
  },
  textContainer: {
    flex: 1,                 
    flexDirection: 'column', 
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,         
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  }
});

export default HomeScreen;