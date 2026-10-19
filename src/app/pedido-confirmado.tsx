import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useCart } from '../context/CartContext';

export default function PedidoConfirmadoScreen() {
  const { limparCarrinho } = useCart();

  function voltarInicio() {
    limparCarrinho();
    router.replace('/inicio');
  }

  function verPedidos() {
    limparCarrinho();
    router.replace('/meus-pedidos');
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="checkmark-circle"
          size={95}
          color="#004B0A"
        />
      </View>

      <Text style={styles.title}>
        Pedido confirmado!
      </Text>

      <Text style={styles.subtitle}>
        Seu pedido foi realizado com sucesso.
      </Text>

      <View style={styles.orderCard}>
        <Text style={styles.orderLabel}>
          Número do pedido
        </Text>

        <Text style={styles.orderNumber}>
          #CA2026-001
        </Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons
            name="time-outline"
            size={21}
            color="#004B0A"
          />

          <Text style={styles.infoText}>
            Aguarde a confirmação do produtor.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={21}
            color="#004B0A"
          />

          <Text style={styles.infoText}>
            Você poderá acompanhar as atualizações em Meus pedidos.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={verPedidos}
      >
        <Ionicons
          name="receipt-outline"
          size={20}
          color="#FFFFFF"
        />

        <Text style={styles.primaryButtonText}>
          Ver meus pedidos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={voltarInicio}
      >
        <Ionicons
          name="home-outline"
          size={20}
          color="#004B0A"
        />

        <Text style={styles.secondaryButtonText}>
          Voltar ao início
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
  },

  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },

  orderCard: {
    backgroundColor: '#F7F9F7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
  },

  orderLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },

  orderNumber: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#004B0A',
    textAlign: 'center',
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 18,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#444444',
    lineHeight: 18,
  },

  primaryButton: {
    backgroundColor: '#004B0A',
    borderRadius: 8,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: '#004B0A',
    borderRadius: 8,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#004B0A',
    fontSize: 15,
    fontWeight: '600',
  },
});