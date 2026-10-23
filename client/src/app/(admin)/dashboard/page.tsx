'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Activity,
  Info,
  Calendar,
  Sparkles,
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
  const [chartDays, setChartDays] = useState<number>(7);
  const [activeMetric, setActiveMetric] = useState<'all' | 'revenue' | 'orders'>('all');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await api.get('/reports/summary');
      return res.data;
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['reports-chart', chartDays],
    queryFn: async () => {
      const res = await api.get(`/reports/chart?days=${chartDays}`);
      return res.data;
    },
  });

  const { totalPeriodRevenue, totalPeriodProfit, totalPeriodOrders, maxRevenue } = useMemo(() => {
    if (!chartData || !Array.isArray(chartData)) {
      return { totalPeriodRevenue: 0, totalPeriodProfit: 0, totalPeriodOrders: 0, maxRevenue: 0 };
    }
    let rev = 0;
    let prof = 0;
    let ords = 0;
    let maxR = 0;
    for (const d of chartData) {
      rev += d.revenue || 0;
      prof += d.profit || 0;
      ords += d.count || 0;
      if ((d.revenue || 0) > maxR) maxR = d.revenue;
    }
    return {
      totalPeriodRevenue: rev,
      totalPeriodProfit: prof,
      totalPeriodOrders: ords,
      maxRevenue: maxR,
    };
  }, [chartData]);

  const formatCompactCurrency = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return String(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs text-white min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <span className="font-semibold text-slate-300">{label}</span>
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
            {data?.count || 0} {t.dashboard.itemsSold?.toLowerCase() || 'ta chek'}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              {t.dashboard.revenue}:
            </span>
            <span className="font-bold text-white">
              {formatCurrency(data?.revenue || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              {t.dashboard.periodProfit || 'Sof foyda'}:
            </span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(data?.profit || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

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
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            {/* Header: Title + Dynamic Period Buttons + Metric Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {t.dashboard.salesDynamics}
                    </h2>
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                      {chartDays === 7 ? t.dashboard.last7Days : chartDays === 14 ? t.dashboard.last14Days : t.dashboard.last30Days}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {chartDays === 7 ? 'Oxirgi 7 kunlik savdo tahlili va daromad grafigi' : `${chartDays} kunlik umumiy tahlil`}
                  </p>
                </div>
              </div>

              {/* Controls: Metric Switcher + Timeframe Selector */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric pill toggle */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/90 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveMetric('all')}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      activeMetric === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.dashboard.metricAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetric('revenue')}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      activeMetric === 'revenue'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.dashboard.metricRevenue}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetric('orders')}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      activeMetric === 'orders'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.dashboard.metricOrders}
                  </button>
                </div>

                {/* Days range buttons */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/90 p-0.5 text-xs font-semibold">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setChartDays(d)}
                      className={`rounded-lg px-2.5 py-1 transition ${
                        chartDays === d
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {d} {t.dashboard.last7Days.includes('kun') ? 'kun' : 'дн'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  {t.dashboard.periodRevenue}
                </span>
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {formatCurrency(totalPeriodRevenue)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  {t.dashboard.periodProfit}
                </span>
                <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                  {formatCurrency(totalPeriodProfit)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                  {t.dashboard.periodOrders}
                </span>
                <div className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400 mt-1 truncate">
                  {totalPeriodOrders} {t.pos.itemCount}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  {t.dashboard.averageDaily}
                </span>
                <div className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                  {formatCurrency(Math.round(totalPeriodRevenue / chartDays))}
                </div>
              </div>
            </div>

            {/* Empty notice banner if no sales yet */}
            {totalPeriodRevenue === 0 && (
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 px-3.5 py-2.5 text-xs text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{t.dashboard.noSalesPeriodNotice}</span>
                </div>
                <Link
                  href="/pos"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 shrink-0 transition"
                >
                  {t.dashboard.goToPos} &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full mt-2">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155', opacity: 0.3 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155', opacity: 0.3 }}
                    tickFormatter={activeMetric === 'orders' ? (val) => String(val) : formatCompactCurrency}
                    domain={
                      activeMetric === 'orders'
                        ? [0, (dataMax: number) => Math.max(5, dataMax + 1)]
                        : maxRevenue === 0
                        ? [0, 100000]
                        : [0, 'auto']
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {(activeMetric === 'all' || activeMetric === 'revenue') && (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name={t.dashboard.revenue}
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                      activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#3b82f6' }}
                    />
                  )}
                  {activeMetric === 'all' && (
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name={t.dashboard.periodProfit}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorProf)"
                      activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }}
                    />
                  )}
                  {activeMetric === 'orders' && (
                    <Area
                      type="monotone"
                      dataKey="count"
                      name={t.dashboard.periodOrders}
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#a855f7' }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500">
                <Info className="h-6 w-6 text-slate-400" />
                <span>{t.dashboard.noSalesYet}</span>
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
