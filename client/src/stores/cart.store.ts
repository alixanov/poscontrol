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

export interface StockWarning {
  productId: string;
  message: string;
}

interface CartState {
  items: CartItem[];
  discountAmount: number;
  stockWarning: StockWarning | null;
  setStockWarning: (warning: StockWarning | null) => void;
  addItem: (
    product: {
      id: string;
      name: string;
      sku: string;
      barcode: string;
      salePrice: number;
      stockQuantity: number;
      unit?: string;
    },
    lang?: 'uz' | 'ru',
  ) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, lang?: 'uz' | 'ru') => void;
  incrementQuantity: (productId: string, lang?: 'uz' | 'ru') => boolean;
  decrementQuantity: (productId: string) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountAmount: 0,
  stockWarning: null,

  setStockWarning: (warning) => {
    set({ stockWarning: warning });
  },

  addItem: (product, lang = 'uz') => {
    const items = get().items;
    const existingIndex = items.findIndex((i) => i.productId === product.id);
    const maxStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 999999;

    // Hard block: Out of stock completely
    if (maxStock <= 0) {
      set({
        stockWarning: {
          productId: product.id,
          message:
            lang === 'uz'
              ? `"${product.name}" omborda mavjud emas (0 dona)!`
              : `Товара "${product.name}" нет в наличии на складе (0 шт)!`,
        },
      });
      return false;
    }

    if (existingIndex > -1) {
      const current = items[existingIndex];
      // Hard block: Already reached maximum available stock
      if (current.quantity >= maxStock) {
        set({
          stockWarning: {
            productId: product.id,
            message:
              lang === 'uz'
                ? `"${product.name}" dan omborda faqat ${maxStock} dona mavjud! Boshqa qo'shib bo'lmaydi.`
                : `На складе доступно только ${maxStock} шт товара "${product.name}"! Больше добавить нельзя.`,
          },
        });
        return false;
      }

      const newQty = Math.min(current.quantity + 1, maxStock);
      const updated = [...items];
      updated[existingIndex] = { ...current, quantity: newQty, stockQuantity: maxStock };
      set({ items: updated, stockWarning: null });
      return true;
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
            stockQuantity: maxStock,
            unit: product.unit || 'шт',
          },
        ],
        stockWarning: null,
      });
      return true;
    }
  },

  removeItem: (productId) => {
    const curWarning = get().stockWarning;
    const nextWarning = curWarning?.productId === productId ? null : curWarning;
    set({
      items: get().items.filter((i) => i.productId !== productId),
      stockWarning: nextWarning,
    });
  },

  updateQuantity: (productId, quantity, lang = 'uz') => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const item = get().items.find((i) => i.productId === productId);
    if (!item) return;

    let targetQty = quantity;
    let warning: StockWarning | null = null;

    if (targetQty > item.stockQuantity) {
      targetQty = item.stockQuantity;
      warning = {
        productId,
        message:
          lang === 'uz'
            ? `"${item.name}" dan omborda faqat ${item.stockQuantity} dona mavjud! Miqdor ${item.stockQuantity} ga tenglashtirildi.`
            : `На складе доступно только ${item.stockQuantity} шт товара "${item.name}"! Количество ограничено ${item.stockQuantity}.`,
      };
    }

    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: targetQty } : i,
      ),
      stockWarning: warning || get().stockWarning,
    });
  },

  incrementQuantity: (productId, lang = 'uz') => {
    const item = get().items.find((i) => i.productId === productId);
    if (!item) return false;

    if (item.quantity >= item.stockQuantity) {
      set({
        stockWarning: {
          productId,
          message:
            lang === 'uz'
              ? `"${item.name}" dan omborda faqat ${item.stockQuantity} dona mavjud! Boshqa qo'shib bo'lmaydi.`
              : `На складе доступно только ${item.stockQuantity} шт товара "${item.name}"! Больше добавить нельзя.`,
        },
      });
      return false;
    }

    get().updateQuantity(productId, item.quantity + 1, lang);
    return true;
  },

  decrementQuantity: (productId) => {
    const item = get().items.find((i) => i.productId === productId);
    if (item) {
      if (get().stockWarning?.productId === productId) {
        set({ stockWarning: null });
      }
      get().updateQuantity(productId, item.quantity - 1);
    }
  },

  setDiscount: (discountAmount) => {
    set({ discountAmount: Math.max(0, discountAmount) });
  },

  clearCart: () => {
    set({ items: [], discountAmount: 0, stockWarning: null });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotal: () => {
    const sub = get().getSubtotal();
    return Math.max(0, sub - get().discountAmount);
  },
}));
