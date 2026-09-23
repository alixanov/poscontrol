'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/stores/language.store';
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  KeyRound,
  Package,
  Boxes,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Eye,
  X,
  Copy,
  Check,
  Laptop,
  Globe,
  PlusCircle,
  Edit3,
  Trash2,
  ArrowDownLeft,
  ArrowLeftRight,
  Shield,
  Activity,
  Calendar,
} from 'lucide-react';

export default function AuditPage() {
  const { t, language } = useTranslation();
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedActionGroup, setSelectedActionGroup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Fetch Audit Logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', selectedEntity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEntity) params.append('entity', selectedEntity);
      params.append('limit', '100');
      const res = await api.get(`/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const logsList: any[] = logsData?.data || [];

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    let authCount = 0;
    let changeCount = 0;
    const usersSet = new Set<string>();

    logsList.forEach((log) => {
      if (log.user?.id) usersSet.add(log.user.id);

      const act = log.action || '';
      if (act.includes('LOGIN') || act.includes('AUTH')) {
        authCount++;
      } else if (
        act.includes('CREATE') ||
        act.includes('UPDATE') ||
        act.includes('DELETE') ||
        act.includes('STOCK') ||
        act.includes('REFUND')
      ) {
        changeCount++;
      }
    });

    return {
      total: logsData?.total || logsList.length,
      authEvents: authCount,
      dataChanges: changeCount,
      uniqueUsers: usersSet.size || 1,
    };
  }, [logsList, logsData]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logsList.filter((log) => {
      // Action Group Filter
      if (selectedActionGroup !== 'ALL') {
        const act = log.action || '';
        if (selectedActionGroup === 'AUTH' && !act.includes('LOGIN')) return false;
        if (selectedActionGroup === 'STOCK' && !act.includes('STOCK')) return false;
        if (selectedActionGroup === 'PRODUCT' && !act.includes('PRODUCT')) return false;
        if (selectedActionGroup === 'ORDER' && !act.includes('ORDER')) return false;
        if (selectedActionGroup === 'SHIFT' && !act.includes('SHIFT')) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actionMatch = log.action?.toLowerCase().includes(q);
        const entityMatch = log.entity?.toLowerCase().includes(q);
        const detailsMatch = log.details?.toLowerCase().includes(q);
        const userMatch = log.user?.name?.toLowerCase().includes(q);
        const ipMatch = log.ipAddress?.toLowerCase().includes(q);
        return actionMatch || entityMatch || detailsMatch || userMatch || ipMatch;
      }

      return true;
    });
  }, [logsList, selectedActionGroup, searchQuery]);

  // Helper for Badge Colors & Icons based on action
  const getActionBadge = (action: string) => {
    const act = action || '';

    if (act.includes('LOGIN')) {
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/60',
        icon: KeyRound,
      };
    }
    if (act.includes('CREATE')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60',
        icon: PlusCircle,
      };
    }
    if (act.includes('UPDATE')) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60',
        icon: Edit3,
      };
    }
    if (act.includes('DELETE') || act.includes('WRITE_OFF') || act.includes('REFUND')) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60',
        icon: AlertTriangle,
      };
    }
    if (act.includes('STOCK_RECEIPT')) {
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/60',
        icon: ArrowDownLeft,
      };
    }
    if (act.includes('STOCK_TRANSFER')) {
      return {
        bg: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900/60',
        icon: ArrowLeftRight,
      };
    }
    if (act.includes('SHIFT')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
        icon: Clock,
      };
    }

    return {
      bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: Activity,
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Security Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.audit.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.audit.securityActive}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.audit.subtitle}
          </p>
        </div>
      </div>

      {/* Security Overview Cards (4 KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Events */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.audit.totalEvents}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {metrics.total}
              </h3>
            </div>
          </div>
        </div>

        {/* Auth & Access Events */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.audit.authEvents}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {metrics.authEvents}
              </h3>
            </div>
          </div>
        </div>

        {/* Data Changes */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.audit.dataChanges}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {metrics.dataChanges}
              </h3>
            </div>
          </div>
        </div>

        {/* Operators */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.audit.activeOperators}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {metrics.uniqueUsers}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.audit.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-9 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 font-medium transition shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Action Group Filter */}
          <select
            value={selectedActionGroup}
            onChange={(e) => setSelectedActionGroup(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="ALL">{t.audit.allActions}</option>
            <option value="AUTH">{language === 'uz' ? 'Kirish va PIN' : 'Вход и авторизация'}</option>
            <option value="PRODUCT">{language === 'uz' ? 'Tovarlar amallari' : 'Операции с товарами'}</option>
            <option value="STOCK">{language === 'uz' ? 'Ombor amallari' : 'Складские движения'}</option>
            <option value="ORDER">{language === 'uz' ? 'Savdo va Cheklar' : 'Продажи и чеки'}</option>
            <option value="SHIFT">{language === 'uz' ? 'Smenalar' : 'Кассовые смены'}</option>
          </select>

          {/* Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="">{t.audit.allEntities}</option>
            <option value="User">{language === 'uz' ? 'Foydalanuvchilar (User)' : 'Пользователи (User)'}</option>
            <option value="Product">{language === 'uz' ? 'Mahsulotlar (Product)' : 'Товары (Product)'}</option>
            <option value="StockMovement">{language === 'uz' ? 'Ombor harakatlari' : 'Складские движения'}</option>
            <option value="Order">{language === 'uz' ? 'Savdolar / Cheklar' : 'Продажи / Чеки'}</option>
            <option value="CashShift">{language === 'uz' ? 'Kassa smenalari' : 'Кассовые смены'}</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table: Professional Enterprise Styling */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4">{t.audit.action}</th>
                <th className="py-3.5 px-4">{t.audit.entity}</th>
                <th className="py-3.5 px-4">{t.audit.details}</th>
                <th className="py-3.5 px-4">{t.audit.user}</th>
                <th className="py-3.5 px-4">{t.audit.ipAddress}</th>
                <th className="py-3.5 px-4 text-right">{t.audit.date}</th>
                <th className="py-3.5 px-4 text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <span>{t.common.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log: any) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      {/* Action Code Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${badge.bg}`}>
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{log.action}</span>
                        </span>
                      </td>

                      {/* Entity / Object */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {log.entity}
                        </span>
                      </td>

                      {/* Details (with click to inspect) */}
                      <td className="py-3.5 px-4 text-xs text-slate-900 dark:text-slate-200 max-w-md truncate">
                        {log.details || '—'}
                      </td>

                      {/* User & Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {log.user.name?.charAt(0) || 'U'}
                            </div>
                            <div className="text-xs">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {log.user.name}
                              </span>
                              <span className="ml-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                                {log.user.role}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                            {t.audit.systemEvent}
                          </span>
                        )}
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '—'}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-right text-xs text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="rounded-lg p-1 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 transition"
                          title={t.audit.inspectEvent}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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

      {/* Detailed Event Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.audit.inspectEvent}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2))}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="Copy JSON"
                >
                  {copiedId ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Event Content Details */}
            <div className="space-y-4">
              {/* Action and Object Header */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t.audit.action}
                  </span>
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t.audit.entity}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLog.entity} {selectedLog.entityId ? `(#${selectedLog.entityId.slice(0, 8)})` : ''}
                  </span>
                </div>
              </div>

              {/* Description / Message */}
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  {t.audit.details}
                </span>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedLog.details || '—'}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Operator info */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t.audit.user}
                  </span>
                  {selectedLog.user ? (
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{selectedLog.user.name}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{selectedLog.user.email}</div>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {selectedLog.user.role}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">{t.audit.systemEvent}</span>
                  )}
                </div>

                {/* Timestamp */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t.audit.date}
                  </span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatDate(selectedLog.createdAt)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {new Date(selectedLog.createdAt).toISOString()}
                  </div>
                </div>

                {/* IP Address */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t.audit.ipAddress}
                  </span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedLog.ipAddress || '127.0.0.1 (Local)'}
                  </div>
                </div>

                {/* User Agent / Client */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {t.audit.device}
                  </span>
                  <div className="text-slate-600 dark:text-slate-300 truncate" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || 'API / Direct Request'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-slate-900 dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
