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
  const [paragraph1, setParagraph1] = useState<string>('');
  const [paragraph2, setParagraph2] = useState<string>('');
  const [editMode, setEditMode] = useState<number | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Default content
  const defaultParagraph1 = `<p>Aero Tech Labs is a small, dedicated, and ambitious aerosol custom filling facility located in South Florida. Strategically located in the Southern U.S., we can be an important link to produce aerosol products in that region. Our forte is the filling of HFC 134a, a non-flammable propellant which is used in "ozone safe" refrigerant systems, when there is an imperative need for non-flammable necessary end use products are a requisite, we use HFC 134a. If you need a different non-flammable propellant with a low global warming potential (GWP), then let us suggest HFO 1234ze. This new propellant is an exciting addition especially to high end cosmetic formulations where flammability may be considered a high liability.</p>`;

  const defaultParagraph2 = `<p>Aero Tech Labs will fill your 20 mm cans, too. We do small openings in a big way and fill nearly 1 million of these per year. We also fill refrigerant cans for the automotive industry, laser coolant for surgical needs, emergency signal devices, and non-flammable dusters for sensitive electronics. We have also added new machinery to fill the Bag in a Can or what is now called the Bag On Valve (BOV) spray systems in 20mm aerosol cans. This system will allow you to formulate your product and go straight into an aerosol system without having to be mixed with other chemicals or propellants. The BOV non-aerosol system is perfect for Topical Pharmaceutical, Skin Care, Cosmetic, Sunscreen, and other high end products of a similar nature.</p>`;

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const aboutContent = await fetchAboutUsContent();
        
        if (aboutContent && aboutContent.trim()) {
          const paragraphs = splitContentIntoParagraphs(aboutContent);
          setParagraph1(paragraphs[0] || defaultParagraph1);
          setParagraph2(paragraphs[1] || defaultParagraph2);
        } else {
          setParagraph1(defaultParagraph1);
          setParagraph2(defaultParagraph2);
        }
      } catch {
        setParagraph1(defaultParagraph1);
        setParagraph2(defaultParagraph2);
        setError('Failed to load About Us content.');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const splitContentIntoParagraphs = (content: string): string[] => {
    const cleaned = content.trim();
    const parts = cleaned.split(/(<\/p>\s*<p[^>]*>)/gi);
    
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.match(/^<\/p>\s*<p[^>]*>$/gi)) {
        if (currentParagraph) {
          paragraphs.push(currentParagraph + '</p>');
          currentParagraph = '<p>';
        }
      } else {
        currentParagraph += part;
      }
    }
    
    if (currentParagraph) {
      paragraphs.push(currentParagraph);
    }
    
    const cleanedParagraphs = paragraphs.map(p => {
      let cleaned = p.trim();
      if (!cleaned.startsWith('<p')) {
        cleaned = '<p>' + cleaned;
      }
      if (!cleaned.endsWith('</p>')) {
        cleaned = cleaned + '</p>';
      }
      return cleaned;
    }).filter(p => p.length > 7);
    
    return cleanedParagraphs;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editMode === 1) {
        setParagraph1(draft);
      } else if (editMode === 2) {
        setParagraph2(draft);
      }
      
      const updatedParagraph1 = editMode === 1 ? draft : paragraph1;
      const updatedParagraph2 = editMode === 2 ? draft : paragraph2;
      const combinedContent = `${updatedParagraph1}\n\n${updatedParagraph2}`;
      
      await updateAboutUsContent(combinedContent);
      
      if (editMode === 1) {
        setParagraph1(draft);
      } else if (editMode === 2) {
        setParagraph2(draft);
      }
      
      setEditMode(null);
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

  const startEdit = (paragraphIndex: number) => {
    setEditMode(paragraphIndex);
    if (paragraphIndex === 1) {
      setDraft(paragraph1);
    } else if (paragraphIndex === 2) {
      setDraft(paragraph2);
    }
    setPreviewMode(false);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setDraft('');
    setPreviewMode(false);
  };

  return (
    <>
      <Header />
      <main className="pb-16">
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="flex justify-center items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                What Do We Do?
              </h2>
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
            ) : (
              <>
                {/* First Section: Image left, text right */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
                  <div className="w-full md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden shadow-lg">
                    <Image 
                      src="/images/about1.jpg"
                      alt="Aerosol Filling Facility"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    {/* Enhanced Edit Button for First Paragraph */}
                    {user && editMode !== 1 && (
                      <div className="flex justify-end mb-4">
                        <button
                          className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-primary-400"
                          onClick={() => startEdit(1)}
                          title="Edit first section content"
                        >
                          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Section</span>
                        </button>
                      </div>
                    )}
                    
                    {editMode === 1 ? (
                      /* Edit Mode for First Paragraph */
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Editing First Section
                            </h4>
                          </div>
                          <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {previewMode ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview
                              </>
                            )}
                          </button>
                        </div>

                        {!previewMode ? (
                          <>
                            {/* Enhanced Toolbar */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-3 flex flex-wrap gap-2">
                              <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" title="Bold">B</button>
                              <button type="button" onClick={() => insertTag('<em>', '</em>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic shadow-sm" title="Italic">I</button>
                              <button type="button" onClick={() => insertTag('<p>', '</p>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" title="Paragraph">P</button>
                              <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" title="Heading">H3</button>
                            </div>

                            <textarea
                              id="content-editor"
                              className="w-full h-56 p-4 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              placeholder="Enter HTML content..."
                              spellCheck="false"
                            />
                          </>
                        ) : (
                          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 min-h-56">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                              Preview Mode - How it will look:
                            </div>
                            <div
                              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: draft }}
                            />
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <button
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                              </>
                            )}
                          </button>
                          <button
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode for First Paragraph */
                      <div
                        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: paragraph1 }}
                      />
                    )}
                  </div>
                </div>

                {/* Second Section: Text left, image right */}
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
                    {/* Enhanced Edit Button for Second Paragraph */}
                    {user && editMode !== 2 && (
                      <div className="flex justify-end mb-4">
                        <button
                          className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-primary-400"
                          onClick={() => startEdit(2)}
                          title="Edit second section content"
                        >
                          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Section</span>
                        </button>
                      </div>
                    )}
                    
                    {editMode === 2 ? (
                      /* Edit Mode for Second Paragraph */
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Editing Second Section
                            </h4>
                          </div>
                          <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {previewMode ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview
                              </>
                            )}
                          </button>
                        </div>

                        {!previewMode ? (
                          <>
                            {/* Enhanced Toolbar */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-3 flex flex-wrap gap-2">
                              <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" title="Bold">B</button>
                              <button type="button" onClick={() => insertTag('<em>', '</em>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic shadow-sm" title="Italic">I</button>
                              <button type="button" onClick={() => insertTag('<p>', '</p>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" title="Paragraph">P</button>
                              <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" title="Heading">H3</button>
                            </div>

                            <textarea
                              id="content-editor"
                              className="w-full h-56 p-4 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              placeholder="Enter HTML content..."
                              spellCheck="false"
                            />
                          </>
                        ) : (
                          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 min-h-56">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                              Preview Mode - How it will look:
                            </div>
                            <div
                              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: draft }}
                            />
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <button
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                              </>
                            )}
                          </button>
                          <button
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode for Second Paragraph */
                      <div
                        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: paragraph2 }}
                      />
                    )}
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
