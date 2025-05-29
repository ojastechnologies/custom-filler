'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const NonFlammablePropellantPage = () => {
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              NON FLAMMABLE PROPELLANTS
            </h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ENVIRONMENTALLY FRIENDLY PROPELLANTS
                </h2>
                <p className="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-2">
                  HFC134a & HFO1234ze
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                <div className="md:w-1/2">
                  <div className="relative h-80 w-full">
                    <Image 
                      src="/images/non_flammable_propellant.png" 
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
                
                <div className="md:w-1/2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Premium Non-Flammable Propellants
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    We fill exclusively with HFC134a and HFO1234ze, a new, low GWP, non VOC propellant. These propellants are ideal for high-end products requiring safe, environmentally friendly delivery systems.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our non-flammable propellants are perfect for applications where safety is paramount and environmental impact needs to be minimized.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  HFC 134a or 1,1,1,2-Tetrafluoroethane
                </h2>
                <h3 className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                  INCI = Tetrafluoroethane
                </h3>
                <h3 className="text-xl text-gray-700 dark:text-gray-300 mb-4">
                  Vapor Pressure at 70F = 96 PSIG <span className="mx-4"></span> Vapor Pressure at 130F = 180 PSIG
                </h3>
                
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="mb-4">
                    1,1,1,2-Tetrafluoroethane is an inert gas used primarily as a high-temperature refrigerant for domestic 
                    <span className="text-primary-600 dark:text-primary-400"> refrigeration</span> and 
                    <span className="text-primary-600 dark:text-primary-400"> automobile air conditioners</span>. These devices
                    began using 1,1,1,2-tetrafluoroethane in the early 1990s as a replacement for the more
                    environmentally harmful R-12.
                  </p>
                  <p className="mb-4">
                    Other uses include plastic foam blowing, as a cleaning solvent, a propellant for the delivery of pharmaceuticals (e.g. 
                    <span className="text-primary-600 dark:text-primary-400"> bronchodilators</span>), wine cork
                    removers, gas dusters and in air driers for removing the moisture from 
                    <span className="text-primary-600 dark:text-primary-400"> compressed air</span>.
                  </p>
                  <p className="mb-4">
                    1,1,1,2-Tetrafluoroethane is also commonly used as a propellant for 
                    <span className="text-primary-600 dark:text-primary-400"> air soft</span> air guns
                    and as an emergency nonflammable signal and boat horns. With the new regulations
                    coming soon, it will not be feasible to use 134a, due to its high Global warming Potential
                    (GWP = 1300 x CO2) for casual use products, and its use may be limited to emergency
                    signal devices.
                  </p>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  HFO 1234ze or 1,3,3,3-Tetrafluoropropene
                </h2>
                <h3 className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                  INCI = Tetrafluoropropene
                </h3>
                <h3 className="text-xl text-gray-700 dark:text-gray-300 mb-4">
                  Vapor Pressure at 70F = 46 PSIG
                </h3>
                
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="mb-4">
                    1,3,3,3-Tetrafluoropropene (HFO-1234ze) is a 
                    <span className="text-primary-600 dark:text-primary-400"> hydrofluoroolefin</span>. It was developed as
                    a &quot;fourth generation&quot; refrigerant to replace 
                    <span className="text-primary-600 dark:text-primary-400"> R-134a </span> and as a blowing agent for foam and
                    aerosol applications. The use of R-134a is being phased out because of its high 
                    <span className="text-primary-600 dark:text-primary-400"> global-warming potential</span>.
                  </p>
                  <p className="mb-4">
                    HFO-1234ez has zero ozone-depletion potential and a low global-warming potential (GWP = 6). Tetrafluoropropene is an exciting new, non-flammable
                    propellant with a low vapor pressure that we use in cosmetic spray applications and
                    mousse formulations. If you have a high end product where a nice misty delivery of a
                    non-flammable end product is desired, then let&apos;s consider formulating with HFO 1234ze.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center mt-8">
                  <Link 
                    href="/contact-us?product=non_flammable_propellant" 
                    className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                  >
                    REQUEST INFORMATION
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Benefits of Our Non-Flammable Propellants
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Non-Flammable</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our propellants are completely non-flammable, making them safe for various applications where fire hazards must be avoided.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Non VOC</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    These propellants are not classified as volatile organic compounds, reducing environmental impact and regulatory concerns.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Ozone Depletion</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our propellants have zero ozone depletion potential, making them environmentally responsible choices.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Low Global Warming Potential</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    With significantly lower GWP compared to traditional propellants, our products help reduce climate impact.
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

export default NonFlammablePropellantPage;