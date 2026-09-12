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

export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signUp(name.trim(), email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Failed to create account');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
                  colors={Gradients.aurora}
                  direction="to-bottom-right"
                  style={styles.logoCircle}>
                  <SymbolView
                    tintColor="#ffffff"
                    name={{ ios: 'person.crop.circle.fill.badge.plus', android: 'person_add', web: 'person_add' }}
                    size={28}
                  />
                </GradientView>
              </View>

              {/* Header */}
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  Create Account
                </ThemedText>
                <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                  Join HappyExpo to unlock exclusive member perks
                </ThemedText>
              </View>

              {/* Error banner */}
              {error ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
                </View>
              ) : null}

              {/* Form */}
              <View style={styles.form}>
                <ThemedInput
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError(null);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />

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
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  isPassword
                  autoCapitalize="none"
                />

                <ThemedButton
                  title="Create My Account"
                  variant="gradient"
                  gradientColors={Gradients.aurora}
                  loading={loading}
                  onPress={handleSignUp}
                  size="large"
                  style={styles.submitButton}
                />
              </View>

              {/* Footer / Switch to Sign In */}
              <View style={styles.footer}>
                <ThemedText type="small" themeColor="textSecondary">
                  Already have an account?{' '}
                </ThemedText>
                <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    Sign In
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
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
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
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
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
        shadowColor: '#06b6d4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow:
          '0 16px 40px rgba(6, 182, 212, 0.12), 0 2px 6px rgba(255, 255, 255, 0.9) inset',
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
    shadowColor: '#06b6d4',
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
