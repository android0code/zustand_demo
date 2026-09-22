import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Product } from '@/services/api';
import { useCartStore } from '@/store/use-cart-store';

const productCovers: Record<string, any> = {
  'prod-ebook-1': require('@/assets/30Days_Hustle.png'),
};

export interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onBuyNow?: (product: Product) => void;
}

export function ProductCard({ product, onPress, onBuyNow }: ProductCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isHovered, setIsHovered] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const quantity = useCartStore((state) => state.getItemQuantity(product.id));

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

  const symbol = getCategorySymbol(product.categoryId);
  const isComingSoon = product.status === 'coming_soon' || !product.inStock;
  const coverImage = productCovers[product.id] || (product.image ? { uri: product.image } : null);

  return (
    <Pressable
      onPress={() => {
        if (!isComingSoon && onPress) {
          onPress();
        }
      }}
      onHoverIn={() => {
        if (!isComingSoon) setIsHovered(true);
      }}
      onHoverOut={() => {
        if (!isComingSoon) setIsHovered(false);
      }}
      style={({ pressed }) => [
        styles.wrapper,
        pressed && !isComingSoon && styles.pressed,
        Platform.select({
          web: {
            cursor: isComingSoon ? 'default' : 'pointer',
            transform: !isComingSoon && isHovered ? [{ translateY: -4 }] : [{ translateY: 0 }],
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          } as any,
        }),
      ]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#141824' : '#ffffff',
            borderColor: isHovered && !isComingSoon
              ? `${product.colorAccent}60`
              : isDark
              ? `${product.colorAccent}30`
              : `${product.colorAccent}25`,
            shadowColor: isDark ? '#000000' : product.colorAccent,
            opacity: isComingSoon ? 0.92 : 1,
          },
          Platform.select({
            web: {
              boxShadow: isHovered && !isComingSoon
                ? isDark
                  ? `0 16px 36px rgba(0, 0, 0, 0.5), 0 0 24px ${product.colorAccent}30`
                  : `0 16px 36px ${product.colorAccent}25, 0 4px 12px rgba(0, 0, 0, 0.05)`
                : isDark
                ? '0 4px 16px rgba(0, 0, 0, 0.35)'
                : `0 4px 16px ${product.colorAccent}15, 0 1px 3px rgba(0, 0, 0, 0.04)`,
              transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
            } as any,
          }),
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
                ? `${product.colorAccent}28`
                : `${product.colorAccent}18`,
            },
          ]}>
          {/* Top Row: Author/Brand & Badge Tag */}
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.brandPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(20, 24, 36, 0.85)'
                    : 'rgba(255, 255, 255, 0.92)',
                  borderColor: isDark
                    ? `${product.colorAccent}40`
                    : `${product.colorAccent}30`,
                },
              ]}>
              <SymbolView
                name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                tintColor={product.colorAccent}
                size={10}
              />
              <ThemedText
                numberOfLines={1}
                style={[styles.brandText, { color: product.colorAccent }]}>
                {product.brand}
              </ThemedText>
            </View>

            {product.badge ? (
              <View
                style={[
                  styles.badgeContainer,
                  {
                    backgroundColor: isComingSoon ? '#8b5cf6' : product.colorAccent,
                    shadowColor: isComingSoon ? '#8b5cf6' : product.colorAccent,
                  },
                ]}>
                <ThemedText style={styles.badgeText}>{product.badge}</ThemedText>
              </View>
            ) : null}
          </View>

          {/* Center: Book Cover Image or Glowing Icon Emblem */}
          {coverImage ? (
            <View style={styles.coverImageWrapper}>
              <Image
                source={coverImage}
                contentFit="contain"
                transition={200}
                style={[
                  styles.coverImage,
                  Platform.select({
                    web: {
                      boxShadow: isDark
                        ? '0 14px 28px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(0, 0, 0, 0.4)'
                        : '0 14px 28px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
                    } as any,
                  }),
                ]}
              />
            </View>
          ) : (
            <View style={styles.emblemWrapper}>
              <View
                style={[
                  styles.iconEmblem,
                  {
                    backgroundColor: isDark ? '#141824' : '#ffffff',
                    borderColor: `${product.colorAccent}45`,
                    shadowColor: product.colorAccent,
                  },
                ]}>
                <SymbolView
                  tintColor={product.colorAccent}
                  name={{ ios: symbol.ios, android: symbol.android, web: symbol.android }}
                  size={32}
                />
              </View>
              <ThemedText style={[styles.emblemNotice, { color: theme.textSecondary }]}>
                {product.brand}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Product Details Section */}
        <View style={styles.contentSection}>
          <View style={styles.contentTop}>
            {/* Product Title */}
            <ThemedText type="smallBold" numberOfLines={2} style={styles.productName}>
              {product.name}
            </ThemedText>

            {/* Product Short Description */}
            {product.description ? (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={2}
                style={styles.productDescription}>
                {product.description}
              </ThemedText>
            ) : null}

            {/* Bonus Highlight Box */}
            {product.bonus ? (
              <View
                style={[
                  styles.bonusBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(245, 158, 11, 0.08)',
                    borderColor: isDark
                      ? 'rgba(245, 158, 11, 0.28)'
                      : 'rgba(245, 158, 11, 0.22)',
                  },
                ]}>
                <ThemedText
                  type="smallBold"
                  numberOfLines={2}
                  style={[
                    styles.bonusText,
                    { color: isDark ? '#fde68a' : '#b45309' },
                  ]}>
                  {product.bonus}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.contentBottom}>
            {/* Meta & Price Row */}
            <View style={styles.compactMetaRow}>
              {isComingSoon ? (
                <View
                  style={[
                    styles.compactRating,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}>
                  <ThemedText style={[styles.starText, { color: theme.textSecondary }]}>⏳</ThemedText>
                  <ThemedText type="smallBold" style={[styles.ratingNumber, { color: theme.textSecondary }]}>
                    Upcoming
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.compactRating}>
                  <ThemedText style={styles.starText}>★</ThemedText>
                  <ThemedText type="smallBold" style={styles.ratingNumber}>
                    {product.rating}
                  </ThemedText>
                </View>
              )}

              <View
                style={[
                  styles.compactFormatBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(99, 102, 241, 0.16)'
                      : 'rgba(99, 102, 241, 0.08)',
                    borderColor: isDark
                      ? 'rgba(99, 102, 241, 0.3)'
                      : 'rgba(99, 102, 241, 0.2)',
                  },
                ]}>
                <ThemedText style={[styles.compactFormatText, { color: isDark ? '#c7d2fe' : '#4338ca' }]}>
                  PDF E-Book
                </ThemedText>
              </View>

              <View style={styles.priceContainer}>
                <ThemedText type="subtitle" style={styles.currentPrice}>
                  ${product.price.toFixed(2)}
                </ThemedText>
              </View>
            </View>

            {/* Actions Row */}
            <View style={styles.clearActionsRow}>
            {isComingSoon ? (
              <View
                style={[
                  styles.comingSoonBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(0, 0, 0, 0.09)',
                  },
                ]}>
                <SymbolView
                  name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
                  tintColor={theme.textSecondary}
                  size={14}
                />
                <ThemedText style={[styles.comingSoonText, { color: theme.textSecondary }]}>
                  Coming Soon
                </ThemedText>
              </View>
            ) : (
              <>
                {onBuyNow ? (
                  <Pressable
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onBuyNow(product);
                    }}
                    style={({ pressed }) => [
                      styles.prominentBuyBtn,
                      pressed && styles.buttonPressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
                      tintColor="#ffffff"
                      size={14}
                    />
                    <ThemedText style={styles.prominentBuyText}>Buy Now</ThemedText>
                  </Pressable>
                ) : null}

                {/* Quick Cart Button or Stepper */}
                {quantity === 0 ? (
                  <Pressable
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      addToCart(product);
                    }}
                    style={({ pressed }) => [
                      styles.quickCartBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : 'rgba(0, 0, 0, 0.1)',
                      },
                      pressed && styles.buttonPressed,
                    ]}>
                    <SymbolView
                      tintColor={theme.text}
                      name={{ ios: 'cart.badge.plus', android: 'add_shopping_cart', web: 'add_shopping_cart' }}
                      size={16}
                    />
                  </Pressable>
                ) : (
                  <View
                    style={[
                      styles.stepperContainer,
                      {
                        backgroundColor: isDark
                          ? `${product.colorAccent}18`
                          : `${product.colorAccent}10`,
                        borderColor: `${product.colorAccent}40`,
                      },
                    ]}>
                    <Pressable
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        updateQuantity(product.id, quantity - 1);
                      }}
                      style={styles.stepperBtn}>
                      <ThemedText type="smallBold" style={{ color: product.colorAccent, fontSize: 13 }}>
                        −
                      </ThemedText>
                    </Pressable>
                    <ThemedText
                      style={[styles.stepperQuantity, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      {quantity}
                    </ThemedText>
                    <Pressable
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        updateQuantity(product.id, quantity + 1);
                      }}
                      style={styles.stepperBtn}>
                      <ThemedText type="smallBold" style={{ color: product.colorAccent, fontSize: 13 }}>
                        +
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    width: '100%',
    flex: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    flex: 1,
    justifyContent: 'space-between',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  heroCanvas: {
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '68%',
    flexShrink: 1,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  coverImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: '100%',
    flex: 1,
  },
  coverImage: {
    width: 140,
    height: 205,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  emblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    flex: 1,
    gap: 10,
  },
  emblemNotice: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  iconEmblem: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  contentSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    flex: 1,
    justifyContent: 'space-between',
  },
  contentTop: {
    marginBottom: 8,
  },
  contentBottom: {
    marginTop: 'auto',
  },
  productName: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',
    minHeight: 40,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  bonusBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  compactRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starText: {
    color: '#f59e0b',
    fontSize: 13,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  compactFormatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  compactFormatText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: '900',
  },
  clearActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prominentBuyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    height: 38,
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  prominentBuyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  quickCartBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    height: 32,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQuantity: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  comingSoonBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

