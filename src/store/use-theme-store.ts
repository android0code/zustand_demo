import { create } from 'zustand';
import { Appearance } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'system',

  setThemeMode: (mode: ThemeMode) => {
    try {
      if (mode === 'system') {
        Appearance.setColorScheme('unspecified');
      } else {
        Appearance.setColorScheme(mode);
      }
    } catch {
      // Appearance.setColorScheme might not be supported on all web environments
    }
    set({ themeMode: mode });
  },

  toggleTheme: () => {
    const currentMode = get().themeMode;
    const nextMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
    get().setThemeMode(nextMode);
  },
}));
