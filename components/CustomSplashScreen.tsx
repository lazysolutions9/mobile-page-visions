import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

const CustomSplashScreen = ({ onFinish }: CustomSplashScreenProps) => {
  useEffect(() => {
    // Hide the native splash screen
    SplashScreen.hideAsync();

    // Show custom splash for 2 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../fikloLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>FIKLO</Text>
        <Text style={styles.tagline}>Find it Closer</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '500',
  },
});

export default CustomSplashScreen; 