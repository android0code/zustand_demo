import React from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function WebFooter() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  return (
    <footer style={{ width: '100%' }}>
      <View
        style={[
          styles.outerContainer,
          {
            backgroundColor: isDark ? '#0c0f17' : '#f1f5f9',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
          },
        ]}>
        <View style={styles.innerContainer}>
          {/* Top Columns Grid */}
          <View style={[styles.columnsGrid, isMobile && styles.columnsGridMobile]}>
            {/* Column 1: Brand & Mission */}
            <View style={[styles.brandCol, isMobile && styles.colFull]}>
              <Pressable
                onPress={() => handleNavigate('/(dashboard)')}
                style={({ pressed }) => [styles.brandLogoRow, pressed && { opacity: 0.8 }]}>
                <View style={styles.logoIcon}>
                  <SymbolView
                    name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                    tintColor="#ffffff"
                    size={16}
                  />
                </View>
                <ThemedText style={styles.brandTitle}>aa21pa-</ThemedText>
                <View style={styles.digitalPill}>
                  <ThemedText style={styles.digitalPillText}>DIGITS</ThemedText>
                </View>
              </Pressable>

              <ThemedText type="small" themeColor="textSecondary" style={styles.brandDescription}>
                Curated digital PDF guides and handbooks. Instant browser download with secure Razorpay checkout.
              </ThemedText>

              {/* Security & Quality Trust Badges */}
              <View style={styles.trustBadgesRow}>
                <View
                  style={[
                    styles.trustBadge,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}>
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    tintColor="#0284c7"
                    size={11}
                  />
                  <ThemedText style={styles.trustBadgeText}>Razorpay 256-Bit SSL</ThemedText>
                </View>

                <View
                  style={[
                    styles.trustBadge,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}>
                  <SymbolView
                    name={{ ios: 'arrow.down.circle.fill', android: 'download', web: 'download' }}
                    tintColor="#6366f1"
                    size={11}
                  />
                  <ThemedText style={styles.trustBadgeText}>Instant PDF Download</ThemedText>
                </View>
              </View>
            </View>

            {/* Column 2: Legal Policies (Requested) */}
            <View style={[styles.linkCol, isMobile && styles.colHalf]}>
              <ThemedText type="smallBold" style={styles.colHeader}>
                LEGAL POLICIES
              </ThemedText>
              <View style={styles.linksList}>
                <Pressable
                  onPress={() => handleNavigate('/return-policy')}
                  style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLinkText}>
                    Return Policy
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => handleNavigate('/refund-policy')}
                  style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLinkText}>
                    Refund Policy
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => handleNavigate('/privacy-policy')}
                  style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLinkText}>
                    Privacy Policy
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => handleNavigate('/disclaimer')}
                  style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLinkText}>
                    Disclaimer
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Column 3: Company & Contact (Requested) */}
            <View style={[styles.linkCol, isMobile && styles.colHalf]}>
              <ThemedText type="smallBold" style={styles.colHeader}>
                SUPPORT & ABOUT
              </ThemedText>
              <View style={styles.linksList}>
                <Pressable
                  onPress={() => handleNavigate('/about-contact')}
                  style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLinkText}>
                    About & Contact
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => handleNavigate('/orders')}
                  style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLinkText}>
                    My Downloads & Keys
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => handleNavigate('/cart')}
                  style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLinkText}>
                    Cart & Checkout
                  </ThemedText>
                </Pressable>

                <View style={styles.supportContactPill}>
                  <SymbolView
                    name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                    tintColor={theme.primary}
                    size={11}
                  />
                  <ThemedText style={[styles.supportContactEmail, { color: theme.primary }]}>
                    aa21pa-solutions@gmail.com
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Divider */}
          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          />

          {/* Bottom Copyright Strip */}
          <View style={[styles.bottomStrip, isMobile && styles.bottomStripMobile]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.copyrightText}>
              © 2026 aa21pa-digits. All rights reserved.
            </ThemedText>

            <View style={styles.bottomMetaRow}>
              <View style={styles.statusLiveDot} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.bottomMetaText}>
                Razorpay Payments Live • DRM-Free PDF Edition
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </footer>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    borderTopWidth: 1,
    marginTop: Spacing.six,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
  },
  innerContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  columnsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 32,
    marginBottom: Spacing.four,
  },
  columnsGridMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  brandCol: {
    flex: 2,
    maxWidth: 420,
  },
  linkCol: {
    flex: 1,
    minWidth: 160,
  },
  colFull: {
    width: '100%',
    maxWidth: '100%',
  },
  colHalf: {
    width: '100%',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  digitalPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  digitalPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 0.6,
  },
  brandDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  colHeader: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  linksList: {
    gap: 10,
  },
  footerLink: {
    paddingVertical: 2,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  supportContactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  supportContactEmail: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  bottomStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  bottomStripMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  copyrightText: {
    fontSize: 12,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  bottomMetaText: {
    fontSize: 11,
  },
});
