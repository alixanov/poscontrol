'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useTranslation } from '@/stores/language.store';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Search,
  X,
  Building,
  Trash2,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingDown,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<'stocks' | 'movements'>('stocks');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  // Movement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'RECEIPT' | 'WRITE_OFF' | 'TRANSFER'>('RECEIPT');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number; costPrice?: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Add Warehouse Modal State
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhAddress, setNewWhAddress] = useState('');
  const [whError, setWhError] = useState<string | null>(null);

  // Fetch Warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses');
      return res.data;
    },
  });

  // Fetch Products
  const { data: productsData } = useQuery({
    queryKey: ['all-products-for-inventory'],
    queryFn: async () => {
      const res = await api.get('/products?limit=500');
      return res.data;
    },
  });

  // Fetch Stock Balances
  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['inventory-stocks'],
    queryFn: async () => {
      const res = await api.get('/inventory/stocks');
      return res.data;
    },
  });

  // Fetch Movement History
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: async () => {
      const res = await api.get('/inventory/movements');
      return res.data;
    },
  });

  // Helper to get actual stock of a product in a specific warehouse
  const getWarehouseStock = (whId: string, prodId: string): number => {
    if (!whId || !prodId || !stocksData) return 0;
    const match = stocksData.find((s: any) => s.warehouseId === whId && s.productId === prodId);
    return match?.quantity ?? 0;
  };

  // Open Movement Modal with correct default warehouses
  const openNewMovementModal = (type: 'RECEIPT' | 'WRITE_OFF' | 'TRANSFER') => {
    setMovementType(type);
    setReason('');
    setNotes('');
    setFormError(null);

    const defaultWh = warehouses?.find((w: any) => w.isDefault) || warehouses?.[0];
    const otherWh = warehouses?.find((w: any) => w.id !== defaultWh?.id) || warehouses?.[1] || defaultWh;

    if (type === 'RECEIPT') {
      setSourceWarehouseId('');
      setTargetWarehouseId(defaultWh?.id || '');
    } else if (type === 'WRITE_OFF') {
      setSourceWarehouseId(defaultWh?.id || '');
      setTargetWarehouseId('');
    } else {
      // TRANSFER
      setSourceWarehouseId(defaultWh?.id || '');
      setTargetWarehouseId(otherWh?.id || '');
    }

    setProductSearchTerm('');
    setIsProductDropdownOpen(false);

    const firstProduct = productsData?.data?.[0];
    setItems([
      {
        productId: firstProduct?.id || '',
        quantity: 1,
        costPrice: firstProduct?.costPrice || 0,
      },
    ]);
    setIsModalOpen(true);
  };

  // Filtered Products for Movement Modal Search
  const searchedProducts = useMemo(() => {
    if (!productsData?.data || !Array.isArray(productsData.data)) return [];
    if (!productSearchTerm.trim()) {
      return productsData.data.slice(0, 8);
    }
    const q = productSearchTerm.toLowerCase().trim();
    return productsData.data
      .filter((p: any) => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const barcodeMatch = p.barcode?.toLowerCase().includes(q);
        const skuMatch = p.sku?.toLowerCase().includes(q);
        return nameMatch || barcodeMatch || skuMatch;
      })
      .slice(0, 10);
  }, [productsData, productSearchTerm]);

  const handleSelectProduct = (prod: any) => {
    const existingIndex = items.findIndex((it) => it.productId === prod.id);
    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 0) + 1;
      setItems(updated);
    } else {
      if (items.length === 1 && !items[0].productId) {
        setItems([{ productId: prod.id, quantity: 1, costPrice: prod.costPrice || 0 }]);
      } else {
        setItems([...items, { productId: prod.id, quantity: 1, costPrice: prod.costPrice || 0 }]);
      }
    }
    setProductSearchTerm('');
    setIsProductDropdownOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchedProducts.length > 0) {
        handleSelectProduct(searchedProducts[0]);
      }
    }
  };

  const addItemRow = () => {
    const firstProduct = productsData?.data?.[0];
    if (firstProduct) {
      setItems([
        ...items,
        {
          productId: firstProduct.id,
          quantity: 1,
          costPrice: firstProduct.costPrice || 0,
        },
      ]);
    }
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = productsData?.data?.find((p: any) => p.id === value);
      if (prod) {
        updated[index].costPrice = prod.costPrice || 0;
      }
    }
    setItems(updated);
  };

  // Movement Mutation
  const movementMutation = useMutation({
    mutationFn: async () => {
      return api.post('/inventory/movements', {
        type: movementType,
        sourceWarehouseId: movementType === 'RECEIPT' ? undefined : sourceWarehouseId,
        targetWarehouseId: movementType === 'WRITE_OFF' ? undefined : targetWarehouseId,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          costPrice: movementType === 'RECEIPT' ? Number(it.costPrice || 0) : undefined,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['all-products-for-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || (language === 'uz' ? "Ombor operatsiyasini bajarishda xatolik yuz berdi" : 'Ошибка проведения складской операции'));
    },
  });

  // Create Warehouse Mutation
  const createWarehouseMutation = useMutation({
    mutationFn: async () => {
      return api.post('/inventory/warehouses', {
        name: newWhName.trim(),
        address: newWhAddress.trim() || undefined,
        isDefault: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsWarehouseModalOpen(false);
      setNewWhName('');
      setNewWhAddress('');
      setWhError(null);
    },
    onError: (err: any) => {
      setWhError(err.response?.data?.message || (language === 'uz' ? "Omborni saqlashda xatolik" : 'Ошибка создания склада'));
    },
  });

  // Validation before submit
  const validateForm = (): boolean => {
    if (items.length === 0) {
      setFormError(language === 'uz' ? "Hujjatga kamida bitta tovar qo'shing" : 'Добавьте хотя бы один товар в документ');
      return false;
    }

    if (movementType === 'TRANSFER' && sourceWarehouseId === targetWarehouseId) {
      setFormError(language === 'uz' ? "Chiquvchi va qabul qiluvchi ombor bir xil bo'lishi mumkin emas" : 'Склад-источник и склад-назначение должны различаться');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) {
        setFormError(language === 'uz' ? `${i + 1}-qatorda tovar tanlanmagan` : `В строке ${i + 1} не выбран товар`);
        return false;
      }
      if (!it.quantity || it.quantity <= 0) {
        setFormError(language === 'uz' ? `${i + 1}-qator uchun miqdor 0 dan katta bo'lishi kerak` : `В строке ${i + 1} количество должно быть больше 0`);
        return false;
      }

      if (movementType === 'WRITE_OFF' || movementType === 'TRANSFER') {
        const available = getWarehouseStock(sourceWarehouseId, it.productId);
        if (it.quantity > available) {
          const prod = productsData?.data?.find((p: any) => p.id === it.productId);
          setFormError(
            language === 'uz'
              ? `"${prod?.name || 'Tovar'}" omborda yetarli emas. Mavjud: ${available}, kiritildi: ${it.quantity}`
              : `Недостаточно "${prod?.name || 'Товар'}" на складе. Доступно: ${available}, запрошено: ${it.quantity}`
          );
          return false;
        }
      }
    }

    setFormError(null);
    return true;
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      movementMutation.mutate();
    }
  };

  // Summary KPIs Calculation
  const summaryStats = useMemo(() => {
    if (!stocksData || !Array.isArray(stocksData)) {
      return { totalPositions: 0, totalUnits: 0, totalValue: 0, lowStockCount: 0 };
    }
    const totalPositions = stocksData.length;
    let totalUnits = 0;
    let totalValue = 0;
    let lowStockCount = 0;

    stocksData.forEach((s: any) => {
      const qty = Number(s.quantity) || 0;
      const cost = Number(s.product?.costPrice) || 0;
      totalUnits += qty;
      totalValue += qty * cost;
      if (qty <= (s.product?.minStockAlert ?? 5)) {
        lowStockCount++;
      }
    });

    return { totalPositions, totalUnits, totalValue, lowStockCount };
  }, [stocksData]);

  // Filtered Stocks
  const filteredStocks = useMemo(() => {
    if (!stocksData || !Array.isArray(stocksData)) return [];
    return stocksData.filter((s: any) => {
      if (selectedWarehouseFilter !== 'ALL' && s.warehouseId !== selectedWarehouseFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = s.product?.name?.toLowerCase().includes(q);
        const barcodeMatch = s.product?.barcode?.toLowerCase().includes(q);
        const skuMatch = s.product?.sku?.toLowerCase().includes(q);
        return nameMatch || barcodeMatch || skuMatch;
      }
      return true;
    });
  }, [stocksData, selectedWarehouseFilter, searchQuery]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    if (!movementsData?.data || !Array.isArray(movementsData.data)) return [];
    return movementsData.data.filter((m: any) => {
      if (movementTypeFilter !== 'ALL' && m.type !== movementTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = m.movementNumber?.toLowerCase().includes(q);
        const reasonMatch = m.reason?.toLowerCase().includes(q);
        const userMatch = m.user?.name?.toLowerCase().includes(q);
        return numMatch || reasonMatch || userMatch;
      }
      return true;
    });
  }, [movementsData, movementTypeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.inventory.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t.inventory.subtitle}
          </p>
        </div>

        {/* Action Buttons: Responsive Grid / Wrap */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openNewMovementModal('RECEIPT')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
          >
            <ArrowDownLeft className="h-4 w-4 shrink-0" />
            <span>{t.inventory.receipt}</span>
          </button>

          <button
            type="button"
            onClick={() => openNewMovementModal('WRITE_OFF')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition"
          >
            <ArrowUpRight className="h-4 w-4 shrink-0" />
            <span>{t.inventory.writeOff}</span>
          </button>

          <button
            type="button"
            onClick={() => openNewMovementModal('TRANSFER')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            <span>{t.inventory.transfer}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWarehouseModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95 transition shadow-sm"
          >
            <WarehouseIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>{t.inventory.addWarehouse}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Positions */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.inventory.totalPositions}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {summaryStats.totalPositions}
              </h3>
            </div>
          </div>
        </div>

        {/* Total Units */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.inventory.totalUnits}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {summaryStats.totalUnits}
              </h3>
            </div>
          </div>
        </div>

        {/* Total Valuation */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {t.inventory.totalCostValue}
              </p>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                {formatCurrency(summaryStats.totalValue)}
              </h3>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.inventory.lowStockPositions}
              </p>
              <h3 className={`text-lg sm:text-xl font-bold ${summaryStats.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {summaryStats.lowStockCount}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Controls Bar: Fully Responsive */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Segmented Switcher */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('stocks')}
            className={`flex-1 md:flex-none px-5 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'stocks'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.inventory.stocksTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`flex-1 md:flex-none px-5 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'movements'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.inventory.movementsTab}
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'stocks' ? t.inventory.searchPlaceholder : t.inventory.movementsSearchPlaceholder}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-8 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Warehouse Filter (Stocks Tab) */}
          {activeTab === 'stocks' && (
            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="ALL">{t.inventory.allWarehouses}</option>
              {warehouses?.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? `(${language === 'uz' ? 'Asosiy' : 'Основной'})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Movement Type Filter (Movements Tab) */}
          {activeTab === 'movements' && (
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="ALL">{language === 'uz' ? 'Barcha turlar' : 'Все типы'}</option>
              <option value="RECEIPT">{t.inventory.receipt}</option>
              <option value="WRITE_OFF">{t.inventory.writeOff}</option>
              <option value="TRANSFER">{t.inventory.transfer}</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'stocks' ? (
        /* Stocks Table */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold tracking-wider whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">{t.products.name}</th>
                  <th className="py-3.5 px-4">{t.products.barcode}</th>
                  <th className="py-3.5 px-4">{t.inventory.warehouse}</th>
                  <th className="py-3.5 px-4 text-center">{t.products.stock}</th>
                  <th className="py-3.5 px-4 text-right">{t.products.costPrice}</th>
                  <th className="py-3.5 px-4 text-right">{t.common.sum}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {stocksLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      {t.common.loading}
                    </td>
                  </tr>
                ) : filteredStocks.length > 0 ? (
                  filteredStocks.map((s: any) => {
                    const totalCost = (Number(s.quantity) || 0) * (Number(s.product?.costPrice) || 0);
                    const isLow = s.quantity <= (s.product?.minStockAlert ?? 5);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {s.product?.name}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {s.product?.sku}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {s.product?.barcode || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                            <Building className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            {s.warehouse?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isLow
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          }`}>
                            {s.quantity} {s.product?.unit || t.pos.itemCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatCurrency(s.product?.costPrice || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(totalCost)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      {t.common.notFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements Table */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold tracking-wider whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">{language === 'uz' ? 'Hujjat raqami' : 'Номер документа'}</th>
                  <th className="py-3.5 px-4">{language === 'uz' ? 'Operatsiya turi' : 'Тип операции'}</th>
                  <th className="py-3.5 px-4">{language === 'uz' ? 'Qayerdan / Qayerga' : 'Откуда / Куда'}</th>
                  <th className="py-3.5 px-4">{t.inventory.reason}</th>
                  <th className="py-3.5 px-4 text-center">{t.inventory.items}</th>
                  <th className="py-3.5 px-4">{language === 'uz' ? 'Ijrochi' : 'Исполнитель'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'uz' ? 'Sana' : 'Дата'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {movementsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      {t.common.loading}
                    </td>
                  </tr>
                ) : filteredMovements.length > 0 ? (
                  filteredMovements.map((m: any) => {
                    const isReceipt = m.type === 'RECEIPT';
                    const isWriteOff = m.type === 'WRITE_OFF';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {m.movementNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isReceipt
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                                : isWriteOff
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                            }`}
                          >
                            {isReceipt
                              ? t.inventory.receipt
                              : isWriteOff
                              ? t.inventory.writeOff
                              : t.inventory.transfer}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {isReceipt && `${language === 'uz' ? 'Omborga' : 'На склад'}: ${m.targetWarehouse?.name || (language === 'uz' ? 'Asosiy' : 'Основной')}`}
                          {isWriteOff && `${language === 'uz' ? 'Ombordan' : 'Со склада'}: ${m.sourceWarehouse?.name || (language === 'uz' ? 'Asosiy' : 'Основной')}`}
                          {!isReceipt && !isWriteOff && `${m.sourceWarehouse?.name} → ${m.targetWarehouse?.name}`}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {m.reason || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {m.items?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {m.user?.name || (language === 'uz' ? 'Tizim' : 'Система')}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {formatDate(m.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      {t.common.notFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Modal (Receipt / Write-Off / Transfer) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex p-2 rounded-xl text-white ${
                  movementType === 'RECEIPT' ? 'bg-emerald-600' : movementType === 'WRITE_OFF' ? 'bg-rose-600' : 'bg-blue-600'
                }`}>
                  {movementType === 'RECEIPT' && <ArrowDownLeft className="h-5 w-5" />}
                  {movementType === 'WRITE_OFF' && <ArrowUpRight className="h-5 w-5" />}
                  {movementType === 'TRANSFER' && <ArrowLeftRight className="h-5 w-5" />}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {movementType === 'RECEIPT' && (language === 'uz' ? "Omborga tovar qabul qilish (Kirim)" : "Приход товара на склад")}
                  {movementType === 'WRITE_OFF' && (language === 'uz' ? "Tovarni hisobdan chiqarish (Spisaniye)" : "Списание товара")}
                  {movementType === 'TRANSFER' && (language === 'uz' ? "Omborlar o'rtasida ko'chirish" : "Перемещение между складами")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 p-3 text-sm text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              {/* Warehouse Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {movementType !== 'RECEIPT' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.inventory.sourceWarehouse} *
                    </label>
                    <select
                      value={sourceWarehouseId}
                      onChange={(e) => setSourceWarehouseId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                    >
                      {warehouses?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.isDefault ? `(${language === 'uz' ? 'Asosiy' : 'Основной'})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {movementType !== 'WRITE_OFF' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.inventory.targetWarehouse} *
                    </label>
                    <select
                      value={targetWarehouseId}
                      onChange={(e) => setTargetWarehouseId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                    >
                      {warehouses?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.isDefault ? `(${language === 'uz' ? 'Asosiy' : 'Основной'})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {movementType === 'TRANSFER' && sourceWarehouseId === targetWarehouseId && (
                  <div className="sm:col-span-2 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t.inventory.warehousesMustDiffer}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.inventory.reason}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={language === 'uz' ? "Masalan: Yuk xati №452, inventarizatsiya, brak" : "Например: Поставка по накладной №452, инвентаризация, брак"}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Items List: Fully Adaptive Card-Row Layout */}
              <div className="mt-4 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t.inventory.items} ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {language === 'uz' ? "Qator qo'shish" : "Добавить позицию"}
                  </button>
                </div>

                {/* Quick Search & Add Product Bar */}
                <div className="relative mb-3">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => {
                        setProductSearchTerm(e.target.value);
                        setIsProductDropdownOpen(true);
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={t.inventory.searchProductToAdd}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-9 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-medium transition shadow-sm"
                    />
                    {productSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchTerm('');
                          setIsProductDropdownOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Suggestions Popup */}
                  {isProductDropdownOpen && searchedProducts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                      {searchedProducts.map((p: any) => {
                        const avail = movementType !== 'RECEIPT'
                          ? getWarehouseStock(sourceWarehouseId, p.id)
                          : p.stockQuantity;

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProduct(p)}
                            className="w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between gap-3 transition"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                {p.name}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-mono">{p.barcode || p.sku}</span>
                                {p.category?.name && (
                                  <>
                                    <span>•</span>
                                    <span>{p.category.name}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {movementType === 'RECEIPT' ? (language === 'uz' ? 'Jami:' : 'Всего:') : (language === 'uz' ? 'Omborda:' : 'На складе:')} {avail} {p.unit || t.pos.itemCount}
                              </span>
                              {movementType === 'RECEIPT' && p.costPrice > 0 && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {formatCurrency(p.costPrice)}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isProductDropdownOpen && productSearchTerm && searchedProducts.length === 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 p-4 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl text-xs text-slate-400">
                      {language === 'uz' ? "Bunday tovar topilmadi" : "Товар не найден"}
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {items.map((row, idx) => {
                    const availableInSource = movementType !== 'RECEIPT'
                      ? getWarehouseStock(sourceWarehouseId, row.productId)
                      : 0;
                    const isExceeding = (movementType === 'WRITE_OFF' || movementType === 'TRANSFER') && row.quantity > availableInSource;

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 sm:p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
                          isExceeding
                            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
                            : 'border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        {/* Product Selector */}
                        <div className="flex-1 min-w-0">
                          <label className="sm:hidden text-[11px] font-semibold text-slate-500 mb-1 block">
                            {t.inventory.product}
                          </label>
                          <select
                            value={row.productId}
                            onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-2.5 text-sm text-slate-900 dark:text-white outline-none"
                          >
                            {productsData?.data?.map((p: any) => {
                              const avail = movementType !== 'RECEIPT' ? getWarehouseStock(sourceWarehouseId, p.id) : p.stockQuantity;
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.barcode || p.sku}) — {movementType === 'RECEIPT' ? (language === 'uz' ? 'Jami:' : 'Всего:') : (language === 'uz' ? 'Omborda:' : 'На складе:')} {avail} {p.unit || t.pos.itemCount}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Quantity and Price and Delete */}
                        <div className="flex items-center gap-2">
                          {/* Quantity */}
                          <div className="flex-1 sm:w-24">
                            <label className="sm:hidden text-[11px] font-semibold text-slate-500 mb-1 block">
                              {language === 'uz' ? 'Miqdor' : 'Кол-во'}
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={row.quantity}
                              onChange={(e) =>
                                updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              placeholder={language === 'uz' ? "Miqdor" : "Кол-во"}
                              className={`w-full rounded-xl border py-2 px-2 text-sm text-center font-bold text-slate-900 dark:text-white outline-none ${
                                isExceeding
                                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                            />
                          </div>

                          {/* Purchase Cost Price (Only for Receipt) */}
                          {movementType === 'RECEIPT' && (
                            <div className="flex-1 sm:w-28">
                              <label className="sm:hidden text-[11px] font-semibold text-slate-500 mb-1 block">
                                {language === 'uz' ? 'Narx' : 'Цена'}
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.costPrice || ''}
                                onChange={(e) =>
                                  updateItemRow(idx, 'costPrice', parseFloat(e.target.value) || 0)
                                }
                                placeholder={language === 'uz' ? "Kirim narxi" : "Себестоимость"}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-2 text-sm text-right text-slate-900 dark:text-white outline-none"
                              />
                            </div>
                          )}

                          {/* Delete Row Button */}
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length <= 1}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Inline Stock Error Warning */}
                        {isExceeding && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold px-1">
                            ⚠️ {language === 'uz' ? `Omborda faqat ${availableInSource} dona mavjud!` : `На складе доступно только ${availableInSource} шт!`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={movementMutation.isPending || (movementType === 'TRANSFER' && sourceWarehouseId === targetWarehouseId)}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {movementMutation.isPending ? t.common.loading : t.inventory.execute}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5 text-blue-600" />
                {t.inventory.addWarehouse}
              </h2>
              <button
                type="button"
                onClick={() => setIsWarehouseModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {whError && (
              <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 p-3 text-sm text-rose-700 dark:text-rose-400 border border-rose-200">
                {whError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newWhName.trim()) {
                  setWhError(language === 'uz' ? "Ombor nomini kiriting" : "Введите название склада");
                  return;
                }
                createWarehouseMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {t.inventory.warehouseName} *
                </label>
                <input
                  type="text"
                  required
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  placeholder={language === 'uz' ? "Masalan: 2-Ombor, Vitrina, Toshkent ombori" : "Например: Склад №2, Витрина, Филиал"}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {t.inventory.location}
                </label>
                <input
                  type="text"
                  value={newWhAddress}
                  onChange={(e) => setNewWhAddress(e.target.value)}
                  placeholder={language === 'uz' ? "Masalan: Chilonzor 1-mavze" : "Например: ул. Садовая, д. 5"}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createWarehouseMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createWarehouseMutation.isPending ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
