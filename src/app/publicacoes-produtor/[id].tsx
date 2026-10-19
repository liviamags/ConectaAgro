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
  Image,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
type Produtor = {
  id: string;
  nome: string;
  nome_fazenda: string;
  imagem_url: string | null;
};
type Publicacao = {
  id: string;
  produtor_id: string;
  texto: string;
  imagem_url: string | null;
  curtidas: number;
  comentarios: number;
  created_at: string;
};
type Curtida = {
  publicacao_id: string;
  usuario_id: string;
};
export default function PublicacoesProdutorScreen() {
  const { id } = useLocalSearchParams();
  const produtorId = Array.isArray(id)
    ? id[0]
    : id;
  const [produtor, setProdutor] =
    useState<Produtor | null>(null);
  const [publicacoes, setPublicacoes] =
    useState<Publicacao[]>([]);
  const [curtidasUsuario, setCurtidasUsuario] =
    useState<string[]>([]);
  const [quantidadesCurtidas, setQuantidadesCurtidas] =
    useState<Record<string, number>>({});
  const [curtidasProcessando, setCurtidasProcessando] =
    useState<string[]>([]);
  const [carregando, setCarregando] =
    useState(true);
  const [atualizando, setAtualizando] =
    useState(false);
  const [erro, setErro] = useState('');
  const carregarDados = useCallback(
    async (refresh = false) => {
      if (!produtorId) {
        setErro(
          'Não foi possível identificar o produtor.'
        );
        setCarregando(false);
        return;
      }
      if (refresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
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
          setErro(
            'Você precisa estar conectado para visualizar as publicações.'
          );
          return;
        }
        const usuarioId =
          usuarioData.user.id;
        const [
          resultadoProdutores,
          resultadoPublicacoes,
          resultadoCurtidas,
        ] = await Promise.all([
          supabase.rpc(
            'listar_produtores_publicos'
          ),
          supabase.rpc(
            'listar_publicacoes_produtor_publicas',
            {
              produtor_uuid:
                produtorId,
            }
          ),
          supabase
            .from('publicacao_curtidas')
            .select(
              'publicacao_id, usuario_id'
            ),
        ]);
        if (resultadoProdutores.error) {
          console.log(
            'Erro ao carregar produtor:',
            resultadoProdutores.error
          );
          setErro(
            'Não foi possível carregar os dados do produtor.'
          );
          return;
        }
        if (resultadoPublicacoes.error) {
          console.log(
            'Erro ao carregar publicações:',
            resultadoPublicacoes.error
          );
          setErro(
            'Não foi possível carregar as publicações.'
          );
          return;
        }
        if (resultadoCurtidas.error) {
          console.log(
            'Erro ao carregar curtidas:',
            resultadoCurtidas.error
          );
          setErro(
            'Não foi possível carregar as curtidas.'
          );
          return;
        }
        const produtorEncontrado =
          (
            resultadoProdutores.data ??
            []
          ).find(
            (item: any) =>
              item.id === produtorId
          );
        if (!produtorEncontrado) {
          setErro(
            'Produtor não encontrado.'
          );
          return;
        }
        setProdutor({
          id:
            produtorEncontrado.id,
          nome:
            produtorEncontrado.nome ||
            'Produtor',
          nome_fazenda:
            produtorEncontrado.nome_fazenda ||
            'Propriedade rural',
          imagem_url:
            produtorEncontrado.imagem_url ??
            null,
        });
        const publicacoesFormatadas: Publicacao[] =
          (
            resultadoPublicacoes.data ??
            []
          ).map(
            (publicacao: any) => ({
              id:
                publicacao.id,
              produtor_id:
                publicacao.produtor_id,
              texto:
                publicacao.texto || '',
              imagem_url:
                publicacao.imagem_url ??
                null,
              curtidas: Number(
                publicacao.curtidas ?? 0
              ),
              comentarios: Number(
                publicacao.comentarios ??
                0
              ),
              created_at:
                publicacao.created_at,
            })
          );
        const curtidas =
          (
            resultadoCurtidas.data ??
            []
          ) as Curtida[];
        const idsPublicacoes =
          new Set(
            publicacoesFormatadas.map(
              (publicacao) =>
                publicacao.id
            )
          );
        const curtidasDasPublicacoes =
          curtidas.filter(
            (curtida) =>
              idsPublicacoes.has(
                curtida.publicacao_id
              )
          );
        const idsCurtidosPeloUsuario =
          curtidasDasPublicacoes
            .filter(
              (curtida) =>
                curtida.usuario_id ===
                usuarioId
            )
            .map(
              (curtida) =>
                curtida.publicacao_id
            );
        const contadores: Record<
          string,
          number
        > = {};
        curtidasDasPublicacoes.forEach(
          (curtida) => {
            contadores[
              curtida.publicacao_id
            ] =
              (
                contadores[
                  curtida.publicacao_id
                ] ?? 0
              ) + 1;
          }
        );
        setPublicacoes(
          publicacoesFormatadas
        );
        setCurtidasUsuario(
          idsCurtidosPeloUsuario
        );
        setQuantidadesCurtidas(
          contadores
        );
      } catch (error) {
        console.log(
          'Erro inesperado ao carregar publicações:',
          error
        );
        setErro(
          'Ocorreu um erro ao carregar as publicações.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [produtorId]
  );
  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );
  async function alternarCurtida(
    publicacaoId: string
  ) {
    if (
      curtidasProcessando.includes(
        publicacaoId
      )
    ) {
      return;
    }
    setCurtidasProcessando(
      (atuais) => [
        ...atuais,
        publicacaoId,
      ]
    );
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
        return;
      }
      const usuarioId =
        usuarioData.user.id;
      const jaCurtiu =
        curtidasUsuario.includes(
          publicacaoId
        );
      if (jaCurtiu) {
        const {
          error: deleteError,
        } = await supabase
          .from(
            'publicacao_curtidas'
          )
          .delete()
          .eq(
            'publicacao_id',
            publicacaoId
          )
          .eq(
            'usuario_id',
            usuarioId
          );
        if (deleteError) {
          console.log(
            'Erro ao remover curtida:',
            deleteError
          );
          return;
        }
        setCurtidasUsuario(
          (atuais) =>
            atuais.filter(
              (item) =>
                item !==
                publicacaoId
            )
        );
        setQuantidadesCurtidas(
          (atuais) => ({
            ...atuais,
            [publicacaoId]:
              Math.max(
                0,
                (
                  atuais[
                    publicacaoId
                  ] ?? 0
                ) - 1
              ),
          })
        );
        return;
      }
      const {
        error: insertError,
      } = await supabase
        .from(
          'publicacao_curtidas'
        )
        .insert({
          publicacao_id:
            publicacaoId,
          usuario_id:
            usuarioId,
        });
      if (insertError) {
        console.log(
          'Erro ao registrar curtida:',
          insertError
        );
        return;
      }
      setCurtidasUsuario(
        (atuais) => [
          ...atuais,
          publicacaoId,
        ]
      );
      setQuantidadesCurtidas(
        (atuais) => ({
          ...atuais,
          [publicacaoId]:
            (
              atuais[
                publicacaoId
              ] ?? 0
            ) + 1,
        })
      );
    } catch (error) {
      console.log(
        'Erro inesperado ao alterar curtida:',
        error
      );
    } finally {
      setCurtidasProcessando(
        (atuais) =>
          atuais.filter(
            (item) =>
              item !==
              publicacaoId
          )
      );
    }
  }
  function iniciaisProdutor() {
    if (!produtor?.nome) {
      return 'P';
    }
    const partes = produtor.nome
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (partes.length === 0) {
      return 'P';
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
  function formatarTempo(
    data: string
  ) {
    const criadaEm =
      new Date(data);
    const agora = new Date();
    const diferenca =
      agora.getTime() -
      criadaEm.getTime();
    const minutos = Math.floor(
      diferenca / 60000
    );
    const horas = Math.floor(
      diferenca / 3600000
    );
    const dias = Math.floor(
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
    return criadaEm.toLocaleDateString(
      'pt-BR'
    );
  }
  async function compartilhar(
    publicacao: Publicacao
  ) {
    if (!produtor) {
      return;
    }
    try {
      const mensagem = [
        `${produtor.nome_fazenda} no ConectaAgro 🌱`,
        '',
        publicacao.texto,
      ]
        .filter(Boolean)
        .join('\n');
      await Share.share({
        message: mensagem,
      });
    } catch (error) {
      console.log(
        'Erro ao compartilhar publicação:',
        error
      );
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
          style={styles.loadingText}
        >
          Carregando publicações...
        </Text>
      </View>
    );
  }
  if (erro || !produtor) {
    return (
      <View
        style={styles.emptyContainer}
      >
        <Ionicons
          name="alert-circle-outline"
          size={55}
          color="#004B0A"
        />
        <Text
          style={styles.emptyTitle}
        >
          Não foi possível carregar
        </Text>
        <Text
          style={styles.emptyText}
        >
          {erro ||
            'Produtor não encontrado.'}
        </Text>
        <TouchableOpacity
          style={
            styles.backGreenButton
          }
          onPress={() =>
            carregarDados()
          }
        >
          <Text
            style={
              styles.backGreenButtonText
            }
          >
            Tentar novamente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={
            styles.simpleBackButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.simpleBackButtonText
            }
          >
            Voltar
          </Text>
        </TouchableOpacity>
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
        >
          <Ionicons
            name="chevron-back"
            size={27}
            color="#004B0A"
          />
        </TouchableOpacity>
        <View
          style={styles.headerCenter}
        >
          <Text
            style={styles.headerTitle}
          >
            Publicações
          </Text>
          <Text
            style={
              styles.headerSubtitle
            }
          >
            {produtor.nome_fazenda}
          </Text>
        </View>
        <View
          style={styles.headerSpace}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() =>
              carregarDados(true)
            }
            tintColor="#004B0A"
            colors={['#004B0A']}
          />
        }
      >
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.8}
          onPress={() =>
            router.push(
              `/produtor/${produtor.id}`
            )
          }
        >
          {produtor.imagem_url ? (
            <Image
              source={{
                uri: produtor.imagem_url,
              }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.profilePlaceholder
              }
            >
              <Text
                style={
                  styles.profileInitials
                }
              >
                {iniciaisProdutor()}
              </Text>
            </View>
          )}
          <View
            style={styles.profileInfo}
          >
            <Text
              style={styles.profileName}
            >
              {produtor.nome}
            </Text>
            <Text
              style={
                styles.profileProperty
              }
            >
              {produtor.nome_fazenda}
            </Text>
            <Text
              style={
                styles.publicationCount
              }
            >
              {publicacoes.length}{' '}
              {publicacoes.length === 1
                ? 'publicação'
                : 'publicações'}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={21}
            color="#777777"
          />
        </TouchableOpacity>
        {publicacoes.length === 0 ? (
          <View
            style={
              styles.noPublicationsContainer
            }
          >
            <Ionicons
              name="newspaper-outline"
              size={46}
              color="#7A987D"
            />
            <Text
              style={
                styles.noPublicationsTitle
              }
            >
              Nenhuma publicação
            </Text>
            <Text
              style={
                styles.noPublicationsText
              }
            >
              Este produtor ainda não
              publicou nenhuma novidade.
            </Text>
          </View>
        ) : (
          publicacoes.map(
            (publicacao) => {
              const curtiu =
                curtidasUsuario.includes(
                  publicacao.id
                );
              const processando =
                curtidasProcessando.includes(
                  publicacao.id
                );
              const totalCurtidas =
                quantidadesCurtidas[
                  publicacao.id
                ] ?? 0;
              return (
                <View
                  key={publicacao.id}
                  style={
                    styles.postCard
                  }
                >
                  <View
                    style={
                      styles.postHeader
                    }
                  >
                    {produtor.imagem_url ? (
                      <Image
                        source={{
                          uri: produtor.imagem_url,
                        }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={
                          styles.avatarPlaceholder
                        }
                      >
                        <Text
                          style={
                            styles.avatarInitials
                          }
                        >
                          {iniciaisProdutor()}
                        </Text>
                      </View>
                    )}
                    <View
                      style={
                        styles.authorInfo
                      }
                    >
                      <Text
                        style={
                          styles.authorName
                        }
                      >
                        {produtor.nome}
                      </Text>
                      <Text
                        style={
                          styles.property
                        }
                      >
                        {
                          produtor.nome_fazenda
                        }
                      </Text>
                      <Text
                        style={
                          styles.time
                        }
                      >
                        {formatarTempo(
                          publicacao.created_at
                        )}
                      </Text>
                    </View>
                  </View>
                  {!!publicacao.texto && (
                    <Text
                      style={
                        styles.postText
                      }
                    >
                      {
                        publicacao.texto
                      }
                    </Text>
                  )}
                  {publicacao.imagem_url ? (
                    <Image
                      source={{
                        uri:
                          publicacao.imagem_url,
                      }}
                      style={
                        styles.postImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.postImagePlaceholder
                      }
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={50}
                        color="#7A987D"
                      />
                    </View>
                  )}
                  <View
                    style={styles.actions}
                  >
                    <TouchableOpacity
                      style={
                        styles.actionButton
                      }
                      disabled={
                        processando
                      }
                      onPress={() =>
                        alternarCurtida(
                          publicacao.id
                        )
                      }
                    >
                      {processando ? (
                        <ActivityIndicator
                          size="small"
                          color="#004B0A"
                        />
                      ) : (
                        <Ionicons
                          name={
                            curtiu
                              ? 'heart'
                              : 'heart-outline'
                          }
                          size={22}
                          color={
                            curtiu
                              ? '#004B0A'
                              : '#666666'
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.actionText,
                          curtiu &&
                            styles.actionTextActive,
                        ]}
                      >
                        {totalCurtidas}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={
                          styles.actionButton
                        }
                        onPress={() =>
                          router.push(
                            `/comentarios-publicacao/${publicacao.id}`
                          )
                        }
                      >
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="#666666"
                      />
                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        {
                          publicacao.comentarios
                        }
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.shareButton,
                      ]}
                      onPress={() =>
                        compartilhar(
                          publicacao
                        )
                      }
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={21}
                        color="#666666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
          )
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 25,
    paddingHorizontal: 18,
    paddingBottom: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 42,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  headerSpace: {
    width: 42,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DDEBDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  profileProperty: {
    fontSize: 11,
    color: '#004B0A',
    fontWeight: '600',
    marginTop: 2,
  },
  publicationCount: {
    fontSize: 10,
    color: '#777777',
    marginTop: 5,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 11,
    paddingTop: 15,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarImage: {
    width: 45,
    height: 45,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#DDEBDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    color: '#004B0A',
    fontWeight: 'bold',
  },
  authorInfo: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  property: {
    fontSize: 10,
    color: '#004B0A',
    fontWeight: '600',
    marginTop: 2,
  },
  time: {
    fontSize: 9,
    color: '#888888',
    marginTop: 2,
  },
  postText: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 19,
    marginHorizontal: 16,
    marginTop: 13,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 270,
    backgroundColor: '#EEEEEE',
  },
  postImagePlaceholder: {
    width: '100%',
    height: 210,
    backgroundColor: '#EDF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 25,
  },
  actionText: {
    fontSize: 11,
    color: '#666666',
  },
  actionTextActive: {
    color: '#004B0A',
    fontWeight: '600',
  },
  shareButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  noPublicationsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    paddingVertical: 45,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noPublicationsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
  },
  noPublicationsText: {
    fontSize: 11,
    color: '#777777',
    textAlign: 'center',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: '#666666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 13,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
    marginTop: 5,
  },
  backGreenButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backGreenButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  simpleBackButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginTop: 5,
  },
  simpleBackButtonText: {
    color: '#004B0A',
    fontWeight: '600',
  },
});
