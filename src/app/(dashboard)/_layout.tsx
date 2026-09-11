import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCartStore } from '@/store/use-cart-store';

import type { ComponentProps } from 'react';

interface TabItemConfig {
  name: string;
  label: string;
  icon: ComponentProps<typeof SymbolView>['name'];
}

const TABS_CONFIG: TabItemConfig[] = [
  {
    name: 'index',
    label: 'Shop',
    icon: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' },
  },
  {
    name: 'cart',
    label: 'Cart',
    icon: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' },
  },
  {
    name: 'orders',
    label: 'Orders',
    icon: { ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' },
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: { ios: 'person.fill', android: 'person', web: 'person' },
  },
];

function SegmentedCapsuleTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const totalCartItems = useCartStore((s) => s.getTotalItems());

  const currentRoute = state.routes[state.index]?.name || 'index';

  // Map sub-routes to parent tab
  const activeTabName =
    currentRoute === 'subcategory'
      ? 'index'
      : currentRoute === 'addresses'
        ? 'profile'
        : currentRoute;

  // Vibrant purple matching the user's reference image
  const activeColor = isDark ? '#c084fc' : '#9333ea';
  // Black/dark slate for inactive tabs matching the dumbbell icon in the user's reference
  const inactiveColor = isDark ? '#94a3b8' : '#18181b';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarWrapper,
        {
          bottom: Math.max(insets.bottom, Platform.select({ ios: 20, android: 14, default: 16 })),
        },
      ]}>
      {/* Outer shadow container - prevents clipping artifacts on iOS */}
      <View
        style={[
          styles.capsuleShadow,
          isDark ? styles.capsuleShadowDark : styles.capsuleShadowLight,
        ]}>
        {/* Inner container with full radius for all round back side */}
        <View
          style={[
            styles.capsuleContainer,
            isDark ? styles.capsuleDark : styles.capsuleLight,
          ]}>
          {Platform.OS === 'ios' && (
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}

          {TABS_CONFIG.map((tab) => {
            const isFocused = activeTabName === tab.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: tab.name,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            };

            return (
              <Pressable
                key={tab.name}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={tab.label}
                style={({ pressed }) => [
                  styles.tabItem,
                  pressed && styles.tabItemPressed,
                ]}>
                <View
                  style={[
                    styles.tabItemInner,
                    isFocused
                      ? (isDark ? styles.selectedPillDark : styles.selectedPillLight)
                      : styles.normalPill,
                  ]}>
                  <View style={styles.iconContainer}>
                    <SymbolView
                      tintColor={isFocused ? activeColor : inactiveColor}
                      name={tab.icon}
                      size={22}
                    />
                    {tab.name === 'cart' && totalCartItems > 0 && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: '#f43f5e',
                            borderColor: isFocused
                              ? (isDark ? '#222938' : '#ffffff')
                              : (isDark ? '#141824' : '#ffffff'),
                          },
                        ]}>
                        <Text style={styles.badgeText}>
                          {totalCartItems > 99 ? '99+' : totalCartItems}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabLabel,
                      {
                        color: isFocused ? activeColor : inactiveColor,
                        fontWeight: isFocused ? '700' : '600',
                      },
                    ]}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function DashboardLayout() {
  return (
    <Tabs
      tabBar={(props) => <SegmentedCapsuleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      {/* Hidden deep navigation screens */}
      <Tabs.Screen
        name="subcategory"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="addresses"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  capsuleShadow: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 34,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
      } as any,
    }),
  },
  capsuleShadowLight: {},
  capsuleShadowDark: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.45,
      },
      web: {
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
      } as any,
    }),
  },
  capsuleContainer: {
    width: '100%',
    height: 64,
    borderRadius: 34,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  capsuleLight: {
    backgroundColor: '#f8f8fb',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  capsuleDark: {
    backgroundColor: '#141824',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  tabItemPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  tabItemInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  selectedPillLight: {
    // Fully rounded elevated white pill for all selected tabs
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow:
          '0 2px 8px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(255, 255, 255, 0.9) inset',
      } as any,
    }),
  },
  selectedPillDark: {
    backgroundColor: '#1c2230',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow:
          '0 2px 8px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(255, 255, 255, 0.06) inset',
      } as any,
    }),
  },
  normalPill: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
});
