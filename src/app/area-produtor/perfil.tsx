import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
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
import { supabase } from '../../lib/supabase';
export default function PerfilProdutorScreen() {
  const [carregando, setCarregando] =
    useState(true);
  const [salvando, setSalvando] =
    useState(false);
  const [editando, setEditando] =
    useState(false);
  const [userId, setUserId] =
    useState('');
  const [quantidadeExcedentesAtivos, setQuantidadeExcedentesAtivos] = useState(0);
  const [quantidadeProdutosAtivos, setQuantidadeProdutosAtivos] = useState(0);
  const [quantidadeProdutosCadastrados, setQuantidadeProdutosCadastrados] = useState(0);
  const [quantidadePedidos, setQuantidadePedidos] = useState(0);
  const [quantidadePublicacoes, setQuantidadePublicacoes] = useState(0);
  const [imagemUrl, setImagemUrl] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [salvandoLocalizacao, setSalvandoLocalizacao] = useState(false);
  const [afiliacaoAtiva, setAfiliacaoAtiva] = useState(false);
  const [comissaoAfiliado, setComissaoAfiliado] = useState('5');
  const [salvandoAfiliacao, setSalvandoAfiliacao] = useState(false);
  const [nome, setNome] =
    useState('');
  const [propriedade, setPropriedade] =
    useState('');
  const [cidade, setCidade] =
    useState('');
  const [estado, setEstado] =
    useState('');
  const [categoria, setCategoria] =
    useState('');
  const [descricao, setDescricao] =
    useState('');
  const [dadosSalvos, setDadosSalvos] =
    useState({
      nome: '',
      propriedade: '',
      cidade: '',
      estado: '',
      categoria: '',
      descricao: '',
    });
  useEffect(() => {
    carregarPerfil();
  }, []);
  async function carregarPerfil() {
    setCarregando(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.log(
          'Erro ao identificar usuário:',
          userError
        );
        Alert.alert(
          'Erro',
          'Não foi possível identificar o usuário.'
        );
        return;
      }
      if (!user) {
        Alert.alert(
          'Sessão não encontrada',
          'Entre novamente na sua conta.'
        );
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      const [
        perfilResponse,
        produtorResponse,
        excedentesAtivosResponse,
        produtosAtivosResponse,
        produtosCadastradosResponse,
        publicacoesResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'nome, email, telefone, role'
          )
          .eq('id', user.id)
          .single(),
        supabase
          .from('produtores')
          .select(
            'nome_fazenda, cidade, estado, descricao, certificacao, tipo_producao, endereco, imagem_url, latitude, longitude, afiliacao_ativa, comissao_afiliado'
          )
          .eq('id', user.id)
          .single(),
        supabase
          .from('excedentes')
          .select('*', { count: 'exact', head: true })
          .eq('produtor_id', user.id)
          .eq('ativo', true),
        supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('produtor_id', user.id)
          .eq('ativo', true),
        supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('produtor_id', user.id),
        supabase
          .from('publicacoes')
          .select('*', { count: 'exact', head: true })
          .eq('produtor_id', user.id),
      ]);
      if (perfilResponse.error) {
        console.log(
          'Erro ao buscar profile:',
          perfilResponse.error
        );
        Alert.alert(
          'Erro',
          'Não foi possível carregar os dados do responsável.'
        );
        return;
      }
      if (produtorResponse.error) {
        console.log(
          'Erro ao buscar produtor:',
          produtorResponse.error
        );
        Alert.alert(
          'Erro',
          'Não foi possível carregar os dados da propriedade.'
        );
        return;
      }
      if (excedentesAtivosResponse.error) {
        console.log(
          'Erro ao contar excedentes ativos:',
          excedentesAtivosResponse.error
        );
      } else {
        setQuantidadeExcedentesAtivos(
          excedentesAtivosResponse.count ?? 0
        );
      }
      if (produtosAtivosResponse.error) {
        console.log('Erro ao contar produtos ativos:', produtosAtivosResponse.error);
      } else {
        setQuantidadeProdutosAtivos(produtosAtivosResponse.count ?? 0);
      }
      if (produtosCadastradosResponse.error) {
        console.log('Erro ao contar produtos cadastrados:', produtosCadastradosResponse.error);
      } else {
        setQuantidadeProdutosCadastrados(produtosCadastradosResponse.count ?? 0);
      }
      const { data: itensPedidoResponse, error: itensPedidoError } =
        await supabase
          .from('pedido_itens')
          .select(`
            pedido_id,
            produtos:produto_id (
              produtor_id
            ),
            excedentes:excedente_id (
              produtor_id
            )
          `);
      if (itensPedidoError) {
        console.log(
          'Erro ao contar pedidos do produtor:',
          itensPedidoError
        );
      } else {
        const pedidosDoProdutor = new Set<string>();
        (itensPedidoResponse ?? []).forEach((item: any) => {
          const produtorDoProduto = item.produtos?.produtor_id;
          const produtorDoExcedente = item.excedentes?.produtor_id;
          if (
            produtorDoProduto === user.id ||
            produtorDoExcedente === user.id
          ) {
            pedidosDoProdutor.add(item.pedido_id);
          }
        });
        setQuantidadePedidos(pedidosDoProdutor.size);
      }
      if (publicacoesResponse.error) {
        console.log('Erro ao contar publicações:', publicacoesResponse.error);
      } else {
        setQuantidadePublicacoes(publicacoesResponse.count ?? 0);
      }
      const perfil = perfilResponse.data;
      const produtor = produtorResponse.data;
      setImagemUrl(produtor?.imagem_url ?? '');
      setLatitude(produtor?.latitude ?? null);
      setLongitude(produtor?.longitude ?? null);
    setAfiliacaoAtiva(produtor?.afiliacao_ativa ?? false);
    setComissaoAfiliado(String(produtor?.comissao_afiliado ?? 5));
      const novosDados = {
        nome:
          perfil?.nome ?? '',
        propriedade:
          produtor?.nome_fazenda ?? '',
        cidade:
          produtor?.cidade ?? '',
        estado:
          produtor?.estado ?? '',
        categoria:
          produtor?.tipo_producao ?? '',
        descricao:
          produtor?.descricao ?? '',
      };
      setNome(novosDados.nome);
      setPropriedade(
        novosDados.propriedade
      );
      setCidade(novosDados.cidade);
      setEstado(novosDados.estado);
      setCategoria(
        novosDados.categoria
      );
      setDescricao(
        novosDados.descricao
      );
      setDadosSalvos(novosDados);
    } catch (error) {
      console.log(
        'Erro inesperado ao carregar perfil:',
        error
      );
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado ao carregar o perfil.'
      );
    } finally {
      setCarregando(false);
    }
  }
  function preencherCamposComDadosSalvos() {
    setNome(dadosSalvos.nome);
    setPropriedade(
      dadosSalvos.propriedade
    );
    setCidade(dadosSalvos.cidade);
    setEstado(dadosSalvos.estado);
    setCategoria(
      dadosSalvos.categoria
    );
    setDescricao(
      dadosSalvos.descricao
    );
  }
  function iniciarEdicao() {
    preencherCamposComDadosSalvos();
    setEditando(true);
  }
  function cancelarEdicao() {
    preencherCamposComDadosSalvos();
    setEditando(false);
  }
  async function salvarPerfil() {
    if (
      !nome.trim() ||
      !propriedade.trim() ||
      !cidade.trim() ||
      !categoria.trim()
    ) {
      Alert.alert(
        'Atenção',
        'Preencha nome do responsável, nome da propriedade, cidade e tipo de produção.'
      );
      return;
    }
    if (!userId) {
      Alert.alert(
        'Erro',
        'Não foi possível identificar sua conta.'
      );
      return;
    }
    setSalvando(true);
    try {
      const {
        error: perfilError,
      } = await supabase
        .from('profiles')
        .update({
          nome: nome.trim(),
        })
        .eq('id', userId);
      if (perfilError) {
        console.log(
          'Erro ao atualizar profile:',
          perfilError
        );
        Alert.alert(
          'Erro ao salvar',
          'Não foi possível atualizar o nome do responsável.'
        );
        return;
      }
      const {
        error: produtorError,
      } = await supabase
        .from('produtores')
        .update({
          nome_fazenda:
            propriedade.trim(),
          cidade:
            cidade.trim(),
          estado:
            estado.trim() || null,
          tipo_producao:
            categoria.trim(),
          descricao:
            descricao.trim() || null,
        })
        .eq('id', userId);
      if (produtorError) {
        console.log(
          'Erro ao atualizar produtor:',
          produtorError
        );
        Alert.alert(
          'Erro ao salvar',
          'O nome foi atualizado, mas não foi possível atualizar os dados da propriedade.'
        );
        return;
      }
      const novosDados = {
        nome: nome.trim(),
        propriedade:
          propriedade.trim(),
        cidade:
          cidade.trim(),
        estado:
          estado.trim(),
        categoria:
          categoria.trim(),
        descricao:
          descricao.trim(),
      };
      setDadosSalvos(novosDados);
      setNome(novosDados.nome);
      setPropriedade(
        novosDados.propriedade
      );
      setCidade(
        novosDados.cidade
      );
      setEstado(
        novosDados.estado
      );
      setCategoria(
        novosDados.categoria
      );
      setDescricao(
        novosDados.descricao
      );
      setEditando(false);
      Alert.alert(
        'Perfil atualizado!',
        'As informações foram salvas no banco de dados com sucesso.'
      );
    } catch (error) {
      console.log(
        'Erro inesperado ao salvar perfil:',
        error
      );
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado ao salvar o perfil.'
      );
    } finally {
      setSalvando(false);
    }
  }
  async function escolherFotoPerfil() {
    if (!userId || enviandoFoto) {
      return;
    }
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à galeria para escolher uma foto.'
        );
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (resultado.canceled) {
        return;
      }
      setEnviandoFoto(true);
      const imagem = resultado.assets[0];
      const extensaoOriginal =
        imagem.fileName?.split('.').pop()?.toLowerCase() ||
        imagem.uri.split('.').pop()?.toLowerCase() ||
        'jpg';
      const extensao =
        ['jpg', 'jpeg', 'png', 'webp'].includes(extensaoOriginal)
          ? extensaoOriginal
          : 'jpg';
      const contentType =
        imagem.mimeType ||
        (extensao === 'png'
          ? 'image/png'
          : extensao === 'webp'
            ? 'image/webp'
            : 'image/jpeg');
      const base64 = await FileSystem.readAsStringAsync(imagem.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const caracteres =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let bits = 0;
      let valor = 0;
      const bytes: number[] = [];
      for (const caractere of base64.replace(/=+$/, '')) {
        valor = (valor << 6) | caracteres.indexOf(caractere);
        bits += 6;
        if (bits >= 8) {
          bits -= 8;
          bytes.push((valor >> bits) & 0xff);
        }
      }
      const caminhoFoto = `${userId}/perfil.${extensao}`;
const { error: uploadError } = await supabase.storage
        .from('produtores')
        .upload(caminhoFoto, new Uint8Array(bytes), {
          contentType,
          upsert: true,
        });
      if (uploadError) {
        console.log('Erro ao enviar foto:', uploadError);
        Alert.alert(
          'Erro',
          'Não foi possível enviar a foto. Tente novamente.'
        );
        return;
      }
      const { data: urlData } = supabase.storage
        .from('produtores')
        .getPublicUrl(caminhoFoto);
      const urlComAtualizacao =
        `${urlData.publicUrl}?v=${Date.now()}`;
      const { error: salvarFotoError } = await supabase
        .from('produtores')
        .update({ imagem_url: urlComAtualizacao })
        .eq('id', userId);
      if (salvarFotoError) {
        console.log(
          'Erro ao salvar URL da foto:',
          salvarFotoError
        );
        Alert.alert(
          'Erro',
          'A foto foi enviada, mas não foi possível vinculá-la ao perfil.'
        );
        return;
      }
      setImagemUrl(urlComAtualizacao);
      Alert.alert(
        'Foto atualizada!',
        'Sua nova foto de perfil foi salva com sucesso.'
      );
    } catch (error) {
      console.log(
        'Erro inesperado ao atualizar foto:',
        error
      );
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado ao atualizar a foto.'
      );
    } finally {
      setEnviandoFoto(false);
    }
  }
  async function salvarLocalizacaoPropriedade() {
    if (!userId || salvandoLocalizacao) return;
    try {
      setSalvandoLocalizacao(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à localização para registrar a posição da propriedade.');
        return;
      }
      const localizacao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const novaLatitude = localizacao.coords.latitude;
      const novaLongitude = localizacao.coords.longitude;
      const { error } = await supabase
        .from('produtores')
        .update({ latitude: novaLatitude, longitude: novaLongitude })
        .eq('id', userId);
      if (error) {
        console.log('Erro ao salvar localização da propriedade:', error);
        Alert.alert('Erro', 'Não foi possível salvar a localização da propriedade.');
        return;
      }
      setLatitude(novaLatitude);
      setLongitude(novaLongitude);
      Alert.alert('Localização salva!', 'A posição da propriedade foi registrada com sucesso.');
    } catch (error) {
      console.log('Erro inesperado ao salvar localização:', error);
      Alert.alert('Erro', 'Não foi possível obter a localização. Verifique se a localização do aparelho está ativada.');
    } finally {
      setSalvandoLocalizacao(false);
    }
  }
  async function salvarConfiguracaoAfiliacao() {
    if (!userId || salvandoAfiliacao) return;
    const percentual = Number(comissaoAfiliado.replace(',', '.'));
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      Alert.alert('Atenção', 'Informe uma comissão entre 0% e 100%.');
      return;
    }
    try {
      setSalvandoAfiliacao(true);
      const { error } = await supabase
        .from('produtores')
        .update({
          afiliacao_ativa: afiliacaoAtiva,
          comissao_afiliado: percentual,
        })
        .eq('id', userId);
      if (error) {
        console.log('Erro ao salvar configuração de afiliação:', error);
        Alert.alert('Erro', 'Não foi possível salvar as configurações de afiliação.');
        return;
      }
      setComissaoAfiliado(String(percentual));
      Alert.alert(
        'Configuração salva!',
        afiliacaoAtiva
          ? `Seu programa de afiliados está ativo com ${percentual}% de comissão por venda.`
          : 'Seu programa de afiliados está desativado.'
      );
    } catch (error) {
      console.log('Erro inesperado ao salvar afiliação:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado ao salvar a afiliação.');
    } finally {
      setSalvandoAfiliacao(false);
    }
  }
  function formatarLocalizacao() {
    if (
      dadosSalvos.cidade &&
      dadosSalvos.estado
    ) {
      return `${dadosSalvos.cidade}, ${dadosSalvos.estado}`;
    }
    if (dadosSalvos.cidade) {
      return dadosSalvos.cidade;
    }
    if (dadosSalvos.estado) {
      return dadosSalvos.estado;
    }
    return 'Localização não informada';
  }
  function sairDaConta() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            const { error } =
              await supabase.auth.signOut();
            if (error) {
              console.log(
                'Erro ao sair da conta:',
                error
              );
              Alert.alert(
                'Erro',
                'Não foi possível sair da conta.'
              );
              return;
            }
            router.replace('/login');
          },
        },
      ]
    );
  }
  function visualizarComoConsumidor() {
    if (!userId) {
      Alert.alert(
        'Aguarde',
        'Os dados do perfil ainda estão sendo carregados.'
      );
      return;
    }
    router.push(
      `/produtor/${userId}`
    );
  }
  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#004B0A"
        />
        <Text style={styles.loadingText}>
          Carregando perfil...
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              Meu perfil
            </Text>
            <Text style={styles.headerSubtitle}>
              Gerencie as informações da sua
              propriedade
            </Text>
          </View>
          {!editando && (
            <TouchableOpacity
              style={styles.headerEditButton}
              onPress={iniciarEdicao}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color="#004B0A"
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.profileCard}>
          <TouchableOpacity
              style={styles.imageContainer}
              onPress={escolherFotoPerfil}
              disabled={enviandoFoto}
              activeOpacity={0.8}
            >
              {imagemUrl ? (
                <Image source={{ uri: imagemUrl }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Ionicons name="person-outline" size={43} color="#66856B" />
                </View>
              )}
              <View style={styles.photoEditBadge}>
                {enviandoFoto ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="camera"
                    size={14}
                    color="#FFFFFF"
                  />
                )}
              </View>
              <View style={styles.verifiedBadge}>
              <Ionicons
                name="leaf"
                size={15}
                color="#FFFFFF"
              />
            </View>
            </TouchableOpacity>
          <Text style={styles.producerName}>
            {dadosSalvos.nome ||
              'Produtor'}
          </Text>
          <Text style={styles.propertyName}>
            {dadosSalvos.propriedade ||
              'Propriedade'}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color="#666666"
            />
            <Text style={styles.locationText}>
              {formatarLocalizacao()}
            </Text>
          </View>
          {!!dadosSalvos.categoria && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {dadosSalvos.categoria}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.consumerViewButton}
            onPress={visualizarComoConsumidor}
          >
            <Ionicons
              name="eye-outline"
              size={18}
              color="#004B0A"
            />
            <Text
              style={styles.consumerViewButtonText}
            >
              Visualizar como consumidor
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              router.push(
                '/area-produtor/produtos'
              )
            }
          >
            <Text style={styles.statNumber}>
              {quantidadeProdutosAtivos}
            </Text>
            <Text style={styles.statLabel}>
              Produtos ativos
            </Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              router.push(
                '/area-produtor/pedidos'
              )
            }
          >
            <Text style={styles.statNumber}>
              {quantidadePedidos}
            </Text>
            <Text style={styles.statLabel}>
              Pedidos
            </Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              router.push(
                '/area-produtor/publicacoes'
              )
            }
          >
            <Text style={styles.statNumber}>
              {quantidadePublicacoes}
            </Text>
            <Text style={styles.statLabel}>
              Publicações
            </Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              router.push(
                '/area-produtor/excedentes'
              )
            }
          >
            <Text style={styles.statNumber}>
              {quantidadeExcedentesAtivos}
            </Text>
            <Text style={styles.statLabel}>
              Excedentes
            </Text>
          </TouchableOpacity>
        </View>
        {!editando ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Informações da propriedade
                  </Text>
                  <Text
                    style={styles.sectionSubtitle}
                  >
                    Dados exibidos no seu perfil
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.smallEditButton}
                  onPress={iniciarEdicao}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={17}
                    color="#004B0A"
                  />
                  <Text
                    style={
                      styles.smallEditButtonText
                    }
                  >
                    Editar
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoCard}>
                <InfoItem
                  icon="person-outline"
                  label="Responsável"
                  value={
                    dadosSalvos.nome ||
                    'Não informado'
                  }
                />
                <View style={styles.infoDivider} />
                <InfoItem
                  icon="home-outline"
                  label="Propriedade"
                  value={
                    dadosSalvos.propriedade ||
                    'Não informada'
                  }
                />
                <View style={styles.infoDivider} />
                <InfoItem
                  icon="location-outline"
                  label="Localização"
                  value={formatarLocalizacao()}
                />
                <View style={styles.infoDivider} />
                <InfoItem
                  icon="leaf-outline"
                  label="Tipo de produção"
                  value={
                    dadosSalvos.categoria ||
                    'Não informado'
                  }
                />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localização da propriedade</Text>
              <Text style={styles.sectionSubtitle}>
                Registre a posição da propriedade para aparecer no mapa de produtores.
              </Text>
              <View style={styles.propertyLocationCard}>
                <View style={styles.propertyLocationIcon}>
                  <Ionicons name="location" size={22} color="#004B0A" />
                </View>
                <View style={styles.propertyLocationContent}>
                  <Text style={styles.propertyLocationTitle}>
                    {latitude !== null && longitude !== null ? 'Localização cadastrada' : 'Localização ainda não cadastrada'}
                  </Text>
                  <Text style={styles.propertyLocationText}>
                    {latitude !== null && longitude !== null
                      ? 'A propriedade já pode ser posicionada no mapa.'
                      : 'Esteja na propriedade e toque no botão abaixo para registrar a localização.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.locationSaveButton, salvandoLocalizacao && styles.locationSaveButtonDisabled]}
                onPress={salvarLocalizacaoPropriedade}
                disabled={salvandoLocalizacao}
                activeOpacity={0.8}
              >
                {salvandoLocalizacao ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="locate-outline" size={19} color="#FFFFFF" />
                    <Text style={styles.locationSaveButtonText}>
                      {latitude !== null && longitude !== null ? 'Atualizar localização' : 'Usar minha localização atual'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Sobre
              </Text>
              <View style={styles.descriptionCard}>
                <Text style={styles.description}>
                  {dadosSalvos.descricao ||
                    'Você ainda não adicionou uma descrição para sua propriedade.'}
                </Text>
              </View>
            </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Programa de Afiliados</Text>
            <Text style={styles.sectionSubtitle}>
              Permita que consumidores divulguem sua propriedade e recebam comissão pelas vendas indicadas.
            </Text>
            <View style={styles.affiliateCard}>
              <View style={styles.affiliateTopRow}>
                <View style={styles.commissionIcon}>
                  <Ionicons name="megaphone-outline" size={23} color="#004B0A" />
                </View>
                <View style={styles.affiliateStatusInfo}>
                  <Text style={styles.commissionLabel}>Programa de afiliados</Text>
                  <Text style={styles.affiliateStatusText}>
                    {afiliacaoAtiva ? 'Ativado' : 'Desativado'}
                  </Text>
                </View>
                <Switch
                  value={afiliacaoAtiva}
                  onValueChange={setAfiliacaoAtiva}
                  disabled={salvandoAfiliacao}
                  trackColor={{ false: '#D7D7D7', true: '#8DB694' }}
                  thumbColor={afiliacaoAtiva ? '#004B0A' : '#F4F4F4'}
                />
              </View>
              <View style={styles.affiliateDivider} />
              <Text style={styles.affiliateInputLabel}>Comissão por venda (%)</Text>
              <TextInput
                style={styles.affiliateInput}
                value={comissaoAfiliado}
                onChangeText={(texto) => setComissaoAfiliado(texto.replace(/[^0-9,.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="Ex: 5"
                placeholderTextColor="#999999"
                editable={!salvandoAfiliacao}
                maxLength={6}
              />
              <Text style={styles.commissionHelper}>
                Quando uma venda for gerada por um afiliado, esta porcentagem será usada para calcular a comissão.
              </Text>
              <TouchableOpacity
                style={[
                  styles.affiliateSaveButton,
                  salvandoAfiliacao && styles.affiliateSaveButtonDisabled,
                ]}
                onPress={salvarConfiguracaoAfiliacao}
                disabled={salvandoAfiliacao}
                activeOpacity={0.8}
              >
                {salvandoAfiliacao ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
                    <Text style={styles.affiliateSaveButtonText}>Salvar afiliação</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Gerenciamento
              </Text>
              <TouchableOpacity
                style={styles.managementItem}
                onPress={() =>
                  router.push(
                    '/area-produtor/produtos'
                  )
                }
              >
                <View
                  style={styles.managementIcon}
                >
                  <Ionicons
                    name="basket-outline"
                    size={21}
                    color="#004B0A"
                  />
                </View>
                <View
                  style={
                    styles.managementContent
                  }
                >
                  <Text
                    style={
                      styles.managementTitle
                    }
                  >
                    Meus produtos
                  </Text>
                  <Text
                    style={
                      styles.managementSubtitle
                    }
                  >
                    {quantidadeProdutosCadastrados} cadastrados
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999999"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.managementItem}
                onPress={() =>
                  router.push(
                    '/area-produtor/publicacoes'
                  )
                }
              >
                <View
                  style={styles.managementIcon}
                >
                  <Ionicons
                    name="images-outline"
                    size={21}
                    color="#004B0A"
                  />
                </View>
                <View
                  style={
                    styles.managementContent
                  }
                >
                  <Text
                    style={
                      styles.managementTitle
                    }
                  >
                    Minhas publicações
                  </Text>
                  <Text
                    style={
                      styles.managementSubtitle
                    }
                  >
                    {quantidadePublicacoes}{' '}
                    publicações
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999999"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.managementItem}
                onPress={() =>
                  router.push(
                    '/area-produtor/excedentes'
                  )
                }
              >
                <View
                  style={styles.managementIcon}
                >
                  <Ionicons
                    name="leaf-outline"
                    size={21}
                    color="#004B0A"
                  />
                </View>
                <View
                  style={
                    styles.managementContent
                  }
                >
                  <Text
                    style={
                      styles.managementTitle
                    }
                  >
                    Excedentes
                  </Text>
                  <Text
                    style={
                      styles.managementSubtitle
                    }
                  >
                    {quantidadeExcedentesAtivos} ativos
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999999"
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.editSection}>
            <View style={styles.editHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Editar perfil
                </Text>
                <Text
                  style={styles.sectionSubtitle}
                >
                  Atualize as informações da sua
                  propriedade
                </Text>
              </View>
              <TouchableOpacity
                onPress={cancelarEdicao}
                disabled={salvando}
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#777777"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>
              Nome do responsável
            </Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do responsável"
              placeholderTextColor="#999999"
              editable={!salvando}
            />
            <Text style={styles.inputLabel}>
              Nome da propriedade
            </Text>
            <TextInput
              style={styles.input}
              value={propriedade}
              onChangeText={setPropriedade}
              placeholder="Nome da propriedade"
              placeholderTextColor="#999999"
              editable={!salvando}
            />
            <Text style={styles.inputLabel}>
              Cidade
            </Text>
            <TextInput
              style={styles.input}
              value={cidade}
              onChangeText={setCidade}
              placeholder="Ex: Belo Horizonte"
              placeholderTextColor="#999999"
              editable={!salvando}
            />
            <Text style={styles.inputLabel}>
              Estado
            </Text>
            <TextInput
              style={styles.input}
              value={estado}
              onChangeText={(texto) =>
                setEstado(
                  texto
                    .toUpperCase()
                    .slice(0, 2)
                )
              }
              placeholder="Ex: MG"
              placeholderTextColor="#999999"
              autoCapitalize="characters"
              maxLength={2}
              editable={!salvando}
            />
            <Text style={styles.inputLabel}>
              Tipo de produção
            </Text>
            <TextInput
              style={styles.input}
              value={categoria}
              onChangeText={setCategoria}
              placeholder="Ex: Hortaliças e frutas"
              placeholderTextColor="#999999"
              editable={!salvando}
            />
            <Text style={styles.inputLabel}>
              Sobre a propriedade
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Conte um pouco sobre sua produção"
              placeholderTextColor="#999999"
              multiline
              maxLength={500}
              textAlignVertical="top"
              editable={!salvando}
            />
            <Text style={styles.counter}>
              {descricao.length}/500
            </Text>
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelarEdicao}
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
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  salvando &&
                    styles.saveButtonDisabled,
                ]}
                onPress={salvarPerfil}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark"
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Salvar alterações
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        {!editando && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={sairDaConta}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#B42318"
            />
            <Text style={styles.logoutButtonText}>
              Sair da conta
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.databaseNotice}>
          <Ionicons
            name="cloud-done-outline"
            size={20}
            color="#004B0A"
          />
          <Text
            style={styles.databaseNoticeText}
          >
            As informações do perfil estão
            integradas ao banco de dados e as
            alterações feitas aqui ficam salvas
            na sua conta.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              '/area-produtor/inicio'
            )
          }
        >
          <Ionicons
            name="home-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>
            Início
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              '/area-produtor/produtos'
            )
          }
        >
          <Ionicons
            name="basket-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>
            Produtos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              '/area-produtor/pedidos'
            )
          }
        >
          <Ionicons
            name="receipt-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>
            Pedidos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push(
              '/area-produtor/nova-publicacao'
            )
          }
        >
          <View style={styles.publishButton}>
            <Ionicons
              name="add"
              size={26}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.navText}>
            Publicar
          </Text>
        </TouchableOpacity>
        <View style={styles.navItem}>
          <Ionicons
            name="person"
            size={23}
            color="#004B0A"
          />
          <Text style={styles.navTextActive}>
            Perfil
          </Text>
        </View>
      </View>
    </View>
  );
}
type InfoItemProps = {
  icon:
    | 'person-outline'
    | 'home-outline'
    | 'location-outline'
    | 'leaf-outline';
  label: string;
  value: string;
};
function InfoItem({
  icon,
  label,
  value,
}: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#004B0A"
        />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>
        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 11,
    color: '#666666',
  },
  scrollContent: {
    paddingBottom: 115,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1F1F1F',
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#777777',
    marginTop: 3,
  },
  headerEditButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: '#F8FAF8',
    borderRadius: 18,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImagePlaceholder: {
    backgroundColor: '#E7F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  photoEditBadge: {
    position: 'absolute',
    left: 1,
    bottom: 4,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 1,
    bottom: 4,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  producerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 11,
    color: '#222222',
  },
  propertyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#004B0A',
    marginTop: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  locationText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 3,
  },
  categoryBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E7F0E8',
  },
  categoryText: {
    color: '#004B0A',
    fontSize: 9,
    fontWeight: '600',
  },
  consumerViewButton: {
    marginTop: 17,
    minHeight: 43,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  consumerViewButtonText: {
    color: '#004B0A',
    fontSize: 10,
    fontWeight: '600',
  },
  statsContainer: {
    marginHorizontal: 18,
    marginTop: 14,
    minHeight: 75,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  statLabel: {
    fontSize: 7,
    color: '#777777',
    textAlign: 'center',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  section: {
    marginHorizontal: 18,
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  sectionSubtitle: {
    fontSize: 8,
    color: '#888888',
    marginTop: 2,
  },
  smallEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F6F1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  smallEditButtonText: {
    fontSize: 9,
    color: '#004B0A',
    fontWeight: '600',
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 13,
    paddingHorizontal: 13,
  },
  infoItem: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 10,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 11,
  },
  infoLabel: {
    fontSize: 8,
    color: '#888888',
  },
  infoValue: {
    fontSize: 11,
    color: '#333333',
    fontWeight: '600',
    marginTop: 3,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  propertyLocationCard: {
    marginTop: 11,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyLocationContent: {
    flex: 1,
    marginLeft: 11,
  },
  propertyLocationTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },
  propertyLocationText: {
    fontSize: 8,
    lineHeight: 13,
    color: '#777777',
    marginTop: 3,
  },
  locationSaveButton: {
    minHeight: 44,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#004B0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  locationSaveButtonDisabled: { opacity: 0.65 },
  locationSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  descriptionCard: {
    marginTop: 11,
    padding: 14,
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
  },
  description: {
    fontSize: 11,
    color: '#555555',
    lineHeight: 18,
  },
  affiliateCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E3EAE4',
  },
  affiliateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  affiliateStatusInfo: {
    flex: 1,
    marginLeft: 11,
  },
  affiliateStatusText: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  affiliateDivider: {
    height: 1,
    backgroundColor: '#E1E7E2',
    marginVertical: 15,
  },
  affiliateInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 7,
  },
  affiliateInput: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#D8E0D9',
    borderRadius: 10,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#222222',
  },
  affiliateSaveButton: {
    minHeight: 45,
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: '#004B0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  affiliateSaveButtonDisabled: {
    opacity: 0.6,
  },
  affiliateSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  commissionCard: {
    marginTop: 11,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#F0F6F1',
    flexDirection: 'row',
  },
  commissionIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionInfo: {
    flex: 1,
    marginLeft: 11,
  },
  commissionLabel: {
    fontSize: 9,
    color: '#666666',
  },
  commissionValue: {
    fontSize: 16,
    color: '#004B0A',
    fontWeight: 'bold',
    marginTop: 2,
  },
  commissionHelper: {
    fontSize: 8,
    lineHeight: 12,
    color: '#6B736C',
    marginTop: 5,
  },
  managementItem: {
    minHeight: 65,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  managementIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementContent: {
    flex: 1,
    marginLeft: 11,
  },
  managementTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },
  managementSubtitle: {
    fontSize: 8,
    color: '#888888',
    marginTop: 3,
  },
  editSection: {
    marginHorizontal: 18,
    marginTop: 25,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 11,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  descriptionInput: {
    minHeight: 125,
    paddingTop: 12,
    paddingBottom: 12,
  },
  counter: {
    textAlign: 'right',
    fontSize: 8,
    color: '#999999',
    marginTop: 5,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#004B0A',
    fontSize: 10,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.5,
    minHeight: 47,
    borderRadius: 10,
    backgroundColor: '#004B0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: 18,
    marginTop: 27,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5B8B4',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FFF8F7',
  },
  logoutButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B42318',
  },
  databaseNotice: {
    marginHorizontal: 18,
    marginTop: 27,
    padding: 13,
    backgroundColor: '#F0F6F1',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  databaseNoticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 8,
    lineHeight: 13,
    color: '#536856',
  },
  bottomNavigation: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 9,
    color: '#777777',
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 9,
    color: '#004B0A',
    fontWeight: '600',
    marginTop: 4,
  },
  publishButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
  },
});
