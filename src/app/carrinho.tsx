import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useCart } from '../context/CartContext';

export default function CarrinhoScreen() {
  const {
    itens,
    removerProduto,
    alterarQuantidade,
    limparCarrinho,
  } = useCart();

  const subtotal = itens.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  );

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
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
          Carrinho
        </Text>

        {itens.length > 0 ? (
          <TouchableOpacity onPress={limparCarrinho}>
            <Ionicons
              name="trash-outline"
              size={22}
              color="#A00000"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpace} />
        )}
      </View>

      {/* CARRINHO VAZIO */}
      {itens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="cart-outline"
              size={55}
              color="#004B0A"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Seu carrinho está vazio
          </Text>

          <Text style={styles.emptyText}>
            Adicione produtos de produtores locais para continuar.
          </Text>

          <TouchableOpacity
            style={styles.productsButton}
            onPress={() => router.push('/produtos')}
          >
            <Text style={styles.productsButtonText}>
              Ver produtos
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* LISTA DE PRODUTOS */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.itemsText}>
              {itens.length === 1
                ? '1 produto no carrinho'
                : `${itens.length} produtos no carrinho`}
            </Text>

            {itens.map((item) => (
              <View
                key={item.id}
                style={styles.cartItem}
              >
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/produto/${item.id}`)
                  }
                >
                  <Image
                    source={item.imagem}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                <View style={styles.productInfo}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/produto/${item.id}`)
                    }
                  >
                    <Text style={styles.productName}>
                      {item.nome}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.producerName}>
                    {item.produtor}
                  </Text>

                  <Text style={styles.productPrice}>
                    {formatarPreco(item.preco)}
                  </Text>

                  <View style={styles.bottomItem}>
                    {/* QUANTIDADE */}
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          alterarQuantidade(
                            item.id,
                            item.quantidade - 1
                          )
                        }
                      >
                        <Text style={styles.quantityButtonText}>
                          −
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.quantityText}>
                        {item.quantidade}
                      </Text>

                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          alterarQuantidade(
                            item.id,
                            item.quantidade + 1
                          )
                        }
                      >
                        <Text style={styles.quantityButtonText}>
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* REMOVER */}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() =>
                        removerProduto(item.id)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#A00000"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* RESUMO */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>
                Resumo do pedido
              </Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Subtotal
                </Text>

                <Text style={styles.summaryValue}>
                  {formatarPreco(subtotal)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total
                </Text>

                <Text style={styles.totalValue}>
                  {formatarPreco(subtotal)}
                </Text>
              </View>
            </View>

            {/* CONTINUAR COMPRANDO */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => router.push('/produtos')}
            >
              <Ionicons
                name="add"
                size={19}
                color="#004B0A"
              />

              <Text style={styles.continueButtonText}>
                Continuar comprando
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* FINALIZAR PEDIDO */}
          <View style={styles.checkoutContainer}>
            <View>
              <Text style={styles.checkoutLabel}>
                Total
              </Text>

              <Text style={styles.checkoutPrice}>
                {formatarPreco(subtotal)}
              </Text>
            </View>

           <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => router.push('/finalizar-pedido')}
                >
              <Text style={styles.checkoutButtonText}>
                Finalizar pedido
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </>
      )}
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },

  headerSpace: {
    width: 40,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 130,
  },

  itemsText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 15,
  },

  cartItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 18,
    marginBottom: 18,
  },

  productImage: {
    width: 105,
    height: 105,
    borderRadius: 10,
  },

  productInfo: {
    flex: 1,
    marginLeft: 14,
  },

  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },

  producerName: {
    fontSize: 11,
    color: '#666666',
    marginTop: 3,
  },

  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 7,
  },

  bottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonText: {
    fontSize: 18,
    color: '#004B0A',
    lineHeight: 20,
  },

  quantityText: {
    marginHorizontal: 13,
    fontSize: 14,
    fontWeight: '600',
  },

  removeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContainer: {
    backgroundColor: '#F7F9F7',
    borderRadius: 10,
    padding: 18,
    marginTop: 8,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    fontSize: 14,
    color: '#555555',
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 15,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 8,
    gap: 5,
  },

  continueButtonText: {
    color: '#004B0A',
    fontWeight: '600',
    fontSize: 14,
  },

  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  checkoutLabel: {
    fontSize: 11,
    color: '#666666',
  },

  checkoutPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004B0A',
    marginTop: 2,
  },

  checkoutButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F6F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 22,
  },

  productsButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 8,
  },

  productsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});