import { create } from 'zustand';
import type { Product } from '@/services/api';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountPercent: number;

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; error?: string };
  removeCoupon: () => void;

  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getShipping: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  couponCode: null,
  discountPercent: 0,

  addToCart: (product, quantity = 1) => {
    if (product.status === 'coming_soon' || !product.inStock) return;
    const qtyToAdd = Math.max(1, quantity);
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd,
        };
        return { items: updated };
      }
      return { items: [...state.items, { product, quantity: qtyToAdd }] };
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
    set({ items: [], couponCode: null, discountPercent: 0 });
  },

  applyCoupon: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Please enter a coupon code' };
    }
    if (cleanCode.startsWith('NEXTFREE') || cleanCode.startsWith('FREE1') || cleanCode === 'NEXT1FREE') {
      set({ couponCode: cleanCode, discountPercent: 100 });
      return { success: true };
    }
    if (cleanCode === 'BUY2GET1' || cleanCode === 'BUY2FREE1' || cleanCode === 'B2G1') {
      set({ couponCode: cleanCode, discountPercent: 33.33 });
      return { success: true };
    }
    if (cleanCode === 'DIGIT50' || cleanCode === 'AA21PA50' || cleanCode === 'AURORA50') {
      set({ couponCode: cleanCode, discountPercent: 50 });
      return { success: true };
    }
    if (cleanCode === 'WELCOME10') {
      set({ couponCode: cleanCode, discountPercent: 10 });
      return { success: true };
    }
    return { success: false, error: 'Invalid coupon code. Try "NEXTFREE" or "DIGIT50"' };
  },

  removeCoupon: () => {
    set({ couponCode: null, discountPercent: 0 });
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

  getDiscount: () => {
    const { couponCode, discountPercent, items } = get();
    if (couponCode && (couponCode.startsWith('NEXTFREE') || couponCode.startsWith('FREE1') || couponCode === 'NEXT1FREE')) {
      const unitPrices: number[] = [];
      items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          unitPrices.push(item.product.price);
        }
      });
      if (unitPrices.length > 0) {
        unitPrices.sort((a, b) => a - b);
        // Make 1 product completely free
        return Math.round(unitPrices[0] * 100) / 100;
      }
      return 0;
    }
    if (couponCode === 'BUY2GET1' || couponCode === 'BUY2FREE1' || couponCode === 'B2G1') {
      const totalItems = get().getTotalItems();
      if (totalItems >= 3) {
        // Find lowest priced item in the cart and make it completely free
        const unitPrices: number[] = [];
        items.forEach((item) => {
          for (let i = 0; i < item.quantity; i++) {
            unitPrices.push(item.product.price);
          }
        });
        unitPrices.sort((a, b) => a - b);
        const freeCount = Math.floor(totalItems / 3);
        const freeAmount = unitPrices.slice(0, freeCount).reduce((acc, p) => acc + p, 0);
        return Math.round(freeAmount * 100) / 100;
      } else if (totalItems === 2) {
        // Special 33.33% bundle saving if 2 items in cart
        const subtotal = get().getSubtotal();
        return Math.round(((subtotal * 33.33) / 100) * 100) / 100;
      }
    }
    if (discountPercent === 0) return 0;
    const subtotal = get().getSubtotal();
    return Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  },

  getShipping: () => {
    return 0; // Instant digital download delivery
  },

  getTax: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    const taxableAmount = Math.max(0, subtotal - discount);
    return Math.round(taxableAmount * 0.08 * 100) / 100;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    const discount = get().getDiscount();
    const shipping = get().getShipping();
    const tax = get().getTax();
    const total = Math.max(0, subtotal - discount + shipping + tax);
    return Math.round(total * 100) / 100;
  },
}));
