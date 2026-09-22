'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
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
} from 'lucide-react';

export default function PosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
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
  } = useCartStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Shift Modals
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [startingCash, setStartingCash] = useState(5000);
  const [actualCash, setActualCash] = useState(0);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Completed Receipt Modal
  const [lastOrder, setLastOrder] = useState<any>(null);

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

  // Global Barcode Scanner Listener (Hardware Scanners emulate rapid keyboard input + Enter)
  const scannerBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular search input or modal
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

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
  }, []);

  const handleScanBarcode = async (code: string) => {
    try {
      const res = await api.get(`/products/barcode/${code.trim()}`);
      if (res.data) {
        addItem(res.data);
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
      const total = getTotal();
      const payload: any = {
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        discountAmount,
        paymentMethod,
      };

      if (paymentMethod === 'CASH') {
        payload.cashReceived = cashReceived || total;
      }

      const res = await api.post('/pos/orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setLastOrder(data);
      clearCart();
      setIsPaymentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
    onError: (err: any) => {
      setPaymentError(err.response?.data?.message || 'Ошибка проведения оплаты');
    },
  });

  const totalAmount = getTotal();
  const subtotal = getSubtotal();
  const changeDue = Math.max(0, (cashReceived || 0) - totalAmount);

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

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 overflow-hidden select-none">
      {/* Top POS Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Кассовый терминал (POS)</span>
              {activeShift ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  Смена №{activeShift.shiftNumber} открыта
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                  Касса закрыта
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Кассир: <strong className="text-slate-700">{user?.name}</strong>
              {activeShift && (
                <span className="ml-2">
                  • В кассе:{' '}
                  <strong className="text-emerald-700 font-mono">
                    {formatCurrency(activeShift.expectedCash)}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-3">
          {!activeShift ? (
            <button
              type="button"
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-700 transition"
            >
              Открыть смену
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActualCash(activeShift.expectedCash || 0);
                setIsCloseShiftModalOpen(true);
              }}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
            >
              Закрыть смену
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
            >
              <Shield className="h-4 w-4" />
              <span>Панель админа</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            title="Сменить кассира / Выход"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Working Area: Split 65% Catalog / 35% Active Cart */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Fast Product Search & Grid */}
        <div className="flex flex-1 flex-col border-r border-slate-200 bg-slate-50/50 p-4 overflow-hidden">
          {/* Barcode scanner input + Text search */}
          <div className="mb-4 flex items-center gap-3">
            <form onSubmit={handleBarcodeFormSubmit} className="relative flex-1">
              <Barcode className="absolute left-3.5 top-3 h-5 w-5 text-blue-600" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Сканировать или ввести штрихкод (EAN-13)..."
                className="w-full rounded-2xl border-2 border-blue-500/30 bg-white py-2.5 pl-11 pr-4 text-sm font-mono font-bold shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
              />
            </form>

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию или артикулу..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-blue-500"
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
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Все товары
            </button>
            {categories?.map((c: any) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
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
                Загрузка каталога...
              </div>
            ) : productsData?.data?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {productsData.data.map((p: any) => {
                  const isOutOfStock = p.stockQuantity <= 0;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addItem(p)}
                      className={`group flex flex-col rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md hover:border-blue-400 active:scale-[0.98] ${
                        isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Store className="h-8 w-8" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 rounded-lg bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          {p.stockQuantity} {p.unit}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {p.barcode}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-sm font-extrabold text-blue-600">
                          {formatCurrency(p.salePrice)}
                        </span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                Товары не найдены
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout */}
        <div className="flex w-96 shrink-0 flex-col bg-white shadow-xl">
          {/* Cart Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-slate-900">Текущий чек</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Очистить
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <ShoppingCart className="h-12 w-12 text-slate-200 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Чек пуст</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Отсканируйте штрихкод или выберите товар из списка слева
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatCurrency(item.price)} × {item.quantity} {item.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => decrementQuantity(item.productId)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementQuantity(item.productId)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Checkout Action */}
          <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Подытог:</span>
              <span className="font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Скидка по чеку:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 rounded-lg border border-slate-300 bg-white py-1 px-2 text-right text-xs font-bold text-red-600 outline-none"
                />
                <span>₽</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">ИТОГО К ОПЛАТЕ:</span>
              <span className="text-2xl font-black text-blue-600">
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
              <span>Оплата ({formatCurrency(totalAmount)})</span>
            </button>

            {!activeShift && (
              <p className="text-center text-[11px] font-semibold text-amber-700">
                ⚠️ Сначала откройте кассовую смену вверху страницы
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Payment Checkout Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Оплата покупки</h2>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {paymentError}
              </div>
            )}

            {/* Total due display */}
            <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-center border border-blue-100">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Сумма к оплате
              </span>
              <div className="text-3xl font-black text-blue-900 mt-0.5">
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
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="h-5 w-5 text-emerald-600" />
                <span>Наличные</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 text-sm font-bold border-2 transition ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Банковская карта</span>
              </button>
            </div>

            {/* Cash Payment Calculations */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Получено от покупателя (₽)
                  </label>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3 px-4 text-xl font-black text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex gap-2 flex-wrap">
                  {[100, 500, 1000, 2000, 5000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setCashReceived(nominal)}
                      className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition active:scale-95"
                    >
                      {nominal} ₽
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashReceived(totalAmount)}
                    className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition active:scale-95"
                  >
                    Без сдачи
                  </button>
                </div>

                {/* Change amount */}
                <div className="rounded-2xl bg-slate-100 p-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Сдача:</span>
                  <span className="text-2xl font-black text-emerald-700">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Отмена
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
                {checkoutMutation.isPending ? 'Пробиваем чек...' : 'Пробить чек'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Printable Receipt Modal (After successful sale) */}
      {lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Оплата успешна!</span>
              </div>
              <button
                type="button"
                onClick={() => setLastOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Paper (80mm styling) */}
            <div
              id="printable-receipt"
              className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50 font-mono text-xs text-slate-800 space-y-3"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-sm uppercase tracking-wider">МАГАЗИН «КОНТРОЛЬ»</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Добро пожаловать за покупками!</div>
                <div className="mt-2 font-semibold">ЧЕК № {lastOrder.orderNumber}</div>
                <div className="text-[10px] text-slate-500">{formatDate(lastOrder.createdAt)}</div>
                <div className="text-[10px] text-slate-500">Кассир: {lastOrder.cashier?.name}</div>
              </div>

              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                {lastOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity} x {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="font-bold">{formatCurrency(item.total)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                {lastOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Скидка:</span>
                    <span>-{formatCurrency(lastOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                  <span>ИТОГО К ОПЛАТЕ:</span>
                  <span className="text-blue-600">{formatCurrency(lastOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                  <span>Способ оплаты:</span>
                  <span>{lastOrder.paymentMethod === 'CARD' ? 'Банковская карта' : 'Наличные'}</span>
                </div>
                {lastOrder.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Внесено наличными:</span>
                      <span>{formatCurrency(lastOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-800">
                      <span>Сдача покупателю:</span>
                      <span>{formatCurrency(lastOrder.changeGiven)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                Спасибо за покупку! Сохраняйте чек.
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition shadow"
              >
                <Printer className="h-4 w-4" />
                <span>Печать чека</span>
              </button>

              <button
                type="button"
                onClick={() => setLastOrder(null)}
                className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow"
              >
                Новый чек
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Open Shift Modal */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Открытие кассовой смены</h2>
            <p className="text-xs text-slate-500 mb-4">
              Укажите начальную разменную сумму в кассовом ящике
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Разменная сумма (₽) *
              </label>
              <input
                type="number"
                value={startingCash}
                onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3 px-4 text-xl font-bold outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={openShiftMutation.isPending}
                onClick={() => openShiftMutation.mutate()}
                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700 transition"
              >
                {openShiftMutation.isPending ? 'Открытие...' : 'Открыть смену'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Close Shift Modal */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Закрытие смены</h2>
            <p className="text-xs text-slate-500 mb-4">
              Сверка кассы перед окончанием работы
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-100 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Начальная сумма:</span>
                  <span className="font-bold">{formatCurrency(activeShift?.startingCash)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Расчётная сумма в кассе:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(activeShift?.expectedCash)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Фактическая сумма наличных (₽) *
                </label>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-3 px-4 text-xl font-bold outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {activeShift && (
                <div className="flex justify-between text-xs font-bold pt-1">
                  <span>Расхождение:</span>
                  <span
                    className={
                      actualCash - activeShift.expectedCash === 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
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
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={closeShiftMutation.isPending}
                onClick={() => closeShiftMutation.mutate()}
                className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-red-700 transition"
              >
                {closeShiftMutation.isPending ? 'Закрытие...' : 'Закрыть смену'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
