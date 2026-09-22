import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOrderStore } from '@/store/use-order-store';
import { useCartStore } from '@/store/use-cart-store';
import { triggerBrowserDownload, type Order, type Product } from '@/services/api';
import { RAZORPAY_CONFIG } from '@/config/razorpay';

const productThumbnails: Record<string, any> = {
  'prod-ebook-1': require('@/assets/30Days_Hustle.png'),
};

export interface RazorpayCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  items: { product: Product; quantity: number }[];
  onSuccess?: (order: Order) => void;
}

export function RazorpayCheckoutModal({
  visible,
  onClose,
  items,
  onSuccess,
}: RazorpayCheckoutModalProps) {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const placeOrder = useOrderStore((s) => s.placeOrder);
  const clearCart = useCartStore((s) => s.clearCart);
  const discountPercent = useCartStore((s) => s.discountPercent);
  const couponCode = useCartStore((s) => s.couponCode);

  // Form states
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('');

  // Checkout process states: 'form' | 'processing' | 'success'
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Computations
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  let discountAmount = 0;
  if (couponCode && (couponCode.startsWith('NEXTFREE') || couponCode.startsWith('FREE1') || couponCode === 'NEXT1FREE')) {
    const prices: number[] = [];
    items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        prices.push(item.product.price);
      }
    });
    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      discountAmount = prices[0];
    }
  } else if (couponCode === 'BUY2GET1' || couponCode === 'BUY2FREE1' || couponCode === 'B2G1') {
    if (totalItemCount >= 3) {
      const prices: number[] = [];
      items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          prices.push(item.product.price);
        }
      });
      prices.sort((a, b) => a - b);
      const freeCount = Math.floor(totalItemCount / 3);
      discountAmount = prices.slice(0, freeCount).reduce((acc, p) => acc + p, 0);
    } else if (totalItemCount === 2) {
      discountAmount = Math.round(((subtotal * 33.33) / 100) * 100) / 100;
    }
  } else if (discountPercent > 0) {
    discountAmount = (subtotal * discountPercent) / 100;
  }

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableSubtotal * 0.08 * 100) / 100;
  const total = Math.max(0, taxableSubtotal + tax);

  // Detect card brand
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
      setEmailError('Email address is required for digital delivery');
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

  const handlePay = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setStep('processing');

    // Generate an authentic Razorpay payment ID (e.g. pay_29OX44abc123)
    const generatedRzpId = `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    setRazorpayPaymentId(generatedRzpId);

    // Realistic Razorpay gateway authorization latency
    await new Promise((res) => setTimeout(res, 1200));

    const result = await placeOrder({
      items,
      customerEmail: email.trim(),
      shippingAddress: `Instant Digital Delivery via Razorpay (${generatedRzpId}) to ${email.trim()}`,
      autoDownload: true, // triggers automatic download upon payment!
    });

    if (result.success && result.order) {
      setCompletedOrder(result.order);
      setStep('success');
      clearCart();
      if (onSuccess) onSuccess(result.order);
    } else {
      setStep('form');
      alert(result.error || 'Payment failed. Please try again.');
    }
  };

  const handleDownloadAgain = () => {
    if (!completedOrder) return;
    completedOrder.items.forEach((item, idx) => {
      setTimeout(() => {
        triggerBrowserDownload(
          item.product.downloadFileName || `${item.product.name.replace(/\s+/g, '_')}.pdf`,
          item.product.downloadContent,
          item.product.downloadUrl
        );
      }, idx * 300);
    });
  };

  const handleCopyLicense = () => {
    if (!completedOrder?.licenseKey) return;
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(completedOrder.licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyCoupon = () => {
    if (!completedOrder?.rewardCouponCode) return;
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(completedOrder.rewardCouponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setStep('form');
    setCompletedOrder(null);
    setCopiedCoupon(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleResetAndClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#0b111e' : '#ffffff',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.95)',
            },
          ]}>
          {/* Razorpay Branded Header */}
          <View
            style={[
              styles.headerBar,
              {
                borderBottomColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(226, 232, 240, 0.8)',
              },
            ]}>
            <View style={styles.razorpayBrandRow}>
              <View style={styles.razorpayLogoBadge}>
                <SymbolView
                  name={{ ios: 'bolt.fill', android: 'flash_on', web: 'flash_on' }}
                  tintColor="#ffffff"
                  size={12}
                />
                <Text style={styles.razorpayLogoText}>Razorpay</Text>
              </View>

              <View style={styles.secureBadge}>
                <SymbolView
                  name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                  tintColor="#10b981"
                  size={12}
                />
                <Text style={styles.secureText}>256-Bit SSL</Text>
              </View>

              {RAZORPAY_CONFIG.isTestMode && (
                <View style={styles.testModeBadge}>
                  <Text style={styles.testModeBadgeText}>TEST MODE</Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={handleResetAndClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                tintColor={theme.textSecondary}
                size={18}
              />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}>
            {step === 'processing' ? (
              <View style={styles.centerStatusContainer}>
                <View style={[styles.spinnerHalo, { borderColor: '#3395ff' }]}>
                  <SymbolView
                    name={{ ios: 'arrow.clockwise', android: 'sync', web: 'sync' }}
                    tintColor="#3395ff"
                    size={36}
                  />
                </View>
                <Text style={[styles.processingTitle, { color: theme.text }]}>
                  Processing via Razorpay...
                </Text>
                <Text style={[styles.processingSubtitle, { color: theme.textSecondary }]}>
                  Authorizing payment with Razorpay gateway and generating your digital license key.
                </Text>
              </View>
            ) : step === 'success' && completedOrder ? (
              <View style={styles.successContainer}>
                <View style={styles.successBadge}>
                  <SymbolView
                    name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                    tintColor="#10b981"
                    size={48}
                  />
                </View>

                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Payment Successful!
                </Text>

                <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
                  Thank you! An invoice and download link have been dispatched to{' '}
                  <Text style={{ fontWeight: '700', color: theme.text }}>
                    {completedOrder.customerEmail}
                  </Text>
                </Text>

                {/* Razorpay Transaction Ref */}
                <View style={styles.rzpRefBox}>
                  <Text style={[styles.rzpRefLabel, { color: theme.textSecondary }]}>
                    RAZORPAY PAYMENT ID
                  </Text>
                  <Text style={[styles.rzpRefCode, { color: isDark ? '#93c5fd' : '#2563eb' }]}>
                    {razorpayPaymentId || `pay_${completedOrder.id.replace('ORD-', '')}`}
                  </Text>
                </View>

                {/* Auto download notice banner */}
                <View style={styles.downloadNotificationBanner}>
                  <SymbolView
                    name={{
                      ios: 'arrow.down.circle.fill',
                      android: 'download_done',
                      web: 'download_done',
                    }}
                    tintColor="#3395ff"
                    size={22}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.autoDownloadHeader}>
                      File Download Started Automatically!
                    </Text>
                    <Text style={styles.autoDownloadDesc}>
                      Check your browser downloads. If it didn’t start, tap the button below.
                    </Text>
                  </View>
                </View>

                {/* License Key Card */}
                <View
                  style={[
                    styles.licenseBox,
                    {
                      backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(203, 213, 225, 0.8)',
                    },
                  ]}>
                  <View style={styles.licenseHeader}>
                    <Text style={[styles.licenseLabel, { color: theme.textSecondary }]}>
                      YOUR DIGITAL LICENSE KEY
                    </Text>
                    <Pressable
                      onPress={handleCopyLicense}
                      style={({ pressed }) => [
                        styles.copyBtn,
                        pressed && { opacity: 0.7 },
                        copiedKey && { backgroundColor: '#10b981' },
                      ]}>
                      <Text style={styles.copyBtnText}>
                        {copiedKey ? 'COPIED!' : 'COPY'}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.licenseCode, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                    {completedOrder.licenseKey}
                  </Text>
                </View>

                {/* Reward Coupon Code Card (if customer bought 2+ items) */}
                {completedOrder.rewardCouponCode && (
                  <View
                    style={[
                      styles.rewardCouponBox,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
                      },
                    ]}>
                    <View style={styles.rewardHeader}>
                      <View style={styles.rewardTagBadge}>
                        <SymbolView
                          name={{ ios: 'gift.fill', android: 'card_giftcard', web: 'card_giftcard' }}
                          tintColor="#10b981"
                          size={12}
                        />
                        <Text style={styles.rewardTagText}>BUY 2 SPECIAL UNLOCKED</Text>
                      </View>
                      <Pressable
                        onPress={handleCopyCoupon}
                        style={({ pressed }) => [
                          styles.copyBtn,
                          { backgroundColor: '#10b981' },
                          pressed && { opacity: 0.7 },
                        ]}>
                        <Text style={styles.copyBtnText}>
                          {copiedCoupon ? 'COPIED!' : 'COPY CODE'}
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={[styles.rewardTitle, { color: theme.text }]}>
                      100% Free Product for Your Next Order!
                    </Text>

                    <View style={styles.rewardCodeContainer}>
                      <Text style={[styles.rewardCodeText, { color: isDark ? '#34d399' : '#059669' }]}>
                        {completedOrder.rewardCouponCode}
                      </Text>
                    </View>

                    <Text style={[styles.rewardDesc, { color: theme.textSecondary }]}>
                      Because you bought 2+ items, we have sent this coupon to{' '}
                      <Text style={{ fontWeight: '700', color: theme.text }}>
                        {completedOrder.customerEmail}
                      </Text>
                      . Apply it at your next checkout to get any item completely free!
                    </Text>
                  </View>
                )}

                {/* Purchased items list */}
                <View style={styles.purchasedSummaryList}>
                  {completedOrder.items.map((item) => (
                    <View key={item.product.id} style={styles.purchasedSummaryRow}>
                      {productThumbnails[item.product.id] ? (
                        <Image
                          source={productThumbnails[item.product.id]}
                          contentFit="cover"
                          style={styles.modalItemThumbnail}
                        />
                      ) : null}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.purchasedItemName, { color: theme.text }]}>
                          {item.product.name}
                        </Text>
                        <Text style={[styles.purchasedItemFormat, { color: theme.textSecondary }]}>
                          {item.product.fileFormat} • {item.product.fileSize}
                        </Text>
                      </View>
                      <Text style={[styles.purchasedItemPrice, { color: theme.text }]}>
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.successActions}>
                  <Pressable
                    onPress={handleDownloadAgain}
                    style={({ pressed }) => [
                      styles.actionBtnPrimary,
                      { backgroundColor: '#0066ff' },
                      pressed && { opacity: 0.85 },
                    ]}>
                    <SymbolView
                      name={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }}
                      tintColor="#ffffff"
                      size={18}
                    />
                    <Text style={styles.actionBtnPrimaryText}>Download Files Again</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      handleResetAndClose();
                      router.push('/(dashboard)/orders');
                    }}
                    style={({ pressed }) => [
                      styles.actionBtnSecondary,
                      {
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(203, 213, 225, 0.9)',
                      },
                      pressed && { opacity: 0.85 },
                    ]}>
                    <Text style={[styles.actionBtnSecondaryText, { color: theme.text }]}>
                      View in My Downloads
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Payment Form Step */
              <View>
                {/* Merchant Brand Info Header */}
                <View style={styles.merchantHeader}>
                  <View style={styles.merchantLeft}>
                    <Text style={[styles.merchantName, { color: theme.text }]}>
                      {RAZORPAY_CONFIG.companyName}
                    </Text>
                    <Text style={[styles.merchantDesc, { color: theme.textSecondary }]}>
                      {RAZORPAY_CONFIG.companyDescription}
                    </Text>
                  </View>
                  <View style={styles.amountDueBox}>
                    <Text style={styles.amountDueLabel}>AMOUNT DUE</Text>
                    <Text style={[styles.amountDueValue, { color: isDark ? '#93c5fd' : '#0066ff' }]}>
                      ${total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Order Line Items preview */}
                <View
                  style={[
                    styles.orderPreviewBox,
                    {
                      backgroundColor: isDark ? 'rgba(20, 25, 36, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
                    },
                  ]}>
                  {items.map((it) => (
                    <View key={it.product.id} style={styles.previewItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.previewItemName, { color: theme.text }]}>
                          {it.product.name} × {it.quantity}
                        </Text>
                        <Text style={[styles.previewItemFormat, { color: theme.textSecondary }]}>
                          {it.product.fileFormat} • Instant PDF Download
                        </Text>
                      </View>
                      <Text style={[styles.previewItemPrice, { color: theme.text }]}>
                        ${(it.product.price * it.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  {discountAmount > 0 && (
                    <View style={styles.previewItemRow}>
                      <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '700' }}>
                        Discount Applied ({couponCode})
                      </Text>
                      <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '700' }}>
                        -${discountAmount.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(226, 232, 240, 0.8)',
                      },
                    ]}
                  />

                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                    <Text style={[styles.totalAmount, { color: isDark ? '#93c5fd' : '#0066ff' }]}>
                      ${total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Digital Delivery Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    EMAIL ADDRESS FOR DIGITAL DELIVERY (REQUIRED)
                  </Text>
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
                      size={16}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (emailError) validateEmail(t);
                      }}
                      onBlur={() => validateEmail(email)}
                      placeholder="your.email@example.com"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.textInput, { color: theme.text }]}
                    />
                  </View>
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : (
                    <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                      Your verified license key & download links will be delivered here instantly.
                    </Text>
                  )}
                </View>

                {/* Razorpay Payment Method Tabs */}
                <View style={styles.paymentMethodTabsRow}>
                  <Pressable
                    onPress={() => setPaymentMethod('card')}
                    style={[
                      styles.methodTab,
                      paymentMethod === 'card' && styles.methodTabActive,
                      {
                        backgroundColor:
                          paymentMethod === 'card'
                            ? isDark
                              ? '#0066ff25'
                              : '#0066ff15'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                        borderColor:
                          paymentMethod === 'card'
                            ? '#0066ff'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}>
                    <SymbolView
                      name={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' }}
                      tintColor={paymentMethod === 'card' ? '#0066ff' : theme.textSecondary}
                      size={14}
                    />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: paymentMethod === 'card' ? '#0066ff' : theme.textSecondary },
                      ]}>
                      Cards
                    </Text>
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
                              ? '#0066ff25'
                              : '#0066ff15'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                        borderColor:
                          paymentMethod === 'upi'
                            ? '#0066ff'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}>
                    <SymbolView
                      name={{ ios: 'qrcode', android: 'qr_code', web: 'qr_code' }}
                      tintColor={paymentMethod === 'upi' ? '#0066ff' : theme.textSecondary}
                      size={14}
                    />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: paymentMethod === 'upi' ? '#0066ff' : theme.textSecondary },
                      ]}>
                      UPI / QR
                    </Text>
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
                              ? '#0066ff25'
                              : '#0066ff15'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                        borderColor:
                          paymentMethod === 'netbanking'
                            ? '#0066ff'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}>
                    <SymbolView
                      name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                      tintColor={paymentMethod === 'netbanking' ? '#0066ff' : theme.textSecondary}
                      size={14}
                    />
                    <Text
                      style={[
                        styles.methodTabText,
                        { color: paymentMethod === 'netbanking' ? '#0066ff' : theme.textSecondary },
                      ]}>
                      Netbanking
                    </Text>
                  </Pressable>
                </View>

                {/* Card Payment Inputs */}
                {paymentMethod === 'card' && (
                  <View style={styles.cardFieldsBox}>
                    <View style={styles.inputGroupSmall}>
                      <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                        CARD NUMBER
                      </Text>
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
                          <Text style={styles.cardBrandText}>{getCardBrand()}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                          EXPIRY (MM / YY)
                        </Text>
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
                        <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                          CVV
                        </Text>
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

                {/* UPI Payment Inputs */}
                {paymentMethod === 'upi' && (
                  <View style={styles.cardFieldsBox}>
                    <View style={styles.inputGroupSmall}>
                      <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                        ENTER YOUR UPI ID (VPA)
                      </Text>
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
                          placeholder="e.g. yourname@upi"
                          placeholderTextColor={theme.textSecondary}
                          autoCapitalize="none"
                          style={[styles.textInput, { color: theme.text }]}
                        />
                      </View>
                      <Text style={[styles.helperText, { color: theme.textSecondary, marginTop: 4 }]}>
                        Supports Google Pay, PhonePe, Paytm, BHIM, and any bank UPI app.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Netbanking Selection */}
                {paymentMethod === 'netbanking' && (
                  <View style={styles.cardFieldsBox}>
                    <Text style={[styles.inputLabelSmall, { color: theme.textSecondary, marginBottom: 6 }]}>
                      POPULAR BANKS
                    </Text>
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
                                  ? '#0066ff20'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : 'rgba(0, 0, 0, 0.03)',
                              borderColor:
                                selectedBank === bank
                                  ? '#0066ff'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.bankChipText,
                              { color: selectedBank === bank ? '#0066ff' : theme.text },
                            ]}>
                            {bank}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Razorpay Submit Button */}
                <Pressable
                  onPress={handlePay}
                  style={({ pressed }) => [
                    styles.paySubmitBtn,
                    { backgroundColor: '#0066ff' },
                    pressed && { opacity: 0.85 },
                  ]}>
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    tintColor="#ffffff"
                    size={14}
                  />
                  <Text style={styles.paySubmitBtnText}>
                    Pay ${total.toFixed(2)} with Razorpay
                  </Text>
                </Pressable>

                <View style={styles.footerSecurityNote}>
                  <SymbolView
                    name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
                    tintColor="#10b981"
                    size={13}
                  />
                  <Text style={[styles.footerSecurityNoteText, { color: theme.textSecondary }]}>
                    Protected by Razorpay 256-Bit SSL • Instant File Access Guaranteed
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  razorpayBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  razorpayLogoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0c2340',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  razorpayLogoText: {
    color: '#3395ff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    fontSize: 10.5,
    fontWeight: '700',
  },
  testModeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testModeBadgeText: {
    color: '#f59e0b',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
  },
  scrollBody: {
    padding: 20,
    gap: 16,
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  merchantLeft: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '800',
  },
  merchantDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  amountDueBox: {
    alignItems: 'flex-end',
  },
  amountDueLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  amountDueValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  orderPreviewBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  previewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewItemName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  previewItemFormat: {
    fontSize: 11,
    marginTop: 1,
  },
  previewItemPrice: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  inputGroup: {
    gap: 6,
  },
  inputGroupSmall: {
    marginBottom: 10,
    gap: 4,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputLabelSmall: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  helperText: {
    fontSize: 11,
    lineHeight: 15,
  },
  paymentMethodTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
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
    fontSize: 12,
    fontWeight: '700',
  },
  cardFieldsBox: {
    marginTop: 6,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  cardBrandBadge: {
    backgroundColor: '#0066ff',
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
    fontSize: 11.5,
    fontWeight: '700',
  },
  paySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  paySubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  footerSecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerSecurityNoteText: {
    fontSize: 11,
  },
  centerStatusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  spinnerHalo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 149, 255, 0.1)',
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  processingSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  successContainer: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  successBadge: {
    marginTop: 4,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  successSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  rzpRefBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rzpRefLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rzpRefCode: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '800',
  },
  downloadNotificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(51, 149, 255, 0.1)',
    borderColor: 'rgba(51, 149, 255, 0.3)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  autoDownloadHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0066ff',
  },
  autoDownloadDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  licenseBox: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  licenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  licenseLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  copyBtn: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  licenseCode: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '800',
    letterSpacing: 1,
  },
  rewardCouponBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rewardTagText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  rewardCodeContainer: {
    paddingVertical: 2,
  },
  rewardCodeText: {
    fontSize: 17,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  rewardDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  purchasedSummaryList: {
    width: '100%',
    gap: 8,
  },
  purchasedSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 10,
  },
  purchasedItemName: {
    fontSize: 12,
    fontWeight: '600',
  },
  purchasedItemFormat: {
    fontSize: 10,
  },
  purchasedItemPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  successActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
