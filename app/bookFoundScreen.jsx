import { View, Text, StyleSheet, Image, Button, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookFoundScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const isbn = book.identifiers.find(id => id.type === 'ISBN_13')?.identifier;
  const description = book.description.slice(0,250);

  const handleAddToLibrary = async ()  => {
      let bookToSave =
      {
        isbn: isbn,
        title: book.title,
        author: book.authors.join(', '),
        publisher: book.publisher,
        publishedDate: book.published_date?.slice(0, 4) ?? "2000",
        coverUrl: book.images?.thumbnail,
        description: description
      };
      const email = await AsyncStorage.getItem('userEmail');
      const locationString = await AsyncStorage.getItem('location')
      const token = await AsyncStorage.getItem('token');
      const location = JSON.parse(locationString);
      let readingToSave =
      {
        username: email,
        isbn: isbn,
        current: 0,
        latitude: location.latitude,
        longitude: location.longitude
      };
      const responseForSaveBook = await fetch('http://nobody.home.ro:8080/api/book/register', {
        method: 'POST',
        body: JSON.stringify(bookToSave),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          }
      });

      const responseForSaveReading = await fetch('http://nobody.home.ro:8080/api/reading', {
        method: 'POST',
        body: JSON.stringify(readingToSave),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          }
      });    
  
      if(responseForSaveBook.ok && responseForSaveReading.ok)
      {
        navigation.navigate('MyLibrary');
        alert(`Added "${book.title}" to library!`);
      }
      else
      {
      alert(`Something went wrong!`);
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