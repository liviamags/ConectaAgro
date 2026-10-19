import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

type Produto = {
  id: string;
  nome: string;
  produtor_id: string;
  nome_produtor: string;
  preco: number;
  unidade: string;
  imagem_url: string | null;
  estoque: number | null;
};

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregarProdutos = useCallback(async () => {
    try {
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          produtor_id,
          preco,
          unidade,
          imagem_url,
          estoque
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (produtosError) {
        console.log('Erro ao carregar produtos:', produtosError);
        return;
      }

      const produtosEncontrados = produtosData ?? [];

      const idsProdutores = [
        ...new Set(
          produtosEncontrados.map((produto) => produto.produtor_id)
        ),
      ];

      let nomesProdutores = new Map<string, string>();

      if (idsProdutores.length > 0) {
        const { data: produtoresData, error: produtoresError } =
          await supabase
            .from('produtores')
            .select('id, nome_fazenda')
            .in('id', idsProdutores);

        if (produtoresError) {
          console.log('Erro ao carregar produtores:', produtoresError);
        } else {
          nomesProdutores = new Map(
            (produtoresData ?? []).map((produtor) => [
              produtor.id,
              produtor.nome_fazenda,
            ])
          );
        }
      }

      const produtosFormatados: Produto[] = produtosEncontrados.map(
        (produto) => ({
          id: produto.id,
          nome: produto.nome,
          produtor_id: produto.produtor_id,
          nome_produtor:
            nomesProdutores.get(produto.produtor_id) ?? 'Produtor local',
          preco: Number(produto.preco),
          unidade: produto.unidade ?? 'kg',
          imagem_url: produto.imagem_url,
          estoque:
            produto.estoque === null
              ? null
              : Number(produto.estoque),
        })
      );

      setProdutos(produtosFormatados);
    } catch (error) {
      console.log('Erro inesperado ao carregar produtos:', error);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregarProdutos();
    }, [carregarProdutos])
  );

  async function atualizarProdutos() {
    setAtualizando(true);
    await carregarProdutos();
  }

  function formatarPreco(preco: number, unidade: string) {
    const valor = preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return `${valor} / ${unidade}`;
  }

  function formatarEstoque(
    estoque: number | null,
    unidade: string
  ) {
    if (estoque === null) {
      return 'Estoque sob consulta';
    }

    if (estoque <= 0) {
      return 'Esgotado';
    }

    const quantidade = estoque.toLocaleString('pt-BR', {
      maximumFractionDigits: 2,
    });

    return `${quantidade} ${unidade} disponíveis`;
  }

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return true;
    }

    return (
      produto.nome.toLowerCase().includes(termo) ||
      produto.nome_produtor.toLowerCase().includes(termo)
    );
  });

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Produtos</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarProdutos}
            tintColor="#004B0A"
            colors={['#004B0A']}
          />
        }
      >
        {/* PESQUISA */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#555555"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produtos..."
            placeholderTextColor="#888888"
            value={pesquisa}
            onChangeText={setPesquisa}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Produtos disponíveis
        </Text>

        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#004B0A"
            />

            <Text style={styles.loadingText}>
              Carregando produtos...
            </Text>
          </View>
        ) : produtosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="leaf-outline"
              size={45}
              color="#004B0A"
            />

            <Text style={styles.emptyTitle}>
              Nenhum produto encontrado
            </Text>

            <Text style={styles.emptyText}>
              Os produtos disponíveis aparecerão aqui.
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {produtosFiltrados.map((produto) => (
              <TouchableOpacity
                key={produto.id}
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(`/produto/${produto.id}`)
                }
              >
                {produto.imagem_url ? (
                  <Image
                    source={{ uri: produto.imagem_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="leaf-outline"
                      size={38}
                      color="#004B0A"
                    />
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text
                    style={styles.productName}
                    numberOfLines={1}
                  >
                    {produto.nome}
                  </Text>

                  <View style={styles.producerRow}>
                    <Ionicons
                      name="person-outline"
                      size={12}
                      color="#666666"
                    />

                    <Text
                      style={styles.producerName}
                      numberOfLines={1}
                    >
                      {produto.nome_produtor}
                    </Text>
                  </View>

                  <Text style={styles.productPrice}>
                    {formatarPreco(
                      produto.preco,
                      produto.unidade
                    )}
                  </Text>

                  {/* QUANTIDADE DISPONÍVEL EM ESTOQUE */}
                  <View style={styles.stockRow}>
                    <Ionicons
                      name={
                        produto.estoque !== null &&
                        produto.estoque <= 0
                          ? 'close-circle-outline'
                          : 'cube-outline'
                      }
                      size={14}
                      color={
                        produto.estoque !== null &&
                        produto.estoque <= 0
                          ? '#C62828'
                          : '#004B0A'
                      }
                    />

                    <Text
                      style={[
                        styles.stockText,
                        produto.estoque !== null &&
                          produto.estoque <= 0 &&
                          styles.stockTextEmpty,
                      ]}
                      numberOfLines={2}
                    >
                      {formatarEstoque(
                        produto.estoque,
                        produto.unidade
                      )}
                    </Text>
                  </View>

                  <View style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>
                      Ver produto
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 40,
    color: '#004B0A',
    lineHeight: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSpace: {
    width: 40,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#777777',
    borderRadius: 7,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 125,
  },
  imagePlaceholder: {
    width: '100%',
    height: 125,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  producerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  producerName: {
    flex: 1,
    fontSize: 10,
    color: '#666666',
    marginLeft: 4,
  },
  productPrice: {
    fontSize: 13,
    color: '#004B0A',
    fontWeight: 'bold',
    marginTop: 7,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 5,
  },
  stockText: {
    flex: 1,
    fontSize: 11,
    color: '#004B0A',
    fontWeight: '500',
  },
  stockTextEmpty: {
    color: '#C62828',
  },
  detailsButton: {
    backgroundColor: '#004B0A',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#666666',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  emptyText: {
    marginTop: 5,
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
  },
});