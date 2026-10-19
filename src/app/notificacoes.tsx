import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import { useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Notificacao,
  TipoNotificacao,
  useNotificacoes,
} from '../context/NotificacoesContext';

type Filtro = 'Todas' | 'Não lidas';

export default function NotificacoesScreen() {
  const params = useLocalSearchParams<{
    perfil?: string;
  }>();

  const modoProdutor =
    params.perfil === 'produtor';

  const {
    notificacoes,
    quantidadeNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
    removerNotificacao,

    notificacoesProdutor,
    quantidadeNaoLidasProdutor,
    marcarComoLidaProdutor,
    marcarTodasComoLidasProdutor,
    removerNotificacaoProdutor,
  } = useNotificacoes();

  const [filtro, setFiltro] =
    useState<Filtro>('Todas');

  const listaNotificacoes = modoProdutor
    ? notificacoesProdutor
    : notificacoes;

  const quantidadeNaoLidasAtual =
    modoProdutor
      ? quantidadeNaoLidasProdutor
      : quantidadeNaoLidas;

  const notificacoesFiltradas =
    filtro === 'Não lidas'
      ? listaNotificacoes.filter(
          (item) => !item.lida
        )
      : listaNotificacoes;

  function obterIcone(
    tipo: TipoNotificacao
  ) {
    switch (tipo) {
      case 'pedido':
        return 'receipt-outline';

      case 'produto':
        return 'basket-outline';

      case 'excedente':
        return 'leaf-outline';

      case 'produtor':
        return 'people-outline';

      case 'afiliacao':
        return 'megaphone-outline';

      default:
        return 'information-circle-outline';
    }
  }

  function marcarNotificacaoComoLida(
    id: string
  ) {
    if (modoProdutor) {
      marcarComoLidaProdutor(id);
    } else {
      marcarComoLida(id);
    }
  }

  function marcarTodas() {
    if (modoProdutor) {
      marcarTodasComoLidasProdutor();
    } else {
      marcarTodasComoLidas();
    }
  }

  function remover(id: string) {
    if (modoProdutor) {
      removerNotificacaoProdutor(id);
    } else {
      removerNotificacao(id);
    }
  }

  function abrirNotificacao(
    notificacao: Notificacao
  ) {
    marcarNotificacaoComoLida(
      notificacao.id
    );

    if (notificacao.rota) {
      router.push(
        notificacao.rota as never
      );
    }
  }

  function confirmarRemocao(
    notificacao: Notificacao
  ) {
    Alert.alert(
      'Remover notificação',
      'Deseja remover esta notificação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () =>
            remover(notificacao.id),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#004B0A"
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Notificações
          </Text>

          <Text style={styles.headerSubtitle}>
            {quantidadeNaoLidasAtual > 0
              ? `${quantidadeNaoLidasAtual} não ${
                  quantidadeNaoLidasAtual === 1
                    ? 'lida'
                    : 'lidas'
                }`
              : 'Tudo em dia'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerAction}
          onPress={marcarTodas}
          disabled={
            quantidadeNaoLidasAtual === 0
          }
        >
          <Ionicons
            name="checkmark-done-outline"
            size={23}
            color={
              quantidadeNaoLidasAtual > 0
                ? '#004B0A'
                : '#BBBBBB'
            }
          />
        </TouchableOpacity>
      </View>

      {modoProdutor && (
        <View style={styles.producerArea}>
          <Ionicons
            name="storefront-outline"
            size={15}
            color="#004B0A"
          />

          <Text style={styles.producerAreaText}>
            Área do produtor
          </Text>
        </View>
      )}

      <View style={styles.filterArea}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filtro === 'Todas' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            setFiltro('Todas')
          }
        >
          <Text
            style={[
              styles.filterText,
              filtro === 'Todas' &&
                styles.filterTextActive,
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filtro === 'Não lidas' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            setFiltro('Não lidas')
          }
        >
          <Text
            style={[
              styles.filterText,
              filtro === 'Não lidas' &&
                styles.filterTextActive,
            ]}
          >
            Não lidas
          </Text>

          {quantidadeNaoLidasAtual >
            0 && (
            <View
              style={
                filtro === 'Não lidas'
                  ? styles.filterBadgeActive
                  : styles.filterBadge
              }
            >
              <Text
                style={
                  filtro === 'Não lidas'
                    ? styles.filterBadgeTextActive
                    : styles.filterBadgeText
                }
              >
                {quantidadeNaoLidasAtual}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {notificacoesFiltradas.length >
      0 ? (
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {notificacoesFiltradas.map(
            (notificacao) => (
              <TouchableOpacity
                key={notificacao.id}
                style={[
                  styles.notificationCard,
                  !notificacao.lida &&
                    styles.notificationCardUnread,
                ]}
                activeOpacity={0.85}
                onPress={() =>
                  abrirNotificacao(
                    notificacao
                  )
                }
                onLongPress={() =>
                  confirmarRemocao(
                    notificacao
                  )
                }
              >
                <View
                  style={[
                    styles.notificationIcon,
                    !notificacao.lida &&
                      styles.notificationIconUnread,
                  ]}
                >
                  <Ionicons
                    name={
                      obterIcone(
                        notificacao.tipo
                      ) as any
                    }
                    size={23}
                    color="#004B0A"
                  />
                </View>

                <View
                  style={
                    styles.notificationContent
                  }
                >
                  <View
                    style={
                      styles.notificationTop
                    }
                  >
                    <Text
                      style={[
                        styles.notificationTitle,
                        !notificacao.lida &&
                          styles.notificationTitleUnread,
                      ]}
                    >
                      {notificacao.titulo}
                    </Text>

                    {!notificacao.lida && (
                      <View
                        style={
                          styles.unreadDot
                        }
                      />
                    )}
                  </View>

                  <Text
                    style={
                      styles.notificationMessage
                    }
                  >
                    {notificacao.mensagem}
                  </Text>

                  <View
                    style={
                      styles.notificationFooter
                    }
                  >
                    <Text
                      style={
                        styles.notificationTime
                      }
                    >
                      {notificacao.tempo}
                    </Text>

                    {notificacao.rota && (
                      <View
                        style={
                          styles.openRow
                        }
                      >
                        <Text
                          style={
                            styles.openText
                          }
                        >
                          Ver
                        </Text>

                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color="#004B0A"
                        />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          )}

          <View style={styles.tipCard}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#004B0A"
            />

            <Text style={styles.tipText}>
              Toque em uma notificação
              para abrir o conteúdo.
              Mantenha pressionado para
              removê-la.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="notifications-off-outline"
              size={42}
              color="#8BA58E"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nenhuma notificação
          </Text>

          <Text style={styles.emptyText}>
            {filtro === 'Não lidas'
              ? 'Você já leu todas as suas notificações.'
              : modoProdutor
                ? 'Quando houver novidades sobre seus pedidos e sua produção, elas aparecerão aqui.'
                : 'Quando houver novidades no ConectaAgro, elas aparecerão aqui.'}
          </Text>

          {filtro === 'Não lidas' && (
            <TouchableOpacity
              style={styles.showAllButton}
              onPress={() =>
                setFiltro('Todas')
              }
            >
              <Text
                style={
                  styles.showAllButtonText
                }
              >
                Ver todas
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 28,
    paddingBottom: 14,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },

  headerSubtitle: {
    fontSize: 9,
    color: '#777777',
    marginTop: 2,
  },

  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  producerArea: {
    minHeight: 35,
    backgroundColor: '#E7F1E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#D5E4D7',
  },

  producerAreaText: {
    fontSize: 9,
    color: '#004B0A',
    fontWeight: '600',
  },

  filterArea: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
  },

  filterButton: {
    height: 35,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: '#004B0A',
  },

  filterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555555',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  filterBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    marginLeft: 6,
    backgroundColor: '#004B0A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterBadgeActive: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    marginLeft: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  filterBadgeTextActive: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#004B0A',
  },

  scrollContent: {
    padding: 14,
    paddingBottom: 35,
  },

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  notificationCardUnread: {
    backgroundColor: '#F3F8F4',
    borderColor: '#D5E4D7',
  },

  notificationIcon: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#F0F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationIconUnread: {
    backgroundColor: '#DCEBDD',
  },

  notificationContent: {
    flex: 1,
    marginLeft: 11,
  },

  notificationTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },

  notificationTitleUnread: {
    fontWeight: 'bold',
    color: '#111111',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004B0A',
    marginLeft: 7,
  },

  notificationMessage: {
    fontSize: 9,
    lineHeight: 14,
    color: '#666666',
    marginTop: 5,
  },

  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  notificationTime: {
    fontSize: 8,
    color: '#999999',
  },

  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  openText: {
    fontSize: 8,
    color: '#004B0A',
    fontWeight: '600',
    marginRight: 2,
  },

  tipCard: {
    backgroundColor: '#E7F1E8',
    borderRadius: 11,
    padding: 13,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    color: '#555555',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 17,
  },

  emptyText: {
    fontSize: 10,
    lineHeight: 15,
    color: '#777777',
    textAlign: 'center',
    marginTop: 6,
  },

  showAllButton: {
    backgroundColor: '#004B0A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    marginTop: 17,
  },

  showAllButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});