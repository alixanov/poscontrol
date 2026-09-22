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
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* LEFT COLUMN: Clean, Bright Enterprise Branding & Presentation */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50/30 to-indigo-50/40 p-12 lg:p-16 border-r border-slate-200/80">
        {/* Soft Ambient Background Circles */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />

        {/* Top Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                Склад & Магазин
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                  ERP & POS
                </span>
              </div>
              <p className="text-xs text-slate-500">Система автоматизации розничной торговли и логистики</p>
            </div>
          </div>
        </div>

        {/* Center Presentation: The Clean, Minimalist Text */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/70 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            Автоматизация торговли и склада
          </span>

          <h1 className="text-3xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.18]">
            Управление магазином, складом и кассой в единой системе
          </h1>

          <p className="text-base text-slate-600 leading-relaxed font-normal">
            Надежная платформа для оперативного учета складских остатков, продаж через быстрый кассовый терминал и финансовой аналитики в реальном времени.
          </p>

        </div>

        {/* Bottom clean version */}
        <div className="relative z-10 text-xs text-slate-400">
          <span>Склад & Магазин © 2026. Все права защищены.</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Crisp Pure White Elevated Login Box */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 xl:w-5/12 bg-white lg:bg-slate-50/50">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header (visible only on smaller screens) */}
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Склад & Магазин</div>
              <div className="text-xs text-slate-500">Вход в рабочую среду</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Авторизация в системе
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Выберите способ входа в зависимости от вашей должности
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('credentials');
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  activeTab === 'credentials'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Быстрый PIN (Кассир)</span>
              </button>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'credentials' ? (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Электронная почта
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@store.local"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{loading ? 'Проверка данных...' : 'Войти в панель'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-500 mb-3">Введите 4-значный персональный PIN-код</p>

                {/* PIN Dots indicator */}
                <div className="mb-5 flex gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                        pinCode.length > idx
                          ? 'border-blue-600 bg-blue-600 scale-110 shadow-sm'
                          : 'border-slate-300 bg-slate-100'
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
                      className="flex h-12 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-800 transition hover:bg-slate-200 active:scale-95 shadow-sm"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
