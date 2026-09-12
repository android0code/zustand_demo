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
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard } from '@/components/ui/product-card';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassView } from 'expo-glass-effect';
import { GradientView } from '@/components/ui/gradient-view';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProductStore, type ProductSortOption } from '@/store/use-product-store';
import { useCartStore } from '@/store/use-cart-store';

export default function SubcategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; subcategoryId?: string }>();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const categories = useProductStore((state) => state.categories);
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const isLoading = useProductStore((state) => state.isLoading);

  const totalCartItems = useCartStore((state) => state.getTotalItems());

  // Category and subcategory state
  const initialCategory = params.categoryId || (categories[0]?.id ?? 'electronics');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCategory);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(
    params.subcategoryId || null
  );
  const [sortBy, setSortBy] = useState<ProductSortOption>('popular');

  const currentCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  useEffect(() => {
    if (params.categoryId) {
      setActiveCategoryId(params.categoryId);
    }
    if (params.subcategoryId) {
      setActiveSubcategoryId(params.subcategoryId);
    }
  }, [params.categoryId, params.subcategoryId]);

  useEffect(() => {
    if (activeCategoryId) {
      fetchProducts({
        categoryId: activeCategoryId,
        subcategoryId: activeSubcategoryId ?? undefined,
      });
    }
  }, [activeCategoryId, activeSubcategoryId]);

  // Sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount;
  });

  const sortOptions: { id: ProductSortOption; label: string }[] = [
    { id: 'popular', label: 'Popular' },
    { id: 'price-asc', label: 'Price: Low' },
    { id: 'price-desc', label: 'Price: High' },
    { id: 'rating', label: 'Top Rated' },
  ];

  const categoryColor = currentCategory?.color || theme.primary;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              pressed && { opacity: 0.7 },
            ]}>
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: theme.glassBorder,
                },
              ]}>
              <SymbolView
                tintColor={theme.text}
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={18}
              />
            </GlassView>
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.headerTitle}>
              {currentCategory?.name || 'Category'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {activeSubcategoryId
                ? currentCategory?.subcategories.find((s) => s.id === activeSubcategoryId)?.name
                : 'All Subcategories'}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [
              { position: 'relative' },
              pressed && { opacity: 0.7 },
            ]}>
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: theme.glassBorder,
                },
              ]}>
              <SymbolView
                tintColor={theme.text}
                name={{ ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' }}
                size={18}
              />
            </GlassView>
            {totalCartItems > 0 && (
              <View style={styles.topCartBadge}>
                <ThemedText style={styles.topCartBadgeText}>{totalCartItems}</ThemedText>
              </View>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Aurora Category Banner */}
          {currentCategory && (
            <View style={styles.bannerWrapper}>
              <GradientView
                colors={[
                  `${categoryColor}${isDark ? '35' : '22'}`,
                  `${categoryColor}${isDark ? '12' : '08'}`,
                ]}
                direction="to-bottom-right"
                style={[
                  styles.categoryBanner,
                  { borderColor: `${categoryColor}40` },
                ]}>
                <View
                  style={[
                    styles.categoryIconCircle,
                    {
                      backgroundColor: `${categoryColor}${isDark ? '40' : '25'}`,
                      borderColor: `${categoryColor}60`,
                    },
                  ]}>
                  <SymbolView
                    tintColor={categoryColor}
                    name={{
                      ios: currentCategory.icon,
                      android: currentCategory.androidIcon,
                      web: currentCategory.androidIcon,
                    }}
                    size={28}
                  />
                </View>
                <View style={styles.bannerText}>
                  <ThemedText type="subtitle" style={styles.bannerTitle}>
                    {currentCategory.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {currentCategory.description}
                  </ThemedText>
                </View>
              </GradientView>
            </View>
          )}

          {/* Subcategories Horizontal Filter Bar */}
          <View style={styles.subcatSection}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.subcatLabel}>
              FILTER BY SUBCATEGORY
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subcatScroll}>
              <Pressable
                onPress={() => setActiveSubcategoryId(null)}
                style={({ pressed }) => [
                  styles.filterPill,
                  {
                    backgroundColor:
                      activeSubcategoryId === null
                        ? categoryColor
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    borderColor:
                      activeSubcategoryId === null
                        ? categoryColor
                        : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.08)',
                  },
                  pressed && { opacity: 0.8 },
                ]}>
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <ThemedText
                  type="smallBold"
                  style={{
                    color: activeSubcategoryId === null ? '#ffffff' : theme.text,
                    fontSize: 13,
                  }}>
                  All
                </ThemedText>
              </Pressable>

              {currentCategory?.subcategories.map((sub) => {
                const isActive = activeSubcategoryId === sub.id;
                return (
                  <Pressable
                    key={sub.id}
                    onPress={() => setActiveSubcategoryId(sub.id)}
                    style={({ pressed }) => [
                      styles.filterPill,
                      {
                        backgroundColor: isActive
                          ? categoryColor
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderColor: isActive
                          ? categoryColor
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                      pressed && { opacity: 0.8 },
                    ]}>
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                    />
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: isActive ? '#ffffff' : theme.text,
                        fontSize: 13,
                      }}>
                      {sub.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Sort Option Bar */}
          <View style={styles.sortSection}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.subcatLabel}>
              SORT BY
            </ThemedText>
            <View style={styles.sortOptionsRow}>
              {sortOptions.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setSortBy(opt.id)}
                    style={({ pressed }) => [
                      styles.sortPill,
                      {
                        backgroundColor: isSelected
                          ? `${categoryColor}${isDark ? '30' : '18'}`
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isSelected
                          ? categoryColor
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                      pressed && { opacity: 0.75 },
                    ]}>
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                    />
                    <ThemedText
                      type="small"
                      style={{
                        color: isSelected ? categoryColor : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      }}>
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Product Grid */}
          <View style={styles.gridSection}>
            <View style={styles.resultsHeader}>
              <ThemedText type="smallBold">
                Showing {sortedProducts.length} results
              </ThemedText>
            </View>

            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={categoryColor} />
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                  Loading category items...
                </ThemedText>
              </View>
            ) : sortedProducts.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <SymbolView
                  tintColor={theme.textSecondary}
                  name={{ ios: 'tray.fill', android: 'inbox', web: 'inbox' }}
                  size={40}
                />
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  No items in this subcategory
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  Please select another filter or choose "All" above.
                </ThemedText>
              </GlassCard>
            ) : (
              <View style={styles.productGrid}>
                {sortedProducts.map((product) => (
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as any,
    }),
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  topCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#f43f5e',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 120, // Tab bar safe margin
  },
  bannerWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 22,
    borderWidth: 1,
    gap: Spacing.three,
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  subcatSection: {
    marginBottom: Spacing.four,
  },
  subcatLabel: {
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: Spacing.two,
  },
  subcatScroll: {
    paddingVertical: 2,
    gap: Spacing.two,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as any,
    }),
  },
  sortSection: {
    marginBottom: Spacing.four,
  },
  sortOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sortPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 10,
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
  gridSection: {
    marginBottom: Spacing.four,
  },
  resultsHeader: {
    marginBottom: Spacing.two + 2,
  },
  loaderContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  emptyCard: {
    padding: Spacing.five,
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: Spacing.two,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.two,
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
});
