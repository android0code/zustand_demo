/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#f1f5f9',
    backgroundSelected: '#e2e8f0',
    textSecondary: '#64748b',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(226, 232, 240, 0.85)',
    glassBackground: 'rgba(255, 255, 255, 0.78)',
    glassBorder: 'rgba(255, 255, 255, 0.85)',
    glassBorderHighlight: 'rgba(255, 255, 255, 0.95)',
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    surfaceElevated: '#ffffff',
    inputBackground: 'rgba(241, 245, 249, 0.85)',
    inputBorder: 'rgba(203, 213, 225, 0.7)',
    glowShadow: 'rgba(99, 102, 241, 0.15)',
  },
  dark: {
    text: '#f8fafc',
    background: '#0a0d14',
    backgroundElement: '#141923',
    backgroundSelected: '#1e2638',
    textSecondary: '#94a3b8',
    cardBackground: '#111520',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(18, 23, 34, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassBorderHighlight: 'rgba(255, 255, 255, 0.22)',
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    surfaceElevated: '#161b28',
    inputBackground: 'rgba(20, 25, 36, 0.85)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    glowShadow: 'rgba(99, 102, 241, 0.35)',
  },
} as const;

export const Gradients = {
  primary: ['#6366f1', '#8b5cf6'] as const,
  primaryAngle: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  aurora: ['#06b6d4', '#6366f1'] as const,
  auroraAngle: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
  sunset: ['#f43f5e', '#f59e0b'] as const,
  sunsetAngle: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)',
  emerald: ['#10b981', '#059669'] as const,
  emeraldAngle: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  neonPink: ['#ec4899', '#f43f5e'] as const,
  neonPinkAngle: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  electric: ['#3b82f6', '#8b5cf6'] as const,
  electricAngle: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  cardDark: 'linear-gradient(180deg, rgba(26, 32, 46, 0.82) 0%, rgba(14, 18, 27, 0.92) 100%)',
  cardLight: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(246, 248, 252, 0.88) 100%)',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1280;
