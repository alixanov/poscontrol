'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/stores/language.store';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  Image as ImageIcon,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    costPrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    minStockAlert: 5,
    unit: 'шт',
    imageUrl: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, lowStockFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (lowStockFilter) params.append('lowStock', 'true');
      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    const randNum = Math.floor(100000000000 + Math.random() * 900000000000);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: `460${randNum}`,
      categoryId: categories?.[0]?.id || '',
      costPrice: 100,
      salePrice: 180,
      stockQuantity: 10,
      minStockAlert: 5,
      unit: 'шт',
      imageUrl: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId || '',
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      stockQuantity: p.stockQuantity,
      minStockAlert: p.minStockAlert,
      unit: p.unit || 'шт',
      imageUrl: p.imageUrl || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/storage/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка загрузки фото');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingProduct) {
        return api.patch(`/products/${editingProduct.id}`, data);
      } else {
        return api.post('/products', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Ошибка сохранения товара');
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Вы уверены, что хотите удалить товар "${name}"?`)) {
      try {
        await api.delete(`/products/${id}`);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (err: any) {
        alert('Ошибка при удалении товара');
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
            {t.products.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.products.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>{t.products.addProduct}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.products.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="">{t.pos.allCategories}</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
              lowStockFilter
                ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>{t.dashboard.lowStockCount}</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4">{t.products.name}</th>
                <th className="py-3.5 px-4">{t.products.barcode} / {t.products.sku}</th>
                <th className="py-3.5 px-4">{t.products.category}</th>
                <th className="py-3.5 px-4 text-right">{t.products.costPrice}</th>
                <th className="py-3.5 px-4 text-right">{t.products.price}</th>
                <th className="py-3.5 px-4 text-center">{t.products.stock}</th>
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
              ) : productsData?.data?.length > 0 ? (
                productsData.data.map((p: any) => {
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                              }}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : null}
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0 ${p.imageUrl ? 'hidden' : ''}`}>
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{p.unit || t.pos.itemCount}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {p.barcode}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{p.sku}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {p.category?.name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-medium">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.salePrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isLow
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                          }`}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3" />}
                          {p.stockQuantity} {p.unit || t.pos.itemCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title={t.common.edit}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            title={t.common.delete}
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
                  <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {t.common.notFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingProduct ? t.products.editProduct : t.products.addProduct}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t.products.name}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.barcode} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="4607001234567"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 font-mono text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.sku} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SNK-001"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.category}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  >
                    <option value="">{t.products.selectCategory}</option>
                    {categories?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.pos.itemCount}
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="dona, kg, l"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.costPrice} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.price} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm font-semibold text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.stock} ({formData.unit || t.pos.itemCount})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.dashboard.lowStockCount}
                  </label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.products.name} (Rasm)
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.imageUrl ? (
                      <div className="relative">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute -top-1 -right-1 rounded-full bg-red-600 p-0.5 text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-16 w-32 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition">
                        <Upload className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {uploadingImage ? t.common.loading : t.common.add}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="URL"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-3.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
