import { Ionicons } from '@expo/vector-icons';

import {
  router,

  useFocusEffect,
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

import { supabase } from '../lib/supabase';

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

  produtor_nome: string;

  nome_fazenda: string;

  produtor_imagem_url: string | null;

};

type Curtida = {

  publicacao_id: string;

  usuario_id: string;

};

export default function PublicacoesScreen() {

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

  const [erro, setErro] =

    useState('');

  const carregarPublicacoes = useCallback(

    async (refresh = false) => {

      if (refresh) {

        setAtualizando(true);

      } else {

        setCarregando(true);

      }

      setErro('');

      try {

        const {

          data: authData,

          error: authError,

        } = await supabase.auth.getUser();

        if (authError) {

          console.log(

            'Erro ao identificar usuário:',

            authError

          );

          setErro(

            'Não foi possível identificar sua conta.'

          );

          return;

        }

        const usuario = authData.user;

        if (!usuario) {

          setErro(

            'Você precisa estar conectado para visualizar as publicações.'

          );

          return;

        }

        const [

          resultadoPublicacoes,

          resultadoProdutores,

          resultadoCurtidas,

          resultadoSeguidos,

        ] = await Promise.all([

          supabase.rpc(

            'listar_publicacoes_publicas'

          ),

          supabase.rpc(

            'listar_produtores_publicos'

          ),

          supabase

            .from('publicacao_curtidas')

            .select(

              'publicacao_id, usuario_id'

            ),

          supabase

            .from('produtores_seguidores')

            .select('produtor_id')

            .eq('consumidor_id', usuario.id),

        ]);

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

        if (resultadoProdutores.error) {

          console.log(

            'Erro ao carregar produtores:',

            resultadoProdutores.error

          );

          setErro(

            'Não foi possível carregar os dados dos produtores.'

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

        const produtores: Produtor[] =

          (resultadoProdutores.data ?? []).map(

            (produtor: any) => ({

              id: produtor.id,

              nome:

                produtor.nome ||

                'Produtor',

              nome_fazenda:

                produtor.nome_fazenda ||

                'Propriedade rural',

              imagem_url:

                produtor.imagem_url ??

                null,

            })

          );

        // Busca as fotos individuais dos produtores. A foto salva no cadastro
        // do produtor (produtores.imagem_url) tem prioridade; profiles.avatar_url
        // é usado apenas como alternativa. Não reutiliza imagem de demonstração da RPC.
        const idsProdutores = [...new Set(produtores.map((item) => item.id).filter(Boolean))];
        const fotosPorProdutor: Record<string, string | null> = {};
        if (idsProdutores.length > 0) {
          const { data: perfis, error: erroPerfis } = await supabase
            .from('profiles')
            .select('id, avatar_url')
            .in('id', idsProdutores);
          if (erroPerfis) {
            console.log('Erro ao consultar fotos dos produtores:', erroPerfis);
          } else {
            (perfis ?? []).forEach((perfil: { id: string; avatar_url: string | null }) => {
              fotosPorProdutor[perfil.id] = perfil.avatar_url?.trim() || null;
            });
          }
        }

        const publicacoesFormatadas: Publicacao[] =

          (resultadoPublicacoes.data ?? []).map(

            (publicacao: any) => {

              const produtor =

                produtores.find(

                  (item) =>

                    item.id ===

                    publicacao.produtor_id

                );

              return {

                id: publicacao.id,

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

                  publicacao.comentarios ?? 0

                ),

                created_at:

                  publicacao.created_at,

                produtor_nome:

                  produtor?.nome ||

                  'Produtor',

                nome_fazenda:

                  produtor?.nome_fazenda ||

                  'Propriedade rural',

                produtor_imagem_url:
                  produtor?.imagem_url?.trim() ||
                  fotosPorProdutor[publicacao.produtor_id] ||
                  null,

              };

            }

          );

        const curtidas =

          (resultadoCurtidas.data ??

            []) as Curtida[];

        const idsCurtidosPeloUsuario =

          curtidas

            .filter(

              (curtida) =>

                curtida.usuario_id ===

                usuario.id

            )

            .map(

              (curtida) =>

                curtida.publicacao_id

            );

        const contadores: Record<

          string,

          number

        > = {};

        curtidas.forEach(

          (curtida) => {

            contadores[

              curtida.publicacao_id

            ] =

              (contadores[

                curtida.publicacao_id

              ] ?? 0) + 1;

          }

        );

        if (resultadoSeguidos.error) {

          console.log('Erro ao carregar produtores seguidos:', resultadoSeguidos.error);

        }

        const seguidos = new Set<string>(

          (resultadoSeguidos.data ?? []).map((item: { produtor_id: string }) => item.produtor_id)

        );

        publicacoesFormatadas.sort((a, b) => {

          const aSeguido = seguidos.has(a.produtor_id) ? 1 : 0;

          const bSeguido = seguidos.has(b.produtor_id) ? 1 : 0;

          if (aSeguido !== bSeguido) return bSeguido - aSeguido;

          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

        });

        setPublicacoes(publicacoesFormatadas);

        setCurtidasUsuario(

          idsCurtidosPeloUsuario

        );

        setQuantidadesCurtidas(

          contadores

        );

      } catch (error) {

        console.log(

          'Erro inesperado ao carregar feed:',

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

    []

  );

  useFocusEffect(

    useCallback(() => {

      carregarPublicacoes();

    }, [carregarPublicacoes])

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

        data: authData,

        error: authError,

      } = await supabase.auth.getUser();

      if (

        authError ||

        !authData.user

      ) {

        console.log(

          'Erro ao identificar usuário para curtir:',

          authError

        );

        return;

      }

      const usuarioId =

        authData.user.id;

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

              (id) =>

                id !==

                publicacaoId

            )

        );

        setQuantidadesCurtidas(

          (atuais) => ({

            ...atuais,

            [publicacaoId]:

              Math.max(

                0,

                (atuais[

                  publicacaoId

                ] ?? 0) - 1

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

            (atuais[

              publicacaoId

            ] ?? 0) + 1,

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

            (id) =>

              id !==

              publicacaoId

          )

      );

    }

  }

  function iniciaisProdutor(

    nome: string

  ) {

    const partes = nome

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

    const agora =

      new Date();

    const diferenca =

      agora.getTime() -

      criadaEm.getTime();

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

    return criadaEm.toLocaleDateString(

      'pt-BR'

    );

  }

  async function compartilhar(

    publicacao: Publicacao

  ) {

    try {

      await Share.share({

        message: [

          `${publicacao.nome_fazenda} no ConectaAgro 🌱`,

          '',

          publicacao.texto,

        ]

          .filter(Boolean)

          .join('\n'),

      });

    } catch (error) {

      console.log(

        'Erro ao compartilhar:',

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

  return (

    <View style={styles.container}>

      <View style={styles.header}>

        <Text

          style={styles.headerTitle}

        >

          Publicações

        </Text>

        <TouchableOpacity

          style={

            styles.notificationButton

          }

          onPress={() =>

            router.push(

              '/notificacoes'

            )

          }

        >

          <Ionicons

            name="notifications-outline"

            size={23}

            color="#004B0A"

          />

        </TouchableOpacity>

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

              carregarPublicacoes(

                true

              )

            }

            tintColor="#004B0A"

            colors={['#004B0A']}

          />

        }

      >

        <View style={styles.intro}>

          <Text

            style={styles.introTitle}

          >

            Acompanhe os produtores

          </Text>

          <Text

            style={styles.introText}

          >

            Veja novidades, feiras,

            colheitas e o dia a dia dos

            produtores locais.

          </Text>

        </View>

        {erro ? (

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

              onPress={() =>

                carregarPublicacoes()

              }

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

        ) : publicacoes.length ===

          0 ? (

          <View

            style={

              styles.emptyContainer

            }

          >

            <Ionicons

              name="newspaper-outline"

              size={48}

              color="#7A987D"

            />

            <Text

              style={

                styles.emptyTitle

              }

            >

              Nenhuma publicação ainda

            </Text>

            <Text

              style={

                styles.emptyText

              }

            >

              Quando os produtores

              publicarem novidades,

              elas aparecerão aqui.

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

                  style={

                    styles.postCard

                  }

                  key={

                    publicacao.id

                  }

                >

                  <TouchableOpacity

                    style={

                      styles.postHeader

                    }

                    activeOpacity={

                      0.8

                    }

                    onPress={() =>

                      router.push(

                        `/produtor/${publicacao.produtor_id}`

                      )

                    }

                  >

                    {publicacao.produtor_imagem_url ? (

                      <Image

                        source={{

                          uri: publicacao.produtor_imagem_url,

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

                          {iniciaisProdutor(

                            publicacao.produtor_nome

                          )}

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

                        {

                          publicacao.produtor_nome

                        }

                      </Text>

                      <Text

                        style={

                          styles.property

                        }

                      >

                        {

                          publicacao.nome_fazenda

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

                    <Ionicons

                      name="chevron-forward"

                      size={20}

                      color="#888888"

                    />

                  </TouchableOpacity>

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

                        uri: publicacao.imagem_url,

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

                    style={

                      styles.actions

                    }

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

      <View

        style={

          styles.bottomNavigation

        }

      >

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.replace('/inicio')

          }

        >

          <Ionicons

            name="home-outline"

            size={23}

            color="#777777"

          />

          <Text

            style={styles.navText}

          >

            Início

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push('/buscar')

          }

        >

          <Ionicons

            name="search-outline"

            size={23}

            color="#777777"

          />

          <Text

            style={styles.navText}

          >

            Buscar

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

        >

          <Ionicons

            name="newspaper"

            size={23}

            color="#004B0A"

          />

          <Text

            style={

              styles.navTextActive

            }

          >

            Publicações

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push(

              '/carrinho'

            )

          }

        >

          <Ionicons

            name="cart-outline"

            size={23}

            color="#777777"

          />

          <Text

            style={styles.navText}

          >

            Carrinho

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push('/perfil')

          }

        >

          <Ionicons

            name="person-outline"

            size={23}

            color="#777777"

          />

          <Text

            style={styles.navText}

          >

            Perfil

          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}

const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#F5F5F5',

  },

  header: {

    backgroundColor: '#FFFFFF',

    paddingTop: 26,

    paddingHorizontal: 18,

    paddingBottom: 15,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:

      'space-between',

    borderBottomWidth: 1,

    borderBottomColor: '#EEEEEE',

  },

  headerTitle: {

    fontSize: 22,

    fontWeight: 'bold',

    color: '#111111',

  },

  notificationButton: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: '#F0F6F1',

    alignItems: 'center',

    justifyContent: 'center',

  },

  scrollContent: {

    paddingBottom: 105,

  },

  intro: {

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 18,

    paddingTop: 18,

    paddingBottom: 18,

    marginBottom: 10,

  },

  introTitle: {

    fontSize: 18,

    fontWeight: 'bold',

  },

  introText: {

    fontSize: 12,

    color: '#666666',

    lineHeight: 18,

    marginTop: 5,

  },

  postCard: {

    backgroundColor: '#FFFFFF',

    marginBottom: 10,

    paddingTop: 15,

  },

  postHeader: {

    paddingHorizontal: 16,

    flexDirection: 'row',

    alignItems: 'center',

  },

  avatarImage: {

    width: 46,

    height: 46,

    borderRadius: 23,

  },

  avatarPlaceholder: {

    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: '#DDEBDF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  avatarInitials: {

    fontSize: 14,

    fontWeight: 'bold',

    color: '#004B0A',

  },

  authorInfo: {

    flex: 1,

    marginLeft: 10,

  },

  authorName: {

    fontSize: 14,

    fontWeight: 'bold',

    color: '#111111',

  },

  property: {

    fontSize: 10,

    fontWeight: '600',

    color: '#004B0A',

    marginTop: 2,

  },

  time: {

    fontSize: 9,

    color: '#888888',

    marginTop: 2,

  },

  postText: {

    fontSize: 13,

    lineHeight: 19,

    color: '#333333',

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

    paddingHorizontal: 16,

    flexDirection: 'row',

    alignItems: 'center',

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

  loadingContainer: {

    flex: 1,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  loadingText: {

    fontSize: 11,

    color: '#666666',

    marginTop: 10,

  },

  emptyContainer: {

    backgroundColor: '#FFFFFF',

    margin: 16,

    paddingVertical: 45,

    paddingHorizontal: 25,

    borderRadius: 12,

    alignItems: 'center',

  },

  emptyTitle: {

    fontSize: 15,

    fontWeight: 'bold',

    marginTop: 10,

    textAlign: 'center',

  },

  emptyText: {

    fontSize: 11,

    lineHeight: 16,

    color: '#777777',

    textAlign: 'center',

    marginTop: 5,

  },

  retryButton: {

    backgroundColor: '#004B0A',

    paddingHorizontal: 20,

    paddingVertical: 10,

    borderRadius: 8,

    marginTop: 15,

  },

  retryButtonText: {

    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '600',

  },

  bottomNavigation: {

    position: 'absolute',

    bottom: 0,

    left: 0,

    right: 0,

    height: 76,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor: '#E5E5E5',

    flexDirection: 'row',

    alignItems: 'center',

    paddingBottom: 4,

  },

  navItem: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  navText: {

    fontSize: 9,

    color: '#777777',

    marginTop: 4,

  },

  navTextActive: {

    fontSize: 9,

    color: '#004B0A',

    fontWeight: '600',

    marginTop: 4,

  },

});
