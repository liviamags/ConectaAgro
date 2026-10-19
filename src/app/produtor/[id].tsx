import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
type Produtor = {
  id: string;
  nome: string;
  nome_fazenda: string;
  cidade: string;
  estado: string;
  tipo_producao: string;
  descricao: string | null;
  imagem_url: string | null;
  afiliacao_ativa: boolean;
  comissao_afiliado: number;
};
type Produto = {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
  imagem_url: string | null;
};
type Publicacao = {
  id: string;
  produtor_id: string;
  texto: string;
  imagem_url: string | null;
  curtidas: number;
  comentarios: number;
  created_at: string;
};
type Curtida = {
  publicacao_id: string;
};
export default function ProdutorScreen() {
  const { id } = useLocalSearchParams();
  const produtorId = Array.isArray(id)
    ? id[0]
    : id;
  const [produtor, setProdutor] =
    useState<Produtor | null>(null);
  const [produtos, setProdutos] =
    useState<Produto[]>([]);
  const [publicacoes, setPublicacoes] =
    useState<Publicacao[]>([]);
  const [
    quantidadesCurtidas,
    setQuantidadesCurtidas,
  ] = useState<Record<string, number>>({});
  const [carregando, setCarregando] =
    useState(true);
  const [atualizando, setAtualizando] =
    useState(false);
  const [erro, setErro] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [afiliacaoId, setAfiliacaoId] = useState<string | null>(null);
  const [codigoAfiliacao, setCodigoAfiliacao] = useState('');
  const [salvandoAfiliacao, setSalvandoAfiliacao] = useState(false);
  const [seguindo, setSeguindo] = useState(false);
  const [salvandoSeguidor, setSalvandoSeguidor] = useState(false);
  const carregarPerfil = useCallback(
    async (refresh = false) => {
      if (!produtorId) {
        setErro(
          'Não foi possível identificar o produtor.'
        );
        setCarregando(false);
        return;
      }
      if (refresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }
      setErro('');
      try {
        const {
          data: usuarioData,
          error: usuarioError,
        } = await supabase.auth.getUser();
        if (
          usuarioError ||
          !usuarioData.user
        ) {
          setErro(
            'Você precisa estar conectado para visualizar este produtor.'
          );
          return;
        }
        setUsuarioId(usuarioData.user.id);
        const {
          data: produtoresData,
          error: produtorError,
        } = await supabase.rpc(
          'listar_produtores_publicos'
        );
        if (produtorError) {
          console.log(
            'Erro ao carregar produtor:',
            produtorError
          );
          setErro(
            'Não foi possível carregar os dados do produtor.'
          );
          return;
        }
        const produtorEncontrado =
          (produtoresData ?? []).find(
            (item: any) =>
              item.id === produtorId
          );
        if (!produtorEncontrado) {
          setProdutor(null);
          setErro(
            'Produtor não encontrado.'
          );
          return;
        }
        const produtorFormatado: Produtor =
          {
            id: produtorEncontrado.id,
            nome:
              produtorEncontrado.nome ||
              'Produtor',
            nome_fazenda:
              produtorEncontrado.nome_fazenda ||
              'Propriedade rural',
            cidade:
              produtorEncontrado.cidade ||
              '',
            estado:
              produtorEncontrado.estado ||
              '',
            tipo_producao:
              produtorEncontrado.tipo_producao ||
              'Produção local',
            descricao:
              produtorEncontrado.descricao ??
              null,
            imagem_url: produtorEncontrado.imagem_url ?? null,
            afiliacao_ativa: produtorEncontrado.afiliacao_ativa ?? false,
            comissao_afiliado: Number(produtorEncontrado.comissao_afiliado ?? 5),
          };
        setProdutor(produtorFormatado);
        const [
          resultadoProdutos,
          resultadoPublicacoes,
          resultadoCurtidas,
          resultadoAfiliacao,
          resultadoSeguidor,
        ] = await Promise.all([
          supabase
            .from('produtos')
            .select(
              'id, nome, preco, unidade, imagem_url'
            )
            .eq(
              'produtor_id',
              produtorId
            )
            .eq('ativo', true)
            .order('created_at', {
              ascending: false,
            }),
          supabase.rpc(
            'listar_publicacoes_produtor_publicas',
            {
              produtor_uuid:
                produtorId,
            }
          ),
          supabase
            .from('publicacao_curtidas')
            .select('publicacao_id'),
          supabase
            .from('afiliacoes')
            .select('id, codigo, ativa')
            .eq('afiliado_id', usuarioData.user.id)
            .eq('produtor_id', produtorId)
            .maybeSingle(),
          supabase
            .from('produtores_seguidores')
            .select('id')
            .eq('consumidor_id', usuarioData.user.id)
            .eq('produtor_id', produtorId)
            .maybeSingle(),
        ]);
        if (resultadoSeguidor.error) {
          console.log('Erro ao verificar seguidor:', resultadoSeguidor.error);
          setSeguindo(false);
        } else {
          setSeguindo(!!resultadoSeguidor.data);
        }
        if (resultadoAfiliacao.error) {
          console.log('Erro ao carregar afiliação:', resultadoAfiliacao.error);
          setAfiliacaoId(null);
          setCodigoAfiliacao('');
        } else if (resultadoAfiliacao.data?.ativa) {
          setAfiliacaoId(resultadoAfiliacao.data.id);
          setCodigoAfiliacao(resultadoAfiliacao.data.codigo);
        } else {
          setAfiliacaoId(null);
          setCodigoAfiliacao('');
        }
        if (resultadoProdutos.error) {
          console.log(
            'Erro ao carregar produtos:',
            resultadoProdutos.error
          );
          setProdutos([]);
        } else {
          const produtosFormatados: Produto[] =
            (
              resultadoProdutos.data ??
              []
            ).map(
              (produto: any) => ({
                id: produto.id,
                nome:
                  produto.nome ||
                  'Produto',
                preco: Number(
                  produto.preco ?? 0
                ),
                unidade:
                  produto.unidade ||
                  'unidade',
                imagem_url:
                  produto.imagem_url ??
                  null,
              })
            );
          setProdutos(
            produtosFormatados
          );
        }
        if (
          resultadoPublicacoes.error
        ) {
          console.log(
            'Erro ao carregar publicações:',
            resultadoPublicacoes.error
          );
          setPublicacoes([]);
          setQuantidadesCurtidas({});
        } else {
          const publicacoesFormatadas: Publicacao[] =
            (
              resultadoPublicacoes.data ??
              []
            ).map(
              (publicacao: any) => ({
                id: publicacao.id,
                produtor_id:
                  publicacao.produtor_id,
                texto:
                  publicacao.texto || '',
                imagem_url:
                  publicacao.imagem_url ??
                  null,
                curtidas: Number(
                  publicacao.curtidas ?? 0
                ),
                comentarios: Number(
                  publicacao.comentarios ??
                    0
                ),
                created_at:
                  publicacao.created_at,
              })
            );
          setPublicacoes(
            publicacoesFormatadas
          );
          if (
            resultadoCurtidas.error
          ) {
            console.log(
              'Erro ao carregar curtidas:',
              resultadoCurtidas.error
            );
            setQuantidadesCurtidas(
              {}
            );
          } else {
            const idsPublicacoes =
              new Set(
                publicacoesFormatadas.map(
                  (publicacao) =>
                    publicacao.id
                )
              );
            const curtidas =
              (
                resultadoCurtidas.data ??
                []
              ) as Curtida[];
            const contadores: Record<
              string,
              number
            > = {};
            curtidas.forEach(
              (curtida) => {
                if (
                  idsPublicacoes.has(
                    curtida.publicacao_id
                  )
                ) {
                  contadores[
                    curtida.publicacao_id
                  ] =
                    (
                      contadores[
                        curtida.publicacao_id
                      ] ?? 0
                    ) + 1;
                }
              }
            );
            setQuantidadesCurtidas(
              contadores
            );
          }
        }
      } catch (error) {
        console.log(
          'Erro inesperado ao carregar perfil do produtor:',
          error
        );
        setErro(
          'Ocorreu um erro ao carregar o perfil do produtor.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [produtorId]
  );
  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );
  async function alternarSeguir() {
    if (!produtorId || !usuarioId || salvandoSeguidor) return;
    if (produtorId === usuarioId) {
      Alert.alert('Seguir produtor', 'Você não pode seguir a própria propriedade.');
      return;
    }
    setSalvandoSeguidor(true);
    try {
      if (seguindo) {
        const { error } = await supabase
          .from('produtores_seguidores')
          .delete()
          .eq('consumidor_id', usuarioId)
          .eq('produtor_id', produtorId);
        if (error) throw error;
        setSeguindo(false);
      } else {
        const { error } = await supabase
          .from('produtores_seguidores')
          .upsert(
            { consumidor_id: usuarioId, produtor_id: produtorId },
            { onConflict: 'consumidor_id,produtor_id', ignoreDuplicates: true }
          );
        if (error) throw error;
        setSeguindo(true);
      }
    } catch (error) {
      console.log('Erro ao alterar acompanhamento:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o acompanhamento. Tente novamente.');
    } finally {
      setSalvandoSeguidor(false);
    }
  }
  async function afiliarAoProdutor() {
    if (!produtor || !produtorId || !usuarioId || salvandoAfiliacao) return;
    if (!produtor.afiliacao_ativa) {
      Alert.alert('Afiliação indisponível', 'Este produtor não está aceitando afiliados no momento.');
      return;
    }
    if (usuarioId === produtorId) {
      Alert.alert('Afiliação', 'Você não pode se afiliar à própria propriedade.');
      return;
    }
    try {
      setSalvandoAfiliacao(true);
      const codigo = `CA-${usuarioId.slice(0, 6).toUpperCase()}-${produtorId.slice(0, 6).toUpperCase()}`;
      const { data: existente, error: existenteError } = await supabase
        .from('afiliacoes')
        .select('id, codigo, ativa')
        .eq('afiliado_id', usuarioId)
        .eq('produtor_id', produtorId)
        .maybeSingle();
      if (existenteError) {
        Alert.alert('Erro', 'Não foi possível verificar sua afiliação.');
        return;
      }
      if (existente) {
        const { error } = await supabase.from('afiliacoes').update({ ativa: true }).eq('id', existente.id);
        if (error) {
          Alert.alert('Erro', 'Não foi possível ativar sua afiliação.');
          return;
        }
        setAfiliacaoId(existente.id);
        setCodigoAfiliacao(existente.codigo);
      } else {
        const { data, error } = await supabase
          .from('afiliacoes')
          .insert({ afiliado_id: usuarioId, produtor_id: produtorId, codigo })
          .select('id, codigo')
          .single();
        if (error) {
          console.log('Erro ao criar afiliação:', error);
          Alert.alert('Erro', 'Não foi possível concluir sua afiliação.');
          return;
        }
        setAfiliacaoId(data.id);
        setCodigoAfiliacao(data.codigo);
      }
      Alert.alert('Afiliação realizada! 🌱', `Agora você pode divulgar ${produtor.nome_fazenda} e receber ${produtor.comissao_afiliado}% de comissão pelas vendas indicadas.`);
    } catch (error) {
      console.log('Erro inesperado ao criar afiliação:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado ao realizar a afiliação.');
    } finally {
      setSalvandoAfiliacao(false);
    }
  }
  function formatarPreco(
    valor: number
  ) {
    return valor.toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      }
    );
  }
  function localizacaoProdutor() {
    if (!produtor) {
      return '';
    }
    const partes = [
      produtor.cidade,
      produtor.estado,
    ].filter(Boolean);
    if (partes.length === 0) {
      return 'Localização não informada';
    }
    return partes.join(', ');
  }
  function iniciaisProdutor() {
    if (!produtor?.nome) {
      return 'P';
    }
    const partes = produtor.nome
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (partes.length === 0) {
      return 'P';
    }
    if (partes.length === 1) {
      return partes[0]
        .charAt(0)
        .toUpperCase();
    }
    return (
      partes[0].charAt(0) +
      partes[
        partes.length - 1
      ].charAt(0)
    ).toUpperCase();
  }
  function formatarData(
    data: string
  ) {
    if (!data) {
      return '';
    }
    return new Date(
      data
    ).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  }
  if (carregando) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#004B0A"
        />
        <Text
          style={styles.loadingText}
        >
          Carregando produtor...
        </Text>
      </View>
    );
  }
  if (erro || !produtor) {
    return (
      <View
        style={styles.errorContainer}
      >
        <Ionicons
          name="alert-circle-outline"
          size={50}
          color="#004B0A"
        />
        <Text
          style={styles.errorTitle}
        >
          {erro ||
            'Produtor não encontrado'}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() =>
            carregarPerfil()
          }
        >
          <Text
            style={
              styles.errorButtonText
            }
          >
            Tentar novamente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={
            styles.backErrorButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backErrorButtonText
            }
          >
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() =>
              carregarPerfil(true)
            }
            tintColor="#004B0A"
            colors={['#004B0A']}
          />
        }
      >
        <View style={styles.cover}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color="#004B0A"
            />
          </TouchableOpacity>
        </View>
                <View style={styles.profileImageContainer}>
          {produtor.imagem_url ? (
            <Image
              source={{ uri: produtor.imagem_url }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitials}>
                {iniciaisProdutor()}
              </Text>
            </View>
          )}
        </View>
        <View
          style={styles.profileInfo}
        >
          <Text
            style={styles.producerName}
          >
            {produtor.nome}
          </Text>
          <Text
            style={styles.propertyName}
          >
            {produtor.nome_fazenda}
          </Text>
          <View
            style={styles.locationRow}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color="#666666"
            />
            <Text
              style={styles.locationText}
            >
              {localizacaoProdutor()}
            </Text>
          </View>
          <Text
            style={styles.category}
          >
            {produtor.tipo_producao}
          </Text>
        </View>
        {usuarioId !== produtorId && (
          <TouchableOpacity
            style={[styles.followButton, seguindo && styles.followButtonActive]}
            onPress={alternarSeguir}
            disabled={salvandoSeguidor}
            activeOpacity={0.8}
          >
            {salvandoSeguidor ? (
              <ActivityIndicator size="small" color={seguindo ? '#004B0A' : '#FFFFFF'} />
            ) : (
              <>
                <Ionicons
                  name={seguindo ? 'checkmark-circle-outline' : 'person-add-outline'}
                  size={18}
                  color={seguindo ? '#004B0A' : '#FFFFFF'}
                />
                <Text style={[styles.followButtonText, seguindo && styles.followButtonTextActive]}>
                  {seguindo ? 'Seguindo' : 'Seguir produtor'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <View
          style={styles.locationCard}
        >
          <View
            style={styles.locationIcon}
          >
            <Ionicons
              name="location"
              size={22}
              color="#004B0A"
            />
          </View>
          <View
            style={
              styles.locationCardInfo
            }
          >
            <Text
              style={
                styles.locationCardTitle
              }
            >
              Localização
            </Text>
            <Text
              style={
                styles.locationCardText
              }
            >
              {localizacaoProdutor()}
            </Text>
            <Text
              style={
                styles.locationInfoText
              }
            >
              Localização informada pelo
              produtor
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Sobre
          </Text>
          <Text
            style={styles.description}
          >
            {produtor.descricao?.trim()
              ? produtor.descricao
              : 'Este produtor ainda não adicionou uma descrição sobre sua propriedade.'}
          </Text>
        </View>
          {produtor.afiliacao_ativa && usuarioId !== produtorId && (
            <View style={styles.affiliateSection}>
              <View style={styles.affiliateCard}>
                <View style={styles.affiliateIcon}>
                  <Ionicons name="megaphone-outline" size={24} color="#004B0A" />
                </View>
                <View style={styles.affiliateInfo}>
                  <Text style={styles.affiliateTitle}>Divulgue este produtor</Text>
                  <Text style={styles.affiliateText}>
                    Ajude a divulgar esta propriedade e receba {produtor.comissao_afiliado}% de comissão pelas vendas geradas pela sua indicação.
                  </Text>
                  {afiliacaoId ? (
                    <View style={styles.affiliatedBox}>
                      <Ionicons name="checkmark-circle" size={18} color="#004B0A" />
                      <View style={styles.affiliatedInfo}>
                        <Text style={styles.affiliatedTitle}>Você já é afiliado</Text>
                        <Text style={styles.affiliatedCode}>Código: {codigoAfiliacao}</Text>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={[styles.affiliateButton, salvandoAfiliacao && styles.affiliateButtonDisabled]} onPress={afiliarAoProdutor} disabled={salvandoAfiliacao} activeOpacity={0.8}>
                      {salvandoAfiliacao ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                        <>
                          <Ionicons name="people-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.affiliateButtonText}>Quero me afiliar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        <View
          style={
            styles.publicationsHeader
          }
        >
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Publicações
            </Text>
            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Novidades deste produtor
            </Text>
          </View>
          {publicacoes.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/publicacoes-produtor/${produtorId}`
                )
              }
            >
              <Text
                style={styles.seeAll}
              >
                Ver mais
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {publicacoes.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.publicationsScroll
            }
          >
            {publicacoes
              .slice(0, 5)
              .map((publicacao) => (
                <TouchableOpacity
                  key={publicacao.id}
                  style={
                    styles.publicationCard
                  }
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/publicacoes-produtor/${produtorId}`
                    )
                  }
                >
                  {publicacao.imagem_url ? (
                    <Image
                      source={{
                        uri:
                          publicacao.imagem_url,
                      }}
                      style={
                        styles.publicationImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.publicationPlaceholder
                      }
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={31}
                        color="#004B0A"
                      />
                    </View>
                  )}
                  <View
                    style={
                      styles.publicationContent
                    }
                  >
                    <Text
                      style={
                        styles.publicationText
                      }
                      numberOfLines={3}
                    >
                      {publicacao.texto ||
                        'Publicação do produtor'}
                    </Text>
                    <View
                      style={
                        styles.publicationFooter
                      }
                    >
                      <Text
                        style={
                          styles.publicationDate
                        }
                      >
                        {formatarData(
                          publicacao.created_at
                        )}
                      </Text>
                      <View
                        style={
                          styles.publicationStats
                        }
                      >
                        <Ionicons
                          name="heart-outline"
                          size={12}
                          color="#777777"
                        />
                        <Text
                          style={
                            styles.publicationStatText
                          }
                        >
                          {quantidadesCurtidas[
                            publicacao.id
                          ] ?? 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        ) : (
          <View
            style={
              styles.emptySectionBox
            }
          >
            <Ionicons
              name="images-outline"
              size={31}
              color="#7A987D"
            />
            <Text
              style={
                styles.emptySectionTitle
              }
            >
              Nenhuma publicação ainda
            </Text>
            <Text
              style={
                styles.emptySectionText
              }
            >
              As novidades publicadas por
              este produtor aparecerão aqui.
            </Text>
          </View>
        )}
        <View
          style={styles.productsHeader}
        >
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Produtos
            </Text>
            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Produtos disponíveis deste
              produtor
            </Text>
          </View>
        </View>
        {produtos.length > 0 ? (
          <View
            style={
              styles.productsContainer
            }
          >
            {produtos.map(
              (produto) => (
                <TouchableOpacity
                  key={produto.id}
                  style={
                    styles.productCard
                  }
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/produto/${produto.id}`
                    )
                  }
                >
                  {produto.imagem_url ? (
                    <Image
                      source={{
                        uri:
                          produto.imagem_url,
                      }}
                      style={
                        styles.productImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.productImagePlaceholder
                      }
                    >
                      <Ionicons
                        name="basket-outline"
                        size={32}
                        color="#004B0A"
                      />
                    </View>
                  )}
                  <View
                    style={
                      styles.productContent
                    }
                  >
                    <Text
                      style={
                        styles.productName
                      }
                      numberOfLines={2}
                    >
                      {produto.nome}
                    </Text>
                    <View
                      style={
                        styles.productPriceRow
                      }
                    >
                      <Text
                        style={
                          styles.productPrice
                        }
                      >
                        {formatarPreco(
                          produto.preco
                        )}
                      </Text>
                      <Text
                        style={
                          styles.productUnit
                        }
                      >
                        / {produto.unidade}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            )}
          </View>
        ) : (
          <View
            style={
              styles.emptySectionBox
            }
          >
            <Ionicons
              name="basket-outline"
              size={31}
              color="#7A987D"
            />
            <Text
              style={
                styles.emptySectionTitle
              }
            >
              Nenhum produto disponível
            </Text>
            <Text
              style={
                styles.emptySectionText
              }
            >
              Quando este produtor cadastrar
              produtos ativos, eles aparecerão
              aqui.
            </Text>
          </View>
        )}
        <View
          style={styles.futureFeatures}
        >
          <Ionicons
            name="leaf-outline"
            size={18}
            color="#004B0A"
          />
          <Text
            style={
              styles.futureFeaturesText
            }
          >
            Continue explorando os produtos e publicações deste produtor.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 45,
  },
  cover: {
    height: 135,
    backgroundColor: '#E7F0E8',
  },
  backButton: {
    position: 'absolute',
    top: 27,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: -55,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#DDEBDF',
  },
  profilePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#DDEBDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 33,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  producerName: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#111111',
    textAlign: 'center',
  },
  propertyName: {
    fontSize: 14,
    color: '#004B0A',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 3,
  },
  category: {
    backgroundColor: '#F0F6F1',
    color: '#004B0A',
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  followButton: {
    alignSelf: 'center',
    marginTop: 18,
    minWidth: 160,
    minHeight: 42,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#004B0A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  followButtonActive: {
    backgroundColor: '#E7F1E8',
    borderWidth: 1,
    borderColor: '#004B0A',
  },
  followButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: '#004B0A',
  },
  locationCard: {
    marginHorizontal: 22,
    marginTop: 20,
    padding: 13,
    borderRadius: 11,
    backgroundColor: '#F4F7F4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  locationCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationCardText: {
    fontSize: 10,
    color: '#555555',
    marginTop: 2,
  },
  locationInfoText: {
    fontSize: 8,
    color: '#888888',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    margin: 22,
  },
  section: {
    paddingHorizontal: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 9,
    color: '#777777',
    marginTop: 3,
  },
  description: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
    marginTop: 9,
  },
  affiliateSection: { paddingHorizontal: 22, marginTop: 24 },
  affiliateCard: { padding: 15, borderRadius: 12, backgroundColor: '#F0F6F1', borderWidth: 1, borderColor: '#DCE8DE', flexDirection: 'row', alignItems: 'flex-start' },
  affiliateIcon: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#DDEBDF', alignItems: 'center', justifyContent: 'center' },
  affiliateInfo: { flex: 1, marginLeft: 11 },
  affiliateTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F1F1F' },
  affiliateText: { marginTop: 5, fontSize: 10, lineHeight: 15, color: '#5C6E5E' },
  affiliateButton: { minHeight: 42, marginTop: 12, paddingHorizontal: 14, borderRadius: 9, backgroundColor: '#004B0A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  affiliateButtonDisabled: { opacity: 0.6 },
  affiliateButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  affiliatedBox: { marginTop: 12, padding: 10, borderRadius: 9, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' },
  affiliatedInfo: { flex: 1, marginLeft: 8 },
  affiliatedTitle: { fontSize: 11, fontWeight: 'bold', color: '#004B0A' },
  affiliatedCode: { marginTop: 2, fontSize: 9, color: '#666666' },
  publicationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 28,
    marginBottom: 13,
  },
  seeAll: {
    fontSize: 12,
    color: '#004B0A',
    fontWeight: '600',
  },
  publicationsScroll: {
    paddingLeft: 22,
    paddingRight: 10,
  },
  publicationCard: {
    width: 190,
    marginRight: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  publicationImage: {
    width: '100%',
    height: 120,
  },
  publicationPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#EDF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicationContent: {
    padding: 10,
  },
  publicationText: {
    fontSize: 10,
    lineHeight: 15,
    minHeight: 45,
  },
  publicationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  publicationDate: {
    fontSize: 8,
    color: '#888888',
  },
  publicationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  publicationStatText: {
    fontSize: 8,
    color: '#777777',
  },
  productsHeader: {
    paddingHorizontal: 22,
    marginTop: 28,
    marginBottom: 13,
  },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 17,
  },
  productCard: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: 115,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 115,
    backgroundColor: '#EDF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productContent: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  productPrice: {
    fontSize: 12,
    color: '#004B0A',
    fontWeight: 'bold',
  },
  productUnit: {
    fontSize: 8,
    color: '#666666',
    marginLeft: 3,
  },
  emptySectionBox: {
    marginHorizontal: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 11,
    backgroundColor: '#F7F9F7',
    alignItems: 'center',
  },
  emptySectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySectionText: {
    fontSize: 10,
    lineHeight: 15,
    color: '#777777',
    textAlign: 'center',
    marginTop: 4,
  },
  futureFeatures: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 22,
    marginTop: 20,
    padding: 13,
    backgroundColor: '#F0F6F1',
    borderRadius: 10,
    gap: 8,
  },
  futureFeaturesText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: '#5C6E5E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: '#666666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  errorButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backErrorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 6,
  },
  backErrorButtonText: {
    color: '#004B0A',
    fontWeight: '600',
  },
});
