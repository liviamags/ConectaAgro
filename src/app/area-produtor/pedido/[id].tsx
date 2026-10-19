import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../../../lib/supabase';

type StatusPedido =
  | 'Novo'
  | 'Confirmado'
  | 'Em preparo'
  | 'Pronto'
  | 'Concluído'
  | 'Cancelado';

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
  status: StatusPedido;
  data: string;
  hora: string;
  cliente: string;
  telefone: string;
  itens: ItemPedido[];
  total: number;
  tipoRecebimento: string;
  endereco: string | null;
  formaPagamento: string;
  observacao: string | null;
};

export default function DetalhesPedidoScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [pedido, setPedido] =
    useState<PedidoDetalhado | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  useEffect(() => {
    carregarPedido();
  }, [id]);

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatarRecebimento(
    valor: string | null
  ) {
    if (valor === 'entrega') {
      return 'Entrega';
    }

    if (valor === 'retirada') {
      return 'Retirada';
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

  async function carregarPedido() {
    if (!id) {
      setErro('Pedido não encontrado.');
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const {
        data: pedidoData,
        error: pedidoError,
      } = await supabase
        .from('pedidos')
        .select(
          'id, status, valor_total, created_at, tipo_recebimento, endereco, forma_pagamento, observacao, cliente_nome, cliente_telefone'
        )
        .eq('id', id)
        .single();

      if (pedidoError || !pedidoData) {
        console.log(
          'Erro ao carregar pedido:',
          pedidoError
        );

        setErro('Pedido não encontrado.');
        return;
      }

      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (
        usuarioError ||
        !usuarioData.user
      ) {
        setErro(
          'Não foi possível identificar o produtor.'
        );
        return;
      }

      const {
        data: produtosData,
        error: produtosError,
      } = await supabase
        .from('produtos')
        .select('id, nome, unidade')
        .eq(
          'produtor_id',
          usuarioData.user.id
        );

      if (produtosError) {
        console.log(
          'Erro ao carregar produtos do produtor:',
          produtosError
        );

        setErro(
          'Não foi possível carregar os itens do pedido.'
        );
        return;
      }

      const idsProdutos = (
        produtosData ?? []
      ).map((produto) => produto.id);

      if (idsProdutos.length === 0) {
        setErro(
          'Este pedido não possui itens deste produtor.'
        );
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
        .eq('pedido_id', id)
        .in('produto_id', idsProdutos);

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

      if (!itensData?.length) {
        setErro(
          'Este pedido não possui itens deste produtor.'
        );
        return;
      }

      const produtosPorId = new Map(
        (produtosData ?? []).map(
          (produto) => [
            produto.id,
            produto,
          ]
        )
      );

      const itens: ItemPedido[] =
        itensData.map((item) => {
          const produto =
            produtosPorId.get(
              item.produto_id
            );

          return {
            id: item.id,
            nome:
              produto?.nome ??
              'Produto',
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

      const totalDoProdutor =
        itens.reduce(
          (total, item) =>
            total +
            item.quantidade *
              item.precoUnitario,
          0
        );

      setPedido({
        id: pedidoData.id,
        numero: `#${pedidoData.id
          .slice(0, 8)
          .toUpperCase()}`,
        status:
          pedidoData.status as StatusPedido,
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
        cliente:
          pedidoData.cliente_nome ||
          'Cliente não informado',
        telefone:
          pedidoData.cliente_telefone ||
          'Não informado',
        itens,
        total:
          totalDoProdutor ||
          Number(
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

  async function mudarStatus(
    status: StatusPedido,
    mensagem: string
  ) {
    if (!pedido) {
      return;
    }

    const { error } = await supabase
      .from('pedidos')
      .update({
        status,
      })
      .eq('id', pedido.id);

    if (error) {
      console.log(
        'Erro ao atualizar pedido:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível atualizar o pedido.'
      );

      return;
    }

    setPedido((pedidoAtual) =>
      pedidoAtual
        ? {
            ...pedidoAtual,
            status,
          }
        : pedidoAtual
    );

    Alert.alert(
      'Pedido atualizado',
      mensagem
    );
  }

  function cancelarPedido() {
    if (!pedido) {
      return;
    }

    Alert.alert(
      'Cancelar pedido',
      'Tem certeza de que deseja cancelar este pedido?',
      [
        {
          text: 'Voltar',
          style: 'cancel',
        },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: async () => {
            await mudarStatus(
              'Cancelado',
              'O pedido foi cancelado.'
            );
          },
        },
      ]
    );
  }

  if (carregando) {
    return (
      <View style={styles.notFound}>
        <ActivityIndicator
          size="large"
          color="#004B0A"
        />

        <Text style={styles.notFoundTitle}>
          Carregando pedido...
        </Text>
      </View>
    );
  }

  if (!pedido || erro) {
    return (
      <View style={styles.notFound}>
        <Ionicons
          name="alert-circle-outline"
          size={55}
          color="#999999"
        />

        <Text style={styles.notFoundTitle}>
          {erro || 'Pedido não encontrado'}
        </Text>

        <TouchableOpacity
          style={styles.backToOrders}
          onPress={() =>
            router.replace(
              '/area-produtor/pedidos'
            )
          }
        >
          <Text style={styles.backToOrdersText}>
            Voltar aos pedidos
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const podeCancelar =
    pedido.status !== 'Concluído' &&
    pedido.status !== 'Cancelado';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            Detalhes do pedido
          </Text>

          <Text style={styles.subtitle}>
            {pedido.numero}
          </Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="receipt-outline"
              size={27}
              color="#004B0A"
            />
          </View>

          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>
              Status atual
            </Text>

            <Text style={styles.statusValue}>
              {pedido.status}
            </Text>

            <Text style={styles.statusDate}>
              Pedido realizado em {pedido.data} às{' '}
              {pedido.hora}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Cliente
        </Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#004B0A"
            />

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Nome
              </Text>

              <Text style={styles.infoValue}>
                {pedido.cliente}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#004B0A"
            />

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Telefone
              </Text>

              <Text style={styles.infoValue}>
                {pedido.telefone}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Itens do pedido
        </Text>

        <View style={styles.card}>
          {pedido.itens.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.productRow,
                index <
                  pedido.itens.length - 1 &&
                  styles.productRowBorder,
              ]}
            >
              <View style={styles.productIcon}>
                <Ionicons
                  name="leaf-outline"
                  size={20}
                  color="#004B0A"
                />
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {item.nome}
                </Text>

                <Text
                  style={styles.productQuantity}
                >
                  {item.quantidade}{' '}
                  {item.unidade} ×{' '}
                  {formatarPreco(
                    item.precoUnitario
                  )}
                </Text>
              </View>

              <Text style={styles.productTotal}>
                {formatarPreco(
                  item.quantidade *
                    item.precoUnitario
                )}
              </Text>
            </View>
          ))}

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
              size={20}
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
                size={20}
                color="#004B0A"
              />

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Endereço
                </Text>

                <Text style={styles.infoValue}>
                  {pedido.endereco}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons
              name="card-outline"
              size={20}
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
              Observação do cliente
            </Text>

            <View style={styles.observationCard}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={20}
                color="#004B0A"
              />

              <Text style={styles.observationText}>
                {pedido.observacao}
              </Text>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>
          Atualizar pedido
        </Text>

        <View style={styles.actionsCard}>
          {pedido.status === 'Novo' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                mudarStatus(
                  'Confirmado',
                  'O pedido foi confirmado.'
                )
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={styles.primaryButtonText}
              >
                Confirmar pedido
              </Text>
            </TouchableOpacity>
          )}

          {pedido.status === 'Confirmado' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                mudarStatus(
                  'Em preparo',
                  'O pedido agora está em preparo.'
                )
              }
            >
              <Ionicons
                name="restaurant-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={styles.primaryButtonText}
              >
                Iniciar preparo
              </Text>
            </TouchableOpacity>
          )}

          {pedido.status === 'Em preparo' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                mudarStatus(
                  'Pronto',
                  'O pedido foi marcado como pronto.'
                )
              }
            >
              <Ionicons
                name="bag-check-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={styles.primaryButtonText}
              >
                Marcar como pronto
              </Text>
            </TouchableOpacity>
          )}

          {pedido.status === 'Pronto' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                mudarStatus(
                  'Concluído',
                  'O pedido foi concluído.'
                )
              }
            >
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={styles.primaryButtonText}
              >
                Concluir pedido
              </Text>
            </TouchableOpacity>
          )}

          {pedido.status === 'Concluído' && (
            <View style={styles.finishedCard}>
              <Ionicons
                name="checkmark-circle"
                size={25}
                color="#004B0A"
              />

              <View style={styles.finishedInfo}>
                <Text
                  style={styles.finishedTitle}
                >
                  Pedido concluído
                </Text>

                <Text style={styles.finishedText}>
                  Este pedido já foi finalizado.
                </Text>
              </View>
            </View>
          )}

          {pedido.status === 'Cancelado' && (
            <View style={styles.cancelledCard}>
              <Ionicons
                name="close-circle"
                size={25}
                color="#B42318"
              />

              <View style={styles.finishedInfo}>
                <Text
                  style={styles.cancelledTitle}
                >
                  Pedido cancelado
                </Text>

                <Text style={styles.finishedText}>
                  Este pedido foi cancelado.
                </Text>
              </View>
            </View>
          )}

          {podeCancelar && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelarPedido}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color="#B42318"
              />

              <Text
                style={styles.cancelButtonText}
              >
                Cancelar pedido
              </Text>
            </TouchableOpacity>
          )}
        </View>
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

    fontSize: 10,

    color: '#777777',

    marginTop: 2,

  },



  headerSpace: {

    width: 42,

  },



  content: {

    padding: 18,

    paddingBottom: 50,

  },



  statusCard: {

    padding: 15,

    borderRadius: 13,

    backgroundColor: '#F0F6F1',

    flexDirection: 'row',

    alignItems: 'center',

  },



  statusIcon: {

    width: 50,

    height: 50,

    borderRadius: 14,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

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

    fontSize: 16,

    fontWeight: 'bold',

    color: '#004B0A',

    marginTop: 2,

  },



  statusDate: {

    fontSize: 8,

    color: '#777777',

    marginTop: 3,

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



  infoRow: {

    flexDirection: 'row',

    alignItems: 'center',

    marginVertical: 7,

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



  actionsCard: {

    marginBottom: 20,

  },



  primaryButton: {

    height: 48,

    borderRadius: 9,

    backgroundColor: '#004B0A',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,

  },



  primaryButtonText: {

    color: '#FFFFFF',

    fontSize: 12,

    fontWeight: '600',

  },



  cancelButton: {

    height: 45,

    marginTop: 10,

    borderRadius: 9,

    backgroundColor: '#FFF1F0',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

  },



  cancelButtonText: {

    color: '#B42318',

    fontSize: 11,

    fontWeight: '600',

  },



  finishedCard: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 14,

    borderRadius: 11,

    backgroundColor: '#EAF3EB',

  },



  cancelledCard: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 14,

    borderRadius: 11,

    backgroundColor: '#FFF1F0',

  },



  finishedInfo: {

    marginLeft: 10,

  },



  finishedTitle: {

    fontSize: 12,

    fontWeight: 'bold',

    color: '#004B0A',

  },



  cancelledTitle: {

    fontSize: 12,

    fontWeight: 'bold',

    color: '#B42318',

  },



  finishedText: {

    fontSize: 9,

    color: '#666666',

    marginTop: 2,

  },



  notFound: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

  },



  notFoundTitle: {

    fontSize: 17,

    fontWeight: 'bold',

    marginTop: 12,

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