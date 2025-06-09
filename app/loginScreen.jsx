import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const route = useRoute();

  useEffect(() => {
    if (route.params?.registered) {
      Alert.alert(
        "Success",
        "Registration complete! You can now log in.",
        [{ text: "OK" }],
        { cancelable: true }
      );
    }
  }, []);
  
  WebBrowser.maybeCompleteAuthSession();

const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: '616798399540-ppjmq7i8kdutp3h4cp6n152a7qojlj6e.apps.googleusercontent.com',
  webClientId: '616798399540-ppjmq7i8kdutp3h4cp6n152a7qojlj6e.apps.googleusercontent.com', 
  androidClientId: '616798399540-9fv3223thbn77h7f5sa58cdkgg683vmu.apps.googleusercontent.com',
  redirectUri: 'https://auth.expo.io/@anonymous/bookalizr-mobile-ui',
  useProxy: true
});

useEffect(() => {
  if (response?.type === 'success') {
    const { id_token } = response.params;
    const credential = GoogleAuthProvider.credential(id_token);
    signInWithCredential(auth, credential)
      .then((userCredential) => {
        console.log("Google user:", userCredential.user.email);
        navigation.navigate('Home');
      })
      .catch((error) => {
        Alert.alert("Google Login Error", error.message);
      });
  }
}, [response]);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user.email); 
      await AsyncStorage.setItem('userEmail', userCredential.user.email);
      navigation.navigate('Home');
    } catch (error) {
      console.error("Auth error:", error.code, error.message); 
      
    Alert.alert(
      "Login Error",
      error.message,
      [{ text: "OK" }],
      { cancelable: true }
    );
    }
  };

  return (
    <ScrollView contentContainerStyle={Styles.container}>
      <Text style={Styles.heading}>Bookalizr App</Text>
      <View style={Styles.authContainer}>
        <Text style={Styles.title}>Log In</Text>
        <TextInput
          style={Styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
        />
        <TextInput
          style={Styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        <View style={Styles.buttonContainer}>
          <Button title="Log In" onPress={handleLogin} color="black" />
        </View>
<View style={Styles.buttonContainer}>
  <Button
    title="Log In with Google"
    onPress={() => promptAsync()}
    color="#DB4437" // Google red
    disabled={!request}
  />
</View>        
        <View style={Styles.bottomContainer}>
          <Text style={Styles.toggleText} onPress={() => navigation.navigate('Register')}>
            Need an account? Sign Up
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;

const Styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
    heading: { 
    fontSize: 27, 
    fontWeight: '600', 
    marginTop: -130, 
    marginBottom: 90, 
    textAlign: "center" },
  authContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  bottomContainer: {
    marginTop: 20,
  },
  toggleText: {
    textAlign: 'center',
  }
});