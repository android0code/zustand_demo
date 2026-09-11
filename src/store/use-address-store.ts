import { create } from 'zustand';

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  recipientName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

export interface AddressState {
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Omit<Address, 'id'>>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => Address | undefined;
}

const initialAddresses: Address[] = [
  {
    id: 'addr-1',
    label: 'Home',
    recipientName: 'Amrik Singh',
    street: '42 Silicon Boulevard, Apt 4B',
    city: 'San Jose',
    state: 'CA',
    zipCode: '95128',
    phone: '+1 (408) 555-0192',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Work',
    recipientName: 'Amrik Singh',
    street: '1600 Amphitheatre Parkway, Building 43',
    city: 'Mountain View',
    state: 'CA',
    zipCode: '94043',
    phone: '+1 (650) 253-0000',
    isDefault: false,
  },
];

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: initialAddresses,

  addAddress: (addressData) => {
    const newId = `addr-${Date.now()}`;
    set((state) => {
      let updated = state.addresses;
      if (addressData.isDefault || updated.length === 0) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }
      return {
        addresses: [
          ...updated,
          {
            ...addressData,
            id: newId,
            isDefault: addressData.isDefault || updated.length === 0,
          },
        ],
      };
    });
  },

  updateAddress: (id, addressData) => {
    set((state) => {
      let updated = [...state.addresses];
      if (addressData.isDefault) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }
      return {
        addresses: updated.map((a) => (a.id === id ? { ...a, ...addressData } : a)),
      };
    });
  },

  deleteAddress: (id) => {
    set((state) => {
      const filtered = state.addresses.filter((a) => a.id !== id);
      // If deleted address was default, set the first one as default
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      return { addresses: filtered };
    });
  },

  setDefaultAddress: (id) => {
    set((state) => ({
      addresses: state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    }));
  },

  getDefaultAddress: () => {
    const { addresses } = get();
    return addresses.find((a) => a.isDefault) || addresses[0];
  },
}));
