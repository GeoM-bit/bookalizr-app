import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, onSnapshot, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BottomNav from './bottomNav';

const ChatsScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const fetchChats = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        setLoading(false);
        setRefreshing(false);
        return null; 
      }
      
      setUserEmail(email);
      
      const q = query(
        collection(db, 'chats'), 
        where('participants', 'array-contains', email),
        orderBy('lastMessageTimestamp', 'desc')
      );
      
      const unsubscribeListener = onSnapshot(q, (querySnapshot) => {
        const chatList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setChats(chatList);
        setLoading(false);
        setRefreshing(false);
        
        checkUnreadMessages(chatList, email);
      }, (error) => {
        console.error("Error in snapshot listener:", error);
        setLoading(false);
        setRefreshing(false);
      });
      
      return unsubscribeListener;
    } catch (error) {
      console.error("Error fetching chats:", error);
      setLoading(false);
      setRefreshing(false);
      return null; 
    }
  }, []);
  
  const checkUnreadMessages = useCallback(async (chatsList, userEmailToCheck) => {
    try {
      const email = userEmailToCheck || userEmail;
      if (!email) return;
      
      const unreadCountsObj = {};
      
      for (const chat of chatsList) {
        const messagesRef = collection(db, 'chats', chat.id, 'messages');
        const unreadQuery = query(
          messagesRef,
          where('sender', '!=', email),
          where('read', '==', false)
        );
        
        const unreadSnapshot = await getDocs(unreadQuery);
        unreadCountsObj[chat.id] = unreadSnapshot.size;
      }
      
      setUnreadCounts(unreadCountsObj);
    } catch (error) {
      console.error("Error checking unread messages:", error);
    }
  }, [userEmail]);
  
  useEffect(() => {
    if (!userEmail || chats.length === 0) return;
    
    checkUnreadMessages(chats, userEmail);
    
    const intervalId = setInterval(() => {
      console.log("Checking for unread messages...");
      checkUnreadMessages(chats, userEmail);
    }, 30000); 
    
    return () => {
      clearInterval(intervalId);
    };
  }, [userEmail, chats, checkUnreadMessages]);

  useEffect(() => {
    let unsubscribe = null;
    
    const setupListener = async () => {
      unsubscribe = await fetchChats();
    };
    
    setupListener();
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchChats]);
  useFocusEffect(
    useCallback(() => {
      let unsubscribe = null;
      
      const refreshChats = async () => {
        unsubscribe = await fetchChats();
      };
      
      refreshChats();    
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }, [fetchChats])
  );
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
  }, [fetchChats]);
  const handleChatPress = async (chat) => {
    const recipient = chat.participants.find(p => p !== userEmail);
    
    if (unreadCounts[chat.id] > 0) {
      try {
        const messagesRef = collection(db, 'chats', chat.id, 'messages');
        const unreadQuery = query(
          messagesRef, 
          where('sender', '!=', userEmail),
          where('read', '==', false)
        );
        
        const unreadSnapshot = await getDocs(unreadQuery);
        
        const batch = writeBatch(db);
        unreadSnapshot.forEach(doc => {
          batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
        
        setUnreadCounts(prev => ({
          ...prev,
          [chat.id]: 0
        }));
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
    
    navigation.navigate('Chat', {
      chatId: chat.id,
      recipient,
    });
  };const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = timestamp.toDate();
    const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Your chats will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }            renderItem={({ item }) => {
              const recipient = item.participants.find(p => p !== userEmail);
              const initials = recipient ? recipient.substring(0, 2).toUpperCase() : "??";
              const timestamp = item.lastMessageTimestamp ? formatMessageTime(item.lastMessageTimestamp) : '';
              const hasUnread = unreadCounts[item.id] > 0;
              const unreadCount = unreadCounts[item.id] || 0;
              
              return (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={() => handleChatPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatNameRow}>
                      <Text style={[
                        styles.recipientName,
                        hasUnread && styles.recipientNameUnread
                      ]} numberOfLines={1}>
                        {recipient}
                      </Text>
                      <Text style={[
                        styles.timeText,
                        hasUnread && styles.timeTextUnread
                      ]}>{timestamp}</Text>
                    </View>
                    <View style={styles.lastMessageRow}>
                      <Text style={[
                        styles.lastMessage,
                        hasUnread && styles.lastMessageUnread
                      ]} numberOfLines={1}>
                        {item.lastMessage || 'Start a conversation'}
                      </Text>
                      {hasUnread && (
                        <View style={styles.unreadBadgeContainer}>
                          <View style={styles.unreadBadge} />
                          {unreadCount > 1 && (
                            <Text style={styles.unreadCountText}>{unreadCount}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
      <BottomNav navigation={navigation}></BottomNav>
    </SafeAreaView>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  container: { 
    flex: 1, 
    backgroundColor: '#F0F2F5'
  },  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold'
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    paddingBottom: 20
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18
  },  chatInfo: {
    flex: 1
  },
  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },  recipientName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1
  },
  recipientNameUnread: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8
  },
  timeTextUnread: {
    color: 'black',
    fontWeight: '500'
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#7A7A7A',
    flex: 1
  },
  lastMessageUnread: {
    color: '#000000',
    fontWeight: '500'
  },  unreadBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'black',
  },
  unreadCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 4
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#666666'
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999999',
    marginTop: 8
  },
  chatText: { 
    fontSize: 16 
  },
});