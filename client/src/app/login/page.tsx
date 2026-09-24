'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/stores/language.store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import api from '@/lib/api';
import {
  Store,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Barcode,
  Printer,
  Boxes,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'credentials' | 'pin'>('credentials');
  const [email, setEmail] = useState('admin@store.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
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
        err.response?.data?.message || t.login.authError,
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
      setError(err.response?.data?.message || t.login.pinError);
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
    <div className="relative flex min-h-screen w-full bg-gradient-to-br from-sky-50/60 via-slate-50/80 to-blue-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Top Floating Language & Theme Controls on Large Screens */}
      <div className="absolute right-6 top-6 z-30 hidden lg:flex items-center gap-2.5">
        <ThemeToggle />
        <LanguageSwitcher showIcon />
      </div>

      {/* Cloud / Atmospheric soft airy backdrop */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-[500px] w-[500px] rounded-full bg-sky-200/35 dark:bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute top-10 left-1/4 h-[350px] w-[450px] rounded-full bg-white/90 dark:bg-indigo-600/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[450px] w-[600px] rounded-full bg-sky-100/50 dark:bg-cyan-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[500px] w-[700px] rounded-full bg-white/90 dark:bg-blue-900/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[450px] w-[500px] rounded-full bg-blue-200/25 dark:bg-violet-900/15 blur-3xl" />

      {/* LEFT COLUMN: Clean Enterprise Presentation */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-8 lg:p-12 xl:p-16 z-10">
        {/* Top Brand Header */}
        <div>
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.common.appName}
                <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 uppercase tracking-wider">
                  {t.common.systemType}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.common.systemSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Center Presentation: Balanced and clean */}
        <div className="my-auto py-8 max-w-xl xl:max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-3.5 w-3.5" />
            {t.login.badge}
          </span>

          <h1 className="text-3xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18]">
            {t.login.heroTitle}
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t.login.heroDescription}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-slate-900/80 px-4 py-2.5 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Barcode className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {t.login.features.scan}
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-slate-900/80 px-4 py-2.5 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Printer className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {t.login.features.print}
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-slate-900/80 px-4 py-2.5 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {t.login.features.offline}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom clean version */}
        <div className="text-xs text-slate-400 dark:text-slate-500">
          <span>{t.common.copyright}</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Elevated Crisp Login Card */}
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-12 lg:w-1/2 xl:w-5/12 z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header (visible only on smaller screens) */}
          <div className="mb-6 lg:hidden flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{t.common.appName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t.login.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-slate-200/70 dark:shadow-black/40 backdrop-blur-md">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t.login.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.login.subtitle}
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="mb-6 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('credentials');
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  activeTab === 'credentials'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{t.login.tabCredentials}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pin');
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                  activeTab === 'pin'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{t.login.tabPin}</span>
              </button>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'credentials' ? (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.login.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.login.emailPlaceholder}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.login.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.login.passwordPlaceholder}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 py-2.5 pl-10 pr-11 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{loading ? t.login.submitting : t.login.submitButton}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t.login.pinTitle}</p>

                {/* PIN Dots indicator */}
                <div className="mb-5 flex gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                        pinCode.length > idx
                          ? 'border-blue-600 bg-blue-600 scale-110 shadow-sm'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
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
                      className="flex h-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-800 dark:text-slate-100 transition hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 shadow-sm"
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
