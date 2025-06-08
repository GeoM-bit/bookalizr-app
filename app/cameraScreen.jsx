import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator  } from 'react-native';

const CameraScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
  const takePicture = async () => {
    if (cameraRef.current) {
      try {       
        const photo = await cameraRef.current.takePictureAsync();
        setPhoto(photo);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };
  const retakePicture = () => {
    setPhoto(null);
  };
const savePicture = async () => {
    console.log('Photo to save:', photo);
  setLoading(true); 

  try {
    const formData = new FormData();
    formData.append('image_file', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    const response = await fetch('https://bookalizr-ocr-api.blackisland-e63ab678.germanywestcentral.azurecontainerapps.io/ocr/?engine=moondream', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();
    const bookInfo = result?.search_result?.books?.[0];
      const books = result?.search_result?.books;
    console.log(result);

    if (bookInfo) {
      setPhoto(null);
      navigation.navigate('BookList', { books, location });
    } else {
      setPhoto(null);
      navigation.navigate('AddNewBook');    }
  } catch (error) {
    console.error('Upload error:', error);
  }
  finally {
    setLoading(false);
  }
};
  if (photo) {
    return (
      <View style={styles.container}>
         {loading ? (
        <View style={styles.loadingContainer}> 
          <ActivityIndicator size="large" />
          <Text>Searching your book...</Text>
        </View>
      ) : (
        <>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <View style={styles.previewButtons}>
          <TouchableOpacity style={styles.button} onPress={retakePicture}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={savePicture}>
            <Text style={styles.buttonText}>Search book</Text>
          </TouchableOpacity>
        </View>
        </>
      )}
      </View>  
    );
  }
  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back"
        ref={cameraRef}
        mute={true}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

export default CameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  buttonContainer: {
      flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30, 
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  button: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
  },
  captureButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
    padding: 5,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
    loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});