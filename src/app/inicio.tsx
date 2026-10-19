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
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNotificacoes } from '../context/NotificacoesContext';
import { supabase } from '../lib/supabase';
type ProdutoDestaque = {
  id: string;
  nome: string;
  produtor_id: string;
  produtor_nome: string;
  preco: number;
  unidade: string;
  imagem_url: string | null;
};
type ProdutorDestaque = {
  id: string;
  nome: string;
  nome_fazenda: string;
  cidade: string;
  estado: string;
  tipo_producao: string;
  imagem_url: string | null;
};
export default function InicioScreen() {
  const [localizacao, setLocalizacao] =
    useState('Contagem, MG');
  const [modalLocalizacao, setModalLocalizacao] =
    useState(false);
  const [produtos, setProdutos] =
    useState<ProdutoDestaque[]>([]);
  const [produtores, setProdutores] =
    useState<ProdutorDestaque[]>([]);
  const [carregandoDestaques, setCarregandoDestaques] =
    useState(true);
  const [atualizando, setAtualizando] =
    useState(false);
  const { quantidadeNaoLidas } =
    useNotificacoes();
  const cidades = [
    'Contagem, MG',
    'Belo Horizonte, MG',
    'Betim, MG',
    'Ibirité, MG',
  ];
  const carregarInicio = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setAtualizando(true);
      } else {
        setCarregandoDestaques(true);
      }
      try {
        const [
          resultadoProdutos,
          resultadoProdutores,
        ] = await Promise.all([
          supabase
            .from('produtos')
            .select(
              'id, nome, produtor_id, preco, unidade, imagem_url'
            )
            .eq('ativo', true)
            .order('created_at', {
              ascending: false,
            })
            .limit(8),
          supabase.rpc(
            'listar_produtores_publicos'
          ),
        ]);
        if (resultadoProdutos.error) {
          console.log(
            'Erro ao carregar produtos da página inicial:',
            resultadoProdutos.error
          );
          setProdutos([]);
        }
        if (resultadoProdutores.error) {
          console.log(
            'Erro ao carregar produtores da página inicial:',
            resultadoProdutores.error
          );
          setProdutores([]);
        }
        const produtoresPublicos =
          resultadoProdutores.data ?? [];
        if (!resultadoProdutores.error) {
          const produtoresFormatados: ProdutorDestaque[] =
            produtoresPublicos
              .slice(0, 8)
              .map((produtor: any) => ({
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
                imagem_url:
                  produtor.imagem_url ??
                  null,
              }));
          setProdutores(
            produtoresFormatados
          );
        }
        if (!resultadoProdutos.error) {
          const produtosFormatados: ProdutoDestaque[] =
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
                  produtor_nome:
                    produtor?.nome_fazenda ||
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
          'Erro inesperado ao carregar página inicial:',
          error
        );
      } finally {
        setCarregandoDestaques(false);
        setAtualizando(false);
      }
    },
    []
  );
  useFocusEffect(
    useCallback(() => {
      carregarInicio();
    }, [carregarInicio])
  );
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
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() =>
              carregarInicio(true)
            }
            tintColor="#004B0A"
            colors={['#004B0A']}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text
              style={styles.welcomeText}
            >
              Olá!
            </Text>
            <Text
              style={styles.headerTitle}
            >
              O que você procura hoje?
            </Text>
          </View>
          <TouchableOpacity
            style={
              styles.notificationButton
            }
            onPress={() =>
              router.push(
                '/notificacoes'
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color="#004B0A"
            />
            {quantidadeNaoLidas >
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
                  {quantidadeNaoLidas >
                  9
                    ? '9+'
                    : quantidadeNaoLidas}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={
            styles.locationContainer
          }
          onPress={() =>
            setModalLocalizacao(
              true
            )
          }
        >
          <Ionicons
            name="location-outline"
            size={18}
            color="#004B0A"
          />
          <View
            style={styles.locationInfo}
          >
            <Text
              style={
                styles.locationLabel
              }
            >
              Sua localização
            </Text>
            <Text
              style={
                styles.locationText
              }
            >
              {localizacao}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color="#666666"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={
            styles.searchContainer
          }
          activeOpacity={0.85}
          onPress={() =>
            router.push('/buscar')
          }
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#777777"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produtos ou produtores..."
            placeholderTextColor="#888888"
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <Image
          source={require('../../assets/images/banner-inicio.jpg')}
          style={styles.banner}
          resizeMode="cover"
        />
        <View
          style={
            styles.shortcutsContainer
          }
        >
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() =>
              router.push(
                '/produtores'
              )
            }
          >
            <View
              style={
                styles.shortcutIcon
              }
            >
              <Ionicons
                name="people-outline"
                size={24}
                color="#004B0A"
              />
            </View>
            <Text
              style={
                styles.shortcutText
              }
            >
              Produtores
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() =>
              router.push(
                '/produtos'
              )
            }
          >
            <View
              style={
                styles.shortcutIcon
              }
            >
              <Ionicons
                name="basket-outline"
                size={24}
                color="#004B0A"
              />
            </View>
            <Text
              style={
                styles.shortcutText
              }
            >
              Produtos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() =>
              router.push(
                '/excedentes'
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
                size={24}
                color="#004B0A"
              />
            </View>
            <Text
              style={
                styles.shortcutText
              }
            >
              Excedentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() =>
              router.push('/mapa')
            }
          >
            <View
              style={
                styles.shortcutIcon
              }
            >
              <Ionicons
                name="map-outline"
                size={24}
                color="#004B0A"
              />
            </View>
            <Text
              style={
                styles.shortcutText
              }
            >
              Mapa
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={
            styles.affiliationCard
          }
          activeOpacity={0.85}
          onPress={() =>
            router.push(
              '/afiliacoes'
            )
          }
        >
          <View
            style={
              styles.affiliationCardIcon
            }
          >
            <Ionicons
              name="megaphone-outline"
              size={28}
              color="#004B0A"
            />
          </View>
          <View
            style={
              styles.affiliationCardContent
            }
          >
            <Text
              style={
                styles.affiliationCardTitle
              }
            >
              Ganhe divulgando produtos locais
            </Text>
            <Text
              style={
                styles.affiliationCardText
              }
            >
              Afilie-se a produtos ou
              produtores, divulgue suas
              indicações e receba comissão
              pelas vendas geradas.
            </Text>
            <Text
              style={
                styles.affiliationCardLink
              }
            >
              Veja como funciona
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#004B0A"
          />
        </TouchableOpacity>
        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Em destaque
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push(
                '/produtos'
              )
            }
          >
            <Text
              style={styles.seeAllText}
            >
              Ver todos
            </Text>
          </TouchableOpacity>
        </View>
        {carregandoDestaques ? (
          <View
            style={
              styles.loadingSection
            }
          >
            <ActivityIndicator
              color="#004B0A"
            />
            <Text
              style={
                styles.loadingSectionText
              }
            >
              Carregando produtos...
            </Text>
          </View>
        ) : produtos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.productsScroll
            }
          >
            {produtos.map(
              (produto) => (
                <TouchableOpacity
                  key={produto.id}
                  style={
                    styles.productCard
                  }
                  activeOpacity={0.85}
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
                        size={31}
                        color="#004B0A"
                      />
                    </View>
                  )}
                  <Text
                    style={
                      styles.productName
                    }
                    numberOfLines={1}
                  >
                    {produto.nome}
                  </Text>
                  <Text
                    style={
                      styles.productProducer
                    }
                    numberOfLines={1}
                  >
                    {
                      produto.produtor_nome
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
                    / {produto.unidade}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        ) : (
          <View
            style={
              styles.emptySection
            }
          >
            <Ionicons
              name="basket-outline"
              size={30}
              color="#7A987D"
            />
            <Text
              style={
                styles.emptySectionText
              }
            >
              Ainda não há produtos
              disponíveis.
            </Text>
          </View>
        )}
        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Produtores em destaque
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push(
                '/produtores'
              )
            }
          >
            <Text
              style={styles.seeAllText}
            >
              Ver todos
            </Text>
          </TouchableOpacity>
        </View>
        {carregandoDestaques ? (
          <View
            style={
              styles.loadingSection
            }
          >
            <ActivityIndicator
              color="#004B0A"
            />
            <Text
              style={
                styles.loadingSectionText
              }
            >
              Carregando produtores...
            </Text>
          </View>
        ) : produtores.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.producersScroll
            }
          >
            {produtores.map(
              (produtor) => (
                <TouchableOpacity
                  key={produtor.id}
                  style={
                    styles.producerCard
                  }
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/produtor/${produtor.id}`
                    )
                  }
                >
                  {produtor.imagem_url ? (
                    <Image
                      source={{
                        uri: produtor.imagem_url,
                      }}
                      style={styles.producerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.producerImagePlaceholder
                      }
                    >
                      <Text
                        style={
                          styles.producerInitials
                        }
                      >
                        {iniciaisProdutor(
                          produtor.nome
                        )}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={
                      styles.producerName
                    }
                    numberOfLines={1}
                  >
                    {produtor.nome}
                  </Text>
                  <Text
                    style={
                      styles.producerProperty
                    }
                    numberOfLines={1}
                  >
                    {
                      produtor.nome_fazenda
                    }
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        ) : (
          <View
            style={
              styles.emptySection
            }
          >
            <Ionicons
              name="people-outline"
              size={30}
              color="#7A987D"
            />
            <Text
              style={
                styles.emptySectionText
              }
            >
              Ainda não há produtores
              cadastrados.
            </Text>
          </View>
        )}
      </ScrollView>
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
            router.push('/buscar')
          }
        >
          <Ionicons
            name="search-outline"
            size={23}
            color="#777777"
          />
          <Text
            style={styles.navText}
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
            size={23}
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
            size={23}
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
      <Modal
        visible={modalLocalizacao}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalLocalizacao(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={
              styles.modalContainer
            }
          >
            <View
              style={styles.modalHeader}
            >
              <Text
                style={styles.modalTitle}
              >
                Escolha sua localização
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setModalLocalizacao(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#000000"
                />
              </TouchableOpacity>
            </View>
            {cidades.map(
              (cidade) => (
                <TouchableOpacity
                  key={cidade}
                  style={
                    styles.cityOption
                  }
                  onPress={() => {
                    setLocalizacao(
                      cidade
                    );
                    setModalLocalizacao(
                      false
                    );
                  }}
                >
                  <View
                    style={
                      styles.cityLeft
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#004B0A"
                    />
                    <Text
                      style={
                        styles.cityText
                      }
                    >
                      {cidade}
                    </Text>
                  </View>
                  {localizacao ===
                    cidade && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#004B0A"
                    />
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 105,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 17,
    padding: 12,
    backgroundColor: '#F7F9F7',
    borderRadius: 9,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 9,
    color: '#777777',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 15,
    height: 47,
    backgroundColor: '#F5F5F5',
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#222222',
  },
  banner: {
    width: '90%',
    height: 150,
    alignSelf: 'center',
    borderRadius: 12,
    marginTop: 17,
  },
  shortcutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 22,
  },
  shortcutItem: {
    alignItems: 'center',
    width: '23%',
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
    fontSize: 10,
    marginTop: 7,
    textAlign: 'center',
  },
  affiliationCard: {
    marginHorizontal: 18,
    marginTop: 22,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#EAF3EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  affiliationCardIcon: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  affiliationCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  affiliationCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  affiliationCardText: {
    fontSize: 10,
    color: '#555555',
    lineHeight: 15,
    marginTop: 4,
  },
  affiliationCardLink: {
    fontSize: 11,
    color: '#004B0A',
    fontWeight: 'bold',
    marginTop: 7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  productsScroll: {
    paddingLeft: 18,
    paddingRight: 6,
  },
  productCard: {
    width: 150,
    marginRight: 12,
  },
  productImage: {
    width: 150,
    height: 110,
    borderRadius: 10,
  },
  productImagePlaceholder: {
    width: 150,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#EDF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 7,
  },
  productProducer: {
    fontSize: 10,
    color: '#777777',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 12,
    color: '#004B0A',
    fontWeight: 'bold',
    marginTop: 5,
  },
  producersScroll: {
    paddingLeft: 18,
    paddingRight: 6,
  },
  producerCard: {
    width: 135,
    marginRight: 12,
  },
  producerImage: {
    width: 135,
    height: 100,
    borderRadius: 10,
  },
  producerImagePlaceholder: {
    width: 135,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#DDEBDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  producerInitials: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  producerName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 7,
  },
  producerProperty: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  loadingSection: {
    minHeight: 115,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSectionText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 8,
  },
  emptySection: {
    marginHorizontal: 18,
    minHeight: 100,
    borderRadius: 10,
    backgroundColor: '#F7F9F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  emptySectionText: {
    fontSize: 10,
    color: '#777777',
    marginTop: 7,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 35,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    marginLeft: 9,
    fontSize: 14,
  },
});
