import { create } from 'zustand';

export interface User {
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (name: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const registeredUsers: Record<string, User> = {};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
 
  login: async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return { success: false, error: 'Please enter email and password' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const existingUser = registeredUsers[trimmedEmail];
    let userName = existingUser?.name;
    if (!userName) {
      const extractedName = trimmedEmail.split('@')[0];
      userName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
    }

    const user: User = {
      name: userName,
      email: trimmedEmail,
    };
    registeredUsers[trimmedEmail] = user;

    set({ user });
    return { success: true };
  },

  signUp: async (name: string, email: string, password: string) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Please enter your name' };
    }
    if (!trimmedEmail || !password) {
      return { success: false, error: 'Please fill in all fields' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const user: User = {
      name: trimmedName,
      email: trimmedEmail,
    };
    registeredUsers[trimmedEmail] = user;

    set({ user });
    return { success: true };
  },

  updateProfile: async (name: string, password?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: 'Name cannot be empty' };
    }
    if (password && password.length > 0 && password.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    set((state) => {
      if (!state.user) return { user: null };
      const updatedUser = { ...state.user, name: trimmedName };
      registeredUsers[state.user.email] = updatedUser;
      return { user: updatedUser };
    });

    return { success: true };
  },

  logout: () => {
    set({ user: null });
  },
}));
