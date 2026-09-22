import React, { useEffect, useState } from 'react';
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
import { Image } from 'expo-image';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';

const productThumbnails: Record<string, any> = {
  'prod-ebook-1': require('@/assets/30Days_Hustle.png'),
};

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import { GradientView } from '@/components/ui/gradient-view';
import { WebFooter } from '@/components/ui/web-footer';
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
  const downloadOrderItem = useOrderStore((state) => state.downloadOrderItem);
  const addToCart = useCartStore((state) => state.addToCart);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const getCategorySymbol = (catId: string): { ios: SFSymbol; android: AndroidSymbol } => {
    switch (catId) {
      case 'ebooks':
        return { ios: 'book.fill', android: 'menu_book' };
      case 'templates':
        return { ios: 'square.stack.3d.up.fill', android: 'layers' };
      case 'student-projects':
      case 'projects':
      case 'uikits':
        return { ios: 'graduationcap.fill', android: 'school' };
      case 'tools':
        return { ios: 'wrench.and.screwdriver.fill', android: 'build' };
      default:
        return { ios: 'sparkles', android: 'auto_awesome' };
    }
  };

  const handleCopyLicense = (key: string) => {
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCopyCoupon = (code: string) => {
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2000);
    }
  };

  const handleDownloadItem = (orderId: string, productId: string) => {
    setDownloadingItemId(productId);
    downloadOrderItem(orderId, productId);
    setTimeout(() => {
      setDownloadingItemId(null);
    }, 1200);
  };

  const handleDownloadAll = (orderId: string) => {
    downloadOrderItem(orderId);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText type="title" style={styles.headerTitle}>
                My Downloads & Licenses
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
                Direct access to all purchased digital products and license keys
              </ThemedText>
            </View>
            <View style={styles.ordersBadge}>
              <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 12 }}>
                {orders.length} {orders.length === 1 ? 'purchase' : 'purchases'}
              </ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                Loading purchased licenses...
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
                    name={{ ios: 'arrow.down.circle.fill', android: 'download', web: 'download' }}
                    size={48}
                  />
                </GradientView>
              </View>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No Digital Purchases Yet
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                When you buy e-books, your instant PDF download files and license keys will appear here.
              </ThemedText>
              <ThemedButton
                title="Explore E-Books Catalog →"
                variant="gradient"
                gradientColors={Gradients.primary}
                onPress={() => router.push('/')}
                style={{ minWidth: 200 }}
              />
            </View>
          ) : (
            <View style={styles.ordersListContainer}>
              {orders.map((order) => {
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
                  {/* Card Header: Order ID & Verified License Pill */}
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
                            ios: 'arrow.down.circle.fill',
                            android: 'download_for_offline',
                            web: 'download',
                          }}
                          size={18}
                        />
                      </View>
                      <View>
                        <ThemedText type="smallBold" style={styles.orderId}>
                          Order #{order.id}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.orderDate}>
                          Purchased on {order.date}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.verifiedLicensePill}>
                      <SymbolView
                        tintColor="#10b981"
                        name={{
                          ios: 'checkmark.shield.fill',
                          android: 'verified_user',
                          web: 'verified',
                        }}
                        size={12}
                      />
                      <ThemedText style={styles.verifiedLicenseText}>
                        VERIFIED LICENSE
                      </ThemedText>
                    </View>
                  </View>

                  {/* Customer Email & License Key Box */}
                  <View
                    style={[
                      styles.licenseBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(99, 102, 241, 0.08)'
                          : 'rgba(99, 102, 241, 0.04)',
                        borderColor: isDark
                          ? 'rgba(99, 102, 241, 0.22)'
                          : 'rgba(99, 102, 241, 0.15)',
                      },
                    ]}>
                    <View style={styles.licenseRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.licenseLabel}>
                          LICENSE KEY
                        </ThemedText>
                        <ThemedText style={[styles.licenseKeyText, { color: isDark ? '#a5b4fc' : '#4f46e5' }]}>
                          {order.licenseKey || 'AA21PA-PRO-LIFETIME'}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => handleCopyLicense(order.licenseKey || 'AA21PA-PRO-LIFETIME')}
                        style={({ pressed }) => [
                          styles.copyBtn,
                          pressed && { opacity: 0.7 },
                          copiedKey === (order.licenseKey || 'AA21PA-PRO-LIFETIME') && {
                            backgroundColor: '#10b981',
                          },
                        ]}>
                        <ThemedText style={styles.copyBtnText}>
                          {copiedKey === (order.licenseKey || 'AA21PA-PRO-LIFETIME')
                            ? 'COPIED!'
                            : 'COPY KEY'}
                        </ThemedText>
                      </Pressable>
                    </View>

                    {order.customerEmail && (
                      <View style={styles.emailRow}>
                        <SymbolView
                          tintColor={theme.textSecondary}
                          name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                          size={12}
                        />
                        <ThemedText type="small" themeColor="textSecondary">
                          Sent to: {order.customerEmail}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Free Product Voucher (Buy 2 Reward) */}
                  {order.rewardCouponCode && (
                    <View
                      style={[
                        styles.rewardCouponBox,
                        {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(16, 185, 129, 0.06)',
                          borderColor: isDark
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(16, 185, 129, 0.2)',
                        },
                      ]}>
                      <View style={styles.rewardHeaderRow}>
                        <View style={styles.rewardBadgePill}>
                          <SymbolView
                            name={{ ios: 'gift.fill', android: 'card_giftcard', web: 'card_giftcard' }}
                            tintColor="#10b981"
                            size={12}
                          />
                          <ThemedText style={styles.rewardBadgeText}>
                            FREE NEXT PRODUCT VOUCHER
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => handleCopyCoupon(order.rewardCouponCode!)}
                          style={({ pressed }) => [
                            styles.copyBtn,
                            { backgroundColor: '#10b981' },
                            pressed && { opacity: 0.7 },
                          ]}>
                          <ThemedText style={styles.copyBtnText}>
                            {copiedCoupon === order.rewardCouponCode ? 'COPIED!' : 'COPY CODE'}
                          </ThemedText>
                        </Pressable>
                      </View>

                      <ThemedText style={[styles.rewardCodeValue, { color: isDark ? '#34d399' : '#059669' }]}>
                        {order.rewardCouponCode}
                      </ThemedText>

                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11.5 }}>
                        Buy 2 Special Reward: Valid for 100% off any item on your next order. Dispatched to {order.customerEmail || 'your email'}.
                      </ThemedText>
                    </View>
                  )}

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

                  {/* Digital Items List with Direct Download Button */}
                  <View style={styles.itemsList}>
                    {order.items.map((item, idx) => {
                      const symbol = getCategorySymbol(item.product.categoryId);
                      const isDownloading = downloadingItemId === item.product.id;

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
                          {productThumbnails[item.product.id] ? (
                            <Image
                              source={productThumbnails[item.product.id]}
                              contentFit="cover"
                              style={styles.itemOrderThumbnail}
                            />
                          ) : (
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
                          )}

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
                              {item.product.fileFormat || 'Digital File'} • {item.product.fileSize || 'Instant'}
                            </ThemedText>
                          </View>

                          {/* Direct Download Item Action */}
                          <Pressable
                            onPress={() => handleDownloadItem(order.id, item.product.id)}
                            style={({ pressed }) => [
                              styles.downloadItemBtn,
                              pressed && { opacity: 0.8 },
                            ]}>
                            <SymbolView
                              tintColor="#6366f1"
                              name={{
                                ios: 'arrow.down.to.line',
                                android: 'download',
                                web: 'download',
                              }}
                              size={14}
                            />
                            <ThemedText style={styles.downloadItemBtnText}>
                              {isDownloading ? 'Saved!' : 'Download PDF'}
                            </ThemedText>
                          </Pressable>
                        </View>
                      );
                    })}
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

                  {/* Footer with Total and Download All Button */}
                  <View style={styles.orderFooter}>
                    <View>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        style={styles.totalLabel}>
                        Paid with Razorpay
                      </ThemedText>
                      <ThemedText type="subtitle" style={styles.orderTotal}>
                        ${order.total.toFixed(2)}
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={() => handleDownloadAll(order.id)}
                      style={({ pressed }) => [
                        styles.downloadAllBtn,
                        {
                          backgroundColor: '#6366f1',
                        },
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}>
                      <SymbolView
                        tintColor="#ffffff"
                        name={{
                          ios: 'arrow.down.to.line.compact',
                          android: 'download',
                          web: 'download',
                        }}
                        size={14}
                      />
                      <ThemedText style={styles.downloadAllBtnText}>
                        Download All Files
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Responsive Website Footer */}
        <WebFooter />
      </ScrollView>
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
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 24,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  ordersBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyIconInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 60,
  },
  ordersListContainer: {
    gap: Spacing.three,
  },
  orderCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 11,
  },
  verifiedLicensePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedLicenseText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  licenseBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
  },
  licenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  licenseLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  licenseKeyText: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copyBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardCouponBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rewardBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rewardCodeValue: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  itemsList: {
    gap: 8,
    marginVertical: 4,
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  itemEmblem: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemOrderThumbnail: {
    width: 34,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 11,
  },
  downloadItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  downloadItemBtnText: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  downloadAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  downloadAllBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
