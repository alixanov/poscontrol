'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/stores/language.store';
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
  const { t } = useTranslation();
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.dashboard.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today Revenue */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.dashboard.todayRevenue}
            </span>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(summary?.todayRevenue)}
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
              {t.common.total}: {formatCurrency(summary?.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Today Profit */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.dashboard.revenue}
            </span>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-base sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
              {formatCurrency(summary?.todayProfit)}
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
              {formatCurrency(summary?.todayRevenue)} - {formatCurrency((summary?.todayRevenue || 0) - (summary?.todayProfit || 0))}
            </p>
          </div>
        </div>

        {/* Average Receipt */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.dashboard.averageCheck}
            </span>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(summary?.averageReceipt)}
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
              {t.dashboard.todayOrders}: {summary?.todayOrdersCount || 0}
            </p>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.dashboard.lowStockCount}
            </span>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="text-base sm:text-2xl font-bold text-amber-600 dark:text-amber-400 truncate">
              {summary?.lowStockProducts || 0}
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
              &le; 5 {t.pos.itemCount}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Revenue Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.dashboard.salesDynamics}</h2>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={t.dashboard.revenue}
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name={t.dashboard.todayRevenue}
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProf)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                {t.dashboard.noSalesYet}
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Structure */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">{t.pos.paymentType}</h2>

          <div className="space-y-4 mt-6">
            {paymentStats && paymentStats.length > 0 ? (
              paymentStats.map((item: any, idx: number) => {
                const isCard = item.method === 'CARD';
                const total = paymentStats.reduce((s: number, p: any) => s + p.amount, 0) || 1;
                const percent = Math.round((item.amount / total) * 100);

                return (
                  <div key={item.method} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {isCard ? (
                          <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {isCard ? t.pos.card : t.pos.cash}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full ${isCard ? 'bg-blue-600 dark:bg-blue-500' : 'bg-emerald-600 dark:bg-emerald-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{percent}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-10">{t.common.notFound}</div>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Products Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.dashboard.topProducts}</h2>
          </div>
        </div>

        {/* Mobile View (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {topProducts && topProducts.length > 0 ? (
            topProducts.map((p: any, index: number) => (
              <div key={p.productId} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {p.soldQuantity} {t.pos.itemCount}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(p.totalRevenue)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
              {t.dashboard.noSalesYet}
            </div>
          )}
        </div>

        {/* Desktop / Tablet Table View (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{t.products.name}</th>
                <th className="py-3 px-4 text-center">{t.dashboard.itemsSold}</th>
                <th className="py-3 px-4 text-right">{t.common.sum}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((p: any, index: number) => (
                  <tr key={p.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-400 dark:text-slate-500">{index + 1}</td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-semibold">{p.name}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                      {p.soldQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.totalRevenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-500">
                    {t.dashboard.noSalesYet}
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
