import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
export default function FinalizarPedidoScreen() {
  const { itens, limparCarrinho } = useCart();
  const [endereco, setEndereco] = useState('');
  const [complemento, setComplemento] = useState('');
  const [observacao, setObservacao] = useState('');
  const [codigoIndicacao, setCodigoIndicacao] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [tipoRecebimento, setTipoRecebimento] =
    useState<'retirada' | 'entrega'>('retirada');
  const [pagamento, setPagamento] =
    useState<'pix' | 'dinheiro' | 'cartao'>('pix');
  const subtotal = itens.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  );
  const taxaEntrega = tipoRecebimento === 'entrega' ? 5 : 0;
  const total = subtotal + taxaEntrega;
  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
  async function confirmarPedido() {
    if (enviandoPedido) return;
    if (itens.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de finalizar.');
      return;
    }
    if (tipoRecebimento === 'entrega' && !endereco.trim()) {
      Alert.alert('Endereço necessário', 'Informe o endereço de entrega.');
      return;
    }
    const itensInvalidos = itens.some((item) =>
      !(item.produto_id ?? (item.tipo !== 'excedente' ? item.id : null)) ||
      (item.tipo === 'excedente' && !item.excedente_id) ||
      !Number.isInteger(item.quantidade) || item.quantidade <= 0
    );
    if (itensInvalidos) {
      Alert.alert('Carrinho inválido', 'Remova os itens inválidos e adicione-os novamente.');
      return;
    }
    setEnviandoPedido(true);
    try {
      const { data: { user }, error: usuarioError } = await supabase.auth.getUser();
      if (usuarioError || !user) {
        Alert.alert('Sessão não encontrada', 'Entre novamente para finalizar o pedido.');
        return;
      }
      const itensCarrinho = itens.map((item) => ({
        produto_id: item.produto_id ?? item.id,
        excedente_id: item.tipo === 'excedente' ? item.excedente_id : null,
        quantidade: item.quantidade,
      }));
      const enderecoCompleto = tipoRecebimento === 'entrega'
        ? [endereco.trim(), complemento.trim()].filter(Boolean).join(' - ')
        : null;
      const { data, error } = await supabase.rpc('finalizar_compra', {
        itens_carrinho: itensCarrinho,
        recebimento: tipoRecebimento,
        endereco_entrega: enderecoCompleto,
        pagamento_escolhido: pagamento,
        observacao_pedido: observacao.trim() || null,
        codigo_indicacao: codigoIndicacao.trim() || null,
      });
      if (error) throw error;
      if (!data || data.sucesso !== true) {
        throw new Error('O banco não confirmou a compra.');
      }
      limparCarrinho();
      if (codigoIndicacao.trim() && !data.indicacao_aplicada) {
        Alert.alert(
          'Pedido confirmado',
          'O pedido foi realizado, mas o código de indicação não foi aplicado. Verifique se o código pertence a um afiliado ativo do produtor.',
          [{ text: 'OK', onPress: () => router.replace('/pedido-confirmado') }]
        );
        return;
      }
      router.replace('/pedido-confirmado');
    } catch (error: any) {
      console.log('Erro ao finalizar pedido:', error);
      Alert.alert(
        'Não foi possível finalizar',
        error?.message || 'Ocorreu um erro ao salvar o pedido. Nenhuma compra foi confirmada.'
      );
    } finally {
      setEnviandoPedido(false);
    }
  }
  if (itens.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="cart-outline"
          size={55}
          color="#004B0A"
        />
        <Text style={styles.emptyTitle}>
          Seu carrinho está vazio
        </Text>
        <TouchableOpacity
          style={styles.greenButton}
          onPress={() => router.replace('/produtos')}
        >
          <Text style={styles.greenButtonText}>
            Ver produtos
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color="#004B0A"
          />
        </TouchableOpacity>
        <Text style={styles.title}>
          Finalizar pedido
        </Text>
        <View style={styles.headerSpace} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* PRODUTOS */}
        <Text style={styles.sectionTitle}>
          Seu pedido
        </Text>
        <View style={styles.card}>
          {itens.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.productRow,
                index !== itens.length - 1 &&
                  styles.productBorder,
              ]}
            >
              <Image
                source={item.imagem}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {item.nome}
                </Text>
                <Text style={styles.producerName}>
                  {item.produtor}
                </Text>
                <Text style={styles.quantity}>
                  Quantidade: {item.quantidade}
                </Text>
              </View>
              <Text style={styles.productPrice}>
                {formatarPreco(
                  item.preco * item.quantidade
                )}
              </Text>
            </View>
          ))}
        </View>
        {/* RECEBIMENTO */}
        <Text style={styles.sectionTitle}>
          Como deseja receber?
        </Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              tipoRecebimento === 'retirada' &&
                styles.optionSelected,
            ]}
            onPress={() =>
              setTipoRecebimento('retirada')
            }
          >
            <Ionicons
              name="storefront-outline"
              size={23}
              color={
                tipoRecebimento === 'retirada'
                  ? '#FFFFFF'
                  : '#004B0A'
              }
            />
            <Text
              style={[
                styles.optionText,
                tipoRecebimento === 'retirada' &&
                  styles.optionTextSelected,
              ]}
            >
              Retirada
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              tipoRecebimento === 'entrega' &&
                styles.optionSelected,
            ]}
            onPress={() =>
              setTipoRecebimento('entrega')
            }
          >
            <Ionicons
              name="bicycle-outline"
              size={23}
              color={
                tipoRecebimento === 'entrega'
                  ? '#FFFFFF'
                  : '#004B0A'
              }
            />
            <Text
              style={[
                styles.optionText,
                tipoRecebimento === 'entrega' &&
                  styles.optionTextSelected,
              ]}
            >
              Entrega
            </Text>
          </TouchableOpacity>
        </View>
        {/* ENDEREÇO */}
        {tipoRecebimento === 'entrega' && (
          <View style={styles.addressContainer}>
            <Text style={styles.label}>
              Endereço de entrega
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Rua, número e bairro"
              placeholderTextColor="#888888"
              value={endereco}
              onChangeText={setEndereco}
            />
            <TextInput
              style={styles.input}
              placeholder="Complemento (opcional)"
              placeholderTextColor="#888888"
              value={complemento}
              onChangeText={setComplemento}
            />
          </View>
        )}
        {tipoRecebimento === 'retirada' && (
          <View style={styles.pickupInfo}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#004B0A"
            />
            <Text style={styles.pickupText}>
              Após a confirmação, você poderá combinar
              a retirada diretamente com o produtor.
            </Text>
          </View>
        )}
        {/* PAGAMENTO */}
        <Text style={styles.sectionTitle}>
          Forma de pagamento
        </Text>
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setPagamento('pix')}
        >
          <View style={styles.paymentLeft}>
            <Ionicons
              name="qr-code-outline"
              size={22}
              color="#004B0A"
            />
            <Text style={styles.paymentText}>
              Pix
            </Text>
          </View>
          <Ionicons
            name={
              pagamento === 'pix'
                ? 'radio-button-on'
                : 'radio-button-off'
            }
            size={22}
            color="#004B0A"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setPagamento('dinheiro')}
        >
          <View style={styles.paymentLeft}>
            <Ionicons
              name="cash-outline"
              size={22}
              color="#004B0A"
            />
            <Text style={styles.paymentText}>
              Dinheiro
            </Text>
          </View>
          <Ionicons
            name={
              pagamento === 'dinheiro'
                ? 'radio-button-on'
                : 'radio-button-off'
            }
            size={22}
            color="#004B0A"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setPagamento('cartao')}
        >
          <View style={styles.paymentLeft}>
            <Ionicons
              name="card-outline"
              size={22}
              color="#004B0A"
            />
            <Text style={styles.paymentText}>
              Cartão na retirada/entrega
            </Text>
          </View>
          <Ionicons
            name={
              pagamento === 'cartao'
                ? 'radio-button-on'
                : 'radio-button-off'
            }
            size={22}
            color="#004B0A"
          />
        </TouchableOpacity>
        {/* CÓDIGO DE INDICAÇÃO */}
        <Text style={styles.sectionTitle}>
          Código de indicação
        </Text>
        <View style={styles.affiliationCard}>
          <View style={styles.affiliationHeader}>
            <Ionicons
              name="megaphone-outline"
              size={22}
              color="#004B0A"
            />
            <View style={styles.affiliationTextContainer}>
              <Text style={styles.affiliationTitle}>
                Foi indicado por alguém?
              </Text>
              <Text style={styles.affiliationText}>
                Digite o código do afiliado para que ele receba a comissão desta compra.
              </Text>
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex.: CA-ABC123-DEF456"
            placeholderTextColor="#888888"
            value={codigoIndicacao}
            onChangeText={setCodigoIndicacao}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        {/* OBSERVAÇÕES */}
        <Text style={styles.sectionTitle}>
          Observações
        </Text>
        <TextInput
          style={styles.observationInput}
          placeholder="Alguma observação para o produtor?"
          placeholderTextColor="#888888"
          value={observacao}
          onChangeText={setObservacao}
          multiline
          textAlignVertical="top"
        />
        {/* RESUMO */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            Resumo
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal
            </Text>
            <Text style={styles.summaryValue}>
              {formatarPreco(subtotal)}
            </Text>
          </View>
          {tipoRecebimento === 'entrega' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Taxa de entrega
              </Text>
              <Text style={styles.summaryValue}>
                {formatarPreco(taxaEntrega)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>
              Total
            </Text>
            <Text style={styles.totalValue}>
              {formatarPreco(total)}
            </Text>
          </View>
        </View>
        {/* CONFIRMAR */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            enviandoPedido &&
              styles.confirmButtonDisabled,
          ]}
          onPress={confirmarPedido}
          disabled={enviandoPedido}
        >
          {enviandoPedido ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
              <Text
                style={styles.confirmButtonText}
              >
                Salvando pedido...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={styles.confirmButtonText}
              >
                Confirmar pedido
              </Text>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />
            </>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
  },
  headerSpace: {
    width: 40,
  },
  content: {
    padding: 18,
    paddingBottom: 45,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 13,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E4E4E4',
    borderRadius: 10,
    paddingHorizontal: 13,
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  productBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  productImage: {
    width: 62,
    height: 62,
    borderRadius: 7,
  },
  productInfo: {
    flex: 1,
    marginLeft: 11,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  producerName: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  quantity: {
    fontSize: 10,
    color: '#666666',
    marginTop: 5,
  },
  productPrice: {
    fontSize: 13,
    color: '#004B0A',
    fontWeight: 'bold',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    height: 70,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  optionSelected: {
    backgroundColor: '#004B0A',
  },
  optionText: {
    color: '#004B0A',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  addressContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  pickupInfo: {
    flexDirection: 'row',
    backgroundColor: '#F0F6F1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  pickupText: {
    flex: 1,
    fontSize: 11,
    color: '#444444',
    lineHeight: 17,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 9,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  affiliationCard: {
    backgroundColor: '#F7F9F7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  affiliationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  affiliationTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  affiliationTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  affiliationText: {
    fontSize: 10,
    lineHeight: 15,
    color: '#666666',
    marginTop: 3,
  },
  observationInput: {
    height: 90,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 22,
  },
  summary: {
    backgroundColor: '#F7F9F7',
    borderRadius: 10,
    padding: 17,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  summaryLabel: {
    color: '#555555',
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004B0A',
  },
  confirmButton: {
    backgroundColor: '#004B0A',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 20,
  },
  greenButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 8,
  },
  greenButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
