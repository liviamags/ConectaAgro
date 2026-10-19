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

  RefreshControl,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Produtor = {

  id: string;

  nome: string;

  nome_fazenda: string;

  cidade: string;

  estado: string;

  tipo_producao: string;

  descricao: string | null;
  imagem_url: string | null;

};

export default function ProdutoresScreen() {

  const [busca, setBusca] = useState('');

  const [produtores, setProdutores] =

    useState<Produtor[]>([]);

  const [carregando, setCarregando] =

    useState(true);

  const [atualizando, setAtualizando] =

    useState(false);

  const [erro, setErro] = useState('');

  useFocusEffect(

    useCallback(() => {

      carregarProdutores();

    }, [])

  );

  async function carregarProdutores(

    refresh = false

  ) {

    if (refresh) {

      setAtualizando(true);

    } else {

      setCarregando(true);

    }

    setErro('');

    try {

      const {

        data: usuarioData,

        error: usuarioError,

      } = await supabase.auth.getUser();

      if (

        usuarioError ||

        !usuarioData.user

      ) {

        setErro(

          'Você precisa estar conectado para visualizar os produtores.'

        );

        return;

      }

      const {

        data,

        error,

      } = await supabase.rpc(

        'listar_produtores_publicos'

      );

      if (error) {

        console.log(

          'Erro ao carregar produtores:',

          error

        );

        setErro(

          'Não foi possível carregar os produtores.'

        );

        return;

      }

      const produtoresFormatados: Produtor[] =

        (data ?? []).map(

          (produtor: any) => ({

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

            descricao:

              produtor.descricao ?? null,
            imagem_url: produtor.imagem_url ?? null,

          })

        );

      setProdutores(

        produtoresFormatados

      );

    } catch (error) {

      console.log(

        'Erro inesperado ao carregar produtores:',

        error

      );

      setErro(

        'Ocorreu um erro ao carregar os produtores.'

      );

    } finally {

      setCarregando(false);

      setAtualizando(false);

    }

  }

  function normalizarTexto(

    texto: string

  ) {

    return texto

      .normalize('NFD')

      .replace(

        /[\u0300-\u036f]/g,

        ''

      )

      .toLowerCase()

      .trim();

  }

  const textoBusca =

    normalizarTexto(busca);

  const produtoresFiltrados =

    produtores.filter((produtor) => {

      if (!textoBusca) {

        return true;

      }

      const localizacao = [

        produtor.cidade,

        produtor.estado,

      ]

        .filter(Boolean)

        .join(', ');

      return (

        normalizarTexto(

          produtor.nome

        ).includes(textoBusca) ||

        normalizarTexto(

          produtor.nome_fazenda

        ).includes(textoBusca) ||

        normalizarTexto(

          produtor.tipo_producao

        ).includes(textoBusca) ||

        normalizarTexto(

          localizacao

        ).includes(textoBusca)

      );

    });

  function localizacaoProdutor(

    produtor: Produtor

  ) {

    const partes = [

      produtor.cidade,

      produtor.estado,

    ].filter(Boolean);

    if (partes.length === 0) {

      return 'Localização não informada';

    }

    return partes.join(', ');

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

  if (carregando) {

    return (

      <View style={styles.container}>

        <View style={styles.header}>

          <TouchableOpacity

            style={styles.backButton}

            onPress={() =>

              router.back()

            }

          >

            <Ionicons

              name="chevron-back"

              size={26}

              color="#004B0A"

            />

          </TouchableOpacity>

          <Text style={styles.title}>

            Produtores

          </Text>

          <View

            style={styles.headerSpace}

          />

        </View>

        <View

          style={styles.loadingContainer}

        >

          <ActivityIndicator

            size="large"

            color="#004B0A"

          />

          <Text

            style={styles.loadingText}

          >

            Carregando produtores...

          </Text>

        </View>

      </View>

    );

  }

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

          Produtores

        </Text>

        <View style={styles.headerSpace} />

      </View>

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={

          styles.content

        }

        refreshControl={

          <RefreshControl

            refreshing={atualizando}

            onRefresh={() =>

              carregarProdutores(true)

            }

            tintColor="#004B0A"

            colors={['#004B0A']}

          />

        }

      >

        <Text style={styles.subtitle}>

          Conheça os produtores locais

        </Text>

        <Text style={styles.description}>

          Descubra pequenos produtores da

          região, conheça suas histórias e

          encontre seus produtos.

        </Text>

        <View

          style={styles.searchContainer}

        >

          <Ionicons

            name="search-outline"

            size={20}

            color="#777777"

          />

          <TextInput

            style={styles.searchInput}

            placeholder="Buscar produtor..."

            placeholderTextColor="#888888"

            value={busca}

            onChangeText={setBusca}

          />

          {!!busca && (

            <TouchableOpacity

              onPress={() =>

                setBusca('')

              }

            >

              <Ionicons

                name="close-circle"

                size={19}

                color="#999999"

              />

            </TouchableOpacity>

          )}

        </View>

        {erro ? (

          <View

            style={styles.errorContainer}

          >

            <Ionicons

              name="alert-circle-outline"

              size={42}

              color="#004B0A"

            />

            <Text

              style={styles.errorTitle}

            >

              Não foi possível carregar

            </Text>

            <Text

              style={styles.errorText}

            >

              {erro}

            </Text>

            <TouchableOpacity

              style={styles.retryButton}

              onPress={() =>

                carregarProdutores()

              }

            >

              <Text

                style={

                  styles.retryButtonText

                }

              >

                Tentar novamente

              </Text>

            </TouchableOpacity>

          </View>

        ) : (

          <>

            <Text

              style={styles.resultText}

            >

              {produtoresFiltrados.length ===

              1

                ? '1 perfil encontrado'

                : `${produtoresFiltrados.length} perfis encontrados`}

            </Text>

            {produtoresFiltrados.map(

              (produtor) => (

                <TouchableOpacity

                  key={produtor.id}

                  style={

                    styles.producerCard

                  }

                  activeOpacity={0.8}

                  onPress={() =>

                    router.push(

                      `/produtor/${produtor.id}`

                    )

                  }

                >

                  {produtor.imagem_url ? (
                    <Image
                      source={{ uri: produtor.imagem_url }}
                      style={styles.producerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.producerImagePlaceholder}>
                      <Text style={styles.producerInitials}>
                        {iniciaisProdutor(produtor.nome)}
                      </Text>
                    </View>
                  )}

                  <View

                    style={

                      styles.producerInfo

                    }

                  >

                    <Text

                      style={

                        styles.producerName

                      }

                    >

                      {produtor.nome}

                    </Text>

                    <Text

                      style={

                        styles.propertyName

                      }

                    >

                      {

                        produtor.nome_fazenda

                      }

                    </Text>

                    <View

                      style={

                        styles.locationRow

                      }

                    >

                      <Ionicons

                        name="location-outline"

                        size={14}

                        color="#004B0A"

                      />

                      <Text

                        style={

                          styles.locationText

                        }

                      >

                        {localizacaoProdutor(

                          produtor

                        )}

                      </Text>

                    </View>

                    <Text

                      style={

                        styles.categoryText

                      }

                    >

                      {

                        produtor.tipo_producao

                      }

                    </Text>

                  </View>

                  <Ionicons

                    name="chevron-forward"

                    size={21}

                    color="#777777"

                  />

                </TouchableOpacity>

              )

            )}

            {produtoresFiltrados.length ===

              0 && (

              <View

                style={

                  styles.emptyContainer

                }

              >

                <Ionicons

                  name="people-outline"

                  size={45}

                  color="#004B0A"

                />

                <Text

                  style={

                    styles.emptyTitle

                  }

                >

                  Nenhum produtor encontrado

                </Text>

                <Text

                  style={styles.emptyText}

                >

                  {busca

                    ? 'Tente pesquisar outro nome, localização ou tipo de produção.'

                    : 'Ainda não existem produtores cadastrados.'}

                </Text>

              </View>

            )}

          </>

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

    justifyContent:

      'space-between',

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

  },

  headerSpace: {

    width: 40,

  },

  content: {

    padding: 18,

    paddingBottom: 45,

  },

  subtitle: {

    fontSize: 21,

    fontWeight: 'bold',

  },

  description: {

    fontSize: 12,

    color: '#666666',

    lineHeight: 18,

    marginTop: 5,

    marginBottom: 18,

  },

  searchContainer: {

    flexDirection: 'row',

    alignItems: 'center',

    height: 47,

    backgroundColor: '#F5F5F5',

    borderRadius: 9,

    paddingHorizontal: 14,

  },

  searchInput: {

    flex: 1,

    marginLeft: 8,

    fontSize: 14,

    color: '#222222',

  },

  resultText: {

    fontSize: 11,

    color: '#777777',

    marginTop: 17,

    marginBottom: 12,

  },

  producerCard: {

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#E5E5E5',

    borderRadius: 11,

    padding: 12,

    marginBottom: 13,

  },

  producerImage: {
    width: 82,
    height: 82,
    borderRadius: 10,
    backgroundColor: '#EAF3EB',
  },

  producerImagePlaceholder: {

    width: 82,

    height: 82,

    borderRadius: 10,

    backgroundColor: '#EAF3EB',

    alignItems: 'center',

    justifyContent: 'center',

  },

  producerInitials: {

    fontSize: 25,

    fontWeight: 'bold',

    color: '#004B0A',

  },

  producerInfo: {

    flex: 1,

    marginLeft: 13,

  },

  producerName: {

    fontSize: 16,

    fontWeight: 'bold',

  },

  propertyName: {

    fontSize: 12,

    color: '#004B0A',

    fontWeight: '600',

    marginTop: 3,

  },

  locationRow: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 7,

    gap: 3,

  },

  locationText: {

    fontSize: 10,

    color: '#666666',

  },

  categoryText: {

    fontSize: 10,

    color: '#777777',

    marginTop: 5,

  },

  loadingContainer: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  loadingText: {

    fontSize: 11,

    color: '#666666',

    marginTop: 12,

  },

  errorContainer: {

    alignItems: 'center',

    paddingVertical: 55,

    paddingHorizontal: 20,

  },

  errorTitle: {

    fontSize: 16,

    fontWeight: 'bold',

    marginTop: 12,

  },

  errorText: {

    fontSize: 11,

    color: '#777777',

    marginTop: 5,

    textAlign: 'center',

  },

  retryButton: {

    marginTop: 17,

    backgroundColor: '#004B0A',

    borderRadius: 8,

    paddingHorizontal: 17,

    paddingVertical: 10,

  },

  retryButtonText: {

    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '600',

  },

  emptyContainer: {

    alignItems: 'center',

    paddingVertical: 60,

  },

  emptyTitle: {

    fontSize: 16,

    fontWeight: 'bold',

    marginTop: 13,

  },

  emptyText: {

    fontSize: 12,

    color: '#777777',

    marginTop: 5,

    textAlign: 'center',

  },

});
