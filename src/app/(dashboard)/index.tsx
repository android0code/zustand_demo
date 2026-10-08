import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CategoryChip } from '@/components/ui/category-chip';
import { ProductCard } from '@/components/ui/product-card';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientView } from '@/components/ui/gradient-view';
import { RazorpayCheckoutModal } from '@/components/ui/razorpay-checkout-modal';
import { WebFooter } from '@/components/ui/web-footer';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/use-auth-store';
import { useProductStore } from '@/store/use-product-store';
import type { Product } from '@/services/api';
import { RAZORPAY_CONFIG } from '@/config/razorpay';

export default function ShopHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const categories = useProductStore((state) => state.categories);
  const selectedCategory = useProductStore((state) => state.selectedCategory);
  const searchQuery = useProductStore((state) => state.searchQuery);
  const isLoading = useProductStore((state) => state.isLoading);
  const fetchCategories = useProductStore((state) => state.fetchCategories);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const setSelectedCategory = useProductStore((state) => state.setSelectedCategory);
  const setSearchQuery = useProductStore((state) => state.setSearchQuery);
  const getFilteredProducts = useProductStore((state) => state.getFilteredProducts);

  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const products = getFilteredProducts();
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  // Responsive column calculation: 3 cards in line on web/desktop, 2 on tablet, 1 on mobile
  const numColumns = width >= 960 ? 3 : width >= 640 ? 2 : 1;
  const gridGap = width >= 960 ? 18 : width >= 640 ? 16 : 12;
  const itemWidth = Platform.select({
    web:
      numColumns === 3
        ? `calc((100% - ${gridGap * 2}px) / 3)`
        : numColumns === 2
        ? `calc((100% - ${gridGap}px) / 2)`
        : '100%',
    default: numColumns === 3 ? '31.5%' : numColumns === 2 ? '48%' : '100%',
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Hero Banner with Gradient Background */}
          <View style={styles.heroSection}>
            <GradientView
              colors={isDark ? ['#1a1040', '#0a0d14'] : ['#eef2ff', '#f8fafc']}
              direction="to-bottom"
              style={styles.heroBannerBg}>
              {/* Decorative accent line */}
              <View style={[styles.heroAccentLine, { backgroundColor: theme.primary }]} />
              
              <View style={styles.heroBadgeRow}>
                <View
                  style={[
                    styles.heroBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'rgba(99, 102, 241, 0.12)',
                      borderColor: isDark
                        ? 'rgba(99, 102, 241, 0.4)'
                        : 'rgba(99, 102, 241, 0.25)',
                    },
                  ]}>
                  <SymbolView
                    name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
                    tintColor="#6366f1"
                    size={12}
                  />
                  <ThemedText style={styles.heroBadgeText}>
                    DIGITAL PDF E-BOOKS
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={[styles.heroHeadline, { color: theme.text }]}>
                Premium Technical{`\n`}E-Books & Guides
              </ThemedText>

              <ThemedText style={[styles.heroSubheadline, { color: theme.textSecondary }]}>
                Instant digital PDF downloads with verified license keys.{`\n`}Secure checkout powered by Razorpay.
              </ThemedText>

              {/* Value Props as Glass Cards */}
              <View style={styles.valuePropsRow}>
                {[
                  {
                    icon: { ios: 'arrow.down.circle.fill' as const, android: 'download' as const },
                    label: 'Instant Download',
                    color: '#10b981',
                  },
                  {
                    icon: { ios: 'lock.fill' as const, android: 'lock' as const },
                    label: '256-Bit SSL',
                    color: '#0284c7',
                  },
                  {
                    icon: { ios: 'key.fill' as const, android: 'vpn_key' as const },
                    label: 'License Key',
                    color: '#f59e0b',
                  },
                ].map((prop, i) => (
                  <View
                    key={i}
                    style={[
                      styles.valuePropCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(255, 255, 255, 0.8)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}>
                    <View style={[styles.valuePropIconCircle, { backgroundColor: `${prop.color}18` }]}>
                      <SymbolView
                        name={{ ios: prop.icon.ios, android: prop.icon.android, web: prop.icon.android }}
                        tintColor={prop.color}
                        size={16}
                      />
                    </View>
                    <ThemedText style={[styles.valuePropText, { color: theme.textSecondary }]}>
                      {prop.label}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </GradientView>
          </View>

          {/* Categories Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Categories
              </ThemedText>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat) => {
                const isActive =
                  (cat.id === 'ebooks' && (selectedCategory === null || selectedCategory === 'ebooks')) ||
                  cat.id === selectedCategory;
                return (
                  <CategoryChip
                    key={cat.id}
                    title={cat.name}
                    icon={cat.icon}
                    androidIcon={cat.androidIcon}
                    color={cat.color}
                    badge={cat.status === 'coming_soon' ? 'SOON' : undefined}
                    isActive={isActive}
                    onPress={() => setSelectedCategory(cat.id)}
                  />
                );
              })}
            </ScrollView>
          </View>

          {/* Promo Card: Buy 2 Get Next Free Special */}
          {(!selectedCategory || selectedCategory === 'ebooks') && (
            <Pressable
              onPress={() => setSelectedCategory('ebooks')}
              style={({ pressed }) => [styles.promoWrapper, pressed && { opacity: 0.95 }]}>
              <GradientView
                colors={['#6366f1', '#8b5cf6', '#06b6d4']}
                direction="to-bottom-right"
                style={styles.promoCard}>
                <View style={styles.promoContent}>
                  <View style={styles.promoTag}>
                    <ThemedText style={styles.promoTagText}>🎁 BUNDLE SPECIAL</ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={styles.promoTitle}>
                    Buy 2, Get Next Item Free
                  </ThemedText>
                  <ThemedText type="small" style={styles.promoSubtitle}>
                    No code needed at checkout! Buy any 2 items and receive a 100% FREE voucher code at your email for your next purchase.
                  </ThemedText>
                </View>

                <View style={styles.promoBadgeCircle}>
                  <ThemedText style={styles.promoBadgeTop}>BUY 2</ThemedText>
                  <ThemedText style={styles.promoBadgeMid}>NEXT</ThemedText>
                  <ThemedText style={styles.promoBadgeSub}>100% FREE</ThemedText>
                </View>
              </GradientView>
            </Pressable>
          )}

          {/* Products Grid Section */}
          <View style={styles.productsSection}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {activeCategoryObj?.status === 'coming_soon'
                  ? `${activeCategoryObj.name} (Coming Soon)`
                  : 'Curated PDF E-Books'}
              </ThemedText>
              <View style={styles.itemsCountBadge}>
                <ThemedText type="smallBold" style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {activeCategoryObj?.status === 'coming_soon'
                    ? 'Coming Soon'
                    : `${products.length} ${products.length === 1 ? 'e-book' : 'e-books'}`}
                </ThemedText>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                  Loading digital catalog...
                </ThemedText>
              </View>
            ) : activeCategoryObj?.status === 'coming_soon' ? (
              <GlassCard style={styles.comingSoonCard}>
                <View
                  style={[
                    styles.comingSoonEmblem,
                    {
                      backgroundColor: `${activeCategoryObj.color}1c`,
                      borderColor: `${activeCategoryObj.color}40`,
                    },
                  ]}>
                  <SymbolView
                    name={{
                      ios: activeCategoryObj.icon,
                      android: activeCategoryObj.androidIcon,
                      web: activeCategoryObj.androidIcon,
                    }}
                    tintColor={activeCategoryObj.color}
                    size={38}
                  />
                </View>

                <View
                  style={[
                    styles.comingSoonBadge,
                    {
                      backgroundColor: `${activeCategoryObj.color}15`,
                      borderColor: `${activeCategoryObj.color}35`,
                    },
                  ]}>
                  <ThemedText
                    style={[styles.comingSoonBadgeText, { color: activeCategoryObj.color }]}>
                    🚀 LAUNCHING SOON
                  </ThemedText>
                </View>

                <ThemedText type="subtitle" style={styles.comingSoonTitle}>
                  {activeCategoryObj.name} in Production
                </ThemedText>

                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.comingSoonSubtitle}>
                  We are currently putting the finishing touches on our {activeCategoryObj.name.toLowerCase()}.
                  Only our curated digital PDF E-Books & Guides are available for this launch.
                </ThemedText>

                <Pressable
                  onPress={() => setSelectedCategory('ebooks')}
                  style={({ pressed }) => [
                    styles.browseEbooksBtn,
                    pressed && { opacity: 0.85 },
                  ]}>
                  <ThemedText style={styles.browseEbooksText}>
                    Browse Live PDF E-Books →
                  </ThemedText>
                </Pressable>
              </GlassCard>
            ) : products.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <SymbolView
                  tintColor={theme.textSecondary}
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  size={42}
                />
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  No e-books found
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                  Try clearing your search query or switching categories.
                </ThemedText>
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('ebooks');
                  }}
                  style={({ pressed }) => [styles.clearFilterBtn, pressed && { opacity: 0.85 }]}>
                  <View style={styles.clearFilterBtnInner}>
                    <ThemedText style={styles.clearFilterText}>View All E-Books</ThemedText>
                  </View>
                </Pressable>
              </GlassCard>
            ) : (
              <View style={[styles.productGrid, { gap: gridGap }]}>
                {products.map((product) => (
                  <View
                    key={product.id}
                    style={[styles.productGridItem, { width: itemWidth as any }]}>
                    <ProductCard
                      product={product}
                      onBuyNow={(prod) => {
                        if (prod.status === 'coming_soon' || !prod.inStock) return;
                        setCheckoutProduct(prod);
                      }}
                      onPress={() => {
                        router.push({
                          pathname: '/(dashboard)/product-details',
                          params: { id: product.id },
                        });
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Responsive Website Footer */}
          <WebFooter />
        </ScrollView>

      </SafeAreaView>

      {/* Razorpay Checkout Modal for 1-Click Instant Buy */}
      <RazorpayCheckoutModal
        visible={!!checkoutProduct}
        onClose={() => setCheckoutProduct(null)}
        items={checkoutProduct ? [{ product: checkoutProduct, quantity: 1 }] : []}
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
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: 80,
  },
  heroSection: {
    marginBottom: Spacing.five,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroBannerBg: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    borderRadius: 24,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      } as any,
    }),
  },
  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroBadgeText: {
    color: '#6366f1',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.8,
  },
  heroSubheadline: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 520,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 52,
    gap: Spacing.two,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    outlineStyle: 'none',
  } as any,
  clearBtn: {
    padding: 6,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuePropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  valuePropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      } as any,
    }),
  },
  valuePropIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuePropText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  resetFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  categoryScroll: {
    gap: Spacing.two,
    paddingRight: Spacing.four,
  },
  subcatBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  subcatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  subcatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subcatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subcatChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subcatPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  promoWrapper: {
    marginBottom: Spacing.five,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s ease',
      } as any,
    }),
  },
  promoCard: {
    borderRadius: 24,
    padding: Spacing.four + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
      } as any,
    }),
  },
  promoContent: {
    flex: 1,
  },
  promoTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  promoTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  promoTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  promoSubtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    lineHeight: 19,
  },
  codeText: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.8,
  },
  promoBadgeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    marginLeft: 16,
    paddingVertical: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      } as any,
    }),
  },
  promoBadgeTop: {
    color: '#6366f1',
    fontWeight: '800',
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  promoBadgeMid: {
    color: '#4338ca',
    fontWeight: '900',
    fontSize: 13,
    lineHeight: 15,
    textAlign: 'center',
  },
  promoBadgeSub: {
    color: '#d97706',
    fontWeight: '900',
    fontSize: 8.5,
    lineHeight: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  productsSection: {
    marginBottom: Spacing.four,
  },
  itemsCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: Spacing.six,
    alignItems: 'center',
    borderRadius: 20,
    gap: 8,
  },
  comingSoonCard: {
    padding: Spacing.six,
    alignItems: 'center',
    borderRadius: 22,
    gap: 12,
    marginVertical: Spacing.two,
  },
  comingSoonEmblem: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 20,
    fontSize: 14,
  },
  browseEbooksBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  browseEbooksText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 320,
  },
  clearFilterBtn: {
    marginTop: 10,
  },
  clearFilterBtnInner: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearFilterText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productGridItem: {
    padding: 0,
  },
});
