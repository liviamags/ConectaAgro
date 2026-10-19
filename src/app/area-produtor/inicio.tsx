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
  Image,
  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from 'react-native';

import { useNotificacoes } from '../../context/NotificacoesContext';
import { supabase } from '../../lib/supabase';

type PedidoRecente = {

  id: string;

  cliente: string;

  status: string;

  total: number;

  itens: {

    nome: string;

    quantidade: number;

    unidade: string;

    precoUnitario: number;

  }[];

};

export default function InicioProdutorScreen() {
const { quantidadeNaoLidasProdutor } =

    useNotificacoes();

  const [nomeProdutor, setNomeProdutor] =

    useState('');

  const [nomeFazenda, setNomeFazenda] =

    useState('');

  const [cidade, setCidade] =

    useState('');

  const [estado, setEstado] =

    useState('');

  const [imagemUrl, setImagemUrl] = useState('');

  const [

    quantidadePublicacoes,

    setQuantidadePublicacoes,

  ] = useState(0);

  const [

    quantidadeProdutosAtivos,

    setQuantidadeProdutosAtivos,

  ] = useState(0);

  const [quantidadeExcedentesAtivos, setQuantidadeExcedentesAtivos] = useState(0);

  const [pedidosRecentes, setPedidosRecentes] =

    useState<PedidoRecente[]>([]);

  const [quantidadePedidosNovos, setQuantidadePedidosNovos] =

    useState(0);

  useFocusEffect(

    useCallback(() => {

      carregarDadosProdutor();

    }, [])

  );

  async function carregarDadosProdutor() {

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

        return;

      }

      if (!user) {

        console.log(

          'Nenhum usuário autenticado.'

        );

        return;

      }

      const [

        perfilResponse,

        produtorResponse,

        publicacoesResponse,

        produtosAtivosResponse,

        excedentesAtivosResponse,

      ] = await Promise.all([

        supabase

          .from('profiles')

          .select('nome')

          .eq('id', user.id)

          .single(),

        supabase

          .from('produtores')

          .select(

            'nome_fazenda, cidade, estado, imagem_url'

          )

          .eq('id', user.id)

          .single(),

        supabase

          .from('publicacoes')

          .select('*', {

            count: 'exact',

            head: true,

          })

          .eq(

            'produtor_id',

            user.id

          ),

        supabase

          .from('produtos')

          .select('*', {

            count: 'exact',

            head: true,

          })

          .eq(

            'produtor_id',

            user.id

          )

          .eq('ativo', true),

        supabase

          .from('excedentes')

          .select('*', { count: 'exact', head: true })

          .eq('produtor_id', user.id)

          .eq('ativo', true),

      ]);

      if (perfilResponse.error) {

        console.log(

          'Erro ao buscar perfil:',

          perfilResponse.error

        );

      }

      if (

        perfilResponse.data?.nome

      ) {

        const primeiroNome =

          perfilResponse.data.nome

            .trim()

            .split(' ')[0];

        setNomeProdutor(

          primeiroNome

        );

      }

      if (produtorResponse.error) {

        console.log(

          'Erro ao buscar produtor:',

          produtorResponse.error

        );

      } else if (

        produtorResponse.data

      ) {

        setNomeFazenda(

          produtorResponse.data

            .nome_fazenda ?? ''

        );

        setCidade(

          produtorResponse.data

            .cidade ?? ''

        );

        setEstado(

          produtorResponse.data

            .estado ?? ''

        );

        setImagemUrl(produtorResponse.data.imagem_url ?? '');

      }

      if (

        publicacoesResponse.error

      ) {

        console.log(

          'Erro ao contar publicações:',

          publicacoesResponse.error

        );

      } else {

        setQuantidadePublicacoes(

          publicacoesResponse.count ??

            0

        );

      }

      if (

        produtosAtivosResponse.error

      ) {

        console.log(

          'Erro ao contar produtos ativos:',

          produtosAtivosResponse.error

        );

      } else {

        setQuantidadeProdutosAtivos(

          produtosAtivosResponse.count ??

            0

        );

      }

      if (excedentesAtivosResponse.error) {

        console.log('Erro ao contar excedentes ativos:', excedentesAtivosResponse.error);

      } else {

        setQuantidadeExcedentesAtivos(excedentesAtivosResponse.count ?? 0);

      }

      await carregarPedidosDoProdutor(user.id);

    } catch (error) {

      console.log(

        'Erro inesperado ao carregar produtor:',

        error

      );

    }

  }

  async function carregarPedidosDoProdutor(produtorId: string) {

    try {

      const { data: produtosDoProdutor, error: produtosError } =

        await supabase

          .from('produtos')

          .select('id, nome, unidade')

          .eq('produtor_id', produtorId);

      if (produtosError) throw produtosError;

      if (!produtosDoProdutor || produtosDoProdutor.length === 0) {

        setPedidosRecentes([]);

        setQuantidadePedidosNovos(0);

        return;

      }

      const produtosPorId = new Map(

        produtosDoProdutor.map((produto) => [

          produto.id,

          {

            nome: produto.nome,

            unidade: produto.unidade ?? 'unidade',

          },

        ])

      );

      const idsProdutos = produtosDoProdutor.map((produto) => produto.id);

      const { data: itens, error: itensError } = await supabase

        .from('pedido_itens')

        .select('pedido_id, produto_id, quantidade, preco_unitario')

        .in('produto_id', idsProdutos);

      if (itensError) throw itensError;

      if (!itens || itens.length === 0) {

        setPedidosRecentes([]);

        setQuantidadePedidosNovos(0);

        return;

      }

      const idsPedidos = [...new Set(itens.map((item) => item.pedido_id))];

      const { data: pedidosBanco, error: pedidosError } = await supabase

        .from('pedidos')

        .select('id, comprador_id, status, created_at')

        .in('id', idsPedidos)

        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;

      if (!pedidosBanco || pedidosBanco.length === 0) {

        setPedidosRecentes([]);

        setQuantidadePedidosNovos(0);

        return;

      }

      const idsCompradores = [

        ...new Set(

          pedidosBanco

            .map((pedido) => pedido.comprador_id)

            .filter((id): id is string => Boolean(id))

        ),

      ];

      let nomesCompradores = new Map<string, string>();

      if (idsCompradores.length > 0) {

        const { data: perfis, error: perfisError } = await supabase

          .from('profiles')

          .select('id, nome')

          .in('id', idsCompradores);

        if (!perfisError) {

          nomesCompradores = new Map(

            (perfis ?? []).map((perfil) => [

              perfil.id,

              perfil.nome || 'Cliente',

            ])

          );

        }

      }

      const itensPorPedido = new Map<string, PedidoRecente['itens']>();

      for (const item of itens) {

        const produto = produtosPorId.get(item.produto_id);

        if (!produto) continue;

        const lista = itensPorPedido.get(item.pedido_id) ?? [];

        lista.push({

          nome: produto.nome,

          quantidade: Number(item.quantidade ?? 0),

          unidade: produto.unidade,

          precoUnitario: Number(item.preco_unitario ?? 0),

        });

        itensPorPedido.set(item.pedido_id, lista);

      }

      const pedidosFormatados: PedidoRecente[] = pedidosBanco

        .map((pedido) => {

          const itensDoProdutor = itensPorPedido.get(pedido.id) ?? [];

          return {

            id: pedido.id,

            cliente:

              nomesCompradores.get(pedido.comprador_id) ?? 'Cliente',

            status: pedido.status || 'Novo',

            total: itensDoProdutor.reduce(

              (soma, item) =>

                soma + item.quantidade * item.precoUnitario,

              0

            ),

            itens: itensDoProdutor,

          };

        })

        .filter((pedido) => pedido.itens.length > 0);

      setQuantidadePedidosNovos(

        pedidosFormatados.filter(

          (pedido) => pedido.status.trim().toLowerCase() === 'novo'

        ).length

      );

      setPedidosRecentes(pedidosFormatados.slice(0, 3));

    } catch (error) {

      console.log('Erro ao carregar pedidos:', error);

      setPedidosRecentes([]);

      setQuantidadePedidosNovos(0);

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

  function formatarLocalizacao() {

    if (cidade && estado) {

      return `${cidade}, ${estado}`;

    }

    if (cidade) {

      return cidade;

    }

    if (estado) {

      return estado;

    }

    return 'Localização não informada';

  }

  return (

    <View

      style={styles.container}

    >

      <ScrollView

        showsVerticalScrollIndicator={

          false

        }

        contentContainerStyle={

          styles.scrollContent

        }

      >

        <View

          style={styles.header}

        >

          <View>

            <Text

              style={

                styles.welcomeText

              }

            >

              {nomeProdutor

                ? `Olá, ${nomeProdutor}!`

                : 'Olá!'}

            </Text>

            <Text

              style={

                styles.headerTitle

              }

            >

              Gerencie sua propriedade

            </Text>

          </View>

          <TouchableOpacity

            style={

              styles.notificationButton

            }

            onPress={() =>

              router.push(

                '/notificacoes?perfil=produtor'

              )

            }

          >

            <Ionicons

              name="notifications-outline"

              size={23}

              color="#004B0A"

            />

            {quantidadeNaoLidasProdutor >

              0 && (

              <View

                style={

                  styles.notificationBadge

                }

              >

                <Text

                  style={

                    styles.notificationBadgeText

                  }

                >

                  {

                    quantidadeNaoLidasProdutor

                  }

                </Text>

              </View>

            )}

          </TouchableOpacity>

        </View>

        <View

          style={

            styles.propertyCard

          }

        >

          <View

            style={

              styles.propertyIcon

            }

          >

            {imagemUrl ? (
              <Image
                source={{ uri: imagemUrl }}
                style={styles.propertyProfileImage}
              />
            ) : (
              <Ionicons
                name="leaf-outline"
                size={28}
                color="#004B0A"
              />
            )}

          </View>

          <View

            style={

              styles.propertyInfo

            }

          >

            <Text

              style={

                styles.propertyLabel

              }

            >

              Minha propriedade

            </Text>

            <Text

              style={

                styles.propertyName

              }

            >

              {nomeFazenda ||

                'Propriedade'}

            </Text>

            <View

              style={

                styles.locationRow

              }

            >

              <Ionicons

                name="location-outline"

                size={13}

                color="#666666"

              />

              <Text

                style={

                  styles.propertyLocation

                }

              >

                {formatarLocalizacao()}

              </Text>

            </View>

          </View>

          <TouchableOpacity

            style={

              styles.manageProfileButton

            }

            onPress={() =>

              router.push(

                '/area-produtor/perfil'

              )

            }

          >

            <Text

              style={

                styles.manageProfileText

              }

            >

              Gerenciar

            </Text>

          </TouchableOpacity>

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

            Resumo

          </Text>

        </View>

        <View

          style={

            styles.statsContainer

          }

        >

          <TouchableOpacity

            style={styles.statCard}

            onPress={() =>

              router.push(

                '/area-produtor/pedidos'

              )

            }

          >

            <View

              style={styles.statTop}

            >

              <View

                style={

                  styles.statIcon

                }

              >

                <Ionicons

                  name="receipt-outline"

                  size={22}

                  color="#004B0A"

                />

              </View>

              <Ionicons

                name="chevron-forward"

                size={16}

                color="#999999"

              />

            </View>

            <Text

              style={

                styles.statNumber

              }

            >

              {quantidadePedidosNovos}

            </Text>

            <Text

              style={

                styles.statLabel

              }

            >

              Pedidos novos

            </Text>

          </TouchableOpacity>

          <TouchableOpacity

            style={styles.statCard}

            onPress={() =>

              router.push(

                '/area-produtor/produtos'

              )

            }

          >

            <View

              style={styles.statTop}

            >

              <View

                style={

                  styles.statIcon

                }

              >

                <Ionicons

                  name="basket-outline"

                  size={22}

                  color="#004B0A"

                />

              </View>

              <Ionicons

                name="chevron-forward"

                size={16}

                color="#999999"

              />

            </View>

            <Text

              style={

                styles.statNumber

              }

            >

              {quantidadeProdutosAtivos}

            </Text>

            <Text

              style={

                styles.statLabel

              }

            >

              Produtos ativos

            </Text>

          </TouchableOpacity>

          <TouchableOpacity

            style={styles.statCard}

            onPress={() =>

              router.push(

                '/area-produtor/excedentes'

              )

            }

          >

            <View

              style={styles.statTop}

            >

              <View

                style={

                  styles.statIcon

                }

              >

                <Ionicons

                  name="leaf-outline"

                  size={22}

                  color="#004B0A"

                />

              </View>

              <Ionicons

                name="chevron-forward"

                size={16}

                color="#999999"

              />

            </View>

            <Text

              style={

                styles.statNumber

              }

            >

              {quantidadeExcedentesAtivos}

            </Text>

            <Text

              style={

                styles.statLabel

              }

            >

              Excedentes ativos

            </Text>

          </TouchableOpacity>

          <TouchableOpacity

            style={styles.statCard}

            onPress={() =>

              router.push(

                '/area-produtor/publicacoes'

              )

            }

          >

            <View

              style={styles.statTop}

            >

              <View

                style={

                  styles.statIcon

                }

              >

                <Ionicons

                  name="newspaper-outline"

                  size={22}

                  color="#004B0A"

                />

              </View>

              <Ionicons

                name="chevron-forward"

                size={16}

                color="#999999"

              />

            </View>

            <Text

              style={

                styles.statNumber

              }

            >

              {quantidadePublicacoes}

            </Text>

            <Text

              style={

                styles.statLabel

              }

            >

              Publicações

            </Text>

          </TouchableOpacity>

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

            Acesso rápido

          </Text>

        </View>

        <View

          style={

            styles.shortcutsContainer

          }

        >

          <TouchableOpacity

            style={

              styles.shortcutItem

            }

            onPress={() =>

              router.push(

                '/area-produtor/adicionar-produto'

              )

            }

          >

            <View

              style={

                styles.shortcutIcon

              }

            >

              <Ionicons

                name="add-circle-outline"

                size={25}

                color="#004B0A"

              />

            </View>

            <Text

              style={

                styles.shortcutText

              }

            >

              Adicionar produto

            </Text>

          </TouchableOpacity>

          <TouchableOpacity

            style={

              styles.shortcutItem

            }

            onPress={() =>

              router.push(

                '/area-produtor/adicionar-excedente'

              )

            }

          >

            <View

              style={

                styles.shortcutIcon

              }

            >

              <Ionicons

                name="leaf-outline"

                size={25}

                color="#004B0A"

              />

            </View>

            <Text

              style={

                styles.shortcutText

              }

            >

              Novo excedente

            </Text>

          </TouchableOpacity>

          <TouchableOpacity

            style={

              styles.shortcutItem

            }

            onPress={() =>

              router.push(

                '/area-produtor/nova-publicacao'

              )

            }

          >

            <View

              style={

                styles.shortcutIcon

              }

            >

              <Ionicons

                name="create-outline"

                size={25}

                color="#004B0A"

              />

            </View>

            <Text

              style={

                styles.shortcutText

              }

            >

              Nova publicação

            </Text>

          </TouchableOpacity>

          <TouchableOpacity

            style={

              styles.shortcutItem

            }

            onPress={() =>

              router.push(

                '/area-produtor/perfil'

              )

            }

          >

            <View

              style={

                styles.shortcutIcon

              }

            >

              <Ionicons

                name="person-outline"

                size={25}

                color="#004B0A"

              />

            </View>

            <Text

              style={

                styles.shortcutText

              }

            >

              Meu perfil

            </Text>

          </TouchableOpacity>

        </View>

        <View

          style={styles.tipCard}

        >

          <View

            style={styles.tipIcon}

          >

            <Ionicons

              name="bulb-outline"

              size={25}

              color="#004B0A"

            />

          </View>

          <View

            style={

              styles.tipContent

            }

          >

            <Text

              style={

                styles.tipTitle

              }

            >

              Aproveite seus excedentes

            </Text>

            <Text

              style={

                styles.tipText

              }

            >

              Produtos que sobrariam

              podem virar ofertas

              especiais, ajudando a

              reduzir desperdícios e

              gerar novas vendas.

            </Text>

          </View>

        </View>

        <View

          style={

            styles.sectionHeaderWithAction

          }

        >

          <Text

            style={

              styles.sectionTitle

            }

          >

            Pedidos recentes

          </Text>

          <TouchableOpacity

            onPress={() =>

              router.push(

                '/area-produtor/pedidos'

              )

            }

          >

            <Text

              style={

                styles.seeAllText

              }

            >

              Ver todos

            </Text>

          </TouchableOpacity>

        </View>

        <View

          style={

            styles.ordersContainer

          }

        >

          {pedidosRecentes.map(

            (pedido) => (

              <TouchableOpacity

                key={pedido.id}

                style={

                  styles.orderCard

                }

                onPress={() =>

                  router.push({

                    pathname:

                      '/area-produtor/pedido/[id]',

                    params: {

                      id: pedido.id,

                    },

                  })

                }

              >

                <View

                  style={

                    styles.orderIcon

                  }

                >

                  <Ionicons

                    name="bag-handle-outline"

                    size={22}

                    color="#004B0A"

                  />

                </View>

                <View

                  style={

                    styles.orderInfo

                  }

                >

                  <View

                    style={

                      styles.orderTop

                    }

                  >

                    <Text

                      style={

                        styles.customerName

                      }

                    >

                      {

                        pedido.cliente

                      }

                    </Text>

                    <View

                      style={

                        styles.statusBadge

                      }

                    >

                      <Text

                        style={

                          styles.statusText

                        }

                      >

                        {

                          pedido.status

                        }

                      </Text>

                    </View>

                  </View>

                  <Text

                    style={

                      styles.orderItems

                    }

                  >

                    {pedido.itens

                      .map(

                        (

                          item

                        ) =>

                          `${item.quantidade} ${item.unidade} de ${item.nome}`

                      )

                      .join(' • ')}

                  </Text>

                  <Text

                    style={

                      styles.orderPrice

                    }

                  >

                    {formatarPreco(

                      pedido.total

                    )}

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

        <View

          style={

            styles.sectionHeaderWithAction

          }

        >

          <Text

            style={

              styles.sectionTitle

            }

          >

            Meus produtos

          </Text>

          <TouchableOpacity

            onPress={() =>

              router.push(

                '/area-produtor/produtos'

              )

            }

          >

            <Text

              style={

                styles.seeAllText

              }

            >

              Gerenciar

            </Text>

          </TouchableOpacity>

        </View>

        <TouchableOpacity

          style={

            styles.productsSummary

          }

          onPress={() =>

            router.push(

              '/area-produtor/produtos'

            )

          }

        >

          <View

            style={

              styles.productsSummaryIcon

            }

          >

            <Ionicons

              name="basket-outline"

              size={27}

              color="#004B0A"

            />

          </View>

          <View

            style={

              styles.productsSummaryInfo

            }

          >

            <Text

              style={

                styles.productsSummaryTitle

              }

            >

              {quantidadeProdutosAtivos}{' '}

              {quantidadeProdutosAtivos ===

              1

                ? 'produto ativo'

                : 'produtos ativos'}

            </Text>

            <Text

              style={

                styles.productsSummaryText

              }

            >

              {quantidadeProdutosAtivos === 0
                ? 'Você ainda não possui produtos ativos.'
                : 'Gerencie estoque, preços e disponibilidade.'}

            </Text>

          </View>

          <Ionicons

            name="chevron-forward"

            size={20}

            color="#777777"

          />

        </TouchableOpacity>

      </ScrollView>

      <View

        style={

          styles.bottomNavigation

        }

      >

        <TouchableOpacity

          style={styles.navItem}

        >

          <Ionicons

            name="home"

            size={23}

            color="#004B0A"

          />

          <Text

            style={

              styles.navTextActive

            }

          >

            Início

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.navItem}

          onPress={() =>

            router.push(

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

      backgroundColor: '#FFFFFF',

    },

    scrollContent: {

      paddingTop: 20,

      paddingBottom: 110,

    },

    header: {

      flexDirection: 'row',

      justifyContent:

        'space-between',

      alignItems: 'center',

      paddingHorizontal: 18,

    },

    welcomeText: {

      fontSize: 12,

      color: '#666666',

    },

    headerTitle: {

      fontSize: 20,

      fontWeight: 'bold',

      marginTop: 3,

    },

    notificationButton: {

      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor: '#F0F6F1',

      alignItems: 'center',

      justifyContent: 'center',

      position: 'relative',

    },

    notificationBadge: {

      position: 'absolute',

      top: -3,

      right: -3,

      minWidth: 18,

      height: 18,

      borderRadius: 9,

      paddingHorizontal: 4,

      backgroundColor: '#D92D20',

      alignItems: 'center',

      justifyContent: 'center',

      borderWidth: 2,

      borderColor: '#FFFFFF',

    },

    notificationBadgeText: {

      fontSize: 8,

      fontWeight: 'bold',

      color: '#FFFFFF',

    },

    propertyCard: {

      marginHorizontal: 18,

      marginTop: 20,

      padding: 15,

      borderRadius: 14,

      backgroundColor: '#F0F6F1',

      flexDirection: 'row',

      alignItems: 'center',

    },

    propertyIcon: {

      width: 52,

      height: 52,

      borderRadius: 26,

      backgroundColor: '#FFFFFF',

      alignItems: 'center',

      justifyContent: 'center',

    },

    propertyProfileImage: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },

    propertyInfo: {

      flex: 1,

      marginLeft: 12,

    },

    propertyLabel: {

      fontSize: 9,

      color: '#777777',

    },

    propertyName: {

      fontSize: 15,

      fontWeight: 'bold',

      color: '#004B0A',

      marginTop: 2,

    },

    locationRow: {

      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 4,

    },

    propertyLocation: {

      fontSize: 10,

      color: '#666666',

      marginLeft: 3,

    },

    manageProfileButton: {

      paddingHorizontal: 11,

      paddingVertical: 8,

      borderRadius: 8,

      backgroundColor: '#FFFFFF',

    },

    manageProfileText: {

      fontSize: 10,

      color: '#004B0A',

      fontWeight: '600',

    },

    sectionHeader: {

      paddingHorizontal: 18,

      marginTop: 26,

      marginBottom: 13,

    },

    sectionHeaderWithAction: {

      flexDirection: 'row',

      justifyContent:

        'space-between',

      alignItems: 'center',

      paddingHorizontal: 18,

      marginTop: 28,

      marginBottom: 13,

    },

    sectionTitle: {

      fontSize: 18,

      fontWeight: 'bold',

    },

    seeAllText: {

      fontSize: 12,

      color: '#004B0A',

      fontWeight: '600',

    },

    statsContainer: {

      paddingHorizontal: 18,

      flexDirection: 'row',

      flexWrap: 'wrap',

      justifyContent:

        'space-between',

      rowGap: 10,

    },

    statCard: {

      width: '48.5%',

      minHeight: 115,

      borderRadius: 13,

      padding: 13,

      backgroundColor: '#F7F9F7',

      borderWidth: 1,

      borderColor: '#EDF0ED',

    },

    statTop: {

      flexDirection: 'row',

      justifyContent:

        'space-between',

      alignItems: 'center',

    },

    statIcon: {

      width: 37,

      height: 37,

      borderRadius: 10,

      backgroundColor: '#EAF3EB',

      alignItems: 'center',

      justifyContent: 'center',

    },

    statNumber: {

      fontSize: 21,

      fontWeight: 'bold',

      color: '#004B0A',

      marginTop: 9,

    },

    statLabel: {

      fontSize: 10,

      color: '#666666',

      marginTop: 2,

    },

    shortcutsContainer: {

      flexDirection: 'row',

      justifyContent:

        'space-between',

      paddingHorizontal: 18,

    },

    shortcutItem: {

      width: '23%',

      alignItems: 'center',

    },

    shortcutIcon: {

      width: 53,

      height: 53,

      borderRadius: 15,

      backgroundColor: '#F0F6F1',

      alignItems: 'center',

      justifyContent: 'center',

    },

    shortcutText: {

      fontSize: 9,

      marginTop: 7,

      textAlign: 'center',

      lineHeight: 12,

    },

    tipCard: {

      marginHorizontal: 18,

      marginTop: 24,

      padding: 15,

      borderRadius: 14,

      backgroundColor: '#EAF3EB',

      flexDirection: 'row',

      alignItems: 'center',

    },

    tipIcon: {

      width: 47,

      height: 47,

      borderRadius: 24,

      backgroundColor: '#FFFFFF',

      alignItems: 'center',

      justifyContent: 'center',

    },

    tipContent: {

      flex: 1,

      marginLeft: 12,

    },

    tipTitle: {

      fontSize: 13,

      fontWeight: 'bold',

      color: '#004B0A',

    },

    tipText: {

      fontSize: 10,

      color: '#555555',

      lineHeight: 15,

      marginTop: 4,

    },

    ordersContainer: {

      marginHorizontal: 18,

    },

    orderCard: {

      minHeight: 82,

      paddingVertical: 13,

      borderBottomWidth: 1,

      borderBottomColor: '#EEEEEE',

      flexDirection: 'row',

      alignItems: 'center',

    },

    orderIcon: {

      width: 43,

      height: 43,

      borderRadius: 12,

      backgroundColor: '#F0F6F1',

      alignItems: 'center',

      justifyContent: 'center',

    },

    orderInfo: {

      flex: 1,

      marginLeft: 11,

    },

    orderTop: {

      flexDirection: 'row',

      alignItems: 'center',

    },

    customerName: {

      fontSize: 12,

      fontWeight: 'bold',

      flexShrink: 1,

    },

    statusBadge: {

      marginLeft: 7,

      paddingHorizontal: 7,

      paddingVertical: 3,

      borderRadius: 8,

      backgroundColor: '#EAF3EB',

    },

    statusText: {

      fontSize: 8,

      fontWeight: '600',

      color: '#444444',

    },

    orderItems: {

      fontSize: 10,

      color: '#777777',

      marginTop: 4,

    },

    orderPrice: {

      fontSize: 11,

      color: '#004B0A',

      fontWeight: 'bold',

      marginTop: 3,

    },

    productsSummary: {

      marginHorizontal: 18,

      padding: 15,

      borderRadius: 13,

      backgroundColor: '#F7F9F7',

      flexDirection: 'row',

      alignItems: 'center',

    },

    productsSummaryIcon: {

      width: 48,

      height: 48,

      borderRadius: 13,

      backgroundColor: '#EAF3EB',

      alignItems: 'center',

      justifyContent: 'center',

    },

    productsSummaryInfo: {

      flex: 1,

      marginLeft: 12,

    },

    productsSummaryTitle: {

      fontSize: 13,

      fontWeight: 'bold',

    },

    productsSummaryText: {

      fontSize: 9,

      color: '#777777',

      marginTop: 4,

      lineHeight: 13,

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

      backgroundColor: '#004B0A',

      alignItems: 'center',

      justifyContent: 'center',

      marginTop: -12,

    },

  });
