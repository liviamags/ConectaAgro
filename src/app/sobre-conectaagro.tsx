
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Icone = keyof typeof Ionicons.glyphMap;

const funcionalidades: {
  icone: Icone;
  titulo: string;
  descricao: string;
}[] = [
  {
    icone: 'storefront-outline',
    titulo: 'Valorização dos produtores',
    descricao:
      'Uma vitrine digital para ampliar a visibilidade dos pequenos produtores locais.',
  },
  {
    icone: 'basket-outline',
    titulo: 'Produtos e pedidos',
    descricao:
      'Um espaço para consumidores conhecerem produtos e realizarem pedidos.',
  },
  {
    icone: 'map-outline',
    titulo: 'Mapa de produtores',
    descricao:
      'Facilita a descoberta de produtores e a conexão com a produção regional.',
  },
  {
    icone: 'leaf-outline',
    titulo: 'Sistema de excedentes',
    descricao:
      'Ajuda a dar destino a alimentos que poderiam não ser vendidos, reduzindo o desperdício.',
  },
  {
    icone: 'newspaper-outline',
    titulo: 'Publicações',
    descricao:
      'Permite acompanhar novidades, produtos e informações compartilhadas pelos produtores.',
  },
  {
    icone: 'megaphone-outline',
    titulo: 'Afiliações',
    descricao:
      'Cria oportunidades de divulgação e de ampliação do alcance dos produtores.',
  },
];

const objetivos: {
  numero: string;
  nome: string;
  descricao: string;
  icone: Icone;
}[] = [
  {
    numero: '2',
    nome: 'Fome Zero e Agricultura Sustentável',
    descricao:
      'Valorizar a produção local e contribuir para sistemas alimentares mais sustentáveis.',
    icone: 'nutrition-outline',
  },
  {
    numero: '3',
    nome: 'Saúde e Bem-Estar',
    descricao:
      'Incentivar o acesso e a valorização de alimentos frescos e de qualidade.',
    icone: 'heart-outline',
  },
  {
    numero: '12',
    nome: 'Consumo e Produção Responsáveis',
    descricao:
      'Estimular o consumo consciente e o aproveitamento de excedentes alimentares.',
    icone: 'refresh-circle-outline',
  },
];

const integrantes = [
  'Artur Manoel de Medeiros',
  'João Gabriel Fernandes',
  'Julia Natali Amorim',
  'Lívia Magalhães',
  'Miguel Gonçalves Lemes de Souza',
  'Nicolas Emanuel Gomes',
  'Rafael César Soares',
];

export default function SobreConectaAgroScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Sobre o ConectaAgro
          </Text>
          <Text style={styles.headerSubtitle}>
            Conheça nosso projeto
          </Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="leaf"
              size={39}
              color="#004B0A"
            />
          </View>

          <Text style={styles.projectName}>
            ConectaAgro
          </Text>

          <Text style={styles.projectSlogan}>
            Conectando o campo à sua mesa
          </Text>

          <View style={styles.projectBadge}>
            <Ionicons
              name="school-outline"
              size={15}
              color="#004B0A"
            />
            <Text style={styles.projectBadgeText}>
              Projeto educacional
            </Text>
          </View>

          <Text style={styles.heroDescription}>
            Tecnologia, agricultura e sustentabilidade
            trabalhando juntas para aproximar pessoas
            e fortalecer a produção local.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Nossa missão
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.sectionIcon}>
            <Ionicons
              name="heart-outline"
              size={24}
              color="#004B0A"
            />
          </View>

          <Text style={styles.cardHeading}>
            Fortalecer quem produz
          </Text>

          <Text style={styles.paragraph}>
            O ConectaAgro nasceu com o propósito de
            aproximar pequenos produtores agrícolas
            dos consumidores, proporcionando maior
            visibilidade aos seus produtos e criando
            novas oportunidades de conexão e venda.
          </Text>

          <Text style={styles.paragraph}>
            Nosso projeto também busca incentivar
            o consumo consciente, valorizar a
            agricultura local e contribuir para
            a redução do desperdício de alimentos.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          O problema que queremos resolver
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.sectionIcon}>
            <Ionicons
              name="bulb-outline"
              size={24}
              color="#004B0A"
            />
          </View>

          <Text style={styles.paragraph}>
            Muitos pequenos produtores enfrentam
            dificuldades para divulgar seus produtos,
            alcançar novos consumidores e vender
            toda a sua produção.
          </Text>

          <Text style={styles.paragraph}>
            Ao mesmo tempo, consumidores podem ter
            dificuldade para encontrar produtores
            próximos e conhecer opções de alimentos
            disponíveis em sua região.
          </Text>

          <Text style={styles.paragraph}>
            O ConectaAgro propõe utilizar a
            tecnologia para reduzir essa distância.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          O que você encontra no aplicativo
        </Text>

        <View style={styles.featuresCard}>
          {funcionalidades.map((item, index) => (
            <View key={item.titulo}>
              {index > 0 && (
                <View style={styles.divider} />
              )}

              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={item.icone}
                    size={23}
                    color="#004B0A"
                  />
                </View>

                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>
                    {item.titulo}
                  </Text>

                  <Text style={styles.featureDescription}>
                    {item.descricao}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Nosso compromisso com as ODS
        </Text>

        <Text style={styles.sectionDescription}>
          O projeto está alinhado a três Objetivos
          de Desenvolvimento Sustentável da ONU.
        </Text>

        {objetivos.map((ods) => (
          <View
            key={ods.numero}
            style={styles.odsCard}
          >
            <View style={styles.odsNumber}>
              <Text style={styles.odsNumberText}>
                {ods.numero}
              </Text>
            </View>

            <View style={styles.odsContent}>
              <View style={styles.odsHeadingRow}>
                <Ionicons
                  name={ods.icone}
                  size={18}
                  color="#004B0A"
                />
                <Text style={styles.odsLabel}>
                  ODS {ods.numero}
                </Text>
              </View>

              <Text style={styles.odsTitle}>
                {ods.nome}
              </Text>

              <Text style={styles.odsDescription}>
                {ods.descricao}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>
          Quem está por trás do projeto?
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.sectionIcon}>
            <Ionicons
              name="people-outline"
              size={24}
              color="#004B0A"
            />
          </View>

          <Text style={styles.cardHeading}>
            Nossa equipe
          </Text>

          <Text style={styles.paragraph}>
            O ConectaAgro é um projeto educacional
            desenvolvido por estudantes do Ensino Médio
            Técnico em Informática da FUNEC Riacho,
            em Contagem, Minas Gerais.
          </Text>

          <Text style={styles.teamHeading}>
            Integrantes do projeto
          </Text>

          {integrantes.map((nome) => (
            <View
              key={nome}
              style={styles.memberRow}
            >
              <Ionicons
                name="person-outline"
                size={17}
                color="#004B0A"
              />
              <Text style={styles.memberName}>
                {nome}
              </Text>
            </View>
          ))}

          <View style={styles.teamDivider} />

          <Text style={styles.teamHeading}>
            Professora orientadora
          </Text>

          <View style={styles.memberRow}>
            <Ionicons
              name="school-outline"
              size={18}
              color="#004B0A"
            />
            <Text style={styles.memberName}>
              Vanusa Ramos Aguiar
            </Text>
          </View>

          <Text style={styles.teamHeading}>
            Professor coorientador
          </Text>

          <View style={styles.memberRow}>
            <Ionicons
              name="school-outline"
              size={18}
              color="#004B0A"
            />
            <Text style={styles.memberName}>
              Willian Douglas Teixeira
            </Text>
          </View>
        </View>

        <View style={styles.finalCard}>
          <Ionicons
            name="leaf-outline"
            size={28}
            color="#004B0A"
          />

          <Text style={styles.finalTitle}>
            Conectar para transformar
          </Text>

          <Text style={styles.finalDescription}>
            Acreditamos que a tecnologia pode
            aproximar pessoas, valorizar o trabalho
            no campo e contribuir para um futuro
            mais sustentável.
          </Text>
        </View>

        <Text style={styles.footerText}>
          ConectaAgro • Protótipo educacional
        </Text>
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
    paddingTop: 27,
    paddingBottom: 14,
    paddingHorizontal: 18,
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

  headerContent: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
  },

  headerSubtitle: {
    fontSize: 9,
    color: '#777777',
    marginTop: 3,
  },

  headerSpace: {
    width: 42,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 45,
  },

  heroCard: {
    backgroundColor: '#E7F1E8',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
  },

  logoCircle: {
    width: 83,
    height: 83,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  projectName: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  projectSlogan: {
    fontSize: 12,
    color: '#456C4A',
    marginTop: 4,
    textAlign: 'center',
  },

  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginTop: 17,
    gap: 7,
  },

  projectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#004B0A',
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: '#456C4A',
    textAlign: 'center',
    marginTop: 17,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 23,
    marginBottom: 10,
  },

  sectionDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: '#777777',
    marginBottom: 12,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 19,
  },

  sectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  cardHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#004B0A',
    marginBottom: 10,
  },

  paragraph: {
    fontSize: 12,
    lineHeight: 20,
    color: '#555555',
    marginBottom: 10,
  },

  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: 10,
    lineHeight: 16,
    color: '#777777',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginLeft: 71,
  },

  odsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  odsNumber: {
    width: 51,
    height: 51,
    borderRadius: 12,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  odsNumberText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
  },

  odsContent: {
    flex: 1,
  },

  odsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  odsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  odsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 6,
  },

  odsDescription: {
    fontSize: 10,
    lineHeight: 16,
    color: '#777777',
  },

  teamHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 12,
    marginBottom: 12,
  },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },

  memberName: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#555555',
  },

  teamDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: 8,
    marginBottom: 10,
  },

  finalCard: {
    backgroundColor: '#E7F1E8',
    borderRadius: 15,
    padding: 23,
    marginTop: 24,
    alignItems: 'center',
  },

  finalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 11,
    textAlign: 'center',
  },

  finalDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: '#456C4A',
    textAlign: 'center',
    marginTop: 10,
  },

  footerText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    marginTop: 24,
  },
});
