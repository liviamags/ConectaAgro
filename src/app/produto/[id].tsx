import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAfiliacao } from '../../context/AfiliacaoContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  produtor_id: string;
  produtor: string;
  preco: number;
  unidade: string;
  estoque: number | null;
  imagem_url: string | null;
  comissao: number;
};

export default function ProdutoScreen() {
  const { id } = useLocalSearchParams();
  const produtoId = String(id ?? '');
  const { adicionarProduto } = useCart();
  const { adicionarAfiliacao, estaAfiliado, buscarAfiliacao } = useAfiliacao();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const afiliado = estaAfiliado('produto', produtoId);
  const afiliacao = buscarAfiliacao('produto', produtoId);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarProduto() {
        if (!produtoId) {
          setErro('Produto não encontrado.');
          setCarregando(false);
          return;
        }

        setCarregando(true);
        setErro('');
        setQuantidade(1);

        try {
          const { data: produtoData, error: produtoError } = await supabase
            .from('produtos')
            .select(
              'id, nome, descricao, categoria, produtor_id, preco, unidade, estoque, imagem_url, ativo'
            )
            .eq('id', produtoId)
            .eq('ativo', true)
            .single();

          if (produtoError || !produtoData) {
            console.log('Erro ao carregar produto:', produtoError);
            if (ativo) {
              setErro('Não foi possível encontrar este produto.');
            }
            return;
          }

          let nomeProdutor = 'Produtor local';

          const { data: produtorData, error: produtorError } = await supabase
            .from('produtores')
            .select('nome_fazenda')
            .eq('id', produtoData.produtor_id)
            .maybeSingle();

          if (produtorError) {
            console.log('Erro ao carregar produtor:', produtorError);
          }

          if (produtorData?.nome_fazenda) {
            nomeProdutor = produtorData.nome_fazenda;
          }

          if (ativo) {
            setProduto({
              id: produtoData.id,
              nome: produtoData.nome,
              descricao: produtoData.descricao ?? null,
              categoria: produtoData.categoria ?? null,
              produtor_id: produtoData.produtor_id,
              produtor: nomeProdutor,
              preco: Number(produtoData.preco),
              unidade: produtoData.unidade || 'kg',
              estoque:
                produtoData.estoque === null
                  ? null
                  : Number(produtoData.estoque),
              imagem_url: produtoData.imagem_url ?? null,
              comissao: 10,
            });
          }
        } catch (error) {
          console.log('Erro inesperado ao carregar produto:', error);
          if (ativo) {
            setErro('Ocorreu um erro ao carregar o produto.');
          }
        } finally {
          if (ativo) {
            setCarregando(false);
          }
        }
      }

      carregarProduto();

      return () => {
        ativo = false;
      };
    }, [produtoId])
  );

  function formatarPreco(valor: number, unidade: string) {
    const valorFormatado = valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return `${valorFormatado} / ${unidade}`;
  }

  function adicionarAoCarrinho() {
    if (!produto) return;

    if (
      produto.estoque !== null &&
      (produto.estoque < 1 || quantidade > produto.estoque)
    ) {
      Alert.alert(
        'Estoque insuficiente',
        'A quantidade escolhida não está disponível.'
      );
      return;
    }

    adicionarProduto({
      id: produto.id,
      nome: produto.nome,
      produtor: produto.produtor,
      preco: produto.preco,
      quantidade,
      imagem: produto.imagem_url
        ? { uri: produto.imagem_url }
        : require('../../../assets/images/tomate.jpg'),
    });

    router.push('/carrinho');
  }

  function afiliar() {
    if (!produto) return;

    if (afiliado) {
      router.push('/afiliacoes');
      return;
    }

    adicionarAfiliacao({
      tipo: 'produto',
      entidadeId: produto.id,
      nome: produto.nome,
      produtor: produto.produtor,
      comissao: produto.comissao,
      imagem: produto.imagem_url
        ? { uri: produto.imagem_url }
        : require('../../../assets/images/tomate.jpg'),
    });

    Alert.alert(
      'Afiliação criada!',
      `Você agora pode divulgar ${produto.nome} e receber ${produto.comissao}% de comissão nas vendas geradas pela sua indicação.`
    );
  }

  async function compartilhar() {
    if (!produto || !afiliacao) return;

    await Share.share({
      message:
        `Conheça ${produto.nome} de ${produto.produtor} no ConectaAgro! ` +
        `Use meu código ${afiliacao.codigo} para comprar. 🌱`,
    });
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004B0A" />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }

  if (erro || !produto) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Produto não encontrado</Text>
        <Text style={styles.errorText}>
          {erro || 'Não foi possível carregar este produto.'}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const esgotado = produto.estoque !== null && produto.estoque < 1;
  const limiteAtingido =
    produto.estoque !== null && quantidade + 1 > produto.estoque;

  const estoqueTexto =
    produto.estoque === null
      ? 'Estoque sob consulta'
      : esgotado
        ? 'Esgotado'
        : `${produto.estoque.toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          })} ${produto.unidade} disponíveis`;

  const imagemProduto = produto.imagem_url
    ? { uri: produto.imagem_url }
    : require('../../../assets/images/tomate.jpg');

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          <Image source={imagemProduto} style={styles.productImage} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={27}
              color="#004B0A"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.productName}>{produto.nome}</Text>
          <Text style={styles.producer}>{produto.produtor}</Text>

          <Text style={styles.price}>
            {formatarPreco(produto.preco, produto.unidade)}
          </Text>

          {/* ESTOQUE DISPONÍVEL */}
          <View style={styles.stockRow}>
            <Ionicons
              name={esgotado ? 'close-circle-outline' : 'cube-outline'}
              size={17}
              color={esgotado ? '#C62828' : '#004B0A'}
            />
            <Text
              style={[
                styles.stockText,
                esgotado && styles.stockTextEmpty,
              ]}
            >
              {estoqueTexto}
            </Text>
          </View>

          {!!produto.descricao && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Sobre o produto</Text>
              <Text style={styles.description}>{produto.descricao}</Text>
            </>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Quantidade</Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              disabled={quantidade <= 1 || esgotado}
              onPress={() =>
                setQuantidade((atual) => Math.max(1, atual - 1))
              }
            >
              <Ionicons
                name="remove"
                size={20}
                color={quantidade <= 1 || esgotado ? '#AAAAAA' : '#004B0A'}
              />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{quantidade}</Text>

            <TouchableOpacity
              style={styles.quantityButton}
              disabled={esgotado || limiteAtingido}
              onPress={() =>
                setQuantidade((atual) =>
                  produto.estoque === null
                    ? atual + 1
                    : Math.min(atual + 1, Math.floor(produto.estoque))
                )
              }
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  esgotado || limiteAtingido ? '#AAAAAA' : '#004B0A'
                }
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.cartButton,
              esgotado && styles.cartButtonDisabled,
            ]}
            onPress={adicionarAoCarrinho}
            disabled={esgotado}
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.cartButtonText}>
              {esgotado ? 'Produto esgotado' : 'Adicionar ao carrinho'}
            </Text>
          </TouchableOpacity>

          {/* AFILIAÇÃO */}
          <View style={styles.affiliateCard}>
            <View style={styles.affiliateHeader}>
              <View style={styles.affiliateIcon}>
                <Ionicons
                  name="megaphone-outline"
                  size={24}
                  color="#004B0A"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.affiliateTitle}>
                  Ganhe indicando este produto
                </Text>
                <Text style={styles.affiliateText}>
                  Divulgue este produto para outras pessoas e receba uma
                  comissão pelas vendas realizadas através da sua indicação.
                </Text>
              </View>
            </View>

            <View style={styles.commissionRow}>
              <View>
                <Text style={styles.commissionLabel}>Comissão</Text>
                <Text style={styles.commissionValue}>
                  {produto.comissao}% por venda
                </Text>
              </View>

              <Ionicons
                name="cash-outline"
                size={27}
                color="#004B0A"
              />
            </View>

            <TouchableOpacity
              style={styles.affiliateButton}
              onPress={afiliar}
            >
              <Ionicons
                name={
                  afiliado
                    ? 'checkmark-circle'
                    : 'megaphone-outline'
                }
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.affiliateButtonText}>
                {afiliado ? 'Afiliação ativa' : 'Quero me afiliar'}
              </Text>
            </TouchableOpacity>

            {afiliado && afiliacao && (
              <>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>
                    Seu código de indicação
                  </Text>
                  <Text style={styles.codeValue}>
                    {afiliacao.codigo}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={compartilhar}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color="#004B0A"
                  />
                  <Text style={styles.shareButtonText}>
                    Compartilhar produto
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.myAffiliationsButton}
            onPress={() => router.push('/afiliacoes')}
          >
            <Ionicons
              name="wallet-outline"
              size={19}
              color="#004B0A"
            />
            <Text style={styles.myAffiliationsText}>
              Ver minhas afiliações
            </Text>
            <Ionicons
              name="chevron-forward"
              size={19}
              color="#004B0A"
            />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 11,
    color: '#666666',
  },
  scrollContent: {
    paddingBottom: 45,
  },
  imageContainer: {
    height: 310,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 28,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  producer: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  price: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 10,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  stockText: {
    color: '#004B0A',
    fontSize: 13,
    fontWeight: '600',
  },
  stockTextEmpty: {
    color: '#C62828',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 18,
    marginTop: 9,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartButton: {
    height: 50,
    backgroundColor: '#004B0A',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 20,
  },
  cartButtonDisabled: {
    backgroundColor: '#999999',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  affiliateCard: {
    backgroundColor: '#EAF3EB',
    borderRadius: 13,
    padding: 15,
    marginTop: 25,
  },
  affiliateHeader: {
    flexDirection: 'row',
  },
  affiliateIcon: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  affiliateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  affiliateText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 15,
    marginTop: 4,
  },
  commissionRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 9,
    color: '#777777',
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 2,
  },
  affiliateButton: {
    height: 46,
    backgroundColor: '#004B0A',
    borderRadius: 8,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  affiliateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 11,
    marginTop: 10,
  },
  codeLabel: {
    fontSize: 8,
    color: '#777777',
  },
  codeValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 3,
  },
  shareButton: {
    height: 41,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 8,
    marginTop: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  shareButtonText: {
    color: '#004B0A',
    fontWeight: '600',
    fontSize: 11,
  },
  myAffiliationsButton: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 9,
    height: 48,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  myAffiliationsText: {
    flex: 1,
    marginLeft: 8,
    color: '#004B0A',
    fontWeight: '600',
    fontSize: 11,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 8,
    fontSize: 11,
    color: '#777777',
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#004B0A',
    padding: 12,
    borderRadius: 8,
    marginTop: 18,
  },
  errorButtonText: {
    color: '#FFFFFF',
  },
});