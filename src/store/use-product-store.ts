import { create } from 'zustand';
import { api, type Category, type Product } from '@/services/api';
import ecommerceData from '@/data/ecommerce-data.json';

export type ProductSortOption = 'popular' | 'price-asc' | 'price-desc' | 'rating';

export interface ProductState {
  categories: Category[];
  products: Product[];
  featuredProducts: Product[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  searchQuery: string;
  sortBy: ProductSortOption;
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  fetchProducts: (params?: { categoryId?: string; subcategoryId?: string; search?: string }) => Promise<void>;
  setSelectedCategory: (categoryId: string | null) => void;
  setSelectedSubcategory: (subcategoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: ProductSortOption) => void;
  getFilteredProducts: () => Product[];
}

const initialCategories = (ecommerceData.categories as Category[]) || [];
const initialProducts = (ecommerceData.products as Product[]) || [];
const initialFeatured = initialProducts.filter(
  (p) =>
    p.badge &&
    (p.badge.includes('OFF') ||
      p.badge === 'TOP PICK' ||
      p.badge === 'BESTSELLER' ||
      p.badge === 'HOT TEMPLATE' ||
      p.badge === 'STAFF PICK' ||
      p.badge === 'TRENDING' ||
      p.badge === 'EXPO SDK 57')
);

export const useProductStore = create<ProductState>((set, get) => ({
  categories: initialCategories,
  products: initialProducts,
  featuredProducts: initialFeatured,
  selectedCategory: null,
  selectedSubcategory: null,
  searchQuery: '',
  sortBy: 'popular',
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await api.getCategories();
      const featured = await api.getFeaturedProducts();
      set({ categories, featuredProducts: featured, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch categories', isLoading: false });
    }
  },

  fetchProducts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const categoryId = params?.categoryId ?? get().selectedCategory ?? undefined;
      const subcategoryId = params?.subcategoryId ?? get().selectedSubcategory ?? undefined;
      const search = params?.search ?? get().searchQuery;

      const products = await api.getProducts({
        categoryId,
        subcategoryId,
        search,
      });

      set({ products, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch products', isLoading: false });
    }
  },

  setSelectedCategory: (categoryId) => {
    set({ selectedCategory: categoryId, selectedSubcategory: null });
    get().fetchProducts({ categoryId: categoryId ?? undefined, subcategoryId: undefined });
  },

  setSelectedSubcategory: (subcategoryId) => {
    set({ selectedSubcategory: subcategoryId });
    get().fetchProducts({ subcategoryId: subcategoryId ?? undefined });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchProducts({ search: query });
  },

  setSortBy: (sort) => {
    set({ sortBy: sort });
  },

  getFilteredProducts: () => {
    const { products, sortBy } = get();
    const sorted = [...products];

    // Always sort live active products before coming soon products
    const liveFirst = (a: any, b: any) => {
      const aComing = a.status === 'coming_soon' || !a.inStock;
      const bComing = b.status === 'coming_soon' || !b.inStock;
      if (aComing !== bComing) {
        return aComing ? 1 : -1;
      }
      return 0;
    };

    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => liveFirst(a, b) || a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => liveFirst(a, b) || b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => liveFirst(a, b) || b.rating - a.rating);
      case 'popular':
      default:
        return sorted.sort((a, b) => liveFirst(a, b) || b.reviewsCount - a.reviewsCount);
    }
  },
}));
