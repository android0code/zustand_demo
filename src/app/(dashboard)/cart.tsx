import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { ThemedInput } from '@/components/ui/themed-input';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientView } from '@/components/ui/gradient-view';
import { StripeCheckoutModal } from '@/components/ui/stripe-checkout-modal';
import { WebFooter } from '@/components/ui/web-footer';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCartStore } from '@/store/use-cart-store';
import { useOrderStore } from '@/store/use-order-store';
import { useAddressStore } from '@/store/use-address-store';

export default function CartScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const couponCode = useCartStore((state) => state.couponCode);
  const discountPercent = useCartStore((state) => state.discountPercent);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getDiscount = useCartStore((state) => state.getDiscount);
  const getShipping = useCartStore((state) => state.getShipping);
  const getTax = useCartStore((state) => state.getTax);
  const getTotal = useCartStore((state) => state.getTotal);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  const placeOrder = useOrderStore((state) => state.placeOrder);
  const defaultAddress = useAddressStore((state) => state.getDefaultAddress());

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isStripeModalVisible, setIsStripeModalVisible] = useState(false);

  const getCategorySymbol = (catId: string): { ios: SFSymbol; android: AndroidSymbol } => {
    switch (catId) {
      case 'ebooks':
        return { ios: 'book.fill', android: 'menu_book' };
      case 'templates':
        return { ios: 'square.stack.3d.up.fill', android: 'layers' };
      case 'uikits':
        return { ios: 'paintpalette.fill', android: 'palette' };
      case 'tools':
        return { ios: 'wrench.and.screwdriver.fill', android: 'build' };
      default:
        return { ios: 'sparkles', android: 'auto_awesome' };
    }
  };

  const defaultAddrStr = defaultAddress
    ? `${defaultAddress.recipientName}, ${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}`
    : '42 Silicon Boulevard, San Jose, CA 95128';
  const [address, setAddress] = useState(defaultAddrStr);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (defaultAddress) {
      setAddress(
        `${defaultAddress.recipientName}, ${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}`
      );
    }
  }, [defaultAddress]);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShipping();
  const tax = getTax();
  const total = getTotal();
  const totalItems = getTotalItems();

  const handleApplyCoupon = () => {
    setCouponError(null);
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.error || 'Invalid coupon code');
    } else {
      setCouponInput('');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const result = await placeOrder(items, address);
      if (result.success && result.order) {
        clearCart();
        if (Platform.OS === 'web') {
          alert(`Order Placed Successfully! Order #${result.order.id}`);
          router.push('/orders');
        } else {
          Alert.alert(
            'Order Confirmed! 🎉',
            `Your order #${result.order.id} has been placed and is being processed.`,
            [
              {
                text: 'View Orders',
                onPress: () => router.push('/orders'),
              },
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          alert(result.error || 'Failed to place order');
        } else {
          Alert.alert('Checkout Failed', result.error || 'Failed to place order');
        }
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert(err?.message || 'Unexpected checkout error');
      } else {
        Alert.alert('Error', err?.message || 'Unexpected checkout error');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Top Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>
              Shopping Cart
            </ThemedText>
            {items.length > 0 && (
              <Pressable
                onPress={() => {
                  if (Platform.OS === 'web') {
                    clearCart();
                  } else {
                    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: clearCart },
                    ]);
                  }
                }}
                style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}>
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  Clear All
                </ThemedText>
              </Pressable>
            )}
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <GlassCard elevated style={styles.emptyIconCircle}>
                <GradientView
                  colors={['#6366f120', '#8b5cf610']}
                  direction="to-bottom-right"
                  style={styles.emptyIconInner}>
                  <SymbolView
                    tintColor={theme.primary}
                    name={{ ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' }}
                    size={52}
                  />
                </GradientView>
              </GlassCard>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Your Cart is Empty
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                Discover curated products with no-image visual specs and add your favorites to cart.
              </ThemedText>
              <Pressable
                onPress={() => router.push('/')}
                style={({ pressed }) => [styles.startShoppingBtn, pressed && { opacity: 0.85 }]}>
                <ThemedText style={styles.startShoppingBtnText}>Explore Catalog →</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cartContentWrapper}>
              {/* Items List */}
              <View style={styles.itemsList}>
              {items.map(({ product, quantity }) => {
                const catSymbol = getCategorySymbol(product.categoryId);

                return (
                  <View
                    key={product.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: isDark ? '#141824' : '#ffffff',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}>
                    {/* Left color icon badge & Middle details */}
                    <View style={styles.itemMainPressable}>
                      {productThumbnails[product.id] ? (
                        <Image
                          source={productThumbnails[product.id]}
                          contentFit="cover"
                          style={styles.itemThumbnail}
                        />
                      ) : (
                        <View
                          style={[
                            styles.itemHeroBadge,
                            {
                              backgroundColor: isDark
                                ? `${product.colorAccent}25`
                                : `${product.colorAccent}15`,
                              borderColor: `${product.colorAccent}35`,
                            },
                          ]}>
                          <SymbolView
                            tintColor={product.colorAccent}
                            name={{
                              ios: catSymbol.ios,
                              android: catSymbol.android,
                              web: catSymbol.android,
                            }}
                            size={20}
                          />
                        </View>
                      )}

                      {/* Middle details */}
                      <View style={styles.itemDetails}>
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.itemName}>
                          {product.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.itemBrand}>
                          {product.fileFormat || product.specs[0] || 'Digital File'} • {product.brand}
                        </ThemedText>
                        <ThemedText type="smallBold" style={styles.itemPrice}>
                          ${(product.price * quantity).toFixed(2)}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Right: Stepper & Remove */}
                    <View style={styles.itemActions}>
                      <Pressable
                        onPress={() => removeFromCart(product.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={({ pressed }) => [
                          styles.removeBtn,
                          {
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                          },
                          pressed && { opacity: 0.7 },
                        ]}>
                        <GlassView
                          glassEffectStyle="regular"
                          colorScheme={isDark ? 'dark' : 'light'}
                          style={StyleSheet.absoluteFill}
                        />
                        <SymbolView
                          tintColor={theme.danger}
                          name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                          size={16}
                        />
                      </Pressable>

                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[
                          styles.stepperWrap,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}>
                        <Pressable
                          onPress={() => updateQuantity(product.id, quantity - 1)}
                          style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.5 }]}>
                          <ThemedText type="smallBold">−</ThemedText>
                        </Pressable>
                        <ThemedText type="smallBold" style={styles.stepperValue}>
                          {quantity}
                        </ThemedText>
                        <Pressable
                          onPress={() => updateQuantity(product.id, quantity + 1)}
                          style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.5 }]}>
                          <ThemedText type="smallBold">+</ThemedText>
                        </Pressable>
                      </GlassView>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Instant Digital Delivery Card */}
            <View
              style={[
                styles.addressSectionCard,
                {
                  backgroundColor: isDark ? '#141824' : '#ffffff',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.18)',
                },
              ]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.addressHeaderLeft}>
                  <View style={[styles.pinCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <SymbolView
                      tintColor="#6366f1"
                      name={{ ios: 'arrow.down.circle.fill', android: 'download', web: 'download' }}
                      size={14}
                    />
                  </View>
                  <ThemedText type="smallBold" style={styles.sectionLabel}>
                    INSTANT DIGITAL DELIVERY
                  </ThemedText>
                </View>
                <View style={styles.freeBadgePill}>
                  <ThemedText style={styles.freeBadgeText}>100% FREE</ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.addressDisplayBox,
                  {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                  },
                ]}>
                <View style={styles.addressTextBox}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.addressRecipient}>
                    ⚡ Automatic Browser Download & Direct Email
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.addressBody}>
                    Your files will automatically download upon Stripe payment approval. License keys and invoices are immediately saved to your account.
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Promo / Coupon Code Card */}
            <View
              style={[
                styles.addressSectionCard,
                {
                  backgroundColor: isDark ? '#141824' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.addressHeaderLeft}>
                  <View style={[styles.pinCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <SymbolView
                      tintColor="#f59e0b"
                      name={{ ios: 'tag.fill', android: 'sell', web: 'sell' }}
                      size={14}
                    />
                  </View>
                  <ThemedText type="smallBold" style={styles.sectionLabel}>
                    PROMO CODE
                  </ThemedText>
                </View>
              </View>

              {couponCode ? (
                <View
                  style={[
                    styles.appliedCouponRow,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                    },
                  ]}>
                  <View style={styles.appliedCouponLeft}>
                    <SymbolView
                      tintColor="#10b981"
                      name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                      size={16}
                    />
                    <ThemedText type="smallBold" style={{ color: '#10b981', fontSize: 13 }}>
                      {couponCode} (
                      {couponCode.startsWith('NEXTFREE') || couponCode.startsWith('FREE1') || couponCode === 'NEXT1FREE'
                        ? '1 Free Product Applied'
                        : couponCode === 'BUY2GET1' || couponCode === 'BUY2FREE1' || couponCode === 'B2G1'
                        ? 'Buy 2, Get 1 Free + Bonus'
                        : `${discountPercent}% OFF`}{' '}
                      applied)
                    </ThemedText>
                  </View>
                  <Pressable onPress={removeCoupon} style={styles.removeCouponBtn}>
                    <ThemedText type="smallBold" style={{ color: theme.danger, fontSize: 12 }}>
                      Remove
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.couponInputRow}>
                  <TextInput
                    placeholder="Enter code (e.g. NEXTFREE or DIGIT50)"
                    placeholderTextColor={theme.textSecondary}
                    value={couponInput}
                    onChangeText={(t) => {
                      setCouponInput(t);
                      if (couponError) setCouponError(null);
                    }}
                    autoCapitalize="characters"
                    style={[
                      styles.couponInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        color: theme.text,
                      },
                    ]}
                  />
                  <Pressable
                    onPress={handleApplyCoupon}
                    style={({ pressed }) => [
                      styles.applyCouponBtn,
                      { backgroundColor: theme.primary },
                      pressed && { opacity: 0.8 },
                    ]}>
                    <ThemedText style={styles.applyCouponBtnText}>Apply</ThemedText>
                  </Pressable>
                </View>
              )}

              {couponError && (
                <ThemedText style={[styles.couponErrorText, { color: theme.danger }]}>
                  {couponError}
                </ThemedText>
              )}
            </View>

            {/* Price Summary Breakdown */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? '#141824' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}>
              <ThemedText type="smallBold" style={styles.summaryTitle}>
                Order Summary
              </ThemedText>

              <View style={styles.summaryRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Subtotal
                </ThemedText>
                <ThemedText type="smallBold">${subtotal.toFixed(2)}</ThemedText>
              </View>

              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <ThemedText type="small" style={{ color: '#10b981' }}>
                    Coupon Discount ({couponCode})
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: '#10b981' }}>
                    -${discount.toFixed(2)}
                  </ThemedText>
                </View>
              )}

              <View style={styles.summaryRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Digital Delivery
                </ThemedText>
                <ThemedText
                  type="smallBold"
                  style={{ color: '#10b981' }}>
                  Instant Download (FREE)
                </ThemedText>
              </View>

              <View style={styles.summaryRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Estimated Tax (8%)
                </ThemedText>
                <ThemedText type="smallBold">${tax.toFixed(2)}</ThemedText>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              />

              <View style={styles.totalRow}>
                <ThemedText type="subtitle" style={styles.totalLabel}>
                  Total Due
                </ThemedText>
                <ThemedText type="subtitle" style={[styles.totalAmount, { color: theme.primary }]}>
                  ${total.toFixed(2)}
                </ThemedText>
              </View>

              {totalItems >= 2 && (
                <View
                  style={[
                    styles.qualifyingRewardBanner,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                    },
                  ]}>
                  <SymbolView
                    tintColor="#10b981"
                    name={{ ios: 'gift.fill', android: 'card_giftcard', web: 'card_giftcard' }}
                    size={16}
                  />
                  <ThemedText style={styles.qualifyingRewardText}>
                    <ThemedText style={{ fontWeight: '700', color: '#10b981' }}>Buy 2 Bonus: </ThemedText>
                    You qualify for a 100% FREE product coupon code sent to your email after checkout for your next order!
                  </ThemedText>
                </View>
              )}

              <ThemedButton
                title={`⚡ Pay with Stripe • $${total.toFixed(2)}`}
                variant="gradient"
                gradientColors={Gradients.primary}
                onPress={() => setIsStripeModalVisible(true)}
                size="large"
                style={styles.checkoutBtn}
              />

              <View style={styles.securityNote}>
                <SymbolView
                  tintColor="#10b981"
                  name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                  size={12}
                />
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                  Protected by Stripe 256-Bit SSL • Instant File Delivery
                </ThemedText>
              </View>
            </View>
            </View>
          )}

          {/* Responsive Website Footer */}
          <WebFooter />
        </ScrollView>
      </SafeAreaView>

      {/* Stripe Digital Checkout Modal */}
      <StripeCheckoutModal
        visible={isStripeModalVisible}
        onClose={() => setIsStripeModalVisible(false)}
        items={items}
        onSuccess={() => {
          setIsStripeModalVisible(false);
          router.push('/orders');
        }}
      />
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
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 130, // Tab bar clearance
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
    marginBottom: Spacing.three,
  },
  emptyIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  startShoppingBtn: {
    minWidth: 200,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startShoppingBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  cartContentWrapper: {
    width: '100%',
  },
  itemsList: {
    gap: Spacing.two + 2,
    marginVertical: Spacing.three,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 18,
    gap: Spacing.three,
  },
  itemMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemHeroBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemThumbnail: {
    width: 44,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  itemBrand: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 30,
    paddingHorizontal: 4,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  stepperBtn: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  addressSectionCard: {
    padding: Spacing.four,
    borderRadius: 20,
    marginBottom: Spacing.four,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two + 2,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: '800',
  },
  manageBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  addressDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
  },
  addressTextBox: {
    flex: 1,
  },
  addressRecipient: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  addressBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  summaryCard: {
    padding: Spacing.four,
    borderRadius: 22,
    marginBottom: Spacing.four,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two + 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '800',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10b981',
  },
  qualifyingRewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  qualifyingRewardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  checkoutBtn: {
    width: '100%',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.two + 4,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two + 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  removeCouponBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  applyCouponBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  couponErrorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 2,
  },
  freeBadgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  freeBadgeText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
