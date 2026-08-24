'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { fetchOrders, updateOrderStatus, Order, OrderItem } from '@/services/ordersService';

type Toast = { message: string; tone: 'success' | 'error' } | null;
type OrderWithExtras = Order & { discount_amount?: number | null; deal_code?: string | null };

const STATUS_FILTERS = ['all', 'processing', 'shipped', 'delivered', 'cancelled', 'pending'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  processing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

function money(n: number | null | undefined) {
  return `$${(typeof n === 'number' ? n : 0).toFixed(2)}`;
}

function shortDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function datePart(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timePart(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fullDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold ${STATUS_PILL[status] || STATUS_PILL.cancelled}`}>
      {status}
    </span>
  );
}

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>(
    [1, total, current - 1, current, current + 1].filter(n => n >= 1 && n <= total),
  );
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push('…');
    out.push(n);
    prev = n;
  }
  return out;
}

export default function OrdersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Order | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const [recoverState, setRecoverState] = useState<'idle' | 'fetching' | 'ready' | 'applying'>('idle');
  const [recoverData, setRecoverData] = useState<Record<string, unknown> | null>(null);
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const data = await Promise.race([
        fetchOrders(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Please try again.')), 8000)),
      ]);
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin) loadOrders();
  }, [user, loading, isAdmin, loadOrders]);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/auth/enter-portal-9f3b2');
  }, [user, loading, router]);

  // ESC closes the side panel
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  // Lock body scroll while the panel is open
  useEffect(() => {
    document.body.style.overflow = panelOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [panelOpen]);

  const filtered = useMemo(() => {
    if (filter === 'pending') return orders.filter(o => o.status === 'pending');
    const pool = orders.filter(o => o.status !== 'pending');
    if (filter === 'all') return pool;
    return pool.filter(o => o.status === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of STATUS_FILTERS.slice(1)) c[s] = 0;
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const openPanel = (order: Order) => {
    setSelected(order);
    setPanelOpen(true);
  };

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    // Let the slide-out finish before dropping the content
    setTimeout(() => setSelected(null), 200);
  }, []);

  // Keep the draft in sync with whichever order is open
  useEffect(() => {
    setDraftStatus(selected?.status ?? '');
    setRecoverState('idle');
    setRecoverData(null);
    setRecoverError(null);
    setSyncOpen(false);
    setConfirmDelete(false);
    setDeleting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.status]);

  const dirty = Boolean(selected && draftStatus && draftStatus !== selected.status);

  const saveStatus = async () => {
    if (!selected || !dirty) return;
    const next = draftStatus as Order['status'];
    try {
      setIsUpdating(true);
      await updateOrderStatus(selected.id, next);
      const updated: Order = { ...selected, status: next };
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      setSelected(updated);
      setToast({ message: `#${updated.order_number} → ${next}`, tone: 'success' });
    } catch (err: unknown) {
      console.error('Error updating order status:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update order',
        tone: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // ---- Step 1: fetch details from Stripe (no writes) ----
  const recoverFetch = async () => {
    if (!selected) return;
    setRecoverState('fetching');
    setRecoverError(null);
    setConfirmDelete(false);
    try {
      const res = await fetch('/api/stripe/reconcile-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selected.id, mode: 'fetch' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch from Stripe');
      setRecoverData(json.details);
      setRecoverState('ready');
    } catch (err: unknown) {
      setRecoverError(err instanceof Error ? err.message : 'Failed to fetch from Stripe');
      setRecoverState('idle');
    }
  };

  const deleteRecord = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/stripe/reconcile-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selected.id, mode: 'delete' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      const num = selected.order_number;
      setOrders(prev => prev.filter(o => o.id !== selected.id));
      closePanel();
      setSyncOpen(false);
      setToast({ message: `#${num} deleted`, tone: 'success' });
    } catch (err: unknown) {
      setRecoverError(err instanceof Error ? err.message : 'Delete failed');
      setSyncOpen(true);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const openSync = () => {
    setSyncOpen(true);
    if (recoverState === 'idle' && !recoverData) recoverFetch();
  };

  // ---- Step 2: apply after admin review ----
  const recoverApply = async () => {
    if (!selected) return;
    setRecoverState('applying');
    try {
      const res = await fetch('/api/stripe/reconcile-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selected.id, mode: 'apply' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to apply Stripe details');
      const updated: Order = json.order;
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      setSelected(updated);
      setToast({ message: `#${updated.order_number} recovered from Stripe`, tone: 'success' });
      setRecoverState('idle');
      setRecoverData(null);
      setSyncOpen(false);
    } catch (err: unknown) {
      setRecoverError(err instanceof Error ? err.message : 'Failed to apply');
      setRecoverState('ready');
    }
  };

  // Pagination
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filtered.length, safePage * PAGE_SIZE);

  const goTo = (n: number) => {
    setPage(Math.min(Math.max(1, n), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return null;

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
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-[var(--fg)]">Orders</h1>
              <p className="text-sm mt-1 text-[var(--muted)]">
                {filter === 'pending'
                  ? 'Unpaid checkout sessions — usually abandoned carts. If a customer says they paid, open the order and use Sync from Stripe.'
                  : 'Paid orders, from processing through delivered.'}
              </p>
                {!loadingOrders && (
                  <p className="text-sm mt-0.5 text-[var(--muted)]">
                    {orders.length} total{counts.pending > 0 && (
                      <> · <span className="font-semibold" style={{ color: 'var(--accent)' }}>{counts.pending} awaiting payment</span></>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={loadOrders}
                disabled={loadingOrders}
                className="text-sm font-medium underline decoration-[var(--line)] underline-offset-4 transition-colors hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded disabled:opacity-50"
                style={{ color: 'var(--muted)' }}
              >
                {loadingOrders ? 'Refreshing…' : 'Refresh'}
              </button>
            </header>

            {/* Status filters */}
            {!loadingOrders && !error && orders.length > 0 && (
              <nav aria-label="Filter by status" className="flex flex-wrap gap-2 mb-5">
                {STATUS_FILTERS.map((s) => {
                  const isActive = filter === s;
                  const n = counts[s] || 0;
                  if (s !== 'all' && n === 0) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => { setFilter(s); setPage(1); }}
                      aria-pressed={isActive}
                      className={`h-8 rounded-full border px-3 text-sm font-medium capitalize transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                        isActive ? 'border-transparent' : 'hover:border-[var(--accent)]'
                      }`}
                      style={{
                        background: isActive ? 'var(--accent-tint)' : 'transparent',
                        borderColor: isActive ? 'transparent' : 'var(--line)',
                        color: isActive ? 'var(--accent)' : 'var(--muted)',
                      }}
                    >
                      {s === 'all' ? 'All' : s}
                      <span className="ml-1.5 tabular-nums opacity-70">{n}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Data-fetch error */}
            {error && (
              <div role="alert" className="mb-6 rounded-xl border px-5 py-4 bg-[var(--raised)]" style={{ borderColor: '#f2c4c4' }}>
                <p className="text-sm font-medium" style={{ color: '#b42318' }}>Couldn’t load orders</p>
                <p className="text-sm mt-0.5 text-[var(--muted)]">{error}</p>
                <div className="flex items-center gap-4 mt-2.5">
                  <button onClick={() => setError(null)} className="text-sm underline underline-offset-4 text-[var(--muted)]">
                    Dismiss
                  </button>
                  <button onClick={loadOrders} className="text-sm font-semibold underline underline-offset-4" style={{ color: 'var(--accent)' }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Orders list */}
            {loadingOrders ? (
              <div className="space-y-2" aria-busy="true">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            ) : !error && filtered.length === 0 ? (
              <div className="text-center py-14 rounded-xl border border-dashed" style={{ borderColor: 'var(--line)' }}>
                <p className="font-medium text-[var(--fg)]">
                  {orders.length === 0 ? 'No orders yet' : `No ${filter !== 'all' ? filter + ' ' : ''}orders`}
                </p>
                <p className="text-sm mt-1 text-[var(--muted)]">
                  {orders.length === 0
                    ? 'Orders appear here the moment customers check out.'
                    : 'Try a different status filter.'}
                </p>
              </div>
            ) : !error && (
              <>
              <section aria-label="Orders" className="rounded-xl border overflow-hidden bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
                {/* Column headers */}
                <div className="hidden md:grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_44px_84px_72px_100px_124px] gap-4 px-5 py-2.5 border-b" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Order</span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Customer</span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-right text-[var(--muted)]">Items</span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-right text-[var(--muted)]">Total</span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-right text-[var(--muted)]">Placed</span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-right text-[var(--muted)]">Payment</span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-right text-[var(--muted)]">Status</span>
                </div>

                <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
                  {paged.map((order) => {
                    const o = order as OrderWithExtras;
                    const itemCount = order.order_items?.reduce((n, it) => n + it.quantity, 0) ?? 0;
                    return (
                      <li key={order.id} role="row" style={{ borderColor: 'var(--line)' }}>
                        <button
                          onClick={() => openPanel(order)}
                          className="w-full md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_44px_84px_72px_100px_124px] gap-4 items-center text-left px-5 py-3 transition-colors duration-150 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                          aria-haspopup="dialog"
                          aria-label={`Open order ${order.order_number}`}
                        >
                          <span role="cell" className="block font-mono text-sm font-medium truncate text-[var(--fg)]">
                            #{order.order_number}
                          </span>
                          <span role="cell" className="hidden md:block min-w-0">
                            <span className="block text-sm font-medium truncate text-[var(--fg)]">
                              {order.customer_name || '—'}
                            </span>
                            <span className="block text-[13px] truncate text-[var(--muted)]">{order.customer_email}</span>
                            {order.customer_phone && (
                              <span className="block text-[13px] tabular-nums truncate text-[var(--muted)]">{order.customer_phone}</span>
                            )}
                          </span>
                          <span role="cell" className="hidden md:block text-sm tabular-nums text-right text-[var(--muted)]">
                            {itemCount}
                          </span>
                          <span role="cell" className="hidden md:block text-sm tabular-nums font-semibold text-right text-[var(--fg)]">
                            {money(order.total_amount)}
                          </span>
                          <span role="cell" className="flex flex-col items-end leading-tight text-[13px] tabular-nums text-right text-[var(--muted)]">
                            <span>{datePart(order.created_at)}</span>
                            <span>{timePart(order.created_at)}</span>
                          </span>
                          <span role="cell" className="hidden md:flex items-center justify-end">
                            {(() => {
                              const pay = (o.payment_status ?? (o.status === 'pending' ? 'unpaid' : 'paid')) as string;
                              return pay === 'paid' ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Paid</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold capitalize whitespace-nowrap text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{pay}</span>
                              );
                            })()}
                          </span>
                          <span role="cell" className="flex items-center justify-start md:justify-end gap-2 mt-1.5 md:mt-0">
                            <StatusPill status={order.status} />
                            <span className="md:hidden text-[13px] tabular-nums text-[var(--muted)]">
                              {money(order.total_amount)} · {itemCount} item{itemCount === 1 ? '' : 's'} · {shortDate(order.created_at)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Pagination */}
              {filtered.length > 0 && (
                <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <p className="text-[13px] tabular-nums text-[var(--muted)]">
                    Showing {rangeStart}–{rangeEnd} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => goTo(safePage - 1)}
                      disabled={safePage <= 1}
                      aria-label="Previous page"
                      className="h-8 rounded-md border px-2.5 text-sm font-medium disabled:opacity-40 transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
                    >
                      ‹ Prev
                    </button>
                    {pageWindow(safePage, totalPages).map((pn, i) =>
                      pn === '…' ? (
                        <span key={`gap-${i}`} className="px-1 text-[var(--muted)]">…</span>
                      ) : (
                        <button
                          key={pn}
                          onClick={() => goTo(pn)}
                          aria-current={pn === safePage ? 'page' : undefined}
                          className={`h-8 min-w-8 rounded-md border px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                            pn === safePage ? 'border-transparent' : 'hover:bg-[var(--surface)]'
                          }`}
                          style={{
                            background: pn === safePage ? 'var(--accent-tint)' : 'transparent',
                            borderColor: pn === safePage ? 'transparent' : 'var(--line)',
                            color: pn === safePage ? 'var(--accent)' : 'var(--fg)',
                          }}
                        >
                          {pn}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() => goTo(safePage + 1)}
                      disabled={safePage >= totalPages}
                      aria-label="Next page"
                      className="h-8 rounded-md border px-2.5 text-sm font-medium disabled:opacity-40 transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
                    >
                      Next ›
                    </button>
                  </div>
                </nav>
              )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ---- Side panel ---- */}
      <div
        aria-hidden={!panelOpen}
        onClick={closePanel}
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          panelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(15,23,42,0.45)' }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={selected ? `Order ${selected.order_number}` : 'Order details'}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[560px] lg:w-[640px] flex flex-col border-l shadow-[-12px_0_32px_rgba(15,23,42,0.18)] bg-[var(--raised)] transition-transform duration-200 ${
          panelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ borderColor: 'var(--line)', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {selected && (() => {
          const so = selected as OrderWithExtras;
          const addr = [
            so.shipping_line1, so.shipping_line2,
            [so.shipping_city, so.shipping_state, so.shipping_postal_code].filter(Boolean).join(', '),
            so.shipping_country,
          ].filter(Boolean);

          return (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <p className="font-mono text-sm font-semibold truncate text-[var(--fg)]">#{so.order_number}</p>
                    <StatusPill status={so.status} />
                  </div>
                  <p className="text-[13px] mt-0.5 text-[var(--muted)]">{fullDate(so.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {so.stripe_session_id && (
                    <button
                      onClick={openSync}
                      className="text-[13px] font-semibold hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-sm"
                      style={{ color: 'var(--accent)' }}
                    >
                      Sync from Stripe
                    </button>
                  )}
                  <button
                    onClick={closePanel}
                    aria-label="Close panel"
                    className="h-8 w-8 -mr-1.5 rounded-md flex items-center justify-center text-lg leading-none text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
                {/* Customer */}
                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-2 text-[var(--muted)]">Customer</h3>
                  <dl className="space-y-1.5 text-sm [&>div]:grid [&>div]:grid-cols-[84px_minmax(0,1fr)] [&>div]:gap-x-3 [&_dd]:min-w-0">
                    {so.customer_name && (
                      <div className="flex gap-2"><dt className="text-[var(--muted)]">Name</dt><dd className="font-medium text-[var(--fg)]">{so.customer_name}</dd></div>
                    )}
                    <div className="flex gap-2"><dt className="text-[var(--muted)]">Email</dt>
                      <dd className="min-w-0"><a href={`mailto:${so.customer_email}`} className="break-all hover:underline" style={{ color: 'var(--accent)' }}>{so.customer_email}</a></dd>
                    </div>
                    {so.customer_phone && (
                      <div className="flex gap-2"><dt className="text-[var(--muted)]">Phone</dt>
                        <dd><a href={`tel:${so.customer_phone.replace(/[^+\d]/g, '')}`} className="hover:underline" style={{ color: 'var(--accent)' }}>{so.customer_phone}</a></dd>
                      </div>
                    )}
                  </dl>
                </section>

                {/* Shipping */}
                {addr.length > 0 && (
                  <section>
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-2 text-[var(--muted)]">Ship to</h3>
                    <address className="not-italic text-sm leading-relaxed text-[var(--fg)]">
                      {addr.map((line, i) => <div key={i}>{line}</div>)}
                    </address>
                  </section>
                )}

                {/* Items */}
                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-2 text-[var(--muted)]">
                    Items {(so.order_items?.length ?? 0) > 0 ? `(${so.order_items!.length})` : ''}
                  </h3>
                  {(so.order_items?.length ?? 0) === 0 ? (
                    <p className="text-sm text-[var(--muted)]">No line items recorded.</p>
                  ) : (
                    <ul className="rounded-lg border divide-y" style={{ borderColor: 'var(--line)' }}>
                      {so.order_items!.map((it: OrderItem) => (
                        <li key={it.id} className="flex items-start justify-between gap-3 px-3.5 py-2.5" style={{ borderColor: 'var(--line)' }}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug text-[var(--fg)]">{it.product_name}</p>
                            <p className="text-[13px] mt-0.5 tabular-nums text-[var(--muted)]">
                              Qty {it.quantity} · {money(it.unit_price)} each
                            </p>
                          </div>
                          <span className="text-sm tabular-nums font-semibold flex-shrink-0 text-[var(--fg)]">
                            {money(it.total_price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Totals */}
                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-2 text-[var(--muted)]">Summary</h3>
                  <div className="rounded-lg border px-3.5 py-3 space-y-1.5 text-sm" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Subtotal</span><span className="tabular-nums text-[var(--fg)]">{money(so.subtotal)}</span></div>
                    {(so.discount_amount ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Discount{so.deal_code ? ` (${so.deal_code})` : ''}</span>
                        <span className="tabular-nums font-medium text-emerald-700 dark:text-emerald-300">−{money(so.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Shipping</span><span className="tabular-nums text-[var(--fg)]">{money(so.shipping_cost)}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--muted)]">Tax</span><span className="tabular-nums text-[var(--fg)]">{money(so.tax_amount)}</span></div>
                    <div className="flex justify-between pt-2 mt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                      <span className="font-semibold text-[var(--fg)]">Total</span>
                      <span className="tabular-nums text-base font-bold text-[var(--fg)]">
                        {money(so.total_amount)} <span className="text-[13px] font-normal text-[var(--muted)]">{so.currency.toUpperCase()}</span>
                      </span>
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-2 text-[var(--muted)]">Payment</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">Status</span>
                    {(so.payment_status ?? (so.status === 'pending' ? 'unpaid' : 'paid')) === 'paid' ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        {so.payment_status ?? (so.status === 'pending' ? 'unpaid' : 'paid')}
                      </span>
                    )}
                  </div>
                  {(so.stripe_session_id || so.stripe_payment_intent_id) && (
                    <div className="mt-2 space-y-1 text-[13px] font-mono break-all text-[var(--muted)]">
                      {so.stripe_payment_intent_id && <p>pi: {so.stripe_payment_intent_id}</p>}
                      {so.stripe_session_id && <p>cs: {so.stripe_session_id}</p>}
                    </div>
                  )}
                </section>
              </div>



              {/* Panel footer: status control */}
              <div className="flex-shrink-0 px-6 py-4 border-t bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
                <p className="text-[13px] font-semibold uppercase tracking-wide mb-2 text-[var(--muted)]">Order status</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(st => {
                    const active = draftStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDraftStatus(st)}
                        aria-pressed={active}
                        className={`h-9 rounded-full px-3.5 text-[13px] font-semibold capitalize transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                          active
                            ? STATUS_PILL[st]
                            : 'border text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)]'
                        }`}
                        style={active ? undefined : { borderColor: 'var(--line)' }}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-3">
                  <Button variant="primary" onClick={saveStatus} disabled={!dirty || isUpdating} className="h-10 px-5">
                    {isUpdating ? 'Saving…' : 'Update status'}
                  </Button>
                </div>
              </div>
            </>
          );
        })()}
      </aside>

      {/* ---- Sync-from-Stripe panel (layers over the order panel) ---- */}
      {selected && (
      <>
      <div
        aria-hidden={!syncOpen}
        onClick={() => setSyncOpen(false)}
        className={`fixed inset-0 z-[54] transition-opacity duration-200 ${
          syncOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(15,23,42,0.35)' }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sync from Stripe"
        className={`fixed top-0 right-0 z-[55] h-full w-full sm:w-[560px] lg:w-[640px] flex flex-col border-l shadow-[-12px_0_32px_rgba(15,23,42,0.18)] bg-[var(--raised)] transition-transform duration-200 ${
          syncOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ borderColor: 'var(--line)', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--fg)]">Sync from Stripe</p>
            <p className="font-mono text-xs mt-0.5 truncate text-[var(--muted)]">{selected?.stripe_session_id}</p>
          </div>
          <button
            onClick={() => setSyncOpen(false)}
            aria-label="Close sync panel"
            className="h-8 w-8 -mr-1.5 rounded-md flex items-center justify-center text-lg leading-none text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {recoverError && !selected.stripe_payment_intent_id && (
            <div className="mb-5 rounded-lg border p-4" style={{ borderColor: '#f2c4c4', background: 'rgba(180,35,24,0.05)' }}>
              <p className="text-[13px] font-semibold" style={{ color: '#b42318' }}>
                This checkout session could not be retrieved from Stripe.
              </p>
              <p className="text-xs mt-1 leading-relaxed text-[var(--muted)]">
                The order has no payment intent id, so it was never paid. You can permanently remove this record.
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="mt-2.5 h-8 rounded-md border px-3 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  style={{ borderColor: '#f2c4c4', color: '#b42318' }}
                >
                  Delete order record
                </button>
              ) : (
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="h-8 rounded-md border px-3 text-[13px] font-medium hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    Keep it
                  </button>
                  <button
                    onClick={deleteRecord}
                    disabled={deleting}
                    className="h-8 rounded-md px-3 text-[13px] font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{ background: '#b42318' }}
                  >
                    {deleting ? 'Deleting…' : 'Confirm permanent delete'}
                  </button>
                </div>
              )}
            </div>
          )}
              <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-2 text-[var(--muted)]">Recover from Stripe</h3>

              {recoverState === 'idle' && !recoverData && (
                <>
                  <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                    {(!selected.customer_email || selected.customer_email === 'pending@stripe.com')
                      ? 'This order is missing customer details. Fetch them from its checkout session to review before saving.'
                      : 'Fetch the checkout-session details from Stripe to compare against this order.'}
                  </p>
                  <div className="mt-2.5">
                    <Button variant="outline" onClick={recoverFetch} className="w-full">
                      Fetch details from Stripe
                    </Button>
                  </div>
                </>
              )}

              {recoverState === 'fetching' && (
                <p className="text-[13px] text-[var(--muted)]" aria-busy="true">Fetching from Stripe…</p>
              )}

              {recoverError && (
                <p role="alert" className="text-[13px]" style={{ color: '#b42318' }}>{recoverError}</p>
              )}

              {recoverState === 'ready' && recoverData && (() => {
                const d = recoverData as Record<string, string | null>;
                const cur = selected as unknown as Record<string, unknown>;
                const FIELDS: [string, string][] = [
                  ['customer_email', 'Email'], ['customer_name', 'Name'], ['customer_phone', 'Phone'],
                  ['shipping_line1', 'Address 1'], ['shipping_line2', 'Address 2'],
                  ['shipping_city', 'City'], ['shipping_state', 'State'],
                  ['shipping_postal_code', 'Postal code'], ['shipping_country', 'Country'],
                ];
                const changes = FIELDS.filter(([f]) => (d[f] ?? null) !== (cur[f] ?? null));
                const metaMismatch = typeof d.metadata_order_id === 'string' && d.metadata_order_id !== selected.id;
                return (
                  <>
                    <div className="mb-3 rounded-lg border divide-y" style={{ borderColor: 'var(--line)' }}>
                      <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Stripe returns</p>
                      {FIELDS.filter(([f]) => d[f]).map(([f, label]) => (
                        <div key={f} className="px-3 py-1.5 flex gap-3">
                          <span className="w-24 flex-shrink-0 text-[13px] text-[var(--muted)]">{label}</span>
                          <span className="min-w-0 text-[13px] font-medium break-all text-[var(--fg)]">{d[f]}</span>
                        </div>
                      ))}
                      {!d.customer_email && !d.customer_name && (
                        <p className="px-3 py-2 text-[13px] text-[var(--muted)]">This session carries no customer details.</p>
                      )}
                    </div>

                    {metaMismatch && (
                      <p className="mb-3 rounded-md border px-3 py-2 text-xs" style={{ borderColor: '#fedf89', background: '#fffaeb', color: '#b54708' }}>
                        Note: this session's metadata points to order {String(d.metadata_order_id)} — applying will write these details onto #{selected.order_number} instead.
                      </p>
                    )}

                    <div className="rounded-lg border divide-y" style={{ borderColor: 'var(--line)' }}>
                      {changes.length === 0 && (
                        <p className="px-3 py-2.5 text-[13px] text-[var(--muted)]">
                          Order already matches Stripe — nothing to apply.
                        </p>
                      )}
                      {changes.map(([f, label]) => (
                        <div key={f} className="px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
                          <p className="text-[13px] mt-0.5">
                            <span className="line-through opacity-50">{(cur[f] as string) || '—'}</span>
                            {' → '}
                            <span className="font-medium text-[var(--fg)]">{d[f] || '—'}</span>
                          </p>
                        </div>
                      ))}
                      <div className="px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Payment</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          d.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}>
                          {String(d.payment_status ?? 'unknown')}
                          {(cur.payment_status ?? null) !== (d.payment_status ?? null) && (
                            <span className="ml-1 opacity-60">(was {String(cur.payment_status ?? 'unset')})</span>
                          )}
                        </span>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between text-[13px]">
                        <span className="text-[var(--muted)]">Session amount</span>
                        <span className="tabular-nums font-medium text-[var(--fg)]">
                          {d.amount_total != null ? `$${Number(d.amount_total).toFixed(2)} ${String(d.currency ?? '').toUpperCase()}` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" onClick={() => { setRecoverState('idle'); setRecoverData(null); }}>
                        Discard
                      </Button>
                      <Button
                        variant="primary"
                        onClick={recoverApply}
                        disabled={changes.length === 0}
                        className="flex-1"
                      >
                        {changes.length === 0
                          ? 'Nothing to apply'
                          : `Apply ${changes.length} field${changes.length === 1 ? '' : 's'}`}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                      Applying writes the values above and triggers the usual notification emails for recovered orders.
                    </p>
                  </>
                );
              })()}
        </div>
      </aside>
      </>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="dsh-toast-in fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium shadow-[0_8px_24px_rgba(23,28,38,0.14)] bg-[var(--raised)]"
          style={{
            borderColor: toast.tone === 'success' ? 'var(--line)' : '#f2c4c4',
            color: toast.tone === 'success' ? 'var(--fg)' : '#b42318',
          }}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: toast.tone === 'success' ? 'var(--accent)' : '#b42318' }}
          />
          {toast.message}
        </div>
      )}

      <Footer />
    </>
  );
}
