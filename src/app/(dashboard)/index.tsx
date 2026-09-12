import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/use-auth-store';
import { useProductStore } from '@/store/use-product-store';
import { useCartStore } from '@/store/use-cart-store';

export default function ShopHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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

  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const cartTotal = useCartStore((state) => state.getTotal());

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleSearchSubmit = () => {
    setSearchQuery(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  const products = getFilteredProducts();
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header & User Greeting */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTextContainer}>
                <View style={styles.eyebrowBadge}>
                  <ThemedText style={styles.greetingEyebrow}>
                    AURORA COLLECTION
                  </ThemedText>
                </View>
                <ThemedText type="title" style={styles.headerTitle}>
                  Hello, {user?.name || 'Shopper'} 👋
                </ThemedText>
              </View>

              <Pressable
                onPress={() => router.push('/profile')}
                style={({ pressed }) => [
                  styles.avatarPill,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderColor: theme.glassBorder,
                  },
                  pressed && { opacity: 0.8 },
                ]}>
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <GradientView
                  colors={Gradients.primary}
                  direction="to-bottom-right"
                  style={styles.avatarCircle}>
                  <ThemedText style={styles.avatarInitial}>
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </ThemedText>
                </GradientView>
              </Pressable>
            </View>

            {/* Frosted Glass Search Bar */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
              ]}>
              <SymbolView
                tintColor={theme.primary}
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={18}
              />
              <TextInput
                placeholder="Search products, brands, specs..."
                placeholderTextColor={theme.textSecondary}
                value={localSearch}
                onChangeText={setLocalSearch}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
              />
              {localSearch.length > 0 ? (
                <Pressable
                  onPress={handleClearSearch}
                  style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.6 }]}>
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    ✕
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Categories Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Categories
              </ThemedText>
              {selectedCategory && (
                <Pressable
                  onPress={() => setSelectedCategory(null)}
                  style={({ pressed }) => [styles.resetFilterPill, pressed && { opacity: 0.75 }]}>
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 12 }}>
                    Clear Filter
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}>
              <CategoryChip
                title="All Products"
                icon="square.grid.2x2.fill"
                androidIcon="category"
                color={theme.primary}
                isActive={selectedCategory === null}
                onPress={() => setSelectedCategory(null)}
              />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  title={cat.name}
                  icon={cat.icon}
                  androidIcon={cat.androidIcon}
                  color={cat.color}
                  isActive={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Subcategories Quick Jump (if a category is active) */}
          {activeCategoryObj && (
            <View
              style={[
                styles.subcatBanner,
                {
                  backgroundColor: isDark ? '#141824' : '#ffffff',
                  borderColor: isDark
                    ? `${activeCategoryObj.color}35`
                    : `${activeCategoryObj.color}25`,
                  shadowColor: activeCategoryObj.color,
                },
              ]}>
              <View style={styles.subcatHeader}>
                <View style={styles.subcatTitleRow}>
                  <View
                    style={[
                      styles.subcatDot,
                      { backgroundColor: activeCategoryObj.color },
                    ]}
                  />
                  <ThemedText
                    type="smallBold"
                    style={{ color: activeCategoryObj.color, letterSpacing: 0.6 }}>
                    {activeCategoryObj.name.toUpperCase()}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/subcategory',
                      params: { categoryId: activeCategoryObj.id },
                    })
                  }>
                  <ThemedText
                    type="smallBold"
                    style={{ color: activeCategoryObj.color, fontSize: 13 }}>
                    Explore All →
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.subcatChipsGrid}>
                {activeCategoryObj.subcategories.map((sub) => (
                  <Pressable
                    key={sub.id}
                    onPress={() =>
                      router.push({
                        pathname: '/subcategory',
                        params: { categoryId: activeCategoryObj.id, subcategoryId: sub.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.subcatPill,
                      {
                        backgroundColor: isDark
                          ? `${activeCategoryObj.color}1c`
                          : `${activeCategoryObj.color}10`,
                        borderColor: `${activeCategoryObj.color}30`,
                      },
                      pressed && { opacity: 0.75 },
                    ]}>
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                    />
                    <ThemedText
                      type="smallBold"
                      style={{ color: activeCategoryObj.color, fontSize: 12 }}>
                      {sub.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Featured Aurora Promo Card (when on all) */}
          {!selectedCategory && !searchQuery && (
            <Pressable
              onPress={() => {
                if (categories.length > 0) {
                  setSelectedCategory(categories[0].id);
                }
              }}
              style={({ pressed }) => [styles.promoWrapper, pressed && { opacity: 0.95 }]}>
              <GradientView
                colors={['#6366f1', '#8b5cf6', '#06b6d4']}
                direction="to-bottom-right"
                style={styles.promoCard}>
                {/* Decorative background glow circles */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />

                <View style={styles.promoContent}>
                  <View style={styles.promoTag}>
                    <ThemedText style={styles.promoTagText}>✨ LIMITED OFFER</ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={styles.promoTitle}>
                    Up to 50% Off Today
                  </ThemedText>
                  <ThemedText type="small" style={styles.promoSubtitle}>
                    Use coupon code <ThemedText type="smallBold" style={styles.codeText}>AURORA50</ThemedText> at checkout
                  </ThemedText>

                  <View style={styles.promoCtaPill}>
                    <ThemedText style={styles.promoCtaText}>Shop Deals →</ThemedText>
                  </View>
                </View>

                <View style={styles.promoBadgeCircle}>
                  <ThemedText style={styles.promoPercentText}>50%</ThemedText>
                  <ThemedText style={styles.promoOffText}>OFF</ThemedText>
                </View>
              </GradientView>
            </Pressable>
          )}

          {/* Products Grid Section */}
          <View style={styles.productsSection}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {selectedCategory
                  ? `${activeCategoryObj?.name || 'Category'} Items`
                  : searchQuery
                  ? `Search: "${searchQuery}"`
                  : 'Trending Products'}
              </ThemedText>
              <View style={styles.itemsCountBadge}>
                <ThemedText type="smallBold" style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {products.length} {products.length === 1 ? 'item' : 'items'}
                </ThemedText>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                  Fetching curated items...
                </ThemedText>
              </View>
            ) : products.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <SymbolView
                  tintColor={theme.textSecondary}
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  size={42}
                />
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  No products found
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                  Try clearing your search query or choosing another category.
                </ThemedText>
                <Pressable
                  onPress={() => {
                    handleClearSearch();
                    setSelectedCategory(null);
                  }}
                  style={({ pressed }) => [styles.clearFilterBtn, pressed && { opacity: 0.85 }]}>
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={styles.clearFilterBtnInner}>
                    <GradientView
                      colors={Gradients.primary}
                      direction="to-right"
                      style={StyleSheet.absoluteFill}
                    />
                    <ThemedText style={styles.clearFilterText}>View All Products</ThemedText>
                  </GlassView>
                </Pressable>
              </GlassCard>
            ) : (
              <View style={styles.productGrid}>
                {products.map((product) => (
                  <View key={product.id} style={styles.productGridItem}>
                    <ProductCard
                      product={product}
                      onPress={() => {
                        router.push({
                          pathname: '/product',
                          params: { id: product.id },
                        });
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Frosted Glass Cart Dock (when items are in cart) */}
        {totalCartItems > 0 && (
          <Pressable
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [
              styles.floatingCartDock,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}>
            <GlassCard variant="glow" style={styles.floatingCartInner}>
              <View style={styles.floatingCartLeft}>
                <GradientView
                  colors={Gradients.sunset}
                  direction="to-bottom-right"
                  style={styles.cartBadgeDot}>
                  <ThemedText style={styles.cartBadgeDotText}>{totalCartItems}</ThemedText>
                </GradientView>
                <View>
                  <ThemedText type="smallBold" style={styles.floatingCartTitle}>
                    {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} in Cart
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Tap to review & checkout
                  </ThemedText>
                </View>
              </View>

              <View style={styles.floatingCartRight}>
                <ThemedText style={styles.floatingCartPrice}>
                  ${cartTotal.toFixed(2)}
                </ThemedText>
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={styles.cartCtaPill}>
                  <GradientView
                    colors={Gradients.primary}
                    direction="to-right"
                    style={StyleSheet.absoluteFill}
                  />
                  <ThemedText style={styles.cartCtaText}>View Cart →</ThemedText>
                </GlassView>
              </View>
            </GlassCard>
          </Pressable>
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
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: 170, // Leaves space for floating cart dock & tab bar
  },
  header: {
    marginBottom: Spacing.four,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  headerTextContainer: {
    flex: 1,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    marginBottom: 4,
  },
  greetingEyebrow: {
    color: '#6366f1',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  avatarPill: {
    padding: 3,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as any,
    }),
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 50,
    gap: Spacing.two,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as any,
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 6,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two + 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  resetFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  categoryScroll: {
    paddingVertical: 4,
    paddingRight: Spacing.three,
  },
  subcatBanner: {
    padding: Spacing.three + 2,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: Spacing.four,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subcatChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subcatPill: {
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  promoWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: Spacing.four,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  promoCard: {
    padding: Spacing.four,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: -60,
    right: -20,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    bottom: -40,
    left: 40,
  },
  promoContent: {
    flex: 1,
    zIndex: 1,
  },
  promoTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  promoTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginBottom: Spacing.two,
  },
  codeText: {
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  promoCtaPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  promoCtaText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 12,
  },
  promoBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.two,
    zIndex: 1,
  },
  promoPercentText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  promoOffText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  productsSection: {
    marginBottom: Spacing.four,
  },
  itemsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  loaderContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  emptyCard: {
    padding: Spacing.five,
    alignItems: 'center',
    borderRadius: 24,
    marginVertical: Spacing.two,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
    maxWidth: 260,
  },
  clearFilterBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  clearFilterBtnInner: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as any,
    }),
  },
  clearFilterText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  productGridItem: {
    width: Platform.select({
      web: 'calc(50% - 8px)',
      default: '47.5%',
    }) as any,
    minWidth: 155,
  },
  floatingCartDock: {
    position: 'absolute',
    bottom: Platform.select({ ios: 104, android: 92, default: 86 }),
    left: 16,
    right: 16,
    zIndex: 99,
  },
  floatingCartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: 12,
    borderRadius: 22,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cartBadgeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeDotText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  floatingCartTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  floatingCartPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  cartCtaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  cartCtaText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
});
