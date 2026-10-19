    import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type Comentario = {
  id: string;
  publicacao_id: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_avatar_url: string | null;
  texto: string;
  created_at: string;
};

export default function ComentariosPublicacaoScreen() {
  const { id } = useLocalSearchParams();

  const publicacaoId = Array.isArray(id)
    ? id[0]
    : id;

  const [comentarios, setComentarios] =
    useState<Comentario[]>([]);

  const [usuarioId, setUsuarioId] =
    useState<string | null>(null);

  const [novoComentario, setNovoComentario] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [excluindoId, setExcluindoId] =
    useState<string | null>(null);

  const [erro, setErro] =
    useState('');

  const carregarComentarios = useCallback(
    async () => {
      if (!publicacaoId) {
        setErro(
          'Não foi possível identificar a publicação.'
        );
        setCarregando(false);
        return;
      }

      setErro('');

      try {
        const {
          data: usuarioData,
          error: usuarioError,
        } = await supabase.auth.getUser();

        if (
          usuarioError ||
          !usuarioData.user
        ) {
          console.log(
            'Erro ao identificar usuário:',
            usuarioError
          );

          setErro(
            'Você precisa estar conectado para visualizar os comentários.'
          );

          return;
        }

        setUsuarioId(
          usuarioData.user.id
        );

        const {
          data,
          error,
        } = await supabase.rpc(
          'listar_comentarios_publicacao',
          {
            publicacao_uuid:
              publicacaoId,
          }
        );

        if (error) {
          console.log(
            'Erro ao carregar comentários:',
            error
          );

          setErro(
            'Não foi possível carregar os comentários.'
          );

          return;
        }

        const comentariosRecebidos = data ?? [];
        const idsUsuarios = [
          ...new Set(
            comentariosRecebidos
              .map((comentario: any) => comentario.usuario_id)
              .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
          ),
        ];

        const fotosPorUsuario: Record<string, string | null> = {};
        if (idsUsuarios.length > 0) {
          const { data: perfis, error: erroPerfis } = await supabase
            .from('profiles')
            .select('id, avatar_url')
            .in('id', idsUsuarios);

          if (erroPerfis) {
            // A falha ao buscar fotos não deve impedir a leitura dos comentários.
            console.log('Erro ao carregar fotos dos comentários:', erroPerfis);
          } else {
            (perfis ?? []).forEach((perfil: { id: string; avatar_url: string | null }) => {
              fotosPorUsuario[perfil.id] = perfil.avatar_url?.trim() || null;
            });
          }
        }

        const comentariosFormatados: Comentario[] = comentariosRecebidos.map(
          (comentario: any) => ({
            id: comentario.id,
            publicacao_id: comentario.publicacao_id,
            usuario_id: comentario.usuario_id,
            usuario_nome: comentario.usuario_nome || 'Usuário',
            usuario_avatar_url: fotosPorUsuario[comentario.usuario_id] ?? null,
            texto: comentario.texto || '',
            created_at: comentario.created_at,
          })
        );

        setComentarios(comentariosFormatados);
      } catch (error) {
        console.log(
          'Erro inesperado ao carregar comentários:',
          error
        );

        setErro(
          'Ocorreu um erro ao carregar os comentários.'
        );
      } finally {
        setCarregando(false);
      }
    },
    [publicacaoId]
  );

  useFocusEffect(
    useCallback(() => {
      carregarComentarios();
    }, [carregarComentarios])
  );

  async function enviarComentario() {
    const texto =
      novoComentario.trim();

    if (!texto) {
      return;
    }

    if (!publicacaoId) {
      return;
    }

    if (texto.length > 500) {
      Alert.alert(
        'Comentário muito grande',
        'O comentário pode ter no máximo 500 caracteres.'
      );
      return;
    }

    setEnviando(true);

    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (
        usuarioError ||
        !usuarioData.user
      ) {
        Alert.alert(
          'Erro',
          'Não foi possível identificar sua conta.'
        );
        return;
      }

      const {
        error: insertError,
      } = await supabase
        .from(
          'publicacao_comentarios'
        )
        .insert({
          publicacao_id:
            publicacaoId,

          usuario_id:
            usuarioData.user.id,

          texto,
        });

      if (insertError) {
        console.log(
          'Erro ao enviar comentário:',
          insertError
        );

        Alert.alert(
          'Erro',
          'Não foi possível enviar seu comentário.'
        );

        return;
      }

      setNovoComentario('');

      await carregarComentarios();
    } catch (error) {
      console.log(
        'Erro inesperado ao comentar:',
        error
      );

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao enviar seu comentário.'
      );
    } finally {
      setEnviando(false);
    }
  }

  function confirmarExclusao(
    comentario: Comentario
  ) {
    Alert.alert(
      'Excluir comentário',
      'Deseja realmente excluir este comentário?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirComentario(
              comentario.id
            ),
        },
      ]
    );
  }

  async function excluirComentario(
    comentarioId: string
  ) {
    setExcluindoId(
      comentarioId
    );

    try {
      const {
        error,
      } = await supabase
        .from(
          'publicacao_comentarios'
        )
        .delete()
        .eq(
          'id',
          comentarioId
        );

      if (error) {
        console.log(
          'Erro ao excluir comentário:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível excluir o comentário.'
        );

        return;
      }

      setComentarios(
        (atuais) =>
          atuais.filter(
            (comentario) =>
              comentario.id !==
              comentarioId
          )
      );
    } catch (error) {
      console.log(
        'Erro inesperado ao excluir comentário:',
        error
      );

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao excluir o comentário.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  function iniciais(
    nome: string
  ) {
    const partes = nome
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (partes.length === 0) {
      return 'U';
    }

    if (partes.length === 1) {
      return partes[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      partes[0].charAt(0) +
      partes[
        partes.length - 1
      ].charAt(0)
    ).toUpperCase();
  }

  function formatarData(
    data: string
  ) {
    const dataComentario =
      new Date(data);

    const agora =
      new Date();

    const diferenca =
      agora.getTime() -
      dataComentario.getTime();

    const minutos =
      Math.floor(
        diferenca / 60000
      );

    const horas =
      Math.floor(
        diferenca / 3600000
      );

    const dias =
      Math.floor(
        diferenca / 86400000
      );

    if (minutos < 1) {
      return 'Agora';
    }

    if (minutos < 60) {
      return `Há ${minutos} min`;
    }

    if (horas < 24) {
      return horas === 1
        ? 'Há 1 hora'
        : `Há ${horas} horas`;
    }

    if (dias < 7) {
      return dias === 1
        ? 'Há 1 dia'
        : `Há ${dias} dias`;
    }

    return dataComentario.toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  }

  function renderComentario({
    item,
  }: {
    item: Comentario;
  }) {
    const comentarioDoUsuario =
      item.usuario_id ===
      usuarioId;

    const excluindo =
      excluindoId === item.id;

    return (
      <View
        style={
          styles.comentarioContainer
        }
      >
        {item.usuario_avatar_url ? (
          <Image
            source={{ uri: item.usuario_avatar_url }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {iniciais(item.usuario_nome)}
            </Text>
          </View>
        )}

        <View
          style={
            styles.comentarioConteudo
          }
        >
          <View
            style={
              styles.comentarioCabecalho
            }
          >
            <View
              style={
                styles.nomeDataContainer
              }
            >
              <Text
                style={
                  styles.nomeUsuario
                }
              >
                {item.usuario_nome}
              </Text>

              <Text
                style={
                  styles.dataComentario
                }
              >
                {formatarData(
                  item.created_at
                )}
              </Text>
            </View>

            {comentarioDoUsuario && (
              <TouchableOpacity
                style={
                  styles.deleteButton
                }
                disabled={excluindo}
                onPress={() =>
                  confirmarExclusao(
                    item
                  )
                }
              >
                {excluindo ? (
                  <ActivityIndicator
                    size="small"
                    color="#B3261E"
                  />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={17}
                    color="#B3261E"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>

          <Text
            style={
              styles.comentarioTexto
            }
          >
            {item.texto}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
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
        >
          <Ionicons
            name="chevron-back"
            size={27}
            color="#004B0A"
          />
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          Comentários
        </Text>

        <View
          style={
            styles.headerSpace
          }
        />
      </View>

      {carregando ? (
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
            Carregando comentários...
          </Text>
        </View>
      ) : erro ? (
        <View
          style={
            styles.emptyContainer
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#004B0A"
          />

          <Text
            style={
              styles.emptyTitle
            }
          >
            Não foi possível carregar
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {erro}
          </Text>

          <TouchableOpacity
            style={
              styles.retryButton
            }
            onPress={() => {
              setCarregando(true);
              carregarComentarios();
            }}
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={comentarios}
          keyExtractor={(
            item
          ) => item.id}
          renderItem={
            renderComentario
          }
          contentContainerStyle={
            comentarios.length === 0
              ? styles.listaVazia
              : styles.lista
          }
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View
              style={
                styles.emptyComments
              }
            >
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color="#7A987D"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nenhum comentário
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Seja a primeira pessoa
                a comentar nesta
                publicação.
              </Text>
            </View>
          }
        />
      )}

      {!erro && (
        <View
          style={
            styles.inputArea
          }
        >
          <TextInput
            style={
              styles.input
            }
            placeholder="Escreva um comentário..."
            placeholderTextColor="#999999"
            value={
              novoComentario
            }
            onChangeText={
              setNovoComentario
            }
            multiline
            maxLength={500}
            editable={!enviando}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!novoComentario.trim() ||
                enviando) &&
                styles.sendButtonDisabled,
            ]}
            disabled={
              !novoComentario.trim() ||
              enviando
            }
            onPress={
              enviarComentario
            }
          >
            {enviando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="send"
                size={19}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    paddingTop: 25,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 42,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111111',
  },

  headerSpace: {
    width: 42,
  },

  lista: {
    paddingVertical: 8,
  },

  listaVazia: {
    flexGrow: 1,
  },

  comentarioContainer: {
    flexDirection: 'row',
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDEBDF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDEBDF',
  },

  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  comentarioConteudo: {
    flex: 1,
    marginLeft: 11,
  },

  comentarioCabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  nomeDataContainer: {
    flex: 1,
  },

  nomeUsuario: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111111',
  },

  dataComentario: {
    fontSize: 9,
    color: '#888888',
    marginTop: 2,
  },

  comentarioTexto: {
    fontSize: 12,
    lineHeight: 18,
    color: '#333333',
    marginTop: 6,
  },

  deleteButton: {
    padding: 6,
    marginTop: -5,
    marginRight: -4,
  },

  inputArea: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: '#F3F5F3',
    borderRadius: 21,
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 10,
    fontSize: 12,
    color: '#222222',
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 11,
    color: '#666666',
    marginTop: 10,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyComments: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 10,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#777777',
    textAlign: 'center',
    marginTop: 5,
  },

  retryButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 17,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});