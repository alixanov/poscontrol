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
  Barcode,
  TrendingUp,
  Cpu,
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#070b14] text-slate-100 p-6 lg:p-14 selection:bg-blue-500/30">
      {/* 1. Subtle Precision Dot Grid Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* 2. Soft Ambient Vignette & Lights */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-emerald-500/5 blur-[160px]" />

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* LEFT COLUMN: Clean, High-End Typography & Frosted Terminal Visual */}
        <div className="flex flex-col justify-between space-y-8 lg:col-span-7">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-white/10">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                Склад & Магазин
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300 border border-white/[0.08]">
                  ERP • POS
                </span>
              </div>
              <p className="text-xs text-slate-400">Автоматизация розницы, склада и кассовых операций</p>
            </div>
          </div>

          {/* Typography Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Торговая экосистема нового поколения
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-[1.15] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Управление магазином, складом и кассой в единой системе
            </h1>

            <p className="text-sm text-slate-400 max-w-xl leading-relaxed font-normal">
              Точный оперативный учёт остатков, мгновенное сканирование штрихкодов на кассе и прозрачная финансовая аналитика без задержек.
            </p>
          </div>

          {/* SINGLE AESTHETIC VISUAL ELEMENT: Frosted Glass Terminal Card */}
          <div className="relative max-w-lg rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl backdrop-blur-2xl">
            {/* Subtle inner highlight glow */}
            <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  Торговая точка №1 • Смена открыта
                </span>
              </div>
              <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-slate-400 border border-white/[0.05]">
                Касса 01 • онлайн
              </span>
            </div>

            {/* Stylized Barcode Scanner Graphic */}
            <div className="rounded-2xl border border-white/[0.05] bg-black/40 p-4 mb-4">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Barcode className="h-4 w-4 text-blue-400" />
                  Сканер EAN-13 готов к считыванию
                </span>
                <span className="font-mono text-slate-300">0.12 сек/чек</span>
              </div>

              {/* Barcode visual lines */}
              <div className="flex h-10 items-center justify-between px-2 bg-slate-950/60 rounded-xl border border-white/[0.04]">
                <div className="flex items-center gap-[3px] opacity-70">
                  <span className="h-6 w-[2px] bg-white" />
                  <span className="h-6 w-[1px] bg-white" />
                  <span className="h-6 w-[3px] bg-white" />
                  <span className="h-6 w-[1px] bg-white" />
                  <span className="h-6 w-[2px] bg-white" />
                  <span className="h-6 w-[4px] bg-white" />
                  <span className="h-6 w-[1px] bg-white" />
                  <span className="h-6 w-[2px] bg-white" />
                  <span className="h-6 w-[3px] bg-white" />
                  <span className="h-6 w-[1px] bg-white" />
                  <span className="h-6 w-[2px] bg-white" />
                  <span className="h-6 w-[1px] bg-white" />
                  <span className="h-6 w-[3px] bg-white" />
                  <span className="h-6 w-[1px] bg-white" />
                </div>
                <span className="font-mono text-xs font-bold text-blue-400 tracking-widest">
                  4607001234567
                </span>
              </div>
            </div>

            {/* Two Key Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Выручка за сегодня</div>
                <div className="text-lg font-bold text-white mt-0.5">34 850 ₽</div>
                <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Чистая маржа: 14 200 ₽
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Складской остаток</div>
                <div className="text-lg font-bold text-white mt-0.5">540 позиций</div>
                <div className="text-[10px] text-blue-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Синхронизация 100%
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Footnote */}
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              Шифрование Argon2
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Сквозной аудит
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">v1.0 Production</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Elevated Glassmorphic Login Box */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-2xl">
            {/* Top delicate hairline */}
            <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Авторизация в системе
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Выберите подходящий способ входа для вашей должности
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="mb-6 flex rounded-xl bg-black/40 p-1 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('credentials');
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
                  activeTab === 'credentials'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
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
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
                  activeTab === 'pin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
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
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                      className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                      className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition active:scale-[0.99] disabled:opacity-50"
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
                      className={`h-4 w-4 rounded-full border transition-all duration-150 ${
                        pinCode.length > idx
                          ? 'border-blue-500 bg-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                          : 'border-white/10 bg-white/[0.04]'
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
                      className="flex h-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-lg font-bold text-white transition hover:bg-white/[0.08] active:scale-95 shadow-sm"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subtle Quick Demo Login Shortcuts */}
            <div className="mt-8 border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>Быстрый демо-доступ:</span>
                <span className="text-slate-400">Автозаполнение</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@store.local', 'admin123')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-medium text-slate-300 hover:border-blue-500/40 hover:text-white transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  Администратор
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cashier1@store.local', 'cashier123')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-medium text-slate-300 hover:border-emerald-500/40 hover:text-white transition"
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
