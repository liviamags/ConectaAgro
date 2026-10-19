import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../../../lib/supabase';

type ExcedenteEdicao = {
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
};

export default function EditarExcedenteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [excedente, setExcedente] = useState<ExcedenteEdicao | null>(null);
  const [precoExcedente, setPrecoExcedente] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [validade, setValidade] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregarExcedente();
  }, [id]);

  function formatarDataParaTela(data: string | null) {
    if (!data) return '';
    const partes = data.split('-');
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function converterDataParaBanco(valor: string) {
    const texto = valor.trim();
    if (!texto) return null;

    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return undefined;

    const [, dia, mes, ano] = match;
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

    if (
      data.getFullYear() !== Number(ano) ||
      data.getMonth() !== Number(mes) - 1 ||
      data.getDate() !== Number(dia)
    ) {
      return undefined;
    }

    return `${ano}-${mes}-${dia}`;
  }

  async function carregarExcedente() {
    try {
      setCarregando(true);

      if (!id) {
        setExcedente(null);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Sessão inválida', 'Entre novamente para continuar.');
        return;
      }

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
        .eq('id', id)
        .eq('produtor_id', user.id)
        .maybeSingle();

      if (error) {
        console.log('Erro ao carregar excedente:', error);
        Alert.alert('Erro', 'Não foi possível carregar o excedente.');
        setExcedente(null);
        return;
      }

      if (!data) {
        setExcedente(null);
        return;
      }

      const produtoRelacao = Array.isArray(data.produto)
        ? data.produto[0]
        : data.produto;

      if (!produtoRelacao) {
        setExcedente(null);
        return;
      }

      const normalizado: ExcedenteEdicao = {
        id: data.id,
        produtor_id: data.produtor_id,
        produto_id: data.produto_id,
        quantidade: Number(data.quantidade),
        preco_promocional: Number(data.preco_promocional),
        data_validade: data.data_validade,
        observacao: data.observacao,
        ativo: data.ativo,
        produto: {
          nome: produtoRelacao.nome,
          categoria: produtoRelacao.categoria,
          preco: Number(produtoRelacao.preco),
          unidade: produtoRelacao.unidade,
          imagem_url: produtoRelacao.imagem_url,
        },
      };

      setExcedente(normalizado);
      setPrecoExcedente(
        normalizado.preco_promocional.toFixed(2).replace('.', ',')
      );
      setQuantidade(String(normalizado.quantidade));
      setObservacao(normalizado.observacao ?? '');
      setValidade(formatarDataParaTela(normalizado.data_validade));
      setAtivo(normalizado.ativo);
    } finally {
      setCarregando(false);
    }
  }

  async function salvarAlteracoes() {
    if (!excedente || salvando) return;

    const preco = Number(precoExcedente.replace(',', '.'));
    const qtd = Number(quantidade.replace(',', '.'));
    const dataBanco = converterDataParaBanco(validade);

    if (Number.isNaN(preco) || preco <= 0) {
      Alert.alert('Preço inválido', 'Informe um preço válido.');
      return;
    }

    if (preco >= excedente.produto.preco) {
      Alert.alert(
        'Verifique o preço',
        'O preço do excedente deve ser menor que o preço normal.'
      );
      return;
    }

    if (Number.isNaN(qtd) || qtd <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade válida.');
      return;
    }

    if (dataBanco === undefined) {
      Alert.alert(
        'Data inválida',
        'Informe a validade no formato DD/MM/AAAA.'
      );
      return;
    }

    try {
      setSalvando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Sessão inválida', 'Entre novamente para continuar.');
        return;
      }

      const { error } = await supabase
        .from('excedentes')
        .update({
          quantidade: qtd,
          preco_promocional: preco,
          data_validade: dataBanco,
          observacao: observacao.trim() || null,
          ativo,
        })
        .eq('id', excedente.id)
        .eq('produtor_id', user.id);

      if (error) {
        console.log('Erro ao atualizar excedente:', error);
        Alert.alert('Erro', 'Não foi possível salvar as alterações.');
        return;
      }

      Alert.alert(
        'Excedente atualizado!',
        'As alterações foram salvas.',
        [{
          text: 'OK',
          onPress: () => router.replace('/area-produtor/excedentes'),
        }]
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    if (!excedente || excluindo) return;

    Alert.alert(
      'Excluir excedente',
      'Essa ação removerá a oferta. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: excluirExcedente,
        },
      ]
    );
  }

  async function excluirExcedente() {
    if (!excedente || excluindo) return;

    try {
      setExcluindo(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Sessão inválida', 'Entre novamente para continuar.');
        return;
      }

      const { error } = await supabase
        .from('excedentes')
        .delete()
        .eq('id', excedente.id)
        .eq('produtor_id', user.id);

      if (error) {
        console.log('Erro ao excluir excedente:', error);
        Alert.alert('Erro', 'Não foi possível excluir o excedente.');
        return;
      }

      router.replace('/area-produtor/excedentes');
    } finally {
      setExcluindo(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.notFound}>
        <ActivityIndicator size="large" color="#004B0A" />
        <Text style={styles.notFoundTitle}>Carregando excedente...</Text>
      </View>
    );
  }

  if (!excedente) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle-outline" size={55} color="#999999" />
        <Text style={styles.notFoundTitle}>Excedente não encontrado</Text>
        <TouchableOpacity
          style={styles.notFoundButton}
          onPress={() => router.replace('/area-produtor/excedentes')}
        >
          <Text style={styles.notFoundButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#004B0A" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>Editar excedente</Text>
          <Text style={styles.subtitle}>Atualize sua oferta</Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.productCard}>
          {excedente.produto.imagem_url ? (
            <Image
              source={{ uri: excedente.produto.imagem_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.productImage,
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#E3ECE4',
                },
              ]}
            >
              <Ionicons name="image-outline" size={28} color="#7A947D" />
            </View>
          )}

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{excedente.produto.nome}</Text>
            <Text style={styles.category}>
              {excedente.produto.categoria ?? 'Sem categoria'}
            </Text>
            <Text style={styles.normalPrice}>
              Preço normal: R$ {excedente.produto.preco.toFixed(2).replace('.', ',')} /{' '}
              {excedente.produto.unidade ?? 'un.'}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Preço do excedente</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>R$</Text>
          <TextInput
            style={styles.inputFlex}
            value={precoExcedente}
            onChangeText={setPrecoExcedente}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.label}>Quantidade disponível</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="decimal-pad"
          />
          <Text style={styles.unitText}>
            {excedente.produto.unidade ?? 'un.'}
          </Text>
        </View>

        <Text style={styles.label}>Observação</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={observacao}
          onChangeText={setObservacao}
          multiline
          textAlignVertical="top"
          maxLength={220}
          placeholder="Ex.: produto maduro, promoção de fim de feira..."
        />
        <Text style={styles.counter}>{observacao.length}/220</Text>

        <Text style={styles.label}>Data de validade</Text>
        <TextInput
          style={styles.input}
          value={validade}
          onChangeText={setValidade}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
        />

        <View style={styles.activeCard}>
          <View style={styles.activeInfo}>
            <Text style={styles.activeTitle}>Oferta ativa</Text>
            <Text style={styles.activeText}>
              Desative quando o excedente não estiver mais disponível.
            </Text>
          </View>

          <Switch
            value={ativo}
            onValueChange={setAtivo}
            trackColor={{ false: '#D5D5D5', true: '#91B895' }}
            thumbColor={ativo ? '#004B0A' : '#F4F4F4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, salvando && { opacity: 0.65 }]}
          onPress={salvarAlteracoes}
          disabled={salvando || excluindo}
        >
          {salvando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="save-outline" size={19} color="#FFFFFF" />
          )}
          <Text style={styles.saveButtonText}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, excluindo && { opacity: 0.65 }]}
          onPress={confirmarExclusao}
          disabled={salvando || excluindo}
        >
          {excluindo ? (
            <ActivityIndicator size="small" color="#B42318" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#B42318" />
          )}
          <Text style={styles.deleteButtonText}>
            {excluindo ? 'Excluindo...' : 'Excluir excedente'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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

    paddingHorizontal: 18,

    paddingTop: 22,

    paddingBottom: 14,

    borderBottomWidth: 1,

    borderBottomColor: '#F0F0F0',

  },



  backButton: {

    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: '#F0F6F1',

    alignItems: 'center',

    justifyContent: 'center',

  },



  headerInfo: {

    flex: 1,

    marginLeft: 12,

  },



  title: {

    fontSize: 20,

    fontWeight: 'bold',

  },



  subtitle: {

    fontSize: 10,

    color: '#777777',

    marginTop: 2,

  },



  headerSpace: {

    width: 42,

  },



  content: {

    padding: 18,

    paddingBottom: 50,

  },



  productCard: {

    flexDirection: 'row',

    padding: 13,

    borderRadius: 12,

    backgroundColor: '#F0F6F1',

  },



  productImage: {

    width: 80,

    height: 80,

    borderRadius: 10,

  },



  productInfo: {

    flex: 1,

    marginLeft: 12,

    justifyContent: 'center',

  },



  productName: {

    fontSize: 15,

    fontWeight: 'bold',

    color: '#004B0A',

  },



  category: {

    fontSize: 9,

    color: '#777777',

    marginTop: 3,

  },



  normalPrice: {

    fontSize: 9,

    color: '#555555',

    marginTop: 7,

  },



  label: {

    fontSize: 11,

    fontWeight: '600',

    marginTop: 18,

    marginBottom: 7,

  },



  input: {

    minHeight: 47,

    borderWidth: 1,

    borderColor: '#DADADA',

    borderRadius: 9,

    paddingHorizontal: 13,

    fontSize: 11,

  },



  inputRow: {

    minHeight: 47,

    borderWidth: 1,

    borderColor: '#DADADA',

    borderRadius: 9,

    paddingHorizontal: 13,

    flexDirection: 'row',

    alignItems: 'center',

  },



  inputFlex: {

    flex: 1,

    fontSize: 11,

    paddingVertical: 12,

  },



  prefix: {

    fontSize: 11,

    fontWeight: '600',

    color: '#555555',

    marginRight: 7,

  },



  unitText: {

    fontSize: 10,

    color: '#777777',

  },



  textArea: {

    height: 95,

    paddingTop: 12,

  },



  counter: {

    fontSize: 8,

    color: '#999999',

    textAlign: 'right',

    marginTop: 4,

  },



  activeCard: {

    marginTop: 20,

    padding: 13,

    borderRadius: 11,

    backgroundColor: '#F7F9F7',

    flexDirection: 'row',

    alignItems: 'center',

  },



  activeInfo: {

    flex: 1,

    paddingRight: 10,

  },



  activeTitle: {

    fontSize: 11,

    fontWeight: '600',

  },



  activeText: {

    fontSize: 8,

    color: '#777777',

    marginTop: 3,

  },



  saveButton: {

    height: 49,

    marginTop: 24,

    borderRadius: 9,

    backgroundColor: '#004B0A',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,

  },



  saveButtonText: {

    color: '#FFFFFF',

    fontSize: 12,

    fontWeight: '600',

  },



  deleteButton: {

    height: 46,

    marginTop: 10,

    borderRadius: 9,

    backgroundColor: '#FFF1F0',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,

  },



  deleteButtonText: {

    color: '#B42318',

    fontSize: 11,

    fontWeight: '600',

  },



  notFound: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

  },



  notFoundTitle: {

    fontSize: 17,

    fontWeight: 'bold',

    marginTop: 12,

  },



  notFoundButton: {

    marginTop: 18,

    paddingHorizontal: 18,

    paddingVertical: 10,

    borderRadius: 8,

    backgroundColor: '#004B0A',

  },



  notFoundButtonText: {

    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '600',

  },

});
