import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { GlassView, type GlassStyle } from 'expo-glass-effect';

import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface GlassCardProps extends ViewProps {
  children?: React.ReactNode;
  variant?: 'regular' | 'clear' | 'glow' | 'accent';
  accentColor?: string;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  glassStyle?: GlassStyle;
}

export function GlassCard({
  children,
  variant = 'regular',
  accentColor,
  elevated = true,
  style,
  glassStyle = 'regular',
  ...props
}: GlassCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBorderColor = () => {
    if (accentColor) {
      return accentColor + (isDark ? '40' : '30');
    }
    if (variant === 'glow') {
      return isDark ? 'rgba(255, 255, 255, 0.25)' : '#ffffff';
    }
    return theme.glassBorder;
  };

  const getBackgroundColor = () => {
    if (accentColor) {
      return isDark ? `${accentColor}18` : `${accentColor}10`;
    }
    if (variant === 'clear') {
      return isDark ? 'rgba(18, 23, 34, 0.45)' : 'rgba(255, 255, 255, 0.55)';
    }
    return theme.glassBackground;
  };

  const dynamicCardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: variant === 'glow' ? 2 : 1,
    borderTopWidth: variant === 'glow' ? 2 : 1.5,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: accentColor || (isDark ? '#000000' : 'rgba(99, 102, 241, 0.08)'),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 24,
    elevation: elevated ? 8 : 2,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        ...(elevated ? {
          boxShadow: isDark
            ? '0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(255, 255, 255, 0.04) inset'
            : '0 10px 28px rgba(148, 163, 184, 0.22), 0 2px 6px rgba(255, 255, 255, 0.8) inset',
        } : {})
      } as any,
    }),
  };

  // On iOS, wrap in GlassView from expo-glass-effect for real native blur
  if (Platform.OS === 'ios') {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        colorScheme={isDark ? 'dark' : 'light'}
        style={[styles.container, dynamicCardStyle, style]}
        {...props}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.container, dynamicCardStyle, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
