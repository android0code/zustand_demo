import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedButton } from '@/components/ui/themed-button';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientView } from '@/components/ui/gradient-view';
import { Spacing, MaxContentWidth, Gradients } from '@/constants/theme';
import { useAuthStore } from '@/store/use-auth-store';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Failed to sign in');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('shopper@happyexpo.dev');
    setPassword('password123');
    setError(null);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Decorative Aurora Glow Orbs */}
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Centered Aurora Glass Form Card with crisp white border */}
            <GlassCard
              variant="glow"
              style={[
                styles.authCard,
                { borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#ffffff' },
              ]}>
              {/* Brand Logo Emblem */}
              <View style={styles.logoContainer}>
                <GradientView
                  colors={Gradients.primary}
                  direction="to-bottom-right"
                  style={styles.logoCircle}>
                  <SymbolView
                    tintColor="#ffffff"
                    name={{ ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' }}
                    size={28}
                  />
                </GradientView>
              </View>

              {/* Header */}
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  Welcome Back
                </ThemedText>
                <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                  Sign in to explore curated products & deals
                </ThemedText>
              </View>

              {/* Demo Account Shortcut Chip */}
              <Pressable
                onPress={handleDemoFill}
                style={({ pressed }) => [
                  styles.demoChip,
                  {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                  },
                  pressed && { opacity: 0.8 },
                ]}>
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <ThemedText style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                  ⚡ Tap to Auto-fill Demo Account
                </ThemedText>
              </Pressable>

              {/* Error banner */}
              {error ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
                </View>
              ) : null}

              {/* Form */}
              <View style={styles.form}>
                <ThemedInput
                  label="Email"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <ThemedInput
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  isPassword
                  autoCapitalize="none"
                />

                <ThemedButton
                  title="Sign In to Shop"
                  variant="gradient"
                  gradientColors={Gradients.primary}
                  loading={loading}
                  onPress={handleLogin}
                  size="large"
                  style={styles.submitButton}
                />
              </View>

              {/* Footer / Switch to Sign Up */}
              <View style={styles.footer}>
                <ThemedText type="small" themeColor="textSecondary">
                  Don't have an account?{' '}
                </ThemedText>
                <Pressable onPress={() => router.push('/signup')}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    Sign Up
                  </ThemedText>
                </Pressable>
              </View>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    ...Platform.select({
      web: {
        filter: 'blur(70px)',
      } as any,
    }),
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    ...Platform.select({
      web: {
        filter: 'blur(70px)',
      } as any,
    }),
  },
  safeArea: {
    flex: 1,
    maxWidth: 480,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  authCard: {
    padding: Spacing.five,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow:
          '0 16px 40px rgba(99, 102, 241, 0.12), 0 2px 6px rgba(255, 255, 255, 0.9) inset',
      } as any,
    }),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
  },
  demoChip: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.four,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  errorBannerText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.four,
  },
  submitButton: {
    marginTop: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
