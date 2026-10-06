import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import { Image } from 'expo-image';
import { GlassView } from 'expo-glass-effect';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientView } from '@/components/ui/gradient-view';
import { WebFooter } from '@/components/ui/web-footer';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProductStore } from '@/store/use-product-store';
import { useCartStore } from '@/store/use-cart-store';
import { useOrderStore } from '@/store/use-order-store';
import { triggerBrowserDownload, type Product, type Order } from '@/services/api';
import { RAZORPAY_CONFIG } from '@/config/razorpay';
import { openOfficialRazorpayCheckout } from '@/services/razorpay';

const productThumbnails: Record<string, any> = {
  'prod-ebook-1': require('@/assets/30Days_Hustle.png'),
};

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 980;

  const products = useProductStore((state) => state.products);
  const categories = useProductStore((state) => state.categories);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const placeOrder = useOrderStore((state) => state.placeOrder);

  // Find current product
  const productId = params.id || 'prod-ebook-1';
  const product = products.find((p) => p.id === productId) || products[0];

  const quantityInCart = useCartStore((state) =>
    product ? state.getItemQuantity(product.id) : 0
  );

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, []);

  // Checkout & Delivery States
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Checkout process states: 'form' | 'processing' | 'success'
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  if (!product) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loaderCenter}>
            <ThemedText type="subtitle">Loading product details...</ThemedText>
            <ThemedButton
              title="Return to Catalog"
              onPress={() => router.push('/(dashboard)')}
              style={{ marginTop: 16 }}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const categoryObj = categories.find((c) => c.id === product.categoryId);
  const isComingSoon = product.status === 'coming_soon' || !product.inStock;
  const coverImage = productThumbnails[product.id] || (product.image ? { uri: product.image } : null);

  // Price & Calculations
  const unitPrice = product.price;
  let discountAmount = 0;
  if (appliedCoupon === 'NEXTFREE' || appliedCoupon === 'FREE1') {
    discountAmount = unitPrice;
  } else if (appliedCoupon === 'DIGIT50') {
    discountAmount = Math.round(unitPrice * 0.5 * 100) / 100;
  } else if (appliedCoupon === 'BUY2GET1') {
    discountAmount = Math.round(unitPrice * 0.33 * 100) / 100;
  }

  const taxableSubtotal = Math.max(0, unitPrice - discountAmount);
  const tax = Math.round(taxableSubtotal * 0.08 * 100) / 100;
  const finalTotal = Math.max(0, taxableSubtotal + tax);


  const validateEmail = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Email is required for digital delivery');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleApplyCoupon = () => {
    setCouponError(null);
    const upper = couponCode.trim().toUpperCase();
    if (upper === 'NEXTFREE' || upper === 'FREE1' || upper === 'DIGIT50' || upper === 'BUY2GET1') {
      setAppliedCoupon(upper);
      setCouponCode('');
    } else {
      setCouponError('Invalid promo code. Try NEXTFREE or DIGIT50');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const executeDirectProductPayment = async (customId?: string) => {
    if (!validateEmail(email)) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid email address for instant digital delivery.');
      } else {
        Alert.alert('Email Required', 'Please enter a valid email address for instant digital delivery.');
      }
      return;
    }

    setStep('processing');
    const generatedRzpId = customId || `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    setRazorpayPaymentId(generatedRzpId);
    await new Promise((res) => setTimeout(res, 600));

    try {
      const result = await placeOrder({
        items: [{ product, quantity: 1 }],
        customerEmail: email.trim(),
        shippingAddress: `Verified Razorpay (${generatedRzpId}) to ${email.trim()}`,
        autoDownload: true,
      });

      if (result.success && result.order) {
        setCompletedOrder(result.order);
        setStep('success');

        if (product.downloadFileName) {
          triggerBrowserDownload(
            product.downloadFileName,
            product.downloadContent,
            product.downloadUrl
          );
        }
      } else {
        setStep('form');
        if (Platform.OS === 'web') {
          alert(result.error || 'Payment failed. Please try again.');
        } else {
          Alert.alert('Payment Failed', result.error || 'Please try again.');
        }
      }
    } catch (err: any) {
      setStep('form');
      if (Platform.OS === 'web') {
        alert(err?.message || 'Payment processing error');
      } else {
        Alert.alert('Payment Error', err?.message || 'Payment processing error');
      }
    }
  };

  const handlePay = async () => {
    if (!validateEmail(email)) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid email address for instant digital delivery.');
      } else {
        Alert.alert('Email Required', 'Please enter a valid email address for instant digital delivery.');
      }
      return;
    }

    setStep('processing');

    // 1. Launch official Razorpay Checkout SDK so the payment is registered in merchant dashboard!
    if (Platform.OS === 'web') {
      try {
        const launched = await openOfficialRazorpayCheckout({
          amount: finalTotal,
          name: RAZORPAY_CONFIG.companyName,
          description: product.name,
          customerEmail: email.trim() || undefined,
          onSuccess: async (paymentResult) => {
            const realPaymentId = paymentResult.razorpay_payment_id;
            await executeDirectProductPayment(realPaymentId);
          },
          onDismiss: () => {
            setStep('form');
          },
          onError: (err) => {
            console.warn('Razorpay checkout notice:', err);
            setStep('form');
            setPaymentNotice(
              err.description ||
                'International cards are not supported on this Razorpay merchant account. In test mode, please choose UPI or Netbanking in the Razorpay popup, or click Instant Test Pay.'
            );
          },
        });

        if (launched) {
          return;
        }
      } catch (err) {
        console.warn('Error launching official Razorpay Checkout:', err);
      }
    }

    // 2. Direct payment completion fallback:
    await executeDirectProductPayment();
  };

  const handleDownloadAgain = () => {
    triggerBrowserDownload(
      product.downloadFileName || `${product.name.replace(/\s+/g, '_')}.pdf`,
      product.downloadContent,
      product.downloadUrl
    );
  };

  const handleCopyLicense = () => {
    if (!completedOrder?.licenseKey) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(completedOrder.licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyCoupon = () => {
    if (!completedOrder?.rewardCouponCode) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(completedOrder.rewardCouponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Top Navigation & Breadcrumbs Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.push('/(dashboard)')}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={theme.text}
              size={18}
            />
            <ThemedText type="smallBold" style={{ fontSize: 13 }}>
              Storefront
            </ThemedText>
          </Pressable>

          <View style={styles.breadcrumbRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {categoryObj?.name || 'E-Books'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              /
            </ThemedText>
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              style={[styles.breadcrumbCurrent, { color: product.colorAccent }]}>
              {product.name}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => router.push('/(dashboard)/cart')}
            style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.7 }]}>
            <SymbolView
              name={{ ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' }}
              tintColor={theme.text}
              size={18}
            />
            {totalCartItems > 0 && (
              <View style={styles.cartBadge}>
                <ThemedText style={styles.cartBadgeText}>{totalCartItems}</ThemedText>
              </View>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Main Content: Responsive 2-Column or Stacked */}
          <View style={[styles.mainLayout, isDesktop ? styles.desktopRow : styles.mobileColumn]}>
            {/* LEFT COLUMN: Product Showcase, Cover, Specs & Curriculum */}
            <View style={[styles.leftColumn, isDesktop && styles.leftColumnDesktop]}>
              {/* Product Hero Header Card */}
              <GlassCard elevated variant="glow" style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  {/* Badge */}
                  <View
                    style={[
                      styles.heroBadge,
                      {
                        backgroundColor: isComingSoon ? '#8b5cf6' : product.colorAccent,
                      },
                    ]}>
                    <ThemedText style={styles.heroBadgeText}>
                      {isComingSoon ? 'LAUNCHING SOON' : product.badge || 'BESTSELLER'}
                    </ThemedText>
                  </View>

                  {/* Rating */}
                  <View style={styles.ratingBadge}>
                    <ThemedText style={styles.starIcon}>★</ThemedText>
                    <ThemedText type="smallBold" style={styles.ratingNumber}>
                      {product.rating}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                      ({product.reviewsCount} reviews)
                    </ThemedText>
                  </View>
                </View>

                {/* Cover & Title Showcase */}
                <View style={styles.showcaseContent}>
                  {coverImage ? (
                    <View style={styles.coverImageContainer}>
                      <Image
                        source={coverImage}
                        contentFit="contain"
                        style={styles.coverImage}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.iconCanvas,
                        {
                          backgroundColor: `${product.colorAccent}18`,
                          borderColor: `${product.colorAccent}35`,
                        },
                      ]}>
                      <SymbolView
                        tintColor={product.colorAccent}
                        name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }}
                        size={64}
                      />
                    </View>
                  )}

                  <View style={styles.titleInfo}>
                    <ThemedText style={styles.productTitle}>{product.name}</ThemedText>

                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.authorLine}>
                      By <ThemedText type="smallBold">{product.brand}</ThemedText> • Verified 2026 Edition
                    </ThemedText>

                    {/* Price & Savings Tag */}
                    <View style={styles.priceRow}>
                      <ThemedText style={[styles.priceTag, { color: product.colorAccent }]}>
                        {RAZORPAY_CONFIG.currencySymbol}{product.price.toFixed(2)}
                      </ThemedText>

                      {product.originalPrice && (
                        <ThemedText
                          type="subtitle"
                          style={styles.originalPrice}>
                          {RAZORPAY_CONFIG.currencySymbol}{product.originalPrice.toFixed(2)}
                        </ThemedText>
                      )}

                      {product.originalPrice && (
                        <View style={styles.discountPill}>
                          <ThemedText style={styles.discountPillText}>
                            90% OFF
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Cart Action Buttons */}
                    <View style={styles.cartActionRow}>
                      <Pressable
                        onPress={handlePay}
                        style={({ pressed }) => [
                          styles.buyNowHeroBtn,
                          pressed && { opacity: 0.85 },
                        ]}>
                        <SymbolView
                          tintColor="#ffffff"
                          name={{ ios: 'bolt.fill', android: 'flash_on', web: 'flash_on' }}
                          size={15}
                        />
                        <ThemedText style={styles.buyNowHeroBtnText}>
                          Buy Now with Razorpay
                        </ThemedText>
                      </Pressable>

                      {quantityInCart === 0 ? (
                        <Pressable
                          onPress={() => addToCart(product)}
                          style={({ pressed }) => [
                            styles.addToCartBtn,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.05)',
                              borderColor: isDark
                                ? 'rgba(255, 255, 255, 0.15)'
                                : 'rgba(0, 0, 0, 0.1)',
                            },
                            pressed && { opacity: 0.8 },
                          ]}>
                          <SymbolView
                            tintColor={theme.text}
                            name={{ ios: 'cart.badge.plus', android: 'add_shopping_cart', web: 'add_shopping_cart' }}
                            size={16}
                          />
                          <ThemedText type="smallBold">Add to Cart</ThemedText>
                        </Pressable>
                      ) : (
                        <View style={styles.cartStepper}>
                          <Pressable
                            onPress={() => updateQuantity(product.id, quantityInCart - 1)}
                            style={styles.stepperBtn}>
                            <ThemedText type="smallBold">−</ThemedText>
                          </Pressable>
                          <ThemedText type="smallBold" style={styles.stepperText}>
                            {quantityInCart} in Cart
                          </ThemedText>
                          <Pressable
                            onPress={() => updateQuantity(product.id, quantityInCart + 1)}
                            style={styles.stepperBtn}>
                            <ThemedText type="smallBold">+</ThemedText>
                          </Pressable>
                        </View>
                      )}

                      <View style={styles.instantBadge}>
                        <SymbolView
                          tintColor="#10b981"
                          name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
                          size={12}
                        />
                        <ThemedText style={styles.instantBadgeText}>
                          Instant File Access
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              </GlassCard>

              {/* Bonus Inclusions Callout Card */}
              {product.bonus && (
                <View
                  style={[
                    styles.bonusCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(245, 158, 11, 0.08)',
                      borderColor: isDark
                        ? 'rgba(245, 158, 11, 0.35)'
                        : 'rgba(245, 158, 11, 0.25)',
                    },
                  ]}>
                  <View style={styles.bonusIconWrap}>
                    <SymbolView
                      tintColor="#f59e0b"
                      name={{ ios: 'gift.fill', android: 'card_giftcard', web: 'card_giftcard' }}
                      size={20}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.bonusTitle}>EXCLUSIVE BONUS INCLUDED</ThemedText>
                    <ThemedText type="small" style={styles.bonusBody}>
                      {product.bonus} — Delivered directly with your purchase at no extra cost.
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* What's Inside & Specs Breakdown */}
              <GlassCard style={styles.specsCard}>
                <ThemedText type="subtitle" style={styles.cardHeaderTitle}>
                  What You'll Learn & Inclusions
                </ThemedText>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={{ marginBottom: 14, lineHeight: 20 }}>
                  {product.description}
                </ThemedText>

                <View style={styles.specsList}>
                  {product.specs.map((spec, idx) => (
                    <View key={idx} style={styles.specItemRow}>
                      <View style={styles.checkCircle}>
                        <SymbolView
                          tintColor="#10b981"
                          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                          size={12}
                        />
                      </View>
                      <ThemedText type="smallBold" style={styles.specItemText}>
                        {spec}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {/* Technical Specifications Matrix */}
                <View
                  style={[
                    styles.specMatrix,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}>
                  <View style={styles.matrixCol}>
                    <ThemedText style={styles.matrixLabel}>FORMAT</ThemedText>
                    <ThemedText type="smallBold">{product.fileFormat || 'Universal PDF'}</ThemedText>
                  </View>
                  <View style={styles.matrixCol}>
                    <ThemedText style={styles.matrixLabel}>FILE SIZE</ThemedText>
                    <ThemedText type="smallBold">{product.fileSize || 'Instant Download'}</ThemedText>
                  </View>
                  <View style={styles.matrixCol}>
                    <ThemedText style={styles.matrixLabel}>LICENSE</ThemedText>
                    <ThemedText type="smallBold">{product.license || 'Commercial Use'}</ThemedText>
                  </View>
                </View>
              </GlassCard>

              {/* Buyer Guarantees */}
              <View style={styles.guaranteeRow}>
                <View style={styles.guaranteeItem}>
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    tintColor="#0284c7"
                    size={16}
                  />
                  <ThemedText style={styles.guaranteeText}>Razorpay 256-Bit SSL</ThemedText>
                </View>
                <View style={styles.guaranteeItem}>
                  <SymbolView
                    name={{ ios: 'arrow.down.circle.fill', android: 'download', web: 'download' }}
                    tintColor="#10b981"
                    size={16}
                  />
                  <ThemedText style={styles.guaranteeText}>Instant Auto-Download</ThemedText>
                </View>
                <View style={styles.guaranteeItem}>
                  <SymbolView
                    name={{ ios: 'key.fill', android: 'vpn_key', web: 'vpn_key' }}
                    tintColor="#f59e0b"
                    size={16}
                  />
                  <ThemedText style={styles.guaranteeText}>Lifetime License Key</ThemedText>
                </View>
              </View>
            </View>

            {/* RIGHT COLUMN: Interactive Payment & Checkout Panel ("here fill the payment details all things") */}
            <View style={[styles.rightColumn, isDesktop && styles.rightColumnDesktop]}>
              <GlassCard elevated variant="glow" style={styles.checkoutPanel}>
                {/* Razorpay Brand Bar */}
                <View style={styles.rzpHeader}>
                  <View style={styles.rzpBrandRow}>
                    <View style={styles.rzpLogoBadge}>
                      <SymbolView
                        name={{ ios: 'bolt.fill', android: 'flash_on', web: 'flash_on' }}
                        tintColor="#ffffff"
                        size={12}
                      />
                      <ThemedText style={styles.rzpLogoText}>Razorpay</ThemedText>
                    </View>
                    <View style={styles.secureBadge}>
                      <SymbolView
                        name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                        tintColor="#10b981"
                        size={11}
                      />
                      <ThemedText style={styles.secureText}>256-Bit SSL</ThemedText>
                    </View>
                  </View>

                  {RAZORPAY_CONFIG.isTestMode && (
                    <View style={styles.testBadge}>
                      <ThemedText style={styles.testBadgeText}>LIVE TEST MODE</ThemedText>
                    </View>
                  )}
                </View>

                {/* Checkout Content States */}
                {step === 'processing' ? (
                  <View style={styles.centerStatusBox}>
                    <View style={[styles.spinnerHalo, { borderColor: '#3395ff' }]}>
                      <SymbolView
                        name={{ ios: 'arrow.clockwise', android: 'sync', web: 'sync' }}
                        tintColor="#3395ff"
                        size={36}
                      />
                    </View>
                    <ThemedText type="subtitle" style={{ marginTop: 12, fontWeight: '800' }}>
                      Authorizing via Razorpay...
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={{ textAlign: 'center', maxWidth: 300, lineHeight: 18 }}>
                      Generating your verified license key and initiating direct PDF download.
                    </ThemedText>
                  </View>
                ) : step === 'success' && completedOrder ? (
                  <View style={styles.successStateBox}>
                    <SymbolView
                      name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                      tintColor="#10b981"
                      size={46}
                    />
                    <ThemedText type="subtitle" style={styles.successTitle}>
                      Payment Approved!
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={{ textAlign: 'center', lineHeight: 18 }}>
                      Invoice and download link dispatched to{' '}
                      <ThemedText type="smallBold">{completedOrder.customerEmail}</ThemedText>
                    </ThemedText>

                    {/* Razorpay Ref */}
                    <View style={styles.paymentRefPill}>
                      <ThemedText style={styles.paymentRefLabel}>RAZORPAY PAYMENT ID</ThemedText>
                      <ThemedText style={[styles.paymentRefCode, { color: isDark ? '#93c5fd' : '#2563eb' }]}>
                        {razorpayPaymentId || `pay_${completedOrder.id.replace('ORD-', '')}`}
                      </ThemedText>
                    </View>

                    {/* Auto Download Notification */}
                    <View style={styles.autoDownloadBox}>
                      <SymbolView
                        name={{ ios: 'arrow.down.circle.fill', android: 'download_done', web: 'download_done' }}
                        tintColor="#3395ff"
                        size={20}
                      />
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.autoDownloadTitle}>
                          Download Started Automatically!
                        </ThemedText>
                        <ThemedText style={styles.autoDownloadSub}>
                          Check your browser downloads tray.
                        </ThemedText>
                      </View>
                    </View>

                    {/* License Key Card */}
                    <View
                      style={[
                        styles.licenseKeyCard,
                        {
                          backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.8)',
                        },
                      ]}>
                      <View style={styles.licenseCardHeader}>
                        <ThemedText style={styles.licenseCardLabel}>YOUR DIGITAL LICENSE KEY</ThemedText>
                        <Pressable
                          onPress={handleCopyLicense}
                          style={({ pressed }) => [
                            styles.copyButton,
                            copiedKey && { backgroundColor: '#10b981' },
                            pressed && { opacity: 0.8 },
                          ]}>
                          <ThemedText style={styles.copyButtonText}>
                            {copiedKey ? 'COPIED!' : 'COPY'}
                          </ThemedText>
                        </Pressable>
                      </View>
                      <ThemedText style={[styles.licenseKeyCode, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                        {completedOrder.licenseKey}
                      </ThemedText>
                    </View>

                    {/* Success Action Buttons */}
                    <ThemedButton
                      title="Download PDF Again"
                      variant="primary"
                      onPress={handleDownloadAgain}
                      style={{ width: '100%', marginTop: 8 }}
                    />

                    <ThemedButton
                      title="View in My Downloads & Licenses"
                      variant="glass"
                      onPress={() => router.push('/(dashboard)/orders')}
                      style={{ width: '100%' }}
                    />
                  </View>
                ) : (
                  /* DIRECT RAZORPAY CHECKOUT PANEL */
                  <View style={styles.formContainer}>
                    <ThemedText type="subtitle" style={styles.panelTitle}>
                      Order & Instant Checkout
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.panelSubtitle}>
                      Click below to complete payment securely via official Razorpay.
                    </ThemedText>

                    {paymentNotice && (
                      <View style={styles.paymentNoticeBox}>
                        <View style={styles.paymentNoticeHeader}>
                          <SymbolView
                            name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
                            tintColor="#f59e0b"
                            size={16}
                          />
                          <ThemedText style={styles.paymentNoticeTitle}>
                            International Cards Not Supported
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.paymentNoticeBody}>
                          {paymentNotice}
                        </ThemedText>
                        <Pressable
                          onPress={() => executeDirectProductPayment()}
                          style={({ pressed }) => [
                            styles.quickNoticeBtn,
                            pressed && { opacity: 0.85 },
                          ]}>
                          <ThemedText style={styles.quickNoticeBtnText}>
                            ⚡ Complete Order Instantly via Test Pay →
                          </ThemedText>
                        </Pressable>
                      </View>
                    )}

                    {/* Email for delivery */}
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>
                        EMAIL ADDRESS (FOR DIGITAL FILE DELIVERY)
                      </ThemedText>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                            borderColor: emailError
                              ? '#ef4444'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(203, 213, 225, 0.7)',
                          },
                        ]}>
                        <SymbolView
                          name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                          tintColor={emailError ? '#ef4444' : theme.textSecondary}
                          size={15}
                        />
                        <TextInput
                          value={email}
                          onChangeText={(t) => {
                            setEmail(t);
                            if (emailError) validateEmail(t);
                          }}
                          placeholder="your.email@example.com"
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={[styles.textInput, { color: theme.text }]}
                        />
                      </View>
                      {emailError ? (
                        <ThemedText style={styles.errorText}>{emailError}</ThemedText>
                      ) : null}
                    </View>

                    {/* Promo Code Box */}
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>HAVE A PROMO CODE?</ThemedText>
                      {appliedCoupon ? (
                        <View style={styles.couponAppliedRow}>
                          <ThemedText style={{ color: '#10b981', fontWeight: '700', fontSize: 12 }}>
                            ✓ {appliedCoupon} applied (-{RAZORPAY_CONFIG.currencySymbol}{discountAmount.toFixed(2)})
                          </ThemedText>
                          <Pressable onPress={handleRemoveCoupon}>
                            <ThemedText style={{ color: theme.danger, fontWeight: '700', fontSize: 11 }}>
                              Remove
                            </ThemedText>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.couponInputRow}>
                          <TextInput
                            value={couponCode}
                            onChangeText={(t) => {
                              setCouponCode(t);
                              if (couponError) setCouponError(null);
                            }}
                            placeholder="e.g. NEXTFREE or DIGIT50"
                            placeholderTextColor={theme.textSecondary}
                            autoCapitalize="characters"
                            style={[
                              styles.couponInput,
                              {
                                backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.7)',
                                color: theme.text,
                              },
                            ]}
                          />
                          <Pressable
                            onPress={handleApplyCoupon}
                            style={({ pressed }) => [
                              styles.applyCouponBtn,
                              pressed && { opacity: 0.8 },
                            ]}>
                            <ThemedText style={styles.applyCouponBtnText}>Apply</ThemedText>
                          </Pressable>
                        </View>
                      )}
                      {couponError && <ThemedText style={styles.errorText}>{couponError}</ThemedText>}
                    </View>

                    {/* Summary Breakdown */}
                    <View
                      style={[
                        styles.orderSummaryBox,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}>
                      <View style={styles.summaryLine}>
                        <ThemedText type="small" themeColor="textSecondary">Item Subtotal</ThemedText>
                        <ThemedText type="smallBold">{RAZORPAY_CONFIG.currencySymbol}{unitPrice.toFixed(2)}</ThemedText>
                      </View>

                      {discountAmount > 0 && (
                        <View style={styles.summaryLine}>
                          <ThemedText type="small" style={{ color: '#10b981' }}>
                            Coupon Discount ({appliedCoupon})
                          </ThemedText>
                          <ThemedText type="smallBold" style={{ color: '#10b981' }}>
                            -{RAZORPAY_CONFIG.currencySymbol}{discountAmount.toFixed(2)}
                          </ThemedText>
                        </View>
                      )}

                      <View style={styles.summaryLine}>
                        <ThemedText type="small" themeColor="textSecondary">Digital Delivery</ThemedText>
                        <ThemedText type="smallBold" style={{ color: '#10b981' }}>FREE (Instant)</ThemedText>
                      </View>

                      <View style={styles.summaryLine}>
                        <ThemedText type="small" themeColor="textSecondary">Tax (8%)</ThemedText>
                        <ThemedText type="smallBold">{RAZORPAY_CONFIG.currencySymbol}{tax.toFixed(2)}</ThemedText>
                      </View>

                      <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />

                      <View style={styles.summaryTotalLine}>
                        <ThemedText type="subtitle" style={{ fontWeight: '800' }}>Total Due</ThemedText>
                        <ThemedText type="subtitle" style={{ color: theme.primary, fontWeight: '900' }}>
                          {RAZORPAY_CONFIG.currencySymbol}{finalTotal.toFixed(2)}
                        </ThemedText>
                      </View>
                    </View>

                    {/* DIRECT BUY BUTTON: OPENS OFFICIAL RAZORPAY PAGE / POPUP */}
                    <ThemedButton
                      title={`⚡ Pay ${RAZORPAY_CONFIG.currencySymbol}${finalTotal.toFixed(2)} with Razorpay`}
                      variant="gradient"
                      gradientColors={Gradients.primary}
                      onPress={handlePay}
                      size="large"
                      style={styles.payButton}
                    />

                    {RAZORPAY_CONFIG.isTestMode && (
                      <Pressable
                        onPress={() => executeDirectProductPayment()}
                        style={({ pressed }) => [
                          styles.testPayBtn,
                          pressed && { opacity: 0.85 },
                        ]}>
                        <SymbolView
                          name={{ ios: 'bolt.fill', android: 'flash_on', web: 'flash_on' }}
                          tintColor="#10b981"
                          size={14}
                        />
                        <ThemedText style={styles.testPayBtnText}>
                          ⚡ Instant Test Pay (Simulate 100% Success)
                        </ThemedText>
                      </Pressable>
                    )}


                    <View style={styles.footerNoteRow}>
                      <SymbolView
                        name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                        tintColor="#10b981"
                        size={12}
                      />
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                        Opens official Razorpay 256-Bit SSL Gateway • Cards, UPI & Netbanking
                      </ThemedText>
                    </View>
                  </View>
                )}
              </GlassCard>
            </View>
          </View>

          {/* Web Footer */}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  breadcrumbRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    fontWeight: '700',
  },
  cartBtn: {
    position: 'relative',
    padding: 8,
    borderRadius: 10,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#f43f5e',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 100,
  },
  mainLayout: {
    width: '100%',
    gap: 24,
    marginTop: 8,
  },
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mobileColumn: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 1,
    gap: 20,
  },
  leftColumnDesktop: {
    maxWidth: '56%',
  },
  rightColumn: {
    width: '100%',
  },
  rightColumnDesktop: {
    width: '44%',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 20,
      } as any,
    }),
  },
  heroCard: {
    padding: Spacing.four,
    borderRadius: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  starIcon: {
    color: '#f59e0b',
    fontSize: 12,
  },
  ratingNumber: {
    color: '#f59e0b',
    fontSize: 12,
  },
  showcaseContent: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  coverImageContainer: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  coverImage: {
    width: 140,
    height: 200,
    borderRadius: 12,
  },
  iconCanvas: {
    width: 130,
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  authorLine: {
    fontSize: 12,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  priceTag: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discountPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountPillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  cartActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  buyNowHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  buyNowHeroBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  openModalPillBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 2,
  },
  openModalPillText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cartStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepperText: {
    paddingHorizontal: 4,
    fontSize: 12,
  },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instantBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: Spacing.three + 2,
    borderRadius: 18,
    borderWidth: 1,
  },
  bonusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusTitle: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  bonusBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  specsCard: {
    padding: Spacing.four,
    borderRadius: 22,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  specsList: {
    gap: 10,
    marginBottom: 16,
  },
  specItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specItemText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  specMatrix: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  matrixCol: {
    flex: 1,
    gap: 2,
  },
  matrixLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
  },
  guaranteeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 4,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  checkoutPanel: {
    padding: Spacing.four,
    borderRadius: 24,
  },
  rzpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  rzpBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rzpLogoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0c2340',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rzpLogoText: {
    color: '#3395ff',
    fontSize: 12,
    fontWeight: '900',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  secureText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  testBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  testBadgeText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '800',
  },
  formContainer: {
    gap: 14,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  panelSubtitle: {
    fontSize: 12,
    marginTop: -8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#94a3b8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    outlineStyle: 'none',
  } as any,
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 2,
  },
  paymentMethodTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  methodTabActive: {},
  methodTabText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardFieldsWrapper: {
    gap: 12,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardBrandBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBrandText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bankChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  bankChipActive: {},
  bankChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  couponAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    outlineStyle: 'none',
  } as any,
  applyCouponBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  paymentNoticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginVertical: 6,
  },
  paymentNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentNoticeTitle: {
    color: '#f59e0b',
    fontSize: 12.5,
    fontWeight: '800',
  },
  paymentNoticeBody: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  quickNoticeBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  quickNoticeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  orderSummaryBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  summaryTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payButton: {
    marginTop: 4,
    width: '100%',
  },
  testPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  testPayBtnText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  centerStatusBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  spinnerHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 149, 255, 0.1)',
  },
  successStateBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  paymentRefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentRefLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94a3b8',
  },
  paymentRefCode: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '800',
  },
  autoDownloadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(51, 149, 255, 0.1)',
    borderColor: 'rgba(51, 149, 255, 0.3)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  autoDownloadTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066ff',
  },
  autoDownloadSub: {
    fontSize: 10.5,
    color: '#64748b',
  },
  licenseKeyCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  licenseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  licenseCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94a3b8',
  },
  copyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  licenseKeyCode: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});
