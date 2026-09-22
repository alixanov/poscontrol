'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/stores/language.store';
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

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { label: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { label: t.nav.products, href: '/products', icon: Package },
    { label: t.nav.inventory, href: '/inventory', icon: Boxes },
    { label: t.nav.sales, href: '/sales', icon: ShoppingCart },
    { label: t.nav.employees, href: '/employees', icon: Users },
    { label: t.nav.audit, href: '/audit', icon: ScrollText },
  ];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Store className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white leading-none">{t.common.appName}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.nav.mainMenu}</span>
        </div>
      </div>

      {/* POS Quick Button */}
      <div className="p-4">
        <Link
          href="/pos"
          className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-[0.99]"
        >
          <TerminalSquare className="h-4 w-4" />
          <span>{t.nav.posButton}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t.nav.mainMenu}
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
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500',
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-400 dark:text-slate-500 text-center">
        {t.nav.systemVersion}
      </div>
    </aside>
  );
}
