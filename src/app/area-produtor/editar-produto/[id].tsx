import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../../../lib/supabase';

type Produto = {
  id: string;
  produtor_id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  preco: number;
  unidade: string | null;
  estoque: number | null;
  imagem_url: string | null;
  ativo: boolean | null;
};

export default function EditarProdutoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [unidade, setUnidade] = useState('Kg');
  const [estoque, setEstoque] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [imagemUrlAtual, setImagemUrlAtual] = useState<string | null>(null);
  const [novaImagemUri, setNovaImagemUri] = useState<string | null>(null);
  const [novaImagemMimeType, setNovaImagemMimeType] = useState<string | null>(null);
  const [novaImagemExtensao, setNovaImagemExtensao] = useState<string | null>(null);

  const unidades = ['Kg', 'Unidade', 'Pacote', 'Dúzia', 'Litro'];

  useEffect(() => {
    carregarProduto();
  }, [id]);

  async function carregarProduto() {
    setCarregando(true);

    try {
      if (!id) {
        setProduto(null);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Sua sessão não foi encontrada.');
      }

      const { data, error } = await supabase
        .from('produtos')
        .select(
          'id, produtor_id, nome, descricao, categoria, preco, unidade, estoque, imagem_url, ativo'
        )
        .eq('id', id)
        .eq('produtor_id', user.id)
        .single();

      if (error || !data) {
        console.log('Erro ao buscar produto:', error);
        setProduto(null);
        return;
      }

      const produtoCarregado: Produto = {
        ...data,
        preco: Number(data.preco ?? 0),
        estoque: data.estoque === null ? null : Number(data.estoque),
      };

      setProduto(produtoCarregado);
      setNome(produtoCarregado.nome);
      setCategoria(produtoCarregado.categoria ?? '');
      setPreco(produtoCarregado.preco.toFixed(2).replace('.', ','));
      setUnidade(produtoCarregado.unidade ?? 'Kg');
      setEstoque(String(produtoCarregado.estoque ?? 0).replace('.', ','));
      setDescricao(produtoCarregado.descricao ?? '');
      setAtivo(produtoCarregado.ativo === true);
      setImagemUrlAtual(produtoCarregado.imagem_url);
    } catch (error) {
      console.log('Erro ao carregar produto:', error);
      setProduto(null);
    } finally {
      setCarregando(false);
    }
  }

  function descobrirExtensao(uri: string, mimeType?: string | null) {
    if (mimeType?.includes('png')) return 'png';
    if (mimeType?.includes('webp')) return 'webp';
    if (mimeType?.includes('heic')) return 'heic';
    if (mimeType?.includes('heif')) return 'heif';

    const semParametros = uri.split('?')[0];
    const extensao = semParametros.split('.').pop()?.toLowerCase();

    if (
      extensao &&
      ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(extensao)
    ) {
      return extensao === 'jpeg' ? 'jpg' : extensao;
    }

    return 'jpg';
  }

  function descobrirMimeType(extensao: string, mimeType?: string | null) {
    if (mimeType) return mimeType;
    if (extensao === 'png') return 'image/png';
    if (extensao === 'webp') return 'image/webp';
    if (extensao === 'heic') return 'image/heic';
    if (extensao === 'heif') return 'image/heif';
    return 'image/jpeg';
  }

  async function escolherNovaFoto() {
    if (salvando || excluindo) return;

    const permissao =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à galeria para escolher uma foto do produto.'
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (resultado.canceled || !resultado.assets[0]) return;

    const imagem = resultado.assets[0];
    const extensao = descobrirExtensao(imagem.uri, imagem.mimeType);

    setNovaImagemUri(imagem.uri);
    setNovaImagemMimeType(
      descobrirMimeType(extensao, imagem.mimeType)
    );
    setNovaImagemExtensao(extensao);
  }

  function obterCaminhoStorage(url: string | null) {
    if (!url) return null;

    try {
      const marcador = '/storage/v1/object/public/produtos/';
      const indice = url.indexOf(marcador);

      if (indice === -1) return null;

      const caminho = url.substring(indice + marcador.length);
      return caminho ? decodeURIComponent(caminho) : null;
    } catch {
      return null;
    }
  }

  async function salvarAlteracoes() {
    if (!produto || salvando || excluindo) return;

    if (
      !nome.trim() ||
      !categoria.trim() ||
      !preco.trim() ||
      !estoque.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha nome, categoria, preço e estoque.'
      );
      return;
    }

    const precoNumero = Number(preco.replace(',', '.'));
    const estoqueNumero = Number(estoque.replace(',', '.'));

    if (Number.isNaN(precoNumero) || precoNumero <= 0) {
      Alert.alert('Preço inválido', 'Informe um preço válido.');
      return;
    }

    if (Number.isNaN(estoqueNumero) || estoqueNumero < 0) {
      Alert.alert(
        'Estoque inválido',
        'Informe uma quantidade válida.'
      );
      return;
    }

    setSalvando(true);

    let caminhoNovaImagem: string | null = null;
    let novaImagemUrl: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Sua sessão não foi encontrada.');
      }

      if (produto.produtor_id !== user.id) {
        throw new Error('Este produto não pertence à sua conta.');
      }

      if (novaImagemUri) {
        const extensao =
          novaImagemExtensao ??
          descobrirExtensao(novaImagemUri, novaImagemMimeType);

        const mimeType =
          novaImagemMimeType ?? descobrirMimeType(extensao);

        const arquivo = new File(novaImagemUri);
        const arrayBuffer = await arquivo.arrayBuffer();

        caminhoNovaImagem =
          `${user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(caminhoNovaImagem, arrayBuffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Não foi possível enviar a nova foto: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from('produtos')
          .getPublicUrl(caminhoNovaImagem);

        novaImagemUrl = publicUrlData.publicUrl;
      }

      const imagemFinal = novaImagemUrl ?? imagemUrlAtual;

      const { error: updateError } = await supabase
        .from('produtos')
        .update({
          nome: nome.trim(),
          categoria: categoria.trim(),
          preco: precoNumero,
          unidade,
          estoque: estoqueNumero,
          descricao:
            descricao.trim() ||
            'Produto disponível diretamente com o produtor.',
          ativo,
          imagem_url: imagemFinal,
        })
        .eq('id', produto.id)
        .eq('produtor_id', user.id);

      if (updateError) {
        if (caminhoNovaImagem) {
          await supabase.storage
            .from('produtos')
            .remove([caminhoNovaImagem]);
        }

        throw new Error(
          `Não foi possível atualizar o produto: ${updateError.message}`
        );
      }

      if (novaImagemUrl && imagemUrlAtual) {
        const caminhoAntigo = obterCaminhoStorage(imagemUrlAtual);

        if (caminhoAntigo) {
          const { error: removerAntigaError } =
            await supabase.storage
              .from('produtos')
              .remove([caminhoAntigo]);

          if (removerAntigaError) {
            console.log(
              'Produto atualizado, mas não foi possível remover a foto antiga:',
              removerAntigaError
            );
          }
        }
      }

      Alert.alert(
        'Alterações salvas',
        'O produto foi atualizado com sucesso.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace('/area-produtor/produtos'),
          },
        ]
      );
    } catch (error) {
      console.log('Erro ao salvar produto:', error);

      Alert.alert(
        'Não foi possível salvar',
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    if (!produto || salvando || excluindo) return;

    Alert.alert(
      'Excluir produto',
      `Deseja realmente excluir "${produto.nome}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: excluirProduto,
        },
      ]
    );
  }

  async function excluirProduto() {
    if (!produto || excluindo) return;

    setExcluindo(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Sua sessão não foi encontrada.');
      }

      const { error: deleteError } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produto.id)
        .eq('produtor_id', user.id);

      if (deleteError) {
        throw new Error(
          `Não foi possível excluir o produto: ${deleteError.message}`
        );
      }

      const caminhoImagem = obterCaminhoStorage(imagemUrlAtual);

      if (caminhoImagem) {
        const { error: storageError } = await supabase.storage
          .from('produtos')
          .remove([caminhoImagem]);

        if (storageError) {
          console.log(
            'Produto excluído, mas não foi possível remover sua foto:',
            storageError
          );
        }
      }

      router.replace('/area-produtor/produtos');
    } catch (error) {
      console.log('Erro ao excluir produto:', error);

      Alert.alert(
        'Não foi possível excluir',
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setExcluindo(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.notFoundContainer}>
        <ActivityIndicator size="large" color="#004B0A" />
        <Text style={styles.loadingText}>
          Carregando produto...
        </Text>
      </View>
    );
  }

  if (!produto) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={55}
          color="#999999"
        />

        <Text style={styles.notFoundTitle}>
          Produto não encontrado
        </Text>

        <TouchableOpacity
          style={styles.notFoundButton}
          onPress={() =>
            router.replace('/area-produtor/produtos')
          }
        >
          <Text style={styles.notFoundButtonText}>
            Voltar para produtos
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imagemExibida = novaImagemUri ?? imagemUrlAtual;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={salvando || excluindo}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.headerTexts}>
          <Text style={styles.title}>Editar produto</Text>
          <Text style={styles.subtitle}>{produto.nome}</Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Foto do produto</Text>

        <TouchableOpacity
          style={styles.photoCard}
          onPress={escolherNovaFoto}
          disabled={salvando || excluindo}
          activeOpacity={0.8}
        >
          {imagemExibida ? (
            <Image
              source={{ uri: imagemExibida }}
              style={styles.productPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons
                name="image-outline"
                size={35}
                color="#A7B8A9"
              />
            </View>
          )}

          <View style={styles.photoInfo}>
            <Text style={styles.photoTitle}>
              {novaImagemUri
                ? 'Nova foto selecionada'
                : 'Foto atual'}
            </Text>

            <Text style={styles.photoText}>
              Toque para escolher outra foto da galeria.
            </Text>

            <View style={styles.changePhotoRow}>
              <Ionicons
                name="images-outline"
                size={16}
                color="#004B0A"
              />
              <Text style={styles.changePhotoText}>
                Trocar foto
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {novaImagemUri && (
          <TouchableOpacity
            style={styles.cancelPhotoButton}
            onPress={() => {
              setNovaImagemUri(null);
              setNovaImagemMimeType(null);
              setNovaImagemExtensao(null);
            }}
            disabled={salvando || excluindo}
          >
            <Text style={styles.cancelPhotoText}>
              Cancelar troca de foto
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Nome do produto *</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          editable={!salvando && !excluindo}
        />

        <Text style={styles.label}>Categoria *</Text>
        <TextInput
          style={styles.input}
          value={categoria}
          onChangeText={setCategoria}
          editable={!salvando && !excluindo}
        />

        <Text style={styles.label}>Preço *</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currency}>R$</Text>
          <TextInput
            style={styles.priceInput}
            value={preco}
            onChangeText={setPreco}
            keyboardType="decimal-pad"
            editable={!salvando && !excluindo}
          />
        </View>

        <Text style={styles.label}>Unidade de venda</Text>
        <View style={styles.unitsContainer}>
          {unidades.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.unitButton,
                unidade === item &&
                  styles.unitButtonSelected,
              ]}
              onPress={() => setUnidade(item)}
              disabled={salvando || excluindo}
            >
              <Text
                style={[
                  styles.unitText,
                  unidade === item &&
                    styles.unitTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Estoque disponível *</Text>
        <TextInput
          style={styles.input}
          value={estoque}
          onChangeText={setEstoque}
          keyboardType="decimal-pad"
          editable={!salvando && !excluindo}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          textAlignVertical="top"
          editable={!salvando && !excluindo}
        />

        <View style={styles.activeCard}>
          <View style={styles.activeInfo}>
            <Text style={styles.activeTitle}>
              Disponível para venda
            </Text>
            <Text style={styles.activeText}>
              {ativo
                ? 'O produto está visível para os consumidores.'
                : 'O produto está oculto do catálogo.'}
            </Text>
          </View>

          <Switch
            value={ativo}
            onValueChange={setAtivo}
            disabled={salvando || excluindo}
            trackColor={{
              false: '#D3D3D3',
              true: '#8DBB94',
            }}
            thumbColor={ativo ? '#004B0A' : '#F4F4F4'}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (salvando || excluindo) && styles.disabledButton,
          ]}
          onPress={salvarAlteracoes}
          disabled={salvando || excluindo}
        >
          {salvando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="save-outline"
              size={20}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.saveButtonText}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (salvando || excluindo) && styles.disabledButton,
          ]}
          onPress={confirmarExclusao}
          disabled={salvando || excluindo}
        >
          {excluindo ? (
            <ActivityIndicator size="small" color="#B42318" />
          ) : (
            <Ionicons
              name="trash-outline"
              size={19}
              color="#B42318"
            />
          )}

          <Text style={styles.deleteButtonText}>
            {excluindo ? 'Excluindo...' : 'Excluir produto'}
          </Text>
        </TouchableOpacity>
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



  headerTexts: {

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

    paddingBottom: 45,

  },



  label: {

    fontSize: 12,

    fontWeight: '600',

    marginBottom: 7,

  },



  input: {

    minHeight: 45,

    borderWidth: 1,

    borderColor: '#D2D2D2',

    borderRadius: 8,

    paddingHorizontal: 12,

    marginBottom: 17,

    fontSize: 12,

  },



  descriptionInput: {

    minHeight: 105,

    paddingTop: 12,

  },



  priceInputContainer: {

    height: 45,

    borderWidth: 1,

    borderColor: '#D2D2D2',

    borderRadius: 8,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 17,

  },



  currency: {

    marginLeft: 12,

    fontSize: 12,

    fontWeight: '600',

    color: '#004B0A',

  },



  priceInput: {

    flex: 1,

    paddingHorizontal: 8,

    fontSize: 12,

  },



  unitsContainer: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 7,

    marginBottom: 18,

  },



  unitButton: {

    paddingHorizontal: 13,

    paddingVertical: 8,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: '#D3D3D3',

  },



  unitButtonSelected: {

    backgroundColor: '#004B0A',

    borderColor: '#004B0A',

  },



  unitText: {

    fontSize: 10,

    color: '#555555',

  },



  unitTextSelected: {

    color: '#FFFFFF',

    fontWeight: '600',

  },



  activeCard: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F7F9F7',

    padding: 14,

    borderRadius: 11,

    marginBottom: 22,

  },



  activeInfo: {

    flex: 1,

  },



  activeTitle: {

    fontSize: 12,

    fontWeight: '600',

  },



  activeText: {

    fontSize: 9,

    color: '#777777',

    marginTop: 3,

  },



  saveButton: {

    height: 48,

    borderRadius: 9,

    backgroundColor: '#004B0A',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,

  },



  saveButtonText: {

    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '600',

  },



  deleteButton: {

    height: 46,

    marginTop: 11,

    borderRadius: 9,

    backgroundColor: '#FFF1F0',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

  },



  deleteButtonText: {

    color: '#B42318',

    fontSize: 12,

    fontWeight: '600',

  },



  notFoundContainer: {

    flex: 1,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    padding: 30,

  },



  notFoundTitle: {

    fontSize: 17,

    fontWeight: 'bold',

    marginTop: 12,

  },



  notFoundButton: {

    backgroundColor: '#004B0A',

    borderRadius: 8,

    paddingHorizontal: 18,

    paddingVertical: 10,

    marginTop: 18,

  },



  notFoundButtonText: {

    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '600',

  },


  loadingText: {
    marginTop: 10,
    fontSize: 10,
    color: '#777777',
  },

  photoCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },

  productPhoto: {
    width: 92,
    height: 92,
    borderRadius: 9,
  },

  photoPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 9,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },

  photoTitle: {
    fontSize: 12,
    fontWeight: '600',
  },

  photoText: {
    fontSize: 9,
    color: '#777777',
    lineHeight: 13,
    marginTop: 4,
  },

  changePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  changePhotoText: {
    fontSize: 10,
    color: '#004B0A',
    fontWeight: '600',
    marginLeft: 5,
  },

  cancelPhotoButton: {
    alignSelf: 'flex-start',
    marginBottom: 17,
    paddingVertical: 4,
  },

  cancelPhotoText: {
    fontSize: 9,
    color: '#B42318',
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.65,
  },
});