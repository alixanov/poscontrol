'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  ScrollText,
  Store,
  TerminalSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Аналитика и дашборд', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Каталог товаров', href: '/products', icon: Package },
  { label: 'Склад и остатки', href: '/inventory', icon: Boxes },
  { label: 'История продаж', href: '/sales', icon: ShoppingCart },
  { label: 'Сотрудники', href: '/employees', icon: Users },
  { label: 'Журнал аудита', href: '/audit', icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Store className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-none">Склад & Касса</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Панель управления</span>
        </div>
      </div>

      {/* POS Quick Button */}
      <div className="p-4">
        <Link
          href="/pos"
          className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-[0.99]"
        >
          <TerminalSquare className="h-4 w-4" />
          <span>Перейти в Кассу (POS)</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Основное меню
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition',
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-slate-200 p-4 text-xs text-slate-400 text-center">
        Система v1.0 • Next.js & NestJS
      </div>
    </aside>
  );
}
