import { Platform } from 'react-native';
import ecommerceData from '@/data/ecommerce-data.json';
import type { SFSymbol, AndroidSymbol } from 'expo-symbols';

export interface Subcategory {
  id: string;
  name: string;
  icon: SFSymbol;
  androidIcon: AndroidSymbol;
}

export interface Category {
  id: string;
  name: string;
  icon: SFSymbol;
  androidIcon: AndroidSymbol;
  color: string;
  description: string;
  status?: 'live' | 'coming_soon';
  subcategories: Subcategory[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  subcategoryId: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  badge?: string;
  colorAccent: string;
  specs: string[];
  description: string;
  bonus?: string;
  image?: string;
  downloadUrl?: string;
  fileFormat: string;
  fileSize: string;
  version: string;
  license: string;
  downloadFileName: string;
  downloadContent?: string;
  status?: 'live' | 'coming_soon';
}

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'Processing' | 'Completed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  customerEmail?: string;
  licenseKey?: string;
  rewardCouponCode?: string;
}

export interface CreateOrderInput {
  items: { product: Product; quantity: number }[];
  shippingAddress?: string;
  customerEmail?: string;
  licenseKey?: string;
  rewardCouponCode?: string;
}

// Browser download helper for digital goods
export function triggerBrowserDownload(
  filename: string,
  content?: string,
  downloadUrl?: string
): boolean {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      if (downloadUrl) {
        const fileUrl =
          downloadUrl.startsWith('http') || downloadUrl.startsWith('/')
            ? downloadUrl
            : `/${downloadUrl}`;
        fetch(fileUrl)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
          })
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
          })
          .catch((err) => {
            console.warn('Direct blob fetch failed, falling back to anchor click:', err);
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
        return true;
      }

      const payload =
        content ||
        `AA21PA-DIGITS ASSETS\n=====================\nFile: ${filename}\nDate: ${new Date().toISOString()}\nLicense: AA21PA-LIC-${Math.random()
          .toString(36)
          .substring(2, 9)
          .toUpperCase()}\n\nThank you for purchasing on aa21pa-digits!\nSupport: aa21pa-solutions@gmail.com\n`;
      const mimeType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
      const blob = new Blob([payload], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      return true;
    } catch (e) {
      console.warn('Failed to trigger browser download', e);
      return false;
    }
  }
  return false;
}

// Initial mock orders to provide immediate rich history of purchased digital goods
const inMemoryOrders: Order[] = [
  {
    id: 'ORD-89421',
    date: 'Sep 10, 2026',
    items: [
      {
        product: ecommerceData.products[0] as Product,
        quantity: 1,
        unitPrice: ecommerceData.products[0].price,
      },
    ],
    subtotal: 2.99,
    tax: 0.24,
    shipping: 0.00,
    total: 3.23,
    status: 'Completed',
    shippingAddress: 'Digital Delivery to aa21pa-solutions@gmail.com',
    customerEmail: 'aa21pa-solutions@gmail.com',
    licenseKey: 'AA21PA-AI-89K2-PRO',
    rewardCouponCode: 'NEXTFREE-89K2',
  },
  {
    id: 'ORD-87514',
    date: 'Sep 04, 2026',
    items: [
      {
        product: ecommerceData.products[0] as Product,
        quantity: 1,
        unitPrice: ecommerceData.products[0].price,
      },
    ],
    subtotal: 2.99,
    tax: 0.24,
    shipping: 0.00,
    total: 3.23,
    status: 'Completed',
    shippingAddress: 'Digital Delivery to aa21pa-solutions@gmail.com',
    customerEmail: 'aa21pa-solutions@gmail.com',
    licenseKey: 'AA21PA-AI-44B1-GUIDE',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async getCategories(): Promise<Category[]> {
    await delay(120);
    return ecommerceData.categories as Category[];
  },

  async getProducts(filter?: {
    categoryId?: string;
    subcategoryId?: string;
    search?: string;
  }): Promise<Product[]> {
    await delay(150);
    let items = ecommerceData.products as Product[];

    if (filter?.categoryId) {
      items = items.filter((item) => item.categoryId === filter.categoryId);
    }
    if (filter?.subcategoryId) {
      items = items.filter((item) => item.subcategoryId === filter.subcategoryId);
    }
    if (filter?.search && filter.search.trim().length > 0) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.fileFormat.toLowerCase().includes(q) ||
          item.specs.some((spec) => spec.toLowerCase().includes(q))
      );
    }

    return items;
  },

  async getProductById(id: string): Promise<Product | null> {
    await delay(100);
    const found = (ecommerceData.products as Product[]).find((p) => p.id === id);
    return found ?? null;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    await delay(120);
    return (ecommerceData.products as Product[]).filter(
      (p) => p.badge && (p.badge.includes('OFF') || p.badge === 'BESTSELLER' || p.badge === 'HOT TEMPLATE' || p.badge === 'STAFF PICK')
    );
  },

  async getOrders(): Promise<Order[]> {
    await delay(100);
    return [...inMemoryOrders];
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    await delay(250);

    const subtotal = input.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const shipping = 0.00; // Instant digital download delivery
    const total = Math.round((subtotal + tax + shipping) * 100) / 100;

    const orderItems: OrderItem[] = input.items.map((i) => ({
      product: i.product,
      quantity: i.quantity,
      unitPrice: i.product.price,
    }));

    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedLicense =
      input.licenseKey || `AA21PA-${dateStr.slice(-4)}-${randHex}-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalItemCount = input.items.reduce((acc, i) => acc + i.quantity, 0);
    const generatedRewardCoupon =
      input.rewardCouponCode ||
      (totalItemCount >= 2 ? `NEXTFREE-${randHex}` : undefined);

    const newOrder: Order = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      date: dateStr,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      status: 'Completed',
      shippingAddress: input.shippingAddress || (input.customerEmail ? `Instant delivery to ${input.customerEmail}` : 'Instant Digital Delivery'),
      customerEmail: input.customerEmail || 'aa21pa-solutions@gmail.com',
      licenseKey: generatedLicense,
      rewardCouponCode: generatedRewardCoupon,
    };

    inMemoryOrders.unshift(newOrder);
    return newOrder;
  },
};
