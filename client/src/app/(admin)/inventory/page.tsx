'use client';

import React, { useState } from 'react';
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
  History,
  X,
  Building,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'stocks' | 'movements'>('stocks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'RECEIPT' | 'WRITE_OFF' | 'TRANSFER'>('RECEIPT');

  // Form State
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number; costPrice?: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses');
      return res.data;
    },
  });

  // Fetch Products for selection
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

  const openNewMovementModal = (type: 'RECEIPT' | 'WRITE_OFF' | 'TRANSFER') => {
    setMovementType(type);
    setReason('');
    setNotes('');
    setSourceWarehouseId(warehouses?.[0]?.id || '');
    setTargetWarehouseId(warehouses?.[1]?.id || warehouses?.[0]?.id || '');
    setItems([{ productId: productsData?.data?.[0]?.id || '', quantity: 1, costPrice: productsData?.data?.[0]?.costPrice || 0 }]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (productsData?.data?.[0]) {
      setItems([
        ...items,
        {
          productId: productsData.data[0].id,
          quantity: 1,
          costPrice: productsData.data[0].costPrice,
        },
      ]);
    }
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Update default cost price if product changed
    if (field === 'productId') {
      const prod = productsData?.data?.find((p: any) => p.id === value);
      if (prod) {
        updated[index].costPrice = prod.costPrice;
      }
    }
    setItems(updated);
  };

  const movementMutation = useMutation({
    mutationFn: async () => {
      return api.post('/inventory/movements', {
        type: movementType,
        sourceWarehouseId: movementType === 'RECEIPT' ? undefined : sourceWarehouseId,
        targetWarehouseId: movementType === 'WRITE_OFF' ? undefined : targetWarehouseId,
        reason,
        notes,
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Ошибка проведения складской операции');
    },
  });

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setFormError('Добавьте хотя бы один товар в документ');
      return;
    }
    movementMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.inventory.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.inventory.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openNewMovementModal('RECEIPT')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>{t.inventory.receipt}</span>
          </button>
          <button
            type="button"
            onClick={() => openNewMovementModal('WRITE_OFF')}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>{t.inventory.writeOff}</span>
          </button>
          <button
            type="button"
            onClick={() => openNewMovementModal('TRANSFER')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>{t.inventory.transfer}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-full max-w-sm border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
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
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'movements'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.inventory.movementsTab}
        </button>
      </div>

      {activeTab === 'stocks' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold">
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
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      {t.common.loading}
                    </td>
                  </tr>
                ) : stocksData?.length > 0 ? (
                  stocksData.map((s: any) => {
                    const totalCost = s.quantity * (s.product?.costPrice || 0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {s.product?.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {s.product?.barcode}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                            <Building className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            {s.warehouse?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                          {s.quantity} {s.product?.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                          {formatCurrency(s.product?.costPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(totalCost)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      {t.common.notFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold">
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
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      {t.common.loading}
                    </td>
                  </tr>
                ) : movementsData?.data?.length > 0 ? (
                  movementsData.data.map((m: any) => {
                    const isReceipt = m.type === 'RECEIPT';
                    const isWriteOff = m.type === 'WRITE_OFF';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          {m.movementNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isReceipt
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                                : isWriteOff
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'
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
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                          {isReceipt && `${language === 'uz' ? 'Omborga' : 'На склад'}: ${m.targetWarehouse?.name || (language === 'uz' ? 'Asosiy' : 'Основной')}`}
                          {isWriteOff && `${language === 'uz' ? 'Ombordan' : 'Со склада'}: ${m.sourceWarehouse?.name || (language === 'uz' ? 'Asosiy' : 'Основной')}`}
                          {!isReceipt && !isWriteOff && `${m.sourceWarehouse?.name} → ${m.targetWarehouse?.name}`}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {m.reason || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                          {m.items?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {m.user?.name || (language === 'uz' ? 'Tizim' : 'Система')}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(m.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      {t.common.notFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Creating Movement (Receipt / WriteOff / Transfer) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {movementType === 'RECEIPT' && (language === 'uz' ? "Omborga tovar qabul qilish (Kirim)" : "Приход товара на склад")}
                {movementType === 'WRITE_OFF' && (language === 'uz' ? "Tovarni hisobdan chiqarish (Spisaniye)" : "Списание товара")}
                {movementType === 'TRANSFER' && (language === 'uz' ? "Omborlar o'rtasida ko'chirish" : "Перемещение между складами")}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movementType !== 'RECEIPT' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.inventory.sourceWarehouse} *
                    </label>
                    <select
                      value={sourceWarehouseId}
                      onChange={(e) => setSourceWarehouseId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      {warehouses?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
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
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      {warehouses?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
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

              {/* Items in Movement */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t.inventory.items}
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {language === 'uz' ? "Qator qo'shish" : "Добавить строку"}
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.productId}
                        onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none"
                      >
                        {productsData?.data?.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.barcode}) — {language === 'uz' ? 'qoldiq:' : 'ост:'} {p.stockQuantity} {p.unit}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={row.quantity}
                        onChange={(e) =>
                          updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        placeholder={language === 'uz' ? "Miqdor" : "Кол-во"}
                        className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm text-center text-slate-900 dark:text-white outline-none"
                      />

                      {movementType === 'RECEIPT' && (
                        <input
                          type="number"
                          step="0.01"
                          value={row.costPrice}
                          onChange={(e) =>
                            updateItemRow(idx, 'costPrice', parseFloat(e.target.value) || 0)
                          }
                          placeholder={language === 'uz' ? "Kirim narxi" : "Цена закупки"}
                          className="w-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm text-right text-slate-900 dark:text-white outline-none"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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
                  disabled={movementMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {movementMutation.isPending ? t.common.loading : t.inventory.execute}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
