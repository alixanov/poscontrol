import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  unit: string;
}

interface CartState {
  items: CartItem[];
  discountAmount: number;
  addItem: (product: {
    id: string;
    name: string;
    sku: string;
    barcode: string;
    salePrice: number;
    stockQuantity: number;
    unit?: string;
  }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountAmount: 0,

  addItem: (product) => {
    const items = get().items;
    const existingIndex = items.findIndex((i) => i.productId === product.id);

    if (existingIndex > -1) {
      const current = items[existingIndex];
      const newQty = current.quantity + 1;
      const updated = [...items];
      updated[existingIndex] = { ...current, quantity: newQty };
      set({ items: updated });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            price: product.salePrice,
            quantity: 1,
            stockQuantity: product.stockQuantity,
            unit: product.unit || 'шт',
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
      ),
    });
  },

  incrementQuantity: (productId) => {
    const item = get().items.find((i) => i.productId === productId);
    if (item) {
      get().updateQuantity(productId, item.quantity + 1);
    }
  },

  decrementQuantity: (productId) => {
    const item = get().items.find((i) => i.productId === productId);
    if (item) {
      get().updateQuantity(productId, item.quantity - 1);
    }
  },

  setDiscount: (discountAmount) => {
    set({ discountAmount: Math.max(0, discountAmount) });
  },

  clearCart: () => {
    set({ items: [], discountAmount: 0 });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotal: () => {
    const sub = get().getSubtotal();
    return Math.max(0, sub - get().discountAmount);
  },
}));
