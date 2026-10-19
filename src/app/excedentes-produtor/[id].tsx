import {
    router,
    useLocalSearchParams,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    calcularDesconto,
    excedentes,
    formatarPreco,
} from '../../data/excedentes';

const produtores: Record<
  string,
  {
    nome: string;
    propriedade: string;
    imagem: any;
  }
> = {
  'jose-marcos': {
    nome: 'José Marcos',
    propriedade: 'Sítio do José',
    imagem: require('../../../assets/images/prod1.jpg'),
  },

  'maria-tereza': {
    nome: 'Maria Tereza',
    propriedade: 'Horta da Maria',
    imagem: require('../../../assets/images/prod2.jpg'),
  },

  'joao-silva': {
    nome: 'João Silva',
    propriedade: 'Fazenda São José',
    imagem: require('../../../assets/images/prod3.jpg'),
  },

  'ana-paula': {
    nome: 'Ana Paula',
    propriedade: 'Sítio Vale Natural',
    imagem: require('../../../assets/images/prod4.jpg'),
  },

  'lucia-ferreira': {
    nome: 'Lúcia Ferreira',
    propriedade: 'Sítio Recanto Verde',
    imagem: require('../../../assets/images/prod5.jpg'),
  },

  'helena-souza': {
    nome: 'Helena Souza',
    propriedade: 'Horta Esperança',
    imagem: require('../../../assets/images/prod6.jpg'),
  },

  'carla-mendes': {
    nome: 'Carla Mendes',
    propriedade: 'Fazenda Boa Terra',
    imagem: require('../../../assets/images/prod7.jpg'),
  },

  'antonio-rocha': {
    nome: 'Antônio Rocha',
    propriedade: 'Sítio Serra Verde',
    imagem: require('../../../assets/images/prod8.jpg'),
  },

  'paulo-henrique': {
    nome: 'Paulo Henrique',
    propriedade: 'Fazenda Santa Clara',
    imagem: require('../../../assets/images/prod9.jpg'),
  },

  'marcos-e-rosa': {
    nome: 'Marcos e Rosa',
    propriedade: 'Sítio Família Oliveira',
    imagem: require('../../../assets/images/prod10.jpg'),
  },

  'carlos-e-mariana': {
    nome: 'Carlos e Mariana',
    propriedade: 'Horta Família Santos',
    imagem: require('../../../assets/images/prod11.jpg'),
  },

  'pedro-e-juliana': {
    nome: 'Pedro e Juliana',
    propriedade: 'Fazenda Raízes da Terra',
    imagem: require('../../../assets/images/prod12.jpg'),
  },
};

export default function ExcedentesProdutorScreen() {
  const { id } = useLocalSearchParams();

  const produtorId = String(id);

  const produtor = produtores[produtorId];

  const excedentesDoProdutor =
    excedentes.filter(
      (item) =>
        item.produtorId === produtorId
    );

  if (!produtor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          Produtor não encontrado
        </Text>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>
            Voltar
          </Text>
        </TouchableOpacity>
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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Excedentes
          </Text>

          <Text style={styles.headerSubtitle}>
            {produtor.propriedade}
          </Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <TouchableOpacity
          style={styles.producerCard}
          onPress={() =>
            router.push(
              `/produtor/${produtorId}`
            )
          }
        >
          <Image
            source={produtor.imagem}
            style={styles.producerImage}
          />

          <View style={styles.producerContent}>
            <Text
              style={styles.producerName}
            >
              {produtor.nome}
            </Text>

            <Text
              style={styles.propertyName}
            >
              {produtor.propriedade}
            </Text>

            <Text style={styles.producerLink}>
              Ver perfil do produtor
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons
            name="leaf-outline"
            size={23}
            color="#004B0A"
          />

          <Text style={styles.infoText}>
            Estes produtos foram
            disponibilizados como excedentes
            pelo produtor para reduzir perdas,
            evitar desperdícios e gerar renda
            com produtos que continuam próprios
            para consumo.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Disponíveis
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {excedentesDoProdutor.length}
            </Text>
          </View>
        </View>

        {excedentesDoProdutor.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="leaf-outline"
              size={43}
              color="#A5B8A7"
            />

            <Text style={styles.emptyTitle}>
              Nenhum excedente disponível
            </Text>

            <Text style={styles.emptyText}>
              Este produtor não possui
              excedentes publicados no momento.
            </Text>

            <TouchableOpacity
              style={styles.otherButton}
              onPress={() =>
                router.push('/excedentes')
              }
            >
              <Text
                style={styles.otherButtonText}
              >
                Ver outros excedentes
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          excedentesDoProdutor.map((item) => {
            const desconto =
              calcularDesconto(
                item.precoOriginal,
                item.precoExcedente
              );

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    `/excedente/${item.id}`
                  )
                }
              >
                <View
                  style={styles.imageContainer}
                >
                  <Image
                    source={item.imagem}
                    style={styles.image}
                  />

                  <View
                    style={styles.discountBadge}
                  >
                    <Text
                      style={
                        styles.discountText
                      }
                    >
                      -{desconto}%
                    </Text>
                  </View>

                  {item.quantidadeDisponivel <=
                    10 && (
                    <View
                      style={
                        styles.lastUnitsBadge
                      }
                    >
                      <Text
                        style={
                          styles.lastUnitsText
                        }
                      >
                        Últimas unidades
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  <Text
                    style={styles.productName}
                  >
                    {item.nome}
                  </Text>

                  <View
                    style={styles.locationRow}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#777777"
                    />

                    <Text
                      style={
                        styles.locationText
                      }
                    >
                      {item.localizacao}
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text
                      style={styles.oldPrice}
                    >
                      {formatarPreco(
                        item.precoOriginal
                      )}
                    </Text>

                    <Text style={styles.price}>
                      {formatarPreco(
                        item.precoExcedente
                      )}
                    </Text>

                    <Text style={styles.unit}>
                      / {item.unidade}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.informationContainer
                    }
                  >
                    <View
                      style={
                        styles.informationItem
                      }
                    >
                      <Ionicons
                        name="cube-outline"
                        size={16}
                        color="#004B0A"
                      />

                      <View
                        style={
                          styles.informationContent
                        }
                      >
                        <Text
                          style={
                            styles.informationLabel
                          }
                        >
                          Disponível
                        </Text>

                        <Text
                          style={
                            styles.informationValue
                          }
                        >
                          {
                            item.quantidadeDisponivel
                          }{' '}
                          {item.unidade}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.informationItem
                      }
                    >
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color="#004B0A"
                      />

                      <View
                        style={
                          styles.informationContent
                        }
                      >
                        <Text
                          style={
                            styles.informationLabel
                          }
                        >
                          Prazo
                        </Text>

                        <Text
                          style={
                            styles.informationValue
                          }
                        >
                          {item.prazo}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.reasonBox}>
                    <Ionicons
                      name="information-circle-outline"
                      size={17}
                      color="#004B0A"
                    />

                    <Text
                      style={styles.reasonText}
                      numberOfLines={2}
                    >
                      {item.motivo}
                    </Text>
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

        <TouchableOpacity
          style={styles.allExcessButton}
          onPress={() =>
            router.push('/excedentes')
          }
        >
          <Ionicons
            name="leaf-outline"
            size={18}
            color="#004B0A"
          />

          <Text
            style={styles.allExcessButtonText}
          >
            Ver todos os excedentes
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.impactCard}>
          <View style={styles.impactIcon}>
            <Ionicons
              name="earth-outline"
              size={25}
              color="#004B0A"
            />
          </View>

          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>
              Menos desperdício
            </Text>

            <Text style={styles.impactText}>
              Comprar excedentes permite que o
              produtor aproveite melhor sua
              produção e ajuda a evitar o
              desperdício de alimentos.
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

  producerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  producerImage: {
    width: 65,
    height: 65,
    borderRadius: 33,
  },

  producerContent: {
    flex: 1,
    marginLeft: 11,
  },

  producerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  propertyName: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },

  producerLink: {
    fontSize: 9,
    color: '#004B0A',
    fontWeight: '600',
    marginTop: 5,
  },

  infoCard: {
    backgroundColor: '#E7F1E8',
    borderRadius: 11,
    padding: 13,
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoText: {
    flex: 1,
    fontSize: 9,
    color: '#555555',
    lineHeight: 14,
    marginLeft: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: 10,
    color: '#004B0A',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
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
    fontSize: 10,
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
    fontSize: 8,
    color: '#A05A00',
    fontWeight: 'bold',
  },

  cardContent: {
    padding: 14,
  },

  productName: {
    fontSize: 17,
    fontWeight: 'bold',
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
    marginTop: 11,
  },

  oldPrice: {
    fontSize: 9,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 7,
  },

  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  unit: {
    fontSize: 9,
    color: '#666666',
    marginLeft: 3,
  },

  informationContainer: {
    flexDirection: 'row',
    marginTop: 13,
    gap: 18,
  },

  informationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  informationContent: {
    marginLeft: 6,
    flex: 1,
  },

  informationLabel: {
    fontSize: 7,
    color: '#888888',
  },

  informationValue: {
    fontSize: 9,
    fontWeight: '600',
    color: '#444444',
    marginTop: 2,
  },

  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F6F8F6',
    padding: 10,
    borderRadius: 8,
    marginTop: 13,
  },

  reasonText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 13,
    color: '#666666',
    marginLeft: 6,
  },

  openRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  openText: {
    fontSize: 10,
    color: '#004B0A',
    fontWeight: '600',
    marginRight: 4,
  },

  emptyCard: {
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
    lineHeight: 15,
    marginTop: 5,
    textAlign: 'center',
  },

  otherButton: {
    marginTop: 15,
    backgroundColor: '#004B0A',
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 8,
  },

  otherButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  allExcessButton: {
    height: 48,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  allExcessButtonText: {
    flex: 1,
    fontSize: 10,
    color: '#004B0A',
    fontWeight: '600',
    marginLeft: 8,
  },

  impactCard: {
    marginTop: 14,
    backgroundColor: '#E7F1E8',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  impactIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  impactContent: {
    flex: 1,
    marginLeft: 11,
  },

  impactTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  impactText: {
    fontSize: 9,
    color: '#555555',
    lineHeight: 14,
    marginTop: 3,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  errorButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 18,
  },

  errorButtonText: {
    color: '#FFFFFF',
  },
});