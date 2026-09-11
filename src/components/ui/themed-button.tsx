import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  View,
  Platform,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GradientView } from './gradient-view';

export interface ThemedButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient' | 'glass' | 'danger';
  gradientColors?: readonly [string, string, ...string[]] | string[];
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'small' | 'medium' | 'large';
}

export function ThemedButton({
  title,
  variant = 'primary',
  gradientColors,
  icon,
  loading = false,
  disabled,
  style,
  textStyle,
  size = 'medium',
  ...props
}: ThemedButtonProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isGradient = variant === 'gradient';
  const isGlass = variant === 'glass';
  const isDanger = variant === 'danger';

  const getInnerBackground = (pressed: boolean) => {
    if (disabled || loading) {
      return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
    }
    if (variant === 'primary') {
      return pressed
        ? isDark
          ? 'rgba(99, 102, 241, 0.32)'
          : 'rgba(99, 102, 241, 0.18)'
        : isDark
          ? 'rgba(99, 102, 241, 0.22)'
          : 'rgba(99, 102, 241, 0.1)';
    }
    if (variant === 'danger') {
      return pressed
        ? isDark
          ? 'rgba(239, 68, 68, 0.3)'
          : 'rgba(239, 68, 68, 0.2)'
        : isDark
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(239, 68, 68, 0.1)';
    }
    if (variant === 'secondary') {
      return pressed
        ? isDark
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(0, 0, 0, 0.08)'
        : isDark
          ? 'rgba(255, 255, 255, 0.07)'
          : 'rgba(0, 0, 0, 0.04)';
    }
    if (isGlass) {
      return pressed ? 'rgba(255, 255, 255, 0.2)' : theme.glassBackground;
    }
    return pressed ? 'rgba(0, 0, 0, 0.05)' : 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    if (isGradient) return '#ffffff';
    if (variant === 'primary') return theme.primary;
    if (variant === 'danger') return theme.danger;
    if (variant === 'outline') return theme.primary;
    return theme.text;
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { height: 40, borderRadius: 20, innerRadius: 18 };
      case 'large':
        return { height: 58, borderRadius: 29, innerRadius: 27 };
      default:
        return { height: 48, borderRadius: 24, innerRadius: 22 };
    }
  };

  const sizeConfig = getSizeConfig();

  const buttonContent = (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" style={styles.spinner} />
      ) : (
        <>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <ThemedText
            type={size === 'small' ? 'smallBold' : 'default'}
            style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </ThemedText>
        </>
      )}
    </View>
  );

  if (isGradient && !disabled && !loading) {
    const colors = gradientColors || Gradients.primary;
    return (
      <Pressable
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.outerBase,
          isDark ? styles.outerBaseDark : styles.outerBaseLight,
          {
            height: sizeConfig.height,
            borderRadius: sizeConfig.borderRadius,
          },
          pressed && styles.pressed,
          style,
        ]}
        {...props}>
        <View
          style={[
            styles.innerGradientWrapper,
            { borderRadius: sizeConfig.innerRadius },
          ]}>
          <GradientView
            colors={colors}
            direction="to-bottom-right"
            style={styles.gradientInner}>
            {buttonContent}
          </GradientView>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.outerBase,
        isDark ? styles.outerBaseDark : styles.outerBaseLight,
        {
          height: sizeConfig.height,
          borderRadius: sizeConfig.borderRadius,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}>
      {/* Front / Upper Inset Layer with Specular Highlight Rim */}
      <View
        style={[
          styles.innerFront,
          {
            borderRadius: sizeConfig.innerRadius,
            backgroundColor: getInnerBackground(false),
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#ffffff',
          },
          isGlass && styles.glassEffect,
        ]}>
        {buttonContent}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outerBase: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'stretch',
    borderWidth: 1,
  },
  outerBaseLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow:
          '0 6px 20px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(255, 255, 255, 0.9) inset',
      } as any,
    }),
  },
  outerBaseDark: {
    backgroundColor: '#141926',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow:
          '0 6px 20px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(255, 255, 255, 0.06) inset',
      } as any,
    }),
  },
  innerFront: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  innerGradientWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  gradientInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  glassEffect: {
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as any,
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  spinner: {
    paddingVertical: 2,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.2,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
