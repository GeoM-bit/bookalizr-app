import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNav = ({ navigation }) => {
  return (
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navIcon}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={28} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navIcon}
          onPress={() => navigation.navigate('Camera')}
        >
          <Ionicons name="camera-outline" size={28} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navIcon}
          onPress={() => navigation.navigate('MyLibrary')}
        >
          <Ionicons name="book-outline" size={28} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navIcon}
          onPress={() => navigation.navigate('Chats')}
        >
          <Ionicons name="chatbubble-outline" size={28} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navIcon}
          onPress={() => navigation.navigate('Account')}
        >
          <Ionicons name="person-outline" size={28} color="#333" />
        </TouchableOpacity>    
      </View>
  );
};

const styles = StyleSheet.create({    
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navIcon: {
    alignItems: 'center',
  },
});

export default BottomNav;