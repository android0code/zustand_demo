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

  // Payment Form States
  const [email, setEmail] = useState('shopper@happyexpo.dev');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [cardholderName, setCardholderName] = useState('Alex Morgan');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Checkout process states: 'form' | 'processing' | 'success'
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
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

  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5')) return 'MASTERCARD';
    if (clean.startsWith('6')) return 'RUPAY';
    if (clean.startsWith('3')) return 'AMEX';
    return 'CARD';
  };

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

  const handlePay = async () => {
    if (!validateEmail(email)) return;

    setStep('processing');
    const generatedRzpId = `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    setRazorpayPaymentId(generatedRzpId);

    // Realistic Razorpay payment authorization latency
    await new Promise((res) => setTimeout(res, 1400));

    try {
      const result = await placeOrder({
        items: [{ product, quantity: 1 }],
        customerEmail: email.trim(),
        shippingAddress: `Instant Digital Delivery via Razorpay (${generatedRzpId}) to ${email.trim()}`,
        autoDownload: true,
      });

      if (result.success && result.order) {
        setCompletedOrder(result.order);
        setStep('success');

        // Automatically trigger browser download on web
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
                        ${product.price.toFixed(2)}
                      </ThemedText>

                      {product.originalPrice && (
                        <ThemedText
                          type="subtitle"
                          style={styles.originalPrice}>
                          ${product.originalPrice.toFixed(2)}
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
                  /* PAYMENT FORM: "here fill the payment details all things" */
                  <View style={styles.formContainer}>
                    <ThemedText type="subtitle" style={styles.panelTitle}>
                      Fill Payment Details
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.panelSubtitle}>
                      Instant file download upon payment approval.
                    </ThemedText>

                    {/* 1. Email for delivery */}
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>
                        EMAIL ADDRESS (FOR DIGITAL DELIVERY)
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

                    {/* 2. Payment Method Switcher */}
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>SELECT PAYMENT METHOD</ThemedText>
                      <View style={styles.paymentMethodTabs}>
                        <Pressable
                          onPress={() => setPaymentMethod('card')}
                          style={[
                            styles.methodTab,
                            paymentMethod === 'card' && styles.methodTabActive,
                            {
                              backgroundColor:
                                paymentMethod === 'card'
                                  ? isDark
                                    ? '#6366f125'
                                    : '#6366f115'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : 'rgba(0, 0, 0, 0.03)',
                              borderColor:
                                paymentMethod === 'card'
                                  ? theme.primary
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}>
                          <SymbolView
                            name={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' }}
                            tintColor={paymentMethod === 'card' ? theme.primary : theme.textSecondary}
                            size={14}
                          />
                          <ThemedText
                            style={[
                              styles.methodTabText,
                              { color: paymentMethod === 'card' ? theme.primary : theme.textSecondary },
                            ]}>
                            Cards
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={() => setPaymentMethod('upi')}
                          style={[
                            styles.methodTab,
                            paymentMethod === 'upi' && styles.methodTabActive,
                            {
                              backgroundColor:
                                paymentMethod === 'upi'
                                  ? isDark
                                    ? '#6366f125'
                                    : '#6366f115'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : 'rgba(0, 0, 0, 0.03)',
                              borderColor:
                                paymentMethod === 'upi'
                                  ? theme.primary
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}>
                          <SymbolView
                            name={{ ios: 'qrcode', android: 'qr_code', web: 'qr_code' }}
                            tintColor={paymentMethod === 'upi' ? theme.primary : theme.textSecondary}
                            size={14}
                          />
                          <ThemedText
                            style={[
                              styles.methodTabText,
                              { color: paymentMethod === 'upi' ? theme.primary : theme.textSecondary },
                            ]}>
                            UPI / QR
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={() => setPaymentMethod('netbanking')}
                          style={[
                            styles.methodTab,
                            paymentMethod === 'netbanking' && styles.methodTabActive,
                            {
                              backgroundColor:
                                paymentMethod === 'netbanking'
                                  ? isDark
                                    ? '#6366f125'
                                    : '#6366f115'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : 'rgba(0, 0, 0, 0.03)',
                              borderColor:
                                paymentMethod === 'netbanking'
                                  ? theme.primary
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}>
                          <SymbolView
                            name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                            tintColor={paymentMethod === 'netbanking' ? theme.primary : theme.textSecondary}
                            size={14}
                          />
                          <ThemedText
                            style={[
                              styles.methodTabText,
                              { color: paymentMethod === 'netbanking' ? theme.primary : theme.textSecondary },
                            ]}>
                            Netbanking
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>

                    {/* 3. Method-specific inputs */}
                    {paymentMethod === 'card' && (
                      <View style={styles.cardFieldsWrapper}>
                        <View style={styles.fieldGroup}>
                          <ThemedText style={styles.fieldLabel}>CARD NUMBER</ThemedText>
                          <View
                            style={[
                              styles.inputWrapper,
                              {
                                backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.7)',
                              },
                            ]}>
                            <TextInput
                              value={cardNumber}
                              onChangeText={setCardNumber}
                              placeholder="1234 5678 9012 3456"
                              placeholderTextColor={theme.textSecondary}
                              keyboardType="numeric"
                              style={[styles.textInput, { color: theme.text }]}
                            />
                            <View style={styles.cardBrandBadge}>
                              <ThemedText style={styles.cardBrandText}>{getCardBrand()}</ThemedText>
                            </View>
                          </View>
                        </View>

                        <View style={styles.splitRow}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fieldLabel}>EXPIRY (MM/YY)</ThemedText>
                            <View
                              style={[
                                styles.inputWrapper,
                                {
                                  backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.7)',
                                },
                              ]}>
                              <TextInput
                                value={expiry}
                                onChangeText={setExpiry}
                                placeholder="MM/YY"
                                placeholderTextColor={theme.textSecondary}
                                style={[styles.textInput, { color: theme.text }]}
                              />
                            </View>
                          </View>

                          <View style={{ width: 100 }}>
                            <ThemedText style={styles.fieldLabel}>CVV</ThemedText>
                            <View
                              style={[
                                styles.inputWrapper,
                                {
                                  backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.7)',
                                },
                              ]}>
                              <TextInput
                                value={cvc}
                                onChangeText={setCvc}
                                placeholder="123"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                                style={[styles.textInput, { color: theme.text }]}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

                    {paymentMethod === 'upi' && (
                      <View style={styles.fieldGroup}>
                        <ThemedText style={styles.fieldLabel}>UPI ID (VPA)</ThemedText>
                        <View
                          style={[
                            styles.inputWrapper,
                            {
                              backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.7)',
                            },
                          ]}>
                          <SymbolView
                            name={{ ios: 'at', android: 'alternate_email', web: 'alternate_email' }}
                            tintColor={theme.textSecondary}
                            size={14}
                          />
                          <TextInput
                            value={upiId}
                            onChangeText={setUpiId}
                            placeholder="yourname@upi"
                            placeholderTextColor={theme.textSecondary}
                            autoCapitalize="none"
                            style={[styles.textInput, { color: theme.text }]}
                          />
                        </View>
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          style={{ fontSize: 11, marginTop: 4 }}>
                          Supports Google Pay, PhonePe, Paytm, BHIM, and bank UPI apps.
                        </ThemedText>
                      </View>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <View style={styles.fieldGroup}>
                        <ThemedText style={styles.fieldLabel}>SELECT YOUR BANK</ThemedText>
                        <View style={styles.bankChipsRow}>
                          {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'].map((bank) => (
                            <Pressable
                              key={bank}
                              onPress={() => setSelectedBank(bank)}
                              style={[
                                styles.bankChip,
                                selectedBank === bank && styles.bankChipActive,
                                {
                                  backgroundColor:
                                    selectedBank === bank
                                      ? '#6366f120'
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.04)'
                                      : 'rgba(0, 0, 0, 0.03)',
                                  borderColor:
                                    selectedBank === bank
                                      ? theme.primary
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.06)',
                                },
                              ]}>
                              <ThemedText
                                style={[
                                  styles.bankChipText,
                                  { color: selectedBank === bank ? theme.primary : theme.text },
                                ]}>
                                {bank}
                              </ThemedText>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* 4. Promo Code Box */}
                    <View style={styles.fieldGroup}>
                      <ThemedText style={styles.fieldLabel}>HAVE A PROMO CODE?</ThemedText>
                      {appliedCoupon ? (
                        <View style={styles.couponAppliedRow}>
                          <ThemedText style={{ color: '#10b981', fontWeight: '700', fontSize: 12 }}>
                            ✓ {appliedCoupon} applied (-${discountAmount.toFixed(2)})
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

                    {/* 5. Summary Breakdown */}
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
                        <ThemedText type="smallBold">${unitPrice.toFixed(2)}</ThemedText>
                      </View>

                      {discountAmount > 0 && (
                        <View style={styles.summaryLine}>
                          <ThemedText type="small" style={{ color: '#10b981' }}>
                            Coupon Discount ({appliedCoupon})
                          </ThemedText>
                          <ThemedText type="smallBold" style={{ color: '#10b981' }}>
                            -${discountAmount.toFixed(2)}
                          </ThemedText>
                        </View>
                      )}

                      <View style={styles.summaryLine}>
                        <ThemedText type="small" themeColor="textSecondary">Digital Delivery</ThemedText>
                        <ThemedText type="smallBold" style={{ color: '#10b981' }}>FREE (Instant)</ThemedText>
                      </View>

                      <View style={styles.summaryLine}>
                        <ThemedText type="small" themeColor="textSecondary">Tax (8%)</ThemedText>
                        <ThemedText type="smallBold">${tax.toFixed(2)}</ThemedText>
                      </View>

                      <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />

                      <View style={styles.summaryTotalLine}>
                        <ThemedText type="subtitle" style={{ fontWeight: '800' }}>Total Due</ThemedText>
                        <ThemedText type="subtitle" style={{ color: theme.primary, fontWeight: '900' }}>
                          ${finalTotal.toFixed(2)}
                        </ThemedText>
                      </View>
                    </View>

                    {/* 6. Pay with Razorpay Button */}
                    <ThemedButton
                      title={`⚡ Pay $${finalTotal.toFixed(2)} with Razorpay`}
                      variant="gradient"
                      gradientColors={Gradients.primary}
                      onPress={handlePay}
                      size="large"
                      style={styles.payButton}
                    />

                    <View style={styles.footerNoteRow}>
                      <SymbolView
                        name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                        tintColor="#10b981"
                        size={12}
                      />
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                        Protected by Razorpay 256-Bit SSL • Instant PDF Access
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
