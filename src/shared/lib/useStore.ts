import { create } from 'zustand';

interface StoreState {
  // Selection
  activeBookId: string | null;
  activeCashBookId: string | null;
  roleOverride: 'owner' | 'editor' | 'viewer' | null;
  
  // Filters & Search
  searchQuery: string;
  typeFilter: 'all' | 'cash_in' | 'cash_out';
  categoryFilter: string;
  paymentMethodFilter: string;
  dateRange: { start: string; end: string };

  // Actions
  setActiveBookId: (id: string | null) => void;
  setActiveCashBookId: (id: string | null) => void;
  setRoleOverride: (role: 'owner' | 'editor' | 'viewer' | null) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: 'all' | 'cash_in' | 'cash_out') => void;
  setCategoryFilter: (cat: string) => void;
  setPaymentMethodFilter: (method: string) => void;
  setDateRange: (range: { start: string; end: string }) => void;
  resetFilters: () => void;
}

export const useStore = create<StoreState>((set) => ({
  activeBookId: null,
  activeCashBookId: null,
  roleOverride: null,

  searchQuery: '',
  typeFilter: 'all',
  categoryFilter: 'all',
  paymentMethodFilter: 'all',
  dateRange: { start: '', end: '' },

  setActiveBookId: (activeBookId) => set({ activeBookId, activeCashBookId: null }),
  setActiveCashBookId: (activeCashBookId) => set({ activeCashBookId }),
  setRoleOverride: (roleOverride) => set({ roleOverride }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setPaymentMethodFilter: (paymentMethodFilter) => set({ paymentMethodFilter }),
  setDateRange: (dateRange) => set({ dateRange }),
  resetFilters: () => set({
    searchQuery: '',
    typeFilter: 'all',
    categoryFilter: 'all',
    paymentMethodFilter: 'all',
    dateRange: { start: '', end: '' }
  })
}));
