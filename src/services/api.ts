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
}

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered';

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
}

export interface CreateOrderInput {
  items: { product: Product; quantity: number }[];
  shippingAddress: string;
}

// Initial mock orders to provide immediate rich history
const inMemoryOrders: Order[] = [
  {
    id: 'ORD-98421',
    date: 'Sep 02, 2026',
    items: [
      {
        product: ecommerceData.products[0] as Product,
        quantity: 1,
        unitPrice: ecommerceData.products[0].price,
      },
      {
        product: ecommerceData.products[3] as Product,
        quantity: 1,
        unitPrice: ecommerceData.products[3].price,
      },
    ],
    subtotal: 244.98,
    tax: 19.60,
    shipping: 0.00,
    total: 264.58,
    status: 'Delivered',
    shippingAddress: '42 Silicon Boulevard, San Jose, CA 95128',
  },
  {
    id: 'ORD-97514',
    date: 'Aug 24, 2026',
    items: [
      {
        product: ecommerceData.products[10] as Product,
        quantity: 1,
        unitPrice: ecommerceData.products[10].price,
      },
    ],
    subtotal: 79.99,
    tax: 6.40,
    shipping: 5.00,
    total: 91.39,
    status: 'Delivered',
    shippingAddress: '42 Silicon Boulevard, San Jose, CA 95128',
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
      (p) => p.badge && (p.badge.includes('OFF') || p.badge === 'TOP PICK' || p.badge === 'BESTSELLER')
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
    const shipping = subtotal > 100 ? 0 : 7.99;
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

    const newOrder: Order = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      date: dateStr,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      status: 'Processing',
      shippingAddress: input.shippingAddress || 'Default Shipping Address',
    };

    inMemoryOrders.unshift(newOrder);
    return newOrder;
  },
};
