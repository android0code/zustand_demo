import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/themed-button';
import { ThemedInput } from '@/components/ui/themed-input';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientView } from '@/components/ui/gradient-view';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useAuthStore } from '@/store/use-auth-store';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCartStore } from '@/store/use-cart-store';
import { useOrderStore } from '@/store/use-order-store';
import { useAddressStore } from '@/store/use-address-store';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: { ios: SFSymbol; android: AndroidSymbol };
  iconColor?: string;
  badge?: string | number;
  onPress?: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const orders = useOrderStore((state) => state.orders);
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const addresses = useAddressStore((state) => state.addresses);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditPassword('');
    setEditConfirmPassword('');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setEditError(null);

    if (!editName.trim()) {
      setEditError('Name cannot be empty');
      return;
    }

    if (editPassword) {
      if (editPassword.length < 6) {
        setEditError('New password must be at least 6 characters');
        return;
      }
      if (editPassword !== editConfirmPassword) {
        setEditError('Passwords do not match');
        return;
      }
    }

    setIsSaving(true);
    try {
      const result = await updateProfile(editName, editPassword || undefined);
      if (!result.success) {
        setEditError(result.error || 'Failed to update profile');
      } else {
        setIsEditModalOpen(false);
        setSuccessMessage('Profile updated successfully!');
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]
      );
    }
  };

  const showFeatureNotice = (feature: string) => {
    if (Platform.OS === 'web') {
      alert(`${feature} will be available in the upcoming update.`);
    } else {
      Alert.alert(feature, `${feature} will be available in the upcoming update.`);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Orders & Purchases',
      items: [
        {
          title: 'My Orders',
          subtitle: 'Track shipments, view history & reorder',
          icon: { ios: 'shippingbox.fill', android: 'inventory_2' },
          iconColor: '#6366f1',
          badge: orders.length > 0 ? orders.length : undefined,
          onPress: () => router.push('/orders'),
        },
        {
          title: 'Shopping Cart',
          subtitle: 'Items ready for checkout & payment',
          icon: { ios: 'cart.fill', android: 'shopping_cart' },
          iconColor: '#8b5cf6',
          badge: totalCartItems > 0 ? totalCartItems : undefined,
          onPress: () => router.push('/cart'),
        },
        {
          title: 'Delivery Addresses',
          subtitle: 'Manage home, office & saved destinations',
          icon: { ios: 'location.fill', android: 'location_on' },
          iconColor: '#06b6d4',
          badge: addresses.length > 0 ? addresses.length : undefined,
          onPress: () => router.push('/addresses'),
        },
      ],
    },
    {
      title: 'Account & Security',
      items: [
        {
          title: 'Personal Details',
          subtitle: 'Update your display name & password',
          icon: { ios: 'person.crop.circle', android: 'person' },
          iconColor: '#10b981',
          onPress: openEditModal,
        },
        {
          title: 'Notifications & Alerts',
          subtitle: 'Promotional offers & shipping updates',
          icon: { ios: 'bell.fill', android: 'notifications' },
          iconColor: '#f59e0b',
          onPress: () => showFeatureNotice('Notifications'),
        },
        {
          title: 'Privacy & Security',
          subtitle: 'Manage login credentials & security',
          icon: { ios: 'lock.fill', android: 'lock' },
          iconColor: '#3b82f6',
          onPress: openEditModal,
        },
      ],
    },
    {
      title: 'Support & Information',
      items: [
        {
          title: 'Customer Help Center',
          subtitle: 'Frequently asked questions & 24/7 care',
          icon: { ios: 'questionmark.circle.fill', android: 'help' },
          iconColor: '#8b5cf6',
          onPress: () => showFeatureNotice('Help Center'),
        },
        {
          title: 'Terms & Privacy Policy',
          subtitle: 'User agreement, refunds & terms of service',
          icon: { ios: 'doc.text.fill', android: 'description' },
          iconColor: '#64748b',
          onPress: () => showFeatureNotice('Terms of Service'),
        },
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header Title Bar */}
          <View style={styles.topHeader}>
            <View>
              <ThemedText type="title" style={styles.screenTitle}>
                Account
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.screenSubtitle}>
                Manage your profile, orders & settings
              </ThemedText>
            </View>

            <Pressable
              onPress={openEditModal}
              style={({ pressed }) => [
                styles.topHeaderEditBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(99, 102, 241, 0.2)',
                },
                pressed && { opacity: 0.7 },
              ]}>
              <SymbolView
                tintColor={theme.primary}
                name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                size={16}
              />
            </Pressable>
          </View>

          {/* Success Banner */}
          {successMessage && (
            <View style={styles.successBanner}>
              <SymbolView
                tintColor="#10b981"
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                size={16}
              />
              <ThemedText style={styles.successText}>{successMessage}</ThemedText>
            </View>
          )}

          {/* Hero Profile Card */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            <View style={styles.heroMain}>
              {/* Avatar with Dual-Tone Gradient Ring & Camera Badge */}
              <View style={styles.avatarWrapper}>
                <GradientView
                  colors={['#6366f1', '#a855f7']}
                  direction="to-bottom-right"
                  style={styles.avatarCircle}>
                  <ThemedText style={styles.avatarInitials}>
                    {getInitials(user?.name)}
                  </ThemedText>
                </GradientView>

                <Pressable
                  onPress={openEditModal}
                  style={[
                    styles.avatarCameraBadge,
                    {
                      backgroundColor: theme.primary,
                      borderColor: isDark ? '#141824' : '#ffffff',
                    },
                  ]}>
                  <SymbolView
                    tintColor="#ffffff"
                    name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                    size={11}
                  />
                </Pressable>
              </View>

              {/* User Information */}
              <View style={styles.heroInfo}>
                <View style={styles.userNameRow}>
                  <ThemedText type="subtitle" style={styles.userNameText}>
                    {user?.name || 'Valued Shopper'}
                  </ThemedText>
                  <View style={styles.verifiedBadge}>
                    <SymbolView
                      tintColor={theme.primary}
                      name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                      size={16}
                    />
                  </View>
                </View>

                <ThemedText type="small" themeColor="textSecondary" style={styles.userEmailText}>
                  {user?.email || 'shopper@happyexpo.dev'}
                </ThemedText>

                <View style={styles.userJoinedPill}>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    Active Member • 2024
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Frosted Action Button */}
            <Pressable
              onPress={openEditModal}
              style={({ pressed }) => [
                styles.editProfileButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.06)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.18)',
                },
                pressed && { opacity: 0.8 },
              ]}>
              <SymbolView
                tintColor={theme.primary}
                name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                size={13}
              />
              <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 12 }}>
                Edit Account Details
              </ThemedText>
            </Pressable>
          </View>

          {/* VIP Loyalty Gold Membership Banner */}
          <View
            style={[
              styles.vipCard,
              {
                backgroundColor: isDark ? '#1a160d' : '#fefce8',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.4)',
              },
            ]}>
            <View style={styles.vipIconCircle}>
              <GradientView
                colors={['#f59e0b', '#d97706']}
                direction="to-bottom-right"
                style={styles.vipIconGradient}>
                <SymbolView
                  tintColor="#ffffff"
                  name={{ ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' }}
                  size={16}
                />
              </GradientView>
            </View>

            <View style={styles.vipDetails}>
              <View style={styles.vipTitleRow}>
                <ThemedText type="smallBold" style={styles.vipTitle}>
                  VIP GOLD MEMBER
                </ThemedText>
                <View style={styles.vipActiveChip}>
                  <ThemedText style={styles.vipActiveText}>ACTIVE</ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.vipSubtitle}>
                Free priority shipping & 5% cashback on orders
              </ThemedText>
            </View>
          </View>

          {/* 4-Column Shopping Quick Hub */}
          <View
            style={[
              styles.hubCard,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}>
            {/* Orders */}
            <Pressable
              onPress={() => router.push('/orders')}
              style={({ pressed }) => [styles.hubColumn, pressed && { opacity: 0.7 }]}>
              <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <SymbolView
                  tintColor="#6366f1"
                  name={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }}
                  size={16}
                />
              </View>
              <ThemedText type="smallBold" style={styles.hubValue}>
                {orders.length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.hubLabel}>
                Orders
              </ThemedText>
            </Pressable>

            <View
              style={[
                styles.hubDivider,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            />

            {/* Cart */}
            <Pressable
              onPress={() => router.push('/cart')}
              style={({ pressed }) => [styles.hubColumn, pressed && { opacity: 0.7 }]}>
              <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <SymbolView
                  tintColor="#8b5cf6"
                  name={{ ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' }}
                  size={16}
                />
              </View>
              <ThemedText type="smallBold" style={styles.hubValue}>
                {totalCartItems}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.hubLabel}>
                In Cart
              </ThemedText>
            </Pressable>

            <View
              style={[
                styles.hubDivider,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            />

            {/* Addresses */}
            <Pressable
              onPress={() => router.push('/addresses')}
              style={({ pressed }) => [styles.hubColumn, pressed && { opacity: 0.7 }]}>
              <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                <SymbolView
                  tintColor="#06b6d4"
                  name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                  size={16}
                />
              </View>
              <ThemedText type="smallBold" style={styles.hubValue}>
                {addresses.length}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.hubLabel}>
                Addresses
              </ThemedText>
            </Pressable>

            <View
              style={[
                styles.hubDivider,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            />

            {/* Rating */}
            <View style={styles.hubColumn}>
              <View style={[styles.hubIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <SymbolView
                  tintColor="#f59e0b"
                  name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                  size={16}
                />
              </View>
              <ThemedText type="smallBold" style={[styles.hubValue, { color: '#f59e0b' }]}>
                4.9 ★
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.hubLabel}>
                Rating
              </ThemedText>
            </View>
          </View>

          {/* Grouped Menu Sections */}
          {menuSections.map((section, sIndex) => (
            <View key={sIndex} style={styles.menuSectionWrap}>
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                style={styles.menuSectionHeader}>
                {section.title.toUpperCase()}
              </ThemedText>

              <View
                style={[
                  styles.menuSectionCard,
                  {
                    backgroundColor: isDark ? '#141824' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}>
                {section.items.map((item, iIndex) => {
                  const iconTint = item.iconColor || theme.primary;

                  return (
                    <Pressable
                      key={iIndex}
                      onPress={item.onPress}
                      style={({ pressed }) => [
                        styles.menuRow,
                        iIndex < section.items.length - 1 && [
                          styles.menuRowBorder,
                          {
                            borderBottomColor: isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : 'rgba(0, 0, 0, 0.05)',
                          },
                        ],
                        pressed && { opacity: 0.7 },
                      ]}>
                      {/* Pastel Inset Icon Square */}
                      <View
                        style={[
                          styles.menuIconSquare,
                          {
                            backgroundColor: `${iconTint}${isDark ? '25' : '15'}`,
                            borderColor: `${iconTint}30`,
                          },
                        ]}>
                        <SymbolView
                          tintColor={iconTint}
                          name={{
                            ios: item.icon.ios,
                            android: item.icon.android,
                            web: item.icon.android,
                          }}
                          size={18}
                        />
                      </View>

                      {/* Text details */}
                      <View style={styles.menuTextGroup}>
                        <ThemedText type="default" style={styles.menuTitleText}>
                          {item.title}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          numberOfLines={1}
                          style={styles.menuSubtitleText}>
                          {item.subtitle}
                        </ThemedText>
                      </View>

                      {/* Right Badge */}
                      {item.badge !== undefined && (
                        <View
                          style={[
                            styles.menuBadgePill,
                            {
                              backgroundColor: `${theme.primary}18`,
                              borderColor: `${theme.primary}30`,
                            },
                          ]}>
                          <ThemedText
                            type="smallBold"
                            style={{ color: theme.primary, fontSize: 11 }}>
                            {item.badge}
                          </ThemedText>
                        </View>
                      )}

                      {/* Chevron */}
                      <SymbolView
                        tintColor={theme.textSecondary}
                        name={{
                          ios: 'chevron.right',
                          android: 'chevron_right',
                          web: 'chevron_right',
                        }}
                        size={14}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Sign Out Card */}
          <View style={styles.logoutSection}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutCard,
                {
                  backgroundColor: isDark ? '#1a1012' : '#fef2f2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                },
                pressed && { opacity: 0.8 },
              ]}>
              <View style={styles.logoutIconSquare}>
                <SymbolView
                  tintColor={theme.danger}
                  name={{
                    ios: 'rectangle.portrait.and.arrow.right',
                    android: 'logout',
                    web: 'logout',
                  }}
                  size={18}
                />
              </View>
              <View style={styles.logoutTextGroup}>
                <ThemedText type="smallBold" style={{ color: theme.danger, fontSize: 15 }}>
                  Sign Out of Account
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                  Securely sign out of this device
                </ThemedText>
              </View>
              <SymbolView
                tintColor={theme.danger}
                name={{
                  ios: 'chevron.right',
                  android: 'chevron_right',
                  web: 'chevron_right',
                }}
                size={14}
              />
            </Pressable>

            {/* App Footer */}
            <View style={styles.appFooter}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.appFooterText}>
                HappyExpo v1.0.0 • E-Commerce Suite
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                Aurora Glassmorphism Design System
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Bottom Sheet Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setIsEditModalOpen(false)}
          />

          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? '#141824' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Edit Profile
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Update your display name and credentials
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setIsEditModalOpen(false)}
                style={styles.closeButton}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 18 }}>
                  ✕
                </ThemedText>
              </Pressable>
            </View>

            {editError && (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{editError}</ThemedText>
              </View>
            )}

            <ThemedInput
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
            />

            <ThemedInput
              label="New Password (optional)"
              value={editPassword}
              onChangeText={setEditPassword}
              placeholder="Leave empty to keep current password"
              isPassword
            />

            {editPassword.length > 0 && (
              <ThemedInput
                label="Confirm New Password"
                value={editConfirmPassword}
                onChangeText={setEditConfirmPassword}
                placeholder="Re-enter your new password"
                isPassword
              />
            )}

            <ThemedButton
              title={isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              variant="gradient"
              gradientColors={Gradients.primary}
              loading={isSaving}
              onPress={handleSaveProfile}
              style={{ marginTop: Spacing.three }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Platform.select({ ios: 140, android: 110, default: 120 }),
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  topHeaderEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  successText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  heroCard: {
    padding: Spacing.four,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: Spacing.three,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 23,
  },
  verifiedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmailText: {
    fontSize: 13,
    marginTop: 2,
  },
  userJoinedPill: {
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.four,
  },
  vipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three + 2,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  vipIconCircle: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  vipIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipDetails: {
    flex: 1,
  },
  vipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  vipActiveChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  vipActiveText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  vipSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
  },
  hubColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  hubValue: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 1,
  },
  hubLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  hubDivider: {
    width: 1,
    height: 32,
  },
  menuSectionWrap: {
    marginBottom: Spacing.four,
  },
  menuSectionHeader: {
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: Spacing.two,
    marginLeft: 4,
  },
  menuSectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three + 2,
    gap: Spacing.three,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
  },
  menuIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextGroup: {
    flex: 1,
  },
  menuTitleText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 1,
  },
  menuSubtitleText: {
    fontSize: 12,
  },
  menuBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 2,
  },
  logoutSection: {
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three + 2,
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.three,
  },
  logoutIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTextGroup: {
    flex: 1,
  },
  appFooter: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  appFooterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      } as any,
    }),
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    borderWidth: 1,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.3)',
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeButton: {
    padding: 6,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
