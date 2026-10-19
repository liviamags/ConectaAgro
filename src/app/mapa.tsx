import { Ionicons } from '@expo/vector-icons';

import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';

import * as Location from 'expo-location';

import { router, useLocalSearchParams } from 'expo-router';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,

  Image,

  Linking,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type ProdutorMapa = {

  id: string;

  nome: string;

  propriedade: string;

  localizacao: string;

  categoria: string;

  imagem_url: string | null;

  latitude: number;

  longitude: number;

};

type Coordenada = {

  latitude: number;

  longitude: number;

};

const centroInicial: [number, number] = [-44.09, -19.95];

const estiloMapa = 'https://tiles.openfreemap.org/styles/liberty';

export default function MapaScreen() {

  const { produtor } = useLocalSearchParams();

  const cameraRef = useRef<any>(null);

  const [pesquisa, setPesquisa] = useState('');

  const [produtorSelecionado, setProdutorSelecionado] = useState<ProdutorMapa | null>(null);

  const [minhaLocalizacao, setMinhaLocalizacao] = useState<Coordenada | null>(null);

  const [produtores, setProdutores] = useState<ProdutorMapa[]>([]);

  const [carregandoProdutores, setCarregandoProdutores] = useState(true);

  const produtorIdRecebido = Array.isArray(produtor) ? produtor[0] : produtor;

  const produtoresFiltrados = useMemo(() => {

    const texto = pesquisa.trim().toLowerCase();

    if (!texto) {

      return produtores;

    }

    return produtores.filter((item) => {

      return (

        item.nome.toLowerCase().includes(texto) ||

        item.propriedade.toLowerCase().includes(texto) ||

        item.localizacao.toLowerCase().includes(texto) ||

        item.categoria.toLowerCase().includes(texto)

      );

    });

  }, [pesquisa, produtores]);

  useEffect(() => {

    async function carregarProdutores() {

      setCarregandoProdutores(true);

      try {

        const { data, error } = await supabase.rpc('listar_produtores_publicos');

        if (error) {

          console.log('Erro ao carregar produtores no mapa:', error);

          Alert.alert('Erro', 'Não foi possível carregar os produtores no mapa.');

          setProdutores([]);

          return;

        }

        const produtoresFormatados: ProdutorMapa[] = (data ?? [])

          .filter(

            (item: any) =>

              item.latitude !== null &&

              item.latitude !== undefined &&

              item.longitude !== null &&

              item.longitude !== undefined

          )

          .map((item: any) => ({

            id: item.id,

            nome: item.nome || 'Produtor',

            propriedade: item.nome_fazenda || 'Propriedade rural',

            localizacao:

              [item.cidade, item.estado].filter(Boolean).join(', ') ||

              'Localização não informada',

            categoria: item.tipo_producao || 'Produção local',

            imagem_url: item.imagem_url ?? null,

            latitude: Number(item.latitude),

            longitude: Number(item.longitude),

          }))

          .filter(

            (item: ProdutorMapa) =>

              Number.isFinite(item.latitude) && Number.isFinite(item.longitude)

          );

        setProdutores(produtoresFormatados);

      } catch (error) {

        console.log('Erro inesperado ao carregar mapa:', error);

        Alert.alert('Erro', 'Ocorreu um erro ao carregar o mapa de produtores.');

        setProdutores([]);

      } finally {

        setCarregandoProdutores(false);

      }

    }

    carregarProdutores();

  }, []);

  useEffect(() => {

    if (!produtorIdRecebido) {

      return;

    }

    const encontrado = produtores.find((item) => item.id === produtorIdRecebido);

    if (!encontrado) {

      return;

    }

    const timer = setTimeout(() => {

      centralizarProdutor(encontrado);

    }, 500);

    return () => clearTimeout(timer);

  }, [produtorIdRecebido, produtores]);

  function centralizarProdutor(item: ProdutorMapa) {

    cameraRef.current?.easeTo({

      center: [item.longitude, item.latitude],

      zoom: 15,

      duration: 700,

    });

    setProdutorSelecionado(item);

  }

  async function irParaMinhaLocalizacao() {

    try {

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {

        Alert.alert(

          'Localização não permitida',

          'Para mostrar sua localização no mapa, permita o acesso à localização do dispositivo.'

        );

        return;

      }

      const localizacao = await Location.getCurrentPositionAsync({

        accuracy: Location.Accuracy.Balanced,

      });

      const coordenada = {

        latitude: localizacao.coords.latitude,

        longitude: localizacao.coords.longitude,

      };

      setMinhaLocalizacao(coordenada);

      cameraRef.current?.easeTo({

        center: [coordenada.longitude, coordenada.latitude],

        zoom: 15,

        duration: 700,

      });

    } catch {

      Alert.alert(

        'Não foi possível localizar você',

        'Verifique se a localização do aparelho está ativada.'

      );

    }

  }

  async function abrirNoMaps(item: ProdutorMapa) {

    const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;

    try {

      await Linking.openURL(url);

    } catch {

      Alert.alert('Não foi possível abrir o mapa', 'Tente novamente.');

    }

  }

  return (

    <View style={styles.container}>

      <View style={styles.header}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>

          <Ionicons name="chevron-back" size={25} color="#004B0A" />

        </TouchableOpacity>

        <View style={styles.headerText}>

          <Text style={styles.headerTitle}>Mapa de produtores</Text>

          <Text style={styles.headerSubtitle}>Encontre produtores próximos</Text>

        </View>

        <TouchableOpacity style={styles.locationButton} onPress={irParaMinhaLocalizacao}>

          <Ionicons name="locate" size={22} color="#004B0A" />

        </TouchableOpacity>

      </View>

      <View style={styles.searchContainer}>

        <Ionicons name="search-outline" size={19} color="#777777" />

        <TextInput

          style={styles.searchInput}

          placeholder="Buscar produtor ou região..."

          placeholderTextColor="#999999"

          value={pesquisa}

          onChangeText={setPesquisa}

        />

        {pesquisa.length > 0 && (

          <TouchableOpacity onPress={() => setPesquisa('')}>

            <Ionicons name="close-circle" size={19} color="#999999" />

          </TouchableOpacity>

        )}

      </View>

      {pesquisa.length > 0 && (

        <View style={styles.searchResults}>

          <ScrollView

            horizontal

            showsHorizontalScrollIndicator={false}

            contentContainerStyle={styles.searchResultsContent}

          >

            {produtoresFiltrados.length === 0 ? (

              <Text style={styles.noResultText}>Nenhum produtor encontrado.</Text>

            ) : (

              produtoresFiltrados.map((item) => (

                <TouchableOpacity

                  key={item.id}

                  style={styles.searchResultCard}

                  onPress={() => {

                    centralizarProdutor(item);

                    setPesquisa('');

                  }}

                >

                  {item.imagem_url ? (

                    <Image

                      source={{ uri: item.imagem_url }}

                      style={styles.searchResultImage}

                      resizeMode="cover"

                    />

                  ) : (

                    <View style={styles.searchResultImagePlaceholder}>

                      <Ionicons name="person" size={20} color="#004B0A" />

                    </View>

                  )}

                  <View style={styles.searchResultInfo}>

                    <Text style={styles.searchResultName} numberOfLines={1}>

                      {item.nome}

                    </Text>

                    <Text style={styles.searchResultProperty} numberOfLines={1}>

                      {item.propriedade}

                    </Text>

                  </View>

                </TouchableOpacity>

              ))

            )}

          </ScrollView>

        </View>

      )}

      <View style={styles.mapContainer}>

        {carregandoProdutores && (

          <View style={styles.mapStatus}>

            <Text style={styles.mapStatusText}>Carregando produtores...</Text>

          </View>

        )}

        {!carregandoProdutores && produtores.length === 0 && (

          <View style={styles.mapStatus}>

            <Text style={styles.mapStatusText}>

              Nenhum produtor cadastrou uma localização ainda.

            </Text>

          </View>

        )}

        <Map

          style={styles.map}

          mapStyle={estiloMapa}

          compass

          logo={false}

          onPress={() => setProdutorSelecionado(null)}

        >

          <Camera

            ref={cameraRef}

            initialViewState={{

              center: centroInicial,

              zoom: 10,

            }}

          />

          {produtores.map((item) => (

            <Marker

              key={item.id}

              id={`produtor-${item.id}`}

              lngLat={[item.longitude, item.latitude]}

              anchor="bottom"

              onPress={() => setProdutorSelecionado(item)}

            >

              <View style={styles.markerProducer}>

                <Ionicons name="leaf" size={17} color="#FFFFFF" />

              </View>

            </Marker>

          ))}

          {minhaLocalizacao && (

            <Marker

              id="minha-localizacao"

              lngLat={[minhaLocalizacao.longitude, minhaLocalizacao.latitude]}

              anchor="center"

            >

              <View style={styles.userMarkerOuter}>

                <View style={styles.userMarkerInner} />

              </View>

            </Marker>

          )}

        </Map>

        <TouchableOpacity style={styles.myLocationFloating} onPress={irParaMinhaLocalizacao}>

          <Ionicons name="locate" size={24} color="#004B0A" />

        </TouchableOpacity>

      </View>

      {produtorSelecionado ? (

        <View style={styles.bottomCard}>

          <View style={styles.producerTopRow}>

            {produtorSelecionado.imagem_url ? (

              <Image

                source={{ uri: produtorSelecionado.imagem_url }}

                style={styles.producerImage}

                resizeMode="cover"

              />

            ) : (

              <View style={styles.producerImagePlaceholder}>

                <Ionicons name="person" size={25} color="#004B0A" />

              </View>

            )}

            <View style={styles.producerInfo}>

              <Text style={styles.producerName}>{produtorSelecionado.nome}</Text>

              <Text style={styles.propertyName}>{produtorSelecionado.propriedade}</Text>

              <View style={styles.addressRow}>

                <Ionicons name="location-outline" size={13} color="#777777" />

                <Text style={styles.addressText}>{produtorSelecionado.localizacao}</Text>

              </View>

            </View>

            <TouchableOpacity

              style={styles.closeCard}

              onPress={() => setProdutorSelecionado(null)}

            >

              <Ionicons name="close" size={19} color="#777777" />

            </TouchableOpacity>

          </View>

          <Text style={styles.categoryText}>{produtorSelecionado.categoria}</Text>

          <View style={styles.cardButtons}>

            <TouchableOpacity

              style={styles.profileButton}

              onPress={() => router.push(`/produtor/${produtorSelecionado.id}`)}

            >

              <Ionicons name="person-outline" size={17} color="#FFFFFF" />

              <Text style={styles.profileButtonText}>Ver perfil</Text>

            </TouchableOpacity>

            <TouchableOpacity

              style={styles.mapsButton}

              onPress={() => abrirNoMaps(produtorSelecionado)}

            >

              <Ionicons name="navigate-outline" size={17} color="#004B0A" />

              <Text style={styles.mapsButtonText}>Abrir no Maps</Text>

            </TouchableOpacity>

          </View>

        </View>

      ) : (

        <View style={styles.bottomInstructions}>

          <View style={styles.instructionsIcon}>

            <Ionicons name="map-outline" size={22} color="#004B0A" />

          </View>

          <View style={{ flex: 1 }}>

            <Text style={styles.instructionsTitle}>Explore o mapa</Text>

            <Text style={styles.instructionsText}>

              Toque em um marcador verde para visualizar o produtor.

            </Text>

          </View>

        </View>

      )}

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

    paddingTop: 26,

    paddingBottom: 13,

    paddingHorizontal: 17,

    flexDirection: 'row',

    alignItems: 'center',

    borderBottomWidth: 1,

    borderBottomColor: '#EEEEEE',

  },

  backButton: {

    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: '#F3F6F3',

    alignItems: 'center',

    justifyContent: 'center',

  },

  headerText: {

    flex: 1,

    marginLeft: 11,

  },

  headerTitle: {

    fontSize: 18,

    fontWeight: 'bold',

    color: '#222222',

  },

  headerSubtitle: {

    fontSize: 9,

    color: '#777777',

    marginTop: 2,

  },

  locationButton: {

    width: 42,

    height: 42,

    borderRadius: 21,

    alignItems: 'center',

    justifyContent: 'center',

  },

  searchContainer: {

    marginHorizontal: 16,

    marginVertical: 10,

    height: 46,

    borderRadius: 12,

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 13,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#E6E6E6',

  },

  searchInput: {

    flex: 1,

    fontSize: 12,

    marginLeft: 8,

    color: '#222222',

  },

  searchResults: {

    backgroundColor: '#F7F7F7',

    paddingBottom: 9,

  },

  searchResultsContent: {

    paddingHorizontal: 16,

  },

  searchResultCard: {

    width: 190,

    backgroundColor: '#FFFFFF',

    borderRadius: 10,

    padding: 8,

    flexDirection: 'row',

    alignItems: 'center',

    marginRight: 9,

    borderWidth: 1,

    borderColor: '#EEEEEE',

  },

  searchResultImage: {

    width: 43,

    height: 43,

    borderRadius: 22,

  },

  searchResultImagePlaceholder: {

    width: 43,

    height: 43,

    borderRadius: 22,

    backgroundColor: '#DDEBDF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  searchResultInfo: {

    flex: 1,

    marginLeft: 8,

  },

  searchResultName: {

    fontSize: 11,

    fontWeight: 'bold',

  },

  searchResultProperty: {

    fontSize: 8,

    color: '#666666',

    marginTop: 2,

  },

  noResultText: {

    fontSize: 11,

    color: '#777777',

    paddingVertical: 10,

  },

  mapContainer: {

    flex: 1,

    position: 'relative',

  },

  map: {

    flex: 1,

  },

  mapStatus: {

    position: 'absolute',

    top: 12,

    left: 12,

    right: 12,

    zIndex: 2,

    backgroundColor: 'rgba(255,255,255,0.94)',

    paddingHorizontal: 12,

    paddingVertical: 9,

    borderRadius: 8,

    alignItems: 'center',

  },

  mapStatusText: {

    fontSize: 9,

    color: '#555555',

    textAlign: 'center',

  },

  markerProducer: {

    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: '#004B0A',

    borderWidth: 3,

    borderColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 4,

  },

  userMarkerOuter: {

    width: 24,

    height: 24,

    borderRadius: 12,

    backgroundColor: 'rgba(32,138,239,0.25)',

    alignItems: 'center',

    justifyContent: 'center',

  },

  userMarkerInner: {

    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: '#208AEF',

    borderWidth: 2,

    borderColor: '#FFFFFF',

  },

  myLocationFloating: {

    position: 'absolute',

    right: 15,

    bottom: 18,

    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 5,

    shadowColor: '#000000',

    shadowOpacity: 0.15,

    shadowRadius: 6,

    shadowOffset: {

      width: 0,

      height: 3,

    },

  },

  bottomCard: {

    backgroundColor: '#FFFFFF',

    padding: 15,

    borderTopWidth: 1,

    borderTopColor: '#E5E5E5',

  },

  producerTopRow: {

    flexDirection: 'row',

    alignItems: 'center',

  },

  producerImage: {

    width: 60,

    height: 60,

    borderRadius: 30,

  },

  producerImagePlaceholder: {

    width: 60,

    height: 60,

    borderRadius: 30,

    backgroundColor: '#DDEBDF',

    alignItems: 'center',

    justifyContent: 'center',

  },

  producerInfo: {

    flex: 1,

    marginLeft: 11,

  },

  producerName: {

    fontSize: 14,

    fontWeight: 'bold',

  },

  propertyName: {

    fontSize: 10,

    color: '#004B0A',

    fontWeight: '600',

    marginTop: 2,

  },

  addressRow: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 4,

  },

  addressText: {

    fontSize: 9,

    color: '#777777',

    marginLeft: 3,

  },

  closeCard: {

    padding: 7,

  },

  categoryText: {

    alignSelf: 'flex-start',

    marginTop: 10,

    backgroundColor: '#E7F1E8',

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 13,

    fontSize: 9,

    color: '#004B0A',

  },

  cardButtons: {

    flexDirection: 'row',

    marginTop: 12,

    gap: 9,

  },

  profileButton: {

    flex: 1,

    height: 43,

    borderRadius: 8,

    backgroundColor: '#004B0A',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

  },

  profileButtonText: {

    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '600',

  },

  mapsButton: {

    flex: 1,

    height: 43,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: '#004B0A',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

  },

  mapsButtonText: {

    color: '#004B0A',

    fontSize: 11,

    fontWeight: '600',

  },

  bottomInstructions: {

    backgroundColor: '#FFFFFF',

    padding: 15,

    flexDirection: 'row',

    alignItems: 'center',

    borderTopWidth: 1,

    borderTopColor: '#E5E5E5',

  },

  instructionsIcon: {

    width: 43,

    height: 43,

    borderRadius: 22,

    backgroundColor: '#E7F1E8',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

  },

  instructionsTitle: {

    fontSize: 12,

    fontWeight: 'bold',

  },

  instructionsText: {

    fontSize: 9,

    color: '#777777',

    marginTop: 3,

  },

});
