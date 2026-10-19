import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Digite seu e-mail e sua senha.'
      );
      return;
    }

    setCarregando(true);

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (loginError) {
        Alert.alert(
          'Não foi possível entrar',
          loginError.message
        );
        return;
      }

      if (!data.user) {
        Alert.alert(
          'Erro no login',
          'Não foi possível identificar o usuário.'
        );
        return;
      }

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, role')
        .eq('id', data.user.id)
        .single();

      if (perfilError) {
        console.log(
          'Erro ao buscar perfil:',
          perfilError
        );

        Alert.alert(
          'Erro ao carregar perfil',
          'Sua conta foi autenticada, mas não foi possível carregar seu perfil.'
        );

        await supabase.auth.signOut();
        return;
      }

      if (!perfil) {
        Alert.alert(
          'Perfil não encontrado',
          'Não encontramos os dados do seu perfil.'
        );

        await supabase.auth.signOut();
        return;
      }

      if (perfil.role === 'produtor') {
        router.replace('/area-produtor/inicio');
        return;
      }

      if (perfil.role === 'comprador') {
        router.replace('/inicio');
        return;
      }

      if (perfil.role === 'afiliado') {
        Alert.alert(
          'Conta de afiliado',
          'A área específica de afiliados ainda não foi configurada.'
        );

        await supabase.auth.signOut();
        return;
      }

      Alert.alert(
        'Tipo de conta inválido',
        'Não foi possível identificar o tipo da sua conta.'
      );

      await supabase.auth.signOut();
    } catch (error) {
      console.log(
        'Erro inesperado no login:',
        error
      );

      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado ao entrar.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
          disabled={carregando}
        >
          <Text style={styles.backButtonText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Bem-Vindo(a)!
        </Text>

        <Text style={styles.subtitle}>
          Entre para continuar
        </Text>

        <Text style={styles.label}>
          E-mail
        </Text>

        <TextInput
          style={styles.input}
          placeholder="seu@gmail.com"
          placeholderTextColor="#888888"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#004B0A"
          value={email}
          onChangeText={setEmail}
          editable={!carregando}
        />

        <Text style={styles.label}>
          Senha
        </Text>

        <View style={styles.senhaContainer}>
          <TextInput
            style={styles.senhaInput}
            placeholder="Digite sua senha"
            placeholderTextColor="#888888"
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor="#004B0A"
            value={senha}
            onChangeText={setSenha}
            editable={!carregando}
          />

          <TouchableOpacity
            style={styles.mostrarSenhaButton}
            onPress={() => setMostrarSenha(!mostrarSenha)}
            disabled={carregando}
            accessibilityRole="button"
            accessibilityLabel={
              mostrarSenha
                ? 'Ocultar senha'
                : 'Mostrar senha'
            }
          >
            <Text style={styles.mostrarSenhaText}>
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            carregando && styles.loginButtonDisabled,
          ]}
          onPress={entrar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.loginButtonText}>
              Entrar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ImageBackground
        source={require('../../assets/images/login-background.jpeg')}
        style={styles.bottomImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            '#FFFFFF',
            'rgba(255,255,255,0.85)',
            'rgba(255,255,255,0)',
          ]}
          style={styles.gradient}
        />

        <View style={styles.bottomContent}>
          <Text style={styles.orText}>
            ou
          </Text>

          <Text style={styles.registerText}>
            Ainda não possui uma conta?{' '}
            <Text
              style={styles.registerLink}
              onPress={() => router.push('/cadastro')}
            >
              Inscreva-se.
            </Text>
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 35,
    left: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  backButtonText: {
    fontSize: 40,
    color: '#004B0A',
    lineHeight: 40,
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  formContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
  },

  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
    color: '#444444',
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#000000',
  },

  input: {
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 16,
  },

  senhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginBottom: 18,
  },

  senhaInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#000000',
    fontSize: 16,
    minWidth: 0,
  },

  mostrarSenhaButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mostrarSenhaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#004B0A',
  },

  loginButton: {
    alignSelf: 'center',
    minWidth: 100,
    minHeight: 42,
    backgroundColor: '#004B0A',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  bottomImage: {
    height: 300,
    width: '100%',
  },

  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },

  bottomContent: {
    alignItems: 'center',
    paddingTop: 20,
  },

  orText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 40,
  },

  registerText: {
    fontSize: 13,
    color: '#146B28',
    fontWeight: '500',
  },

  registerLink: {
    color: '#004B0A',
    fontWeight: 'bold',
  },
});