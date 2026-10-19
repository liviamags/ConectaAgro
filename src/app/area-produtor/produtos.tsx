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

  Alert,

  Image,

  RefreshControl,

  ScrollView,

  StyleSheet,

  Switch,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type Produto = {

  id: string;

  produtor_id: string;

  nome: string;

  descricao: string | null;

  categoria: string | null;

  preco: number;

  unidade: string | null;

  estoque: number | null;

  imagem_url: string | null;

  ativo: boolean | null;

  created_at: string | null;

};

export default function ProdutosProdutorScreen() {

  const [produtos, setProdutos] =

    useState<Produto[]>([]);

  const [busca, setBusca] =

    useState('');

  const [carregando, setCarregando] =

    useState(true);

  const [atualizando, setAtualizando] =

    useState(false);

  const [

    alterandoProdutoId,

    setAlterandoProdutoId,

  ] = useState<string | null>(null);

  const [

    excluindoProdutoId,

    setExcluindoProdutoId,

  ] = useState<string | null>(null);

  useFocusEffect(

    useCallback(() => {

      carregarProdutos();

    }, [])

  );

  async function carregarProdutos(

    modoAtualizacao = false

  ) {

    if (modoAtualizacao) {

      setAtualizando(true);

    } else {

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

      const {

        data,

        error,

      } = await supabase

        .from('produtos')

        .select(

          'id, produtor_id, nome, descricao, categoria, preco, unidade, estoque, imagem_url, ativo, created_at'

        )

        .eq('produtor_id', user.id)

        .order('created_at', {

          ascending: false,

        });

      if (error) {

        console.log(

          'Erro ao carregar produtos:',

          error

        );

        Alert.alert(

          'Erro',

          'Não foi possível carregar seus produtos.'

        );

        return;

      }

      const produtosConvertidos: Produto[] =

        (data ?? []).map(

          (produto) => ({

            ...produto,

            preco: Number(

              produto.preco ?? 0

            ),

            estoque:

              produto.estoque === null

                ? null

                : Number(

                    produto.estoque

                  ),

          })

        );

      setProdutos(

        produtosConvertidos

      );

    } catch (error) {

      console.log(

        'Erro inesperado ao carregar produtos:',

        error

      );

      Alert.alert(

        'Erro',

        'Ocorreu um erro ao carregar seus produtos.'

      );

    } finally {

      setCarregando(false);

      setAtualizando(false);

    }

  }

  const produtosAtivos =

    produtos.filter(

      (produto) =>

        produto.ativo === true

    );

  const produtosFiltrados =

    produtos.filter(

      (produto) => {

        const termo =

          busca

            .trim()

            .toLowerCase();

        if (!termo) {

          return true;

        }

        const nome =

          produto.nome

            ?.toLowerCase() ??

          '';

        const categoria =

          produto.categoria

            ?.toLowerCase() ??

          '';

        return (

          nome.includes(termo) ||

          categoria.includes(termo)

        );

      }

    );

  function confirmarExclusao(

    produto: Produto

  ) {

    if (

      excluindoProdutoId ||

      alterandoProdutoId

    ) {

      return;

    }

    Alert.alert(

      'Excluir produto',

      `Deseja realmente excluir "${produto.nome}"?`,

      [

        {

          text: 'Cancelar',

          style: 'cancel',

        },

        {

          text: 'Excluir',

          style: 'destructive',

          onPress: () =>

            excluirProduto(

              produto

            ),

        },

      ]

    );

  }

  async function excluirProduto(

    produto: Produto

  ) {

    if (excluindoProdutoId) {

      return;

    }

    setExcluindoProdutoId(

      produto.id

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

        throw new Error(

          'Sua sessão não foi encontrada.'

        );

      }

      if (

        produto.produtor_id !==

        user.id

      ) {

        throw new Error(

          'Este produto não pertence à sua conta.'

        );

      }

      const {

        error: deleteError,

      } = await supabase

        .from('produtos')

        .delete()

        .eq('id', produto.id)

        .eq(

          'produtor_id',

          user.id

        );

      if (deleteError) {

        console.log(

          'Erro ao excluir produto:',

          deleteError

        );

        throw new Error(

          `Não foi possível excluir o produto: ${deleteError.message}`

        );

      }

      if (produto.imagem_url) {

        const caminho =

          obterCaminhoStorage(

            produto.imagem_url

          );

        if (caminho) {

          const {

            error:

              storageError,

          } =

            await supabase.storage

              .from('produtos')

              .remove([

                caminho,

              ]);

          if (storageError) {

            console.log(

              'Produto excluído, mas ocorreu um erro ao remover sua foto:',

              storageError

            );

          }

        }

      }

      setProdutos(

        (listaAtual) =>

          listaAtual.filter(

            (item) =>

              item.id !==

              produto.id

          )

      );

      Alert.alert(

        'Produto excluído',

        'O produto foi excluído com sucesso.'

      );

    } catch (error) {

      console.log(

        'Erro ao excluir produto:',

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

      setExcluindoProdutoId(

        null

      );

    }

  }

  async function alternarProdutoAtivo(

    produto: Produto,

    novoValor: boolean

  ) {

    if (

      alterandoProdutoId ||

      excluindoProdutoId

    ) {

      return;

    }

    const valorAnterior =

      produto.ativo === true;

    setAlterandoProdutoId(

      produto.id

    );

    setProdutos(

      (listaAtual) =>

        listaAtual.map(

          (item) =>

            item.id ===

            produto.id

              ? {

                  ...item,

                  ativo:

                    novoValor,

                }

              : item

        )

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

        throw new Error(

          'Sua sessão não foi encontrada.'

        );

      }

      if (

        produto.produtor_id !==

        user.id

      ) {

        throw new Error(

          'Este produto não pertence à sua conta.'

        );

      }

      const {

        error: updateError,

      } = await supabase

        .from('produtos')

        .update({

          ativo: novoValor,

        })

        .eq('id', produto.id)

        .eq(

          'produtor_id',

          user.id

        );

      if (updateError) {

        console.log(

          'Erro ao alterar disponibilidade:',

          updateError

        );

        throw new Error(

          `Não foi possível alterar a disponibilidade: ${updateError.message}`

        );

      }

    } catch (error) {

      setProdutos(

        (listaAtual) =>

          listaAtual.map(

            (item) =>

              item.id ===

              produto.id

                ? {

                    ...item,

                    ativo:

                      valorAnterior,

                  }

                : item

          )

      );

      console.log(

        'Erro ao alterar produto:',

        error

      );

      const mensagem =

        error instanceof Error

          ? error.message

          : 'Ocorreu um erro desconhecido.';

      Alert.alert(

        'Não foi possível alterar',

        mensagem

      );

    } finally {

      setAlterandoProdutoId(

        null

      );

    }

  }

  function obterCaminhoStorage(

    imagemUrl: string | null

  ) {

    if (!imagemUrl) {

      return null;

    }

    try {

      const marcador =

        '/storage/v1/object/public/produtos/';

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

  function formatarEstoque(

    valor: number | null

  ) {

    if (valor === null) {

      return '0';

    }

    return valor.toLocaleString(

      'pt-BR',

      {

        maximumFractionDigits: 2,

      }

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

          Carregando produtos...

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

            router.replace(

              '/area-produtor/inicio'

            )

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

            styles.headerTexts

          }

        >

          <Text

            style={

              styles.headerTitle

            }

          >

            Meus produtos

          </Text>

          <Text

            style={

              styles.headerSubtitle

            }

          >

            Gerencie sua produção

          </Text>

        </View>

        <TouchableOpacity

          style={

            styles.addHeaderButton

          }

          onPress={() =>

            router.push(

              '/area-produtor/adicionar-produto'

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

            onRefresh={() =>

              carregarProdutos(

                true

              )

            }

            colors={[

              '#004B0A',

            ]}

            tintColor="#004B0A"

          />

        }

      >

        <View

          style={

            styles.summaryContainer

          }

        >

          <View

            style={

              styles.summaryCard

            }

          >

            <Text

              style={

                styles.summaryNumber

              }

            >

              {produtos.length}

            </Text>

            <Text

              style={

                styles.summaryLabel

              }

            >

              Cadastrados

            </Text>

          </View>

          <View

            style={

              styles.summaryCard

            }

          >

            <Text

              style={

                styles.summaryNumber

              }

            >

              {produtosAtivos.length}

            </Text>

            <Text

              style={

                styles.summaryLabel

              }

            >

              Ativos

            </Text>

          </View>

          <View

            style={

              styles.summaryCard

            }

          >

            <Text

              style={

                styles.summaryNumber

              }

            >

              {produtos.length -

                produtosAtivos.length}

            </Text>

            <Text

              style={

                styles.summaryLabel

              }

            >

              Inativos

            </Text>

          </View>

        </View>

        <TouchableOpacity

          style={

            styles.addProductButton

          }

          onPress={() =>

            router.push(

              '/area-produtor/adicionar-produto'

            )

          }

        >

          <Ionicons

            name="add-circle-outline"

            size={22}

            color="#FFFFFF"

          />

          <Text

            style={

              styles.addProductText

            }

          >

            Adicionar novo produto

          </Text>

        </TouchableOpacity>

        <View

          style={

            styles.searchContainer

          }

        >

          <Ionicons

            name="search-outline"

            size={20}

            color="#666666"

          />

          <TextInput

            style={

              styles.searchInput

            }

            value={busca}

            onChangeText={setBusca}

            placeholder="Buscar nos meus produtos..."

            placeholderTextColor="#888888"

          />

          {busca.length > 0 && (

            <TouchableOpacity

              onPress={() =>

                setBusca('')

              }

            >

              <Ionicons

                name="close-circle"

                size={19}

                color="#999999"

              />

            </TouchableOpacity>

          )}

        </View>

        <View

          style={

            styles.sectionHeader

          }

        >

          <Text

            style={

              styles.sectionTitle

            }

          >

            Produtos

          </Text>

          <Text

            style={

              styles.resultText

            }

          >

            {

              produtosFiltrados.length

            }{' '}

            {produtosFiltrados.length ===

            1

              ? 'produto'

              : 'produtos'}

          </Text>

        </View>

        {produtosFiltrados.length ===

        0 ? (

          <View

            style={

              styles.emptyContainer

            }

          >

            <Ionicons

              name="basket-outline"

              size={52}

              color="#A7B8A9"

            />

            <Text

              style={

                styles.emptyTitle

              }

            >

              Nenhum produto encontrado

            </Text>

            <Text

              style={

                styles.emptyText

              }

            >

              {busca.trim()

                ? 'Nenhum produto corresponde à sua busca.'

                : 'Cadastre um novo produto para começar a disponibilizá-lo aos consumidores.'}

            </Text>

            {!busca.trim() && (

              <TouchableOpacity

                style={

                  styles.emptyButton

                }

                onPress={() =>

                  router.push(

                    '/area-produtor/adicionar-produto'

                  )

                }

              >

                <Text

                  style={

                    styles.emptyButtonText

                  }

                >

                  Cadastrar produto

                </Text>

              </TouchableOpacity>

            )}

          </View>

        ) : (

          produtosFiltrados.map(

            (produto) => (

              <View

                key={produto.id}

                style={

                  styles.productCard

                }

              >

                {produto.imagem_url ? (

                  <Image

                    source={{

                      uri:

                        produto.imagem_url,

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

                      name="image-outline"

                      size={30}

                      color="#A7B8A9"

                    />

                  </View>

                )}

                <View

                  style={

                    styles.productContent

                  }

                >

                  <View

                    style={

                      styles.productTop

                    }

                  >

                    <View

                      style={

                        styles.productTitleArea

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

                          styles.productCategory

                        }

                      >

                        {produto.categoria ||

                          'Sem categoria'}

                      </Text>

                    </View>

                    <View

                      style={[

                        styles.statusBadge,

                        produto.ativo

                          ? styles.activeBadge

                          : styles.inactiveBadge,

                      ]}

                    >

                      <Text

                        style={[

                          styles.statusText,

                          produto.ativo

                            ? styles.activeText

                            : styles.inactiveText,

                        ]}

                      >

                        {produto.ativo

                          ? 'Ativo'

                          : 'Inativo'}

                      </Text>

                    </View>

                  </View>

                  <Text

                    style={

                      styles.price

                    }

                  >

                    {formatarPreco(

                      produto.preco

                    )}{' '}

                    /{' '}

                    {produto.unidade ||

                      'Kg'}

                  </Text>

                  <View

                    style={

                      styles.stockRow

                    }

                  >

                    <Ionicons

                      name="cube-outline"

                      size={14}

                      color="#666666"

                    />

                    <Text

                      style={

                        styles.stockText

                      }

                    >

                      Estoque:{' '}

                      {formatarEstoque(

                        produto.estoque

                      )}{' '}

                      {produto.unidade ||

                        'Kg'}

                    </Text>

                  </View>

                  <View

                    style={

                      styles.availabilityRow

                    }

                  >

                    <View

                      style={

                        styles.availabilityInfo

                      }

                    >

                      <Text

                        style={

                          styles.availabilityTitle

                        }

                      >

                        Disponível para venda

                      </Text>

                      <Text

                        style={

                          styles.availabilitySubtitle

                        }

                      >

                        {produto.ativo

                          ? 'Visível para os consumidores'

                          : 'Produto oculto do catálogo'}

                      </Text>

                    </View>

                    {alterandoProdutoId ===

                    produto.id ? (

                      <ActivityIndicator

                        size="small"

                        color="#004B0A"

                      />

                    ) : (

                      <Switch

                        value={

                          produto.ativo ===

                          true

                        }

                        onValueChange={(

                          valor

                        ) =>

                          alternarProdutoAtivo(

                            produto,

                            valor

                          )

                        }

                        disabled={

                          excluindoProdutoId ===

                          produto.id

                        }

                        trackColor={{

                          false:

                            '#D3D3D3',

                          true:

                            '#8DBB94',

                        }}

                        thumbColor={

                          produto.ativo

                            ? '#004B0A'

                            : '#F4F4F4'

                        }

                      />

                    )}

                  </View>

                  <View

                    style={

                      styles.actions

                    }

                  >

                    <TouchableOpacity

                      style={

                        styles.editButton

                      }

                      onPress={() =>

                        router.push({

                          pathname:

                            '/area-produtor/editar-produto/[id]',

                          params: {

                            id:

                              produto.id,

                          },

                        })

                      }

                      disabled={

                        excluindoProdutoId ===

                          produto.id ||

                        alterandoProdutoId ===

                          produto.id

                      }

                    >

                      <Ionicons

                        name="create-outline"

                        size={17}

                        color="#004B0A"

                      />

                      <Text

                        style={

                          styles.editButtonText

                        }

                      >

                        Editar

                      </Text>

                    </TouchableOpacity>

                    <TouchableOpacity

                      style={

                        styles.deleteButton

                      }

                      onPress={() =>

                        confirmarExclusao(

                          produto

                        )

                      }

                      disabled={

                        excluindoProdutoId ===

                          produto.id ||

                        alterandoProdutoId ===

                          produto.id

                      }

                    >

                      {excluindoProdutoId ===

                      produto.id ? (

                        <ActivityIndicator

                          size="small"

                          color="#B42318"

                        />

                      ) : (

                        <>

                          <Ionicons

                            name="trash-outline"

                            size={17}

                            color="#B42318"

                          />

                          <Text

                            style={

                              styles.deleteButtonText

                            }

                          >

                            Excluir

                          </Text>

                        </>

                      )}

                    </TouchableOpacity>

                  </View>

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

        >

          <Ionicons

            name="basket"

            size={23}

            color="#004B0A"

          />

          <Text

            style={

              styles.navTextActive

            }

          >

            Produtos

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push(

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

              styles.publishNavButton

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

        '#F0F0F0',

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

    headerTexts: {

      flex: 1,

      marginLeft: 12,

    },

    headerTitle: {

      fontSize: 20,

      fontWeight: 'bold',

    },

    headerSubtitle: {

      fontSize: 10,

      color: '#777777',

      marginTop: 2,

    },

    addHeaderButton: {

      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor:

        '#004B0A',

      alignItems: 'center',

      justifyContent:

        'center',

    },

    content: {

      paddingHorizontal: 18,

      paddingTop: 18,

      paddingBottom: 110,

    },

    summaryContainer: {

      flexDirection: 'row',

      gap: 9,

    },

    summaryCard: {

      flex: 1,

      paddingVertical: 13,

      borderRadius: 12,

      backgroundColor:

        '#F0F6F1',

      alignItems: 'center',

    },

    summaryNumber: {

      fontSize: 21,

      fontWeight: 'bold',

      color: '#004B0A',

    },

    summaryLabel: {

      fontSize: 9,

      color: '#666666',

      marginTop: 2,

    },

    addProductButton: {

      marginTop: 18,

      height: 47,

      borderRadius: 9,

      backgroundColor:

        '#004B0A',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:

        'center',

      gap: 7,

    },

    addProductText: {

      color: '#FFFFFF',

      fontSize: 13,

      fontWeight: '600',

    },

    searchContainer: {

      height: 44,

      marginTop: 18,

      borderWidth: 1,

      borderColor: '#D7D7D7',

      borderRadius: 9,

      paddingHorizontal: 12,

      flexDirection: 'row',

      alignItems: 'center',

    },

    searchInput: {

      flex: 1,

      marginLeft: 8,

      fontSize: 12,

    },

    sectionHeader: {

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:

        'space-between',

      marginTop: 24,

      marginBottom: 12,

    },

    sectionTitle: {

      fontSize: 17,

      fontWeight: 'bold',

    },

    resultText: {

      fontSize: 10,

      color: '#777777',

    },

    productCard: {

      flexDirection: 'row',

      borderWidth: 1,

      borderColor: '#E6E6E6',

      borderRadius: 13,

      padding: 11,

      marginBottom: 12,

      backgroundColor:

        '#FFFFFF',

    },

    productImage: {

      width: 88,

      height: 108,

      borderRadius: 10,

    },

    productImagePlaceholder: {

      width: 88,

      height: 108,

      borderRadius: 10,

      backgroundColor:

        '#F0F6F1',

      alignItems: 'center',

      justifyContent:

        'center',

    },

    productContent: {

      flex: 1,

      marginLeft: 12,

    },

    productTop: {

      flexDirection: 'row',

      alignItems:

        'flex-start',

    },

    productTitleArea: {

      flex: 1,

    },

    productName: {

      fontSize: 14,

      fontWeight: 'bold',

    },

    productCategory: {

      fontSize: 9,

      color: '#777777',

      marginTop: 2,

    },

    statusBadge: {

      paddingHorizontal: 7,

      paddingVertical: 3,

      borderRadius: 8,

    },

    activeBadge: {

      backgroundColor:

        '#EAF3EB',

    },

    inactiveBadge: {

      backgroundColor:

        '#F2F2F2',

    },

    statusText: {

      fontSize: 8,

      fontWeight: '600',

    },

    activeText: {

      color: '#004B0A',

    },

    inactiveText: {

      color: '#777777',

    },

    price: {

      fontSize: 12,

      fontWeight: 'bold',

      color: '#004B0A',

      marginTop: 7,

    },

    stockRow: {

      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 5,

    },

    stockText: {

      fontSize: 9,

      color: '#666666',

      marginLeft: 4,

    },

    availabilityRow: {

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:

        'space-between',

      marginTop: 8,

    },

    availabilityInfo: {

      flex: 1,

      paddingRight: 6,

    },

    availabilityTitle: {

      fontSize: 9,

      fontWeight: '600',

    },

    availabilitySubtitle: {

      fontSize: 7,

      color: '#888888',

      marginTop: 1,

    },

    actions: {

      flexDirection: 'row',

      gap: 7,

      marginTop: 9,

    },

    editButton: {

      flex: 1,

      height: 32,

      borderRadius: 7,

      backgroundColor:

        '#F0F6F1',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:

        'center',

      gap: 4,

    },

    editButtonText: {

      fontSize: 9,

      fontWeight: '600',

      color: '#004B0A',

    },

    deleteButton: {

      flex: 1,

      height: 32,

      borderRadius: 7,

      backgroundColor:

        '#FFF1F0',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:

        'center',

      gap: 4,

    },

    deleteButtonText: {

      fontSize: 9,

      fontWeight: '600',

      color: '#B42318',

    },

    emptyContainer: {

      alignItems: 'center',

      paddingVertical: 55,

      paddingHorizontal: 30,

    },

    emptyTitle: {

      fontSize: 16,

      fontWeight: 'bold',

      marginTop: 14,

    },

    emptyText: {

      fontSize: 11,

      color: '#777777',

      textAlign: 'center',

      lineHeight: 16,

      marginTop: 7,

    },

    emptyButton: {

      marginTop: 17,

      backgroundColor:

        '#004B0A',

      paddingHorizontal: 18,

      paddingVertical: 10,

      borderRadius: 8,

    },

    emptyButtonText: {

      color: '#FFFFFF',

      fontSize: 11,

      fontWeight: '600',

    },

    bottomNavigation: {

      position: 'absolute',

      left: 0,

      right: 0,

      bottom: 0,

      height: 76,

      backgroundColor:

        '#FFFFFF',

      borderTopWidth: 1,

      borderTopColor:

        '#E5E5E5',

      flexDirection: 'row',

      alignItems: 'center',

    },

    navItem: {

      flex: 1,

      alignItems: 'center',

      justifyContent:

        'center',

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

    publishNavButton: {

      width: 38,

      height: 38,

      borderRadius: 19,

      backgroundColor:

        '#004B0A',

      alignItems: 'center',

      justifyContent:

        'center',

      marginTop: -12,

    },

  });