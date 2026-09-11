import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

export type GradientDirection =
  | 'to-right'
  | 'to-bottom'
  | 'to-bottom-right'
  | 'to-top-right'
  | 'to-bottom-left';

export interface GradientViewProps extends ViewProps {
  colors: readonly [string, string, ...string[]] | string[];
  direction?: GradientDirection;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GradientView({
  colors,
  direction = 'to-bottom-right',
  children,
  style,
  ...props
}: GradientViewProps) {
  const getCssDirection = (dir: GradientDirection): string => {
    switch (dir) {
      case 'to-right':
        return 'to right';
      case 'to-bottom':
        return 'to bottom';
      case 'to-bottom-right':
        return '135deg';
      case 'to-top-right':
        return '45deg';
      case 'to-bottom-left':
        return '225deg';
      default:
        return '135deg';
    }
  };

  const cssDirection = getCssDirection(direction);
  const colorString = colors.join(', ');
  const linearGradientString = `linear-gradient(${cssDirection}, ${colorString})`;

  const gradientStyle: ViewStyle = Platform.select({
    web: {
      backgroundImage: linearGradientString,
      backgroundColor: colors[0],
    } as any,
    default: {
      backgroundColor: colors[0],
    },
  }) as ViewStyle;

  return (
    <View style={[styles.container, gradientStyle, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
