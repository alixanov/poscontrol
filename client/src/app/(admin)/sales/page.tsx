'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  Eye,
  RotateCcw,
  Printer,
  CreditCard,
  Banknote,
  X,
  AlertCircle,
  Receipt,
} from 'lucide-react';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await api.get(`/pos/orders?${params.toString()}`);
      return res.data;
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) return;
      return api.post(`/pos/orders/${selectedOrder.id}/refund`, {
        reason: refundReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsRefundModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      setRefundError(err.response?.data?.message || 'Ошибка оформления возврата');
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          История продаж и чеков
        </h1>
        <p className="text-sm text-slate-500">
          Список всех кассовых чеков, просмотр детализации и оформление возвратов
        </p>
      </div>

      {/* Search Filter */}
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по номеру чека (например: CHK-)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Номер чека</th>
                <th className="py-3.5 px-4">Статус</th>
                <th className="py-3.5 px-4">Оплата</th>
                <th className="py-3.5 px-4 text-center">Позиций</th>
                <th className="py-3.5 px-4 text-right">Сумма чека</th>
                <th className="py-3.5 px-4">Кассир</th>
                <th className="py-3.5 px-4 text-right">Дата и время</th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Загрузка чеков...
                  </td>
                </tr>
              ) : ordersData?.data?.length > 0 ? (
                ordersData.data.map((order: any) => {
                  const isRefunded = order.status === 'REFUNDED';
                  const isCard = order.paymentMethod === 'CARD';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isRefunded
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isRefunded ? 'Возврат' : 'Оплачен'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          {isCard ? (
                            <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          {isCard ? 'Безнал' : 'Наличные'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {order.items?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {order.cashier?.name || 'Кассир'}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            title="Посмотреть чек"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isRefunded && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order);
                                setRefundReason('');
                                setRefundError(null);
                                setIsRefundModalOpen(true);
                              }}
                              title="Оформить возврат"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Чеки не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt View Modal */}
      {selectedOrder && !isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-blue-600" />
                Детализация чека
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt area */}
            <div id="printable-receipt" className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-sm uppercase tracking-wider">МАГАЗИН «КОНТРОЛЬ»</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Добро пожаловать за покупками!</div>
                <div className="mt-2 font-semibold">ЧЕК № {selectedOrder.orderNumber}</div>
                <div className="text-[10px] text-slate-500">{formatDate(selectedOrder.createdAt)}</div>
                <div className="text-[10px] text-slate-500">Кассир: {selectedOrder.cashier?.name}</div>
              </div>

              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                {selectedOrder.items?.map((item: any) => (
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
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Скидка:</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                  <span>ИТОГО К ОПЛАТЕ:</span>
                  <span className="text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                  <span>Оплата:</span>
                  <span>{selectedOrder.paymentMethod === 'CARD' ? 'Банковская карта' : 'Наличные'}</span>
                </div>
                {selectedOrder.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Внесено наличными:</span>
                      <span>{formatCurrency(selectedOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-800">
                      <span>Сдача:</span>
                      <span>{formatCurrency(selectedOrder.changeGiven)}</span>
                    </div>
                  </>
                )}
              </div>

              {selectedOrder.status === 'REFUNDED' && (
                <div className="mt-3 rounded-lg bg-red-100 p-2 text-center text-red-700 font-bold text-[11px]">
                  ВОЗВРАТ ПРОВЕДЕН: {selectedOrder.refundReason || 'По чеку'}
                </div>
              )}

              <div className="text-center pt-2 text-[10px] text-slate-400">
                Спасибо за покупку! Сохраняйте чек.
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Распечатать чек</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Оформление возврата
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Чек № {selectedOrder?.orderNumber} на сумму {formatCurrency(selectedOrder?.totalAmount)}. Товар будет автоматически возвращен на склад.
            </p>

            {refundError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {refundError}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Причина возврата *
              </label>
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Например: Покупатель вернул товар, не подошел размер / брак упаковки"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!refundReason.trim() || refundMutation.isPending}
                onClick={() => refundMutation.mutate()}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {refundMutation.isPending ? 'Возврат...' : 'Подтвердить возврат'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
