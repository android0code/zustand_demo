import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';

import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCartStore } from '@/store/use-cart-store';
import { useProductStore } from '@/store/use-product-store';

export function WebNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isTablet = width >= 640 && width < 860;

  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const selectedCategory = useProductStore((s) => s.selectedCategory);
  const setSelectedCategory = useProductStore((s) => s.setSelectedCategory);
  const searchQuery = useProductStore((s) => s.searchQuery);
  const setSearchQuery = useProductStore((s) => s.setSearchQuery);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const categories = [
    { id: null, label: 'All E-Books', isLive: true },
    { id: 'ebooks', label: 'E-Books', isLive: true },
    { id: 'templates', label: 'Templates', isComingSoon: true },
    { id: 'uikits', label: 'UI Kits', isComingSoon: true },
    { id: 'tools', label: 'Tools', isComingSoon: true },
  ];

  const handleCategoryPress = (catId: string | null) => {
    setSelectedCategory(catId);
    if (pathname !== '/' && pathname !== '/(dashboard)') {
      router.push('/(dashboard)');
    }
  };

  const handleLogoPress = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    router.push('/(dashboard)');
  };

  const isCurrentRoute = (route: string) => {
    if (route === 'orders') return pathname.includes('orders');
    if (route === 'cart') return pathname.includes('cart');
    if (route === 'about') return pathname.includes('about-contact');
    return false;
  };

  return (
    <header style={{ width: '100%', zIndex: 999 }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(10, 13, 20, 0.88)' : 'rgba(255, 255, 255, 0.88)',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
          },
        ]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.innerContent}>
          {/* Brand Logo & Tagline */}
          <Pressable
            onPress={handleLogoPress}
            style={({ pressed }) => [styles.logoButton, pressed && styles.pressedOpacity]}>
            <View style={[styles.logoIconWrapper, { backgroundColor: '#6366f1' }]}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                tintColor="#ffffff"
                size={18}
              />
            </View>
            <View>
              <View style={styles.logoTitleRow}>
                <Text style={[styles.brandTitle, { color: theme.text }]}>aa21pa-</Text>
                <View style={styles.digitalTag}>
                  <Text style={styles.digitalTagText}>DIGITS</Text>
                </View>
              </View>
              <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
                PDF E-Books Store
              </Text>
            </View>
          </Pressable>

          {/* Desktop Category Navigation */}
          {isDesktop && (
            <nav aria-label="Main Navigation" style={{ display: 'flex', alignItems: 'center' }}>
              <View style={styles.navLinksRow}>
                {categories.map((cat) => {
                  const isActive =
                    (cat.id === null && selectedCategory === null) ||
                    cat.id === selectedCategory;
                  return (
                    <Pressable
                      key={cat.label}
                      onPress={() => handleCategoryPress(cat.id)}
                      style={({ pressed }) => [
                        styles.navLink,
                        isActive && [
                          styles.navLinkActive,
                          {
                            backgroundColor: isDark
                              ? 'rgba(99, 102, 241, 0.2)'
                              : 'rgba(99, 102, 241, 0.12)',
                          },
                        ],
                        pressed && styles.pressedOpacity,
                      ]}>
                      <View style={styles.navLinkContent}>
                        <Text
                          style={[
                            styles.navLinkText,
                            {
                              color: isActive
                                ? isDark
                                  ? '#a5b4fc'
                                  : '#4f46e5'
                                : theme.textSecondary,
                              fontWeight: isActive ? '700' : '500',
                            },
                          ]}>
                          {cat.label}
                        </Text>
                        {cat.isComingSoon && (
                          <View
                            style={[
                              styles.soonBadge,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.06)',
                                borderColor: isDark
                                  ? 'rgba(255, 255, 255, 0.12)'
                                  : 'rgba(0, 0, 0, 0.08)',
                              },
                            ]}>
                            <Text
                              style={[
                                styles.soonBadgeText,
                                { color: isDark ? '#94a3b8' : '#64748b' },
                              ]}>
                              SOON
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </nav>
          )}

          {/* Search bar on Desktop / Large screens */}
          {(isDesktop || (isTablet && isSearchExpanded)) && (
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: isDark ? 'rgba(20, 25, 36, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(203, 213, 225, 0.7)',
                },
              ]}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                tintColor={theme.textSecondary}
                size={16}
              />
              <TextInput
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  if (pathname !== '/' && pathname !== '/(dashboard)') {
                    router.push('/(dashboard)');
                  }
                }}
                placeholder="Search e-books..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                    tintColor={theme.textSecondary}
                    size={16}
                  />
                </Pressable>
              )}
            </View>
          )}

          {/* Right Action Icons & Badges */}
          <View style={styles.actionsRow}>
            {/* Mobile Search Toggle */}
            {!isDesktop && (
              <Pressable
                onPress={() => setIsSearchExpanded((prev) => !prev)}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                  pressed && styles.pressedOpacity,
                ]}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  tintColor={theme.text}
                  size={19}
                />
              </Pressable>
            )}

            {/* My Downloads Button */}
            <Pressable
              onPress={() => router.push('/(dashboard)/orders')}
              style={({ pressed }) => [
                styles.actionBtnWithLabel,
                isCurrentRoute('orders') && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.22)'
                    : 'rgba(99, 102, 241, 0.12)',
                  borderColor: isDark ? '#6366f1' : '#4f46e5',
                },
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)',
                },
                pressed && styles.pressedOpacity,
              ]}>
              <SymbolView
                name={{
                  ios: 'arrow.down.circle.fill',
                  android: 'download_for_offline',
                  web: 'download',
                }}
                tintColor={isDark ? '#818cf8' : '#4f46e5'}
                size={18}
              />
              {isDesktop && (
                <Text
                  style={[
                    styles.actionBtnText,
                    {
                      color: isCurrentRoute('orders')
                        ? isDark
                          ? '#a5b4fc'
                          : '#4f46e5'
                        : theme.text,
                    },
                  ]}>
                  My Downloads
                </Text>
              )}
            </Pressable>

            {/* Contact & About Button */}
            <Pressable
              onPress={() => router.push('/(dashboard)/about-contact')}
              style={({ pressed }) => [
                styles.actionBtnWithLabel,
                isCurrentRoute('about') && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.22)'
                    : 'rgba(99, 102, 241, 0.12)',
                  borderColor: isDark ? '#6366f1' : '#4f46e5',
                },
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)',
                },
                pressed && styles.pressedOpacity,
              ]}>
              <SymbolView
                name={{
                  ios: 'envelope.fill',
                  android: 'mail',
                  web: 'mail',
                }}
                tintColor={isDark ? '#38bdf8' : '#0284c7'}
                size={18}
              />
              {isDesktop && (
                <Text
                  style={[
                    styles.actionBtnText,
                    {
                      color: isCurrentRoute('about')
                        ? isDark
                          ? '#a5b4fc'
                          : '#4f46e5'
                        : theme.text,
                    },
                  ]}>
                  About & Contact
                </Text>
              )}
            </Pressable>

            {/* Cart Button with Reactive Badge */}
            <Pressable
              onPress={() => router.push('/(dashboard)/cart')}
              style={({ pressed }) => [
                styles.cartButton,
                isCurrentRoute('cart') && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.25)'
                    : 'rgba(99, 102, 241, 0.15)',
                  borderColor: isDark ? '#6366f1' : '#4f46e5',
                },
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)',
                },
                pressed && styles.pressedOpacity,
              ]}>
              <View style={styles.cartIconContainer}>
                <SymbolView
                  name={{ ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' }}
                  tintColor={theme.text}
                  size={19}
                />
                {totalCartItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {totalCartItems > 99 ? '99+' : totalCartItems}
                    </Text>
                  </View>
                )}
              </View>
              {isDesktop && (
                <Text
                  style={[
                    styles.actionBtnText,
                    {
                      color: isCurrentRoute('cart')
                        ? isDark
                          ? '#a5b4fc'
                          : '#4f46e5'
                        : theme.text,
                    },
                  ]}>
                  Cart
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Expanded search for mobile/tablet */}
        {!isDesktop && isSearchExpanded && (
          <View
            style={[
              styles.mobileSearchRow,
              {
                borderTopColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(226, 232, 240, 0.8)',
              },
            ]}>
            <View
              style={[
                styles.searchContainerMobile,
                {
                  backgroundColor: isDark
                    ? 'rgba(20, 25, 36, 0.9)'
                    : 'rgba(241, 245, 249, 0.9)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(203, 213, 225, 0.7)',
                },
              ]}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                tintColor={theme.textSecondary}
                size={16}
              />
              <TextInput
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  if (pathname !== '/' && pathname !== '/(dashboard)') {
                    router.push('/(dashboard)');
                  }
                }}
                placeholder="Search e-books, templates, tools..."
                placeholderTextColor={theme.textSecondary}
                autoFocus
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                    tintColor={theme.textSecondary}
                    size={16}
                  />
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </header>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
    backdropFilter: 'blur(20px)',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
      } as any,
    }),
  },
  innerContent: {
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  logoIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  digitalTag: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  digitalTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLink: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    transitionDuration: '150ms',
  } as any,
  navLinkActive: {
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  navLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLinkText: {
    fontSize: 13,
  },
  soonBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  soonBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  searchContainer: {
    width: 175,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    flexShrink: 0,
  },
  mobileSearchRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  searchContainerMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
    outlineStyle: 'none',
  } as any,
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cartIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: '#f43f5e',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  pressedOpacity: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
