import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
  const handleLogin = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
          {isLoading ? (
            <View style={Styles.spinnerContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={Styles.loadingText}>Signing in...</Text>
            </View>
          ) : (
            <Button title="Log In" onPress={handleLogin} color="black" disabled={isLoading} />
          )}
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
  },  toggleText: {
    textAlign: 'center',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  loadingText: {
    color: '#555',
    fontSize: 14,
    marginTop: 10
  }
});