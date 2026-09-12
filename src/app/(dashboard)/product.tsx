import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassView } from 'expo-glass-effect';
import { GradientView } from '@/components/ui/gradient-view';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCartStore } from '@/store/use-cart-store';
import { useProductStore } from '@/store/use-product-store';
import { api, type Product } from '@/services/api';
import ecommerceData from '@/data/ecommerce-data.json';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const quantityInCart = useCartStore((state) => (product ? state.getItemQuantity(product.id) : 0));

  const categories = useProductStore((state) => state.categories);

  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      setIsLoading(true);
      const targetId = params.id || 'prod-1';
      try {
        const fetched = await api.getProductById(targetId);
        if (isMounted) {
          if (fetched) {
            setProduct(fetched);
          } else {
            const fallback = (ecommerceData.products as Product[]).find((p) => p.id === targetId);
            setProduct(fallback || (ecommerceData.products[0] as Product));
          }
        }
      } catch {
        const fallback = (ecommerceData.products as Product[]).find((p) => p.id === targetId);
        if (isMounted) {
          setProduct(fallback || (ecommerceData.products[0] as Product));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleToggleWishlist = () => {
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    showToast(nextState ? 'Saved to your Wishlist' : 'Removed from Wishlist');
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: product.name,
            text: product.description,
            url: typeof window !== 'undefined' ? window.location.href : '',
          });
        } else {
          showToast('Product link copied');
        }
      } else {
        await Share.share({
          message: `Check out ${product.name} on HappyExpo! Only $${product.price.toFixed(2)}`,
          title: product.name,
        });
      }
    } catch {
      // User dismissed share dialog
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (quantityInCart === 0) {
      addToCart(product);
      if (selectedQuantity > 1) {
        updateQuantity(product.id, selectedQuantity);
      }
    } else {
      updateQuantity(product.id, quantityInCart + selectedQuantity);
    }
    showToast(`Added ${selectedQuantity} ${selectedQuantity === 1 ? 'item' : 'items'} to cart!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (quantityInCart === 0) {
      addToCart(product);
      if (selectedQuantity > 1) {
        updateQuantity(product.id, selectedQuantity);
      }
    }
    router.push('/cart');
  };

  if (isLoading || !product) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.two }} themeColor="textSecondary">
          Loading product details...
        </ThemedText>
      </ThemedView>
    );
  }

  const categoryObj = categories.find((c) => c.id === product.categoryId);
  const categoryName = categoryObj?.name || 'Store';
  const subcategoryObj = categoryObj?.subcategories.find((s) => s.id === product.subcategoryId);
  const subcategoryName = subcategoryObj?.name || 'General';

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

  const catSymbol = getCategorySymbol(product.categoryId);

  const COLOR_OPTIONS = [
    { name: 'Aurora Prime', hex: product.colorAccent },
    { name: 'Obsidian Black', hex: '#1e293b' },
    { name: 'Titanium Slate', hex: '#64748b' },
    { name: 'Pure White', hex: '#e2e8f0' },
  ];

  const savingsAmount = product.originalPrice ? product.originalPrice - product.price : 0;
  const savingsPercent = product.originalPrice
    ? Math.round((savingsAmount / product.originalPrice) * 100)
    : 0;

  const installmentAmount = (product.price / 4).toFixed(2);

  const relatedProducts = (ecommerceData.products as Product[])
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Top Floating App Bar */}
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
                styles.navIconButton,
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

          {/* Breadcrumb Tag */}
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[
              styles.breadcrumbBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <ThemedText style={styles.breadcrumbText} numberOfLines={1}>
              {categoryName} • {subcategoryName}
            </ThemedText>
          </GlassView>

          {/* Right Action Icons: Wishlist, Share, Cart */}
          <View style={styles.topRightActions}>
            <Pressable
              onPress={handleToggleWishlist}
              style={({ pressed }) => [
                pressed && { opacity: 0.7 },
              ]}>
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[
                  styles.navIconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isWishlisted
                      ? 'rgba(239, 68, 68, 0.4)'
                      : theme.glassBorder,
                  },
                ]}>
                <SymbolView
                  tintColor={isWishlisted ? '#ef4444' : theme.text}
                  name={{
                    ios: isWishlisted ? 'heart.fill' : 'heart',
                    android: isWishlisted ? 'favorite' : 'favorite_border',
                    web: isWishlisted ? 'favorite' : 'favorite_border',
                  }}
                  size={18}
                />
              </GlassView>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                pressed && { opacity: 0.7 },
              ]}>
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[
                  styles.navIconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: theme.glassBorder,
                  },
                ]}>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                  size={17}
                />
              </GlassView>
            </Pressable>

            <Pressable
              onPress={() => router.push('/cart')}
              style={({ pressed }) => [
                pressed && { opacity: 0.7 },
              ]}>
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[
                  styles.navIconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: theme.glassBorder,
                  },
                ]}>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' }}
                  size={18}
                />
                {totalCartItems > 0 && (
                  <View style={styles.cartBadge}>
                    <ThemedText style={styles.cartBadgeText}>
                      {totalCartItems > 99 ? '99+' : totalCartItems}
                    </ThemedText>
                  </View>
                )}
              </GlassView>
            </Pressable>
          </View>
        </View>

        {/* Feedback Toast Notification */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <View
              style={[
                styles.toastCard,
                {
                  backgroundColor: isDark ? '#1e293b' : '#0f172a',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                },
              ]}>
              <SymbolView
                tintColor="#10b981"
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                size={16}
              />
              <ThemedText style={styles.toastText}>{toastMessage}</ThemedText>
            </View>
          </View>
        )}

        {/* Main Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Hero Visual Canvas */}
          <View
            style={[
              styles.heroCanvas,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? `${product.colorAccent}35` : `${product.colorAccent}22`,
                shadowColor: product.colorAccent,
              },
            ]}>
            {/* Ambient Background Aura Glow */}
            <View
              style={[
                styles.heroAura,
                {
                  backgroundColor: isDark
                    ? `${product.colorAccent}15`
                    : `${product.colorAccent}0c`,
                },
              ]}
            />

            {/* Top Row: Brand Tag & Badge */}
            <View style={styles.heroHeaderRow}>
              <View
                style={[
                  styles.brandChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}>
                <ThemedText style={[styles.brandChipText, { color: product.colorAccent }]}>
                  {product.brand.toUpperCase()}
                </ThemedText>
              </View>

              {product.badge && (
                <View
                  style={[
                    styles.heroBadgePill,
                    {
                      backgroundColor: product.colorAccent,
                      shadowColor: product.colorAccent,
                    },
                  ]}>
                  <ThemedText style={styles.heroBadgeText}>{product.badge}</ThemedText>
                </View>
              )}
            </View>

            {/* Center Glorious Product Emblem Showcase */}
            <View style={styles.emblemContainer}>
              <View
                style={[
                  styles.emblemOuterGlow,
                  {
                    backgroundColor: `${product.colorAccent}15`,
                    borderColor: `${product.colorAccent}30`,
                  },
                ]}>
                <View
                  style={[
                    styles.emblemInnerCircle,
                    {
                      backgroundColor: isDark ? '#1a2030' : '#ffffff',
                      borderColor: `${product.colorAccent}50`,
                      shadowColor: product.colorAccent,
                    },
                  ]}>
                  <SymbolView
                    tintColor={product.colorAccent}
                    name={{ ios: catSymbol.ios, android: catSymbol.android, web: catSymbol.android }}
                    size={64}
                  />
                </View>
              </View>
            </View>

            {/* Color Swatch Options */}
            <View style={styles.swatchSection}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.swatchLabel}>
                Color Finish: <ThemedText type="smallBold">{COLOR_OPTIONS[selectedColorIndex].name}</ThemedText>
              </ThemedText>
              <View style={styles.swatchRow}>
                {COLOR_OPTIONS.map((c, index) => {
                  const isSelected = selectedColorIndex === index;
                  return (
                    <Pressable
                      key={index}
                      onPress={() => setSelectedColorIndex(index)}
                      style={[
                        styles.swatchRing,
                        {
                          borderColor: isSelected
                            ? product.colorAccent
                            : 'transparent',
                        },
                      ]}>
                      <View style={[styles.swatchDot, { backgroundColor: c.hex }]} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Title, Brand & Availability Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.productTitle}>
                {product.name}
              </ThemedText>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.skuTag}>
                <ThemedText type="small" themeColor="textSecondary">
                  SKU: #{product.id.toUpperCase()}
                </ThemedText>
              </View>

              {product.inStock ? (
                <View style={styles.stockTag}>
                  <View style={styles.stockLiveDot} />
                  <ThemedText style={styles.stockLiveText}>
                    In Stock • Ready to Ship
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.stockTag, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <ThemedText style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                    Out of Stock
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Ratings Summary Pill */}
            <View style={styles.ratingRow}>
              <View
                style={[
                  styles.ratingBubble,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(245, 158, 11, 0.12)',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  },
                ]}>
                <ThemedText style={styles.ratingStar}>★</ThemedText>
                <ThemedText type="smallBold" style={styles.ratingScore}>
                  {product.rating}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.ratingCount}>
                Based on {product.reviewsCount} verified buyer reviews
              </ThemedText>
            </View>

            {/* Divider */}
            <View
              style={[
                styles.cardDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
            />

            {/* Pricing Section */}
            <View style={styles.pricingSection}>
              <View style={styles.priceRow}>
                <ThemedText type="title" style={styles.mainPrice}>
                  ${product.price.toFixed(2)}
                </ThemedText>
                {product.originalPrice && (
                  <ThemedText
                    type="default"
                    themeColor="textSecondary"
                    style={styles.originalPriceStrikethrough}>
                    ${product.originalPrice.toFixed(2)}
                  </ThemedText>
                )}
                {savingsAmount > 0 && (
                  <View style={styles.savingsPill}>
                    <ThemedText style={styles.savingsPillText}>
                      Save ${savingsAmount.toFixed(2)} ({savingsPercent}% OFF)
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Installment Plan Notice */}
              <View
                style={[
                  styles.installmentCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}>
                <SymbolView
                  tintColor={theme.primary}
                  name={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' }}
                  size={16}
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.installmentText}>
                  Or 4 interest-free installments of <ThemedText type="smallBold">${installmentAmount}</ThemedText> with 0% APR.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Key Specifications & Features Tags */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <View style={styles.sectionHeaderRow}>
              <SymbolView
                tintColor={theme.primary}
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={18}
              />
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                KEY SPECIFICATIONS & FEATURES
              </ThemedText>
            </View>

            {/* Spec Badges Grid */}
            <View style={styles.specChipsWrap}>
              {product.specs.map((spec, sIdx) => (
                <View
                  key={sIdx}
                  style={[
                    styles.specFeaturePill,
                    {
                      backgroundColor: isDark
                        ? `${product.colorAccent}18`
                        : `${product.colorAccent}0e`,
                      borderColor: isDark
                        ? `${product.colorAccent}35`
                        : `${product.colorAccent}25`,
                    },
                  ]}>
                  <SymbolView
                    tintColor={product.colorAccent}
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={12}
                  />
                  <ThemedText
                    type="smallBold"
                    style={[styles.specFeatureText, { color: isDark ? '#ffffff' : product.colorAccent }]}>
                    {spec}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Technical Attribute Key-Value Table */}
            <View
              style={[
                styles.specTable,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(0, 0, 0, 0.015)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}>
              {[
                { label: 'Brand & Manufacturer', value: product.brand },
                { label: 'Category Department', value: categoryName },
                { label: 'Product Subcategory', value: subcategoryName },
                { label: 'Model Item Code', value: product.id.toUpperCase() },
                { label: 'Warranty Protection', value: '1-Year Official Brand Warranty' },
                { label: 'Shipping Guarantee', value: 'Free Express (2-3 Business Days)' },
                { label: 'Return Policy', value: '30-Day Money-Back Guarantee' },
              ].map((row, rIdx, arr) => (
                <View
                  key={rIdx}
                  style={[
                    styles.specTableRow,
                    rIdx < arr.length - 1 && [
                      styles.specTableRowBorder,
                      {
                        borderBottomColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    ],
                  ]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.specTableKey}>
                    {row.label}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.specTableVal}>
                    {row.value}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Description & Overview */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <View style={styles.sectionHeaderRow}>
              <SymbolView
                tintColor={theme.primary}
                name={{ ios: 'doc.plaintext.fill', android: 'description', web: 'description' }}
                size={18}
              />
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                PRODUCT OVERVIEW
              </ThemedText>
            </View>

            <ThemedText
              type="default"
              numberOfLines={isDescriptionExpanded ? undefined : 3}
              style={styles.descriptionBody}>
              {product.description}
            </ThemedText>

            <Pressable
              onPress={() => setIsDescriptionExpanded((p) => !p)}
              style={styles.readMoreBtn}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                {isDescriptionExpanded ? 'Show Less ↑' : 'Read Full Description ↓'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Buyer Protection & Trust Guarantees */}
          <View
            style={[
              styles.trustContainer,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <SymbolView
                  tintColor="#6366f1"
                  name={{ ios: 'shippingbox.fill', android: 'local_shipping', web: 'local_shipping' }}
                  size={18}
                />
              </View>
              <ThemedText type="smallBold" style={styles.trustTitle}>
                Free Shipping
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.trustSubtitle}>
                On orders over $50
              </ThemedText>
            </View>

            <View
              style={[
                styles.trustDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
              ]}
            />

            <View style={styles.trustItem}>
              <View style={[styles.trustIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <SymbolView
                  tintColor="#10b981"
                  name={{ ios: 'shield.lefthalf.filled', android: 'verified_user', web: 'verified_user' }}
                  size={18}
                />
              </View>
              <ThemedText type="smallBold" style={styles.trustTitle}>
                30-Day Guarantee
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.trustSubtitle}>
                Hassle-free returns
              </ThemedText>
            </View>

            <View
              style={[
                styles.trustDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
              ]}
            />

            <View style={styles.trustItem}>
              <View style={[styles.trustIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <SymbolView
                  tintColor="#f59e0b"
                  name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                  size={18}
                />
              </View>
              <ThemedText type="smallBold" style={styles.trustTitle}>
                100% Secure
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.trustSubtitle}>
                Encrypted checkout
              </ThemedText>
            </View>
          </View>

          {/* Ratings & Customer Sentiment Breakdown */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <View style={styles.sectionHeaderRow}>
              <SymbolView
                tintColor="#f59e0b"
                name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                size={18}
              />
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                RATINGS & CUSTOMER REVIEWS
              </ThemedText>
            </View>

            <View style={styles.reviewScoreCard}>
              <View style={styles.reviewMainScore}>
                <ThemedText type="title" style={styles.reviewBigNumber}>
                  {product.rating}
                </ThemedText>
                <ThemedText style={styles.reviewStarsFive}>★★★★★</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {product.reviewsCount} reviews
                </ThemedText>
              </View>

              <View style={styles.reviewBarsCol}>
                {[
                  { stars: '5★', pct: 82 },
                  { stars: '4★', pct: 12 },
                  { stars: '3★', pct: 4 },
                  { stars: '2★', pct: 1 },
                  { stars: '1★', pct: 1 },
                ].map((bar, bIdx) => (
                  <View key={bIdx} style={styles.ratingBarRow}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.ratingBarLabel}>
                      {bar.stars}
                    </ThemedText>
                    <View
                      style={[
                        styles.ratingBarTrack,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}>
                      <View
                        style={[
                          styles.ratingBarFill,
                          {
                            width: `${bar.pct}%`,
                            backgroundColor: bar.pct > 20 ? '#f59e0b' : '#fbbf24',
                          },
                        ]}
                      />
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.ratingBarPct}>
                      {bar.pct}%
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            {/* Verified Buyer Testimonial Quotes */}
            <View
              style={[
                styles.testimonialBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}>
              <View style={styles.testimonialHeader}>
                <ThemedText type="smallBold">Alexander M.</ThemedText>
                <View style={styles.verifiedBuyerTag}>
                  <ThemedText style={styles.verifiedBuyerText}>VERIFIED BUYER</ThemedText>
                </View>
              </View>
              <ThemedText style={{ color: '#f59e0b', fontSize: 11, marginBottom: 4 }}>
                ★★★★★
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.testimonialBody}>
                "The build quality and finish completely blew me away. The {product.specs[0] || 'design'} works flawlessly and battery life is stellar!"
              </ThemedText>
            </View>
          </View>

          {/* Similar / Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.sectionHeaderRow}>
                <SymbolView
                  tintColor={theme.primary}
                  name={{ ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' }}
                  size={18}
                />
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  SIMILAR IN {categoryName.toUpperCase()}
                </ThemedText>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScroll}>
                {relatedProducts.map((rel) => (
                  <Pressable
                    key={rel.id}
                    onPress={() => {
                      router.push({
                        pathname: '/product',
                        params: { id: rel.id },
                      });
                    }}
                    style={({ pressed }) => [
                      styles.relatedCard,
                      {
                        backgroundColor: isDark ? '#141824' : '#ffffff',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                      pressed && { opacity: 0.8 },
                    ]}>
                    <View
                      style={[
                        styles.relatedIconWrap,
                        {
                          backgroundColor: isDark
                            ? `${rel.colorAccent}25`
                            : `${rel.colorAccent}15`,
                        },
                      ]}>
                      <SymbolView
                        tintColor={rel.colorAccent}
                        name={{ ios: catSymbol.ios, android: catSymbol.android, web: catSymbol.android }}
                        size={24}
                      />
                    </View>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.relatedName}>
                      {rel.name}
                    </ThemedText>
                    <ThemedText type="smallBold" style={[styles.relatedPrice, { color: rel.colorAccent }]}>
                      ${rel.price.toFixed(2)}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Padding for sticky bottom bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Sticky Dedicated Purchase Dock */}
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[
            styles.bottomDock,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: isDark ? 'rgba(20, 24, 36, 0.92)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}>
          <View style={styles.dockRow}>
            {/* Quantity Stepper & Price Subtotal */}
            <View style={styles.dockLeft}>
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[
                  styles.quantityStepper,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}>
                <Pressable
                  onPress={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                  style={styles.stepperActionBtn}>
                  <ThemedText type="smallBold" style={{ fontSize: 16 }}>−</ThemedText>
                </Pressable>
                <ThemedText type="smallBold" style={styles.stepperNumber}>
                  {selectedQuantity}
                </ThemedText>
                <Pressable
                  onPress={() => setSelectedQuantity((q) => q + 1)}
                  style={styles.stepperActionBtn}>
                  <ThemedText type="smallBold" style={{ fontSize: 16 }}>+</ThemedText>
                </Pressable>
              </GlassView>

              <View style={styles.dockPriceWrap}>
                <ThemedText type="small" themeColor="textSecondary">
                  Subtotal
                </ThemedText>
                <ThemedText type="subtitle" style={styles.dockPriceAmount}>
                  ${(product.price * selectedQuantity).toFixed(2)}
                </ThemedText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.dockRight}>
              <Pressable
                onPress={handleAddToCart}
                style={({ pressed }) => [styles.dockBtnWrap, pressed && { opacity: 0.8 }]}>
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[
                    styles.dockAddBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 102, 241, 0.18)'
                        : 'rgba(99, 102, 241, 0.1)',
                      borderColor: theme.primary,
                    },
                  ]}>
                  <SymbolView
                    tintColor={theme.primary}
                    name={{ ios: 'cart.badge.plus', android: 'add_shopping_cart', web: 'add_shopping_cart' }}
                    size={18}
                  />
                  <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 13 }}>
                    {quantityInCart > 0 ? `Add More (${quantityInCart})` : 'Add to Cart'}
                  </ThemedText>
                </GlassView>
              </Pressable>

              <Pressable
                onPress={handleBuyNow}
                style={({ pressed }) => [styles.dockBuyBtnWrap, pressed && { opacity: 0.85 }]}>
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <GradientView
                  colors={Gradients.primary}
                  direction="to-right"
                  style={styles.dockBuyBtn}>
                  <ThemedText style={styles.dockBuyText}>Buy Now</ThemedText>
                </GradientView>
              </Pressable>
            </View>
          </View>
        </GlassView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  breadcrumbBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    maxWidth: 160,
  },
  breadcrumbText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f43f5e',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  toastContainer: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  heroCanvas: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  heroAura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  brandChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  brandChipText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
  },
  emblemOuterGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemInnerCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  swatchSection: {
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  swatchLabel: {
    fontSize: 12,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatchRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  infoCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  titleRow: {
    marginBottom: 6,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.three,
  },
  skuTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  stockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  stockLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  stockLiveText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  ratingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  ratingStar: {
    color: '#f59e0b',
    fontSize: 13,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '900',
  },
  ratingCount: {
    fontSize: 12,
  },
  cardDivider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  pricingSection: {
    gap: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  mainPrice: {
    fontSize: 28,
    fontWeight: '900',
  },
  originalPriceStrikethrough: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  savingsPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingsPillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  installmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  installmentText: {
    fontSize: 12,
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  specChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  specFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  specFeatureText: {
    fontSize: 12,
    fontWeight: '700',
  },
  specTable: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  specTableRowBorder: {
    borderBottomWidth: 1,
  },
  specTableKey: {
    fontSize: 12,
  },
  specTableVal: {
    fontSize: 12,
    textAlign: 'right',
  },
  descriptionBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  trustContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.four,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  trustSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  trustDivider: {
    width: 1,
    height: 36,
  },
  reviewScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: Spacing.three,
  },
  reviewMainScore: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  reviewBigNumber: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  reviewStarsFive: {
    color: '#f59e0b',
    fontSize: 14,
    marginVertical: 2,
  },
  reviewBarsCol: {
    flex: 1,
    gap: 4,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: {
    fontSize: 11,
    width: 20,
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratingBarPct: {
    fontSize: 10,
    width: 26,
    textAlign: 'right',
  },
  testimonialBox: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  verifiedBuyerTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBuyerText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  testimonialBody: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  relatedSection: {
    marginBottom: Spacing.four,
  },
  relatedScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  relatedCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  relatedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  relatedName: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  relatedPrice: {
    fontSize: 13,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
      } as any,
    }),
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    height: 38,
  },
  stepperActionBtn: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 14,
    minWidth: 20,
    textAlign: 'center',
  },
  dockPriceWrap: {
    flexDirection: 'column',
  },
  dockPriceAmount: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
  dockRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dockBtnWrap: {
    flex: 1,
  },
  dockAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  dockBuyBtnWrap: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dockBuyBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockBuyText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
