import { View, Text, StyleSheet, Image, Button, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const BookFoundScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const isbn = book.identifiers.find(id => id.type === 'ISBN_13')?.identifier;
  const description = book.description.slice(0,250);

const handleAddToLibrary = async () => {
  try {
    const email = await AsyncStorage.getItem('userEmail');
    const locationString = await AsyncStorage.getItem('location');
    const location = JSON.parse(locationString);

    const isbn = book.identifiers.find(id => id.type === 'ISBN_13')?.identifier;
    const description = book.description.slice(0, 250);

    const bookToSave = {
      isbn,
      title: book.title,
      author: book.authors.join(', '),
      publisher: book.publisher,
      publishedDate: book.published_date?.slice(0, 4) ?? "2000",
      cover_url: book.images?.thumbnail,
      description,
    };

    const readingToSave = {
      username: email,
      isbn,
      isReading: false,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const bookQuery = query(collection(db, 'book'), where('isbn', '==', isbn));
    const bookSnapshot = await getDocs(bookQuery);

    if (bookSnapshot.empty) {
      await addDoc(collection(db, 'book'), bookToSave);
    }

    await addDoc(collection(db, 'reading'), readingToSave);

    alert(`Added "${book.title}" to library!`);
    navigation.navigate('MyLibrary');
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    alert('Something went wrong while adding the book.');
  }
};


  return (
  <ScrollView contentContainerStyle={styles.scrollContent}>
    <View style={styles.container}>
      <Text style={styles.title}>Book found</Text>
      <Image
        source={{ uri: book.images?.thumbnail }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.details}>
        <Text><Text style={styles.label}>Title:</Text> {book.title}</Text>
        <Text><Text style={styles.label}>Author:</Text> {book.authors?.join(', ')}</Text>
        <Text><Text style={styles.label}>Year:</Text> {book.published_date?.slice(0, 4) ?? "2000"}</Text>
        <Text><Text style={styles.label}>Publisher:</Text> {book.publisher}</Text>
        <Text><Text style={styles.label}>ISBN:</Text> {isbn}</Text>
        <Text><Text style={styles.label}>Description:</Text> {description}</Text>
      </View>
      <View style={{ marginTop: 50}}>
        <Button title="Add to library" onPress={handleAddToLibrary} color="black" />
      </View>
    </View>
    </ScrollView>
  );
}

export default BookFoundScreen;

const styles = StyleSheet.create({
  scrollContent: {
  flexGrow: 1,
  justifyContent: 'flex-start',
},
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center"
  },
  image: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  details: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
  },
});