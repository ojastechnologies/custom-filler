'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { fetchNonFlammablePropellantContent, updateNonFlammablePropellantContent } from '@/services/nonFlammablePropellantService';

// Default content for the three editable sections
const defaultParagraph1 = `<div class="text-center mb-6">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white">ENVIRONMENTALLY FRIENDLY PROPELLANTS</h2>
  <p class="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-2">HFC134a & HFO1234ze</p>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Premium Non-Flammable Propellants</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">We fill exclusively with HFC134a and HFO1234ze, a new, low GWP, non VOC propellant. These propellants are ideal for high-end products requiring safe, environmentally friendly delivery systems.</p>
<p class="text-gray-700 dark:text-gray-300">Our non-flammable propellants are perfect for applications where safety is paramount and environmental impact needs to be minimized.</p>`;

const defaultParagraph2 = `<div class="border-t border-gray-200 dark:border-gray-700 pt-6">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">HFC 134a or 1,1,1,2-Tetrafluoroethane</h2>
  <h3 class="text-xl text-gray-700 dark:text-gray-300 mb-2">INCI = Tetrafluoroethane</h3>
  <h3 class="text-xl text-gray-700 dark:text-gray-300 mb-4">Vapor Pressure at 70F = 96 PSIG <span class="mx-4"></span> Vapor Pressure at 130F = 180 PSIG</h3>
  <div class="prose dark:prose-invert max-w-none mb-6">
    <p class="mb-4">1,1,1,2-Tetrafluoroethane is an inert gas used primarily as a high-temperature refrigerant for domestic <span class="text-primary-600 dark:text-primary-400">refrigeration</span> and <span class="text-primary-600 dark:text-primary-400">automobile air conditioners</span>. These devices began using 1,1,1,2-tetrafluoroethane in the early 1990s as a replacement for the more environmentally harmful R-12.</p>
    <p class="mb-4">Other uses include plastic foam blowing, as a cleaning solvent, a propellant for the delivery of pharmaceuticals (e.g. <span class="text-primary-600 dark:text-primary-400">bronchodilators</span>), wine cork removers, gas dusters and in air driers for removing the moisture from <span class="text-primary-600 dark:text-primary-400">compressed air</span>.</p>
    <p class="mb-4">1,1,1,2-Tetrafluoroethane is also commonly used as a propellant for <span class="text-primary-600 dark:text-primary-400">air soft</span> air guns and as an emergency nonflammable signal and boat horns. With the new regulations coming soon, it will not be feasible to use 134a, due to its high Global warming Potential (GWP = 1300 x CO2) for casual use products, and its use may be limited to emergency signal devices.</p>
  </div>
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">HFO 1234ze or 1,3,3,3-Tetrafluoropropene</h2>
  <h3 class="text-xl text-gray-700 dark:text-gray-300 mb-2">INCI = Tetrafluoropropene</h3>
  <h3 class="text-xl text-gray-700 dark:text-gray-300 mb-4">Vapor Pressure at 70F = 46 PSIG</h3>
  <div class="prose dark:prose-invert max-w-none mb-6">
    <p class="mb-4">1,3,3,3-Tetrafluoropropene (HFO-1234ze) is a <span class="text-primary-600 dark:text-primary-400">hydrofluoroolefin</span>. It was developed as a "fourth generation" refrigerant to replace <span class="text-primary-600 dark:text-primary-400">R-134a</span> and as a blowing agent for foam and aerosol applications. The use of R-134a is being phased out because of its high <span class="text-primary-600 dark:text-primary-400">global-warming potential</span>.</p>
    <p class="mb-4">HFO-1234ez has zero ozone-depletion potential and a low global-warming potential (GWP = 6). Tetrafluoropropene is an exciting new, non-flammable propellant with a low vapor pressure that we use in cosmetic spray applications and mousse formulations. If you have a high end product where a nice misty delivery of a non-flammable end product is desired, then let's consider formulating with HFO 1234ze.</p>
  </div>
</div>`;

const defaultParagraph3 = `<div class="benefits-section">
  <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Benefits of Our Non-Flammable Propellants</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Non-Flammable</h3>
      <p class="text-gray-700 dark:text-gray-300">Our propellants are completely non-flammable, making them safe for various applications where fire hazards must be avoided.</p>
    </div>
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Non VOC</h3>
      <p class="text-gray-700 dark:text-gray-300">These propellants are not classified as volatile organic compounds, reducing environmental impact and regulatory concerns.</p>
    </div>
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2">No Ozone Depletion</h3>
      <p class="text-gray-700 dark:text-gray-300">Our propellants have zero ozone depletion potential, making them environmentally responsible choices.</p>
    </div>
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Low Global Warming Potential</h3>
      <p class="text-gray-700 dark:text-gray-300">With significantly lower GWP compared to traditional propellants, our products help reduce climate impact.</p>
    </div>
  </div>
</div>`;

const NonFlammablePropellantPage = () => {
  const { user } = useAuth();
  const [paragraph1, setParagraph1] = useState<string>('');
  const [paragraph2, setParagraph2] = useState<string>('');
  const [paragraph3, setParagraph3] = useState<string>('');
  const [editMode, setEditMode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const content = await fetchNonFlammablePropellantContent();
        
        if (content && content.trim()) {
          const paragraphs = splitContentIntoParagraphs(content);
          setParagraph1(paragraphs[0] || defaultParagraph1);
          setParagraph2(paragraphs[1] || defaultParagraph2);
          setParagraph3(paragraphs[2] || defaultParagraph3);
        } else {
          setParagraph1(defaultParagraph1);
          setParagraph2(defaultParagraph2);
          setParagraph3(defaultParagraph3);
        }
      } catch {
        setParagraph1(defaultParagraph1);
        setParagraph2(defaultParagraph2);
        setParagraph3(defaultParagraph3);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const splitContentIntoParagraphs = (content: string): string[] => {
    const cleaned = content.trim();
    
    // Split by benefits-section marker for the third section
    const benefitsMatch = cleaned.match(/<div class="benefits-section">[\s\S]*<\/div>$/);
    let benefitsSection = '';
    let remainingContent = cleaned;
    
    if (benefitsMatch) {
      benefitsSection = benefitsMatch[0];
      remainingContent = cleaned.replace(benefitsMatch[0], '').trim();
    }
    
    // Split the remaining content into first two sections
    const parts = remainingContent.split(/(<div class="border-t border-gray-200 dark:border-gray-700 pt-6">)/);
    
    let firstSection = '';
    let secondSection = '';
    
    if (parts.length >= 3) {
      firstSection = parts[0].trim();
      secondSection = (parts[1] + parts.slice(2).join('')).trim();
    } else {
      firstSection = remainingContent;
    }
    
    const result = [
      firstSection || defaultParagraph1,
      secondSection || defaultParagraph2,
      benefitsSection || defaultParagraph3
    ].filter(p => p.length > 0);
    
    return result;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const htmlContent = editorRef.current?.innerHTML || '';
      
      let updatedParagraph1 = paragraph1;
      let updatedParagraph2 = paragraph2;
      let updatedParagraph3 = paragraph3;
      
      if (editMode === 1) {
        updatedParagraph1 = htmlContent;
        setParagraph1(htmlContent);
      } else if (editMode === 2) {
        updatedParagraph2 = htmlContent;
        setParagraph2(htmlContent);
      } else if (editMode === 3) {
        updatedParagraph3 = htmlContent;
        setParagraph3(htmlContent);
      }
      
      const combinedContent = `${updatedParagraph1}\n\n${updatedParagraph2}\n\n${updatedParagraph3}`;
      
      await updateNonFlammablePropellantContent(combinedContent);
      
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
        let content = '';
        if (paragraphIndex === 1) content = paragraph1;
        else if (paragraphIndex === 2) content = paragraph2;
        else if (paragraphIndex === 3) content = paragraph3;
        
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

  const renderEditor = (sectionNumber: number, sectionTitle: string) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Editing {sectionTitle}
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
  );

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Static Title - Not Editable */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              NON FLAMMABLE PROPELLANTS
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
                {/* First Editable Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
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
                  
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Static Image - Not Editable */}
                    <div className="md:w-1/2">
                      <div className="relative h-80 w-full">
                        <Image 
                          src="/images/non_flammable_propellant.png" 
                          alt="Non-Flammable Propellant" 
                          fill
                          className="object-contain"
                          onError={(e) => {
                            // Fallback if image doesn't exist
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/400x300?text=Non-Flammable+Propellant";
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* First Editable Text Section */}
                    <div className="md:w-1/2">
                      {editMode === 1 ? (
                        renderEditor(1, "First Section")
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
                  {/* Enhanced Edit Button for Second Section */}
                  {user && editMode !== 2 && (
                    <div className="flex justify-end mb-4 mt-8">
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
                    renderEditor(2, "Second Section")
                  ) : (
                    /* Display Mode for Second Section */
                    <div
                      className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: paragraph2 }}
                    />
                  )}
                  
                  {/* Static Request Information Button - Not Editable */}
                  <div className="flex flex-wrap gap-4 justify-center mt-8">
                    <Link 
                      href="/contact-us?product=non_flammable_propellant" 
                      className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                    >
                      REQUEST INFORMATION
                    </Link>
                  </div>
                </div>

                {/* Third Editable Section - Benefits */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  {/* Enhanced Edit Button for Third Section */}
                  {user && editMode !== 3 && (
                    <div className="flex justify-end mb-4">
                      <button
                        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-primary-400"
                        onClick={() => startEdit(3)}
                        title="Edit benefits section content"
                      >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Benefits</span>
                      </button>
                    </div>
                  )}
                  
                  {editMode === 3 ? (
                    renderEditor(3, "Benefits Section")
                  ) : (
                    /* Display Mode for Third Section */
                    <div
                      className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: paragraph3 }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default NonFlammablePropellantPage;
