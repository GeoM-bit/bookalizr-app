import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './homeScreen';
import CameraScreen from './cameraScreen';
import BookFoundScreen from './bookFoundScreen';
import AddNewBookScreen from './addNewBookScreen';
import BookListScreen from './bookListScreen';
import LoginScreen from './loginScreen';
import RegisterScreen from './registerScreen';
import MyLibraryScreen from './myLibraryScreen';
import AccountScreen from './accountScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
          name="Register"
          component={RegisterScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="Login"
          component={LoginScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="Camera" 
          component={CameraScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="BookFound" 
          component={BookFoundScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="AddNewBook" 
          component={AddNewBookScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="BookList" 
          component={BookListScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="MyLibrary" 
          component={MyLibraryScreen} 
          options={{ headerShown: false }}/>
          <Stack.Screen 
          name="Account" 
          component={AccountScreen} 
          options={{ headerShown: false }}/>
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default App;