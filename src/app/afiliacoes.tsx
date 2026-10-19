import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
type Comissao = {
  id: string;
  afiliacao_id: string;
  pedido_id: string;
  valor_venda: number;
  percentual_comissao: number;
  valor_comissao: number;
  status: string;
  created_at: string;
};
type Afiliacao = {
  id: string;
  produtor_id: string;
  codigo: string;
  nome_fazenda: string;
  nome_produtor: string;
  imagem_url: string | null;
  comissao: number;
};
export default function AfiliacoesScreen() {
  const [afiliacoes, setAfiliacoes] = useState<Afiliacao[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const carregarAfiliacoes = useCallback(async (refresh = false) => {
    if (refresh) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }
    try {
      const { data: usuarioData, error: usuarioError } = await supabase.auth.getUser();
      if (usuarioError || !usuarioData.user) {
        Alert.alert('Atenção', 'Você precisa estar conectado para visualizar suas afiliações.');
        setAfiliacoes([]);
        setComissoes([]);
        return;
      }
      const { data: afiliacoesData, error: afiliacoesError } = await supabase
        .from('afiliacoes')
        .select('id, produtor_id, codigo')
        .eq('afiliado_id', usuarioData.user.id)
        .eq('ativa', true)
        .order('created_at', { ascending: false });
      if (afiliacoesError) {
        console.log('Erro ao carregar afiliações:', afiliacoesError);
        Alert.alert('Erro', 'Não foi possível carregar suas afiliações.');
        setAfiliacoes([]);
        return;
      }
      const { data: comissoesData, error: comissoesError } = await supabase
        .from('comissoes_afiliados')
        .select('id, afiliacao_id, pedido_id, valor_venda, percentual_comissao, valor_comissao, status, created_at')
        .order('created_at', { ascending: false });
      if (comissoesError) {
        console.log('Erro ao carregar comissões:', comissoesError);
        Alert.alert('Atenção', 'Não foi possível carregar o histórico de comissões.');
        setComissoes([]);
      } else {
        setComissoes((comissoesData ?? []).map((item) => ({
          id: item.id,
          afiliacao_id: item.afiliacao_id,
          pedido_id: item.pedido_id,
          valor_venda: Number(item.valor_venda ?? 0),
          percentual_comissao: Number(item.percentual_comissao ?? 0),
          valor_comissao: Number(item.valor_comissao ?? 0),
          status: item.status,
          created_at: item.created_at,
        })));
      }
      const idsProdutores = [...new Set((afiliacoesData ?? []).map((item) => item.produtor_id))];
      if (idsProdutores.length === 0) {
        setAfiliacoes([]);
        return;
      }
      const { data: produtoresData, error: produtoresError } = await supabase.rpc('listar_produtores_publicos');
      if (produtoresError) {
        console.log('Erro ao carregar produtores das afiliações:', produtoresError);
        Alert.alert('Erro', 'Não foi possível carregar os produtores afiliados.');
        setAfiliacoes([]);
        return;
      }
      const produtores = new Map(
        (produtoresData ?? [])
          .filter((item: any) => idsProdutores.includes(item.id))
          .map((item: any) => [item.id, item])
      );
      const lista: Afiliacao[] = (afiliacoesData ?? [])
        .map((item) => {
          const produtor: any = produtores.get(item.produtor_id);
          if (!produtor) return null;
          return {
            id: item.id,
            produtor_id: item.produtor_id,
            codigo: item.codigo,
            nome_fazenda: produtor.nome_fazenda || 'Propriedade rural',
            nome_produtor: produtor.nome || 'Produtor',
            imagem_url: produtor.imagem_url ?? null,
            comissao: Number(produtor.comissao_afiliado ?? 0),
          };
        })
        .filter(Boolean) as Afiliacao[];
      setAfiliacoes(lista);
    } catch (error) {
      console.log('Erro inesperado ao carregar afiliações:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar suas afiliações.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      carregarAfiliacoes();
    }, [carregarAfiliacoes])
  );
  async function compartilhar(afiliacao: Afiliacao) {
    try {
      await Share.share({
        message:
          `Conheça ${afiliacao.nome_fazenda} no ConectaAgro! 🌱\n` +
          `Produtor: ${afiliacao.nome_produtor}\n` +
          `Meu código de indicação: ${afiliacao.codigo}`,
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  }
  function confirmarEncerramento(afiliacao: Afiliacao) {
    Alert.alert(
      'Encerrar afiliação',
      `Deseja encerrar sua afiliação com ${afiliacao.nome_fazenda}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () => encerrarAfiliacao(afiliacao.id),
        },
      ]
    );
  }
  async function encerrarAfiliacao(id: string) {
    try {
      const { error } = await supabase.from('afiliacoes').update({ ativa: false }).eq('id', id);
      if (error) {
        console.log('Erro ao encerrar afiliação:', error);
        Alert.alert('Erro', 'Não foi possível encerrar a afiliação.');
        return;
      }
      setAfiliacoes((atual) => atual.filter((item) => item.id !== id));
      Alert.alert('Afiliação encerrada', 'A afiliação foi encerrada com sucesso.');
    } catch (error) {
      console.log('Erro inesperado ao encerrar afiliação:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao encerrar a afiliação.');
    }
  }
  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalComissoes = comissoes
    .filter((item) => item.status !== 'cancelada')
    .reduce((total, item) => total + item.valor_comissao, 0);
  const totalPendentes = comissoes
    .filter((item) => item.status === 'pendente')
    .reduce((total, item) => total + item.valor_comissao, 0);
  const totalConfirmadas = comissoes
    .filter((item) => item.status === 'confirmada' || item.status === 'paga')
    .reduce((total, item) => total + item.valor_comissao, 0);
  const totalVendas = comissoes.filter((item) => item.status !== 'cancelada').length;
  const statusLabel = (status: string) => {
    if (status === 'pendente') return 'Pendente';
    if (status === 'confirmada') return 'Confirmada';
    if (status === 'paga') return 'Paga';
    if (status === 'cancelada') return 'Cancelada';
    return status;
  };
  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004B0A" />
        <Text style={styles.loadingText}>Carregando afiliações...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#004B0A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Afiliações</Text>
          <Text style={styles.headerSubtitle}>Divulgue e ganhe comissões</Text>
        </View>
        <View style={styles.headerSpace} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarAfiliacoes(true)}
            tintColor="#004B0A"
            colors={['#004B0A']}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="megaphone-outline" size={31} color="#004B0A" />
          </View>
          <Text style={styles.heroTitle}>Ganhe ajudando produtores locais</Text>
          <Text style={styles.heroText}>
            Divulgue produtores do ConectaAgro e receba comissão pelas vendas realizadas através da sua indicação.
          </Text>
        </View>
        <Text style={styles.sectionTitle}>Como funciona?</Text>
        <View style={styles.stepsCard}>
          {[
            ['1', 'Escolha', 'Encontre um produtor que participa do programa.'],
            ['2', 'Afilie-se', 'Toque em “Quero me afiliar” e receba seu código.'],
            ['3', 'Divulgue', 'Compartilhe sua indicação com outras pessoas.'],
            ['4', 'Ganhe comissão', 'Vendas geradas pela sua indicação podem gerar comissão.'],
          ].map((passo, index) => (
            <View key={passo[0]}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{passo[0]}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{passo[1]}</Text>
                  <Text style={styles.stepText}>{passo[2]}</Text>
                </View>
              </View>
              {index < 3 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.opportunitiesButton} onPress={() => router.push('/produtores')}>
          <Ionicons name="search-outline" size={19} color="#FFFFFF" />
          <Text style={styles.opportunitiesButtonText}>Encontrar produtores</Text>
        </TouchableOpacity>
        <View style={styles.dashboardTitleRow}>
          <Text style={styles.sectionTitleNoMargin}>Meu painel</Text>
        </View>
        <View style={styles.dashboard}>
          <View style={styles.dashboardItem}>
            <Text style={styles.dashboardValue}>{afiliacoes.length}</Text>
            <Text style={styles.dashboardLabel}>Afiliações ativas</Text>
          </View>
          <View style={styles.dashboardDivider} />
          <View style={styles.dashboardItem}>
            <Text style={styles.dashboardValue}>{totalVendas}</Text>
            <Text style={styles.dashboardLabel}>Vendas indicadas</Text>
          </View>
        </View>
        <View style={styles.financialCard}>
          <Text style={styles.financialCaption}>Comissões acumuladas (não canceladas)</Text>
          <Text style={styles.financialTotal}>{formatarMoeda(totalComissoes)}</Text>
          <View style={styles.financialRow}>
            <View style={styles.financialColumn}>
              <Text style={styles.financialLabel}>Pendentes</Text>
              <Text style={styles.financialValue}>{formatarMoeda(totalPendentes)}</Text>
            </View>
            <View style={styles.financialColumn}>
              <Text style={styles.financialLabel}>Confirmadas e pagas</Text>
              <Text style={styles.financialValue}>{formatarMoeda(totalConfirmadas)}</Text>
            </View>
          </View>
          <Text style={styles.financialNote}>
            Os valores são registros de comissão. Não representam pagamentos realizados pelo aplicativo.
          </Text>
        </View>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitleNoMargin}>Histórico de comissões</Text>
          <Text style={styles.countText}>{comissoes.length}</Text>
        </View>
        {comissoes.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Text style={styles.emptyText}>Nenhuma venda indicada registrada ainda.</Text>
          </View>
        ) : (
          comissoes.map((comissao) => {
            const produtor = afiliacoes.find((item) => item.id === comissao.afiliacao_id);
            return (
              <View key={comissao.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyProducer}>{produtor?.nome_fazenda ?? 'Produtor afiliado'}</Text>
                  <Text style={styles.historyStatus}>{statusLabel(comissao.status)}</Text>
                </View>
                <Text style={styles.historyDate}>
                  {new Date(comissao.created_at).toLocaleDateString('pt-BR')}
                </Text>
                <View style={styles.historyTop}>
                  <Text style={styles.historyDetail}>Venda: {formatarMoeda(comissao.valor_venda)} · {comissao.percentual_comissao}%</Text>
                  <Text style={styles.historyAmount}>{formatarMoeda(comissao.valor_comissao)}</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitleNoMargin}>Minhas afiliações</Text>
          <Text style={styles.countText}>{afiliacoes.length}</Text>
        </View>
        {afiliacoes.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="megaphone-outline" size={41} color="#004B0A" />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma afiliação ativa</Text>
            <Text style={styles.emptyText}>
              Encontre um produtor que aceite afiliados e comece a divulgar.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/produtores')}>
              <Text style={styles.emptyButtonText}>Ver produtores</Text>
            </TouchableOpacity>
          </View>
        ) : (
          afiliacoes.map((afiliacao) => (
            <View key={afiliacao.id} style={styles.affiliationCard}>
              <View style={styles.affiliationMain}>
                {afiliacao.imagem_url ? (
                  <Image source={{ uri: afiliacao.imagem_url }} style={styles.affiliationImage} resizeMode="cover" />
                ) : (
                  <View style={styles.affiliationImagePlaceholder}>
                    <Ionicons name="leaf-outline" size={30} color="#004B0A" />
                  </View>
                )}
                <View style={styles.affiliationContent}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>Produtor</Text>
                  </View>
                  <Text style={styles.affiliationName}>{afiliacao.nome_fazenda}</Text>
                  <Text style={styles.affiliationProducer}>{afiliacao.nome_produtor}</Text>
                  <Text style={styles.commissionText}>Comissão: {afiliacao.comissao}% por venda</Text>
                </View>
              </View>
              <View style={styles.codeBox}>
                <View>
                  <Text style={styles.codeLabel}>Seu código de indicação</Text>
                  <Text style={styles.codeValue}>{afiliacao.codigo}</Text>
                </View>
                <Ionicons name="link-outline" size={22} color="#004B0A" />
              </View>
              <View style={styles.affiliationActions}>
                <TouchableOpacity style={styles.shareButton} onPress={() => compartilhar(afiliacao)}>
                  <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Compartilhar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.openButton}
                  onPress={() => router.push(`/produtor/${afiliacao.produtor_id}`)}
                >
                  <Text style={styles.openButtonText}>Ver</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => confirmarEncerramento(afiliacao)}>
                <Text style={styles.removeButtonText}>Encerrar afiliação</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: {
    paddingTop: 25,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: { width: 42 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 19, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 10, color: '#777777', marginTop: 2 },
  headerSpace: { width: 42 },
  scrollContent: { padding: 16, paddingBottom: 50 },
  heroCard: { backgroundColor: '#EAF3EB', padding: 18, borderRadius: 14, marginBottom: 25 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 19, fontWeight: 'bold', color: '#004B0A' },
  heroText: { fontSize: 12, lineHeight: 19, color: '#555555', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 13 },
  sectionTitleNoMargin: { fontSize: 18, fontWeight: 'bold' },
  stepsCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginBottom: 20 },
  step: { flexDirection: 'row' },
  stepNumber: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: '#FFFFFF', fontWeight: 'bold' },
  stepContent: { flex: 1, marginLeft: 11 },
  stepTitle: { fontSize: 13, fontWeight: 'bold' },
  stepText: { fontSize: 10, color: '#666666', lineHeight: 15, marginTop: 3 },
  stepLine: {
    width: 2,
    height: 18,
    backgroundColor: '#D5E4D7',
    marginLeft: 17,
    marginVertical: 4,
  },
  opportunitiesButton: {
    height: 48,
    marginBottom: 28,
    backgroundColor: '#004B0A',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  opportunitiesButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  dashboardTitleRow: { marginBottom: 13 },
  financialCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24 },
  financialCaption: { fontSize: 11, color: '#666666' },
  financialTotal: { fontSize: 28, fontWeight: 'bold', color: '#004B0A', marginTop: 5 },
  financialRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  financialColumn: { flex: 1 },
  financialLabel: { fontSize: 10, color: '#777777' },
  financialValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  financialNote: { fontSize: 9, color: '#777777', lineHeight: 14, marginTop: 15 },
  historyEmpty: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 25 },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  historyProducer: { fontSize: 12, fontWeight: 'bold', flex: 1 },
  historyStatus: { fontSize: 10, color: '#004B0A', fontWeight: '600' },
  historyDate: { fontSize: 10, color: '#777777', marginTop: 5, marginBottom: 12 },
  historyDetail: { fontSize: 10, color: '#666666', flex: 1 },
  historyAmount: { fontSize: 14, color: '#004B0A', fontWeight: 'bold' },
  dashboard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 12,
  },
  dashboardItem: { flex: 1, alignItems: 'center' },
  dashboardDivider: { width: 1, backgroundColor: '#EEEEEE' },
  dashboardValue: { fontSize: 22, color: '#004B0A', fontWeight: 'bold' },
  dashboardLabel: { fontSize: 9, color: '#777777', marginTop: 4, textAlign: 'center' },
  prototypeInfo: {
    padding: 12,
    backgroundColor: '#EEEEEE',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  prototypeText: { flex: 1, marginLeft: 8, fontSize: 9, lineHeight: 14, color: '#666666' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  countText: {
    backgroundColor: '#EAF3EB',
    color: '#004B0A',
    fontWeight: 'bold',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 15,
  },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 25, alignItems: 'center' },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF3EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 14 },
  emptyText: { fontSize: 11, color: '#777777', textAlign: 'center', lineHeight: 17, marginTop: 6 },
  emptyButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '600' },
  affiliationCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 14 },
  affiliationMain: { flexDirection: 'row' },
  affiliationImage: { width: 75, height: 75, borderRadius: 10, backgroundColor: '#EAF3EB' },
  affiliationImagePlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: '#EAF3EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  affiliationContent: { flex: 1, marginLeft: 12 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF3EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: { fontSize: 8, color: '#004B0A', fontWeight: 'bold' },
  affiliationName: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  affiliationProducer: { fontSize: 10, color: '#666666', marginTop: 2 },
  commissionText: { fontSize: 10, color: '#004B0A', fontWeight: 'bold', marginTop: 6 },
  codeBox: {
    marginTop: 13,
    padding: 12,
    backgroundColor: '#F6F8F6',
    borderRadius: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeLabel: { fontSize: 8, color: '#777777' },
  codeValue: { fontSize: 13, fontWeight: 'bold', color: '#004B0A', marginTop: 3 },
  affiliationActions: { flexDirection: 'row', gap: 8, marginTop: 11 },
  shareButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#004B0A',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  openButton: {
    width: 70,
    height: 42,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: { color: '#004B0A', fontWeight: '600' },
  removeButton: { marginTop: 10, alignItems: 'center', paddingVertical: 7 },
  removeButtonText: { color: '#A13838', fontSize: 10 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 11, color: '#666666' },
});
