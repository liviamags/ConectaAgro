
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const EMAIL_SUPORTE = 'conectaagro.tec123@gmail.com';

const perguntas = [
  {
    pergunta: 'Como faço para comprar um produto?',
    resposta:
      'Acesse a área de produtos, escolha o que deseja, adicione ao carrinho e siga as etapas para realizar seu pedido.',
  },
  {
    pergunta: 'Como acompanho meus pedidos?',
    resposta:
      'Acesse Perfil e toque em Meus pedidos para consultar suas compras e acompanhar as informações disponíveis.',
  },
  {
    pergunta: 'Como encontro produtores próximos?',
    resposta:
      'Abra o mapa de produtores para visualizar os produtores cadastrados e suas localizações disponíveis.',
  },
  {
    pergunta: 'O que são os excedentes?',
    resposta:
      'São produtos disponibilizados pelos produtores para aproveitar alimentos que poderiam não ser vendidos, ajudando a combater o desperdício.',
  },
  {
    pergunta: 'Como funciona o programa de afiliados?',
    resposta:
      'O programa permite divulgar produtores participantes e receber comissões por vendas atribuídas à sua indicação, conforme as condições definidas por cada produtor.',
  },
  {
    pergunta: 'Como altero meus dados ou minha foto?',
    resposta:
      'Acesse Perfil. Toque em Editar perfil para modificar suas informações ou toque na foto para escolher uma nova imagem.',
  },
  {
    pergunta: 'Como altero minha senha?',
    resposta:
      'Acesse Perfil, depois Configurações e Segurança. Informe e confirme sua nova senha para salvar a alteração.',
  },
  {
    pergunta: 'O que faço se encontrar um problema?',
    resposta:
      'Entre em contato com nossa equipe pelo e-mail de suporte. Descreva o problema e, se possível, informe em qual tela ele aconteceu.',
  },
];

export default function AjudaSuporteScreen() {
  const [perguntaAberta, setPerguntaAberta] =
    useState<number | null>(null);

  async function entrarEmContato() {
    const assunto = encodeURIComponent(
      'Suporte - ConectaAgro'
    );

    const corpo = encodeURIComponent(
      'Olá, equipe ConectaAgro!\n\nPreciso de ajuda com:\n\n'
    );

    const endereco =
      `mailto:${EMAIL_SUPORTE}?subject=${assunto}&body=${corpo}`;

    try {
      await Linking.openURL(endereco);
    } catch (error) {
      console.log('Erro ao abrir e-mail:', error);

      Alert.alert(
        'Não foi possível abrir o e-mail',
        `Entre em contato pelo endereço ${EMAIL_SUPORTE}.`
      );
    }
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
            size={25}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Ajuda e suporte
          </Text>

          <Text style={styles.headerSubtitle}>
            Estamos aqui para ajudar
          </Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="help-circle-outline"
              size={35}
              color="#004B0A"
            />
          </View>

          <Text style={styles.introTitle}>
            Como podemos ajudar?
          </Text>

          <Text style={styles.introText}>
            Encontre respostas para as dúvidas mais
            comuns sobre o ConectaAgro.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Perguntas frequentes
        </Text>

        <View style={styles.faqCard}>
          {perguntas.map((item, index) => {
            const aberta = perguntaAberta === index;

            return (
              <View key={index}>
                {index > 0 && (
                  <View style={styles.divider} />
                )}

                <TouchableOpacity
                  style={styles.questionButton}
                  onPress={() =>
                    setPerguntaAberta(
                      aberta ? null : index
                    )
                  }
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{
                    expanded: aberta,
                  }}
                >
                  <Text style={styles.questionText}>
                    {item.pergunta}
                  </Text>

                  <Ionicons
                    name={
                      aberta
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={19}
                    color="#004B0A"
                  />
                </TouchableOpacity>

                {aberta && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>
                      {item.resposta}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          Ainda precisa de ajuda?
        </Text>

        <View style={styles.contactCard}>
          <View style={styles.contactIcon}>
            <Ionicons
              name="mail-outline"
              size={27}
              color="#004B0A"
            />
          </View>

          <Text style={styles.contactTitle}>
            Fale com nossa equipe
          </Text>

          <Text style={styles.contactDescription}>
            Se sua dúvida não foi respondida, envie
            uma mensagem para o suporte do ConectaAgro.
          </Text>

          <Text selectable style={styles.email}>
            {EMAIL_SUPORTE}
          </Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={entrarEmContato}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.contactButtonText}>
              Entrar em contato
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          ConectaAgro • Conectando pessoas e produtores
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

  introCard: {
    backgroundColor: '#E7F1E8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },

  introIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  introTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#004B0A',
    textAlign: 'center',
  },

  introText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#555555',
    textAlign: 'center',
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 19,
    marginBottom: 11,
  },

  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },

  questionButton: {
    minHeight: 65,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  questionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
    marginRight: 12,
    lineHeight: 18,
  },

  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 17,
  },

  answerText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#666666',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },

  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },

  contactIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },

  contactDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: '#777777',
    textAlign: 'center',
    marginTop: 8,
  },

  email: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004B0A',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 18,
  },

  contactButton: {
    width: '100%',
    minHeight: 47,
    backgroundColor: '#004B0A',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  footerText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    marginTop: 24,
  },
});
