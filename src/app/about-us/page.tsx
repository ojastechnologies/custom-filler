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
  const [previewMode, setPreviewMode] = useState(false);

  // Default content
  const defaultContent = `<p>Aero Tech Labs is a small, dedicated, and ambitious aerosol custom filling facility located in South Florida. Strategically located in the Southern U.S., we can be an important link to produce aerosol products in that region. Our forte is the filling of HFC 134a, a non-flammable propellant which is used in "ozone safe" refrigerant systems, when there is an imperative need for non-flammable necessary end use products are a requisite, we use HFC 134a. If you need a different non-flammable propellant with a low global warming potential (GWP), then let us suggest HFO 1234ze. This new propellant is an exciting addition especially to high end cosmetic formulations where flammability may be considered a high liability.</p>

<p>Aero Tech Labs will fill your 20 mm cans, too. We do small openings in a big way and fill nearly 1 million of these per year. We also fill refrigerant cans for the automotive industry, laser coolant for surgical needs, emergency signal devices, and non-flammable dusters for sensitive electronics. We have also added new machinery to fill the Bag in a Can or what is now called the Bag On Valve (BOV) spray systems in 20mm aerosol cans. This system will allow you to formulate your product and go straight into an aerosol system without having to be mixed with other chemicals or propellants. The BOV non-aerosol system is perfect for Topical Pharmaceutical, Skin Care, Cosmetic, Sunscreen, and other high end products of a similar nature.</p>`;

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const aboutContent = await fetchAboutUsContent();
        const cleanContent = aboutContent && aboutContent.trim() ? aboutContent : defaultContent;
        setContent(cleanContent);
        setDraft(cleanContent);
      } catch {
        setContent(defaultContent);
        setDraft(defaultContent);
        setError('Failed to load About Us content.');
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
      await updateAboutUsContent(draft);
      setContent(draft);
      setEditMode(false);
      setPreviewMode(false);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const insertTag = (tag: string, closingTag?: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    const insertText = closingTag 
      ? `${tag}${selectedText}${closingTag}`
      : tag;
    
    const newText = beforeText + insertText + afterText;
    setDraft(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + tag.length + selectedText.length + (closingTag?.length || 0);
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Split content for display
  const paragraphs = content
    .split(/<\/p>\s*<p/gi)
    .map((p, i, arr) => {
      if (i === 0) return p.replace(/<p[^>]*>/, '<p>') + (p.includes('</p>') ? '' : '</p>');
      if (i === arr.length - 1) return '<p' + p.replace(/<p[^>]*>/, '>');
      return '<p' + p.replace(/<p[^>]*>/, '>') + (p.includes('</p>') ? '' : '</p>');
    });

  return (
    <>
      <Header />
      <main className="pb-16">
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center w-full">
                What Do We Do?
              </h2>
              {user && (
                <button
                  className="ml-4 px-4 py-2 rounded-lg border border-primary-600 text-primary-600 text-sm font-semibold bg-white dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
                  onClick={() => {
                    setEditMode(!editMode);
                    setDraft(content);
                    setPreviewMode(false);
                  }}
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            ) : editMode ? (
              /* Edit Mode */
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit About Us Content
                  </h3>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {previewMode ? "Edit" : "Preview"}
                  </button>
                </div>
                
                {/* Instructions */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                    💡 HTML Editor
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Select text and click toolbar buttons to format</li>
                    <li>• Or type HTML directly: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;h2&gt;, etc.</li>
                  </ul>
                </div>

                {!previewMode ? (
                  <>
                    {/* Toolbar */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertTag('<strong>', '</strong>')}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold"
                        title="Bold - Select text first"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<em>', '</em>')}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic"
                        title="Italic - Select text first"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<p>', '</p>')}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                        title="Paragraph"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<h2>', '</h2>')}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<h3>', '</h3>')}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<ul>\n  <li></li>\n  <li></li>\n</ul>\n')}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                        title="Bullet List"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<ol>\n  <li></li>\n  <li></li>\n</ol>\n')}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                        title="Numbered List"
                      >
                        1. List
                      </button>
                    </div>

                    {/* Textarea Editor */}
                    <textarea
                      id="content-editor"
                      className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Enter your HTML content here..."
                      spellCheck="false"
                    />
                  </>
                ) : (
                  /* Preview Mode */
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800 min-h-96">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Preview:
                    </h4>
                    <div
                      className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: draft }}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => {
                      setEditMode(false);
                      setDraft(content);
                      setPreviewMode(false);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <>
                {/* First row: image left, text right */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
                  <div className="w-full md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden shadow-lg">
                    <Image 
                      src="/images/about1.jpg"
                      alt="Aerosol  Filling Facility"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <div
                      className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: paragraphs[0] || "" }}
                    />
                  </div>
                </div>

                {/* Second row: text left, image right */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                  <div className="w-full md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden shadow-lg">
                    <Image 
                      src="/images/about2.png"
                      alt="Aerosol Products"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <div
                      className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: paragraphs[1] || "" }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Call to Action Section */}
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

