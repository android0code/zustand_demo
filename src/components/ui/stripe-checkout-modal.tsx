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

const productThumbnails: Record<string, any> = {
  'prod-ebook-1': require('@/assets/30Days_Hustle.png'),
};

export interface StripeCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  items: { product: Product; quantity: number }[];
  onSuccess?: (order: Order) => void;
}

export function StripeCheckoutModal({
  visible,
  onClose,
  items,
  onSuccess,
}: StripeCheckoutModalProps) {
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
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [zip, setZip] = useState('94103');
  const [activeTab, setActiveTab] = useState<'card' | 'express'>('card');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

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

    // Realistic Stripe authorization latency
    await new Promise((res) => setTimeout(res, 1300));

    const result = await placeOrder({
      items,
      customerEmail: email.trim(),
      shippingAddress: `Instant Digital Delivery to ${email.trim()}`,
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
              backgroundColor: isDark ? '#111520' : '#ffffff',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.95)',
            },
          ]}>
          {/* Header Bar */}
          <View
            style={[
              styles.headerBar,
              {
                borderBottomColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(226, 232, 240, 0.8)',
              },
            ]}>
            <View style={styles.stripeBadgeRow}>
              <View style={styles.stripeLogoPill}>
                <Text style={styles.stripeLogoText}>stripe</Text>
              </View>
              <View style={styles.secureBadge}>
                <SymbolView
                  name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                  tintColor="#10b981"
                  size={12}
                />
                <Text style={styles.secureText}>256-Bit SSL Encrypted</Text>
              </View>
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
                <View style={[styles.spinnerHalo, { borderColor: '#6366f1' }]}>
                  <SymbolView
                    name={{ ios: 'arrow.clockwise', android: 'sync', web: 'sync' }}
                    tintColor="#6366f1"
                    size={36}
                  />
                </View>
                <Text style={[styles.processingTitle, { color: theme.text }]}>
                  Processing Payment via Stripe...
                </Text>
                <Text style={[styles.processingSubtitle, { color: theme.textSecondary }]}>
                  Authorizing card and generating your digital license key.
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

                {/* Auto download notice banner */}
                <View style={styles.downloadNotificationBanner}>
                  <SymbolView
                    name={{
                      ios: 'arrow.down.circle.fill',
                      android: 'download_done',
                      web: 'download_done',
                    }}
                    tintColor="#6366f1"
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
                  <Text style={[styles.licenseCode, { color: isDark ? '#a5b4fc' : '#4f46e5' }]}>
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
                      { backgroundColor: '#6366f1' },
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
                {/* Order Summary Card */}
                <View
                  style={[
                    styles.orderPreviewBox,
                    {
                      backgroundColor: isDark ? 'rgba(20, 25, 36, 0.7)' : 'rgba(248, 250, 252, 0.9)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
                    },
                  ]}>
                  <Text style={[styles.previewHeader, { color: theme.textSecondary }]}>
                    ORDER SUMMARY ({items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'})
                  </Text>
                  {items.map((it) => (
                    <View key={it.product.id} style={styles.previewItemRow}>
                      {productThumbnails[it.product.id] ? (
                        <Image
                          source={productThumbnails[it.product.id]}
                          contentFit="cover"
                          style={styles.modalItemThumbnail}
                        />
                      ) : null}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.previewItemTitle, { color: theme.text }]}>
                          {it.product.name}
                        </Text>
                        <Text style={[styles.previewItemFormat, { color: isDark ? '#a5b4fc' : '#4f46e5' }]}>
                          {it.product.fileFormat}
                        </Text>
                      </View>
                      <Text style={[styles.previewItemPrice, { color: theme.text }]}>
                        ${(it.product.price * it.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)' }]} />

                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>Total Due Today</Text>
                    <Text style={[styles.totalAmount, { color: '#6366f1' }]}>
                      ${total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Email Input (Crucial for digital goods) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    CUSTOMER EMAIL ADDRESS <Text style={{ color: '#ef4444' }}>*</Text>
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
                      tintColor={theme.textSecondary}
                      size={16}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (emailError) validateEmail(t);
                      }}
                      onBlur={() => validateEmail(email)}
                      placeholder="developer@company.com"
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
                      ⚡ Instant delivery: Download starts immediately and license is sent here.
                    </Text>
                  )}
                </View>

                {/* Payment Tabs */}
                <View style={styles.paymentTabs}>
                  <Pressable
                    onPress={() => setActiveTab('card')}
                    style={[
                      styles.paymentTab,
                      activeTab === 'card' && styles.paymentTabActive,
                      {
                        backgroundColor:
                          activeTab === 'card'
                            ? isDark
                              ? 'rgba(99, 102, 241, 0.25)'
                              : 'rgba(99, 102, 241, 0.12)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                        borderColor:
                          activeTab === 'card'
                            ? '#6366f1'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(226, 232, 240, 0.8)',
                      },
                    ]}>
                    <SymbolView
                      name={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' }}
                      tintColor={activeTab === 'card' ? '#6366f1' : theme.textSecondary}
                      size={16}
                    />
                    <Text
                      style={[
                        styles.paymentTabText,
                        {
                          color: activeTab === 'card' ? theme.text : theme.textSecondary,
                          fontWeight: activeTab === 'card' ? '700' : '500',
                        },
                      ]}>
                      Credit / Debit Card
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setActiveTab('express')}
                    style={[
                      styles.paymentTab,
                      activeTab === 'express' && styles.paymentTabActive,
                      {
                        backgroundColor:
                          activeTab === 'express'
                            ? isDark
                              ? 'rgba(99, 102, 241, 0.25)'
                              : 'rgba(99, 102, 241, 0.12)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                        borderColor:
                          activeTab === 'express'
                            ? '#6366f1'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(226, 232, 240, 0.8)',
                      },
                    ]}>
                    <SymbolView
                      name={{ ios: 'applelogo', android: 'wallet', web: 'wallet' }}
                      tintColor={activeTab === 'express' ? '#6366f1' : theme.textSecondary}
                      size={16}
                    />
                    <Text
                      style={[
                        styles.paymentTabText,
                        {
                          color: activeTab === 'express' ? theme.text : theme.textSecondary,
                          fontWeight: activeTab === 'express' ? '700' : '500',
                        },
                      ]}>
                      Apple Pay / Link
                    </Text>
                  </Pressable>
                </View>

                {/* Card Fields */}
                <View style={styles.cardFieldsBox}>
                  {/* Card Number */}
                  <View style={styles.inputGroupSmall}>
                    <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                      CARD INFORMATION
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

                  {/* Expiry & CVC & Zip Row */}
                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                        MM / YY
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

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                        CVC
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
                          placeholder="CVC"
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="numeric"
                          secureTextEntry
                          style={[styles.textInput, { color: theme.text }]}
                        />
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabelSmall, { color: theme.textSecondary }]}>
                        ZIP
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
                          value={zip}
                          onChangeText={setZip}
                          placeholder="ZIP"
                          placeholderTextColor={theme.textSecondary}
                          style={[styles.textInput, { color: theme.text }]}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Primary Pay Button */}
                <Pressable
                  onPress={handlePay}
                  style={({ pressed }) => [
                    styles.payButton,
                    { backgroundColor: '#6366f1' },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}>
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    tintColor="#ffffff"
                    size={16}
                  />
                  <Text style={styles.payButtonText}>
                    Pay ${total.toFixed(2)} & Download Instantly
                  </Text>
                </Pressable>

                <View style={styles.footerGuarantee}>
                  <Text style={[styles.guaranteeText, { color: theme.textSecondary }]}>
                    Protected by Stripe 256-Bit SSL • Instant File Access Guaranteed
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  stripeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stripeLogoPill: {
    backgroundColor: '#635bff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stripeLogoText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: -0.5,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 20,
  },
  orderPreviewBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  previewHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalItemThumbnail: {
    width: 36,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewItemFormat: {
    fontSize: 11,
    fontWeight: '500',
  },
  previewItemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  inputGroup: {
    marginBottom: 16,
    gap: 6,
  },
  inputGroupSmall: {
    marginBottom: 10,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  inputLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
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
  helperText: {
    fontSize: 11,
    marginTop: 2,
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 2,
  },
  paymentTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  paymentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  paymentTabActive: {
    borderWidth: 1.5,
  },
  paymentTabText: {
    fontSize: 12,
  },
  cardFieldsBox: {
    marginBottom: 18,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerGuarantee: {
    marginTop: 12,
    alignItems: 'center',
  },
  guaranteeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  centerStatusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  spinnerHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
  },
  successContainer: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  successBadge: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  downloadNotificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  autoDownloadHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
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
    backgroundColor: '#6366f1',
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
