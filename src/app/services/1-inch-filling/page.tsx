'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { fetchInchFillingContent, updateInchFillingContent } from '@/services/inchFillingService';

// Default content for the editable text section only
const defaultTextContent = `<p class="text-gray-700 dark:text-gray-300 mb-4">
  The aerosol cans to the left have a standard 1 inch opening that is found on a majority of aerosol products throughout the industry, if not the world, and is the standard for larger fill operations. These cans are available in a variety of shapes and sizes from 35mm aluminum cans all the way up to 76mm diameter; to view can shapes, click on the link below.
</p>
<p class="text-gray-700 dark:text-gray-300 mb-4">
  The heights of most cans must be at least double (2X) the diameter as a starting point. We can have your cans custom lithographed to suit your needs and we work with an excellent arts and graphics agency.
</p>
<p class="text-gray-700 dark:text-gray-300 font-semibold">
  Aero Tech Labs fills a variety of products like these for companies like yours; what can we put together for you!
</p>`;

const InchFillingPage = () => {
  const { user } = useAuth();
  const [textContent, setTextContent] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
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
        const dbContent = await fetchInchFillingContent();
        const finalContent = dbContent && dbContent.trim() ? dbContent : defaultTextContent;
        setTextContent(finalContent);
      } catch {
        setTextContent(defaultTextContent);
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
      const htmlContent = editorRef.current?.innerHTML || '';
      await updateInchFillingContent(htmlContent);
      setTextContent(htmlContent);
      setEditMode(false);
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

  const startEdit = () => {
    setEditMode(true);
    setPreviewMode(false);
    
    // Set content in editor after a brief delay to ensure DOM is ready
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = textContent;
        editorRef.current.focus();
      }
    }, 100);
  };

  const cancelEdit = () => {
    setEditMode(false);
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
              1 Inch Opening Contract Aerosol Filling
            </h1>
            
            <div className="mb-8 flex flex-col md:flex-row gap-8">
              {/* Static Image - Not Editable */}
              <div className="md:w-1/2">
                <div className="relative h-80 w-full mb-4">
                  <Image 
                    src="/images/1inch.png" 
                    alt="1 Inch Aerosol Can" 
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
              
              {/* Editable Text Section */}
              <div className="md:w-1/2">
                {/* Edit Button - Only for authenticated users */}
                {user && !editMode && (
                  <div className="flex justify-end mb-4">
                    <button
                      className="group flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium rounded-md shadow-sm hover:from-primary-600 hover:to-primary-700 hover:shadow-md transform hover:scale-105 transition-all duration-200"
                      onClick={startEdit}
                      title="Edit text content"
                    >
                      <svg className="w-3 h-3 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Text</span>
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="text-red-500 mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="flex items-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : editMode ? (
                  /* WYSIWYG Editor */
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Editing Text Content
                        </h4>
                      </div>
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {previewMode ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        {/* Compact WYSIWYG Toolbar */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-t bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap gap-1">
                          <button 
                            type="button" 
                            onClick={() => formatText('bold')} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors font-bold" 
                            title="Bold"
                          >
                            B
                          </button>
                          <button 
                            type="button" 
                            onClick={() => formatText('italic')} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors italic" 
                            title="Italic"
                          >
                            I
                          </button>
                          <button 
                            type="button" 
                            onClick={() => formatText('underline')} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors underline" 
                            title="Underline"
                          >
                            U
                          </button>
                          <div className="w-px h-4 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                          <button 
                            type="button" 
                            onClick={() => insertList(false)} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Bullet List"
                          >
                            UL
                          </button>
                          <button 
                            type="button" 
                            onClick={() => insertList(true)} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Numbered List"
                          >
                            OL
                          </button>
                          <div className="w-px h-4 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                          <button 
                            type="button" 
                            onClick={() => insertHeading(2)} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Heading 2"
                          >
                            H2
                          </button>
                          <button 
                            type="button" 
                            onClick={() => insertHeading(3)} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Heading 3"
                          >
                            H3
                          </button>
                          <div className="w-px h-4 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                          <button 
                            type="button" 
                            onClick={() => formatText('justifyLeft')} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Align Left"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => formatText('justifyCenter')} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Align Center"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => formatText('justifyRight')} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Align Right"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => formatText('justifyFull')} 
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" 
                            title="Align Justify"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-b bg-gray-50 dark:bg-gray-700 p-2">
                          <div 
                            ref={editorRef} 
                            contentEditable={true} 
                            className="min-h-[200px] p-2 focus:outline-none"
                            dangerouslySetInnerHTML={{ __html: textContent }}
                          ></div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
                          <button
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
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
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white text-sm rounded-lg hover:from-gray-500 hover:to-gray-600 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 p-2">
                        <div 
                          ref={editorRef} 
                          contentEditable={false} 
                          className="min-h-[200px] p-2 focus:outline-none"
                          dangerouslySetInnerHTML={{ __html: textContent }}
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: textContent }}></div>
                )}
              </div>
            </div>
            
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

export default InchFillingPage;