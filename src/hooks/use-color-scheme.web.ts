import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/store/use-theme-store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const themeMode = useThemeStore((state) => state.themeMode);
  const systemScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return 'light';
  }

  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}
