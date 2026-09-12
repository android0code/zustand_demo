import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/store/use-theme-store';

export function useColorScheme(): 'light' | 'dark' {
  const themeMode = useThemeStore((state) => state.themeMode);
  const systemScheme = useRNColorScheme();

  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}
