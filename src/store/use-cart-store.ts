import { create } from 'zustand';
import type { Product } from '@/services/api';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getShipping: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addToCart: (product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { items: updated };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getItemQuantity: (productId) => {
    const item = get().items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  },

  getTotalItems: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },

  getSubtotal: () => {
    const sum = get().items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    return Math.round(sum * 100) / 100;
  },

  getShipping: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal > 100 ? 0 : 7.99;
  },

  getTax: () => {
    const subtotal = get().getSubtotal();
    return Math.round(subtotal * 0.08 * 100) / 100;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    const shipping = get().getShipping();
    const tax = get().getTax();
    return Math.round((subtotal + shipping + tax) * 100) / 100;
  },
}));
