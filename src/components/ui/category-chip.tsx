import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView, type SFSymbol, type AndroidSymbol } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface CategoryChipProps {
  title: string;
  icon?: SFSymbol;
  androidIcon?: AndroidSymbol;
  color?: string;
  isActive?: boolean;
  onPress: () => void;
}

export function CategoryChip({
  title,
  icon,
  androidIcon,
  color = '#6366f1',
  isActive = false,
  onPress,
}: CategoryChipProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const content = (
    <View style={styles.innerRow}>
      {icon ? (
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isActive
                ? 'rgba(255, 255, 255, 0.28)'
                : `${color}${isDark ? '25' : '16'}`,
            },
          ]}>
          <SymbolView
            tintColor={isActive ? '#ffffff' : color}
            name={{ ios: icon, android: androidIcon ?? 'category', web: androidIcon ?? 'category' }}
            size={16}
          />
        </View>
      ) : null}

      <ThemedText
        type="smallBold"
        style={[
          styles.label,
          {
            color: isActive ? '#ffffff' : theme.text,
            fontWeight: isActive ? '800' : '600',
          },
        ]}>
        {title}
      </ThemedText>
    </View>
  );

  if (isActive) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.activeChip,
          {
            backgroundColor: color,
            shadowColor: color,
          },
          pressed && styles.pressed,
        ]}>
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressed && styles.pressed,
      ]}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[
          styles.inactiveChip,
          {
            backgroundColor: isDark ? 'rgba(20, 26, 38, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)',
          },
        ]}>
        {content}
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeChip: {
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: 9,
    borderRadius: 24,
    marginRight: Spacing.two,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inactiveChip: {
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: Spacing.two,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'transform 0.15s ease, background-color 0.2s ease',
      } as any,
    }),
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.one,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
});
