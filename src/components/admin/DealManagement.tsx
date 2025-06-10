'use client';

import React, { useState, useEffect } from 'react';
import { Deal, fetchDeals, createDeal, updateDeal, deleteDeal } from '@/services/dealService';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DealManagement() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, []);

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
      } else {
        const newDeal = await createDeal(dealData);
        setDeals(prev => [newDeal, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error('Error saving deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to save deal');
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;

    try {
      await deleteDeal(id);
      setDeals(prev => prev.filter(deal => deal.id !== id));
    } catch (err) {
      console.error('Error deleting deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete deal');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDiscountDisplay = (deal: Deal) => {
    if (deal.discount_type === 'percentage') {
      return `${deal.discount_value}%`;
    } else {
      return `$${deal.discount_value.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deal Management</h2>
        <Button
          variant="primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Deal'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="text-sm underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Deal Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingDeal ? 'Edit Deal' : 'Create New Deal'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deal Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deal Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., WELCOME10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Discount Type */}
              <div>
                <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Type *
                </label>
                <select
                  id="discount_type"
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount ($)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="e.g., 10% off your first order"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discount Value */}
              <div>
                <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Minimum Order Amount */}
              <div>
                <label htmlFor="minimum_order_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Order Amount ($)
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Maximum Discount Amount */}
              <div>
                <label htmlFor="maximum_discount_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Discount ($)
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Usage Limit */}
              <div>
                <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  id="usage_limit"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for unlimited usage</p>
              </div>

              {/* Expiration Date */}
              <div>
                <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  id="expires_at"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for no expiration</p>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Deal is active
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Deals List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Deals ({deals.length})
        </h3>
        
        {deals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No deals found.</p>
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              className="mt-4"
            >
              Create Your First Deal
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {deals.map((deal) => (
                  <tr key={deal.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {deal.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {deal.description}
                      </div>
                      {deal.minimum_order_amount && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Min order: ${deal.minimum_order_amount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getDiscountDisplay(deal)}
                      </div>
                      {deal.maximum_discount_amount && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Max: ${deal.maximum_discount_amount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {deal.usage_count} / {deal.usage_limit || '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        deal.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {deal.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {deal.expires_at ? formatDate(deal.expires_at) : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(deal)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(deal.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}