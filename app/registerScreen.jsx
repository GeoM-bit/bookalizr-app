import { View, Text, TextInput, Button, ScrollView, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
     const payload = {
    name,
    email,
    password,
  };
        const response = await fetch('http://nobody.home.ro:8080/authentication/register', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        });

    if(response.ok)
    {
      navigation.navigate('Login');
      Alert.alert(
        "Your account was saved!",
        "You can now login.",
        [
          { text: "OK", onPress: () => console.log("OK Pressed") }
        ]
      );
    }
    else
    {
      Alert.alert(
        "Something went wrong!",
        "Your account could not be saved.",
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
        <Text style={Styles.title}>Sign Up</Text>
        <TextInput
          style={Styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name"
        />
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
          <Button title="Sign Up" onPress={handleRegister} color="black" />
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
  },
  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  }
});