import { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatScreen = ({ route }) => {
  const { chatId, recipient } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, snapshot => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: input,
      sender: userEmail,
      timestamp: serverTimestamp()
    });
    setInput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat with {recipient}</Text>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <Text
            style={{
              textAlign: item.sender === userEmail ? 'right' : 'left',
              marginVertical: 2,
              backgroundColor: item.sender === userEmail ? '#dcf8c6' : '#fff',
              padding: 8,
              borderRadius: 5,
              marginHorizontal: 10,
            }}
          >
            {item.text}
          </Text>
        )}
        keyExtractor={item => item.id}
      />
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message"
        style={styles.input}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  input: {
    borderWidth: 1,
    margin: 10,
    padding: 10,
    borderRadius: 5
  }
});

export default ChatScreen;