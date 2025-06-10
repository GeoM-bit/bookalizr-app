import { useState, useRef } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db, storage } from './firebaseConfig';

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
  const [description, setDescription] = useState('');

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
       try {
        const storageRef = ref(storage, `bookCovers/${Date.now()}.jpg`);       
        const response = await fetch(imageUri);
        const blob = await response.blob();       
        await uploadBytes(storageRef, blob);        
        coverUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error('Image upload failed:', err);
        Alert.alert('Upload Error', 'Failed to upload image');
        return;
      }
    }
     try {
    const email = await AsyncStorage.getItem('userEmail');
    const locationString = await AsyncStorage.getItem('location');
    const location = JSON.parse(locationString);

    const bookToSave = {
      isbn,
      title,
      author,
      publisher,
      year,
      cover_url: coverUrl,
      description
    };

    const readingToSave = {
      username: email,
      isbn,
      status: 'notReading',
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const bookQuery = query(collection(db, 'book'), where('isbn', '==', isbn));
    const bookSnapshot = await getDocs(bookQuery);

    if (bookSnapshot.empty) {
      await addDoc(collection(db, 'book'), bookToSave);
    }

    await addDoc(collection(db, 'reading'), readingToSave);

    alert(`Added "${title}" to library!`);
    navigation.navigate('MyLibrary');
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    alert('Something went wrong while adding the book.');
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
      <TextInput style={styles.input} placeholder="Description:" value={description} onChangeText={setDescription} />

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