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

import { supabase } from '../../lib/supabase';

type StatusPedido =
  | 'Novo'
  | 'Confirmado'
  | 'Em preparo'
  | 'Pronto'
  | 'Concluído'
  | 'Cancelado';

type FiltroPedido = 'Todos' | StatusPedido;

type ItemPedido = {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  precoUnitario: number;
};

type PedidoProdutor = {
  id: string;
  numero: string;
  cliente: string;
  data: string;
  hora: string;
  status: StatusPedido;
  tipoRecebimento: string;
  total: number;
  itens: ItemPedido[];
};

export default function PedidosProdutorScreen() {
  const [pedidos, setPedidos] = useState<PedidoProdutor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPedido>('Todos');

  const filtros: FiltroPedido[] = [
    'Todos',
    'Novo',
    'Confirmado',
    'Em preparo',
    'Pronto',
    'Concluído',
    'Cancelado',
  ];

  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
    }, [])
  );

  function normalizarStatus(status: string | null): StatusPedido {
    const valor = (status ?? '').trim().toLowerCase();

    if (valor === 'confirmado') return 'Confirmado';
    if (valor === 'em preparo') return 'Em preparo';
    if (valor === 'pronto') return 'Pronto';
    if (valor === 'concluído' || valor === 'concluido') return 'Concluído';
    if (valor === 'cancelado') return 'Cancelado';

    return 'Novo';
  }

  function formatarDataHora(dataIso: string | null) {
    if (!dataIso) {
      return { data: '--/--/----', hora: '--:--' };
    }

    const dataObjeto = new Date(dataIso);

    return {
      data: dataObjeto.toLocaleDateString('pt-BR'),
      hora: dataObjeto.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  function gerarNumeroPedido(id: string) {
    return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  }

  async function carregarPedidos(modoAtualizacao = false) {
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

      if (userError || !user) {
        console.log('Erro ao buscar usuário:', userError);
        setPedidos([]);
        return;
      }

      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, unidade')
        .eq('produtor_id', user.id);

      if (produtosError) throw produtosError;

      if (!produtos || produtos.length === 0) {
        setPedidos([]);
        return;
      }

      const produtoPorId = new Map(
        produtos.map((produto) => [
          produto.id,
          {
            nome: produto.nome,
            unidade: produto.unidade ?? 'unidade',
          },
        ])
      );

      const idsProdutos = produtos.map((produto) => produto.id);

      const { data: itens, error: itensError } = await supabase
        .from('pedido_itens')
        .select('id, pedido_id, produto_id, quantidade, preco_unitario')
        .in('produto_id', idsProdutos);

      if (itensError) throw itensError;

      if (!itens || itens.length === 0) {
        setPedidos([]);
        return;
      }

      const idsPedidos = [...new Set(itens.map((item) => item.pedido_id))];

      const { data: pedidosBanco, error: pedidosError } = await supabase
        .from('pedidos')
        .select(
          'id, comprador_id, status, valor_total, created_at, tipo_recebimento'
        )
        .in('id', idsPedidos)
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;

      if (!pedidosBanco || pedidosBanco.length === 0) {
        setPedidos([]);
        return;
      }

      const idsCompradores = [
        ...new Set(
          pedidosBanco
            .map((pedido) => pedido.comprador_id)
            .filter((valor): valor is string => Boolean(valor))
        ),
      ];

      let nomesCompradores = new Map<string, string>();

      if (idsCompradores.length > 0) {
        const { data: perfis, error: perfisError } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', idsCompradores);

        if (perfisError) {
          console.log(
            'Não foi possível carregar os nomes dos compradores:',
            perfisError
          );
        } else {
          nomesCompradores = new Map(
            (perfis ?? []).map((perfil) => [
              perfil.id,
              perfil.nome || 'Cliente',
            ])
          );
        }
      }

      const itensPorPedido = new Map<string, ItemPedido[]>();

      for (const item of itens) {
        const produto = produtoPorId.get(item.produto_id);

        if (!produto) continue;

        const itemFormatado: ItemPedido = {
          id: item.id,
          nome: produto.nome,
          quantidade: Number(item.quantidade ?? 0),
          unidade: produto.unidade,
          precoUnitario: Number(item.preco_unitario ?? 0),
        };

        const listaAtual = itensPorPedido.get(item.pedido_id) ?? [];
        listaAtual.push(itemFormatado);
        itensPorPedido.set(item.pedido_id, listaAtual);
      }

      const pedidosFormatados: PedidoProdutor[] = pedidosBanco
        .map((pedido) => {
          const itensDoProdutor = itensPorPedido.get(pedido.id) ?? [];

          const totalDoProdutor = itensDoProdutor.reduce(
            (soma, item) => soma + item.quantidade * item.precoUnitario,
            0
          );

          const dataHora = formatarDataHora(pedido.created_at);

          return {
            id: pedido.id,
            numero: gerarNumeroPedido(pedido.id),
            cliente:
              nomesCompradores.get(pedido.comprador_id) ?? 'Cliente',
            data: dataHora.data,
            hora: dataHora.hora,
            status: normalizarStatus(pedido.status),
            tipoRecebimento:
              pedido.tipo_recebimento || 'Não informado',
            total: totalDoProdutor,
            itens: itensDoProdutor,
          };
        })
        .filter((pedido) => pedido.itens.length > 0);

      setPedidos(pedidosFormatados);
    } catch (error) {
      console.log('Erro ao carregar pedidos do produtor:', error);
      setPedidos([]);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  const pedidosNovos = pedidos.filter(
    (pedido) => pedido.status === 'Novo'
  );

  const pedidosFiltrados =
    filtro === 'Todos'
      ? pedidos
      : pedidos.filter((pedido) => pedido.status === filtro);

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function getStatusStyle(status: StatusPedido) {
    switch (status) {
      case 'Novo':
        return styles.statusNovo;
      case 'Confirmado':
        return styles.statusConfirmado;
      case 'Em preparo':
        return styles.statusPreparo;
      case 'Pronto':
        return styles.statusPronto;
      case 'Concluído':
        return styles.statusConcluido;
      case 'Cancelado':
        return styles.statusCancelado;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/area-produtor/inicio')}
        >
          <Ionicons name="arrow-back" size={24} color="#004B0A" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>Pedidos</Text>
          <Text style={styles.subtitle}>Acompanhe suas vendas</Text>
        </View>

        <View style={styles.newOrdersBadge}>
          <Text style={styles.newOrdersNumber}>{pedidosNovos.length}</Text>
          <Text style={styles.newOrdersText}>novos</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Ionicons name="receipt-outline" size={26} color="#004B0A" />
        </View>

        <View style={styles.summaryInfo}>
          <Text style={styles.summaryTitle}>{pedidos.length} pedidos</Text>

          <Text style={styles.summaryText}>
            {pedidosNovos.length === 0
              ? 'Nenhum pedido novo no momento.'
              : `${pedidosNovos.length} aguardando sua confirmação.`}
          </Text>
        </View>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filtros.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                filtro === item && styles.filterButtonActive,
              ]}
              onPress={() => setFiltro(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filtro === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarPedidos(true)}
            tintColor="#004B0A"
            colors={['#004B0A']}
          />
        }
      >
        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004B0A" />
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : pedidosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={55}
              color="#AAB7AC"
            />

            <Text style={styles.emptyTitle}>Nenhum pedido</Text>

            <Text style={styles.emptyText}>
              Não há pedidos com esse status.
            </Text>
          </View>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <TouchableOpacity
              key={pedido.id}
              style={styles.orderCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/area-produtor/pedido/[id]',
                  params: { id: pedido.id },
                })
              }
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>{pedido.numero}</Text>
                  <Text style={styles.orderDate}>
                    {pedido.data} • {pedido.hora}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(pedido.status),
                  ]}
                >
                  <Text style={styles.statusText}>{pedido.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.customerRow}>
                <View style={styles.customerIcon}>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color="#004B0A"
                  />
                </View>

                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{pedido.cliente}</Text>

                  <Text style={styles.itemsText}>
                    {pedido.itens
                      .map(
                        (item) =>
                          `${item.quantidade} ${item.unidade} de ${item.nome}`
                      )
                      .join(' • ')}
                  </Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.deliveryRow}>
                  <Ionicons
                    name={
                      pedido.tipoRecebimento === 'Retirada'
                        ? 'storefront-outline'
                        : 'bicycle-outline'
                    }
                    size={15}
                    color="#666666"
                  />

                  <Text style={styles.deliveryText}>
                    {pedido.tipoRecebimento}
                  </Text>
                </View>

                <View style={styles.totalArea}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatarPreco(pedido.total)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsText}>
                  Ver detalhes do pedido
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#004B0A"
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace('/area-produtor/inicio')}
        >
          <Ionicons name="home-outline" size={23} color="#777777" />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace('/area-produtor/produtos')}
        >
          <Ionicons name="basket-outline" size={23} color="#777777" />
          <Text style={styles.navText}>Produtos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="receipt" size={23} color="#004B0A" />
          <Text style={styles.navTextActive}>Pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/area-produtor/nova-publicacao')}
        >
          <View style={styles.publishNavButton}>
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.navText}>Publicar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/area-produtor/perfil')}
        >
          <Ionicons name="person-outline" size={23} color="#777777" />
          <Text style={styles.navText}>Perfil</Text>
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



  newOrdersBadge: {

    minWidth: 52,

    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: 10,

    backgroundColor: '#EAF3EB',

    alignItems: 'center',

  },



  newOrdersNumber: {

    fontSize: 16,

    fontWeight: 'bold',

    color: '#004B0A',

  },



  newOrdersText: {

    fontSize: 8,

    color: '#557159',

  },



  summary: {

    marginHorizontal: 18,

    marginTop: 18,

    padding: 14,

    borderRadius: 13,

    backgroundColor: '#F0F6F1',

    flexDirection: 'row',

    alignItems: 'center',

  },



  summaryIcon: {

    width: 48,

    height: 48,

    borderRadius: 13,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

  },



  summaryInfo: {

    flex: 1,

    marginLeft: 12,

  },



  summaryTitle: {

    fontSize: 14,

    fontWeight: 'bold',

    color: '#004B0A',

  },



  summaryText: {

    fontSize: 9,

    color: '#5C6F5E',

    marginTop: 3,

  },



  filters: {

    paddingHorizontal: 18,

    paddingVertical: 17,

    gap: 8,

  },



  filterButton: {

    paddingHorizontal: 13,

    paddingVertical: 8,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: '#DDDDDD',

    backgroundColor: '#FFFFFF',

  },



  filterButtonActive: {

    backgroundColor: '#004B0A',

    borderColor: '#004B0A',

  },



  filterText: {

    fontSize: 10,

    color: '#666666',

  },



  filterTextActive: {

    color: '#FFFFFF',

    fontWeight: '600',

  },



  content: {

    paddingHorizontal: 18,

    paddingBottom: 110,

  },



  orderCard: {

    borderWidth: 1,

    borderColor: '#E5E5E5',

    borderRadius: 13,

    padding: 14,

    marginBottom: 12,

  },



  orderHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },



  orderNumber: {

    fontSize: 13,

    fontWeight: 'bold',

  },



  orderDate: {

    fontSize: 9,

    color: '#777777',

    marginTop: 3,

  },



  statusBadge: {

    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: 10,

  },



  statusNovo: {

    backgroundColor: '#EAF3EB',

  },



  statusConfirmado: {

    backgroundColor: '#E8F1FF',

  },



  statusPreparo: {

    backgroundColor: '#FFF3D6',

  },



  statusPronto: {

    backgroundColor: '#E9F7ED',

  },



  statusConcluido: {

    backgroundColor: '#EEEEEE',

  },



  statusCancelado: {

    backgroundColor: '#FFE8E6',

  },



  statusText: {

    fontSize: 8,

    fontWeight: '600',

    color: '#444444',

  },



  divider: {

    height: 1,

    backgroundColor: '#EEEEEE',

    marginVertical: 12,

  },



  customerRow: {

    flexDirection: 'row',

    alignItems: 'center',

  },



  customerIcon: {

    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: '#F0F6F1',

    alignItems: 'center',

    justifyContent: 'center',

  },



  customerInfo: {

    flex: 1,

    marginLeft: 10,

  },



  customerName: {

    fontSize: 12,

    fontWeight: '600',

  },



  itemsText: {

    fontSize: 9,

    color: '#777777',

    lineHeight: 13,

    marginTop: 3,

  },



  orderFooter: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-end',

    marginTop: 13,

  },



  deliveryRow: {

    flexDirection: 'row',

    alignItems: 'center',

  },



  deliveryText: {

    fontSize: 9,

    color: '#666666',

    marginLeft: 4,

  },



  totalArea: {

    alignItems: 'flex-end',

  },



  totalLabel: {

    fontSize: 8,

    color: '#777777',

  },



  totalValue: {

    fontSize: 14,

    fontWeight: 'bold',

    color: '#004B0A',

    marginTop: 1,

  },



  detailsRow: {

    marginTop: 12,

    paddingTop: 10,

    borderTopWidth: 1,

    borderTopColor: '#F1F1F1',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },



  detailsText: {

    fontSize: 10,

    color: '#004B0A',

    fontWeight: '600',

  },



  emptyContainer: {

    alignItems: 'center',

    paddingTop: 70,

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


  loadingContainer: {
    alignItems: 'center',
    paddingTop: 70,
  },

  loadingText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 10,
  },

});