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
          // Try to parse existing content
          const paragraphs = splitContentIntoParagraphs(aboutContent);
          setParagraph1(paragraphs[0] || defaultParagraph1);
          setParagraph2(paragraphs[1] || defaultParagraph2);
        } else {
          // Use defaults
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

  // Better paragraph splitting function
  const splitContentIntoParagraphs = (content: string): string[] => {
    // Remove extra whitespace and normalize
    const cleaned = content.trim();
    
    // Split by </p> followed by optional whitespace and <p>
    const parts = cleaned.split(/(<\/p>\s*<p[^>]*>)/gi);
    
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.match(/^<\/p>\s*<p[^>]*>$/gi)) {
        // This is a separator, finish current paragraph and start new one
        if (currentParagraph) {
          paragraphs.push(currentParagraph + '</p>');
          currentParagraph = '<p>';
        }
      } else {
        currentParagraph += part;
      }
    }
    
    // Add the last paragraph
    if (currentParagraph) {
      paragraphs.push(currentParagraph);
    }
    
    // Clean up paragraphs
    const cleanedParagraphs = paragraphs.map(p => {
      // Ensure proper <p> tags
      let cleaned = p.trim();
      if (!cleaned.startsWith('<p')) {
        cleaned = '<p>' + cleaned;
      }
      if (!cleaned.endsWith('</p>')) {
        cleaned = cleaned + '</p>';
      }
      return cleaned;
    }).filter(p => p.length > 7); // Remove empty paragraphs
    
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
      
      // Save both paragraphs as combined content
      const updatedParagraph1 = editMode === 1 ? draft : paragraph1;
      const updatedParagraph2 = editMode === 2 ? draft : paragraph2;
      const combinedContent = `${updatedParagraph1}\n\n${updatedParagraph2}`;
      
      await updateAboutUsContent(combinedContent);
      
      // Update state
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
                  <div className="w-full md:w-1/2 relative">
                    {/* Edit button for first paragraph */}
                    {user && editMode !== 1 && (
                      <button
                        className="absolute top-0 right-0 px-3 py-1 text-xs bg-primary-600 text-white rounded-bl-lg rounded-tr-lg hover:bg-primary-700 transition-colors z-10"
                        onClick={() => startEdit(1)}
                        title="Edit first paragraph"
                      >
                        Edit
                      </button>
                    )}
                    
                    {editMode === 1 ? (
                      /* Edit Mode for First Paragraph */
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Edit First Section
                          </h4>
                          <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {previewMode ? "Edit" : "Preview"}
                          </button>
                        </div>

                        {!previewMode ? (
                          <>
                            {/* Toolbar */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap gap-1">
                              <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold" title="Bold">B</button>
                              <button type="button" onClick={() => insertTag('<em>', '</em>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic" title="Italic">I</button>
                              <button type="button" onClick={() => insertTag('<p>', '</p>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" title="Paragraph">P</button>
                              <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold" title="Heading">H3</button>
                            </div>

                            <textarea
                              id="content-editor"
                              className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-xs"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              placeholder="Enter HTML content..."
                              spellCheck="false"
                            />
                          </>
                        ) : (
                          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 min-h-48">
                            <div
                              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: draft }}
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-3">
                          <button
                            className="px-4 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button
                            className="px-4 py-1 text-xs bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
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
                  <div className="w-full md:w-1/2 relative">
                    {/* Edit button for second paragraph */}
                    {user && editMode !== 2 && (
                      <button
                        className="absolute top-0 right-0 px-3 py-1 text-xs bg-primary-600 text-white rounded-bl-lg rounded-tr-lg hover:bg-primary-700 transition-colors z-10"
                        onClick={() => startEdit(2)}
                        title="Edit second paragraph"
                      >
                        Edit
                      </button>
                    )}
                    
                    {editMode === 2 ? (
                      /* Edit Mode for Second Paragraph */
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Edit Second Section
                          </h4>
                          <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {previewMode ? "Edit" : "Preview"}
                          </button>
                        </div>

                        {!previewMode ? (
                          <>
                            {/* Toolbar */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap gap-1">
                              <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold" title="Bold">B</button>
                              <button type="button" onClick={() => insertTag('<em>', '</em>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic" title="Italic">I</button>
                              <button type="button" onClick={() => insertTag('<p>', '</p>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" title="Paragraph">P</button>
                              <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold" title="Heading">H3</button>
                            </div>

                            <textarea
                              id="content-editor"
                              className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-xs"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              placeholder="Enter HTML content..."
                              spellCheck="false"
                            />
                          </>
                        ) : (
                          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 min-h-48">
                            <div
                              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: draft }}
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-3">
                          <button
                            className="px-4 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button
                            className="px-4 py-1 text-xs bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
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
