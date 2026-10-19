import { Ionicons } from '@expo/vector-icons';

import { router, useFocusEffect } from 'expo-router';

import { useCallback, useMemo, useState } from 'react';

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



type Excedente = {

  id: string;

  produtor_id: string;

  produto_id: string;

  quantidade: number;

  preco_promocional: number;

  data_validade: string | null;

  observacao: string | null;

  ativo: boolean;

  produto: {

    nome: string;

    categoria: string | null;

    preco: number;

    unidade: string | null;

    imagem_url: string | null;

  };

  produtor_nome: string;

};



const categorias = [

  'Todos',

  'Hortaliças',

  'Frutas',

  'Legumes',

  'Artesanais',

];



function formatarPreco(valor: number) {

  return `R$ ${valor.toFixed(2).replace('.', ',')}`;

}



function calcularDesconto(precoOriginal: number, precoPromocional: number) {

  if (precoOriginal <= 0 || precoPromocional >= precoOriginal) return 0;

  return Math.round(((precoOriginal - precoPromocional) / precoOriginal) * 100);

}



function formatarValidade(data: string | null) {

  if (!data) return 'Sem validade informada';

  const partes = data.split('-');

  if (partes.length !== 3) return data;

  return `Validade: ${partes[2]}/${partes[1]}/${partes[0]}`;

}



export default function ExcedentesScreen() {

  const [busca, setBusca] = useState('');

  const [categoria, setCategoria] = useState('Todos');

  const [excedentes, setExcedentes] = useState<Excedente[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [atualizando, setAtualizando] = useState(false);

  const [erro, setErro] = useState('');



  const carregarExcedentes = useCallback(async (refresh = false) => {

    try {

      if (refresh) setAtualizando(true);

      else setCarregando(true);



      setErro('');



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

          produto:produtos!excedentes_produto_id_fkey (

            nome,

            categoria,

            preco,

            unidade,

            imagem_url

          )

        `)

        .eq('ativo', true)

        .order('created_at', { ascending: false });



      if (error) {

        console.log('Erro ao carregar excedentes:', error);

        setErro('Não foi possível carregar os excedentes.');

        setExcedentes([]);

        return;

      }



      const produtoresIds = [

        ...new Set((data ?? []).map((item: any) => item.produtor_id)),

      ];



      let nomesPorId: Record<string, string> = {};



      if (produtoresIds.length > 0) {

        const { data: produtoresPublicos, error: produtoresError } =

          await supabase.rpc('listar_produtores_publicos');



        if (produtoresError) {

          console.log('Erro ao carregar produtores:', produtoresError);

        } else {

          (produtoresPublicos ?? []).forEach((produtor: any) => {

            if (produtor.id) {

              nomesPorId[String(produtor.id)] = String(
                produtor.nome ?? 'Produtor local'
              );

            }

          });

        }

      }



      const normalizados: Excedente[] = (data ?? [])

        .map((item: any) => {

          const produto = Array.isArray(item.produto)

            ? item.produto[0]

            : item.produto;



          if (!produto) return null;



          return {

            id: item.id,

            produtor_id: item.produtor_id,

            produto_id: item.produto_id,

            quantidade: Number(item.quantidade),

            preco_promocional: Number(item.preco_promocional),

            data_validade: item.data_validade,

            observacao: item.observacao,

            ativo: item.ativo,

            produto: {

              nome: produto.nome,

              categoria: produto.categoria,

              preco: Number(produto.preco),

              unidade: produto.unidade,

              imagem_url: produto.imagem_url,

            },

            produtor_nome: nomesPorId[item.produtor_id] ?? 'Produtor local',

          };

        })

        .filter(Boolean) as Excedente[];



      setExcedentes(normalizados);

    } catch (e) {

      console.log('Erro inesperado ao carregar excedentes:', e);

      setErro('Não foi possível carregar os excedentes.');

      setExcedentes([]);

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



  const excedentesFiltrados = useMemo(() => {

    const termo = busca.trim().toLowerCase();



    return excedentes.filter((item) => {

      const correspondeBusca =

        termo.length === 0 ||

        item.produto.nome.toLowerCase().includes(termo) ||

        item.produtor_nome.toLowerCase().includes(termo) ||

        (item.produto.categoria ?? '').toLowerCase().includes(termo);



      const correspondeCategoria =

        categoria === 'Todos' ||

        item.produto.categoria === categoria;



      return correspondeBusca && correspondeCategoria;

    });

  }, [busca, categoria, excedentes]);



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



        <View style={styles.headerCenter}>

          <Text style={styles.headerTitle}>

            Excedentes

          </Text>



          <Text style={styles.headerSubtitle}>

            Aproveite mais, desperdice menos

          </Text>

        </View>



        <View style={styles.headerSpace} />

      </View>



      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.scrollContent}

        refreshControl={

          <RefreshControl

            refreshing={atualizando}

            onRefresh={() => carregarExcedentes(true)}

            tintColor="#004B0A"

          />

        }

      >

        <View style={styles.heroCard}>

          <View style={styles.heroIcon}>

            <Ionicons

              name="leaf-outline"

              size={29}

              color="#004B0A"

            />

          </View>



          <View style={styles.heroContent}>

            <Text style={styles.heroTitle}>

              Combata o desperdício

            </Text>



            <Text style={styles.heroText}>

              Encontre alimentos excedentes de produtores locais

              por preços especiais e ajude a evitar que produtos

              próprios para consumo sejam desperdiçados.

            </Text>

          </View>

        </View>



        <View style={styles.infoCard}>

          <Ionicons

            name="information-circle-outline"

            size={23}

            color="#004B0A"

          />



          <View style={styles.infoContent}>

            <Text style={styles.infoTitle}>

              O que são excedentes?

            </Text>



            <Text style={styles.infoText}>

              São alimentos próprios para consumo que não foram

              comercializados no fluxo normal de venda, seja por

              excesso de produção, sobra de feira ou características

              fora do padrão comercial.

            </Text>

          </View>

        </View>



        <View style={styles.searchContainer}>

          <Ionicons

            name="search-outline"

            size={20}

            color="#777777"

          />



          <TextInput

            style={styles.searchInput}

            value={busca}

            onChangeText={setBusca}

            placeholder="Buscar excedentes..."

            placeholderTextColor="#888888"

          />



          {busca.length > 0 && (

            <TouchableOpacity onPress={() => setBusca('')}>

              <Ionicons

                name="close-circle"

                size={19}

                color="#999999"

              />

            </TouchableOpacity>

          )}

        </View>



        <ScrollView

          horizontal

          showsHorizontalScrollIndicator={false}

          contentContainerStyle={styles.categoriesContainer}

        >

          {categorias.map((item) => {

            const selecionada = categoria === item;



            return (

              <TouchableOpacity

                key={item}

                style={[

                  styles.categoryButton,

                  selecionada && styles.categoryButtonActive,

                ]}

                onPress={() => setCategoria(item)}

              >

                <Text

                  style={[

                    styles.categoryText,

                    selecionada && styles.categoryTextActive,

                  ]}

                >

                  {item}

                </Text>

              </TouchableOpacity>

            );

          })}

        </ScrollView>



        <View style={styles.resultHeader}>

          <Text style={styles.sectionTitle}>

            Oportunidades disponíveis

          </Text>



          <Text style={styles.resultCount}>

            {excedentesFiltrados.length}

          </Text>

        </View>



        {carregando ? (

          <View style={styles.emptyContainer}>

            <ActivityIndicator size="large" color="#004B0A" />

            <Text style={styles.emptyText}>

              Carregando excedentes...

            </Text>

          </View>

        ) : erro ? (

          <View style={styles.emptyContainer}>

            <Ionicons

              name="alert-circle-outline"

              size={45}

              color="#A5B8A7"

            />

            <Text style={styles.emptyTitle}>

              Não foi possível carregar

            </Text>

            <Text style={styles.emptyText}>

              {erro}

            </Text>

            <TouchableOpacity

              style={{

                marginTop: 14,

                paddingHorizontal: 18,

                paddingVertical: 10,

                borderRadius: 8,

                backgroundColor: '#004B0A',

              }}

              onPress={() => carregarExcedentes()}

            >

              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>

                Tentar novamente

              </Text>

            </TouchableOpacity>

          </View>

        ) : excedentesFiltrados.length === 0 ? (

          <View style={styles.emptyContainer}>

            <Ionicons

              name="leaf-outline"

              size={45}

              color="#A5B8A7"

            />



            <Text style={styles.emptyTitle}>

              Nenhum excedente encontrado

            </Text>



            <Text style={styles.emptyText}>

              Tente pesquisar outro produto ou selecionar outra

              categoria.

            </Text>

          </View>

        ) : (

          excedentesFiltrados.map((item) => {

            const desconto = calcularDesconto(

              item.produto.preco,

              item.preco_promocional

            );



            return (

              <TouchableOpacity

                key={item.id}

                style={styles.card}

                activeOpacity={0.85}

                onPress={() =>

                  router.push(`/excedente/${item.id}`)

                }

              >

                <View style={styles.imageContainer}>

                  {item.produto.imagem_url ? (

                    <Image

                      source={{ uri: item.produto.imagem_url }}

                      style={styles.image}

                      resizeMode="cover"

                    />

                  ) : (

                    <View

                      style={[

                        styles.image,

                        {

                          alignItems: 'center',

                          justifyContent: 'center',

                          backgroundColor: '#E7F1E8',

                        },

                      ]}

                    >

                      <Ionicons

                        name="image-outline"

                        size={42}

                        color="#7F9B82"

                      />

                    </View>

                  )}



                  {desconto > 0 && (

                    <View style={styles.discountBadge}>

                      <Text style={styles.discountText}>

                        -{desconto}%

                      </Text>

                    </View>

                  )}



                  {item.quantidade <= 10 && (

                    <View style={styles.lastUnitsBadge}>

                      <Text style={styles.lastUnitsText}>

                        Últimas unidades

                      </Text>

                    </View>

                  )}

                </View>



                <View style={styles.cardContent}>

                  <Text style={styles.productName}>

                    {item.produto.nome}

                  </Text>



                  <TouchableOpacity

                    style={styles.producerRow}

                    onPress={() =>

                      router.push(`/produtor/${item.produtor_id}`)

                    }

                  >

                    <Ionicons

                      name="person-circle-outline"

                      size={16}

                      color="#666666"

                    />



                    <Text style={styles.producerName}>

                      {item.produtor_nome}

                    </Text>

                  </TouchableOpacity>



                  <View style={styles.priceRow}>

                    <Text style={styles.oldPrice}>

                      {formatarPreco(item.produto.preco)}

                    </Text>



                    <Text style={styles.price}>

                      {formatarPreco(item.preco_promocional)}

                    </Text>



                    <Text style={styles.unit}>

                      / {item.produto.unidade ?? 'un.'}

                    </Text>

                  </View>



                  <View style={styles.detailsRow}>

                    <View style={styles.detail}>

                      <Ionicons

                        name="cube-outline"

                        size={15}

                        color="#004B0A"

                      />



                      <Text style={styles.detailText}>

                        {item.quantidade} {item.produto.unidade ?? 'un.'}

                      </Text>

                    </View>



                    <View style={styles.detail}>

                      <Ionicons

                        name="time-outline"

                        size={15}

                        color="#004B0A"

                      />



                      <Text style={styles.detailText}>

                        {formatarValidade(item.data_validade)}

                      </Text>

                    </View>

                  </View>



                  <View style={styles.openRow}>

                    <Text style={styles.openText}>

                      Ver oportunidade

                    </Text>



                    <Ionicons

                      name="chevron-forward"

                      size={17}

                      color="#004B0A"

                    />

                  </View>

                </View>

              </TouchableOpacity>

            );

          })

        )}



        <View style={styles.impactCard}>

          <View style={styles.impactIcon}>

            <Ionicons

              name="earth-outline"

              size={27}

              color="#004B0A"

            />

          </View>



          <View style={styles.impactContent}>

            <Text style={styles.impactTitle}>

              Seu consumo gera impacto

            </Text>



            <Text style={styles.impactText}>

              Comprar excedentes ajuda a reduzir perdas de alimentos,

              gera renda para pequenos produtores e incentiva um

              consumo mais responsável.

            </Text>

          </View>

        </View>

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({



  container: {



    flex: 1,



    backgroundColor: '#F7F7F7',



  },







  header: {



    backgroundColor: '#FFFFFF',



    paddingTop: 25,



    paddingBottom: 14,



    paddingHorizontal: 18,



    flexDirection: 'row',



    alignItems: 'center',



    justifyContent: 'space-between',



    borderBottomWidth: 1,



    borderBottomColor: '#EEEEEE',



  },







  backButton: {



    width: 42,



  },







  headerCenter: {



    alignItems: 'center',



  },







  headerTitle: {



    fontSize: 19,



    fontWeight: 'bold',



  },







  headerSubtitle: {



    fontSize: 9,



    color: '#777777',



    marginTop: 2,



  },







  headerSpace: {



    width: 42,



  },







  scrollContent: {



    padding: 16,



    paddingBottom: 50,



  },







  heroCard: {



    backgroundColor: '#E7F1E8',



    borderRadius: 14,



    padding: 16,



    flexDirection: 'row',



    alignItems: 'center',



  },







  heroIcon: {



    width: 55,



    height: 55,



    borderRadius: 28,



    backgroundColor: '#FFFFFF',



    alignItems: 'center',



    justifyContent: 'center',



  },







  heroContent: {



    flex: 1,



    marginLeft: 13,



  },







  heroTitle: {



    fontSize: 16,



    fontWeight: 'bold',



    color: '#004B0A',



  },







  heroText: {



    fontSize: 10,



    lineHeight: 15,



    color: '#555555',



    marginTop: 4,



  },







  infoCard: {



    backgroundColor: '#FFFFFF',



    borderRadius: 12,



    padding: 14,



    marginTop: 13,



    flexDirection: 'row',



    alignItems: 'flex-start',



  },







  infoContent: {



    flex: 1,



    marginLeft: 10,



  },







  infoTitle: {



    fontSize: 12,



    fontWeight: 'bold',



    color: '#004B0A',



  },







  infoText: {



    fontSize: 9,



    lineHeight: 14,



    color: '#666666',



    marginTop: 4,



  },







  searchContainer: {



    height: 47,



    backgroundColor: '#FFFFFF',



    borderRadius: 9,



    marginTop: 18,



    paddingHorizontal: 13,



    flexDirection: 'row',



    alignItems: 'center',



    borderWidth: 1,



    borderColor: '#EEEEEE',



  },







  searchInput: {



    flex: 1,



    marginLeft: 8,



    fontSize: 12,



  },







  categoriesContainer: {



    paddingTop: 13,



    paddingBottom: 5,



  },







  categoryButton: {



    paddingHorizontal: 15,



    paddingVertical: 9,



    borderRadius: 20,



    backgroundColor: '#FFFFFF',



    marginRight: 8,



    borderWidth: 1,



    borderColor: '#E5E5E5',



  },







  categoryButtonActive: {



    backgroundColor: '#004B0A',



    borderColor: '#004B0A',



  },







  categoryText: {



    fontSize: 10,



    color: '#555555',



  },







  categoryTextActive: {



    color: '#FFFFFF',



    fontWeight: '600',



  },







  resultHeader: {



    flexDirection: 'row',



    alignItems: 'center',



    justifyContent: 'space-between',



    marginTop: 21,



    marginBottom: 12,



  },







  sectionTitle: {



    fontSize: 17,



    fontWeight: 'bold',



  },







  resultCount: {



    backgroundColor: '#E7F1E8',



    color: '#004B0A',



    paddingHorizontal: 10,



    paddingVertical: 5,



    borderRadius: 15,



    fontSize: 10,



    fontWeight: 'bold',



  },







  card: {



    backgroundColor: '#FFFFFF',



    borderRadius: 13,



    overflow: 'hidden',



    marginBottom: 16,



  },







  imageContainer: {



    height: 175,



    position: 'relative',



  },







  image: {



    width: '100%',



    height: '100%',



  },







  discountBadge: {



    position: 'absolute',



    top: 12,



    left: 12,



    backgroundColor: '#004B0A',



    paddingHorizontal: 10,



    paddingVertical: 6,



    borderRadius: 15,



  },







  discountText: {



    color: '#FFFFFF',



    fontSize: 11,



    fontWeight: 'bold',



  },







  lastUnitsBadge: {



    position: 'absolute',



    top: 12,



    right: 12,



    backgroundColor: '#FFFFFF',



    paddingHorizontal: 9,



    paddingVertical: 6,



    borderRadius: 15,



  },







  lastUnitsText: {



    color: '#A05A00',



    fontSize: 9,



    fontWeight: 'bold',



  },







  cardContent: {



    padding: 14,



  },







  productName: {



    fontSize: 18,



    fontWeight: 'bold',



  },







  producerRow: {



    flexDirection: 'row',



    alignItems: 'center',



    marginTop: 6,



  },







  producerName: {



    fontSize: 11,



    color: '#555555',



    marginLeft: 5,



    fontWeight: '500',



  },







  locationRow: {



    flexDirection: 'row',



    alignItems: 'center',



    marginTop: 5,



  },







  locationText: {



    fontSize: 9,



    color: '#777777',



    marginLeft: 4,



  },







  priceRow: {



    flexDirection: 'row',



    alignItems: 'baseline',



    marginTop: 13,



  },







  oldPrice: {



    fontSize: 10,



    color: '#999999',



    textDecorationLine: 'line-through',



    marginRight: 8,



  },







  price: {



    fontSize: 19,



    fontWeight: 'bold',



    color: '#004B0A',



  },







  unit: {



    fontSize: 10,



    color: '#666666',



    marginLeft: 3,



  },







  detailsRow: {



    flexDirection: 'row',



    flexWrap: 'wrap',



    marginTop: 12,



    gap: 12,



  },







  detail: {



    flexDirection: 'row',



    alignItems: 'center',



  },







  detailText: {



    fontSize: 9,



    color: '#555555',



    marginLeft: 4,



  },







  openRow: {



    flexDirection: 'row',



    alignItems: 'center',



    justifyContent: 'flex-end',



    marginTop: 14,



    paddingTop: 11,



    borderTopWidth: 1,



    borderTopColor: '#EEEEEE',



  },







  openText: {



    fontSize: 10,



    color: '#004B0A',



    fontWeight: 'bold',



    marginRight: 4,



  },







  emptyContainer: {



    backgroundColor: '#FFFFFF',



    borderRadius: 12,



    padding: 30,



    alignItems: 'center',



  },







  emptyTitle: {



    fontSize: 14,



    fontWeight: 'bold',



    marginTop: 10,



  },







  emptyText: {



    fontSize: 10,



    color: '#777777',



    textAlign: 'center',



    lineHeight: 15,



    marginTop: 5,



  },







  impactCard: {



    marginTop: 10,



    backgroundColor: '#E7F1E8',



    borderRadius: 13,



    padding: 15,



    flexDirection: 'row',



    alignItems: 'center',



  },







  impactIcon: {



    width: 48,



    height: 48,



    borderRadius: 24,



    backgroundColor: '#FFFFFF',



    alignItems: 'center',



    justifyContent: 'center',



  },







  impactContent: {



    flex: 1,



    marginLeft: 12,



  },







  impactTitle: {



    fontSize: 13,



    color: '#004B0A',



    fontWeight: 'bold',



  },







  impactText: {



    fontSize: 9,



    color: '#555555',



    lineHeight: 14,



    marginTop: 3,



  },



});
