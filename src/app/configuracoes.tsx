import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Preferencias = {
  notificacoes: boolean;
  novos_produtos: boolean;
  novos_excedentes: boolean;
  novas_publicacoes: boolean;
  usar_localizacao: boolean;
};

type ChavePreferencia = keyof Preferencias;

const preferenciasPadrao: Preferencias = {
  notificacoes: true,
  novos_produtos: true,
  novos_excedentes: true,
  novas_publicacoes: false,
  usar_localizacao: true,
};

export default function ConfiguracoesScreen() {
  const [usuarioId, setUsuarioId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [preferencias, setPreferencias] =
    useState<Preferencias>(preferenciasPadrao);

  const [mostrarSeguranca, setMostrarSeguranca] =
    useState(false);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    carregarPreferencias();
  }, []);

  async function carregarPreferencias() {
    try {
      setCarregando(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert(
          'Sessão encerrada',
          'Entre novamente na sua conta.'
        );

        router.replace('/login');
        return;
      }

      setUsuarioId(user.id);

      const { data, error } = await supabase
        .from('preferencias_usuario')
        .select(
          'notificacoes, novos_produtos, novos_excedentes, novas_publicacoes, usar_localizacao'
        )
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) {
        console.log(
          'Erro ao carregar preferências:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar suas preferências.'
        );
        return;
      }

      if (data) {
        setPreferencias({
          notificacoes: data.notificacoes,
          novos_produtos: data.novos_produtos,
          novos_excedentes: data.novos_excedentes,
          novas_publicacoes: data.novas_publicacoes,
          usar_localizacao: data.usar_localizacao,
        });
      } else {
        const { error: criarError } = await supabase
          .from('preferencias_usuario')
          .insert({
            usuario_id: user.id,
            ...preferenciasPadrao,
          });

        if (criarError) {
          console.log(
            'Erro ao criar preferências:',
            criarError
          );
        }

        setPreferencias(preferenciasPadrao);
      }
    } catch (error) {
      console.log(
        'Erro inesperado ao carregar preferências:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível carregar as configurações.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function alterarPreferencia(
    chave: ChavePreferencia,
    valor: boolean
  ) {
    if (!usuarioId || salvando) return;

    const anteriores = { ...preferencias };

    const novasPreferencias = {
      ...preferencias,
      [chave]: valor,
    };

    setPreferencias(novasPreferencias);
    setSalvando(true);

    try {
      const { error } = await supabase
        .from('preferencias_usuario')
        .upsert(
          {
            usuario_id: usuarioId,
            ...novasPreferencias,
          },
          {
            onConflict: 'usuario_id',
          }
        );

      if (error) {
        console.log(
          'Erro ao salvar preferência:',
          error
        );

        setPreferencias(anteriores);

        Alert.alert(
          'Erro',
          'Não foi possível salvar essa configuração.'
        );
      }
    } catch (error) {
      console.log(
        'Erro inesperado ao salvar preferência:',
        error
      );

      setPreferencias(anteriores);

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao salvar a configuração.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSenha() {
    if (salvandoSenha) return;

    if (novaSenha.length < 6) {
      Alert.alert(
        'Senha inválida',
        'A nova senha deve ter pelo menos 6 caracteres.'
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert(
        'Senhas diferentes',
        'A confirmação precisa ser igual à nova senha.'
      );
      return;
    }

    try {
      setSalvandoSenha(true);

      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        console.log('Erro ao alterar senha:', error);

        Alert.alert(
          'Erro ao alterar senha',
          error.message
        );
        return;
      }

      setNovaSenha('');
      setConfirmarSenha('');
      setMostrarSeguranca(false);

      Alert.alert(
        'Senha atualizada!',
        'Sua senha foi alterada com sucesso.'
      );
    } catch (error) {
      console.log(
        'Erro inesperado ao alterar senha:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível alterar a senha.'
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  function confirmarSaida() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza de que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: sairDaConta,
        },
      ]
    );
  }

  async function sairDaConta() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log('Erro ao sair:', error);

        Alert.alert(
          'Erro',
          'Não foi possível sair da conta.'
        );
        return;
      }

      router.replace('/login');
    } catch (error) {
      console.log('Erro inesperado ao sair:', error);

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao encerrar a sessão.'
      );
    }
  }

  function mostrarAvisoNotificacoes() {
    Alert.alert(
      'Preferências salvas',
      'Suas escolhas ficam registradas na sua conta. O envio automático de notificações ainda não está disponível nesta versão do ConectaAgro.'
    );
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#004B0A"
        />

        <Text style={styles.loadingText}>
          Carregando configurações...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Configurações
          </Text>

          <Text style={styles.headerSubtitle}>
            Personalize sua experiência
          </Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>
          Notificações
        </Text>

        <View style={styles.card}>
          <ItemConfiguracao
            icone="notifications-outline"
            titulo="Notificações"
            descricao="Guardar sua preferência de notificações"
            valor={preferencias.notificacoes}
            desabilitado={salvando}
            onChange={(valor) =>
              alterarPreferencia('notificacoes', valor)
            }
          />

          <View style={styles.divider} />

          <ItemConfiguracao
            icone="basket-outline"
            titulo="Novos produtos"
            descricao="Preferência para avisos de novos produtos"
            valor={preferencias.novos_produtos}
            desabilitado={
              salvando || !preferencias.notificacoes
            }
            onChange={(valor) =>
              alterarPreferencia('novos_produtos', valor)
            }
          />

          <View style={styles.divider} />

          <ItemConfiguracao
            icone="leaf-outline"
            titulo="Novos excedentes"
            descricao="Preferência para ofertas contra o desperdício"
            valor={preferencias.novos_excedentes}
            desabilitado={
              salvando || !preferencias.notificacoes
            }
            onChange={(valor) =>
              alterarPreferencia('novos_excedentes', valor)
            }
          />

          <View style={styles.divider} />

          <ItemConfiguracao
            icone="newspaper-outline"
            titulo="Publicações"
            descricao="Preferência para novidades dos produtores"
            valor={preferencias.novas_publicacoes}
            desabilitado={
              salvando || !preferencias.notificacoes
            }
            onChange={(valor) =>
              alterarPreferencia('novas_publicacoes', valor)
            }
          />
        </View>

        <TouchableOpacity
          style={styles.noticeCard}
          onPress={mostrarAvisoNotificacoes}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#004B0A"
          />

          <Text style={styles.noticeText}>
            As preferências são salvas na sua conta.
            O envio automático de notificações ainda
            não está disponível no protótipo.
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Localização
        </Text>

        <View style={styles.card}>
          <ItemConfiguracao
            icone="location-outline"
            titulo="Usar minha localização"
            descricao="Guardar sua preferência de localização"
            valor={preferencias.usar_localizacao}
            desabilitado={salvando}
            onChange={(valor) =>
              alterarPreferencia('usar_localizacao', valor)
            }
          />

          <View style={styles.divider} />

          <ItemAcao
            icone="map-outline"
            titulo="Mapa de produtores"
            descricao="Visualize produtores da região"
            onPress={() => router.push('/mapa')}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Conta
        </Text>

        <View style={styles.card}>
          <ItemAcao
            icone="person-outline"
            titulo="Dados pessoais"
            descricao="Nome, e-mail, telefone e cidade"
            onPress={() => router.push('/perfil')}
          />

          <View style={styles.divider} />

          <ItemAcao
            icone="lock-closed-outline"
            titulo="Segurança"
            descricao="Alterar senha da conta"
            onPress={() =>
              setMostrarSeguranca(!mostrarSeguranca)
            }
          />

          {mostrarSeguranca && (
            <View style={styles.securityForm}>
              <Text style={styles.securityTitle}>
                Alterar senha
              </Text>

              <Text style={styles.inputLabel}>
                Nova senha
              </Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  placeholder="Digite a nova senha"
                  placeholderTextColor="#999999"
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  editable={!salvandoSenha}
                />

                <TouchableOpacity
                  onPress={() =>
                    setMostrarSenha(!mostrarSenha)
                  }
                >
                  <Ionicons
                    name={
                      mostrarSenha
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={21}
                    color="#777777"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>
                Confirmar nova senha
              </Text>

              <TextInput
                style={styles.input}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Repita a nova senha"
                placeholderTextColor="#999999"
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                editable={!salvandoSenha}
              />

              <TouchableOpacity
                style={styles.savePasswordButton}
                onPress={alterarSenha}
                disabled={salvandoSenha}
              >
                {salvandoSenha ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.savePasswordText}>
                    Salvar nova senha
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.securityHint}>
                A senha deve ter pelo menos 6 caracteres.
                Por segurança, o Supabase poderá exigir
                uma nova autenticação em algumas situações.
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <ItemAcao
            icone="log-out-outline"
            titulo="Sair da conta"
            descricao="Encerrar sua sessão no ConectaAgro"
            onPress={confirmarSaida}
            vermelho
          />
        </View>

        <Text style={styles.sectionTitle}>
          Aplicativo
        </Text>

        <View style={styles.card}>
          <ItemAcao
            icone="document-text-outline"
            titulo="Termos e privacidade"
            descricao="Informações sobre uso e dados"
            onPress={() =>
              Alert.alert(
                'Termos e privacidade',
                'O ConectaAgro é um projeto educacional em desenvolvimento. Esta versão ainda não possui documentos definitivos de termos de uso e política de privacidade.'
              )
            }
          />

          <View style={styles.divider} />

          <ItemAcao
            icone="information-circle-outline"
            titulo="Sobre"
            descricao="Informações sobre o ConectaAgro"
            onPress={() =>
              Alert.alert(
                'Sobre o ConectaAgro',
                'O ConectaAgro conecta consumidores a pequenos produtores locais, promovendo visibilidade, oportunidades de venda e redução do desperdício de alimentos.'
              )
            }
          />
        </View>

        <View style={styles.prototypeCard}>
          <Ionicons
            name="cloud-done-outline"
            size={21}
            color="#004B0A"
          />

          <Text style={styles.prototypeText}>
            Suas preferências são armazenadas no
            Supabase e permanecem salvas na sua conta.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ItemConfiguracao({
  icone,
  titulo,
  descricao,
  valor,
  desabilitado,
  onChange,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  valor: boolean;
  desabilitado: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons
          name={icone}
          size={21}
          color="#004B0A"
        />
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>
          {titulo}
        </Text>

        <Text style={styles.settingDescription}>
          {descricao}
        </Text>
      </View>

      <Switch
        value={valor}
        onValueChange={onChange}
        disabled={desabilitado}
        trackColor={{
          false: '#DADADA',
          true: '#AAC8AE',
        }}
        thumbColor={
          valor && !desabilitado
            ? '#004B0A'
            : '#F4F4F4'
        }
      />
    </View>
  );
}

function ItemAcao({
  icone,
  titulo,
  descricao,
  onPress,
  vermelho = false,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  onPress: () => void;
  vermelho?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={onPress}
    >
      <View
        style={
          vermelho
            ? styles.logoutIcon
            : styles.settingIcon
        }
      >
        <Ionicons
          name={icone}
          size={21}
          color={
            vermelho ? '#B3261E' : '#004B0A'
          }
        />
      </View>

      <View style={styles.settingContent}>
        <Text
          style={
            vermelho
              ? styles.logoutTitle
              : styles.settingTitle
          }
        >
          {titulo}
        </Text>

        <Text style={styles.settingDescription}>
          {descricao}
        </Text>
      </View>

      {!vermelho && (
        <Ionicons
          name="chevron-forward"
          size={19}
          color="#999999"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#777777',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 27,
    paddingBottom: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },

  headerSubtitle: {
    fontSize: 8,
    color: '#777777',
    marginTop: 2,
  },

  headerSpace: {
    width: 42,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 45,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 9,
    marginLeft: 2,
    color: '#222222',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    overflow: 'hidden',
  },

  settingItem: {
    minHeight: 76,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionItem: {
    minHeight: 76,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  settingTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#222222',
  },

  logoutTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B3261E',
  },

  settingDescription: {
    fontSize: 8,
    lineHeight: 12,
    color: '#777777',
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginLeft: 66,
  },

  noticeCard: {
    backgroundColor: '#EDF5EE',
    borderRadius: 11,
    padding: 13,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  noticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    color: '#555555',
  },

  securityForm: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FAFCFA',
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 14,
    marginBottom: 15,
  },

  passwordContainer: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: '#000000',
  },

  savePasswordButton: {
    backgroundColor: '#004B0A',
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
  },

  savePasswordText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  securityHint: {
    fontSize: 9,
    color: '#777777',
    lineHeight: 14,
    marginTop: 12,
  },

  prototypeCard: {
    backgroundColor: '#E7F1E8',
    borderRadius: 11,
    padding: 13,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  prototypeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    color: '#555555',
  },
});