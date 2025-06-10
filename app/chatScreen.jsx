import { useEffect, useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, recipient } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

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
      const messageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messageData);
      
      if (messageData.length > 0 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
      
      if (userEmail) {
        markMessagesAsRead(snapshot.docs, userEmail);
      }
    });
    return () => unsubscribe();
  }, [chatId, userEmail]);
  
  const markMessagesAsRead = async (messageDocs, currentUserEmail) => {
    try {
      const batch = writeBatch(db);
      let hasUnreadMessages = false;
      
      messageDocs.forEach(messageDoc => {
        const messageData = messageDoc.data();
        if (messageData.sender !== currentUserEmail && messageData.read === false) {
          batch.update(messageDoc.ref, { read: true });
          hasUnreadMessages = true;
        }
      });
      
      if (hasUnreadMessages) {
        await batch.commit();
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };
  const handleInputChange = (text) => {
    setInput(text);
  };
    const sendMessage = async () => {
    if (!input.trim()) return;
    
    try {
      setSending(true);
      const trimmedInput = input.trim();
      setInput('');
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: trimmedInput,
        sender: userEmail,
        timestamp: serverTimestamp(),
        read: false
      });
      
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: trimmedInput,
        lastMessageTimestamp: serverTimestamp()
      });
      
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={20}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {recipient ? recipient.substring(0, 2).toUpperCase() : "??"}
            </Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{recipient}</Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          style={styles.messageList}   
          contentContainerStyle={[
            styles.messageListContent,
            { paddingBottom: 20 } 
          ]}
          keyExtractor={item => item.id}
          onContentSizeChange={() => 
            messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={({ item }) => {
            const isCurrentUser = item.sender === userEmail;
            const timeString = item.timestamp ? new Date(item.timestamp.toDate()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }) : '';
              return (
              <View style={[
                styles.messageContainer,
                isCurrentUser ? styles.currentUserMessageContainer : styles.otherUserMessageContainer
              ]}>
                <View style={[
                  styles.messageBubble,
                  isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
                ]}>
                  <Text style={styles.messageText}>{item.text}</Text>
                  <View style={styles.messageFooter}>
                    <Text style={styles.messageTime}>{timeString}</Text>
                    {isCurrentUser && (
                      <Ionicons 
                        name={item.read ? "checkmark-done" : "checkmark"} 
                        size={14} 
                        color={item.read ? "#4FC3F7" : "#8E8E93"} 
                        style={styles.readStatus} 
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            style={styles.input}
            multiline={true}
            autoCorrect={true}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}      
          </TouchableOpacity>    
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5'
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    backgroundColor: '#FFFFFF'
  },
  backButton: {
    paddingRight: 12
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1
  },
  messageList: {
    flex: 1,
    backgroundColor: '#F0F2F5'
  },
  messageListContent: {
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%'
  },
  currentUserMessageContainer: {
    alignSelf: 'flex-end'
  },
  otherUserMessageContainer: {
    alignSelf: 'flex-start'
  },  messageBubble: {
    padding: 12,
    borderRadius: 18,
    minWidth: 80,
    elevation: 1, 
    maxWidth: '100%' 
  },
  currentUserBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4
  },messageText: {
    fontSize: 16,
    lineHeight: 20,
  },  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2
  },
  messageTime: {
    fontSize: 11,
    color: '#7A7A7A',
  },  readStatus: {
    marginLeft: 4,
    marginTop: 1 
  },inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    elevation: 3, 
    paddingBottom: 12 
  },
  attachButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4
  },  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'center'
  },
  sendButton: {
    backgroundColor: 'black',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },  sendButtonDisabled: {
    backgroundColor: 'grey'
  }
});

export default ChatScreen;