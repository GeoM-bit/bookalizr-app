import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Picker } from '@react-native-picker/picker';
import BottomNav from './bottomNav';

const MyLibraryScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

const fetchBooks = async () => {
  setLoading(true);
  try {
    const userEmail = await AsyncStorage.getItem('userEmail');
    if (!userEmail) return;

    const readingQuery = query(
      collection(db, 'reading'),
      where('username', '==', userEmail)
    );
    const readingSnapshot = await getDocs(readingQuery);

    const readingDocs = readingSnapshot.docs.map(doc => doc.data());

    const bookDetails = await Promise.all(readingDocs.map(async (reading) => {
      const isbn = reading.isbn;

      const bookQuery = query(
        collection(db, 'book'),
        where('isbn', '==', isbn),
        limit(1)
      );
      const bookSnapshot = await getDocs(bookQuery);

      if (!bookSnapshot.empty) {
        const bookData = bookSnapshot.docs[0].data();
        return {
          isbn: bookData.isbn,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher,
          year: bookData.year,
          coverUrl: bookData.cover_url,
          description: bookData.description,
          status: reading.status,
        };
      }

      return null;
    }));
    setBooks(bookDetails.filter(book => book !== null));
  } catch (error) {
    console.error('Error fetching books from Firebase:', error);
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

const updateStatus = async (newStatus) => {
  try {
    const userEmail = await AsyncStorage.getItem('userEmail');
    if (!userEmail || !selectedBook) {
      console.error('Missing user email or selected book');
      return;
    }

    const readingQuery = query(
      collection(db, 'reading'),
      where('username', '==', userEmail),
      where('isbn', '==', selectedBook.isbn)
    );
    
    const snapshot = await getDocs(readingQuery);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { status: newStatus });
      
      setBooks(books.map(book =>
        book.isbn === selectedBook.isbn
          ? { ...book, status: newStatus }
          : book
      ));
      setSelectedBook(prev => ({ ...prev, status: newStatus }));
    } else {
      console.warn('No matching reading document found to update.');
      Alert.alert('Error', 'Could not find the book record to update');
    }
  } catch (error) {
    console.error('Error updating status in Firestore:', error);
    Alert.alert('Error', 'Failed to update book status');
  }
};

const deleteBook = async (isbn) => {
  try {
    const userEmail = await AsyncStorage.getItem('userEmail');
    if (!userEmail) return;

    const readingQuery = query(
      collection(db, 'reading'),
      where('username', '==', userEmail),
      where('isbn', '==', isbn)
    );

    const snapshot = await getDocs(readingQuery);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;

      await deleteDoc(docRef);

      setBooks(prevBooks => prevBooks.filter(book => book.isbn !== isbn));
      setModalVisible(false);
    } else {
      console.warn('No matching reading document found to delete.');
    }
  } catch (error) {
    console.error('Error deleting book from Firebase:', error);
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
                Status: {book.status === 'reading' ? 'Currently Reading' : 
                        book.status === 'notReading' ? 'Not Reading' : 
                        book.status === 'toLend' ? 'Available to Lend' : 
                        book.status === 'lent' ? 'Lent Out' : book.status}
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
  <View style={styles.pickerContainer}>
    <Picker
      selectedValue={selectedBook.status}
      onValueChange={(itemValue) => updateStatus(itemValue)}
      style={styles.picker}
      dropdownIconColor="#333"
    >
      <Picker.Item label="Currently Reading" value="reading" />
      <Picker.Item label="Not Reading" value="notReading" />
      <Picker.Item label="Available to Lend" value="toLend" />
      <Picker.Item label="Lent Out" value="lent" />
    </Picker>
  </View>             
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
       <BottomNav navigation={navigation}></BottomNav>
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
    height: 150,
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
    flexDirection: 'column',
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
    marginHorizontal: 5,
    textAlign: 'center'
},
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'black',
    marginHorizontal: 5,
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
  pickerContainer: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 5,
  marginBottom: 15,
  overflow: 'hidden',
  marginHorizontal: 5,
},
picker: {
  width: '100%',
  backgroundColor: '#f9f9f9',
}
});

export default MyLibraryScreen;