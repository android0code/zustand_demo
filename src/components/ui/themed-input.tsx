import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  Pressable,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
}

export function ThemedInput({
  label,
  error,
  isPassword = false,
  leftIcon,
  style,
  editable,
  ...rest
}: ThemedInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEditable = editable !== false;

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText type="smallBold" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error
              ? theme.danger
              : isFocused
              ? theme.primary
              : theme.inputBorder,
            opacity: isEditable ? 1 : 0.65,
          },
          isFocused && styles.focusedGlow,
        ]}>
        {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={theme.textSecondary}
          editable={isEditable}
          style={[
            styles.input,
            {
              color: theme.text,
            },
            style,
          ]}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.eyeButton}>
            <SymbolView
              tintColor={theme.textSecondary}
              name={{
                ios: showPassword ? 'eye.slash' : 'eye',
                android: showPassword ? 'visibility_off' : 'visibility',
                web: showPassword ? 'visibility_off' : 'visibility',
              }}
              size={18}
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.one,
    marginLeft: 2,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      } as any,
    }),
  },
  focusedGlow: {
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.22)',
      } as any,
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
  },
  leftIconWrapper: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
  },
  error: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 12,
  },
});
