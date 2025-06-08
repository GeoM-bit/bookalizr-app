import { View, Text, TextInput, Button, ScrollView, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
   console.log(email)
      const payload = {
    email,
    password
  };
        const response = await fetch('http://nobody.home.ro:8080/authentication/login', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        });

      const data = await response.json();
      const token = data.token;
      await AsyncStorage.setItem('token', token);
    if(token)
    {
  const userResponse = await fetch('http://nobody.home.ro:8080/user/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const userData = await userResponse.json();
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('userName', userData.name);
      navigation.navigate('Home');
    }
    else
    {
      Alert.alert(
        "Something went wrong!",
        "Login attempt failed.",
        [
          { text: "OK", onPress: () => console.log("OK Pressed") }
        ]
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