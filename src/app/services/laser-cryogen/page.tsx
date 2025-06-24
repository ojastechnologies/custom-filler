'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { CartItem, useCart } from '@/context/CartContext';
import { fetchLaserCryogenContent, updateLaserCryogenContent } from '../../../services/laserCryogenService';
import { fetchProducts } from '../../../services/productsService';
import { ProductType } from '@/types/product';

// Default content for the two editable sections
const defaultParagraph1 = `<div class="text-center mb-6">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    LASER CRYOGEN CYLINDER REPLACEMENT
  </h2>
  <p class="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-2">
    1000 GRAMS
  </p>
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
</div>`;

const defaultParagraph2 = `<p class="text-gray-700 dark:text-gray-300 mb-4">
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
</div>`;

const LaserCryogenPage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [paragraph1, setParagraph1] = useState<string>('');
  const [paragraph2, setParagraph2] = useState<string>('');
  const [editMode, setEditMode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [laserCryogenProduct, setLaserCryogenProduct] = useState<ProductType | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load content and product data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null); // Clear any previous errors
      try {
        // Load page content
        const dbContent = await fetchLaserCryogenContent();
        
        if (dbContent && dbContent.trim()) {
          const paragraphs = splitContentIntoParagraphs(dbContent);
          setParagraph1(paragraphs[0] || defaultParagraph1);
          setParagraph2(paragraphs[1] || defaultParagraph2);
        } else {
          setParagraph1(defaultParagraph1);
          setParagraph2(defaultParagraph2);
        }

        // Load products and find the laser cryogen product
        const products = await fetchProducts();
        const laserProduct = products.find(product => 
          product.clientpathurl === 'services/laser-cryogen'
        );
        
        if (laserProduct) {
          setLaserCryogenProduct(laserProduct);
          console.log('✅ Found laser cryogen product:', laserProduct);
        } else {
          console.warn('⚠️ Laser cryogen product not found in database');
          setLaserCryogenProduct(null);
          // Don't set error here - just log the warning
        }
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setParagraph1(defaultParagraph1);
        setParagraph2(defaultParagraph2);
        
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const splitContentIntoParagraphs = (content: string): string[] => {
    const cleaned = content.trim();
    // Split by section breaks - look for major content divisions
    const parts = cleaned.split(/(<\/div>\s*<p|<\/ul>\s*<h2)/gi);
    
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.match(/^(<\/div>\s*<p|<\/ul>\s*<h2)$/gi)) {
        if (currentParagraph) {
          paragraphs.push(currentParagraph);
          currentParagraph = '';
        }
      } else {
        currentParagraph += part;
      }
    }
    
    if (currentParagraph) {
      paragraphs.push(currentParagraph);
    }
    
    // If we don't have 2 paragraphs, split differently or use defaults
    if (paragraphs.length < 2) {
      return [defaultParagraph1, defaultParagraph2];
    }
    
    return paragraphs.filter(p => p.trim().length > 0);
  };

  // Handle add to cart
  const handleAddToCart = useCallback((product: ProductType) => {
    if (!product) return;

    const cartProduct: CartItem = {
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image || '/images/laser_cryogen.png',
      description: product.description,
      clientpathurl: product.about_url,
      deal_id: product.deal_id,
      deal: product.deal,
      quantity: 1
    };

    addToCart(cartProduct);
    setAddedToCart(true);

    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  }, [addToCart]);

  // Get the product image with fallback
  const getProductImage = () => {
    if (!laserCryogenProduct) {
      return '/images/laser_cryogen.png';
    }
    
    if (imageError || !laserCryogenProduct.image) {
      return '/images/laser_cryogen.png';
    }
    
    return laserCryogenProduct.image;
  };

  const handleImageError = () => {
    console.log('🖼️ Image failed to load, using placeholder');
    setImageError(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const htmlContent = editorRef.current?.innerHTML || '';
      
      let updatedParagraph1 = paragraph1;
      let updatedParagraph2 = paragraph2;
      
      if (editMode === 1) {
        updatedParagraph1 = htmlContent;
        setParagraph1(htmlContent);
      } else if (editMode === 2) {
        updatedParagraph2 = htmlContent;
        setParagraph2(htmlContent);
      }
      
      const combinedContent = `${updatedParagraph1}\n\n${updatedParagraph2}`;
      await updateLaserCryogenContent(combinedContent);
      
      setEditMode(null);
      setPreviewMode(false);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

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
    
    setTimeout(() => {
      if (editorRef.current) {
        let content = '';
        if (paragraphIndex === 1) content = paragraph1;
        else if (paragraphIndex === 2) content = paragraph2;
        
        editorRef.current.innerHTML = content;
        editorRef.current.focus();
      }
    }, 100);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setPreviewMode(false);
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

      {!previewMode && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => formatText('bold')} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-500">B</button>
            <button onClick={() => formatText('italic')} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm italic hover:bg-gray-100 dark:hover:bg-gray-500">I</button>
            <button onClick={() => formatText('underline')} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm underline hover:bg-gray-100 dark:hover:bg-gray-500">U</button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-500"></div>
            <button onClick={() => insertHeading(2)} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-500">H2</button>
            <button onClick={() => insertHeading(3)} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-500">H3</button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-500"></div>
            <button onClick={() => insertList(false)} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-500">• List</button>
            <button onClick={() => insertList(true)} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-500">1. List</button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-500"></div>
            <button onClick={() => formatText('justifyLeft')} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-500">←</button>
            <button onClick={() => formatText('justifyCenter')} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-500">↔</button>
            <button onClick={() => formatText('justifyRight')} className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-500">→</button>
          </div>
        </div>
      )}

      <div className="border border-gray-300 dark:border-gray-600 rounded-lg min-h-[300px] bg-white dark:bg-gray-900">
        {previewMode ? (
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '' }} />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            className="p-4 min-h-[280px] outline-none prose prose-sm max-w-none dark:prose-invert"
            style={{ whiteSpace: 'pre-wrap' }}
          />
        )}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={cancelEdit}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Product Not Found Warning */}
          {!laserCryogenProduct && !loading && (
            <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Product not found in database. Order functionality is disabled.
              </div>
            </div>
          )}

          {/* Admin Controls */}
          {user?.role === 'admin' && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Admin Controls - Laser Cryogen Page
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => startEdit(1)}
                  disabled={editMode !== null}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Edit Section 1 (Header & Description)
                </button>
                <button
                  onClick={() => startEdit(2)}
                  disabled={editMode !== null}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Edit Section 2 (Features & Benefits)
                </button>
              </div>
              {editMode && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  Currently editing section {editMode}. Save or cancel to edit other sections.
                </p>
              )}
            </div>
          )}

          {/* Editor Interface */}
          {editMode && user?.role === 'admin' && (
            <div className="mb-8">
              {renderEditor(editMode, editMode === 1 ? 'Header & Description' : 'Features & Benefits')}
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {/* Manufacturer Section with Side-by-Side Layout */}
            <div className="mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Side - Editable Content */}
                <div className="space-y-6">
                  <div 
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: `
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          We Are The Manufacturer - Buy Directly From Us
                        </h2>
                        <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                          We manufacture the 1000 gram cylinder containing High Purity Grade 1,1,1,3-Tetrafluoropropene, 
                          the next generation of safe, non-flammable, non-toxic, non-ozone depleting and non-global warming 
                          potential (Low GWP) fluorocarbon gas approved for medical devices.
                        </p>
                        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                          We tested in Laser Surgical equipment and it works perfectly. Our CGA 600 cylinder is a perfect 
                          retrofit into all laser equipment including Candela.
                        </p>
                      `
                    }}
                  />
                </div>

                {/* Right Side - Product Image */}
                <div className="relative">
                  <div className="sticky top-8">
                    <div className="relative overflow-hidden rounded-xl shadow-2xl bg-white dark:bg-gray-800 p-4">
                      <Image
                        src="/images/laser_cryogen.png"
                        alt="Laser Cryogen Product - 1000 gram cylinder containing High Purity Grade 1,1,1,3-Tetrafluoropropene"
                        width={400}
                        height={300}
                        className="w-full h-auto rounded-lg object-cover"
                        style={{ maxHeight: '300px' }}
                        priority
                      />
                      
                      {/* Product Info Overlay */}
                      {/* <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-t from-black/80 to-transparent text-white p-3 rounded-lg">
                        <p className="text-sm font-semibold">1000g Cylinder</p>
                        <p className="text-xs opacity-90">CGA 600 Compatible</p>
                      </div> */}
                      
                 
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* MSDS Download and ORDER NOW Buttons - NOT EDITABLE */}
            <div className="mb-8 text-center">
              <a
                href="/msds.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors mr-4"
              >
                Download MSDS
              </a>
              
              {/* ORDER NOW Button - Enable/Disable based on product availability */}
              <button
                onClick={() => laserCryogenProduct && handleAddToCart(laserCryogenProduct)}
                disabled={!laserCryogenProduct || addedToCart}
                className={`inline-block px-6 py-3 font-medium rounded-md transition-colors ${
                  !laserCryogenProduct
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
                title={!laserCryogenProduct ? 'Product not available in database' : ''}
              >
                {!laserCryogenProduct 
                  ? 'Product Not Available' 
                  : addedToCart 
                  ? 'Added ✓' 
                  : 'ORDER NOW'
                }
              </button>
            </div>

            {/* Section 2 - Editable */}
            <div className={`${editMode === 2 ? 'ring-2 ring-blue-500 ring-opacity-50 rounded-lg p-4' : ''}`}>
              <div dangerouslySetInnerHTML={{ __html: paragraph2 }} />
            </div>
          </div>

          {/* Product Information - Only show if product exists */}
          {laserCryogenProduct && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {laserCryogenProduct.title}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {laserCryogenProduct.description}
                  </p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ${laserCryogenProduct.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="relative w-full max-w-sm">
                    <Image
                      src={getProductImage()}
                      alt={laserCryogenProduct.title}
                      width={300}
                      height={200}
                      className="w-full h-auto rounded-lg shadow-md object-cover"
                      style={{ maxHeight: '200px' }}
                      onError={handleImageError}
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show placeholder image section when no product */}
          {!laserCryogenProduct && !loading && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Laser Cryogen Product
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Laser Cryogen Cylinder Replacement
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    1000 gram cylinder containing High Purity Grade 1,1,1,3-Tetrafluoropropene
                  </p>
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    Price not available
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="relative w-full max-w-sm">
                    <Image
                      src="/images/laser_cryogen.png"
                      alt="Laser Cryogen Product"
                      width={300}
                      height={200}
                      className="w-full h-auto rounded-lg shadow-md object-cover"
                      style={{ maxHeight: '200px' }}
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LaserCryogenPage;
