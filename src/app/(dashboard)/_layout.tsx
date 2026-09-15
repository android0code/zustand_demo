import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { WebNavBar } from '@/components/ui/web-nav-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DashboardLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0a0d14' : '#f8fafc' }]}>
      <Tabs
        screenOptions={{
          headerShown: true,
          header: () => <WebNavBar />,
          tabBarStyle: { display: 'none' }, // Completely remove bottom tab bar as requested
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Digital Storefront',
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart & Checkout',
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'My Downloads & Licenses',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Account Settings',
          }}
        />
        {/* Hidden deep navigation screens */}
        <Tabs.Screen
          name="subcategory"
          options={{
            href: null,
            title: 'Category',
          }}
        />
        <Tabs.Screen
          name="addresses"
          options={{
            href: null,
            title: 'Digital Delivery Addresses',
          }}
        />
        <Tabs.Screen
          name="policy"
          options={{
            href: null,
            title: 'Legal & Policies',
          }}
        />
        <Tabs.Screen
          name="return-policy"
          options={{
            href: null,
            title: 'Return Policy',
          }}
        />
        <Tabs.Screen
          name="refund-policy"
          options={{
            href: null,
            title: 'Refund Policy',
          }}
        />
        <Tabs.Screen
          name="privacy-policy"
          options={{
            href: null,
            title: 'Privacy Policy',
          }}
        />
        <Tabs.Screen
          name="disclaimer"
          options={{
            href: null,
            title: 'Disclaimer',
          }}
        />
        <Tabs.Screen
          name="about-contact"
          options={{
            href: null,
            title: 'About & Contact',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
