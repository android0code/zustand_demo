import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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
import { GlassView } from 'expo-glass-effect';
import { GradientView } from '@/components/ui/gradient-view';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAddressStore, type Address } from '@/store/use-address-store';

export default function AddressesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const addresses = useAddressStore((state) => state.addresses);
  const addAddress = useAddressStore((state) => state.addAddress);
  const updateAddress = useAddressStore((state) => state.updateAddress);
  const deleteAddress = useAddressStore((state) => state.deleteAddress);
  const setDefaultAddress = useAddressStore((state) => state.setDefaultAddress);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setLabel('Home');
    setRecipientName('');
    setPhone('');
    setStreet('');
    setCity('');
    setState('');
    setZipCode('');
    setIsDefault(addresses.length === 0);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state);
    setZipCode(addr.zipCode);
    setIsDefault(addr.isDefault);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setError(null);

    if (!recipientName.trim()) {
      setError('Please enter recipient full name');
      return;
    }
    if (!street.trim()) {
      setError('Please enter street address');
      return;
    }
    if (!city.trim()) {
      setError('Please enter city');
      return;
    }
    if (!state.trim()) {
      setError('Please enter state');
      return;
    }
    if (!zipCode.trim()) {
      setError('Please enter ZIP code');
      return;
    }

    const payload = {
      label,
      recipientName: recipientName.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      isDefault,
    };

    if (editingId) {
      updateAddress(editingId, payload);
      showToast('Address updated successfully');
    } else {
      addAddress(payload);
      showToast('New address saved');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (confirm(`Delete delivery address for ${name}?`)) {
        deleteAddress(id);
        showToast('Address deleted');
      }
    } else {
      Alert.alert(
        'Delete Address',
        `Are you sure you want to remove the address for ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteAddress(id);
              showToast('Address deleted');
            },
          },
        ]
      );
    }
  };

  const getLabelIcon = (
    type: 'Home' | 'Work' | 'Other'
  ): { ios: SFSymbol; android: AndroidSymbol; color: string } => {
    switch (type) {
      case 'Home':
        return { ios: 'house.fill', android: 'home', color: '#6366f1' };
      case 'Work':
        return { ios: 'building.2.fill', android: 'apartment', color: '#8b5cf6' };
      case 'Other':
        return { ios: 'mappin.and.ellipse', android: 'place', color: '#06b6d4' };
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
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
              Saved Addresses
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'}
            </ThemedText>
          </View>

          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => [
              styles.addHeaderBtn,
              pressed && { opacity: 0.8 },
            ]}>
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <GradientView
              colors={Gradients.primary}
              direction="to-right"
              style={styles.addHeaderBtnInner}>
              <SymbolView
                tintColor="#ffffff"
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={14}
              />
              <ThemedText style={styles.addBtnText}>Add</ThemedText>
            </GradientView>
          </Pressable>
        </View>

        {/* Toast feedback banner */}
        {toastMessage && (
          <View style={styles.toastBanner}>
            <ThemedText style={styles.toastText}>✓ {toastMessage}</ThemedText>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <GlassCard elevated style={styles.emptyIconCircle}>
                <GradientView
                  colors={['#6366f120', '#8b5cf610']}
                  direction="to-bottom-right"
                  style={styles.emptyIconInner}>
                  <SymbolView
                    tintColor={theme.primary}
                    name={{ ios: 'mappin.slash', android: 'wrong_location', web: 'location_off' }}
                    size={48}
                  />
                </GradientView>
              </GlassCard>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No Saved Addresses
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                Save your home or work delivery destinations for quick one-tap checkout.
              </ThemedText>
              <ThemedButton
                title="+ Add New Address"
                variant="gradient"
                gradientColors={Gradients.primary}
                onPress={openAddModal}
                style={{ minWidth: 200 }}
              />
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((addr) => {
                const labelIcon = getLabelIcon(addr.label);

                return (
                  <GlassCard
                    key={addr.id}
                    variant={addr.isDefault ? 'glow' : 'regular'}
                    style={styles.addressCard}>
                    {/* Top Row: Label tag, Default chip, and Type Icon */}
                    <View style={styles.cardHeader}>
                      <View style={styles.labelRow}>
                        <View
                          style={[
                            styles.labelIconWrapper,
                            {
                              backgroundColor: `${labelIcon.color}${isDark ? '30' : '18'}`,
                            },
                          ]}>
                          <SymbolView
                            tintColor={labelIcon.color}
                            name={{
                              ios: labelIcon.ios,
                              android: labelIcon.android,
                              web: labelIcon.android,
                            }}
                            size={16}
                          />
                        </View>
                        <ThemedText
                          type="smallBold"
                          style={[styles.labelText, { color: labelIcon.color }]}>
                          {addr.label.toUpperCase()}
                        </ThemedText>
                      </View>

                      {addr.isDefault && (
                        <View style={styles.defaultChipWrapper}>
                          <GradientView
                            colors={Gradients.primary}
                            direction="to-right"
                            style={styles.defaultChip}>
                            <ThemedText style={styles.defaultChipText}>DEFAULT</ThemedText>
                          </GradientView>
                        </View>
                      )}
                    </View>

                    {/* Recipient & Full Address */}
                    <ThemedText type="subtitle" style={styles.recipientName}>
                      {addr.recipientName}
                    </ThemedText>
                    <ThemedText type="default" style={styles.streetText}>
                      {addr.street}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.cityStateZip}>
                      {addr.city}, {addr.state} {addr.zipCode}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.phoneText}>
                      📞 {addr.phone}
                    </ThemedText>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                      ]}
                    />

                    {/* Actions Row */}
                    <View style={styles.actionsRow}>
                      {!addr.isDefault ? (
                        <Pressable
                          onPress={() => {
                            setDefaultAddress(addr.id);
                            showToast('Default address updated');
                          }}
                          style={styles.actionBtn}>
                          <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 13 }}>
                            Set as Default
                          </ThemedText>
                        </Pressable>
                      ) : (
                        <View />
                      )}

                      <View style={styles.rightActions}>
                        <Pressable
                          onPress={() => openEditModal(addr)}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            pressed && { opacity: 0.7 },
                          ]}>
                          <ThemedText type="smallBold" style={styles.actionBtnText}>
                            Edit
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={() => handleDelete(addr.id, addr.recipientName)}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            pressed && { opacity: 0.7 },
                          ]}>
                          <ThemedText type="smallBold" style={{ color: theme.danger, fontSize: 13 }}>
                            Delete
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Add / Edit Address Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setIsModalOpen(false)}
          />

          <GlassCard variant="glow" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </ThemedText>
              <Pressable
                onPress={() => setIsModalOpen(false)}
                style={styles.closeBtn}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ✕
                </ThemedText>
              </Pressable>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Type selector chips */}
              <ThemedText type="smallBold" style={styles.inputSectionTitle}>
                Address Type
              </ThemedText>
              <View style={styles.labelChipsRow}>
                {(['Home', 'Work', 'Other'] as const).map((type) => {
                  const isSelected = label === type;
                  const iconInfo = getLabelIcon(type);

                  return (
                    <Pressable
                      key={type}
                      onPress={() => setLabel(type)}
                      style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[
                          styles.typeChip,
                          {
                            backgroundColor: isSelected
                              ? `${iconInfo.color}${isDark ? '30' : '18'}`
                              : isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : 'rgba(0, 0, 0, 0.05)',
                            borderColor: isSelected ? iconInfo.color : theme.glassBorder,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{
                            color: isSelected ? iconInfo.color : theme.text,
                            fontSize: 13,
                          }}>
                          {type}
                        </ThemedText>
                      </GlassView>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedInput
                label="Recipient Full Name"
                placeholder="e.g. Jane Doe"
                value={recipientName}
                onChangeText={setRecipientName}
              />

              <ThemedInput
                label="Phone Number"
                placeholder="e.g. +1 (555) 123-4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <ThemedInput
                label="Street Address"
                placeholder="e.g. 100 Main Street, Apt 4B"
                value={street}
                onChangeText={setStreet}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: Spacing.two }}>
                  <ThemedInput
                    label="City"
                    placeholder="e.g. San Jose"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={{ width: 90, marginRight: Spacing.two }}>
                  <ThemedInput
                    label="State"
                    placeholder="CA"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
                <View style={{ width: 100 }}>
                  <ThemedInput
                    label="ZIP"
                    placeholder="95128"
                    value={zipCode}
                    onChangeText={setZipCode}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Set as default checkbox */}
              <Pressable
                onPress={() => setIsDefault(!isDefault)}
                style={styles.defaultCheckboxRow}>
                <View
                  style={[
                    styles.checkboxBox,
                    {
                      borderColor: isDefault ? theme.primary : theme.textSecondary,
                      backgroundColor: isDefault ? theme.primary : 'transparent',
                    },
                  ]}>
                  {isDefault && (
                    <ThemedText style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>
                      ✓
                    </ThemedText>
                  )}
                </View>
                <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                  Set as default shipping address
                </ThemedText>
              </Pressable>

              <ThemedButton
                title={editingId ? 'Save Changes' : 'Save Address'}
                variant="gradient"
                gradientColors={Gradients.primary}
                onPress={handleSave}
                style={{ marginTop: Spacing.three, marginBottom: Spacing.four }}
              />
            </ScrollView>
          </GlassCard>
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
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  addHeaderBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  addHeaderBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  toastBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    alignItems: 'center',
  },
  toastText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 130, // Tab bar clearance
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: 60,
  },
  emptyIconCircle: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  emptyIconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
    maxWidth: 280,
  },
  addressList: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  addressCard: {
    padding: Spacing.four,
    borderRadius: 22,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  defaultChipWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  defaultChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  streetText: {
    fontSize: 15,
    marginBottom: 2,
  },
  cityStateZip: {
    fontSize: 13,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two + 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
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
  modalScroll: {
    maxHeight: 520,
  },
  inputSectionTitle: {
    fontSize: 13,
    marginBottom: Spacing.one,
  },
  labelChipsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  typeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  defaultCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: Spacing.two,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
