import { View, FlatList, Text, TouchableOpacity, Image, StyleSheet, Button } from 'react-native';

const BookListScreen = ({ route, navigation }) => {
  const { books } = route.params;

  const selectBook = (book) => {
    navigation.navigate('BookFound', { book });
  };

   const handleAddNewBook = () => {
    navigation.navigate('AddNewBook');
  };

  return (
  <View style={styles.container}>
    <Text style={styles.heading}>Results available in our library</Text>
    <View style={{ flex: 1 }}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => selectBook(item)}>
            {item.images?.thumbnail && (
              <Image source={{ uri: item.images.thumbnail }} style={styles.thumbnail} />
            )}
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>{item.authors?.join(', ')}</Text>
              <Text>{item.publisher}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.buttonContainer}>
        <Button title="Not your book? Add a new one" onPress={handleAddNewBook} color="black" />
      </View>
    </View>
    </View>
  );
};

export default BookListScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' },
  heading: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginTop: 15,
    marginBottom: 25, 
    textAlign: "center" },
  card: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  thumbnail: {
    width: 60,
    height: 90,
    marginRight: 10,
  },
  info: {
    flexShrink: 1,
  },
  title: {
    fontWeight: 'bold',
  },
    buttonContainer: {
    marginBottom: 16,
  },
});