import { create } from 'zustand';
import { api, type Order } from '@/services/api';
import type { CartItem } from '@/store/use-cart-store';

export interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  fetchOrders: () => Promise<void>;
  placeOrder: (items: CartItem[], shippingAddress: string) => Promise<{ success: boolean; order?: Order; error?: string }>;
  cancelOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await api.getOrders();
      set({ orders, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch orders', isLoading: false });
    }
  },

  placeOrder: async (items, shippingAddress) => {
    if (items.length === 0) {
      return { success: false, error: 'Cannot checkout with an empty cart' };
    }

    set({ isLoading: true, error: null });
    try {
      const order = await api.createOrder({ items, shippingAddress });
      set((state) => ({
        orders: [order, ...state.orders],
        isLoading: false,
      }));
      return { success: true, order };
    } catch (err: any) {
      set({ error: err?.message || 'Failed to place order', isLoading: false });
      return { success: false, error: err?.message || 'Failed to place order' };
    }
  },

  cancelOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'Processing' as const } : o
      ),
    }));
  },
}));
