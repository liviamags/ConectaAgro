import { Ionicons } from '@expo/vector-icons';

import {
  router,

  useFocusEffect,
} from 'expo-router';

import {
  useCallback,

  useMemo,

  useState,
} from 'react';

import {
  ActivityIndicator,

  Image,

  RefreshControl,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type CategoriaBusca =

  | 'Todos'

  | 'Produtos'

  | 'Produtores';

type ProdutoBusca = {

  id: string;

  nome: string;

  produtor_id: string;

  produtor: string;

  preco: number;

  unidade: string;

  imagem_url: string | null;

};

type ProdutorBusca = {

  id: string;

  nome: string;

  nome_fazenda: string;

  cidade: string;

  estado: string;

  tipo_producao: string;
  imagem_url: string | null;

};

const categorias: CategoriaBusca[] = [

  'Todos',

  'Produtos',

  'Produtores',

];

export default function BuscarScreen() {

  const [pesquisa, setPesquisa] =

    useState('');

  const [categoria, setCategoria] =

    useState<CategoriaBusca>('Todos');

  const [produtos, setProdutos] =

    useState<ProdutoBusca[]>([]);

  const [produtores, setProdutores] =

    useState<ProdutorBusca[]>([]);

  const [carregando, setCarregando] =

    useState(true);

  const [atualizando, setAtualizando] =

    useState(false);

  const [erro, setErro] =

    useState('');

  const carregarDados = useCallback(

    async (refresh = false) => {

      if (refresh) {

        setAtualizando(true);

      } else {

        setCarregando(true);

      }

      setErro('');

      try {

        const [

          resultadoProdutores,

          resultadoProdutos,

        ] = await Promise.all([

          supabase.rpc(

            'listar_produtores_publicos'

          ),

          supabase

            .from('produtos')

            .select(

              'id, nome, produtor_id, preco, unidade, imagem_url'

            )

            .eq('ativo', true)

            .order('created_at', {

              ascending: false,

            }),

        ]);

        if (resultadoProdutores.error) {

          console.log(

            'Erro ao carregar produtores:',

            resultadoProdutores.error

          );

          setErro(

            'Não foi possível carregar os produtores.'

          );

        }

        if (resultadoProdutos.error) {

          console.log(

            'Erro ao carregar produtos:',

            resultadoProdutos.error

          );

          setErro(

            'Não foi possível carregar os produtos.'

          );

        }

        const produtoresPublicos =

          resultadoProdutores.data ?? [];

        if (!resultadoProdutores.error) {

          const produtoresFormatados: ProdutorBusca[] =

            produtoresPublicos.map(

              (produtor: any) => ({

                id: produtor.id,

                nome:

                  produtor.nome ||

                  'Produtor',

                nome_fazenda:

                  produtor.nome_fazenda ||

                  'Propriedade rural',

                cidade:

                  produtor.cidade || '',

                estado:

                  produtor.estado || '',

                tipo_producao:

                  produtor.tipo_producao ||

                  'Produção local',
                imagem_url: produtor.imagem_url ?? null,

              })

            );

          setProdutores(

            produtoresFormatados

          );

        }

        if (!resultadoProdutos.error) {

          const produtosFormatados: ProdutoBusca[] =

            (resultadoProdutos.data ?? []).map(

              (produto: any) => {

                const produtor =

                  produtoresPublicos.find(

                    (item: any) =>

                      item.id ===

                      produto.produtor_id

                  );

                return {

                  id: produto.id,

                  nome:

                    produto.nome ||

                    'Produto',

                  produtor_id:

                    produto.produtor_id,

                  produtor:

                    produtor?.nome_fazenda ||

                    produtor?.nome ||

                    'Produtor local',

                  preco: Number(

                    produto.preco ?? 0

                  ),

                  unidade:

                    produto.unidade ||

                    'unidade',

                  imagem_url:

                    produto.imagem_url ??

                    null,

                };

              }

            );

          setProdutos(

            produtosFormatados

          );

        }

      } catch (error) {

        console.log(

          'Erro inesperado na busca:',

          error

        );

        setErro(

          'Ocorreu um erro ao carregar a busca.'

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

      carregarDados();

    }, [carregarDados])

  );

  const textoPesquisa = pesquisa

    .trim()

    .toLowerCase();

  const produtosFiltrados =

    useMemo(() => {

      if (!textoPesquisa) {

        return produtos;

      }

      return produtos.filter(

        (produto) =>

          produto.nome

            .toLowerCase()

            .includes(

              textoPesquisa

            ) ||

          produto.produtor

            .toLowerCase()

            .includes(

              textoPesquisa

            )

      );

    }, [

      produtos,

      textoPesquisa,

    ]);

  const produtoresFiltrados =

    useMemo(() => {

      if (!textoPesquisa) {

        return produtores;

      }

      return produtores.filter(

        (produtor) => {

          const localizacao =

            [

              produtor.cidade,

              produtor.estado,

            ]

              .filter(Boolean)

              .join(', ')

              .toLowerCase();

          return (

            produtor.nome

              .toLowerCase()

              .includes(

                textoPesquisa

              ) ||

            produtor.nome_fazenda

              .toLowerCase()

              .includes(

                textoPesquisa

              ) ||

            localizacao.includes(

              textoPesquisa

            ) ||

            produtor.tipo_producao

              .toLowerCase()

              .includes(

                textoPesquisa

              )

          );

        }

      );

    }, [

      produtores,

      textoPesquisa,

    ]);

  const mostrarProdutos =

    categoria === 'Todos' ||

    categoria === 'Produtos';

  const mostrarProdutores =

    categoria === 'Todos' ||

    categoria === 'Produtores';

  const quantidadeResultados =

    (mostrarProdutos

      ? produtosFiltrados.length

      : 0) +

    (mostrarProdutores

      ? produtoresFiltrados.length

      : 0);

  const semResultados =

    pesquisa.trim().length > 0 &&

    quantidadeResultados === 0;

  function formatarPreco(

    valor: number

  ) {

    return valor.toLocaleString(

      'pt-BR',

      {

        style: 'currency',

        currency: 'BRL',

      }

    );

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

  function localizacaoProdutor(

    produtor: ProdutorBusca

  ) {

    const partes = [

      produtor.cidade,

      produtor.estado,

    ].filter(Boolean);

    if (partes.length === 0) {

      return 'Localização não informada';

    }

    return partes.join(', ');

  }

  return (

    <View style={styles.container}>

      <View style={styles.header}>

        <Text

          style={styles.headerTitle}

        >

          Buscar

        </Text>

        <TouchableOpacity

          style={styles.mapButton}

          onPress={() =>

            router.push('/mapa')

          }

        >

          <Ionicons

            name="map-outline"

            size={22}

            color="#004B0A"

          />

        </TouchableOpacity>

      </View>

      <View

        style={styles.searchArea}

      >

        <View

          style={

            styles.searchContainer

          }

        >

          <Ionicons

            name="search-outline"

            size={21}

            color="#777777"

          />

          <TextInput

            style={styles.searchInput}

            placeholder="Buscar produtos, produtores..."

            placeholderTextColor="#999999"

            value={pesquisa}

            onChangeText={setPesquisa}

            autoFocus={false}

          />

          {pesquisa.length > 0 && (

            <TouchableOpacity

              style={

                styles.clearButton

              }

              onPress={() =>

                setPesquisa('')

              }

            >

              <Ionicons

                name="close-circle"

                size={20}

                color="#999999"

              />

            </TouchableOpacity>

          )}

        </View>

        <ScrollView

          horizontal

          showsHorizontalScrollIndicator={

            false

          }

          contentContainerStyle={

            styles.categoriesContainer

          }

        >

          {categorias.map(

            (item) => {

              const ativo =

                categoria === item;

              return (

                <TouchableOpacity

                  key={item}

                  style={[

                    styles.categoryButton,

                    ativo &&

                      styles.categoryButtonActive,

                  ]}

                  onPress={() =>

                    setCategoria(

                      item

                    )

                  }

                >

                  <Text

                    style={[

                      styles.categoryText,

                      ativo &&

                        styles.categoryTextActive,

                    ]}

                  >

                    {item}

                  </Text>

                </TouchableOpacity>

              );

            }

          )}

        </ScrollView>

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

            style={styles.loadingText}

          >

            Carregando produtos e

            produtores...

          </Text>

        </View>

      ) : (

        <ScrollView

          showsVerticalScrollIndicator={

            false

          }

          contentContainerStyle={

            styles.scrollContent

          }

          refreshControl={

            <RefreshControl

              refreshing={

                atualizando

              }

              onRefresh={() =>

                carregarDados(true)

              }

              tintColor="#004B0A"

              colors={['#004B0A']}

            />

          }

        >

          {erro ? (

            <View

              style={

                styles.errorCard

              }

            >

              <Ionicons

                name="alert-circle-outline"

                size={28}

                color="#004B0A"

              />

              <Text

                style={

                  styles.errorText

                }

              >

                {erro}

              </Text>

              <TouchableOpacity

                style={

                  styles.retryButton

                }

                onPress={() =>

                  carregarDados()

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

          ) : (

            <>

              {pesquisa.length ===

                0 && (

                <View

                  style={

                    styles.introCard

                  }

                >

                  <View

                    style={

                      styles.introIcon

                    }

                  >

                    <Ionicons

                      name="search-outline"

                      size={25}

                      color="#004B0A"

                    />

                  </View>

                  <View

                    style={

                      styles.introContent

                    }

                  >

                    <Text

                      style={

                        styles.introTitle

                      }

                    >

                      Encontre o que

                      procura

                    </Text>

                    <Text

                      style={

                        styles.introText

                      }

                    >

                      Pesquise alimentos

                      e produtores locais

                      cadastrados no

                      ConectaAgro.

                    </Text>

                  </View>

                </View>

              )}

              {pesquisa.length >

                0 &&

                !semResultados && (

                  <Text

                    style={

                      styles.resultInfo

                    }

                  >

                    {

                      quantidadeResultados

                    }{' '}

                    {quantidadeResultados ===

                    1

                      ? 'resultado encontrado'

                      : 'resultados encontrados'}

                  </Text>

                )}

              {semResultados && (

                <View

                  style={

                    styles.emptyContainer

                  }

                >

                  <View

                    style={

                      styles.emptyIcon

                    }

                  >

                    <Ionicons

                      name="search-outline"

                      size={40}

                      color="#9FB2A1"

                    />

                  </View>

                  <Text

                    style={

                      styles.emptyTitle

                    }

                  >

                    Nenhum resultado

                    encontrado

                  </Text>

                  <Text

                    style={

                      styles.emptyText

                    }

                  >

                    Tente pesquisar outro

                    produto, produtor,

                    propriedade ou

                    localização.

                  </Text>

                  <TouchableOpacity

                    style={

                      styles.clearSearchButton

                    }

                    onPress={() => {

                      setPesquisa('');

                      setCategoria(

                        'Todos'

                      );

                    }}

                  >

                    <Text

                      style={

                        styles.clearSearchButtonText

                      }

                    >

                      Limpar pesquisa

                    </Text>

                  </TouchableOpacity>

                </View>

              )}

              {!semResultados &&

                mostrarProdutos &&

                produtosFiltrados.length >

                  0 && (

                  <>

                    <View

                      style={

                        styles.sectionHeader

                      }

                    >

                      <View>

                        <Text

                          style={

                            styles.sectionTitle

                          }

                        >

                          Produtos

                        </Text>

                        <Text

                          style={

                            styles.sectionSubtitle

                          }

                        >

                          Direto dos

                          produtores

                        </Text>

                      </View>

                      <TouchableOpacity

                        onPress={() =>

                          router.push(

                            '/produtos'

                          )

                        }

                      >

                        <Text

                          style={

                            styles.seeAll

                          }

                        >

                          Ver todos

                        </Text>

                      </TouchableOpacity>

                    </View>

                    <ScrollView

                      horizontal

                      showsHorizontalScrollIndicator={

                        false

                      }

                      contentContainerStyle={

                        styles.horizontalList

                      }

                    >

                      {produtosFiltrados.map(

                        (

                          produto

                        ) => (

                          <TouchableOpacity

                            key={

                              produto.id

                            }

                            style={

                              styles.productCard

                            }

                            activeOpacity={

                              0.85

                            }

                            onPress={() =>

                              router.push(

                                `/produto/${produto.id}`

                              )

                            }

                          >

                            {produto.imagem_url ? (

                              <Image

                                source={{

                                  uri: produto.imagem_url,

                                }}

                                style={

                                  styles.productImage

                                }

                                resizeMode="cover"

                              />

                            ) : (

                              <View

                                style={

                                  styles.productImagePlaceholder

                                }

                              >

                                <Ionicons

                                  name="basket-outline"

                                  size={

                                    31

                                  }

                                  color="#004B0A"

                                />

                              </View>

                            )}

                            <View

                              style={

                                styles.productContent

                              }

                            >

                              <Text

                                style={

                                  styles.productName

                                }

                                numberOfLines={

                                  1

                                }

                              >

                                {

                                  produto.nome

                                }

                              </Text>

                              <Text

                                style={

                                  styles.productProducer

                                }

                                numberOfLines={

                                  1

                                }

                              >

                                {

                                  produto.produtor

                                }

                              </Text>

                              <Text

                                style={

                                  styles.productPrice

                                }

                              >

                                {formatarPreco(

                                  produto.preco

                                )}{' '}

                                /{' '}

                                {

                                  produto.unidade

                                }

                              </Text>

                            </View>

                          </TouchableOpacity>

                        )

                      )}

                    </ScrollView>

                  </>

                )}

              {!semResultados &&

                mostrarProdutores &&

                produtoresFiltrados.length >

                  0 && (

                  <>

                    <View

                      style={

                        styles.sectionHeader

                      }

                    >

                      <View>

                        <Text

                          style={

                            styles.sectionTitle

                          }

                        >

                          Produtores

                        </Text>

                        <Text

                          style={

                            styles.sectionSubtitle

                          }

                        >

                          Conheça quem

                          produz

                        </Text>

                      </View>

                      <TouchableOpacity

                        onPress={() =>

                          router.push(

                            '/produtores'

                          )

                        }

                      >

                        <Text

                          style={

                            styles.seeAll

                          }

                        >

                          Ver todos

                        </Text>

                      </TouchableOpacity>

                    </View>

                    <View>

                      {produtoresFiltrados

                        .slice(

                          0,

                          pesquisa.length >

                            0

                            ? produtoresFiltrados.length

                            : 4

                        )

                        .map(

                          (

                            produtor

                          ) => (

                            <TouchableOpacity

                              key={

                                produtor.id

                              }

                              style={

                                styles.producerCard

                              }

                              activeOpacity={

                                0.85

                              }

                              onPress={() =>

                                router.push(

                                  `/produtor/${produtor.id}`

                                )

                              }

                            >

                              {produtor.imagem_url ? (
                                <Image
                                  source={{ uri: produtor.imagem_url }}
                                  style={styles.producerImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.producerImagePlaceholder}>
                                  <Text style={styles.producerInitials}>
                                    {iniciaisProdutor(produtor.nome)}
                                  </Text>
                                </View>
                              )}

                              <View

                                style={

                                  styles.producerContent

                                }

                              >

                                <Text

                                  style={

                                    styles.producerName

                                  }

                                >

                                  {

                                    produtor.nome

                                  }

                                </Text>

                                <Text

                                  style={

                                    styles.propertyName

                                  }

                                >

                                  {

                                    produtor.nome_fazenda

                                  }

                                </Text>

                                <View

                                  style={

                                    styles.producerLocation

                                  }

                                >

                                  <Ionicons

                                    name="location-outline"

                                    size={

                                      13

                                    }

                                    color="#777777"

                                  />

                                  <Text

                                    style={

                                      styles.producerLocationText

                                    }

                                  >

                                    {localizacaoProdutor(

                                      produtor

                                    )}

                                  </Text>

                                </View>

                                <Text

                                  style={

                                    styles.producerCategory

                                  }

                                  numberOfLines={

                                    1

                                  }

                                >

                                  {

                                    produtor.tipo_producao

                                  }

                                </Text>

                              </View>

                              <Ionicons

                                name="chevron-forward"

                                size={19}

                                color="#999999"

                              />

                            </TouchableOpacity>

                          )

                        )}

                    </View>

                  </>

                )}

              {pesquisa.length ===

                0 && (

                <TouchableOpacity

                  style={

                    styles.mapCard

                  }

                  onPress={() =>

                    router.push(

                      '/mapa'

                    )

                  }

                >

                  <View

                    style={

                      styles.mapIcon

                    }

                  >

                    <Ionicons

                      name="map-outline"

                      size={27}

                      color="#004B0A"

                    />

                  </View>

                  <View

                    style={

                      styles.mapContent

                    }

                  >

                    <Text

                      style={

                        styles.mapTitle

                      }

                    >

                      Buscar pelo mapa

                    </Text>

                    <Text

                      style={

                        styles.mapText

                      }

                    >

                      Veja produtores no

                      mapa e explore suas

                      localizações.

                    </Text>

                  </View>

                  <Ionicons

                    name="chevron-forward"

                    size={20}

                    color="#004B0A"

                  />

                </TouchableOpacity>

              )}

            </>

          )}

        </ScrollView>

      )}

      <View

        style={styles.bottomNavigation}

      >

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.replace('/inicio')

          }

        >

          <Ionicons

            name="home-outline"

            size={22}

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

        >

          <Ionicons

            name="search"

            size={22}

            color="#004B0A"

          />

          <Text

            style={

              styles.navTextActive

            }

          >

            Buscar

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push(

              '/publicacoes'

            )

          }

        >

          <Ionicons

            name="newspaper-outline"

            size={22}

            color="#777777"

          />

          <Text

            style={styles.navText}

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

            size={22}

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

            size={22}

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

    backgroundColor: '#F7F7F7',

  },

  header: {

    backgroundColor: '#FFFFFF',

    paddingTop: 30,

    paddingHorizontal: 18,

    paddingBottom: 10,

    flexDirection: 'row',

    alignItems: 'center',

  },

  headerTitle: {

    flex: 1,

    fontSize: 22,

    fontWeight: 'bold',

    color: '#222222',

  },

  mapButton: {

    width: 43,

    height: 43,

    borderRadius: 22,

    backgroundColor: '#E7F1E8',

    alignItems: 'center',

    justifyContent: 'center',

  },

  searchArea: {

    backgroundColor: '#FFFFFF',

    paddingBottom: 12,

  },

  searchContainer: {

    marginHorizontal: 16,

    height: 48,

    borderRadius: 13,

    backgroundColor: '#F6F6F6',

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 13,

    borderWidth: 1,

    borderColor: '#EEEEEE',

  },

  searchInput: {

    flex: 1,

    fontSize: 12,

    color: '#222222',

    marginLeft: 8,

  },

  clearButton: {

    padding: 4,

  },

  categoriesContainer: {

    paddingHorizontal: 16,

    paddingTop: 11,

  },

  categoryButton: {

    height: 34,

    paddingHorizontal: 15,

    borderRadius: 17,

    backgroundColor: '#F3F3F3',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,

  },

  categoryButtonActive: {

    backgroundColor: '#004B0A',

  },

  categoryText: {

    fontSize: 10,

    color: '#555555',

    fontWeight: '500',

  },

  categoryTextActive: {

    color: '#FFFFFF',

    fontWeight: '600',

  },

  scrollContent: {

    paddingBottom: 105,

  },

  introCard: {

    marginHorizontal: 16,

    marginTop: 15,

    padding: 14,

    backgroundColor: '#E7F1E8',

    borderRadius: 13,

    flexDirection: 'row',

    alignItems: 'center',

  },

  introIcon: {

    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  introContent: {

    flex: 1,

    marginLeft: 11,

  },

  introTitle: {

    fontSize: 13,

    fontWeight: 'bold',

    color: '#004B0A',

  },

  introText: {

    fontSize: 9,

    color: '#555555',

    lineHeight: 14,

    marginTop: 3,

  },

  resultInfo: {

    marginHorizontal: 18,

    marginTop: 14,

    fontSize: 9,

    color: '#777777',

  },

  sectionHeader: {

    marginTop: 23,

    marginBottom: 11,

    paddingHorizontal: 18,

    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-between',

  },

  sectionTitle: {

    fontSize: 17,

    fontWeight: 'bold',

    color: '#222222',

  },

  sectionSubtitle: {

    fontSize: 8,

    color: '#777777',

    marginTop: 2,

  },

  seeAll: {

    fontSize: 10,

    color: '#004B0A',

    fontWeight: '600',

  },

  horizontalList: {

    paddingLeft: 16,

    paddingRight: 5,

  },

  productCard: {

    width: 155,

    backgroundColor: '#FFFFFF',

    borderRadius: 11,

    overflow: 'hidden',

    marginRight: 11,

    borderWidth: 1,

    borderColor: '#EEEEEE',

  },

  productImage: {

    width: '100%',

    height: 105,

  },

  productImagePlaceholder: {

    width: '100%',

    height: 105,

    backgroundColor: '#EDF4EE',

    alignItems: 'center',

    justifyContent: 'center',

  },

  productContent: {

    padding: 10,

  },

  productName: {

    fontSize: 12,

    fontWeight: 'bold',

    color: '#222222',

  },

  productProducer: {

    fontSize: 8,

    color: '#777777',

    marginTop: 3,

  },

  productPrice: {

    fontSize: 11,

    color: '#004B0A',

    fontWeight: 'bold',

    marginTop: 7,

  },

  producerCard: {

    marginHorizontal: 16,

    marginBottom: 9,

    backgroundColor: '#FFFFFF',

    borderRadius: 12,

    padding: 11,

    flexDirection: 'row',

    alignItems: 'center',

  },

  producerImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DDEBDF',
  },

  producerImagePlaceholder: {

    width: 58,

    height: 58,

    borderRadius: 29,

    backgroundColor: '#DDEBDF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  producerInitials: {

    fontSize: 17,

    fontWeight: 'bold',

    color: '#004B0A',

  },

  producerContent: {

    flex: 1,

    marginLeft: 11,

  },

  producerName: {

    fontSize: 12,

    fontWeight: 'bold',

    color: '#222222',

  },

  propertyName: {

    fontSize: 9,

    color: '#004B0A',

    fontWeight: '600',

    marginTop: 2,

  },

  producerLocation: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 4,

  },

  producerLocationText: {

    fontSize: 8,

    color: '#777777',

    marginLeft: 3,

  },

  producerCategory: {

    fontSize: 8,

    color: '#777777',

    marginTop: 3,

  },

  emptyContainer: {

    alignItems: 'center',

    paddingHorizontal: 30,

    paddingTop: 65,

  },

  emptyIcon: {

    width: 82,

    height: 82,

    borderRadius: 41,

    backgroundColor: '#E7F1E8',

    alignItems: 'center',

    justifyContent: 'center',

  },

  emptyTitle: {

    fontSize: 15,

    fontWeight: 'bold',

    marginTop: 15,

  },

  emptyText: {

    fontSize: 10,

    lineHeight: 15,

    color: '#777777',

    textAlign: 'center',

    marginTop: 5,

  },

  clearSearchButton: {

    marginTop: 17,

    backgroundColor: '#004B0A',

    paddingHorizontal: 17,

    paddingVertical: 10,

    borderRadius: 8,

  },

  clearSearchButtonText: {

    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '600',

  },

  mapCard: {

    marginHorizontal: 16,

    marginTop: 25,

    backgroundColor: '#E7F1E8',

    padding: 14,

    borderRadius: 13,

    flexDirection: 'row',

    alignItems: 'center',

  },

  mapIcon: {

    width: 50,

    height: 50,

    borderRadius: 25,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  mapContent: {

    flex: 1,

    marginLeft: 11,

  },

  mapTitle: {

    fontSize: 13,

    fontWeight: 'bold',

    color: '#004B0A',

  },

  mapText: {

    fontSize: 9,

    color: '#555555',

    lineHeight: 14,

    marginTop: 3,

  },

  loadingContainer: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  loadingText: {

    fontSize: 10,

    color: '#777777',

    marginTop: 10,

  },

  errorCard: {

    margin: 16,

    padding: 25,

    backgroundColor: '#FFFFFF',

    borderRadius: 13,

    alignItems: 'center',

  },

  errorText: {

    fontSize: 11,

    color: '#666666',

    textAlign: 'center',

    marginTop: 8,

  },

  retryButton: {

    marginTop: 15,

    backgroundColor: '#004B0A',

    paddingHorizontal: 18,

    paddingVertical: 10,

    borderRadius: 8,

  },

  retryButtonText: {

    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '600',

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
