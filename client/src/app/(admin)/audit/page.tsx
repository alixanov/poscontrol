'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ScrollText, ShieldAlert, Filter, User } from 'lucide-react';

export default function AuditPage() {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Журнал аудита действий
          </h1>
          <p className="text-sm text-slate-500">
            Фиксация критических событий, изменений товаров, кассовых операций и входов
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="">Все объекты</option>
            <option value="User">Пользователи / Вход</option>
            <option value="Product">Товары</option>
            <option value="StockMovement">Складские движения</option>
            <option value="Order">Продажи / Чеки</option>
            <option value="CashShift">Кассовые смены</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Действие</th>
                <th className="py-3.5 px-4">Объект</th>
                <th className="py-3.5 px-4">Детализация</th>
                <th className="py-3.5 px-4">Сотрудник</th>
                <th className="py-3.5 px-4 text-right">Дата и время</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Загрузка журнала аудита...
                  </td>
                </tr>
              ) : logsData?.data?.length > 0 ? (
                logsData.data.map((log: any) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 max-w-md truncate">
                        {log.details || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {log.user ? `${log.user.name} (${log.user.role})` : 'Система'}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-400 font-mono">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Записей в журнале аудита не обнаружено
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
