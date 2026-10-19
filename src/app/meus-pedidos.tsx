import { Ionicons } from '@expo/vector-icons';

import { router, useFocusEffect } from 'expo-router';

import { useCallback, useState } from 'react';



import {
  ActivityIndicator,

  RefreshControl,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from 'react-native';



import { supabase } from '../lib/supabase';



type Filtro = 'todos' | 'andamento' | 'concluidos';



type Pedido = {

  id: string;

  numero: string;

  status: string;

  data: string;

  produtor: string;

  resumoProdutos: string;

  valorTotal: number;

};



export default function MeusPedidosScreen() {

  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [filtro, setFiltro] = useState<Filtro>('todos');

  const [carregando, setCarregando] = useState(true);

  const [atualizando, setAtualizando] = useState(false);

  const [erro, setErro] = useState('');



  useFocusEffect(

    useCallback(() => {

      carregarPedidos();

    }, [])

  );



  function formatarPreco(valor: number) {

    return valor.toLocaleString('pt-BR', {

      style: 'currency',

      currency: 'BRL',

    });

  }



  function formatarStatus(status: string) {

    if (!status) {

      return 'Novo';

    }



    return status;

  }



  function descricaoStatus(status: string) {

    switch (status) {

      case 'Novo':

        return 'Aguardando confirmação do produtor';

      case 'Confirmado':

        return 'Pedido confirmado pelo produtor';

      case 'Em preparo':

        return 'Seu pedido está sendo preparado';

      case 'Pronto':

        return 'Seu pedido está pronto';

      case 'Concluído':

        return 'Pedido concluído';

      case 'Cancelado':

        return 'Pedido cancelado';

      default:

        return 'Acompanhe o andamento do pedido';

    }

  }



  function estiloStatus(status: string) {

    if (status === 'Concluído') {

      return {

        fundo: '#E7F1E8',

        texto: '#004B0A',

      };

    }



    if (status === 'Cancelado') {

      return {

        fundo: '#FFF1F0',

        texto: '#B42318',

      };

    }



    if (status === 'Pronto') {

      return {

        fundo: '#E7F1E8',

        texto: '#004B0A',

      };

    }



    return {

      fundo: '#FFF5D9',

      texto: '#8A6200',

    };

  }



  async function carregarPedidos(

    modoAtualizacao = false

  ) {

    try {

      if (modoAtualizacao) {

        setAtualizando(true);

      } else {

        setCarregando(true);

      }



      setErro('');



      const {

        data: usuarioData,

        error: usuarioError,

      } = await supabase.auth.getUser();



      if (

        usuarioError ||

        !usuarioData.user

      ) {

        setErro(

          'Não foi possível identificar sua conta.'

        );

        return;

      }



      const {

        data: pedidosData,

        error: pedidosError,

      } = await supabase

        .from('pedidos')

        .select(

          'id, status, valor_total, created_at'

        )

        .eq(

          'comprador_id',

          usuarioData.user.id

        )

        .order('created_at', {

          ascending: false,

        });



      if (pedidosError) {

        console.log(

          'Erro ao carregar pedidos:',

          pedidosError

        );



        setErro(

          'Não foi possível carregar seus pedidos.'

        );

        return;

      }



      if (!pedidosData?.length) {

        setPedidos([]);

        return;

      }



      const idsPedidos = pedidosData.map(

        (pedido) => pedido.id

      );



      const {

        data: itensData,

        error: itensError,

      } = await supabase

        .from('pedido_itens')

        .select(

          'id, pedido_id, produto_id, excedente_id, quantidade, preco_unitario'

        )

        .in('pedido_id', idsPedidos);



      if (itensError) {

        console.log(

          'Erro ao carregar itens:',

          itensError

        );



        setErro(

          'Não foi possível carregar os produtos dos pedidos.'

        );

        return;

      }



      const idsProdutos = Array.from(

        new Set(

          (itensData ?? []).map(

            (item) => item.produto_id

          )

        )

      );



      let produtosData: {

        id: string;

        nome: string;

        produtor_id: string;

      }[] = [];



      if (idsProdutos.length > 0) {

        const {

          data,

          error: produtosError,

        } = await supabase

          .from('produtos')

          .select(

            'id, nome, produtor_id'

          )

          .in('id', idsProdutos);



        if (produtosError) {

          console.log(

            'Erro ao carregar produtos:',

            produtosError

          );

        } else {

          produtosData = data ?? [];

        }

      }



      const produtosPorId = new Map(

        produtosData.map((produto) => [

          produto.id,

          produto,

        ])

      );
      const idsProdutores = Array.from(
        new Set(
          produtosData
            .map((produto) => produto.produtor_id)
            .filter(Boolean)
        )
      );

      const nomesProdutoresPorId = new Map<string, string>();

      if (idsProdutores.length > 0) {
        const {
          data: produtoresPublicos,
          error: produtoresError,
        } = await supabase.rpc('listar_produtores_publicos');

        if (produtoresError) {
          console.log(
            'Erro ao carregar produtores:',
            produtoresError
          );
        } else {
          (produtoresPublicos ?? []).forEach((produtor: any) => {
            if (
              produtor.id &&
              idsProdutores.includes(produtor.id)
            ) {
              nomesProdutoresPorId.set(
                produtor.id,
                produtor.nome ?? 'Produtor'
              );
            }
          });
        }
      }




      const pedidosFormatados: Pedido[] =

        pedidosData.map((pedido) => {

          const itensDoPedido = (

            itensData ?? []

          ).filter(

            (item) =>

              item.pedido_id === pedido.id

          );



          const nomesProdutos =

            itensDoPedido

              .map(

                (item) =>

                  produtosPorId.get(

                    item.produto_id

                  )?.nome

              )

              .filter(Boolean) as string[];
            const primeiroProduto = itensDoPedido
              .map((item) =>
                produtosPorId.get(item.produto_id)
              )
              .find(Boolean);

            const nomeProdutor =
              primeiroProduto?.produtor_id
                ? nomesProdutoresPorId.get(
                    primeiroProduto.produtor_id
                  ) ?? 'Produtor'
                : 'Produtor';




          const dataPedido = new Date(

            pedido.created_at

          );



          return {

            id: pedido.id,

            numero: `#${pedido.id

              .slice(0, 8)

              .toUpperCase()}`,

            status: formatarStatus(

              pedido.status

            ),

            data:

              dataPedido.toLocaleDateString(

                'pt-BR'

              ) +

              ' às ' +

              dataPedido.toLocaleTimeString(

                'pt-BR',

                {

                  hour: '2-digit',

                  minute: '2-digit',

                }

              ),

            produtor: nomeProdutor,

            resumoProdutos:

              nomesProdutos.length > 0

                ? nomesProdutos.join(', ')

                : 'Produtos do pedido',

            valorTotal: Number(

              pedido.valor_total ?? 0

            ),

          };

        });



      setPedidos(pedidosFormatados);

    } catch (error) {

      console.log(

        'Erro inesperado ao carregar pedidos:',

        error

      );



      setErro(

        'Não foi possível carregar seus pedidos.'

      );

    } finally {

      setCarregando(false);

      setAtualizando(false);

    }

  }



  const pedidosFiltrados =

    pedidos.filter((pedido) => {

      if (filtro === 'andamento') {

        return (

          pedido.status !== 'Concluído' &&

          pedido.status !== 'Cancelado'

        );

      }



      if (filtro === 'concluidos') {

        return (

          pedido.status === 'Concluído'

        );

      }



      return true;

    });



  return (

    <View style={styles.container}>

      <View style={styles.header}>

        <TouchableOpacity

          style={styles.backButton}

          onPress={() => router.back()}

        >

          <Ionicons

            name="chevron-back"

            size={26}

            color="#004B0A"

          />

        </TouchableOpacity>



        <Text style={styles.title}>

          Meus pedidos

        </Text>



        <View style={styles.headerSpace} />

      </View>



      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.content}

        refreshControl={

          <RefreshControl

            refreshing={atualizando}

            onRefresh={() =>

              carregarPedidos(true)

            }

            tintColor="#004B0A"

            colors={['#004B0A']}

          />

        }

      >

        <View style={styles.filters}>

          <TouchableOpacity

            style={[

              styles.filterButton,

              filtro === 'todos' &&

                styles.filterButtonActive,

            ]}

            onPress={() => setFiltro('todos')}

          >

            <Text

              style={

                filtro === 'todos'

                  ? styles.filterTextActive

                  : styles.filterText

              }

            >

              Todos

            </Text>

          </TouchableOpacity>



          <TouchableOpacity

            style={[

              styles.filterButton,

              filtro === 'andamento' &&

                styles.filterButtonActive,

            ]}

            onPress={() =>

              setFiltro('andamento')

            }

          >

            <Text

              style={

                filtro === 'andamento'

                  ? styles.filterTextActive

                  : styles.filterText

              }

            >

              Em andamento

            </Text>

          </TouchableOpacity>



          <TouchableOpacity

            style={[

              styles.filterButton,

              filtro === 'concluidos' &&

                styles.filterButtonActive,

            ]}

            onPress={() =>

              setFiltro('concluidos')

            }

          >

            <Text

              style={

                filtro === 'concluidos'

                  ? styles.filterTextActive

                  : styles.filterText

              }

            >

              Concluídos

            </Text>

          </TouchableOpacity>

        </View>



        {carregando ? (

          <View style={styles.loadingContainer}>

            <ActivityIndicator

              size="large"

              color="#004B0A"

            />



            <Text style={styles.loadingText}>

              Carregando seus pedidos...

            </Text>

          </View>

        ) : erro ? (

          <View style={styles.emptyContainer}>

            <Ionicons

              name="alert-circle-outline"

              size={45}

              color="#999999"

            />



            <Text style={styles.emptyTitle}>

              {erro}

            </Text>



            <TouchableOpacity

              style={styles.retryButton}

              onPress={() =>

                carregarPedidos()

              }

            >

              <Text style={styles.retryButtonText}>

                Tentar novamente

              </Text>

            </TouchableOpacity>

          </View>

        ) : pedidosFiltrados.length === 0 ? (

          <View style={styles.emptyContainer}>

            <Ionicons

              name="receipt-outline"

              size={45}

              color="#999999"

            />



            <Text style={styles.emptyTitle}>

              Nenhum pedido encontrado

            </Text>



            <Text style={styles.emptyText}>

              Seus pedidos aparecerão aqui.

            </Text>

          </View>

        ) : (

          pedidosFiltrados.map((pedido) => {

            const statusVisual =

              estiloStatus(pedido.status);



            return (

              <View

                style={styles.orderCard}

                key={pedido.id}

              >

                <View style={styles.orderHeader}>

                  <View style={styles.orderHeaderInfo}>

                    <Text style={styles.orderNumber}>

                      Pedido {pedido.numero}

                    </Text>



                    <Text style={styles.orderDate}>

                      {pedido.data}

                    </Text>

                  </View>



                  <View

                    style={[

                      styles.statusBadge,

                      {

                        backgroundColor:

                          statusVisual.fundo,

                      },

                    ]}

                  >

                    <Text

                      style={[

                        styles.statusText,

                        {

                          color:

                            statusVisual.texto,

                        },

                      ]}

                    >

                      {pedido.status}

                    </Text>

                  </View>

                </View>



                <View style={styles.divider} />



                <View style={styles.producerRow}>

                  <View style={styles.producerIcon}>

                    <Ionicons

                      name="storefront-outline"

                      size={21}

                      color="#004B0A"

                    />

                  </View>



                  <View>

                    <Text style={styles.smallLabel}>

                      Produtor

                    </Text>



                    <Text

                      style={styles.producerName}

                    >

                      {pedido.produtor}

                    </Text>

                  </View>

                </View>



                <View style={styles.orderInfo}>

                  <View style={styles.infoItem}>

                    <Ionicons

                      name="bag-handle-outline"

                      size={18}

                      color="#666666"

                    />



                    <Text style={styles.infoText}>

                      {pedido.resumoProdutos}

                    </Text>

                  </View>



                  <View style={styles.infoItem}>

                    <Ionicons

                      name="time-outline"

                      size={18}

                      color="#666666"

                    />



                    <Text style={styles.infoText}>

                      {descricaoStatus(

                        pedido.status

                      )}

                    </Text>

                  </View>

                </View>



                <View style={styles.divider} />



                <View style={styles.totalRow}>

                  <Text style={styles.totalLabel}>

                    Total do pedido

                  </Text>



                  <Text style={styles.totalValue}>

                    {formatarPreco(

                      pedido.valorTotal

                    )}

                  </Text>

                </View>



                <TouchableOpacity

                  style={styles.detailsButton}

                  onPress={() =>

                    router.push(

                      `/pedido/${pedido.id}`

                    )

                  }

                >

                  <Text

                    style={styles.detailsButtonText}

                  >

                    Ver detalhes

                  </Text>



                  <Ionicons

                    name="chevron-forward"

                    size={18}

                    color="#004B0A"

                  />

                </TouchableOpacity>

              </View>

            );

          })

        )}



        <View style={styles.infoCard}>

          <Ionicons

            name="information-circle-outline"

            size={22}

            color="#004B0A"

          />



          <Text style={styles.infoCardText}>

            Quando o produtor atualizar seu pedido,

            o novo status aparecerá aqui.

          </Text>

        </View>



        <TouchableOpacity

          style={styles.productsButton}

          onPress={() => router.push('/produtos')}

        >

          <Ionicons

            name="basket-outline"

            size={20}

            color="#FFFFFF"

          />



          <Text style={styles.productsButtonText}>

            Ver mais produtos

          </Text>

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



  header: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 18,

    paddingTop: 25,

    paddingBottom: 15,

    borderBottomWidth: 1,

    borderBottomColor: '#EEEEEE',

  },



  backButton: {

    width: 40,

    height: 40,

    justifyContent: 'center',

  },



  title: {

    fontSize: 21,

    fontWeight: 'bold',

    color: '#000000',

  },



  headerSpace: {

    width: 40,

  },



  content: {

    padding: 18,

    paddingBottom: 40,

  },



  filters: {

    flexDirection: 'row',

    marginBottom: 20,

    gap: 8,

  },



  filterButton: {

    flex: 1,

    paddingVertical: 9,

    borderRadius: 20,

    backgroundColor: '#F1F1F1',

    alignItems: 'center',

  },



  filterButtonActive: {

    backgroundColor: '#004B0A',

  },



  filterText: {

    fontSize: 11,

    color: '#555555',

    fontWeight: '500',

  },



  filterTextActive: {

    fontSize: 11,

    color: '#FFFFFF',

    fontWeight: '600',

  },



  orderCard: {

    borderWidth: 1,

    borderColor: '#E1E1E1',

    borderRadius: 12,

    padding: 17,

    marginBottom: 14,

  },



  orderHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    gap: 10,

  },



  orderHeaderInfo: {

    flex: 1,

  },



  orderNumber: {

    fontSize: 15,

    fontWeight: 'bold',

  },



  orderDate: {

    fontSize: 10,

    color: '#777777',

    marginTop: 4,

  },



  statusBadge: {

    backgroundColor: '#FFF5D9',

    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: 15,

  },



  statusText: {

    color: '#8A6200',

    fontSize: 10,

    fontWeight: '600',

  },



  divider: {

    height: 1,

    backgroundColor: '#E5E5E5',

    marginVertical: 16,

  },



  producerRow: {

    flexDirection: 'row',

    alignItems: 'center',

  },



  producerIcon: {

    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: '#F0F6F1',

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 11,

  },



  smallLabel: {

    fontSize: 10,

    color: '#777777',

  },



  producerName: {

    fontSize: 13,

    fontWeight: '600',

    marginTop: 2,

  },



  orderInfo: {

    marginTop: 17,

    gap: 10,

  },



  infoItem: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

  },



  infoText: {

    flex: 1,

    fontSize: 11,

    color: '#555555',

  },



  totalRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },



  totalLabel: {

    fontSize: 12,

    color: '#666666',

  },



  totalValue: {

    fontSize: 13,

    color: '#004B0A',

    fontWeight: 'bold',

  },



  detailsButton: {

    marginTop: 17,

    borderWidth: 1,

    borderColor: '#004B0A',

    borderRadius: 7,

    paddingVertical: 11,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    gap: 4,

  },



  detailsButtonText: {

    color: '#004B0A',

    fontSize: 13,

    fontWeight: '600',

  },



  infoCard: {

    backgroundColor: '#F0F6F1',

    borderRadius: 9,

    padding: 14,

    marginTop: 18,

    flexDirection: 'row',

    gap: 9,

  },



  infoCardText: {

    flex: 1,

    fontSize: 11,

    lineHeight: 17,

    color: '#444444',

  },



  productsButton: {

    backgroundColor: '#004B0A',

    borderRadius: 8,

    paddingVertical: 14,

    marginTop: 22,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    gap: 7,

  },



  productsButtonText: {

    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '600',

  },



  loadingContainer: {

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 45,

  },



  loadingText: {

    marginTop: 12,

    fontSize: 12,

    color: '#666666',

  },



  emptyContainer: {

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 40,

  },



  emptyTitle: {

    marginTop: 12,

    fontSize: 15,

    fontWeight: '600',

    textAlign: 'center',

  },



  emptyText: {

    marginTop: 5,

    fontSize: 11,

    color: '#777777',

    textAlign: 'center',

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

    fontSize: 11,

    fontWeight: '600',

  },

});
