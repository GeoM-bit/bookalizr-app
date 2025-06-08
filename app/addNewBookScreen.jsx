import { useState, useRef } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddNewBookScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setImageUri(photo.uri);
        setIsCameraVisible(false);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const handleAddBook = async () => {
    let coverUrl = '';

    if (imageUri) {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'cover.jpg',
      });

      try {
         const token = await AsyncStorage.getItem('token');
        const response = await fetch('http://nobody.home.ro:8080/api/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
             'Authorization': `Bearer ${token}`
          },
        });
      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json(); 
      coverUrl = result.imageUrl;
      } catch (err) {
        console.error('Image upload failed:', err);
        Alert.alert('Upload Error', 'Failed to upload image');
        return;
      }
    }

    const bookToSave = {
      isbn,
      title,
      author,
      publisher,
      publishedDate: year,
      coverUrl,
    };

    try {
       const token = await AsyncStorage.getItem('token');
      const res = await fetch('http://nobody.home.ro:8080/api/book/register', {
        method: 'POST',
        body: JSON.stringify(bookToSave),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const email = await AsyncStorage.getItem('userEmail');
      const locationString = await AsyncStorage.getItem('location');
      const location = JSON.parse(locationString);
      let readingToSave =
      {
        username: email,
        isbn: isbn,
        current: 0,
        latitude: location.latitude,
        longitude: location.longitude
      };

        const responseForSaveReading = await fetch('http://nobody.home.ro:8080/api/reading', {
        method: 'POST',
        body: JSON.stringify(readingToSave),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          }
      });   
            if (res.ok && responseForSaveReading.ok) {
        Alert.alert('Success', 'Book added to your library!');
      navigation.navigate('MyLibrary');
      } else {
        Alert.alert('Error', 'Failed to save book');
      }
    } catch (err) {
      console.error('Book save failed:', err);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera access required</Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  if (isCameraVisible) {
    return (
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.captureContainer}>
          <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add new book</Text>
      <Text style={styles.message}>Fill in the book details and take a photo of the cover.</Text>

      <TouchableOpacity onPress={() => setIsCameraVisible(true)} style={styles.imageUploadBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.coverImage} />
        ) : (
          <Text style={styles.uploadText}>+ Take photo</Text>
        )}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Title:" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Author:" value={author} onChangeText={setAuthor} />
      <TextInput style={styles.input} placeholder="Year:" value={year} onChangeText={setYear} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="ISBN:" value={isbn} onChangeText={setIsbn} />
      <TextInput style={styles.input} placeholder="Publisher:" value={publisher} onChangeText={setPublisher} />

      <Button title="Add to library" onPress={handleAddBook} color="black" />
    </View>
  );
};

export default AddNewBookScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  message: { marginBottom: 20 },
  imageUploadBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadText: { fontSize: 16, color: '#333' },
  coverImage: { 
    width: 70,  
    height: 90, 
    borderRadius: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 8,
    marginBottom: 13,
  },
  camera: {
    flex: 1,
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  captureButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 50,
    padding: 5,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
});