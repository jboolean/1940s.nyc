import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { MerchInternalVariant } from 'shared/utils/merch/Order';

export const CART_STORAGE_KEY = 'print-cart';
export const CART_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_CART_ITEMS = 20;
export const MAX_ITEM_QUANTITY = 10;

export interface CartItem {
  photoIdentifier: string;
  variant: MerchInternalVariant;
  colorize: boolean;
  quantity: number;
  // Shown for a print that is no longer offered, when its product label cannot be looked up.
  label?: string;
}

interface State {
  items: CartItem[];
  // When the cart last changed. A cart untouched for CART_LIFETIME_MS is dropped on load.
  savedAt: number;
  isOpen: boolean;
}

interface Actions {
  // Returns false, leaving the cart unchanged, when the item would not fit: the cart is full or
  // the line would go past the per-line quantity limit.
  addItem: (item: CartItem) => boolean;
  removeItem: (item: CartItem) => void;
  setQuantity: (item: CartItem, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

function isSameItem(a: CartItem, b: CartItem): boolean {
  return (
    a.photoIdentifier === b.photoIdentifier &&
    a.variant === b.variant &&
    a.colorize === b.colorize
  );
}

function isCartItem(value: unknown): value is CartItem {
  const item = value as Partial<CartItem> | null;
  return (
    !!item &&
    typeof item.photoIdentifier === 'string' &&
    typeof item.variant === 'string' &&
    typeof item.colorize === 'boolean' &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_ITEM_QUANTITY
  );
}

// Storage can be missing (privacy modes) or throw (quota, blocked cookies); the cart then
// simply lives in memory for the page.
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Ignored: see above.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignored: see above.
    }
  },
};

const usePrintCartStore = create(
  persist(
    immer<State & Actions>((set, get) => ({
      items: [],
      savedAt: 0,
      isOpen: false,

      addItem: (item) => {
        const existing = get().items.find((i) => isSameItem(i, item));
        if (!existing && get().items.length >= MAX_CART_ITEMS) return false;
        if (existing && existing.quantity + item.quantity > MAX_ITEM_QUANTITY) {
          return false;
        }
        set((draft) => {
          const match = draft.items.find((i) => isSameItem(i, item));
          if (match) {
            match.quantity += item.quantity;
          } else {
            draft.items.push({ ...item });
          }
          draft.savedAt = Date.now();
        });
        return true;
      },

      removeItem: (item) => {
        set((draft) => {
          draft.items = draft.items.filter((i) => !isSameItem(i, item));
          draft.savedAt = Date.now();
        });
      },

      setQuantity: (item, quantity) => {
        set((draft) => {
          const match = draft.items.find((i) => isSameItem(i, item));
          if (match) {
            match.quantity = Math.min(
              MAX_ITEM_QUANTITY,
              Math.max(1, Math.floor(quantity))
            );
            draft.savedAt = Date.now();
          }
        });
      },

      clear: () => {
        set((draft) => {
          draft.items = [];
          draft.savedAt = Date.now();
          draft.isOpen = false;
        });
      },

      open: () => {
        set((draft) => {
          draft.isOpen = true;
        });
      },

      close: () => {
        set((draft) => {
          draft.isOpen = false;
        });
      },
    })),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ items, savedAt }) => ({ items, savedAt }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<State> | null;
        if (
          !saved ||
          typeof saved.savedAt !== 'number' ||
          !Array.isArray(saved.items) ||
          Date.now() - saved.savedAt > CART_LIFETIME_MS
        ) {
          return current;
        }
        return {
          ...current,
          items: saved.items.filter(isCartItem).slice(0, MAX_CART_ITEMS),
          savedAt: saved.savedAt,
        };
      },
    }
  )
);

export default usePrintCartStore;
