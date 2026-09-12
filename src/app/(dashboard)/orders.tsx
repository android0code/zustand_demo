import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import { GradientView } from '@/components/ui/gradient-view';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOrderStore } from '@/store/use-order-store';
import { useCartStore } from '@/store/use-cart-store';
import type { OrderStatus } from '@/services/api';

export default function OrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    fetchOrders();
  }, []);

  const getCategorySymbol = (catId: string): { ios: SFSymbol; android: AndroidSymbol } => {
    switch (catId) {
      case 'electronics':
        return { ios: 'laptopcomputer', android: 'laptop' };
      case 'fashion':
        return { ios: 'tshirt.fill', android: 'checkroom' };
      case 'home':
        return { ios: 'house.fill', android: 'home' };
      case 'sports':
        return { ios: 'figure.run', android: 'fitness_center' };
      case 'books':
        return { ios: 'book.fill', android: 'menu_book' };
      default:
        return { ios: 'tag.fill', android: 'sell' };
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'Processing':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.35)',
          color: '#f59e0b',
          icon: { ios: 'clock.fill' as const, android: 'schedule' as const },
          label: 'Processing',
        };
      case 'Shipped':
        return {
          bg: isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.12)',
          border: 'rgba(6, 182, 212, 0.35)',
          color: '#06b6d4',
          icon: { ios: 'shippingbox.fill' as const, android: 'local_shipping' as const },
          label: 'Shipped',
        };
      case 'Delivered':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          icon: { ios: 'checkmark.circle.fill' as const, android: 'check_circle' as const },
          label: 'Delivered',
        };
    }
  };

  const handleReorder = (orderItems: typeof orders[0]['items']) => {
    orderItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart(item.product);
      }
    });
    router.push('/cart');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.headerTitle}>
              Order History
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
              Track deliveries & manage previous orders
            </ThemedText>
          </View>
          <View style={styles.ordersBadge}>
            <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 12 }}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
              Loading your past orders...
            </ThemedText>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? '#141824' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}>
              <GradientView
                colors={['#6366f120', '#8b5cf610']}
                direction="to-bottom-right"
                style={styles.emptyIconInner}>
                <SymbolView
                  tintColor={theme.primary}
                  name={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }}
                  size={48}
                />
              </GradientView>
            </View>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No Orders Placed Yet
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
              When you purchase items from the catalog, their real-time delivery status and item receipt will appear here.
            </ThemedText>
            <ThemedButton
              title="Start Shopping →"
              variant="gradient"
              gradientColors={Gradients.primary}
              onPress={() => router.push('/')}
              style={{ minWidth: 200 }}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {orders.map((order) => {
              const statusCfg = getStatusConfig(order.status);

              return (
                <View
                  key={order.id}
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: isDark ? '#141824' : '#ffffff',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}>
                  {/* Card Header: Receipt Icon, Order ID & Status Pill */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderIdGroup}>
                      <View
                        style={[
                          styles.orderIconSquare,
                          {
                            backgroundColor: isDark
                              ? 'rgba(99, 102, 241, 0.2)'
                              : 'rgba(99, 102, 241, 0.1)',
                          },
                        ]}>
                        <SymbolView
                          tintColor={theme.primary}
                          name={{
                            ios: 'shippingbox.fill',
                            android: 'inventory_2',
                            web: 'inventory_2',
                          }}
                          size={18}
                        />
                      </View>
                      <View>
                        <ThemedText type="smallBold" style={styles.orderId}>
                          Order #{order.id}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.orderDate}>
                          Placed on {order.date}
                        </ThemedText>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: statusCfg.bg,
                          borderColor: statusCfg.border,
                        },
                      ]}>
                      <SymbolView
                        tintColor={statusCfg.color}
                        name={{
                          ios: statusCfg.icon.ios,
                          android: statusCfg.icon.android,
                          web: statusCfg.icon.android,
                        }}
                        size={12}
                      />
                      <ThemedText style={[styles.statusText, { color: statusCfg.color }]}>
                        {statusCfg.label}
                      </ThemedText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  />

                  {/* Visual Items List (Product Mini-Cards) */}
                  <View style={styles.itemsList}>
                    {order.items.map((item, idx) => {
                      const symbol = getCategorySymbol(item.product.categoryId);

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.itemRowCard,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.03)'
                                : 'rgba(0, 0, 0, 0.02)',
                              borderColor: isDark
                                ? 'rgba(255, 255, 255, 0.06)'
                                : 'rgba(0, 0, 0, 0.04)',
                            },
                          ]}>
                          {/* Mini visual icon badge */}
                          <View
                            style={[
                              styles.itemEmblem,
                              {
                                backgroundColor: isDark
                                  ? `${item.product.colorAccent}25`
                                  : `${item.product.colorAccent}15`,
                                borderColor: `${item.product.colorAccent}35`,
                              },
                            ]}>
                            <SymbolView
                              tintColor={item.product.colorAccent}
                              name={{
                                ios: symbol.ios,
                                android: symbol.android,
                                web: symbol.android,
                              }}
                              size={18}
                            />
                          </View>

                          {/* Details */}
                          <View style={styles.itemDetails}>
                            <ThemedText
                              type="smallBold"
                              numberOfLines={1}
                              style={styles.itemTitle}>
                              {item.product.name}
                            </ThemedText>
                            <ThemedText
                              type="small"
                              themeColor="textSecondary"
                              style={styles.itemMeta}>
                              {item.product.brand} • Qty: {item.quantity}
                            </ThemedText>
                          </View>

                          {/* Price */}
                          <ThemedText type="smallBold" style={styles.itemPrice}>
                            ${((item.unitPrice ?? item.product.price) * item.quantity).toFixed(2)}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>

                  {/* Destination Address Pill */}
                  <View
                    style={[
                      styles.destinationCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.025)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}>
                    <SymbolView
                      tintColor={theme.primary}
                      name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                      size={14}
                    />
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      numberOfLines={1}
                      style={styles.addressText}>
                      Delivered to: {order.shippingAddress}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  />

                  {/* Footer with Total and Prominent Reorder Button */}
                  <View style={styles.orderFooter}>
                    <View>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.totalLabel}>
                        Total ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
                      </ThemedText>
                      <ThemedText type="subtitle" style={styles.orderTotal}>
                        ${order.total.toFixed(2)}
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={() => handleReorder(order.items)}
                      style={({ pressed }) => [
                        styles.reorderBtn,
                        {
                          backgroundColor: theme.primary,
                          shadowColor: theme.primary,
                        },
                        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                      ]}>
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                      />
                      <SymbolView
                        tintColor="#ffffff"
                        name={{
                          ios: 'arrow.clockwise',
                          android: 'refresh',
                          web: 'refresh',
                        }}
                        size={13}
                      />
                      <ThemedText style={styles.reorderBtnText}>Reorder</ThemedText>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  ordersBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 130, // Safe margin for tab bar
  },
  loaderContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: 60,
  },
  emptyIconCircle: {
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  emptyIconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
    maxWidth: 280,
  },
  orderCard: {
    padding: Spacing.three + 2,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: Spacing.three + 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 12,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two + 2,
  },
  itemsList: {
    gap: 8,
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  itemEmblem: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '900',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  reorderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
