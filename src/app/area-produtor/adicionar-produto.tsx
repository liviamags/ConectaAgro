import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';

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

import { supabase } from '../../lib/supabase';

export default function AdicionarProdutoScreen() {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [unidade, setUnidade] = useState('Kg');
  const [estoque, setEstoque] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [imagemUri, setImagemUri] =
    useState<string | null>(null);

  const [imagemMimeType, setImagemMimeType] =
    useState('image/jpeg');

  const [imagemExtensao, setImagemExtensao] =
    useState('jpg');

  const [salvando, setSalvando] =
    useState(false);

  const unidades = [
    'Kg',
    'Unidade',
    'Pacote',
    'Dúzia',
    'Litro',
  ];

  function descobrirMimeType(
    nomeArquivo?: string | null,
    uri?: string
  ) {
    const arquivo =
      `${nomeArquivo || ''} ${uri || ''}`.toLowerCase();

    if (arquivo.includes('.png')) {
      return 'image/png';
    }

    if (arquivo.includes('.webp')) {
      return 'image/webp';
    }

    if (arquivo.includes('.heic')) {
      return 'image/heic';
    }

    if (arquivo.includes('.heif')) {
      return 'image/heif';
    }

    return 'image/jpeg';
  }

  function descobrirExtensao(
    nomeArquivo?: string | null,
    uri?: string,
    mimeType?: string
  ) {
    if (nomeArquivo) {
      const partes = nomeArquivo.split('.');

      if (partes.length > 1) {
        const extensao =
          partes[partes.length - 1].toLowerCase();

        if (
          extensao === 'jpg' ||
          extensao === 'jpeg' ||
          extensao === 'png' ||
          extensao === 'webp' ||
          extensao === 'heic' ||
          extensao === 'heif'
        ) {
          return extensao;
        }
      }
    }

    if (uri) {
      const uriSemParametros =
        uri.split('?')[0];

      const partes =
        uriSemParametros.split('.');

      if (partes.length > 1) {
        const extensao =
          partes[partes.length - 1].toLowerCase();

        if (
          extensao === 'jpg' ||
          extensao === 'jpeg' ||
          extensao === 'png' ||
          extensao === 'webp' ||
          extensao === 'heic' ||
          extensao === 'heif'
        ) {
          return extensao;
        }
      }
    }

    if (mimeType === 'image/png') {
      return 'png';
    }

    if (mimeType === 'image/webp') {
      return 'webp';
    }

    if (mimeType === 'image/heic') {
      return 'heic';
    }

    if (mimeType === 'image/heif') {
      return 'heif';
    }

    return 'jpg';
  }

  async function escolherImagem() {
    if (salvando) {
      return;
    }

    try {
      const permissao =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita que o ConectaAgro acesse suas fotos para escolher uma imagem do produto.'
        );

        return;
      }

      const resultado =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
          });

      if (
        resultado.canceled ||
        !resultado.assets ||
        resultado.assets.length === 0
      ) {
        return;
      }

      const imagem =
        resultado.assets[0];

      if (!imagem.uri) {
        Alert.alert(
          'Erro',
          'Não foi possível carregar a imagem escolhida.'
        );

        return;
      }

      const mimeType =
        imagem.mimeType ||
        descobrirMimeType(
          imagem.fileName,
          imagem.uri
        );

      const extensao =
        descobrirExtensao(
          imagem.fileName,
          imagem.uri,
          mimeType
        );

      setImagemUri(imagem.uri);
      setImagemMimeType(mimeType);
      setImagemExtensao(extensao);
    } catch (error) {
      console.log(
        'Erro ao escolher imagem:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível abrir sua galeria.'
      );
    }
  }

  function removerImagem() {
    if (salvando) {
      return;
    }

    setImagemUri(null);
    setImagemMimeType('image/jpeg');
    setImagemExtensao('jpg');
  }

  async function prepararImagem() {
    if (!imagemUri) {
      throw new Error(
        'Escolha uma foto para o produto.'
      );
    }

    try {
      const arquivo =
        new File(imagemUri);

      if (!arquivo.exists) {
        throw new Error(
          'O arquivo da imagem não foi encontrado.'
        );
      }

      const arrayBuffer =
        await arquivo.arrayBuffer();

      if (
        !arrayBuffer ||
        arrayBuffer.byteLength === 0
      ) {
        throw new Error(
          'A imagem selecionada está vazia.'
        );
      }

      return arrayBuffer;
    } catch (error) {
      console.log(
        'Erro ao preparar imagem:',
        error
      );

      throw new Error(
        'Não foi possível preparar a foto do produto para envio.'
      );
    }
  }

  async function salvarProduto() {
    if (salvando) {
      return;
    }

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

    if (!imagemUri) {
      Alert.alert(
        'Foto obrigatória',
        'Escolha uma foto do produto antes de cadastrá-lo.'
      );

      return;
    }

    const precoNumero = Number(
      preco.replace(',', '.')
    );

    const estoqueNumero = Number(
      estoque.replace(',', '.')
    );

    if (
      Number.isNaN(precoNumero) ||
      precoNumero <= 0
    ) {
      Alert.alert(
        'Preço inválido',
        'Informe um preço válido.'
      );

      return;
    }

    if (
      Number.isNaN(estoqueNumero) ||
      estoqueNumero < 0
    ) {
      Alert.alert(
        'Estoque inválido',
        'Informe uma quantidade válida.'
      );

      return;
    }

    setSalvando(true);

    let caminhoImagem:
      | string
      | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          'Sua sessão não foi encontrada. Entre novamente na sua conta.'
        );
      }

      const arrayBuffer =
        await prepararImagem();

      const nomeArquivo =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(
            2,
            10
          )}.${imagemExtensao}`;

      caminhoImagem =
        `${user.id}/${nomeArquivo}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from('produtos')
        .upload(
          caminhoImagem,
          arrayBuffer,
          {
            contentType:
              imagemMimeType,
            cacheControl: '3600',
            upsert: false,
          }
        );

      if (uploadError) {
        console.log(
          'Erro ao enviar foto do produto:',
          uploadError
        );

        throw new Error(
          `Não foi possível enviar a foto: ${uploadError.message}`
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from('produtos')
        .getPublicUrl(
          caminhoImagem
        );

      const imagemUrl =
        publicUrlData?.publicUrl;

      if (!imagemUrl) {
        await supabase.storage
          .from('produtos')
          .remove([
            caminhoImagem,
          ]);

        caminhoImagem = null;

        throw new Error(
          'Não foi possível obter o endereço da foto.'
        );
      }

      const {
        error: insertError,
      } = await supabase
        .from('produtos')
        .insert({
          produtor_id: user.id,
          nome: nome.trim(),
          descricao:
            descricao.trim() ||
            'Produto disponível diretamente com o produtor.',
          categoria:
            categoria.trim(),
          preco: precoNumero,
          unidade,
          estoque: estoqueNumero,
          imagem_url: imagemUrl,
          ativo,
        });

      if (insertError) {
        console.log(
          'Erro ao cadastrar produto:',
          insertError
        );

        if (caminhoImagem) {
          await supabase.storage
            .from('produtos')
            .remove([
              caminhoImagem,
            ]);

          caminhoImagem = null;
        }

        throw new Error(
          `Não foi possível cadastrar o produto: ${insertError.message}`
        );
      }

      caminhoImagem = null;

      Alert.alert(
        'Produto cadastrado',
        'O produto foi adicionado com sucesso.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(
                '/area-produtor/produtos'
              ),
          },
        ]
      );
    } catch (error) {
      console.log(
        'Erro ao salvar produto:',
        error
      );

      if (caminhoImagem) {
        await supabase.storage
          .from('produtos')
          .remove([
            caminhoImagem,
          ]);
      }

      const mensagem =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro desconhecido.';

      Alert.alert(
        'Não foi possível cadastrar',
        mensagem
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={salvando}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View
          style={styles.headerTexts}
        >
          <Text style={styles.title}>
            Novo produto
          </Text>

          <Text
            style={styles.subtitle}
          >
            Cadastre um produto da sua propriedade
          </Text>
        </View>

        <View
          style={styles.headerSpace}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={styles.infoCard}
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#004B0A"
          />

          <Text
            style={styles.infoText}
          >
            Essas informações serão
            exibidas para os consumidores
            no ConectaAgro.
          </Text>
        </View>

        <Text style={styles.label}>
          Nome do produto *
        </Text>

        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Couve"
          editable={!salvando}
        />

        <Text style={styles.label}>
          Categoria *
        </Text>

        <TextInput
          style={styles.input}
          value={categoria}
          onChangeText={setCategoria}
          placeholder="Ex: Hortaliças"
          editable={!salvando}
        />

        <Text style={styles.label}>
          Preço *
        </Text>

        <View
          style={
            styles.priceInputContainer
          }
        >
          <Text
            style={styles.currency}
          >
            R$
          </Text>

          <TextInput
            style={
              styles.priceInput
            }
            value={preco}
            onChangeText={setPreco}
            placeholder="0,00"
            keyboardType="decimal-pad"
            editable={!salvando}
          />
        </View>

        <Text style={styles.label}>
          Unidade de venda
        </Text>

        <View
          style={
            styles.unitsContainer
          }
        >
          {unidades.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.unitButton,
                unidade === item &&
                  styles.unitButtonSelected,
              ]}
              onPress={() =>
                setUnidade(item)
              }
              disabled={salvando}
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

        <Text style={styles.label}>
          Estoque disponível *
        </Text>

        <TextInput
          style={styles.input}
          value={estoque}
          onChangeText={setEstoque}
          placeholder={`Quantidade em ${unidade}`}
          keyboardType="decimal-pad"
          editable={!salvando}
        />

        <Text style={styles.label}>
          Descrição
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.descriptionInput,
          ]}
          value={descricao}
          onChangeText={
            setDescricao
          }
          placeholder="Conte um pouco sobre o produto..."
          multiline
          textAlignVertical="top"
          editable={!salvando}
        />

        <Text style={styles.label}>
          Foto do produto *
        </Text>

        {imagemUri ? (
          <>
            <Image
              source={{
                uri: imagemUri,
              }}
              style={
                styles.productImage
              }
            />

            <View
              style={
                styles.photoActions
              }
            >
              <TouchableOpacity
                style={
                  styles.changePhotoButton
                }
                onPress={
                  escolherImagem
                }
                disabled={salvando}
              >
                <Ionicons
                  name="images-outline"
                  size={19}
                  color="#004B0A"
                />

                <Text
                  style={
                    styles.changePhotoText
                  }
                >
                  Trocar foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.removePhotoButton
                }
                onPress={
                  removerImagem
                }
                disabled={salvando}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#B42318"
                />

                <Text
                  style={
                    styles.removePhotoText
                  }
                >
                  Remover
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={styles.photoCard}
            onPress={
              escolherImagem
            }
            disabled={salvando}
            activeOpacity={0.8}
          >
            <View
              style={styles.photoIcon}
            >
              <Ionicons
                name="image-outline"
                size={28}
                color="#004B0A"
              />
            </View>

            <View
              style={styles.photoInfo}>
              <Text
                style={
                  styles.photoTitle
                }
              >
                Escolher foto
              </Text>

              <Text
                style={
                  styles.photoText
                }
              >
                Toque aqui para selecionar
                uma imagem da galeria do
                celular.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#004B0A"
            />
          </TouchableOpacity>
        )}

        <View
          style={styles.activeCard}
        >
          <View
            style={styles.activeInfo}
          >
            <Text
              style={
                styles.activeTitle
              }
            >
              Produto ativo
            </Text>

            <Text
              style={
                styles.activeText
              }
            >
              Deixar disponível para os
              consumidores assim que for
              cadastrado.
            </Text>
          </View>

          <Switch
            value={ativo}
            onValueChange={setAtivo}
            disabled={salvando}
            trackColor={{
              false: '#D3D3D3',
              true: '#8DBB94',
            }}
            thumbColor={
              ativo
                ? '#004B0A'
                : '#F4F4F4'
            }
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            salvando &&
              styles.disabledButton,
          ]}
          onPress={salvarProduto}
          disabled={salvando}
        >
          {salvando ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Cadastrando...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Cadastrar produto
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.cancelButton
          }
          onPress={() =>
            router.back()
          }
          disabled={salvando}
        >
          <Text
            style={
              styles.cancelButtonText
            }
          >
            Cancelar
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
    fontSize: 9,
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

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F6F1',
    borderRadius: 11,
    padding: 13,
    alignItems: 'center',
    marginBottom: 22,
  },

  infoText: {
    flex: 1,
    fontSize: 10,
    color: '#46604A',
    lineHeight: 15,
    marginLeft: 9,
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#004B0A',
    marginLeft: 12,
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

  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AAB9AC',
    borderRadius: 11,
    padding: 13,
    marginBottom: 17,
  },

  photoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoInfo: {
    flex: 1,
    marginLeft: 11,
  },

  photoTitle: {
    fontSize: 11,
    fontWeight: '600',
  },

  photoText: {
    fontSize: 8,
    color: '#777777',
    lineHeight: 12,
    marginTop: 3,
  },

  productImage: {
    width: '100%',
    height: 230,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  photoActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 9,
    marginBottom: 17,
  },

  changePhotoButton: {
    flex: 1,
    height: 43,
    borderRadius: 9,
    backgroundColor: '#F0F6F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  changePhotoText: {
    fontSize: 10,
    color: '#004B0A',
    fontWeight: '600',
  },

  removePhotoButton: {
    paddingHorizontal: 14,
    height: 43,
    borderRadius: 9,
    backgroundColor: '#FFF1F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  removePhotoText: {
    fontSize: 10,
    color: '#B42318',
    fontWeight: '600',
  },

  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 11,
    backgroundColor: '#F7F9F7',
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
    lineHeight: 13,
    marginTop: 3,
    paddingRight: 10,
  },

  saveButton: {
    height: 48,
    backgroundColor: '#004B0A',
    borderRadius: 9,
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

  disabledButton: {
    opacity: 0.65,
  },

  cancelButton: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  cancelButtonText: {
    color: '#666666',
    fontSize: 11,
  },
});