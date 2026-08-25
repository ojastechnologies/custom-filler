'use client';

import React, { useState, useEffect } from 'react';
import { Deal, fetchDeals, createDeal, updateDeal, deleteDeal } from '@/services/dealService';
import Button from '@/components/ui/Button';

type Toast = { message: string; tone: 'success' | 'error' } | null;

export interface DealStats {
  active: number;
  usage: number;
  limitReached: number;
  expired: number;
}

// Semantic pill palette, consistent with STATUS_PILL on /dashboard/orders:
// emerald = active/success, amber = warning/attention, neutral tokens = expired/inactive.
const PILL_BASE = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap';
const PILL_ACTIVE = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
const PILL_WARN = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
const PILL_NEUTRAL = 'bg-[var(--surface)] text-[var(--muted)]';
const TYPE_PILL: Record<Deal['discount_type'], string> = {
  percentage: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  fixed_amount: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
};

const inputClass =
  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--fg)] bg-[var(--raised)] placeholder:text-[var(--muted)] placeholder:opacity-60 transition-colors focus-visible:outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--ring)]';
const labelClass = 'block text-[13px] font-medium text-[var(--muted)] mb-1.5';
const TH_CLASS =
  'px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] whitespace-nowrap';

const isExpired = (deal: Deal) => Boolean(deal.expires_at && new Date(deal.expires_at) < new Date());

export default function DealManagement({ onStatsChange }: { onStatsChange?: (stats: DealStats) => void }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: '',
    minimum_order_amount: '',
    maximum_discount_amount: '',
    usage_limit: '',
    expires_at: '',
    is_active: true
  });

  useEffect(() => {
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Report live totals up to the host page (only once loading has settled)
  useEffect(() => {
    if (loading) return;
    onStatsChange?.({
      active: deals.filter(d => d.is_active && !isExpired(d)).length,
      usage: deals.reduce((n, d) => n + d.usage_count, 0),
      limitReached: deals.filter(d => d.usage_limit && d.usage_count >= d.usage_limit).length,
      expired: deals.filter(d => isExpired(d)).length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, loading]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDeals();
      setDeals(data);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_order_amount: '',
      maximum_discount_amount: '',
      usage_limit: '',
      expires_at: '',
      is_active: true
    });
    setEditingDeal(null);
    setShowForm(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.description.trim() || !formData.discount_value) {
      setError('Please fill in all required fields');
      return;
    }

    if (Number(formData.discount_value) <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }

    if (formData.discount_type === 'percentage' && Number(formData.discount_value) > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dealData = {
        code: formData.code,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        minimum_order_amount: formData.minimum_order_amount ? Number(formData.minimum_order_amount) : undefined,
        maximum_discount_amount: formData.maximum_discount_amount ? Number(formData.maximum_discount_amount) : undefined,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : undefined,
        expires_at: formData.expires_at || undefined,
        is_active: formData.is_active
      };

      if (editingDeal) {
        const updatedDeal = await updateDeal(editingDeal.id, dealData);
        setDeals(prev => prev.map(deal => deal.id === editingDeal.id ? updatedDeal : deal));
        setToast({ message: `${updatedDeal.code} updated`, tone: 'success' });
      } else {
        const newDeal = await createDeal(dealData);
        setDeals(prev => [newDeal, ...prev]);
        setToast({ message: `${newDeal.code} created`, tone: 'success' });
      }

      resetForm();
    } catch (err) {
      console.error('Error saving deal:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to save deal',
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      code: deal.code,
      description: deal.description,
      discount_type: deal.discount_type,
      discount_value: deal.discount_value.toString(),
      minimum_order_amount: deal.minimum_order_amount?.toString() || '',
      maximum_discount_amount: deal.maximum_discount_amount?.toString() || '',
      usage_limit: deal.usage_limit?.toString() || '',
      expires_at: deal.expires_at ? new Date(deal.expires_at).toISOString().split('T')[0] : '',
      is_active: deal.is_active
    });
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (deal: Deal) => {
    if (!window.confirm(`Are you sure you want to delete ${deal.code}?`)) return;

    try {
      await deleteDeal(deal.id);
      setDeals(prev => prev.filter(d => d.id !== deal.id));
      setToast({ message: `${deal.code} deleted`, tone: 'success' });
    } catch (err) {
      console.error('Error deleting deal:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to delete deal',
        tone: 'error',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDiscountDisplay = (deal: Deal) => {
    if (deal.discount_type === 'percentage') {
      return `${deal.discount_value}%`;
    } else {
      return `$${deal.discount_value.toFixed(2)}`;
    }
  };

  const getUsagePercentage = (deal: Deal) => {
    if (!deal.usage_limit) return 0;
    return Math.min((deal.usage_count / deal.usage_limit) * 100, 100);
  };

  const activeCount = deals.filter(d => d.is_active && !isExpired(d)).length;
  const expiredCount = deals.filter(d => isExpired(d)).length;

  if (loading) {
    return (
      <section
        aria-label="Deals"
        className="rounded-xl border overflow-hidden bg-[var(--raised)]"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="p-5 space-y-2" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label="Deals"
        className="rounded-xl border overflow-hidden bg-[var(--raised)]"
        style={{ borderColor: 'var(--line)' }}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold tabular-nums text-[var(--fg)]">{deals.length}</span> deals
            {' '}·{' '}
            <span className="font-semibold tabular-nums text-[var(--fg)]">{activeCount}</span> active
            {' '}·{' '}
            <span className="font-semibold tabular-nums text-[var(--fg)]">{expiredCount}</span> expired
          </p>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={loadDeals} className="gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
              </svg>
              <span>{showForm ? 'Close' : 'New deal'}</span>
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="mx-5 mt-5 rounded-lg border px-4 py-3" style={{ borderColor: '#f2c4c4', background: 'rgba(180,35,24,0.05)' }}>
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#b42318' }}>Error</p>
                <p className="text-sm mt-0.5 text-[var(--muted)]">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="text-sm underline underline-offset-4 text-[var(--muted)] hover:text-[var(--fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-sm flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Deal form */}
        {showForm && (
          <div className="border-b px-5 py-6 bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
            <h2 className="text-base font-semibold mb-5 text-[var(--fg)]">
              {editingDeal ? `Edit ${editingDeal.code}` : 'New deal'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5" aria-label={editingDeal ? 'Edit deal' : 'Create deal'}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Deal Code */}
                <div>
                  <label htmlFor="code" className={labelClass}>
                    Deal code *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., WELCOME10"
                    className={`${inputClass} font-mono uppercase`}
                    style={{ borderColor: 'var(--line)' }}
                    required
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label htmlFor="discount_type" className={labelClass}>
                    Discount type *
                  </label>
                  <select
                    id="discount_type"
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className={inputClass}
                    style={{ borderColor: 'var(--line)' }}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed amount ($)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className={labelClass}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="e.g., 10% off your first order"
                  className={inputClass}
                  style={{ borderColor: 'var(--line)', resize: 'vertical' }}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Discount Value */}
                <div>
                  <label htmlFor="discount_value" className={labelClass}>
                    Discount value * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    id="discount_value"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '20.00'}
                    className={inputClass}
                    style={{ borderColor: 'var(--line)' }}
                    required
                  />
                </div>

                {/* Minimum Order Amount */}
                <div>
                  <label htmlFor="minimum_order_amount" className={labelClass}>
                    Min order ($)
                  </label>
                  <input
                    type="number"
                    id="minimum_order_amount"
                    name="minimum_order_amount"
                    value={formData.minimum_order_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    className={inputClass}
                    style={{ borderColor: 'var(--line)' }}
                  />
                </div>

                {/* Maximum Discount Amount */}
                <div>
                  <label htmlFor="maximum_discount_amount" className={labelClass}>
                    Max discount ($)
                  </label>
                  <input
                    type="number"
                    id="maximum_discount_amount"
                    name="maximum_discount_amount"
                    value={formData.maximum_discount_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="100.00"
                    className={inputClass}
                    style={{ borderColor: 'var(--line)' }}
                  />
                </div>

                {/* Usage Limit */}
                <div>
                  <label htmlFor="usage_limit" className={labelClass}>
                    Usage limit
                  </label>
                  <input
                    type="number"
                    id="usage_limit"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="100"
                    className={inputClass}
                    style={{ borderColor: 'var(--line)' }}
                  />
                  <p className="text-xs mt-1.5 text-[var(--muted)]">Leave empty for unlimited</p>
                </div>

                {/* Expiration Date */}
                <div>
                  <label htmlFor="expires_at" className={labelClass}>
                    Expiration date
                  </label>
                  <input
                    type="date"
                    id="expires_at"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
                    style={{ borderColor: 'var(--line)' }}
                  />
                  <p className="text-xs mt-1.5 text-[var(--muted)]">Leave empty for no expiration</p>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-[var(--line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <label htmlFor="is_active" className="text-sm text-[var(--fg)]">
                  Deal is active and available for use
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t" style={{ borderColor: 'var(--line)' }}>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : editingDeal ? 'Update deal' : 'Create deal'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Deals table / empty state */}
        {deals.length === 0 ? (
          <div className="mx-5 my-8 text-center py-14 rounded-xl border border-dashed" style={{ borderColor: 'var(--line)' }}>
            <p className="font-medium text-[var(--fg)]">No deals yet</p>
            <p className="text-sm mt-1 text-[var(--muted)]">
              Create your first promotional code to run a discount.
            </p>
            <div className="mt-4">
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                New deal
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: 'var(--surface)' }}>
                <tr>
                  <th scope="col" className={`${TH_CLASS} text-left`}>Code</th>
                  <th scope="col" className={`${TH_CLASS} text-left`}>Description</th>
                  <th scope="col" className={`${TH_CLASS} text-left`}>Type</th>
                  <th scope="col" className={`${TH_CLASS} text-right`}>Discount</th>
                  <th scope="col" className={`${TH_CLASS} text-left`}>Limits</th>
                  <th scope="col" className={`${TH_CLASS} text-left`}>Usage</th>
                  <th scope="col" className={`${TH_CLASS} text-left`}>Status</th>
                  <th scope="col" className={`${TH_CLASS} text-left`}>Dates</th>
                  <th scope="col" className={`${TH_CLASS} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => {
                  const expired = isExpired(deal);
                  const usagePercentage = getUsagePercentage(deal);

                  return (
                    <tr
                      key={deal.id}
                      className="border-t transition-colors hover:bg-[var(--surface)]"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[13px] font-semibold text-[var(--fg)] bg-[var(--surface)] border border-[var(--line)]">
                          {deal.code}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="max-w-[280px]">
                          <p className="text-sm truncate text-[var(--fg)]" title={deal.description}>
                            {deal.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`${PILL_BASE} ${TYPE_PILL[deal.discount_type]}`}>
                          {deal.discount_type === 'percentage' ? 'Percentage' : 'Fixed amount'}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold tabular-nums text-[var(--fg)]">
                          {getDiscountDisplay(deal)}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {deal.minimum_order_amount || deal.maximum_discount_amount ? (
                          <div className="space-y-0.5 text-[13px] text-[var(--muted)]">
                            {deal.minimum_order_amount && (
                              <div>
                                Min <span className="tabular-nums text-[var(--fg)]">${deal.minimum_order_amount.toFixed(2)}</span>
                              </div>
                            )}
                            {deal.maximum_discount_amount && (
                              <div>
                                Max <span className="tabular-nums text-[var(--fg)]">${deal.maximum_discount_amount.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm tabular-nums text-[var(--fg)]">
                            {deal.usage_count} / {deal.usage_limit || '∞'}
                          </span>
                          {deal.usage_limit && (
                            <div className="w-16 h-1.5 rounded-full overflow-hidden bg-[var(--surface)] border border-[var(--line)]" aria-hidden="true">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${usagePercentage}%`,
                                  background: usagePercentage >= 90 ? '#b42318' : usagePercentage >= 70 ? '#d97706' : '#059669',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`${PILL_BASE} ${expired ? PILL_NEUTRAL : deal.is_active ? PILL_ACTIVE : PILL_NEUTRAL}`}>
                            {expired ? 'Expired' : deal.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {deal.usage_limit && deal.usage_count >= deal.usage_limit && (
                            <span className={`${PILL_BASE} ${PILL_WARN}`}>Limit reached</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex flex-col leading-tight">
                          {deal.expires_at ? (
                            <span
                              className={`text-[13px] tabular-nums ${expired ? 'font-semibold' : 'text-[var(--fg)]'}`}
                              style={expired ? { color: '#b42318' } : undefined}
                            >
                              Expires {formatDate(deal.expires_at)}
                            </span>
                          ) : (
                            <span className="text-[13px] text-[var(--muted)]">Never expires</span>
                          )}
                          <span className="text-xs tabular-nums text-[var(--muted)]">
                            Created {formatDate(deal.created_at)} · Updated {formatDate(deal.updated_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(deal)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--accent-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            style={{ color: 'var(--accent)' }}
                            title="Edit deal"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(deal)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-900/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            style={{ color: '#b42318' }}
                            title="Delete deal"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
    </>
  );
}
