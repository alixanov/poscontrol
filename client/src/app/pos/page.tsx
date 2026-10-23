'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useTranslation } from '@/stores/language.store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Printer,
  LogOut,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Wifi,
  WifiOff,
  UserCheck,
  UserPlus,
  Gift,
  FileText,
  Keyboard,
} from 'lucide-react';

export default function PosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { t, language } = useTranslation();
  const {
    items: cartItems,
    addItem,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    setDiscount,
    discountAmount,
    getSubtotal,
    getTotal,
    stockWarning,
    setStockWarning,
  } = useCartStore();

  useEffect(() => {
    if (stockWarning) {
      const timer = setTimeout(() => {
        setStockWarning(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [stockWarning, setStockWarning]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Shift Modals
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [startingCash, setStartingCash] = useState(5000);
  const [actualCash, setActualCash] = useState(0);

  // Customer Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('+998');
  const [newCustomerDiscount, setNewCustomerDiscount] = useState<number>(0);
  const [newCustomerNotes, setNewCustomerNotes] = useState('');
  const [useCashback, setUseCashback] = useState<boolean>(false);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Completed Receipt Modal
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Online / Offline Detection
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const pingInterval = setInterval(async () => {
      try {
        await api.get('/pos/shift/active');
        setIsOnline(true);
      } catch {
        if (!navigator.onLine) setIsOnline(false);
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, []);

  // Fetch active shift
  const { data: activeShift, isLoading: shiftLoading, refetch: refetchShift } = useQuery({
    queryKey: ['active-shift'],
    queryFn: async () => {
      const res = await api.get('/pos/shift/active');
      return res.data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', search, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  // Customer search query
  const { data: customerSearchResults, isLoading: customerSearchLoading } = useQuery({
    queryKey: ['customers-search', customerSearchQuery],
    queryFn: async () => {
      if (!customerSearchQuery || customerSearchQuery.trim().length < 2) return [];
      const res = await api.get(`/customers/search?q=${encodeURIComponent(customerSearchQuery.trim())}`);
      return res.data;
    },
    enabled: isCustomerModalOpen && customerSearchQuery.trim().length >= 2,
  });

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/customers', {
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        discountPercent: Number(newCustomerDiscount) || 0,
        notes: newCustomerNotes.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (newCust) => {
      setSelectedCustomer(newCust);
      setIsNewCustomerModalOpen(false);
      setIsCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('+998');
      setNewCustomerDiscount(0);
      setNewCustomerNotes('');
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // Total and discount calculations
  const subtotal = getSubtotal();
  const customerDiscountPercent = selectedCustomer?.discountPercent || 0;
  const customerDiscountAmount = customerDiscountPercent > 0 ? Math.round((subtotal * customerDiscountPercent) / 100) : 0;
  const totalDiscount = (discountAmount || 0) + customerDiscountAmount;
  const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);

  const maxAvailableCashback = selectedCustomer ? Math.min(selectedCustomer.cashbackBalance || 0, subtotalAfterDiscount) : 0;
  const appliedCashback = useCashback ? maxAvailableCashback : 0;
  const totalAmount = Math.max(0, subtotalAfterDiscount - appliedCashback);
  const potentialCashbackEarned = selectedCustomer ? Math.round(totalAmount * 0.01) : 0;
  const changeDue = Math.max(0, (cashReceived || 0) - totalAmount);

  // Global Barcode Scanner Listener and POS Hotkeys
  const scannerBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // F2: Focus search anytime
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isPaymentModalOpen) setIsPaymentModalOpen(false);
        else if (isCustomerModalOpen) setIsCustomerModalOpen(false);
        else if (isNewCustomerModalOpen) setIsNewCustomerModalOpen(false);
        else if (lastOrder) setLastOrder(null);
        return;
      }

      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      // F4: Pay Cash
      if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        if (cartItems.length > 0 && activeShift) {
          setPaymentError(null);
          setPaymentMethod('CASH');
          setCashReceived(totalAmount);
          setIsPaymentModalOpen(true);
        }
        return;
      }

      // F8: Pay Card
      if (e.key === 'F8' && !isInput) {
        e.preventDefault();
        if (cartItems.length > 0 && activeShift) {
          setPaymentError(null);
          setPaymentMethod('CARD');
          setCashReceived(totalAmount);
          setIsPaymentModalOpen(true);
        }
        return;
      }

      // Space: Confirm Payment when modal open
      if (e.key === ' ' && isPaymentModalOpen && !isInput) {
        e.preventDefault();
        checkoutMutation.mutate();
        return;
      }

      if (isInput) return;

      if (e.key === 'Enter') {
        if (scannerBuffer.current.length >= 4) {
          const scannedCode = scannerBuffer.current.trim();
          scannerBuffer.current = '';
          handleScanBarcode(scannedCode);
        }
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime.current > 100) {
        scannerBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        scannerBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, activeShift, isPaymentModalOpen, isCustomerModalOpen, isNewCustomerModalOpen, lastOrder, totalAmount]);

  const handleScanBarcode = async (code: string) => {
    try {
      const res = await api.get(`/products/barcode/${code.trim()}`);
      if (res.data) {
        addItem(res.data, language);
      }
    } catch (err: any) {
      alert(`Товар со штрихкодом "${code}" не найден`);
    }
  };

  const handleBarcodeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleScanBarcode(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  // Open Shift Mutation
  const openShiftMutation = useMutation({
    mutationFn: async () => {
      return api.post('/pos/shift/open', { startingCash });
    },
    onSuccess: () => {
      refetchShift();
      setIsOpenShiftModalOpen(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Ошибка открытия смены');
    },
  });

  // Close Shift Mutation
  const closeShiftMutation = useMutation({
    mutationFn: async () => {
      return api.post('/pos/shift/close', { actualCash });
    },
    onSuccess: () => {
      refetchShift();
      setIsCloseShiftModalOpen(false);
      clearCart();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Ошибка закрытия смены');
    },
  });

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        discountAmount: totalDiscount,
        paymentMethod,
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        useCashback: appliedCashback > 0 ? appliedCashback : undefined,
      };

      if (paymentMethod === 'CASH') {
        payload.cashReceived = cashReceived || totalAmount;
      }

      const res = await api.post('/pos/orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setLastOrder(data);
      clearCart();
      setSelectedCustomer(null);
      setUseCashback(false);
      setIsPaymentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
    onError: (err: any) => {
      setPaymentError(err.response?.data?.message || 'Ошибка проведения оплаты');
    },
  });

  const openPaymentModal = () => {
    if (cartItems.length === 0) return;
    setPaymentError(null);
    setPaymentMethod('CASH');
    setCashReceived(totalAmount);
    setIsPaymentModalOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handlePrintEscPos = (order: any) => {
    if (!order) return;
    const line = '------------------------------------------\n';
    const dline = '==========================================\n';
    let text = '';
    text += '          ' + (t.common.appName || 'POS CONTROL') + '\n';
    text += '          ' + (t.pos.receiptTitle || 'SAVDO CHEKI') + '\n';
    text += dline;
    text += `${t.pos.receiptNo}: ${order.orderNumber}\n`;
    text += `Sana: ${new Date(order.createdAt).toLocaleString()}\n`;
    text += `Kassir: ${order.cashier?.name || user?.name || 'Kassir'}\n`;
    if (order.customer) {
      text += `Mijoz: ${order.customer.name} (${order.customer.phone})\n`;
    }
    text += line;
    text += 'Nomi                Soni   Narx     Jami\n';
    text += line;
    for (const item of order.items || []) {
      const name = (item.productName || item.product?.name || 'Tovar').padEnd(18).slice(0, 18);
      const qty = String(item.quantity).padStart(4);
      const price = String(Math.round(item.price)).padStart(8);
      const tot = String(Math.round(item.total || item.quantity * item.price)).padStart(9);
      text += `${name} ${qty} ${price} ${tot}\n`;
    }
    text += line;
    text += `Oraliq summa:           ${formatCurrency(order.subtotal)}\n`;
    if (order.discountAmount > 0) {
      text += `Chegirma:              -${formatCurrency(order.discountAmount)}\n`;
    }
    if (order.customerCashbackUsed > 0) {
      text += `Ishlatilgan keshbek:   -${formatCurrency(order.customerCashbackUsed)}\n`;
    }
    text += dline;
    text += `JAMI TO'LOV:            ${formatCurrency(order.totalAmount)}\n`;
    text += dline;
    text += `To'lov turi:            ${order.paymentMethod === 'CARD' ? (t.pos.card || 'Plastik karta') : (t.pos.cash || 'Naqd pul')}\n`;
    if (order.cashReceived) {
      text += `Qabul qilindi:          ${formatCurrency(order.cashReceived)}\n`;
    }
    if (order.changeGiven) {
      text += `Qaytim:                 ${formatCurrency(order.changeGiven)}\n`;
    }
    if (order.customerCashbackEarned > 0) {
      text += `Hisoblangan keshbek:   +${formatCurrency(order.customerCashbackEarned)}\n`;
    }
    text += '\n      XARIDINGIZ UCHUN RAXMAT!\n';
    text += '        Yana tashrif buyuring!\n\n\n';

    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ESC/POS Receipt - ${order.orderNumber}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 12px; color: #000; width: 300px; }
              pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
              @media print {
                @page { margin: 0; size: 58mm auto; }
                body { width: 100%; padding: 0; }
              }
            </style>
          </head>
          <body>
            <pre>${text}</pre>
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none transition-colors duration-200">
      {/* Top POS Header */}
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 py-2 sm:py-0 shadow-sm gap-2">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Store className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">{t.pos.title}</span>
              {activeShift ? (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  {t.pos.shiftActive} (№{activeShift.shiftNumber})
                </span>
              ) : (
                <span className="rounded-full bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-800 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:text-red-400">
                  {t.pos.shiftClosed}
                </span>
              )}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t.pos.cashierLabel}: <strong className="text-slate-700 dark:text-slate-300">{user?.name}</strong>
              {activeShift && (
                <span className="ml-1.5 sm:ml-2">
                  • <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatCurrency(activeShift.expectedCash)}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Network Connection Status */}
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-800/80 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden md:inline">{t.pos.statusOnline}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-400 animate-pulse">
              <WifiOff className="h-3.5 w-3.5" />
              <span>{t.pos.statusOffline}</span>
            </span>
          )}

          {/* Hotkey Chips Strip */}
          <div className="hidden xl:flex items-center gap-2 border-l border-r border-slate-200 dark:border-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">F2</kbd>
              <span>{t.pos.hotkeySearch?.replace('F2 ', '') || 'Qidiruv'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">F4</kbd>
              <span>{t.pos.hotkeyCash?.replace('F4 ', '') || 'Naqd'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">F8</kbd>
              <span>{t.pos.hotkeyCard?.replace('F8 ', '') || 'Karta'}</span>
            </span>
          </div>

          <ThemeToggle />
          <LanguageSwitcher showIcon />

          {!activeShift ? (
            <button
              type="button"
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="rounded-xl bg-emerald-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-emerald-700 transition"
            >
              {t.pos.openShift}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActualCash(activeShift.expectedCash || 0);
                setIsCloseShiftModalOpen(true);
              }}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition"
            >
              {t.pos.closeShift}
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t.pos.adminReturn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            title={t.nav.logout}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile Mode Tab Switcher (Visible on < lg screens) */}
      <div className="flex lg:hidden shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 gap-2">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
            mobileTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>{language === 'uz' ? 'Katalog' : 'Каталог'}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition relative ${
            mobileTab === 'cart'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{language === 'uz' ? 'Savatcha' : 'Корзина'}</span>
          {cartItems.length > 0 && (
            <span className="rounded-full bg-emerald-500 text-white px-1.5 py-0.2 text-[10px] font-extrabold ml-1">
              {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
          {cartItems.length > 0 && (
            <span className="font-mono text-[11px] ml-1 opacity-90 hidden sm:inline">
              • {formatCurrency(getTotal())}
            </span>
          )}
        </button>
      </div>

      {/* Main Working Area: Split 65% Catalog / 35% Active Cart on desktop, tabbed on mobile */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column: Fast Product Search & Grid */}
        <div className={`flex flex-1 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 sm:p-4 overflow-hidden ${
          mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Barcode scanner input + Text search */}
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <form onSubmit={handleBarcodeFormSubmit} className="relative flex-1">
              <Barcode className="absolute left-3.5 top-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={t.pos.searchPlaceholder}
                className="w-full rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/40 bg-white dark:bg-slate-900 py-2.5 pl-11 pr-4 text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
            </form>

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.products.searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.pos.allCategories}
            </button>
            {categories?.map((c: any) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {productsLoading ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                {t.common.loading}
              </div>
            ) : productsData?.data?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {productsData.data.map((p: any) => {
                  const inCartItem = cartItems.find((i) => i.productId === p.id);
                  const inCartQty = inCartItem?.quantity || 0;
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isMaxInCart = inCartQty >= p.stockQuantity && p.stockQuantity > 0;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addItem(p, language)}
                      className={`group relative flex flex-col rounded-2xl border bg-white dark:bg-slate-900 p-3 text-left shadow-sm transition active:scale-[0.98] ${
                        isOutOfStock
                          ? 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                          : isMaxInCart
                          ? 'border-amber-300 dark:border-amber-700 hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500'
                          : inCartQty > 0
                          ? 'border-blue-400 dark:border-blue-600 ring-1 ring-blue-400 dark:ring-blue-600 hover:shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                            }}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        ) : null}
                        <div className={`flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600 ${p.imageUrl ? 'hidden' : ''}`}>
                          <Store className="h-8 w-8" />
                        </div>

                        {/* Stock Badge */}
                        <span className={`absolute bottom-1.5 right-1.5 rounded-lg px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                          isOutOfStock
                            ? 'bg-rose-600/90 text-white'
                            : 'bg-black/60 text-white'
                        }`}>
                          {p.stockQuantity} {p.unit || t.pos.itemCount}
                        </span>

                        {/* In Cart Indicator */}
                        {inCartQty > 0 && (
                          <span className={`absolute top-1.5 left-1.5 rounded-lg px-2 py-0.5 text-[10px] font-extrabold shadow-sm backdrop-blur-sm flex items-center gap-1 ${
                            isMaxInCart
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}>
                            <span>{inCartQty} / {p.stockQuantity}</span>
                            {isMaxInCart && <span>{language === 'uz' ? '• Maks' : '• Макс'}</span>}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {p.barcode}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {formatCurrency(p.salePrice)}
                        </span>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                          isMaxInCart
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                        }`}>
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                {t.common.notFound}
              </div>
            )}
          </div>

          {/* Mobile Quick Cart Floating Bar */}
          {cartItems.length > 0 && mobileTab === 'catalog' && (
            <div className="lg:hidden absolute bottom-3 left-3 right-3 z-30">
              <button
                type="button"
                onClick={() => setMobileTab('cart')}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 font-bold active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="h-5 w-5" />
                  <span>
                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)} {language === 'uz' ? 'ta tovar' : 'товаров'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-mono font-extrabold">{formatCurrency(getTotal())}</span>
                  <span className="text-xs bg-white/20 rounded-lg px-2.5 py-1 flex items-center gap-1">
                    {language === 'uz' ? 'To‘lov' : 'К оплате'} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Active Cart & Checkout */}
        <div className={`flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl ${
          mobileTab === 'catalog' ? 'hidden lg:flex w-full lg:w-96 shrink-0' : 'flex w-full lg:w-96 shrink-0'
        }`}>
          {/* Cart Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5">
            <div className="flex items-center gap-2">
              {/* Mobile Return to Catalog Button */}
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mr-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title={language === 'uz' ? 'Katalogga qaytish' : 'Вернуться в каталог'}
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-900 dark:text-white">{t.pos.cartTitle}</span>
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t.pos.clearCart}
              </button>
            )}
          </div>

          {/* Stock Warning Banner */}
          {stockWarning ? (
            <div key="pos-stock-warning-banner" className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="leading-snug">{stockWarning.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setStockWarning(null)}
                className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300 shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          {/* Customer Loyalty Selector Pill */}
          <div className="px-4 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/80">
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-2.5 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shrink-0 shadow-sm">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {selectedCustomer.name}
                      </span>
                      {selectedCustomer.discountPercent > 0 && (
                        <span className="rounded bg-purple-100 dark:bg-purple-900/80 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-700 dark:text-purple-300">
                          -{selectedCustomer.discountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-300 font-mono mt-0.5">
                      {selectedCustomer.phone} • {t.pos.cashbackBalance}: <strong>{formatCurrency(selectedCustomer.cashbackBalance || 0)}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCustomer(null); setUseCashback(false); }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 hover:text-red-500 transition"
                  title={t.common.delete}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="w-full flex items-center justify-between rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  {t.pos.selectCustomer}
                </span>
                <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                  + {t.pos.customer}
                </span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-4">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                <ShoppingCart className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t.pos.emptyCart}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  {t.pos.emptyCartHint}
                </p>
              </div>
            ) : (
              cartItems.map((item) => {
                const isAtMaxStock = item.quantity >= item.stockQuantity;

                return (
                  <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        {isAtMaxStock && (
                          <span className="shrink-0 text-[9px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                            {language === 'uz' ? 'MAKS' : 'МАКС'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                        <span>{formatCurrency(item.price)} × {item.quantity} {item.unit || t.pos.itemCount}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className={isAtMaxStock ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                          {language === 'uz' ? `Omborda: ${item.stockQuantity}` : `Доступно: ${item.stockQuantity}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => decrementQuantity(item.productId)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className={`w-8 text-center text-xs font-bold ${
                        isAtMaxStock ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-900 dark:text-white'
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isAtMaxStock}
                        onClick={() => incrementQuantity(item.productId, language)}
                        title={isAtMaxStock ? (language === 'uz' ? "Maksimal qoldiqqa yetdi" : "Достигнут максимум на складе") : ""}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Summary & Checkout Action */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-3">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{t.pos.subtotal}:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(subtotal)}</span>
            </div>

            {/* Manual Discount */}
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>{t.pos.discount}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 px-2 text-right text-xs font-bold text-red-600 dark:text-red-400 outline-none"
                />
              </div>
            </div>

            {/* Customer Discount & Cashback Options */}
            {selectedCustomer && (
              <div className="space-y-1.5 pt-1 border-t border-dashed border-purple-200 dark:border-purple-800/80">
                {customerDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    <span>{t.pos.customerDiscount} (-{selectedCustomer.discountPercent}%):</span>
                    <span>-{formatCurrency(customerDiscountAmount)}</span>
                  </div>
                )}
                {selectedCustomer.cashbackBalance > 0 && subtotalAfterDiscount > 0 && (
                  <label className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 cursor-pointer">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                      <Gift className="h-3.5 w-3.5 text-purple-500" />
                      {t.pos.useCashback} ({formatCurrency(maxAvailableCashback)})
                    </span>
                    <input
                      type="checkbox"
                      checked={useCashback}
                      onChange={(e) => setUseCashback(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                )}
                {potentialCashbackEarned > 0 && (
                  <div className="flex justify-between items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>{t.pos.cashbackEarned} (+1%):</span>
                    <span>+{formatCurrency(potentialCashbackEarned)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{t.pos.totalToPay}:</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0 || !activeShift}
              onClick={openPaymentModal}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-5 w-5" />
              <span>{t.pos.payButton} ({formatCurrency(totalAmount)})</span>
            </button>

            {!activeShift && (
              <p className="text-center text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                ⚠️ {t.pos.noActiveShiftWarning}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Payment Checkout Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.pos.totalToPay}</h2>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                {paymentError}
              </div>
            )}

            {/* Total due display */}
            <div className="mb-5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 p-4 text-center border border-blue-100 dark:border-blue-900/60">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t.pos.totalToPay}
              </span>
              <div className="text-3xl font-black text-blue-900 dark:text-blue-300 mt-0.5">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            {/* Payment method selector */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 text-sm font-bold border-2 transition ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.pos.cash}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 text-sm font-bold border-2 transition ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>{t.pos.card}</span>
              </button>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.pos.cashReceived}
                  </label>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-xl font-black text-slate-900 dark:text-white outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex gap-2 flex-wrap">
                  {[10000, 20000, 50000, 100000, 200000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setCashReceived(nominal)}
                      className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                    >
                      {formatCurrency(nominal)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashReceived(totalAmount)}
                    className="rounded-xl bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition active:scale-95"
                  >
                    {t.pos.exactAmount}
                  </button>
                </div>

                {/* Change amount */}
                <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.pos.change}:</span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={
                  checkoutMutation.isPending ||
                  (paymentMethod === 'CASH' && (cashReceived || 0) < totalAmount)
                }
                onClick={() => checkoutMutation.mutate()}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {checkoutMutation.isPending ? t.pos.processing : t.pos.completePayment}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Printable Receipt Modal (After successful sale) */}
      {lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>{t.pos.orderSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setLastOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div
              id="printable-receipt"
              className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-3"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">{t.common.appName}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.common.systemSubtitle}</div>
                <div className="mt-2 font-semibold text-slate-800 dark:text-slate-200">{t.pos.receiptNo} {lastOrder.orderNumber}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(lastOrder.createdAt)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t.pos.cashierLabel}: {lastOrder.cashier?.name}</div>
              </div>

              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                {lastOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.quantity} x {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                {lastOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>{t.pos.discount}:</span>
                    <span>-{formatCurrency(lastOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-900 dark:text-white">{t.pos.totalToPay}:</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatCurrency(lastOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <span>{t.pos.paymentType}:</span>
                  <span>{lastOrder.paymentMethod === 'CARD' ? t.pos.card : t.pos.cash}</span>
                </div>
                {lastOrder.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>{t.pos.cashReceived}:</span>
                      <span>{formatCurrency(lastOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <span>{t.pos.change}:</span>
                      <span>{formatCurrency(lastOrder.changeGiven)}</span>
                    </div>
                  </>
                )}
                {lastOrder.customer && (
                  <div className="flex justify-between text-[11px] text-purple-700 dark:text-purple-300">
                    <span>{t.pos.customer}:</span>
                    <span>{lastOrder.customer.name} ({lastOrder.customer.phone})</span>
                  </div>
                )}
                {lastOrder.customerCashbackUsed > 0 && (
                  <div className="flex justify-between text-[11px] text-purple-600 dark:text-purple-400">
                    <span>{t.pos.useCashback}:</span>
                    <span>-{formatCurrency(lastOrder.customerCashbackUsed)}</span>
                  </div>
                )}
                {lastOrder.customerCashbackEarned > 0 && (
                  <div className="flex justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{t.pos.cashbackEarned}:</span>
                    <span>+{formatCurrency(lastOrder.customerCashbackEarned)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400 dark:text-slate-500">
                {t.common.copyright}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-900 dark:bg-slate-800 py-3 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition shadow"
              >
                <Printer className="h-4 w-4" />
                <span>{t.pos.printReceipt}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintEscPos(lastOrder)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 transition shadow"
              >
                <FileText className="h-4 w-4" />
                <span>{t.pos.printEscPos}</span>
              </button>

              <button
                type="button"
                onClick={() => setLastOrder(null)}
                className="w-full sm:w-auto sm:flex-1 rounded-2xl bg-blue-600 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition shadow"
              >
                {t.pos.newSale}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Open Shift Modal */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t.pos.openShift}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t.pos.startingCashLabel}
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.pos.startingCashLabel}
              </label>
              <input
                type="number"
                value={startingCash}
                onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={openShiftMutation.isPending}
                onClick={() => openShiftMutation.mutate()}
                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700 transition"
              >
                {openShiftMutation.isPending ? t.common.loading : t.pos.confirmOpenShift}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Close Shift Modal */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t.pos.closeShift}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t.pos.actualCashLabel}
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.pos.startingCashLabel}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(activeShift?.startingCash)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.pos.actualCashLabel}:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(activeShift?.expectedCash)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {t.pos.actualCashLabel}
                </label>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {activeShift && (
                <div className="flex justify-between text-xs font-bold pt-1">
                  <span className="text-slate-700 dark:text-slate-300">Farq:</span>
                  <span
                    className={
                      actualCash - activeShift.expectedCash === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {formatCurrency(actualCash - activeShift.expectedCash)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={closeShiftMutation.isPending}
                onClick={() => closeShiftMutation.mutate()}
                className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-red-700 transition"
              >
                {closeShiftMutation.isPending ? t.common.loading : t.pos.confirmCloseShift}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Customer Search / Selection Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.pos.customer}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Phone or Name Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="+998 90 ... / Ismi"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-64 my-1">
              {customerSearchLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">{t.common.loading}</div>
              ) : customerSearchResults && customerSearchResults.length > 0 ? (
                customerSearchResults.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setIsCustomerModalOpen(false);
                      setCustomerSearchQuery('');
                    }}
                    className="py-2.5 px-2 flex items-center justify-between gap-2 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 rounded-xl cursor-pointer transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.discountPercent > 0 && (
                          <span className="rounded bg-purple-100 dark:bg-purple-900/80 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-700 dark:text-purple-300">
                            -{c.discountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {c.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(c.cashbackBalance || 0)}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t.pos.cashbackBalance}
                      </div>
                    </div>
                  </div>
                ))
              ) : customerSearchQuery.trim().length >= 2 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p className="mb-2">{t.pos.customerNotFound}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerPhone(customerSearchQuery);
                      setIsNewCustomerModalOpen(true);
                    }}
                    className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
                  >
                    + {t.pos.addNewCustomer}
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Qidirish uchun telefon raqami yoki ismni kiriting
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ {t.pos.addNewCustomer}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Add New Customer Quick Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.pos.addNewCustomer}</h2>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCustomerMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.pos.customerName} *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Ism Familiya"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.pos.customerPhone} *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.pos.customerDiscount} (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCustomerDiscount}
                  onChange={(e) => setNewCustomerDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {createCustomerMutation.isPending ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

