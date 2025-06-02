"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { fetchAboutUsContent, updateAboutUsContent } from '@/services/aboutUsService';

export default function AboutUs() {
  const { user } = useAuth();
  const [content, setContent] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default static content (used if Supabase is empty)
  const defaultContent = `
    <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
      Aero Tech Labs is a small, dedicated, and ambitious aerosol custom filling facility located in South Florida. 
      Strategically located in the Southern U.S., we can be an important link to produce aerosol products in that region. 
      Our forte is the filling of HFC 134a, a non-flammable propellant which is used in &ldquo;ozone safe&rdquo; refrigerant systems, 
      when there is an imperative need for non-flammable necessary end use products are a requisite, we use HFC 134a. 
      If you need a different non-flammable propellant with a low global warming potential (GWP), then let us suggest 
      HFO 1234ze. This new propellant is an exciting addition especially to high end cosmetic formulations where 
      flammability may be considered a high liability.
    </p>
    <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mt-8">
      Aero Tech Labs will fill your 20 mm cans, too. We do small openings in a big way and fill nearly 1 million 
      of these per year. We also fill refrigerant cans for the automotive industry, laser coolant for surgical needs, 
      emergency signal devices, and non-flammable dusters for sensitive electronics. We have also added new machinery 
      to fill the Bag in a Can or what is now called the Bag On Valve (BOV) spray systems in 20mm aerosol cans. 
      This system will allow you to formulate your product and go straight into an aerosol system without having to 
      be mixed with other chemicals or propellants. The BOV non-aerosol system is perfect for Topical Pharmaceutical, 
      Skin Care, Cosmetic, Sunscreen, and other high end products of a similar nature.
    </p>
  `;

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const aboutContent = await fetchAboutUsContent();
        setContent(aboutContent && aboutContent.trim() ? aboutContent : defaultContent);
        setDraft(aboutContent && aboutContent.trim() ? aboutContent : defaultContent);
      } catch {
        setContent(defaultContent);
        setDraft(defaultContent);
        setError('Failed to load About Us content.');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateAboutUsContent(draft);
      setContent(draft);
      setEditMode(false);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Split content into paragraphs for layout
  const paragraphs = content
    .split(/<\/p>\s*<p/gi)
    .map((p, i, arr) => {
      // Add back the <p> and </p> tags removed by split
      if (i === 0) return p + '</p>';
      if (i === arr.length - 1) return '<p' + p;
      return '<p' + p + '</p>';
    });

  return (
    <>
      <Header />
      <main className="pb-16">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center w-full">
                What Do We Do?
              </h2>
              {user && (
                <button
                  className={`ml-4 px-3 py-1 rounded-full border border-primary-600 text-primary-600 text-xs font-semibold bg-white dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors`}
                  onClick={() => {
                    setEditMode((v) => !v);
                    setDraft(content);
                  }}
                  aria-pressed={editMode}
                  title={editMode ? "Cancel Edit" : "Edit About Us"}
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
              )}
            </div>
            {error && (
              <div className="text-red-500 mb-4">{error}</div>
            )}

            {loading ? (
              <div>Loading...</div>
            ) : editMode ? (
              <div>
                <textarea
                  className="w-full h-80 p-4 border rounded text-gray-900 dark:text-white dark:bg-gray-800"
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
              <>
                {/* First row: image left, text right */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
                  <div className="w-full md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden">
                    <Image 
                      src="/images/about1.jpg"
                      alt="Aerosol Filling Facility"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: paragraphs[0] || "" }}
                    />
                  </div>
                </div>
                {/* Second row: text left, image right */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                  <div className="w-full md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden">
                    <Image 
                      src="/images/about2.png"
                      alt="Aerosol Products"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: paragraphs[1] || "" }}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-lg shadow-md max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Have Questions?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Check out our frequently asked questions to learn more about our services, processes, and capabilities.
                </p>
                <Link 
                  href="/faqs" 
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                >
                  View FAQs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
