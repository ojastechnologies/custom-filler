import React from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Your Cart ({totalItems})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
              Your cart is empty.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map(item => (
                <li key={item.id} className="py-4 flex items-center">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">${item.price.toFixed(2)} x {item.quantity}</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/cart"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded text-center hover:bg-primary-700"
              onClick={onClose}
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded text-center hover:bg-green-700"
              onClick={onClose}
            >
              Checkout
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}