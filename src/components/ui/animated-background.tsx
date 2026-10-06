import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function AnimatedBackground() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // On native, just render a subtle gradient overlay
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Large floating orb - top right */}
      <View
        style={[
          styles.orb,
          styles.orb1,
          {
            backgroundColor: isDark
              ? 'rgba(99, 102, 241, 0.08)'
              : 'rgba(99, 102, 241, 0.06)',
          },
        ]}
      />
      {/* Medium floating orb - bottom left */}
      <View
        style={[
          styles.orb,
          styles.orb2,
          {
            backgroundColor: isDark
              ? 'rgba(139, 92, 246, 0.06)'
              : 'rgba(139, 92, 246, 0.04)',
          },
        ]}
      />
      {/* Small floating orb - center */}
      <View
        style={[
          styles.orb,
          styles.orb3,
          {
            backgroundColor: isDark
              ? 'rgba(6, 182, 212, 0.05)'
              : 'rgba(6, 182, 212, 0.03)',
          },
        ]}
      />
      {/* Accent orb - top left */}
      <View
        style={[
          styles.orb,
          styles.orb4,
          {
            backgroundColor: isDark
              ? 'rgba(236, 72, 153, 0.04)'
              : 'rgba(236, 72, 153, 0.03)',
          },
        ]}
      />
      {/* Grid overlay for depth */}
      <View
        style={[
          styles.gridOverlay,
          {
            opacity: isDark ? 0.03 : 0.02,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: 0,
  } as any,
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
        willChange: 'transform',
      } as any,
    }),
  },
  orb1: {
    width: 600,
    height: 600,
    top: -100,
    right: -150,
    ...Platform.select({
      web: {
        animationKeyframes: 'float1',
        animationDuration: '20s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      } as any,
    }),
  },
  orb2: {
    width: 500,
    height: 500,
    bottom: -100,
    left: -100,
    ...Platform.select({
      web: {
        animationKeyframes: 'float2',
        animationDuration: '25s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      } as any,
    }),
  },
  orb3: {
    width: 400,
    height: 400,
    top: '40%',
    left: '30%',
    ...Platform.select({
      web: {
        animationKeyframes: 'float3',
        animationDuration: '18s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      } as any,
    }),
  } as any,
  orb4: {
    width: 350,
    height: 350,
    top: '10%',
    left: -80,
    ...Platform.select({
      web: {
        animationKeyframes: 'float4',
        animationDuration: '22s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      } as any,
    }),
  } as any,
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    ...Platform.select({
      web: {
        backgroundImage:
          'linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      } as any,
    }),
  },
});
