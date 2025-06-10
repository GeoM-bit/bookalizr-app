import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const handleRegister = async () => {
  setIsLoading(true);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created:", userCredential.user.email);
    navigation.navigate('Login', { registered: true });
  } catch (error) {
    console.error("Auth error:", error.code, error.message);

    Alert.alert(
      "Registration Error",
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
        <Text style={Styles.title}>Sign Up</Text>
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
              <Text style={Styles.loadingText}>Creating your account...</Text>
            </View>
          ) : (
            <Button title="Sign Up" onPress={handleRegister} color="black" disabled={isLoading} />
          )}
        </View>
        <View style={Styles.bottomContainer}>
          <Text style={Styles.toggleText} onPress={() => navigation.navigate('Login')}>
            Already have an account? Log In
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;

const Styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  authContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
   heading: { 
    fontSize: 27, 
    fontWeight: '600', 
    marginTop: -130, 
    marginBottom: 90, 
    textAlign: "center" },
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
  toggleText: {
    textAlign: 'center',
  },
  bottomContainer: {
    marginTop: 20,
  },  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
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