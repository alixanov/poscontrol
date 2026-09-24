'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useTranslation } from '@/stores/language.store';
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
  const { t, language } = useTranslation();
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
      setRefundError(err.response?.data?.message || (language === 'uz' ? "Qaytarishda xatolik yuz berdi" : "Ошибка оформления возврата"));
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.sales.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.sales.subtitle}
        </p>
      </div>

      {/* Search Filter */}
      <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'uz' ? "Chek raqami bo'yicha qidiruv (masalan: CHK-)..." : "Поиск по номеру чека (например: CHK-)..."}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
      </div>

      {/* Orders Presentation: Responsive Cards for Mobile/Tablet (< lg) & Table for Desktop (>= lg) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Mobile / Tablet Cards View (Visible on < lg screens) */}
        <div className="lg:hidden p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              {t.common.loading}
            </div>
          ) : ordersData?.data?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ordersData.data.map((order: any) => {
                const isRefunded = order.status === 'REFUNDED';
                const isCard = order.paymentMethod === 'CARD';

                return (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3"
                  >
                    {/* Header: Order Number + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isRefunded
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                        }`}
                      >
                        {isRefunded
                          ? (language === 'uz' ? 'Qaytarilgan' : 'Возврат')
                          : (language === 'uz' ? "To'langan" : 'Оплачен')}
                      </span>
                    </div>

                    {/* Middle: Amount + Payment Type + Cashier */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{t.common.sum}</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {order.items?.length || 0} {t.pos.itemCount} • {order.cashier?.name || t.sales.cashier}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg">
                          {isCard ? (
                            <CreditCard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          {isCard ? t.pos.card : t.pos.cash}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{t.sales.viewReceipt}</span>
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
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>{t.sales.refund}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              {t.common.notFound}
            </div>
          )}
        </div>

        {/* Desktop Table View (Visible on >= lg screens) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4">{t.sales.orderNumber}</th>
                <th className="py-3.5 px-4">{t.common.status}</th>
                <th className="py-3.5 px-4">{t.pos.paymentType}</th>
                <th className="py-3.5 px-4 text-center">{t.sales.itemsCount}</th>
                <th className="py-3.5 px-4 text-right">{t.common.sum}</th>
                <th className="py-3.5 px-4">{t.sales.cashier}</th>
                <th className="py-3.5 px-4 text-right">{language === 'uz' ? 'Sana va vaqt' : 'Дата и время'}</th>
                <th className="py-3.5 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    {t.common.loading}
                  </td>
                </tr>
              ) : ordersData?.data?.length > 0 ? (
                ordersData.data.map((order: any) => {
                  const isRefunded = order.status === 'REFUNDED';
                  const isCard = order.paymentMethod === 'CARD';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isRefunded
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                          }`}
                        >
                          {isRefunded
                            ? (language === 'uz' ? 'Qaytarilgan' : 'Возврат')
                            : (language === 'uz' ? "To'langan" : 'Оплачен')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {isCard ? (
                            <CreditCard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          {isCard ? t.pos.card : t.pos.cash}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {order.items?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {order.cashier?.name || t.sales.cashier}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            title={t.sales.viewReceipt}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition"
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
                              title={t.sales.refund}
                              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 transition"
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
                  <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {t.common.notFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt View Modal */}
      {selectedOrder && !isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {language === 'uz' ? 'Chek tafsilotlari' : 'Детализация чека'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt area */}
            <div id="printable-receipt" className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">{t.common.appName}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.common.systemSubtitle}</div>
                <div className="mt-2 font-semibold text-slate-800 dark:text-slate-200">{t.pos.receiptNo} {selectedOrder.orderNumber}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(selectedOrder.createdAt)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{t.pos.cashierLabel}: {selectedOrder.cashier?.name}</div>
              </div>

              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                {selectedOrder.items?.map((item: any) => (
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
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>{t.pos.discount}:</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-900 dark:text-white">{t.pos.totalToPay}:</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <span>{t.pos.paymentType}:</span>
                  <span>{selectedOrder.paymentMethod === 'CARD' ? t.pos.card : t.pos.cash}</span>
                </div>
                {selectedOrder.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>{t.pos.cashReceived}:</span>
                      <span>{formatCurrency(selectedOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <span>{t.pos.change}:</span>
                      <span>{formatCurrency(selectedOrder.changeGiven)}</span>
                    </div>
                  </>
                )}
              </div>

              {selectedOrder.status === 'REFUNDED' && (
                <div className="mt-3 rounded-lg bg-red-100 dark:bg-red-950/60 p-2 text-center text-red-700 dark:text-red-400 font-bold text-[11px] border border-red-200 dark:border-red-900/50">
                  {language === 'uz' ? 'QAYTARISH O\'TKAZILGAN' : 'ВОЗВРАТ ПРОВЕДЕН'}: {selectedOrder.refundReason || 'По чеку'}
                </div>
              )}

              <div className="text-center pt-2 text-[10px] text-slate-400 dark:text-slate-500">
                {t.common.copyright}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                <Printer className="h-4 w-4" />
                <span>{t.pos.printReceipt}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {t.sales.refund}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t.pos.receiptNo} {selectedOrder?.orderNumber} — {formatCurrency(selectedOrder?.totalAmount)}. {language === 'uz' ? "Mahsulotlar avtomatik ravishda omborga qaytariladi." : "Товар будет автоматически возвращен на склад."}
            </p>

            {refundError && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                {refundError}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.sales.refundReason} *
              </label>
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={language === 'uz' ? "Masalan: Xaridor tovarini qaytardi, o'lchami to'g'ri kelmadi / brak" : "Например: Покупатель вернул товар, не подошел размер / брак упаковки"}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={!refundReason.trim() || refundMutation.isPending}
                onClick={() => refundMutation.mutate()}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {refundMutation.isPending ? t.common.loading : t.sales.refund}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
