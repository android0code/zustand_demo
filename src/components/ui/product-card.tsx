import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Product } from '@/services/api';
import { useCartStore } from '@/store/use-cart-store';

export interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const quantity = useCartStore((state) => state.getItemQuantity(product.id));

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

  const symbol = getCategorySymbol(product.categoryId);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#141824' : '#ffffff',
            borderColor: isDark ? `${product.colorAccent}30` : `${product.colorAccent}22`,
            shadowColor: isDark ? '#000000' : product.colorAccent,
          },
        ]}>
        {/* Inset Rounded Showcase Hero Canvas */}
        <View
          style={[
            styles.heroCanvas,
            {
              backgroundColor: isDark
                ? `${product.colorAccent}18`
                : `${product.colorAccent}0e`,
              borderColor: isDark
                ? `${product.colorAccent}25`
                : `${product.colorAccent}18`,
            },
          ]}>
          {/* Top Row: Brand tag & Discount Badge */}
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.brandPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}>
              <ThemedText
                style={[styles.brandText, { color: product.colorAccent }]}>
                {product.brand.toUpperCase()}
              </ThemedText>
            </View>

            {product.badge ? (
              <View
                style={[
                  styles.badgeContainer,
                  {
                    backgroundColor: product.colorAccent,
                    shadowColor: product.colorAccent,
                  },
                ]}>
                <ThemedText style={styles.badgeText}>{product.badge}</ThemedText>
              </View>
            ) : null}
          </View>

          {/* Center Glowing Icon Emblem */}
          <View style={styles.emblemWrapper}>
            <View
              style={[
                styles.iconEmblem,
                {
                  backgroundColor: isDark
                    ? `${product.colorAccent}25`
                    : '#ffffff',
                  borderColor: `${product.colorAccent}35`,
                },
              ]}>
              <SymbolView
                tintColor={product.colorAccent}
                name={{ ios: symbol.ios, android: symbol.android, web: symbol.android }}
                size={26}
              />
            </View>
          </View>
        </View>

        {/* Product Details Section */}
        <View style={styles.contentSection}>
          <ThemedText type="smallBold" numberOfLines={2} style={styles.productName}>
            {product.name}
          </ThemedText>

          {/* Spec Tags - Coordinated with Category Tint */}
          <View style={styles.specsRow}>
            {product.specs.slice(0, 2).map((spec, index) => (
              <View
                key={index}
                style={[
                  styles.specChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : `${product.colorAccent}0a`,
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : `${product.colorAccent}20`,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={[
                    styles.specText,
                    {
                      color: isDark ? theme.textSecondary : `${product.colorAccent}ee`,
                    },
                  ]}>
                  {spec}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Rating & Stock Row */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.ratingPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(245, 158, 11, 0.12)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                },
              ]}>
              <ThemedText style={styles.starText}>★</ThemedText>
              <ThemedText type="smallBold" style={styles.ratingNumber}>
                {product.rating}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.reviewsCount}>
                ({product.reviewsCount})
              </ThemedText>
            </View>

            {product.inStock && (
              <View style={styles.stockBadge}>
                <View style={styles.stockDot} />
                <ThemedText type="small" style={styles.stockText}>
                  In Stock
                </ThemedText>
              </View>
            )}
          </View>

          {/* Price & Add to Cart Row */}
          <View style={styles.footerRow}>
            <View style={styles.priceContainer}>
              <ThemedText type="subtitle" style={styles.currentPrice}>
                ${product.price.toFixed(2)}
              </ThemedText>
              {product.originalPrice && (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.originalPrice}>
                  ${product.originalPrice.toFixed(2)}
                </ThemedText>
              )}
            </View>

            {/* Cart Button or Stepper */}
            {quantity === 0 ? (
              <Pressable
                onPress={() => addToCart(product)}
                style={({ pressed }) => [
                  styles.addBtnOuter,
                  isDark ? styles.addBtnOuterDark : styles.addBtnOuterLight,
                  pressed && styles.buttonPressed,
                ]}>
                <View
                  style={[
                    styles.addBtnInner,
                    {
                      backgroundColor: isDark
                        ? `${product.colorAccent}25`
                        : `${product.colorAccent}14`,
                      borderColor: isDark ? `${product.colorAccent}40` : '#ffffff',
                    },
                  ]}>
                  <SymbolView
                    tintColor={product.colorAccent}
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={12}
                  />
                  <ThemedText
                    style={[styles.addButtonText, { color: product.colorAccent }]}>
                    Add
                  </ThemedText>
                </View>
              </Pressable>
            ) : (
              <View
                style={[
                  styles.stepperContainer,
                  isDark ? styles.stepperOuterDark : styles.stepperOuterLight,
                ]}>
                <View
                  style={[
                    styles.stepperInner,
                    {
                      backgroundColor: isDark
                        ? `${product.colorAccent}20`
                        : `${product.colorAccent}10`,
                      borderColor: isDark ? `${product.colorAccent}40` : '#ffffff',
                    },
                  ]}>
                  <Pressable
                    onPress={() => updateQuantity(product.id, quantity - 1)}
                    style={styles.stepperBtn}>
                    <ThemedText type="smallBold" style={{ color: product.colorAccent }}>
                      −
                    </ThemedText>
                  </Pressable>
                  <ThemedText type="smallBold" style={[styles.stepperQuantity, { color: product.colorAccent }]}>
                    {quantity}
                  </ThemedText>
                  <Pressable
                    onPress={() => updateQuantity(product.id, quantity + 1)}
                    style={styles.stepperBtn}>
                    <ThemedText type="smallBold" style={{ color: product.colorAccent }}>
                      +
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      } as any,
    }),
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.93,
  },
  heroCanvas: {
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.two + 2,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  brandText: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconEmblem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  contentSection: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three + 2,
    paddingTop: 2,
  },
  productName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: Spacing.one + 2,
    minHeight: 40,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  specChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  specText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two + 4,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  starText: {
    color: '#f59e0b',
    fontSize: 12,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  reviewsCount: {
    fontSize: 11,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  stockText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  currentPrice: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '900',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  addBtnOuter: {
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
  },
  addBtnOuterLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(255, 255, 255, 0.9) inset',
      } as any,
    }),
  },
  addBtnOuterDark: {
    backgroundColor: '#141926',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(255, 255, 255, 0.06) inset',
      } as any,
    }),
  },
  addBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  addButtonText: {
    fontWeight: '800',
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  stepperContainer: {
    borderRadius: 18,
    padding: 2,
    borderWidth: 1,
  },
  stepperOuterLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  stepperOuterDark: {
    backgroundColor: '#141926',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepperInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    height: 30,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQuantity: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
});
