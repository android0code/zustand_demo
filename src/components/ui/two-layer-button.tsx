import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlassView } from 'expo-glass-effect';

export interface TwoLayerButtonProps extends Omit<PressableProps, 'style'> {
  title?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  size?: 'small' | 'medium' | 'large' | 'icon';
  circular?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function TwoLayerButton({
  title,
  icon,
  accentColor,
  size = 'medium',
  circular = false,
  loading = false,
  disabled = false,
  style,
  innerStyle,
  textStyle,
  children,
  ...props
}: TwoLayerButtonProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeColor = accentColor || theme.primary;

  const isIconOnly = circular || size === 'icon' || (!title && !children && !!icon);

  const getBaseSize = () => {
    if (isIconOnly) {
      switch (size) {
        case 'small':
          return { width: 36, height: 36, borderRadius: 18, innerRadius: 16 };
        case 'large':
          return { width: 56, height: 56, borderRadius: 28, innerRadius: 26 };
        default:
          return { width: 48, height: 48, borderRadius: 24, innerRadius: 22 };
      }
    }

    switch (size) {
      case 'small':
        return { height: 40, borderRadius: 20, innerRadius: 18 };
      case 'large':
        return { height: 58, borderRadius: 29, innerRadius: 27 };
      default:
        return { height: 48, borderRadius: 24, innerRadius: 22 };
    }
  };

  const baseSize = getBaseSize();

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.outerBase,
        isDark ? styles.outerBaseDark : styles.outerBaseLight,
        {
          ...(isIconOnly ? { width: baseSize.width } : {}),
          height: baseSize.height,
          borderRadius: baseSize.borderRadius,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}>
      {/* Front / Upper Inset Layer with Native Glass Effect */}
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[
          styles.innerFront,
          isDark ? styles.innerFrontDark : styles.innerFrontLight,
          {
            borderRadius: baseSize.innerRadius,
            backgroundColor: isDark ? `${activeColor}22` : `${activeColor}14`,
            borderColor: isDark ? `${activeColor}40` : '#ffffff',
          },
          innerStyle,
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={activeColor} />
        ) : children ? (
          children
        ) : (
          <View style={styles.contentRow}>
            {icon ? <View style={title ? styles.iconMargin : undefined}>{icon}</View> : null}
            {title ? (
              <ThemedText
                type={size === 'small' ? 'smallBold' : 'default'}
                style={[styles.label, { color: activeColor }, textStyle]}>
                {title}
              </ThemedText>
            ) : null}
          </View>
        )}
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outerBase: {
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 2,
    borderWidth: 1,
  },
  outerBaseLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow:
          '0 8px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.9) inset',
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
        elevation: 4,
      },
      web: {
        boxShadow:
          '0 8px 24px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(255, 255, 255, 0.06) inset',
      } as any,
    }),
  },
  innerFront: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingHorizontal: Spacing.three,
  },
  innerFrontLight: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03) inset',
      } as any,
    }),
  },
  innerFrontDark: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(255, 255, 255, 0.05) inset',
      } as any,
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.2,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
