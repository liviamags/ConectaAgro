import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { supabase } from '../../lib/supabase';

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  unidade: string;
  estoque: number;
  imagem_url: string | null;
};

export default function AdicionarExcedenteScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState('');
  const [precoExcedente, setPrecoExcedente] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prazo, setPrazo] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const produtoSelecionado = produtos.find(
    (produto) => produto.id === produtoId
  );
  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    try {
      const { data: usuarioData, error: usuarioError } =
        await supabase.auth.getUser();
      if (usuarioError || !usuarioData.user) {
        Alert.alert(
          'Sessão não encontrada',
          'Entre novamente para cadastrar um excedente.'
        );
        return;
      }
      const { data, error } = await supabase
        .from('produtos')
        .select(
          'id, nome, categoria, preco, unidade, estoque, imagem_url'
        )
        .eq('produtor_id', usuarioData.user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.log('Erro ao carregar produtos:', error);
        Alert.alert(
          'Erro',
          'Não foi possível carregar seus produtos.'
        );
        return;
      }
      const produtosFormatados: Produto[] = (data ?? []).map(
        (produto: any) => ({
          id: produto.id,
          nome: produto.nome,
          categoria: produto.categoria || 'Produto',
          preco: Number(produto.preco ?? 0),
          unidade: produto.unidade || 'unidade',
          estoque: Number(produto.estoque ?? 0),
          imagem_url: produto.imagem_url ?? null,
        })
      );
      setProdutos(produtosFormatados);
    } catch (error) {
      console.log('Erro inesperado ao carregar produtos:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao carregar seus produtos.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      carregarProdutos();
    }, [carregarProdutos])
  );
  function selecionarProduto(id: string) {
    setProdutoId(id);
  }
  function converterDataParaISO(valor: string) {
    const partes = valor.trim().split('/');
    if (partes.length !== 3) {
      return null;
    }
    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const ano = Number(partes[2]);
    if (
      !Number.isInteger(dia) ||
      !Number.isInteger(mes) ||
      !Number.isInteger(ano) ||
      ano < 2000
    ) {
      return null;
    }
    const data = new Date(ano, mes - 1, dia);
    if (
      data.getFullYear() !== ano ||
      data.getMonth() !== mes - 1 ||
      data.getDate() !== dia
    ) {
      return null;
    }
    return `${ano}-${String(mes).padStart(2, '0')}-${String(
      dia
    ).padStart(2, '0')}`;
  }
  async function salvarExcedente() {
    if (salvando) {
      return;
    }
    if (!produtoSelecionado) {
      Alert.alert(
        'Produto obrigatório',
        'Selecione o produto que será oferecido como excedente.'
      );
      return;
    }
    const precoConvertido = Number(
      precoExcedente.replace(',', '.')
    );
    const quantidadeConvertida = Number(
      quantidade.replace(',', '.')
    );
    if (
      !precoExcedente.trim() ||
      Number.isNaN(precoConvertido) ||
      precoConvertido <= 0
    ) {
      Alert.alert(
        'Preço inválido',
        'Informe um preço válido para o excedente.'
      );
      return;
    }
    if (precoConvertido >= produtoSelecionado.preco) {
      Alert.alert(
        'Verifique o preço',
        'O preço do excedente deve ser menor que o preço normal do produto.'
      );
      return;
    }
    if (
      !quantidade.trim() ||
      Number.isNaN(quantidadeConvertida) ||
      quantidadeConvertida <= 0
    ) {
      Alert.alert(
        'Quantidade inválida',
        'Informe uma quantidade disponível válida.'
      );
      return;
    }
    if (quantidadeConvertida > produtoSelecionado.estoque) {
      Alert.alert(
        'Quantidade acima do estoque',
        `Este produto possui ${produtoSelecionado.estoque} ${produtoSelecionado.unidade} em estoque.`
      );
      return;
    }
    if (!motivo.trim()) {
      Alert.alert(
        'Motivo obrigatório',
        'Explique brevemente por que esse produto está sendo oferecido como excedente.'
      );
      return;
    }
    if (!prazo.trim()) {
      Alert.alert(
        'Validade obrigatória',
        'Informe a data de validade no formato DD/MM/AAAA.'
      );
      return;
    }
    const dataValidade = converterDataParaISO(prazo);
    if (!dataValidade) {
      Alert.alert(
        'Data inválida',
        'Informe uma data válida no formato DD/MM/AAAA.'
      );
      return;
    }
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [ano, mes, dia] = dataValidade.split('-').map(Number);
    const validade = new Date(ano, mes - 1, dia);
    if (validade < hoje) {
      Alert.alert(
        'Data inválida',
        'A validade não pode ser uma data que já passou.'
      );
      return;
    }
    setSalvando(true);
    try {
      const { data: usuarioData, error: usuarioError } =
        await supabase.auth.getUser();
      if (usuarioError || !usuarioData.user) {
        Alert.alert(
          'Sessão não encontrada',
          'Entre novamente para cadastrar o excedente.'
        );
        return;
      }
      const { error } = await supabase
        .from('excedentes')
        .insert({
          produtor_id: usuarioData.user.id,
          produto_id: produtoSelecionado.id,
          quantidade: quantidadeConvertida,
          preco_promocional: precoConvertido,
          data_validade: dataValidade,
          observacao: motivo.trim(),
          ativo,
        });
      if (error) {
        console.log('Erro ao criar excedente:', error);
        Alert.alert(
          'Erro',
          'Não foi possível criar o excedente.'
        );
        return;
      }
      Alert.alert(
        'Excedente criado!',
        'A oferta foi salva no Supabase e adicionada aos seus excedentes.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace('/area-produtor/excedentes'),
          },
        ]
      );
    } catch (error) {
      console.log('Erro inesperado ao criar excedente:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao criar o excedente.'
      );
    } finally {
      setSalvando(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#004B0A"
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            Novo excedente
          </Text>
          <Text style={styles.subtitle}>
            Crie uma oferta especial
          </Text>
        </View>
        <View style={styles.headerSpace} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#004B0A"
          />
          <Text style={styles.infoText}>
            Selecione um produto que já está
            cadastrado. O preço normal e a imagem
            serão aproveitados automaticamente.
          </Text>
        </View>
        <Text style={styles.sectionTitle}>
          Escolha o produto
        </Text>
        {carregando ? (
          <View style={styles.noProductsCard}>
            <ActivityIndicator size="small" color="#004B0A" />
            <Text style={styles.noProductsText}>
              Carregando seus produtos...
            </Text>
          </View>
        ) : produtos.length === 0 ? (
          <View style={styles.noProductsCard}>
            <Text style={styles.noProductsTitle}>
              Nenhum produto cadastrado
            </Text>
            <Text style={styles.noProductsText}>
              Cadastre um produto antes de criar um
              excedente.
            </Text>
            <TouchableOpacity
              style={styles.goProductsButton}
              onPress={() =>
                router.push(
                  '/area-produtor/adicionar-produto'
                )
              }
            >
              <Text
                style={styles.goProductsButtonText}
              >
                Cadastrar produto
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.productsContainer
            }
          >
            {produtos.map((produto) => {
              const selecionado =
                produtoId === produto.id;
              return (
                <TouchableOpacity
                  key={produto.id}
                  style={[
                    styles.productCard,
                    selecionado &&
                      styles.productCardSelected,
                  ]}
                  onPress={() =>
                    selecionarProduto(produto.id)
                  }
                >
                  {produto.imagem_url ? (
                    <Image
                      source={{ uri: produto.imagem_url }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={[styles.productImage, styles.productImagePlaceholder]}>
                      <Ionicons name="leaf-outline" size={28} color="#668B6C" />
                    </View>
                  )}
                  <Text
                    style={styles.productName}
                    numberOfLines={1}
                  >
                    {produto.nome}
                  </Text>
                  <Text style={styles.productPrice}>
                    R$ {produto.preco
                      .toFixed(2)
                      .replace('.', ',')}
                    /{produto.unidade}
                  </Text>
                  {selecionado && (
                    <View
                      style={
                        styles.selectedIndicator
                      }
                    >
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        {produtoSelecionado && (
          <View style={styles.selectedProductBox}>
            <Text
              style={styles.selectedProductLabel}
            >
              Produto selecionado
            </Text>
            <Text
              style={styles.selectedProductName}
            >
              {produtoSelecionado.nome}
            </Text>
            <Text
              style={styles.selectedProductDetails}
            >
              Preço normal: R${' '}
              {produtoSelecionado.preco
                .toFixed(2)
                .replace('.', ',')}{' '}
              / {produtoSelecionado.unidade}
            </Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>
          Dados da oferta
        </Text>
        <Text style={styles.label}>
          Preço do excedente *
        </Text>
        <View style={styles.inputWithIcon}>
          <Text style={styles.prefix}>R$</Text>
          <TextInput
            style={styles.inputFlex}
            placeholder="Ex.: 3,90"
            value={precoExcedente}
            onChangeText={setPrecoExcedente}
            keyboardType="decimal-pad"
          />
        </View>
        <Text style={styles.helperText}>
          Deve ser menor que o preço normal.
        </Text>
        <Text style={styles.label}>
          Quantidade disponível *
        </Text>
        <View style={styles.inputWithUnit}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Ex.: 12"
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="decimal-pad"
          />
          <Text style={styles.unitText}>
            {produtoSelecionado?.unidade ??
              'Unidade'}
          </Text>
        </View>
        <Text style={styles.label}>
          Motivo do excedente *
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
          ]}
          placeholder="Ex.: Excesso de produção da colheita desta semana."
          value={motivo}
          onChangeText={setMotivo}
          multiline
          textAlignVertical="top"
          maxLength={220}
        />
        <Text style={styles.counter}>
          {motivo.length}/220
        </Text>
        <Text style={styles.label}>
          Data de validade *
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 10/10/2026"
          value={prazo}
          onChangeText={setPrazo}
        />
        <View style={styles.activeCard}>
          <View style={styles.activeInfo}>
            <Text style={styles.activeTitle}>
              Publicar oferta agora
            </Text>
            <Text style={styles.activeText}>
              Se estiver ativa, consumidores poderão
              visualizar esse excedente.
            </Text>
          </View>
          <Switch
            value={ativo}
            onValueChange={setAtivo}
            trackColor={{
              false: '#D5D5D5',
              true: '#91B895',
            }}
            thumbColor={
              ativo ? '#004B0A' : '#F4F4F4'
            }
          />
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={salvarExcedente}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.saveButtonText}>
            Criar excedente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>
            Cancelar
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
  infoCard: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: '#F0F6F1',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 9,
    color: '#536A56',
    lineHeight: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 23,
    marginBottom: 11,
  },
  productsContainer: {
    gap: 10,
    paddingRight: 5,
  },
  productCard: {
    width: 115,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    position: 'relative',
  },
  productCardSelected: {
    borderWidth: 2,
    borderColor: '#004B0A',
    backgroundColor: '#F6FAF6',
  },
  productImage: {
    width: '100%',
    height: 75,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    backgroundColor: '#EDF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 7,
  },
  productPrice: {
    fontSize: 8,
    color: '#004B0A',
    marginTop: 3,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedProductBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F7F9F7',
  },
  selectedProductLabel: {
    fontSize: 8,
    color: '#777777',
  },
  selectedProductName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 2,
  },
  selectedProductDetails: {
    fontSize: 9,
    color: '#666666',
    marginTop: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 7,
  },
  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 9,
    paddingHorizontal: 13,
    fontSize: 11,
    backgroundColor: '#FFFFFF',
  },
  inputWithIcon: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithUnit: {
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
    marginRight: 7,
    color: '#555555',
  },
  unitText: {
    fontSize: 10,
    color: '#777777',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 8,
    color: '#888888',
    marginTop: 5,
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
    lineHeight: 12,
  },
  saveButton: {
    height: 49,
    borderRadius: 9,
    backgroundColor: '#004B0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 11,
  },
  noProductsCard: {
    padding: 17,
    borderRadius: 12,
    backgroundColor: '#F7F9F7',
    alignItems: 'center',
  },
  noProductsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  noProductsText: {
    fontSize: 9,
    color: '#777777',
    marginTop: 4,
    textAlign: 'center',
  },
  goProductsButton: {
    marginTop: 12,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#004B0A',
  },
  goProductsButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
