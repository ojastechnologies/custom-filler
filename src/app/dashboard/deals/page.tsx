'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DealManagement from '@/components/admin/DealManagement';
import type { DealStats } from '@/components/admin/DealManagement';

const STAT_CARDS: { key: keyof DealStats; label: string; path: string }[] = [
  {
    key: 'active',
    label: 'Active deals',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'usage',
    label: 'Total redemptions',
    path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    key: 'limitReached',
    label: 'Limit reached',
    path: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'expired',
    label: 'Expired',
    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

export default function DealsPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DealStats | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/auth/enter-portal-9f3b2');
    }
  }, [user, loading, isAdmin, router]);

  const handleStats = useCallback((s: DealStats) => setStats(s), []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-20 min-h-screen" style={{ background: 'var(--bg)' }} aria-busy="true">
          <div className="container mx-auto px-4">
            <div className="max-w-[1080px] mx-auto">
              <div className="pt-8 pb-6 space-y-3">
                <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--surface)' }} />
                <div className="h-8 w-64 rounded animate-pulse" style={{ background: 'var(--surface)' }} />
                <div className="h-4 w-80 rounded animate-pulse" style={{ background: 'var(--surface)' }} />
              </div>
              <div className="h-72 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-20 min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-[1080px] mx-auto">

            {/* Workspace header */}
            <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pt-8 pb-6">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>
                  Admin portal
                </p>
                <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-[var(--fg)]">
                  Deals &amp; coupons
                </h1>
                <p className="text-sm mt-1 text-[var(--muted)]">
                  Promotional codes customers apply at checkout.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm font-medium underline decoration-[var(--line)] underline-offset-4 transition-colors hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded disabled:opacity-50"
                style={{ color: 'var(--muted)' }}
              >
                ← Back to dashboard
              </button>
            </header>

            {/* Deals workspace */}
            <section aria-label="Deals">
              <DealManagement onStatsChange={handleStats} />
            </section>

            {/* Live totals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {STAT_CARDS.map(card => (
                <div
                  key={card.key}
                  className="rounded-xl border p-5 bg-[var(--raised)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--surface)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true" style={{ color: 'var(--muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.path} />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-[var(--muted)] truncate">{card.label}</p>
                      <p className="text-[22px] leading-tight font-semibold tabular-nums text-[var(--fg)]">
                        {stats ? stats[card.key] : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
