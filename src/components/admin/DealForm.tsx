'use client';

import React from 'react';

interface DealFormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: string;
  minimum_order_amount: string;
  maximum_discount_amount: string;
  usage_limit: string;
  expires_at: string;
  is_active: boolean;
}

interface DealFormProps {
  formData: DealFormData;
  onFormDataChange: (data: DealFormData) => void;
  error?: string | null;
}

export default function DealForm({ formData, onFormDataChange, error }: DealFormProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onFormDataChange({ ...formData, [name]: checked });
    } else {
      onFormDataChange({ ...formData, [name]: value });
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Deal Details for This Product
      </h4>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-4">
          <p className="font-medium">Deal Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deal Code */}
          <div>
            <label htmlFor="deal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Code *
            </label>
            <input
              type="text"
              id="deal_code"
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
            <label htmlFor="deal_discount_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Discount Type *
            </label>
            <select
              id="deal_discount_type"
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
          <label htmlFor="deal_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deal Description *
          </label>
          <textarea
            id="deal_description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={2}
            placeholder="e.g., 10% off this product"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Discount Value */}
          <div>
            <label htmlFor="deal_discount_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
            </label>
            <input
              type="number"
              id="deal_discount_value"
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
            <label htmlFor="deal_minimum_order_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Order Amount ($)
            </label>
            <input
              type="number"
              id="deal_minimum_order_amount"
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
            <label htmlFor="deal_maximum_discount_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Discount ($)
            </label>
            <input
              type="number"
              id="deal_maximum_discount_amount"
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
            <label htmlFor="deal_usage_limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usage Limit
            </label>
            <input
              type="number"
              id="deal_usage_limit"
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
            <label htmlFor="deal_expires_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              id="deal_expires_at"
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
            id="deal_is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="deal_is_active" className="ml-2 block text-sm text-gray-900 dark:text-white">
            Deal is active
          </label>
        </div>
      </div>
    </div>
  );
}