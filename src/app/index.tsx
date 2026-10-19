
import { router } from 'expo-router';

import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <ImageBackground
      source={require('../../home-background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>
            Entrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push('/cadastro')}
        >
          <Text style={styles.registerButtonText}>
            Criar conta
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  buttonsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 42,
    paddingBottom: 140,
    gap: 12,
  },

  loginButton: {
    backgroundColor: '#004B0A',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#004B0A',
    alignItems: 'center',
  },

  registerButtonText: {
    color: '#000000',
    fontSize: 16,
  },
});
