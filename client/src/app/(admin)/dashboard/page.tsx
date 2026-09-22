'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Package,
  CreditCard,
  Banknote,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await api.get('/reports/summary');
      return res.data;
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ['reports-chart'],
    queryFn: async () => {
      const res = await api.get('/reports/chart?days=7');
      return res.data;
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ['reports-top-products'],
    queryFn: async () => {
      const res = await api.get('/reports/top-products?limit=5');
      return res.data;
    },
  });

  const { data: paymentStats } = useQuery({
    queryKey: ['reports-payments'],
    queryFn: async () => {
      const res = await api.get('/reports/payments');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Аналитическая панель
        </h1>
        <p className="text-sm text-slate-500">
          Сводные данные по продажам, выручке и складским остаткам
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Выручка за сегодня
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary?.todayRevenue)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Всего за всё время: {formatCurrency(summary?.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Today Profit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Чистая прибыль сегодня
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(summary?.todayProfit)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Маржа (выручка минус себестоимость)
            </p>
          </div>
        </div>

        {/* Average Receipt */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Средний чек / Заказы
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary?.averageReceipt)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Чеков сегодня: {summary?.todayOrdersCount || 0}
            </p>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Заканчивающиеся товары
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-600">
              {summary?.lowStockProducts || 0}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Позиций с остатком &le; 5 шт
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Revenue Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Динамика продаж и прибыли</h2>
              <p className="text-xs text-slate-500">Сравнение выручки и валовой прибыли за 7 дней</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Выручка"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Прибыль"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProf)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Недостаточно данных для графика
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Structure */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Способы оплаты</h2>
          <p className="text-xs text-slate-500 mb-6">Доля наличных и безналичных платежей</p>

          <div className="space-y-4">
            {paymentStats && paymentStats.length > 0 ? (
              paymentStats.map((item: any, idx: number) => {
                const isCard = item.method === 'CARD';
                const total = paymentStats.reduce((s: number, p: any) => s + p.amount, 0) || 1;
                const percent = Math.round((item.amount / total) * 100);

                return (
                  <div key={item.method} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        {isCard ? (
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Banknote className="h-4 w-4 text-emerald-600" />
                        )}
                        {isCard ? 'Банковская карта' : 'Наличные'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full ${isCard ? 'bg-blue-600' : 'bg-emerald-600'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500">{percent}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-sm text-slate-400 py-10">Нет данных</div>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Лидеры продаж</h2>
            <p className="text-xs text-slate-500">Самые продаваемые товары по количеству</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Наименование товара</th>
                <th className="py-3 px-4 text-center">Продано шт.</th>
                <th className="py-3 px-4 text-right">Сумма продаж</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((p: any, index: number) => (
                  <tr key={p.productId} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">{p.name}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                      {p.soldQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(p.totalRevenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Данные о продажах пока отсутствуют
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
