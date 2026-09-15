import { create } from 'zustand';
import { api, triggerBrowserDownload, type Order } from '@/services/api';
import type { CartItem } from '@/store/use-cart-store';

export interface PlaceOrderOptions {
  items: CartItem[];
  shippingAddress?: string;
  customerEmail?: string;
  autoDownload?: boolean;
}

export interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  fetchOrders: () => Promise<void>;
  placeOrder: (options: PlaceOrderOptions | CartItem[], shippingAddress?: string) => Promise<{ success: boolean; order?: Order; error?: string }>;
  downloadOrderItem: (orderId: string, productId?: string) => boolean;
  cancelOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await api.getOrders();
      set({ orders, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch purchases', isLoading: false });
    }
  },

  placeOrder: async (optionsOrItems, legacyShippingAddress) => {
    let items: CartItem[];
    let shippingAddress = 'Instant Digital Delivery';
    let customerEmail = 'aa21pa-solutions@gmail.com';
    let autoDownload = true;

    if (Array.isArray(optionsOrItems)) {
      items = optionsOrItems;
      if (legacyShippingAddress) shippingAddress = legacyShippingAddress;
    } else {
      items = optionsOrItems.items;
      if (optionsOrItems.shippingAddress) shippingAddress = optionsOrItems.shippingAddress;
      if (optionsOrItems.customerEmail) customerEmail = optionsOrItems.customerEmail;
      if (optionsOrItems.autoDownload !== undefined) autoDownload = optionsOrItems.autoDownload;
    }

    if (items.length === 0) {
      return { success: false, error: 'Cannot checkout with an empty cart' };
    }

    set({ isLoading: true, error: null });
    try {
      const order = await api.createOrder({ items, shippingAddress, customerEmail });
      set((state) => ({
        orders: [order, ...state.orders],
        isLoading: false,
      }));

      // Automatically download each purchased digital item if requested
      if (autoDownload) {
        items.forEach((item, index) => {
          setTimeout(() => {
            triggerBrowserDownload(
              item.product.downloadFileName || `${item.product.name.replace(/\s+/g, '_')}.pdf`,
              item.product.downloadContent,
              item.product.downloadUrl
            );
          }, index * 400);
        });
      }

      return { success: true, order };
    } catch (err: any) {
      set({ error: err?.message || 'Failed to complete digital checkout', isLoading: false });
      return { success: false, error: err?.message || 'Failed to complete digital checkout' };
    }
  },

  downloadOrderItem: (orderId: string, productId?: string) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order || order.items.length === 0) return false;

    const targetItems = productId
      ? order.items.filter((i) => i.product.id === productId)
      : order.items;

    if (targetItems.length === 0) return false;

    targetItems.forEach((item, idx) => {
      setTimeout(() => {
        triggerBrowserDownload(
          item.product.downloadFileName || `${item.product.name.replace(/\s+/g, '_')}.pdf`,
          item.product.downloadContent,
          item.product.downloadUrl
        );
      }, idx * 300);
    });

    return true;
  },

  cancelOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'Cancelled' as const } : o
      ),
    }));
  },
}));
