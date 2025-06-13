'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { fetchDeals } from '@/services/dealService';
import type { Deal } from '@/services/dealService';

export default function DealInput() {
  const { appliedDeal, applyDeal, removeDeal } = useCart();
  const [availableDeals, setAvailableDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setIsLoading(true);
        const deals = await fetchDeals();
        const activeDeals = deals.filter(deal => {
          if (!deal.is_active) return false;
          if (deal.expires_at && new Date(deal.expires_at) < new Date()) return false;
          if (deal.usage_limit && deal.usage_count >= deal.usage_limit) return false;
          return true;
        });
        setAvailableDeals(activeDeals);
      } catch (error) {
        console.error('Error loading deals:', error);
        setMessage('Failed to load available deals');
      } finally {
        setIsLoading(false);
      }
    };

    loadDeals();
  }, []);

  // Auto-apply deals when component loads or deals change
  useEffect(() => {
    const autoApplyDeals = async () => {
      if (availableDeals.length > 0 && !appliedDeal) {
        // Find the best deal (highest discount value)
        const bestDeal = availableDeals.reduce((best, current) => {
          const currentValue = current.discount_type === 'percentage' 
            ? current.discount_value 
            : current.discount_value;
          const bestValue = best.discount_type === 'percentage' 
            ? best.discount_value 
            : best.discount_value;
          
          return currentValue > bestValue ? current : best;
        });

        try {
          const result = await applyDeal(bestDeal.code);
          setMessage(`Auto-applied best deal: ${bestDeal.code}`);
        } catch (error) {
          console.error('Error auto-applying deal:', error);
        }
      }
    };

    autoApplyDeals();
  }, [availableDeals, appliedDeal, applyDeal]);

  const handleDealClick = async (dealCode: string) => {
    try {
      const result = await applyDeal(dealCode);
      setMessage(result.message);
    } catch (error) {
      setMessage('Error applying deal. Please try again.');
      console.error('Error applying deal:', error);
    }
  };

  const handleRemoveDeal = () => {
    removeDeal();
    setMessage('');
  };

  const formatDiscount = (deal: Deal) => {
    if (deal.discount_type === 'percentage') {
      return `${deal.discount_value}% off`;
    } else {
      return `$${deal.discount_value.toFixed(2)} off`;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Available Deals
      </h3>
      
      {appliedDeal ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900 rounded-md">
            <div>
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                ✅ {appliedDeal.deal.code} Applied
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">
                {appliedDeal.deal.description}
              </div>
              <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                You save: ${appliedDeal.discountAmount.toFixed(2)}
              </div>
            </div>
            <button
              onClick={handleRemoveDeal}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              title="Remove deal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : availableDeals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No deals available at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => handleDealClick(deal.code)}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 transition-all cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300">
                        {deal.code}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 group-hover:bg-primary-200 dark:group-hover:bg-primary-800">
                        {formatDiscount(deal)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      {deal.description}
                    </p>
                    {deal.minimum_order_amount && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Min order: ${deal.minimum_order_amount.toFixed(2)}
                      </p>
                    )}
                    {deal.expires_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires: {new Date(deal.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {message && (
            <div className={`text-xs p-2 rounded ${
              message.includes('successfully') || message.includes('applied') || message.includes('Auto-applied')
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