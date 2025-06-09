// ChatsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const ChatsScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email);

      const q = query(collection(db, 'chats'), where('participants', 'array-contains', email));
      const querySnapshot = await getDocs(q);
      
      const chatList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setChats(chatList);
    };

    fetchChats();
  }, []);

  const handleChatPress = (chat) => {
    const recipient = chat.participants.find(p => p !== userEmail);
    navigation.navigate('Chat', {
      chatId: chat.id,
      recipient,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Conversations</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const recipient = item.participants.find(p => p !== userEmail);
          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => handleChatPress(item)}
            >
              <Text style={styles.chatText}>Chat with {recipient}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  chatText: { fontSize: 16 },
});
