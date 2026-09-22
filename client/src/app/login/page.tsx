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
  Barcode,
  Boxes,
  TrendingUp,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
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
    <div className="flex min-h-screen w-full bg-slate-900">
      {/* LEFT COLUMN: Serious Enterprise Branding & Features Showcase */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 text-white border-r border-slate-800">
        {/* Ambient Decorative Background Glows */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-1/2 h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Склад & Магазин
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                  ERP & POS
                </span>
              </div>
              <p className="text-xs text-slate-400">Система автоматизации розничной торговли и логистики</p>
            </div>
          </div>
        </div>

        {/* Center Presentation: Modest, Calm, Aesthetic Typography */}
        <div className="relative z-10 my-auto py-10 max-w-lg space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/60 px-3 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/50 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Платформа автоматизации торговли
            </span>

            <h2 className="text-3xl xl:text-4xl font-light tracking-tight text-white leading-tight">
              Простота в управлении.<br />
              <span className="font-semibold text-slate-200">Точность в каждой детали.</span>
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              Единое цифровое пространство для кассовых расчётов, оперативного складского учёта и прозрачного финансового контроля.
            </p>
          </div>

          {/* Understated, delicate feature list (without heavy cards) */}
          <div className="space-y-3.5 pt-2 border-t border-slate-800/60">
            <div className="flex items-baseline gap-4 text-xs">
              <span className="font-mono text-slate-600 font-semibold">01</span>
              <div>
                <span className="font-semibold text-slate-200">Кассовый терминал</span>
                <span className="text-slate-500"> — мгновенное сканирование штрихкодов, расчёт сдачи и чек 80мм</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4 text-xs">
              <span className="font-mono text-slate-600 font-semibold">02</span>
              <div>
                <span className="font-semibold text-slate-200">Складской учёт</span>
                <span className="text-slate-500"> — контроль остатков, приходные накладные, списания и перемещения</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4 text-xs">
              <span className="font-mono text-slate-600 font-semibold">03</span>
              <div>
                <span className="font-semibold text-slate-200">Финансовая аналитика</span>
                <span className="text-slate-500"> — расчёт валовой прибыли, средний чек и динамика выручки</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4 text-xs">
              <span className="font-mono text-slate-600 font-semibold">04</span>
              <div>
                <span className="font-semibold text-slate-200">Безопасность и аудит</span>
                <span className="text-slate-500"> — роли сотрудников, PIN-авторизация и сквозной журнал действий</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust / Status Badge */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Все сервисы системы активны и работают штатно</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">v1.0 • Enterprise Ready</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Serious Clean Login Box */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 xl:w-5/12 bg-slate-950">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header (visible only on smaller screens) */}
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white">Склад & Магазин</div>
              <div className="text-xs text-slate-400">Вход в рабочую среду</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Авторизация в системе
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Выберите способ входа в зависимости от вашей должности
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="mb-6 flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/50">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
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
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
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
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{loading ? 'Проверка данных...' : 'Войти в панель'}</span>
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
                      className="flex h-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/60 text-lg font-bold text-white transition hover:bg-slate-700 active:scale-95 shadow-sm"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Demo Login Cards */}
            <div className="mt-8 border-t border-slate-800 pt-5">
              <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Быстрый вход для тестирования:
              </span>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@store.local', 'admin123')}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-left transition hover:border-blue-500/50 hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Администратор (Полный доступ)</div>
                      <div className="text-[10px] text-slate-400">admin@store.local</div>
                    </div>
                  </div>
                  <span className="rounded-md bg-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    PIN: 1111
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('cashier1@store.local', 'cashier123')}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-left transition hover:border-emerald-500/50 hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Кассир 1 (POS-терминал)</div>
                      <div className="text-[10px] text-slate-400">cashier1@store.local</div>
                    </div>
                  </div>
                  <span className="rounded-md bg-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    PIN: 2222
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
