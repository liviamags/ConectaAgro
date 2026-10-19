import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function CadastroScreen() {
  const [tipoConta, setTipoConta] = useState<
    'produtor' | 'consumidor'
  >('produtor');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [nomePropriedade, setNomePropriedade] =
    useState('');

  const [tipoProducao, setTipoProducao] =
    useState('');

  const [cidade, setCidade] = useState('');

  const [enderecoPropriedade, setEnderecoPropriedade] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);

  async function criarConta() {
    if (
      !nome.trim() ||
      !email.trim() ||
      !telefone.trim() ||
      !senha.trim() ||
      !cidade.trim()
    ) {
      Alert.alert(
        'Campos incompletos',
        'Preencha todos os campos obrigatórios.'
      );

      return;
    }

    if (tipoConta === 'produtor') {
      if (
        !nomePropriedade.trim() ||
        !tipoProducao.trim() ||
        !enderecoPropriedade.trim()
      ) {
        Alert.alert(
          'Campos incompletos',
          'Preencha todos os dados da propriedade.'
        );

        return;
      }
    }

    if (senha.length < 6) {
      Alert.alert(
        'Senha inválida',
        'A senha precisa ter pelo menos 6 caracteres.'
      );

      return;
    }

    setCarregando(true);

    try {
      const role =
        tipoConta === 'produtor'
          ? 'produtor'
          : 'comprador';

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: senha,

          options: {
            emailRedirectTo: 'conectaagro://',

            data: {
              nome: nome.trim(),
              telefone: telefone.trim(),
              role,

              cidade: cidade.trim(),

              nome_propriedade:
                tipoConta === 'produtor'
                  ? nomePropriedade.trim()
                  : null,

              tipo_producao:
                tipoConta === 'produtor'
                  ? tipoProducao.trim()
                  : null,

              endereco_propriedade:
                tipoConta === 'produtor'
                  ? enderecoPropriedade.trim()
                  : null,
            },
          },
        });

      if (error) {
        Alert.alert(
          'Não foi possível criar a conta',
          error.message
        );

        return;
      }

      if (!data.user) {
        Alert.alert(
          'Erro no cadastro',
          'Não foi possível criar o usuário.'
        );

        return;
      }

      /*
       * O registro em profiles não é criado
       * manualmente pelo aplicativo.
       *
       * O trigger handle_new_user, criado no
       * Supabase, cria o profile automaticamente
       * quando o usuário é criado no Auth.
       */

      if (!data.session) {
        Alert.alert(
          'Confirme seu e-mail',
          'Sua conta foi criada! Enviamos um e-mail de confirmação. Confirme seu endereço de e-mail e depois volte ao ConectaAgro para entrar.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/login');
              },
            },
          ]
        );

        return;
      }

      Alert.alert(
        'Conta criada!',
        'Seu cadastro foi realizado com sucesso.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        'Erro inesperado no cadastro:',
        error
      );

      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado ao criar sua conta.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={carregando}
        >
          <Text style={styles.backButtonText}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            Criar conta
          </Text>

          <Text style={styles.subtitle}>
            Preencha seus dados
          </Text>

          <View style={styles.accountTypeContainer}>
            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                tipoConta === 'produtor' &&
                  styles.accountTypeButtonSelected,
              ]}
              onPress={() => setTipoConta('produtor')}
              disabled={carregando}
            >
              <Text
                style={[
                  styles.accountTypeText,
                  tipoConta === 'produtor' &&
                    styles.accountTypeTextSelected,
                ]}
              >
                Sou produtor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                tipoConta === 'consumidor' &&
                  styles.accountTypeButtonSelected,
              ]}
              onPress={() => setTipoConta('consumidor')}
              disabled={carregando}
            >
              <Text
                style={[
                  styles.accountTypeText,
                  tipoConta === 'consumidor' &&
                    styles.accountTypeTextSelected,
                ]}
              >
                Sou consumidor
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            Nome completo
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="#888888"
            value={nome}
            onChangeText={setNome}
            editable={!carregando}
          />

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
            value={email}
            onChangeText={setEmail}
            editable={!carregando}
          />

          <Text style={styles.label}>
            Telefone
          </Text>

          <TextInput
            style={styles.input}
            placeholder="(31) 99999-9999"
            placeholderTextColor="#888888"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
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

          {tipoConta === 'produtor' && (
            <>
              <Text style={styles.label}>
                Nome da propriedade
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex: Sítio Boa Esperança"
                placeholderTextColor="#888888"
                value={nomePropriedade}
                onChangeText={setNomePropriedade}
                editable={!carregando}
              />

              <Text style={styles.label}>
                Tipo de produção
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex: Hortaliças, frutas..."
                placeholderTextColor="#888888"
                value={tipoProducao}
                onChangeText={setTipoProducao}
                editable={!carregando}
              />

              <Text style={styles.label}>
                Cidade
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Sua cidade"
                placeholderTextColor="#888888"
                value={cidade}
                onChangeText={setCidade}
                editable={!carregando}
              />

              <Text style={styles.label}>
                Endereço da propriedade
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Endereço"
                placeholderTextColor="#888888"
                value={enderecoPropriedade}
                onChangeText={setEnderecoPropriedade}
                editable={!carregando}
              />
            </>
          )}

          {tipoConta === 'consumidor' && (
            <>
              <Text style={styles.label}>
                Cidade
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Sua cidade"
                placeholderTextColor="#888888"
                value={cidade}
                onChangeText={setCidade}
                editable={!carregando}
              />
            </>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              carregando &&
                styles.createButtonDisabled,
            ]}
            onPress={criarConta}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.createButtonText}>
                Criar conta
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
        </ImageBackground>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    flexGrow: 1,
  },

  formContainer: {
    paddingHorizontal: 32,
    paddingTop: 70,
    paddingBottom: 30,
  },

  backButton: {
    position: 'absolute',
    top: 25,
    left: 20,
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
    marginBottom: 24,
    color: '#444444',
  },

  accountTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  accountTypeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#004B0A',
    alignItems: 'center',
  },

  accountTypeButtonSelected: {
    backgroundColor: '#004B0A',
  },

  accountTypeText: {
    color: '#004B0A',
    fontWeight: '600',
  },

  accountTypeTextSelected: {
    color: '#FFFFFF',
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
    marginBottom: 14,
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
    marginBottom: 14,
  },

  senhaInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#000000',
    fontSize: 16,
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

  createButton: {
    alignSelf: 'center',
    minWidth: 130,
    minHeight: 45,
    backgroundColor: '#004B0A',
    paddingHorizontal: 34,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  createButtonDisabled: {
    opacity: 0.7,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomImage: {
    height: 310,
    width: '100%',
    marginBottom: -2,
  },

  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
});