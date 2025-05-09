import React from 'react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
export default function AboutUs() {
  return (
    <>
      <Header />
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="bg-gray-100 dark:bg-gray-800 py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-8">
              About Us
            </h1>
          </div>
        </section>

        {/* What We Do Section - First Description with Left Image */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              What Do We Do?
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
              {/* Left Image */}
              <div className="w-full md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden">
                <Image 
                  src="/images/about1.jpg"
                  alt="Aerosol Filling Facility"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Right Text */}
              <div className="w-full md:w-1/2">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  Aero Tech Labs is a small, dedicated, and ambitious aerosol custom filling facility located in South Florida. 
                  Strategically located in the Southern U.S., we can be an important link to produce aerosol products in that region. 
                  Our forte is the filling of HFC 134a, a non-flammable propellant which is used in "ozone safe" refrigerant systems, 
                  when there is an imperative need for non-flammable necessary end use products are a requisite, we use HFC 134a. 
                  If you need a different non-flammable propellant with a low global warming potential (GWP), then let us suggest 
                  HFO 1234ze. This new propellant is an exciting addition especially to high end cosmetic formulations where 
                  flammability may be considered a high liability.
                </p>
              </div>
            </div>
            
            {/* Second Description with Right Image */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              {/* Right Image */}
              <div className="w-full md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden">
                <Image 
                  src="/images/about2.png"
                  alt="Aerosol Products"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Left Text */}
              <div className="w-full md:w-1/2">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  Aero Tech Labs will fill your 20 mm cans, too. We do small openings in a big way and fill nearly 1 million 
                  of these per year. We also fill refrigerant cans for the automotive industry, laser coolant for surgical needs, 
                  emergency signal devices, and non-flammable dusters for sensitive electronics. We have also added new machinery 
                  to fill the Bag in a Can or what is now called the Bag On Valve (BOV) spray systems in 20mm aerosol cans. 
                  This system will allow you to formulate your product and go straight into an aerosol system without having to 
                  be mixed with other chemicals or propellants. The BOV non-aerosol system is perfect for Topical Pharmaceutical, 
                  Skin Care, Cosmetic, Sunscreen, and other high end products of a similar nature.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
