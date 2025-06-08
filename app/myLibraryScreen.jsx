import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MyLibraryScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchBooks = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      const token = await AsyncStorage.getItem('token');
      if (userEmail) {
        const response = await fetch('http://nobody.home.ro:8080/api/reading/user-books/' + userEmail, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }});
        if (response.ok) {
          let data = await response.json();
          setBooks(data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [])
  );

  const toggleReadingStatus = async (isbn) => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      const locationString = await AsyncStorage.getItem('location');
      const location = JSON.parse(locationString);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://nobody.home.ro:8080/api/reading/${userEmail}/${isbn}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current: !selectedBook.isBeingRead,
          latitude: location.latitude,
          longitude: location.longitude
        })
      });

      if (response.ok) {
        setBooks(books.map(book => 
          book.isbn === isbn 
            ? { ...book, isBeingRead: !book.isBeingRead } 
            : book
        ));
        setSelectedBook(prev => ({ ...prev, isBeingRead: !prev.isBeingRead }));
      }
    } catch (error) {
      console.error('Error updating reading status:', error);
    }
  };

  const deleteBook = async (isbn) => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://nobody.home.ro:8080/api/reading/${userEmail}/${isbn}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setBooks(books.filter(book => book.isbn !== isbn));
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const showBookDetails = (book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading your library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.headerTitle}>My Book Library</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Loading your library...</Text>
        </View>
      ) : books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Your library is empty</Text>
          <Text style={styles.emptySubtext}>Add books to see them here</Text>
        </View>
      ) : (
        <> 
        <ScrollView style={styles.scrollView}>
        {books.map((book) => (
          <TouchableOpacity 
            key={book.isbn} 
            style={styles.bookCard}
            onPress={() => showBookDetails(book)}
          >
            <Image
              source={{ uri: book.coverUrl }}
              style={styles.coverImage}
              resizeMode="contain"
            />
            
            <View style={styles.bookInfo}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>{book.author}</Text>
              <Text style={styles.details}>{book.publisher}, {book.year}</Text>
              <Text style={styles.readingStatus}>
                Status: {book.isBeingRead ? 'Currently Reading' : 'Not Reading'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedBook && (
              <>
                <Image
                  source={{ uri: selectedBook.coverUrl }}
                  style={styles.modalCoverImage}
                  resizeMode="contain"
                />
                
                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                <Text style={styles.modalAuthor}>{selectedBook.author}</Text>
                <Text style={styles.modalDetails}>{selectedBook.publisher}, {selectedBook.year}</Text>
                <Text style={styles.modalDescription}>{selectedBook.description}</Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      selectedBook.isBeingRead ? styles.readingButton : styles.notReadingButton
                    ]}
                    onPress={() => toggleReadingStatus(selectedBook.isbn)}
                  >
                    <Text style={styles.modalButtonText}>
                      {selectedBook.isBeingRead ? 'Mark as not Reading' : 'Mark as Reading'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => Alert.alert(
                      'Confirm Delete',
                      'Are you sure you want to remove this book from your library?',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'Delete',
                          onPress: () => deleteBook(selectedBook.isbn),
                          style: 'destructive',
                        },
                      ]
                    )}
                  >
                    <Text style={styles.deleteButtonText}>Delete Book</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      </> 
      )}
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
    padding: 16,
    backgroundColor: '#fff',
  },
   header: {
    padding: 20,
    paddingTop: 25, 
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
   scrollView: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCard: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  coverImage: {
    width: 80,
    height: 120,
    borderRadius: 4,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  details: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  readingStatus: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalCoverImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
    marginBottom: 16,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDetails: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'justify',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  readingButton: {
    backgroundColor: '#4CAF50',
  },
  notReadingButton: {
    backgroundColor: '#9E9E9E',
    textAlign: 'center'
  },
  modalButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  deleteButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ff4444',
    flex: 1,
    marginHorizontal: 5,
    textAlign: 'center'
},
  deleteButtonText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'black',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
    bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});

export default MyLibraryScreen;