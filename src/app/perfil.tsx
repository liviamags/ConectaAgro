import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Perfil = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  role: string | null;
  avatar_url: string | null;
};
type MenuProps = {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo: string;
  onPress: () => void;
};
function ItemMenu({
  icone,
  titulo,
  subtitulo,
  onPress,
}: MenuProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icone} size={21} color="#004B0A" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{titulo}</Text>
        <Text style={styles.menuSubtitle}>{subtitulo}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={19}
        color="#999999"
      />
    </TouchableOpacity>
  );
}
function ItemNavegacao({
  icone,
  titulo,
  onPress,
  ativo = false,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  onPress: () => void;
  ativo?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons
        name={icone}
        size={22}
        color={ativo ? '#004B0A' : '#777777'}
      />
      <Text
        style={ativo ? styles.navTextActive : styles.navText}
      >
        {titulo}
      </Text>
    </TouchableOpacity>
  );
}
export default function PerfilScreen() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const carregarPerfil = useCallback(async () => {
    try {
      const { data: usuario, error: authError } =
        await supabase.auth.getUser();
      if (authError || !usuario.user) {
        router.replace('/login');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, nome, email, telefone, cidade, role, avatar_url'
        )
        .eq('id', usuario.user.id)
        .single();
      if (error) {
        console.log('Erro ao carregar perfil:', error);
        Alert.alert(
          'Erro',
          'Não foi possível carregar os dados do perfil.'
        );
        return;
      }
      setPerfil(data);
      setNome(data.nome ?? '');
      setTelefone(data.telefone ?? '');
      setCidade(data.cidade ?? '');
    } catch (error) {
      console.log('Erro inesperado:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao carregar o perfil.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );
  function abrirEdicao() {
    if (!perfil) return;
    setNome(perfil.nome ?? '');
    setTelefone(perfil.telefone ?? '');
    setCidade(perfil.cidade ?? '');
    setEditando(true);
  }
  function cancelarEdicao() {
    setEditando(false);
  }
  async function salvarPerfil() {
    if (!perfil) return;
    if (!nome.trim() || !cidade.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha seu nome e sua cidade.'
      );
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: nome.trim(),
          telefone: telefone.trim(),
          cidade: cidade.trim(),
        })
        .eq('id', perfil.id);
      if (error) {
        console.log('Erro ao salvar perfil:', error);
        Alert.alert(
          'Erro',
          'Não foi possível salvar as alterações.'
        );
        return;
      }
      setPerfil({
        ...perfil,
        nome: nome.trim(),
        telefone: telefone.trim(),
        cidade: cidade.trim(),
      });
      setEditando(false);
      Alert.alert(
        'Perfil atualizado',
        'Suas informações foram salvas com sucesso.'
      );
    } catch (error) {
      console.log('Erro inesperado ao salvar:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao atualizar o perfil.'
      );
    } finally {
      setSalvando(false);
    }
  }
  async function escolherFotoPerfil() {
    if (!perfil || enviandoFoto) return;
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à galeria para escolher uma foto.'
        );
        return;
      }
      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      if (resultado.canceled || !resultado.assets.length) {
        return;
      }
      setEnviandoFoto(true);
      const imagem = resultado.assets[0];
      const extensaoOriginal =
        imagem.fileName?.split('.').pop()?.toLowerCase() ||
        imagem.uri.split('.').pop()?.toLowerCase() ||
        'jpg';
      const extensao =
        ['jpg', 'jpeg', 'png', 'webp'].includes(extensaoOriginal)
          ? extensaoOriginal
          : 'jpg';
      const contentType =
        imagem.mimeType ||
        (extensao === 'png'
          ? 'image/png'
          : extensao === 'webp'
            ? 'image/webp'
            : 'image/jpeg');
      const base64 = await FileSystem.readAsStringAsync(
        imagem.uri,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );
      const caracteres =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let bits = 0;
      let valor = 0;
      const bytes: number[] = [];
      for (const caractere of base64.replace(/=+$/, '')) {
        valor =
          (valor << 6) | caracteres.indexOf(caractere);
        bits += 6;
        if (bits >= 8) {
          bits -= 8;
          bytes.push((valor >> bits) & 0xff);
        }
      }
      if (bytes.length > 5 * 1024 * 1024) {
        Alert.alert(
          'Imagem muito grande',
          'Escolha uma imagem de até 5 MB.'
        );
        return;
      }
      // Cada foto recebe um nome diferente para evitar
      // problemas de cache e sobrescrita no Storage.
      const caminhoFoto =
        `${perfil.id}/perfil-${Date.now()}.${extensao}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(caminhoFoto, new Uint8Array(bytes), {
          contentType,
          upsert: false,
        });
      if (uploadError) {
        console.log('Erro ao enviar foto:', uploadError);
        Alert.alert(
          'Erro ao enviar foto',
          uploadError.message
        );
        return;
      }
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(caminhoFoto);
      const novaUrl = urlData.publicUrl;
      const { error: salvarFotoError } = await supabase
        .from('profiles')
        .update({ avatar_url: novaUrl })
        .eq('id', perfil.id);
      if (salvarFotoError) {
        console.log(
          'Erro ao salvar URL da foto:',
          salvarFotoError
        );
        Alert.alert(
          'Erro',
          'A foto foi enviada, mas não foi possível vinculá-la ao perfil.'
        );
        return;
      }
      setPerfil((atual) =>
        atual
          ? { ...atual, avatar_url: novaUrl }
          : atual
      );
      Alert.alert(
        'Foto atualizada!',
        'Sua nova foto de perfil foi salva com sucesso.'
      );
    } catch (error) {
      console.log(
        'Erro inesperado ao atualizar foto:',
        error
      );
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao atualizar a foto.'
      );
    } finally {
      setEnviandoFoto(false);
    }
  }
  function sairDaConta() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair do ConectaAgro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            const { error } =
              await supabase.auth.signOut();
            if (error) {
              Alert.alert(
                'Erro',
                'Não foi possível sair da conta.'
              );
              return;
            }
            router.replace('/login');
          },
        },
      ]
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
          Carregando perfil...
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu perfil</Text>
          <TouchableOpacity
            style={styles.settingsTopButton}
            onPress={() => router.push('/configuracoes')}
          >
            <Ionicons
              name="settings-outline"
              size={23}
              color="#004B0A"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={escolherFotoPerfil}
            disabled={enviandoFoto}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {perfil?.avatar_url ? (
                <Image
                  source={{ uri: perfil.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={46}
                  color="#004B0A"
                />
              )}
            </View>
            <View style={styles.cameraBadge}>
              {enviandoFoto ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={15}
                  color="#FFFFFF"
                />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>
            {enviandoFoto
              ? 'Salvando foto...'
              : 'Toque na foto para alterar'}
          </Text>
          <Text style={styles.name}>
            {perfil?.nome || 'Consumidor ConectaAgro'}
          </Text>
          <View style={styles.userTypeBadge}>
            <Ionicons
              name="basket-outline"
              size={14}
              color="#004B0A"
            />
            <Text style={styles.userTypeText}>
              Consumidor(a)
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color="#777777"
            />
            <Text style={styles.locationText}>
              {perfil?.cidade || 'Cidade não informada'}
            </Text>
          </View>
          {!!perfil?.email && (
            <View style={styles.locationRow}>
              <Ionicons
                name="mail-outline"
                size={16}
                color="#777777"
              />
              <Text style={styles.locationText}>
                {perfil.email}
              </Text>
            </View>
          )}
          {!!perfil?.telefone && (
            <View style={styles.locationRow}>
              <Ionicons
                name="call-outline"
                size={16}
                color="#777777"
              />
              <Text style={styles.locationText}>
                {perfil.telefone}
              </Text>
            </View>
          )}
          {!editando && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={abrirEdicao}
            >
              <Ionicons
                name="create-outline"
                size={17}
                color="#004B0A"
              />
              <Text style={styles.editButtonText}>
                Editar perfil
              </Text>
            </TouchableOpacity>
          )}
          {editando && (
            <View style={styles.editForm}>
              <Text style={styles.editTitle}>
                Editar informações
              </Text>
              <Text style={styles.label}>
                Nome completo
              </Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                placeholderTextColor="#888888"
                editable={!salvando}
              />
              <Text style={styles.label}>
                Telefone
              </Text>
              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(31) 99999-9999"
                placeholderTextColor="#888888"
                keyboardType="phone-pad"
                editable={!salvando}
              />
              <Text style={styles.label}>
                Cidade
              </Text>
              <TextInput
                style={styles.input}
                value={cidade}
                onChangeText={setCidade}
                placeholder="Sua cidade"
                placeholderTextColor="#888888"
                editable={!salvando}
              />
              <Text style={styles.label}>
                E-mail
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.disabledInput,
                ]}
                value={perfil?.email ?? ''}
                editable={false}
              />
              <Text style={styles.emailHint}>
                O e-mail não pode ser alterado nesta tela.
              </Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={salvarPerfil}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Salvar alterações
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelarEdicao}
                disabled={salvando}
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.summaryContainer}>
          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => router.push('/meus-pedidos')}
          >
            <View style={styles.summaryIcon}>
              <Ionicons
                name="bag-handle-outline"
                size={21}
                color="#004B0A"
              />
            </View>
            <Text style={styles.summaryValue}>Meus</Text>
            <Text style={styles.summaryLabel}>
              pedidos
            </Text>
          </TouchableOpacity>
          <View style={styles.summaryDivider} />
          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => router.push('/afiliacoes')}
          >
            <View style={styles.summaryIcon}>
              <Ionicons
                name="megaphone-outline"
                size={21}
                color="#004B0A"
              />
            </View>
            <Text style={styles.summaryValue}>Minhas</Text>
            <Text style={styles.summaryLabel}>
              afiliações
            </Text>
          </TouchableOpacity>
          <View style={styles.summaryDivider} />
          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => router.push('/excedentes')}
          >
            <View style={styles.summaryIcon}>
              <Ionicons
                name="leaf-outline"
                size={21}
                color="#004B0A"
              />
            </View>
            <Text style={styles.summaryValue}>Ver</Text>
            <Text style={styles.summaryLabel}>
              excedentes
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>
          Minha conta
        </Text>
        <View style={styles.menuCard}>
          <ItemMenu
            icone="receipt-outline"
            titulo="Meus pedidos"
            subtitulo="Acompanhe suas compras realizadas"
            onPress={() => router.push('/meus-pedidos')}
          />
          <View style={styles.divider} />
          <ItemMenu
            icone="megaphone-outline"
            titulo="Minhas afiliações"
            subtitulo="Veja seus códigos e oportunidades"
            onPress={() => router.push('/afiliacoes')}
          />
          <View style={styles.divider} />
          <ItemMenu
            icone="cart-outline"
            titulo="Meu carrinho"
            subtitulo="Veja os produtos selecionados"
            onPress={() => router.push('/carrinho')}
          />
        </View>
        <Text style={styles.sectionTitle}>
          Preferências
        </Text>
        <View style={styles.menuCard}>
          <ItemMenu
            icone="settings-outline"
            titulo="Configurações"
            subtitulo="Conta, localização e preferências"
            onPress={() => router.push('/configuracoes')}
          />
          <View style={styles.divider} />
          <ItemMenu
            icone="help-circle-outline"
            titulo="Ajuda e suporte"
            subtitulo="Tire dúvidas sobre o aplicativo"
            onPress={() => router.push('/ajuda-suporte')}
          />
          <View style={styles.divider} />
          <ItemMenu
            icone="information-circle-outline"
            titulo="Sobre o ConectaAgro"
            subtitulo="Conheça melhor o nosso projeto"
            onPress={() => router.push('/sobre-conectaagro')}
          />
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={sairDaConta}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#B42318"
          />
          <Text style={styles.logoutText}>
            Sair da conta
          </Text>
        </TouchableOpacity>
        <Text style={styles.version}>
          ConectaAgro • Protótipo
        </Text>
      </ScrollView>
      <View style={styles.bottomNavigation}>
        <ItemNavegacao
          icone="home-outline"
          titulo="Início"
          onPress={() => router.replace('/inicio')}
        />
        <ItemNavegacao
          icone="search-outline"
          titulo="Buscar"
          onPress={() => router.push('/produtos')}
        />
        <ItemNavegacao
          icone="newspaper-outline"
          titulo="Publicações"
          onPress={() => router.push('/publicacoes')}
        />
        <ItemNavegacao
          icone="cart-outline"
          titulo="Carrinho"
          onPress={() => router.push('/carrinho')}
        />
        <ItemNavegacao
          icone="person"
          titulo="Perfil"
          ativo
          onPress={() => {}}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 12,
    color: '#777777',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
  },
  settingsTopButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarButton: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#004B0A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontSize: 10,
    color: '#777777',
    marginTop: 9,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 12,
    textAlign: 'center',
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F1E8',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 7,
  },
  userTypeText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '600',
    color: '#004B0A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  locationText: {
    fontSize: 11,
    color: '#777777',
    marginLeft: 4,
  },
  editButton: {
    height: 40,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 9,
    paddingHorizontal: 18,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#004B0A',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  editForm: {
    width: '100%',
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 18,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#AAAAAA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 15,
  },
  disabledInput: {
    backgroundColor: '#F2F2F2',
    color: '#777777',
    marginBottom: 5,
  },
  emailHint: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 18,
  },
  saveButton: {
    backgroundColor: '#004B0A',
    paddingVertical: 13,
    borderRadius: 9,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#777777',
    fontSize: 13,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#222222',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#777777',
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 18,
    marginTop: 23,
    marginBottom: 9,
    color: '#222222',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: 70,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 11,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
  },
  menuSubtitle: {
    fontSize: 9,
    color: '#777777',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginLeft: 66,
  },
  logoutButton: {
    height: 52,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 22,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 7,
  },
  version: {
    textAlign: 'center',
    fontSize: 8,
    color: '#AAAAAA',
    marginTop: 18,
  },
  bottomNavigation: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 8,
    color: '#777777',
    marginTop: 3,
  },
  navTextActive: {
    fontSize: 8,
    color: '#004B0A',
    fontWeight: 'bold',
    marginTop: 3,
  },
});
