'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/stores/language.store';
import { ScrollText, ShieldAlert, Filter, User } from 'lucide-react';

export default function AuditPage() {
  const { t, language } = useTranslation();
  const [selectedEntity, setSelectedEntity] = useState('');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', selectedEntity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEntity) params.append('entity', selectedEntity);
      const res = await api.get(`/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.audit.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.audit.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="">{t.audit.allEntities}</option>
            <option value="User">{language === 'uz' ? 'Foydalanuvchilar / Kirish' : 'Пользователи / Вход'}</option>
            <option value="Product">{language === 'uz' ? 'Mahsulotlar' : 'Товары'}</option>
            <option value="StockMovement">{language === 'uz' ? 'Ombor harakatlari' : 'Складские движения'}</option>
            <option value="Order">{language === 'uz' ? 'Savdolar / Cheklar' : 'Продажи / Чеки'}</option>
            <option value="CashShift">{language === 'uz' ? 'Kassa smenalari' : 'Кассовые смены'}</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4">{t.audit.action}</th>
                <th className="py-3.5 px-4">{t.audit.entity}</th>
                <th className="py-3.5 px-4">{t.audit.details}</th>
                <th className="py-3.5 px-4">{t.audit.user}</th>
                <th className="py-3.5 px-4 text-right">{t.audit.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    {t.common.loading}
                  </td>
                </tr>
              ) : logsData?.data?.length > 0 ? (
                logsData.data.map((log: any) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 dark:text-slate-200 max-w-md truncate">
                        {log.details || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {log.user ? `${log.user.name} (${log.user.role})` : (language === 'uz' ? 'Tizim' : 'Система')}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {t.common.notFound}
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
