'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import {
  Store,
  KeyRound,
  Mail,
  Lock,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Receipt,
  ArrowRight,
  Sparkles,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [activeTab, setActiveTab] = useState<'credentials' | 'pin'>('credentials');
  const [email, setEmail] = useState('admin@store.local');
  const [password, setPassword] = useState('admin123');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);

      if (res.data.user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/pos');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Не удалось выполнить вход. Проверьте правильность email и пароля.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (pinToUse?: string) => {
    const pin = pinToUse || pinCode;
    if (!pin) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/pin-login', { pinCode: pin });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);

      if (res.data.user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/pos');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный PIN-код сотрудника');
    } finally {
      setLoading(false);
    }
  };

  const handlePinKey = (digit: string) => {
    if (pinCode.length < 6) {
      const newPin = pinCode + digit;
      setPinCode(newPin);
      if (newPin.length === 4) {
        handlePinLogin(newPin);
      }
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setActiveTab('credentials');
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 lg:p-12">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[550px] w-[550px] rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[550px] w-[550px] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[130px]" />

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* LEFT COLUMN: Brand Presentation & Live Store Widget */}
        <div className="flex flex-col justify-between space-y-8 lg:col-span-7">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xl font-black tracking-tight text-white">
                Склад & Магазин
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                  ERP & POS
                </span>
              </div>
              <p className="text-xs text-slate-400">Система автоматизации торговли, кассы и склада</p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Единый контур управления торговлей
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
              Управление магазином, складом и кассой в единой системе
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Оперативный учёт товарных остатков, высокоскоростной кассовый терминал со сканированием штрихкодов EAN-13 и прозрачная финансовая аналитика в реальном времени.
            </p>
          </div>

          {/* Live Store Status Preview Widget (Visual Anchor) */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-2xl max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-white tracking-wide">
                  Торговая точка: Магазин №1 • Смена открыта
                </span>
              </div>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                Касса №1
              </span>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                <div className="text-[11px] font-medium text-slate-400">Выручка за смену</div>
                <div className="text-base font-extrabold text-white mt-1">34 850 ₽</div>
                <div className="text-[10px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  +14% к плану
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                <div className="text-[11px] font-medium text-slate-400">Пробито чеков</div>
                <div className="text-base font-extrabold text-white mt-1">42</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ср. чек: 830 ₽</div>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                <div className="text-[11px] font-medium text-slate-400">Складской остаток</div>
                <div className="text-base font-extrabold text-white mt-1">540 шт</div>
                <div className="text-[10px] font-semibold text-blue-400 mt-0.5 flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Норма 98%
                </div>
              </div>
            </div>

            {/* Recent Live Receipt Strip */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/30 px-3 py-2 text-xs text-slate-400 border border-slate-800/40">
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono text-slate-300">Чек #CHK-10042</span>
                <span className="text-slate-500">• 3 товара</span>
              </div>
              <span className="font-bold text-white">1 290 ₽ (Оплачено)</span>
            </div>
          </div>

          {/* System Security Badges */}
          <div className="flex items-center gap-6 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Ролевой доступ RBAC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Сквозной аудит операций</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">v1.0 Production</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Elevated Modern Login Box */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Авторизация в системе
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Выберите подходящий способ входа для вашей должности
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="mb-6 flex rounded-xl bg-slate-950/70 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('credentials');
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  activeTab === 'credentials'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email и пароль</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pin');
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  activeTab === 'pin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Быстрый PIN (Кассир)</span>
              </button>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-400 border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'credentials' ? (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Электронная почта
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@store.local"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{loading ? 'Проверка данных...' : 'Войти в систему'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-400 mb-3">Введите 4-значный персональный PIN-код</p>

                {/* PIN Dots indicator */}
                <div className="mb-5 flex gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                        pinCode.length > idx
                          ? 'border-blue-500 bg-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Touch / Click Numpad */}
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === 'C') setPinCode('');
                        else if (k === '⌫') setPinCode((prev) => prev.slice(0, -1));
                        else handlePinKey(k);
                      }}
                      className="flex h-12 items-center justify-center rounded-xl bg-slate-950/70 border border-slate-800 text-lg font-bold text-white transition hover:bg-slate-800 active:scale-95 shadow-sm"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subtle Demo Access Switcher */}
            <div className="mt-8 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Быстрый демо-доступ:</span>
                <span className="text-[11px] text-slate-500">Автозаполнение</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@store.local', 'admin123')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500 hover:text-white transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  Администратор
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cashier1@store.local', 'cashier123')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 py-2 text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-white transition"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Кассир 1
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
