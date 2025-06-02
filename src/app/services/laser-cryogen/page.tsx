'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { fetchLaserCryogenContent, updateLaserCryogenContent } from '../../../services/laserCryogenService';

const defaultContent = `
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
      ENVIROLASE LASER CRYOGEN COOLANT
    </h1>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          LASER CRYOGEN CYLINDER REPLACEMENT
        </h2>
        <p class="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-2">
          1000 GRAMS
        </p>
      </div>
      <div class="flex flex-col md:flex-row gap-8 items-center mb-8">
        <div class="w-full md:w-1/2">
          <div class="relative w-full aspect-square md:aspect-auto md:h-80">
            <img 
              src="/images/laser_cryogen.png" 
              alt="Laser Cryogen Cylinder" 
              class="object-contain"
              onerror="this.src='https://via.placeholder.com/400x300?text=Laser+Cryogen+Cylinder';"
            />
          </div>
        </div>
        <div class="w-full md:w-1/2">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            We Are The Manufacturer - Buy Directly From Us
          </h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            We manufacture the 1000 gram cylinder containing High Purity Grade 1,1,1,3-Tetrafluoropropene, the next generation of safe, non-flammable, non-toxic, non-ozone depleting and non-global warming potential (Low GWP) fluorocarbon gas approved for medical devices.
          </p>
          <p class="text-gray-700 dark:text-gray-300">
            We tested in Laser Surgical equipment and it works perfectly. Our CGA 600 cylinder is a perfect retrofit into all laser equipment including Candela.
          </p>
        </div>
      </div>
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          This Cryogen is sourced from Honeywell USA and is made in America and not from Chinese imports. Our filling process utilizes a double filtered, dedicated line for cryogen products to ensure maximum purity and never any impurities.
        </p>
        <ul class="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
          <li>Continuous and Uninterrupted Supply of Cryogen</li>
          <li>100% Satisfaction, Money Back Guarantee!</li>
          <li>Sold Only In a Case of 12 x 1000 Grams</li>
          <li>Shipped Ground UPS or FEDEX, USA Only.</li>
          <li>Bulk Pricing Available.</li>
          <li>International Shipments: Have Your Shipping Broker Contact Us To Arrange A Pick Up</li>
        </ul>
        <div class="flex flex-wrap gap-4 justify-center mt-8">
          <a 
            href="/msds.pdf" 
            target="_blank" 
            class="inline-block px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            MSDS Download
          </a>
          <a 
            href="/contact-us?product=laser_cryogen" 
            class="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            ORDER NOW
          </a>
        </div>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Why Choose Our Laser Cryogen?
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Superior Quality</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Our cryogen is manufactured to the highest standards, ensuring consistent performance for your laser equipment.
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Made in USA</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Sourced from Honeywell USA, our product is made in America with strict quality control.
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Environmentally Friendly</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Non-ozone depleting and low global warming potential make our cryogen an environmentally responsible choice.
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Reliable Supply</h3>
          <p class="text-gray-700 dark:text-gray-300">
            We maintain continuous and uninterrupted supply to ensure your operations run smoothly.
          </p>
        </div>
      </div>
    </div>
  </div>
`;

const LaserCryogenPage = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const dbContent = await fetchLaserCryogenContent();
        setContent(dbContent && dbContent.trim() ? dbContent : defaultContent);
        setDraft(dbContent && dbContent.trim() ? dbContent : defaultContent);
      } catch {
        setContent(defaultContent);
        setDraft(defaultContent);
        setError('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateLaserCryogenContent(draft);
      setContent(draft);
      setEditMode(false);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <div />
            {user && (
              <button
                className="ml-4 px-3 py-1 rounded-full border border-primary-600 text-primary-600 text-xs font-semibold bg-white dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                onClick={() => {
                  setEditMode((v) => !v);
                  setDraft(content);
                }}
                aria-pressed={editMode}
                title={editMode ? "Cancel Edit" : "Edit Page"}
              >
                {editMode ? "Cancel" : "Edit"}
              </button>
            )}
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : editMode ? (
            <div>
              <textarea
                className="w-full h-[600px] p-4 border rounded text-gray-900 dark:text-white dark:bg-gray-800"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="mt-4 flex gap-2">
                <button
                  className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
                  onClick={() => {
                    setEditMode(false);
                    setDraft(content);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LaserCryogenPage;