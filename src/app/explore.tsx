import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function ExploreScreen() {
  const [carregando, setCarregando] =
    useState(true);

  const [mensagem, setMensagem] =
    useState('Testando conexão...');

  const [erro, setErro] =
    useState<string | null>(null);

  async function testarConexao() {
    setCarregando(true);
    setErro(null);
    setMensagem('Consultando o Supabase...');

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .limit(5);

      if (error) {
        setErro(error.message);
        setMensagem(
          'O aplicativo chegou ao Supabase, mas a consulta retornou um erro.'
        );

        console.log(
          'Erro ao consultar Supabase:',
          error
        );

        return;
      }

      setMensagem(
        `Conexão realizada com sucesso! O Supabase respondeu normalmente. Produtos encontrados: ${
          data?.length ?? 0
        }.`
      );

      console.log(
        'Conexão com Supabase funcionando.'
      );

      console.log(
        'Dados recebidos:',
        data
      );
    } catch (error) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido.';

      setErro(mensagemErro);

      setMensagem(
        'Não foi possível concluir o teste.'
      );

      console.log(
        'Erro inesperado no teste do Supabase:',
        error
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    testarConexao();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🌱</Text>
          </View>

          <Text style={styles.title}>
            Teste do Supabase
          </Text>

          <Text style={styles.subtitle}>
            ConectaAgro
          </Text>

          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#004B0A"
              />

              <Text style={styles.loadingText}>
                {mensagem}
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.resultado,
                  erro
                    ? styles.resultadoErro
                    : styles.resultadoSucesso,
                ]}
              >
                <Text
                  style={[
                    styles.resultadoTitulo,
                    erro
                      ? styles.textoErro
                      : styles.textoSucesso,
                  ]}
                >
                  {erro
                    ? 'Erro na consulta'
                    : 'Conexão funcionando'}
                </Text>

                <Text style={styles.mensagem}>
                  {mensagem}
                </Text>

                {erro && (
                  <View
                    style={
                      styles.erroDetalhes
                    }
                  >
                    <Text
                      style={
                        styles.erroDetalhesTitulo
                      }
                    >
                      Detalhes:
                    </Text>

                    <Text
                      style={
                        styles.erroDetalhesTexto
                      }
                    >
                      {erro}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.botao}
                onPress={testarConexao}
              >
                <Text
                  style={styles.botaoTexto}
                >
                  Testar novamente
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.observacao}>
            A tabela produtos pode estar vazia.
            Nesse caso, receber 0 produtos não é
            um erro. O importante é o Supabase
            responder à consulta.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },

  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E7F1E8',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  icon: {
    fontSize: 32,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1C',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 25,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 25,
  },

  loadingText: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginTop: 15,
  },

  resultado: {
    borderRadius: 14,
    padding: 18,
  },

  resultadoSucesso: {
    backgroundColor: '#EAF5EB',
    borderWidth: 1,
    borderColor: '#C7E2CA',
  },

  resultadoErro: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#F0CACA',
  },

  resultadoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  textoSucesso: {
    color: '#004B0A',
  },

  textoErro: {
    color: '#A52222',
  },

  mensagem: {
    fontSize: 13,
    lineHeight: 20,
    color: '#444444',
  },

  erroDetalhes: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E6CCCC',
  },

  erroDetalhesTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8C2020',
  },

  erroDetalhesTexto: {
    fontSize: 11,
    lineHeight: 17,
    color: '#666666',
    marginTop: 5,
  },

  botao: {
    backgroundColor: '#004B0A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  observacao: {
    fontSize: 11,
    lineHeight: 17,
    color: '#888888',
    textAlign: 'center',
    marginTop: 22,
  },
});