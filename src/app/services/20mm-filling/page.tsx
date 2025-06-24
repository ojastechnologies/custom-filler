'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { fetchTwentyMMFillingContent, updateTwentyMMFillingContent } from '@/services/twentyMMFillingService';

// Default content for the two editable sections
const defaultParagraph1 = `<p class="text-gray-700 dark:text-gray-300 mb-4">
  The cans to the left depict a 20 millimeter opening usually found on small, one piece, aluminum cans. These aerosol products will hold anywhere from a few grams to around three (3) ounces (under 100 grams) as the can size will have to be smaller to accommodate the smaller opening.
</p>
<p class="text-gray-700 dark:text-gray-300 mb-4">
  Usually, you will find that these cans will have a diameter ranging from 22mm up to 45mm and the heights can be as tall as 200mm. A majority of our business is the filling of the 20 mm opening and if you are looking to fill products like these, look no further. The filling of these smaller openings require experience and expertise; these smaller 20 mm sizes can be problematic.
</p>`;

const defaultParagraph2 = `<p class="text-gray-700 dark:text-gray-300 mb-4">
  We have had years of filling the 20 mm can and we can pass on our experience to you and facilitate the launch of your product. We have partnered with can companies that are capable of making aerosol cans that can take the pressure and won't leak.
</p>
<p class="text-gray-700 dark:text-gray-300 mb-4">
  We have a "knowledge base" of suppliers for components, that we have worked with in the past, who are reliable, and can supply your needs your 20 mm product will require. Aero Tech Labs takes pride in filling "small" in a big way.
</p>`;

const TwentyMMFillingPage = () => {
  const { user } = useAuth();
  const [paragraph1, setParagraph1] = useState<string>('');
  const [paragraph2, setParagraph2] = useState<string>('');
  const [editMode, setEditMode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Static data for can shapes (not editable)
  const canMouths = [
    { id: 'inside-curl', name: 'Inside Curl', image: '/images/inside_curl.jpg' },
    { id: 'outside-curl-1', name: 'Outside Curl (1 in. Opening)', image: '/images/outside_curl.jpg' },
    { id: 'outside-curl-20', name: 'Outside Curl (20 mm Opening)', image: '/images/outside_curl20.jpg' },
  ];

  const neckProfiles = [
    { id: 'tiered-neck', name: 'Tiered Neck', image: '/images/tiered_neck.jpg' },
    { id: 'soft-shoulder', name: 'Soft Shoulder', image: '/images/soft_shoulder.jpg' },
    { id: 'shelf-neck', name: 'Shelf Neck', image: '/images/shelf_neck.jpg' },
    { id: 'flat-shoulder', name: 'Flat Shoulder', image: '/images/flat_shoulder.jpg' },
    { id: 'flat-shoulder-overcap', name: 'Flat Shoulder for Overcap', image: '/images/flat_shoulder_overcap.jpg' },
    { id: 'conical-shoulder', name: 'Conical Shoulder', image: '/images/conical_shoulder.jpg' },
  ];

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const aboutContent = await fetchTwentyMMFillingContent();
        
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
      const htmlContent = editorRef.current?.innerHTML || '';
      
      if (editMode === 1) {
        setParagraph1(htmlContent);
      } else if (editMode === 2) {
        setParagraph2(htmlContent);
      }
      
      const updatedParagraph1 = editMode === 1 ? htmlContent : paragraph1;
      const updatedParagraph2 = editMode === 2 ? htmlContent : paragraph2;
      const combinedContent = `${updatedParagraph1}\n\n${updatedParagraph2}`;
      
      await updateTwentyMMFillingContent(combinedContent);
      
      if (editMode === 1) {
        setParagraph1(htmlContent);
      } else if (editMode === 2) {
        setParagraph2(htmlContent);
      }
      
      setEditMode(null);
      setPreviewMode(false);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // WYSIWYG formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertHeading = (level: number) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        const headingElement = document.createElement(`h${level}`);
        headingElement.textContent = selectedText;
        headingElement.className = level === 2 ? 'text-2xl font-bold mb-4' : 'text-xl font-semibold mb-3';
        
        range.deleteContents();
        range.insertNode(headingElement);
        
        // Clear selection
        selection.removeAllRanges();
      }
    }
    editorRef.current?.focus();
  };

  const insertList = (ordered: boolean = false) => {
    const listType = ordered ? 'insertOrderedList' : 'insertUnorderedList';
    document.execCommand(listType, false);
    editorRef.current?.focus();
  };

  const startEdit = (paragraphIndex: number) => {
    setEditMode(paragraphIndex);
    setPreviewMode(false);
    
    // Set content in editor after a brief delay to ensure DOM is ready
    setTimeout(() => {
      if (editorRef.current) {
        const content = paragraphIndex === 1 ? paragraph1 : paragraph2;
        editorRef.current.innerHTML = content;
        editorRef.current.focus();
      }
    }, 100);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setPreviewMode(false);
  };

  const getCurrentContent = () => {
    return editorRef.current?.innerHTML || '';
  };

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Static Title - Not Editable */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              20 mm Opening Contract Aerosol Filling
            </h1>
            
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
                <div className="mb-8 flex flex-col md:flex-row gap-8">
                  {/* Static Image - Not Editable */}
                  <div className="md:w-1/2">
                    <div className="relative h-80 w-full mb-4">
                      <Image 
                        src="/images/20mm.png" 
                        alt="20mm Aerosol Can" 
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  </div>
                  
                  {/* First Editable Text Section */}
                  <div className="md:w-1/2">
                    {/* Enhanced Edit Button for First Section */}
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
                      /* WYSIWYG Editor for First Section */
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
                            {/* WYSIWYG Toolbar */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-3 flex flex-wrap gap-2">
                              <button 
                                type="button" 
                                onClick={() => formatText('bold')} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" 
                                title="Bold (Ctrl+B)"
                              >
                                B
                              </button>
                              <button 
                                type="button" 
                                onClick={() => formatText('italic')} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic shadow-sm" 
                                title="Italic (Ctrl+I)"
                              >
                                I
                              </button>
                              <button 
                                type="button" 
                                onClick={() => formatText('underline')} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors underline shadow-sm" 
                                title="Underline (Ctrl+U)"
                              >
                                U
                              </button>
                              <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                              <button 
                                type="button" 
                                onClick={() => insertHeading(2)} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" 
                                title="Heading 2"
                              >
                                H2
                              </button>
                              <button 
                                type="button" 
                                onClick={() => insertHeading(3)} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" 
                                title="Heading 3"
                              >
                                H3
                              </button>
                              <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                              <button 
                                type="button" 
                                onClick={() => insertList(false)} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" 
                                title="Bullet List"
                              >
                                • List
                              </button>
                              <button 
                                type="button" 
                                onClick={() => insertList(true)} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" 
                                title="Numbered List"
                              >
                                1. List
                              </button>
                              <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                              <button 
                                type="button" 
                                onClick={() => formatText('removeFormat')} 
                                className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" 
                                title="Clear Formatting"
                              >
                                Clear
                              </button>
                            </div>

                            {/* WYSIWYG Editor */}
                            <div
                              ref={editorRef}
                              contentEditable
                              className="w-full min-h-56 p-4 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg leading-relaxed prose dark:prose-invert max-w-none"
                              style={{ 
                                minHeight: '224px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                              }}
                              suppressContentEditableWarning={true}
                              onKeyDown={(e) => {
                                // Handle keyboard shortcuts
                                if (e.ctrlKey || e.metaKey) {
                                  switch (e.key) {
                                    case 'b':
                                      e.preventDefault();
                                      formatText('bold');
                                      break;
                                    case 'i':
                                      e.preventDefault();
                                      formatText('italic');
                                      break;
                                    case 'u':
                                      e.preventDefault();
                                      formatText('underline');
                                      break;
                                  }
                                }
                              }}
                            />
                          </>
                        ) : (
                          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 min-h-56">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                              Preview Mode - How it will look:
                            </div>
                            <div
                              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: getCurrentContent() }}
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
                      /* Display Mode for First Section */
                      <div
                        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: paragraph1 }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Second Editable Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                  {/* Enhanced Edit Button for Second Section */}
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
                    /* WYSIWYG Editor for Second Section */
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
                          {/* WYSIWYG Toolbar */}
                          <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-3 flex flex-wrap gap-2">
                            <button 
                              type="button" 
                              onClick={() => formatText('bold')} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" 
                              title="Bold (Ctrl+B)"
                            >
                              B
                            </button>
                            <button 
                              type="button" 
                              onClick={() => formatText('italic')} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic shadow-sm" 
                              title="Italic (Ctrl+I)"
                            >
                              I
                            </button>
                            <button 
                              type="button" 
                              onClick={() => formatText('underline')} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors underline shadow-sm" 
                              title="Underline (Ctrl+U)"
                            >
                              U
                            </button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                            <button 
                              type="button" 
                              onClick={() => insertHeading(2)} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" 
                              title="Heading 2"
                            >
                              H2
                            </button>
                            <button 
                              type="button" 
                              onClick={() => insertHeading(3)} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold shadow-sm" 
                              title="Heading 3"
                            >
                              H3
                            </button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                            <button 
                              type="button" 
                              onClick={() => insertList(false)} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" 
                              title="Bullet List"
                            >
                              • List
                            </button>
                            <button 
                              type="button" 
                              onClick={() => insertList(true)} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" 
                              title="Numbered List"
                            >
                              1. List
                            </button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                            <button 
                              type="button" 
                              onClick={() => formatText('removeFormat')} 
                              className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors shadow-sm" 
                              title="Clear Formatting"
                            >
                              Clear
                            </button>
                          </div>

                          {/* WYSIWYG Editor */}
                          <div
                            ref={editorRef}
                            contentEditable
                            className="w-full min-h-56 p-4 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg leading-relaxed prose dark:prose-invert max-w-none"
                            style={{ 
                              minHeight: '224px',
                              maxHeight: '400px',
                              overflowY: 'auto'
                            }}
                            suppressContentEditableWarning={true}
                            onKeyDown={(e) => {
                              // Handle keyboard shortcuts
                              if (e.ctrlKey || e.metaKey) {
                                switch (e.key) {
                                  case 'b':
                                    e.preventDefault();
                                    formatText('bold');
                                    break;
                                  case 'i':
                                    e.preventDefault();
                                    formatText('italic');
                                    break;
                                  case 'u':
                                    e.preventDefault();
                                    formatText('underline');
                                    break;
                                }
                              }
                            }}
                          />
                        </>
                      ) : (
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 min-h-56">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                            Preview Mode - How it will look:
                          </div>
                          <div
                            className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: getCurrentContent() }}
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
                    /* Display Mode for Second Section */
                    <div
                      className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: paragraph2 }}
                    />
                  )}
                </div>
              </>
            )}
            
            {/* Static Can Shapes Section - Not Editable */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Can Shapes For Your Products
              </h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Mouth Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {canMouths.map(mouth => (
                    <div 
                      key={mouth.id} 
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <Image 
                          src={mouth.image} 
                          alt={mouth.name} 
                          fill
                          className="object-contain p-2 transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4 text-center bg-white dark:bg-gray-800">
                        <h4 className="font-medium text-gray-900 dark:text-white text-lg">{mouth.name}</h4>
                        <div className="mt-2 flex justify-center">
                          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full">
                            Mouth Option
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Neck And Shoulder Profiles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {neckProfiles.map(profile => (
                    <div 
                      key={profile.id} 
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <Image 
                          src={profile.image} 
                          alt={profile.name} 
                          fill
                          className="object-contain p-2 transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4 text-center bg-white dark:bg-gray-800">
                        <h4 className="font-medium text-gray-900 dark:text-white text-lg">{profile.name}</h4>
                        <div className="mt-2 flex justify-center">
                          <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-3 py-1 rounded-full">
                            Neck Profile
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Static Call to Action - Not Editable */}
            <div className="text-center">
              <Link 
                href="/contact-us" 
                className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TwentyMMFillingPage;
