import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useLocalSearchParams,
} from 'expo-router';
import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type ItemPedido = {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  precoUnitario: number;
};

type PedidoDetalhado = {
  id: string;
  numero: string;
  status: string;
  data: string;
  hora: string;
  itens: ItemPedido[];
  total: number;
  tipoRecebimento: string;
  endereco: string | null;
  formaPagamento: string;
  observacao: string | null;
};

export default function DetalhesPedidoCompradorScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const pedidoId = String(id ?? '');

  const [pedido, setPedido] =
    useState<PedidoDetalhado | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  useEffect(() => {
    carregarPedido();
  }, [pedidoId]);

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatarRecebimento(
    valor: string | null
  ) {
    if (valor === 'retirada') {
      return 'Retirada';
    }

    if (valor === 'entrega') {
      return 'Entrega';
    }

    return valor || 'Não informado';
  }

  function formatarPagamento(
    valor: string | null
  ) {
    if (valor === 'pix') {
      return 'Pix';
    }

    if (valor === 'dinheiro') {
      return 'Dinheiro';
    }

    if (valor === 'cartao') {
      return 'Cartão na retirada/entrega';
    }

    return valor || 'Não informado';
  }

  function descricaoStatus(status: string) {
    switch (status) {
      case 'Novo':
        return 'Aguardando confirmação do produtor.';
      case 'Confirmado':
        return 'Seu pedido foi confirmado pelo produtor.';
      case 'Em preparo':
        return 'O produtor está preparando seu pedido.';
      case 'Pronto':
        return 'Seu pedido está pronto.';
      case 'Concluído':
        return 'Seu pedido foi concluído.';
      case 'Cancelado':
        return 'Este pedido foi cancelado.';
      default:
        return 'Acompanhe aqui o andamento do seu pedido.';
    }
  }

  function iconeStatus(status: string) {
    switch (status) {
      case 'Confirmado':
        return 'checkmark-circle-outline' as const;
      case 'Em preparo':
        return 'restaurant-outline' as const;
      case 'Pronto':
        return 'bag-check-outline' as const;
      case 'Concluído':
        return 'checkmark-done-circle-outline' as const;
      case 'Cancelado':
        return 'close-circle-outline' as const;
      default:
        return 'time-outline' as const;
    }
  }

  async function carregarPedido() {
    if (!pedidoId) {
      setErro('Pedido não encontrado.');
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
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
        data: pedidoData,
        error: pedidoError,
      } = await supabase
        .from('pedidos')
        .select(
          'id, comprador_id, status, valor_total, created_at, tipo_recebimento, endereco, forma_pagamento, observacao'
        )
        .eq('id', pedidoId)
        .eq(
          'comprador_id',
          usuarioData.user.id
        )
        .single();

      if (pedidoError || !pedidoData) {
        console.log(
          'Erro ao carregar pedido da compradora:',
          pedidoError
        );

        setErro('Pedido não encontrado.');
        return;
      }

      const {
        data: itensData,
        error: itensError,
      } = await supabase
        .from('pedido_itens')
        .select(
          'id, produto_id, quantidade, preco_unitario'
        )
        .eq('pedido_id', pedidoId);

      if (itensError) {
        console.log(
          'Erro ao carregar itens do pedido:',
          itensError
        );

        setErro(
          'Não foi possível carregar os itens do pedido.'
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
        unidade: string | null;
      }[] = [];

      if (idsProdutos.length > 0) {
        const {
          data,
          error: produtosError,
        } = await supabase
          .from('produtos')
          .select('id, nome, unidade')
          .in('id', idsProdutos);

        if (produtosError) {
          console.log(
            'Erro ao carregar produtos do pedido:',
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

      const itens: ItemPedido[] = (
        itensData ?? []
      ).map((item) => {
        const produto =
          produtosPorId.get(
            item.produto_id
          );

        return {
          id: item.id,
          nome:
            produto?.nome ?? 'Produto',
          quantidade: Number(
            item.quantidade
          ),
          unidade:
            produto?.unidade || 'un.',
          precoUnitario: Number(
            item.preco_unitario
          ),
        };
      });

      const dataPedido = new Date(
        pedidoData.created_at
      );

      setPedido({
        id: pedidoData.id,
        numero: `#${pedidoData.id
          .slice(0, 8)
          .toUpperCase()}`,
        status:
          pedidoData.status || 'Novo',
        data:
          dataPedido.toLocaleDateString(
            'pt-BR'
          ),
        hora:
          dataPedido.toLocaleTimeString(
            'pt-BR',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),
        itens,
        total: Number(
          pedidoData.valor_total ?? 0
        ),
        tipoRecebimento:
          formatarRecebimento(
            pedidoData.tipo_recebimento
          ),
        endereco:
          pedidoData.endereco ?? null,
        formaPagamento:
          formatarPagamento(
            pedidoData.forma_pagamento
          ),
        observacao:
          pedidoData.observacao ?? null,
      });
    } catch (error) {
      console.log(
        'Erro inesperado ao carregar pedido:',
        error
      );

      setErro(
        'Não foi possível carregar o pedido.'
      );
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#004B0A"
        />

        <Text style={styles.centerText}>
          Carregando pedido...
        </Text>
      </View>
    );
  }

  if (erro || !pedido) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={55}
          color="#999999"
        />

        <Text style={styles.errorTitle}>
          {erro || 'Pedido não encontrado'}
        </Text>

        <TouchableOpacity
          style={styles.backToOrders}
          onPress={() =>
            router.replace('/meus-pedidos')
          }
        >
          <Text style={styles.backToOrdersText}>
            Voltar aos pedidos
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cancelado =
    pedido.status === 'Cancelado';

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

        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            Detalhes do pedido
          </Text>

          <Text style={styles.subtitle}>
            Pedido {pedido.numero}
          </Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.statusCard,
            cancelado &&
              styles.statusCardCancelled,
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              cancelado &&
                styles.statusIconCancelled,
            ]}
          >
            <Ionicons
              name={iconeStatus(
                pedido.status
              )}
              size={28}
              color={
                cancelado
                  ? '#B42318'
                  : '#004B0A'
              }
            />
          </View>

          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>
              Status atual
            </Text>

            <Text
              style={[
                styles.statusValue,
                cancelado &&
                  styles.statusValueCancelled,
              ]}
            >
              {pedido.status}
            </Text>

            <Text style={styles.statusDescription}>
              {descricaoStatus(
                pedido.status
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>
          Pedido realizado em {pedido.data} às{' '}
          {pedido.hora}
        </Text>

        <Text style={styles.sectionTitle}>
          Itens do pedido
        </Text>

        <View style={styles.card}>
          {pedido.itens.map(
            (item, index) => (
              <View
                key={item.id}
                style={[
                  styles.productRow,
                  index <
                    pedido.itens.length -
                      1 &&
                    styles.productRowBorder,
                ]}
              >
                <View
                  style={styles.productIcon}
                >
                  <Ionicons
                    name="leaf-outline"
                    size={20}
                    color="#004B0A"
                  />
                </View>

                <View
                  style={styles.productInfo}
                >
                  <Text
                    style={styles.productName}
                  >
                    {item.nome}
                  </Text>

                  <Text
                    style={
                      styles.productQuantity
                    }
                  >
                    {item.quantidade}{' '}
                    {item.unidade} ×{' '}
                    {formatarPreco(
                      item.precoUnitario
                    )}
                  </Text>
                </View>

                <Text
                  style={styles.productTotal}
                >
                  {formatarPreco(
                    item.quantidade *
                      item.precoUnitario
                  )}
                </Text>
              </View>
            )
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total do pedido
            </Text>

            <Text style={styles.totalValue}>
              {formatarPreco(pedido.total)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Recebimento
        </Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons
              name={
                pedido.tipoRecebimento ===
                'Retirada'
                  ? 'storefront-outline'
                  : 'bicycle-outline'
              }
              size={21}
              color="#004B0A"
            />

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Forma de recebimento
              </Text>

              <Text style={styles.infoValue}>
                {pedido.tipoRecebimento}
              </Text>
            </View>
          </View>

          {pedido.endereco && (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={21}
                color="#004B0A"
              />

              <View
                style={styles.infoContent}
              >
                <Text
                  style={styles.infoLabel}
                >
                  Endereço
                </Text>

                <Text
                  style={styles.infoValue}
                >
                  {pedido.endereco}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons
              name="card-outline"
              size={21}
              color="#004B0A"
            />

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Pagamento
              </Text>

              <Text style={styles.infoValue}>
                {pedido.formaPagamento}
              </Text>
            </View>
          </View>
        </View>

        {pedido.observacao && (
          <>
            <Text style={styles.sectionTitle}>
              Sua observação
            </Text>

            <View
              style={styles.observationCard}
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={20}
                color="#004B0A"
              />

              <Text
                style={styles.observationText}
              >
                {pedido.observacao}
              </Text>
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#004B0A"
          />

          <Text style={styles.infoCardText}>
            O status desta tela é atualizado
            conforme o produtor avança no
            preparo do seu pedido.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.productsButton}
          onPress={() =>
            router.push('/produtos')
          }
        >
          <Ionicons
            name="basket-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={styles.productsButtonText}
          >
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

  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 9,
    color: '#777777',
  },

  headerSpace: {
    width: 40,
  },

  content: {
    padding: 18,
    paddingBottom: 45,
  },

  statusCard: {
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#F0F6F1',
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusCardCancelled: {
    backgroundColor: '#FFF1F0',
  },

  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusIconCancelled: {
    backgroundColor: '#FFFFFF',
  },

  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },

  statusLabel: {
    fontSize: 9,
    color: '#68776A',
  },

  statusValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 2,
  },

  statusValueCancelled: {
    color: '#B42318',
  },

  statusDescription: {
    fontSize: 9,
    color: '#666666',
    marginTop: 4,
    lineHeight: 14,
  },

  dateText: {
    fontSize: 9,
    color: '#777777',
    marginTop: 10,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 10,
  },

  card: {
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: 12,
    padding: 14,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  productIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productInfo: {
    flex: 1,
    marginLeft: 10,
  },

  productName: {
    fontSize: 11,
    fontWeight: '600',
  },

  productQuantity: {
    fontSize: 8,
    color: '#777777',
    marginTop: 3,
  },

  productTotal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#004B0A',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 13,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
  },

  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  totalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },

  infoContent: {
    flex: 1,
    marginLeft: 10,
  },

  infoLabel: {
    fontSize: 8,
    color: '#888888',
  },

  infoValue: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  observationCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F7F9F7',
  },

  observationText: {
    flex: 1,
    fontSize: 10,
    color: '#555555',
    lineHeight: 15,
    marginLeft: 9,
  },

  infoCard: {
    backgroundColor: '#F0F6F1',
    borderRadius: 9,
    padding: 14,
    marginTop: 24,
    flexDirection: 'row',
    gap: 9,
  },

  infoCardText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    color: '#444444',
  },

  productsButton: {
    backgroundColor: '#004B0A',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
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

  centerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  centerText: {
    marginTop: 12,
    fontSize: 11,
    color: '#666666',
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  backToOrders: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#004B0A',
  },

  backToOrdersText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
