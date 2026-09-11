import { create } from 'zustand';
import { api, type Category, type Product } from '@/services/api';

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

export const useProductStore = create<ProductState>((set, get) => ({
  categories: [],
  products: [],
  featuredProducts: [],
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

    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'popular':
      default:
        return sorted.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }
  },
}));
