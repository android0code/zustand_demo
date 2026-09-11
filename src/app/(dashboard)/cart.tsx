import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import { ThemedInput } from '@/components/ui/themed-input';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientView } from '@/components/ui/gradient-view';
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
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getShipping = useCartStore((state) => state.getShipping);
  const getTax = useCartStore((state) => state.getTax);
  const getTotal = useCartStore((state) => state.getTotal);

  const placeOrder = useOrderStore((state) => state.placeOrder);
  const defaultAddress = useAddressStore((state) => state.getDefaultAddress());

  const getCategorySymbol = (catId: string): { ios: SFSymbol; android: AndroidSymbol } => {
    switch (catId) {
      case 'electronics':
        return { ios: 'laptopcomputer', android: 'laptop' };
      case 'fashion':
        return { ios: 'tshirt.fill', android: 'checkroom' };
      case 'home':
        return { ios: 'cup.and.saucer.fill', android: 'local_cafe' };
      case 'sports':
        return { ios: 'figure.run', android: 'fitness_center' };
      case 'books':
        return { ios: 'book.fill', android: 'menu_book' };
      default:
        return { ios: 'tag.fill', android: 'sell' };
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
  const shipping = getShipping();
  const tax = getTax();
  const total = getTotal();

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
              style={styles.clearBtn}>
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
            <ThemedButton
              title="Explore Catalog →"
              variant="gradient"
              gradientColors={Gradients.primary}
              onPress={() => router.push('/')}
              style={styles.startShoppingBtn}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
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
                    {/* Left color icon badge with category symbol */}
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

                    {/* Middle details */}
                    <View style={styles.itemDetails}>
                      <ThemedText type="smallBold" numberOfLines={1} style={styles.itemName}>
                        {product.name}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.itemBrand}>
                        {product.brand} • {product.specs[0] || 'Standard'}
                      </ThemedText>
                      <ThemedText type="smallBold" style={styles.itemPrice}>
                        ${(product.price * quantity).toFixed(2)}
                      </ThemedText>
                    </View>

                    {/* Right: Stepper & Remove */}
                    <View style={styles.itemActions}>
                      <Pressable
                        onPress={() => removeFromCart(product.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.removeBtn}>
                        <SymbolView
                          tintColor={theme.danger}
                          name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                          size={16}
                        />
                      </Pressable>

                      <View
                        style={[
                          styles.stepperWrap,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}>
                        <Pressable
                          onPress={() => updateQuantity(product.id, quantity - 1)}
                          style={styles.stepperBtn}>
                          <ThemedText type="smallBold">−</ThemedText>
                        </Pressable>
                        <ThemedText type="smallBold" style={styles.stepperValue}>
                          {quantity}
                        </ThemedText>
                        <Pressable
                          onPress={() => updateQuantity(product.id, quantity + 1)}
                          style={styles.stepperBtn}>
                          <ThemedText type="smallBold">+</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Delivery Address Card */}
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
                  <View style={[styles.pinCircle, { backgroundColor: `${theme.primary}18` }]}>
                    <SymbolView
                      tintColor={theme.primary}
                      name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                      size={14}
                    />
                  </View>
                  <ThemedText type="smallBold" style={styles.sectionLabel}>
                    DELIVERY ADDRESS
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => router.push('/addresses')}
                  style={({ pressed }) => [styles.manageBtn, pressed && { opacity: 0.7 }]}>
                  <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 12 }}>
                    Manage →
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push('/addresses')}
                style={({ pressed }) => [
                  styles.addressDisplayBox,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  },
                  pressed && { opacity: 0.8 },
                ]}>
                <View style={styles.addressTextBox}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.addressRecipient}>
                    {defaultAddress?.recipientName || 'Primary Address'}
                    {defaultAddress?.isDefault ? ' (Default)' : ''}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    numberOfLines={2}
                    style={styles.addressBody}>
                    {address}
                  </ThemedText>
                </View>
                <SymbolView
                  tintColor={theme.textSecondary}
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={14}
                />
              </Pressable>
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

              <View style={styles.summaryRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Shipping (Free above $100)
                </ThemedText>
                <ThemedText
                  type="smallBold"
                  style={{ color: shipping === 0 ? '#10b981' : theme.text }}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
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
                  Total
                </ThemedText>
                <ThemedText type="subtitle" style={[styles.totalAmount, { color: theme.primary }]}>
                  ${total.toFixed(2)}
                </ThemedText>
              </View>

              <ThemedButton
                title={isCheckingOut ? 'Processing Order...' : `Pay $${total.toFixed(2)} • Place Order`}
                variant="gradient"
                gradientColors={Gradients.primary}
                loading={isCheckingOut}
                onPress={handleCheckout}
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
                  Secure 256-bit encrypted checkout
                </ThemedText>
              </View>
            </View>
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
  itemHeroBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 30,
    paddingHorizontal: 4,
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
});
