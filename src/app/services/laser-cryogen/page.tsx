'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const LaserCryogenPage = () => {
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              ENVIROLASE LASER CRYOGEN COOLANT
            </h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  LASER CRYOGEN CYLINDER REPLACEMENT
                </h2>
                <p className="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-2">
                  1000 GRAMS
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                <div className="w-full md:w-1/2">
                  {/* Modified image container for better mobile display */}
                  <div className="relative w-full aspect-square md:aspect-auto md:h-80">
                    <Image 
                      src="/images/laser_cryogen.png" 
                      alt="Laser Cryogen Cylinder" 
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // Fallback if image doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/400x300?text=Laser+Cryogen+Cylinder";
                      }}
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    We Are The Manufacturer - Buy Directly From Us
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    We manufacture the 1000 gram cylinder containing High Purity Grade 1,1,1,3-Tetrafluoropropene, the next generation of safe, non-flammable, non-toxic, non-ozone depleting and non-global warming potential (Low GWP) fluorocarbon gas approved for medical devices.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    We tested in Laser Surgical equipment and it works perfectly. Our CGA 600 cylinder is a perfect retrofit into all laser equipment including Candela.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  This Cryogen is sourced from Honeywell USA and is made in America and not from Chinese imports. Our filling process utilizes a double filtered, dedicated line for cryogen products to ensure maximum purity and never any impurities.
                </p>
                
                <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                  <li>Continuous and Uninterrupted Supply of Cryogen</li>
                  <li>100% Satisfaction, Money Back Guarantee!</li>
                  <li>Sold Only In a Case of 12 x 1000 Grams</li>
                  <li>Shipped Ground UPS or FEDEX, USA Only.</li>
                  <li>Bulk Pricing Available.</li>
                  <li>International Shipments: Have Your Shipping Broker Contact Us To Arrange A Pick Up</li>
                </ul>
                
                <div className="flex flex-wrap gap-4 justify-center mt-8">
                  <a 
                    href="/msds.pdf" 
                    target="_blank" 
                    className="inline-block px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    MSDS Download
                  </a>
                  
                  <Link 
                    href="/contact-us?product=laser_cryogen" 
                    className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                  >
                    ORDER NOW
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose Our Laser Cryogen?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Superior Quality</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our cryogen is manufactured to the highest standards, ensuring consistent performance for your laser equipment.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Made in USA</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Sourced from Honeywell USA, our product is made in America with strict quality control.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Environmentally Friendly</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Non-ozone depleting and low global warming potential make our cryogen an environmentally responsible choice.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Reliable Supply</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We maintain continuous and uninterrupted supply to ensure your operations run smoothly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LaserCryogenPage;