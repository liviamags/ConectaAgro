import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  useEffect,
  useState,
} from 'react';

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

import { supabase } from '../../../lib/supabase';

type Publicacao = {
  id: string;
  produtor_id: string;
  texto: string;
  imagem_url: string | null;
  curtidas: number;
  comentarios: number;
  created_at: string;
};

export default function EditarPublicacaoScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [publicacao, setPublicacao] =
    useState<Publicacao | null>(null);

  const [texto, setTexto] =
    useState('');

  const [nomeProdutor, setNomeProdutor] =
    useState('');

  const [nomeFazenda, setNomeFazenda] =
    useState('');

  const [imagemAtual, setImagemAtual] =
    useState<string | null>(null);

  const [novaImagemUri, setNovaImagemUri] =
    useState<string | null>(null);

  const [
    novaImagemMimeType,
    setNovaImagemMimeType,
  ] = useState('image/jpeg');

  const [
    novaImagemExtensao,
    setNovaImagemExtensao,
  ] = useState('jpg');

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [excluindo, setExcluindo] =
    useState(false);

  useEffect(() => {
    carregarPublicacao();
  }, [id]);

  async function carregarPublicacao() {
    if (!id) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        Alert.alert(
          'Sessão não encontrada',
          'Entre novamente na sua conta.'
        );

        router.replace('/login');
        return;
      }

      const {
        data: publicacaoData,
        error: publicacaoError,
      } = await supabase
        .from('publicacoes')
        .select(
          'id, produtor_id, texto, imagem_url, curtidas, comentarios, created_at'
        )
        .eq('id', id)
        .eq('produtor_id', user.id)
        .maybeSingle();

      if (publicacaoError) {
        console.log(
          'Erro ao buscar publicação:',
          publicacaoError
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar a publicação.'
        );

        return;
      }

      if (!publicacaoData) {
        setPublicacao(null);
        return;
      }

      setPublicacao(publicacaoData);
      setTexto(publicacaoData.texto);
      setImagemAtual(
        publicacaoData.imagem_url
      );

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

      if (!perfilResponse.error) {
        setNomeProdutor(
          perfilResponse.data?.nome ||
            'Produtor'
        );
      }

      if (!produtorResponse.error) {
        setNomeFazenda(
          produtorResponse.data
            ?.nome_fazenda ||
            'Propriedade'
        );
      }
    } catch (error) {
      console.log(
        'Erro inesperado ao carregar publicação:',
        error
      );

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao carregar a publicação.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function escolherImagem() {
    if (
      salvando ||
      excluindo
    ) {
      return;
    }

    try {
      const permissao =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Para escolher uma foto, permita que o ConectaAgro acesse suas imagens.'
        );

        return;
      }

      const resultado =
        await ImagePicker
          .launchImageLibraryAsync({
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

      setNovaImagemUri(
        arquivo.uri
      );

      setNovaImagemMimeType(
        mimeType
      );

      setNovaImagemExtensao(
        extensao
      );
    } catch (error) {
      console.log(
        'Erro ao escolher nova imagem:',
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

    if (
      arquivo.includes('.png')
    ) {
      return 'image/png';
    }

    if (
      arquivo.includes('.webp')
    ) {
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

    if (
      mimeType === 'image/png'
    ) {
      return 'png';
    }

    if (
      mimeType === 'image/webp'
    ) {
      return 'webp';
    }

    if (
      mimeType === 'image/heic'
    ) {
      return 'heic';
    }

    if (
      mimeType === 'image/heif'
    ) {
      return 'heif';
    }

    return 'jpg';
  }

  function cancelarNovaImagem() {
    if (
      salvando ||
      excluindo
    ) {
      return;
    }

    setNovaImagemUri(null);
    setNovaImagemMimeType(
      'image/jpeg'
    );
    setNovaImagemExtensao(
      'jpg'
    );
  }

  async function prepararNovaImagem() {
    if (!novaImagemUri) {
      throw new Error(
        'Nenhuma nova imagem selecionada.'
      );
    }

    try {
      const arquivo =
        new File(novaImagemUri);

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
        'Erro ao preparar nova imagem:',
        error
      );

      throw new Error(
        'Não foi possível preparar a nova imagem para envio.'
      );
    }
  }

  async function enviarNovaImagem(
    produtorId: string
  ) {
    const arrayBuffer =
      await prepararNovaImagem();

    const nomeArquivo =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(
          2,
          10
        )}.${novaImagemExtensao}`;

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
            novaImagemMimeType,
          cacheControl: '3600',
          upsert: false,
        }
      );

    if (uploadError) {
      console.log(
        'Erro ao enviar nova imagem:',
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
        'Não foi possível obter o endereço da nova imagem.'
      );
    }

    return {
      caminho,
      url:
        publicUrlData.publicUrl,
    };
  }

  function obterCaminhoStorage(
    imagemUrl: string | null
  ) {
    if (!imagemUrl) {
      return null;
    }

    try {
      const marcador =
        '/storage/v1/object/public/publicacoes/';

      const indice =
        imagemUrl.indexOf(
          marcador
        );

      if (indice === -1) {
        return null;
      }

      const caminho =
        imagemUrl.substring(
          indice +
            marcador.length
        );

      if (!caminho) {
        return null;
      }

      return decodeURIComponent(
        caminho
      );
    } catch (error) {
      console.log(
        'Erro ao identificar caminho da imagem:',
        error
      );

      return null;
    }
  }

  async function salvar() {
    if (
      !publicacao ||
      salvando ||
      excluindo
    ) {
      return;
    }

    if (!texto.trim()) {
      Alert.alert(
        'Atenção',
        'O texto da publicação não pode ficar vazio.'
      );

      return;
    }

    setSalvando(true);

    let novoCaminho:
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
        user.id !==
        publicacao.produtor_id
      ) {
        throw new Error(
          'Esta publicação não pertence à sua conta.'
        );
      }

      let novaUrl =
        imagemAtual;

      if (novaImagemUri) {
        const imagemEnviada =
          await enviarNovaImagem(
            user.id
          );

        novoCaminho =
          imagemEnviada.caminho;

        novaUrl =
          imagemEnviada.url;
      }

      const {
        error: updateError,
      } = await supabase
        .from('publicacoes')
        .update({
          texto:
            texto.trim(),
          imagem_url:
            novaUrl,
        })
        .eq(
          'id',
          publicacao.id
        )
        .eq(
          'produtor_id',
          user.id
        );

      if (updateError) {
        console.log(
          'Erro ao atualizar publicação:',
          updateError
        );

        if (novoCaminho) {
          await supabase.storage
            .from('publicacoes')
            .remove([
              novoCaminho,
            ]);

          novoCaminho = null;
        }

        throw new Error(
          `Erro ao salvar publicação: ${updateError.message}`
        );
      }

      if (
        novaImagemUri &&
        imagemAtual
      ) {
        const caminhoAntigo =
          obterCaminhoStorage(
            imagemAtual
          );

        if (caminhoAntigo) {
          const {
            error:
              deleteImageError,
          } =
            await supabase.storage
              .from(
                'publicacoes'
              )
              .remove([
                caminhoAntigo,
              ]);

          if (
            deleteImageError
          ) {
            console.log(
              'A publicação foi atualizada, mas a imagem antiga não pôde ser removida:',
              deleteImageError
            );
          }
        }
      }

      novoCaminho = null;

      Alert.alert(
        'Alterações salvas!',
        'A publicação foi atualizada com sucesso.',
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
        'Erro ao salvar publicação:',
        error
      );

      if (novoCaminho) {
        await supabase.storage
          .from('publicacoes')
          .remove([
            novoCaminho,
          ]);
      }

      const mensagem =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro desconhecido.';

      Alert.alert(
        'Não foi possível salvar',
        mensagem
      );
    } finally {
      setSalvando(false);
    }
  }

  function excluir() {
    if (
      !publicacao ||
      salvando ||
      excluindo
    ) {
      return;
    }

    Alert.alert(
      'Excluir publicação',
      'Tem certeza de que deseja excluir esta publicação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress:
            excluirDefinitivamente,
        },
      ]
    );
  }

  async function excluirDefinitivamente() {
    if (
      !publicacao ||
      excluindo
    ) {
      return;
    }

    setExcluindo(true);

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
        user.id !==
        publicacao.produtor_id
      ) {
        throw new Error(
          'Esta publicação não pertence à sua conta.'
        );
      }

      const {
        error: deleteError,
      } = await supabase
        .from('publicacoes')
        .delete()
        .eq(
          'id',
          publicacao.id
        )
        .eq(
          'produtor_id',
          user.id
        );

      if (deleteError) {
        console.log(
          'Erro ao excluir publicação:',
          deleteError
        );

        throw new Error(
          `Erro ao excluir publicação: ${deleteError.message}`
        );
      }

      if (
        publicacao.imagem_url
      ) {
        const caminho =
          obterCaminhoStorage(
            publicacao.imagem_url
          );

        if (caminho) {
          const {
            error:
              storageError,
          } =
            await supabase.storage
              .from(
                'publicacoes'
              )
              .remove([
                caminho,
              ]);

          if (storageError) {
            console.log(
              'A publicação foi excluída, mas ocorreu um erro ao remover a imagem:',
              storageError
            );
          }
        }
      }

      Alert.alert(
        'Publicação excluída',
        'A publicação foi excluída com sucesso.',
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
        'Erro ao excluir publicação:',
        error
      );

      const mensagem =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro desconhecido.';

      Alert.alert(
        'Não foi possível excluir',
        mensagem
      );
    } finally {
      setExcluindo(false);
    }
  }

  function formatarData(
    dataString: string
  ) {
    const data =
      new Date(dataString);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return '';
    }

    const agora =
      new Date();

    const diferenca =
      agora.getTime() -
      data.getTime();

    const minutos =
      Math.floor(
        diferenca /
          (1000 * 60)
      );

    if (
      minutos >= 0 &&
      minutos < 1
    ) {
      return 'Agora';
    }

    if (
      minutos >= 1 &&
      minutos < 60
    ) {
      return `Há ${minutos} ${
        minutos === 1
          ? 'minuto'
          : 'minutos'
      }`;
    }

    const horas =
      Math.floor(
        minutos / 60
      );

    if (
      horas >= 1 &&
      horas < 24
    ) {
      return `Há ${horas} ${
        horas === 1
          ? 'hora'
          : 'horas'
      }`;
    }

    const dias =
      Math.floor(
        horas / 24
      );

    if (dias === 1) {
      return 'Ontem';
    }

    if (
      dias > 1 &&
      dias < 7
    ) {
      return `Há ${dias} dias`;
    }

    return data
      .toLocaleDateString(
        'pt-BR'
      );
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
          Carregando publicação...
        </Text>
      </View>
    );
  }

  if (!publicacao) {
    return (
      <View
        style={styles.notFound}
      >
        <Ionicons
          name="alert-circle-outline"
          size={55}
          color="#AAB7AC"
        />

        <Text
          style={
            styles.notFoundTitle
          }
        >
          Publicação não encontrada
        </Text>

        <TouchableOpacity
          style={
            styles.backToListButton
          }
          onPress={() =>
            router.replace(
              '/area-produtor/publicacoes'
            )
          }
        >
          <Text
            style={
              styles.backToListText
            }
          >
            Voltar para publicações
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imagemExibida =
    novaImagemUri ||
    imagemAtual;

  return (
    <View
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
          disabled={
            salvando ||
            excluindo
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerInfo
          }
        >
          <Text
            style={styles.title}
          >
            Editar publicação
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Atualize o conteúdo publicado
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={styles.author}
        >
          <Image
            source={require('../../../../assets/images/prod1.jpg')}
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
              {' • '}
              {formatarData(
                publicacao.created_at
              )}
            </Text>
          </View>
        </View>

        <Text
          style={styles.label}
        >
          Texto da publicação
        </Text>

        <TextInput
          style={
            styles.textInput
          }
          value={texto}
          onChangeText={setTexto}
          multiline
          maxLength={500}
          textAlignVertical="top"
          editable={
            !salvando &&
            !excluindo
          }
        />

        <Text
          style={styles.counter}
        >
          {texto.length}/500
        </Text>

        <Text
          style={styles.label}
        >
          Imagem da publicação
        </Text>

        {imagemExibida ? (
          <Image
            source={{
              uri:
                imagemExibida,
            }}
            style={
              styles.publicationImage
            }
          />
        ) : (
          <View
            style={
              styles.imagePlaceholder
            }
          >
            <Ionicons
              name="image-outline"
              size={40}
              color="#AAB7AC"
            />

            <Text
              style={
                styles.imagePlaceholderText
              }
            >
              Nenhuma imagem
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={
            styles.changeImageButton
          }
          onPress={
            escolherImagem
          }
          disabled={
            salvando ||
            excluindo
          }
        >
          <Ionicons
            name="images-outline"
            size={20}
            color="#004B0A"
          />

          <Text
            style={
              styles.changeImageText
            }
          >
            Escolher outra foto
          </Text>
        </TouchableOpacity>

        {novaImagemUri ? (
          <TouchableOpacity
            style={
              styles.cancelImageButton
            }
            onPress={
              cancelarNovaImagem
            }
            disabled={
              salvando ||
              excluindo
            }
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#777777"
            />

            <Text
              style={
                styles.cancelImageText
              }
            >
              Manter foto anterior
            </Text>
          </TouchableOpacity>
        ) : null}

        <View
          style={styles.infoBox}
        >
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#004B0A"
          />

          <Text
            style={styles.infoText}
          >
            Você pode alterar o texto
            e escolher qualquer outra
            foto da galeria. Se não
            escolher uma nova foto, a
            imagem atual será mantida.
          </Text>
        </View>

        <View
          style={styles.stats}
        >
          <View
            style={styles.stat}
          >
            <Ionicons
              name="heart-outline"
              size={20}
              color="#004B0A"
            />

            <Text
              style={
                styles.statNumber
              }
            >
              {publicacao.curtidas ||
                0}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Curtidas
            </Text>
          </View>

          <View
            style={styles.stat}
          >
            <Ionicons
              name="chatbubble-outline"
              size={19}
              color="#004B0A"
            />

            <Text
              style={
                styles.statNumber
              }
            >
              {publicacao.comentarios ||
                0}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Comentários
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (salvando ||
              excluindo) &&
              styles.disabledButton,
          ]}
          onPress={salvar}
          disabled={
            salvando ||
            excluindo
          }
        >
          {salvando ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Salvando...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Salvar alterações
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (salvando ||
              excluindo) &&
              styles.disabledButton,
          ]}
          onPress={excluir}
          disabled={
            salvando ||
            excluindo
          }
        >
          {excluindo ? (
            <>
              <ActivityIndicator
                size="small"
                color="#B42318"
              />

              <Text
                style={
                  styles.deleteButtonText
                }
              >
                Excluindo...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={19}
                color="#B42318"
              />

              <Text
                style={
                  styles.deleteButtonText
                }
              >
                Excluir publicação
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
    },

    loadingContainer: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
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
      borderBottomColor:
        '#EEEEEE',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#F0F6F1',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    headerInfo: {
      marginLeft: 12,
    },

    title: {
      fontSize: 20,
      fontWeight: 'bold',
    },

    subtitle: {
      fontSize: 9,
      color: '#777777',
      marginTop: 2,
    },

    content: {
      padding: 18,
      paddingBottom: 40,
    },

    author: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 22,
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 10,
    },

    authorName: {
      fontSize: 13,
      fontWeight: 'bold',
    },

    property: {
      fontSize: 9,
      color: '#777777',
      marginTop: 3,
    },

    label: {
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 7,
      marginTop: 8,
    },

    textInput: {
      minHeight: 140,
      borderWidth: 1,
      borderColor: '#DDDDDD',
      backgroundColor:
        '#F8F9F8',
      borderRadius: 12,
      padding: 13,
      fontSize: 11,
      lineHeight: 17,
      color: '#333333',
    },

    counter: {
      fontSize: 8,
      color: '#999999',
      textAlign: 'right',
      marginTop: 5,
    },

    publicationImage: {
      width: '100%',
      height: 230,
      borderRadius: 13,
      resizeMode: 'cover',
    },

    imagePlaceholder: {
      width: '100%',
      height: 180,
      borderRadius: 13,
      backgroundColor:
        '#F3F5F3',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    imagePlaceholderText: {
      marginTop: 7,
      fontSize: 9,
      color: '#89958B',
    },

    changeImageButton: {
      height: 46,
      borderRadius: 11,
      backgroundColor:
        '#F0F6F1',
      marginTop: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
    },

    changeImageText: {
      color: '#004B0A',
      fontSize: 10,
      fontWeight: '600',
    },

    cancelImageButton: {
      height: 40,
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 5,
    },

    cancelImageText: {
      color: '#777777',
      fontSize: 9,
      fontWeight: '500',
    },

    infoBox: {
      marginTop: 13,
      backgroundColor:
        '#F0F6F1',
      borderRadius: 11,
      padding: 12,
      flexDirection: 'row',
      alignItems:
        'flex-start',
    },

    infoText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 9,
      lineHeight: 14,
      color: '#566158',
    },

    stats: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },

    stat: {
      flex: 1,
      backgroundColor:
        '#F7F8F7',
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
    },

    statNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#004B0A',
      marginTop: 4,
    },

    statLabel: {
      fontSize: 8,
      color: '#777777',
      marginTop: 2,
    },

    saveButton: {
      height: 50,
      borderRadius: 12,
      backgroundColor:
        '#004B0A',
      marginTop: 23,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: 'bold',
    },

    deleteButton: {
      height: 48,
      borderRadius: 12,
      backgroundColor:
        '#FFF1F0',
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
    },

    deleteButtonText: {
      color: '#B42318',
      fontSize: 10,
      fontWeight: '600',
    },

    disabledButton: {
      opacity: 0.65,
    },

    notFound: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 25,
    },

    notFoundTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      marginTop: 12,
    },

    backToListButton: {
      backgroundColor:
        '#004B0A',
      borderRadius: 11,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginTop: 18,
    },

    backToListText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
  });