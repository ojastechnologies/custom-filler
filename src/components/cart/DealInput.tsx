'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

export default function DealInput() {
  const { appliedDeal, applyDeal, removeDeal } = useCart();
  const [dealCode, setDealCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [message, setMessage] = useState('');

  const handleApplyDeal = async () => {
    if (!dealCode.trim()) {
      setMessage('Please enter a deal code');
      return;
    }

    setIsApplying(true);
    setMessage('');

    try {
      const result = await applyDeal(dealCode.trim());
      setMessage(result.message);
      
      if (result.isValid) {
        setDealCode('');
      }
    } catch (error) {
      setMessage('Error applying deal. Please try again.');
      console.error('Error applying deal:', error);
    } finally {
      setIsApplying(false);
    }
  };
  const handleRemoveDeal = () => {
    removeDeal();
    setMessage('');
    setDealCode('');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Promo Code
      </h3>
      
      {appliedDeal ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900 rounded-md">
            <div>
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                {appliedDeal.deal.code}
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">
                {appliedDeal.deal.description}
              </div>
              <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                -${appliedDeal.discountAmount.toFixed(2)}
              </div>
            </div>
            <button
              onClick={handleRemoveDeal}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={dealCode}
              onChange={(e) => setDealCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white text-sm"
              disabled={isApplying}
            />
            <Button
              onClick={handleApplyDeal}
              disabled={isApplying || !dealCode.trim()}
              size="sm"
              variant="outline"
            >
              {isApplying ? 'Applying...' : 'Apply'}
            </Button>
          </div>
          
          {message && (
            <div className={`text-xs p-2 rounded ${
              message.includes('successfully') || message.includes('applied')
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}