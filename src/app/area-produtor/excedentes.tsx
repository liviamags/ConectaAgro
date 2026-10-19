import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type FiltroExcedente =
  | 'Todos'
  | 'Ativos'
  | 'Encerrados';

type Excedente = {
  id: string;
  produtor_id: string;
  produto_id: string;
  quantidade: number;
  preco_promocional: number;
  data_validade: string | null;
  observacao: string | null;
  ativo: boolean;
  created_at: string;
  produto: {
    nome: string;
    categoria: string | null;
    preco: number;
    unidade: string | null;
    imagem_url: string | null;
  };
};

export default function ExcedentesProdutorScreen() {
  const [excedentes, setExcedentes] = useState<Excedente[]>([]);
  const [filtro, setFiltro] = useState<FiltroExcedente>('Todos');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [alterandoId, setAlterandoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const carregarExcedentes = useCallback(async (modoAtualizacao = false) => {
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
        Alert.alert(
          'Sessão não encontrada',
          'Entre novamente para visualizar seus excedentes.'
        );
        return;
      }

      const { data, error } = await supabase
        .from('excedentes')
        .select(`
          id,
          produtor_id,
          produto_id,
          quantidade,
          preco_promocional,
          data_validade,
          observacao,
          ativo,
          created_at,
          produto:produtos!excedentes_produto_id_fkey (
            nome,
            categoria,
            preco,
            unidade,
            imagem_url
          )
        `)
        .eq('produtor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Erro ao carregar excedentes:', error);
        Alert.alert(
          'Erro',
          'Não foi possível carregar seus excedentes.'
        );
        return;
      }

      const lista: Excedente[] = (data ?? [])
        .filter((item: any) => item.produto)
        .map((item: any) => {
          const produtoRelacionado = Array.isArray(item.produto)
            ? item.produto[0]
            : item.produto;

          return {
            id: item.id,
            produtor_id: item.produtor_id,
            produto_id: item.produto_id,
            quantidade: Number(item.quantidade ?? 0),
            preco_promocional: Number(item.preco_promocional ?? 0),
            data_validade: item.data_validade ?? null,
            observacao: item.observacao ?? null,
            ativo: item.ativo === true,
            created_at: item.created_at,
            produto: {
              nome: produtoRelacionado.nome,
              categoria: produtoRelacionado.categoria ?? null,
              preco: Number(produtoRelacionado.preco ?? 0),
              unidade: produtoRelacionado.unidade ?? null,
              imagem_url: produtoRelacionado.imagem_url ?? null,
            },
          };
        });

      setExcedentes(lista);
    } catch (error) {
      console.log('Erro inesperado ao carregar excedentes:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao carregar seus excedentes.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarExcedentes();
    }, [carregarExcedentes])
  );

  const excedentesAtivos = excedentes.filter(
    (excedente) => excedente.ativo
  );

  const excedentesFiltrados =
    filtro === 'Ativos'
      ? excedentes.filter((excedente) => excedente.ativo)
      : filtro === 'Encerrados'
        ? excedentes.filter((excedente) => !excedente.ativo)
        : excedentes;

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function calcularDesconto(
    precoOriginal: number,
    precoExcedente: number
  ) {
    if (precoOriginal <= 0) {
      return 0;
    }

    return Math.round(
      ((precoOriginal - precoExcedente) / precoOriginal) * 100
    );
  }

  function formatarQuantidade(valor: number) {
    return valor.toLocaleString('pt-BR', {
      maximumFractionDigits: 2,
    });
  }

  function formatarData(data: string | null) {
    if (!data) {
      return 'Não informada';
    }

    const partes = data.split('-');

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function confirmarExclusao(excedente: Excedente) {
    if (excluindoId || alterandoId) {
      return;
    }

    Alert.alert(
      'Excluir excedente',
      `Tem certeza de que deseja excluir o excedente de ${excedente.produto.nome}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirExcedente(excedente),
        },
      ]
    );
  }

  async function excluirExcedente(excedente: Excedente) {
    setExcluindoId(excedente.id);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Sua sessão não foi encontrada.');
      }

      const { error } = await supabase
        .from('excedentes')
        .delete()
        .eq('id', excedente.id)
        .eq('produtor_id', user.id);

      if (error) {
        throw error;
      }

      setExcedentes((listaAtual) =>
        listaAtual.filter((item) => item.id !== excedente.id)
      );

      Alert.alert(
        'Excedente excluído',
        'O excedente foi excluído com sucesso.'
      );
    } catch (error) {
      console.log('Erro ao excluir excedente:', error);
      Alert.alert(
        'Erro',
        'Não foi possível excluir o excedente.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  async function alternarExcedenteAtivo(
    excedente: Excedente,
    novoValor: boolean
  ) {
    if (alterandoId || excluindoId) {
      return;
    }

    const valorAnterior = excedente.ativo;
    setAlterandoId(excedente.id);

    setExcedentes((listaAtual) =>
      listaAtual.map((item) =>
        item.id === excedente.id
          ? { ...item, ativo: novoValor }
          : item
      )
    );

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Sua sessão não foi encontrada.');
      }

      const { error } = await supabase
        .from('excedentes')
        .update({ ativo: novoValor })
        .eq('id', excedente.id)
        .eq('produtor_id', user.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.log('Erro ao alterar excedente:', error);

      setExcedentes((listaAtual) =>
        listaAtual.map((item) =>
          item.id === excedente.id
            ? { ...item, ativo: valorAnterior }
            : item
        )
      );

      Alert.alert(
        'Erro',
        'Não foi possível alterar o status do excedente.'
      );
    } finally {
      setAlterandoId(null);
    }
  }

  if (carregando) {
    return (
      <View
        style={[
          styles.container,
          {
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color="#004B0A" />
        <Text style={{ marginTop: 10, color: '#777777', fontSize: 10 }}>
          Carregando excedentes...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/area-produtor/inicio')}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            Meus excedentes
          </Text>

          <Text style={styles.subtitle}>
            Gerencie ofertas para evitar desperdícios
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={() =>
            router.push('/area-produtor/adicionar-excedente')
          }
        >
          <Ionicons
            name="add"
            size={25}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {excedentes.length}
          </Text>
          <Text style={styles.summaryLabel}>
            Cadastrados
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {excedentesAtivos.length}
          </Text>
          <Text style={styles.summaryLabel}>
            Ativos
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {excedentes.length - excedentesAtivos.length}
          </Text>
          <Text style={styles.summaryLabel}>
            Encerrados
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        {(
          ['Todos', 'Ativos', 'Encerrados'] as FiltroExcedente[]
        ).map((item) => (
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarExcedentes(true)}
            colors={['#004B0A']}
            tintColor="#004B0A"
          />
        }
      >
        <TouchableOpacity
          style={styles.createCard}
          onPress={() =>
            router.push('/area-produtor/adicionar-excedente')
          }
        >
          <View style={styles.createIcon}>
            <Ionicons
              name="leaf-outline"
              size={25}
              color="#004B0A"
            />
          </View>

          <View style={styles.createInfo}>
            <Text style={styles.createTitle}>
              Criar novo excedente
            </Text>
            <Text style={styles.createText}>
              Ofereça produtos excedentes com preço especial e reduza desperdícios.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#004B0A"
          />
        </TouchableOpacity>

        {excedentesFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="leaf-outline"
              size={55}
              color="#AAB7AC"
            />
            <Text style={styles.emptyTitle}>
              Nenhum excedente
            </Text>
            <Text style={styles.emptyText}>
              Não há excedentes nessa categoria.
            </Text>
          </View>
        ) : (
          excedentesFiltrados.map((excedente) => {
            const desconto = calcularDesconto(
              excedente.produto.preco,
              excedente.preco_promocional
            );

            return (
              <View
                key={excedente.id}
                style={styles.excedenteCard}
              >
                <View style={styles.cardTop}>
                  {excedente.produto.imagem_url ? (
                    <Image
                      source={{
                        uri: excedente.produto.imagem_url,
                      }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.productImage,
                        styles.productImagePlaceholder,
                      ]}
                    >
                      <Ionicons
                        name="image-outline"
                        size={29}
                        color="#A7B8A9"
                      />
                    </View>
                  )}

                  <View style={styles.productInfo}>
                    <View style={styles.nameRow}>
                      <Text
                        style={styles.productName}
                        numberOfLines={1}
                      >
                        {excedente.produto.nome}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          excedente.ativo
                            ? styles.activeBadge
                            : styles.inactiveBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            excedente.ativo
                              ? styles.activeText
                              : styles.inactiveText,
                          ]}
                        >
                          {excedente.ativo
                            ? 'Ativo'
                            : 'Encerrado'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.category}>
                      {excedente.produto.categoria || 'Sem categoria'}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.oldPrice}>
                        {formatarPreco(excedente.produto.preco)}
                      </Text>

                      <Text style={styles.newPrice}>
                        {formatarPreco(excedente.preco_promocional)}
                        /{excedente.produto.unidade || 'unidade'}
                      </Text>
                    </View>

                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {desconto}% de desconto
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsArea}>
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="cube-outline"
                      size={17}
                      color="#004B0A"
                    />
                    <View>
                      <Text style={styles.detailLabel}>
                        Disponível
                      </Text>
                      <Text style={styles.detailValue}>
                        {formatarQuantidade(excedente.quantidade)}{' '}
                        {excedente.produto.unidade || 'unidade'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color="#004B0A"
                    />
                    <View>
                      <Text style={styles.detailLabel}>
                        Validade
                      </Text>
                      <Text style={styles.detailValue}>
                        {formatarData(excedente.data_validade)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>
                    Motivo
                  </Text>
                  <Text style={styles.reasonText}>
                    {excedente.observacao || 'Não informado.'}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <View style={styles.switchArea}>
                    {alterandoId === excedente.id ? (
                      <ActivityIndicator
                        size="small"
                        color="#004B0A"
                      />
                    ) : (
                      <Switch
                        value={excedente.ativo}
                        onValueChange={(valor) =>
                          alternarExcedenteAtivo(
                            excedente,
                            valor
                          )
                        }
                        disabled={excluindoId === excedente.id}
                        trackColor={{
                          false: '#D5D5D5',
                          true: '#91B895',
                        }}
                        thumbColor={
                          excedente.ativo
                            ? '#004B0A'
                            : '#F4F4F4'
                        }
                      />
                    )}

                    <Text style={styles.switchText}>
                      {excedente.ativo
                        ? 'Oferta ativa'
                        : 'Oferta encerrada'}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() =>
                        router.push({
                          pathname:
                            '/area-produtor/editar-excedente/[id]',
                          params: {
                            id: excedente.id,
                          },
                        })
                      }
                      disabled={
                        excluindoId === excedente.id ||
                        alterandoId === excedente.id
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#004B0A"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        confirmarExclusao(excedente)
                      }
                      disabled={
                        excluindoId === excedente.id ||
                        alterandoId === excedente.id
                      }
                    >
                      {excluindoId === excedente.id ? (
                        <ActivityIndicator
                          size="small"
                          color="#B42318"
                        />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#B42318"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace('/area-produtor/inicio')
          }
        >
          <Ionicons
            name="home-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace('/area-produtor/produtos')
          }
        >
          <Ionicons
            name="basket-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>Produtos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace('/area-produtor/pedidos')
          }
        >
          <Ionicons
            name="receipt-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>Pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push('/area-produtor/nova-publicacao')
          }
        >
          <View style={styles.publishNavButton}>
            <Ionicons
              name="add"
              size={26}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.navText}>Publicar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push('/area-produtor/perfil')
          }
        >
          <Ionicons
            name="person-outline"
            size={23}
            color="#777777"
          />
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

    fontSize: 9,

    color: '#777777',

    marginTop: 2,

  },



  addHeaderButton: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: '#004B0A',

    alignItems: 'center',

    justifyContent: 'center',

  },



  summaryContainer: {

    flexDirection: 'row',

    paddingHorizontal: 18,

    paddingTop: 17,

    gap: 9,

  },



  summaryCard: {

    flex: 1,

    paddingVertical: 13,

    borderRadius: 11,

    backgroundColor: '#F0F6F1',

    alignItems: 'center',

  },



  summaryNumber: {

    fontSize: 18,

    fontWeight: 'bold',

    color: '#004B0A',

  },



  summaryLabel: {

    fontSize: 8,

    color: '#666666',

    marginTop: 3,

  },



  filters: {

    flexDirection: 'row',

    paddingHorizontal: 18,

    paddingVertical: 15,

    gap: 8,

  },



  filterButton: {

    paddingHorizontal: 15,

    paddingVertical: 8,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: '#DDDDDD',

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



  createCard: {

    padding: 13,

    borderRadius: 12,

    backgroundColor: '#F0F6F1',

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 15,

  },



  createIcon: {

    width: 43,

    height: 43,

    borderRadius: 12,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

  },



  createInfo: {

    flex: 1,

    marginLeft: 10,

  },



  createTitle: {

    fontSize: 11,

    fontWeight: 'bold',

    color: '#004B0A',

  },



  createText: {

    fontSize: 8,

    color: '#647266',

    lineHeight: 12,

    marginTop: 3,

  },



  excedenteCard: {

    borderWidth: 1,

    borderColor: '#E5E5E5',

    borderRadius: 14,

    padding: 13,

    marginBottom: 14,

  },



  cardTop: {

    flexDirection: 'row',

  },



  productImage: {

    width: 91,

    height: 91,

    borderRadius: 12,

  },



  productImagePlaceholder: {
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productInfo: {

    flex: 1,

    marginLeft: 12,

  },



  nameRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },



  productName: {

    fontSize: 15,

    fontWeight: 'bold',

  },



  statusBadge: {

    paddingHorizontal: 7,

    paddingVertical: 4,

    borderRadius: 8,

  },



  activeBadge: {

    backgroundColor: '#EAF3EB',

  },



  inactiveBadge: {

    backgroundColor: '#EEEEEE',

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



  category: {

    fontSize: 9,

    color: '#777777',

    marginTop: 3,

  },



  priceRow: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 8,

    gap: 7,

  },



  oldPrice: {

    fontSize: 9,

    color: '#999999',

    textDecorationLine: 'line-through',

  },



  newPrice: {

    fontSize: 13,

    color: '#004B0A',

    fontWeight: 'bold',

  },



  discountBadge: {

    alignSelf: 'flex-start',

    marginTop: 5,

    paddingHorizontal: 7,

    paddingVertical: 3,

    borderRadius: 6,

    backgroundColor: '#FFF0D7',

  },



  discountText: {

    fontSize: 8,

    color: '#8A5700',

    fontWeight: '600',

  },



  detailsArea: {

    flexDirection: 'row',

    marginTop: 13,

    paddingVertical: 11,

    borderTopWidth: 1,

    borderBottomWidth: 1,

    borderColor: '#EEEEEE',

  },



  detailItem: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 7,

  },



  detailLabel: {

    fontSize: 8,

    color: '#888888',

  },



  detailValue: {

    fontSize: 9,

    fontWeight: '600',

    marginTop: 2,

  },



  reasonBox: {

    paddingVertical: 11,

  },



  reasonLabel: {

    fontSize: 8,

    color: '#888888',

  },



  reasonText: {

    fontSize: 9,

    color: '#555555',

    marginTop: 3,

    lineHeight: 13,

  },



  actionsRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingTop: 8,

    borderTopWidth: 1,

    borderTopColor: '#EEEEEE',

  },



  switchArea: {

    flexDirection: 'row',

    alignItems: 'center',

  },



  switchText: {

    fontSize: 9,

    color: '#555555',

    marginLeft: 5,

  },



  actionButtons: {

    flexDirection: 'row',

    gap: 7,

  },



  editButton: {

    width: 37,

    height: 37,

    borderRadius: 9,

    backgroundColor: '#F0F6F1',

    alignItems: 'center',

    justifyContent: 'center',

  },



  deleteButton: {

    width: 37,

    height: 37,

    borderRadius: 9,

    backgroundColor: '#FFF1F0',

    alignItems: 'center',

    justifyContent: 'center',

  },



  emptyContainer: {

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