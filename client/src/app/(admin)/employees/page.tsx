'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/stores/language.store';
import {
  Users,
  Plus,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Edit2,
  Trash2,
  X,
  Mail,
  Lock,
} from 'lucide-react';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER' as 'ADMIN' | 'CASHIER',
    pinCode: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch staff
  const { data: users, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'CASHIER',
      pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      pinCode: u.pinCode || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingUser) {
        const updatePayload: any = { ...data };
        if (!updatePayload.password) delete updatePayload.password;
        return api.patch(`/users/${editingUser.id}`, updatePayload);
      } else {
        return api.post('/users', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || (language === 'uz' ? "Xodimni saqlashda xatolik yuz berdi" : 'Ошибка сохранения сотрудника'));
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(language === 'uz' ? `"${name}" xodimini nofaol qilishni xohlaysizmi?` : `Деактивировать сотрудника "${name}"?`)) {
      try {
        await api.delete(`/users/${id}`);
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      } catch (e: any) {
        alert(language === 'uz' ? 'Xodimni o\'chirishda xatolik' : 'Ошибка при деактивации сотрудника');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.employees.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.employees.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>{t.employees.addEmployee}</span>
        </button>
      </div>

      {/* Staff Presentation: Responsive Cards for Mobile/Tablet (< lg) & Table for Desktop (>= lg) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Mobile / Tablet Cards View (Visible on < lg screens) */}
        <div className="lg:hidden p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              {t.common.loading}
            </div>
          ) : users?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map((u: any) => {
                const isAdmin = u.role === 'ADMIN';

                return (
                  <div
                    key={u.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3"
                  >
                    {/* Header: Name + Status Dot + Role */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                u.isActive ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                              title={u.isActive ? t.employees.active : t.employees.inactive}
                            />
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{u.email}</div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
                          isAdmin
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        {isAdmin ? t.employees.roleAdmin : t.employees.roleCashier}
                      </span>
                    </div>

                    {/* Middle: PIN & Sales count */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400">{t.employees.pin}: </span>
                        <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {u.pinCode || '—'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400">{language === 'uz' ? 'Savdolar soni' : 'Продаж'}: </span>
                        <span className="font-bold text-slate-900 dark:text-white">{u._count?.orders || 0}</span>
                      </div>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>{t.common.edit}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition"
                        title={t.employees.inactive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                <th className="py-3.5 px-4">{language === 'uz' ? 'Xodim' : 'Сотрудник'}</th>
                <th className="py-3.5 px-4">{t.employees.email}</th>
                <th className="py-3.5 px-4">{t.employees.role}</th>
                <th className="py-3.5 px-4">{t.employees.pin}</th>
                <th className="py-3.5 px-4 text-center">{language === 'uz' ? 'Savdolar' : 'Продаж'}</th>
                <th className="py-3.5 px-4">{t.common.status}</th>
                <th className="py-3.5 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    {t.common.loading}
                  </td>
                </tr>
              ) : users?.length > 0 ? (
                users.map((u: any) => {
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isAdmin
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                          }`}
                        >
                          {isAdmin ? (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          {isAdmin ? t.employees.roleAdmin : t.employees.roleCashier}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                          {u.pinCode || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {u._count?.orders || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            u.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                          {u.isActive ? t.employees.active : t.employees.inactive}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            title={t.common.edit}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id, u.name)}
                            title={t.employees.inactive}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

      {/* Modal for Add / Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingUser
                  ? (language === 'uz' ? 'Xodimni tahrirlash' : 'Редактирование сотрудника')
                  : (language === 'uz' ? 'Yangi xodim' : 'Новый сотрудник')}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {t.employees.name} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'uz' ? "Aziz Karimov" : "Иван Петров"}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {t.employees.email} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aziz@store.local"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'uz' ? 'Parol' : 'Пароль'} {editingUser ? (language === 'uz' ? '(o\'zgarmasa bo\'sh qoldiring)' : '(оставьте пустым, если не меняется)') : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.employees.role} *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CASHIER' })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  >
                    <option value="CASHIER">{t.employees.roleCashier}</option>
                    <option value="ADMIN">{t.employees.roleAdmin}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.employees.pinLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="1234"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm font-mono font-bold text-center text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saveMutation.isPending ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
