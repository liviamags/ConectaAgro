import { Ionicons } from '@expo/vector-icons';

import { router, useFocusEffect } from 'expo-router';

import {
  useCallback,

  useState,
} from 'react';

import {
  ActivityIndicator,

  Alert,

  Image,

  RefreshControl,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type Publicacao = {

  id: string;

  produtor_id: string;

  texto: string;

  imagem_url: string | null;

  curtidas: number;

  comentarios: number;

  created_at: string;

};

export default function PublicacoesProdutorScreen() {

  const [publicacoes, setPublicacoes] =

    useState<Publicacao[]>([]);

  const [nomeProdutor, setNomeProdutor] =
    useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [nomeFazenda, setNomeFazenda] =

    useState('');

  const [carregando, setCarregando] =

    useState(true);

  const [atualizando, setAtualizando] =

    useState(false);

  const [excluindoId, setExcluindoId] =

    useState<string | null>(null);

  useFocusEffect(

    useCallback(() => {

      carregarDados();

    }, [])

  );

  async function carregarDados(

    mostrarCarregamento = true

  ) {

    if (mostrarCarregamento) {

      setCarregando(true);

    }

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

      const [

        perfilResponse,

        produtorResponse,

        publicacoesResponse,

      ] = await Promise.all([

        supabase

          .from('profiles')

          .select('nome, avatar_url')

          .eq('id', user.id)

          .single(),

        supabase

          .from('produtores')

          .select('nome_fazenda, imagem_url')

          .eq('id', user.id)

          .single(),

        supabase

          .from('publicacoes')

          .select(

            'id, produtor_id, texto, imagem_url, curtidas, comentarios, created_at'

          )

          .eq('produtor_id', user.id)

          .order('created_at', {

            ascending: false,

          }),

      ]);

      if (perfilResponse.error) {

        console.log(

          'Erro ao buscar perfil:',

          perfilResponse.error

        );

      } else {

        setNomeProdutor(perfilResponse.data?.nome || 'Produtor');

      }

      if (produtorResponse.error) {

        console.log(

          'Erro ao buscar propriedade:',

          produtorResponse.error

        );
        setAvatarUrl(perfilResponse.data?.avatar_url?.trim() || null);

      } else {

        setNomeFazenda(
          produtorResponse.data?.nome_fazenda || 'Propriedade'
        );
        // A foto usada no perfil do produtor é salva em produtores.imagem_url.
        // Usa profiles.avatar_url apenas como alternativa, se necessário.
        setAvatarUrl(
          produtorResponse.data?.imagem_url?.trim() ||
          perfilResponse.data?.avatar_url?.trim() ||
          null
        );

      }

      if (publicacoesResponse.error) {

        console.log(

          'Erro ao buscar publicações:',

          publicacoesResponse.error

        );

        Alert.alert(

          'Erro',

          'Não foi possível carregar suas publicações.'

        );

        return;

      }

      setPublicacoes(

        publicacoesResponse.data || []

      );

    } catch (error) {

      console.log(

        'Erro inesperado ao carregar publicações:',

        error

      );

      Alert.alert(

        'Erro',

        'Ocorreu um erro ao carregar suas publicações.'

      );

    } finally {

      setCarregando(false);

      setAtualizando(false);

    }

  }

  async function atualizarPublicacoes() {

    setAtualizando(true);

    await carregarDados(false);

  }

  function confirmarExclusao(

    publicacao: Publicacao

  ) {

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

          onPress: () =>

            excluirPublicacao(

              publicacao

            ),

        },

      ]

    );

  }

  function obterCaminhoStorage(

    imagemUrl: string

  ) {

    try {

      const marcador =

        '/storage/v1/object/public/publicacoes/';

      const indice =

        imagemUrl.indexOf(marcador);

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

  async function excluirPublicacao(

    publicacao: Publicacao

  ) {

    if (excluindoId) {

      return;

    }

    setExcluindoId(

      publicacao.id

    );

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

          'Erro',

          'Sua sessão não foi encontrada.'

        );

        return;

      }

      if (

        user.id !==

        publicacao.produtor_id

      ) {

        Alert.alert(

          'Ação não permitida',

          'Esta publicação não pertence à sua conta.'

        );

        return;

      }

      const {

        error: deleteError,

      } = await supabase

        .from('publicacoes')

        .delete()

        .eq('id', publicacao.id)

        .eq(

          'produtor_id',

          user.id

        );

      if (deleteError) {

        console.log(

          'Erro ao excluir publicação:',

          deleteError

        );

        Alert.alert(

          'Erro',

          'Não foi possível excluir a publicação.'

        );

        return;

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

            error: storageError,

          } = await supabase.storage

            .from('publicacoes')

            .remove([caminho]);

          if (storageError) {

            console.log(

              'A publicação foi excluída, mas ocorreu um erro ao excluir a imagem:',

              storageError

            );

          }

        }

      }

      setPublicacoes(

        (listaAtual) =>

          listaAtual.filter(

            (item) =>

              item.id !==

              publicacao.id

          )

      );

      Alert.alert(

        'Publicação excluída',

        'A publicação foi excluída com sucesso.'

      );

    } catch (error) {

      console.log(

        'Erro inesperado ao excluir publicação:',

        error

      );

      Alert.alert(

        'Erro',

        'Ocorreu um erro ao excluir a publicação.'

      );

    } finally {

      setExcluindoId(null);

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

    const agora = new Date();

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

    if (

      dias === 1

    ) {

      return 'Ontem';

    }

    if (

      dias > 1 &&

      dias < 7

    ) {

      return `Há ${dias} dias`;

    }

    return data.toLocaleDateString(

      'pt-BR'

    );

  }

  const totalCurtidas =

    publicacoes.reduce(

      (

        total,

        publicacao

      ) =>

        total +

        (publicacao.curtidas ||

          0),

      0

    );

  const totalComentarios =

    publicacoes.reduce(

      (

        total,

        publicacao

      ) =>

        total +

        (publicacao.comentarios ||

          0),

      0

    );

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

          Carregando publicações...

        </Text>

      </View>

    );

  }

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

            Minhas publicações

          </Text>

          <Text

            style={

              styles.subtitle

            }

          >

            Compartilhe novidades

            da sua produção

          </Text>

        </View>

        <TouchableOpacity

          style={

            styles.addButton

          }

          onPress={() =>

            router.push(

              '/area-produtor/nova-publicacao'

            )

          }

        >

          <Ionicons

            name="add"

            size={25}

            color="#FFFFFF"

          />

        </TouchableOpacity>

      </View>

      <View

        style={styles.summary}

      >

        <View>

          <Text

            style={

              styles.summaryNumber

            }

          >

            {publicacoes.length}

          </Text>

          <Text

            style={

              styles.summaryLabel

            }

          >

            Publicações

          </Text>

        </View>

        <View

          style={

            styles.summaryDivider

          }

        />

        <View>

          <Text

            style={

              styles.summaryNumber

            }

          >

            {totalCurtidas}

          </Text>

          <Text

            style={

              styles.summaryLabel

            }

          >

            Curtidas

          </Text>

        </View>

        <View

          style={

            styles.summaryDivider

          }

        />

        <View>

          <Text

            style={

              styles.summaryNumber

            }

          >

            {totalComentarios}

          </Text>

          <Text

            style={

              styles.summaryLabel

            }

          >

            Comentários

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

        refreshControl={

          <RefreshControl

            refreshing={

              atualizando

            }

            onRefresh={

              atualizarPublicacoes

            }

          />

        }

      >

        <TouchableOpacity

          style={

            styles.newPublicationCard

          }

          onPress={() =>

            router.push(

              '/area-produtor/nova-publicacao'

            )

          }

        >

          <View

            style={

              styles.newPublicationIcon

            }

          >

            <Ionicons

              name="camera-outline"

              size={25}

              color="#004B0A"

            />

          </View>

          <View

            style={

              styles.newPublicationInfo

            }

          >

            <Text

              style={

                styles.newPublicationTitle

              }

            >

              Criar nova publicação

            </Text>

            <Text

              style={

                styles.newPublicationText

              }

            >

              Mostre sua produção,

              colheitas, feiras e

              novidades aos

              consumidores.

            </Text>

          </View>

          <Ionicons

            name="chevron-forward"

            size={20}

            color="#004B0A"

          />

        </TouchableOpacity>

        {publicacoes.length ===

        0 ? (

          <View

            style={styles.empty}

          >

            <Ionicons

              name="images-outline"

              size={55}

              color="#AAB7AC"

            />

            <Text

              style={

                styles.emptyTitle

              }

            >

              Nenhuma publicação

            </Text>

            <Text

              style={

                styles.emptyText

              }

            >

              Suas publicações

              aparecerão aqui.

            </Text>

          </View>

        ) : (

          publicacoes.map(

            (publicacao) => (

              <View

                key={

                  publicacao.id

                }

                style={

                  styles.publicationCard

                }

              >

                <View

                  style={

                    styles.authorArea

                  }

                >

                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person-outline" size={23} color="#7D9982" />
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

                  <TouchableOpacity

                    style={

                      styles.editIconButton

                    }

                    onPress={() =>

                      router.push({

                        pathname:

                          '/area-produtor/editar-publicacao/[id]',

                        params: {

                          id: publicacao.id,

                        },

                      })

                    }

                  >

                    <Ionicons

                      name="create-outline"

                      size={19}

                      color="#004B0A"

                    />

                  </TouchableOpacity>

                </View>

                <Text

                  style={

                    styles.publicationText

                  }

                >

                  {publicacao.texto}

                </Text>

                {publicacao.imagem_url ? (

                  <Image

                    source={{

                      uri: publicacao.imagem_url,

                    }}

                    style={

                      styles.publicationImage

                    }

                  />

                ) : null}

                <View

                  style={

                    styles.statsRow

                  }

                >

                  <View

                    style={

                      styles.stat

                    }

                  >

                    <Ionicons

                      name="heart-outline"

                      size={18}

                      color="#555555"

                    />

                    <Text

                      style={

                        styles.statText

                      }

                    >

                      {publicacao.curtidas ||

                        0}{' '}

                      curtidas

                    </Text>

                  </View>

                  <View

                    style={

                      styles.stat

                    }

                  >

                    <Ionicons

                      name="chatbubble-outline"

                      size={17}

                      color="#555555"

                    />

                    <Text

                      style={

                        styles.statText

                      }

                    >

                      {publicacao.comentarios ||

                        0}{' '}

                      comentários

                    </Text>

                  </View>

                </View>

                <View

                  style={

                    styles.actions

                  }

                >

                  <TouchableOpacity

                    style={

                      styles.actionButton

                    }

                    onPress={() =>

                      router.push({

                        pathname:

                          '/area-produtor/editar-publicacao/[id]',

                        params: {

                          id: publicacao.id,

                        },

                      })

                    }

                  >

                    <Ionicons

                      name="create-outline"

                      size={18}

                      color="#004B0A"

                    />

                    <Text

                      style={

                        styles.editText

                      }

                    >

                      Editar

                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity

                    style={

                      styles.deleteButton

                    }

                    disabled={

                      excluindoId ===

                      publicacao.id

                    }

                    onPress={() =>

                      confirmarExclusao(

                        publicacao

                      )

                    }

                  >

                    {excluindoId ===

                    publicacao.id ? (

                      <ActivityIndicator

                        size="small"

                        color="#B42318"

                      />

                    ) : (

                      <>

                        <Ionicons

                          name="trash-outline"

                          size={18}

                          color="#B42318"

                        />

                        <Text

                          style={

                            styles.deleteText

                          }

                        >

                          Excluir

                        </Text>

                      </>

                    )}

                  </TouchableOpacity>

                </View>

              </View>

            )

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

            router.replace(

              '/area-produtor/inicio'

            )

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

            router.replace(

              '/area-produtor/produtos'

            )

          }

        >

          <Ionicons

            name="basket-outline"

            size={23}

            color="#777777"

          />

          <Text

            style={styles.navText}

          >

            Produtos

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.replace(

              '/area-produtor/pedidos'

            )

          }

        >

          <Ionicons

            name="receipt-outline"

            size={23}

            color="#777777"

          />

          <Text

            style={styles.navText}

          >

            Pedidos

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push(

              '/area-produtor/nova-publicacao'

            )

          }

        >

          <View

            style={

              styles.publishButton

            }

          >

            <Ionicons

              name="add"

              size={26}

              color="#FFFFFF"

            />

          </View>

          <Text

            style={styles.navText}

          >

            Publicar

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push(

              '/area-produtor/perfil'

            )

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

    backgroundColor: '#FFFFFF',

  },

  loadingContainer: {

    flex: 1,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  loadingText: {

    fontSize: 10,

    color: '#777777',

    marginTop: 10,

  },

  header: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 18,

    paddingTop: 22,

    paddingBottom: 14,

    borderBottomWidth: 1,

    borderBottomColor: '#F0F0F0',

  },

  backButton: {

    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: '#F0F6F1',

    alignItems: 'center',

    justifyContent: 'center',

  },

  headerInfo: {

    flex: 1,

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

  addButton: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: '#004B0A',

    alignItems: 'center',

    justifyContent: 'center',

  },

  summary: {

    margin: 18,

    marginBottom: 5,

    backgroundColor: '#F0F6F1',

    borderRadius: 14,

    paddingVertical: 15,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-around',

  },

  summaryNumber: {

    fontSize: 17,

    fontWeight: 'bold',

    color: '#004B0A',

    textAlign: 'center',

  },

  summaryLabel: {

    fontSize: 8,

    color: '#666666',

    marginTop: 3,

  },

  summaryDivider: {

    width: 1,

    height: 30,

    backgroundColor: '#CEDDCE',

  },

  content: {

    paddingHorizontal: 18,

    paddingBottom: 110,

  },

  newPublicationCard: {

    backgroundColor: '#F0F6F1',

    borderRadius: 13,

    padding: 13,

    flexDirection: 'row',

    alignItems: 'center',

    marginVertical: 13,

  },

  newPublicationIcon: {

    width: 44,

    height: 44,

    borderRadius: 12,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  newPublicationInfo: {

    flex: 1,

    marginLeft: 10,

  },

  newPublicationTitle: {

    fontSize: 11,

    fontWeight: 'bold',

    color: '#004B0A',

  },

  newPublicationText: {

    fontSize: 8,

    color: '#647266',

    lineHeight: 12,

    marginTop: 3,

  },

  publicationCard: {

    borderWidth: 1,

    borderColor: '#E5E5E5',

    borderRadius: 14,

    overflow: 'hidden',

    marginBottom: 16,

  },

  authorArea: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 13,

  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authorInfo: {

    flex: 1,

    marginLeft: 9,

  },

  authorName: {

    fontSize: 12,

    fontWeight: 'bold',

  },

  property: {

    fontSize: 8,

    color: '#777777',

    marginTop: 2,

  },

  editIconButton: {

    width: 34,

    height: 34,

    borderRadius: 9,

    backgroundColor: '#F0F6F1',

    alignItems: 'center',

    justifyContent: 'center',

  },

  publicationText: {

    fontSize: 10,

    color: '#444444',

    lineHeight: 15,

    paddingHorizontal: 13,

    paddingBottom: 11,

  },

  publicationImage: {

    width: '100%',

    height: 220,

    resizeMode: 'cover',

  },

  statsRow: {

    flexDirection: 'row',

    padding: 12,

    gap: 20,

  },

  stat: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

  },

  statText: {

    fontSize: 9,

    color: '#555555',

  },

  actions: {

    flexDirection: 'row',

    borderTopWidth: 1,

    borderTopColor: '#EEEEEE',

  },

  actionButton: {

    flex: 1,

    paddingVertical: 12,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    gap: 5,

  },

  deleteButton: {

    flex: 1,

    paddingVertical: 12,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    gap: 5,

    borderLeftWidth: 1,

    borderLeftColor: '#EEEEEE',

  },

  editText: {

    fontSize: 9,

    fontWeight: '600',

    color: '#004B0A',

  },

  deleteText: {

    fontSize: 9,

    fontWeight: '600',

    color: '#B42318',

  },

  empty: {

    alignItems: 'center',

    paddingTop: 55,

  },

  emptyTitle: {

    fontSize: 16,

    fontWeight: 'bold',

    marginTop: 12,

  },

  emptyText: {

    fontSize: 10,

    color: '#777777',

    marginTop: 5,

  },

  bottomNavigation: {

    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0,

    height: 76,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor: '#E5E5E5',

    flexDirection: 'row',

    alignItems: 'center',

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

  publishButton: {

    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#004B0A',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: -12,

  },

});