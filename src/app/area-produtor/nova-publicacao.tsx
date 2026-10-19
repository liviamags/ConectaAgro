import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

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

import { supabase } from '../../lib/supabase';

export default function NovaPublicacaoScreen() {
  const [texto, setTexto] = useState('');

  const [imagemUri, setImagemUri] =
    useState<string | null>(null);

  const [imagemMimeType, setImagemMimeType] =
    useState('image/jpeg');

  const [imagemExtensao, setImagemExtensao] =
    useState('jpg');

  const [nomeProdutor, setNomeProdutor] =
    useState('');

  const [nomeFazenda, setNomeFazenda] =
    useState('');

  const [userId, setUserId] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [publicando, setPublicando] =
    useState(false);

  useEffect(() => {
    carregarProdutor();
  }, []);

  async function carregarProdutor() {
    setCarregando(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log(
          'Erro ao identificar usuário:',
          userError
        );

        Alert.alert(
          'Erro',
          'Não foi possível identificar sua conta.'
        );

        return;
      }

      if (!user) {
        Alert.alert(
          'Sessão não encontrada',
          'Entre novamente na sua conta.'
        );

        router.replace('/login');

        return;
      }

      setUserId(user.id);

      const [
        perfilResponse,
        produtorResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single(),

        supabase
          .from('produtores')
          .select('nome_fazenda')
          .eq('id', user.id)
          .single(),
      ]);

      if (perfilResponse.error) {
        console.log(
          'Erro ao buscar perfil:',
          perfilResponse.error
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar o nome do produtor.'
        );

        return;
      }

      if (produtorResponse.error) {
        console.log(
          'Erro ao buscar propriedade:',
          produtorResponse.error
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar a propriedade.'
        );

        return;
      }

      setNomeProdutor(
        perfilResponse.data?.nome ||
          'Produtor'
      );

      setNomeFazenda(
        produtorResponse.data?.nome_fazenda ||
          'Propriedade'
      );
    } catch (error) {
      console.log(
        'Erro inesperado ao carregar produtor:',
        error
      );

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao carregar os dados.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function escolherImagem() {
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Para escolher uma foto, permita que o ConectaAgro acesse suas imagens.'
        );

        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        resultado.canceled ||
        !resultado.assets ||
        resultado.assets.length === 0
      ) {
        return;
      }

      const arquivo =
        resultado.assets[0];

      if (!arquivo.uri) {
        Alert.alert(
          'Erro',
          'Não foi possível carregar a imagem escolhida.'
        );

        return;
      }

      const mimeType =
        arquivo.mimeType ||
        descobrirMimeType(
          arquivo.fileName,
          arquivo.uri
        );

      const extensao =
        descobrirExtensao(
          arquivo.fileName,
          arquivo.uri,
          mimeType
        );

      setImagemUri(arquivo.uri);
      setImagemMimeType(mimeType);
      setImagemExtensao(extensao);
    } catch (error) {
      console.log(
        'Erro ao escolher imagem:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível abrir sua galeria.'
      );
    }
  }

  function descobrirMimeType(
    nomeArquivo?: string | null,
    uri?: string
  ) {
    const arquivo =
      `${nomeArquivo || ''} ${uri || ''}`
        .toLowerCase();

    if (arquivo.includes('.png')) {
      return 'image/png';
    }

    if (arquivo.includes('.webp')) {
      return 'image/webp';
    }

    if (
      arquivo.includes('.heic')
    ) {
      return 'image/heic';
    }

    if (
      arquivo.includes('.heif')
    ) {
      return 'image/heif';
    }

    return 'image/jpeg';
  }

  function descobrirExtensao(
    nomeArquivo?: string | null,
    uri?: string,
    mimeType?: string
  ) {
    if (nomeArquivo) {
      const partes =
        nomeArquivo.split('.');

      if (partes.length > 1) {
        const extensao =
          partes[
            partes.length - 1
          ].toLowerCase();

        if (
          extensao === 'jpg' ||
          extensao === 'jpeg' ||
          extensao === 'png' ||
          extensao === 'webp' ||
          extensao === 'heic' ||
          extensao === 'heif'
        ) {
          return extensao;
        }
      }
    }

    if (uri) {
      const uriSemParametros =
        uri.split('?')[0];

      const partes =
        uriSemParametros.split('.');

      if (partes.length > 1) {
        const extensao =
          partes[
            partes.length - 1
          ].toLowerCase();

        if (
          extensao === 'jpg' ||
          extensao === 'jpeg' ||
          extensao === 'png' ||
          extensao === 'webp' ||
          extensao === 'heic' ||
          extensao === 'heif'
        ) {
          return extensao;
        }
      }
    }

    if (mimeType === 'image/png') {
      return 'png';
    }

    if (mimeType === 'image/webp') {
      return 'webp';
    }

    if (mimeType === 'image/heic') {
      return 'heic';
    }

    if (mimeType === 'image/heif') {
      return 'heif';
    }

    return 'jpg';
  }

  function removerImagem() {
    if (publicando) {
      return;
    }

    setImagemUri(null);
    setImagemMimeType(
      'image/jpeg'
    );
    setImagemExtensao('jpg');
  }

  async function prepararImagemParaUpload() {
    if (!imagemUri) {
      throw new Error(
        'Nenhuma imagem selecionada.'
      );
    }

    try {
      const arquivo =
        new File(imagemUri);

      if (!arquivo.exists) {
        throw new Error(
          'O arquivo selecionado não existe.'
        );
      }

      const arrayBuffer =
        await arquivo.arrayBuffer();

      if (
        !arrayBuffer ||
        arrayBuffer.byteLength === 0
      ) {
        throw new Error(
          'A imagem selecionada está vazia.'
        );
      }

      return arrayBuffer;
    } catch (error) {
      console.log(
        'Erro ao preparar imagem:',
        error
      );

      throw new Error(
        'Não foi possível preparar a imagem para envio.'
      );
    }
  }

  async function enviarImagem(
    produtorId: string
  ) {
    const arrayBuffer =
      await prepararImagemParaUpload();

    const nomeArquivo =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(
          2,
          10
        )}.${imagemExtensao}`;

    const caminho =
      `${produtorId}/${nomeArquivo}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from('publicacoes')
      .upload(
        caminho,
        arrayBuffer,
        {
          contentType:
            imagemMimeType,
          cacheControl: '3600',
          upsert: false,
        }
      );

    if (uploadError) {
      console.log(
        'Erro no upload da imagem:',
        uploadError
      );

      throw new Error(
        `Erro no Storage: ${uploadError.message}`
      );
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from('publicacoes')
      .getPublicUrl(caminho);

    if (
      !publicUrlData?.publicUrl
    ) {
      await supabase.storage
        .from('publicacoes')
        .remove([caminho]);

      throw new Error(
        'Não foi possível obter o endereço da imagem.'
      );
    }

    return {
      caminho,
      url:
        publicUrlData.publicUrl,
    };
  }

  async function publicar() {
    if (publicando) {
      return;
    }

    if (!texto.trim()) {
      Alert.alert(
        'Atenção',
        'Escreva alguma coisa para a publicação.'
      );

      return;
    }

    if (!imagemUri) {
      Alert.alert(
        'Escolha uma foto',
        'Adicione uma foto da sua galeria antes de publicar.'
      );

      return;
    }

    if (!userId) {
      Alert.alert(
        'Erro',
        'Não foi possível identificar sua conta. Tente entrar novamente.'
      );

      return;
    }

    setPublicando(true);

    let caminhoImagem:
      | string
      | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          'Sua sessão não foi encontrada.'
        );
      }

      if (
        user.id !== userId
      ) {
        throw new Error(
          'A sessão do usuário mudou. Entre novamente.'
        );
      }

      const imagemEnviada =
        await enviarImagem(
          user.id
        );

      caminhoImagem =
        imagemEnviada.caminho;

      const {
        error: publicacaoError,
      } = await supabase
        .from('publicacoes')
        .insert({
          produtor_id:
            user.id,

          texto:
            texto.trim(),

          imagem_url:
            imagemEnviada.url,
        });

      if (publicacaoError) {
        console.log(
          'Erro ao criar publicação:',
          publicacaoError
        );

        await supabase.storage
          .from('publicacoes')
          .remove([
            imagemEnviada.caminho,
          ]);

        caminhoImagem = null;

        throw new Error(
          `Erro ao salvar publicação: ${publicacaoError.message}`
        );
      }

      caminhoImagem = null;

      Alert.alert(
        'Publicação criada!',
        'Sua publicação foi salva com sucesso.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(
                '/area-produtor/publicacoes'
              ),
          },
        ]
      );
    } catch (error) {
      console.log(
        'Erro ao publicar:',
        error
      );

      if (caminhoImagem) {
        await supabase.storage
          .from('publicacoes')
          .remove([
            caminhoImagem,
          ]);
      }

      const mensagem =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido.';

      Alert.alert(
        'Não foi possível publicar',
        mensagem
      );
    } finally {
      setPublicando(false);
    }
  }

  if (carregando) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#004B0A"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Carregando...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
          disabled={publicando}
        >
          <Ionicons
            name="close"
            size={25}
            color="#004B0A"
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Nova publicação
        </Text>

        <TouchableOpacity
          style={[
            styles.publishHeaderButton,
            publicando &&
              styles.buttonDisabled,
          ]}
          onPress={publicar}
          disabled={publicando}
        >
          {publicando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.publishHeaderText
              }
            >
              Publicar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.author}>
          <Image
            source={require('../../../assets/images/prod1.jpg')}
            style={styles.avatar}
          />

          <View>
            <Text
              style={
                styles.authorName
              }
            >
              {nomeProdutor}
            </Text>

            <Text
              style={
                styles.property
              }
            >
              {nomeFazenda}
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="O que está acontecendo na sua produção?"
          placeholderTextColor="#999999"
          value={texto}
          onChangeText={setTexto}
          multiline
          maxLength={500}
          textAlignVertical="top"
          editable={!publicando}
        />

        <Text style={styles.counter}>
          {texto.length}/500
        </Text>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Imagem da publicação
        </Text>

        <Text
          style={styles.helperText}
        >
          Escolha uma foto da galeria
          do seu celular para mostrar
          sua produção, colheita,
          propriedade ou novidade.
        </Text>

        {!imagemUri ? (
          <TouchableOpacity
            style={
              styles.selectImageButton
            }
            onPress={escolherImagem}
            disabled={publicando}
          >
            <View
              style={
                styles.selectImageIcon
              }
            >
              <Ionicons
                name="images-outline"
                size={28}
                color="#004B0A"
              />
            </View>

            <View
              style={
                styles.selectImageInfo
              }
            >
              <Text
                style={
                  styles.selectImageTitle
                }
              >
                Escolher foto
              </Text>

              <Text
                style={
                  styles.selectImageText
                }
              >
                Selecione uma imagem
                da sua galeria
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={21}
              color="#004B0A"
            />
          </TouchableOpacity>
        ) : (
          <View
            style={
              styles.selectedImageContainer
            }
          >
            <Image
              source={{
                uri: imagemUri,
              }}
              style={
                styles.selectedImage
              }
            />

            <View
              style={
                styles.imageActions
              }
            >
              <TouchableOpacity
                style={
                  styles.changeImageButton
                }
                onPress={
                  escolherImagem
                }
                disabled={publicando}
              >
                <Ionicons
                  name="images-outline"
                  size={18}
                  color="#004B0A"
                />

                <Text
                  style={
                    styles.changeImageText
                  }
                >
                  Trocar foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.removeImageButton
                }
                onPress={
                  removerImagem
                }
                disabled={publicando}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#B42318"
                />

                <Text
                  style={
                    styles.removeImageText
                  }
                >
                  Remover
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={
            styles.previewSection
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Pré-visualização
          </Text>

          <View
            style={
              styles.previewCard
            }
          >
            <View
              style={
                styles.previewAuthor
              }
            >
              <Image
                source={require('../../../assets/images/prod1.jpg')}
                style={
                  styles.previewAvatar
                }
              />

              <View>
                <Text
                  style={
                    styles.previewName
                  }
                >
                  {nomeProdutor}
                </Text>

                <Text
                  style={
                    styles.previewProperty
                  }
                >
                  {nomeFazenda} • Agora
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.previewText
              }
            >
              {texto.trim()
                ? texto
                : 'O texto da sua publicação aparecerá aqui.'}
            </Text>

            {imagemUri ? (
              <Image
                source={{
                  uri: imagemUri,
                }}
                style={
                  styles.previewImage
                }
              />
            ) : (
              <View
                style={
                  styles.previewImagePlaceholder
                }
              >
                <Ionicons
                  name="image-outline"
                  size={38}
                  color="#AAB7AC"
                />

                <Text
                  style={
                    styles.previewPlaceholderText
                  }
                >
                  A foto escolhida
                  aparecerá aqui
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.publishButton,
            publicando &&
              styles.buttonDisabled,
          ]}
          onPress={publicar}
          disabled={publicando}
        >
          {publicando ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.publishButtonText
                }
              >
                Publicando...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="send"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.publishButtonText
                }
              >
                Publicar agora
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 10,
    color: '#777777',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 19,
    fontWeight: 'bold',
  },

  publishHeaderButton: {
    minWidth: 70,
    minHeight: 36,
    backgroundColor: '#004B0A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  publishHeaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  author: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
  },

  authorName: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  property: {
    fontSize: 9,
    color: '#777777',
    marginTop: 2,
  },

  textInput: {
    minHeight: 140,
    backgroundColor: '#F7F8F7',
    borderRadius: 13,
    padding: 14,
    fontSize: 12,
    color: '#333333',
    lineHeight: 18,
  },

  counter: {
    textAlign: 'right',
    fontSize: 8,
    color: '#999999',
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },

  helperText: {
    fontSize: 9,
    color: '#777777',
    lineHeight: 14,
    marginBottom: 12,
  },

  selectImageButton: {
    minHeight: 82,
    borderWidth: 1,
    borderColor: '#D8E5DA',
    borderRadius: 13,
    backgroundColor: '#F7FAF7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
  },

  selectImageIcon: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: '#E7F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectImageInfo: {
    flex: 1,
    marginLeft: 11,
  },

  selectImageTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  selectImageText: {
    fontSize: 8,
    color: '#777777',
    marginTop: 3,
  },

  selectedImageContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 13,
    overflow: 'hidden',
  },

  selectedImage: {
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },

  imageActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },

  changeImageButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  changeImageText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#004B0A',
  },

  removeImageButton: {
    flex: 1,
    minHeight: 44,
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  removeImageText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#B42318',
  },

  previewSection: {
    marginTop: 5,
  },

  previewCard: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 13,
    overflow: 'hidden',
  },

  previewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  previewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 8,
  },

  previewName: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  previewProperty: {
    fontSize: 8,
    color: '#777777',
    marginTop: 2,
  },

  previewText: {
    fontSize: 10,
    lineHeight: 15,
    color: '#444444',
    paddingHorizontal: 12,
    paddingBottom: 11,
  },

  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },

  previewImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewPlaceholderText: {
    fontSize: 9,
    color: '#89958B',
    marginTop: 7,
  },

  publishButton: {
    marginTop: 24,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#004B0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});