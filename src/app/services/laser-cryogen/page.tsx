'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { fetchLaserCryogenContent, updateLaserCryogenContent } from '../../../services/laserCryogenService';
import { fetchProducts } from '../../../services/productsService';
import { ProductType } from '@/types/product'; // Import the actual ProductType

// Define the Product interface to match your CartContext
interface Product {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
}

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
          <button 
            id="order-now-btn"
            type="button"
            class="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors cursor-pointer border-0"
            data-action="add-to-cart"
            onClick={() => handleAddToCart(laserCryogenProduct)}
          >
            ORDER NOW22
          </button>
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
          <h3 class="font-semibent text-gray-900 dark:text-white mb-2">Environmentally Friendly</h3>
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
  const { addToCart } = useCart();
  const [content, setContent] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [laserCryogenProduct, setLaserCryogenProduct] = useState<ProductType | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load content and product data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load page content
        const dbContent = await fetchLaserCryogenContent();
        const finalContent = dbContent && dbContent.trim() ? dbContent : defaultContent;
        setContent(finalContent);

        // Load products and find the laser cryogen product
        const products = await fetchProducts();
        const laserProduct = products.find(product => 
          product.title.toLowerCase().includes('laser cryogen') ||
          product.title.toLowerCase().includes('cylinder replacement') ||
          product.category === 'Medical Equipment'
        );
        
        if (laserProduct) {
          setLaserCryogenProduct(laserProduct);
          console.log('Found laser cryogen product:', laserProduct);
        } else {
          console.warn('Laser cryogen product not found in database');
          setError('Product not found in database.');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setContent(defaultContent);
        setError('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle add to cart - exactly like Products component
  const handleAddToCart = useCallback((product: ProductType) => {
    debugger;
    if (!product) return;

    // Convert ProductType to Product format for cart
    const cartProduct: Product = {
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image || '/placeholder-product.jpg', // Handle undefined image
    };

    addToCart(cartProduct);
    
    // Update the ORDER NOW button in the content
    updateOrderNowButton(true);

    // Reset the added state after 2 seconds (same as Products component)
    setTimeout(() => {
      updateOrderNowButton(false);
    }, 2000);
  }, [addToCart]);

  // Update the ORDER NOW button appearance
  const updateOrderNowButton = (isAdded: boolean) => {
    const button = document.getElementById('order-now-btn');
    if (button) {
      if (isAdded) {
        button.textContent = 'Added ✓';
        button.className = 'inline-block px-6 py-3 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 transition-colors cursor-pointer border-0';
      } else {
        button.textContent = 'ORDER NOW11';
        button.className = 'inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors cursor-pointer border-0';
      }
    }
  };

  // Handle ORDER NOW button click with event delegation
  useEffect(() => {
    const handleOrderNowClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is a link with the contact-us href for laser_cryogen
      if (target && 
          target.tagName === 'A' && 
          target.getAttribute('href') === '/contact-us?product=laser_cryogen') {
        e.preventDefault(); // Prevent navigation to contact page
        if (laserCryogenProduct) {
          handleAddToCart(laserCryogenProduct);
        }
      }
    };

    // Use event delegation on the document body
    document.addEventListener('click', handleOrderNowClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleOrderNowClick);
    };
  }, [laserCryogenProduct, handleAddToCart]);

    const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const htmlContent = editorRef.current?.innerHTML || '';
      await updateLaserCryogenContent(htmlContent);
      setContent(htmlContent);
      setEditMode(false);
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
        editorRef.current.innerHTML = content;
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
          {/* Enhanced Edit Button */}
          {user && !editMode && (
            <div className="flex justify-end mb-4">
              <button
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-primary-400"
                onClick={startEdit}
                title="Edit page content"
              >
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Page</span>
              </button>
            </div>
          )}

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
            /* WYSIWYG Editor */
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Editing Laser Cryogen Page
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
                    className="w-full min-h-96 p-4 border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg leading-relaxed prose dark:prose-invert max-w-none"
                    style={{ 
                      minHeight: '600px',
                      maxHeight: '800px',
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
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 min-h-96">
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
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 dark:hover:from-gray-500 dark:hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
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
            /* Display Mode */
            <div>
              {/* Main Content */}
              <div
                ref={contentRef}
                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
              />
              
       
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LaserCryogenPage;
