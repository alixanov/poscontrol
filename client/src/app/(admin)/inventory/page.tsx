'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Склад и управление остатками
          </h1>
          <p className="text-sm text-slate-500">
            Учёт поступления, списания, перемещения между складами и витриной
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openNewMovementModal('RECEIPT')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Приход товара</span>
          </button>
          <button
            type="button"
            onClick={() => openNewMovementModal('WRITE_OFF')}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Списание</span>
          </button>
          <button
            type="button"
            onClick={() => openNewMovementModal('TRANSFER')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Перемещение</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 w-full max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'stocks'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Остатки на складах
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'movements'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          История операций
        </button>
      </div>

      {activeTab === 'stocks' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Товар</th>
                  <th className="py-3.5 px-4">Штрихкод</th>
                  <th className="py-3.5 px-4">Склад / Локация</th>
                  <th className="py-3.5 px-4 text-center">Остаток</th>
                  <th className="py-3.5 px-4 text-right">Себестоимость</th>
                  <th className="py-3.5 px-4 text-right">Сумма в остатке</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stocksLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Загрузка складских данных...
                    </td>
                  </tr>
                ) : stocksData?.length > 0 ? (
                  stocksData.map((s: any) => {
                    const totalCost = s.quantity * (s.product?.costPrice || 0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {s.product?.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          {s.product?.barcode}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Building className="h-3.5 w-3.5 text-slate-400" />
                            {s.warehouse?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {s.quantity} {s.product?.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {formatCurrency(s.product?.costPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(totalCost)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Остатки не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Номер документа</th>
                  <th className="py-3.5 px-4">Тип операции</th>
                  <th className="py-3.5 px-4">Откуда / Куда</th>
                  <th className="py-3.5 px-4">Причина</th>
                  <th className="py-3.5 px-4 text-center">Товаров</th>
                  <th className="py-3.5 px-4">Исполнитель</th>
                  <th className="py-3.5 px-4 text-right">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {movementsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Загрузка истории...
                    </td>
                  </tr>
                ) : movementsData?.data?.length > 0 ? (
                  movementsData.data.map((m: any) => {
                    const isReceipt = m.type === 'RECEIPT';
                    const isWriteOff = m.type === 'WRITE_OFF';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {m.movementNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isReceipt
                                ? 'bg-emerald-100 text-emerald-700'
                                : isWriteOff
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isReceipt
                              ? 'Приход'
                              : isWriteOff
                              ? 'Списание'
                              : 'Перемещение'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {isReceipt && `На склад: ${m.targetWarehouse?.name || 'Основной'}`}
                          {isWriteOff && `Со склада: ${m.sourceWarehouse?.name || 'Основной'}`}
                          {!isReceipt && !isWriteOff && `${m.sourceWarehouse?.name} → ${m.targetWarehouse?.name}`}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {m.reason || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {m.items?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {m.user?.name || 'Система'}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-slate-400">
                          {formatDate(m.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Складских операций пока не проводилось
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Creating Movement (Приход / Списание / Перемещение) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {movementType === 'RECEIPT' && 'Приход товара на склад'}
                {movementType === 'WRITE_OFF' && 'Списание товара'}
                {movementType === 'TRANSFER' && 'Перемещение между складами'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movementType !== 'RECEIPT' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Склад списания / источник *
                    </label>
                    <select
                      value={sourceWarehouseId}
                      onChange={(e) => setSourceWarehouseId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none focus:border-blue-500"
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Склад поступления / назначение *
                    </label>
                    <select
                      value={targetWarehouseId}
                      onChange={(e) => setTargetWarehouseId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none focus:border-blue-500"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Причина / Основание
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Например: Поставка по накладной №452, инвентаризация, брак упаковки"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Items in Movement */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Товарные позиции
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить строку
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.productId}
                        onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm outline-none"
                      >
                        {productsData?.data?.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.barcode}) — ост: {p.stockQuantity} {p.unit}
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
                        placeholder="Кол-во"
                        className="w-24 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-center outline-none"
                      />

                      {movementType === 'RECEIPT' && (
                        <input
                          type="number"
                          step="0.01"
                          value={row.costPrice}
                          onChange={(e) =>
                            updateItemRow(idx, 'costPrice', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Цена закупки"
                          className="w-28 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-right outline-none"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={movementMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {movementMutation.isPending ? 'Проведение...' : 'Провести документ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
